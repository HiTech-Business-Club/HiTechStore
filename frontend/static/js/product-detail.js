const API = '/api';
let product = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await I18N.init();
  const switcher = document.getElementById('langSwitcher');
  if (switcher) switcher.innerHTML = I18N.createSwitcher();
  await handleOAuthCallback();
  await loadProduct();
  setupEvents();
  await checkAuth();
});

async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const auth = urlParams.get('auth');
  const token = urlParams.get('token');
  if (auth === 'success' && token) {
    localStorage.setItem('token', token);
    window.history.replaceState({}, document.title, window.location.pathname);
    notify('Connexion réussie!', 'success');
  } else if (auth === 'error') {
    notify('Erreur de connexion. Veuillez réessayer.', 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function setupEvents() {
  document.getElementById('authBtn').addEventListener('click', () => currentUser ? logout() : openLogin());
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
  document.getElementById('showRegister').addEventListener('click', e => { e.preventDefault(); switchModal('loginModal', 'registerModal'); });
  document.getElementById('showLogin').addEventListener('click', e => { e.preventDefault(); switchModal('registerModal', 'loginModal'); });
}

function switchModal(from, to) { bootstrap.Modal.getInstance(document.getElementById(from)).hide(); setTimeout(() => new bootstrap.Modal(document.getElementById(to)).show(), 300); }
function openLogin() { new bootstrap.Modal(document.getElementById('loginModal')).show(); }

async function loadProduct() {
  const pathParts = window.location.pathname.split('/');
  const productId = pathParts[pathParts.length - 1];

  if (!productId) {
    document.getElementById('productContent').innerHTML = `<div class="text-center py-5"><h3>${t('product.notfound')}</h3><a href="/" class="btn btn-glow mt-3">${t('product.back')}</a></div>`;
    return;
  }

  try {
    const res = await fetch(`${API}/products/${productId}`);
    const data = await res.json();

    if (!data.success || !data.data) {
      document.getElementById('productContent').innerHTML = `<div class="text-center py-5"><h3>${t('product.notfound')}</h3><a href="/" class="btn btn-glow mt-3">${t('product.back')}</a></div>`;
      return;
    }

    product = data.data;
    renderProduct();
    loadRelated();
  } catch (e) {
    document.getElementById('productContent').innerHTML = `<div class="text-center py-5"><h3>${t('error.network')}</h3><a href="/" class="btn btn-glow mt-3">${t('product.back')}</a></div>`;
  }
}

function renderProduct() {
  const p = product;
  const price = p.originalPrice;
  const commission = Math.round(price * (p.commissionRate || 15) / 100 * 100) / 100;
  const total = Math.round((price + commission) * 100) / 100;
  const durationLabel = { '1_month': `1 ${t('product.month')}`, '3_months': `3 ${t('product.months')}`, '6_months': `6 ${t('product.months')}`, '12_months': `12 ${t('product.months')}`, 'lifetime': t('product.lifetime') }[p.duration] || p.duration;

  const badges = [];
  if (p.isTrending) badges.push(`<span class="product-badge-lg badge-trending-lg"><i class="bi bi-fire"></i> ${t('product.trending')}</span>`);
  if (p.isPromo) badges.push(`<span class="product-badge-lg badge-promo-lg"><i class="bi bi-tag"></i> ${t('product.promo')}</span>`);
  badges.push(`<span class="product-badge-lg badge-duration-lg"><i class="bi bi-clock"></i> ${durationLabel}</span>`);

  const features = (p.features || []).map(f => `<li><i class="bi bi-check-circle-fill"></i> ${esc(f)}</li>`).join('');

  const imageHTML = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const iconHTML = `<div class="category-icon" style="display:${p.image ? 'none' : 'flex'};font-size:8rem">${catIcon(p.category)}</div>`;

  const categoryLabel = { streaming: 'Streaming', gaming: 'Gaming', software: 'Logiciel', other: 'Autre' }[p.category] || p.category;

  document.getElementById('productContent').innerHTML = `
    <div class="product-showcase row align-items-center">
      <div class="col-lg-5">
        <div class="product-image-container">
          ${imageHTML}
          ${iconHTML}
        </div>
      </div>
      <div class="col-lg-7">
        <div class="product-info">
          <div class="product-breadcrumb">
            <a href="/">Accueil</a> / <a href="/#${p.category}">${categoryLabel}</a> / ${esc(p.name)}
          </div>
          <h1 class="product-detail-title">${esc(p.name)}</h1>
          <div class="product-provider">
            <span class="product-provider-badge"><i class="bi bi-building"></i> ${esc(p.provider)}</span>
            ${p.providerUrl ? `<a href="${esc(p.providerUrl)}" target="_blank" rel="noopener" class="product-provider-badge"><i class="bi bi-box-arrow-up-right"></i> ${t('product.provider')}</a>` : ''}
          </div>
          <p class="product-description">${esc(p.description)}</p>
          <div class="product-badges">${badges.join('')}</div>
          ${features ? `<ul class="product-features-list">${features}</ul>` : ''}
          <div class="pricing-card">
            <div class="pricing-row">
              <span class="pricing-label">${t('product.service')}</span>
              <span class="pricing-value">${price.toFixed(2)} TND</span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">${t('product.tva')}</span>
              <span class="pricing-value">${commission.toFixed(2)} TND</span>
            </div>
            <div class="pricing-row total">
              <span>${t('product.total')}</span>
              <span class="pricing-value total-price gradient-text">${total.toFixed(2)} TND</span>
            </div>
          </div>
          <button class="btn btn-glow btn-buy-lg w-100" onclick="openCheckout()">
            <i class="bi bi-bag-check"></i> ${t('product.ordernow')}
          </button>
        </div>
      </div>
    </div>`;

  document.title = `${p.name} - HiTech Store`;
}

async function loadRelated() {
  if (!product) return;
  try {
    const res = await fetch(`${API}/products?category=${product.category}&limit=4`);
    const data = await res.json();
    if (data.success && data.data.products.length > 0) {
      const related = data.data.products.filter(p => p._id !== product._id).slice(0, 4);
      if (related.length > 0) {
        document.getElementById('relatedProducts').innerHTML = related.map(p => relatedCardHTML(p)).join('');
        document.getElementById('relatedSection').style.display = 'block';
      }
    }
  } catch (e) { /* silent fail */ }
}

function relatedCardHTML(p) {
  const price = p.finalPrice ? p.finalPrice.toFixed(2) : (p.originalPrice * 1.15).toFixed(2);
  const imageHTML = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" style="width:60px;height:60px;object-fit:contain">`
    : `<span style="font-size:2rem">${catIcon(p.category)}</span>`;

  return `
    <div class="col-lg-3 col-md-4 col-sm-6">
      <a href="/product/${p._id}" class="product-card-link">
        <div class="product-card cat-${p.category}">
          <div class="product-image" style="height:140px">${imageHTML}</div>
          <div class="product-body">
            <h3 class="product-title">${esc(p.name)}</h3>
            <p class="product-desc">${esc(p.description)}</p>
            <div class="product-price">${price} <span class="currency">TND</span></div>
          </div>
        </div>
      </a>
    </div>`;
}

function catIcon(c) {
  const icons = { streaming: '<i class="bi bi-play-circle-fill"></i>', gaming: '<i class="bi bi-controller-fill"></i>', software: '<i class="bi bi-window-desktop"></i>', other: '<i class="bi bi-box"></i>' };
  return icons[c] || icons.other;
}

function openCheckout() {
  if (!product) return;
  if (!currentUser) { notify(t('auth.required'), 'error'); return openLogin(); }

  const p = product;
  document.getElementById('checkoutProductId').value = p._id;
  document.getElementById('checkoutTitle').innerHTML = `<i class="bi bi-bag-check"></i> Commander ${esc(p.name)}`;

  const price = p.originalPrice;
  const commission = Math.round(price * (p.commissionRate || 15) / 100 * 100) / 100;
  const total = Math.round((price + commission) * 100) / 100;

  const checkoutImg = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" style="width:60px;height:60px;border-radius:12px;object-fit:contain;background:var(--bg-card);padding:8px">`
    : `<div style="width:60px;height:60px;border-radius:12px;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${catIcon(p.category)}</div>`;

  document.getElementById('checkoutProductInfo').innerHTML = `
    <div class="d-flex align-items-center gap-3">
      ${checkoutImg}
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

  if (currentUser) {
    document.getElementById('coFirstName').value = currentUser.firstName || '';
    document.getElementById('coLastName').value = currentUser.lastName || '';
    document.getElementById('coEmail').value = currentUser.email || '';
    document.getElementById('coPhone').value = currentUser.phone || '';
    document.getElementById('coAddress').value = currentUser.address || '';
  }

  document.getElementById('checkoutError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

async function handleCheckout(e) {
  e.preventDefault();
  const errEl = document.getElementById('checkoutError');
  const btn = document.getElementById('checkoutSubmitBtn');
  errEl.classList.add('d-none');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ${t('checkout.processing')}`;

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
    btn.innerHTML = `<i class="bi bi-lock-fill"></i> ${t('checkout.confirm')}`;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginSubmitBtn');
  errEl.classList.add('d-none');
  btn.disabled = true;
  btn.textContent = t('checkout.processing');
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
      notify(t('auth.success'), 'success');
      document.getElementById('loginForm').reset();
    } else { errEl.textContent = data.message; errEl.classList.remove('d-none'); }
  } catch { errEl.textContent = t('error.server'); errEl.classList.remove('d-none'); }
  finally { btn.disabled = false; btn.textContent = t('auth.login'); }
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
      notify(t('auth.register.success'), 'success');
      document.getElementById('registerForm').reset();
    } else { errEl.textContent = data.message || (data.errors ? data.errors.join(', ') : 'Erreur'); errEl.classList.remove('d-none'); }
  } catch { errEl.textContent = 'Erreur serveur'; errEl.classList.remove('d-none'); }
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  if (currentUser) { btn.textContent = currentUser.firstName; btn.classList.remove('btn-glow'); btn.classList.add('btn-glass'); }
  else { btn.textContent = t('auth.login'); btn.classList.remove('btn-glass'); btn.classList.add('btn-glow'); }
}

function logout() {
  if (!confirm(t('auth.logout.confirm')));
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
