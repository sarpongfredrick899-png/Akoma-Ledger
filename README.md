# The Akoma Ledger

Voice-automated income statement for entrepreneurs. Capture transactions naturally using AI to eliminate manual entry friction.

## Features

- **Voice AI Financial Parsing:** Simply speak your transactions, and the AI parses them into structured ledger entries.
- **Income Statement Automation:** Real-time generation of your financial statements.
- **Analytics & Dashboard:** Visual representations of profit and trending analytics.
- **Smart Notifications:** Intelligent matching and deductions insights.

## Development

This application is built with React, Vite, Tailwind CSS, and Google Gemini AI.

### Prerequisites

- Node.js 18.0.0 or higher
- npm (Node Package Manager)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-dirname>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy the `.env.example` file to `.env` or `.env.local`:
     ```bash
     cp .env.example .env
     ```
   - Add your `GEMINI_API_KEY` in the `.env` file.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

## Deployment

This app is optimized for seamless deployment to **Vercel**.

1. Import the repository into your Vercel dashboard.
2. In the project settings, configure your Environment Variables (specifically `GEMINI_API_KEY`).
3. Vercel will automatically detect the Vite build settings (`npm run build` and the `dist` output directory).
4. The included `vercel.json` setup automatically handles client-side routing fallback.

### Manual Vercel Deployment

You can also deploy directly using the Vercel CLI:
```bash
npm i -g vercel
vercel
```

## Tools & Libraries Used

- React 19
- Vite
- Tailwind CSS 4
- Google Gen AI SDK
- Recharts
- Framer Motion
- Lucide React

## License

MIT
