// Statistika API'ni test qilish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function testStatistics() {
  console.log('📊 Testing Statistics API...\n');

  try {
    // 1. Dashboard statistikasi
    console.log('1️⃣ Dashboard Stats:');
    const dashboardResponse = await fetch(`${API_URL}/statistics/dashboard`);
    const dashboardData = await dashboardResponse.json();
    console.log(JSON.stringify(dashboardData, null, 2));
    console.log('\n');

    // 2. Mashinalar statistikasi
    console.log('2️⃣ Vehicles Stats:');
    const vehiclesResponse = await fetch(`${API_URL}/statistics/vehicles`);
    const vehiclesData = await vehiclesResponse.json();
    console.log(JSON.stringify(vehiclesData, null, 2));
    console.log('\n');

    // 3. Qutilar statistikasi
    console.log('3️⃣ Bins Stats:');
    const binsResponse = await fetch(`${API_URL}/statistics/bins`);
    const binsData = await binsResponse.json();
    console.log(JSON.stringify(binsData, null, 2));
    console.log('\n');

    // 4. Haftalik statistika
    console.log('4️⃣ Weekly Stats:');
    const weeklyResponse = await fetch(`${API_URL}/statistics/weekly`);
    const weeklyData = await weeklyResponse.json();
    console.log(JSON.stringify(weeklyData, null, 2));
    console.log('\n');

    // 5. Samaradorlik
    console.log('5️⃣ Efficiency Stats:');
    const efficiencyResponse = await fetch(`${API_URL}/statistics/efficiency`);
    const efficiencyData = await efficiencyResponse.json();
    console.log(JSON.stringify(efficiencyData, null, 2));
    console.log('\n');

    console.log('✅ All statistics API tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStatistics();
