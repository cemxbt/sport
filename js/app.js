import { initCountdown } from './modules/countdown.js';
import { initNavigation } from './modules/navigation.js';
import { initFAQ } from './modules/faq.js';
import { initAnimations } from './modules/animations.js';
import { initContactForm } from './modules/form.js';

document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initNavigation();
    initFAQ();
    initAnimations();
    initContactForm();
});
