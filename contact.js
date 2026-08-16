/* ==========================================================================
   CONTACT PAGE FUNCTIONALITY (contact.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault(); // don't actually navigate to action="#"

    const nameInput = document.getElementById("contact-name");
    const name = nameInput ? nameInput.value.trim() : "";

    // showCartDialog() / setupCartDialog() already live in components.js and
    // are wired up to the #cart-dialog-overlay markup on every page load —
    // reusing that here instead of building a second dialog system.
    const message = name
      ? `Thanks, ${name}! We've received your message and will get back to you soon.`
      : "Thanks! We've received your message and will get back to you soon.";

    showCartDialog(message);

    contactForm.reset();
  });
});