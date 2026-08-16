/* ==========================================================================
   ADMIN — ORDERS (orders.js)
   Reads the orders cart.js already saves to localStorage ("hirono_orders")
   on checkout. Lets admin update each order's status; account.js reads
   that same status back so customers see it reflected in their history.
   ========================================================================== */

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Completed", "Cancelled"];

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("orders-table-body");
  const subtitle = document.getElementById("orders-subtitle");

  renderTable();

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

  function saveOrders(orders) {
    localStorage.setItem("hirono_orders", JSON.stringify(orders));
  }

  function renderTable() {
    const orders = getOrders();
    subtitle.textContent = `${orders.length} total order${orders.length === 1 ? "" : "s"}`;

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="no-data">No orders yet</td></tr>`;
      return;
    }

    tableBody.innerHTML = orders.map((o) => renderRow(o)).join("");

    tableBody.querySelectorAll("[data-action='status-change']").forEach((select) => {
      select.addEventListener("change", () => {
        const orderId = select.dataset.id;
        const orders = getOrders();
        const idx = orders.findIndex((o) => String(o.id) === String(orderId));
        if (idx === -1) return;
        orders[idx].status = select.value;
        saveOrders(orders);
        renderTable();
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
        <td class="data-cell text-muted">${escapeHtml(order.ownerEmail || "Guest")}</td>
        <td class="data-cell font-bold">$${Number(order.total || 0).toFixed(2)}</td>
        <td class="data-cell text-muted">${escapeHtml(order.payment || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(order.delivery || "—")}</td>
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
