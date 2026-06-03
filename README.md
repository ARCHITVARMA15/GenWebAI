# GenWeb.ai — AI-Powered Website Builder

**GenWeb.ai** is a full-stack SaaS platform that generates complete, branded websites from a single text prompt. It features Vision AI cloning, RAG-powered chat widgets, Brand Kit generation, GitHub portfolio generation, and a statistical A/B testing engine — built on the MERN stack with Razorpay payments.

🌐 **Live:** [gen-web-ai-one.vercel.app](https://gen-web-ai-one.vercel.app)

---

## ✨ Features

### Core
- **Prompt → Website** — Describe your idea in one sentence. AI generates a fully branded, deployable HTML/CSS/JS website with logo, colors, copy, and all.
- **Live Editor** — Chat-based editor to modify any generated site. Changes stream in real-time in a live preview.
- **One-Click Deploy** — Publish any site to a shareable public URL instantly.
- **Live Gallery** — Browse all publicly deployed sites from the community.

### Brand Kit (Brand Mode)
- Enter a business description and AI generates a complete brand identity: SVG logo, color palette, typography pair, tagline, and a full branded website — all in one shot.

### Vision Clone
- Paste any website URL or upload a screenshot. AI clones the layout, color scheme, and structure into a new editable site.

### GitHub Portfolio Generator
- Drop a GitHub profile URL, add your name and LinkedIn bio. AI fetches your repos, detects skills from languages, and generates a premium developer portfolio — no writing required. Supports certification URLs and profile image uploads.

### AI Chat Widget
- Every generated site gets an embedded RAG-powered chat widget. Visitors can ask questions about the site and get accurate answers grounded in the site's content (Voyage AI embeddings + Groq LLM).

### A/B Testing Engine
- Automatically generates a Variant B for any site section using GPT-4o. Tracks visits and clicks per variant. Calculates statistical confidence (Z-test). Nightly cron auto-declares a winner at ≥80% confidence with ≥100 visitors.

### Analytics
- Per-site visit and click tracking. Experiment dashboards with live CVR data.

### Payments & Credits
- Credit-based system. Buy credits via Razorpay (INR). Credits never expire. Each website generation costs ~25 credits.

---

## 🛠️ Tech Stack

### Frontend (`/client/web`)
| Layer | Tech |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion (`motion/react`) |
| State | Redux Toolkit |
| Routing | React Router v6 |
| Auth | Firebase (Google OAuth) |
| HTTP | Axios |

### Backend (`/server`)
| Layer | Tech |
|---|---|
| Runtime | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| AI — Generation | OpenRouter (GPT-4o, Claude, Llama) |
| AI — Chat/RAG | Groq (Llama-3.3-70b) + Voyage AI (embeddings) |
| Storage | Cloudinary |
| Screenshots | Puppeteer |
| Auth | JWT (httpOnly cookies) + Firebase Admin |
| Payments | Razorpay |
| Rate Limiting | express-rate-limit |
| Security | Helmet |
| Cron | node-cron |

### Deployment
| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Database | MongoDB Atlas |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)
- API keys: OpenRouter, Groq, Voyage AI, Cloudinary, Razorpay, Firebase

### 1. Clone
```bash
git clone https://github.com/ARCHITVARMA15/GenWebAI.git
cd GenWebAI
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```
Server starts on `http://localhost:5000`.

#### Backend `.env` variables
```env
PORT=5000
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mydb
JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173        # For CORS
BACKEND_URL=http://localhost:5000         # Injected into generated site tracking scripts

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...
VOYAGE_API_KEY=pa-...

# Payments
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=

NODE_ENV=development
```

### 3. Frontend
```bash
cd client/web
npm install
```

Create `client/web/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

```bash
npm run dev
```
Frontend starts on `http://localhost:5173`.

### 4. Open the app
Navigate to `http://localhost:5173`. Sign in with Google and start generating.

---

## ☁️ Production Deployment

### Backend → Railway
1. Connect your GitHub repo to Railway.
2. Set **Root Directory** to `server`.
3. Set these environment variables in Railway:
   - All variables from `.env.example`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-domain.vercel.app`
   - `BACKEND_URL=https://your-railway-domain.up.railway.app`
4. Railway auto-deploys on every push to `main`.

### Frontend → Vercel
1. Connect your GitHub repo to Vercel.
2. Set **Root Directory** to `client/web`.
3. Set these environment variables in Vercel:
   - `VITE_SERVER_URL=https://your-railway-domain.up.railway.app` *(must include `https://`)*
   - `VITE_FIREBASE_API_KEY=your_firebase_api_key`
4. Vercel auto-deploys on every push to `main`.

> **Important:** `VITE_SERVER_URL` must include the full `https://` prefix, otherwise requests will be treated as relative paths and fail with 404.

---

## 📁 Project Structure

```
GenWebAI/
├── client/
│   └── web/                  # React + Vite frontend
│       ├── src/
│       │   ├── pages/        # Home, Dashboard, Generate, Editor, Pricing, Gallery, Portfolio
│       │   ├── components/   # LoginModal, BrandKitGenerator, CloneWebsite, ShapeGrid, ...
│       │   ├── hooks/        # useGetCurrentUser, ...
│       │   ├── redux/        # userSlice, store
│       │   └── config.js     # serverUrl config
│       └── vercel.json       # SPA rewrite rules
└── server/                   # Express backend
    ├── controllers/          # auth, user, website, analytics, brand, clone, portfolio, ...
    ├── routes/               # All API route definitions
    ├── models/               # Mongoose schemas (User, Website, Experiment, ...)
    ├── services/             # brandKitService, embeddingService, chatService, abTestingService
    ├── middlewares/          # isAuth, rateLimiter
    ├── jobs/                 # experimentCron (nightly A/B evaluator)
    ├── config/               # db, openRouter, aiModels
    └── index.js              # Entry point
```

---

## 📄 License
Proprietary. All rights reserved.
