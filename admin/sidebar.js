document.addEventListener('DOMContentLoaded', () => {
  // Access guard: only allow admin pages to be viewed after signing in
  // through login.html with the admin credentials (see login.js).
  if (localStorage.getItem('hirono_admin') !== 'true') {
    window.location.href = '../login.html';
    return;
  }

  const placeholder = document.getElementById('sidebar-placeholder');

  if (placeholder) {
    fetch('sidebar.html')
      .then((response) => response.text())
      .then((data) => {
        placeholder.innerHTML = data;

        // Auto-highlight active nav tab based on URL
        const currentPage = window.location.pathname.split('/').pop() || 'overview.html';

        if (currentPage.includes('productmanagement')) {
          document.getElementById('nav-product-management')?.classList.add('active');
        } else if (currentPage.includes('orders')) {
          document.getElementById('nav-orders')?.classList.add('active');
        } else if (currentPage.includes('customermanagement')) {
          document.getElementById('nav-customer-management')?.classList.add('active');
        } else {
          document.getElementById('nav-overview')?.classList.add('active');
        }

        // Sign Out: clear the admin session, then send the admin back to
        // the public site's login page. Handled here in JS (not just the
        // plain <a href>) so the session is actually cleared and the
        // navigation is guaranteed to fire.
        const signoutBtn = document.getElementById('admin-signout-btn');
        if (signoutBtn) {
          signoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('hirono_admin');
            localStorage.removeItem('hirono_user');
            window.location.href = signoutBtn.getAttribute('href');
          });
        }
      })
      .catch((error) => console.error('Error loading sidebar:', error));
  }
});