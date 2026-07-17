// API BASE CONFIG
const API_URL = window.location.origin;

// State Variables
let token = localStorage.getItem('jwt_token') || null;
let user = JSON.parse(localStorage.getItem('user_details')) || null;

// DOM Elements
const authStatusGuest = document.getElementById('auth-status-guest');
const loginSection = document.getElementById('login-section');
const workspace = document.getElementById('workspace');
const staffWorkspace = document.getElementById('staff-workspace');
const managerWorkspace = document.getElementById('manager-workspace');

// Settings Dropdown Elements
const settingsMenuContainer = document.getElementById('settings-menu-container');
const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsDropdownContent = document.getElementById('settings-dropdown-content');
const headerUsername = document.getElementById('header-username');
const dropdownUsername = document.getElementById('dropdown-username');
const dropdownRole = document.getElementById('dropdown-role');
const logoutMenuBtn = document.getElementById('logout-menu-btn');
const changePassMenuBtn = document.getElementById('change-pass-menu-btn');
const changePassModal = document.getElementById('change-pass-modal');
const changePassCancelBtn = document.getElementById('change-pass-cancel-btn');
const changePassForm = document.getElementById('change-pass-form');
const oldPasswordInput = document.getElementById('old-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');

// Login Form Elements
const loginForm = document.getElementById('login-form');
const loginRoleInput = document.getElementById('login-role');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const quickManagerBtn = document.getElementById('quick-manager');
const quickStaffBtn = document.getElementById('quick-staff');
const tabStaff = document.getElementById('tab-staff');
const tabManager = document.getElementById('tab-manager');

// Staff Elements
const stockForm = document.getElementById('stock-form');
const ingSelect = document.getElementById('ingredient-select');
const qtyInput = document.getElementById('quantity');
const priceInput = document.getElementById('unit_price');
const expInput = document.getElementById('expiry_date');
const fileInput = document.getElementById('receipt-file');
const bigScaleInventoryGrid = document.getElementById('big-scale-inventory-grid');
const stockListBody = document.getElementById('stock-list-body');
const expiredFilterMonth = document.getElementById('expired-filter-month');
const expiredStockListBody = document.getElementById('expired-stock-list-body');

// Manager Elements
const filterMonthInput = document.getElementById('filter-month');
const wasteAlertBanner = document.getElementById('waste-alert-banner');
const wasteIndexCard = document.getElementById('waste-index-card');
const metricSpent = document.getElementById('metric-spent');
const metricWasted = document.getElementById('metric-wasted');
const metricWasteIndex = document.getElementById('metric-waste-index');
const progressFill = document.getElementById('index-progress-fill');
const promoDraftsList = document.getElementById('promo-drafts-list');
const exportExcelBtn = document.getElementById('export-excel-btn');

// Overall Valuation Elements
const overallAssetValuation = document.getElementById('overall-asset-valuation');
const overallInventoryBody = document.getElementById('overall-inventory-body');

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
  if (expInput) expInput.value = futureDate.toISOString().split('T')[0];

  // Set default month for filter-month to current month (YYYY-MM)
  const today = new Date();
  const currentMonth = today.toISOString().substring(0, 7); // e.g. "2026-07"
  if (filterMonthInput) {
    filterMonthInput.value = currentMonth;
  }

  if (expiredFilterMonth) {
    expiredFilterMonth.value = currentMonth;
    expiredFilterMonth.addEventListener('change', () => {
      loadExpiredStock(expiredFilterMonth.value);
    });
  }

  // Setup login role switching tabs
  if (tabStaff && tabManager) {
    tabStaff.addEventListener('click', () => {
      tabStaff.classList.add('active');
      tabManager.classList.remove('active');
      loginRoleInput.value = 'staff';
      usernameInput.placeholder = 'Masukkan username staf';
    });
    tabManager.addEventListener('click', () => {
      tabManager.classList.add('active');
      tabStaff.classList.remove('active');
      loginRoleInput.value = 'manager';
      usernameInput.placeholder = 'Masukkan username manager';
    });
  }

  // Settings dropdown click toggle
  if (settingsMenuBtn) {
    settingsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdownContent.classList.toggle('show');
    });
  }

  // Click outside settings to close
  window.addEventListener('click', () => {
    if (settingsDropdownContent && settingsDropdownContent.classList.contains('show')) {
      settingsDropdownContent.classList.remove('show');
    }
  });

  if (logoutMenuBtn) {
    logoutMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }

  if (changePassMenuBtn) {
    changePassMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      changePassModal.classList.remove('hidden');
      if (settingsDropdownContent) settingsDropdownContent.classList.remove('show');
    });
  }

  if (changePassCancelBtn) {
    changePassCancelBtn.addEventListener('click', () => {
      changePassModal.classList.add('hidden');
      changePassForm.reset();
    });
  }

  if (changePassModal) {
    changePassModal.addEventListener('click', (e) => {
      if (e.target === changePassModal) {
        changePassModal.classList.add('hidden');
        changePassForm.reset();
      }
    });
  }

  if (changePassForm) {
    changePassForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (newPasswordInput.value.length < 6) {
        alert('Password baru minimal harus 6 karakter!');
        return;
      }

      if (newPasswordInput.value !== confirmNewPasswordInput.value) {
        alert('Konfirmasi password baru tidak cocok!');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            old_password: oldPasswordInput.value,
            new_password: newPasswordInput.value
          })
        });

        if (res.ok) {
          alert('Password berhasil diperbarui!');
          changePassModal.classList.add('hidden');
          changePassForm.reset();
        } else {
          const data = await res.json();
          alert(`Gagal memperbarui password: ${data.error || 'Terjadi kesalahan'}`);
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  }

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
  settingsMenuContainer.classList.add('hidden');
  authStatusGuest.classList.remove('hidden');
}

function showWorkspace() {
  loginSection.classList.add('hidden');
  workspace.classList.remove('hidden');
  authStatusGuest.classList.add('hidden');
  
  settingsMenuContainer.classList.remove('hidden');
  headerUsername.textContent = user.username;
  dropdownUsername.textContent = user.username;
  dropdownRole.textContent = user.role.toUpperCase();

  if (user.role === 'staff') {
    staffWorkspace.classList.remove('hidden');
    managerWorkspace.classList.add('hidden');
    loadInventory();
    if (expiredFilterMonth) {
      loadExpiredStock(expiredFilterMonth.value);
    }
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
function performLogout() {
  token = null;
  user = null;
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_details');
  showLogin();
}

// STAFF: Load Inventory and Group
async function loadInventory() {
  try {
    const res = await fetch(`${API_URL}/api/stock`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load stocks');
    
    const stocks = await res.json();
    
    // 1. Group active stock for overall view (Big Scale View)
    renderBigScaleOverview(stocks);

    // 2. Render chronological list (Expiry Grouped Batches)
    renderExpiryBatches(stocks);

  } catch (err) {
    console.error(err);
  }
}

// Render overall sums
function renderBigScaleOverview(stocks) {
  if (!bigScaleInventoryGrid) return;
  bigScaleInventoryGrid.innerHTML = '';
  
  const sums = {};
  stocks.forEach(item => {
    if (!sums[item.ingredient_name]) {
      sums[item.ingredient_name] = { quantity: 0, unit: item.unit };
    }
    sums[item.ingredient_name].quantity += parseFloat(item.remaining_quantity);
  });

  const keys = Object.keys(sums);
  if (keys.length === 0) {
    bigScaleInventoryGrid.innerHTML = `<p class="no-data">Stok bahan baku kosong</p>`;
    return;
  }

  keys.forEach(name => {
    const card = document.createElement('div');
    card.className = 'overall-stock-card';
    card.innerHTML = `
      <h4>${name}</h4>
      <p>${sums[name].quantity.toFixed(1)} <span style="font-size: 0.8rem; font-weight: normal; color: #6b7280;">${sums[name].unit}</span></p>
    `;
    bigScaleInventoryGrid.appendChild(card);
  });
}

// Render batch rows sorted by expiry
function renderExpiryBatches(stocks) {
  if (!stockListBody) return;
  stockListBody.innerHTML = '';
  
  if (stocks.length === 0) {
    stockListBody.innerHTML = `<tr><td colspan="4" class="no-data">Tidak ada detail batch aktif</td></tr>`;
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
        <div class="flex-row" style="margin-bottom: 6px;">
          <input type="number" id="deduct-${item.id}" class="use-qty-input" min="0.01" max="${parseFloat(item.remaining_quantity)}" value="${parseFloat(item.remaining_quantity)}" step="0.01">
          <button class="btn success btn-action-sm" onclick="updateStatus(${item.id}, 'used')">Used</button>
          <button class="btn danger btn-action-sm" onclick="updateStatus(${item.id}, 'wasted')">Waste</button>
        </div>
        ${diffDays <= 2 ? `<button class="btn primary btn-action-sm" style="width: 100%; display: block;" onclick="triggerRescue(${item.id})">AI Rescue</button>` : ''}
      </td>
    `;
    stockListBody.appendChild(tr);
  });
}

// STAFF: Update Status with Quantity Deduction
window.updateStatus = async (id, status) => {
  let quantityToDeduct = undefined;
  
  if (status === 'used' || status === 'wasted') {
    const inputEl = document.getElementById(`deduct-${id}`);
    if (inputEl) {
      quantityToDeduct = parseFloat(inputEl.value);
      if (isNaN(quantityToDeduct) || quantityToDeduct <= 0) {
        alert('Masukkan jumlah kuantitas yang valid!');
        return;
      }
    }
  }

  const confirmMsg = status === 'used'
    ? `Tandai pemakaian sebanyak ${quantityToDeduct} unit untuk batch ini?`
    : `Tandai pembuangan (waste) sebanyak ${quantityToDeduct} unit untuk batch ini?`;

  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${API_URL}/api/stock/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ 
        status,
        quantity_to_deduct: quantityToDeduct 
      })
    });
    if (res.ok) {
      loadInventory();
      if (expiredFilterMonth) {
        loadExpiredStock(expiredFilterMonth.value);
      }
    } else {
      const errData = await res.json();
      alert(`Gagal update status: ${errData.error || 'Unknown error'}${errData.details ? ` (${errData.details})` : ''}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
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
      alert(`Gagal memicu AI Rescue: ${data.error || 'Unknown error'}${data.details ? ` (${data.details})` : ''}`);
    }
  } catch (err) {
    alert(err.message);
  }
};

// STAFF: Add Stock Item
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
      },
      body: formData
    });

    if (res.ok) {
      alert('Stok baru berhasil disimpan!');
      qtyInput.value = '';
      priceInput.value = '';
      fileInput.value = '';
      loadInventory();
    } else {
      const errData = await res.json();
      alert(`Gagal menambah stok: ${errData.error || 'Unknown error'}${errData.details ? ` (${errData.details})` : ''}`);
    }
  } catch (err) {
    alert(err.message);
  }
});


// MANAGER: Load Dashboard Analytics
async function loadManagerDashboard() {
  const monthVal = filterMonthInput ? filterMonthInput.value : '';
  loadMetrics(monthVal);
  loadPromoDrafts();
  loadOverallInventory();
}

async function loadMetrics(month = '') {
  try {
    let url = `${API_URL}/api/analytics/waste-index`;
    if (month) {
      url += `?month=${month}`;
    }
    const res = await fetch(url, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load metrics');
    
    const data = await res.json();
    metricSpent.textContent = formatRupiah(data.total_spent);
    metricWasted.textContent = formatRupiah(data.total_wasted);
    metricWasteIndex.textContent = `${data.waste_index}%`;
    progressFill.style.width = `${Math.min(data.waste_index, 100)}%`;

    // Visual scale coloring and Alert Notifications based on Waste Index
    renderWasteIndexAlerts(data.waste_index, data.total_wasted_quantity, data.wasted_items);

  } catch (err) {
    console.error(err);
  }
}

// Render dynamic Waste Index Alerts
function renderWasteIndexAlerts(wasteIndex, wastedQty, wastedItems = []) {
  if (!wasteIndexCard || !wasteAlertBanner) return;

  // Clear previous coloring
  wasteIndexCard.classList.remove('index-green', 'index-yellow', 'index-red');
  wasteAlertBanner.classList.add('hidden');
  wasteAlertBanner.className = 'alert-banner hidden';

  if (wasteIndex < 15) {
    // Green (Efficient)
    wasteIndexCard.classList.add('index-green');
  } 
  else if (wasteIndex >= 15 && wasteIndex <= 25) {
    // Yellow (Warning)
    wasteIndexCard.classList.add('index-yellow');
    wasteAlertBanner.classList.remove('hidden');
    wasteAlertBanner.classList.add('warning');
    wasteAlertBanner.innerHTML = `⚠️ <strong>Peringatan Efisiensi:</strong> Waste Index mencapai <strong>${wasteIndex}%</strong>. Kerugian akibat bahan kedaluwarsa mulai memengaruhi efisiensi operasional. Tinjau kembali frekuensi restock dan pola konsumsi bahan.`;
  } 
  else {
    // Red (Critical)
    wasteIndexCard.classList.add('index-red');
    wasteAlertBanner.classList.remove('hidden');
    wasteAlertBanner.classList.add('critical');

    // Build details of wasted items if any
    const wastedDetailStr = wastedItems.length > 0
      ? wastedItems.map(item => `<strong>${item.quantity.toFixed(1)} ${item.unit} ${item.name}</strong>`).join(', ')
      : `${wastedQty.toFixed(1)} unit`;

    wasteAlertBanner.innerHTML = `🚨 <strong>Krisis Pemborosan Pangan:</strong> Waste Index berada pada level kritis <strong>${wasteIndex}%</strong>. Sebanyak ${wastedDetailStr} bahan makanan telah terbuang karena melewati masa kedaluwarsa. Disarankan mengurangi jumlah pembelian pada periode berikutnya.`;
  }
}

// Bind event listener for monthly filtering
if (filterMonthInput) {
  filterMonthInput.addEventListener('change', () => {
    loadMetrics(filterMonthInput.value);
  });
}

// MANAGER: Load Lifetime Overall Inventory
async function loadOverallInventory() {
  try {
    const res = await fetch(`${API_URL}/api/stock`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load overall stocks');
    
    const stocks = await res.json();
    
    // Compute total asset value of active stocks (remaining_quantity * unit_price)
    let totalAssetVal = 0;
    const aggregated = {};

    stocks.forEach(item => {
      const remainingQty = parseFloat(item.remaining_quantity);
      const unitPrice = parseFloat(item.unit_price);
      totalAssetVal += remainingQty * unitPrice;

      if (!aggregated[item.ingredient_name]) {
        aggregated[item.ingredient_name] = {
          quantity: 0,
          category: item.category,
          unit: item.unit
        };
      }
      aggregated[item.ingredient_name].quantity += remainingQty;
    });

    // Render Asset Valuation
    if (overallAssetValuation) {
      overallAssetValuation.textContent = formatRupiah(totalAssetVal);
    }

    // Render Overall Active Inventory Table
    if (overallInventoryBody) {
      overallInventoryBody.innerHTML = '';
      const keys = Object.keys(aggregated);
      if (keys.length === 0) {
        overallInventoryBody.innerHTML = `<tr><td colspan="3" class="no-data">Aset inventaris kosong</td></tr>`;
        return;
      }

      keys.forEach(name => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${name}</strong></td>
          <td>${aggregated[name].quantity.toFixed(1)} ${aggregated[name].unit}</td>
          <td><span class="badge" style="background-color: #e5e7eb; color: var(--text-color);">${aggregated[name].category}</span></td>
        `;
        overallInventoryBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('[ManagerCtrl] Error loading overall inventory:', err);
  }
}

// MANAGER: Load Promos drafts
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
      const monthVal = filterMonthInput ? filterMonthInput.value : '';
      loadMetrics(monthVal);
    } else {
      const data = await res.json();
      alert(`Gagal menyetujui promo: ${data.error || 'Unknown error'}${data.details ? ` (${data.details})` : ''}`);
    }
  } catch (err) {
    alert(err.message);
  }
};

// MANAGER: Export Excel
exportExcelBtn.addEventListener('click', () => {
  const monthVal = filterMonthInput ? filterMonthInput.value : '';
  let url = `${API_URL}/api/analytics/export-excel?token=${token}`;
  if (monthVal) {
    url += `&month=${monthVal}`;
  }
  window.open(url, '_blank');
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
      alert(`Gagal memuat forecast: ${data.error || 'Unknown error'}${data.details ? ` (${data.details})` : ''}`);
    }
  } catch (err) {
    alert(err.message);
  }
});

// STAFF: Load expired ingredients report for selected month
async function loadExpiredStock(month) {
  if (!expiredStockListBody) return;
  if (!month) {
    expiredStockListBody.innerHTML = '<tr><td colspan="4" class="no-data">Pilih bulan...</td></tr>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/stock/expired?month=${month}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    
    if (res.ok) {
      expiredStockListBody.innerHTML = '';
      if (data.length === 0) {
        expiredStockListBody.innerHTML = '<tr><td colspan="4" class="no-data">Tidak ada bahan kedaluwarsa pada bulan ini</td></tr>';
        return;
      }

      data.forEach(item => {
        const qtyWasted = parseFloat(item.status === 'wasted' ? item.quantity : item.remaining_quantity);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.ingredient_name}</strong></td>
          <td><code>#${item.id}</code></td>
          <td><span style="color: var(--danger-color); font-weight: bold">${item.expiry_date.split('T')[0]}</span></td>
          <td><strong style="color: var(--danger-color);">${qtyWasted} ${item.unit}</strong></td>
        `;
        expiredStockListBody.appendChild(tr);
      });
    } else {
      expiredStockListBody.innerHTML = `<tr><td colspan="4" class="no-data" style="color: var(--danger-color)">Gagal memuat: ${data.error || 'Unknown error'}</td></tr>`;
    }
  } catch (err) {
    expiredStockListBody.innerHTML = `<tr><td colspan="4" class="no-data" style="color: var(--danger-color)">Error: ${err.message}</td></tr>`;
  }
}
