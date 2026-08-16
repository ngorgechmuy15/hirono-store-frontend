// Global state: 'register' or 'signin'
let currentMode = "register";

// Main switchTab Function
function switchTab(mode) {
  currentMode = mode;

  // Buttons
  const tabSignIn = document.getElementById("tab-signin");
  const tabRegister = document.getElementById("tab-register");

  // Form Titles & Headers
  const formTitle = document.querySelector(".form-title");
  const formSubtext = document.querySelector(".form-subtext");
  const btnSubmit = document.getElementById("btn-submit-auth");
  const toggleFooter = document.getElementById("toggle-footer");

  // Form Field Groups
  const groupFullName = document.getElementById("group-fullname");
  const groupLoginID = document.getElementById("group-login-id");
  const groupEmail = document.getElementById("group-email");
  const groupPhoneLocation = document.getElementById("group-phone-location");
  const groupConfirmPassword = document.getElementById(
    "group-confirm-password",
  );

  if (!tabSignIn || !tabRegister) return;

  if (mode === "signin") {
    // Active Tab Styling
    tabSignIn.classList.add("active");
    tabRegister.classList.remove("active");

    // Text Updates
    if (formTitle) formTitle.textContent = "Welcome Back";
    if (formSubtext)
      formSubtext.textContent =
        "Sign in to access your Hirono collection and orders.";
    if (btnSubmit) btnSubmit.textContent = "Sign In";
    if (toggleFooter) {
      toggleFooter.innerHTML = `Don't have an account? <a href="#" id="link-switch">Create one here</a>`;
    }

    // Show Sign-in fields / Hide Registration-only fields
    if (groupFullName) groupFullName.style.display = "none";
    if (groupEmail) groupEmail.style.display = "none";
    if (groupPhoneLocation) groupPhoneLocation.style.display = "none";
    if (groupConfirmPassword) groupConfirmPassword.style.display = "none";
    if (groupLoginID) groupLoginID.style.display = "flex";
  } else {
    // Active Tab Styling
    tabRegister.classList.add("active");
    tabSignIn.classList.remove("active");

    // Text Updates
    if (formTitle) formTitle.textContent = "Join us today";
    if (formSubtext)
      formSubtext.textContent =
        "Create an account to start your Hirono collection.";
    if (btnSubmit) btnSubmit.textContent = "Create Account";
    if (toggleFooter) {
      toggleFooter.innerHTML = `Already have an account? <a href="#" id="link-switch">Sign in here</a>`;
    }

    // Show Registration fields / Hide Sign-in fields
    if (groupFullName) groupFullName.style.display = "flex";
    if (groupEmail) groupEmail.style.display = "flex";
    if (groupPhoneLocation) groupPhoneLocation.style.display = "grid";
    if (groupConfirmPassword) groupConfirmPassword.style.display = "flex";
    if (groupLoginID) groupLoginID.style.display = "none";
  }

  // Re-bind bottom footer toggle link dynamically
  const linkSwitch = document.getElementById("link-switch");
  if (linkSwitch) {
    linkSwitch.onclick = (e) => {
      e.preventDefault();
      switchTab(currentMode === "register" ? "signin" : "register");
    };
  }
}

// Attach Event Listeners on Load
function initAuthListeners() {
  const tabSignIn = document.getElementById("tab-signin");
  const tabRegister = document.getElementById("tab-register");
  const linkSwitch = document.getElementById("link-switch");

  // Dialog Elements
  const dialogOverlay = document.getElementById("auth-dialog-overlay");
  const dialogBtnClose = document.getElementById("dialog-btn-close");

  // Direct Onclick handlers for bulletproof tab switching
  if (tabSignIn) {
    tabSignIn.onclick = () => switchTab("signin");
  }

  if (tabRegister) {
    tabRegister.onclick = () => switchTab("register");
  }

  if (linkSwitch) {
    linkSwitch.onclick = (e) => {
      e.preventDefault();
      switchTab(currentMode === "register" ? "signin" : "register");
    };
  }

  if (dialogBtnClose) {
    dialogBtnClose.onclick = () => {
      if (dialogOverlay) dialogOverlay.style.display = "none";
    };
  }
}

// Main Form Handler (Called by onsubmit="handleAuthSubmit(event)")
function handleAuthSubmit(event) {
  event.preventDefault();

  if (currentMode === "register") {
    handleRegistration();
  } else {
    handleSignIn();
  }
}

// 1. CREATE ACCOUNT LOGIC
function handleRegistration() {
  const fullname = document.getElementById("fullname")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const location = document.getElementById("location")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;

  if (!fullname || !email || !password) {
    alert("Please fill in all required fields (Full Name, Email, Password).");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match. Please re-enter.");
    return;
  }

  const newUser = {
    name: fullname,
    email: email,
    phone: phone,
    location: location,
    password: password,
  };

  // addCustomer() (customer-store.js) returns false if this email is
  // already registered, so someone can't silently overwrite another
  // account by "re-registering" with the same address.
  const created = addCustomer(newUser);
  if (!created) {
    alert("An account with that email already exists. Please sign in instead.");
    switchTab("signin");
    return;
  }

  // Keep the legacy single-user key in sync too, for any old code path
  // that still reads it directly.
  localStorage.setItem("hirono_registered_user", JSON.stringify(newUser));
  localStorage.setItem("hirono_user", JSON.stringify(newUser));

  alert("Account created successfully! Welcome to Hirono Cambodia.");
  window.location.href = "index.html";
}

// 2. SIGN IN LOGIC
// Admin credentials (demo/hardcoded — this project has no backend, so this
// is a simple client-side gate; change ADMIN_EMAIL/ADMIN_PASSWORD below to
// whatever you'd like the real admin login to be).
const ADMIN_EMAIL = "admin@hirono.com";
const ADMIN_PASSWORD = "admin123";

function handleSignIn() {
  const loginId = document
    .getElementById("login-id")
    ?.value.trim()
    .toLowerCase();
  const password = document.getElementById("password")?.value;

  if (!loginId || !password) {
    alert("Please fill in your Email/Phone and Password.");
    return;
  }

  // Admin sign-in — checked first since the admin account isn't part of
  // the regular customer "hirono_registered_user" record.
  if (loginId === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    localStorage.setItem("hirono_admin", "true");
    window.location.href = "admin/overview.html";
    return;
  }

  // Look across every registered customer (not just the last one to
  // register) for an email or phone match.
  const cleanLoginId = loginId.replace(/\D/g, "");
  const allCustomers = getAllCustomers();

  const matchedCustomer = allCustomers.find((c) => {
    const isEmailMatch = loginId === (c.email || "").toLowerCase();
    const cleanCustomerPhone = (c.phone || "").replace(/\D/g, "");
    const isPhoneMatch = cleanLoginId.length > 0 && cleanLoginId === cleanCustomerPhone;
    return isEmailMatch || isPhoneMatch;
  });

  if (!matchedCustomer) {
    showAuthModal(
      "No Account Found",
      "You don't have an account yet. Please create an account first to continue.",
    );
    return;
  }

  if (password !== matchedCustomer.password) {
    showAuthModal(
      "Sign In Failed",
      "Incorrect email/phone number or password. Please try again.",
    );
    return;
  }

  if (matchedCustomer.status === "blocked") {
    showAuthModal(
      "Account Blocked",
      "This account has been blocked by an administrator. Please contact support.",
    );
    return;
  }

  // Crucial: set the active session user
  localStorage.setItem("hirono_user", JSON.stringify(matchedCustomer));
  localStorage.setItem("hirono_registered_user", JSON.stringify(matchedCustomer));
  alert(`Welcome back, ${matchedCustomer.name || "User"}!`);
  window.location.href = "account.html"; // Ensure it redirects directly to account page
}

// Helper for Modal Dialog
function showAuthModal(title, message) {
  const dialogOverlay = document.getElementById("auth-dialog-overlay");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogMessage = document.getElementById("dialog-message");
  const dialogBtnAction = document.getElementById("dialog-btn-action");

  if (dialogTitle) dialogTitle.textContent = title;
  if (dialogMessage) dialogMessage.textContent = message;

  if (dialogBtnAction) {
    dialogBtnAction.onclick = () => {
      if (dialogOverlay) dialogOverlay.style.display = "none";
      switchTab("register");
    };
  }

  if (dialogOverlay) {
    dialogOverlay.style.display = "flex";
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initAuthListeners();
});