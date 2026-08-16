/* ==========================================================================
   ADMIN — OVERVIEW DASHBOARD (overview.js)
   Pulls live numbers from the product store, customer store, and
   hirono_orders instead of the old hardcoded placeholders.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const metricProducts = document.getElementById("metric-products");
  const metricOrders = document.getElementById("metric-orders");
  const metricRevenue = document.getElementById("metric-revenue");
  const metricCustomers = document.getElementById("metric-customers");
  const recentBody = document.getElementById("recent-purchases-body");

  const products = typeof getAllProducts === "function" ? getAllProducts() : [];
  const customers = typeof getAllCustomers === "function" ? getAllCustomers() : [];
  const orders = getOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  metricProducts.textContent = products.length;
  metricOrders.textContent = orders.length;
  metricRevenue.textContent = `$${totalRevenue.toFixed(2)}`;
  metricCustomers.textContent = customers.length;

  renderRecentPurchases(orders.slice(0, 5));

  function getOrders() {
    const stored = localStorage.getItem("hirono_orders");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function renderRecentPurchases(recentOrders) {
    if (recentOrders.length === 0) {
      recentBody.innerHTML = `<tr><td colspan="6" class="no-data">No orders yet</td></tr>`;
      return;
    }

    recentBody.innerHTML = recentOrders
      .map(
        (o) => `
      <tr>
        <td class="data-cell text-muted">${escapeHtml(o.ownerEmail || "Guest")}</td>
        <td class="data-cell font-bold">#${escapeHtml(o.id)}</td>
        <td class="data-cell font-bold">$${Number(o.total || 0).toFixed(2)}</td>
        <td class="data-cell text-muted">${escapeHtml(o.payment || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(o.delivery || "—")}</td>
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
