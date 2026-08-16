/* ==========================================================================
   PRODUCT STORE (product-store.js)
   Single source of truth for the product catalog. Everything reads/writes
   here — the storefront (index.html, products.html, search.html) and the
   admin dashboard (admin/productmanagement.html). No backend, so
   localStorage is the "database": DEFAULT_PRODUCTS (from products-data.js)
   seeds it once, then admin edits persist on top of that.

   Load order matters: products-data.js must be included BEFORE this file.
   ========================================================================== */

const PRODUCTS_KEY = "hirono_products";

// Returns every product (including hidden ones) — used by admin.
function getAllProducts() {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    const seed = typeof DEFAULT_PRODUCTS !== "undefined" ? DEFAULT_PRODUCTS : [];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse hirono_products, resetting to defaults:", e);
    const seed = typeof DEFAULT_PRODUCTS !== "undefined" ? DEFAULT_PRODUCTS : [];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }
}

// Returns only products the admin has left visible — used by the storefront.
function getVisibleProducts() {
  return getAllProducts().filter((p) => p.visible !== false);
}

function saveAllProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProductById(id) {
  return getAllProducts().find((p) => p.id === id) || null;
}

// Adds a new product. Returns the created product (with generated id).
function addProduct(product) {
  const products = getAllProducts();
  const id = "p_" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  const newProduct = {
    id,
    name: product.name || "",
    series: product.series || "",
    category: product.category || "",
    type: product.type || product.category || "",
    price: Number(product.price) || 0,
    image: product.image || "",
    isNew: Boolean(product.isNew),
    isPopular: Boolean(product.isPopular),
    isLimited: Boolean(product.isLimited),
    isComingSoon: Boolean(product.isComingSoon),
    visible: product.visible !== false,
  };
  products.unshift(newProduct);
  saveAllProducts(products);
  return newProduct;
}

// Merges `changes` into the product with this id. Returns true if found.
function updateProduct(id, changes) {
  const products = getAllProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], ...changes };
  saveAllProducts(products);
  return true;
}

function deleteProduct(id) {
  const products = getAllProducts();
  const next = products.filter((p) => p.id !== id);
  saveAllProducts(next);
  return next.length !== products.length;
}

// Category label -> the CSS tag color already defined in products.css
function categoryTagClass(category) {
  const map = {
    Figures: "pink-tag",
    "Plush Dolls": "purple-tag",
    Accessories: "yellow-accent-tag",
  };
  return map[category] || "pink-tag";
}

// Builds the exact product-card markup products.html/products.js expects.
function renderProductCardHTML(product) {
  const badges = [];
  if (product.isComingSoon) badges.push('<span class="badge-tag blue-tag">COMING SOON</span>');
  if (product.isNew) badges.push('<span class="badge-tag yellow-tag">NEW</span>');
  if (product.isPopular) badges.push('<span class="badge-tag purple-tag">POPULAR</span>');
  if (product.isLimited) badges.push('<span class="badge-tag purple-tag">LIMITED</span>');

  const badgeHTML =
    badges.length > 1
      ? `<div class="multi-badges">${badges.join("")}</div>`
      : badges.join("");

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="card-image-wrap">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" />
        ${badgeHTML}
      </div>
      <div class="card-body">
        <span class="category-tag ${categoryTagClass(product.category)}">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="series-name">${escapeHtml(product.series)}</p>
        <div class="card-footer">
          <span class="price">$${Number(product.price).toFixed(2)}</span>
          <button class="btn-add-cart">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

// Builds the markup used on index.html's smaller "quick add" cards.
function renderHomeProductCardHTML(product, badgeLabel) {
  const tagClass = product.category === "Accessories" ? "purple-tag" : "pink-tag";
  const badge = badgeLabel ? `<span class="badge-new">${badgeLabel}</span>` : "";
  return `
    <div class="product-card" data-id="${product.id}">
      <div class="card-img">
        ${badge}
        <img src="${product.image}" alt="${escapeHtml(product.name)}" />
      </div>
      <div class="card-body">
        <span class="tag ${tagClass}">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="card-footer">
          <span class="price">$${Number(product.price).toFixed(2)}</span>
          <button class="btn-cart">+ Quick Add</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
