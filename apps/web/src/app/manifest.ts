import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roamera — Travel Super App',
    short_name: 'Roamera',
    description: 'Plan, collaborate, and share your travels with Roamera.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0D9488',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['travel', 'lifestyle', 'navigation'],
    shortcuts: [
      {
        name: 'My Trips',
        url: '/trips',
        description: 'View all your trips',
      },
      {
        name: 'AI Planner',
        url: '/ai-planner',
        description: 'Plan a new trip with AI',
      },
    ],
  };
}
