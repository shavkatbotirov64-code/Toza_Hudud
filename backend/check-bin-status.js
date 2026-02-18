// Quti holatini tekshirish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function checkBinStatus() {
  console.log('🔍 Checking bin status...\n');

  try {
    // Get bins
    const response = await fetch(`${API_URL}/bins`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} bins:\n`);
      
      data.data.forEach(bin => {
        const fillLevel = parseFloat(bin.fillLevel);
        const status = fillLevel >= 90 ? '🔴 FULL' : '🟢 EMPTY';
        
        console.log(`📦 ${bin.code}:`);
        console.log(`   Fill Level: ${fillLevel}%`);
        console.log(`   Status: ${status}`);
        console.log(`   Address: ${bin.address}`);
        console.log(`   Last Update: ${bin.lastUpdate}`);
        console.log('');
      });
    }
    
    // Get latest sensor readings
    console.log('📊 Latest sensor readings:\n');
    const sensorResponse = await fetch(`${API_URL}/sensors/readings?limit=5`);
    const sensorData = await sensorResponse.json();
    
    if (sensorData.success && sensorData.data) {
      sensorData.data.forEach(reading => {
        console.log(`📡 ${reading.binId}:`);
        console.log(`   Distance: ${reading.distance} cm`);
        console.log(`   Fill Level: ${reading.fillLevel}%`);
        console.log(`   Time: ${new Date(reading.timestamp).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBinStatus();
