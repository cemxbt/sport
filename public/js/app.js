import { initCountdown } from './modules/countdown.js';
import { initNavigation } from './modules/navigation.js';
import { initAnimations } from './modules/animations.js';
import { initContactForm } from './modules/form.js';
import { initDataRenderer } from './modules/dataRenderer.js';
import { initCalculators } from './modules/calculators.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initDataRenderer();

    initCountdown();
    initNavigation();
    initFaqAfterRender();
    initAnimations();
    initContactForm();
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
