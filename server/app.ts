import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Session signing key from env or ephemeral in-memory randomBytes
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface StoredUser {
  id: string;
  mobile: string;
  nid: string;
  passwordSalt: string;
  passwordHash: string;
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface DbSchema {
  users: StoredUser[];
}

function normalizeSupabaseUrl(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed || trimmed.startsWith('MY_')) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.hostname === 'supabase.com') {
      const match = parsed.pathname.match(/^\/dashboard\/project\/([a-z0-9-]{8,40})/i);
      if (match) {
        return `https://${match[1]}.supabase.co`;
      }
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getSupabaseClient(): SupabaseClient | null {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey || serviceKey.startsWith('MY_')) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error && err.message
      ? err.message
      : err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? String((err as { message: string }).message)
        : fallback;

  if (/permission denied/i.test(raw)) {
    return 'Supabase permission denied: please make sure SUPABASE_SERVICE_ROLE_KEY uses your Secret key (sb_secret_... or service_role), not the Publishable key.';
  }
  return raw;
}

const supabase = getSupabaseClient();

function ensureDbDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalDb(): DbSchema {
  ensureDbDir();
  if (!DB_FILE.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid database path');
  }
  if (!fs.existsSync(DB_FILE)) {
    return { users: [] };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DbSchema;
    return Array.isArray(parsed.users) ? parsed : { users: [] };
  } catch {
    return { users: [] };
  }
}

function writeLocalDb(db: DbSchema) {
  ensureDbDir();
  if (!DB_FILE.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid database path');
  }
  const tmpFile = path.resolve(DATA_DIR, `db.${process.pid}.tmp.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

interface SupabaseUserRow {
  id: string;
  mobile: string;
  nid: string | null;
  password_salt: string;
  password_hash: string;
  state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function mapSupabaseRow(row: SupabaseUserRow): StoredUser {
  return {
    id: row.id,
    mobile: row.mobile,
    nid: row.nid || '',
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    state: row.state && typeof row.state === 'object' ? row.state : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeClientState(state: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...state };
  delete clean._pendingOtp;
  return { ...clean, isAuthenticated: true };
}

async function findUserByIdentifier(identifier: string): Promise<StoredUser | null> {
  if (!supabase) {
    const db = readLocalDb();
    return db.users.find((u) => u.mobile === identifier || (u.nid && u.nid === identifier)) ?? null;
  }

  const { data: byMobile, error: mobileErr } = await supabase
    .from('sebacare_users')
    .select('*')
    .eq('mobile', identifier)
    .maybeSingle<SupabaseUserRow>();
  if (mobileErr) throw mobileErr;
  if (byMobile) return mapSupabaseRow(byMobile);

  const { data: byNid, error: nidErr } = await supabase
    .from('sebacare_users')
    .select('*')
    .eq('nid', identifier)
    .maybeSingle<SupabaseUserRow>();
  if (nidErr) throw nidErr;
  return byNid ? mapSupabaseRow(byNid) : null;
}

async function findUserById(userId: string): Promise<StoredUser | null> {
  if (!supabase) {
    const db = readLocalDb();
    return db.users.find((u) => u.id === userId) ?? null;
  }

  const { data, error } = await supabase
    .from('sebacare_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle<SupabaseUserRow>();
  if (error) throw error;
  return data ? mapSupabaseRow(data) : null;
}

async function findDuplicateUser(mobile: string, nid: string): Promise<boolean> {
  if (!supabase) {
    const db = readLocalDb();
    return db.users.some((u) => u.mobile === mobile || (nid && u.nid && u.nid === nid));
  }

  const { data: byMobile, error: mobileErr } = await supabase
    .from('sebacare_users')
    .select('id')
    .eq('mobile', mobile)
    .maybeSingle();
  if (mobileErr) throw mobileErr;
  if (byMobile) return true;

  if (nid) {
    const { data: byNid, error: nidErr } = await supabase
      .from('sebacare_users')
      .select('id')
      .eq('nid', nid)
      .maybeSingle();
    if (nidErr) throw nidErr;
    if (byNid) return true;
  }

  return false;
}

async function createUserRecord(user: StoredUser): Promise<void> {
  if (!supabase) {
    const db = readLocalDb();
    db.users.push(user);
    writeLocalDb(db);
    return;
  }

  const { error } = await supabase.from('sebacare_users').insert({
    id: user.id,
    mobile: user.mobile,
    nid: user.nid || null,
    password_salt: user.passwordSalt,
    password_hash: user.passwordHash,
    state: user.state,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  });
  if (error) throw error;
}

async function updateUserStateRecord(userId: string, state: Record<string, unknown>): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    db.users[idx].state = state;
    db.users[idx].updatedAt = updatedAt;
    writeLocalDb(db);
    return true;
  }

  const { data, error } = await supabase
    .from('sebacare_users')
    .update({ state, updated_at: updatedAt })
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid: string;
      exp: number;
    };
    if (!data.uid || typeof data.exp !== 'number' || data.exp < Date.now()) {
      return null;
    }
    return { uid: data.uid };
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verified = token ? verifyToken(token) : null;
  if (!verified) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  req.userId = verified.uid;
  return next();
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyFn?: (req: AuthedRequest) => string;
  message: string;
}) {
  const hits = new Map<string, number[]>();
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const key = options.keyFn ? options.keyFn(req) : req.ip || 'unknown';
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const recent = (hits.get(key) || []).filter((t) => t > cutoff);
    if (recent.length >= options.max) {
      return res.status(429).json({ error: options.message });
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [k, times] of hits.entries()) {
        const filtered = times.filter((t) => t > cutoff);
        if (filtered.length === 0) hits.delete(k);
        else hits.set(k, filtered);
      }
    }
    return next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please wait a few minutes and try again.',
});

const aiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyFn: (req) => req.userId || req.ip || 'unknown',
  message: 'Hourly AI usage limit reached for this account. Please try again shortly.',
});

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function createApiApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storage: supabase ? 'supabase' : 'local' });
  });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const { fullName, mobile, nid, age, gender, bloodGroup, password, initialState } = req.body ?? {};
      if (typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({ error: 'Full name is required.' });
      }
      if (typeof mobile !== 'string' || mobile.trim().length < 6) {
        return res.status(400).json({ error: 'Valid mobile number is required.' });
      }
      if (typeof password !== 'string' || password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters.' });
      }

      const cleanMobile = mobile.trim();
      const cleanNid = typeof nid === 'string' ? nid.trim() : '';

      const duplicate = await findDuplicateUser(cleanMobile, cleanNid);
      if (duplicate) {
        return res.status(409).json({
          error: 'An account with this mobile number or NID already exists. Please sign in.',
        });
      }

      const userId = 'user-' + crypto.randomUUID();
      const { salt, hash } = hashPassword(password);
      const now = new Date().toISOString();

      const stateToStore =
        initialState && typeof initialState === 'object'
          ? {
              ...initialState,
              isAuthenticated: true,
              account: {
                ...(initialState.account || {}),
                id: userId,
                fullName: fullName.trim(),
                mobile: cleanMobile,
                nid: cleanNid,
                age: String(age || '35'),
                gender: String(gender || 'Male'),
                bloodGroup: String(bloodGroup || 'O+'),
                plan: 'subscribed',
              },
            }
          : { isAuthenticated: true };

      const newUser: StoredUser = {
        id: userId,
        mobile: cleanMobile,
        nid: cleanNid,
        passwordSalt: salt,
        passwordHash: hash,
        state: stateToStore,
        createdAt: now,
        updatedAt: now,
      };

      await createUserRecord(newUser);
      const token = signToken(userId);
      return res.status(201).json({ token, state: sanitizeClientState(newUser.state) });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        return res.status(409).json({
          error: 'An account with this mobile number or NID already exists. Please sign in.',
        });
      }
      const message = extractErrorMessage(err, 'Unable to register account.');
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const { mobileOrNid, password } = req.body ?? {};
      if (typeof mobileOrNid !== 'string' || !mobileOrNid.trim()) {
        return res.status(400).json({ error: 'Mobile number or NID is required.' });
      }
      if (typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Password is required.' });
      }

      const user = await findUserByIdentifier(mobileOrNid.trim());
      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid mobile/NID or password.' });
      }

      const token = signToken(user.id);
      return res.json({ token, state: sanitizeClientState(user.state) });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to sign in.');
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/request-otp', authLimiter, async (req, res) => {
    try {
      const { mobileOrNid } = req.body ?? {};
      if (typeof mobileOrNid !== 'string' || !mobileOrNid.trim()) {
        return res.status(400).json({ error: 'Enter your registered mobile number or NID first.' });
      }
      const identifier = mobileOrNid.trim();
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return res.status(404).json({ error: 'No account found for this mobile or NID. Please create an account.' });
      }

      const code = String(crypto.randomInt(1000, 9999));
      await updateUserStateRecord(user.id, {
        ...user.state,
        _pendingOtp: { code, expiresAt: Date.now() + 5 * 60 * 1000 },
      });

      return res.json({ sent: true, previewOtp: code });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to generate OTP.');
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
    try {
      const { mobileOrNid, code } = req.body ?? {};
      if (typeof mobileOrNid !== 'string' || typeof code !== 'string') {
        return res.status(400).json({ error: 'Mobile/NID and OTP code are required.' });
      }
      const user = await findUserByIdentifier(mobileOrNid.trim());
      const pending = user?.state?._pendingOtp as { code?: string; expiresAt?: number } | undefined;
      if (
        !user ||
        !pending ||
        typeof pending.expiresAt !== 'number' ||
        pending.expiresAt < Date.now() ||
        pending.code !== code.trim()
      ) {
        return res.status(401).json({ error: 'Invalid or expired OTP code.' });
      }

      const cleanedState = sanitizeClientState(user.state);
      await updateUserStateRecord(user.id, cleanedState);

      const token = signToken(user.id);
      return res.json({ token, state: cleanedState });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to verify OTP.');
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/demo', authLimiter, async (req, res) => {
    try {
      const { defaultDemoState } = req.body ?? {};
      let demoUser = await findUserById('user-demo-rahim');
      if (!demoUser) {
        const { salt, hash } = hashPassword('demo1234');
        const now = new Date().toISOString();
        demoUser = {
          id: 'user-demo-rahim',
          mobile: '01711223344',
          nid: '1984269012345',
          passwordSalt: salt,
          passwordHash: hash,
          state:
            defaultDemoState && typeof defaultDemoState === 'object'
              ? { ...defaultDemoState, isAuthenticated: true }
              : { isAuthenticated: true },
          createdAt: now,
          updatedAt: now,
        };
        await createUserRecord(demoUser);
      }
      const token = signToken(demoUser.id);
      return res.json({ token, state: sanitizeClientState(demoUser.state) });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to start demo session.');
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/state', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = await findUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'Account not found.' });
      }
      return res.json({ state: sanitizeClientState(user.state) });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to load state.');
      return res.status(500).json({ error: message });
    }
  });

  app.put('/api/state', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { state } = req.body ?? {};
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'Invalid state payload.' });
      }
      const existing = await findUserById(req.userId!);
      if (!existing) {
        return res.status(404).json({ error: 'Account not found.' });
      }
      const updated = await updateUserStateRecord(req.userId!, {
        ...state,
        isAuthenticated: true,
        ...(existing.state._pendingOtp ? { _pendingOtp: existing.state._pendingOtp } : {}),
      });
      if (!updated) {
        return res.status(404).json({ error: 'Account not found.' });
      }
      return res.json({ saved: true });
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Unable to save state.');
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/scan-prescription', requireAuth, aiLimiter, async (req: AuthedRequest, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY in environment secrets.',
      });
    }

    const { imageBase64, mimeType, language } = req.body ?? {};
    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({ error: 'Missing prescription image data.' });
    }

    const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const safeMime = typeof mimeType === 'string' && allowedMimes.has(mimeType) ? mimeType : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    if (cleanBase64.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is too large. Please upload a photo under 7 MB.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: cleanBase64,
              },
            },
            {
              text: `Extract all structured medical prescription information from this image.
If a field is not visible or unreadable, return an empty string "" (do not invent fake values).
Keep any extra notes, vitals (BP, pulse, weight, blood sugar), or special instructions in extraFields.
Convert medicine schedules into exact clock times like "08:00 AM", "02:00 PM", "09:00 PM" (e.g., 1+0+1 -> ["08:00 AM", "09:00 PM"], 1+1+1 -> ["08:00 AM", "02:00 PM", "09:00 PM"]).
Language context: ${language === 'bn' ? 'Bangla/English prescription from Bangladesh' : 'English/Bangla prescription'}.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              doctorName: { type: Type.STRING },
              doctorSpecialty: { type: Type.STRING },
              doctorRegNo: { type: Type.STRING },
              hospitalName: { type: Type.STRING },
              hospitalAddress: { type: Type.STRING },
              hospitalPhone: { type: Type.STRING },
              date: { type: Type.STRING },
              followUpDate: { type: Type.STRING },
              vitals: { type: Type.STRING },
              diagnosis: { type: Type.STRING },
              advice: { type: Type.STRING },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    strength: { type: Type.STRING },
                    times: { type: Type.ARRAY, items: { type: Type.STRING } },
                    repeat: { type: Type.STRING },
                    durationDays: { type: Type.INTEGER },
                    foodRelation: { type: Type.STRING },
                    isCritical: { type: Type.BOOLEAN },
                  },
                },
              },
              suggestedTests: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                  },
                },
              },
              extraFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return res.json({ result: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to read prescription image.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai-call/respond', requireAuth, aiLimiter, async (req: AuthedRequest, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY in environment secrets.',
      });
    }

    const { transcript, language, mode, medicineSummary, timeSlot, personName } = req.body ?? {};
    if (typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Please say or type a response.' });
    }

    const langLabel = language === 'bn' ? 'Bangla (বাংলা)' : 'English';
    const isHealthCheck = mode === 'health_check';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Patient name: ${typeof personName === 'string' ? personName : 'Patient'}
Call type: ${isHealthCheck ? 'Scheduled health check call' : `Medicine reminder for ${medicineSummary || 'scheduled medicines'} at ${timeSlot || 'now'}`}
Patient reply: "${transcript.slice(0, 600)}"`,
        config: {
          systemInstruction: `You are a polite, warm, respectful medical reminder voice assistant calling an elderly patient.
Strict rules:
1. NEVER give medical advice, diagnose, or suggest changing medicine doses.
2. Classify the patient's reply into one intent:
   - "taken": patient confirms they took the medicine (e.g. "হ্যাঁ খেয়েছি", "yes", "taken", "1").
   - "later": patient asks to be reminded later (e.g. "পরে খাবো", "30 min", "later", "snooze", "2").
   - "problem": patient reports any symptom, dizziness, pain, fall, nausea, or difficulty.
   - "health_update": for health check calls when they describe how they feel without requesting snooze/taken.
   - "unclear": response doesn't clearly indicate taken, later, or a symptom.
3. Set isUrgent = true if the patient mentions serious warning signs such as chest pain, breathing trouble, fainting, fall, severe dizziness, or emergency.
4. Provide a concise, reassuring replyText in ${langLabel} (under 25 words). If unclear, politely ask once more or offer "Press 1 for taken, 2 for later".
5. Provide a clean problemSummary in English or Bangla if intent is "problem" or "health_update".`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              isUrgent: { type: Type.BOOLEAN },
              problemSummary: { type: Type.STRING },
              replyText: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ result: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to process voice call response.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/support-chat', requireAuth, aiLimiter, async (req: AuthedRequest, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY in environment secrets.',
      });
    }

    const { messages, permissionGranted, personName, callSettingsSummary, language } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const safeHistory = messages
      .slice(-12)
      .map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'User' : 'Support'}: ${String(m.text ?? '').slice(0, 500)}`)
      .join('\n');

    const privacyContext = permissionGranted
      ? `The user GRANTED permission to inspect ${personName || 'the patient'}'s call settings: ${JSON.stringify(callSettingsSummary ?? {})}. Use these exact settings to diagnose issues (such as quiet hours, active pause window, or battery optimization).`
      : `The user has NOT granted permission to view medical or call settings. You MUST NOT guess or reveal any personal medical/call settings. Keep troubleshooting general and ask if they want to allow viewing settings if needed.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: safeHistory,
        config: {
          systemInstruction: `You are SebaCare's empathetic, concise technical support specialist.
${privacyContext}
Respond in ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'} in 1-3 short, practical sentences. Never give medical advice.`,
        },
      });

      return res.json({ reply: (response.text ?? '').trim() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Support chat failed.';
      return res.status(502).json({ error: message });
    }
  });

  return app;
}
