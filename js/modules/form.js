export function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        btn.textContent = 'Gönderildi!';
        btn.style.background = '#fff';
        btn.style.color = '#0a0a0a';
        btn.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.2)';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            btn.disabled = false;
            contactForm.reset();
        }, 3000);
    });
}
