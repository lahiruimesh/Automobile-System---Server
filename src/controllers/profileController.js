import pool from '../config/db.js';

// Get employee profile
export const getMyProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const profileQuery = `
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.role,
        u.profile_picture, u.bio, u.date_of_birth, u.address,
        u.emergency_contact, u.emergency_name, u.created_at
      FROM users u
      WHERE u.id = $1
    `;

    const skillsQuery = `
      SELECT id, skill_name, proficiency_level, years_of_experience
      FROM employee_skills
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `;

    const certificationsQuery = `
      SELECT id, certification_name, issuing_organization, 
             issue_date, expiry_date, certificate_url
      FROM employee_certifications
      WHERE employee_id = $1
      ORDER BY issue_date DESC
    `;

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT ea.id) as total_assignments,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN ea.id END) as completed_services,
        COALESCE(SUM(tl.hours_worked), 0) as total_hours_worked,
        COUNT(DISTINCT tl.id) as total_time_logs
      FROM employee_assignments ea
      LEFT JOIN services s ON ea.service_id = s.id
      LEFT JOIN time_logs tl ON ea.id = tl.assignment_id
      WHERE ea.employee_id = $1
    `;

    const [profile, skills, certifications, stats] = await Promise.all([
      pool.query(profileQuery, [employeeId]),
      pool.query(skillsQuery, [employeeId]),
      pool.query(certificationsQuery, [employeeId]),
      pool.query(statsQuery, [employeeId])
    ]);

    if (profile.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      profile: profile.rows[0],
      skills: skills.rows,
      certifications: certifications.rows,
      workStats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee profile
export const updateMyProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const {
      full_name,
      phone,
      bio,
      date_of_birth,
      address,
      emergency_contact,
      emergency_name
    } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           bio = COALESCE($3, bio),
           date_of_birth = COALESCE($4, date_of_birth),
           address = COALESCE($5, address),
           emergency_contact = COALESCE($6, emergency_contact),
           emergency_name = COALESCE($7, emergency_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, full_name, email, phone, bio, date_of_birth, address, 
                 emergency_contact, emergency_name`,
      [full_name, phone, bio, date_of_birth, address, emergency_contact, emergency_name, employeeId]
    );

    res.json({
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile picture
export const updateProfilePicture = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { profile_picture } = req.body;

    if (!profile_picture) {
      return res.status(400).json({ message: 'Profile picture URL required' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING profile_picture`,
      [profile_picture, employeeId]
    );

    res.json({
      message: 'Profile picture updated successfully',
      profile_picture: result.rows[0].profile_picture
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add skill
export const addSkill = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { skill_name, proficiency_level, years_of_experience } = req.body;

    if (!skill_name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const result = await pool.query(
      `INSERT INTO employee_skills (employee_id, skill_name, proficiency_level, years_of_experience)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [employeeId, skill_name, proficiency_level, years_of_experience]
    );

    res.status(201).json({
      message: 'Skill added successfully',
      skill: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete skill
export const deleteSkill = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM employee_skills WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add certification
export const addCertification = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { certification_name, issuing_organization, issue_date, expiry_date, certificate_url } = req.body;

    if (!certification_name) {
      return res.status(400).json({ message: 'Certification name is required' });
    }

    const result = await pool.query(
      `INSERT INTO employee_certifications 
       (employee_id, certification_name, issuing_organization, issue_date, expiry_date, certificate_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employeeId, certification_name, issuing_organization, issue_date, expiry_date, certificate_url]
    );

    res.status(201).json({
      message: 'Certification added successfully',
      certification: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding certification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete certification
export const deleteCertification = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM employee_certifications WHERE id = $1 AND employee_id = $2 RETURNING *',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
