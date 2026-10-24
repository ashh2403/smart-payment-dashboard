import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  ArrowRight, BarChart3, Bell, Building2, CheckCircle2, Database, FileDown, Filter, GraduationCap, LayoutDashboard,
  MapPin, Menu, ShieldCheck, Sparkles, UserRound, Workflow, X,
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import ChartTooltip from '../components/charts/ChartTooltip';
import { formatINR, formatNumber, shortDayLabel, toInputDate } from '../utils/format';
import { METHOD_COLORS } from '../utils/constants';
import { MODULES, OBJECTIVES, PROJECT, TECH_STACK, INTRODUCTION } from '../data/projectInfo';

const FEATURES = [
  { icon: LayoutDashboard, title: 'Live KPI dashboard', text: 'Total, successful, failed and pending transactions with success rate — all in one view.' },
  { icon: BarChart3, title: 'Interactive analytics', text: 'Daily and monthly trends, method performance and success / failure analysis with tooltips.' },
  { icon: Filter, title: 'Powerful filtering', text: 'Date-range and payment-method filters that update every chart and table instantly.' },
  { icon: Bell, title: 'Monitoring & alerts', text: 'Predefined rules flag unusual patterns for review, with severity and status tracking.' },
  { icon: FileDown, title: 'Reports & CSV export', text: 'Printable summary reports and one-click CSV exports for transactions and alerts.' },
  { icon: ShieldCheck, title: 'Privacy by design', text: 'Each account sees only its own data (row-level security). No card numbers or PINs are stored.' },
];

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#objectives', label: 'Objectives' },
  { href: '#modules', label: 'Modules' },
  { href: '#tech', label: 'Tech stack' },
  { href: '#team', label: 'Team' },
];

export default function Landing() {
  const [menu, setMenu] = useState(false);

  // Illustrative hero mock-up only (the landing page is public, so it never shows account data)
  const preview = useMemo(() => {
    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return { key: toInputDate(d), count: Math.round(60 + 18 * Math.sin(i / 3) + (i % 7) * 4 + i) };
    });
    const methods = (['UPI', 'Card', 'Wallet', 'NetBanking'] as const).map((method, i) => ({ method, count: [58, 22, 12, 8][i] }));
    return { kpis: { total: 2486, totalValue: 1845000, successRate: 96.4 }, daily, methods };
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" aria-label="Back to top"><Logo /></a>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex" aria-label="Sections">
            {NAV.map((n) => <a key={n.href} href={n.href} className="hover:text-cyan-300">{n.label}</a>)}
            <a href="#contact" className="hover:text-cyan-300">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="btn-primary hidden sm:inline-flex">Explore Dashboard <ArrowRight className="h-4 w-4" /></Link>
            <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden" onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu}>
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-white/5 px-4 pb-4 md:hidden" aria-label="Mobile sections">
            {[...NAV, { href: '#contact', label: 'Contact' }].map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5">{n.label}</a>
            ))}
            <Link to="/dashboard" className="btn-primary mt-2 w-full">Explore Dashboard</Link>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="grid-bg relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div className="animate-fadeUp">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> {PROJECT.course} · CSE · Sathyabama IST
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl xl:text-[56px]">
              Smart Digital Payment{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">Transaction Analytics</span>{' '}
              & Monitoring Dashboard
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              A centralized platform to analyze, visualize and monitor UPI, card, wallet and online-banking transactions —
              with interactive charts, KPIs, rule-based alerts and downloadable reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary h-12 px-6 text-base">Explore Dashboard <ArrowRight className="h-5 w-5" /></Link>
              <a href="#modules" className="btn-dark h-12 px-6 text-base">View modules</a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ['CSV', 'Bank & gateway import'],
                ['4', 'Payment methods'],
                ['5', 'Core modules'],
              ].map(([v, l]) => (
                <div key={l}><p className="text-2xl font-extrabold text-white">{v}</p><p className="text-xs text-slate-400">{l}</p></div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative animate-fadeUp [animation-delay:150ms]">
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-cyan-500/30 to-blue-600/20 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-navy-900/90 p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-1.5 px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-[11px] text-slate-500">paypulse / dashboard · last 30 days</span>
                <span className="ml-auto rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  ['Transactions', formatNumber(preview.kpis.total)],
                  ['Value', formatINR(preview.kpis.totalValue, true)],
                  ['Success rate', `${preview.kpis.successRate.toFixed(1)}%`],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-5 gap-2.5">
                <div className="col-span-3 rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-800">Daily volume</p>
                  <div className="h-32">
                    <ResponsiveContainer>
                      <AreaChart data={preview.daily} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gHero" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="key" hide />
                        <Tooltip content={<ChartTooltip labelFormatter={(l) => shortDayLabel(String(l))} />} />
                        <Area dataKey="count" name="Transactions" stroke="#06b6d4" strokeWidth={2} fill="url(#gHero)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-span-2 rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-800">By method</p>
                  <div className="h-24">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={preview.methods} dataKey="count" nameKey="method" innerRadius={24} outerRadius={42} paddingAngle={3}>
                          {preview.methods.map((m) => <Cell key={m.method} fill={METHOD_COLORS[m.method]} stroke="none" />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {preview.methods.map((m) => (
                      <span key={m.method} className="flex items-center gap-1 text-[9px] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: METHOD_COLORS[m.method] }} />{m.method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="border-y border-white/5 bg-navy-900/60">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">About the project</p>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">{INTRODUCTION}</p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Features" title="Everything needed to monitor digital payments" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.06]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-cyan-300 ring-1 ring-cyan-400/30">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OBJECTIVES */}
      <section id="objectives" className="scroll-mt-20 bg-white text-slate-800">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">Project objectives</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Turning raw payment data into clear decisions</h2>
            <p className="mt-4 text-slate-500">The system is designed around five measurable goals defined at the start of the project.</p>
            <Link to="/about" className="btn-secondary mt-6">Read full abstract <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ol className="space-y-3">
            {OBJECTIVES.map((o, i) => (
              <li key={o} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5 shadow-card">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-900 font-bold text-cyan-300">{i + 1}</span>
                <p className="pt-1.5 font-medium text-slate-700">{o}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Module implementation" title="Five modules, one data pipeline" />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {MODULES.map((m, i) => {
            const Icon = [Database, Workflow, BarChart3, Bell, LayoutDashboard][i];
            return (
              <div key={m.key} className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <span className="text-3xl font-extrabold text-white/10">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-bold">{m.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TECH */}
      <section id="tech" className="scroll-mt-20 border-y border-white/5 bg-navy-900/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Technology stack" title="Built with a modern web stack" />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {TECH_STACK.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-navy-950/60 p-5 text-center">
                <p className="font-bold text-white">{t.name}</p>
                <p className="mt-1 text-xs text-slate-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="About the team" title="Project team" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROJECT.students.map((s) => (
            <div key={s.regNo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600"><UserRound className="h-7 w-7" /></span>
              <p className="mt-4 text-lg font-bold">{s.name}</p>
              <p className="text-sm text-slate-400">Project Student</p>
              <p className="mt-1 font-mono text-xs text-cyan-300/80">Reg. No. {s.regNo}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.06] p-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-navy-900"><GraduationCap className="h-7 w-7" /></span>
            <p className="mt-4 text-lg font-bold">{PROJECT.guide.name}</p>
            <p className="text-sm text-slate-400">Project Guide</p>
            <p className="mt-1 text-xs text-cyan-200/80">{PROJECT.guide.qualification} · {PROJECT.guide.designation}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 p-10 text-center sm:p-14">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold">See the dashboard in action</h2>
            <p className="mx-auto mt-3 max-w-xl text-cyan-50">Create a free account, import your transactions and get KPIs, alerts and reports in minutes.</p>
            <Link to="/login" className="btn mt-7 h-12 bg-white px-7 text-base text-navy-900 hover:bg-cyan-50">Get started <ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>

      {/* FOOTER / CONTACT */}
      <footer id="contact" className="scroll-mt-20 border-t border-white/5 bg-navy-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-slate-400">{PROJECT.title} — a {PROJECT.course} project of the {PROJECT.department}.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Your data stays private to your account · no card numbers or PINs stored
            </p>
          </div>
          <div>
            <p className="text-sm font-bold">Contact</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-400">
              <li className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{PROJECT.department}, {PROJECT.school}</li>
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{PROJECT.institution}, {PROJECT.address}</li>
              <li className="flex gap-2"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Guide: {PROJECT.guide.name}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {[
                ['/dashboard', 'Dashboard'], ['/transactions', 'Transactions'], ['/analytics', 'Analytics'],
                ['/monitoring', 'Monitoring & Alerts'], ['/reports', 'Reports'], ['/about', 'About project'],
              ].map(([to, l]) => <li key={to}><Link to={to} className="hover:text-cyan-300">{l}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {PROJECT.students.map((s) => s.name).join(' & ')} · {PROJECT.institution}
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

