import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Website | WebVault - Share Quality Resources',
  description: 'Submit high-quality websites to WebVault directory. Share valuable resources and help others discover great content across categories like Finance, Travel, Education, and more.',
  keywords: [
    'submit website',
    'website directory',
    'quality resources',
    'web discovery',
    'resource sharing',
    'website collection',
    'curated content',
    'WebVault directory'
  ],
  openGraph: {
    title: 'Submit Website | WebVault',
    description: 'Submit high-quality websites to WebVault directory and help others discover valuable resources.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit Website | WebVault',
    description: 'Submit high-quality websites to WebVault directory and help others discover valuable resources.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/submit',
  },
}

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}