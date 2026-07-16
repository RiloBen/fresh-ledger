// API BASE CONFIG
const API_URL = window.location.origin;

// State Variables
let token = localStorage.getItem('jwt_token') || null;
let user = JSON.parse(localStorage.getItem('user_details')) || null;

// DOM Elements
const authStatus = document.getElementById('auth-status');
const loginSection = document.getElementById('login-section');
const workspace = document.getElementById('workspace');
const staffWorkspace = document.getElementById('staff-workspace');
const managerWorkspace = document.getElementById('manager-workspace');
const currentRoleBadge = document.getElementById('current-role-badge');
const logoutBtn = document.getElementById('logout-btn');

// Login Form Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const quickManagerBtn = document.getElementById('quick-manager');
const quickStaffBtn = document.getElementById('quick-staff');

// Inventory Form Elements
const stockForm = document.getElementById('stock-form');
const ingSelect = document.getElementById('ingredient-select');
const qtyInput = document.getElementById('quantity');
const priceInput = document.getElementById('unit_price');
const expInput = document.getElementById('expiry_date');
const fileInput = document.getElementById('receipt-file');
const stockListBody = document.getElementById('stock-list-body');

// Dashboard Elements
const metricSpent = document.getElementById('metric-spent');
const metricWasted = document.getElementById('metric-wasted');
const metricWasteIndex = document.getElementById('metric-waste-index');
const progressFill = document.getElementById('index-progress-fill');
const promoDraftsList = document.getElementById('promo-drafts-list');
const exportExcelBtn = document.getElementById('export-excel-btn');

// Forecasting Elements
const forecastSelect = document.getElementById('forecast-select');
const forecastBtn = document.getElementById('forecast-btn');
const forecastResult = document.getElementById('forecast-result');
const forecastVal = document.getElementById('forecast-val');
const forecastMethod = document.getElementById('forecast-method');

// Helper headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Format Currency
function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

// Initial Run
document.addEventListener('DOMContentLoaded', () => {
  // Set default date for stock expiry (today + 5 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  expInput.value = futureDate.toISOString().split('T')[0];

  if (token && user) {
    showWorkspace();
  } else {
    showLogin();
  }
});

// Switch Views
function showLogin() {
  loginSection.classList.remove('hidden');
  workspace.classList.add('hidden');
  authStatus.innerHTML = '<span>Not Logged In</span>';
}

function showWorkspace() {
  loginSection.classList.add('hidden');
  workspace.classList.remove('hidden');
  
  currentRoleBadge.textContent = user.role.toUpperCase();
  authStatus.innerHTML = `<span>Active user: <strong>${user.username}</strong></span>`;

  if (user.role === 'staff') {
    staffWorkspace.classList.remove('hidden');
    managerWorkspace.classList.add('hidden');
    loadInventory();
  } else if (user.role === 'manager') {
    staffWorkspace.classList.add('hidden');
    managerWorkspace.classList.remove('hidden');
    loadManagerDashboard();
  }
}

// LOGINS
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await performLogin(usernameInput.value, passwordInput.value);
});

quickManagerBtn.addEventListener('click', async () => {
  await performLogin('manager', 'manager123');
});

quickStaffBtn.addEventListener('click', async () => {
  await performLogin('staff', 'staff123');
});

async function performLogin(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_details', JSON.stringify(user));
      showWorkspace();
    } else {
      alert(`Login failed: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    alert(`Error during login connection: ${err.message}`);
  }
}

// LOGOUT
logoutBtn.addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_details');
  showLogin();
});

// STAFF: Load Inventory List
async function loadInventory() {
  try {
    const res = await fetch(`${API_URL}/api/stock`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load stocks');
    
    const stocks = await res.json();
    stockListBody.innerHTML = '';
    
    if (stocks.length === 0) {
      stockListBody.innerHTML = `<tr><td colspan="4" class="no-data">Stok aktif kosong</td></tr>`;
      return;
    }

    stocks.forEach(item => {
      // Calculate remaining days
      const diffTime = new Date(item.expiry_date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let badgeClass = 'success-color';
      let rowClass = '';
      if (diffDays <= 2) {
        badgeClass = 'danger-color';
        rowClass = 'style="background-color: #ffebee"';
      }

      const receiptLink = item.receipt_image_path 
        ? `<br><a href="${API_URL}${item.receipt_image_path}" target="_blank" class="tiny-text" style="color: var(--primary-color)">Lihat Nota 📄</a>` 
        : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td ${rowClass}><strong>${item.ingredient_name}</strong>${receiptLink}</td>
        <td ${rowClass}>${parseFloat(item.remaining_quantity)} ${item.unit}</td>
        <td ${rowClass}><span style="color: var(--${badgeClass}); font-weight: bold">${item.expiry_date.split('T')[0]} (${diffDays} hari lagi)</span></td>
        <td ${rowClass}>
          <button class="btn success btn-action-sm" onclick="updateStatus(${item.id}, 'used')">Used</button>
          <button class="btn danger btn-action-sm" onclick="updateStatus(${item.id}, 'wasted')">Waste</button>
          ${diffDays <= 2 ? `<button class="btn primary btn-action-sm" onclick="triggerRescue(${item.id})">AI Rescue</button>` : ''}
        </td>
      `;
      stockListBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

// STAFF: Update Status
window.updateStatus = async (id, status) => {
  if (!confirm(`Tandai bahan baku ini sebagai ${status}?`)) return;
  try {
    const res = await fetch(`${API_URL}/api/stock/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      loadInventory();
    } else {
      const errData = await res.json();
      alert(`Gagal update status: ${errData.error}`);
    }
  } catch (err) {
    alert(err.message);
  }
};

// STAFF: Trigger AI Rescue Recommendation
window.triggerRescue = async (id) => {
  try {
    const res = await fetch(`${API_URL}/api/promo/rescue`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ stock_batch_id: id })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Berhasil mengirim usulan promo ke dashboard Manager!\n\nMenu: ${data.draft.reason}`);
      loadInventory();
    } else {
      alert(`Gagal memicu AI Rescue: ${data.error}`);
    }
  } catch (err) {
    alert(err.message);
  }
};

// STAFF: Add Stock Item (File uploads)
stockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('ingredient_id', ingSelect.value);
  formData.append('quantity', qtyInput.value);
  formData.append('unit_price', priceInput.value);
  formData.append('expiry_date', expInput.value);
  if (fileInput.files[0]) {
    formData.append('receipt', fileInput.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/api/stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do not set Content-Type header when using FormData; fetch handles boundaries automatically
      },
      body: formData
    });

    if (res.ok) {
      alert('Stok baru berhasil disimpan dan nota diarsipkan!');
      qtyInput.value = '';
      priceInput.value = '';
      fileInput.value = '';
      loadInventory();
    } else {
      const errData = await res.json();
      alert(`Gagal menambah stok: ${errData.error}`);
    }
  } catch (err) {
    alert(err.message);
  }
});


// MANAGER: Load Dashboard Analytics & AI Drafts
async function loadManagerDashboard() {
  loadMetrics();
  loadPromoDrafts();
}

async function loadMetrics() {
  try {
    const res = await fetch(`${API_URL}/api/analytics/waste-index`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load metrics');
    
    const data = await res.json();
    metricSpent.textContent = formatRupiah(data.total_spent);
    metricWasted.textContent = formatRupiah(data.total_wasted);
    metricWasteIndex.textContent = `${data.waste_index}%`;
    progressFill.style.width = `${Math.min(data.waste_index, 100)}%`;
  } catch (err) {
    console.error(err);
  }
}

async function loadPromoDrafts() {
  try {
    const res = await fetch(`${API_URL}/api/promo/drafts`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load drafts');
    
    const drafts = await res.json();
    promoDraftsList.innerHTML = '';
    
    if (drafts.length === 0) {
      promoDraftsList.innerHTML = `<p class="no-data">Tidak ada usulan promo pending.</p>`;
      return;
    }

    drafts.forEach(draft => {
      const card = document.createElement('div');
      card.className = 'promo-card';
      card.innerHTML = `
        <div class="promo-header">
          <span class="promo-menu-name">🍽️ ${draft.menu_name}</span>
          <span class="promo-discount">-${draft.discount_percentage}%</span>
        </div>
        <p class="promo-reason">${draft.reason}</p>
        <div class="flex-row">
          <button class="btn success btn-action-sm" onclick="approvePromo(${draft.id})">Setujui Promo</button>
        </div>
      `;
      promoDraftsList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

// MANAGER: Approve Promo
window.approvePromo = async (id) => {
  try {
    const res = await fetch(`${API_URL}/api/promo/drafts/${id}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'active' })
    });
    if (res.ok) {
      alert('Promo berhasil disetujui dan diskon diaktifkan!');
      loadPromoDrafts();
      loadMetrics();
    } else {
      const data = await res.json();
      alert(`Gagal menyetujui promo: ${data.error}`);
    }
  } catch (err) {
    alert(err.message);
  }
};

// MANAGER: Export Excel
exportExcelBtn.addEventListener('click', () => {
  window.open(`${API_URL}/api/analytics/export-excel?token=${token}`, '_blank');
  // Alternatively download via fetch
});

// MANAGER: Forecasting
forecastBtn.addEventListener('click', async () => {
  const ingId = forecastSelect.value;
  try {
    const res = await fetch(`${API_URL}/api/analytics/procurement-forecast/${ingId}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      forecastResult.classList.remove('hidden');
      forecastVal.textContent = `${data.predicted_monthly_demand} kg/pcs`;
      forecastMethod.textContent = data.method;
    } else {
      alert(`Gagal memuat forecast: ${data.error}`);
    }
  } catch (err) {
    alert(err.message);
  }
});
