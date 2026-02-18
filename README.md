# DT Speed Calculator — 28-Day Period Planner

## 1. Plan (Bullets)

- Single-page Next.js 15 app with TypeScript + Tailwind CSS
- Mobile-first dark UI with large touch targets and monospace number display
- All calculation done client-side in real-time (no backend)
- Time parsing: mm:ss → total seconds internally, display rounded back to mm:ss
- Formula: `requiredRemaining = (goal × 28 − currentAvg × daysDone) / daysLeft`
- Edge cases handled: Day 1 (no history), period complete, ahead of goal, negative result
- Inputs persisted to localStorage so they survive page refresh
- Color-coded result cards: green (on/ahead), amber (slightly behind), red (significantly behind)
- Zero external libraries beyond Next.js + React + Tailwind

## 2. File Tree

```
dt-speed-calculator/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── src/
    └── app/
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

## 3. Run Instructions

```bash
# 1. Clone or copy the project folder
cd dt-speed-calculator

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# → http://localhost:3000
```

## 4. Production Build

```bash
npm run build
npm start
# Runs on http://localhost:3000
```

## 5. Vercel Deploy Steps

1. Push the `dt-speed-calculator` folder to a GitHub/GitLab repo
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Import your repository
4. Vercel auto-detects Next.js — no config needed
5. Click **Deploy**
6. Your app is live at `https://your-project.vercel.app`

**Or deploy via CLI:**
```bash
npm i -g vercel
cd dt-speed-calculator
vercel
# Follow prompts → deployed in ~60 seconds
```

## 6. How to Use (for Store Managers)

### What This Tool Does
This tells you the **average Drive Thru speed you must run from today forward** to end the 28-day period at your goal.

### Step-by-Step

1. **Set your goal** — It defaults to 3:45. Tap the Goal field to change it (type as minutes:seconds, like `3:30`).

2. **Enter your day of the period** — If today is Day 10 of your 28-day period, type `10`. The app shows you Week 2, Day 3 and how many days are left.

3. **Enter your current period average** — This is the average DT time your store has run so far this period. Type it as minutes:seconds (like `4:05`).

4. **Read your result** — The big number is the speed you need to average from today through Day 28 to hit your goal.

### What the Colors Mean
- **Green** = You're on track or ahead. Keep doing what you're doing.
- **Yellow/Amber** = You're slightly behind. You'll need to run a bit faster than goal.
- **Red** = You're significantly behind. The remaining days will need a strong push.

### Tips
- Check this at the start of each shift to know your target.
- If it says "Ahead of Goal" — great! Don't let up, but know you have a cushion.
- The "Reset" button at the bottom clears everything back to defaults.
- Your inputs are saved automatically — if you close and reopen, they'll still be there.
