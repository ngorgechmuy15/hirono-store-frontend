/* ==========================================================================
   CUSTOMER STORE (customer-store.js)
   Single source of truth for registered customer accounts. Older versions
   of this site only ever kept ONE customer (in "hirono_registered_user"),
   which meant the admin dashboard had nothing real to list. This upgrades
   that to a proper list ("hirono_customers") while migrating any old
   single-user record in automatically, so nobody's existing login breaks.
   ========================================================================== */

const CUSTOMERS_KEY = "hirono_customers";

function getAllCustomers() {
  migrateLegacyUserIfNeeded();
  const stored = localStorage.getItem(CUSTOMERS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse hirono_customers:", e);
    return [];
  }
}

function saveAllCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function findCustomerByEmail(email) {
  if (!email) return null;
  const target = email.toLowerCase();
  return getAllCustomers().find((c) => (c.email || "").toLowerCase() === target) || null;
}

// Adds a new customer. Returns false if the email is already registered.
function addCustomer(customer) {
  const customers = getAllCustomers();
  if (findCustomerByEmail(customer.email)) return false;

  customers.push({
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    location: customer.location || "",
    password: customer.password || "",
    status: "active", // "active" | "blocked" — set by admin
    registeredAt: new Date().toISOString(),
  });

  saveAllCustomers(customers);
  return true;
}

// Merges `changes` into the customer with this email. Returns true if found.
function updateCustomerByEmail(email, changes) {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => (c.email || "").toLowerCase() === (email || "").toLowerCase());
  if (idx === -1) return false;
  customers[idx] = { ...customers[idx], ...changes };
  saveAllCustomers(customers);
  return true;
}

// One-time migration: if an old single-customer record exists and hasn't
// been folded into the list yet, add it in.
function migrateLegacyUserIfNeeded() {
  const legacyStr = localStorage.getItem("hirono_registered_user");
  if (!legacyStr) return;

  let legacy;
  try {
    legacy = JSON.parse(legacyStr);
  } catch (e) {
    return;
  }
  if (!legacy || !legacy.email) return;

  const stored = localStorage.getItem(CUSTOMERS_KEY);
  const customers = stored ? JSON.parse(stored) : [];
  const alreadyThere = customers.some(
    (c) => (c.email || "").toLowerCase() === legacy.email.toLowerCase()
  );

  if (!alreadyThere) {
    customers.push({
      name: legacy.name || "",
      email: legacy.email || "",
      phone: legacy.phone || "",
      location: legacy.location || "",
      password: legacy.password || "",
      status: "active",
      registeredAt: new Date().toISOString(),
    });
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }
}
