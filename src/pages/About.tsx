import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Layers, Lightbulb, Target, Trophy, UserRound } from 'lucide-react';
import { Fragment } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { ABSTRACT, CONCLUSION, INTRODUCTION, MODULES, OBJECTIVES, PROJECT, RESULTS, TECH_STACK } from '../data/projectInfo';

const FLOW = ['Payment sources (UPI · Cards · Wallets · Net Banking)', 'Data Collection', 'Data Processing', 'Transaction Analytics', 'Monitoring & Alerts', 'Dashboard & Reports'];

export default function About() {
  return (
    <>
      <PageHeader title="About the Project" description={`${PROJECT.course} · ${PROJECT.department}`} />

      <div className="card mb-4 overflow-hidden">
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{PROJECT.institution}</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">{PROJECT.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{PROJECT.school} · {PROJECT.department}</p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {PROJECT.students.map((s) => (
            <div key={s.regNo} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-100 text-cyan-700"><UserRound className="h-5 w-5" /></span>
              <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-xs text-slate-500">Project Student · Reg. No. {s.regNo}</p></div>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700"><GraduationCap className="h-5 w-5" /></span>
            <div><p className="font-bold text-slate-900">{PROJECT.guide.name}</p><p className="text-xs text-slate-500">Guide · {PROJECT.guide.qualification}, {PROJECT.guide.designation}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-cyan-600" /> Abstract</span>}>
          <p className="text-sm leading-relaxed text-slate-600">{ABSTRACT}</p>
        </Card>
        <Card title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-cyan-600" /> Introduction</span>}>
          <p className="text-sm leading-relaxed text-slate-600">{INTRODUCTION}</p>
        </Card>
      </div>

      <Card className="mt-4" title={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-cyan-600" /> Objectives</span>}>
        <ul className="grid gap-3 md:grid-cols-2">
          {OBJECTIVES.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{o}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4" title={<span className="flex items-center gap-2"><Layers className="h-4 w-4 text-cyan-600" /> System architecture</span>} subtitle="How data flows through the five modules">
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          {FLOW.map((f, i) => (
            <Fragment key={f}>
              <div className={`flex-1 rounded-xl border px-4 py-3 text-center text-sm font-semibold ${i === 0 ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-cyan-200 bg-cyan-50 text-cyan-900'}`}>{f}</div>
              {i < FLOW.length - 1 && <ArrowRight className="mx-auto h-4 w-4 shrink-0 rotate-90 text-slate-400 lg:rotate-0" />}
            </Fragment>
          ))}
        </div>
      </Card>

      <Card className="mt-4" title="Module implementation">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {MODULES.map((m, i) => (
            <div key={m.key} className="rounded-xl border border-slate-200 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-sm font-bold text-cyan-300">{i + 1}</span>
              <p className="mt-3 font-bold text-slate-900">{m.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-cyan-600" /> Results and discussion</span>}>
          <p className="text-sm leading-relaxed text-slate-600">{RESULTS}</p>
        </Card>
        <Card title="Conclusion">
          <p className="text-sm leading-relaxed text-slate-600">{CONCLUSION}</p>
        </Card>
      </div>

      <Card className="mt-4" title="Technology stack">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TECH_STACK.map((t) => (
            <div key={t.name} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
          ))}
        </div>
      </Card>
    </>
  );
}
