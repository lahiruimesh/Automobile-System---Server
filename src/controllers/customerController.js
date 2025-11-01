import pool from "../config/db.js";

export const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log("Fetching dashboard for user:", userId);

    // Mock data for dashboard - replace with actual database queries
    const activeStatus = {
      type: "Regular Maintenance",
      vehicle: "Toyota Camry - ABC1234",
      status: "In Progress",
      progress: 65,
      estimatedCompletion: "2024-01-15"
    };

    const serviceHistory = [
      {
        id: 1,
        vehicle: "Toyota Camry - ABC1234",
        date: "2024-01-05",
        cost: 12500,
        status: "Completed"
      },
      {
        id: 2,
        vehicle: "Honda Civic - XYZ5678",
        date: "2023-12-20",
        cost: 8500,
        status: "Completed"
      }
    ];

    const projectHistory = [
      {
        id: 1,
        project: "Performance Upgrade",
        vehicle: "Toyota Camry - ABC1234",
        date: "2023-11-15",
        status: "Completed"
      },
      {
        id: 2,
        project: "Audio System Installation",
        vehicle: "Honda Civic - XYZ5678",
        date: "2024-01-08",
        status: "In Progress"
      }
    ];

    // Get vehicle count from database
    let vehicleCount = 2; // Default fallback
    
    try {
      const vehicleResult = await pool.query(
        "SELECT COUNT(*) as count FROM vehicles WHERE user_id = $1",
        [userId]
      );
      vehicleCount = parseInt(vehicleResult.rows[0].count) || 2;
    } catch (dbError) {
      console.log("Vehicles table might not exist, using default count");
    }

    res.json({
      activeStatus,
      serviceHistory,
      projectHistory,
      vehicleCount
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};