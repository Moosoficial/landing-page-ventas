/* ============================================================
   PRECISION ATELIER — Main Application Logic
   SPA Navigation, Category Filters, Cart, Animations
   ============================================================ */

(function () {
  'use strict';

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
    initPaymentMethods();
    initCartInteractions();
    initProductCards();
    initParticles();
    initScrollAnimations();
    initCartUI();
    initFAQ();
    initSkeletonLoading();
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

        // Lazy-init 3D scene for product page
        if (pageId === 'product' && typeof window.initProductScene === 'function') {
          window.initProductScene();
        }
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

    // Cart icon -> checkout
    document.getElementById('navCartBtn').addEventListener('click', (e) => {
      e.preventDefault();
      showPage('checkout');
    });

    // Hero CTA -> scroll to products
    document.getElementById('heroCtaExplore').addEventListener('click', () => {
      document.getElementById('topSellers').scrollIntoView({ behavior: 'smooth' });
    });

    // "Ver demo" -> scroll to products
    document.getElementById('heroCtaDemo').addEventListener('click', () => {
      document.getElementById('topSellers').scrollIntoView({ behavior: 'smooth' });
    });

    // "Add to cart" on product detail page -> adds product then goes to checkout
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
        showPage('checkout');
      });
    }

    // Expose globally for product cards
    window.showPage = showPage;
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
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');
    const payBtn = document.getElementById('confirmPayBtn');

    if (subtotalEl && totalEl) {
      const subtotal = getCartTotal();
      const tax = subtotal * 0.21; // 21% IVA
      const total = subtotal + tax;

      subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
      if (taxEl) taxEl.textContent = `€${tax.toFixed(2)}`;
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
    // Confirm pay button - actual checkout process
    const payBtn = document.getElementById('confirmPayBtn');
    const checkoutForm = document.getElementById('checkoutFormElement');

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
          Toast.show('Tu carrito está vacío', 'error');
          return;
        }

        // Validate form
        const formData = new FormData(checkoutForm);
        const firstName = formData.get('firstName')?.trim();
        const lastName = formData.get('lastName')?.trim();
        const email = formData.get('email')?.trim();
        const cardNumber = formData.get('cardNumber')?.replace(/\s/g, '');

        if (!firstName || !lastName) {
          Toast.show('Por favor ingresa tu nombre completo', 'error');
          return;
        }

        if (!email || !email.includes('@')) {
          Toast.show('Por favor ingresa un email válido', 'error');
          return;
        }

        if (!cardNumber || cardNumber.length < 16) {
          Toast.show('Por favor ingresa un número de tarjeta válido', 'error');
          return;
        }

        // Simulate payment processing
        payBtn.innerHTML = '<span class="material-icons" style="animation: spin 1s linear infinite">autorenew</span> Procesando...';
        payBtn.style.pointerEvents = 'none';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate order number
        const orderNumber = 'PA-' + Date.now().toString(36).toUpperCase();
        const total = getCartTotal() * 1.21;

        // Save order to localStorage (for demo)
        const order = {
          number: orderNumber,
          items: [...cart],
          total: total,
          customer: { firstName, lastName, email },
          date: new Date().toISOString()
        };
        localStorage.setItem('precision_atelier_last_order', JSON.stringify(order));

        // Clear cart
        cart = [];
        saveCart();

        // Show success page
        window.showPage('success');
        initSuccessPage(order);
      });
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
  const productData = {
    photoshop: {
      id: 'photoshop',
      title: 'Adobe Photoshop',
      name: 'Adobe Photoshop',
      category: 'Creative Suite — Suscripción',
      price: 22.99,
      period: '/mes',
      license: 'Suscripción mensual',
      image: 'assets/images/photoshop.png',
      desc: 'El estándar mundial en edición de imágenes y diseño gráfico. Crea todo lo que puedas imaginar con herramientas avanzadas y soporte de IA.',
      theme: 0x0033aa,
      specs: [
        { icon: 'cloud_done', text: '100GB Almacenamiento Cloud' },
        { icon: 'sync', text: 'Sincronización Multi-dispositivo' },
        { icon: 'auto_awesome', text: 'Adobe Firefly AI integrado' }
      ],
      features: [
        { icon: 'brush', iconClass: 'primary', title: 'Edición Profesional', desc: 'Retoque, composición y creación de arte digital con precisión píxel por píxel.' },
        { icon: 'auto_fix_high', iconClass: 'secondary', title: 'Relleno Generativo', desc: 'Añade, elimina o expande contenido en imágenes usando prompts de texto.' },
        { icon: 'layers', iconClass: 'tertiary', title: 'Capas y Máscaras', desc: 'Flujo de trabajo no destructivo con infinitas posibilidades de composición.' },
        { icon: 'color_lens', iconClass: 'primary', title: 'Gestión de Color', desc: 'Soporte completo para espacios de color CMYK, RGB y perfiles personalizados.' }
      ]
    },
    office: {
      id: 'office',
      title: 'Microsoft Office 365',
      name: 'Office 365',
      category: 'Productividad — Suscripción',
      price: 9.99,
      period: '/mes',
      license: 'Suscripción mensual',
      image: 'assets/images/office365.png',
      desc: 'Productividad sin límites con Word, Excel, PowerPoint y Teams. Colaboración en la nube integrada para equipos de alto rendimiento.',
      theme: 0xeb3c00,
      specs: [
        { icon: 'cloud_done', text: '1TB OneDrive Storage' },
        { icon: 'people', text: 'Hasta 6 usuarios' },
        { icon: 'security', text: 'Seguridad Avanzada' }
      ],
      features: [
        { icon: 'description', iconClass: 'primary', title: 'Creación de Documentos', desc: 'Redacta documentos profesionales con asistencia inteligente de escritura.' },
        { icon: 'table_chart', iconClass: 'secondary', title: 'Análisis de Datos', desc: 'Descubre patrones y tendencias complejas con las fórmulas avanzadas de Excel.' },
        { icon: 'co_present', iconClass: 'tertiary', title: 'Presentaciones Dinámicas', desc: 'Diseña diapositivas impactantes con sugerencias de diseño automatizadas.' },
        { icon: 'forum', iconClass: 'primary', title: 'Comunicación Fluida', desc: 'Reuniones y chat integrados en una sola plataforma con Microsoft Teams.' }
      ]
    },
    autocad: {
      id: 'autocad',
      title: 'AutoCAD 2024',
      name: 'AutoCAD 2024',
      category: 'Engineering — Licencia Anual',
      price: 235,
      period: '/año',
      license: 'Licencia anual',
      image: 'assets/images/autocad.png',
      desc: 'Diseño 2D y 3D de alta precisión para ingeniería, arquitectura y construcción. Automatiza tareas y acelera tu flujo de trabajo.',
      theme: 0xc40000,
      specs: [
        { icon: 'architecture', text: 'Toolset Específico' },
        { icon: '3d_rotation', text: 'Modelado 3D Avanzado' },
        { icon: 'devices', text: 'Web & Mobile Apps' }
      ],
      features: [
        { icon: 'draw', iconClass: 'primary', title: 'Dibujo de Precisión', desc: 'Crea geometrías 2D y modelos 3D con la máxima exactitud del mercado.' },
        { icon: 'autorenew', iconClass: 'secondary', title: 'Automatización', desc: 'Reemplaza bloques, cuenta objetos y compara dibujos automáticamente.' },
        { icon: 'cloud', iconClass: 'tertiary', title: 'Colaboración Cloud', desc: 'Revisa y edita archivos DWG en tiempo real con tu equipo desde cualquier lugar.' },
        { icon: 'extension', iconClass: 'primary', title: 'Personalización API', desc: 'Agrega add-ons y rutinas LISP específicas para adaptar el software a tu industria.' }
      ]
    },
    ableton: {
      id: 'ableton',
      title: 'Ableton Live 12',
      name: 'Ableton Live 12',
      category: 'Audio Production — Licencia Vitalicia',
      price: 449,
      period: 'único',
      license: 'Licencia vitalicia',
      image: 'assets/images/ableton.png',
      desc: 'Software fluido para creación y performance musical en vivo y en estudio. Transforma ideas en pistas finales de forma intuitiva.',
      theme: 0x96ceeb,
      specs: [
        { icon: 'piano', text: 'Instrumentos Virtuales' },
        { icon: 'mic', text: 'Grabación Multipista' },
        { icon: 'graphic_eq', text: 'Efectos Nativos' }
      ],
      features: [
        { icon: 'queue_music', iconClass: 'primary', title: 'Session View', desc: 'Improvisa y explora ideas musicales sin la restricción de una línea de tiempo.' },
        { icon: 'tune', iconClass: 'secondary', title: 'Warping Audio', desc: 'Ajusta el tempo y timing de cualquier audio en tiempo real sin perder calidad.' },
        { icon: 'sensors', iconClass: 'tertiary', title: 'Soporte MIDI MPE', desc: 'Crea bends, slides y presiones expresivas para acordes individuales.' },
        { icon: 'album', iconClass: 'primary', title: 'Librería de Sonidos', desc: 'Más de 70GB de samples premium, kits y bucles listos para ser usados.' }
      ]
    },
    illustrator: {
      id: 'illustrator',
      title: 'Adobe Illustrator',
      name: 'Adobe Illustrator',
      category: 'Creative Suite — Suscripción',
      price: 22.99,
      period: '/mes',
      license: 'Suscripción mensual',
      image: 'assets/images/illustrator.png',
      desc: 'Gráficos vectoriales que mantienen su nitidez a cualquier escala. Perfecto para branding, logotipos, tipografías e ilustraciones complejas.',
      theme: 0xffa500,
      specs: [
        { icon: 'cloud_done', text: '100GB Almacenamiento Cloud' },
        { icon: 'text_format', text: 'Acceso a Adobe Fonts' },
        { icon: 'auto_awesome', text: 'Generación Vectorial AI' }
      ],
      features: [
        { icon: 'format_shapes', iconClass: 'primary', title: 'Trazos Precisos', desc: 'Crea logotipos e iconos escalables con un control bezier absoluto.' },
        { icon: 'color_lens', iconClass: 'secondary', title: 'Recoloreado AI', desc: 'Prueba múltiples paletas de colores en tu arte instantáneamente con IA.' },
        { icon: 'text_fields', iconClass: 'tertiary', title: 'Tipografía Avanzada', desc: 'Control al nivel de glifo para crear y modificar fuentes de texto.' },
        { icon: 'share', iconClass: 'primary', title: 'Exportación Múltiple', desc: 'Genera assets para web, móvil e impresión con un solo clic.' }
      ]
    }
  };

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

          // Set active theme color and current product key for detail page
          window.activeProductTheme = data.theme;
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
