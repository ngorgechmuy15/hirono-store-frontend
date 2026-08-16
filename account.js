document.addEventListener('DOMContentLoaded', () => {
  // 1. Fetch user data from localStorage
  const currentUserStr = localStorage.getItem('hirono_user');
  
  // If not logged in, redirect to login page
  if (!currentUserStr) {
    window.location.href = 'login.html';
    return;
  }

  const userData = JSON.parse(currentUserStr);

  // 2. Populate Header Banner & Profile Info
  renderProfileData(userData);

  // 3. Populate Purchase History
  renderPurchaseHistory(userData);

  // 4. Initialize Edit Profile Modal Logic
  initEditProfileModal(userData);
});

// Populate Profile Information into HTML
function renderProfileData(user) {
  const fullName = user.name || user.fullname || 'User';
  const email = user.email || 'N/A';
  const phone = user.phone || 'N/A';
  const location = user.location || 'N/A';
  const initial = fullName.charAt(0).toUpperCase();

  // Header Banner Elements
  document.getElementById('banner-avatar').textContent = initial;
  document.getElementById('banner-fullname').textContent = fullName;
  document.getElementById('banner-email').textContent = email;

  // Profile Card Information
  document.getElementById('info-fullname').textContent = fullName;
  document.getElementById('info-email').textContent = email;
  document.getElementById('info-phone').textContent = phone;
  document.getElementById('info-location').textContent = location;
}

// Maps an order status to an inline badge style (kept inline to match the
// rest of this file's existing style, which builds all markup as strings)
function statusBadgeStyle(status) {
  const styles = {
    Pending: 'background: #fef9e7; color: #a16207;',
    Processing: 'background: #eef2ff; color: #4338ca;',
    Shipped: 'background: #eef6ff; color: #1d4ed8;',
    Completed: 'background: #e6f4ea; color: #137333;',
    Cancelled: 'background: #fde8e8; color: #dc2626;',
  };
  return styles[status] || styles.Pending;
}

// Populate Purchase History from localStorage
function renderPurchaseHistory(user) {  const allOrders = JSON.parse(localStorage.getItem('hirono_orders')) || [];

  // Only show orders that belong to the signed-in account — otherwise
  // every account on this browser would see every order ever placed.
  const currentEmail = (user && user.email ? user.email : '').toLowerCase();
  const orders = allOrders.filter(order => order.ownerEmail && order.ownerEmail === currentEmail);

  const historyCard = document.querySelector('.account-card:nth-child(2)');

  if (!historyCard) return;

  const orderCountText = historyCard.querySelector('.sub-text');
  if (orderCountText) {
    orderCountText.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'} placed`;
  }

  // If user has orders, render them dynamically
  if (orders.length > 0) {
    const emptyState = historyCard.querySelector('.empty-history-state');
    if (emptyState) emptyState.style.display = 'none';

    let ordersListHTML = '<div class="orders-list" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">';

    orders.forEach((order, index) => {
      const orderId = order.id || Math.floor(100000 + Math.random() * 900000);
      const items = Array.isArray(order.items) ? order.items : [];

      ordersListHTML += `
        <div class="order-entry" style="background: #fff8f9; border: 1px solid #ffe0e6; border-radius: 12px; overflow: hidden;">
          <button type="button" class="order-toggle-btn" data-order-index="${index}" style="width: 100%; background: none; border: none; cursor: pointer; padding: 16px; display: flex; justify-content: space-between; align-items: center; text-align: left;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i class="fa-solid fa-chevron-right order-chevron" style="font-size: 0.75rem; color: #9ca3af; transition: transform 0.2s ease;"></i>
              <div>
                <h4 style="font-weight: 700; color: #1f2937; margin: 0;">Order #${orderId}</h4>
                <p style="font-size: 0.8rem; color: #6b7280; margin-top: 2px;">Date: ${order.date || new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 800; color: #ff2b6d;">$${order.total ? order.total.toFixed(2) : '0.00'}</span>
              <span style="display: block; font-size: 0.75rem; ${statusBadgeStyle(order.status)} padding: 2px 8px; border-radius: 10px; margin-top: 4px; font-weight: 600;">${order.status || 'Pending'}</span>
            </div>
          </button>
          <div class="order-items-detail" style="display: none; padding: 0 16px 16px 42px; border-top: 1px dashed #ffd9e2;">
            ${
              items.length > 0
                ? items.map(item => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ffeef2;">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                      <img src="${item.imgSrc || 'placeholder.jpg'}" alt="${item.title}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; background: #f3f4f6; flex-shrink: 0;">
                      <div style="min-width: 0;">
                        <p style="margin: 0; font-weight: 600; font-size: 0.9rem; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</p>
                        <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #9ca3af;">Qty: ${item.quantity} &times; $${(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <span style="font-weight: 700; color: #1f2937; font-size: 0.9rem; flex-shrink: 0;">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                `).join('')
                : `<p style="padding-top: 12px; color: #9ca3af; font-size: 0.85rem;">No item details available for this order.</p>`
            }
          </div>
        </div>
      `;
    });

    ordersListHTML += '</div>';
    historyCard.insertAdjacentHTML('beforeend', ordersListHTML);

    // Expand/collapse each order to reveal its purchased items
    historyCard.querySelectorAll('.order-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const detail = btn.nextElementSibling;
        const chevron = btn.querySelector('.order-chevron');
        const isOpen = detail.style.display === 'block';

        detail.style.display = isOpen ? 'none' : 'block';
        if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
      });
    });
  }
}

// Edit Profile Modal Logic
function initEditProfileModal(userData) {
  const editBtn = document.getElementById('account-edit-btn');
  const modal = document.getElementById('edit-profile-modal');
  const closeModalBtn = document.getElementById('close-edit-modal');
  const editForm = document.getElementById('edit-profile-form');

  const editFullNameInput = document.getElementById('edit-fullname');
  const editPhoneInput = document.getElementById('edit-phone');
  const editLocationInput = document.getElementById('edit-location');

  // Open Modal & Set Current Values
  editBtn?.addEventListener('click', () => {
    if (editFullNameInput) editFullNameInput.value = userData.name || userData.fullname || '';
    if (editPhoneInput) editPhoneInput.value = userData.phone || '';
    if (editLocationInput) editLocationInput.value = userData.location || '';
    
    if (modal) modal.style.display = 'flex';
  });

  // Close Modal
  closeModalBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  // Save Changes
  editForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Update object
    userData.name = editFullNameInput.value.trim();
    userData.phone = editPhoneInput.value.trim();
    userData.location = editLocationInput.value.trim();

    // Update localStorage
    localStorage.setItem('hirono_user', JSON.stringify(userData));
    localStorage.setItem('hirono_registered_user', JSON.stringify(userData));

    // Keep the master customer list (read by admin/customermanagement.html) in sync
    if (typeof updateCustomerByEmail === 'function' && userData.email) {
      updateCustomerByEmail(userData.email, {
        name: userData.name,
        phone: userData.phone,
        location: userData.location,
      });
    }

    // Re-render UI
    renderProfileData(userData);
    if (typeof renderUserAuth === 'function') renderUserAuth(); // Refresh navbar profile name

    // Close Modal
    if (modal) modal.style.display = 'none';
    alert('Profile updated successfully!');
  });
}