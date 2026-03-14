function handleResponse(res) {
    if (res.status === 401) {
        window.location.href = '/admin/login.html';
        throw new Error('Unauthorized');
    }
    return res.json();
}

const API = {
    async get(url) { return handleResponse(await fetch(url)); },
    async post(url, data) { return handleResponse(await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); },
    async put(url, data) { return handleResponse(await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); },
    async del(url) { return handleResponse(await fetch(url, { method: 'DELETE' })); },
    async upload(file) {
        const fd = new FormData();
        fd.append('image', file);
        return handleResponse(await fetch('/api/upload', { method: 'POST', body: fd }));
    }
};

let configData = {};
let packagesData = {};

function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const sec = item.dataset.section;
        document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${sec}`).classList.add('active');
        document.getElementById('page-title').textContent = item.textContent.trim();
        document.getElementById('sidebar').classList.remove('open');
    });
});

document.querySelectorAll('.section-tabs').forEach(tabs => {
    tabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.panel-section');
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});

async function loadDashboard() {
    const [pkg, blog, trans, faq, videos] = await Promise.all([
        API.get('/api/packages'),
        API.get('/api/blog'),
        API.get('/api/transformations'),
        API.get('/api/faq'),
        API.get('/api/videos')
    ]);
    document.getElementById('stat-packages').textContent = (pkg.regular?.length || 0) + (pkg.videoCall?.length || 0);
    document.getElementById('stat-blog').textContent = blog.length;
    document.getElementById('stat-transformations').textContent = trans.length;
    document.getElementById('stat-faq').textContent = faq.length;
    document.getElementById('stat-videos').textContent = videos.length;
}

async function loadConfig() {
    configData = await API.get('/api/config');
    const c = configData;

    const fseo = document.getElementById('form-seo');
    fseo.seo_title.value = c.seo?.title || '';
    fseo.seo_description.value = c.seo?.description || '';
    fseo.seo_keywords.value = c.seo?.keywords || '';
    fseo.seo_canonical.value = c.seo?.canonical || '';
    fseo.seo_og_title.value = c.seo?.ogTitle || '';
    fseo.seo_og_description.value = c.seo?.ogDescription || '';
    fseo.seo_og_image.value = c.seo?.ogImage || '';
    fseo.seo_robots.value = c.seo?.robots || 'index, follow';
    fseo.seo_ga_id.value = c.seo?.gaId || '';
    fseo.seo_google_verification.value = c.seo?.googleVerification || '';
    fseo.seo_schema_type.value = c.seo?.schemaType || 'LocalBusiness';
    fseo.seo_schema_name.value = c.seo?.schemaName || '';
    fseo.seo_schema_address.value = c.seo?.schemaAddress || '';

    const f = document.getElementById('form-hero');
    f.announcement_text.value = c.announcement?.text || '';
    f.announcement_days.value = c.announcement?.countdownDays || 14;
    f.hero_subtitle.value = c.hero?.subtitle || '';
    f.hero_title.value = c.hero?.title || '';
    f.hero_highlight.value = c.hero?.titleHighlight || '';
    f.hero_description.value = c.hero?.description || '';

    const statsEl = document.getElementById('stats-container');
    statsEl.innerHTML = '';
    (c.hero?.stats || []).forEach((s, i) => {
        statsEl.innerHTML += `<div class="removable-row" data-idx="${i}">
            <div class="form-group"><label>Değer</label><input type="text" class="stat-val" value="${s.value}"></div>
            <div class="form-group"><label>Etiket</label><input type="text" class="stat-lbl" value="${s.label}"></div>
            <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>`;
    });

    const fa = document.getElementById('form-about');
    fa.about_name.value = c.about?.name || '';
    const descEl = document.getElementById('about-descriptions');
    descEl.innerHTML = '';
    (c.about?.descriptions || []).forEach((d, i) => {
        descEl.innerHTML += `<div class="removable-row"><div class="form-group"><label>Paragraf ${i + 1}</label><textarea class="about-desc" rows="3">${d}</textarea></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
    });

    const badgesEl = document.getElementById('about-badges');
    badgesEl.innerHTML = '';
    (c.about?.badges || []).forEach((b, i) => {
        badgesEl.innerHTML += `<div class="removable-row"><div class="form-group"><label>İkon</label><input type="text" class="badge-icon" value="${b.icon}"></div><div class="form-group"><label>Metin</label><input type="text" class="badge-text" value="${b.text}"></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
    });

    const fc = document.getElementById('form-contact');
    fc.contact_whatsapp.value = c.contact?.whatsapp || '';
    fc.contact_phone.value = c.contact?.phone || '';
    fc.contact_email.value = c.contact?.email || '';
    fc.contact_instagram.value = c.contact?.instagram || '';
    fc.contact_whatsappLink.value = c.contact?.whatsappLink || '';

    const fs = document.getElementById('form-social');
    fs.social_instagram.value = c.social?.instagram || '';
    fs.social_facebook.value = c.social?.facebook || '';
    fs.social_linkedin.value = c.social?.linkedin || '';

    const ff = document.getElementById('form-footer');
    ff.footer_description.value = c.footer?.description || '';
    ff.footer_copyright.value = c.footer?.copyright || '';
    const legalEl = document.getElementById('legal-links-container');
    legalEl.innerHTML = '';
    (c.footer?.legalLinks || []).forEach(l => {
        legalEl.innerHTML += `<div class="removable-row"><div class="form-group"><label>Metin</label><input type="text" class="legal-text" value="${l.text}"></div><div class="form-group"><label>URL</label><input type="text" class="legal-url" value="${l.url}"></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
    });
}

document.getElementById('add-description').addEventListener('click', () => {
    const el = document.getElementById('about-descriptions');
    const idx = el.children.length + 1;
    el.innerHTML += `<div class="removable-row"><div class="form-group"><label>Paragraf ${idx}</label><textarea class="about-desc" rows="3"></textarea></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
});

document.getElementById('add-badge').addEventListener('click', () => {
    const el = document.getElementById('about-badges');
    el.innerHTML += `<div class="removable-row"><div class="form-group"><label>İkon</label><input type="text" class="badge-icon" value="fas fa-star"></div><div class="form-group"><label>Metin</label><input type="text" class="badge-text" value=""></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
});

document.getElementById('add-stat').addEventListener('click', () => {
    const el = document.getElementById('stats-container');
    el.innerHTML += `<div class="removable-row"><div class="form-group"><label>Değer</label><input type="text" class="stat-val" value=""></div><div class="form-group"><label>Etiket</label><input type="text" class="stat-lbl" value=""></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
});

document.getElementById('add-legal-link').addEventListener('click', () => {
    const el = document.getElementById('legal-links-container');
    el.innerHTML += `<div class="removable-row"><div class="form-group"><label>Metin</label><input type="text" class="legal-text" value=""></div><div class="form-group"><label>URL</label><input type="text" class="legal-url" value="#"></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`;
});

document.getElementById('form-seo').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    configData.seo = {
        title: f.seo_title.value,
        description: f.seo_description.value,
        keywords: f.seo_keywords.value,
        canonical: f.seo_canonical.value,
        ogTitle: f.seo_og_title.value,
        ogDescription: f.seo_og_description.value,
        ogImage: f.seo_og_image.value,
        robots: f.seo_robots.value,
        gaId: f.seo_ga_id.value,
        googleVerification: f.seo_google_verification.value,
        schemaType: f.seo_schema_type.value,
        schemaName: f.seo_schema_name.value,
        schemaAddress: f.seo_schema_address.value
    };
    await API.put('/api/config', configData);
    toast('SEO ayarları kaydedildi');
});

document.getElementById('form-hero').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    configData.announcement = { text: f.announcement_text.value, countdownDays: parseInt(f.announcement_days.value) };
    configData.hero = {
        subtitle: f.hero_subtitle.value,
        title: f.hero_title.value,
        titleHighlight: f.hero_highlight.value,
        description: f.hero_description.value,
        stats: [...document.querySelectorAll('#stats-container .removable-row')].map(r => ({
            value: r.querySelector('.stat-val').value,
            label: r.querySelector('.stat-lbl').value
        }))
    };
    await API.put('/api/config', configData);
    toast('Hero & Duyuru kaydedildi');
});

document.getElementById('form-about').addEventListener('submit', async e => {
    e.preventDefault();
    configData.about = {
        name: e.target.about_name.value,
        descriptions: [...document.querySelectorAll('.about-desc')].map(t => t.value),
        badges: [...document.querySelectorAll('#about-badges .removable-row')].map(r => ({
            icon: r.querySelector('.badge-icon').value,
            text: r.querySelector('.badge-text').value
        }))
    };
    await API.put('/api/config', configData);
    toast('Hakkımda kaydedildi');
});

document.getElementById('form-contact').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    configData.contact = {
        whatsapp: f.contact_whatsapp.value,
        phone: f.contact_phone.value,
        email: f.contact_email.value,
        instagram: f.contact_instagram.value,
        whatsappLink: f.contact_whatsappLink.value
    };
    await API.put('/api/config', configData);
    toast('İletişim kaydedildi');
});

document.getElementById('form-social').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    configData.social = {
        instagram: f.social_instagram.value,
        facebook: f.social_facebook.value,
        linkedin: f.social_linkedin.value
    };
    await API.put('/api/config', configData);
    toast('Sosyal medya kaydedildi');
});

function packageFormHtml(pkg = {}) {
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>Paket Adı</label><input type="text" name="name" value="${pkg.name || ''}" required></div>
        <div class="form-row">
            <div class="form-group"><label>Fiyat</label><input type="text" name="price" value="${pkg.price || ''}" required></div>
            <div class="form-group"><label>Eski Fiyat</label><input type="text" name="oldPrice" value="${pkg.oldPrice || ''}"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>İndirim</label><input type="text" name="discount" value="${pkg.discount || ''}"></div>
            <div class="form-group"><label>Rozet</label><input type="text" name="badge" value="${pkg.badge || ''}"></div>
        </div>
        <div class="form-group"><label class="checkbox-row"><input type="checkbox" name="featured" ${pkg.featured ? 'checked' : ''}> Öne Çıkan</label></div>
        <h3>Özellikler</h3>
        <div id="modal-features">${(pkg.features || []).map(f => `<div class="removable-row"><div class="form-group"><input type="text" class="feat-icon" value="${f.icon}"></div><div class="form-group"><input type="text" class="feat-text" value="${f.text}"></div><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button></div>`).join('')}</div>
        <button type="button" class="btn-add-small" onclick="document.getElementById('modal-features').innerHTML += '<div class=\\'removable-row\\'><div class=\\'form-group\\'><input type=\\'text\\' class=\\'feat-icon\\' value=\\'fas fa-check\\'></div><div class=\\'form-group\\'><input type=\\'text\\' class=\\'feat-text\\' value=\\'\\'></div><button type=\\'button\\' class=\\'btn-remove-row\\' onclick=\\'this.parentElement.remove()\\'><i class=\\'fas fa-trash\\'></i></button></div>'"><i class="fas fa-plus"></i> Özellik Ekle</button>
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

function getPackageFormData() {
    const f = document.getElementById('modal-form');
    return {
        name: f.name.value,
        price: f.price.value,
        oldPrice: f.oldPrice.value || null,
        discount: f.discount.value || null,
        badge: f.badge.value || null,
        featured: f.featured.checked,
        features: [...document.querySelectorAll('#modal-features .removable-row')].map(r => ({
            icon: r.querySelector('.feat-icon').value,
            text: r.querySelector('.feat-text').value
        }))
    };
}

function renderPackagesList(items, containerId, type) {
    const el = document.getElementById(containerId);
    el.innerHTML = items.map(p => `<div class="list-item">
        <div class="list-item-icon"><i class="fas fa-box"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${p.name}${p.featured ? ' <span style="color:var(--admin-primary)">★</span>' : ''}</div>
            <div class="list-item-sub">${p.price}${p.oldPrice ? ' <s>' + p.oldPrice + '</s>' : ''}</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editPackage('${type}',${p.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deletePackage('${type}',${p.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

async function loadPackages() {
    packagesData = await API.get('/api/packages');
    renderPackagesList(packagesData.regular || [], 'regular-packages-list', 'regular');
    renderPackagesList(packagesData.videoCall || [], 'videocall-packages-list', 'videoCall');
    renderDetailsList(packagesData.details || []);
}

window.editPackage = function(type, id) {
    const items = packagesData[type] || [];
    const pkg = items.find(p => p.id === id);
    if (!pkg) return;
    openModal('Paketi Düzenle', packageFormHtml(pkg));
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const data = getPackageFormData();
        const idx = items.findIndex(p => p.id === id);
        items[idx] = { ...items[idx], ...data };
        packagesData[type] = items;
        await API.put('/api/packages', packagesData);
        closeModal();
        loadPackages();
        toast('Paket güncellendi');
    });
};

window.deletePackage = function(type, id) {
    if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
    packagesData[type] = (packagesData[type] || []).filter(p => p.id !== id);
    API.put('/api/packages', packagesData).then(() => { loadPackages(); toast('Paket silindi'); });
};

function setupAddPackage(btnId, type) {
    document.getElementById(btnId).addEventListener('click', () => {
        openModal('Yeni Paket', packageFormHtml());
        document.getElementById('modal-form').addEventListener('submit', async e => {
            e.preventDefault();
            const data = getPackageFormData();
            const items = packagesData[type] || [];
            data.id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
            items.push(data);
            packagesData[type] = items;
            await API.put('/api/packages', packagesData);
            closeModal();
            loadPackages();
            toast('Paket eklendi');
        });
    });
}

setupAddPackage('add-regular-package', 'regular');
setupAddPackage('add-videocall-package', 'videoCall');

function detailFormHtml(d = {}) {
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>İkon (FontAwesome class)</label><input type="text" name="icon" value="${d.icon || 'fas fa-star'}" required></div>
        <div class="form-group"><label>Başlık</label><input type="text" name="title" value="${d.title || ''}" required></div>
        <div class="form-group"><label>Açıklama</label><textarea name="description" rows="3">${d.description || ''}</textarea></div>
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

function renderDetailsList(items) {
    const el = document.getElementById('details-list');
    el.innerHTML = items.map(d => `<div class="list-item">
        <div class="list-item-icon"><i class="${d.icon}"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${d.title}</div>
            <div class="list-item-sub">${d.description?.substring(0, 60)}...</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editDetail(${d.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteDetail(${d.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.editDetail = function(id) {
    const d = (packagesData.details || []).find(x => x.id === id);
    if (!d) return;
    openModal('Detay Düzenle', detailFormHtml(d));
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        const idx = packagesData.details.findIndex(x => x.id === id);
        packagesData.details[idx] = { ...packagesData.details[idx], icon: f.icon.value, title: f.title.value, description: f.description.value };
        await API.put('/api/packages', packagesData);
        closeModal(); loadPackages(); toast('Detay güncellendi');
    });
};

window.deleteDetail = function(id) {
    if (!confirm('Bu detayı silmek istediğinize emin misiniz?')) return;
    packagesData.details = (packagesData.details || []).filter(d => d.id !== id);
    API.put('/api/packages', packagesData).then(() => { loadPackages(); toast('Detay silindi'); });
};

document.getElementById('add-detail').addEventListener('click', () => {
    openModal('Yeni Detay', detailFormHtml());
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        const items = packagesData.details || [];
        const id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        items.push({ id, icon: f.icon.value, title: f.title.value, description: f.description.value });
        packagesData.details = items;
        await API.put('/api/packages', packagesData);
        closeModal(); loadPackages(); toast('Detay eklendi');
    });
});

function blogFormHtml(b = {}) {
    const escaped = (b.content || '').replace(/"/g, '&quot;');
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>Başlık</label><input type="text" name="title" value="${b.title || ''}" required></div>
        <div class="form-row">
            <div class="form-group"><label>Tarih</label><input type="text" name="date" value="${b.date || ''}" required></div>
            <div class="form-group"><label>İkon</label><input type="text" name="icon" value="${b.icon || 'fas fa-newspaper'}"></div>
        </div>
        <div class="form-group"><label>Özet</label><textarea name="excerpt" rows="3">${b.excerpt || ''}</textarea></div>
        <div class="form-group"><label>İçerik (HTML)</label><textarea name="content" rows="8">${b.content || ''}</textarea></div>
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

async function loadBlog() {
    const items = await API.get('/api/blog');
    const el = document.getElementById('blog-list');
    el.innerHTML = items.map(b => `<div class="list-item">
        <div class="list-item-icon"><i class="${b.icon}"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${b.title}</div>
            <div class="list-item-sub">${b.date}</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editBlog(${b.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteBlog(${b.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.editBlog = async function(id) {
    const items = await API.get('/api/blog');
    const b = items.find(x => x.id === id);
    if (!b) return;
    openModal('Blog Yazısı Düzenle', blogFormHtml(b));
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.put(`/api/blog/${id}`, { title: f.title.value, date: f.date.value, icon: f.icon.value, excerpt: f.excerpt.value, content: f.content.value });
        closeModal(); loadBlog(); loadDashboard(); toast('Blog yazısı güncellendi');
    });
};

window.deleteBlog = async function(id) {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
    await API.del(`/api/blog/${id}`);
    loadBlog(); loadDashboard(); toast('Blog yazısı silindi');
};

document.getElementById('add-blog').addEventListener('click', () => {
    openModal('Yeni Blog Yazısı', blogFormHtml());
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.post('/api/blog', { title: f.title.value, date: f.date.value, icon: f.icon.value, excerpt: f.excerpt.value, content: f.content.value });
        closeModal(); loadBlog(); loadDashboard(); toast('Blog yazısı eklendi');
    });
});

function transformFormHtml(t = {}) {
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>Paket Adı</label><input type="text" name="packageName" value="${t.packageName || ''}" required></div>
        <div class="form-row">
            <div class="form-group">
                <label>Öncesi Görseli</label>
                <div class="image-upload" id="before-upload">
                    ${t.beforeImage ? `<img src="${t.beforeImage}" alt="Öncesi">` : ''}
                    <p>${t.beforeImage ? 'Değiştirmek için tıklayın' : 'Görsel yükleyin'}</p>
                    <input type="file" accept="image/*" id="before-file">
                </div>
            </div>
            <div class="form-group">
                <label>Sonrası Görseli</label>
                <div class="image-upload" id="after-upload">
                    ${t.afterImage ? `<img src="${t.afterImage}" alt="Sonrası">` : ''}
                    <p>${t.afterImage ? 'Değiştirmek için tıklayın' : 'Görsel yükleyin'}</p>
                    <input type="file" accept="image/*" id="after-file">
                </div>
            </div>
        </div>
        <input type="hidden" name="beforeImage" value="${t.beforeImage || ''}">
        <input type="hidden" name="afterImage" value="${t.afterImage || ''}">
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

function setupImageUpload(inputId, hiddenName, uploadEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', async () => {
        if (!input.files[0]) return;
        const res = await API.upload(input.files[0]);
        if (res.url) {
            document.querySelector(`[name="${hiddenName}"]`).value = res.url;
            const container = document.getElementById(uploadEl);
            let img = container.querySelector('img');
            if (!img) { img = document.createElement('img'); container.prepend(img); }
            img.src = res.url;
            container.querySelector('p').textContent = 'Değiştirmek için tıklayın';
            toast('Görsel yüklendi');
        }
    });
}

async function loadTransformations() {
    const items = await API.get('/api/transformations');
    const el = document.getElementById('transformations-list');
    el.innerHTML = items.map(t => `<div class="list-item">
        <div class="list-item-icon"><i class="fas fa-exchange-alt"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${t.packageName}</div>
            <div class="list-item-sub">${t.beforeImage ? 'Görseller mevcut' : 'Görseller yok'}</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editTransformation(${t.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteTransformation(${t.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.editTransformation = async function(id) {
    const items = await API.get('/api/transformations');
    const t = items.find(x => x.id === id);
    if (!t) return;
    openModal('Değişim Düzenle', transformFormHtml(t));
    setupImageUpload('before-file', 'beforeImage', 'before-upload');
    setupImageUpload('after-file', 'afterImage', 'after-upload');
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.put(`/api/transformations/${id}`, { packageName: f.packageName.value, beforeImage: f.beforeImage.value || null, afterImage: f.afterImage.value || null });
        closeModal(); loadTransformations(); toast('Değişim güncellendi');
    });
};

window.deleteTransformation = async function(id) {
    if (!confirm('Bu değişimi silmek istediğinize emin misiniz?')) return;
    await API.del(`/api/transformations/${id}`);
    loadTransformations(); loadDashboard(); toast('Değişim silindi');
};

document.getElementById('add-transformation').addEventListener('click', () => {
    openModal('Yeni Değişim', transformFormHtml());
    setupImageUpload('before-file', 'beforeImage', 'before-upload');
    setupImageUpload('after-file', 'afterImage', 'after-upload');
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.post('/api/transformations', { packageName: f.packageName.value, beforeImage: f.beforeImage.value || null, afterImage: f.afterImage.value || null });
        closeModal(); loadTransformations(); loadDashboard(); toast('Değişim eklendi');
    });
});

function faqFormHtml(f = {}) {
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>Soru</label><input type="text" name="question" value="${f.question || ''}" required></div>
        <div class="form-group"><label>Cevap</label><textarea name="answer" rows="4">${f.answer || ''}</textarea></div>
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

async function loadFaq() {
    const items = await API.get('/api/faq');
    const el = document.getElementById('faq-list');
    el.innerHTML = items.map(f => `<div class="list-item">
        <div class="list-item-icon"><i class="fas fa-question"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${f.question}</div>
            <div class="list-item-sub">${f.answer?.substring(0, 60)}...</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editFaq(${f.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteFaq(${f.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.editFaq = async function(id) {
    const items = await API.get('/api/faq');
    const f = items.find(x => x.id === id);
    if (!f) return;
    openModal('Soru Düzenle', faqFormHtml(f));
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.target;
        await API.put(`/api/faq/${id}`, { question: form.question.value, answer: form.answer.value });
        closeModal(); loadFaq(); toast('Soru güncellendi');
    });
};

window.deleteFaq = async function(id) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    await API.del(`/api/faq/${id}`);
    loadFaq(); loadDashboard(); toast('Soru silindi');
};

document.getElementById('add-faq').addEventListener('click', () => {
    openModal('Yeni Soru', faqFormHtml());
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.post('/api/faq', { question: f.question.value, answer: f.answer.value });
        closeModal(); loadFaq(); loadDashboard(); toast('Soru eklendi');
    });
});

function videoFormHtml(v = {}) {
    return `<form id="modal-form" class="admin-form">
        <div class="form-group"><label>Başlık</label><input type="text" name="title" value="${v.title || ''}" required></div>
        <div class="form-group"><label>Tarih</label><input type="text" name="date" value="${v.date || ''}"></div>
        <div class="form-group"><label>Link</label><input type="text" name="link" value="${v.link || '#'}"></div>
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Kaydet</button>
    </form>`;
}

async function loadVideos() {
    const items = await API.get('/api/videos');
    const el = document.getElementById('videos-list');
    el.innerHTML = items.map(v => `<div class="list-item">
        <div class="list-item-icon"><i class="fas fa-play"></i></div>
        <div class="list-item-content">
            <div class="list-item-title">${v.title}</div>
            <div class="list-item-sub">${v.date}</div>
        </div>
        <div class="list-item-actions">
            <button class="btn-edit" onclick="editVideo(${v.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteVideo(${v.id})"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.editVideo = async function(id) {
    const items = await API.get('/api/videos');
    const v = items.find(x => x.id === id);
    if (!v) return;
    openModal('Video Düzenle', videoFormHtml(v));
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.put(`/api/videos/${id}`, { title: f.title.value, date: f.date.value, link: f.link.value });
        closeModal(); loadVideos(); toast('Video güncellendi');
    });
};

window.deleteVideo = async function(id) {
    if (!confirm('Bu videoyu silmek istediğinize emin misiniz?')) return;
    await API.del(`/api/videos/${id}`);
    loadVideos(); loadDashboard(); toast('Video silindi');
};

document.getElementById('add-video').addEventListener('click', () => {
    openModal('Yeni Video', videoFormHtml());
    document.getElementById('modal-form').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        await API.post('/api/videos', { title: f.title.value, date: f.date.value, link: f.link.value });
        closeModal(); loadVideos(); loadDashboard(); toast('Video eklendi');
    });
});

document.getElementById('form-footer').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    configData.footer = {
        description: f.footer_description.value,
        copyright: f.footer_copyright.value,
        legalLinks: [...document.querySelectorAll('#legal-links-container .removable-row')].map(r => ({
            text: r.querySelector('.legal-text').value,
            url: r.querySelector('.legal-url').value
        }))
    };
    await API.put('/api/config', configData);
    toast('Footer kaydedildi');
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
});

document.getElementById('form-change-password').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const newPass = f.new_password.value;
    const confirm = f.new_password_confirm.value;

    if (newPass !== confirm) {
        toast('Yeni sifreler uyusmuyor', 'error');
        return;
    }

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: f.current_password.value, newPassword: newPass })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            toast('Sifre degistirildi. Yeniden giris yapiliyor...');
            setTimeout(() => { window.location.href = '/admin/login.html'; }, 1500);
        } else {
            toast(data.error || 'Sifre degistirilemedi', 'error');
        }
    } catch {
        toast('Baglanti hatasi', 'error');
    }

    f.reset();
});

document.getElementById('trainer-photo-input').addEventListener('change', async function() {
    if (!this.files[0]) return;
    const status = document.getElementById('trainer-upload-status');
    status.textContent = 'Yükleniyor...';
    try {
        const fd = new FormData();
        fd.append('image', this.files[0]);
        const res = await fetch('/api/upload-trainer', { method: 'POST', body: fd });
        const data = await handleResponse(res);
        if (data.success) {
            document.getElementById('trainer-preview').src = data.url;
            status.textContent = 'Fotoğraf güncellendi!';
            toast('Eğitmen fotoğrafı değiştirildi');
        }
    } catch {
        status.textContent = 'Yükleme başarısız';
        toast('Fotoğraf yüklenemedi', 'error');
    }
    this.value = '';
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = '/admin/login.html';
            return;
        }
    } catch {
        window.location.href = '/admin/login.html';
        return;
    }

    loadDashboard();
    loadConfig();
    loadPackages();
    loadBlog();
    loadTransformations();
    loadFaq();
    loadVideos();
});
