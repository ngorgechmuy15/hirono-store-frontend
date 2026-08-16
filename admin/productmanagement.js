/* ==========================================================================
   ADMIN PRODUCT MANAGEMENT (productmanagement.js)
   Reads/writes through product-store.js (the shared "hirono_products"
   localStorage store) — the exact same source products.js reads from on
   the storefront. Add/Edit/Delete here take effect immediately there.

   Load order required in productmanagement.html:
     products-data.js, product-store.js, then this file.
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

  if (typeof getAllProducts !== "function") {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">product-store.js isn't loaded on this page — check the &lt;script&gt; tags in productmanagement.html.</td></tr>`;
    return;
  }

  // The form's TYPE dropdown uses friendly singular labels; product-store.js
  // categorizes/filters using these plural labels instead.
  const CATEGORY_MAP = { Figure: "Figures", "Plush Doll": "Plush Dolls", Accessory: "Accessories" };
  const REVERSE_CATEGORY_MAP = { Figures: "Figure", "Plush Dolls": "Plush Doll", Accessories: "Accessory" };

  let editingProductId = null; // null = "add" mode, otherwise the product id being edited

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

  renderTable();

  // --------------------------------------------------
  // RENDER TABLE
  // --------------------------------------------------
  function renderTable() {
    const products = getAllProducts(); // admin sees ALL products, including hidden ones

    if (countHeading) countHeading.textContent = `All Products (${products.length})`;

    if (products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">No products yet — add one above.</td></tr>`;
      return;
    }

    tableBody.innerHTML = products
      .map((p) => {
        const badgeList = [];
        if (p.isNew) badgeList.push(["NEW", "badge-yellow"]);
        if (p.isPopular) badgeList.push(["POP", "badge-purple"]);
        if (p.isLimited) badgeList.push(["LTD", "badge-purple"]);
        if (p.isComingSoon) badgeList.push(["SOON", "badge-pink-light"]);

        const badgesHTML = badgeList.length
          ? `<div class="badge-group">${badgeList.map(([label, cls]) => `<span class="badge ${cls}">${label}</span>`).join("")}</div>`
          : `<span class="text-muted">—</span>`;

        return `
          <tr data-id="${p.id}">
            <td><div class="product-img-box"><img src="${adminImageSrc(p.image)}" alt="${p.name}" /></div></td>
            <td class="font-bold">${p.name}</td>
            <td class="text-muted">${p.series || ""}</td>
            <td><span class="badge badge-pink">${(p.category || "").toUpperCase()}</span></td>
            <td class="font-bold">$${(Number(p.price) || 0).toFixed(2)}</td>
            <td>${badgesHTML}</td>
            <td><span class="badge ${p.visible !== false ? "badge-live" : "badge-hidden"}">${p.visible !== false ? "LIVE" : "HIDDEN"}</span></td>
            <td>
              <div class="row-actions">
                <button type="button" class="icon-btn" data-action="edit" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="icon-btn${p.visible !== false ? " icon-btn-active" : ""}" data-action="toggle-visible" data-id="${p.id}" title="${p.visible !== false ? "Hide from storefront" : "Show on storefront"}"><i class="fa-solid ${p.visible !== false ? "fa-eye" : "fa-eye-slash"}"></i></button>
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
  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const product = getProductById(btn.dataset.id);
    if (!product) return;

    if (btn.dataset.action === "edit") {
      startEdit(product);
    } else if (btn.dataset.action === "delete") {
      handleDelete(product);
    } else if (btn.dataset.action === "toggle-visible") {
      updateProduct(product.id, { visible: product.visible === false });
      renderTable();
    }
  });

  function startEdit(product) {
    editingProductId = product.id;

    nameInput.value = product.name;
    seriesInput.value = product.series || "";
    priceInput.value = product.price;
    typeSelect.value = REVERSE_CATEGORY_MAP[product.category] || "Figure";
    imageInput.value = product.image || "";
    if (chkNew) chkNew.checked = Boolean(product.isNew);
    if (chkPopular) chkPopular.checked = Boolean(product.isPopular);
    if (chkLimited) chkLimited.checked = Boolean(product.isLimited);
    if (chkVisible) chkVisible.checked = product.visible !== false;

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

  function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This removes it from the storefront.`)) return;

    deleteProduct(product.id);
    if (editingProductId === product.id) resetFormToAddMode();
    renderTable();
  }

  // --------------------------------------------------
  // ADD / SAVE FORM
  // --------------------------------------------------
  form.addEventListener("submit", (e) => {
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
      type: typeSelect.value,
      price,
      image,
      isNew: chkNew ? chkNew.checked : false,
      isPopular: chkPopular ? chkPopular.checked : false,
      isLimited: chkLimited ? chkLimited.checked : false,
      visible: chkVisible ? chkVisible.checked : true,
    };

    if (editingProductId) {
      updateProduct(editingProductId, fields);
    } else {
      addProduct(fields);
    }

    resetFormToAddMode();
    renderTable();
  });
});