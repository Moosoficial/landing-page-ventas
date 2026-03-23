/* ============================================================
   PRECISION ATELIER — Main Application Logic
   SPA Navigation, Category Filters, Cart, Animations
   ============================================================ */

(function () {
  'use strict';

  // --- Supabase Auth ---
  const SUPABASE_URL = 'https://yompxjofzlvunigfwlqi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbXB4am9memx2dW5pZ2Z3bHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTE0OTYsImV4cCI6MjA4OTc4NzQ5Nn0.t25t9i2OnHiONox5bjwzdHvnv13sa1fc-EU3c4JLe_U';
  const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let currentUser = null;

  // --- Cart State ---
  const CART_KEY = 'precision_atelier_cart';
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  // --- Toast System ---
  const Toast = {
    container: null,
    init() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.innerHTML = `
        <style>
          .toast-container {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
          }
          .toast {
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 0.9375rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 280px;
            max-width: 360px;
            transform: translateX(400px);
            opacity: 0;
            animation: slideInToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            pointer-events: auto;
            box-shadow: 0 8px 32px rgba(0, 31, 41, 0.15);
          }
          .toast.success {
            background: linear-gradient(135deg, #00696b, #2ddbde);
            color: white;
          }
          .toast.error {
            background: linear-gradient(135deg, #ba1a1a, #ff6b6b);
            color: white;
          }
          .toast.info {
            background: var(--surface-container-lowest);
            color: var(--primary);
            border: 1px solid var(--surface-container);
          }
          .toast.hide {
            animation: slideOutToast 0.3s ease forwards;
          }
          @keyframes slideInToast {
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutToast {
            to { transform: translateX(400px); opacity: 0; }
          }
          .toast .material-icons {
            font-size: 20px;
          }
        </style>
      `;
      document.body.appendChild(this.container);
    },
    show(message, type = 'info', duration = 3000) {
      if (!this.container) this.init();
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
      toast.innerHTML = `<span class="material-icons">${icon}</span><span>${message}</span>`;
      this.container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // --- DOM Ready ---
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNavScroll();
    initMobileNav();
    initPageNavigation();
    initCategoryFilter();
    initCartInteractions();
    initParticles();
    initScrollAnimations();
    initCartUI();
    initFAQ();
    initOrdersPage();
    initAuth();
    checkUrlParams();
    // Load products from Supabase then render cards
    loadProducts();
  }

  // ===================== CART FUNCTIONS =====================
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    updateCartUI();
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    Toast.show(`${product.name} agregado al carrito`, 'success');
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    Toast.show('Producto eliminado del carrito', 'info');
  }

  function updateQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      saveCart();
    }
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) {
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => badge.style.transform = '', 200);
      }
    }
  }

  // ===================== NAVIGATION scroll glassmorphism =====================
  function initNavScroll() {
    const nav = document.getElementById('mainNav');
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ===================== MOBILE NAV toggle =====================
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      // Animate hamburger
      const spans = toggle.querySelectorAll('span');
      const isOpen = links.classList.contains('open');
      spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
      spans[1].style.opacity = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
  }

  // ===================== SPA-like PAGE NAVIGATION =====================
  function initPageNavigation() {
    const pages = document.querySelectorAll('.page');
    const navLinksAnchors = document.querySelectorAll('.nav-links a');

    function showPage(pageId) {
      pages.forEach(p => {
        p.classList.remove('active');
      });
      const target = document.getElementById('page-' + pageId);
      if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

      }

      // Mostrar footer solo en home
      const footer = document.getElementById('siteFooter');
      if (footer) footer.style.display = pageId === 'home' ? '' : 'none';

      // Ocultar nav en pagina de exito (como Amazon/Stripe)
      const mainNav = document.getElementById('mainNav');
      if (mainNav) {
        mainNav.style.display = pageId === 'success' ? 'none' : '';
        // Al re-mostrar el nav, refrescar estado de auth
        if (pageId !== 'success' && typeof window.updateNavAuth === 'function') window.updateNavAuth();
      }

      // Cargar pedidos del usuario al navegar a orders
      if (pageId === 'orders') {
        if (typeof window.loadUserOrders === 'function') window.loadUserOrders();
      }

      // Update nav active state
      navLinksAnchors.forEach(a => a.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-links a[data-page="${pageId}"]`);
      if (activeLink) activeLink.classList.add('active');

      // Close mobile nav if open
      document.getElementById('navLinks').classList.remove('open');
    }

    // Nav link clicks — also trigger category filter when data-cat is set
    navLinksAnchors.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(link.dataset.page || 'home');
        if (link.dataset.cat) {
          const catTab = document.querySelector(`.category-tab[data-cat="${link.dataset.cat}"]`);
          if (catTab) catTab.click();
          setTimeout(() => {
            document.getElementById('topSellers').scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      });
    });

    // Logo goes home
    document.getElementById('logoHome').addEventListener('click', (e) => {
      e.preventDefault();
      showPage('home');
    });

    // Cart icon -> checkout (requiere login)
    document.getElementById('navCartBtn').addEventListener('click', (e) => {
      e.preventDefault();
      requireAuthThen('checkout');
    });

    // Orders icon -> mis pedidos (requiere login)
    document.getElementById('navOrdersBtn').addEventListener('click', (e) => {
      e.preventDefault();
      requireAuthThen('orders');
    });

    // Hero CTA -> scroll to products
    document.getElementById('heroCtaExplore').addEventListener('click', () => {
      document.getElementById('topSellers').scrollIntoView({ behavior: 'smooth' });
    });

    // "Ver demo" -> scroll to products
    document.getElementById('heroCtaDemo').addEventListener('click', () => {
      document.getElementById('topSellers').scrollIntoView({ behavior: 'smooth' });
    });

    // "Ver todo el catálogo" -> activar tab Todos + scroll al grid
    document.getElementById('viewAllCatalogBtn')?.addEventListener('click', () => {
      const allTab = document.querySelector('.category-tab[data-cat="all"]');
      if (allTab) allTab.click();
      document.getElementById('productsGrid').scrollIntoView({ behavior: 'smooth' });
    });

    // "Add to cart" on product detail page -> requiere login
    const addCartBtn = document.getElementById('addToCartBtn');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const productKey = window.currentProductKey;
        if (productKey && productData[productKey]) {
          const data = productData[productKey];
          addToCart({
            id: data.id,
            name: data.name,
            price: data.price,
            image: data.image,
            license: data.license
          });
        }
        requireAuthThen('checkout');
      });
    }

    // Redirige a login si no hay sesion, luego lleva a la pagina destino
    function requireAuthThen(destination) {
      if (currentUser) {
        showPage(destination);
        if (destination === 'checkout') prefillCheckoutForm();
      } else {
        window._authRedirect = destination;
        showPage('login');
        Toast.show('Inicia sesión para continuar con tu compra', 'info');
      }
    }

    window.requireAuthThen = requireAuthThen;

    // Expose globally for product cards
    window.showPage = showPage;
  }

  function prefillCheckoutForm() {
    if (!currentUser) return;
    const emailInput = document.getElementById('email');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const fullName = currentUser.user_metadata?.full_name || '';
    const parts = fullName.trim().split(' ');

    if (emailInput && !emailInput.value) emailInput.value = currentUser.email;
    if (firstNameInput && !firstNameInput.value) firstNameInput.value = parts[0] || '';
    if (lastNameInput && !lastNameInput.value) lastNameInput.value = parts.slice(1).join(' ') || '';
  }

  // ===================== CATEGORY FILTER =====================
  function initCategoryFilter() {
    const tabs = document.querySelectorAll('.category-tab');
    const cards = document.querySelectorAll('.product-card');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const cat = tab.dataset.cat;

        cards.forEach((card, i) => {
          const match = cat === 'all' || card.dataset.category === cat;
          card.style.transition = `opacity 0.3s ease ${i * 50}ms, transform 0.3s ease ${i * 50}ms`;
          if (match) {
            card.style.display = '';
            requestAnimationFrame(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              if (!match) card.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // ===================== PAYMENT METHODS =====================
  function initPaymentMethods() {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(m => {
      m.addEventListener('click', () => {
        methods.forEach(x => x.classList.remove('active'));
        m.classList.add('active');
      });
    });
  }

  // ===================== CART UI UPDATES =====================
  function initCartUI() {
    updateCartBadge();
    updateCartUI();
  }

  function updateCartUI() {
    // Update cart items in checkout page
    const cartContainer = document.getElementById('cartItemsContainer');
    if (cartContainer) {
      if (cart.length === 0) {
        cartContainer.innerHTML = `
          <div class="cart-empty-state">
            <span class="material-icons" style="font-size: 64px; color: var(--outline-variant);">shopping_basket</span>
            <h3 style="margin: var(--space-4) 0 var(--space-2); color: var(--on-surface);">Tu carrito está vacío</h3>
            <p style="color: var(--on-surface-variant); margin-bottom: var(--space-6);">Explora nuestro catálogo y encuentra el software perfecto para ti</p>
            <button class="btn btn-primary" onclick="window.showPage('home'); document.getElementById('topSellers').scrollIntoView({behavior:'smooth'})">
              <span class="material-icons">store</span>
              Ver productos
            </button>
          </div>
        `;
      } else {
        cartContainer.innerHTML = cart.map(item => `
          <div class="cart-product" data-id="${item.id}">
            <div class="cart-product-img">
              <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="cart-product-details">
              <p class="cart-product-name">${item.name}</p>
              <p class="cart-product-meta">${item.license}</p>
              <div class="quantity-controls">
                <button class="qty-btn minus" data-id="${item.id}" aria-label="Disminuir cantidad">
                  <span class="material-icons">remove</span>
                </button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn plus" data-id="${item.id}" aria-label="Aumentar cantidad">
                  <span class="material-icons">add</span>
                </button>
              </div>
            </div>
            <div class="cart-product-actions">
              <span class="cart-product-price">€${(item.price * item.quantity).toFixed(2)}</span>
              <button class="remove-btn" data-id="${item.id}" aria-label="Eliminar producto">
                <span class="material-icons">delete_outline</span>
              </button>
            </div>
          </div>
        `).join('');

        // Add event listeners for quantity controls
        cartContainer.querySelectorAll('.qty-btn.minus').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const item = cart.find(i => i.id === id);
            if (item) updateQuantity(id, item.quantity - 1);
          });
        });

        cartContainer.querySelectorAll('.qty-btn.plus').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const item = cart.find(i => i.id === id);
            if (item) updateQuantity(id, item.quantity + 1);
          });
        });

        cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });
      }
    }

    // Update totals
    const totalEl = document.getElementById('cartTotal');
    const payBtn = document.getElementById('confirmPayBtn');

    if (totalEl) {
      const total = getCartTotal(); // IVA incluido en precio

      totalEl.textContent = `€${total.toFixed(2)}`;

      if (payBtn) {
        payBtn.innerHTML = `<span class="material-icons">lock</span>Confirmar Pago — €${total.toFixed(2)}`;
        payBtn.disabled = cart.length === 0;
        payBtn.style.opacity = cart.length === 0 ? '0.5' : '1';
      }
    }
  }

  // ===================== CART INTERACTIONS =====================
  function initCartInteractions() {
    const payBtn = document.getElementById('confirmPayBtn');
    const checkoutForm = document.getElementById('checkoutFormElement');

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
          Toast.show('Tu carrito está vacío', 'error');
          return;
        }

        const formData = new FormData(checkoutForm);
        const firstName = formData.get('firstName')?.trim();
        const lastName = formData.get('lastName')?.trim();
        const email = formData.get('email')?.trim();

        if (!firstName || !lastName) {
          Toast.show('Por favor ingresa tu nombre completo', 'error');
          return;
        }

        if (!email || !email.includes('@')) {
          Toast.show('Por favor ingresa un email válido', 'error');
          return;
        }

        // Show loading state
        payBtn.innerHTML = '<span class="material-icons" style="animation: spin 1s linear infinite">autorenew</span> Redirigiendo a Stripe...';
        payBtn.style.pointerEvents = 'none';

        try {
          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart,
              customerEmail: email,
              customerName: `${firstName} ${lastName}`,
            }),
          });

          const data = await response.json();

          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error(data.error || 'No se pudo iniciar el pago');
          }
        } catch (error) {
          Toast.show('Error al conectar con el servidor de pagos. Intenta de nuevo.', 'error');
          payBtn.innerHTML = '<span class="material-icons">lock</span> Continuar al pago seguro — €' + getCartTotal().toFixed(2);
          payBtn.style.pointerEvents = '';
        }
      });
    }
  }

  // ===================== URL PARAMS (Stripe + Supabase redirects) =====================
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Supabase email confirmation callback (#access_token=...)
    if (hash.includes('access_token')) {
      window.history.replaceState({}, '', '/');
      setTimeout(() => {
        Toast.show('✅ Email confirmado. Ya puedes iniciar sesión.', 'success', 5000);
        window.showPage('login');
      }, 600);
      return;
    }

    // Supabase error en el hash
    if (hash.includes('error=')) {
      window.history.replaceState({}, '', '/');
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const errorDesc = hashParams.get('error_description') || 'Error de verificación';
      Toast.show(errorDesc.replace(/\+/g, ' '), 'error', 5000);
      window.showPage('login');
      return;
    }

    // Stripe success
    if (params.get('success') === 'true') {
      const sessionId = params.get('session_id');
      handleStripeSuccess(sessionId);
      window.history.replaceState({}, '', '/');
    } else if (params.get('canceled') === 'true') {
      window.history.replaceState({}, '', '/');
      setTimeout(() => {
        window.showPage('checkout');
        Toast.show('Pago cancelado. Puedes intentarlo de nuevo.', 'info');
      }, 300);
    }
  }

  async function handleStripeSuccess(sessionId) {
    // Clear cart immediately
    cart = [];
    saveCart();

    // Navigate to success page
    window.showPage('success');

    if (!sessionId) {
      initSuccessPage({ number: 'PA-' + Date.now().toString(36).toUpperCase(), total: 0, customer: { email: '' } });
      return;
    }

    try {
      const response = await fetch(`/api/get-session?session_id=${sessionId}`);
      const data = await response.json();

      initSuccessPage({
        number: data.orderNumber,
        total: data.amountTotal,
        customer: { email: data.customerEmail },
      });
    } catch {
      initSuccessPage({ number: 'PA-' + Date.now().toString(36).toUpperCase(), total: 0, customer: { email: '' } });
    }
  }

  // ===================== SUCCESS PAGE =====================
  function initSuccessPage(order) {
    const orderNumberEl = document.getElementById('orderNumber');
    const orderTotalEl = document.getElementById('orderTotal');
    const orderEmailEl = document.getElementById('orderEmail');

    if (orderNumberEl) orderNumberEl.textContent = order.number;
    if (orderTotalEl) orderTotalEl.textContent = `€${order.total.toFixed(2)}`;
    if (orderEmailEl) orderEmailEl.textContent = order.customer.email;

    // Trigger confetti animation
    initConfetti();
  }

  function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#56f5f8', '#96ceeb', '#cdbdff', '#2ddbde', '#00696b'];
    const particles = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.y += p.speed;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Stop after 5 seconds
    setTimeout(() => cancelAnimationFrame(animationId), 5000);
  }

  // ===================== PRODUCT DATA =====================
  // productData populated dynamically from /api/get-products
  let productData = {};

  async function loadProducts() {
    try {
      const res = await fetch('/api/get-products');
      const { products } = await res.json();
      if (!products || products.length === 0) return;

      // Build productData map keyed by product_key
      productData = {};
      products.forEach(p => {
        productData[p.product_key] = {
          id: p.product_key,
          title: p.title,
          name: p.name,
          category: p.category,
          price: parseFloat(p.price),
          period: p.period,
          license: p.license_type,
          image: p.image_url,
          desc: p.description,
          specs: p.specifications || [],
          features: p.features || [],
          badge: p.badge,
          categoryFilter: p.category_filter,
        };
      });

      renderProductCards(products);
    } catch (err) {
      console.error('Error loading products:', err);
      // Fallback: remove skeleton cards
      document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
    }
  }

  function renderProductCards(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = products.map(p => `
      <article class="product-card" data-category="${p.category_filter}" data-product="${p.product_key}" id="card-${p.product_key}">
        <div class="product-image">
          <img src="${p.image_url}" alt="${p.title}" loading="lazy">
          ${p.badge ? `<span class="product-badge ${p.badge === 'Más vendido' ? 'bestseller' : 'new'}">${p.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <p class="label-sm product-category">${p.category.split(' — ')[0]}</p>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description.substring(0, 90)}${p.description.length > 90 ? '…' : ''}</p>
          <div class="product-footer">
            <span class="product-price">€${parseFloat(p.price).toFixed(2)} <span class="period">${p.period}</span></span>
            <button class="product-add-btn" aria-label="Agregar al carrito">
              <span class="material-icons">add_shopping_cart</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Re-init cards and category filter after render
    initProductCards();
    initCategoryFilter();
  }


  // ===================== PRODUCT CARD CLICKS =====================
  function initProductCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicked on add-to-cart button
        if (e.target.closest('.product-add-btn')) {
          e.stopPropagation();

          const productKey = card.dataset.product;
          const data = productData[productKey];

          if (data) {
            addToCart({
              id: data.id,
              name: data.name,
              price: data.price,
              image: data.image,
              license: data.license
            });

            // Animate button
            const btn = e.target.closest('.product-add-btn');
            btn.innerHTML = '<span class="material-icons">check</span>';
            btn.style.background = 'linear-gradient(135deg, #00696b, #2ddbde)';
            setTimeout(() => {
              btn.innerHTML = '<span class="material-icons">add_shopping_cart</span>';
              btn.style.background = '';
            }, 1500);
          }
          return;
        }

        // Dynamically update product detail page based on clicked card
        const productKey = card.dataset.product;
        const data = productData[productKey];

        if (data) {
          document.getElementById('pd-category').textContent = data.category;
          document.getElementById('pd-title').textContent = data.title;
          document.getElementById('pd-desc').textContent = data.desc;
          document.getElementById('pd-price').textContent = '€' + data.price.toFixed(2);
          document.getElementById('pd-period').textContent = data.period;

          // Update specs
          const specsContainer = document.getElementById('pd-specs');
          specsContainer.innerHTML = data.specs.map(spec => `
            <span class="spec-chip">
              <span class="material-icons">${spec.icon}</span>
              ${spec.text}
            </span>
          `).join('');

          // Update features
          const featuresContainer = document.getElementById('pd-features');
          featuresContainer.innerHTML = data.features.map(feat => `
            <div class="feature-card">
              <div class="feature-icon ${feat.iconClass}">
                <span class="material-icons">${feat.icon}</span>
              </div>
              <h3 class="feature-title">${feat.title}</h3>
              <p class="feature-desc">${feat.desc}</p>
            </div>
          `).join('');

          // Update product image
          const pdImg = document.getElementById('pd-image');
          if (pdImg) { pdImg.src = data.image; pdImg.alt = data.title; }

          window.currentProductKey = productKey;
        }

        // Navigate to product detail
        if (window.showPage) {
          window.showPage('product');
        }
      });
    });
  }

  // ===================== FLOATING PARTICLES =====================
  function initParticles() {
    const container = document.getElementById('particles');
    const colors = ['#56f5f8', '#96ceeb', '#cdbdff', '#bfe8ff'];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 6 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 20;

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.background = color;
      particle.style.left = left + '%';
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = delay + 's';

      container.appendChild(particle);
    }
  }

  // ===================== SCROLL REVEAL ANIMATIONS =====================
  function initScrollAnimations() {
    const elements = document.querySelectorAll(
      '.product-card, .feature-card, .trust-item, .sys-req, .cart-panel, .checkout-form'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i % 5 * 100}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i % 5 * 100}ms`;
      observer.observe(el);
    });
  }

  // ===================== FAQ ACCORDION =====================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');

      if (question && answer) {
        question.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');

          // Close all others
          faqItems.forEach(otherItem => {
            if (otherItem !== item) {
              otherItem.classList.remove('open');
              const otherAnswer = otherItem.querySelector('.faq-answer');
              const otherIcon = otherItem.querySelector('.faq-icon');
              if (otherAnswer) otherAnswer.style.maxHeight = '0';
              if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
          });

          // Toggle current
          item.classList.toggle('open');
          if (isOpen) {
            answer.style.maxHeight = '0';
            if (icon) icon.style.transform = 'rotate(0deg)';
          } else {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            if (icon) icon.style.transform = 'rotate(180deg)';
          }
        });
      }
    });
  }

  // ===================== MIS PEDIDOS =====================
  function initOrdersPage() {
    const resultContainer = document.getElementById('ordersResult');
    const subtitle = document.getElementById('ordersSubtitle');
    if (!resultContainer) return;

    // Exponer para que showPage lo llame al navegar a orders
    window.loadUserOrders = async function() {
      if (!currentUser) return;

      if (subtitle) subtitle.textContent = `Pedidos de ${currentUser.email}`;

      resultContainer.innerHTML = `<div style="text-align:center; padding: var(--space-8) 0;">
        <span class="material-icons" style="font-size:40px; color:var(--outline-variant); animation:spin 1s linear infinite">autorenew</span>
      </div>`;

      try {
        const res = await fetch(`/api/get-orders?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();

        if (!data.orders || data.orders.length === 0) {
          resultContainer.innerHTML = `
            <div style="text-align:center; padding: var(--space-12) 0;">
              <span class="material-icons" style="font-size:64px; color:var(--outline-variant);">inbox</span>
              <h3 style="margin: var(--space-4) 0 var(--space-2);">Sin pedidos aún</h3>
              <p style="color:var(--on-surface-variant);">Aquí aparecerán tus compras una vez que realices tu primer pedido.</p>
            </div>`;
        } else {
          if (subtitle) subtitle.textContent = `${data.orders.length} pedido${data.orders.length > 1 ? 's' : ''} en tu cuenta`;
          resultContainer.innerHTML = data.orders.map(order => `
            <div class="order-history-card">
              <div class="order-history-header">
                <div>
                  <span class="label-sm" style="color:var(--on-surface-variant);">Número de orden</span>
                  <p class="order-history-number">${order.order_number}</p>
                </div>
                <div style="text-align:right;">
                  <span class="label-sm" style="color:var(--on-surface-variant);">Fecha</span>
                  <p style="font-weight:600; margin:0;">${new Date(order.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</p>
                </div>
                <div style="text-align:right;">
                  <span class="label-sm" style="color:var(--on-surface-variant);">Total</span>
                  <p style="font-weight:800; font-size:1.25rem; color:var(--primary); margin:0;">€${order.total_amount.toFixed(2)}</p>
                </div>
                <span class="order-status-badge">
                  <span class="status-dot"></span>
                  Completado
                </span>
              </div>
              <div class="order-history-items">
                ${(order.order_items || []).map(item => `
                  <div class="order-history-item">
                    <span class="material-icons" style="color:var(--secondary); font-size:1.2rem;">inventory_2</span>
                    <div>
                      <p style="margin:0; font-weight:600;">${item.product_name}</p>
                      <p style="margin:0; font-size:0.8125rem; color:var(--on-surface-variant);">${item.license_type} · Cant: ${item.quantity}</p>
                    </div>
                    <span style="margin-left:auto; font-weight:700; color:var(--primary);">€${item.unit_price.toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');
        }
      } catch (err) {
        Toast.show('Error al cargar pedidos. Intenta de nuevo.', 'error');
      }
    };
  }

  // ===================== AUTH =====================
  function initAuth() {
    let sessionChecked = false;

    // Verificar sesion activa al cargar (primero, para saber si ya habia sesion)
    sbClient.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user || null;
      sessionChecked = true;
      updateNavAuth();
      // Si no hay sesion, vaciar carrito residual
      if (!currentUser) {
        cart = [];
        saveCart();
        updateCartBadge();
      }
    });

    // Escuchar cambios de sesion
    sbClient.auth.onAuthStateChange((event, session) => {
      const prevUser = currentUser;
      currentUser = session?.user || null;
      updateNavAuth();

      if (event === 'SIGNED_OUT') {
        // Limpiar carrito al cerrar sesion
        cart = [];
        saveCart();
        updateCartBadge();
      }

      if (event === 'SIGNED_IN' && sessionChecked) {
        // Si cambia de usuario, limpiar carrito
        if (prevUser && prevUser.id !== currentUser?.id) {
          cart = [];
          saveCart();
          updateCartBadge();
        }
        Toast.show('Sesión iniciada correctamente', 'success');
      }
    });

    // Google OAuth
    async function signInWithGoogle() {
      const { error } = await sbClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) Toast.show('Error al conectar con Google', 'error');
    }

    document.getElementById('googleLoginBtn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('googleRegisterBtn')?.addEventListener('click', signInWithGoogle);

    // Nav login button
    document.getElementById('navLoginBtn')?.addEventListener('click', () => {
      if (currentUser) {
        window.showPage('orders');
      } else {
        window.showPage('login');
      }
    });

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginSubmitBtn');
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        Toast.show('Completa todos los campos', 'error');
        return;
      }

      btn.innerHTML = '<span class="material-icons" style="animation:spin 1s linear infinite">autorenew</span> Entrando...';
      btn.disabled = true;

      const { error } = await sbClient.auth.signInWithPassword({ email, password });

      if (error) {
        Toast.show('Email o contraseña incorrectos', 'error');
        btn.innerHTML = '<span class="material-icons">login</span> Iniciar Sesión';
        btn.disabled = false;
      } else {
        const redirect = window._authRedirect || 'orders';
        window._authRedirect = null;
        window.showPage(redirect);
        if (redirect === 'checkout') prefillCheckoutForm();
      }
    });

    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('registerSubmitBtn');
      const firstName = document.getElementById('regFirstName').value.trim();
      const lastName = document.getElementById('regLastName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      if (!firstName || !lastName || !email || !password) {
        Toast.show('Completa todos los campos', 'error');
        return;
      }
      if (password.length < 8) {
        Toast.show('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
      }

      btn.innerHTML = '<span class="material-icons" style="animation:spin 1s linear infinite">autorenew</span> Creando cuenta...';
      btn.disabled = true;

      const { error } = await sbClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: `${firstName} ${lastName}` } },
      });

      if (error) {
        Toast.show(error.message, 'error');
        btn.innerHTML = '<span class="material-icons">person_add</span> Crear Cuenta';
        btn.disabled = false;
      } else {
        Toast.show('Cuenta creada. Revisa tu email para confirmar.', 'success', 5000);
        window.showPage('login');
      }
    });

    // Toggle password visibility
    document.getElementById('toggleLoginPass')?.addEventListener('click', () => {
      const input = document.getElementById('loginPassword');
      const icon = document.querySelector('#toggleLoginPass .material-icons');
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.textContent = input.type === 'password' ? 'visibility' : 'visibility_off';
    });

    document.getElementById('toggleRegPass')?.addEventListener('click', () => {
      const input = document.getElementById('regPassword');
      const icon = document.querySelector('#toggleRegPass .material-icons');
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.textContent = input.type === 'password' ? 'visibility' : 'visibility_off';
    });
  }

  function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    if (currentUser) {
      const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
      navAuth.innerHTML = `
        <div class="nav-user-menu">
          <button class="nav-user-btn" id="navUserBtn">
            <span class="nav-user-avatar">${name[0].toUpperCase()}</span>
            <span class="nav-user-name">${name}</span>
            <span class="material-icons" style="font-size:1rem;">expand_more</span>
          </button>
          <div class="nav-user-dropdown" id="navUserDropdown">
            <a href="#" onclick="window.showPage('orders'); return false;">
              <span class="material-icons">receipt_long</span> Mis Pedidos
            </a>
            <button id="logoutBtn">
              <span class="material-icons">logout</span> Cerrar Sesión
            </button>
          </div>
        </div>`;

      document.getElementById('navUserBtn')?.addEventListener('click', () => {
        document.getElementById('navUserDropdown')?.classList.toggle('open');
      });

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await sbClient.auth.signOut();
        currentUser = null;
        updateNavAuth();
        window.showPage('home');
        Toast.show('Sesión cerrada', 'info');
      });
    } else {
      navAuth.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="navLoginBtn">
          <span class="material-icons">person</span>
          Iniciar sesión
        </button>`;
      document.getElementById('navLoginBtn')?.addEventListener('click', () => {
        window.showPage('login');
      });
    }

    // Exponer globalmente para que showPage pueda llamarla
    window.updateNavAuth = updateNavAuth;
  }

  // ===================== SKELETON LOADING =====================
  function initSkeletonLoading() {
    // Add skeleton class to images while loading
    const images = document.querySelectorAll('.product-image img, .cart-product-img img');
    images.forEach(img => {
      if (img.complete) {
        img.classList.remove('skeleton');
      } else {
        img.classList.add('skeleton');
        img.addEventListener('load', () => img.classList.remove('skeleton'));
        img.addEventListener('error', () => img.classList.remove('skeleton'));
      }
    });
  }

})();

// --- Spin animation for loading button ---
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
