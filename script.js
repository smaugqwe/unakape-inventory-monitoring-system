/* =======================
   DATA STORAGE
======================= */
let items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
let sales = JSON.parse(localStorage.getItem('salesData')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

/* =======================
   DOM REFERENCES
======================= */
const sections = document.querySelectorAll('.section');
const navMenu = document.getElementById('navMenu');

/* =======================
   NAVIGATION (FIXED)
======================= */
function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    // Close mobile menu
    if (navMenu) navMenu.classList.remove('open');
}

/* =======================
   INITIALIZE APP
======================= */
function init() {
    loadData();
    updateDashboard();
    populateItemSelect();
    renderItemsTable();
    renderSalesTable();
    renderTransactionsTable();
    renderPerishableTable();
    checkAlerts();
    setupEventListeners();
}

/* =======================
   LOCAL STORAGE
======================= */
function saveData() {
    localStorage.setItem('inventoryItems', JSON.stringify(items));
    localStorage.setItem('salesData', JSON.stringify(sales));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadData() {
    items = JSON.parse(localStorage.getItem('inventoryItems')) || [];
    sales = JSON.parse(localStorage.getItem('salesData')) || [];
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
}

/* =======================
   EVENT LISTENERS
======================= */
function setupEventListeners() {
    document.getElementById('add-item-form')?.addEventListener('submit', addItem);
    document.getElementById('sales-form')?.addEventListener('submit', recordSale);
    document.getElementById('is-perishable')?.addEventListener('change', togglePerishableFields);
}

/* =======================
   PERISHABLE TOGGLE
======================= */
function togglePerishableFields() {
    document.getElementById('perishable-fields').style.display =
        this.checked ? 'block' : 'none';
}

/* =======================
   ADD ITEM
======================= */
function addItem(e) {
    e.preventDefault();

    const newItem = {
        id: Date.now(),
        name: item-name.value,
        category: item-category.value,
        stock: parseInt(item-stock.value),
        price: parseFloat(item-price.value),
        isPerishable: is-perishable.checked,
        expirationDate: is-perishable.checked ? expiration-date.value : null,
        salesHistory: []
    };

    items.push(newItem);
    saveData();

    e.target.reset();
    perishable-fields.style.display = 'none';

    refreshUI();
}

/* =======================
   RECORD SALE
======================= */
function recordSale(e) {
    e.preventDefault();

    const itemId = parseInt(sales-item.value);
    const qty = parseInt(sales-quantity.value);
    const item = items.find(i => i.id === itemId);

    if (!item || item.stock < qty) {
        alert('Insufficient stock!');
        return;
    }

    item.stock -= qty;

    const sale = {
        id: Date.now(),
        itemId,
        itemName: item.name,
        quantity: qty,
        total: qty * item.price,
        timestamp: new Date().toISOString()
    };

    sales.push(sale);

    transactions.push({
        id: sale.id,
        date: new Date().toLocaleDateString(),
        type: 'Sale',
        item: item.name,
        quantity: qty,
        total: sale.total
    });

    item.salesHistory.push({ date: new Date().toISOString(), quantity: qty });

    saveData();
    e.target.reset();
    refreshUI();
}

/* =======================
   DASHBOARD
======================= */
function updateDashboard() {
    total-items.textContent = items.length;
    low-stock.textContent = items.filter(i => i.stock < 10).length;

    const today = new Date().toDateString();
    const todaySales = sales
        .filter(s => new Date(s.timestamp).toDateString() === today)
        .reduce((sum, s) => sum + s.total, 0);

    today-sales.textContent = `₱${todaySales.toFixed(2)}`;
    forecast-demand.textContent = `${calculateDemandForecast()} units`;
}

/* =======================
   FORECAST
======================= */
function calculateDemandForecast() {
    if (sales.length < 7) return 0;
    return Math.round(
        sales.slice(-7).reduce((sum, s) => sum + s.quantity, 0) / 7
    );
}

/* =======================
   UI RENDERING
======================= */
function populateItemSelect() {
    sales-item.innerHTML = '<option value="">Select Item</option>';
    items.forEach(i => {
        sales-item.innerHTML += `<option value="${i.id}">
            ${i.name} (${i.stock})
        </option>`;
    });
}

function renderItemsTable() {
    items-body.innerHTML = '';
    items.forEach(i => {
        items-body.innerHTML += `
        <tr>
            <td>${i.name}</td>
            <td>${i.category}</td>
            <td>${i.stock}</td>
            <td>₱${i.price.toFixed(2)}</td>
            <td>
                <button onclick="editStock(${i.id})">Edit</button>
                <button onclick="deleteItem(${i.id})">Delete</button>
            </td>
        </tr>`;
    });
}

function renderSalesTable() {
    sales-body.innerHTML = '';
    sales.forEach(s => {
        sales-body.innerHTML += `
        <tr>
            <td>${s.itemName}</td>
            <td>${s.quantity}</td>
            <td>₱${s.total.toFixed(2)}</td>
            <td>${new Date(s.timestamp).toLocaleTimeString()}</td>
        </tr>`;
    });
}

function renderTransactionsTable() {
    transactions-body.innerHTML = '';
    transactions.slice(-20).reverse().forEach(t => {
        transactions-body.innerHTML += `
        <tr>
            <td>${t.date}</td>
            <td>${t.type}</td>
            <td>${t.item}</td>
            <td>${t.quantity}</td>
            <td>₱${t.total.toFixed(2)}</td>
        </tr>`;
    });
}

function renderPerishableTable() {
    perishable-body.innerHTML = '';
    items.filter(i => i.isPerishable).forEach(i => {
        const days =
            Math.ceil((new Date(i.expirationDate) - new Date()) / 86400000);
        const status = days <= 0 ? 'Expired' : days <= 3 ? 'Expiring Soon' : 'Good';

        perishable-body.innerHTML += `
        <tr>
            <td>${i.name}</td>
            <td>${i.stock}</td>
            <td>${i.expirationDate}</td>
            <td>${days}</td>
            <td>${status}</td>
        </tr>`;
    });
}

/* =======================
   ALERTS & UTILITIES
======================= */
function checkAlerts() {
    alerts-list.innerHTML = '';
    items.filter(i => i.stock < 10).forEach(i => {
        alerts-list.innerHTML += `<li>Low stock: ${i.name}</li>`;
    });
}

function refreshUI() {
    updateDashboard();
    populateItemSelect();
    renderItemsTable();
    renderSalesTable();
    renderTransactionsTable();
    renderPerishableTable();
    checkAlerts();
}

/* =======================
   DELETE / EDIT
======================= */
function deleteItem(id) {
    if (confirm('Delete item?')) {
        items = items.filter(i => i.id !== id);
        saveData();
        refreshUI();
    }
}

function editStock(id) {
    const item = items.find(i => i.id === id);
    const qty = prompt('New stock:', item.stock);
    if (!isNaN(qty)) {
        item.stock = parseInt(qty);
        saveData();
        refreshUI();
    }
}

/* =======================
   START APP
======================= */
document.addEventListener('DOMContentLoaded', init);
