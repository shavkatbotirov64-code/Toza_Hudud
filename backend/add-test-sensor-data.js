// Test sensor ma'lumotlarini qo'shish
const fs = require('fs');
const path = require('path');

const testData = [
  {
    id: `sensor-${Date.now()}-1`,
    distance: 5.5,
    binId: 'ESP32-TEST-001',
    location: 'Test Location 1',
    timestamp: new Date().toISOString(),
    isAlert: true
  },
  {
    id: `sensor-${Date.now()}-2`,
    distance: 15.2,
    binId: 'ESP32-TEST-002',
    location: 'Test Location 2',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    isAlert: true
  },
  {
    id: `sensor-${Date.now()}-3`,
    distance: 25.8,
    binId: 'ESP32-TEST-003',
    location: 'Test Location 3',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    isAlert: false
  },
  {
    id: `sensor-${Date.now()}-4`,
    distance: 8.3,
    binId: 'ESP32-TEST-004',
    location: 'Test Location 4',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    isAlert: true
  },
  {
    id: `sensor-${Date.now()}-5`,
    distance: 35.0,
    binId: 'ESP32-TEST-005',
    location: 'Test Location 5',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    isAlert: false
  }
];

const filePath = path.join(__dirname, 'sensor-data.json');

// Read existing data
let existingData = [];
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  existingData = JSON.parse(fileContent);
} catch (error) {
  console.log('No existing data, creating new file');
}

// Add test data
const allData = [...testData, ...existingData];

// Write to file
fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));

console.log('✅ Test sensor data added successfully!');
console.log(`📊 Total records: ${allData.length}`);
console.log('\nTest data:');
testData.forEach(item => {
  console.log(`  - ${item.distance} sm | ${item.binId} | ${item.location}`);
});
