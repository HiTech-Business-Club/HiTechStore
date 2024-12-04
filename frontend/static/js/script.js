// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const COMMISSION_RATE = 0.15; // 15%

// State Management
let products = [];
let cart = [];
let currentUser = null;

// DOM Elements
const streamingProductsEl = document.getElementById('streamingProducts');
const gamingProductsEl = document.getElementById('gamingProducts');
const softwareProductsEl = document.getElementById('softwareProducts');
const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const commissionEl = document.getElementById('commission');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const processPaymentBtn = document.getElementById('processPaymentBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupEventListeners();
    updateCartUI();
});

// Event Listeners
function setupEventListeners() {
    // Cart Button
    document.getElementById('cartBtn').addEventListener('click', () => {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        updateCartUI();
        cartModal.show();
    });

    // Checkout Button
    checkoutBtn.addEventListener('click', () => {
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        updatePaymentSummary();
        paymentModal.show();
    });

    // Process Payment Button
    processPaymentBtn.addEventListener('click', initiatePayment);
}

// Product Management
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Erreur lors du chargement des produits');
    }
}

function displayProducts() {
    const streamingProducts = products.filter(p => p.category === 'streaming');
    const gamingProducts = products.filter(p => p.category === 'gaming');
    const softwareProducts = products.filter(p => p.category === 'software');

    streamingProductsEl.innerHTML = generateProductsHTML(streamingProducts);
    gamingProductsEl.innerHTML = generateProductsHTML(gamingProducts);
    softwareProductsEl.innerHTML = generateProductsHTML(softwareProducts);
}

function generateProductsHTML(products) {
    return products.map(product => `
        <div class="col-md-4 mb-4">
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-details">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${formatPrice(product.basePrice)}</div>
                    <div class="commission-info">
                        +15% commission (${formatPrice(product.basePrice * COMMISSION_RATE)})
                    </div>
                    <button class="btn btn-primary w-100" onclick="addToCart(${product.id})">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartUI();
        showSuccess('Produit ajouté au panier');
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    // Update cart count
    cartCountEl.textContent = cart.length;

    // Update cart items
    if (cartItemsEl) {
        cartItemsEl.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.basePrice)}</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');

        // Update totals
        const subtotal = calculateSubtotal();
        const commission = subtotal * COMMISSION_RATE;
        const total = subtotal + commission;

        subtotalEl.textContent = formatPrice(subtotal);
        commissionEl.textContent = formatPrice(commission);
        totalEl.textContent = formatPrice(total);
    }
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + item.basePrice, 0);
}

// Payment Processing
function updatePaymentSummary() {
    const subtotal = calculateSubtotal();
    const commission = subtotal * COMMISSION_RATE;
    const total = subtotal + commission;

    document.getElementById('paymentSummary').innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <span>Sous-total:</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span>Commission (15%):</span>
            <span>${formatPrice(commission)}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold">
            <span>Total:</span>
            <span>${formatPrice(total)}</span>
        </div>
    `;
}

async function initiatePayment() {
    try {
        const subtotal = calculateSubtotal();
        const commission = subtotal * COMMISSION_RATE;
        const total = subtotal + commission;

        const response = await fetch(`${API_BASE_URL}/payments/flouci/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                amount: total,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.basePrice
                }))
            })
        });

        const paymentData = await response.json();
        
        if (paymentData.paymentUrl) {
            // Redirect to Flouci payment page
            window.location.href = paymentData.paymentUrl;
        } else {
            showError('Erreur lors de l\'initiation du paiement');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Erreur lors du traitement du paiement');
    }
}

// Utility Functions
function formatPrice(amount) {
    return `${amount.toFixed(2)} TND`;
}

function showError(message) {
    // Implement error notification
    alert(message);
}

function showSuccess(message) {
    // Implement success notification
    alert(message);
}
