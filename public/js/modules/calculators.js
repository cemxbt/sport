const CALCS = {
    kalori: {
        title: 'Günlük Kalori İhtiyacı',
        desc: 'Mifflin-St Jeor denklemiyle günlük kalori ihtiyacınızı hesaplayın.',
        fields: [
            { name: 'gender', label: 'Cinsiyet', type: 'select', options: [['male', 'Erkek'], ['female', 'Kadın']] },
            { name: 'age', label: 'Yaş', type: 'number', placeholder: '25', min: 10, max: 100 },
            { name: 'weight', label: 'Kilo (kg)', type: 'number', placeholder: '75', min: 30, max: 300, step: '0.1' },
            { name: 'height', label: 'Boy (cm)', type: 'number', placeholder: '175', min: 100, max: 250 },
            { name: 'activity', label: 'Aktivite Seviyesi', type: 'select', options: [
                ['1.2', 'Hareketsiz (masa başı)'],
                ['1.375', 'Az aktif (haftada 1-3 gün)'],
                ['1.55', 'Orta aktif (haftada 3-5 gün)'],
                ['1.725', 'Çok aktif (haftada 6-7 gün)'],
                ['1.9', 'Ekstra aktif (günde 2 antrenman)']
            ]}
        ],
        calc(v) {
            const bmr = v.gender === 'male'
                ? 10 * v.weight + 6.25 * v.height - 5 * v.age + 5
                : 10 * v.weight + 6.25 * v.height - 5 * v.age - 161;
            const tdee = bmr * v.activity;
            return `<div class="calc-result-grid">
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(bmr)}</span><span class="calc-result-label">Bazal Metabolizma (BMR)</span></div>
                <div class="calc-result-item highlight"><span class="calc-result-val">${Math.round(tdee)}</span><span class="calc-result-label">Günlük Kalori (TDEE)</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(tdee - 500)}</span><span class="calc-result-label">Kilo Vermek İçin</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(tdee + 500)}</span><span class="calc-result-label">Kilo Almak İçin</span></div>
            </div>`;
        }
    },
    yag: {
        title: 'Vücut Yağ Oranı',
        desc: 'US Navy yöntemiyle vücut yağ oranınızı hesaplayın.',
        fields: [
            { name: 'gender', label: 'Cinsiyet', type: 'select', options: [['male', 'Erkek'], ['female', 'Kadın']] },
            { name: 'height', label: 'Boy (cm)', type: 'number', placeholder: '175', min: 100, max: 250 },
            { name: 'waist', label: 'Bel Çevresi (cm)', type: 'number', placeholder: '85', min: 40, max: 200, step: '0.1' },
            { name: 'neck', label: 'Boyun Çevresi (cm)', type: 'number', placeholder: '38', min: 20, max: 80, step: '0.1' },
            { name: 'hip', label: 'Kalça Çevresi (cm, kadınlar için)', type: 'number', placeholder: '95', min: 50, max: 200, step: '0.1', conditional: 'female' }
        ],
        calc(v) {
            let bf;
            if (v.gender === 'male') {
                bf = 495 / (1.0324 - 0.19077 * Math.log10(v.waist - v.neck) + 0.15456 * Math.log10(v.height)) - 450;
            } else {
                bf = 495 / (1.29579 - 0.35004 * Math.log10(v.waist + v.hip - v.neck) + 0.22100 * Math.log10(v.height)) - 450;
            }
            bf = Math.max(2, Math.min(60, bf));
            let category;
            if (v.gender === 'male') {
                if (bf < 6) category = 'Yarışma Düzeyi';
                else if (bf < 14) category = 'Atletik';
                else if (bf < 18) category = 'Fit';
                else if (bf < 25) category = 'Normal';
                else category = 'Yüksek';
            } else {
                if (bf < 14) category = 'Yarışma Düzeyi';
                else if (bf < 21) category = 'Atletik';
                else if (bf < 25) category = 'Fit';
                else if (bf < 32) category = 'Normal';
                else category = 'Yüksek';
            }
            const leanMass = v.weight ? (v.weight * (1 - bf / 100)).toFixed(1) : '—';
            const fatMass = v.weight ? (v.weight * bf / 100).toFixed(1) : '—';
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">%${bf.toFixed(1)}</span><span class="calc-result-label">Vücut Yağ Oranı</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${category}</span><span class="calc-result-label">Kategori</span></div>
            </div>`;
        }
    },
    yakim: {
        title: 'Kalori Yakımı',
        desc: 'Egzersiz türüne göre yaklaşık kalori yakımınızı hesaplayın.',
        fields: [
            { name: 'weight', label: 'Kilo (kg)', type: 'number', placeholder: '75', min: 30, max: 300, step: '0.1' },
            { name: 'exercise', label: 'Egzersiz Türü', type: 'select', options: [
                ['8', 'Koşu (8 km/s)'],
                ['10', 'Koşu (hızlı, 10+ km/s)'],
                ['6', 'Bisiklet (orta tempo)'],
                ['9.8', 'Bisiklet (hızlı)'],
                ['7', 'Yüzme (orta tempo)'],
                ['6', 'Ağırlık Antrenmanı (yoğun)'],
                ['3.5', 'Ağırlık Antrenmanı (hafif)'],
                ['8.8', 'Ip Atlama'],
                ['4.3', 'Yoga'],
                ['5', 'Yürüyüş (hızlı)'],
                ['3', 'Yürüyüş (normal)'],
                ['9', 'HIIT'],
                ['7.5', 'Kürek Çekme'],
                ['5.5', 'Merdiven Çıkma'],
                ['4', 'Pilates']
            ]},
            { name: 'duration', label: 'Süre (dakika)', type: 'number', placeholder: '60', min: 1, max: 600 }
        ],
        calc(v) {
            const met = parseFloat(v.exercise);
            const kcal = met * v.weight * (v.duration / 60);
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${Math.round(kcal)}</span><span class="calc-result-label">Yakılan Kalori (kcal)</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${(kcal / v.duration).toFixed(1)}</span><span class="calc-result-label">Dakika Başına (kcal)</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${(kcal / 7700 * 1000).toFixed(0)} g</span><span class="calc-result-label">Yaklaşık Yağ Yakımı</span></div>
            </div>`;
        }
    },
    ideal: {
        title: 'İdeal Kilo',
        desc: 'Farklı formüllerle ideal kilonuzu hesaplayın.',
        fields: [
            { name: 'gender', label: 'Cinsiyet', type: 'select', options: [['male', 'Erkek'], ['female', 'Kadın']] },
            { name: 'height', label: 'Boy (cm)', type: 'number', placeholder: '175', min: 100, max: 250 },
            { name: 'weight', label: 'Mevcut Kilo (kg)', type: 'number', placeholder: '80', min: 30, max: 300, step: '0.1' }
        ],
        calc(v) {
            const h = v.height;
            const isMale = v.gender === 'male';
            const devine = isMale ? 50 + 2.3 * ((h / 2.54) - 60) : 45.5 + 2.3 * ((h / 2.54) - 60);
            const robinson = isMale ? 52 + 1.9 * ((h / 2.54) - 60) : 49 + 1.7 * ((h / 2.54) - 60);
            const miller = isMale ? 56.2 + 1.41 * ((h / 2.54) - 60) : 53.1 + 1.36 * ((h / 2.54) - 60);
            const avg = (devine + robinson + miller) / 3;
            const bmi = v.weight / ((h / 100) ** 2);
            const diff = v.weight - avg;
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${avg.toFixed(1)} kg</span><span class="calc-result-label">Ortalama İdeal Kilo</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${devine.toFixed(1)} kg</span><span class="calc-result-label">Devine Formülü</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${robinson.toFixed(1)} kg</span><span class="calc-result-label">Robinson Formülü</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${miller.toFixed(1)} kg</span><span class="calc-result-label">Miller Formülü</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${bmi.toFixed(1)}</span><span class="calc-result-label">Mevcut VKİ</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg</span><span class="calc-result-label">Fark</span></div>
            </div>`;
        }
    },
    rm: {
        title: '1RM (Tek Tekrar Maksimum)',
        desc: 'Bir egzersizde maksimum kaldırabileceğiniz ağırlığı ve yüzdelik tablonuzu hesaplayın.',
        fields: [
            { name: 'weight', label: 'Kaldırılan Ağırlık (kg)', type: 'number', placeholder: '100', min: 1, max: 500, step: '0.5' },
            { name: 'reps', label: 'Tekrar Sayısı', type: 'number', placeholder: '5', min: 1, max: 30 }
        ],
        calc(v) {
            const orm = v.reps === 1 ? v.weight : v.weight * (1 + v.reps / 30);
            const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
            const repRanges = ['1', '2', '3-4', '5-6', '7-8', '9-10', '11-12', '13-15', '16-20'];
            let table = pcts.map((p, i) => `<tr><td>%${p}</td><td>${(orm * p / 100).toFixed(1)} kg</td><td>${repRanges[i]} tekrar</td></tr>`).join('');
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${orm.toFixed(1)} kg</span><span class="calc-result-label">Tahmini 1RM (Epley)</span></div>
            </div>
            <table class="calc-table"><thead><tr><th>Yüzde</th><th>Ağırlık</th><th>Tekrar</th></tr></thead><tbody>${table}</tbody></table>`;
        }
    },
    protein: {
        title: 'Protein İhtiyacı',
        desc: 'Hedefinize göre günlük protein ihtiyacınızı hesaplayın.',
        fields: [
            { name: 'weight', label: 'Kilo (kg)', type: 'number', placeholder: '75', min: 30, max: 300, step: '0.1' },
            { name: 'goal', label: 'Hedef', type: 'select', options: [
                ['1.6', 'Kas Kazanımı'],
                ['2.0', 'Yoğun Kas Kazanımı / Yarışma'],
                ['1.2', 'Genel Sağlık / Koruma'],
                ['1.8', 'Yağ Yakımı (kas koruma)'],
                ['0.8', 'Hareketsiz Yaşam']
            ]}
        ],
        calc(v) {
            const factor = parseFloat(v.goal);
            const protein = v.weight * factor;
            const meals3 = protein / 3;
            const meals5 = protein / 5;
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${Math.round(protein)} g</span><span class="calc-result-label">Günlük Protein</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${v.weight} x ${factor}</span><span class="calc-result-label">kg x g/kg</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(meals3)} g</span><span class="calc-result-label">3 Öğün Başına</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(meals5)} g</span><span class="calc-result-label">5 Öğün Başına</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(protein * 4)} kcal</span><span class="calc-result-label">Proteinden Gelen Kalori</span></div>
            </div>`;
        }
    },
    kalp: {
        title: 'Kalp Atım Hızı Bölgeleri',
        desc: 'Karvonen formülüyle antrenman kalp atım hızı bölgelerinizi hesaplayın.',
        fields: [
            { name: 'age', label: 'Yaş', type: 'number', placeholder: '25', min: 10, max: 100 },
            { name: 'rhr', label: 'Dinlenme Kalp Hızı (bpm)', type: 'number', placeholder: '65', min: 30, max: 120 }
        ],
        calc(v) {
            const mhr = 220 - v.age;
            const hrr = mhr - v.rhr;
            const zones = [
                { name: 'Bölge 1 - Isınma', min: 0.5, max: 0.6, color: '#4CAF50' },
                { name: 'Bölge 2 - Yağ Yakımı', min: 0.6, max: 0.7, color: '#8BC34A' },
                { name: 'Bölge 3 - Aerobik', min: 0.7, max: 0.8, color: '#FFC107' },
                { name: 'Bölge 4 - Anaerobik', min: 0.8, max: 0.9, color: '#FF9800' },
                { name: 'Bölge 5 - Maksimum', min: 0.9, max: 1.0, color: '#f44336' }
            ];
            let zonesHtml = zones.map(z => {
                const lo = Math.round(hrr * z.min + v.rhr);
                const hi = Math.round(hrr * z.max + v.rhr);
                const pct = ((z.max + z.min) / 2 * 100);
                return `<div class="hr-zone">
                    <div class="hr-zone-bar" style="width:${pct}%;background:${z.color}"></div>
                    <div class="hr-zone-info"><strong>${z.name}</strong><span>${lo} - ${hi} bpm</span></div>
                </div>`;
            }).join('');
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${mhr} bpm</span><span class="calc-result-label">Maksimum Kalp Hızı</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${hrr} bpm</span><span class="calc-result-label">Kalp Hızı Rezervi</span></div>
            </div>
            <div class="hr-zones">${zonesHtml}</div>`;
        }
    },
    bmr: {
        title: 'Bazal Metabolizma Hızı',
        desc: 'Vücudunuzun hiçbir aktivite yapmadan harcadığı günlük kalori miktarı.',
        fields: [
            { name: 'gender', label: 'Cinsiyet', type: 'select', options: [['male', 'Erkek'], ['female', 'Kadın']] },
            { name: 'age', label: 'Yaş', type: 'number', placeholder: '25', min: 10, max: 100 },
            { name: 'weight', label: 'Kilo (kg)', type: 'number', placeholder: '75', min: 30, max: 300, step: '0.1' },
            { name: 'height', label: 'Boy (cm)', type: 'number', placeholder: '175', min: 100, max: 250 }
        ],
        calc(v) {
            const mifflin = v.gender === 'male'
                ? 10 * v.weight + 6.25 * v.height - 5 * v.age + 5
                : 10 * v.weight + 6.25 * v.height - 5 * v.age - 161;
            const harris = v.gender === 'male'
                ? 88.362 + 13.397 * v.weight + 4.799 * v.height - 5.677 * v.age
                : 447.593 + 9.247 * v.weight + 3.098 * v.height - 4.330 * v.age;
            const katch = v.gender === 'male'
                ? 66.5 + 13.75 * v.weight + 5.003 * v.height - 6.755 * v.age
                : 655.1 + 9.563 * v.weight + 1.850 * v.height - 4.676 * v.age;
            return `<div class="calc-result-grid">
                <div class="calc-result-item highlight"><span class="calc-result-val">${Math.round(mifflin)} kcal</span><span class="calc-result-label">Mifflin-St Jeor</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(harris)} kcal</span><span class="calc-result-label">Harris-Benedict</span></div>
                <div class="calc-result-item"><span class="calc-result-val">${Math.round(katch)} kcal</span><span class="calc-result-label">Katch-McArdle</span></div>
            </div>
            <p class="calc-note">Mifflin-St Jeor formülü en güncel ve güvenilir sonucu verir.</p>`;
        }
    }
};

const CALC_KEYS = ['kalori', 'yag', 'yakim', 'ideal', 'rm', 'protein', 'kalp', 'bmr'];

function buildFieldHtml(f) {
    if (f.type === 'select') {
        const opts = f.options.map(([val, label]) => `<option value="${val}">${label}</option>`).join('');
        return `<div class="calc-field" ${f.conditional ? `data-show-for="${f.conditional}"` : ''}>
            <label>${f.label}</label><select name="${f.name}">${opts}</select></div>`;
    }
    return `<div class="calc-field" ${f.conditional ? `data-show-for="${f.conditional}"` : ''}>
        <label>${f.label}</label>
        <input type="number" name="${f.name}" placeholder="${f.placeholder || ''}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''}>
    </div>`;
}

function openCalcModal(key) {
    const c = CALCS[key];
    if (!c) return;

    let overlay = document.getElementById('calc-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'calc-modal-overlay';
        overlay.className = 'calc-modal-overlay';
        overlay.innerHTML = `<div class="calc-modal"><div class="calc-modal-header"><h3></h3><button class="calc-modal-close"><i class="fas fa-times"></i></button></div><div class="calc-modal-body"></div></div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => {
            if (e.target === overlay || !overlay.querySelector('.calc-modal').contains(e.target)) closeCalcModal();
        });
        overlay.querySelector('.calc-modal-close').addEventListener('click', closeCalcModal);
    }

    overlay.querySelector('h3').textContent = c.title;
    const body = overlay.querySelector('.calc-modal-body');
    body.innerHTML = `<p class="calc-modal-desc">${c.desc}</p>
        <form class="calc-form">${c.fields.map(buildFieldHtml).join('')}
        <button type="submit" class="btn btn-primary btn-full">Hesapla</button></form>
        <div class="calc-results"></div>`;

    const form = body.querySelector('.calc-form');
    const genderSelect = form.querySelector('[name="gender"]');
    if (genderSelect) {
        const toggleConditional = () => {
            const val = genderSelect.value;
            form.querySelectorAll('[data-show-for]').forEach(el => {
                el.style.display = el.dataset.showFor === val ? '' : 'none';
            });
        };
        genderSelect.addEventListener('change', toggleConditional);
        toggleConditional();
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const vals = {};
        c.fields.forEach(f => {
            const el = form.querySelector(`[name="${f.name}"]`);
            vals[f.name] = f.type === 'number' ? parseFloat(el.value) : el.value;
        });

        for (const f of c.fields) {
            if (f.type === 'number' && f.conditional) {
                const gv = form.querySelector('[name="gender"]');
                if (gv && gv.value !== f.conditional) continue;
            }
            if (f.type === 'number' && (isNaN(vals[f.name]) || vals[f.name] <= 0)) {
                el_flash(form.querySelector(`[name="${f.name}"]`));
                return;
            }
        }

        body.querySelector('.calc-results').innerHTML = c.calc(vals);
    });

    overlay.classList.add('active');
    lockBody();

    overlay.scrollTop = 0;
}

function el_flash(el) {
    if (!el) return;
    el.style.borderColor = '#ef4444';
    el.focus();
    setTimeout(() => el.style.borderColor = '', 1500);
}

let savedScrollY = 0;

function lockBody() {
    savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
}

function unlockBody() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, savedScrollY);
}

function closeCalcModal() {
    const overlay = document.getElementById('calc-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        unlockBody();
    }
}

export function initCalculators() {
    document.querySelectorAll('.calc-card').forEach((card, i) => {
        if (CALC_KEYS[i]) {
            card.addEventListener('click', () => openCalcModal(CALC_KEYS[i]));
        }
    });
}
