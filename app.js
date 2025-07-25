// AI Smart Routing - Main Application Logic

// Constants
const TODAY = "2025-07-22";
const TOMORROW = "2025-07-23";

// Global variables
let map = null;
let routeLayers = [];
let currentTab = 'current';
let baselineKpi = null;
let currentKpi = null;
let currentRoutes = [];
let riskList = [];
let selectedCourier = "A";
let courierMeta = {};
let trafficProfile = {};
let isTimelineOpen = false;
let activeDates = new Set([TODAY]);
let aiOptimizedStops = new Set(); // Track stops optimized by AI
let selectedDate = TODAY; // Track which date is currently selected for viewing
let markerLayers = {}; // To hold map marker layers for interaction

const demoRoutes = [
    {
        courierId: 'A',
        name: 'Courier A',
        color: '#ef4444', // Red
        depot: { id: 'A-depot', lat: 38.722, lon: -9.143, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'A-1', lat: 38.730, lon: -9.144, time: "08:25", address: "Av. da Liberdade 245" },
            { id: 'A-2', lat: 38.734, lon: -9.143, time: "08:55", address: "Rua Prata 78" },
            { id: 'A-3', lat: 38.728, lon: -9.142, time: "09:20", address: "Praça do Comércio 88" },
            { id: 'A-4', lat: 38.732, lon: -9.141, time: "09:45", address: "Rua Augusta 210" },
        ],
        end_time: "10:15"
    },
    {
        courierId: 'B',
        name: 'Courier B',
        color: '#3b82f6', // Blue
        depot: { id: 'B-depot', lat: 38.714, lon: -9.144, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'B-1', lat: 38.715, lon: -9.140, time: "08:30", address: "Largo do Chiado 14" },
            { id: 'B-2', lat: 38.717, lon: -9.142, time: "08:50", address: "Rua do Carmo 42" },
            { id: 'B-3', lat: 38.719, lon: -9.146, time: "09:15", address: "Av. Almirante Reis 567" },
            { id: 'B-4', lat: 38.716, lon: -9.148, time: "09:40", address: "Rua Garrett 120" },
            { id: 'B-5', lat: 38.714, lon: -9.150, time: "10:05", address: "Rua da Prata 78" },
        ],
        end_time: "10:30"
    },
    {
        courierId: 'C',
        name: 'Courier C',
        color: '#10b981', // Green
        depot: { id: 'C-depot', lat: 38.725, lon: -9.128, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'C-1', lat: 38.730, lon: -9.131, time: "08:25", address: "Rua Augusta 210" },
            { id: 'C-2', lat: 38.728, lon: -9.132, time: "08:45", address: "Praça do Comércio 88" },
            { id: 'C-3', lat: 38.727, lon: -9.137, time: "09:10", address: "Largo do Chiado 14" },
            { id: 'C-4', lat: 38.729, lon: -9.134, time: "09:35", address: "Rua do Carmo 42" },
        ],
        end_time: "10:00"
    }
];

const optimizedRoutes = [
    { // Red route - optimized
        courierId: 'A',
        name: 'Courier A',
        color: '#ef4444',
        depot: { id: 'A-depot-opt', lat: 38.722, lon: -9.143, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'A-1-opt', lat: 38.733, lon: -9.142, time: "08:25", address: "Av. da Liberdade / R. Prata" }, // Merged
            { id: 'A-2-opt', lat: 38.728, lon: -9.142, time: "08:45", address: "Praça Augusta" }, // Merged
        ],
        end_time: "09:10"
    },
    { // Blue route - optimized
        courierId: 'B',
        name: 'Courier B',
        color: '#3b82f6',
        depot: { id: 'B-depot-opt', lat: 38.714, lon: -9.144, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'B-1-opt', lat: 38.716, lon: -9.141, time: "08:30", address: "Largo do Chiado / R. do Carmo" },
            { id: 'B-2-opt', lat: 38.718, lon: -9.147, time: "08:55", address: "Av. Almirante Reis / R. da Prata" },
        ],
        end_time: "09:20"
    },
    { // Green route - optimized
        courierId: 'C',
        name: 'Courier C',
        color: '#10b981',
        depot: { id: 'C-depot-opt', lat: 38.725, lon: -9.128, time: "08:10", address: "Warehouse" },
        stops: [
            { id: 'C-1-opt', lat: 38.7295, lon: -9.132, time: "08:25", address: "R. Augusta / P. do Comércio" },
            { id: 'C-2-opt', lat: 38.727, lon: -9.137, time: "08:45", address: "Largo do Chiado / R. do Carmo" },
        ],
        end_time: "09:05"
    }
];

// Route colors
const routeColors = {
    'A': '#ef4444',
    'B': '#3b82f6', 
    'C': '#10b981'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Start demo button
    document.getElementById('signInBtn').addEventListener('click', startDemo);
    
    // Tab buttons
    document.getElementById('currentRoutesTab').addEventListener('click', () => switchTab('current'));
    document.getElementById('aiOptimisedTab').addEventListener('click', () => switchTab('ai'));
    
    // Timeline controls
    document.getElementById('showTimelineBtn').addEventListener('click', toggleTimeline);
    document.getElementById('closeTimelineBtn').addEventListener('click', toggleTimeline);
    document.getElementById('courierSelect').addEventListener('change', (e) => {
        selectedCourier = e.target.value;
        buildTimeline(selectedCourier);
    });
    
    // Risk modal controls
    document.getElementById('closeRiskModal').addEventListener('click', closeRiskModal);
    document.querySelector('.risk-modal-backdrop').addEventListener('click', closeRiskModal);
    
    // Summary modal controls
    document.getElementById('closeSummaryModal').addEventListener('click', closeSummaryModal);
    
    // Show all dates button
    document.getElementById('showAllDatesBtn').addEventListener('click', () => {
        selectedDate = null;
        drawRoutes(currentRoutes);
        
        // Remove selection from all date headers
        document.querySelectorAll('.timeline-date').forEach(el => el.classList.remove('selected'));
    });
    
    // Download PDF button
    document.getElementById('downloadPdf').addEventListener('click', downloadPDF);
}

// Utility function to load JSON data
async function loadJSON(name) {
    try {
        console.log(`Loading ${name}...`);
        const response = await fetch(`data/${name}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Successfully loaded ${name}:`, data);
        return data;
    } catch (error) {
        console.error(`Error loading ${name}:`, error);
        return getFallbackData(name);
    }
}

// Fallback data for when CORS blocks file loading
function getFallbackData(name) {
    const fallbackData = {
        'timeline_meta.json': {
            "couriers": [
                {"id": "A", "name": "Courier A", "color": "#ef4444"},
                {"id": "B", "name": "Courier B", "color": "#3b82f6"},
                {"id": "C", "name": "Courier C", "color": "#10b981"}
            ]
        },
        'traffic_profile.json': {
            "baseline": {"8": 30, "9": 35, "10": 40, "11": 42, "12": 38},
            "demand_plus_20": {"8": 25, "9": 28, "10": 32, "11": 35, "12": 30}
        }
    };
    
    return fallbackData[name] || null;
}

// Show loading spinner
function showLoading(text = 'Loading...') {
    const spinner = document.getElementById('loadingSpinner');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    spinner.classList.remove('hidden');
    document.body.classList.add('cursor-progress');
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.add('hidden');
    document.body.classList.remove('cursor-progress');
}

// Initialize Leaflet map
function initMap() {
    try {
        console.log('Initializing map...');
        map = L.map('map').setView([38.7223, -9.1393], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Draw demo routes on the map
function drawDemoRoutes() {
    // Clear existing routes
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    markerLayers = {};

    demoRoutes.forEach(route => {
        // Create a path that starts at the depot, goes through stops, and returns to the depot
        const path = [route.depot, ...route.stops, route.depot];
        const polyline = stopsToPolyline(path);
        
        const routeLine = L.polyline(polyline, {
            color: route.color,
            weight: 4,
            opacity: 0.8,
        }).addTo(map);

        // Add a large marker for the depot
        const depotMarker = L.circleMarker([route.depot.lat, route.depot.lon], {
            radius: 10,
            fillColor: '#2563eb', // Blue for all depots as in the image
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        }).addTo(map);
        depotMarker.bindPopup(`
            <div class="font-sans">
                <div class="font-semibold">${route.depot.address}</div>
                <div class="text-sm text-slate-600">ETA: ${route.depot.time}</div>
                <div class="text-sm text-slate-600">Today</div>
            </div>
        `);
        markerLayers[route.depot.id] = depotMarker;
        depotMarker.on('click', () => handleMarkerClick(route.courierId, route.depot.id));
        routeLayers.push(depotMarker);

        // Add small markers for the stops
        route.stops.forEach((stop) => {
            const marker = L.circleMarker([stop.lat, stop.lon], {
                radius: 6,
                fillColor: route.color,
                color: '#fff',
                weight: 2,
                fillOpacity: 1
            });
            marker.bindPopup(`
                <div class="font-sans">
                    <div class="font-semibold">${stop.address}</div>
                    <div class="text-sm text-slate-600">ETA: ${stop.time}</div>
                    <div class="text-sm text-slate-600">Today</div>
                </div>
            `);
            markerLayers[stop.id] = marker;
            marker.on('click', () => handleMarkerClick(route.courierId, stop.id));
            marker.addTo(map);
            routeLayers.push(marker);
        });

        routeLayers.push(routeLine);
    });
    
    // Fit map to show all demo routes
    const allPoints = demoRoutes.flatMap(r => [r.depot, ...r.stops]);
    if (allPoints.length > 0) {
        const bounds = L.latLngBounds(stopsToPolyline(allPoints));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Draw optimized demo routes
function drawOptimizedDemoRoutes() {
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    markerLayers = {};

    optimizedRoutes.forEach(route => {
        const path = [route.depot, ...route.stops, route.depot];
        const polyline = stopsToPolyline(path);
        
        const routeLine = L.polyline(polyline, {
            color: route.color,
            weight: 4,
            opacity: 0.8,
        }).addTo(map);

        const depotMarker = L.circleMarker([route.depot.lat, route.depot.lon], {
            radius: 10,
            fillColor: '#2563eb',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        }).addTo(map);
        depotMarker.bindPopup(`
            <div class="font-sans">
                <div class="font-semibold">${route.depot.address}</div>
                <div class="text-sm text-slate-600">ETA: ${route.depot.time}</div>
                <div class="text-sm text-slate-600">Today</div>
            </div>
        `);
        markerLayers[route.depot.id] = depotMarker;
        depotMarker.on('click', () => handleMarkerClick(route.courierId, route.depot.id));
        routeLayers.push(depotMarker);

        route.stops.forEach((stop) => {
            const marker = L.circleMarker([stop.lat, stop.lon], {
                radius: 6,
                fillColor: route.color,
                color: '#fff',
                weight: 2,
                fillOpacity: 1
            });
            marker.bindPopup(`
                <div class="font-sans">
                    <div class="font-semibold">${stop.address}</div>
                    <div class="text-sm text-slate-600">ETA: ${stop.time}</div>
                    <div class="text-sm text-slate-600">Today</div>
                </div>
            `);
            markerLayers[stop.id] = marker;
            marker.on('click', () => handleMarkerClick(route.courierId, stop.id));
            marker.addTo(map);
            routeLayers.push(marker);
        });

        routeLayers.push(routeLine);
    });
    
    const allPoints = optimizedRoutes.flatMap(r => [r.depot, ...r.stops]);
    if (allPoints.length > 0) {
        const bounds = L.latLngBounds(stopsToPolyline(allPoints));
        map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    }
}

function handleMarkerClick(courierId, stopId) {
    selectedCourier = courierId;
    if (!isTimelineOpen) {
        toggleTimeline();
    } else {
        const courierSelect = document.getElementById('courierSelect');
        if (courierSelect.value !== courierId) {
            courierSelect.value = courierId;
            buildTimeline(courierId);
        }
    }

    // Highlight in timeline after a short delay to allow timeline to build
    setTimeout(() => {
        const timelineItem = document.querySelector(`.timeline-stop-item[data-stop-id="${stopId}"]`);
        if (timelineItem) {
            document.querySelectorAll('.timeline-stop-item .timeline-content').forEach(el => el.classList.remove('bg-blue-100', 'border-blue-300'));
            timelineItem.querySelector('.timeline-content').classList.add('bg-blue-100', 'border-blue-300');
            timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

// Convert stops to polyline format
function stopsToPolyline(stops) {
    return stops.map(stop => [stop.lat, stop.lon]);
}

// Draw routes on map - filtered by selected date
function drawRoutes(routes, dateFilter = null) {
    try {
        console.log('Drawing routes:', routes, 'Date filter:', dateFilter);
        
        // Clear existing routes
        routeLayers.forEach(layer => map.removeLayer(layer));
        routeLayers = [];
        
        // Filter routes by date if specified
        let filteredRoutes = routes;
        if (dateFilter) {
            filteredRoutes = routes.filter(route => route.date === dateFilter);
        }
        
        // Group routes by courier and date
        const routesByCourier = {};
        filteredRoutes.forEach(route => {
            if (!routesByCourier[route.courierId]) {
                routesByCourier[route.courierId] = [];
            }
            routesByCourier[route.courierId].push(route);
        });
        
        // Draw routes for each courier
        Object.entries(routesByCourier).forEach(([courierId, courierRoutes]) => {
            courierRoutes.forEach(route => {
                // Ensure stops are sorted chronologically by ETA
                const sortedStops = [...route.stops].sort((a, b) => {
                    const timeA = parseInt(a.eta.replace(':', ''));
                    const timeB = parseInt(b.eta.replace(':', ''));
                    return timeA - timeB;
                });
                
                // Ensure route starts and ends with Warehouse
                const warehouseStops = sortedStops.filter(stop => 
                    stop.address.toLowerCase().includes('warehouse')
                );
                const deliveryStops = sortedStops.filter(stop => 
                    !stop.address.toLowerCase().includes('warehouse')
                );
                
                // Reconstruct route: Warehouse -> Deliveries -> Warehouse
                let orderedStops = [];
                if (warehouseStops.length > 0) {
                    orderedStops.push(warehouseStops[0]); // Start at warehouse
                    orderedStops.push(...deliveryStops); // Add all deliveries
                    if (warehouseStops.length > 1) {
                        orderedStops.push(warehouseStops[warehouseStops.length - 1]); // End at warehouse
                    }
                } else {
                    orderedStops = sortedStops; // Fallback if no warehouse found
                }
                
                const polyline = stopsToPolyline(orderedStops);
                const isToday = route.date === TODAY;
                const hasRescheduled = orderedStops.some(s => s.rescheduled);
                
                // Draw the route line
                const routeLine = L.polyline(polyline, {
                    color: routeColors[courierId],
                    weight: 4,
                    opacity: 0.8,
                    dashArray: !isToday || hasRescheduled ? '6 4' : null
                }).addTo(map);
                
                // Add markers for each stop
                orderedStops.forEach((stop, index) => {
                    const isWarehouse = stop.address.toLowerCase().includes('warehouse');
                    const isFirst = index === 0;
                    const isLast = index === orderedStops.length - 1;
                    
                    // Create marker - larger for warehouse
                    const marker = L.circleMarker([stop.lat, stop.lon], {
                        radius: isWarehouse ? 10 : 6,
                        fillColor: isWarehouse ? '#2563eb' : routeColors[courierId],
                        color: '#fff',
                        weight: 2,
                        fillOpacity: 1
                    });
                    
                    // Add popup
                    const popupContent = `
                        <div class="font-sans">
                            <div class="font-semibold">${stop.address}</div>
                            <div class="text-sm text-slate-600">ETA: ${stop.eta}</div>
                            <div class="text-sm text-slate-600">${route.date === TODAY ? 'Today' : 'Tomorrow'}</div>
                            ${isWarehouse ? '<div class="text-sm text-blue-600 font-medium">🏢 Warehouse</div>' : ''}
                            ${stop.callScheduled ? '<div class="text-sm text-green-600 font-medium">📞 Call scheduled</div>' : ''}
                            ${stop.rescheduledToEvening ? '<div class="text-sm text-green-600 font-medium">🌆 Rescheduled to evening</div>' : ''}
                            ${stop.rescheduled ? '<div class="text-sm text-green-600 font-medium">✓ Rescheduled</div>' : ''}
                            ${aiOptimizedStops.has(stop.id) ? '<div class="text-sm text-green-600 font-medium">✅ Optimised by AI</div>' : ''}
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                    
                    // Add click handler
                    marker.on('click', () => {
                        if (!isTimelineOpen) toggleTimeline();
                        selectedCourier = courierId;
                        selectedDate = route.date;
                        document.getElementById('courierSelect').value = courierId;
                        buildTimeline(courierId, currentRoutes);
                        highlightTimelineStop(stop.id);
                    });
                    
                    marker.addTo(map);
                    routeLayers.push(marker);
                });
                
                routeLayers.push(routeLine);
            });
        });
        
        // Fit bounds to show visible routes
        const visiblePoints = filteredRoutes.flatMap(r => r.stops.map(s => [s.lat, s.lon]));
        if (visiblePoints.length > 0) {
            const bounds = L.latLngBounds(visiblePoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        console.log('Routes drawn successfully');
    } catch (error) {
        console.error('Error drawing routes:', error);
    }
}

// Update KPI cards
function setKPIs(kpi, showDelta = false) {
    // Update values
    document.getElementById('totalKm').textContent = kpi.totalKm;
    document.getElementById('kmPerStop').textContent = kpi.kmPerStop;
    document.getElementById('successPct').textContent = kpi.successPct;
    document.getElementById('totalCo2Kg').textContent = kpi.totalCo2Kg;
    
    // Show delta badges if needed
    if (showDelta && baselineKpi) {
        showDeltaBadge('totalKm', baselineKpi.totalKm, kpi.totalKm, true);
        showDeltaBadge('kmPerStop', baselineKpi.kmPerStop, kpi.kmPerStop, true);
        showDeltaBadge('successPct', baselineKpi.successPct, kpi.successPct, false);
        showDeltaBadge('totalCo2Kg', baselineKpi.totalCo2Kg, kpi.totalCo2Kg, true);
    } else {
        // Hide all delta badges
        ['totalKm', 'kmPerStop', 'successPct', 'totalCo2Kg'].forEach(id => {
            document.getElementById(`${id}Delta`).classList.add('hidden');
        });
    }
    
    currentKpi = kpi;
}

// Show delta badge
function showDeltaBadge(id, oldValue, newValue, lowerIsBetter) {
    const delta = newValue - oldValue;
    const deltaElement = document.getElementById(`${id}Delta`);
    
    if (Math.abs(delta) < 0.01) {
        deltaElement.classList.add('hidden');
        return;
    }
    
    const isPositive = lowerIsBetter ? delta < 0 : delta > 0;
    const sign = delta > 0 ? '+' : '';
    
    deltaElement.textContent = `${sign}${delta.toFixed(1)}`;
    deltaElement.className = `kpi-delta delta-badge ${isPositive ? 'positive' : 'negative'}`;
    deltaElement.classList.remove('hidden');
    deltaElement.setAttribute('title', `Changed from ${oldValue}`);
}

// Glow KPI cards animation
function glowKPIs() {
    document.querySelectorAll('.kpi-card').forEach(el => {
        el.classList.add('animate-glow');
        setTimeout(() => el.classList.remove('animate-glow'), 800);
    });
}

// Generate AI Summary
function generateAISummary() {
    const summaryData = [
        {
            id: 'routes-optimized',
            icon: 'truck',
            title: 'Routes Optimized',
            value: '15%',
            description: `Reduced total distance by ${(baselineKpi.totalKm - currentKpi.totalKm).toFixed(1)} km through AI optimization`,
            positive: currentKpi.totalKm < baselineKpi.totalKm,
            details: `
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Route Optimizations Applied:</h4>
                        <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li>Merged 3 nearby stops in Chiado area</li>
                            <li>Eliminated backtracking in Baixa district</li>
                            <li>Optimized stop sequence based on traffic patterns</li>
                            <li>Reduced total route length by <strong>${(baselineKpi.totalKm - currentKpi.totalKm).toFixed(1)} km</strong></li>
                        </ul>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 class="font-semibold text-blue-800 mb-2">AI Decision Factors:</h4>
                        <p class="text-sm text-blue-700">Real-time traffic data, historical delivery patterns, and geographical clustering algorithms were used to identify the most efficient route combinations.</p>
                    </div>
                </div>
            `
        },
        {
            id: 'stops-merged',
            icon: 'map-pin',
            title: 'Stops Merged',
            value: '7',
            description: 'Eliminated redundant stops and optimized delivery sequence',
            positive: true,
             details: `
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Merged Stop Locations:</h4>
                        <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li>Rua Augusta 210 + Praça do Comércio 88</li>
                            <li>Av. da Liberdade 245 + Rua Prata 78</li>
                            <li>Consolidated 3 stops in the Chiado district</li>
                        </ul>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 class="font-semibold text-blue-800 mb-2">Efficiency Improvement:</h4>
                        <p class="text-sm text-blue-700">Stop consolidation reduces vehicle stops by over 50%, cutting delivery time and fuel consumption.</p>
                    </div>
                </div>
            `
        },
        {
            id: 'co2-saved',
            icon: 'leaf',
            title: 'CO₂ Saved',
            value: `${(baselineKpi.totalCo2Kg - currentKpi.totalCo2Kg).toFixed(1)} kg`,
            description: 'Carbon footprint reduction through efficient routing',
            positive: true,
            details: `
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Environmental Impact:</h4>
                         <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li><strong>${(baselineKpi.totalCo2Kg - currentKpi.totalCo2Kg).toFixed(1)} kg</strong> CO₂ reduction</li>
                            <li>Equivalent to planting 1 tree</li>
                            <li>~${((baselineKpi.totalKm - currentKpi.totalKm) * 0.12).toFixed(2)} L less fuel consumed</li>
                        </ul>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 class="font-semibold text-blue-800 mb-2">Calculation Method:</h4>
                        <p class="text-sm text-blue-700">Based on an average diesel delivery van emission rate of 0.16 kg CO₂ per km.</p>
                    </div>
                </div>
            `
        },
        {
            id: 'time-saved',
            icon: 'timer',
            title: 'Time Saved',
            value: '1.5h',
            description: 'Estimated time savings across all delivery routes',
            positive: true,
            details: `
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Time Savings Breakdown:</h4>
                        <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li>Route optimization: <strong>1.1 hours</strong></li>
                            <li>Reduced stop time: <strong>0.4 hours</strong></li>
                            <li>Total saved: <strong>1.5 hours</strong> across all routes</li>
                        </ul>
                    </div>
                     <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 class="font-semibold text-blue-800 mb-2">Productivity Increase:</h4>
                        <p class="text-sm text-blue-700">This allows for an average of 3-4 additional deliveries per courier within the same shift.</p>
                    </div>
                </div>
            `
        },
        {
            id: 'success-rate',
            icon: 'check-circle',
            title: 'Success Rate',
            value: `+${(currentKpi.successPct - baselineKpi.successPct).toFixed(1)}%`,
            description: 'Improved delivery success through risk analysis',
            positive: true,
             details: `
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Success Rate Improvements:</h4>
                        <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li>Better delivery time windows: <strong>+0.9%</strong></li>
                            <li>Reduced traffic delays: <strong>+0.5%</strong></li>
                            <li>Improved route reliability: <strong>+0.2%</strong></li>
                        </ul>
                    </div>
                </div>
            `
        },
        {
            id: 'efficiency-gain',
            icon: 'trending-up',
            title: 'Efficiency Gain',
            value: `${(( (baselineKpi.kmPerStop - currentKpi.kmPerStop) / baselineKpi.kmPerStop ) * 100).toFixed(1)}%`,
            description: 'Better distance per stop ratio achieved',
            positive: true,
            details: `
                 <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 class="font-semibold text-green-800 mb-2">Efficiency Metrics:</h4>
                        <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                            <li>Before: <strong>${baselineKpi.kmPerStop} km</strong> per stop</li>
                            <li>After: <strong>${currentKpi.kmPerStop} km</strong> per stop</li>
                            <li>Improvement: <strong>${(( (baselineKpi.kmPerStop - currentKpi.kmPerStop) / baselineKpi.kmPerStop ) * 100).toFixed(1)}%</strong></li>
                        </ul>
                    </div>
                </div>
            `
        }
    ];
    
    const container = document.getElementById('aiSummaryContent');
    container.innerHTML = '';
    
    summaryData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between cursor-pointer group hover:border-blue-500 hover:shadow-lg transition-all';
        card.onclick = () => showSummaryModal(item);
        
        const iconColor = item.positive ? 'text-green-600' : 'text-red-600';
        const iconBg = item.positive ? 'bg-green-50' : 'bg-red-50';

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between">
                    <div class="p-3 rounded-lg ${iconBg}">
                        <i data-lucide="${item.icon}" class="w-6 h-6 ${iconColor}"></i>
                    </div>
                </div>
                <div class="mt-4">
                    <h4 class="text-sm font-medium text-slate-500">${item.title}</h4>
                    <p class="text-3xl font-bold text-slate-800 mt-1">${item.value}</p>
                    <p class="text-sm text-slate-600 mt-2">${item.description}</p>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-dashed">
                 <span class="text-sm font-medium text-blue-600 group-hover:underline">
                    Click for details
                </span>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons(); // Re-render icons after adding them to the DOM
}

// Show summary details modal
function showSummaryModal(item) {
    const modal = document.getElementById('summaryModal');
    document.getElementById('summaryModalTitle').textContent = `${item.title} - Details`;
    document.getElementById('summaryModalBody').innerHTML = item.details;
    modal.classList.remove('hidden');
}

// Close summary modal
function closeSummaryModal() {
    document.getElementById('summaryModal').classList.add('hidden');
}

// Toggle timeline drawer
function toggleTimeline() {
    const drawer = document.getElementById('timelineDrawer');
    isTimelineOpen = !isTimelineOpen;
    drawer.classList.toggle('translate-x-full');
    
    if (isTimelineOpen) {
        // Populate the dropdown with couriers
        const courierSelect = document.getElementById('courierSelect');
        courierSelect.innerHTML = ''; // Clear old options
        const routesData = (currentTab === 'ai') ? optimizedRoutes : demoRoutes;
        routesData.forEach(route => {
            const option = document.createElement('option');
            option.value = route.courierId;
            option.textContent = route.name;
            if(route.courierId === selectedCourier) {
                option.selected = true;
            }
            courierSelect.appendChild(option);
        });
        
        buildTimeline(selectedCourier);
    }
}

// Build timeline for a courier
function buildTimeline(courierId) {
    const routesData = (currentTab === 'ai') ? optimizedRoutes : demoRoutes;
    const route = routesData.find(r => r.courierId === courierId);
    
    if (!route) {
        console.error("Route not found for courier:", courierId);
        return;
    }

    const timelineContent = document.getElementById('timelineContent');
    timelineContent.innerHTML = ''; // Clear previous content

    const container = document.createElement('div');
    container.className = 'relative pl-4';

    // The vertical connecting line
    const line = document.createElement('div');
    line.className = 'absolute left-5 top-0 h-full w-0.5 bg-blue-200';
    container.appendChild(line);

    const allStops = [
        route.depot, 
        ...route.stops, 
        { ...route.depot, time: route.end_time }
    ];

    allStops.forEach((stop, index) => {
        const isWarehouse = stop.address.toLowerCase().includes('warehouse');
        
        const itemContainer = document.createElement('div');
        itemContainer.className = 'timeline-stop-item relative flex items-center mb-4 cursor-pointer';
        itemContainer.dataset.stopId = stop.id;
        
        // Dot
        const dot = document.createElement('div');
        dot.className = `absolute left-[13px] top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full border-4 border-white`;
        dot.style.backgroundColor = isWarehouse ? '#2563eb' : route.color;
        itemContainer.appendChild(dot);
        
        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'timeline-content ml-10 w-full bg-slate-50 p-3 rounded-lg border border-slate-200 transition-colors hover:bg-slate-100 hover:border-slate-300';
        
        const timeAndAddress = document.createElement('p');
        timeAndAddress.className = "font-semibold text-slate-800";
        timeAndAddress.textContent = `${stop.time} ${stop.address}`;
        contentDiv.appendChild(timeAndAddress);

        if (isWarehouse) {
            const warehouseBadge = document.createElement('span');
            warehouseBadge.className = "mt-1 inline-block bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded";
            warehouseBadge.textContent = "🏢 Warehouse";
            contentDiv.appendChild(warehouseBadge);
        }

        itemContainer.addEventListener('click', () => {
            // Highlight self
            document.querySelectorAll('.timeline-stop-item .timeline-content').forEach(el => el.classList.remove('bg-blue-100', 'border-slate-300'));
            contentDiv.classList.add('bg-blue-100', 'border-slate-300');

            // Find marker and open popup
            const marker = markerLayers[stop.id];
            if (marker) {
                map.flyTo(marker.getLatLng(), map.getZoom() > 15 ? map.getZoom() : 16, {
                    animate: true,
                    duration: 1
                });
                setTimeout(() => {
                    marker.openPopup();
                }, 300);
            }
        });

        itemContainer.appendChild(contentDiv);
        container.appendChild(itemContainer);
    });

    timelineContent.appendChild(container);
}

// Show risk modal
function showRiskModal(risk) {
    const modal = document.getElementById('riskModal');
    const body = document.getElementById('riskModalBody');
    
    const riskClass = risk.risk >= 50 ? 'high' : risk.risk >= 40 ? 'medium' : 'low';
    const reasons = getRiskReasons(risk);
    
    body.innerHTML = `
        <div class="risk-modal-info">
            <div class="risk-modal-address">${risk.address}</div>
            <div class="risk-modal-risk ${riskClass}">${risk.risk}% Risk</div>
        </div>
        
        <div class="risk-modal-section">
            <h4>Risk Factors</h4>
            <p>${reasons.join(', ')}</p>
        </div>
        
        <div class="risk-modal-section">
            <h4>AI Recommendation</h4>
            <p>${risk.advice}</p>
        </div>
        
        <div class="risk-modal-section">
            <h4>Analysis Basis</h4>
            <p>Based on historical delivery data, traffic patterns, customer availability, and location-specific factors.</p>
        </div>
        
        <div class="risk-modal-actions">
            <button onclick="applyAdviceFromModal(${JSON.stringify(risk).replace(/"/g, '&quot;')})" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1">
                Apply Additional Suggestion
            </button>
            <button onclick="closeRiskModal()" 
                    class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Cancel
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close risk modal
function closeRiskModal() {
    document.getElementById('riskModal').classList.add('hidden');
}

// Get risk reasons based on risk level and address
function getRiskReasons(risk) {
    const reasons = [];
    
    if (risk.risk >= 50) {
        reasons.push('High traffic area');
        reasons.push('Limited parking availability');
        reasons.push('Historical delivery failures');
    } else if (risk.risk >= 40) {
        reasons.push('Moderate traffic congestion');
        reasons.push('Customer availability concerns');
    } else {
        reasons.push('Minor access restrictions');
        reasons.push('Optimal timing suggested');
    }
    
    return reasons;
}

// Apply advice from modal
async function applyAdviceFromModal(risk) {
    closeRiskModal();
    await applyAdvice(risk);
}

// Apply advice for a risk based on action type
async function applyAdvice(risk) {
    showLoading('Applying suggestion...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (risk.actionType === 'call') {
        // For "call" actions, mark as call scheduled
        let stopFound = false;
        currentRoutes.forEach(route => {
            route.stops.forEach(stop => {
                if (stop.id === risk.orderId || stop.address === risk.address) {
                    stop.callScheduled = true;
                    stopFound = true;
                    console.log('Call scheduled for stop:', stop.address);
                }
            });
        });
        
        if (!stopFound) {
            console.warn('Stop not found for call scheduling:', risk);
        }
        
        // For call actions, don't change KPIs much - just small improvement
        const newKpi = {
            totalKm: currentKpi.totalKm,
            kmPerStop: currentKpi.kmPerStop,
            successPct: (parseFloat(currentKpi.successPct) + 1.0).toFixed(1),
            totalCo2Kg: currentKpi.totalCo2Kg
        };
        
        setKPIs(newKpi, true);
        
    } else if (risk.actionType === 'reschedule_time') {
        // For evening delivery, change time but keep same day, and update warehouse
        let stopFound = false;
        currentRoutes.forEach(route => {
            route.stops.forEach(stop => {
                if (stop.id === risk.orderId || stop.address === risk.address) {
                    stop.eta = "19:00";
                    stop.rescheduledToEvening = true;
                    stopFound = true;
                    console.log('Rescheduled to evening:', stop.address);
                    
                    // Find and update the final warehouse return time
                    const warehouseStops = route.stops.filter(s => 
                        s.address.toLowerCase().includes('warehouse')
                    );
                    const finalWarehouse = warehouseStops[warehouseStops.length - 1];
                    if (finalWarehouse) {
                        finalWarehouse.eta = "19:25"; // 25 minutes after the rescheduled delivery
                        console.log('Updated final warehouse time to:', finalWarehouse.eta);
                    }
                }
            });
            
            // Sort stops by time to maintain chronological order
            route.stops.sort((a, b) => {
                const timeA = parseInt(a.eta.replace(':', ''));
                const timeB = parseInt(b.eta.replace(':', ''));
                return timeA - timeB;
            });
        });
        
        if (!stopFound) {
            console.warn('Stop not found for evening rescheduling:', risk);
        }
        
        // Load KPI improvements for time reschedule
        const newKpi = await loadJSON(risk.kpiAfter);
        if (newKpi) setKPIs(newKpi, true);
        
    } else if (risk.actionType === 'reschedule_date') {
        // For date reschedule, use the new routes data
        const newRoutes = await loadJSON(risk.routeAfter);
        const newKpi = await loadJSON(risk.kpiAfter);
        
        if (newRoutes && newKpi) {
            currentRoutes = newRoutes;
            
            // Update active dates
            activeDates.clear();
            newRoutes.forEach(route => activeDates.add(route.date));
            // updateDatePill(); // REMOVED
            
            setKPIs(newKpi, true);
        }
    }
    
    // Remove risk from list IMMEDIATELY after applying changes
    riskList = riskList.filter(r => 
        r.orderId !== risk.orderId && r.address !== risk.address
    );
    console.log('Risk removed from list:', risk.address);
    
    // Update map and timeline - use current selectedDate filter
    const dateFilter = selectedDate; // Preserve current date filter
    drawRoutes(currentRoutes, dateFilter);
    generateAISummary();
    buildTimeline(selectedCourier, currentRoutes);
    
    // Glow KPI cards
    glowKPIs();
    
    hideLoading();
}

// Highlight specific stop in timeline
function highlightTimelineStop(stopId) {
    const stopElement = document.querySelector(`.timeline-stop-item[data-stop-id="${stopId}"]`);
    if (stopElement) {
        document.querySelectorAll('.timeline-stop-item').forEach(s => s.classList.remove('active'));
        stopElement.classList.add('active');
        stopElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Switch tabs
async function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('currentRoutesTab').classList.toggle('active', tab === 'current');
    document.getElementById('aiOptimisedTab').classList.toggle('active', tab === 'ai');
    
    // Show/hide AI summary section
    document.getElementById('aiSummarySection').classList.toggle('hidden', tab === 'current');
    
    if (tab === 'current') {
        // Redraw the initial demo routes
        drawDemoRoutes();
        // Set KPIs to baseline
        if (baselineKpi) {
            setKPIs(baselineKpi, false);
        }
    } else { // AI Tab
        const messages = [
            "Analyzing current routes...",
            "Evaluating traffic patterns...",
            "Calculating optimal sequence...",
            "Merging nearby stops...",
            "Finalizing new routes..."
        ];
        let messageIndex = 0;
        
        const loadingTextEl = document.getElementById('loadingText');
        const updateText = () => {
            if (messageIndex < messages.length) {
                loadingTextEl.textContent = messages[messageIndex];
                messageIndex++;
            }
        };

        showLoading(messages[0]);
        const textInterval = setInterval(updateText, 600); // 3000ms / 5 messages
        
        // Simulate a 3-second optimization process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        clearInterval(textInterval);
        
        // Draw the new optimized routes
        drawOptimizedDemoRoutes();

        // Define the new, improved KPI values
        const optimizedKpi = {
            totalKm: "14.2",
            kmPerStop: "1.2",
            successPct: "99.1",
            totalCo2Kg: "2.2"
        };
        
        // Update the KPIs and show the deltas (savings)
        setKPIs(optimizedKpi, true);
        
        // Make the KPI cards glow to highlight the change
        glowKPIs();

        // Generate and show the summary section
        if (baselineKpi && currentKpi) {
            generateAISummary();
        }
        
        hideLoading();
    }
}

// Start demo
async function startDemo() {
    try {
        showLoading('Preparing routes...');
        
        // Hide login page and show main app
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        
        // Show main app content area
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Initialize map
        initMap();
        
        // Small delay to ensure map is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // Draw the demo routes instead of loading from JSON
        drawDemoRoutes();
        
        // Set KPIs based on the static demo routes
        const demoKpi = {
            totalKm: "17.8",
            kmPerStop: "1.4",
            successPct: "97.5",
            totalCo2Kg: "2.8"
        };
        // Set baseline for potential future comparisons
        baselineKpi = demoKpi; 
        setKPIs(demoKpi, false); // Don't show delta for the initial view
        
        hideLoading();
    } catch (error) {
        console.error('Error starting demo:', error);
        hideLoading();
    }
}

// Download PDF
function downloadPDF() {
    window.print();
} 