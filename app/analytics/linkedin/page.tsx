import { LinkedInAnalyticsClient } from './LinkedInAnalyticsClient';

export const metadata = {
  title: 'LinkedIn Insights | unool',
  description: 'AI-powered LinkedIn analytics dashboard',
};

export default function LinkedInAnalyticsPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      
      <LinkedInAnalyticsClient />
    </>
  );
}
