import pool from './db.js';

async function addMockData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📝 Starting mock data insertion...\n');

    // Step 1: Get or create users
    console.log('Step 1: Checking existing users...');
    const usersResult = await client.query(`
      SELECT id, full_name, email, role, is_active FROM users ORDER BY created_at DESC
    `);
    
    console.log(`Found ${usersResult.rows.length} existing users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email}) - ${user.role} - Active: ${user.is_active}`);
    });

    let customerId, employeeId;

    // Check if we have an active employee and customer
    const activeEmployee = usersResult.rows.find(u => u.role === 'employee' && u.is_active);
    const activeCustomer = usersResult.rows.find(u => u.role === 'customer' && u.is_active);

    if (!activeCustomer || !activeEmployee) {
      console.log('\n⚠️  Need to create mock users first...');
      
      // Create mock customer
      if (!activeCustomer) {
        const customerResult = await client.query(`
          INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, full_name, email, role
        `, [
          'John Customer',
          'customer@test.com',
          '$2b$10$YourHashedPasswordHere', // Mock hashed password
          '0771234567',
          'customer',
          true
        ]);
        customerId = customerResult.rows[0].id;
        console.log(`  ✅ Created customer: ${customerResult.rows[0].full_name}`);
      } else {
        customerId = activeCustomer.id;
        console.log(`  ✅ Using existing customer: ${activeCustomer.full_name}`);
      }

      // Create mock employee
      if (!activeEmployee) {
        const employeeResult = await client.query(`
          INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, full_name, email, role
        `, [
          'Mike Employee',
          'employee@test.com',
          '$2b$10$YourHashedPasswordHere', // Mock hashed password
          '0777654321',
          'employee',
          true
        ]);
        employeeId = employeeResult.rows[0].id;
        console.log(`  ✅ Created employee: ${employeeResult.rows[0].full_name}`);
      } else {
        employeeId = activeEmployee.id;
        console.log(`  ✅ Using existing employee: ${activeEmployee.full_name}`);
      }
    } else {
      customerId = activeCustomer.id;
      employeeId = activeEmployee.id;
      console.log(`\n✅ Using existing active users`);
    }

    // Step 2: Create services
    console.log('\nStep 2: Creating mock services...');
    
    const services = [
      {
        type: 'Oil Change & Filter Replacement',
        description: 'Complete oil change service with new filter. Customer requested synthetic oil.',
        vehicle: 'Toyota Camry 2020 - ABC1234',
        customerId: customerId
      },
      {
        type: 'Brake Inspection & Repair',
        description: 'Front brake pads replacement and rotor resurfacing. Customer reported squeaking noise.',
        vehicle: 'Honda Civic 2019 - XYZ5678',
        customerId: customerId
      },
      {
        type: 'Engine Diagnostics',
        description: 'Check engine light diagnostic and repair. Multiple error codes detected.',
        vehicle: 'BMW 320i 2021 - LMN9012',
        customerId: customerId
      }
    ];

    const serviceIds = [];
    for (const service of services) {
      const result = await client.query(`
        INSERT INTO services (service_type, description, vehicle_info, customer_id, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, service_type
      `, [service.type, service.description, service.vehicle, service.customerId, 'in_progress']);
      
      serviceIds.push(result.rows[0].id);
      console.log(`  ✅ Created: ${result.rows[0].service_type}`);
    }

    // Step 3: Create employee assignments
    console.log('\nStep 3: Creating employee assignments...');
    
    const assignmentIds = [];
    for (let i = 0; i < serviceIds.length; i++) {
      const result = await client.query(`
        INSERT INTO employee_assignments (employee_id, service_id, assigned_date, status)
        VALUES ($1, $2, CURRENT_DATE - $3, $4)
        RETURNING id, service_id
      `, [employeeId, serviceIds[i], i, 'active']);
      
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
        date: 'CURRENT_DATE - 2',
        startTime: '08:00',
        endTime: '10:30',
        hours: 2.5,
        description: 'Initial inspection and oil drain. Checked for leaks and wear.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[0],
        serviceId: serviceIds[0],
        date: 'CURRENT_DATE - 1',
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
        date: 'CURRENT_DATE - 5',
        startTime: '08:30',
        endTime: '12:00',
        hours: 3.5,
        description: 'Removed wheels and inspected brake system. Measured pad thickness and rotor condition.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[1],
        serviceId: serviceIds[1],
        date: 'CURRENT_DATE - 4',
        startTime: '13:00',
        endTime: '17:30',
        hours: 4.5,
        description: 'Replaced front brake pads and resurfaced rotors. Cleaned caliper slides.',
        status: 'approved'
      },
      {
        assignmentId: assignmentIds[1],
        serviceId: serviceIds[1],
        date: 'CURRENT_DATE - 3',
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
        date: 'CURRENT_DATE - 1',
        startTime: '10:00',
        endTime: '12:30',
        hours: 2.5,
        description: 'Connected diagnostic tool and retrieved error codes. Researched fault codes.',
        status: 'pending'
      },
      {
        assignmentId: assignmentIds[2],
        serviceId: serviceIds[2],
        date: 'CURRENT_DATE',
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
          ${log.date}, 
          $4, $5, $6, $7, $8
        )
      `, [
        employeeId,
        log.assignmentId,
        log.serviceId,
        log.startTime,
        log.endTime,
        log.hours,
        log.description,
        log.status
      ]);
      
      console.log(`  ✅ Added time log: ${log.hours}h - ${log.description.substring(0, 40)}...`);
    }

    await client.query('COMMIT');
    
    console.log('\n✅ Mock data inserted successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - 3 Services created`);
    console.log(`  - 3 Employee assignments created`);
    console.log(`  - 7 Time log entries created`);
    console.log(`  - Total hours logged: 20.0 hours`);
    console.log('\n🎉 You can now refresh the Employee Dashboard to see the data!');
    console.log('\n📧 Test Login Credentials:');
    console.log('   Email: employee@test.com');
    console.log('   Password: password123 (you may need to update this in the database)');
    
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
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
