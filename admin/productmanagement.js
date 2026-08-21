/* ==========================================================================
   ADMIN PRODUCT MANAGEMENT (productmanagement.js)
   Reads/writes through the real Django backend (api-config.js) — the same
   API products.js reads from on the storefront. Add/Edit/Delete/Visibility
   changes made here now apply for every visitor, on any device.

   Load order required in productmanagement.html: api-config.js, then this file.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("product-form");
  const nameInput = document.getElementById("p-name");
  const seriesInput = document.getElementById("p-series");
  const priceInput = document.getElementById("p-price");
  const typeSelect = document.getElementById("p-type");
  const imageInput = document.getElementById("p-image");
  const chkNew = document.getElementById("chk-new");
  const chkPopular = document.getElementById("chk-popular");
  const chkLimited = document.getElementById("chk-limited");
  const chkVisible = document.getElementById("chk-visible");
  const submitBtn = document.getElementById("p-submit-btn");
  const cancelBtn = document.getElementById("p-cancel-edit-btn");
  const formHeading = document.getElementById("form-card-title");
  const countHeading = document.getElementById("products-count-title");
  const tableBody = document.getElementById("products-table-body");

  if (!form || !tableBody) return;

  if (typeof apiRequest !== "function") {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">api-config.js isn't loaded on this page — check the &lt;script&gt; tags in productmanagement.html.</td></tr>`;
    return;
  }

  // The form's TYPE dropdown uses friendly singular labels; the backend
  // categorizes/filters using these plural labels instead.
  const CATEGORY_MAP = { Figure: "Figures", "Plush Doll": "Plush Dolls", Accessory: "Accessories" };
  const REVERSE_CATEGORY_MAP = { Figures: "Figure", "Plush Dolls": "Plush Doll", Accessories: "Accessory" };

  let editingProductId = null; // null = "add" mode, otherwise the product id being edited
  let products = [];

  // Image paths (e.g. "images/hirono-figures/...") are written relative to
  // the site root, which is correct for products.html but breaks here
  // since this page lives one folder deeper, at admin/. Absolute/external
  // URLs (http..., data:...) are left untouched.
  function adminImageSrc(imgSrc) {
    if (!imgSrc) return imgSrc;
    if (/^(https?:)?\/\//i.test(imgSrc) || imgSrc.startsWith("data:") || imgSrc.startsWith("../")) {
      return imgSrc;
    }
    return `../${imgSrc}`;
  }

  loadProducts();

  // --------------------------------------------------
  // LOAD + RENDER TABLE
  // --------------------------------------------------
  async function loadProducts() {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">Loading products…</td></tr>`;
    try {
      // ?all=true so admin sees hidden products too — see ProductViewSet.get_queryset()
      const data = await apiRequest("/products/?all=true&page_size=500");
      products = data.results || data;
      renderTable();
    } catch (err) {
      console.error("Failed to load products:", err);
      tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">Couldn't load products — check that the backend is reachable, then refresh.</td></tr>`;
    }
  }

  function renderTable() {
    if (countHeading) countHeading.textContent = `All Products (${products.length})`;

    if (products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">No products yet — add one above.</td></tr>`;
      return;
    }

    tableBody.innerHTML = products
      .map((p) => {
        const badgeList = [];
        if (p.is_new) badgeList.push(["NEW", "badge-yellow"]);
        if (p.is_popular) badgeList.push(["POP", "badge-purple"]);
        if (p.is_limited) badgeList.push(["LTD", "badge-purple"]);
        if (p.is_coming_soon) badgeList.push(["SOON", "badge-pink-light"]);

        const badgesHTML = badgeList.length
          ? `<div class="badge-group">${badgeList.map(([label, cls]) => `<span class="badge ${cls}">${label}</span>`).join("")}</div>`
          : `<span class="text-muted">—</span>`;

        return `
          <tr data-id="${p.id}">
            <td><div class="product-img-box"><img src="${adminImageSrc(p.image)}" alt="${p.name}" /></div></td>
            <td class="font-bold">${p.name}</td>
            <td class="text-muted">${p.series_name || ""}</td>
            <td><span class="badge badge-pink">${(p.category_name || "").toUpperCase()}</span></td>
            <td class="font-bold">$${(Number(p.price) || 0).toFixed(2)}</td>
            <td>${badgesHTML}</td>
            <td><span class="badge ${p.is_visible !== false ? "badge-live" : "badge-hidden"}">${p.is_visible !== false ? "LIVE" : "HIDDEN"}</span></td>
            <td>
              <div class="row-actions">
                <button type="button" class="icon-btn" data-action="edit" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="icon-btn${p.is_visible !== false ? " icon-btn-active" : ""}" data-action="toggle-visible" data-id="${p.id}" title="${p.is_visible !== false ? "Hide from storefront" : "Show on storefront"}"><i class="fa-solid ${p.is_visible !== false ? "fa-eye" : "fa-eye-slash"}"></i></button>
                <button type="button" class="icon-btn icon-btn-danger" data-action="delete" data-id="${p.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // --------------------------------------------------
  // TABLE ACTIONS (Edit / Show-Hide / Delete)
  // --------------------------------------------------
  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const product = products.find((p) => String(p.id) === btn.dataset.id);
    if (!product) return;

    if (btn.dataset.action === "edit") {
      startEdit(product);
    } else if (btn.dataset.action === "delete") {
      await handleDelete(product);
    } else if (btn.dataset.action === "toggle-visible") {
      btn.disabled = true;
      try {
        await apiRequest(`/products/${product.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_visible: product.is_visible === false }),
        });
        loadProducts();
      } catch (err) {
        alert(err.message || "Couldn't update visibility.");
        btn.disabled = false;
      }
    }
  });

  function startEdit(product) {
    editingProductId = product.id;

    nameInput.value = product.name;
    seriesInput.value = product.series_name || "";
    priceInput.value = product.price;
    typeSelect.value = REVERSE_CATEGORY_MAP[product.category_name] || "Figure";
    imageInput.value = product.image || "";
    if (chkNew) chkNew.checked = Boolean(product.is_new);
    if (chkPopular) chkPopular.checked = Boolean(product.is_popular);
    if (chkLimited) chkLimited.checked = Boolean(product.is_limited);
    if (chkVisible) chkVisible.checked = product.is_visible !== false;

    if (formHeading) formHeading.textContent = `Edit "${product.name}"`;
    if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
    if (cancelBtn) cancelBtn.style.display = "inline-flex";

    if (form.scrollIntoView) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFormToAddMode() {
    editingProductId = null;
    form.reset();
    if (chkVisible) chkVisible.checked = true;
    if (formHeading) formHeading.textContent = "Add New Product";
    if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Add Product`;
    if (cancelBtn) cancelBtn.style.display = "none";
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetFormToAddMode);
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This removes it from the storefront.`)) return;

    try {
      await apiRequest(`/products/${product.id}/`, { method: "DELETE" });
      if (editingProductId === product.id) resetFormToAddMode();
      loadProducts();
    } catch (err) {
      alert(err.message || "Couldn't delete this product.");
    }
  }

  // --------------------------------------------------
  // ADD / SAVE FORM
  // --------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const series = seriesInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = CATEGORY_MAP[typeSelect.value] || typeSelect.value;
    const image = imageInput.value.trim();

    if (!name || !series || Number.isNaN(price) || price < 0 || !image) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    const fields = {
      name,
      series,
      category,
      price,
      image,
      is_new: chkNew ? chkNew.checked : false,
      is_popular: chkPopular ? chkPopular.checked : false,
      is_limited: chkLimited ? chkLimited.checked : false,
      is_visible: chkVisible ? chkVisible.checked : true,
    };

    try {
      if (editingProductId) {
        await apiRequest(`/products/${editingProductId}/`, { method: "PATCH", body: JSON.stringify(fields) });
      } else {
        await apiRequest("/products/", { method: "POST", body: JSON.stringify(fields) });
      }
      resetFormToAddMode();
      loadProducts();
    } catch (err) {
      alert(err.message || "Couldn't save this product.");
    }
  });
});
