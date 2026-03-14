export async function initDataRenderer() {
    const base = './data';
    const [config, packages, blog, transformations, faq, videos] = await Promise.all([
        fetch(`${base}/config.json`).then(r => r.json()),
        fetch(`${base}/packages.json`).then(r => r.json()),
        fetch(`${base}/blog.json`).then(r => r.json()),
        fetch(`${base}/transformations.json`).then(r => r.json()),
        fetch(`${base}/faq.json`).then(r => r.json()),
        fetch(`${base}/videos.json`).then(r => r.json())
    ]);

    renderConfig(config);
    renderPackages(packages);
    renderBlog(blog);
    renderTransformations(transformations);
    renderFaq(faq);
    renderVideos(videos);
}

function renderConfig(c) {
    if (c.seo) {
        if (c.seo.title) document.title = c.seo.title;

        const setMeta = (attr, key, val) => {
            if (!val) return;
            let el = document.querySelector(`meta[${attr}="${key}"]`);
            if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
            el.content = val;
        };

        setMeta('name', 'description', c.seo.description);
        setMeta('name', 'keywords', c.seo.keywords);
        setMeta('name', 'robots', c.seo.robots);
        if (c.seo.googleVerification) setMeta('name', 'google-site-verification', c.seo.googleVerification);

        const ogTitle = c.seo.ogTitle || c.seo.title;
        const ogDesc = c.seo.ogDescription || c.seo.description;
        setMeta('property', 'og:title', ogTitle);
        setMeta('property', 'og:description', ogDesc);
        setMeta('property', 'og:type', 'website');
        if (c.seo.ogImage) setMeta('property', 'og:image', c.seo.ogImage);
        if (c.seo.canonical) {
            setMeta('property', 'og:url', c.seo.canonical);
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
            link.href = c.seo.canonical;
        }

        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', ogTitle);
        setMeta('name', 'twitter:description', ogDesc);
        if (c.seo.ogImage) setMeta('name', 'twitter:image', c.seo.ogImage);

        if (c.seo.gaId) {
            const gs = document.createElement('script');
            gs.async = true;
            gs.src = `https://www.googletagmanager.com/gtag/js?id=${c.seo.gaId}`;
            document.head.appendChild(gs);
            const gi = document.createElement('script');
            gi.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${c.seo.gaId}');`;
            document.head.appendChild(gi);
        }

        if (c.seo.schemaName) {
            const schema = {
                '@context': 'https://schema.org',
                '@type': c.seo.schemaType || 'LocalBusiness',
                'name': c.seo.schemaName,
                'url': c.seo.canonical || window.location.origin,
                'description': c.seo.description || ''
            };
            if (c.seo.schemaAddress) schema.address = { '@type': 'PostalAddress', 'addressLocality': c.seo.schemaAddress };
            if (c.contact?.phone) schema.telephone = c.contact.phone;
            if (c.contact?.email) schema.email = c.contact.email;
            if (c.social) {
                schema.sameAs = Object.values(c.social).filter(Boolean);
            }
            const ld = document.createElement('script');
            ld.type = 'application/ld+json';
            ld.textContent = JSON.stringify(schema);
            document.head.appendChild(ld);
        }
    }

    const announcementEl = document.getElementById('announcement-text');
    if (announcementEl) announcementEl.innerHTML = c.announcement?.text || '';

    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroSubtitle) {
        const sub = c.hero?.subtitle || '';
        heroSubtitle.textContent = sub;
        heroSubtitle.style.display = sub ? '' : 'none';
    }

    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) heroTitle.innerHTML = `${c.hero?.title || ''} <span class="gradient-text">${c.hero?.titleHighlight || ''}</span>`;

    const heroDesc = document.getElementById('hero-desc');
    if (heroDesc) heroDesc.textContent = c.hero?.description || '';

    const heroStats = document.getElementById('hero-stats');
    if (heroStats) {
        heroStats.innerHTML = (c.hero?.stats || []).map(s =>
            `<div class="stat-item"><span class="stat-num">${s.value}</span><span class="stat-label">${s.label}</span></div>`
        ).join('');
    }

    const aboutName = document.getElementById('about-name');
    if (aboutName) aboutName.textContent = c.about?.name || '';

    const aboutDesc = document.getElementById('about-descriptions');
    if (aboutDesc) aboutDesc.innerHTML = (c.about?.descriptions || []).map(d => `<p>${d}</p>`).join('');

    const aboutBadges = document.getElementById('about-badges');
    if (aboutBadges) {
        aboutBadges.innerHTML = (c.about?.badges || []).map(b =>
            `<div class="badge-item"><i class="${b.icon}"></i><span>${b.text}</span></div>`
        ).join('');
    }

    const contactInfo = document.getElementById('contact-info');
    if (contactInfo && c.contact) {
        contactInfo.innerHTML = `
            <div class="contact-item"><i class="fab fa-whatsapp"></i><div><strong>WhatsApp</strong><p>${c.contact.whatsapp}</p></div></div>
            <div class="contact-item"><i class="fas fa-phone"></i><div><strong>Telefon</strong><p>${c.contact.phone}</p></div></div>
            ${c.contact.email ? `<div class="contact-item"><i class="fas fa-envelope"></i><div><strong>E-posta</strong><p>${c.contact.email}</p></div></div>` : ''}
            <div class="contact-item"><i class="fab fa-instagram"></i><div><strong>Instagram</strong><p>${c.contact.instagram}</p></div></div>
        `;
    }

    const whatsappFloat = document.getElementById('whatsapp-float');
    if (whatsappFloat && c.contact?.whatsappLink) whatsappFloat.href = c.contact.whatsappLink;

    const mobileCTAWhatsApp = document.getElementById('mobile-cta-whatsapp');
    if (mobileCTAWhatsApp && c.contact?.whatsappLink) mobileCTAWhatsApp.href = c.contact.whatsappLink;

    const footerPhone = document.getElementById('footer-phone');
    if (footerPhone) footerPhone.innerHTML = `<i class="fas fa-phone"></i> ${c.contact?.phone || ''}`;

    if (c.social) {
        const socialGrid = document.getElementById('social-grid');
        if (socialGrid) {
            let cards = '';
            if (c.social.instagram) cards += `<a href="${c.social.instagram}" class="social-card instagram" target="_blank"><i class="fab fa-instagram"></i><strong>Instagram</strong><span>Takip Et</span></a>`;
            if (c.social.facebook) cards += `<a href="${c.social.facebook}" class="social-card facebook" target="_blank"><i class="fab fa-facebook"></i><strong>Facebook</strong><span>Takip Et</span></a>`;
            if (c.social.linkedin) cards += `<a href="${c.social.linkedin}" class="social-card linkedin" target="_blank"><i class="fab fa-linkedin-in"></i><strong>LinkedIn</strong><span>Bağlan</span></a>`;
            socialGrid.innerHTML = cards;
        }

        const footerSocial = document.getElementById('footer-social');
        if (footerSocial) {
            let icons = '';
            if (c.social.instagram) icons += `<a href="${c.social.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
            if (c.social.facebook) icons += `<a href="${c.social.facebook}" target="_blank"><i class="fab fa-facebook"></i></a>`;
            if (c.social.linkedin) icons += `<a href="${c.social.linkedin}" target="_blank"><i class="fab fa-linkedin-in"></i></a>`;
            footerSocial.innerHTML = icons;
        }
    }

    if (c.footer) {
        const footerDesc = document.getElementById('footer-description');
        if (footerDesc) footerDesc.textContent = c.footer.description || '';

        const footerCopyright = document.getElementById('footer-copyright');
        if (footerCopyright) footerCopyright.innerHTML = `&copy; ${c.footer.copyright || ''}`;

        const footerLegal = document.getElementById('footer-legal');
        if (footerLegal) {
            footerLegal.innerHTML = (c.footer.legalLinks || []).map(l =>
                `<li><a href="${l.url}">${l.text}</a></li>`
            ).join('');
        }
    }
}

function renderPackageCard(p) {
    const btnClass = p.featured ? 'btn-primary' : 'btn-outline';
    return `<div class="package-card${p.featured ? ' featured' : ''}">
        ${p.badge ? `<div class="package-badge">${p.badge}</div>` : ''}
        ${p.discount ? `<div class="package-discount">${p.discount}</div>` : ''}
        <h3>${p.name}</h3>
        <div class="package-price">
            ${p.oldPrice ? `<span class="price-old">${p.oldPrice}</span>` : ''}
            <span class="price-new">${p.price}</span>
        </div>
        <ul class="package-features">
            ${(p.features || []).map(f => `<li><i class="${f.icon}"></i> ${f.text}</li>`).join('')}
        </ul>
        <a href="#iletisim" class="btn ${btnClass} btn-full">Hemen Başla</a>
    </div>`;
}

function renderPackages(data) {
    const grid = document.getElementById('packages-grid');
    if (grid) grid.innerHTML = (data.regular || []).map(renderPackageCard).join('');

    const detailsGrid = document.getElementById('details-grid');
    if (detailsGrid) {
        detailsGrid.innerHTML = (data.details || []).map(d =>
            `<div class="detail-card"><div class="detail-icon"><i class="${d.icon}"></i></div><h4>${d.title}</h4><p>${d.description}</p></div>`
        ).join('');
    }

    const vcGrid = document.getElementById('videocall-grid');
    if (vcGrid) vcGrid.innerHTML = (data.videoCall || []).map(renderPackageCard).join('');

    const select = document.getElementById('contact-select');
    if (select) {
        const allPkgs = [...(data.regular || []), ...(data.videoCall || [])];
        select.innerHTML = '<option value="">İlgilendiğiniz Paket</option>' +
            allPkgs.map(p => `<option>${p.name}</option>`).join('');
    }
}

function renderBlog(items) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    grid.innerHTML = items.map((b, i) => `<article class="blog-card" data-blog-idx="${i}">
        <div class="blog-image"><i class="${b.icon}"></i></div>
        <div class="blog-content">
            <span class="blog-date"><i class="far fa-calendar"></i> ${b.date}</span>
            <h4>${b.title}</h4>
            <p>${b.excerpt}</p>
            <span class="blog-link">Yazıyı Oku <i class="fas fa-arrow-right"></i></span>
        </div>
    </article>`).join('');

    grid.addEventListener('click', e => {
        const card = e.target.closest('.blog-card');
        if (!card) return;
        const idx = parseInt(card.dataset.blogIdx, 10);
        const b = items[idx];
        if (!b) return;
        openBlogModal(b);
    });
}

let blogScrollY = 0;

function openBlogModal(b) {
    let overlay = document.getElementById('blog-modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'blog-modal-overlay';
    overlay.className = 'blog-modal-overlay active';
    overlay.innerHTML = `<div class="blog-modal">
        <div class="blog-modal-header">
            <div>
                <span class="blog-modal-date"><i class="far fa-calendar"></i> ${b.date}</span>
                <h2>${b.title}</h2>
            </div>
            <button class="blog-modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="blog-modal-body">${b.content || `<p>${b.excerpt}</p>`}</div>
    </div>`;
    document.body.appendChild(overlay);

    blogScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${blogScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    overlay.scrollTop = 0;

    const close = () => {
        overlay.remove();
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, blogScrollY);
    };
    overlay.querySelector('.blog-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => {
        if (e.target === overlay || !overlay.querySelector('.blog-modal').contains(e.target)) close();
    });
}

function renderTransformations(items) {
    const grid = document.getElementById('transformations-grid');
    if (!grid) return;
    grid.innerHTML = items.map(t => `<div class="transform-card">
        <div class="transform-images">
            <div class="transform-before">
                <span class="transform-label">Öncesi</span>
                ${t.beforeImage
                    ? `<img src="${t.beforeImage}" alt="Öncesi" style="width:100%;height:100%;object-fit:cover">`
                    : '<div class="transform-placeholder"><i class="fas fa-user"></i></div>'}
            </div>
            <div class="transform-after">
                <span class="transform-label">Sonrası</span>
                ${t.afterImage
                    ? `<img src="${t.afterImage}" alt="Sonrası" style="width:100%;height:100%;object-fit:cover">`
                    : '<div class="transform-placeholder after"><i class="fas fa-user"></i></div>'}
            </div>
        </div>
        <div class="transform-info"><span class="transform-package">${t.packageName}</span></div>
    </div>`).join('');
}

function renderFaq(items) {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = items.map(f => `<div class="faq-item">
        <button class="faq-question"><span>${f.question}</span><i class="fas fa-chevron-down"></i></button>
        <div class="faq-answer"><p>${f.answer}</p></div>
    </div>`).join('');
}

function renderVideos(items) {
    const grid = document.getElementById('videos-grid');
    if (!grid) return;
    grid.innerHTML = items.map(v => `<div class="video-card">
        <div class="video-thumb"><i class="fas fa-play-circle"></i></div>
        <div class="video-info"><span class="video-date">${v.date}</span><h4>${v.title}</h4></div>
    </div>`).join('');
}
