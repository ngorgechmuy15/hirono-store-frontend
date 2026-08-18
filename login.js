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
async function handleRegistration() {
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

  try {
    // Talks to the real Django backend (api-config.js) — accounts are now
    // shared across every device/browser, not just the one that signed up.
    const customer = await apiRequest("/register/", {
      method: "POST",
      body: JSON.stringify({ name: fullname, email, phone, location, password }),
    });

    localStorage.setItem("hirono_user", JSON.stringify(customer));
    alert("Account created successfully! Welcome to Hirono Cambodia.");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message || "Couldn't create your account. Please try again.");
  }
}

// 2. SIGN IN LOGIC
// Admin credentials (demo/hardcoded — separate from the real Customer
// accounts below, which now live in the Django backend).
const ADMIN_EMAIL = "admin@hirono.com";
const ADMIN_PASSWORD = "admin123";

async function handleSignIn() {
  const loginId = document
    .getElementById("login-id")
    ?.value.trim()
    .toLowerCase();
  const password = document.getElementById("password")?.value;

  if (!loginId || !password) {
    alert("Please fill in your Email/Phone and Password.");
    return;
  }

  // Admin sign-in — checked first since the admin account isn't a real
  // Customer record.
  if (loginId === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    localStorage.setItem("hirono_admin", "true");
    window.location.href = "admin/overview.html";
    return;
  }

  // Customer sign-in currently matches by email only (phone-number sign-in
  // would need a matching backend lookup endpoint, which the API doesn't
  // expose yet — enter the email you registered with).
  try {
    const customer = await apiRequest("/login/", {
      method: "POST",
      body: JSON.stringify({ email: loginId, password }),
    });

    localStorage.setItem("hirono_user", JSON.stringify(customer));
    alert(`Welcome back, ${customer.name || "User"}!`);
    window.location.href = "account.html";
  } catch (err) {
    const message = err.message || "";
    if (/no account/i.test(message)) {
      showAuthModal("No Account Found", "You don't have an account yet. Please create an account first to continue.");
    } else if (/suspended|blocked/i.test(message)) {
      showAuthModal("Account Blocked", "This account has been blocked by an administrator. Please contact support.");
    } else {
      showAuthModal("Sign In Failed", "Incorrect email or password. Please try again.");
    }
  }
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