import { initCountdown } from './modules/countdown.js';
import { initNavigation } from './modules/navigation.js';
import { initAnimations } from './modules/animations.js';
import { initDataRenderer } from './modules/dataRenderer.js';
import { initCalculators } from './modules/calculators.js';

const FORM_MODULE_V = '20260404';

async function initContactFormLoader() {
    const raw = typeof window.SITE_API_BASE === 'string' ? window.SITE_API_BASE.trim() : '';
    const base = raw.replace(/\/$/, '');
    if (base) {
        try {
            const { initContactForm } = await import(`${base}/js/modules/form.js?v=${FORM_MODULE_V}`);
            initContactForm();
            return;
        } catch (e) {
            console.warn('Iletisim modulu Renderdan yuklenemedi, yerel deneniyor', e);
        }
    }
    const { initContactForm } = await import('./modules/form.js');
    initContactForm();
}

document.addEventListener('DOMContentLoaded', async () => {
    await initDataRenderer();

    initCountdown();
    initNavigation();
    initFaqAfterRender();
    initAnimations();
    await initContactFormLoader();
    initCalculators();
});

function initFaqAfterRender() {
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}
