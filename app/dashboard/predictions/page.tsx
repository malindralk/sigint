// MALINDRA PHASE 4
// app/dashboard/predictions/page.tsx
// Static predictive analytics dashboard.
// All data pre-computed at build time from data/predictions/.
// Uses Recharts for charts. All colors via CSS vars.

import type { Metadata } from 'next';
import { getRegionalOverview } from '@/lib/predictions';
import PredictionsDashboardClient from './PredictionsDashboardClient';

export const metadata: Metadata = {
  title: 'Predictions Dashboard · Malindra',
  description: 'Pre-computed AI scenario intelligence dashboard for Malindra SIGINT platform.',
  robots: { index: false, follow: false },
};

export default function PredictionsDashboardPage() {
  const overview = getRegionalOverview();
  return <PredictionsDashboardClient overview={overview} />;
}
