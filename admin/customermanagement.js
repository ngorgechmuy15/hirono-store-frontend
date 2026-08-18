/* ==========================================================================
   ADMIN — CUSTOMER MANAGEMENT (customermanagement.js)
   Reads/writes customer accounts through the real Django backend
   (api-config.js). Block/unblock here is enforced server-side at login —
   see LoginView in store/views.py.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("customers-table-body");
  const subtitle = document.getElementById("customers-subtitle");

  loadCustomers();

  async function loadCustomers() {
    tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Loading customers…</td></tr>`;
    try {
      const data = await apiRequest("/customers/");
      const customers = data.results || data;
      renderTable(customers);
    } catch (err) {
      console.error("Failed to load customers:", err);
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Couldn't load customers — check that the backend is reachable, then refresh.</td></tr>`;
    }
  }

  function renderTable(customers) {
    subtitle.textContent = `${customers.length} registered customer${customers.length === 1 ? "" : "s"}`;

    if (customers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">No registered customers yet</td></tr>`;
      return;
    }

    tableBody.innerHTML = customers.map((c) => renderRow(c)).join("");

    tableBody.querySelectorAll("[data-action='toggle-status']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const isCurrentlyBlocked = btn.dataset.blocked === "true";
        btn.disabled = true;
        try {
          await apiRequest(`/customers/${id}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_blocked: !isCurrentlyBlocked }),
          });
          loadCustomers();
        } catch (err) {
          alert(err.message || "Couldn't update this customer.");
          btn.disabled = false;
        }
      });
    });
  }

  function renderRow(customer) {
    const isBlocked = Boolean(customer.is_blocked);
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
          <button type="button" class="icon-btn ${isBlocked ? "" : "icon-btn-danger"}" data-action="toggle-status" data-id="${escapeAttr(customer.id)}" data-blocked="${isBlocked}" title="${isBlocked ? "Unblock this customer" : "Block this customer"}">
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
