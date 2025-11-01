import pool from "../config/db.js";

class ServiceRequest {
  static async create({ userId, serviceType, description, vehicleInfo }) {
    const query = `
      INSERT INTO service_requests (user_id, service_type, description, vehicle_info, status, progress, created_at)
      VALUES ($1, $2, $3, $4, 'pending', 0, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [userId, serviceType, description, vehicleInfo]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findAll() {
    const query = `
      SELECT 
        sr.*,
        u.full_name as customer_name,
        u.email as customer_email
      FROM service_requests sr
      LEFT JOIN users u ON sr.user_id::uuid = u.id
      ORDER BY sr.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(id, status, progress) {
    const query = `
      UPDATE service_requests 
      SET status = $1, progress = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, progress, id]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT * FROM service_requests WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default ServiceRequest;