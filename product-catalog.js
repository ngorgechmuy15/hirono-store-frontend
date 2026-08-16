/* ==========================================================================
   PRODUCT CATALOG DATA LAYER (product-catalog.js)
   Shared between products.js (storefront) and admin/productmanagement.js.

   The 144 base products live as static HTML cards inside products.html.
   This layer lets the admin dashboard add / edit / delete products *on
   top of* that static base — persisted in localStorage — without ever
   having to touch products.html by hand. Both the storefront and the
   admin table call applyAdminCatalogChanges() on the same base list so
   they always agree on what the "real" catalog currently looks like.
   ========================================================================== */

const PRODUCT_CATALOG_KEYS = {
  deleted: "hirono_deleted_product_ids", // ids of BASE products the admin removed
  overrides: "hirono_product_overrides", // { [baseProductId]: {edited fields} }
  added: "hirono_admin_products" // brand-new products created in the admin panel
};

function getDeletedProductIds() {
  return JSON.parse(localStorage.getItem(PRODUCT_CATALOG_KEYS.deleted)) || [];
}
function saveDeletedProductIds(ids) {
  localStorage.setItem(PRODUCT_CATALOG_KEYS.deleted, JSON.stringify(ids));
}

function getProductOverrides() {
  return JSON.parse(localStorage.getItem(PRODUCT_CATALOG_KEYS.overrides)) || {};
}
function saveProductOverrides(overrides) {
  localStorage.setItem(PRODUCT_CATALOG_KEYS.overrides, JSON.stringify(overrides));
}

function getAdminAddedProducts() {
  return JSON.parse(localStorage.getItem(PRODUCT_CATALOG_KEYS.added)) || [];
}
function saveAdminAddedProducts(products) {
  localStorage.setItem(PRODUCT_CATALOG_KEYS.added, JSON.stringify(products));
}

// Maps a badge label to the color class products.css already defines.
const BADGE_TAG_CLASSES = {
  NEW: "yellow-tag",
  POPULAR: "popular-tag",
  LIMITED: "purple-tag",
  "COMING SOON": "blue-tag"
};

// Builds the exact HTML markup for a single product card, matching the
// template used throughout products.html, so admin-added/edited cards
// render identically to the original static ones.
function buildProductCardHTML(product) {
  const badges = product.badges || [];
  const badgesHTML = badges.length
    ? `<div class="multi-badges">${badges
        .map(b => `<span class="badge-tag ${BADGE_TAG_CLASSES[b] || "yellow-tag"}">${b}</span>`)
        .join("")}</div>`
    : "";

  const price = Number(product.price) || 0;

  return `<div class="product-card" data-id="${product.id}">
      <div class="card-image-wrap">
        <img src="${product.imgSrc || ""}" alt="${product.title || ""}" />
        ${badgesHTML}
      </div>
      <div class="card-body">
        <span class="category-tag pink-tag">${product.category || ""}</span>
        <h3>${product.title || ""}</h3>
        <p class="series-name">${product.series || ""}</p>
        <div class="card-footer">
          <span class="price">$${price.toFixed(2)}</span>
          <button class="btn-add-cart">Add to Cart</button>
        </div>
      </div>
    </div>`;
}

// Given the base product list parsed from products.html's static DOM,
// applies admin deletions + edits + additions to produce the *effective*
// catalog that should actually be shown/sold on the storefront (and shown
// in the admin product table).
function applyAdminCatalogChanges(baseProducts) {
  const deletedIds = new Set(getDeletedProductIds());
  const overrides = getProductOverrides();
  const addedProducts = getAdminAddedProducts();

  const effective = baseProducts
    .filter(p => !deletedIds.has(p.id))
    .map(p => {
      const override = overrides[p.id];
      if (!override) return p;

      const merged = { ...p, ...override, isAdminEdited: true };
      merged.priceText = `$${(Number(merged.price) || 0).toFixed(2)}`;
      merged.isNewArrival = (merged.badges || []).includes("NEW");
      merged.originalHTML = buildProductCardHTML(merged); // re-render since fields changed
      return merged;
    });

  addedProducts.forEach(p => {
    const priceText = `$${(Number(p.price) || 0).toFixed(2)}`;
    effective.push({
      ...p,
      priceText,
      isNewArrival: (p.badges || []).includes("NEW"),
      isAdminAdded: true,
      originalHTML: buildProductCardHTML(p)
    });
  });

  return effective;
}

// Parses every ".product-card" out of a raw HTML string (products.html's
// content, fetched as text) into the same plain-object shape products.js
// builds from the live DOM — used by the admin panel, which doesn't have
// products.html's DOM directly available.
function parseProductsFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const cards = doc.querySelectorAll(".products-grid .product-card");

  // .innerText requires a live layout/render tree, which a detached
  // DOMParser-created document doesn't have in every browser — fall back
  // to .textContent so this can't silently break depending on engine.
  const getText = (el) => (el ? (el.innerText || el.textContent || "").trim() : "");

  return Array.from(cards).map((card, index) => {
    const id = card.getAttribute("data-id") || `product-${index + 1}`;
    const title = getText(card.querySelector("h3"));
    const priceText = getText(card.querySelector(".price")) || "$0";
    const price = parseFloat(priceText.replace("$", "")) || 0;
    const category = getText(card.querySelector(".category-tag"));
    const series = getText(card.querySelector(".series-name"));
    const imgSrc = card.querySelector("img") ? card.querySelector("img").getAttribute("src") : "";
    const badges = Array.from(card.querySelectorAll(".badge-tag")).map((b) => getText(b).toUpperCase());

    return {
      id,
      title,
      price,
      priceText,
      category,
      series,
      imgSrc,
      badges,
      isNewArrival: badges.includes("NEW"),
      originalHTML: card.outerHTML
    };
  });
}