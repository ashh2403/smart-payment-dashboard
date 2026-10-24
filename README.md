# Smart Digital Payment Transaction Analytics and Monitoring Dashboard

**PayPulse** — a fintech-style web dashboard to analyze and monitor digital payment transactions
(UPI, Cards, Digital Wallets, Online Banking).

| | |
|---|---|
| Course | Professional Training I — B.E. Computer Science and Engineering |
| Institution | Sathyabama Institute of Science and Technology, Chennai |
| Project students | S. Lajithan (44110407), M. Larun Nishan (44110412) |
| Guide | Dr. S. Pothumani, M.E., Ph.D., Associate Professor, CSE |

Data is stored in **Supabase** (PostgreSQL + login). Each user sees only their own transactions,
loaded from CSV exports (bank statements, Razorpay / Paytm / PhonePe Business) or added manually.
Alerts are rule-based prompts for review, not a fraud verdict.

---

## 1. Requirements

- **Node.js 18 or newer** (download from https://nodejs.org — the LTS version)
- **VS Code** (recommended)

Check your Node install:

```bash
node -v
npm -v
```

## 2. Run the project in VS Code

1. Unzip `smart-payment-dashboard.zip`.
2. In VS Code: **File → Open Folder…** → choose the `smart-payment-dashboard` folder.
3. Open the terminal: **Terminal → New Terminal** (or <kbd>Ctrl</kbd>+<kbd>`</kbd>).
4. Install packages (first time only, needs internet):

   ```bash
   npm install
   ```

5. Set up Supabase (first time only — free account):
   1. Create a project at https://supabase.com.
   2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
   3. Copy `.env.example` to `.env.local` and paste the **Project URL** and **anon public** key
      from **Project Settings → API**. (Never use the `service_role` key in this app.)
   4. Optional, for quick testing: **Authentication → Sign In / Providers → Email** → turn off
      *Confirm email* so new accounts can sign in immediately.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open **http://localhost:5173**, click **Get started**, create an account, then go to **Import Data**
   and upload a CSV (use **CSV template** on that page to see the expected columns).

Stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal.

### Other commands

```bash
npm run build     # type-check + production build into /dist
npm run preview   # serve the production build locally
```

## 3. Pages

| Route | Page | What it does |
|---|---|---|
| `/` | Landing | Hero with live preview, features, objectives, modules, tech stack, team, contact |
| `/dashboard` | Dashboard | 6 KPIs, daily & monthly trends, success vs failed, method distribution, status overview, recent activity |
| `/transactions` | Transactions | Search by ID, filter by method/status/date, sortable columns, pagination, details modal, CSV export |
| `/analytics` | Analytics | Volume & value trends, moving average, method performance, success/failure rates, period comparison, hourly & weekday analysis |
| `/login` | Login | Sign in, create account, password reset (Supabase Auth) |
| `/monitoring` | Monitoring & Alerts | Rule-based alerts with severity, status (saved to the database), filters, investigation view; failed-transaction log & reasons |
| `/reports` | Reports | Summary by status / method / month, date-range filter, summary & detailed CSV, printable layout |
| `/import` | Import Data | CSV upload with automatic column matching and preview, manual entry form, delete all data |
| `/settings` | Settings | Profile, password change, dashboard preferences, data-pipeline (processing) status |
| `/about` | About | Abstract, introduction, objectives, architecture, modules, results, conclusion, team |

The **date-range and payment-method filter is shared**: change it on any page and every KPI, chart and table updates consistently.

## 4. Project modules → code

| Module | File(s) |
|---|---|
| 1. Data Collection | `src/utils/csvImport.ts` (CSV parsing + column matching), `src/pages/Import.tsx`, `src/services/transactionService.ts` (Supabase) |
| 2. Data Processing | `src/services/dataProcessing.ts` — validates, de-duplicates and cleans records (rejects invalid ones) |
| 3. Transaction Analytics | `src/utils/analytics.ts` — KPIs, trends, method/status breakdowns, comparisons |
| 4. Monitoring & Alert | `src/utils/alertEngine.ts` — predefined rules (high value, rapid repeat, repeated failures, unusual hour) |
| 5. Dashboard & Reporting | `src/pages/*`, `src/components/*`, `src/utils/csv.ts` |

## 5. Folder structure

```
smart-payment-dashboard/
├── index.html
├── package.json
├── vite.config.ts · tsconfig.json · tailwind.config.js · postcss.config.js
├── public/favicon.svg
└── src/
    ├── main.tsx                # app entry (router + providers)
    ├── App.tsx                 # routes
    ├── index.css               # Tailwind + component classes + print styles
    ├── types/index.ts          # domain types
    ├── lib/supabase.ts         # Supabase client (reads .env.local)
    ├── data/projectInfo.ts     # abstract, objectives, modules, team
    ├── services/
    │   ├── transactionService.ts  # data-access layer (Supabase queries)
    │   └── dataProcessing.ts      # Data Processing module
    ├── utils/
    │   ├── analytics.ts        # Analytics module
    │   ├── alertEngine.ts      # Monitoring & Alert module
    │   ├── csvImport.ts        # CSV parsing, column matching, value normalising
    │   ├── csv.ts · format.ts · storage.ts · constants.ts
    ├── context/
    │   ├── AuthContext.tsx     # login session + profile
    │   ├── AppDataContext.tsx  # shared data, filters, preferences, alert status
    │   └── ToastContext.tsx
    ├── components/
    │   ├── auth/               # RequireAuth, SetupRequired
    │   ├── layout/             # AppLayout, Sidebar, Topbar, Logo
    │   ├── ui/                 # Card, KpiCard, Badges, Modal, Pagination, EmptyState, Loading…
    │   ├── charts/ChartTooltip.tsx
    │   ├── filters/GlobalFilterBar.tsx
    │   └── transactions/       # TransactionDetails, TransactionModal
    └── pages/                  # Landing, Dashboard, Transactions, Analytics, Monitoring, Reports, Settings, About, NotFound
```

## 6. Data & security

- Tables `transactions` and `alert_reviews` (see `supabase/schema.sql`) use **Row Level Security**:
  every query is limited to `auth.uid() = user_id`, so one account can never read another's data.
- Re-importing the same file is safe — rows whose transaction ID already exists are skipped.
  Rows without an ID get a stable generated ID (`IMP-…`) so they de-duplicate too.
- Only the public **anon** key is used in the browser. Never store card numbers, CVVs, UPI PINs or passwords.

## 7. Tech stack

React 18 · Vite 5 · TypeScript · Tailwind CSS 3 · Recharts · React Router 6 · Lucide React · Supabase (Postgres + Auth)

## Troubleshooting

- **`npm` is not recognized** → install Node.js and restart VS Code.
- **Port 5173 already in use** → run `npm run dev -- --port 3000`.
- **Blank page after editing** → check the terminal / browser console for the error message.
- **Reset saved settings and alert statuses** → Settings → *Restore defaults*.
