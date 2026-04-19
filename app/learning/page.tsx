import type { Metadata } from 'next';
import GanttChart from '@/app/learning/GanttChart';
import { LEARNING_PHASES } from '@/lib/viz-data';

export const metadata: Metadata = { title: 'Learning Path' };

const totalHours = LEARNING_PHASES.reduce((s, p) => s + p.hours, 0);
const totalCourses = LEARNING_PHASES.reduce((s, p) => s + p.courses, 0);

const PHASE_COLORS = ['var(--brand-primary)', 'var(--info)', 'var(--brand-accent)', 'var(--success)', 'var(--danger)'];

export default function LearningPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <div
          className="t-muted"
          style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}
        >
          &gt; learning_path / 26_weeks / {totalHours}h / {totalCourses}_courses
        </div>
        <h1 className="t-heading" style={{ color: 'var(--brand-primary)' }}>
          Learning Path
        </h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          26-week Coursera curriculum from DSP foundations to ML for SIGINT — prerequisites, topics, and progression.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Duration', value: '26 weeks' },
          { label: 'Total Hours', value: `${totalHours}h` },
          { label: 'Total Courses', value: String(totalCourses) },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <div className="t-stat" style={{ fontSize: '20px' }}>
              {s.value}
            </div>
            <div className="card-sub">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div className="t-label">Gantt Chart — 26 Weeks</div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <GanttChart />
        </div>
      </section>

      {/* Phase detail cards */}
      <section className="space-y-3">
        <div className="t-eyebrow">/ Phase Breakdown</div>
        {LEARNING_PHASES.map((phase, i) => (
          <div key={phase.phase} className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <div>
                <div className="t-card-heading" style={{ fontSize: '14px', color: PHASE_COLORS[i] }}>
                  Phase {phase.phase} — {phase.title}
                </div>
                <div
                  className="t-muted"
                  style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', marginTop: 'var(--space-xs)' }}
                >
                  Weeks {phase.weeks} · {phase.hours}h · {phase.courses} course{phase.courses !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="progress-track" style={{ width: '64px', marginTop: 'var(--space-sm)' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(phase.hours / totalHours) * 100}%`, background: PHASE_COLORS[i] }}
                />
              </div>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {phase.topics.map((t) => (
                <li
                  key={t}
                  className="t-muted"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                >
                  <span style={{ color: PHASE_COLORS[i] }}>›</span> {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Wiki prerequisites map */}
      <section>
        <div className="t-eyebrow">/ Prerequisite → Wiki Article Map</div>
        <div className="card" style={{ padding: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
          {[
            {
              phase: 'Phase 1: DSP',
              articles: ['electromagnetic-side-channel-practical-guide', 'sigint-machine-learning-pipeline'],
            },
            {
              phase: 'Phase 2: HW Security',
              articles: ['electromagnetic-side-channel-analysis', 'pqc-em-sca', 'pqc-implementation-security-2026'],
            },
            {
              phase: 'Phase 3: RF Eng.',
              articles: ['sdr-tools-landscape-2026', 'research-grade-em-sca-lab', 'tempest-standards-reference'],
            },
            {
              phase: 'Phase 4: ML',
              articles: [
                'sigint-machine-learning-pipeline',
                'rf-fingerprinting-device-identification',
                'em-sca-2026-developments',
              ],
            },
          ].map((row) => (
            <div
              key={row.phase}
              className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"
              style={{ marginBottom: 'var(--space-sm)' }}
            >
              <span className="t-muted shrink-0" style={{ fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
                {row.phase}
              </span>
              <div className="flex flex-wrap gap-2">
                {row.articles.map((slug) => (
                  <span key={slug} className="badge badge-blue" style={{ cursor: 'pointer', fontSize: '10px' }}>
                    {slug
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                      .slice(0, 30)}
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
