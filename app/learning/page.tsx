import type { Metadata } from 'next';
import { LEARNING_PHASES } from '@/lib/viz-data';

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
        <div className="space-y-4">
          {/* Week ruler */}
          <div className="flex items-center gap-0">
            <div className="w-40 shrink-0" />
            <div className="flex-1 flex">
              {Array.from({ length: 26 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-text-muted font-mono border-l border-border-muted py-1"
                  style={{ minWidth: 0, display: (i + 1) % 4 === 0 || i === 0 ? 'block' : 'none' }}>
                  {i === 0 ? 'W1' : `W${i + 1}`}
                </div>
              ))}
            </div>
          </div>

          {LEARNING_PHASES.map(phase => {
            const [startW, endW] = phase.weeks.split('–').map(Number);
            const startPct = ((startW - 1) / 26) * 100;
            const widthPct = ((endW - startW + 1) / 26) * 100;

            return (
              <div key={phase.phase} className="flex items-center gap-0">
                <div className="w-40 shrink-0 pr-4">
                  <div className="text-xs font-mono text-text-secondary truncate">Phase {phase.phase}</div>
                  <div className="text-xs text-text-muted truncate">{phase.title}</div>
                </div>
                <div className="flex-1 relative h-8">
                  <div className="absolute inset-y-0 left-0 right-0 border-l border-border-muted opacity-20"
                    style={{ backgroundImage: 'repeating-linear-gradient(90deg, #30363d 0px, #30363d 1px, transparent 1px, transparent calc(100%/26))' }} />
                  <div
                    className="absolute top-1 bottom-1 rounded flex items-center px-2 text-xs font-mono whitespace-nowrap overflow-hidden"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      background: `${phase.color}22`,
                      border: `1px solid ${phase.color}66`,
                      color: phase.color,
                    }}
                  >
                    {phase.weeks} · {phase.hours}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
