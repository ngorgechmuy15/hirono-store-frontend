/* ==========================================================================
   ADMIN — OVERVIEW DASHBOARD (overview.js)
   Products still come from product-store.js (localStorage) — Orders and
   Customers now come from the real Django backend (api-config.js).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const metricProducts = document.getElementById("metric-products");
  const metricOrders = document.getElementById("metric-orders");
  const metricRevenue = document.getElementById("metric-revenue");
  const metricCustomers = document.getElementById("metric-customers");
  const recentBody = document.getElementById("recent-purchases-body");

  let products = [];
  try {
    const productsData = await apiRequest("/products/?all=true&page_size=500");
    products = productsData.results || productsData;
  } catch (err) {
    console.error("Failed to load products:", err);
  }
  metricProducts.textContent = products.length;

  let orders = [];
  let customers = [];

  try {
    const [ordersData, customersData] = await Promise.all([
      apiRequest("/orders/"),
      apiRequest("/customers/"),
    ]);
    orders = ordersData.results || ordersData;
    customers = customersData.results || customersData;
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    recentBody.innerHTML = `<tr><td colspan="6" class="no-data">Couldn't load orders — check that the backend is reachable, then refresh.</td></tr>`;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  metricOrders.textContent = orders.length;
  metricRevenue.textContent = `$${totalRevenue.toFixed(2)}`;
  metricCustomers.textContent = customers.length;

  renderRecentPurchases(orders.slice(0, 5));

  function renderRecentPurchases(recentOrders) {
    if (recentOrders.length === 0) {
      recentBody.innerHTML = `<tr><td colspan="6" class="no-data">No orders yet</td></tr>`;
      return;
    }

    recentBody.innerHTML = recentOrders
      .map(
        (o) => `
      <tr>
        <td class="data-cell text-muted">${escapeHtml(o.customer_email || "Guest")}</td>
        <td class="data-cell font-bold">#${escapeHtml(o.id)}</td>
        <td class="data-cell font-bold">$${Number(o.total || 0).toFixed(2)}</td>
        <td class="data-cell text-muted">${escapeHtml(o.payment_method || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(o.delivery_method || "—")}</td>
        <td class="data-cell"><a class="link-action" href="orders.html">View &rarr;</a></td>
      </tr>
    `
      )
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
});
