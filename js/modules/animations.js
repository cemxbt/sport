export function initAnimations() {
    initScrollAnimations();
    initCounterAnimation();
    initParallax();
    initBackToTop();
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
        '.package-card, .detail-card, .transform-card, .blog-card, .calc-card, ' +
        '.social-card, .video-card, .faq-item, .contact-item, .badge-item, ' +
        '.stat-item, .app-features li'
    );

    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(index % 6) * 0.08}s`;
        observer.observe(el);
    });

    document.querySelectorAll('.section-header').forEach(header => {
        header.classList.add('fade-in');
        observer.observe(header);
    });
}

function animateCounter(el) {
    const target = el.textContent;
    const numMatch = target.match(/[\d]+/);
    if (!numMatch) return;

    const num = parseInt(numMatch[0]);
    const prefix = target.substring(0, target.indexOf(numMatch[0]));
    const suffix = target.substring(target.indexOf(numMatch[0]) + numMatch[0].length);
    let current = 0;
    const step = Math.max(num / 50, 1);
    const interval = Math.max(1200 / num, 20);

    const timer = setInterval(() => {
        current += step;
        if (current >= num) {
            current = num;
            clearInterval(timer);
        }
        el.textContent = prefix + Math.floor(current) + suffix;
    }, interval);
}

function initCounterAnimation() {
    const statNums = document.querySelectorAll('.stat-num');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNums.forEach(num => statsObserver.observe(num));
}

function initParallax() {
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const heroBg = document.querySelector('.hero-bg');
                if (heroBg && scrolled < window.innerHeight) {
                    heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.pageYOffset > 500);
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
