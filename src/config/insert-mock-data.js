import pool from './db.js';
import bcrypt from 'bcrypt';

async function addMockData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📝 Starting mock data insertion...\n');

    // Step 1: Get existing users
    console.log('Step 1: Getting existing users...');
    const usersResult = await client.query(`
      SELECT id, full_name, email, role, is_active FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${usersResult.rows.length} active users`);

    const activeEmployee = usersResult.rows.find(u => u.role === 'employee');
    const activeCustomer = usersResult.rows.find(u => u.role === 'customer');

    if (!activeEmployee || !activeCustomer) {
      console.log('\n❌ Need at least one active employee and one active customer');
      console.log('Please sign up users through the app first');
      await pool.end();
      return;
    }

    const employeeId = activeEmployee.id;
    const customerId = activeCustomer.id;
    
    console.log(`  ✅ Using employee: ${activeEmployee.full_name} (${activeEmployee.email})`);
    console.log(`  ✅ Using customer: ${activeCustomer.full_name} (${activeCustomer.email})`);

    // Step 2: Create services
    console.log('\nStep 2: Creating mock services...');
    
    const services = [
      {
        vehicleNumber: 'ABC-1234',
        vehicleModel: 'Toyota Camry 2020',
        serviceType: 'Oil Change',
        title: 'Oil Change & Filter Replacement',
        description: 'Complete oil change service with new filter. Customer requested synthetic oil.',
        priority: 'medium',
        estimatedHours: 2.5
      },
      {
        vehicleNumber: 'XYZ-5678',
        vehicleModel: 'Honda Civic 2019',
        serviceType: 'Brake Service',
        title: 'Brake Inspection & Repair',
        description: 'Front brake pads replacement and rotor resurfacing. Customer reported squeaking noise.',
        priority: 'high',
        estimatedHours: 4.0
      },
      {
        vehicleNumber: 'LMN-9012',
        vehicleModel: 'BMW 320i 2021',
        serviceType: 'Diagnostics',
        title: 'Engine Diagnostics',
        description: 'Check engine light diagnostic and repair. Multiple error codes detected.',
        priority: 'high',
        estimatedHours: 3.5
      }
    ];

    const serviceIds = [];
    for (const service of services) {
      const result = await client.query(`
        INSERT INTO services (
          customer_id, 
          vehicle_number, 
          vehicle_model, 
          service_type, 
          title, 
          description, 
          status, 
          priority, 
          estimated_hours,
          scheduled_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
        RETURNING id, title
      `, [
        customerId, 
        service.vehicleNumber, 
        service.vehicleModel, 
        service.serviceType, 
        service.title, 
        service.description, 
        'in_progress', 
        service.priority, 
        service.estimatedHours
      ]);
      
      serviceIds.push(result.rows[0].id);
      console.log(`  ✅ Created: ${result.rows[0].title}`);
    }

    // Step 3: Create employee assignments
    console.log('\nStep 3: Creating employee assignments...');
    
    const assignmentIds = [];
    for (let i = 0; i < serviceIds.length; i++) {
      const result = await client.query(`
        INSERT INTO employee_assignments (employee_id, service_id, assigned_date, is_active)
        VALUES ($1, $2, CURRENT_TIMESTAMP - ($3 || ' days')::INTERVAL, $4)
        RETURNING id, service_id
      `, [employeeId, serviceIds[i], i, true]);
      
      assignmentIds.push(result.rows[0].id);
      console.log(`  ✅ Assigned service ${result.rows[0].service_id} to employee`);
    }

    // Step 4: Create time logs
    console.log('\nStep 4: Creating time log entries...');
    
    const timeLogs = [
      // Service 1 - Oil Change (2 days of work)
      {
        assignmentId: assignmentIds[0],
        serviceId: serviceIds[0],
        daysAgo: 2,
        startTime: '08:00',
        endTime: '10:30',
        hours: 2.5,
        description: 'Initial inspection and oil drain. Checked for leaks and wear.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[0],
        serviceId: serviceIds[0],
        daysAgo: 1,
        startTime: '09:00',
        endTime: '11:00',
        hours: 2.0,
        description: 'Installed new oil filter and refilled with synthetic oil. Test drive completed.',
        status: 'approved'
      },
      
      // Service 2 - Brake Repair (3 days of work)
      {
        assignmentId: assignmentIds[1],
        serviceId: serviceIds[1],
        daysAgo: 5,
        startTime: '08:30',
        endTime: '12:00',
        hours: 3.5,
        description: 'Removed wheels and inspected brake system. Measured pad thickness and rotor condition.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[1],
        serviceId: serviceIds[1],
        daysAgo: 4,
        startTime: '13:00',
        endTime: '17:30',
        hours: 4.5,
        description: 'Replaced front brake pads and resurfaced rotors. Cleaned caliper slides.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[1],
        serviceId: serviceIds[1],
        daysAgo: 3,
        startTime: '08:00',
        endTime: '10:00',
        hours: 2.0,
        description: 'Final assembly, brake fluid check, and test drive. All systems working properly.',
        status: 'approved'
      },
      
      // Service 3 - Engine Diagnostics (ongoing)
      {
        assignmentId: assignmentIds[2],
        serviceId: serviceIds[2],
        daysAgo: 1,
        startTime: '10:00',
        endTime: '12:30',
        hours: 2.5,
        description: 'Connected diagnostic tool and retrieved error codes. Researched fault codes.',
        status: 'pending'
      },
      {
        assignmentId: assignmentIds[2],
        serviceId: serviceIds[2],
        daysAgo: 0,
        startTime: '08:00',
        endTime: '11:00',
        hours: 3.0,
        description: 'Testing sensors and checking wiring. Found faulty oxygen sensor.',
        status: 'pending'
      }
    ];

    for (const log of timeLogs) {
      await client.query(`
        INSERT INTO time_logs (
          employee_id, 
          assignment_id, 
          service_id, 
          log_date, 
          start_time, 
          end_time, 
          hours_worked, 
          work_description, 
          status
        )
        VALUES (
          $1, $2, $3, 
          CURRENT_DATE - ($4 || ' days')::INTERVAL, 
          $5, $6, $7, $8, $9
        )
      `, [
        employeeId,
        log.assignmentId,
        log.serviceId,
        log.daysAgo,
        log.startTime,
        log.endTime,
        log.hours,
        log.description,
        log.status
      ]);
      
      console.log(`  ✅ Added time log: ${log.hours}h - ${log.description.substring(0, 50)}...`);
    }

    // Update total hours in services
    for (let i = 0; i < serviceIds.length; i++) {
      const hoursResult = await client.query(`
        SELECT COALESCE(SUM(hours_worked), 0) as total
        FROM time_logs
        WHERE service_id = $1
      `, [serviceIds[i]]);
      
      await client.query(`
        UPDATE services 
        SET total_hours_logged = $1
        WHERE id = $2
      `, [hoursResult.rows[0].total, serviceIds[i]]);
    }

    await client.query('COMMIT');
    
    console.log('\n✅ Mock data inserted successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Employee: ${activeEmployee.full_name}`);
    console.log(`  - Customer: ${activeCustomer.full_name}`);
    console.log(`  - 3 Services created`);
    console.log(`  - 3 Employee assignments created`);
    console.log(`  - 7 Time log entries created`);
    console.log(`  - Total hours logged: 20.0 hours`);
    console.log('\n🎉 Refresh the Employee Dashboard to see the data!');
    console.log(`\n📧 Login as: ${activeEmployee.email}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error inserting mock data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addMockData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
