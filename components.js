/* ==========================================================================
   SHARED CART LOGIC
   Used by index.html ("+ Quick Add") and products.html ("Add to Cart") so
   both buttons write to the exact same cart that cart.html/cart.js reads.
   ========================================================================== */

// Checks localStorage/sessionStorage for a signed-in user
function isUserLoggedIn() {
  const user = localStorage.getItem("hirono_user") || sessionStorage.getItem("userToken");
  return Boolean(user);
}

function getCart() {
  return JSON.parse(localStorage.getItem("hirono_cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("hirono_cart", JSON.stringify(cart));
  updateCartBadge();
}

// Pulls {title, price, imgSrc} out of any ".product-card" element, whether
// it's the index.html markup (h3 + .price + img) or the products.html one.
function extractProductFromCard(card) {
  const titleEl = card.querySelector("h3");
  const priceEl = card.querySelector(".price");
  const imgEl = card.querySelector("img");

  const title = titleEl ? titleEl.innerText.trim() : "";
  const priceText = priceEl ? priceEl.innerText.trim() : "$0";
  const price = parseFloat(priceText.replace("$", "")) || 0;
  const imgSrc = imgEl ? imgEl.getAttribute("src") : "";

  return { title, price, imgSrc };
}

// Adds a product to the cart (or bumps its quantity if it's already there).
// Returns true/false so callers know whether it actually went through.
function addProductToCart(product) {
  if (!product || !product.title) return false;

  if (!isUserLoggedIn()) {
    alert(
      "⚠️ Account Required:\nPlease sign in or create an account to add items to your cart and complete a purchase."
    );
    return false;
  }

  const cart = getCart();
  const existingItem = cart.find((item) => item.title === product.title);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      title: product.title,
      price: product.price,
      imgSrc: product.imgSrc,
      quantity: 1
    });
  }

  saveCart(cart);
  showCartDialog(`"${product.title}" has been added to your cart.`);
  return true;
}

// Shows the "Added to Cart!" popup (markup lives on index.html & products.html)
function showCartDialog(message) {
  const overlay = document.getElementById("cart-dialog-overlay");
  if (!overlay) return;

  const messageEl = document.getElementById("dialog-message");
  if (messageEl && message) messageEl.textContent = message;

  overlay.classList.add("active");
}

// Wires up the close button + click-outside-to-close for the cart dialog
function setupCartDialog() {
  const overlay = document.getElementById("cart-dialog-overlay");
  const closeBtn = document.getElementById("dialog-close-btn");
  if (!overlay) return;

  closeBtn?.addEventListener("click", () => overlay.classList.remove("active"));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
}

// Handles every "+ Quick Add" button on index.html via event delegation,
// so it works even for cards added/rendered after the page first loads.
function setupQuickAddButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-cart");
    if (!btn) return;

    const card = btn.closest(".product-card");
    if (!card) return;

    const product = extractProductFromCard(card);
    addProductToCart(product);
  });
}

// Function to update Cart Count from localStorage
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('hirono_cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const cartBadges = document.querySelectorAll('.cart-badge, #cart-badge');
  cartBadges.forEach(badge => {
    badge.textContent = totalItems;
  });
}

// Function to automatically highlight the current page link (Pink Underline)
function highlightActiveLink() {
  // Get current page filename (e.g. "index.html", "products.html", "features.html")
  let currentPath = window.location.pathname.split("/").pop();

  // Handle root URL or empty pathname
  if (currentPath === "" || currentPath === "/") {
    currentPath = "index.html";
  }

  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");

    // Clear previous active state
    link.classList.remove("active");

    // Compare link href with current filename
    if (linkHref === currentPath) {
      link.classList.add("active");
    }
  });
}

// Function to render the dynamic User Menu inside Navbar
function renderUserAuth() {
  const userContainer = document.getElementById('nav-user-container');
  const currentUserStr = localStorage.getItem('hirono_user');
  const userData = currentUserStr ? JSON.parse(currentUserStr) : null;

  if (!userContainer) return;

  if (userData) {
    const fullName = userData.name || userData.fullname || 'User';
    const firstInitial = fullName.charAt(0).toUpperCase();

    userContainer.innerHTML = `
      <div class="user-menu-wrapper" style="position: relative; display: inline-block;">
        <button id="user-menu-btn" style="
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffe6eb;
          color: #ff3366;
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
        ">
          <span style="
            background: #ff3366;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
          ">${firstInitial}</span>
          <span>${fullName}</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem;"></i>
        </button>

        <!-- Dropdown Menu -->
        <div id="user-dropdown" style="
          display: none;
          position: absolute;
          right: 0;
          top: 110%;
          background: #ffffff;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          border-radius: 10px;
          width: 160px;
          overflow: hidden;
          z-index: 1000;
        ">
          <a href="account.html" style="
            display: block;
            padding: 10px 16px;
            color: #333;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.85rem;
            transition: background 0.2s;
          ">
            <i class="fa-solid fa-user" style="margin-right: 8px; color: #ff3366;"></i> My Account
          </a>
          <button id="nav-signout-btn" style="
            width: 100%;
            text-align: left;
            padding: 10px 16px;
            color: #e63946;
            background: none;
            border: none;
            border-top: 1px solid #f0f0f0;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background 0.2s;
          ">
            <i class="fa-solid fa-right-from-bracket" style="margin-right: 8px;"></i> Sign Out
          </button>
        </div>
      </div>
    `;

    // Dropdown toggle logic
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    const signOutBtn = document.getElementById('nav-signout-btn');

    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      if (dropdown) dropdown.style.display = 'none';
    });

    signOutBtn?.addEventListener('click', () => {
      localStorage.removeItem('hirono_user');
      window.location.href = 'login.html';
    });

  } else {
    userContainer.innerHTML = `
      <a href="login.html" class="btn-login" style="
        background: #ff3366;
        color: white;
        padding: 8px 18px;
        border-radius: 20px;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
        display: inline-block;
      ">Login</a>
    `;
  }
}

// Universal Component Loader (fetches navigation.html and footer.html)
async function loadComponents() {
  const navPlaceholder = document.getElementById('navbar-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  // 1. Fetch & inject Navigation if placeholder exists
  if (navPlaceholder) {
    try {
      const response = await fetch('navigation.html');
      if (response.ok) {
        navPlaceholder.innerHTML = await response.text();
        renderUserAuth();
        updateCartBadge();
        highlightActiveLink(); // Runs active underline detection after header renders
      }
    } catch (err) {
      console.error('Failed to load navigation.html:', err);
    }
  } else {
    // If navbar is static on the page, still trigger link highlighting
    highlightActiveLink();
  }

  // 2. Fetch & inject Footer if placeholder exists
  if (footerPlaceholder) {
    try {
      const response = await fetch('footer.html');
      if (response.ok) {
        footerPlaceholder.innerHTML = await response.text();
      }
    } catch (err) {
      console.error('Failed to load footer.html:', err);
    }
  }
}

// Execute on Page Load
document.addEventListener('DOMContentLoaded', () => {
  loadComponents();
  updateCartBadge();
  setupCartDialog();
  setupQuickAddButtons();
});