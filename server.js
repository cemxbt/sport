const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'images', 'uploads');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000;
const SESSION_DURATION = 24 * 60 * 60 * 1000;

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');

if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}

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
    return req.ip || req.connection.remoteAddress || 'unknown';
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
        sameSite: 'strict',
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Site: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
});
