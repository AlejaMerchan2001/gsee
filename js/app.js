
// Productos
const products = [
  {
    id: 1,
    title: "Cordón antideslizante negro",
    category: "cordones",
    price: 29900,
    rating: 4.8,
    badge: "Top ventas",
    img:"js/Imagenes/Cordon negro.jpg",
  },
  {
    id: 2,
    title: "Cordón tejido color arena",
    category: "cordones",
    price: 34900,
    rating: 4.6,
    badge: "Nuevo",
    img: "js/Imagenes/Coprdon tela.jpg",
  },
  {
    id: 3,
    title: "Estuche rígido minimal",
    category: "estuches",
    price: 34900,
    rating: 4.7,
    badge: "Recomendado",
    img: "https://via.placeholder.com/400x450?text=Estuche+rigido",
  },
  {
    id: 4,
    title: "Estuche plegable tipo sobre",
    category: "estuches",
    price: 39900,
    rating: 4.4,
    badge: "Eco",
    img: "js/Imagenes/plegable.jpg",
  },
  {
    id: 5,
    title: "Kit limpieza premium",
    category: "limpieza",
    price: 39900,
    rating: 4.9,
    badge: "Imprescindible",
    img: "js/Imagenes/kit premium.jpg",
  },
  {
    id: 6,
    title: "Paños microfibra x3",
    category: "limpieza",
    price: 24900,
    rating: 4.5,
    badge: "Pack",
    img: "https://via.placeholder.com/400x310?text=Pa%C3%B1os+microfibra",
  },
  {
    id: 7,
    title: "Filtro azul clip-on universal",
    category: "filtros",
    price: 59900,
    rating: 4.7,
    badge: "Office",
    img: "js/Imagenes/filtro.jpg",
  },
  {
    id: 8,
    title: "Filtro azul para gamers",
    category: "filtros",
    price: 64900,
    rating: 4.9,
    badge: "Pro",
    img: "https://via.placeholder.com/400x430?text=Filtro+azul+gamer",
  },
  {
    id: 9,
    title: "Soporte magnético para gafas",
    category: "otros",
    price: 32900,
    rating: 4.3,
    badge: "Organización",
    img: "https://via.placeholder.com/400x390?text=Soporte+magn%C3%A9tico",
  },
  {
    id: 10,
    title: "Cadenas metalizadas doradas",
    category: "cordones",
    price: 45900,
    rating: 4.6,
    badge: "Tendencia",
    img: "js/Imagenes/cadena dorada.jpg",
  },
  {
    id: 11,
    title: "Estuche con doble compartimento",
    category: "estuches",
    price: 42900,
    rating: 4.4,
    badge: "Viaje",
    img: "https://via.placeholder.com/400x370?text=Estuche+doble",
  },
  {
    id: 12,
    title: "Spray antiempañante",
    category: "limpieza",
    price: 27900,
    rating: 4.5,
    badge: "Ideal mascarilla",
    img: "https://via.placeholder.com/400x480?text=Spray+antiempa%C3%B1ante",
  },
];

// -------- ESTADO --------
let cart = [];
let currentUser = null;
let toastTimer;

// -------- UTILIDADES --------
const formatPrice = (value) =>
  "$" +
  value.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

const showToast = (message) => {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.style.display = "flex";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2200);
};

// -------- LOGIN --------
const updateUserUI = () => {
  const userInfo = document.getElementById("user-info");
  const loginBtn = document.getElementById("login-btn");
  if (!userInfo || !loginBtn) return;

  if (currentUser) {
    const name = document.createElement("span");
    name.className = "user-name";
    name.textContent = currentUser.email;
    userInfo.replaceChildren("Hola, ", name);
    loginBtn.textContent = "Cerrar sesión";
  } else {
    userInfo.textContent = "Invitado";
    loginBtn.textContent = "Login";
  }
};

const saveUser = () => {
  if (currentUser) {
    localStorage.setItem("opti_user", JSON.stringify(currentUser));
  } else {
    localStorage.removeItem("opti_user");
  }
  updateUserUI();
};

const loadUser = () => {
  try {
    const stored = localStorage.getItem("opti_user");
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  } catch (e) {
    currentUser = null;
  }
  updateUserUI();
};

const setupLogin = () => {
  const loginBtn = document.getElementById("login-btn");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  if (!loginBtn || !loginForm) return;

  loginBtn.addEventListener("click", () => {
    if (currentUser) {
      currentUser = null;
      saveUser();
      showToast("Has cerrado sesión");
    } else {
      openModal("login-modal");
    }
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || password.length < 4) {
      if (loginError) {
        loginError.textContent =
          "Completa un correo válido y una contraseña de al menos 4 caracteres.";
      }
      return;
    }

    if (loginError) loginError.textContent = "";
    currentUser = { email };
    saveUser();
    closeModal("login-modal");
    showToast("Sesión iniciada correctamente");
  });
};

// -------- CARRITO --------
const updateCartCount = () => {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countEl.textContent = String(totalItems);
};

const saveCart = () => {
  localStorage.setItem("opti_cart", JSON.stringify(cart));
};

const loadCart = () => {
  try {
    const stored = localStorage.getItem("opti_cart");
    if (stored) {
      // Del navegador solo se toman id y cantidad; el resto sale del catálogo
      cart = JSON.parse(stored).flatMap(({ id, quantity }) => {
        const product = products.find((p) => p.id === id);
        return product && Number.isInteger(quantity) && quantity > 0
          ? [{ ...product, quantity }]
          : [];
      });
    }
  } catch (e) {
    cart = [];
  }
  updateCartCount();
};

const addToCart = (productId) => {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartCount();
  showToast("Producto añadido al carrito");
};

const renderCart = () => {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!container || !totalEl) return;

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML =
      '<div class="empty-cart">Tu carrito está vacío. Añade productos desde el catálogo.</div>';
    totalEl.textContent = "$0";
    return;
  }

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img src="${item.img}" alt="${item.title}" />
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-meta">
          ${formatPrice(item.price)} · Cantidad: ${item.quantity}
        </div>
      </div>
      <div class="cart-item-actions">
        <button class="btn btn-outline btn-mini" data-remove-item="${item.id}">Eliminar</button>
        <div>${formatPrice(item.price * item.quantity)}</div>
      </div>
    `;
    container.appendChild(el);
  });

  totalEl.textContent = formatPrice(total);

  container.onclick = (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest("[data-remove-item]");
    if (!btn) return;
    const id = Number(btn.getAttribute("data-remove-item"));
    removeFromCart(id);
  };
};

const removeFromCart = (id) => {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
};

const setupCart = () => {
  const cartBtn = document.getElementById("cart-btn");
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!cartBtn || !checkoutBtn) return;

  cartBtn.addEventListener("click", () => {
    renderCart();
    openModal("cart-modal");
  });
};

// -------- CHECKOUT --------
const setupRealCheckout = () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  const chkTotal = document.getElementById("chk-total");
  const checkoutForm = document.getElementById("checkout-form");
  if (!checkoutBtn || !chkTotal || !checkoutForm) return;

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Tu carrito está vacío");
      return;
    }
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    chkTotal.textContent = formatPrice(total);
    openModal("checkout-modal");
  });

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("chk-name").value.trim();
    const address = document.getElementById("chk-address").value.trim();
    const phone = document.getElementById("chk-phone").value.trim();
    const payment = document.getElementById("chk-payment").value;

    if (!name || !address || !phone) {
      showToast("Completa todos los campos");
      return;
    }

    showToast("Compra realizada con éxito 🎉");
    cart = [];
    saveCart();
    updateCartCount();
    closeModal("checkout-modal");
    closeModal("cart-modal");
    checkoutForm.reset();
  });
};

// -------- MODALES GENERALES --------
const openModal = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
};

const closeModal = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
};

const setupModals = () => {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = [...document.querySelectorAll(".modal-backdrop")]
      .filter((el) => el.style.display === "flex")
      .pop();
    if (open) closeModal(open.id);
  });
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close-modal");
      if (id) closeModal(id);
    });
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = "none";
      }
    });
  });
};

// -------- PRODUCTOS (PÁGINA PRODUCTOS) --------
const getCategoryLabel = (cat) => {
  const map = {
    cordones: "Cordones para gafas",
    estuches: "Estuches y fundas",
    limpieza: "Limpieza y cuidado",
    filtros: "Filtros para luz azul",
    otros: "Otros accesorios",
  };
  return map[cat] || "Accesorios";
};

const renderProducts = (category = "all") => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-wrapper">
        <img src="${product.img}" alt="${product.title}" />
        <span class="product-badge">${product.badge}</span>
      </div>
      <div class="product-body">
        <div class="product-title">${product.title}</div>
        <div class="product-category">${getCategoryLabel(product.category)}</div>
        <div class="product-meta">
          <span class="product-price">${formatPrice(product.price)}</span>
          <span class="product-rating">★ ${product.rating
            .toFixed(1)
            .replace(".", ",")}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-mini" data-add-to-cart="${product.id}">
            Añadir al carrito
          </button>
          <small>ID: #${String(product.id).padStart(3, "0")}</small>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
};

const setupFilters = () => {
  const filters = document.getElementById("filters");
  const grid = document.getElementById("product-grid");
  if (!filters || !grid) return;

  filters.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest(".filter-pill");
    if (!btn) return;
    const category = btn.getAttribute("data-category");
    if (!category) return;

    document
      .querySelectorAll(".filter-pill")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(category);
  });

  grid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest("[data-add-to-cart]");
    if (!btn) return;
    const id = Number(btn.getAttribute("data-add-to-cart"));
    addToCart(id);
  });
};

const initProductsPage = () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  setupFilters();
  renderProducts("all");
};

// -------- CONTACTO (PÁGINA CONTACTO) --------
const initContactPage = () => {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Formulario de contacto enviado (demo)");
    form.reset();
  });
};

// -------- INIT GLOBAL --------
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
  loadCart();
  setupModals();
  setupLogin();
  setupCart();
  setupRealCheckout();
  initProductsPage();
  initContactPage();

  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();
});
