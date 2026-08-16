/* ==========================================================================
   SHOPPING CART & CHECKOUT SYSTEM (cart.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. STATE MANAGEMENT
  let cart = [];

  // 2. DOM ELEMENTS
  const cartContentSection = document.querySelector(".cart-content-section");
  
  // Clear Cart Dialog Elements
  const clearCartDialog = document.getElementById("clear-cart-dialog");
  const cancelClearBtn = document.getElementById("cancel-clear-btn");
  const confirmClearBtn = document.getElementById("confirm-clear-btn");

  // Checkout Modal Elements
  const checkoutModal = document.getElementById("checkout-modal");
  const closeCheckoutX = document.getElementById("close-checkout-x");
  const checkoutItemsList = document.getElementById("checkout-items-list");
  const checkoutSubtotalPrice = document.getElementById("checkout-subtotal-price");
  const checkoutDeliveryLabel = document.getElementById("checkout-delivery-label");
  const checkoutDeliveryPrice = document.getElementById("checkout-delivery-price");
  const checkoutTotalPrice = document.getElementById("checkout-total-price");
  const checkoutBackBtn = document.getElementById("checkout-back-btn");
  const checkoutContinueBtn = document.getElementById("checkout-continue-btn");

  // Payment QR Elements
  const paymentQrBox = document.getElementById("payment-qr-box");
  const paymentQrImg = document.getElementById("payment-qr-img");
  const paymentQrBankName = document.getElementById("payment-qr-bank-name");
  const paymentQrAmount = document.getElementById("payment-qr-amount");

  // Delivery Details Elements
  const deliveryDetailsBox = document.getElementById("delivery-details-box");
  const deliveryLocationInput = document.getElementById("delivery-location");
  const deliveryPhoneInput = document.getElementById("delivery-phone");

  // Reference data: QR image per payment method, and delivery fee per method
  const PAYMENT_QR_IMAGES = {
    ABA: "images/abaqr.JPG",
    ACLEDA: "images/acledaqr.PNG"
  };
  const PAYMENT_QR_BANK_NAMES = {
    ABA: "ABA Mobile",
    ACLEDA: "ACLEDA Mobile"
  };
  const DELIVERY_FEES = {
    VET: 2.5,
    "J&T": 2.0,
    "Pick up": 0
  };
  const DELIVERY_LABELS = {
    VET: "VET Delivery",
    "J&T": "J&T Delivery",
    "Pick up": "Pick Up"
  };

  // Receipt Modal Elements
  const receiptModal = document.getElementById("receipt-modal");
  const receiptDate = document.getElementById("receipt-date");
  const receiptPayment = document.getElementById("receipt-payment");
  const receiptDelivery = document.getElementById("receipt-delivery");
  const receiptDeliverTo = document.getElementById("receipt-deliver-to");
  const receiptItemsList = document.getElementById("receipt-items-list");
  const receiptSubtotal = document.getElementById("receipt-subtotal");
  const receiptDeliveryLabel = document.getElementById("receipt-delivery-label");
  const receiptDeliveryFee = document.getElementById("receipt-delivery-fee");
  const receiptTotal = document.getElementById("receipt-total");
  const receiptCloseBtn = document.getElementById("receipt-close-btn");
  const receiptDownloadBtn = document.getElementById("receipt-download-btn");

  // 3. INITIALIZATION
  initCart();

  function initCart() {
    loadCartFromStorage();
    renderCartView();
    setupEventListeners();
  }

  // --------------------------------------------------
  // STORAGE & DATA HANDLING
  // --------------------------------------------------
  function loadCartFromStorage() {
    const savedCart = localStorage.getItem("hirono_cart");
    cart = savedCart ? JSON.parse(savedCart) : [];
  }

  function saveCartToStorage() {
    localStorage.setItem("hirono_cart", JSON.stringify(cart));
    // Optional: Update navbar badge counter if available
    if (window.updateNavCartCount) {
      window.updateNavCartCount();
    }
  }

  // --------------------------------------------------
  // UI RENDER ENGINE
  // --------------------------------------------------
  function renderCartView() {
    if (!cartContentSection) return;

    if (cart.length === 0) {
      // Show Empty Cart State
      cartContentSection.innerHTML = `
        <div class="empty-cart-card">
          <div class="cart-icon-wrapper">
            <i class="fa-solid fa-cart-shopping cart-illustration"></i>
          </div>
          <h2 class="empty-title">Your cart is empty</h2>
          <p class="empty-subtitle">Start adding some Hirono collectibles!</p>
          <a href="products.html" class="btn-browse-products">Browse Products</a>
        </div>
      `;
      return;
    }

    // Render Cart with Items & Summary Panel
    const totalAmount = calculateTotal();

    cartContentSection.innerHTML = `
      <div class="cart-container">
        <div class="cart-items-wrapper">
          <div class="cart-header-row">
            <h2>Your Items (${cart.reduce((sum, item) => sum + item.quantity, 0)})</h2>
            <button id="trigger-clear-cart" class="btn-clear-all">
              <i class="fa-solid fa-trash-can"></i> Clear Cart
            </button>
          </div>
          <div class="cart-items-list">
            ${cart.map((item, index) => renderCartItemRow(item, index)).join('')}
          </div>
        </div>

        <div class="cart-summary-card">
          <h3>Order Summary</h3>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>$${totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <hr class="summary-divider">
          <div class="summary-row total-row">
            <span>Total</span>
            <span class="summary-grand-total">$${totalAmount.toFixed(2)}</span>
          </div>
          <button id="trigger-checkout" class="btn-checkout">
            Proceed to Checkout
          </button>
        </div>
      </div>
    `;

    bindCartItemEvents();
  }

  function renderCartItemRow(item, index) {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    return `
      <div class="cart-item-card" data-index="${index}">
        <img src="${item.imgSrc || 'placeholder.jpg'}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.title}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-quantity-controls">
          <button class="qty-btn btn-minus" data-index="${index}">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn btn-plus" data-index="${index}">+</button>
        </div>
        <div class="cart-item-total">$${itemTotal}</div>
        <button class="btn-remove-item" data-index="${index}" title="Remove item">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // --------------------------------------------------
  // DYNAMIC DOMEVENT BINDING (CART ACTIONS)
  // --------------------------------------------------
  function bindCartItemEvents() {
    // Quantity Decrement (-)
    document.querySelectorAll(".btn-minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity--;
        } else {
          cart.splice(idx, 1);
        }
        saveCartToStorage();
        renderCartView();
      });
    });

    // Quantity Increment (+)
    document.querySelectorAll(".btn-plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        cart[idx].quantity++;
        saveCartToStorage();
        renderCartView();
      });
    });

    // Single Item Remove
    document.querySelectorAll(".btn-remove-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        cart.splice(idx, 1);
        saveCartToStorage();
        renderCartView();
      });
    });

    // Trigger Clear All Modal
    const clearBtn = document.getElementById("trigger-clear-cart");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (clearCartDialog) clearCartDialog.classList.add("active");
      });
    }

    // Trigger Checkout Modal
    const checkoutBtn = document.getElementById("trigger-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", openCheckoutModal);
    }
  }

  // --------------------------------------------------
  // GLOBAL EVENT LISTENERS (MODALS)
  // --------------------------------------------------
  function setupEventListeners() {
    // Clear Cart Dialog Handlers
    if (cancelClearBtn) {
      cancelClearBtn.addEventListener("click", () => {
        clearCartDialog.classList.remove("active");
      });
    }

    if (confirmClearBtn) {
      confirmClearBtn.addEventListener("click", () => {
        cart = [];
        saveCartToStorage();
        clearCartDialog.classList.remove("active");
        renderCartView();
      });
    }

    // Checkout Modal Close Actions
    if (closeCheckoutX) {
      closeCheckoutX.addEventListener("click", () => {
        checkoutModal.classList.remove("active");
      });
    }

    if (checkoutBackBtn) {
      checkoutBackBtn.addEventListener("click", () => {
        checkoutModal.classList.remove("active");
      });
    }

    // Checkout Continue -> Show Receipt
    if (checkoutContinueBtn) {
      checkoutContinueBtn.addEventListener("click", processCheckoutAndShowReceipt);
    }

    // Payment method change -> show/hide QR box + refresh totals
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
      radio.addEventListener("change", () => {
        updatePaymentQrBox();
      });
    });

    // Delivery method change -> show/hide location+phone fields + refresh totals
    document.querySelectorAll('input[name="delivery_method"]').forEach(radio => {
      radio.addEventListener("change", () => {
        updateDeliveryDetailsBox();
        updateCheckoutTotals();
      });
    });

    // Receipt Modal Close & Download Actions
    if (receiptCloseBtn) {
      receiptCloseBtn.addEventListener("click", () => {
        receiptModal.classList.remove("active");
        // Clear cart after completing purchase
        cart = [];
        saveCartToStorage();
        renderCartView();
      });
    }

    if (receiptDownloadBtn) {
      receiptDownloadBtn.addEventListener("click", () => {
        window.print();
      });
    }
  }

  // --------------------------------------------------
  // LIVE CHECKOUT HELPERS (QR box / delivery fields / totals)
  // --------------------------------------------------
  function getSelectedPayment() {
    return document.querySelector('input[name="payment_method"]:checked')?.value || "Cash";
  }

  function getSelectedDelivery() {
    return document.querySelector('input[name="delivery_method"]:checked')?.value || "VET";
  }

  function getDeliveryFee() {
    const delivery = getSelectedDelivery();
    return DELIVERY_FEES[delivery] !== undefined ? DELIVERY_FEES[delivery] : 0;
  }

  // Shows the ABA/ACLEDA QR image when one of those is selected; hides it for Cash
  function updatePaymentQrBox() {
    if (!paymentQrBox) return;

    const payment = getSelectedPayment();
    const qrSrc = PAYMENT_QR_IMAGES[payment];

    if (qrSrc) {
      paymentQrImg.src = qrSrc;
      paymentQrBankName.innerText = PAYMENT_QR_BANK_NAMES[payment] || payment;
      paymentQrBox.style.display = "block";
    } else {
      paymentQrBox.style.display = "none";
    }

    updateCheckoutTotals(); // refreshes the amount shown under the QR
  }

  // Shows the location/phone inputs for VET & J&T; hides them for Pick up
  function updateDeliveryDetailsBox() {
    if (!deliveryDetailsBox) return;

    const delivery = getSelectedDelivery();
    deliveryDetailsBox.style.display = delivery === "Pick up" ? "none" : "block";
  }

  // Recalculates Subtotal / Delivery / Total in the checkout modal
  function updateCheckoutTotals() {
    const subtotal = calculateTotal();
    const deliveryFee = getDeliveryFee();
    const grandTotal = subtotal + deliveryFee;
    const delivery = getSelectedDelivery();

    if (checkoutSubtotalPrice) checkoutSubtotalPrice.innerText = `$${subtotal.toFixed(2)}`;
    if (checkoutDeliveryLabel) checkoutDeliveryLabel.innerText = DELIVERY_LABELS[delivery] || "Delivery";
    if (checkoutDeliveryPrice) {
      checkoutDeliveryPrice.innerText = deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`;
    }
    if (checkoutTotalPrice) checkoutTotalPrice.innerText = `$${grandTotal.toFixed(2)}`;
    if (paymentQrAmount) paymentQrAmount.innerText = `$${grandTotal.toFixed(2)}`;
  }

  // --------------------------------------------------
  // CHECKOUT MODAL LOGIC
  // --------------------------------------------------
  function openCheckoutModal() {
    if (!checkoutModal) return;

    // Render Checkout Items List
    checkoutItemsList.innerHTML = cart.map(item => `
      <div class="checkout-item-row">
        <div class="checkout-item-left">
          <img src="${item.imgSrc || 'placeholder.jpg'}" alt="${item.title}" class="checkout-item-img">
          <div>
            <p class="checkout-item-name">${item.title}</p>
            <p class="checkout-item-sub">Qty: ${item.quantity} &times; $${item.price.toFixed(2)}</p>
          </div>
        </div>
        <span class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    // Reflect whatever payment/delivery method is currently selected
    updatePaymentQrBox();
    updateDeliveryDetailsBox();
    updateCheckoutTotals();

    checkoutModal.classList.add("active");
  }

  // --------------------------------------------------
  // RECEIPT MODAL LOGIC
  // --------------------------------------------------
  function processCheckoutAndShowReceipt() {
    // Read selected options
    const paymentSelected = getSelectedPayment();
    const deliverySelected = getSelectedDelivery();
    const deliveryFee = getDeliveryFee();
    const subtotal = calculateTotal();
    const grandTotal = subtotal + deliveryFee;

    const deliveryLocation = deliveryLocationInput ? deliveryLocationInput.value.trim() : "";
    const deliveryPhone = deliveryPhoneInput ? deliveryPhoneInput.value.trim() : "";

    // VET / J&T need somewhere + someone to deliver to; Pick up doesn't
    if (deliverySelected !== "Pick up" && (!deliveryLocation || !deliveryPhone)) {
      alert("Please enter your delivery location and phone number to continue.");
      return;
    }

    // Populate Receipt Modal Data
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (receiptDate) receiptDate.innerText = `Date: ${currentDate}`;
    if (receiptPayment) receiptPayment.innerText = paymentSelected;
    if (receiptDelivery) receiptDelivery.innerText = DELIVERY_LABELS[deliverySelected] || deliverySelected;

    if (receiptDeliverTo) {
      if (deliverySelected !== "Pick up") {
        receiptDeliverTo.innerText = `Deliver to: ${deliveryLocation} · ${deliveryPhone}`;
        receiptDeliverTo.style.display = "block";
      } else {
        receiptDeliverTo.style.display = "none";
      }
    }

    if (receiptItemsList) {
      receiptItemsList.innerHTML = cart.map(item => `
        <div class="receipt-item-row">
          <div class="receipt-item-left">
            <img src="${item.imgSrc || 'placeholder.jpg'}" alt="${item.title}" class="receipt-item-img">
            <span class="receipt-item-name">${item.title} &times;${item.quantity}</span>
          </div>
          <span class="receipt-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');
    }

    if (receiptSubtotal) receiptSubtotal.innerText = `$${subtotal.toFixed(2)}`;
    if (receiptDeliveryLabel) receiptDeliveryLabel.innerText = DELIVERY_LABELS[deliverySelected] || "Delivery";
    if (receiptDeliveryFee) {
      receiptDeliveryFee.innerText = deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`;
    }
    if (receiptTotal) receiptTotal.innerText = `$${grandTotal.toFixed(2)}`;

    // Record this purchase so it shows up under "Purchase History" on
    // account.html (account.js already reads from "hirono_orders").
    saveOrderToHistory(paymentSelected, deliverySelected, {
      subtotal,
      deliveryFee,
      grandTotal,
      deliveryLocation: deliverySelected !== "Pick up" ? deliveryLocation : "",
      deliveryPhone: deliverySelected !== "Pick up" ? deliveryPhone : ""
    });

    // Reset delivery fields for next time
    if (deliveryLocationInput) deliveryLocationInput.value = "";
    if (deliveryPhoneInput) deliveryPhoneInput.value = "";

    // Switch Modals
    checkoutModal.classList.remove("active");
    receiptModal.classList.add("active");
  }

  // --------------------------------------------------
  // PURCHASE HISTORY (read by account.js)
  // --------------------------------------------------
  function saveOrderToHistory(payment, delivery, breakdown) {
    const orders = JSON.parse(localStorage.getItem("hirono_orders")) || [];

    // Tag the order with whichever account is signed in right now, so
    // account.html can show each user only *their own* orders instead of
    // every order ever placed on this browser.
    const currentUserStr = localStorage.getItem("hirono_user");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const ownerEmail = currentUser && currentUser.email ? currentUser.email.toLowerCase() : null;

    orders.unshift({
      id: Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }),
      status: "Pending", // updated by admin in admin/orders.html
      total: breakdown.grandTotal, // the actual charged amount, incl. delivery fee
      subtotal: breakdown.subtotal,
      deliveryFee: breakdown.deliveryFee,
      deliveryLocation: breakdown.deliveryLocation,
      deliveryPhone: breakdown.deliveryPhone,
      payment,
      delivery,
      ownerEmail,
      items: cart.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        imgSrc: item.imgSrc
      }))
    });

    localStorage.setItem("hirono_orders", JSON.stringify(orders));
  }
});