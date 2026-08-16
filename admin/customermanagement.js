/* ==========================================================================
   ADMIN — CUSTOMER MANAGEMENT (customermanagement.js)
   Reads the shared customer store (customer-store.js). Lets admin block or
   unblock an account; login.js checks this status on sign-in.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("customers-table-body");
  const subtitle = document.getElementById("customers-subtitle");

  renderTable();

  function renderTable() {
    const customers = getAllCustomers();
    subtitle.textContent = `${customers.length} registered customer${customers.length === 1 ? "" : "s"}`;

    if (customers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">No registered customers yet</td></tr>`;
      return;
    }

    tableBody.innerHTML = customers.map((c) => renderRow(c)).join("");

    tableBody.querySelectorAll("[data-action='toggle-status']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        const customer = findCustomerByEmail(email);
        if (!customer) return;
        const nextStatus = customer.status === "blocked" ? "active" : "blocked";
        updateCustomerByEmail(email, { status: nextStatus });
        renderTable();
      });
    });
  }

  function renderRow(customer) {
    const isBlocked = customer.status === "blocked";
    return `
      <tr>
        <td class="data-cell font-bold">${escapeHtml(customer.name || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(customer.email || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(customer.phone || "—")}</td>
        <td class="data-cell text-muted">${escapeHtml(customer.location || "—")}</td>
        <td class="data-cell">
          <span class="badge ${isBlocked ? "badge-blocked" : "badge-active"}">${isBlocked ? "BLOCKED" : "ACTIVE"}</span>
        </td>
        <td class="data-cell">
          <button type="button" class="icon-btn ${isBlocked ? "" : "icon-btn-danger"}" data-action="toggle-status" data-email="${escapeAttr(customer.email)}" title="${isBlocked ? "Unblock this customer" : "Block this customer"}">
            <i class="fa-solid ${isBlocked ? "fa-lock-open" : "fa-lock"}"></i>
          </button>
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
