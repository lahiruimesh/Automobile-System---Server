import pool from './src/config/db.js';
import { getUpcomingAppointments } from './src/services/bookingService.js';

async function testAPI() {
  try {
    const employeeId = '3c4b80f3-e5c3-4df6-bd59-5b999c50fd20'; // Sithara Nayananga
    
    console.log('\n🔍 Testing getUpcomingAppointments API...');
    console.log('Employee ID:', employeeId);
    
    const appointments = await getUpcomingAppointments(employeeId);
    
    console.log('\n✅ Appointments returned:', appointments.length);
    console.table(appointments);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPI();
