// ===== GLOBAL VARIABLES =====
let currentTab = 'dashboard';
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let currentTheme = 'light';
let map = null;
let statusChart = null;
let vehiclesChart = null;
let reportsChart = null;
let binsData = [];
let vehiclesData = [];
let activityData = [];
let alertsData = [];
let mapMarkers = [];
let vehicleMarkers = [];
let vehicleRoutes = {};
let movingVehicles = new Set();

// ===== TASHKENT LOCATIONS DATA =====
const tashkentDistricts = {
    yakkasaroy: {
        center: [41.284, 69.279],
        bounds: [[41.27, 69.26], [41.29, 69.29]],
        bins: []
    },
    yunusobod: {
        center: [41.367, 69.292],
        bounds: [[41.35, 69.28], [41.38, 69.31]],
        bins: []
    },
    mirzo: {
        center: [41.314, 69.336],
        bounds: [[41.30, 69.32], [41.33, 69.35]],
        bins: []
    },
    chilonzor: {
        center: [41.286, 69.204],
        bounds: [[41.27, 69.19], [41.30, 69.22]],
        bins: []
    }
};

// ===== MOCK DATA =====
const mockBins = [
    { 
        id: 'BIN-001', 
        address: 'Amir Temur kochasi 123, Yakkasaroy', 
        district: 'yakkasaroy',
        location: [41.284, 69.279],
        status: 95, 
        lastUpdate: '14:30', 
        lastCleaned: '26.12.2025 14:35', 
        capacity: 120,
        type: 'plastic',
        sensorId: 'SENSOR-001',
        online: true,
        installDate: '01.01.2024'
    },
    { 
        id: 'BIN-002', 
        address: 'Mustaqillik maydoni 45, Yunusobod', 
        district: 'yunusobod',
        location: [41.367, 69.292],
        status: 45, 
        lastUpdate: '14:25', 
        lastCleaned: '26.12.2025 09:15', 
        capacity: 150,
        type: 'general',
        sensorId: 'SENSOR-002',
        online: true,
        installDate: '15.02.2024'
    },
    { 
        id: 'BIN-003', 
        address: 'Bobur kochasi 78, Mirzo Ulugbek', 
        district: 'mirzo',
        location: [41.314, 69.336],
        status: 75, 
        lastUpdate: '14:28', 
        lastCleaned: '25.12.2025 18:20', 
        capacity: 200,
        type: 'organic',
        sensorId: 'SENSOR-003',
        online: true,
        installDate: '20.03.2024'
    },
    { 
        id: 'BIN-004', 
        address: 'Yunus Rajabiy 12, Chilonzor', 
        district: 'chilonzor',
        location: [41.286, 69.204],
        status: 20, 
        lastUpdate: '14:20', 
        lastCleaned: '26.12.2025 11:45', 
        capacity: 100,
        type: 'plastic',
        sensorId: 'SENSOR-004',
        online: true,
        installDate: '05.04.2024'
    },
    { 
        id: 'BIN-005', 
        address: 'Navoi kochasi 89, Yakkasaroy', 
        district: 'yakkasaroy',
        location: [41.288, 69.275],
        status: 85, 
        lastUpdate: '14:15', 
        lastCleaned: '26.12.2025 08:30', 
        capacity: 180,
        type: 'general',
        sensorId: 'SENSOR-005',
        online: false,
        installDate: '10.05.2024'
    },
    { 
        id: 'BIN-006', 
        address: 'Shota Rustaveli 56, Yunusobod', 
        district: 'yunusobod',
        location: [41.365, 69.295],
        status: 30, 
        lastUpdate: '14:10', 
        lastCleaned: '26.12.2025 12:20', 
        capacity: 120,
        type: 'organic',
        sensorId: 'SENSOR-006',
        online: true,
        installDate: '25.06.2024'
    },
    { 
        id: 'BIN-007', 
        address: 'Ahmad Donish 90, Mirzo Ulugbek', 
        district: 'mirzo',
        location: [41.312, 69.332],
        status: 60, 
        lastUpdate: '14:05', 
        lastCleaned: '26.12.2025 10:50', 
        capacity: 160,
        type: 'plastic',
        sensorId: 'SENSOR-007',
        online: true,
        installDate: '15.07.2024'
    },
    { 
        id: 'BIN-008', 
        address: 'Furqat 34, Chilonzor', 
        district: 'chilonzor',
        location: [41.284, 69.208],
        status: 95, 
        lastUpdate: '14:00', 
        lastCleaned: '25.12.2025 16:30', 
        capacity: 140,
        type: 'general',
        sensorId: 'SENSOR-008',
        online: true,
        installDate: '01.08.2024'
    },
    { 
        id: 'BIN-009', 
        address: 'Beruniy 67, Yakkasaroy', 
        district: 'yakkasaroy',
        location: [41.281, 69.273],
        status: 40, 
        lastUpdate: '13:55', 
        lastCleaned: '26.12.2025 07:45', 
        capacity: 110,
        type: 'organic',
        sensorId: 'SENSOR-009',
        online: true,
        installDate: '20.09.2024'
    },
    { 
        id: 'BIN-010', 
        address: 'Alisher Navoiy 21, Yunusobod', 
        district: 'yunusobod',
        location: [41.369, 69.298],
        status: 80, 
        lastUpdate: '13:50', 
        lastCleaned: '26.12.2025 06:30', 
        capacity: 170,
        type: 'general',
        sensorId: 'SENSOR-010',
        online: true,
        installDate: '05.10.2024'
    }
];

const mockVehicles = [
    { 
        id: 'VH-001', 
        driver: 'Alisher Karimov', 
        status: 'moving', 
        cleaned: 12, 
        location: 'Amir Temur kochasi, Yakkasaroy',
        coordinates: [41.284, 69.279],
        capacity: 5000,
        fuel: 85,
        speed: 45,
        route: 'Route A',
        phone: '+998901234567',
        licensePlate: '01A123AA',
        lastService: '20.12.2025',
        currentBins: ['BIN-001', 'BIN-002']
    },
    { 
        id: 'VH-002', 
        driver: 'Sardor Umarov', 
        status: 'moving', 
        cleaned: 15, 
        location: 'Yunusobod 7-mavze',
        coordinates: [41.367, 69.292],
        capacity: 6000,
        fuel: 70,
        speed: 38,
        route: 'Route B',
        phone: '+998902345678',
        licensePlate: '01B234BB',
        lastService: '22.12.2025',
        currentBins: ['BIN-006', 'BIN-007']
    },
    { 
        id: 'VH-003', 
        driver: 'Jasur Rahimov', 
        status: 'active', 
        cleaned: 8, 
        location: 'Chilonzor parki',
        coordinates: [41.286, 69.204],
        capacity: 4500,
        fuel: 40,
        speed: 0,
        route: 'Route C',
        phone: '+998903456789',
        licensePlate: '01C345CC',
        lastService: '25.12.2025',
        currentBins: ['BIN-004']
    },
    { 
        id: 'VH-004', 
        driver: 'Botir Sharipov', 
        status: 'moving', 
        cleaned: 11, 
        location: 'Mirzo Ulugbek tumani',
        coordinates: [41.314, 69.336],
        capacity: 5500,
        fuel: 65,
        speed: 42,
        route: 'Route D',
        phone: '+998904567890',
        licensePlate: '01D456DD',
        lastService: '18.12.2025',
        currentBins: ['BIN-003', 'BIN-009']
    }
];

const mockActivities = [
    { 
        id: 'ACT-001',
        type: 'danger',
        title: 'Quti #BIN-001 to\'ldi',
        description: '95% to\'ldi. Mashina yuborildi',
        time: '14:30',
        location: 'Amir Temur kochasi',
        binId: 'BIN-001'
    },
    { 
        id: 'ACT-002',
        type: 'success',
        title: 'Mashina #VH-001 yetib keldi',
        description: 'Quti #BIN-001 tozalandi',
        time: '14:35',
        location: 'Yakkasaroy',
        vehicleId: 'VH-001'
    },
    { 
        id: 'ACT-003',
        type: 'info',
        title: 'Yangi quti qo\'shildi',
        description: 'Quti #BIN-011 aktivlashtirildi',
        time: '14:40',
        location: 'Yunusobod',
        binId: 'BIN-011'
    },
    { 
        id: 'ACT-004',
        type: 'warning',
        title: 'Quti #BIN-008 ogohlantirish',
        description: '85% to\'ldi',
        time: '14:45',
        location: 'Chilonzor',
        binId: 'BIN-008'
    },
    { 
        id: 'ACT-005',
        type: 'danger',
        title: 'Sensor nosozligi',
        description: 'Quti #BIN-005 sensori ishlamayapti',
        time: '14:50',
        location: 'Yakkasaroy',
        binId: 'BIN-005'
    }
];

const mockAlerts = [
    {
        id: 'ALERT-001',
        type: 'danger',
        title: 'JIDDIY: Quti #BIN-001 to\'lib ketdi',
        message: '100% to\'ldi. Darhol harakat talab qilinadi!',
        time: '2 daqiqa oldin',
        location: 'Amir Temur kochasi',
        read: false,
        priority: 'high'
    },
    {
        id: 'ALERT-002',
        type: 'warning',
        title: 'Sensor nosozligi',
        message: 'Quti #BIN-005 sensori ishlamayapti',
        time: '15 daqiqa oldin',
        location: 'Yakkasaroy',
        read: false,
        priority: 'medium'
    },
    {
        id: 'ALERT-003',
        type: 'info',
        title: 'Mashina kechikdi',
        message: 'VH-003 marshrutida 20 daqiqa kechikmoqda',
        time: '30 daqiqa oldin',
        location: 'Chilonzor',
        read: true,
        priority: 'low'
    },
    {
        id: 'ALERT-004',
        type: 'danger',
        title: 'Yoqilg\'i yetarli emas',
        message: 'VH-002 mashinasida yoqilg\'i 15% dan past',
        time: '1 soat oldin',
        location: 'Yunusobod',
        read: true,
        priority: 'high'
    },
    {
        id: 'ALERT-005',
        type: 'warning',
        title: 'Ogohlantirish darajasi',
        message: 'Quti #BIN-008 85% to\'ldi',
        time: '2 soat oldin',
        location: 'Mirzo Ulug\'bek',
        read: true,
        priority: 'medium'
    }
];

// ===== HELPER FUNCTIONS =====
function getStatusColor(status) {
    if (status >= 90) return '#ef4444';
    if (status >= 70) return '#f59e0b';
    if (status >= 30) return '#eab308';
    return '#10b981';
}

function getStatusText(status) {
    if (status >= 90) return 'To\'la';
    if (status >= 70) return 'Deyarli to\'la';
    if (status >= 30) return 'Yarim';
    return 'Bo\'sh';
}

function getStatusBadge(status) {
    if (status >= 90) return '<span class="badge danger">To\'la</span>';
    if (status >= 70) return '<span class="badge warning">Ogoh</span>';
    if (status >= 30) return '<span class="badge info">Yarim</span>';
    return '<span class="badge success">Bo\'sh</span>';
}

function formatTime(date) {
    return date.toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(date) {
    return date.toLocaleDateString('uz-UZ', { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'danger' ? 'times-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
    
    // Add animation
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease';
    }, 10);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

async function initApp() {
    // Hide loading screen with animation
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transform = 'scale(0.9)';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
    
    // Load data
    binsData = [...mockBins];
    vehiclesData = [...mockVehicles];
    activityData = [...mockActivities];
    alertsData = [...mockAlerts];
    
    // Initialize components
    initSidebar();
    initHeader();
    initDashboard();
    initTabs();
    initMap();
    initCharts();
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Simulate real-time updates
    startRealTimeUpdates();
    startVehicleMovement();
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedBackground = localStorage.getItem('background') || 'none';
    
    changeTheme(savedTheme);
    if (savedBackground !== 'none') {
        document.body.classList.add(savedBackground + '-bg');
    }
    
    showToast('Tizim muvaffaqiyatli yuklandi!', 'success');
}

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
                icon.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(180deg)';
                }, 10);
            } else {
                icon.className = 'fas fa-chevron-left';
                icon.style.transform = 'rotate(180deg)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                }, 10);
            }
            
            // Add animation
            sidebar.style.animation = 'slideInLeft 0.3s ease';
            setTimeout(() => {
                sidebar.style.animation = '';
            }, 300);
        });
    }
    
    // Update badges
    updateBadges();
}

function updateBadges() {
    const fullBins = binsData.filter(bin => bin.status >= 90).length;
    const activeVehicles = vehiclesData.filter(v => v.status === 'active' || v.status === 'moving').length;
    const unreadAlerts = alertsData.filter(n => !n.read).length;
    
    const fullBinsBadge = document.getElementById('fullBinsBadge');
    const vehicleBadge = document.querySelector('.nav-badge.online');
    const alertBadge = document.querySelector('.nav-badge.alert');
    
    if (fullBinsBadge) fullBinsBadge.textContent = fullBins;
    if (vehicleBadge) vehicleBadge.textContent = activeVehicles;
    if (alertBadge) alertBadge.textContent = unreadAlerts;
}

function initHeader() {
    // Theme toggle
    const themeBtn = document.querySelector('[onclick="toggleTheme()"]');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Refresh button
    const refreshBtn = document.querySelector('[onclick="refreshData()"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
}

function toggleTheme() {
    const themes = ['light', 'dark', 'blue', 'green'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    changeTheme(nextTheme);
}

function changeTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = document.querySelector('[onclick="toggleTheme()"] i');
    if (icon) {
        if (theme === 'dark') icon.className = 'fas fa-sun';
        else if (theme === 'blue') icon.className = 'fas fa-palette';
        else if (theme === 'green') icon.className = 'fas fa-leaf';
        else icon.className = 'fas fa-moon';
        
        // Add animation
        icon.style.animation = 'rotate3d 1s ease';
        setTimeout(() => {
            icon.style.animation = '';
        }, 1000);
    }
    
    showToast(`Mavzu "${theme}" mavzuga o'zgartirildi`, 'success');
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    const lastUpdateElement = document.getElementById('lastUpdateTime');
    
    if (timeElement) timeElement.textContent = formatTime(now);
    if (dateElement) dateElement.textContent = formatDate(now);
    if (lastUpdateElement) lastUpdateElement.textContent = formatTime(now);
}

function refreshData() {
    const btn = document.querySelector('[onclick="refreshData()"] i');
    if (!btn) return;
    
    btn.className = 'fas fa-spinner fa-spin';
    btn.style.animation = 'spin 1s linear infinite';
    
    // Simulate API call
    setTimeout(() => {
        btn.className = 'fas fa-sync-alt';
        btn.style.animation = 'rotate3d 1s ease';
        setTimeout(() => {
            btn.style.animation = '';
        }, 1000);
        
        showToast('Ma\'lumotlar yangilandi', 'success');
        
        // Update data
        updateDashboardData();
        updateBadges();
        
        // Re-render current tab
        if (currentTab === 'dashboard') {
            renderDashboard();
        } else if (currentTab === 'bins') {
            renderBinsTable();
        } else if (currentTab === 'vehicles') {
            renderVehiclesGrid();
        } else if (currentTab === 'alerts') {
            renderAlerts();
        }
    }, 1500);
}

function updateDashboardData() {
    // Update some random data for simulation
    binsData.forEach(bin => {
        const change = Math.random() * 10 - 5; // -5 to +5
        bin.status = Math.max(0, Math.min(100, bin.status + change));
        bin.lastUpdate = formatTime(new Date());
    });
    
    // Update vehicle positions
    vehiclesData.forEach(vehicle => {
        if (vehicle.status === 'moving') {
            const latChange = (Math.random() - 0.5) * 0.001;
            const lngChange = (Math.random() - 0.5) * 0.001;
            vehicle.coordinates[0] += latChange;
            vehicle.coordinates[1] += lngChange;
            vehicle.fuel = Math.max(0, vehicle.fuel - 0.1);
            vehicle.speed = 30 + Math.random() * 20;
        }
    });
}

function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            
            // Update active nav item
            navItems.forEach(nav => {
                nav.classList.remove('active');
                nav.style.animation = 'fadeIn 0.3s ease';
            });
            item.classList.add('active');
            item.style.animation = 'pulse 0.5s ease';
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.animation = '';
            });
            const targetTab = document.getElementById(tab + 'Tab');
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.animation = 'slideInUp 0.5s ease';
            }
            
            // Update page title
            const title = document.getElementById('pageTitle');
            const titles = {
                dashboard: 'Dashboard',
                bins: 'Qutilar',
                vehicles: 'Mashinalar',
                routes: 'Marshrutlar',
                reports: 'Hisobotlar',
                alerts: 'Ogohlantirishlar',
                settings: 'Sozlamalar'
            };
            if (title) {
                title.textContent = titles[tab] || 'Dashboard';
                title.style.animation = 'typewriter 1s steps(20)';
                setTimeout(() => {
                    title.style.animation = '';
                }, 1000);
            }
            
            currentTab = tab;
            
            // Render content with animation
            setTimeout(() => {
                switch(tab) {
                    case 'dashboard':
                        renderDashboard();
                        break;
                    case 'bins':
                        renderBinsTable();
                        break;
                    case 'vehicles':
                        renderVehiclesGrid();
                        break;
                    case 'routes':
                        renderRoutes();
                        break;
                    case 'reports':
                        renderReports();
                        break;
                    case 'alerts':
                        renderAlerts();
                        break;
                    case 'settings':
                        renderSettings();
                        break;
                }
            }, 300);
        });
    });
}

// ===== DASHBOARD FUNCTIONS =====
function initDashboard() {
    renderDashboard();
}

function renderDashboard() {
    renderStats();
    renderActivityFeed();
    updateStatusChart();
    renderMetrics();
}

function renderStats() {
    const totalBins = binsData.length;
    const fullBins = binsData.filter(bin => bin.status >= 90).length;
    const todayCleaned = 856; // Mock data
    const activeVehicles = vehiclesData.filter(v => v.status === 'active' || v.status === 'moving').length;
    
    // Update DOM elements with animation
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues.forEach((value, index) => {
            value.style.animation = 'zoomInOut 0.5s ease';
            setTimeout(() => {
                value.style.animation = '';
            }, 500);
        });
        
        statValues[0].textContent = totalBins;
        statValues[1].textContent = fullBins;
        statValues[2].textContent = todayCleaned.toLocaleString();
        statValues[3].textContent = activeVehicles;
    }
}

function renderActivityFeed() {
    const container = document.getElementById('activityList');
    if (!container) return;
    
    container.innerHTML = '';
    
    activityData.slice(0, 5).forEach((activity, index) => {
        const item = document.createElement('div');
        item.className = `activity-item ${activity.type}`;
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="activity-header">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
            <div class="activity-desc">${activity.description}</div>
            <div class="activity-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${activity.location}</span>
                <span><i class="fas fa-clock"></i> ${activity.time}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadActivity() {
    const btn = document.querySelector('[onclick="loadActivity()"] i');
    if (!btn) return;
    
    btn.className = 'fas fa-spinner fa-spin';
    btn.style.animation = 'spin 1s linear infinite';
    
    setTimeout(() => {
        btn.className = 'fas fa-sync-alt';
        btn.style.animation = 'rotate3d 1s ease';
        setTimeout(() => {
            btn.style.animation = '';
        }, 1000);
        renderActivityFeed();
        showToast('Faolliklar yangilandi', 'success');
    }, 800);
}

// ===== MAP FUNCTIONS =====
function initMap() {
    map = L.map('liveMap').setView([41.311, 69.240], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add district boundaries
    addDistrictBoundaries();
    
    // Add bin markers
    addBinMarkers();
    
    // Add vehicle markers
    addVehicleMarkers();
    
    // Add click event for map
    map.on('click', function(e) {
        showToast(`Xarita joylashuvi: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`, 'info');
    });
}

function addDistrictBoundaries() {
    Object.values(tashkentDistricts).forEach(district => {
        L.rectangle(district.bounds, {
            color: '#3b82f6',
            weight: 1,
            opacity: 0.3,
            fillOpacity: 0.1,
            fillColor: '#3b82f6'
        }).addTo(map).bindTooltip('Tuman hududi', {
            permanent: false,
            direction: 'center'
        });
    });
}

function addBinMarkers() {
    mapMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    mapMarkers = [];
    
    binsData.forEach(bin => {
        const color = getStatusColor(bin.status);
        const icon = L.divIcon({
            html: `
                <div class="bin-marker" style="background: ${color};">
                    <i class="fas fa-trash"></i>
                </div>
            `,
            className: 'custom-bin-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        const marker = L.marker(bin.location, { icon: icon })
            .addTo(map)
            .bindPopup(`
                <div class="map-popup">
                    <h4>Quti #${bin.id}</h4>
                    <p><strong>Manzil:</strong> ${bin.address}</p>
                    <p><strong>Holat:</strong> ${bin.status}% - ${getStatusText(bin.status)}</p>
                    <p><strong>Oxirgi tozalash:</strong> ${bin.lastCleaned}</p>
                    <p><strong>Sig'im:</strong> ${bin.capacity}L</p>
                    <button class="btn btn-primary" onclick="openBinDetail('${bin.id}')">
                        Batafsil
                    </button>
                </div>
            `);
        
        marker.on('click', () => {
            map.setView(bin.location, 16);
            marker.openPopup();
        });
        
        mapMarkers.push(marker);
    });
}

function addVehicleMarkers() {
    vehicleMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    vehicleMarkers = [];
    
    vehiclesData.forEach(vehicle => {
        const icon = L.divIcon({
            html: `
                <div class="vehicle-marker ${vehicle.status}" style="background: ${vehicle.status === 'moving' ? '#3b82f6' : vehicle.status === 'active' ? '#10b981' : '#94a3b8'};">
                    <i class="fas fa-truck"></i>
                </div>
            `,
            className: 'custom-vehicle-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        const marker = L.marker(vehicle.coordinates, { icon: icon })
            .addTo(map)
            .bindPopup(`
                <div class="map-popup">
                    <h4>${vehicle.id}</h4>
                    <p><strong>Haydovchi:</strong> ${vehicle.driver}</p>
                    <p><strong>Status:</strong> ${vehicle.status === 'moving' ? 'Harakatlanmoqda' : vehicle.status === 'active' ? 'Faol' : 'Band emas'}</p>
                    <p><strong>Bugun tozalandi:</strong> ${vehicle.cleaned} ta</p>
                    <p><strong>Yoqilg'i:</strong> ${vehicle.fuel}%</p>
                    <p><strong>Tezlik:</strong> ${vehicle.speed} km/h</p>
                    <button class="btn btn-primary" onclick="trackVehicle('${vehicle.id}')">
                        Kuzatish
                    </button>
                </div>
            `);
        
        vehicleMarkers.push(marker);
        
        // Add animation for moving vehicles
        if (vehicle.status === 'moving') {
            movingVehicles.add(vehicle.id);
        }
    });
}

function zoomIn() {
    map.zoomIn();
    showToast('Xarita kattalashtirildi', 'info');
}

function zoomOut() {
    map.zoomOut();
    showToast('Xarita kichiklashtirildi', 'info');
}

function centerMap() {
    map.setView([41.311, 69.240], 12);
    showToast('Xarita markazlashtirildi', 'info');
}

function showAllVehicles() {
    if (vehicleMarkers.length === 0) return;
    
    const bounds = L.latLngBounds(vehicleMarkers.map(m => m.getLatLng()));
    map.fitBounds(bounds);
    showToast('Barcha mashinalar ko\'rsatildi', 'info');
}

function filterMapMarkers(value) {
    // Remove all markers first
    mapMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    vehicleMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    // Add filtered markers
    if (value === 'all') {
        addBinMarkers();
        addVehicleMarkers();
        showToast('Barcha belgilar ko\'rsatildi', 'info');
    } else if (value === 'full') {
        const fullBins = binsData.filter(bin => bin.status >= 90);
        fullBins.forEach(bin => addSingleBinMarker(bin));
        showToast('To\'la qutilar ko\'rsatildi', 'warning');
    } else if (value === 'warning') {
        const warningBins = binsData.filter(bin => bin.status >= 70 && bin.status < 90);
        warningBins.forEach(bin => addSingleBinMarker(bin));
        showToast('Ogohlantirish qutilari ko\'rsatildi', 'warning');
    } else if (value === 'empty') {
        const emptyBins = binsData.filter(bin => bin.status < 30);
        emptyBins.forEach(bin => addSingleBinMarker(bin));
        showToast('Bo\'sh qutilar ko\'rsatildi', 'success');
    } else if (value === 'vehicles') {
        addVehicleMarkers();
        showAllVehicles();
    }
}

function addSingleBinMarker(bin) {
    const color = getStatusColor(bin.status);
    const icon = L.divIcon({
        html: `
            <div class="bin-marker" style="background: ${color};">
                <i class="fas fa-trash"></i>
            </div>
        `,
        className: 'custom-bin-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    const marker = L.marker(bin.location, { icon: icon })
        .addTo(map)
        .bindPopup(`Quti #${bin.id} - ${bin.status}%`);
    
    mapMarkers.push(marker);
}

// ===== CHARTS FUNCTIONS =====
function initCharts() {
    const ctx = document.getElementById('statusChart')?.getContext('2d');
    if (!ctx) return;
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bo\'sh (0-30%)', 'Yarim (30-70%)', 'Ogohlantirish (70-90%)', 'To\'la (90-100%)'],
            datasets: [{
                data: calculateStatusDistribution(),
                backgroundColor: [
                    '#10b981',
                    '#eab308',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 2,
                borderColor: 'var(--bg-card)',
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-primary)',
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} ta`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function calculateStatusDistribution() {
    const empty = binsData.filter(bin => bin.status < 30).length;
    const half = binsData.filter(bin => bin.status >= 30 && bin.status < 70).length;
    const warning = binsData.filter(bin => bin.status >= 70 && bin.status < 90).length;
    const full = binsData.filter(bin => bin.status >= 90).length;
    
    return [empty, half, warning, full];
}

function updateChartData(period) {
    if (!statusChart) return;
    
    // This would fetch new data based on period
    const newData = calculateStatusDistribution();
    statusChart.data.datasets[0].data = newData;
    statusChart.update();
    showToast(`${period} statistikasi yangilandi`, 'success');
}

function updateStatusChart() {
    if (statusChart) {
        statusChart.data.datasets[0].data = calculateStatusDistribution();
        statusChart.update();
    }
}

function renderMetrics() {
    // This function would update the metrics display
    const metrics = [
        { id: 'load', value: 65 },
        { id: 'online', value: 92 },
        { id: 'response', value: 2.4 },
        { id: 'success', value: 98 }
    ];
    
    metrics.forEach(metric => {
        const progress = document.querySelector(`[data-metric="${metric.id}"] .progress-fill`);
        if (progress) {
            progress.style.width = `${metric.value}%`;
            progress.style.animation = 'shimmer 2s infinite linear';
        }
    });
}

// ===== BINS MANAGEMENT =====
function renderBinsTable() {
    const container = document.getElementById('binsTableBody');
    if (!container) return;
    
    // Calculate pagination
    totalItems = binsData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = binsData.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    pageData.forEach((bin, index) => {
        const color = getStatusColor(bin.status);
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.05}s`;
        row.innerHTML = `
            <td>
                <input type="checkbox" class="bin-checkbox" data-id="${bin.id}">
            </td>
            <td>
                <strong style="color: ${color};">${bin.id}</strong>
            </td>
            <td>
                <div>${bin.address}</div>
                <small class="text-muted">${bin.district}</small>
            </td>
            <td>
                ${getStatusBadge(bin.status)}
                <div class="status-badge ${bin.online ? 'online' : 'offline'}">
                    <i class="fas fa-${bin.online ? 'wifi' : 'times-circle'}"></i>
                    ${bin.online ? 'Online' : 'Offline'}
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>${bin.status}%</span>
                    <div class="progress-bar" style="flex: 1;">
                        <div class="progress-fill" style="width: ${bin.status}%; background: ${color};"></div>
                    </div>
                </div>
            </td>
            <td>${bin.lastUpdate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="openBinDetail('${bin.id}')" title="Ko'rish">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="editBin('${bin.id}')" title="Tahrirlash">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deleteBin('${bin.id}')" title="O'chirish">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
    
    // Update pagination
    updatePagination(totalPages);
}

function searchBins() {
    const searchInput = document.getElementById('binsSearch');
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filter existing data
    const filtered = mockBins.filter(bin => 
        bin.id.toLowerCase().includes(searchTerm) ||
        bin.address.toLowerCase().includes(searchTerm) ||
        bin.district.toLowerCase().includes(searchTerm)
    );
    
    binsData = filtered;
    currentPage = 1;
    renderBinsTable();
}

function filterBins() {
    const statusFilter = document.getElementById('statusFilter').value;
    const areaFilter = document.getElementById('areaFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    let filtered = mockBins;
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(bin => {
            if (statusFilter === 'empty') return bin.status < 30;
            if (statusFilter === 'half') return bin.status >= 30 && bin.status < 70;
            if (statusFilter === 'warning') return bin.status >= 70 && bin.status < 90;
            if (statusFilter === 'full') return bin.status >= 90;
            return true;
        });
    }
    
    // Apply area filter
    if (areaFilter !== 'all') {
        filtered = filtered.filter(bin => bin.district === areaFilter);
    }
    
    // Apply time filter (simplified)
    if (timeFilter !== 'all') {
        // This would filter by last update time in real app
    }
    
    binsData = filtered;
    currentPage = 1;
    renderBinsTable();
}

function clearSearch() {
    document.getElementById('binsSearch').value = '';
    binsData = mockBins;
    renderBinsTable();
    showToast('Qidiruv tozalandi', 'info');
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.bin-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        checkbox.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            checkbox.style.animation = '';
        }, 300);
    });
}

function changePage(direction) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderBinsTable();
        
        // Update button states
        const prevBtn = document.querySelector('.pagination-btn:first-child');
        const nextBtn = document.querySelector('.pagination-btn:last-child');
        
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }
}

function updatePagination(totalPages) {
    const currentPageElement = document.getElementById('currentPage');
    const totalPagesElement = document.getElementById('totalPages');
    
    if (currentPageElement) {
        currentPageElement.textContent = currentPage;
        currentPageElement.style.animation = 'zoomInOut 0.5s ease';
        setTimeout(() => {
            currentPageElement.style.animation = '';
        }, 500);
    }
    
    if (totalPagesElement) {
        totalPagesElement.textContent = totalPages;
    }
}

function openAddBinModal() {
    const modal = document.getElementById('addBinModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div>
                <h2><i class="fas fa-trash-alt"></i> Yangi Quti Qo'shish</h2>
                <p>Yangi chiqindi qutisini tizimga qo'shish</p>
            </div>
            <button class="modal-close" onclick="closeModal('addBinModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="addBinForm" onsubmit="addNewBin(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="binId">Quti ID *</label>
                        <input type="text" id="binId" required placeholder="BIN-XXX" pattern="BIN-[A-Z0-9]{3}">
                        <small class="text-muted">Format: BIN-XXX (masalan: BIN-011)</small>
                    </div>
                    <div class="form-group">
                        <label for="binAddress">Manzil *</label>
                        <input type="text" id="binAddress" required placeholder="Manzil">
                    </div>
                    <div class="form-group">
                        <label for="binDistrict">Tuman *</label>
                        <select id="binDistrict" required>
                            <option value="">Tanlang</option>
                            <option value="yakkasaroy">Yakkasaroy</option>
                            <option value="yunusobod">Yunusobod</option>
                            <option value="mirzo">Mirzo Ulug'bek</option>
                            <option value="chilonzor">Chilonzor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="binCapacity">Sig'im (L) *</label>
                        <input type="number" id="binCapacity" required min="50" max="500" value="120">
                    </div>
                    <div class="form-group">
                        <label for="binType">Chiqindi turi</label>
                        <select id="binType">
                            <option value="general">Umumiy</option>
                            <option value="plastic">Plastik</option>
                            <option value="organic">Organik</option>
                            <option value="paper">Qog'oz</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="binLat">Kenglik</label>
                        <input type="number" id="binLat" step="0.0001" value="41.311" placeholder="41.311">
                    </div>
                    <div class="form-group">
                        <label for="binLng">Uzunlik</label>
                        <input type="number" id="binLng" step="0.0001" value="69.240" placeholder="69.240">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addBinModal')">Bekor qilish</button>
                    <button type="submit" class="btn btn-primary">Quti Qo'shish</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Add animation to form elements
    setTimeout(() => {
        const formGroups = modalContent.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.animationDelay = `${index * 0.1}s`;
            group.style.animation = 'slideInUp 0.5s ease';
        });
    }, 100);
}

function addNewBin(event) {
    event.preventDefault();
    
    const newBin = {
        id: document.getElementById('binId').value,
        address: document.getElementById('binAddress').value,
        district: document.getElementById('binDistrict').value,
        location: [
            parseFloat(document.getElementById('binLat').value) || 41.311,
            parseFloat(document.getElementById('binLng').value) || 69.240
        ],
        status: 0,
        lastUpdate: formatTime(new Date()),
        lastCleaned: formatDate(new Date()) + ' ' + formatTime(new Date()),
        capacity: parseInt(document.getElementById('binCapacity').value),
        type: document.getElementById('binType').value,
        sensorId: 'SENSOR-' + Math.floor(Math.random() * 1000),
        online: true,
        installDate: formatDate(new Date())
    };
    
    binsData.unshift(newBin);
    closeModal('addBinModal');
    
    showToast(`Yangi quti #${newBin.id} muvaffaqiyatli qo'shildi`, 'success');
    
    activityData.unshift({
        id: `ACT-${Date.now()}`,
        type: 'success',
        title: `Yangi quti qo'shildi`,
        description: `Quti #${newBin.id} tizimga qo'shildi`,
        time: formatTime(new Date()),
        location: newBin.district,
        binId: newBin.id
    });
    
    if (currentTab === 'dashboard') {
        renderDashboard();
        addSingleBinMarker(newBin);
    } else if (currentTab === 'bins') {
        renderBinsTable();
    }
    
    updateBadges();
}

function exportBinsData() {
    showToast('Ma\'lumotlar eksport qilinmoqda...', 'info');
    
    setTimeout(() => {
        const dataStr = JSON.stringify(binsData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `smart-trash-bins-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Ma\'lumotlar muvaffaqiyatli yuklandi', 'success');
    }, 1000);
}

function openBinDetail(binId) {
    const bin = binsData.find(b => b.id === binId);
    if (!bin) return;
    
    const modal = document.getElementById('binDetailModal');
    const modalContent = modal.querySelector('.modal-content');
    
    const color = getStatusColor(bin.status);
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div>
                <h2>Quti #${bin.id}</h2>
                <p>${bin.address}</p>
            </div>
            <button class="modal-close" onclick="closeModal('binDetailModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="modal-grid">
                <div class="modal-section">
                    <h3><i class="fas fa-info-circle"></i> Asosiy ma'lumotlar</h3>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div>
                                <p class="info-label">Manzil</p>
                                <p class="info-value">${bin.address}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--secondary);">
                                <i class="fas fa-layer-group"></i>
                            </div>
                            <div>
                                <p class="info-label">Tuman</p>
                                <p class="info-value">${bin.district}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                                <i class="fas fa-weight"></i>
                            </div>
                            <div>
                                <p class="info-label">Sig'im</p>
                                <p class="info-value">${bin.capacity}L</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
                                <i class="fas fa-trash"></i>
                            </div>
                            <div>
                                <p class="info-label">Chiqindi turi</p>
                                <p class="info-value">${bin.type}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-chart-line"></i> Holat ma'lumotlari</h3>
                    <div class="status-card">
                        <div class="status-header">
                            <span>To'lish darajasi</span>
                            <span class="status-percent" style="color: ${color};">${bin.status}%</span>
                        </div>
                        <div class="progress-bar" style="margin: 10px 0;">
                            <div class="progress-fill" style="width: ${bin.status}%; background: ${color};"></div>
                        </div>
                        <div class="status-details">
                            <div class="status-item">
                                <span>Holat:</span>
                                <strong>${getStatusText(bin.status)}</strong>
                            </div>
                            <div class="status-item">
                                <span>Sensor ID:</span>
                                <strong>${bin.sensorId}</strong>
                            </div>
                            <div class="status-item">
                                <span>O'rnatilgan sana:</span>
                                <strong>${bin.installDate}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-history"></i> So'nggi faoliyat</h3>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div>
                                <p class="info-label">Oxirgi yangilanish</p>
                                <p class="info-value">${bin.lastUpdate}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                                <i class="fas fa-broom"></i>
                            </div>
                            <div>
                                <p class="info-label">Oxirgi tozalash</p>
                                <p class="info-value">${bin.lastCleaned}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(${bin.online ? '16, 185, 129' : '239, 68, 68'}, 0.1); color: ${bin.online ? 'var(--success)' : 'var(--danger)'};">
                                <i class="fas fa-${bin.online ? 'wifi' : 'times-circle'}"></i>
                            </div>
                            <div>
                                <p class="info-label">Holat</p>
                                <p class="info-value" style="color: ${bin.online ? 'var(--success)' : 'var(--danger)'};">${bin.online ? 'Online' : 'Offline'}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(6, 182, 212, 0.1); color: var(--info);">
                                <i class="fas fa-map"></i>
                            </div>
                            <div>
                                <p class="info-label">Joylashuv</p>
                                <p class="info-value">${bin.location[0].toFixed(4)}, ${bin.location[1].toFixed(4)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal('binDetailModal')">Yopish</button>
                <button class="btn btn-primary" onclick="viewOnMap('${bin.id}')">
                    <i class="fas fa-map"></i> Xaritada ko'rish
                </button>
                <button class="btn btn-warning" onclick="editBin('${bin.id}')">
                    <i class="fas fa-edit"></i> Tahrirlash
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            modal.classList.remove('active');
            modal.style.animation = '';
        }, 300);
    }
}

function viewOnMap(binId) {
    const bin = binsData.find(b => b.id === binId);
    if (!bin) return;
    
    // Switch to dashboard tab
    document.querySelector('[data-tab="dashboard"]').click();
    
    // Center map on bin location
    setTimeout(() => {
        if (map) {
            map.setView(bin.location, 16);
            showToast(`Quti #${binId} xaritada ko'rsatildi`, 'info');
        }
    }, 500);
    
    closeModal('binDetailModal');
}

function editBin(binId) {
    const bin = binsData.find(b => b.id === binId);
    if (!bin) return;
    
    const modal = document.getElementById('addBinModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div>
                <h2><i class="fas fa-edit"></i> Qutini Tahrirlash</h2>
                <p>Quti #${bin.id} ma'lumotlarini tahrirlash</p>
            </div>
            <button class="modal-close" onclick="closeModal('addBinModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="editBinForm" onsubmit="updateBin(event, '${bin.id}')">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="editBinId">Quti ID</label>
                        <input type="text" id="editBinId" value="${bin.id}" disabled>
                    </div>
                    <div class="form-group">
                        <label for="editBinAddress">Manzil *</label>
                        <input type="text" id="editBinAddress" value="${bin.address}" required>
                    </div>
                    <div class="form-group">
                        <label for="editBinDistrict">Tuman *</label>
                        <select id="editBinDistrict" required>
                            <option value="yakkasaroy" ${bin.district === 'yakkasaroy' ? 'selected' : ''}>Yakkasaroy</option>
                            <option value="yunusobod" ${bin.district === 'yunusobod' ? 'selected' : ''}>Yunusobod</option>
                            <option value="mirzo" ${bin.district === 'mirzo' ? 'selected' : ''}>Mirzo Ulug'bek</option>
                            <option value="chilonzor" ${bin.district === 'chilonzor' ? 'selected' : ''}>Chilonzor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editBinCapacity">Sig'im (L) *</label>
                        <input type="number" id="editBinCapacity" value="${bin.capacity}" required min="50" max="500">
                    </div>
                    <div class="form-group">
                        <label for="editBinType">Chiqindi turi</label>
                        <select id="editBinType">
                            <option value="general" ${bin.type === 'general' ? 'selected' : ''}>Umumiy</option>
                            <option value="plastic" ${bin.type === 'plastic' ? 'selected' : ''}>Plastik</option>
                            <option value="organic" ${bin.type === 'organic' ? 'selected' : ''}>Organik</option>
                            <option value="paper" ${bin.type === 'paper' ? 'selected' : ''}>Qog'oz</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editBinStatus">To'lish darajasi (%)</label>
                        <input type="range" id="editBinStatus" min="0" max="100" value="${bin.status}" oninput="document.getElementById('statusValue').textContent = this.value + '%'">
                        <div class="status-display">
                            <span id="statusValue">${bin.status}%</span>
                            <div class="progress-bar" style="width: 100%;">
                                <div class="progress-fill" style="width: ${bin.status}%; background: ${getStatusColor(bin.status)};"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addBinModal')">Bekor qilish</button>
                    <button type="submit" class="btn btn-primary">Saqlash</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
}

function updateBin(event, binId) {
    event.preventDefault();
    
    const binIndex = binsData.findIndex(b => b.id === binId);
    if (binIndex === -1) return;
    
    binsData[binIndex] = {
        ...binsData[binIndex],
        address: document.getElementById('editBinAddress').value,
        district: document.getElementById('editBinDistrict').value,
        capacity: parseInt(document.getElementById('editBinCapacity').value),
        type: document.getElementById('editBinType').value,
        status: parseInt(document.getElementById('editBinStatus').value),
        lastUpdate: formatTime(new Date())
    };
    
    closeModal('addBinModal');
    showToast(`Quti #${binId} ma'lumotlari yangilandi`, 'success');
    
    if (currentTab === 'bins') {
        renderBinsTable();
    }
}

function deleteBin(binId) {
    if (confirm(`Quti #${binId} ni o'chirishni tasdiqlaysizmi?`)) {
        binsData = binsData.filter(b => b.id !== binId);
        showToast(`Quti #${binId} o'chirildi`, 'success');
        
        if (currentTab === 'bins') {
            renderBinsTable();
        }
        updateBadges();
    }
}

// ===== VEHICLES MANAGEMENT =====
function renderVehiclesGrid() {
    const container = document.getElementById('vehiclesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    vehiclesData.forEach((vehicle, index) => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'scaleIn 0.5s ease';
        card.innerHTML = `
            <div class="vehicle-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="vehicle-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div class="vehicle-info">
                        <div class="vehicle-title">${vehicle.id}</div>
                        <div class="vehicle-driver">${vehicle.driver}</div>
                        <div class="vehicle-meta">
                            <span><i class="fas fa-car"></i> ${vehicle.licensePlate}</span>
                            <span><i class="fas fa-phone"></i> ${vehicle.phone}</span>
                        </div>
                    </div>
                </div>
                <div class="vehicle-status ${vehicle.status}">
                    ${vehicle.status === 'moving' ? 'Harakatlanmoqda' : vehicle.status === 'active' ? 'Faol' : 'Band emas'}
                </div>
            </div>
            
            <div class="vehicle-stats">
                <div class="vehicle-stat">
                    <div class="stat-label">Bugun tozalandi</div>
                    <div class="stat-value">${vehicle.cleaned} ta</div>
                </div>
                <div class="vehicle-stat">
                    <div class="stat-label">Yoqilg'i</div>
                    <div class="stat-value">${vehicle.fuel}%</div>
                </div>
                <div class="vehicle-stat">
                    <div class="stat-label">Tezlik</div>
                    <div class="stat-value">${vehicle.speed} km/h</div>
                </div>
            </div>
            
            <div class="vehicle-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${vehicle.location}</span>
                <span class="text-muted">(${vehicle.coordinates[0].toFixed(4)}, ${vehicle.coordinates[1].toFixed(4)})</span>
            </div>
            
            <div class="vehicle-actions">
                <button class="btn-icon" onclick="trackVehicle('${vehicle.id}')" title="Kuzatish">
                    <i class="fas fa-map"></i>
                </button>
                <button class="btn-icon" onclick="viewVehicleDetails('${vehicle.id}')" title="Ko'rish">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="contactDriver('${vehicle.driver}', '${vehicle.phone}')" title="Aloqa">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="btn-icon" onclick="showVehicleRoute('${vehicle.id}')" title="Marshrut">
                    <i class="fas fa-route"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div>
                <h2><i class="fas fa-truck"></i> Yangi Mashina Qo'shish</h2>
                <p>Yangi chiqindi tashish mashinasini tizimga qo'shish</p>
            </div>
            <button class="modal-close" onclick="closeModal('addVehicleModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="addVehicleForm" onsubmit="addNewVehicle(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="vehicleId">Mashina ID *</label>
                        <input type="text" id="vehicleId" required placeholder="VH-XXX" pattern="VH-[A-Z0-9]{3}">
                        <small class="text-muted">Format: VH-XXX (masalan: VH-005)</small>
                    </div>
                    <div class="form-group">
                        <label for="vehicleDriver">Haydovchi *</label>
                        <input type="text" id="vehicleDriver" required placeholder="Ism Familiya">
                    </div>
                    <div class="form-group">
                        <label for="vehiclePhone">Telefon *</label>
                        <input type="tel" id="vehiclePhone" required placeholder="+998901234567" pattern="\+998[0-9]{9}">
                    </div>
                    <div class="form-group">
                        <label for="vehicleLicense">Davlat raqami *</label>
                        <input type="text" id="vehicleLicense" required placeholder="01A123AA">
                    </div>
                    <div class="form-group">
                        <label for="vehicleCapacity">Sig'im (L) *</label>
                        <input type="number" id="vehicleCapacity" required min="1000" max="10000" value="5000">
                    </div>
                    <div class="form-group">
                        <label for="vehicleRoute">Marshrut</label>
                        <select id="vehicleRoute">
                            <option value="Route A">Marshrut A</option>
                            <option value="Route B">Marshrut B</option>
                            <option value="Route C">Marshrut C</option>
                            <option value="Route D">Marshrut D</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="vehicleStatus">Holat</label>
                        <select id="vehicleStatus">
                            <option value="active">Faol</option>
                            <option value="moving">Harakatlanmoqda</option>
                            <option value="inactive">Band emas</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="vehicleFuel">Yoqilg'i (%)</label>
                        <input type="range" id="vehicleFuel" min="0" max="100" value="100" oninput="document.getElementById('fuelValue').textContent = this.value + '%'">
                        <div class="fuel-display">
                            <span id="fuelValue">100%</span>
                            <div class="progress-bar" style="width: 100%;">
                                <div class="progress-fill success" style="width: 100%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addVehicleModal')">Bekor qilish</button>
                    <button type="submit" class="btn btn-primary">Mashina Qo'shish</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
}

function addNewVehicle(event) {
    event.preventDefault();
    
    const newVehicle = {
        id: document.getElementById('vehicleId').value,
        driver: document.getElementById('vehicleDriver').value,
        phone: document.getElementById('vehiclePhone').value,
        licensePlate: document.getElementById('vehicleLicense').value,
        status: document.getElementById('vehicleStatus').value,
        cleaned: 0,
        location: 'Yangi manzil',
        coordinates: [41.311 + (Math.random() - 0.5) * 0.05, 69.240 + (Math.random() - 0.5) * 0.05],
        capacity: parseInt(document.getElementById('vehicleCapacity').value),
        fuel: parseInt(document.getElementById('vehicleFuel').value),
        speed: 0,
        route: document.getElementById('vehicleRoute').value,
        lastService: formatDate(new Date()),
        currentBins: []
    };
    
    vehiclesData.push(newVehicle);
    closeModal('addVehicleModal');
    
    showToast(`Yangi mashina #${newVehicle.id} muvaffaqiyatli qo'shildi`, 'success');
    
    if (currentTab === 'vehicles') {
        renderVehiclesGrid();
    }
    
    // Add to map if on dashboard
    if (currentTab === 'dashboard' && map) {
        addVehicleMarkers();
    }
    
    updateBadges();
}

function filterVehicles(filter) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filtered = [...mockVehicles];
    
    if (filter === 'active') {
        filtered = filtered.filter(v => v.status === 'active');
    } else if (filter === 'moving') {
        filtered = filtered.filter(v => v.status === 'moving');
    } else if (filter === 'inactive') {
        filtered = filtered.filter(v => v.status === 'inactive');
    }
    
    vehiclesData = filtered;
    renderVehiclesGrid();
    showToast(`${filter} mashinalar ko'rsatildi`, 'info');
}

function trackVehicle(vehicleId) {
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    if (vehicle && vehicle.coordinates) {
        // Switch to dashboard tab
        document.querySelector('[data-tab="dashboard"]').click();
        
        // Center map on vehicle location
        setTimeout(() => {
            if (map) {
                map.setView(vehicle.coordinates, 15);
                // Find and open marker popup
                const markerIndex = vehiclesData.findIndex(v => v.id === vehicleId);
                if (vehicleMarkers[markerIndex]) {
                    vehicleMarkers[markerIndex].openPopup();
                }
                showToast(`Mashina ${vehicleId} kuzatilmoqda`, 'info');
            }
        }, 500);
    }
}

function viewVehicleDetails(vehicleId) {
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const modal = document.getElementById('binDetailModal'); // Reuse modal
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <div>
                <h2><i class="fas fa-truck"></i> ${vehicle.id}</h2>
                <p>${vehicle.driver} • ${vehicle.licensePlate}</p>
            </div>
            <button class="modal-close" onclick="closeModal('binDetailModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="modal-grid">
                <div class="modal-section">
                    <h3><i class="fas fa-info-circle"></i> Asosiy ma'lumotlar</h3>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <p class="info-label">Haydovchi</p>
                                <p class="info-value">${vehicle.driver}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--secondary);">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div>
                                <p class="info-label">Telefon</p>
                                <p class="info-value">${vehicle.phone}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                                <i class="fas fa-car"></i>
                            </div>
                            <div>
                                <p class="info-label">Davlat raqami</p>
                                <p class="info-value">${vehicle.licensePlate}</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
                                <i class="fas fa-route"></i>
                            </div>
                            <div>
                                <p class="info-label">Marshrut</p>
                                <p class="info-value">${vehicle.route}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-chart-line"></i> Texnik holat</h3>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(${vehicle.fuel > 20 ? '16, 185, 129' : '239, 68, 68'}, 0.1); color: ${vehicle.fuel > 20 ? 'var(--success)' : 'var(--danger)'};">
                                <i class="fas fa-gas-pump"></i>
                            </div>
                            <div>
                                <p class="info-label">Yoqilg'i</p>
                                <p class="info-value" style="color: ${vehicle.fuel > 20 ? 'var(--success)' : 'var(--danger)'};">${vehicle.fuel}%</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">
                                <i class="fas fa-tachometer-alt"></i>
                            </div>
                            <div>
                                <p class="info-label">Tezlik</p>
                                <p class="info-value">${vehicle.speed} km/h</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                                <i class="fas fa-weight"></i>
                            </div>
                            <div>
                                <p class="info-label">Sig'im</p>
                                <p class="info-value">${vehicle.capacity}L</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon" style="background: rgba(6, 182, 212, 0.1); color: var(--info);">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <div>
                                <p class="info-label">Oxirgi texnik ko'rik</p>
                                <p class="info-value">${vehicle.lastService}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3><i class="fas fa-trash-alt"></i> Bugungi ish</h3>
                    <div class="bins-list">
                        <div class="bins-header">
                            <span>Tozalangan qutilar: <strong>${vehicle.cleaned} ta</strong></span>
                            <span class="text-muted">Joriy qutilar: ${vehicle.currentBins.length} ta</span>
                        </div>
                        <div class="bins-grid">
                            ${vehicle.currentBins.map(binId => `
                                <span class="bin-tag">
                                    <i class="fas fa-trash"></i>
                                    ${binId}
                                </span>
                            `).join('')}
                            ${vehicle.currentBins.length === 0 ? '<p class="text-muted">Hozircha qutilar yo\'q</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal('binDetailModal')">Yopish</button>
                <button class="btn btn-primary" onclick="trackVehicle('${vehicle.id}')">
                    <i class="fas fa-map"></i> Kuzatish
                </button>
                <button class="btn btn-warning" onclick="contactDriver('${vehicle.driver}', '${vehicle.phone}')">
                    <i class="fas fa-phone"></i> Qo'ng'iroq
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
}

function contactDriver(driverName, phoneNumber) {
    if (confirm(`${driverName} ga qo'ng'iroq qilishni tasdiqlaysizmi?\nTelefon: ${phoneNumber}`)) {
        showToast(`${driverName} ga qo'ng'iroq amalga oshirilmoqda...`, 'info');
        // In real app, this would initiate a phone call
    }
}

function showVehicleRoute(vehicleId) {
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // Switch to routes tab
    document.querySelector('[data-tab="routes"]').click();
    
    showToast(`${vehicle.id} marshruti ko'rsatilmoqda`, 'info');
}

function startVehicleMovement() {
    setInterval(() => {
        vehiclesData.forEach((vehicle, index) => {
            if (vehicle.status === 'moving' && vehicleMarkers[index]) {
                // Move vehicle slightly
                const latChange = (Math.random() - 0.5) * 0.0005;
                const lngChange = (Math.random() - 0.5) * 0.0005;
                const newLat = vehicle.coordinates[0] + latChange;
                const newLng = vehicle.coordinates[1] + lngChange;
                
                // Keep within Tashkent bounds
                vehicle.coordinates[0] = Math.max(41.20, Math.min(41.40, newLat));
                vehicle.coordinates[1] = Math.max(69.15, Math.min(69.35, newLng));
                
                // Update marker position smoothly
                vehicleMarkers[index].setLatLng(vehicle.coordinates);
                
                // Update fuel
                vehicle.fuel = Math.max(0, vehicle.fuel - 0.01);
                
                // Random speed changes
                vehicle.speed = 30 + Math.random() * 20;
                
                // Randomly clean bins
                if (Math.random() < 0.1 && vehicle.currentBins.length > 0) {
                    const cleanedBin = vehicle.currentBins.shift();
                    vehicle.cleaned++;
                    activityData.unshift({
                        id: `ACT-${Date.now()}`,
                        type: 'success',
                        title: `Quti tozalandi`,
                        description: `${vehicle.id} quti #${cleanedBin} ni tozaladi`,
                        time: formatTime(new Date()),
                        location: vehicle.location,
                        vehicleId: vehicle.id,
                        binId: cleanedBin
                    });
                    
                    // Update bin status
                    const bin = binsData.find(b => b.id === cleanedBin);
                    if (bin) {
                        bin.status = 0;
                        bin.lastCleaned = formatDate(new Date()) + ' ' + formatTime(new Date());
                    }
                }
                
                // Randomly pick up new bins
                if (Math.random() < 0.05 && vehicle.currentBins.length < 3) {
                    const availableBins = binsData.filter(b => b.status >= 70 && !vehicle.currentBins.includes(b.id));
                    if (availableBins.length > 0) {
                        const newBin = availableBins[Math.floor(Math.random() * availableBins.length)];
                        vehicle.currentBins.push(newBin.id);
                        activityData.unshift({
                            id: `ACT-${Date.now()}`,
                            type: 'info',
                            title: `Yangi quti qo'shildi`,
                            description: `${vehicle.id} quti #${newBin.id} ni qabul qildi`,
                            time: formatTime(new Date()),
                            location: newBin.address,
                            vehicleId: vehicle.id,
                            binId: newBin.id
                        });
                    }
                }
            }
        });
        
        // Update dashboard if active
        if (currentTab === 'dashboard') {
            updateDashboardData();
            updateStatusChart();
            renderActivityFeed();
            updateBadges();
        }
    }, 3000); // Update every 3 seconds
}

// ===== ROUTES FUNCTIONS =====
function renderRoutes() {
    const container = document.getElementById('routesContainer');
    if (!container) return;
    
    const routes = [
        {
            id: 'ROUTE-A',
            name: 'A Marshruti',
            driver: 'Alisher Karimov',
            vehicle: 'VH-001',
            progress: 65,
            bins: 24,
            collected: 1200,
            time: '3.5 soat',
            status: 'active',
            efficiency: 92,
            distance: '45 km',
            binList: ['BIN-001', 'BIN-002', 'BIN-003', 'BIN-004', 'BIN-005']
        },
        {
            id: 'ROUTE-B',
            name: 'B Marshruti',
            driver: 'Sardor Umarov',
            vehicle: 'VH-002',
            progress: 45,
            bins: 18,
            collected: 950,
            time: '2.5 soat',
            status: 'active',
            efficiency: 88,
            distance: '38 km',
            binList: ['BIN-006', 'BIN-007', 'BIN-008', 'BIN-009']
        },
        {
            id: 'ROUTE-C',
            name: 'C Marshruti',
            driver: 'Jasur Rahimov',
            vehicle: 'VH-003',
            progress: 100,
            bins: 15,
            collected: 800,
            time: 'Tugallandi',
            status: 'completed',
            efficiency: 85,
            distance: '32 km',
            binList: ['BIN-010', 'BIN-011', 'BIN-012']
        }
    ];
    
    container.innerHTML = '';
    
    routes.forEach((route, index) => {
        const card = document.createElement('div');
        card.className = 'route-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'slideInRight 0.5s ease';
        card.innerHTML = `
            <div class="route-header">
                <div class="route-info">
                    <div class="route-icon">
                        <i class="fas fa-route"></i>
                    </div>
                    <div class="route-details">
                        <div class="route-title">${route.name}</div>
                        <div class="route-meta">
                            <span><i class="fas fa-user"></i> ${route.driver}</span>
                            <span><i class="fas fa-truck"></i> ${route.vehicle}</span>
                            <span><i class="fas fa-clock"></i> ${route.time}</span>
                            <span><i class="fas fa-road"></i> ${route.distance}</span>
                        </div>
                    </div>
                </div>
                <div class="route-status ${route.status}">
                    ${route.status === 'active' ? 'Faol' : 'Tugallandi'}
                </div>
            </div>
            
            <div class="route-progress">
                <div class="progress-info">
                    <span>Marshrut bajarilishi</span>
                    <span>${route.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${route.progress}%;"></div>
                </div>
            </div>
            
            <div class="route-stats">
                <div class="route-stat">
                    <div class="stat-label">Qutilar</div>
                    <div class="stat-value">${route.bins}</div>
                </div>
                <div class="route-stat">
                    <div class="stat-label">Yig'ilgan</div>
                    <div class="stat-value">${route.collected}L</div>
                </div>
                <div class="route-stat">
                    <div class="stat-label">Samaradorlik</div>
                    <div class="stat-value">${route.efficiency}%</div>
                </div>
                <div class="route-stat">
                    <div class="stat-label">Qoldi</div>
                    <div class="stat-value">${route.bins - Math.floor(route.bins * route.progress / 100)}</div>
                </div>
            </div>
            
            <div class="route-bins">
                ${route.binList.map(bin => `
                    <span class="bin-tag ${Math.random() > 0.7 ? 'full' : Math.random() > 0.5 ? 'warning' : ''}">
                        ${bin}
                        ${Math.random() > 0.7 ? '<i class="fas fa-exclamation"></i>' : ''}
                    </span>
                `).join('')}
            </div>
            
            <div class="route-actions" style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn-icon" onclick="optimizeRoute('${route.id}')" title="Optimallashtirish">
                    <i class="fas fa-magic"></i>
                </button>
                <button class="btn-icon" onclick="viewRouteOnMap('${route.id}')" title="Xaritada ko'rish">
                    <i class="fas fa-map"></i>
                </button>
                <button class="btn-icon" onclick="assignNewBins('${route.id}')" title="Quti qo'shish">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    showToast('Marshrutlar yuklandi', 'success');
}

function optimizeRoute(routeId) {
    showToast(`${routeId} marshruti optimallashtirilmoqda...`, 'info');
    
    setTimeout(() => {
        const savings = Math.floor(Math.random() * 20) + 5;
        showToast(`${routeId} marshruti optimallashtirildi! ${savings}% vaqt tejandi`, 'success');
    }, 2000);
}

function viewRouteOnMap(routeId) {
    if (currentTab !== 'dashboard') {
        document.querySelector('[data-tab="dashboard"]').click();
        setTimeout(() => {
            centerMap();
            showToast(`${routeId} marshruti xaritada ko'rsatildi`, 'info');
        }, 300);
    } else {
        centerMap();
        showToast(`${routeId} marshruti xaritada ko'rsatildi`, 'info');
    }
}

function assignNewBins(routeId) {
    showToast(`${routeId} marshrutiga yangi qutilar qo'shilmoqda...`, 'info');
    
    setTimeout(() => {
        showToast('3 ta yangi quti marshrutga qo\'shildi', 'success');
    }, 1500);
}

function generateOptimizedRoutes() {
    showToast('Optimal marshrutlar generatsiya qilinmoqda...', 'info');
    
    setTimeout(() => {
        showToast('4 ta yangi optimal marshrut yaratildi', 'success');
        renderRoutes();
    }, 3000);
}

// ===== REPORTS FUNCTIONS =====
function renderReports() {
    const container = document.getElementById('reportsGrid');
    if (!container) return;
    
    const reports = {
        monthly: {
            totalCollected: 345000,
            binsServed: 21000,
            fuelUsed: 7200,
            efficiency: 85,
            change: '+8.7%',
            costSavings: 12500,
            co2Reduced: 45.2
        }
    };
    
    container.innerHTML = `
        <div class="content-card report-chart-card">
            <div class="card-header">
                <h3><i class="fas fa-chart-line"></i> Oylik To'plangan Chiqindilar</h3>
                <div class="card-actions">
                    <select class="chart-filter" onchange="changeReportPeriod(this.value)">
                        <option value="daily">Kunlik</option>
                        <option value="weekly">Haftalik</option>
                        <option value="monthly">Oylik</option>
                        <option value="yearly">Yillik</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <div class="chart-container-large">
                    <canvas id="reportsChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-tachometer-alt"></i> Samaradorlik Ko'rsatkichlari</h3>
            </div>
            <div class="card-body">
                <div class="metrics-grid">
                    <div class="metric-card success">
                        <div class="metric-header">
                            <div class="metric-title">Jami Yig'ilgan</div>
                            <i class="fas fa-trash"></i>
                        </div>
                        <div class="metric-value">${(reports.monthly.totalCollected / 1000).toFixed(1)} tonna</div>
                        <div class="metric-change change-up">
                            <i class="fas fa-arrow-up"></i> ${reports.monthly.change}
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Xizmat Ko'rsatilgan Qutilar</div>
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <div class="metric-value">${reports.monthly.binsServed.toLocaleString()}</div>
                        <div class="metric-change change-up">
                            <i class="fas fa-arrow-up"></i> +7.3%
                        </div>
                    </div>
                    
                    <div class="metric-card warning">
                        <div class="metric-header">
                            <div class="metric-title">Yoqilg'i Sarfi</div>
                            <i class="fas fa-gas-pump"></i>
                        </div>
                        <div class="metric-value">${reports.monthly.fuelUsed} L</div>
                        <div class="metric-change change-down">
                            <i class="fas fa-arrow-down"></i> -3.2%
                        </div>
                    </div>
                    
                    <div class="metric-card success">
                        <div class="metric-header">
                            <div class="metric-title">Samaradorlik</div>
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-value">${reports.monthly.efficiency}%</div>
                        <div class="metric-change change-up">
                            <i class="fas fa-arrow-up"></i> +2.5%
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-award"></i> Qo'shimcha Ko'rsatkichlar</h3>
            </div>
            <div class="card-body">
                <div class="metrics-grid">
                    <div class="metric-card info">
                        <div class="metric-header">
                            <div class="metric-title">Tejalgan Mablag'</div>
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="metric-value">$${reports.monthly.costSavings.toLocaleString()}</div>
                        <div class="metric-change change-up">
                            <i class="fas fa-arrow-up"></i> +12.1%
                        </div>
                    </div>
                    
                    <div class="metric-card success">
                        <div class="metric-header">
                            <div class="metric-title">Kamaytirilgan CO₂</div>
                            <i class="fas fa-leaf"></i>
                        </div>
                        <div class="metric-value">${reports.monthly.co2Reduced} tonna</div>
                        <div class="metric-change change-up">
                            <i class="fas fa-arrow-up"></i> +5.8%
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-award"></i> Eng Yaxshi Ko'rsatkichlar</h3>
            </div>
            <div class="card-body">
                <div class="leaderboard">
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank">1</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">Alisher Karimov</div>
                            <div class="leaderboard-details">VH-001 • 142 ta quti • 98.5% samaradorlik</div>
                        </div>
                        <div class="leaderboard-score">98.5%</div>
                    </div>
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank">2</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">Sardor Umarov</div>
                            <div class="leaderboard-details">VH-002 • 128 ta quti • 96.2% samaradorlik</div>
                        </div>
                        <div class="leaderboard-score">96.2%</div>
                    </div>
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank">3</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">Jasur Rahimov</div>
                            <div class="leaderboard-details">VH-003 • 118 ta quti • 94.7% samaradorlik</div>
                        </div>
                        <div class="leaderboard-score">94.7%</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    initReportsChart();
    
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            periodButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            changeReportPeriod(this.textContent.toLowerCase());
        });
    });
    
    showToast('Hisobotlar yuklandi', 'success');
}

function initReportsChart() {
    const ctx = document.getElementById('reportsChart')?.getContext('2d');
    if (!ctx) return;
    
    reportsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1-Hafta', '2-Hafta', '3-Hafta', '4-Hafta', '5-Hafta'],
            datasets: [{
                label: 'To\'plangan Chiqindilar (tonna)',
                data: [75, 82, 78, 90, 95],
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            },
            {
                label: 'Xizmat ko\'rsatilgan qutilar',
                data: [4200, 4500, 4300, 4800, 5000],
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'var(--text-primary)',
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'var(--bg-card)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function changeReportPeriod(period) {
    showToast(`${period} hisobotlari yangilanmoqda...`, 'info');
    
    setTimeout(() => {
        renderReports();
    }, 500);
}

// ===== ALERTS FUNCTIONS =====
function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="alert-filters">
            <span>Filtr:</span>
            <span class="filter-badge active" onclick="filterAlerts('all')">Hammasi</span>
            <span class="filter-badge" onclick="filterAlerts('unread')">O'qilmagan</span>
            <span class="filter-badge" onclick="filterAlerts('danger')">Jiddiy</span>
            <span class="filter-badge" onclick="filterAlerts('warning')">Ogohlantirish</span>
            <span class="filter-badge" onclick="filterAlerts('info')">Axborot</span>
        </div>
        
        <div id="alertsList">
            ${alertsData.map((alert, index) => `
                <div class="alert-item ${alert.read ? '' : 'unread'}" data-type="${alert.type}" style="animation-delay: ${index * 0.05}s;">
                    <div class="alert-icon ${alert.type}">
                        <i class="fas fa-${alert.type === 'danger' ? 'exclamation-circle' : alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${alert.location}</span>
                            <span><i class="fas fa-clock"></i> ${alert.time}</span>
                            <span class="priority-badge ${alert.priority}">${alert.priority === 'high' ? 'Yuqori' : alert.priority === 'medium' ? 'O\'rta' : 'Past'}</span>
                        </div>
                    </div>
                    <div class="alert-actions">
                        <button class="btn-icon" onclick="markAlertAsRead('${alert.id}')" title="O'qildi deb belgilash">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon" onclick="resolveAlert('${alert.id}')" title="Hal qilish">
                            <i class="fas fa-check-double"></i>
                        </button>
                        <button class="btn-icon danger" onclick="deleteAlert('${alert.id}')" title="O'chirish">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="alerts-footer" style="padding: var(--space-lg); text-align: center; border-top: 1px solid var(--border-color);">
            <button class="btn btn-primary" onclick="acknowledgeAllAlerts()">
                <i class="fas fa-check-double"></i> Barchasini tasdiqlash
            </button>
            <button class="btn btn-secondary" onclick="markAllAsRead()" style="margin-left: 10px;">
                <i class="fas fa-check"></i> Barchasini o'qildi deb belgilash
            </button>
        </div>
    `;
    
    showToast('Ogohlantirishlar yuklandi', 'success');
}

function filterAlerts(type) {
    const alerts = document.querySelectorAll('.alert-item');
    const filters = document.querySelectorAll('.filter-badge');
    
    filters.forEach(filter => filter.classList.remove('active'));
    event.target.classList.add('active');
    
    alerts.forEach(alert => {
        if (type === 'all') {
            alert.style.display = 'flex';
        } else if (type === 'unread') {
            alert.style.display = alert.classList.contains('unread') ? 'flex' : 'none';
        } else {
            alert.style.display = alert.dataset.type === type ? 'flex' : 'none';
        }
    });
}

function markAlertAsRead(alertId) {
    const alert = alertsData.find(a => a.id === alertId);
    if (alert) {
        alert.read = true;
        
        const alertElement = document.querySelector(`[onclick*="${alertId}"]`)?.closest('.alert-item');
        if (alertElement) {
            alertElement.classList.remove('unread');
            alertElement.querySelector('.alert-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
            alertElement.querySelector('.alert-icon').className = 'alert-icon success';
            alertElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                alertElement.style.animation = 'fadeIn 0.3s ease';
            }, 300);
        }
        
        updateBadges();
        showToast('Ogohlantirish o\'qildi deb belgilandi', 'success');
    }
}

function resolveAlert(alertId) {
    if (confirm('Bu ogohlantirishni hal qilganingizni tasdiqlaysizmi?')) {
        const alertElement = document.querySelector(`[onclick*="${alertId}"]`)?.closest('.alert-item');
        if (alertElement) {
            alertElement.style.opacity = '0.5';
            alertElement.querySelector('.alert-actions').innerHTML = `
                <span class="badge success" style="padding: 5px 10px;">
                    <i class="fas fa-check"></i> Hal qilindi
                </span>
            `;
            alertElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                alertElement.style.animation = '';
            }, 300);
        }
        
        // Remove from data
        alertsData = alertsData.filter(a => a.id !== alertId);
        updateBadges();
        showToast('Ogohlantirish hal qilindi', 'success');
    }
}

function deleteAlert(alertId) {
    if (confirm('Bu ogohlantirishni o\'chirishni tasdiqlaysizmi?')) {
        alertsData = alertsData.filter(a => a.id !== alertId);
        renderAlerts();
        updateBadges();
        showToast('Ogohlantirish o\'chirildi', 'success');
    }
}

function acknowledgeAllAlerts() {
    const unreadAlerts = alertsData.filter(a => !a.read);
    unreadAlerts.forEach(alert => {
        markAlertAsRead(alert.id);
    });
    showToast('Barcha ogohlantirishlar tasdiqlandi', 'success');
}

function markAllAsRead() {
    alertsData.forEach(alert => {
        alert.read = true;
    });
    renderAlerts();
    updateBadges();
    showToast('Barcha ogohlantirishlar o\'qildi deb belgilandi', 'success');
}

function clearAllAlerts() {
    if (confirm('Barcha ogohlantirishlarni o\'chirishni tasdiqlaysizmi?')) {
        alertsData = [];
        renderAlerts();
        updateBadges();
        showToast('Barcha ogohlantirishlar o\'chirildi', 'success');
    }
}

// ===== SETTINGS FUNCTIONS =====
function renderSettings() {
    const container = document.getElementById('settingsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="settings-tabs">
            <button class="settings-tab active" onclick="switchSettingsTab('general')">
                <i class="fas fa-cog"></i> Umumiy
            </button>
            <button class="settings-tab" onclick="switchSettingsTab('notifications')">
                <i class="fas fa-bell"></i> Bildirishnomalar
            </button>
            <button class="settings-tab" onclick="switchSettingsTab('appearance')">
                <i class="fas fa-palette"></i> Ko'rinish
            </button>
            <button class="settings-tab" onclick="switchSettingsTab('security')">
                <i class="fas fa-shield-alt"></i> Xavfsizlik
            </button>
            <button class="settings-tab" onclick="switchSettingsTab('api')">
                <i class="fas fa-code"></i> API
            </button>
        </div>
        
        <div class="settings-content">
            <div id="generalSettings" class="settings-tab-content active">
                <div class="settings-section">
                    <h3><i class="fas fa-sliders-h"></i> Tizim Sozlamalari</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Avtomatik yangilash</div>
                                <label class="switch">
                                    <input type="checkbox" id="autoUpdate" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Har 5 daqiqada ma'lumotlarni avtomatik yangilash
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Real-vaqt monitoringi</div>
                                <label class="switch">
                                    <input type="checkbox" id="realtimeMonitoring" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Qutilarni real vaqtda monitoring qilish
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Avtomatik marshrutlash</div>
                                <label class="switch">
                                    <input type="checkbox" id="autoRouting" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Qutilarga avtomatik optimal marshrut yaratish
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Ovozli ogohlantirishlar</div>
                                <label class="switch">
                                    <input type="checkbox" id="voiceAlerts">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Muhim ogohlantirishlar uchun ovozli xabarlar
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="notificationsSettings" class="settings-tab-content">
                <div class="settings-section">
                    <h3><i class="fas fa-bell"></i> Bildirishnoma Sozlamalari</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Push-bildirishnomalar</div>
                                <label class="switch">
                                    <input type="checkbox" id="pushNotifications" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Veb-brauzer orqali push-bildirishnomalar olish
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Email ogohlantirishlar</div>
                                <label class="switch">
                                    <input type="checkbox" id="emailAlerts" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Muhim ogohlantirishlarni email orqali olish
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">SMS ogohlantirishlar</div>
                                <label class="switch">
                                    <input type="checkbox" id="smsAlerts">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Jiddiy ogohlantirishlar uchun SMS xabarlar
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="appearanceSettings" class="settings-tab-content">
                <div class="settings-section">
                    <h3><i class="fas fa-palette"></i> Ko'rinish Sozlamalari</h3>
                    <div class="setting-item">
                        <div class="setting-description">
                            Tizimning tashqi ko'rinishini sozlang
                        </div>
                        <div class="setting-actions">
                            <button class="btn btn-primary" onclick="openThemeSettings()">
                                <i class="fas fa-paint-brush"></i> Mavzuni o'zgartirish
                            </button>
                            <button class="btn btn-secondary" onclick="resetAppearance()" style="margin-left: 10px;">
                                <i class="fas fa-undo"></i> Asl holatga qaytarish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="securitySettings" class="settings-tab-content">
                <div class="settings-section">
                    <h3><i class="fas fa-shield-alt"></i> Kirish Nazorati</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Avtomatik chiqish</div>
                                <label class="switch">
                                    <input type="checkbox" id="autoLogout" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Faolsizlikdan 30 daqiqa o'tgach avtomatik chiqish
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Ikki faktorli autentifikatsiya</div>
                                <label class="switch">
                                    <input type="checkbox" id="twoFactorAuth">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-description">
                                Kirish uchun qo'shimcha xavfsizlik himoyasi
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-header">
                                <div class="setting-title">Faol sessiyalar</div>
                                <button class="btn btn-secondary" onclick="viewActiveSessions()">
                                    <i class="fas fa-eye"></i> Ko'rish
                                </button>
                            </div>
                            <div class="setting-description">
                                Faol kirish sessiyalarini ko'rish va boshqarish
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="apiSettings" class="settings-tab-content">
                <div class="settings-section">
                    <h3><i class="fas fa-code"></i> API Sozlamalari</h3>
                    <div class="setting-item">
                        <div class="setting-description">
                            API kalitlari va integratsiya sozlamalari
                        </div>
                        <div class="setting-actions">
                            <button class="btn btn-primary" onclick="generateApiKey()">
                                <i class="fas fa-key"></i> Yangi API kaliti yaratish
                            </button>
                            <button class="btn btn-secondary" onclick="viewApiDocumentation()" style="margin-left: 10px;">
                                <i class="fas fa-book"></i> Hujjatlar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load saved settings
    loadSettings();
    
    showToast('Sozlamalar yuklandi', 'success');
}

function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.animation = '';
    });
    
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.animation = '';
    });
    
    event.target.classList.add('active');
    event.target.style.animation = 'pulse 0.5s ease';
    
    const targetContent = document.getElementById(tabName + 'Settings');
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.animation = 'slideInUp 0.5s ease';
    }
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    
    // Set switch states
    const switches = ['autoUpdate', 'realtimeMonitoring', 'autoRouting', 'voiceAlerts', 
                     'pushNotifications', 'emailAlerts', 'smsAlerts', 'autoLogout', 'twoFactorAuth'];
    
    switches.forEach(setting => {
        const input = document.getElementById(setting);
        if (input) {
            input.checked = settings[setting] !== false;
        }
    });
    
    // Add change listeners
    switches.forEach(setting => {
        const input = document.getElementById(setting);
        if (input) {
            input.addEventListener('change', function() {
                toggleSetting(setting, this.checked);
            });
        }
    });
}

function toggleSetting(settingName, enabled) {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings[settingName] = enabled;
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    showToast(`Sozlama "${settingName}" ${enabled ? 'yoqildi' : 'o\'chirildi'}`, 'success');
}

function openThemeSettings() {
    const modal = document.getElementById('themeSettingsModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2><i class="fas fa-palette"></i> Mavzu Sozlamalari</h2>
            <button class="modal-close" onclick="closeModal('themeSettingsModal')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="theme-options">
                <h3>Asosiy Mavzu</h3>
                <div class="theme-grid">
                    <div class="theme-card ${currentTheme === 'light' ? 'active' : ''}" onclick="changeTheme('light')">
                        <div class="theme-preview light-theme">
                            <div class="preview-header"></div>
                            <div class="preview-sidebar"></div>
                            <div class="preview-content"></div>
                        </div>
                        <div class="theme-name">Oq Mavzu</div>
                    </div>
                    <div class="theme-card ${currentTheme === 'dark' ? 'active' : ''}" onclick="changeTheme('dark')">
                        <div class="theme-preview dark-theme">
                            <div class="preview-header"></div>
                            <div class="preview-sidebar"></div>
                            <div class="preview-content"></div>
                        </div>
                        <div class="theme-name">Qora Mavzu</div>
                    </div>
                    <div class="theme-card ${currentTheme === 'blue' ? 'active' : ''}" onclick="changeTheme('blue')">
                        <div class="theme-preview blue-theme">
                            <div class="preview-header"></div>
                            <div class="preview-sidebar"></div>
                            <div class="preview-content"></div>
                        </div>
                        <div class="theme-name">Ko'k Mavzu</div>
                    </div>
                    <div class="theme-card ${currentTheme === 'green' ? 'active' : ''}" onclick="changeTheme('green')">
                        <div class="theme-preview green-theme">
                            <div class="preview-header"></div>
                            <div class="preview-sidebar"></div>
                            <div class="preview-content"></div>
                        </div>
                        <div class="theme-name">Yashil Mavzu</div>
                    </div>
                </div>
                
                <h3 style="margin-top: 30px;">Orqa Fon</h3>
                <div class="background-options">
                    <div class="bg-option ${document.body.classList.contains('pattern-bg') ? '' : document.body.classList.contains('gradient-bg') ? '' : 'active'}" onclick="setBackground('none')">
                        <div class="bg-preview no-bg"></div>
                        <span>Oddiy</span>
                    </div>
                    <div class="bg-option ${document.body.classList.contains('gradient-bg') ? 'active' : ''}" onclick="setBackground('gradient')">
                        <div class="bg-preview gradient-bg"></div>
                        <span>Gradient</span>
                    </div>
                    <div class="bg-option ${document.body.classList.contains('pattern-bg') ? 'active' : ''}" onclick="setBackground('pattern')">
                        <div class="bg-preview pattern-bg"></div>
                        <span>Pattern</span>
                    </div>
                </div>
                
                <div class="form-actions" style="margin-top: 30px;">
                    <button class="btn btn-secondary" onclick="closeModal('themeSettingsModal')">Yopish</button>
                    <button class="btn btn-primary" onclick="applyThemeSettings()">
                        <i class="fas fa-check"></i> Saqlash
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.animation = 'fadeIn 0.3s ease';
}

function setBackground(type) {
    document.body.classList.remove('gradient-bg', 'pattern-bg');
    if (type !== 'none') {
        document.body.classList.add(type + '-bg');
    }
    
    // Update active state
    document.querySelectorAll('.bg-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.bg-option').classList.add('active');
}

function applyThemeSettings() {
    localStorage.setItem('background', document.body.classList.contains('gradient-bg') ? 'gradient' : 
                       document.body.classList.contains('pattern-bg') ? 'pattern' : 'none');
    
    closeModal('themeSettingsModal');
    showToast('Ko\'rinish sozlamalari saqlandi', 'success');
}

function resetAppearance() {
    changeTheme('light');
    document.body.classList.remove('gradient-bg', 'pattern-bg');
    localStorage.removeItem('background');
    showToast('Ko\'rinish asl holatiga qaytarildi', 'success');
}

function generateApiKey() {
    const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    showToast(`Yangi API kaliti yaratildi: ${apiKey.substring(0, 20)}...`, 'success');
    
    // In real app, this would save the API key and show it in a secure way
    setTimeout(() => {
        alert(`Yangi API kaliti:\n\n${apiKey}\n\nIltimos, bu kalitni xavfsiz joyda saqlang!`);
    }, 500);
}

function viewApiDocumentation() {
    showToast('API hujjatlari ochilmoqda...', 'info');
    // In real app, this would open API documentation
}

function viewActiveSessions() {
    showToast('Faol sessiyalar ko\'rsatilmoqda...', 'info');
    // In real app, this would show active sessions
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Tizimdan chiqishni tasdiqlaysizmi?')) {
        showToast('Chiqish amalga oshirilmoqda...', 'info');
        
        // Add animation
        document.body.style.animation = 'fadeOut 0.5s ease';
        
        setTimeout(() => {
            // In real app, this would clear session and redirect
            document.body.innerHTML = `
                <div class="logout-screen" style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; animation: fadeIn 0.5s ease;">
                    <div style="animation: scaleIn 0.5s ease;">
                        <h1 style="font-size: 3rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite;">👋</h1>
                        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Muvaffaqiyatli chiqdingiz!</h2>
                        <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.8;">Smart Trash System Admin Panel</p>
                        <div style="margin-top: 2rem;">
                            <button onclick="location.reload()" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; animation: pulse 2s infinite;">
                                <i class="fas fa-sign-in-alt"></i> Qayta kirish
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }, 1000);
    }
}

// ===== REAL-TIME UPDATES =====
function startRealTimeUpdates() {
    // Simulate real-time updates
    setInterval(() => {
        simulateRealTimeChanges();
    }, 30000); // Every 30 seconds
}

function simulateRealTimeChanges() {
    // Randomly update some bin statuses
    binsData.forEach(bin => {
        if (Math.random() > 0.7) { // 30% chance to update
            const change = Math.random() * 5; // 0-5% change
            bin.status = Math.max(0, Math.min(100, bin.status + change));
            bin.lastUpdate = formatTime(new Date());
            
            // Add to activity feed if significant change
            if (change > 2) {
                activityData.unshift({
                    id: `ACT-${Date.now()}`,
                    type: bin.status >= 90 ? 'danger' : bin.status >= 70 ? 'warning' : 'info',
                    title: `Quti #${bin.id} yangilandi`,
                    description: `${bin.status}% ga o'zgardi`,
                    time: bin.lastUpdate,
                    location: bin.district,
                    binId: bin.id
                });
                
                // Keep only last 10 activities
                if (activityData.length > 10) {
                    activityData.pop();
                }
                
                // Generate alert if bin is full
                if (bin.status >= 90 && Math.random() > 0.8) {
                    alertsData.unshift({
                        id: `ALERT-${Date.now()}`,
                        type: 'danger',
                        title: `Quti #${bin.id} to'lib ketdi!`,
                        message: `${bin.status}% to'ldi. Darhol harakat talab qilinadi!`,
                        time: 'Hozir',
                        location: bin.address,
                        read: false,
                        priority: 'high'
                    });
                }
            }
        }
    });
    
    // Update dashboard if active
    if (currentTab === 'dashboard') {
        updateDashboardData();
        updateStatusChart();
        renderActivityFeed();
        updateBadges();
    }
}

// ===== ADDITIONAL STYLES =====
const additionalStyles = `
    .logout-screen {
        animation: fadeIn 0.5s ease !important;
    }
    
    .logout-screen h1 {
        animation: float 3s ease-in-out infinite !important;
    }
    
    .logout-screen button {
        animation: pulse 2s infinite !important;
    }
    
    .vehicle-meta {
        display: flex;
        gap: 10px;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 4px;
    }
    
    .priority-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .priority-badge.high {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
    }
    
    .priority-badge.medium {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
    }
    
    .priority-badge.low {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
    }
    
    .bins-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    
    .bins-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .fuel-display, .status-display {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;

// Add additional styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize all settings
window.addEventListener('load', function() {
    // Add CSS for fadeOut animation
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }';
    document.head.appendChild(fadeOutStyle);
});