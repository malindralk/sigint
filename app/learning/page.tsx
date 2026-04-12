import type { Metadata } from 'next';
import { LEARNING_PHASES } from '@/lib/viz-data';
import GanttChart from '@/app/learning/GanttChart';

export const metadata: Metadata = { title: 'Learning Path' };

const totalHours = LEARNING_PHASES.reduce((s, p) => s + p.hours, 0);
const totalCourses = LEARNING_PHASES.reduce((s, p) => s + p.courses, 0);

export default function LearningPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; learning_path / 26_weeks / {totalHours}h / {totalCourses}_courses</div>
        <h1 className="text-2xl font-bold" style={{ color: '#ff7b72' }}>Learning Path</h1>
        <p className="text-text-secondary text-sm mt-1">
          26-week Coursera curriculum from DSP foundations to ML for SIGINT — prerequisites, topics, and progression.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Duration', value: '26 weeks' },
          { label: 'Total Hours', value: `${totalHours}h` },
          { label: 'Total Courses', value: String(totalCourses) },
        ].map(s => (
          <div key={s.label} className="bg-bg-secondary border border-border-default rounded-lg p-4 text-center">
            <div className="text-xl font-bold font-mono text-text-primary">{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-6">Gantt Chart — 26 Weeks</div>
        <GanttChart />
      </section>

      {/* Phase detail cards */}
      <section className="space-y-4">
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest">/ Phase Breakdown</div>
        {LEARNING_PHASES.map(phase => (
          <div key={phase.phase} className="bg-bg-secondary border border-border-default rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-text-primary" style={{ color: phase.color }}>
                  Phase {phase.phase} — {phase.title}
                </div>
                <div className="text-xs text-text-muted font-mono mt-0.5">
                  Weeks {phase.weeks} · {phase.hours}h · {phase.courses} course{phase.courses !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="w-16 h-1.5 rounded-full mt-2" style={{ background: `${phase.color}33` }}>
                <div className="h-full rounded-full" style={{ width: `${(phase.hours / totalHours) * 100}%`, background: phase.color }} />
              </div>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {phase.topics.map(t => (
                <li key={t} className="text-xs text-text-secondary flex items-center gap-2">
                  <span style={{ color: phase.color }}>›</span> {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Wiki prerequisites map */}
      <section>
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">/ Prerequisite → Wiki Article Map</div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-5 space-y-3 text-sm font-mono">
          {[
            { phase: 'Phase 1: DSP', articles: ['electromagnetic-side-channel-practical-guide', 'sigint-machine-learning-pipeline'] },
            { phase: 'Phase 2: HW Security', articles: ['electromagnetic-side-channel-analysis', 'pqc-em-sca', 'pqc-implementation-security-2026'] },
            { phase: 'Phase 3: RF Eng.', articles: ['sdr-tools-landscape-2026', 'research-grade-em-sca-lab', 'tempest-standards-reference'] },
            { phase: 'Phase 4: ML', articles: ['sigint-machine-learning-pipeline', 'rf-fingerprinting-device-identification', 'em-sca-2026-developments'] },
          ].map(row => (
            <div key={row.phase} className="flex items-start gap-4">
              <span className="text-text-muted w-36 shrink-0 text-xs">{row.phase}</span>
              <div className="flex flex-wrap gap-2">
                {row.articles.map(slug => (
                  <span key={slug} className="text-xs px-2 py-0.5 rounded border border-border-muted text-accent-cyan hover:border-accent-cyan cursor-pointer">
                    {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 30)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
