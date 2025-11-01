import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

// Signup (Customer / Employee)
export const signup = async (req, res) => {
  const { full_name, email, password, phone, role } = req.body;

  try {
    // prevent signup as admin
    if (role === "admin") {
      return res.status(400).json({ message: "Cannot create admin account" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // if customer -> active, if employee -> pending (inactive)
    const isActive = role === "customer" ? true : false;

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, is_active`,
      [full_name, email, hashedPassword, phone, role, isActive]
    );

    res.status(201).json({
      message:
        role === "customer"
          ? "Signup successful, you can login now."
          : "Signup successful, waiting for admin approval.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// Login (Customer / Employee / Admin)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = result.rows[0];

    // check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // check active status (employee must be approved)
    if (user.role === "employee" && !user.is_active) {
      return res.status(403).json({ message: "Waiting for admin approval" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
