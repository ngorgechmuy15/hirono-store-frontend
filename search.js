/* ==========================================================================
   SEARCH PAGE FUNCTIONALITY (search.js)
   Loads every product straight out of products.html, filters them live as
   the user types, and sends the chosen product to products.html so it can
   be shown first with a black highlight border.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("search-results");
  if (!searchInput || !resultsContainer) return;

  let allProducts = [];
  let debounceTimer = null;

  loadProductsCatalog();

  // --------------------------------------------------
  // LOAD ALL PRODUCTS FROM THE SHARED STORE (product-store.js)
  // Only visible products are searchable, matching what's actually on
  // products.html — a product the admin hides won't show up here either.
  // --------------------------------------------------
  function loadProductsCatalog() {
    try {
      const storeProducts = getVisibleProducts();
      allProducts = storeProducts.map((p) => ({
        id: p.id,
        title: p.name,
        priceText: `$${Number(p.price).toFixed(2)}`,
        category: p.category,
        series: p.series,
        imgSrc: p.image,
      }));
    } catch (err) {
      console.error("Failed to load products catalog for search:", err);
      resultsContainer.innerHTML = `<p class="search-placeholder-text">Couldn't load products right now. Please try again.</p>`;
    }
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(searchInput.value.trim()), 200);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const matches = filterProducts(searchInput.value.trim());
      if (matches.length > 0) goToProduct(matches[0]);
    }
  });

  // --------------------------------------------------
  // SEARCH LOGIC
  // --------------------------------------------------
  function runSearch(query) {
    if (!query) {
      resultsContainer.innerHTML = `<p class="search-placeholder-text">Start typing to search any products</p>`;
      return;
    }

    const matches = filterProducts(query);

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<p class="search-placeholder-text">No products found for "${escapeHtml(query)}"</p>`;
      return;
    }

    resultsContainer.innerHTML = `
      <div class="search-results-list">
        ${matches.slice(0, 8).map(renderResultRow).join("")}
      </div>
    `;

    resultsContainer.querySelectorAll(".search-result-item").forEach((row) => {
      row.addEventListener("click", () => {
        const product = allProducts.find((p) => p.id === row.getAttribute("data-id"));
        if (product) goToProduct(product);
      });
    });
  }

  function filterProducts(query) {
    const q = query.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.series.toLowerCase().includes(q)
    );
  }

  function renderResultRow(product) {
    return `
      <div class="search-result-item" data-id="${product.id}">
        <img src="${product.imgSrc}" alt="${escapeHtml(product.title)}" class="search-result-img" />
        <div class="search-result-info">
          <span class="search-result-title">${escapeHtml(product.title)}</span>
          <span class="search-result-category">${escapeHtml(product.category)}</span>
        </div>
        <span class="search-result-price">${product.priceText}</span>
      </div>
    `;
  }

  // Sends the user to products.html with the matched product flagged to be
  // moved first + highlighted (see products.js "pendingHighlightId" logic).
  function goToProduct(product) {
    window.location.href = `products.html?highlight=${encodeURIComponent(product.id)}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
