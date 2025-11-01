import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    console.log('Signup attempt:', { email, fullName });
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const query = `
      INSERT INTO users (email, password, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name`;
    
    const result = await pool.query(query, [email, password, fullName]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Signup failed',
      error: error.message
    });
  }
});

export default router;