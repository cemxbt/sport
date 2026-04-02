export function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        const apiBase = typeof window.SITE_API_BASE === 'string'
            ? window.SITE_API_BASE.replace(/\/$/, '')
            : '';
        const url = apiBase ? `${apiBase}/api/contact` : '/api/contact';

        const fd = new FormData(contactForm);
        const body = {
            name: (fd.get('name') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            phone: (fd.get('phone') || '').toString().trim(),
            package: (fd.get('package') || '').toString().trim(),
            message: (fd.get('message') || '').toString().trim()
        };

        btn.disabled = true;
        btn.textContent = 'Gönderiliyor...';
        btn.style.background = '';
        btn.style.color = '';
        btn.style.boxShadow = '';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || 'Gönderilemedi');
            }

            btn.textContent = 'Gönderildi!';
            btn.style.background = '#fff';
            btn.style.color = '#0a0a0a';
            btn.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.2)';
            contactForm.reset();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.style.boxShadow = '';
                btn.disabled = false;
            }, 3000);
        } catch (err) {
            btn.textContent = err.message || 'Gönderilemedi';
            btn.style.background = '#c0392b';
            btn.style.color = '#fff';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 5000);
        }
    });
}
