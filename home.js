/* ==========================================================================
   HOMEPAGE PRODUCT SECTIONS (home.js)
   Renders "Popular Picks" and "Freshly Dropped" from the shared product
   store (product-store.js) so admin edits/adds/removals show up here too.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const popularGrid = document.getElementById("popular-picks-grid");
  const newArrivalsGrid = document.getElementById("new-arrivals-grid");
  if (!popularGrid && !newArrivalsGrid) return;

  const products = getVisibleProducts();

  if (popularGrid) {
    const popular = products.filter((p) => p.isPopular).slice(0, 4);
    popularGrid.innerHTML = popular.length
      ? popular.map((p) => renderHomeProductCardHTML(p, null)).join("")
      : `<p style="color:#6b7280;">No popular picks yet — mark some products as Popular in the admin dashboard.</p>`;
  }

  if (newArrivalsGrid) {
    const fresh = products.filter((p) => p.isNew).slice(0, 4);
    newArrivalsGrid.innerHTML = fresh.length
      ? fresh.map((p) => renderHomeProductCardHTML(p, "NEW")).join("")
      : `<p style="color:#6b7280;">No new arrivals yet — mark some products as New in the admin dashboard.</p>`;
  }
});
