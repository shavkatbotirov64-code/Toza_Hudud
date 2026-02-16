// 🗺️ UNIVERSAL MOCK DATA
// Bu ma'lumotlar barcha loyihalarda ishlatiladi: frontend, Map.toza.huduh
// Ikkala tomonda ham bir xil ma'lumotlar ko'rinadi

// 2 ta quti - Samarqand (95% - DARHOL HARAKATLANISH UCHUN)
export const mockBinsData = [
  { id: 'BIN-001', location: [39.6542, 66.9597], address: 'Registon maydoni, 1', status: 95, capacity: 120 },
  { id: 'BIN-002', location: [39.6580, 66.9650], address: 'Amir Temur ko\'chasi, 45', status: 92, capacity: 150 }
]

// 3 ta mashina - Samarqand
export const mockVehiclesData = [
  { id: 'VEH-001', driver: 'Akmaljon Karimov', status: 'active', coordinates: [39.6500, 66.9600], speed: 0, cleaned: 0, targetBin: null },
  { id: 'VEH-002', driver: 'Bobur Toshmatov', status: 'active', coordinates: [39.6600, 66.9700], speed: 0, cleaned: 0, targetBin: null },
  { id: 'VEH-003', driver: 'Davron Saidov', status: 'active', coordinates: [39.6520, 66.9550], speed: 0, cleaned: 0, targetBin: null }
]
