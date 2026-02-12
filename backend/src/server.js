/* global process */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

const PORT = Number(process.env.PORT || 4000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-before-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const CORS_ORIGIN_LIST = (process.env.CORS_ORIGIN_LIST || '').split(',').map((o) => o.trim()).filter(Boolean);
const MONGO_URI = process.env.MONGO_URI || '';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'mix_masters';

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'https://mailservice-tau.vercel.app/api/email/send';
const MAIL_SERVICE_API_KEY = process.env.MAIL_SERVICE_API_KEY || '';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@mixmasters.club,aathishpirate@gmail.com').split(',').map(e => e.trim());
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const RESOURCE_KEYS = new Set(['events', 'judges', 'sponsors', 'gallery', 'faq']);
const ALLOWED_UPLOAD_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

const CONTENT_DOC_ID = 'site_content_v1';
const FAQ_SEED = [
  {
    q: 'When is the competition held?',
    a: 'The Mix Masters Club DJ Competition will be held on 22 May 2026.',
  },
  {
    q: 'Where is the competition taking place?',
    a: 'The event will be hosted at HardRock Cafe, Singapore.',
  },
  {
    q: 'What is Mix Masters Club?',
    a: 'Mix Masters Club is a one-time global DJ competition, bringing together DJs from different countries to compete live on one stage. This is not a recurring tournament or league; it is a single, high-impact showcase focused on DJ skill, creativity, and crowd control.',
  },
  {
    q: 'Is this an international competition?',
    a: 'Yes. DJs participating in Mix Masters Club represent countries including Canada, the United States, Europe, Australia, India, Malaysia, Sri Lanka, and more.',
  },
  {
    q: 'What are the prizes?',
    a: 'A total prize pool of up to SGD 20,000 will be given out. Full details will be announced soon.',
  },
  {
    q: 'How are DJs judged?',
    a: 'DJs are evaluated by a panel of experienced industry professionals, including established DJs and music curators. Judging is based on technical skill, music selection, transitions and flow, creativity, and live crowd engagement. This is not a popularity or social media-based contest.',
  },
  {
    q: 'Who can participate?',
    a: 'Participation is by application or invitation, subject to eligibility criteria set by the organisers. Full details will be announced soon.',
  },
  {
    q: 'What music genres are allowed?',
    a: 'This is primarily a Tamil DJ battle. The competition focuses on DJ performance quality, not a single genre. DJs are encouraged to showcase their strongest musical identity while respecting the event guidelines.',
  },
  {
    q: 'When will more details be released?',
    a: 'Details on competition format, judging criteria, and final DJ line-up will be announced closer to the event date via the official website and social channels.',
  },
];

const DEFAULT_CONTENT = {
  settings: {
    heroVideoUrl: '',
    heroPosterUrl: '',
    visionImageUrl: '',
    aboutMediaType: 'video',
    aboutMediaUrl: '',
    aboutPosterUrl: '',
    visionTitle: '',
    visionSubtitle: '',
    visionQuote: '',
    visionBody: '',
  },
  events: [],
  judges: [],
  sponsors: [],
  gallery: [],
  faq: [],
  results: {
    heading: '',
    subtitle: '',
    items: [],
  },
};

const SEED_EVENTS = [
  {
    id: 'mainsession-2026',
    title: 'Main Event – Night Circuit',
    slug: 'main-event-night-circuit',
    date: '2026-05-22',
    location: 'Hard Rock Cafe, Singapore',
    status: 'Active',
    mediaType: 'video',
    mediaUrl: 'https://cdn.coverr.co/videos/coverr-nightclub-neon-dj-performance-1578/1080p.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1522851457198-d820fd909c09?auto=format&fit=crop&q=80&w=1200',
    image: 'https://images.unsplash.com/photo-1522851457198-d820fd909c09?auto=format&fit=crop&q=80&w=1200',
    isMainEvent: true,
    description: 'The flagship mix battle, with DJs representing the global Tamil community.',
    price: 'SGD 20,000 prize pool',
  },
  {
    id: 'afterglow-qualifier',
    title: 'Afterglow Qualifier',
    slug: 'afterglow-qualifier',
    date: '2026-05-19',
    location: 'Singapore Arts Club',
    status: 'Upcoming',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1470229722913-7ea2d9863438?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1522851457198-d820fd909c09?auto=format&fit=crop&q=80&w=1200',
    image: 'https://images.unsplash.com/photo-1522851457198-d820fd909c09?auto=format&fit=crop&q=80&w=1200',
    isMainEvent: false,
    description: 'Qualify for the showcase with your most daring set.',
    price: 'Early bird: SGD 35',
  },
];

const SEED_JUDGES = [
  {
    id: 'judge-arya',
    name: 'Arya Patel',
    title: 'Global Selector',
    country: 'Singapore',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    quote: 'Precision, grit, and crowd chemistry.',
  },
  {
    id: 'judge-samar',
    name: 'Samar Iyer',
    title: 'Bass Architect',
    country: 'India',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=1200',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=1200',
    quote: 'The best mixes tell a story and honor the room.',
  },
];

const SEED_GALLERY = [
  {
    id: 'gallery-electric',
    type: 'video',
    url: 'https://cdn.coverr.co/videos/coverr-dancing-crowd-at-a-music-festival-5149/1080p.mp4',
    poster: 'https://images.unsplash.com/photo-1470229722913-7ea2d9863438?auto=format&fit=crop&q=80&w=1200',
    instagramUrl: 'https://instagram.com/mixmastersclub',
  },
  {
    id: 'gallery-light',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=1200',
    poster: '',
    instagramUrl: 'https://instagram.com/mixmastersclub',
  },
];

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FALLBACK_PROD_ORIGINS = [
  'https://mixmasters.club',
  'https://www.mixmasters.club',
];
const allowedOrigins = [
  CORS_ORIGIN,
  ...CORS_ORIGIN_LIST,
  ...(IS_PRODUCTION ? FALLBACK_PROD_ORIGINS : []),
].filter(Boolean);
const normalizeOrigin = (origin) => {
  if (!origin) return '';
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
};
const isDevTunnelOrigin = (origin) => {
  if (!origin || IS_PRODUCTION) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.devtunnels.ms');
  } catch {
    return false;
  }
};
const isMixMastersOrigin = (origin) => {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return false;
    return hostname === 'mixmasters.club' || hostname.endsWith('.mixmasters.club');
  } catch {
    return false;
  }
};
const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  const normalizedIncoming = normalizeOrigin(origin);
  const allowedMatch = allowedOrigins.some((allowed) => normalizeOrigin(allowed) === normalizedIncoming);
  return allowedMatch || isMixMastersOrigin(origin);
};

app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // Allow all in development/non-production, or if direct server-to-server (no origin), or localhost
      if (!IS_PRODUCTION || !incomingOrigin || incomingOrigin.includes('localhost') || incomingOrigin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      if (isAllowedOrigin(incomingOrigin) || isDevTunnelOrigin(incomingOrigin)) {
        return callback(null, true);
      }

      console.error(`CORS Blocked: ${incomingOrigin}`);
      callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Set request timeout to 5 minutes for large file uploads
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeAllowed = ALLOWED_UPLOAD_TYPES.has(file.mimetype);
    const extensionAllowed = ALLOWED_UPLOAD_EXTENSIONS.has(ext);
    if (!mimeAllowed && !extensionAllowed) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

const client = new MongoClient(MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
});

let contentCollection;
let registrationsCollection;

function sanitizeContent(payload) {
  return {
    settings: payload.settings && typeof payload.settings === 'object'
      ? {
        heroVideoUrl: payload.settings.heroVideoUrl || '',
        heroPosterUrl: payload.settings.heroPosterUrl || '',
        visionImageUrl: payload.settings.visionImageUrl || '',
        aboutMediaType: payload.settings.aboutMediaType === 'image' ? 'image' : 'video',
        aboutMediaUrl: payload.settings.aboutMediaUrl || '',
        aboutPosterUrl: payload.settings.aboutPosterUrl || '',
        visionTitle: payload.settings.visionTitle || '',
        visionSubtitle: payload.settings.visionSubtitle || '',
        visionQuote: payload.settings.visionQuote || '',
        visionBody: payload.settings.visionBody || '',
      }
      : { ...DEFAULT_CONTENT.settings },
    events: Array.isArray(payload.events) ? payload.events : [],
    judges: Array.isArray(payload.judges) ? payload.judges : [],
    sponsors: Array.isArray(payload.sponsors) ? payload.sponsors : [],
    gallery: Array.isArray(payload.gallery) ? payload.gallery : [],
    faq: Array.isArray(payload.faq) ? payload.faq : [],
    results: payload.results && typeof payload.results === 'object'
      ? {
        heading: payload.results.heading || '',
        subtitle: payload.results.subtitle || '',
        items: Array.isArray(payload.results.items) ? payload.results.items : [],
      }
      : { ...DEFAULT_CONTENT.results },
  };
}

async function ensureLocalStorageDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function ensureContentDoc() {
  const existing = await contentCollection.findOne({ _id: CONTENT_DOC_ID });
  if (existing) return false; // already exists, no seeding needed

  await contentCollection.insertOne({
    _id: CONTENT_DOC_ID,
    ...sanitizeContent(DEFAULT_CONTENT),
    _seeded: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return true; // freshly created, seeding is needed
}

async function ensureFaqSeed(isNewDoc) {
  // Only seed FAQ on first-time setup (fresh document)
  if (!isNewDoc) return;

  await contentCollection.updateOne(
    { _id: CONTENT_DOC_ID },
    {
      $set: {
        faq: FAQ_SEED,
        updatedAt: new Date(),
      },
    }
  );
}

async function ensureSeedData(isNewDoc) {
  // Only seed sample data on first-time setup (fresh document)
  if (!isNewDoc) return;

  await contentCollection.updateOne(
    { _id: CONTENT_DOC_ID },
    {
      $set: {
        events: SEED_EVENTS,
        judges: SEED_JUDGES,
        gallery: SEED_GALLERY,
        updatedAt: new Date(),
      },
    }
  );
}

async function readContent() {
  const doc = await contentCollection.findOne({ _id: CONTENT_DOC_ID });
  if (!doc) {
    return { ...DEFAULT_CONTENT };
  }
  return sanitizeContent(doc);
}

async function writeContent(data) {
  const safeData = sanitizeContent(data);
  await contentCollection.updateOne(
    { _id: CONTENT_DOC_ID },
    {
      $set: {
        ...safeData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

// Helper function to extract file paths from URLs that belong to our server
function extractServerFilePath(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Check if this is a local upload URL (contains /uploads/)
  if (url.includes('/uploads/')) {
    const match = url.match(/\/uploads\/(.+)$/);
    if (match && match[1]) {
      return path.join(UPLOADS_DIR, match[1]);
    }
  }
  return null;
}

// Helper function to safely delete a file from server storage
async function deleteServerFile(url) {
  const filePath = extractServerFilePath(url);
  if (!filePath) return; // Not a server file, skip
  
  try {
    await fs.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    // File might not exist or already deleted, log but don't throw
    console.warn(`Failed to delete file ${filePath}:`, error.message);
  }
}

// Helper function to extract all media URLs from an object
function extractMediaUrls(obj) {
  if (!obj || typeof obj !== 'object') return [];
  
  const urls = [];
  const mediaFields = [
    'mediaUrl', 'image', 'posterUrl', 
    'heroVideoUrl', 'heroPosterUrl', 'visionImageUrl', 
    'aboutMediaUrl', 'aboutPosterUrl',
    'demoFileUrl'
  ];
  
  for (const field of mediaFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      urls.push(obj[field]);
    }
  }
  
  return urls;
}

// Helper function to delete all media files associated with an object
async function deleteAssociatedMedia(obj) {
  const urls = extractMediaUrls(obj);
  await Promise.all(urls.map(url => deleteServerFile(url)));
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function makeId() {
  return crypto.randomUUID();
}

function getActiveEventById(eventId) {
  return readContent().then((content) => {
    const events = Array.isArray(content.events) ? content.events : [];
    return events.find(
      (item) =>
        String(item.id) === String(eventId)
        && String(item.status || '').toLowerCase() === 'active'
    ) || null;
  });
}

function sanitizeRegistrationPayload(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    role: source.role === 'patron' ? 'patron' : 'artist',
    eventId: source.eventId ? String(source.eventId) : '',
    fullName: source.fullName ? String(source.fullName).trim() : '',
    email: source.email ? String(source.email).trim() : '',
    nationality: source.nationality ? String(source.nationality).trim() : '',
    city: source.city ? String(source.city).trim() : '',
    age: source.age ? String(source.age).trim() : '',
    stageName: source.stageName ? String(source.stageName).trim() : '',
    instagram: source.instagram ? String(source.instagram).trim() : '',
    experience: source.experience ? String(source.experience).trim() : '',
    soundCloud: source.soundCloud ? String(source.soundCloud).trim() : '',
    cloudLink: source.cloudLink ? String(source.cloudLink).trim() : '',
    source: source.source ? String(source.source).trim() : 'website',
  };
}

async function sendEmail(options) {
  try {
    const response = await axios.post(
      MAIL_SERVICE_URL,
      {
        to: options.to,
        subject: options.subject,
        html: options.html,
      },
      {
        headers: {
          'x-api-key': MAIL_SERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw new Error('Could not send email');
  }
}

function buildParticipantHtml(registration) {
  const eventDisplayName = 'MixMasters Club – International Tamil DJ Battle';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmed - MixMasters Club</title>
    </head>
    <body style="background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; margin: 0; padding: 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #1a1a1a;">
        <tr>
          <td style="padding: 40px; text-align: center; border-bottom: 1px solid #1a1a1a;">
            <h1 style="color: #C5A059; font-size: 28px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">MixMasters Club</h1>
            <p style="color: #666; font-size: 10px; letter-spacing: 4px; margin-top: 10px; text-transform: uppercase;">International Tamil DJ Battle</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 20px;">Entry Confirmed, ${registration.fullName}.</h2>
            <p style="color: #aaaaaa; line-height: 1.6; margin-bottom: 30px;">
              Your application for the <strong>${eventDisplayName}</strong> has been received. Our council is currently reviewing your showcase.
            </p>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f0f0f; border: 1px solid #1a1a1a; margin-bottom: 30px;">
              <tr>
                <td style="padding: 20px;">
                  <p style="color: #C5A059; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Battle Details</p>
                  <p style="color: #ffffff; margin: 0; font-size: 14px;"><strong>Location:</strong> ${registration.eventLocation}</p>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${registration.eventDate}</p>
                </td>
              </tr>
            </table>

            <p style="color: #aaaaaa; line-height: 1.6; margin-bottom: 20px;">
              Direct any further enquiries to our Instagram DM or reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 40px; background-color: #000000; text-align: center; border-top: 1px solid #1a1a1a;">
            <p style="color: #444; font-size: 10px; letter-spacing: 1px; margin: 0;">&copy; 2026 Mix Masters Club - Singapore</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildAdminHtml(registration) {
  return `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="background-color: #f4f4f4; padding: 20px; font-family: sans-serif;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #111;">New Artist Registration</h2>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;"><strong>Event:</strong></td><td>${registration.eventTitle}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Artist Name:</strong></td><td>${registration.fullName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td>${registration.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Origin:</strong></td><td>${registration.city}, ${registration.nationality}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Experience:</strong></td><td>${registration.experience} Years</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Instagram:</strong></td><td>${registration.instagram}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Showcase:</strong></td><td>${registration.soundCloud || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Cloud Link:</strong></td><td>${registration.cloudLink || 'N/A'}</td></tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">Submitted at: ${registration.createdAt}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendRegistrationEmail(registration) {
  try {
    // 1. Send confirmation to participant
    await sendEmail({
      to: registration.email,
      subject: `[MixMasters Club – International Tamil DJ Battle] Entry Confirmed - ${registration.eventTitle}`,
      html: buildParticipantHtml(registration),
    });

    // 2. Send notification to admins
    for (const adminEmail of ADMIN_EMAILS) {
      await sendEmail({
        to: adminEmail,
        subject: `[NEW REGISTRATION] ${registration.fullName} - MixMasters Club – International Tamil DJ Battle`,
        html: buildAdminHtml(registration),
      });
    }

    return { sent: true };
  } catch (error) {
    console.error('Registration email failed:', error.message);
    return { sent: false, reason: 'mail_service_error' };
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mix_masters_backend',
    storage: {
      db: 'mongodb',
      media: 'local-filesystem',
      uploadsDir: '/uploads',
    },
    date: new Date().toISOString(),
  });
});

app.get('/api/public/main-event', async (_req, res) => {
  const content = await readContent();
  const events = Array.isArray(content.events) ? content.events : [];
  const mainEvent = events.find((item) => item.isMainEvent) || events[0] || null;

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.json({
    mainEvent,
    updatedAt: new Date().toISOString(),
  });
});

app.get('/api/public/content', async (_req, res) => {
  const content = await readContent();
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  res.json(content);
});

app.post('/api/public/registrations', async (req, res) => {
  const payload = sanitizeRegistrationPayload(req.body);
  if (!payload.eventId) {
    return res.status(400).json({ message: 'eventId is required' });
  }
  if (!payload.fullName || !payload.email) {
    return res.status(400).json({ message: 'fullName and email are required' });
  }
  if (!payload.cloudLink) {
    return res.status(400).json({ message: 'cloudLink is required' });
  }

  const activeEvent = await getActiveEventById(payload.eventId);
  if (!activeEvent) {
    return res.status(400).json({ message: 'Selected event is not active' });
  }

  // Prevent duplicate registration (same email + same event)
  const existing = await registrationsCollection.findOne({
    email: payload.email.toLowerCase(),
    eventId: payload.eventId,
  });
  if (existing) {
    return res.status(409).json({
      message: 'You have already registered for this event.',
      registrationId: existing.id,
    });
  }

  const registration = {
    id: makeId(),
    ...payload,
    email: payload.email.toLowerCase(),
    eventTitle: activeEvent.title || '',
    eventDate: activeEvent.date || '',
    eventLocation: activeEvent.location || '',
    eventStatus: activeEvent.status || '',
    createdAt: new Date().toISOString(),
  };

  await registrationsCollection.insertOne(registration);
  const mail = await sendRegistrationEmail(registration);
  return res.status(201).json({
    message: 'Registration submitted',
    registrationId: registration.id,
    emailSent: mail.sent,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ message: 'ADMIN_PASSWORD is not configured' });
  }

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token });
});

app.get('/api/content', authRequired, async (_req, res) => {
  const content = await readContent();
  res.json(content);
});

app.put('/api/content', authRequired, async (req, res) => {
  const payload = req.body || {};
  const oldContent = await readContent();
  
  // Check if settings media URLs are being replaced and delete old files
  if (payload.settings && oldContent.settings) {
    const settingsMediaFields = [
      'heroVideoUrl', 'heroPosterUrl', 'visionImageUrl', 
      'aboutMediaUrl', 'aboutPosterUrl'
    ];
    
    for (const field of settingsMediaFields) {
      const oldUrl = oldContent.settings[field];
      const newUrl = payload.settings[field];
      if (newUrl && oldUrl && newUrl !== oldUrl) {
        // New URL is different from old URL, delete old file
        await deleteServerFile(oldUrl);
      }
    }
  }
  
  const nextData = sanitizeContent(payload);
  await writeContent(nextData);
  res.json({ message: 'Content updated', content: nextData });
});

app.get('/api/results', authRequired, async (_req, res) => {
  const content = await readContent();
  return res.json(content.results || { heading: '', subtitle: '', items: [] });
});

app.put('/api/results', authRequired, async (req, res) => {
  const content = await readContent();
  const next = req.body && typeof req.body === 'object' ? req.body : { heading: '', subtitle: '', items: [] };
  content.results = {
    heading: next.heading || '',
    subtitle: next.subtitle || '',
    items: Array.isArray(next.items) ? next.items : [],
  };
  await writeContent(content);
  return res.json(content.results);
});

app.post('/api/upload', authRequired, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `/uploads/${req.file.filename}`;
  const baseUrl = PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return res.status(201).json({
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: relativePath,
    url: `${baseUrl}${relativePath}`,
  });
});

app.get('/api/registrations', authRequired, async (_req, res) => {
  const list = await registrationsCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return res.json(list);
});

app.delete('/api/registrations/:id', authRequired, async (req, res) => {
  // First, find the registration to get the media URL
  const registration = await registrationsCollection.findOne({ id: String(req.params.id) });
  
  if (!registration) {
    return res.status(404).json({ message: 'Registration not found' });
  }
  
  // Delete the registration from database
  const result = await registrationsCollection.deleteOne({ id: String(req.params.id) });
  
  if (result.deletedCount) {
    // Delete associated media files from server storage
    await deleteAssociatedMedia(registration);
  }
  
  return res.status(204).send();
});

app.get('/api/:resource', authRequired, async (req, res) => {
  const { resource } = req.params;
  if (!RESOURCE_KEYS.has(resource)) {
    return res.status(404).json({ message: 'Unknown resource' });
  }

  const content = await readContent();
  return res.json(content[resource] || []);
});

app.post('/api/:resource', authRequired, async (req, res) => {
  const { resource } = req.params;
  if (!RESOURCE_KEYS.has(resource)) {
    return res.status(404).json({ message: 'Unknown resource' });
  }

  const content = await readContent();
  const record = { id: makeId(), ...(req.body || {}) };
  content[resource] = [...(content[resource] || []), record];
  await writeContent(content);
  return res.status(201).json(record);
});

app.put('/api/:resource/:id', authRequired, async (req, res) => {
  const { resource, id } = req.params;
  if (!RESOURCE_KEYS.has(resource)) {
    return res.status(404).json({ message: 'Unknown resource' });
  }

  const content = await readContent();
  const list = content[resource] || [];
  const index = list.findIndex((item) => String(item.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ message: 'Record not found' });
  }

  const oldItem = list[index];
  const newItem = req.body || {};
  
  // Check if any media URLs are being replaced and delete old files
  const mediaFields = ['mediaUrl', 'image', 'posterUrl'];
  for (const field of mediaFields) {
    if (newItem[field] && oldItem[field] && newItem[field] !== oldItem[field]) {
      // New URL is different from old URL, delete old file
      await deleteServerFile(oldItem[field]);
    }
  }

  const updated = { ...oldItem, ...newItem, id: oldItem.id };
  list[index] = updated;
  content[resource] = list;
  await writeContent(content);
  return res.json(updated);
});

app.delete('/api/:resource/:id', authRequired, async (req, res) => {
  const { resource, id } = req.params;
  if (!RESOURCE_KEYS.has(resource)) {
    return res.status(404).json({ message: 'Unknown resource' });
  }

  const content = await readContent();
  const list = content[resource] || [];
  const itemToDelete = list.find((item) => String(item.id) === String(id));
  const next = list.filter((item) => String(item.id) !== String(id));

  if (next.length === list.length) {
    return res.status(404).json({ message: 'Record not found' });
  }

  // Delete associated media files from server storage
  if (itemToDelete) {
    await deleteAssociatedMedia(itemToDelete);
  }

  content[resource] = next;
  await writeContent(content);
  return res.status(204).send();
});

app.use((err, _req, res, next) => {
  void next;
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

if (!MONGO_URI) {
  throw new Error('MONGO_URI is required. Set it in backend/.env');
}

await ensureLocalStorageDir();
await client.connect();
const db = client.db(MONGO_DB_NAME);
contentCollection = db.collection('content');
registrationsCollection = db.collection('registrations');
const isNewDoc = await ensureContentDoc();
await ensureFaqSeed(isNewDoc);
await ensureSeedData(isNewDoc);

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`MongoDB connected: ${MONGO_DB_NAME}`);
});

// Set server timeout to 5 minutes for large file uploads
server.setTimeout(300000); // 5 minutes
server.keepAliveTimeout = 300000;
