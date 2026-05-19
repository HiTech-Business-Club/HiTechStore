const API = '/api';
let products = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await handleOAuthCallback();
  await loadProducts();
  setupEvents();
  await checkAuth();
});

// Handle OAuth callback from URL
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const auth = urlParams.get('auth');
  const token = urlParams.get('token');
  const userStr = urlParams.get('user');
  
  if (auth === 'success' && token) {
    localStorage.setItem('token', token);
    if (userStr) {
      try {
        currentUser = JSON.parse(decodeURIComponent(userStr));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    notify('Connexion réussie!', 'success');
  } else if (auth === 'error') {
    notify('Erreur de connexion sociale. Veuillez réessayer.', 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function setupEvents() {
  document.getElementById('authBtn').addEventListener('click', () => currentUser ? logout() : openLogin());
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
  document.getElementById('ordersBtn').addEventListener('click', () => { if (!currentUser) return openLogin(); loadOrders(); new bootstrap.Modal(document.getElementById('ordersModal')).show(); });
  document.getElementById('showRegister').addEventListener('click', e => { e.preventDefault(); switchModal('loginModal', 'registerModal'); });
  document.getElementById('showLogin').addEventListener('click', e => { e.preventDefault(); switchModal('registerModal', 'loginModal'); });
}

function switchModal(from, to) { bootstrap.Modal.getInstance(document.getElementById(from)).hide(); setTimeout(() => new bootstrap.Modal(document.getElementById(to)).show(), 300); }
function openLogin() { new bootstrap.Modal(document.getElementById('loginModal')).show(); }

async function loadProducts() {
  try {
    const [allRes, trendRes, promoRes] = await Promise.all([
      fetch(`${API}/products`),
      fetch(`${API}/products?trending=true`),
      fetch(`${API}/products?promo=true`),
    ]);
    const all = await allRes.json();
    const trend = await trendRes.json();
    const promo = await promoRes.json();
    if (all.success) products = all.data.products;
    renderSection('trendingProducts', trend.success ? trend.data.products : []);
    renderSection('promoProducts', promo.success ? promo.data.products : []);
    renderByCategory();
  } catch (e) { notify('Erreur de chargement', 'error'); }
}

function renderSection(elId, items) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = items.length ? items.map(p => cardHTML(p)).join('') : '<p class="text-muted">Aucun produit</p>';
}

function renderByCategory() {
  const cats = { streaming: 'streamingProducts', gaming: 'gamingProducts', software: 'softwareProducts' };
  Object.entries(cats).forEach(([cat, id]) => {
    const items = products.filter(p => p.category === cat);
    renderSection(id, items);
  });
}

function cardHTML(p) {
  const price = p.finalPrice ? p.finalPrice.toFixed(2) : (p.originalPrice * 1.15).toFixed(2);
  const icon = catIcon(p.category);
  const feats = (p.features || []).slice(0, 3).map(f => `<li>${esc(f)}</li>`).join('');
  const badges = [];
  if (p.isTrending) badges.push('<span class="product-badge badge-trending"><i class="bi bi-fire"></i> Tendance</span>');
  if (p.isPromo) badges.push('<span class="product-badge badge-promo"><i class="bi bi-tag"></i> Promo</span>');
  const origPrice = p.isPromo && p.promoOriginalPrice ? `<div class="product-original-price">${p.promoOriginalPrice.toFixed(2)} TND</div>` : '';

  return `
    <div class="col-lg-3 col-md-4 col-sm-6">
      <div class="product-card cat-${p.category}">
        ${badges.join('')}
        <div class="product-image">${icon}</div>
        <div class="product-body">
          <h3 class="product-title">${esc(p.name)}</h3>
          <p class="product-desc">${esc(p.description)}</p>
          ${feats ? `<ul class="product-features">${feats}</ul>` : ''}
          ${origPrice}
          <div class="product-price">${price} <span class="currency">TND</span></div>
          <button class="btn btn-glow w-100" onclick="openCheckout('${p._id}')">
            <i class="bi bi-bag-check"></i> Commander
          </button>
        </div>
      </div>
    </div>`;
}

function catIcon(c) {
  const icons = { streaming: '<i class="bi bi-play-circle-fill"></i>', gaming: '<i class="bi bi-controller-fill"></i>', software: '<i class="bi bi-window-desktop"></i>', other: '<i class="bi bi-box"></i>' };
  return icons[c] || icons.other;
}

async function openCheckout(productId) {
  const p = products.find(x => x._id === productId);
  if (!p) return;
  if (!currentUser) { notify('Connectez-vous pour commander', 'error'); return openLogin(); }

  document.getElementById('checkoutProductId').value = productId;
  document.getElementById('checkoutTitle').innerHTML = `<i class="bi bi-bag-check"></i> Commander ${esc(p.name)}`;

  const price = p.originalPrice;
  const commission = Math.round(price * 15 / 100 * 100) / 100;
  const total = Math.round((price + commission) * 100) / 100;

  document.getElementById('checkoutProductInfo').innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div style="width:60px;height:60px;border-radius:12px;background:${catBg(p.category)};display:flex;align-items:center;justify-content:center;font-size:1.5rem">${catIcon(p.category)}</div>
      <div>
        <h5 class="mb-1">${esc(p.name)}</h5>
        <p class="text-muted mb-0">${esc(p.description)}</p>
      </div>
    </div>`;

  document.getElementById('coProviderName').textContent = p.provider;
  document.getElementById('coProviderLabel').textContent = p.provider;
  document.getElementById('coPrice').textContent = price.toFixed(2) + ' TND';
  document.getElementById('coCommission').textContent = commission.toFixed(2) + ' TND';
  document.getElementById('coTotal').textContent = total.toFixed(2) + ' TND';

  document.getElementById('coFirstName').value = currentUser.firstName || '';
  document.getElementById('coLastName').value = currentUser.lastName || '';
  document.getElementById('coEmail').value = currentUser.email || '';
  document.getElementById('coPhone').value = currentUser.phone || '';
  document.getElementById('coAddress').value = currentUser.address || '';

  document.getElementById('checkoutError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

function catBg(c) {
  const bgs = { streaming: 'linear-gradient(135deg,#e50914,#b20710)', gaming: 'linear-gradient(135deg,#0078d4,#00bcf2)', software: 'linear-gradient(135deg,#00a862,#00cec9)', other: 'linear-gradient(135deg,#6c5ce7,#a29bfe)' };
  return bgs[c] || bgs.other;
}

async function handleCheckout(e) {
  e.preventDefault();
  const errEl = document.getElementById('checkoutError');
  const btn = document.getElementById('checkoutSubmitBtn');
  errEl.classList.add('d-none');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Traitement...';

  try {
    const checkoutRes = await fetch(`${API}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({
        productId: document.getElementById('checkoutProductId').value,
        customerInfo: {
          firstName: document.getElementById('coFirstName').value,
          lastName: document.getElementById('coLastName').value,
          email: document.getElementById('coEmail').value,
          phone: document.getElementById('coPhone').value,
          address: document.getElementById('coAddress').value,
          providerEmail: document.getElementById('coProviderEmail').value,
          providerPassword: document.getElementById('coProviderPassword').value,
          notes: document.getElementById('coNotes').value,
        },
      }),
    });
    const checkoutData = await checkoutRes.json();
    if (!checkoutData.success) throw new Error(checkoutData.message);

    const orderNumber = checkoutData.data.orderNumber;

    const payRes = await fetch(`${API}/orders/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ orderNumber }),
    });
    const payData = await payRes.json();

    if (payData.success) {
      bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
      document.getElementById('payOrderNumber').textContent = orderNumber;
      document.getElementById('payProductName').textContent = checkoutData.data.productName;
      document.getElementById('payDelivery').textContent = payData.data.deliveryDetails;
      document.getElementById('payTotal').textContent = checkoutData.data.finalPriceTND.toFixed(2) + ' TND';
      new bootstrap.Modal(document.getElementById('paymentModal')).show();
      document.getElementById('checkoutForm').reset();
    } else {
      errEl.textContent = payData.message || 'Erreur lors du paiement';
      errEl.classList.remove('d-none');
    }
  } catch (err) {
    errEl.textContent = err.message || 'Erreur serveur';
    errEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-lock-fill"></i> Confirmer et payer';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginSubmitBtn');
  errEl.classList.add('d-none');
  btn.disabled = true;
  btn.textContent = 'Connexion...';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
      updateAuthUI();
      notify('Connexion réussie', 'success');
      document.getElementById('loginForm').reset();
    } else { errEl.textContent = data.message; errEl.classList.remove('d-none'); }
  } catch { errEl.textContent = 'Erreur serveur'; errEl.classList.remove('d-none'); }
  finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
}

async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('regError');
  errEl.classList.add('d-none');
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: document.getElementById('regFirstName').value, lastName: document.getElementById('regLastName').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPassword').value }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
      updateAuthUI();
      notify('Inscription réussie', 'success');
      document.getElementById('registerForm').reset();
    } else { errEl.textContent = data.message || (data.errors ? data.errors.join(', ') : 'Erreur'); errEl.classList.remove('d-none'); }
  } catch { errEl.textContent = 'Erreur serveur'; errEl.classList.remove('d-none'); }
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  if (currentUser) { btn.textContent = currentUser.firstName; btn.classList.remove('btn-glow'); btn.classList.add('btn-glass'); }
  else { btn.textContent = 'Connexion'; btn.classList.remove('btn-glass'); btn.classList.add('btn-glow'); }
}

function logout() {
  if (!confirm('Déconnexion ?')) return;
  localStorage.removeItem('token');
  currentUser = null;
  updateAuthUI();
  notify('Déconnexion', 'success');
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { currentUser = data.user; updateAuthUI(); }
    else localStorage.removeItem('token');
  } catch { localStorage.removeItem('token'); }
}

async function loadOrders() {
  const el = document.getElementById('ordersList');
  el.innerHTML = '<p class="text-center text-muted">Chargement...</p>';
  try {
    const res = await fetch(`${API}/orders/my-orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    const data = await res.json();
    if (!data.success || data.data.length === 0) { el.innerHTML = '<p class="text-center text-muted">Aucune commande</p>'; return; }
    el.innerHTML = data.data.map(o => `
      <div class="order-item">
        <div class="order-item-header">
          <div><strong>${esc(o.productName)}</strong><br><small class="text-muted">${o.orderNumber}</small></div>
          <span class="badge-status badge-${o.status}">${o.status}</span>
        </div>
        <div class="d-flex justify-content-between mt-2">
          <small class="text-muted">${new Date(o.createdAt).toLocaleDateString('fr-FR')}</small>
          <strong class="gradient-text">${o.finalPriceTND} TND</strong>
        </div>
        ${o.purchaseDetails && o.purchaseDetails.confirmationCode ? `<div class="mt-2 p-2 rounded" style="background:var(--bg-card)"><small><strong>Code:</strong> ${o.purchaseDetails.confirmationCode}</small><br><small class="text-muted">${o.purchaseDetails.deliveryDetails}</small></div>` : ''}
      </div>`).join('');
  } catch { el.innerHTML = '<p class="text-center text-danger">Erreur de chargement</p>'; }
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
