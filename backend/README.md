# Mix Masters Backend

Express backend for admin content management and media uploads.

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start server:

```bash
npm run dev
```

Server runs at `http://localhost:4000` by default.

## Auth

- `POST /api/auth/login`
- body: `{ "password": "..." }`
- returns `{ token }` (JWT)

Use header:

```http
Authorization: Bearer <token>
```

## API

- `GET /api/health`
- `GET /api/content` (auth)
- `PUT /api/content` (auth)
- `GET /api/:resource` (auth)
- `POST /api/:resource` (auth)
- `PUT /api/:resource/:id` (auth)
- `DELETE /api/:resource/:id` (auth)
- `GET /api/results` (auth)
- `PUT /api/results` (auth)
- `POST /api/upload` (auth, multipart field name: `media`)
- `GET /api/public/main-event` (public, Cloudflare/Vercel friendly cache headers)
- `GET /api/public/content` (public site content for frontend rendering)
- `POST /api/public/registrations` (public, saves registration for active event and attempts email notification)
- `GET /api/registrations` (auth, admin registrations list)
- `DELETE /api/registrations/:id` (auth, delete registration)

Supported `:resource` values:
- `events`
- `judges`
- `sponsors`
- `gallery`
- `faq`
- `formats`

## Storage

- Content metadata: MongoDB (`content` collection, single document model)
- No JSON/file fallback for content (real mode only)
- Uploads: `backend/uploads/`
- Uploaded files are served from `/uploads/<filename>`
- Media binaries are never stored in MongoDB (saves Atlas 500MB quota)
- Upload type support: `mp4`, `webm`, `mov`, `jpg`, `png`, `webp`, `avif`
- Upload size limit: `80MB`

## Registration Email

Set env values for email notifications:

- `REGISTRATION_EMAIL_TO` (default: `aathishpirate@gmail.com`)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional sender address)

If SMTP is not configured, backend still saves registrations and will try local sendmail if available.
