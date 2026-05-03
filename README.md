<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=for-the-badge&logo=meta&logoColor=white" alt="Groq LLaMA" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<h1 align="center">🧬 DecodeX</h1>

<h3 align="center"><em>Decode Your Exam. Dominate It.</em></h3>

<p align="center">
  DecodeX is an AI-powered exam preparation tool that transforms past question papers into <strong>strategic study insights</strong>. Upload your PDFs, paste your syllabus, and get instant topic analysis, frequency heatmaps, gap detection, and a personalized 7-day study plan — all powered by <strong>Groq's LLaMA 3.3 70B</strong>.
</p>

<p align="center">
  <a href="https://decodex-eta.vercel.app"><strong>🌐 Live Demo →</strong></a>
</p>

---

## 📹 Demo Video

https://github.com/user-attachments/assets/07f653fc-1a90-4983-86e2-d8a040cfc73c

---

## 🎯 Problem Statement

Students preparing for exams often study blindly — spending equal time on every topic without knowing which ones are most frequently tested. Manually analyzing years of past papers is tedious and error-prone.

**DecodeX solves this** by using AI to:
- Extract and analyze question patterns across multiple years of past papers
- Rank topics by predicted exam weight and historical frequency
- Detect syllabus gaps — topics you haven't seen that could appear as surprises
- Generate a ready-to-use, prioritized study schedule

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📤 **Drag & Drop Upload** | Upload up to 5 PDF past papers with instant validation and file size display |
| 🔥 **Topic Frequency Heatmap** | Interactive Year × Topic matrix showing exactly where each topic appeared across exam years |
| 🎯 **High-Yield Topic Ranking** | AI-ranked table with importance scores, frequency counts, syllabus match badges, and year spans |
| 📊 **Visual Analytics Dashboard** | Bar charts, radar plots, and donut charts for topic distribution, difficulty levels, and category breakdowns |
| 🕵️ **Syllabus Gap Detection** | Identifies topics in your syllabus that have never been asked — potential exam surprises |
| 📅 **7-Day Smart Study Planner** | Auto-generated day-by-day schedule based on topic priority, with completion tracking and export |
| 💡 **Practice Question Suggestions** | AI-recommended focus areas for your highest-priority topics |
| ⚡ **Real-time Processing UI** | Step-by-step progress animation with motivational quotes while your papers are being analyzed |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **AI / LLM** | [Groq](https://groq.com/) — LLaMA 3.3 70B Versatile |
| **PDF Parsing** | [pdf.js](https://mozilla.github.io/pdf.js/) (client-side text extraction) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with custom design tokens |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts** | [Recharts](https://recharts.org/) (Bar, Radar, Pie, Heatmap) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  Upload UI   │──▶│  pdf.js       │──▶│  Session Store   │  │
│  │  (Dropzone)  │   │  (Extract)    │   │  (sessionStorage)│  │
│  └─────────────┘   └──────────────┘   └────────┬────────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼────────┐  │
│  │              Analysis Dashboard                       │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌─────────────┐  │  │
│  │  │ Heatmap │ │ Bar Chart│ │ Radar │ │ Study Planner│  │  │
│  │  └─────────┘ └──────────┘ └───────┘ └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ POST /api/analyze
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js API Route)              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/analyze                                         │   │
│  │  • Receives extracted text + syllabus + subject       │   │
│  │  • Sends structured prompt to Groq API                │   │
│  │  • Returns JSON: topics, rankings, gaps, study plan   │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │   Groq Cloud API       │                      │
│              │   LLaMA 3.3 70B       │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
decodex/
├── app/
│   ├── page.tsx                 # Landing page with hero, features & demo sections
│   ├── layout.tsx               # Root layout with fonts, footer & scroll progress
│   ├── globals.css              # Global styles & design tokens
│   ├── analysis/
│   │   └── page.tsx             # Analysis processing page with loading animations
│   └── api/
│       └── analyze/
│           └── route.ts         # Groq LLM API endpoint
├── components/
│   ├── AnalysisDashboard.tsx    # Full analysis results dashboard (charts, tables, heatmap)
│   ├── AnimatedCounter.tsx      # Animated number counter component
│   ├── BackToTop.tsx            # Scroll-to-top floating button
│   ├── GlassCard.tsx            # Glassmorphism card wrapper
│   ├── ScrollProgress.tsx       # Top scroll progress indicator
│   ├── SkeletonLoader.tsx       # Loading skeleton component
│   └── TopicBadge.tsx           # High/Medium/Low badge with color coding
├── hooks/
│   └── useAnalysis.ts           # Shared state hook for upload form
├── lib/
│   └── extractPdf.ts            # Client-side PDF text extraction using pdf.js
├── public/                      # Static assets
├── tailwind.config.ts           # Custom theme tokens (amber, teal, coral, obsidian)
├── next.config.mjs              # Next.js configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **yarn**
- A **Groq API Key** ([Get one free →](https://console.groq.com/keys))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/silverfang7x/Decodex.git
cd Decodex

# 2. Install dependencies
npm install

# 3. Set up environment variables
#    Create a .env.local file in the root directory:
echo "GROQ_API_KEY=your_groq_api_key_here" > .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | API key from [Groq Console](https://console.groq.com/keys) | ✅ Yes |

---

## 📖 How It Works

1. **Upload** — Drag and drop up to 5 past exam papers (PDF format)
2. **Configure** — Paste your syllabus topics, enter the subject name, and select the year range
3. **Analyze** — Click "Analyze Papers" — DecodeX extracts text client-side using pdf.js, then sends it to the Groq LLaMA 3.3 70B model
4. **Insights** — View your personalized dashboard with:
   - 📊 Topic ranking table with importance scores and syllabus match
   - 🔥 Year × Topic frequency heatmap
   - 📈 Bar chart, radar plot, and pie chart visualizations
   - ⚠️ Syllabus gap warnings
   - 📅 Downloadable 7-day study plan with progress tracking

---

## 🌐 Deployment

The project is deployed on **Vercel** and available at:

🔗 **[https://decodex-eta.vercel.app](https://decodex-eta.vercel.app)**

To deploy your own instance:

```bash
npm install -g vercel
vercel --prod
```

> Make sure to add `GROQ_API_KEY` in your Vercel project's Environment Variables settings.

---

## 🎨 Design Philosophy

DecodeX uses a **dark, premium aesthetic** built around:

- **Custom color palette** — Amber (`#F5A623`), Teal (`#00D4B4`), Coral (`#FF6B6B`), Purple (`#8B5CF6`) on an obsidian dark background
- **Glassmorphism cards** — Semi-transparent surfaces with backdrop blur
- **Typography** — Syne (headings) + Plus Jakarta Sans (body) for a modern, technical feel
- **Micro-animations** — Framer Motion staggered reveals, animated counters, particle grid background, and orbital loading spinners
- **Responsive design** — Fully functional from mobile to desktop

---

## 👥 Team

Built at **AI DecodeX Hackathon 2025**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>⭐ If you found this useful, give the repo a star!</strong>
</p>
