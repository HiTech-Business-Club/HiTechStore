const API = '/api';
let token = localStorage.getItem('token');
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verifyAdmin();
  setupNav();
  loadPage('dashboard');
});

async function verifyAdmin() {
  if (!token) return window.location.href = '/';
  try {
    const res = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && data.user.role === 'admin') {
      currentUser = data.user;
      document.getElementById('adminName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    } else { window.location.href = '/'; }
  } catch { window.location.href = '/'; }
}

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); loadPage(item.dataset.page); });
  });
  document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); window.location.href = '/'; });
  document.getElementById('newProductBtn').addEventListener('click', openProductModal);
  document.getElementById('productForm').addEventListener('submit', saveProduct);
  document.getElementById('providerForm').addEventListener('submit', saveProvider);
  document.getElementById('discoverBtn').addEventListener('click', runDiscovery);
  document.getElementById('discoverTrendingBtn').addEventListener('click', runDiscovery);
}

function loadPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  document.querySelectorAll('.admin-page').forEach(p => p.classList.add('d-none'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.remove('d-none');
  const titles = { dashboard: 'Dashboard', products: 'Produits', orders: 'Commandes', users: 'Utilisateurs', providers: 'Fournisseurs', trending: 'Tendances' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'products': loadProducts(); break;
    case 'orders': loadOrders(); break;
    case 'users': loadUsers(); break;
    case 'providers': loadProviders(); break;
    case 'trending': loadTrending(); break;
  }
}

async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Authorization': `Bearer ${token}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`${API}${url}`, opts);
  return res.json();
}

// Dashboard
async function loadDashboard() {
  const data = await api('/admin/stats');
  if (!data.success) return;
  const s = data.data;
  document.getElementById('statUsers').textContent = s.totalUsers;
  document.getElementById('statProducts').textContent = s.totalProducts;
  document.getElementById('statOrders').textContent = s.totalOrders;
  document.getElementById('statRevenue').textContent = s.totalRevenue.toFixed(2);
  document.getElementById('statTrending').textContent = s.trendingCount;
  document.getElementById('statPromos').textContent = s.promoCount;

  const el = document.getElementById('recentOrders');
  if (s.recentOrders.length === 0) { el.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucune commande</td></tr>'; return; }
  el.innerHTML = s.recentOrders.map(o => `
    <tr>
      <td><code>${o.orderNumber || o._id.slice(-6)}</code></td>
      <td>${o.user ? o.user.firstName + ' ' + o.user.lastName : 'N/A'}</td>
      <td>${o.finalPriceTND ? o.finalPriceTND.toFixed(2) : 0} TND</td>
      <td><span class="badge-status badge-${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
    </tr>`).join('');
}

async function runDiscovery() {
  const btn = document.getElementById('discoverBtn') || document.getElementById('discoverTrendingBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Découverte...';
  const data = await api('/admin/trending/discover', 'POST');
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Découvrir les tendances';
  if (data.success) { notify(`${data.data.length} items découverts`, 'success'); loadDashboard(); }
  else notify(data.message, 'error');
}

// Products
async function loadProducts() {
  const data = await api('/products');
  if (!data.success) return;
  const el = document.getElementById('productsTable');
  if (data.data.products.length === 0) { el.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucun produit</td></tr>'; return; }
  el.innerHTML = data.data.products.map(p => `
    <tr>
      <td><strong>${esc(p.name)}</strong>${p.isTrending ? ' <span class="badge bg-danger">Tendance</span>' : ''}${p.isPromo ? ' <span class="badge bg-warning">Promo</span>' : ''}</td>
      <td><span class="badge bg-secondary">${p.category}</span></td>
      <td>${p.originalPrice ? p.originalPrice.toFixed(2) : 0} TND</td>
      <td><span class="badge-status badge-${p.available ? 'available' : 'unavailable'}">${p.available ? 'Disponible' : 'Indisponible'}</span></td>
      <td>
        <button class="btn btn-sm btn-glass btn-sm-icon" onclick="editProduct('${p._id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-sm-icon" onclick="deleteProduct('${p._id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('productModalTitle').textContent = 'Nouveau produit';
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function editProduct(id) {
  const data = await api(`/products/${id}`);
  if (!data.success) return;
  const p = data.data;
  document.getElementById('prodId').value = p._id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodDesc').value = p.description;
  document.getElementById('prodPrice').value = p.originalPrice;
  document.getElementById('prodCommission').value = p.commissionRate;
  document.getElementById('prodProvider').value = p.provider;
  document.getElementById('prodDuration').value = p.duration;
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodUrl').value = p.providerUrl || '';
  document.getElementById('prodFeatures').value = (p.features || []).join('\n');
  document.getElementById('prodAvailable').checked = p.available;
  document.getElementById('productModalTitle').textContent = 'Modifier le produit';
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const body = {
    name: document.getElementById('prodName').value,
    description: document.getElementById('prodDesc').value,
    category: document.getElementById('prodCategory').value,
    originalPrice: parseFloat(document.getElementById('prodPrice').value),
    commissionRate: parseFloat(document.getElementById('prodCommission').value),
    provider: document.getElementById('prodProvider').value,
    duration: document.getElementById('prodDuration').value,
    stock: parseInt(document.getElementById('prodStock').value),
    providerUrl: document.getElementById('prodUrl').value,
    features: document.getElementById('prodFeatures').value.split('\n').filter(f => f.trim()),
    available: document.getElementById('prodAvailable').checked,
  };
  const data = id ? await api(`/products/${id}`, 'PUT', body) : await api('/products', 'POST', body);
  if (data.success) { notify('Produit sauvegardé', 'success'); bootstrap.Modal.getInstance(document.getElementById('productModal')).hide(); loadProducts(); }
  else notify(data.message, 'error');
}

async function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  const data = await api(`/products/${id}`, 'DELETE');
  if (data.success) { notify('Produit supprimé', 'success'); loadProducts(); }
  else notify(data.message, 'error');
}

// Orders
async function loadOrders() {
  const data = await api('/admin/orders');
  if (!data.success) return;
  const el = document.getElementById('ordersTable');
  if (data.data.orders.length === 0) { el.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucune commande</td></tr>'; return; }
  el.innerHTML = data.data.orders.map(o => `
    <tr>
      <td><code>${o.orderNumber || o._id.slice(-6)}</code></td>
      <td>${o.user ? o.user.firstName + ' ' + o.user.lastName : 'N/A'}</td>
      <td>${o.productName || 'N/A'}</td>
      <td>${o.finalPriceTND ? o.finalPriceTND.toFixed(2) : 0} TND</td>
      <td><span class="badge-status badge-${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
      <td>
        <select class="form-select form-select-sm glass-input" onchange="updateOrderStatus('${o._id}', this.value)" style="width:auto">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="purchased" ${o.status === 'purchased' ? 'selected' : ''}>Purchased</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="failed" ${o.status === 'failed' ? 'selected' : ''}>Failed</option>
          <option value="refunded" ${o.status === 'refunded' ? 'selected' : ''}>Refunded</option>
        </select>
      </td>
    </tr>`).join('');
}

async function updateOrderStatus(id, status) {
  const data = await api(`/admin/orders/${id}/status`, 'PUT', { status });
  if (data.success) notify('Statut mis à jour', 'success');
  else notify(data.message, 'error');
}

// Users
async function loadUsers() {
  const data = await api('/admin/users');
  if (!data.success) return;
  const el = document.getElementById('usersTable');
  el.innerHTML = data.data.map(u => `
    <tr>
      <td><strong>${u.firstName} ${u.lastName}</strong></td>
      <td>${u.email}</td>
      <td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${u.role}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
      <td>
        <select class="form-select form-select-sm glass-input" onchange="updateUserRole('${u._id}', this.value)" style="width:auto">
          <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        ${u.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger btn-sm-icon ms-1" onclick="deleteUser('${u._id}')"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>`).join('');
}

async function updateUserRole(id, role) {
  const data = await api(`/admin/users/${id}`, 'PUT', { role });
  if (data.success) notify('Rôle mis à jour', 'success');
  else notify(data.message, 'error');
}

async function deleteUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return;
  const data = await api(`/admin/users/${id}`, 'DELETE');
  if (data.success) { notify('Utilisateur supprimé', 'success'); loadUsers(); }
  else notify(data.message, 'error');
}

// Providers
async function loadProviders() {
  const data = await api('/admin/providers');
  if (!data.success) return;
  const el = document.getElementById('providersList');
  el.innerHTML = data.data.map(p => `
    <div class="col-md-6 col-lg-4">
      <div class="provider-card">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="provider-icon"><i class="bi bi-building"></i></div>
          <div>
            <h6 class="mb-0">${p.displayName}</h6>
            <small class="text-muted">${p.category}</small>
          </div>
          <span class="badge-status badge-${p.enabled ? 'enabled' : 'disabled'} ms-auto">${p.enabled ? 'Activé' : 'Désactivé'}</span>
        </div>
        <div class="mb-2"><small class="text-muted">Email: </small><small>${p.accountEmail || 'Non configuré'}</small></div>
        <div class="mb-2"><small class="text-muted">Paiement: </small><small>${p.paymentMethod}</small></div>
        <div class="mb-3"><small class="text-muted">Auto-achat: </small><small>${p.autoPurchase ? 'Oui' : 'Non'}</small></div>
        <button class="btn btn-glass btn-sm w-100" onclick="editProvider('${p._id}')"><i class="bi bi-gear"></i> Configurer</button>
      </div>
    </div>`).join('');
}

async function editProvider(id) {
  const data = await api('/admin/providers');
  if (!data.success) return;
  const p = data.data.find(x => x._id === id);
  if (!p) return;
  document.getElementById('provId').value = p._id;
  document.getElementById('provProvider').value = p.provider;
  document.getElementById('provUrl').value = p.officialUrl || '';
  document.getElementById('provEnabled').checked = p.enabled;
  document.getElementById('provAutoPurchase').checked = p.autoPurchase;
  document.getElementById('provEmail').value = p.accountEmail || '';
  document.getElementById('provPassword').value = p.accountPassword || '';
  document.getElementById('provPayMethod').value = p.paymentMethod || 'credit_card';
  document.getElementById('provCardNumber').value = p.cardNumber || '';
  document.getElementById('provCardExpiry').value = p.cardExpiry || '';
  document.getElementById('provCardCvv').value = p.cardCvv || '';
  document.getElementById('provCardHolder').value = p.cardHolder || '';
  document.getElementById('provNotes').value = p.notes || '';
  new bootstrap.Modal(document.getElementById('providerModal')).show();
}

async function saveProvider(e) {
  e.preventDefault();
  const id = document.getElementById('provId').value;
  const body = {
    officialUrl: document.getElementById('provUrl').value,
    enabled: document.getElementById('provEnabled').checked,
    autoPurchase: document.getElementById('provAutoPurchase').checked,
    accountEmail: document.getElementById('provEmail').value,
    accountPassword: document.getElementById('provPassword').value,
    paymentMethod: document.getElementById('provPayMethod').value,
    cardNumber: document.getElementById('provCardNumber').value,
    cardExpiry: document.getElementById('provCardExpiry').value,
    cardCvv: document.getElementById('provCardCvv').value,
    cardHolder: document.getElementById('provCardHolder').value,
    notes: document.getElementById('provNotes').value,
  };
  const data = await api(`/admin/providers/${id}`, 'PUT', body);
  if (data.success) { notify('Fournisseur sauvegardé', 'success'); bootstrap.Modal.getInstance(document.getElementById('providerModal')).hide(); loadProviders(); }
  else notify(data.message, 'error');
}

// Trending
async function loadTrending() {
  const data = await api('/admin/trending');
  if (!data.success) return;
  const el = document.getElementById('trendingList');
  if (data.data.length === 0) { el.innerHTML = '<p class="text-muted">Aucun item. Lancez la découverte.</p>'; return; }
  el.innerHTML = data.data.map(t => `
    <div class="col-md-6 col-lg-4">
      <div class="trending-card">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="mb-0">${esc(t.title)}</h6>
          ${t.isPromo ? '<span class="badge bg-warning">Promo</span>' : ''}
        </div>
        <p class="text-muted small mb-2">${esc(t.description || '')}</p>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted">${t.provider}</span>
          <strong>${t.originalPrice} ${t.originalCurrency}</strong>
        </div>
        ${t.imported ? '<span class="badge bg-success">Importé</span>' : `<button class="btn btn-glow btn-sm" onclick="importTrending('${t._id}')"><i class="bi bi-download"></i> Importer</button>`}
      </div>
    </div>`).join('');
}

async function importTrending(id) {
  const data = await api(`/admin/trending/import/${id}`, 'POST');
  if (data.success) { notify('Produit importé', 'success'); loadTrending(); }
  else notify(data.message, 'error');
}

function notify(msg, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
