// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://scriptautomation123.github.io',
  redirects: {
    '/blog/astro-learning-guide/01-mental-model-and-setup/':
      '/blog/astro-learning-guide/lesson-01-mental-model-and-setup/',
    '/blog/astro-learning-guide/02-routing-pages-and-layouts/':
      '/blog/astro-learning-guide/lesson-02-routing-pages-and-layouts/',
    '/blog/astro-learning-guide/03-content-collections-and-mdx/':
      '/blog/astro-learning-guide/lesson-03-content-collections-and-mdx/',
    '/blog/astro-learning-guide/04-data-fetching-and-rendering-modes/':
      '/blog/astro-learning-guide/lesson-04-data-fetching-and-rendering-modes/',
    '/blog/astro-learning-guide/05-islands-and-framework-components/':
      '/blog/astro-learning-guide/lesson-05-islands-and-framework-components/',
    '/blog/astro-learning-guide/06-styling-assets-and-performance/':
      '/blog/astro-learning-guide/lesson-06-styling-assets-and-performance/',
    '/blog/astro-learning-guide/07-deployment-ci-and-maintenance/':
      '/blog/astro-learning-guide/lesson-07-deployment-ci-and-maintenance/',
  },
  integrations: [mdx(), sitemap()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Atkinson',
      cssVariable: '--font-atkinson',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/atkinson-regular.woff'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/atkinson-bold.woff'],
            weight: 700,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
});
