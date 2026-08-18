/* ==========================================================================
   ADMIN — ORDERS (orders.js)
   Reads/writes orders through the real Django backend (api-config.js) so
   every order placed on any device shows up here, and status changes made
   here are reflected back on the customer's account.html purchase history.
   ========================================================================== */

const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("orders-table-body");
  const subtitle = document.getElementById("orders-subtitle");

  loadOrders();

  async function loadOrders() {
    tableBody.innerHTML = `<tr><td colspan="7" class="no-data">Loading orders…</td></tr>`;
    try {
      const data = await apiRequest("/orders/");
      const orders = data.results || data;
      renderTable(orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      tableBody.innerHTML = `<tr><td colspan="7" class="no-data">Couldn't load orders — check that the backend is reachable, then refresh.</td></tr>`;
    }
  }

  function renderTable(orders) {
    subtitle.textContent = `${orders.length} total order${orders.length === 1 ? "" : "s"}`;

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="no-data">No orders yet</td></tr>`;
      return;
    }

    tableBody.innerHTML = orders.map((o) => renderRow(o)).join("");

    tableBody.querySelectorAll("[data-action='status-change']").forEach((select) => {
      select.addEventListener("change", async () => {
        const orderId = select.dataset.id;
        const newStatus = select.value;
        select.disabled = true;
        try {
          await apiRequest(`/orders/${orderId}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          });
          loadOrders(); // re-render with the confirmed server state (and refreshed badge)
        } catch (err) {
          alert(err.message || "Couldn't update order status.");
          select.disabled = false;
        }
      });
    });
  }

  function renderRow(order) {
    const status = order.status || "Pending";
    const badgeClass = `badge-${status.toLowerCase()}`;
    const optionsHTML = ORDER_STATUSES.map(
      (s) => `<option value="${s}" ${s === status ? "selected" : ""}>${s}</option>`
    ).join("");

    return `
      <tr>
        <td class="data-cell font-bold">#${escapeHtml(order.id)}</td>
        <td class="data-cell text-muted">${escapeHtml(order.customer_email || "Guest")}</td>
        <td class="data-cell font-bold">$${Number(order.total || 0).toFixed(2)}</td>
        <td class="data-cell text-muted">${escapeHtml(order.payment_method || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(order.delivery_method || "—")}</td>
        <td class="data-cell"><span class="badge ${badgeClass}">${escapeHtml(status.toUpperCase())}</span></td>
        <td class="data-cell">
          <select class="status-select" data-action="status-change" data-id="${escapeAttr(order.id)}">
            ${optionsHTML}
          </select>
        </td>
      </tr>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }
});
