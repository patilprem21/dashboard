const API_KEY = '$2a$10$SZIYDkmeZ1iQoeUkxRXNAes4yHLEWjF6B5zzFaTL74AwBb58VaABO'; // Replace with your actual API key

const BIN_IDS = {
    overview: '66ab79e9acd3cb34a86e6dca',
    shipments: '66ab79cbad19ca34f88ff551',
    inventory: '66ab79b4e41b4d34e41a3317',
    fleet: '66ab799aacd3cb34a86e6db1',
    analytics: '66ab7980acd3cb34a86e6da8'
};


async function fetchJSONBinData(binId) {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
            'X-Master-Key': '$2a$10$SZIYDkmeZ1iQoeUkxRXNAes4yHLEWjF6B5zzFaTL74AwBb58VaABO'
        }
    });
    const data = await response.json();
    return data.record;
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAllData();
    updateActiveNavLink();
});



async function fetchAllData() {
    try {
        const [overviewData, shipmentsData, inventoryData, fleetData, analyticsData] = await Promise.all([
            fetchJSONBinData(BIN_IDS.overview),
            fetchJSONBinData(BIN_IDS.shipments),
            fetchJSONBinData(BIN_IDS.inventory),
            fetchJSONBinData(BIN_IDS.fleet),
            fetchJSONBinData(BIN_IDS.analytics)
        ]);

        updateOverview(overviewData);
        initShipmentMap(shipmentsData.shipmentLocations);
        populateRecentShipments(shipmentsData.recentShipments);
        initInventoryChart(inventoryData.inventoryLevels);
        populateLowStockTable(inventoryData.lowStockItems);
        initFleetMap(fleetData.vehicleLocations);
        initVehicleStatusChart(fleetData.vehicleStatus);
        initRevenueChart(analyticsData.monthlyRevenue);
        initSatisfactionChart(analyticsData.customerSatisfaction);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}



function updateOverview(data) {
    console.log('Updating overview with data:', data);

    document.getElementById('total-shipments').textContent = data.totalShipments;
    document.getElementById('on-time-deliveries').textContent = data.onTimeDeliveries + '%';
    document.getElementById('inventory-items').textContent = data.inventoryItems;
    document.getElementById('active-vehicles').textContent = data.activeVehicles;
}

// Update these functions to accept data as a parameter
function initShipmentMap(shipments) {
    const mapContainer = document.getElementById('shipment-map');
    mapContainer.style.height = '400px';
    
    const map = L.map('shipment-map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const shipIcon = L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    shipments.forEach(shipment => {
        L.marker([shipment.lat, shipment.lng], { icon: shipIcon })
            .addTo(map)
            .bindPopup(shipment.name);
    });

    // Add a polyline to show a sample route (you might want to update this based on your data)
    const route = shipments.slice(0, 3).map(shipment => [shipment.lat, shipment.lng]);
    L.polyline(route, { color: 'red', weight: 3, opacity: 0.7 }).addTo(map);
}

function initInventoryChart(inventoryLevels) {
    const ctx = document.getElementById('inventory-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: inventoryLevels.map(item => item.product),
            datasets: [{
                label: 'Current Stock',
                data: inventoryLevels.map(item => item.stock),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

function initFleetMap(vehicles) {
    const mapContainer = document.getElementById('fleet-map');
    mapContainer.style.height = '400px';

    const map = L.map('fleet-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    vehicles.forEach(vehicle => {
        L.marker([vehicle.lat, vehicle.lng]).addTo(map).bindPopup(vehicle.name);
    });
}

function initVehicleStatusChart(vehicleStatus) {
    const ctx = document.getElementById('vehicle-status-chart');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: vehicleStatus.map(item => item.status),
            datasets: [{
                data: vehicleStatus.map(item => item.count),
                backgroundColor: ['#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}







let revenueChart, satisfactionChart;

document.addEventListener('DOMContentLoaded', function() {
    fetchAllData();
    updateActiveNavLink();
    initializeDatePicker();
});

function initializeDatePicker() {
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const applyButton = document.getElementById('applyDateFilter');

    // Set default date range (last 6 months)
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    fromDateInput.value = sixMonthsAgo.toISOString().split('T')[0];
    toDateInput.value = today.toISOString().split('T')[0];

    applyButton.addEventListener('click', function() {
        const fromDate = new Date(fromDateInput.value);
        const toDate = new Date(toDateInput.value);
        fetchAnalyticsData(fromDate, toDate);
    });

    // Initial fetch
    fetchAnalyticsData(sixMonthsAgo, today);
}

async function fetchAnalyticsData(startDate, endDate) {
    try {
        const response = await fetchJSONBinData(BIN_IDS.analytics);
        const filteredData = filterDataByDateRange(response, startDate, endDate);
        updateAnalyticsCharts(filteredData);
    } catch (error) {
        console.error('Error fetching analytics data:', error);
    }
}

function filterDataByDateRange(data, startDate, endDate) {
    return {
        monthlyRevenue: data.monthlyRevenue.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        }),
        customerSatisfaction: data.customerSatisfaction
    };
}

function updateAnalyticsCharts(data) {
    updateRevenueChart(data.monthlyRevenue);
    updateSatisfactionChart(data.customerSatisfaction);
}

function updateRevenueChart(monthlyRevenue) {
    if (revenueChart) {
        revenueChart.data.labels = monthlyRevenue.map(item => formatDate(item.date));
        revenueChart.data.datasets[0].data = monthlyRevenue.map(item => item.revenue);
        revenueChart.update();
    } else {
        initRevenueChart(monthlyRevenue);
    }
}

function updateSatisfactionChart(customerSatisfaction) {
    if (satisfactionChart) {
        satisfactionChart.data.labels = customerSatisfaction.map(item => item.rating);
        satisfactionChart.data.datasets[0].data = customerSatisfaction.map(item => item.percentage);
        satisfactionChart.update();
    } else {
        initSatisfactionChart(customerSatisfaction);
    }
}

function initRevenueChart(monthlyRevenue) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyRevenue.map(item => formatDate(item.date)),
            datasets: [{
                label: 'Revenue',
                data: monthlyRevenue.map(item => item.revenue),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                }
            }
        }
    });
}

function initSatisfactionChart(customerSatisfaction) {
    const ctx = document.getElementById('satisfaction-chart');
    satisfactionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: customerSatisfaction.map(item => item.rating),
            datasets: [{
                data: customerSatisfaction.map(item => item.percentage),
                backgroundColor: ['#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function populateRecentShipments(shipments) {
    const listGroup = document.getElementById('recent-shipments');
    listGroup.innerHTML = ''; // Clear existing content
    shipments.forEach(shipment => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            ${shipment.id} - ${shipment.destination}
            <span class="badge bg-primary rounded-pill">${shipment.status}</span>
        `;
        listGroup.appendChild(li);
    });
}

function populateLowStockTable(lowStockItems) {
    const tableBody = document.querySelector('#low-stock-table tbody');
    tableBody.innerHTML = ''; // Clear existing content
    lowStockItems.forEach(item => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${item.item}</td>
            <td>${item.currentStock}</td>
            <td>${item.reorderLevel}</td>
        `;
    });
}


function refreshData() {
    fetchAllData();
}

// Refresh data every 30 seconds
setInterval(refreshData, 30000);

function updateActiveNavLink() {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    let currentSectionId = "";

    sections.forEach((section) => {
        const sectionTop = section.offsetTop - 100; // Adjust this value based on your navbar height
        const sectionBottom = sectionTop + section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
            currentSectionId = section.id;
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active");
        }
    });
}

// Call the function on scroll
window.addEventListener("scroll", updateActiveNavLink);

// Call the function on page load
document.addEventListener("DOMContentLoaded", updateActiveNavLink);




// Smooth scroll for navbar links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            setTimeout(()=>{
                updateActiveNavLink();
            },100);
        }
    });
});
