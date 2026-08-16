/* ==========================================================================
   PRODUCTS PAGE FUNCTIONALITY (products.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. STATE MANAGEMENT
  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = "All"; // "All", "New Arrivals", "Figures", "Plush Dolls", "Accessories"
  let currentSeries = "default";
  let currentPage = 1;
  const ITEMS_PER_PAGE = 16; // Fixed page size
  const PAGE_WINDOW_SIZE = 3; // How many page-number buttons are visible at once

  // If the user arrived here from search.html, this holds the id of the
  // product that should be moved to the front of the grid + highlighted.
  let pendingHighlightId = new URLSearchParams(window.location.search).get(
    "highlight",
  );

  // 2. DOM ELEMENTS
  const productsGrid = document.querySelector(".products-grid");
  const filterPills = document.querySelectorAll(".filter-pill");
  const sortSelect = document.querySelector(".sort-select");
  const itemsCountText = document.querySelector(".items-count");

  // 3. INITIALIZATION
  init();

  function init() {
    loadStoreProducts();
    setupEventListeners();
    applyFiltersAndSort();
  }

  // --------------------------------------------------
  // LOAD PRODUCTS FROM THE SHARED STORE (product-store.js)
  // Only products the admin has left visible show up here — this is what
  // lets the admin dashboard control what actually appears on the site.
  // --------------------------------------------------
  function loadStoreProducts() {
    const storeProducts = getVisibleProducts();

    allProducts = storeProducts.map((product) => {
      const badges = [];
      if (product.isComingSoon) badges.push("COMING SOON");
      if (product.isNew) badges.push("NEW");
      if (product.isPopular) badges.push("POPULAR");
      if (product.isLimited) badges.push("LIMITED");

      return {
        id: product.id,
        title: product.name,
        price: Number(product.price) || 0,
        priceText: `$${Number(product.price).toFixed(2)}`,
        category: product.category,
        series: product.series,
        imgSrc: product.image,
        badges,
        isNewArrival: Boolean(product.isNew),
        originalHTML: renderProductCardHTML(product), // built from the store, not scraped DOM
      };
    });

    filteredProducts = [...allProducts];
  }

  // --------------------------------------------------
  // EVENT LISTENERS SETUP
  // --------------------------------------------------
  function setupEventListeners() {
    // Filter Pills Click
    filterPills.forEach((pill) => {
      pill.addEventListener("click", (e) => {
        filterPills.forEach((p) => p.classList.remove("active"));
        e.target.classList.add("active");

        currentCategory = e.target.innerText.trim();
        currentPage = 1;
        pendingHighlightId = null; // user is browsing manually now, drop the search highlight

        // Picking a category pill means "show me this category" — clear any
        // collection filter so it doesn't silently AND against it and hide everything.
        currentSeries = "default";
        if (sortSelect) sortSelect.value = "default";

        applyFiltersAndSort();
      });
    });

    // Sort Dropdown Change
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSeries = e.target.value;
        currentPage = 1;
        pendingHighlightId = null;

        // Picking a collection means "show me this collection" — reset the
        // category pill back to "All" so a leftover category pick (e.g.
        // "Accessories") can't hide a collection that lives in another category.
        currentCategory = "All";
        filterPills.forEach((p) => p.classList.remove("active"));
        const allPill = Array.from(filterPills).find(
          (p) => p.innerText.trim() === "All",
        );
        if (allPill) allPill.classList.add("active");

        applyFiltersAndSort();
      });
    }

    // Event Delegation for "Add to Cart" Buttons
    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add-cart");
      if (btn) {
        const card = btn.closest(".product-card");
        // extractProductFromCard() / addProductToCart() live in components.js
        // (loaded before this file) so Quick Add and Add to Cart share one cart.
        const product = extractProductFromCard(card);
        addProductToCart(product);
      }
    });
  }

  // --------------------------------------------------
  // FILTER & SORT ENGINE
  // --------------------------------------------------
  function applyFiltersAndSort() {
    // 1. Category / New Arrivals Filtering
    filteredProducts = allProducts.filter((product) => {
      if (currentCategory === "All") {
        return true;
      }
      if (currentCategory === "New Arrivals") {
        return product.isNewArrival;
      }
      return product.category.toLowerCase() === currentCategory.toLowerCase();
    });

    // 2. Series Sorting/Filtering
    if (currentSeries !== "default") {
      filteredProducts = filteredProducts.filter((product) => {
        const productSeries = product.series.toLowerCase();
        const targetSeries = currentSeries.toLowerCase().replace(/-/g, " ");
        return (
          productSeries.includes(targetSeries) ||
          targetSeries.includes(productSeries)
        );
      });
    }

    // 3. If we arrived from a search click, pull that exact product AND
    // every other product from the same collection/series to the very
    // front — so searching "Hirono Echo" surfaces the whole Echo lineup
    // together, with the exact match leading (and getting the highlight
    // border) — not just the single card that was clicked.
    if (pendingHighlightId) {
      const matchedProduct = filteredProducts.find(
        (p) => p.id === pendingHighlightId,
      );

      if (matchedProduct) {
        const targetSeries = matchedProduct.series;

        const sameCollection = filteredProducts.filter(
          (p) => p.id !== pendingHighlightId && p.series === targetSeries,
        );
        const rest = filteredProducts.filter(
          (p) => p.id !== pendingHighlightId && p.series !== targetSeries,
        );

        filteredProducts = [matchedProduct, ...sameCollection, ...rest];
        currentPage = 1;
      } else {
        pendingHighlightId = null; // nothing matched (e.g. filtered out), don't try to highlight
      }
    }

    // 4. Update Item Counter Text
    if (itemsCountText) {
      itemsCountText.innerText = `${filteredProducts.length} item${filteredProducts.length === 1 ? "" : "s"} found`;
    }

    renderGrid();
    renderPagination();
  }

  // --------------------------------------------------
  // RENDER GRID WITH PAGINATION
  // --------------------------------------------------
  function renderGrid() {
    productsGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #6b7280;">
          <h3>No products found</h3>
          <p>Try resetting your filter or select a different collection.</p>
        </div>
      `;
      return;
    }

    // Calculate Slice for Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    pageProducts.forEach((product) => {
      productsGrid.insertAdjacentHTML("beforeend", product.originalHTML);
    });

    // If we came from a search click, mark that card with a black border
    // and bring it into view so it's obvious which item matched.
    if (pendingHighlightId) {
      const targetCard = productsGrid.querySelector(
        `[data-id="${pendingHighlightId}"]`,
      );
      if (targetCard) {
        targetCard.classList.add("search-highlight");
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  // --------------------------------------------------
  // RENDER PAGINATION CONTROLS (windowed: shows PAGE_WINDOW_SIZE page
  // numbers at a time; Prev/Next step one page at a time, and the window
  // only jumps forward/back once you cross its edge)
  // --------------------------------------------------
  function renderPagination() {
    // Remove existing pagination container if present
    const existingPagination = document.querySelector(".pagination-container");
    if (existingPagination) {
      existingPagination.remove();
    }

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return; // No pagination needed for 1 page or empty results

    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";

    // Prev Button — steps back one page; if that page falls outside the
    // current window, the window recalculated below shifts back with it.
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left"></i> Prev`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        pendingHighlightId = null; // manual navigation clears the search highlight
        renderGrid();
        renderPagination();
        scrollToSectionTop();
      }
    });

    // Page Numbers — only render the PAGE_WINDOW_SIZE numbers that contain
    // currentPage (e.g. window 1: pages 1-3, window 2: pages 4-6, etc.)
    const numbersContainer = document.createElement("div");
    numbersContainer.className = "pagination-numbers";

    const windowStart =
      Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
    const windowEnd = Math.min(windowStart + PAGE_WINDOW_SIZE - 1, totalPages);

    for (let i = windowStart; i <= windowEnd; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-num ${i === currentPage ? "active" : ""}`;
      pageBtn.innerText = i;
      pageBtn.addEventListener("click", () => {
        currentPage = i;
        pendingHighlightId = null;
        renderGrid();
        renderPagination();
        scrollToSectionTop();
      });
      numbersContainer.appendChild(pageBtn);
    }

    // Next Button — steps forward one page; once currentPage crosses past
    // the end of this window, the recalculated window jumps forward too.
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.innerHTML = `Next <i class="fa-solid fa-chevron-right"></i>`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        pendingHighlightId = null;
        renderGrid();
        renderPagination();
        scrollToSectionTop();
      }
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(numbersContainer);
    paginationContainer.appendChild(nextBtn);

    // Append to products section
    document
      .querySelector(".products-section .section-container")
      .appendChild(paginationContainer);
  }

  function scrollToSectionTop() {
    const section = document.querySelector(".products-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }
});
