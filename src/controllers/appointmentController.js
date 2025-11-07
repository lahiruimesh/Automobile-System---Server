import {
  getAvailableSlots,
  createAppointment,
  cancelAppointment,
  getUserAppointments,
  getUpcomingAppointments,
  updateAppointmentStatus,
} from "../services/bookingService.js";
import pool from "../config/db.js";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  getSlotsSchema,
  updateStatusSchema,
  createVehicleSchema,
} from "../validators/appointmentValidator.js";

/**
 * Get available time slots for a specific date
 * GET /api/appointments/slots?date=YYYY-MM-DD&service_type=oil_change
 */
export const getSlots = async (req, res) => {
  try {
    // Validate query parameters
    const { error } = getSlotsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const { date, service_type } = req.query;
    const slots = await getAvailableSlots(date, service_type);

    res.json({
      success: true,
      date,
      slots,
      count: slots.length,
    });
  } catch (error) {
    console.error("Error in getSlots:", error);
    res.status(500).json({
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

/**
 * Create a new appointment
 * POST /api/appointments
 */
export const bookAppointment = async (req, res) => {
  try {
    // Validate request body
    const { error } = createAppointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const appointment = await createAppointment(req.body, userId);

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("slotUpdate", {
        action: "booked",
        slotId: appointment.slot_id,
        date: appointment.date,
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error in bookAppointment:", error);

    // Handle specific errors
    if (error.message.includes("no longer available")) {
      return res.status(409).json({
        message: error.message,
        error: "SLOT_CONFLICT",
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("past")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Error booking appointment",
      error: error.message,
    });
  }
};

/**
 * Get user's appointments
 * GET /api/appointments?status=confirmed
 */
export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const appointments = await getUserAppointments(userId, status);

    res.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error in getMyAppointments:", error);
    res.status(500).json({
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

/**
 * Cancel an appointment
 * PATCH /api/appointments/:id/cancel
 */
export const cancelUserAppointment = async (req, res) => {
  try {
    // Validate request body
    const { error } = cancelAppointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const result = await cancelAppointment(id, userId, reason);

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("slotUpdate", {
        action: "cancelled",
        appointmentId: id,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in cancelUserAppointment:", error);

    if (error.message.includes("not found") || error.message.includes("permission")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("already cancelled") || error.message.includes("completed")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Error cancelling appointment",
      error: error.message,
    });
  }
};

/**
 * Get upcoming appointments (for employees)
 * GET /api/appointments/upcoming
 */
export const getUpcoming = async (req, res) => {
  try {
    const appointments = await getUpcomingAppointments();

    res.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error in getUpcoming:", error);
    res.status(500).json({
      message: "Error fetching upcoming appointments",
      error: error.message,
    });
  }
};

/**
 * Update appointment status (for employees/admins)
 * PATCH /api/appointments/:id/status
 */
export const updateStatus = async (req, res) => {
  try {
    // Validate request body
    const { error } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const { id } = req.params;
    const { status, completionNotes } = req.body;

    const appointment = await updateAppointmentStatus(id, status, completionNotes);

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit("appointmentUpdate", {
        action: "statusChanged",
        appointmentId: id,
        status,
      });
    }

    res.json({
      success: true,
      message: "Appointment status updated",
      appointment,
    });
  } catch (error) {
    console.error("Error in updateStatus:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Error updating appointment status",
      error: error.message,
    });
  }
};

/**
 * Get user's vehicles
 * GET /api/vehicles
 */
export const getMyVehicles = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM vehicles 
       WHERE customer_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      vehicles: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error in getMyVehicles:", error);
    res.status(500).json({
      message: "Error fetching vehicles",
      error: error.message,
    });
  }
};

/**
 * Add a new vehicle
 * POST /api/vehicles
 */
export const addVehicle = async (req, res) => {
  try {
    // Validate request body
    const { error } = createVehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const userId = req.user.id;
    const { make, model, year, vin, license_plate, color } = req.body;

    const result = await pool.query(
      `INSERT INTO vehicles 
       (customer_id, make, model, year, vin, license_plate, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, make, model, year, vin || null, license_plate || null, color || null]
    );

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Error in addVehicle:", error);

    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(409).json({
        message: "A vehicle with this VIN already exists",
      });
    }

    res.status(500).json({
      message: "Error adding vehicle",
      error: error.message,
    });
  }
};

/**
 * Delete a vehicle
 * DELETE /api/vehicles/:id
 */
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if vehicle has appointments
    const apptCheck = await pool.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE vehicle_id = $1 AND status IN ('pending', 'confirmed', 'in_progress')`,
      [id]
    );

    if (parseInt(apptCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete vehicle with active appointments",
      });
    }

    const result = await pool.query(
      `DELETE FROM vehicles 
       WHERE id = $1 AND customer_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteVehicle:", error);
    res.status(500).json({
      message: "Error deleting vehicle",
      error: error.message,
    });
  }
};
