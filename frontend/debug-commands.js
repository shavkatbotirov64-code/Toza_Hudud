// 🔧 Debug Commands - Browser Console'da ishlatish uchun
// F12 bosib Console'ni oching va bu komandalarni copy-paste qiling

// ============================================
// 1. CACHE VA LOCALSTORAGE TOZALASH
// ============================================
function clearAllCache() {
  console.log('🧹 Tozalash boshlandi...');
  
  // LocalStorage
  const lsKeys = Object.keys(localStorage);
  console.log(`📦 LocalStorage: ${lsKeys.length} ta kalit topildi`);
  lsKeys.forEach(key => console.log(`   - ${key}`));
  localStorage.clear();
  console.log('✅ LocalStorage tozalandi!');
  
  // SessionStorage
  sessionStorage.clear();
  console.log('✅ SessionStorage tozalandi!');
  
  // Cache API
  if ('caches' in window) {
    caches.keys().then(names => {
      console.log(`💾 Cache: ${names.length} ta cache topildi`);
      names.forEach(name => {
        console.log(`   - ${name}`);
        caches.delete(name);
      });
      console.log('✅ Cache tozalandi!');
      console.log('🔄 3 soniyadan keyin qayta yuklanadi...');
      setTimeout(() => location.reload(true), 3000);
    });
  } else {
    console.log('🔄 3 soniyadan keyin qayta yuklanadi...');
    setTimeout(() => location.reload(true), 3000);
  }
}

// ============================================
// 2. MASHINALAR HOLATINI TEKSHIRISH
// ============================================
function checkVehicles() {
  console.log('🚛 Mashinalar holati:');
  console.log('');
  
  const vehiclesData = JSON.parse(localStorage.getItem('vehiclesData') || '[]');
  
  if (vehiclesData.length === 0) {
    console.log('⚠️ LocalStorage\'da mashinalar topilmadi');
    console.log('💡 Sahifani qayta yuklang yoki API\'dan yuklanishini kuting');
    return;
  }
  
  vehiclesData.forEach((vehicle, index) => {
    console.log(`\n${index + 1}. ${vehicle.id} (${vehicle.driver})`);
    console.log(`   📍 Pozitsiya: [${vehicle.position[0].toFixed(6)}, ${vehicle.position[1].toFixed(6)}]`);
    console.log(`   🚦 Status: ${vehicle.status}`);
    console.log(`   🔄 Patrolling: ${vehicle.isPatrolling}`);
    console.log(`   ✅ Cleaned Once: ${vehicle.hasCleanedOnce}`);
    console.log(`   📊 Patrol Route: ${vehicle.patrolRoute?.length || 0} nuqta`);
    console.log(`   📈 Patrol Index: ${vehicle.patrolIndex || 0}`);
    console.log(`   🗺️ Route Path: ${vehicle.routePath?.length || 0} nuqta`);
    console.log(`   🧹 Cleaned: ${vehicle.cleaned || 0} marta`);
  });
}

// ============================================
// 3. QUTI HOLATINI TEKSHIRISH
// ============================================
function checkBins() {
  console.log('🗑️ Qutilar holati:');
  console.log('');
  
  // AppContext'dan olish (agar mavjud bo'lsa)
  const binsData = JSON.parse(localStorage.getItem('binsData') || '[]');
  
  if (binsData.length === 0) {
    console.log('⚠️ LocalStorage\'da qutilar topilmadi');
    console.log('💡 Sahifani qayta yuklang yoki API\'dan yuklanishini kuting');
    return;
  }
  
  binsData.forEach((bin, index) => {
    console.log(`\n${index + 1}. ${bin.id}`);
    console.log(`   📍 Manzil: ${bin.address}`);
    console.log(`   📊 Fill Level: ${bin.fillLevel}%`);
    console.log(`   🎨 Status: ${bin.status >= 90 ? '🔴 FULL' : '🟢 EMPTY'}`);
    console.log(`   ⏰ Last Update: ${bin.lastUpdate}`);
    console.log(`   🧹 Last Cleaned: ${bin.lastCleaned}`);
  });
}

// ============================================
// 4. WEBSOCKET HOLATINI TEKSHIRISH
// ============================================
function checkWebSocket() {
  console.log('🔌 WebSocket holati:');
  console.log('');
  console.log('⚠️ Bu funksiya faqat AppContext ichida ishlaydi');
  console.log('💡 Console\'da quyidagi loglarni qidiring:');
  console.log('   - "✅ AppContext WebSocket connected"');
  console.log('   - "📡 AppContext: REAL-TIME ESP32 SIGNAL"');
  console.log('   - "🗑️ AppContext: REAL-TIME BIN STATUS"');
  console.log('');
  console.log('❌ Quyidagi log ko\'rinmasligi kerak:');
  console.log('   - "📥 Real-time position update" (Bu o\'chirilgan bo\'lishi kerak!)');
}

// ============================================
// 5. TELEPORTATSIYA BUGINI TEKSHIRISH
// ============================================
function checkTeleportationBug() {
  console.log('🐛 Teleportatsiya bug tekshiruvi:');
  console.log('');
  
  // 1. WebSocket handler tekshiruvi
  console.log('1️⃣ WebSocket vehiclePositionUpdate handler:');
  console.log('   Console\'da "vehiclePositionUpdate" so\'zini qidiring');
  console.log('   ✅ Topilmasa - Yaxshi! (O\'chirilgan)');
  console.log('   ❌ Topilsa - Muammo! (Qayta yoqilgan)');
  console.log('');
  
  // 2. Pozitsiya reset tekshiruvi
  console.log('2️⃣ Patrol marshrut yaratishda pozitsiya reset:');
  console.log('   Console\'da "position: fullRoute[0]" so\'zini qidiring');
  console.log('   ✅ Topilmasa - Yaxshi! (O\'chirilgan)');
  console.log('   ❌ Topilsa - Muammo! (Qayta yoqilgan)');
  console.log('');
  
  // 3. Cache tekshiruvi
  console.log('3️⃣ Cache va LocalStorage:');
  const lsSize = JSON.stringify(localStorage).length;
  console.log(`   📦 LocalStorage hajmi: ${(lsSize / 1024).toFixed(2)} KB`);
  if (lsSize > 100000) {
    console.log('   ⚠️ Juda katta! Tozalash tavsiya etiladi');
  } else {
    console.log('   ✅ Normal');
  }
}

// ============================================
// 6. MASHINANI QUTIGA YUBORISH (TEST)
// ============================================
function sendVehicleToBin(vehicleId = 'VEH-001') {
  console.log(`🚛 ${vehicleId} ni qutiga yuborish...`);
  console.log('⚠️ Bu faqat test uchun!');
  console.log('');
  
  // Quti holatini FULL qilish
  const binId = 'ESP32-IBN-SINO';
  
  console.log(`🔴 Quti ${binId} ni FULL holatiga o'tkazish...`);
  console.log('💡 Bu ESP32 signalini simulyatsiya qiladi');
  console.log('');
  console.log('📡 WebSocket orqali yuborish kerak:');
  console.log(`   socket.emit('sensorData', {`);
  console.log(`     binId: '${binId}',`);
  console.log(`     distance: 5,`);
  console.log(`     timestamp: new Date().toISOString()`);
  console.log(`   })`);
}

// ============================================
// 7. BARCHA MASHINALARNI RESET QILISH
// ============================================
function resetAllVehicles() {
  console.log('🔄 Barcha mashinalarni reset qilish...');
  
  const vehiclesData = JSON.parse(localStorage.getItem('vehiclesData') || '[]');
  
  if (vehiclesData.length === 0) {
    console.log('⚠️ Mashinalar topilmadi');
    return;
  }
  
  const resetVehicles = vehiclesData.map(vehicle => ({
    ...vehicle,
    isPatrolling: true,
    hasCleanedOnce: false,
    patrolIndex: 0,
    patrolRoute: [],
    routePath: null,
    currentPathIndex: 0,
    status: 'moving'
  }));
  
  localStorage.setItem('vehiclesData', JSON.stringify(resetVehicles));
  console.log('✅ Mashinalar reset qilindi!');
  console.log('🔄 Sahifani qayta yuklang...');
}

// ============================================
// YORDAM
// ============================================
function help() {
  console.log('🔧 Mavjud komandalar:');
  console.log('');
  console.log('clearAllCache()          - Cache va LocalStorage tozalash');
  console.log('checkVehicles()          - Mashinalar holatini ko\'rish');
  console.log('checkBins()              - Qutilar holatini ko\'rish');
  console.log('checkWebSocket()         - WebSocket holatini tekshirish');
  console.log('checkTeleportationBug()  - Teleportatsiya bugini tekshirish');
  console.log('sendVehicleToBin()       - Mashinani qutiga yuborish (test)');
  console.log('resetAllVehicles()       - Barcha mashinalarni reset qilish');
  console.log('help()                   - Bu yordam xabarini ko\'rsatish');
  console.log('');
  console.log('💡 Maslahat: Teleportatsiya muammosi bo\'lsa:');
  console.log('   1. checkTeleportationBug() - Muammoni aniqlash');
  console.log('   2. clearAllCache() - Cache tozalash');
  console.log('   3. Sahifani qayta yuklash');
}

// Avtomatik yordam ko'rsatish
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🔧 DEBUG COMMANDS YUKLANDI');
console.log('═══════════════════════════════════════════════════════');
console.log('');
help();
console.log('');
console.log('═══════════════════════════════════════════════════════');
