import pool from "../config/db.js";
import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
} from "./emailService.js";

/**
 * Booking Service - Handles appointment booking business logic
 * Includes transactions, slot management, and notifications
 */

/**
 * Get available time slots for a specific date and service type
 */
export const getAvailableSlots = async (date, serviceType) => {
  try {
    // Get current date/time to filter past slots
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    const query = `
      SELECT 
        ts.id,
        ts.date,
        ts.start_time,
        ts.end_time,
        ts.is_available
      FROM time_slots ts
      WHERE ts.date = $1
        AND ts.is_available = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.slot_id = ts.id
          AND a.status IN ('pending', 'confirmed', 'in_progress')
        )
        AND (
          ts.date > $2 
          OR (ts.date = $2 AND ts.start_time > $3)
        )
      ORDER BY ts.start_time ASC
    `;

    const result = await pool.query(query, [date, today, currentTime]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw error;
  }
};

/**
 * Create a new appointment with transaction support
 */
export const createAppointment = async (appointmentData, userId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { vehicle_id, slot_id, service_type, notes } = appointmentData;

    // 1. Check if slot is still available
    const slotCheck = await client.query(
      `SELECT id, is_available, date, start_time, end_time 
       FROM time_slots 
       WHERE id = $1 FOR UPDATE`,
      [slot_id]
    );

    if (slotCheck.rows.length === 0) {
      throw new Error("Time slot not found");
    }

    if (!slotCheck.rows[0].is_available) {
      throw new Error("Time slot is no longer available");
    }

    // Check if slot is in the past
    const slotDate = new Date(slotCheck.rows[0].date);
    const now = new Date();
    if (slotDate < now) {
      throw new Error("Cannot book appointments in the past");
    }

    // 2. Check if there's already an appointment for this slot
    const existingAppt = await client.query(
      `SELECT id FROM appointments 
       WHERE slot_id = $1 
       AND status IN ('pending', 'confirmed', 'in_progress')`,
      [slot_id]
    );

    if (existingAppt.rows.length > 0) {
      throw new Error("This time slot is already booked");
    }

    // 3. Verify vehicle belongs to user
    const vehicleCheck = await client.query(
      `SELECT id, make, model FROM vehicles 
       WHERE id = $1 AND customer_id = $2`,
      [vehicle_id, userId]
    );

    if (vehicleCheck.rows.length === 0) {
      throw new Error("Vehicle not found or does not belong to user");
    }

    // 4. Create the appointment
    const appointmentResult = await client.query(
      `INSERT INTO appointments 
       (customer_id, vehicle_id, slot_id, service_type, status, notes) 
       VALUES ($1, $2, $3, $4, 'confirmed', $5) 
       RETURNING *`,
      [userId, vehicle_id, slot_id, service_type, notes || null]
    );

    const appointment = appointmentResult.rows[0];

    // 5. Mark slot as unavailable
    await client.query(
      `UPDATE time_slots 
       SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [slot_id]
    );

    // 6. Update confirmed_at timestamp
    await client.query(
      `UPDATE appointments 
       SET confirmed_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [appointment.id]
    );

    await client.query("COMMIT");

    // 7. Get full appointment details for email
    const fullDetails = await pool.query(
      `SELECT 
        a.*,
        u.email as customer_email,
        u.full_name as customer_name,
        v.make as vehicle_make,
        v.model as vehicle_model,
        ts.date,
        ts.start_time,
        ts.end_time
       FROM appointments a
       JOIN users u ON a.customer_id = u.id
       JOIN vehicles v ON a.vehicle_id = v.id
       JOIN time_slots ts ON a.slot_id = ts.id
       WHERE a.id = $1`,
      [appointment.id]
    );

    const details = fullDetails.rows[0];

    // 8. Send confirmation email (non-blocking)
    sendAppointmentConfirmation({
      customerEmail: details.customer_email,
      customerName: details.customer_name,
      appointmentId: details.id,
      date: new Date(details.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      startTime: details.start_time.substring(0, 5),
      endTime: details.end_time.substring(0, 5),
      serviceType: details.service_type,
      vehicleMake: details.vehicle_make,
      vehicleModel: details.vehicle_model,
    }).catch((err) => console.error("Email error:", err));

    return details;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating appointment:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancel an appointment and reopen the slot
 */
export const cancelAppointment = async (appointmentId, userId, reason) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get appointment details and verify ownership
    const apptResult = await client.query(
      `SELECT 
        a.*,
        u.email as customer_email,
        u.full_name as customer_name,
        ts.date,
        ts.start_time
       FROM appointments a
       JOIN users u ON a.customer_id = u.id
       JOIN time_slots ts ON a.slot_id = ts.id
       WHERE a.id = $1 AND a.customer_id = $2 FOR UPDATE`,
      [appointmentId, userId]
    );

    if (apptResult.rows.length === 0) {
      throw new Error("Appointment not found or you don't have permission to cancel it");
    }

    const appointment = apptResult.rows[0];

    if (appointment.status === "cancelled") {
      throw new Error("Appointment is already cancelled");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot cancel a completed appointment");
    }

    // 2. Update appointment status
    await client.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancellation_reason = $1, 
           cancelled_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [reason, appointmentId]
    );

    // 3. Reopen the time slot
    await client.query(
      `UPDATE time_slots 
       SET is_available = TRUE 
       WHERE id = $1`,
      [appointment.slot_id]
    );

    await client.query("COMMIT");

    // 4. Send cancellation email (non-blocking)
    sendAppointmentCancellation({
      customerEmail: appointment.customer_email,
      customerName: appointment.customer_name,
      appointmentId: appointment.id,
      date: new Date(appointment.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      startTime: appointment.start_time.substring(0, 5),
      serviceType: appointment.service_type,
      cancellationReason: reason,
    }).catch((err) => console.error("Email error:", err));

    return { success: true, message: "Appointment cancelled successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cancelling appointment:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get user's appointments
 */
export const getUserAppointments = async (userId, status = null) => {
  try {
    let query = `
      SELECT 
        a.*,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        v.license_plate,
        ts.date,
        ts.start_time,
        ts.end_time
      FROM appointments a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE a.customer_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND a.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY ts.date DESC, ts.start_time DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw error;
  }
};

/**
 * Get upcoming appointments (for employees)
 * If employeeId is provided, only returns appointments assigned to that employee
 */
export const getUpcomingAppointments = async (employeeId = null) => {
  try {
    let query = `
      SELECT 
        a.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        v.license_plate,
        ts.date,
        ts.start_time,
        ts.end_time,
        emp.full_name as assigned_employee_name
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN time_slots ts ON a.slot_id = ts.id
      LEFT JOIN users emp ON a.assigned_employee_id = emp.id
      WHERE a.status IN ('pending', 'confirmed', 'in_progress')
        AND ts.date >= CURRENT_DATE
    `;

    const params = [];
    
    // If employeeId is provided, filter for that employee's assignments
    if (employeeId) {
      query += ` AND a.assigned_employee_id = $1`;
      params.push(employeeId);
    }

    query += ` ORDER BY ts.date ASC, ts.start_time ASC LIMIT 50`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    throw error;
  }
};

/**
 * Update appointment status (for employees/admins)
 */
export const updateAppointmentStatus = async (appointmentId, status, completionNotes = null) => {
  try {
    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    // Build the update query dynamically
    let updateFields = ["status = $1", "updated_at = CURRENT_TIMESTAMP"];
    let params = [status];
    let paramIndex = 2;

    if (status === "completed") {
      updateFields.push("completed_at = CURRENT_TIMESTAMP");
      
      // Add completion notes if provided
      if (completionNotes) {
        updateFields.push(`completion_notes = $${paramIndex}`);
        params.push(completionNotes);
        paramIndex++;
      }
    }

    // Add appointmentId as last parameter
    params.push(appointmentId);

    const query = `
      UPDATE appointments 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw new Error("Appointment not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};
