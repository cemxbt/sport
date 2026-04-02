require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'images', 'uploads');
const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'cemxbt/sport';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000;
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_RATE_MAX = 10;
const contactRateByIp = new Map();

const DEFAULT_CONTACT_TO = 'iletisim@ibrahimersoran.com,ibrahimersoran@hotmail.com';

function mergeContactRecipients(toList) {
    const lower = (addr) => addr.toLowerCase();
    const seen = new Set(toList.map(lower));
    const alsoRaw =
        process.env.CONTACT_MAIL_ALSO !== undefined
            ? process.env.CONTACT_MAIL_ALSO
            : 'ibrahimersoran@hotmail.com';
    for (const addr of alsoRaw.split(',').map(s => s.trim()).filter(Boolean)) {
        if (!seen.has(lower(addr))) {
            seen.add(lower(addr));
            toList.push(addr);
        }
    }
    return toList;
}

function getMailTransport() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const opts = {
        host,
        port,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 15000
    };
    if (port === 465) {
        opts.secure = true;
    } else {
        opts.secure = false;
        opts.requireTLS = true;
    }
    return nodemailer.createTransport(opts);
}

function sanitizeContactField(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f<>]/g, ' ').trim().slice(0, maxLen);
}

async function sendContactViaResend({ toList, replyTo, subject, text }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;

    const fromAddr = process.env.RESEND_FROM || 'Iletisim <onboarding@resend.dev>';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const apiRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddr,
                to: toList,
                reply_to: replyTo,
                subject,
                text
            }),
            signal: controller.signal
        });
        clearTimeout(timer);
        const data = await apiRes.json().catch(() => ({}));
        if (!apiRes.ok) {
            const detail = data.message || data.name || JSON.stringify(data);
            console.error('resend contact error', apiRes.status, detail);
            const err = new Error(detail);
            err.resendStatus = apiRes.status;
            throw err;
        }
        return true;
    } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') {
            throw new Error('Resend API zaman asimi');
        }
        throw e;
    }
}

function contactRateAllowed(ip) {
    const now = Date.now();
    let rec = contactRateByIp.get(ip);
    if (!rec || now > rec.until) {
        contactRateByIp.set(ip, { count: 1, until: now + CONTACT_RATE_WINDOW_MS });
        return true;
    }
    if (rec.count >= CONTACT_RATE_MAX) return false;
    rec.count += 1;
    return true;
}

[UPLOAD_DIR, PUBLIC_DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
if (!fs.existsSync(AUTH_FILE)) {
    const defaultHash = bcrypt.hashSync('admin123', 10);
    fs.writeFileSync(AUTH_FILE, JSON.stringify({
        passwordHash: defaultHash,
        sessions: [],
        failedAttempts: {}
    }, null, 2), 'utf-8');
}

if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
}

const ALLOWED_ORIGINS = [
    'https://ibrahimersoran.com',
    'https://www.ibrahimersoran.com',
    'https://sport-xmgh.onrender.com',
    'http://localhost:3000'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/data', express.static(DATA_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        cb(null, extOk && mimeOk);
    }
});

function readData(filename) {
    const filepath = path.join(DATA_DIR, filename);
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function writeData(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, json, 'utf-8');

    const publicCopy = path.join(PUBLIC_DATA_DIR, filename);
    try { fs.writeFileSync(publicCopy, json, 'utf-8'); } catch (_) {}

    if (GITHUB_TOKEN && filename !== 'auth.json') {
        syncToGitHub(filename, json).catch(() => {});
    }
}

async function syncToGitHub(filename, content) {
    const headers = {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
    };

    const paths = [`data/${filename}`, `public/data/${filename}`];
    const encoded = Buffer.from(content).toString('base64');

    for (const filePath of paths) {
        try {
            const getRes = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=main`,
                { headers }
            );
            const fileData = await getRes.json();

            await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        message: `${filename} guncellendi`,
                        content: encoded,
                        sha: fileData.sha,
                        branch: 'main'
                    })
                }
            );
        } catch (_) {}
    }
}

async function syncFileToGitHub(repoPath, base64Content, commitMsg) {
    if (!GITHUB_TOKEN) return;
    const headers = {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
    };
    try {
        const getRes = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}?ref=main`,
            { headers }
        );
        const fileData = await getRes.json();
        await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    message: commitMsg || `${repoPath} guncellendi`,
                    content: base64Content,
                    sha: fileData.sha || undefined,
                    branch: 'main'
                })
            }
        );
    } catch (_) {}
}

function getNextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
}

function readAuth() {
    return readData('auth.json');
}

function writeAuth(data) {
    writeData('auth.json', data);
}

function cleanSessions(auth) {
    const now = Date.now();
    auth.sessions = (auth.sessions || []).filter(s => s.expires > now);
}

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress || 'unknown';
}

function isLocked(auth, ip) {
    const record = auth.failedAttempts?.[ip];
    if (!record) return false;
    if (record.count >= MAX_ATTEMPTS && (Date.now() - record.lastAttempt) < LOCK_DURATION) {
        return true;
    }
    if (record.count >= MAX_ATTEMPTS && (Date.now() - record.lastAttempt) >= LOCK_DURATION) {
        delete auth.failedAttempts[ip];
        writeAuth(auth);
    }
    return false;
}

function recordFailedAttempt(auth, ip) {
    if (!auth.failedAttempts) auth.failedAttempts = {};
    const record = auth.failedAttempts[ip] || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    auth.failedAttempts[ip] = record;
    writeAuth(auth);
}

function clearFailedAttempts(auth, ip) {
    if (auth.failedAttempts?.[ip]) {
        delete auth.failedAttempts[ip];
        writeAuth(auth);
    }
}

function requireAuth(req, res, next) {
    const token = req.cookies?.admin_session;
    if (!token) return res.status(401).json({ error: 'Oturum gerekli' });

    const auth = readAuth();
    cleanSessions(auth);
    writeAuth(auth);

    const session = auth.sessions.find(s => s.token === token);
    if (!session) return res.status(401).json({ error: 'Oturum gecersiz' });

    next();
}

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Sifre gerekli' });

    const auth = readAuth();
    const ip = getClientIp(req);

    if (isLocked(auth, ip)) {
        const record = auth.failedAttempts[ip];
        const remaining = Math.ceil((LOCK_DURATION - (Date.now() - record.lastAttempt)) / 1000);
        return res.status(429).json({
            error: 'Cok fazla basarisiz deneme. Lutfen bekleyin.',
            remainingSeconds: remaining
        });
    }

    const valid = await bcrypt.compare(password, auth.passwordHash);
    if (!valid) {
        recordFailedAttempt(auth, ip);
        const record = auth.failedAttempts[ip];
        const attemptsLeft = MAX_ATTEMPTS - record.count;
        return res.status(401).json({
            error: 'Yanlis sifre',
            attemptsLeft: Math.max(0, attemptsLeft)
        });
    }

    clearFailedAttempts(auth, ip);
    cleanSessions(auth);

    const token = crypto.randomBytes(32).toString('hex');
    auth.sessions.push({ token, expires: Date.now() + SESSION_DURATION, createdAt: Date.now() });
    writeAuth(auth);

    res.cookie('admin_session', token, {
        httpOnly: true,
        sameSite: IS_PRODUCTION ? 'lax' : 'strict',
        secure: IS_PRODUCTION,
        maxAge: SESSION_DURATION,
        path: '/'
    });

    res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.cookies?.admin_session;
    if (token) {
        const auth = readAuth();
        auth.sessions = (auth.sessions || []).filter(s => s.token !== token);
        writeAuth(auth);
    }
    res.clearCookie('admin_session', { path: '/' });
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    const token = req.cookies?.admin_session;
    if (!token) return res.json({ authenticated: false });

    const auth = readAuth();
    cleanSessions(auth);
    writeAuth(auth);

    const session = auth.sessions.find(s => s.token === token);
    res.json({ authenticated: !!session });
});

app.post('/api/contact', async (req, res) => {
    const ip = getClientIp(req);
    if (!contactRateAllowed(ip)) {
        return res.status(429).json({ error: 'Cok fazla gonderim. Lutfen bir saat sonra tekrar deneyin.' });
    }

    const body = req.body || {};
    const name = sanitizeContactField(String(body.name || ''), 200);
    const email = sanitizeContactField(String(body.email || ''), 200);
    const phone = sanitizeContactField(String(body.phone || ''), 50);
    const pkg = sanitizeContactField(String(body.package || ''), 200);
    const message = sanitizeContactField(String(body.message || ''), 5000);

    if (!name || !email) {
        return res.status(400).json({ error: 'Ad ve e-posta zorunludur.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Gecersiz e-posta adresi.' });
    }
    if (!message || message.length < 3) {
        return res.status(400).json({ error: 'Lutfen kisa da olsa bir mesaj yazin.' });
    }

    const toRaw = process.env.CONTACT_MAIL_TO || DEFAULT_CONTACT_TO;
    let toList = toRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (!toList.length) toList = ['iletisim@ibrahimersoran.com'];
    mergeContactRecipients(toList);

    const subject = `Iletisim formu: ${name}`;
    const text = [
        `Gonderen: ${name}`,
        `E-posta: ${email}`,
        phone ? `Telefon: ${phone}` : null,
        pkg ? `Paket: ${pkg}` : null,
        '',
        'Mesaj:',
        message
    ].filter(Boolean).join('\n');

    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const transport = getMailTransport();

    if (!hasResend && !transport) {
        return res.status(503).json({
            error: 'E-posta yapilandirilmamis. Renderda RESEND_API_KEY veya SMTP bilgilerini ekleyin.'
        });
    }

    const sendDeadline = 18000;
    try {
        if (hasResend) {
            await sendContactViaResend({
                toList,
                replyTo: email,
                subject,
                text
            });
        } else {
            const fromAddr = process.env.CONTACT_MAIL_FROM || process.env.SMTP_USER;
            const mailOpts = {
                from: `"ibrahimersoran.com" <${fromAddr}>`,
                to: toList,
                replyTo: email,
                subject,
                text
            };
            await Promise.race([
                transport.sendMail(mailOpts),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('SMTP timeout')), sendDeadline);
                })
            ]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('contact mail error', err.message);
        let msg = 'E-posta gonderilemedi. Lutfen daha sonra tekrar deneyin.';
        if (/timeout|zaman asimi/i.test(err.message)) {
            msg = 'E-posta sunucusu zaman asimina ugradi. SMTP veya ag ayarlarini kontrol edin.';
        } else if (hasResend && err.resendStatus === 403) {
            msg = 'Resend: alan adi veya gonderen adresi dogrulanmamis. Resend panelinden domain ve RESEND_FROM ayarlayin.';
        } else if (hasResend && err.message && err.message.length < 220) {
            msg = `E-posta servisi: ${err.message}`;
        }
        res.status(500).json({ error: msg });
    }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mevcut ve yeni sifre gerekli' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Yeni sifre en az 6 karakter olmali' });
    }

    const auth = readAuth();
    const valid = await bcrypt.compare(currentPassword, auth.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Mevcut sifre yanlis' });

    auth.passwordHash = await bcrypt.hash(newPassword, 10);
    auth.sessions = [];
    writeAuth(auth);

    res.clearCookie('admin_session', { path: '/' });
    res.json({ success: true, message: 'Sifre degistirildi. Lutfen tekrar giris yapin.' });
});

app.use('/admin', (req, res, next) => {
    if (req.path === '/login.html' || req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
        return next();
    }

    const token = req.cookies?.admin_session;
    if (!token) return res.redirect('/admin/login.html');

    const auth = readAuth();
    cleanSessions(auth);
    writeAuth(auth);

    const session = auth.sessions.find(s => s.token === token);
    if (!session) return res.redirect('/admin/login.html');

    next();
});

app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/api/config', (req, res) => {
    res.json(readData('config.json'));
});

app.put('/api/config', requireAuth, (req, res) => {
    writeData('config.json', req.body);
    res.json({ success: true });
});

app.get('/api/packages', (req, res) => {
    res.json(readData('packages.json'));
});

app.put('/api/packages', requireAuth, (req, res) => {
    writeData('packages.json', req.body);
    res.json({ success: true });
});

app.get('/api/blog', (req, res) => {
    res.json(readData('blog.json'));
});

app.post('/api/blog', requireAuth, (req, res) => {
    const items = readData('blog.json');
    const newItem = { id: getNextId(items), ...req.body };
    items.unshift(newItem);
    writeData('blog.json', items);
    res.json(newItem);
});

app.put('/api/blog/:id', requireAuth, (req, res) => {
    const items = readData('blog.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Bulunamadı' });
    items[idx] = { ...items[idx], ...req.body };
    writeData('blog.json', items);
    res.json(items[idx]);
});

app.delete('/api/blog/:id', requireAuth, (req, res) => {
    let items = readData('blog.json');
    items = items.filter(i => i.id !== parseInt(req.params.id));
    writeData('blog.json', items);
    res.json({ success: true });
});

app.get('/api/transformations', (req, res) => {
    res.json(readData('transformations.json'));
});

app.post('/api/transformations', requireAuth, (req, res) => {
    const items = readData('transformations.json');
    const newItem = { id: getNextId(items), ...req.body };
    items.push(newItem);
    writeData('transformations.json', items);
    res.json(newItem);
});

app.put('/api/transformations/:id', requireAuth, (req, res) => {
    const items = readData('transformations.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Bulunamadı' });
    items[idx] = { ...items[idx], ...req.body };
    writeData('transformations.json', items);
    res.json(items[idx]);
});

app.delete('/api/transformations/:id', requireAuth, (req, res) => {
    let items = readData('transformations.json');
    items = items.filter(i => i.id !== parseInt(req.params.id));
    writeData('transformations.json', items);
    res.json({ success: true });
});

app.get('/api/faq', (req, res) => {
    res.json(readData('faq.json'));
});

app.post('/api/faq', requireAuth, (req, res) => {
    const items = readData('faq.json');
    const newItem = { id: getNextId(items), ...req.body };
    items.push(newItem);
    writeData('faq.json', items);
    res.json(newItem);
});

app.put('/api/faq/:id', requireAuth, (req, res) => {
    const items = readData('faq.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Bulunamadı' });
    items[idx] = { ...items[idx], ...req.body };
    writeData('faq.json', items);
    res.json(items[idx]);
});

app.delete('/api/faq/:id', requireAuth, (req, res) => {
    let items = readData('faq.json');
    items = items.filter(i => i.id !== parseInt(req.params.id));
    writeData('faq.json', items);
    res.json({ success: true });
});

app.get('/api/videos', (req, res) => {
    res.json(readData('videos.json'));
});

app.post('/api/videos', requireAuth, (req, res) => {
    const items = readData('videos.json');
    const newItem = { id: getNextId(items), ...req.body };
    items.unshift(newItem);
    writeData('videos.json', items);
    res.json(newItem);
});

app.put('/api/videos/:id', requireAuth, (req, res) => {
    const items = readData('videos.json');
    const idx = items.findIndex(i => i.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Bulunamadı' });
    items[idx] = { ...items[idx], ...req.body };
    writeData('videos.json', items);
    res.json(items[idx]);
});

app.delete('/api/videos/:id', requireAuth, (req, res) => {
    let items = readData('videos.json');
    items = items.filter(i => i.id !== parseInt(req.params.id));
    writeData('videos.json', items);
    res.json({ success: true });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi' });
    res.json({ url: `/assets/images/uploads/${req.file.filename}` });
});

app.post('/api/upload-trainer', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi' });
    const trainerPath = path.join(__dirname, 'public', 'assets', 'images', 'trainer.png');
    fs.copyFileSync(req.file.path, trainerPath);
    fs.unlinkSync(req.file.path);

    if (GITHUB_TOKEN) {
        const imgBase64 = fs.readFileSync(trainerPath).toString('base64');
        syncFileToGitHub('public/assets/images/trainer.png', imgBase64, 'Egitmen fotografi guncellendi').catch(() => {});
    }

    res.json({ success: true, url: '/assets/images/trainer.png?v=' + Date.now() });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Site: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
});
