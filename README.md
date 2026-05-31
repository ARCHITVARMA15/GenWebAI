# GenWeb.ai - AI-Powered Website Builder

**GenWeb.ai** is a premium, full-stack SaaS platform that allows users to instantly generate fully branded, production-ready websites using simple text prompts. Leveraging advanced LLMs and a stunning web interface, GenWeb.ai turns thoughts into deployable live code.

![GenWeb.ai](https://via.placeholder.com/1200x600?text=GenWeb.ai+Cinematic+Landing+Page)

## ✨ Key Features

*   **Cinematic Landing Experience:** A breathtaking, high-conversion landing page featuring a full-screen, 3D rotating geometry backdrop with a complex staggered "hero-reveal" animation lifecycle.
*   **Prompt to Website:** Users input a single sentence, and the AI handles the design, copywriting, color palette, and generation of HTML/CSS/JS.
*   **Live Preview & Editor:** An interactive browser-mockup environment internally rendering the generated website logic in real-time.
*   **Vision Clone (Brand Kit):** Automatically extract layout, styling, and color profiles via screenshot analysis and image embeddings.
*   **Authentication:** Full user sign-up, sign-in, and auth-state preservation (powered by JWT & Firebase).
*   **Credit System & Payments:** Included credit deduction system and top-up functionality handled securely via Razorpay integrations.
*   **A/B Testing & Live Gallery:** Compare designs and explore community-generated layouts.

## 🛠️ Tech Stack

### Frontend (`/client/web`)
*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS + Custom CSS (for deep glassmorphism and cinematic animations)
*   **Animations:** `framer-motion` (complex orchestration, staggered reveals)
*   **State Management:** Redux Toolkit 
*   **Routing:** React Router v6

### Backend (`/server`)
*   **Environment:** Node.js + Express
*   **Database:** MongoDB (Mongoose)
*   **AI Integration:** OpenRouter, Groq, Voyage AI (for embeddings and code generation)
*   **Cloud Storage:** Cloudinary (for storing generated assets/thumbnails)
*   **Headless Browser Engine:** Puppeteer (for generating website screenshots)
*   **Payments:** Razorpay API

---

## 🚀 Local Setup Instructions

Follow these step-by-step instructions to get the development server running locally on your laptop.

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v16.0 or higher)
*   [MongoDB](https://www.mongodb.com/) (Local installation or a free Atlas cluster)
*   API keys for AI providers (OpenRouter/Groq), Razorpay, and Cloudinary.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/genweb-ai.git
cd genweb-ai
```

### 2. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   * Copy the `.env.example` file to create a new `.env` file:
     ```bash
     cp .env.example .env
     ```
   * Open the new `.env` file and fill in your actual API keys, MongoDB URL, and backend secrets.
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   > The server will start on `http://localhost:5000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd client/web
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   * Copy the `.env.example` file to create a new `.env` file:
     ```bash
     cp .env.example .env
     ```
   * Open the `.env` file and ensure `VITE_SERVER_URL` points to your backend (`http://localhost:5000`). Include any required frontend API keys (like Firebase and Razorpay).
4. Start the frontend Vite server:
   ```bash
   npm run dev
   ```
   > The frontend application will start up (typically on `http://localhost:5174`).

### 4. You're Good to Go!
Open your browser and navigate to the frontend URL to start building websites with AI!

---

## 🎨 UI/UX Architecture

The design language of GenWeb.ai focuses on a "Premium Web3 / NextGen Tech" aesthetic:
*   **Typography:** Strict sans-serif hierarchies (Inter).
*   **Color Palette:** Deep void blacks juxtaposed against neon cyan (`#2ae0ff`), pulsing violet (`#8c52ff`), and hot pink (`#ff4de4`) accents.
*   **Depth:** Extensive use of CSS inset box-shadows, radial lighting/glow orbs, and dark vignettes to preserve focal points.
*   **Micro-interactions:** Interactive gradients (`gradient-text`), particle drifts, and seamless fade-looping on the underlying 3D video.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is proprietary. All rights reserved.
