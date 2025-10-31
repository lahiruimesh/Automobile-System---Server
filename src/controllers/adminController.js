import pool from "../config/db.js";

// Get pending employees
export const getPendingEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

// Approve employee
export const approveEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE users SET is_active = true WHERE id = $1", [id]);
    res.json({ message: "Employee approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving employee" });
  }
};

// Request appointment modification (Customer)
export const requestAppointmentModification = async (req, res) => {
  const { appointmentId } = req.params;
  const { newSlotId, reason } = req.body;
  const customerId = req.user.id;

  try {
    // Verify appointment belongs to customer and is confirmed
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointments WHERE id = $1 AND customer_id = $2 AND status = 'confirmed'",
      [appointmentId, customerId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ 
        message: "Appointment not found or cannot be modified" 
      });
    }

    // Verify new slot is available
    const slotCheck = await pool.query(
      "SELECT * FROM time_slots WHERE id = $1 AND is_available = true",
      [newSlotId]
    );

    if (slotCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: "Selected time slot is not available" 
      });
    }

    // Create modification request
    const result = await pool.query(
      `INSERT INTO appointment_modifications 
       (appointment_id, customer_id, old_slot_id, new_slot_id, reason, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING *`,
      [
        appointmentId,
        customerId,
        appointmentCheck.rows[0].slot_id,
        newSlotId,
        reason
      ]
    );

    res.status(201).json({
      message: "Modification request submitted successfully",
      modification: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting modification request" });
  }
};

// Get modification requests (Employee/Admin)
export const getModificationRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        am.*,
        a.vehicle_id,
        u.full_name as customer_name,
        u.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        old_slot.date as old_date,
        old_slot.start_time as old_start_time,
        old_slot.end_time as old_end_time,
        new_slot.date as new_date,
        new_slot.start_time as new_start_time,
        new_slot.end_time as new_end_time
       FROM appointment_modifications am
       JOIN appointments a ON am.appointment_id = a.id
       JOIN users u ON am.customer_id = u.id
       JOIN vehicles v ON a.vehicle_id = v.id
       JOIN time_slots old_slot ON am.old_slot_id = old_slot.id
       JOIN time_slots new_slot ON am.new_slot_id = new_slot.id
       WHERE am.status = 'pending'
       ORDER BY am.created_at DESC`
    );

    res.json({ modifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching modification requests" });
  }
};

// Approve modification request (Employee/Admin)
export const approveModificationRequest = async (req, res) => {
  const { modificationId } = req.params;

  try {
    // Get modification details
    const modResult = await pool.query(
      "SELECT * FROM appointment_modifications WHERE id = $1 AND status = 'pending'",
      [modificationId]
    );

    if (modResult.rows.length === 0) {
      return res.status(404).json({ 
        message: "Modification request not found or already processed" 
      });
    }

    const modification = modResult.rows[0];

    // Start transaction
    await pool.query("BEGIN");

    // Update old slot to available
    await pool.query(
      "UPDATE time_slots SET is_available = true WHERE id = $1",
      [modification.old_slot_id]
    );

    // Update new slot to unavailable
    await pool.query(
      "UPDATE time_slots SET is_available = false WHERE id = $1",
      [modification.new_slot_id]
    );

    // Update appointment with new slot
    await pool.query(
      "UPDATE appointments SET slot_id = $1 WHERE id = $2",
      [modification.new_slot_id, modification.appointment_id]
    );

    // Update modification status
    await pool.query(
      "UPDATE appointment_modifications SET status = 'approved', processed_at = NOW() WHERE id = $1",
      [modificationId]
    );

    await pool.query("COMMIT");

    res.json({ message: "Modification request approved successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error approving modification request" });
  }
};

// Reject modification request (Employee/Admin)
export const rejectModificationRequest = async (req, res) => {
  const { modificationId } = req.params;
  const { rejectionReason } = req.body;

  try {
    const result = await pool.query(
      `UPDATE appointment_modifications 
       SET status = 'rejected', 
           rejection_reason = $1, 
           processed_at = NOW() 
       WHERE id = $2 AND status = 'pending' 
       RETURNING *`,
      [rejectionReason, modificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "Modification request not found or already processed" 
      });
    }

    res.json({ 
      message: "Modification request rejected", 
      modification: result.rows[0] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error rejecting modification request" });
  }
};

// Get customer's modification requests
export const getMyModificationRequests = async (req, res) => {
  const customerId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        am.*,
        v.make as vehicle_make,
        v.model as vehicle_model,
        old_slot.date as old_date,
        old_slot.start_time as old_start_time,
        old_slot.end_time as old_end_time,
        new_slot.date as new_date,
        new_slot.start_time as new_start_time,
        new_slot.end_time as new_end_time
       FROM appointment_modifications am
       JOIN appointments a ON am.appointment_id = a.id
       JOIN vehicles v ON a.vehicle_id = v.id
       JOIN time_slots old_slot ON am.old_slot_id = old_slot.id
       JOIN time_slots new_slot ON am.new_slot_id = new_slot.id
       WHERE am.customer_id = $1
       ORDER BY am.created_at DESC`,
      [customerId]
    );

    res.json({ modifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching modification requests" });
  }
};
