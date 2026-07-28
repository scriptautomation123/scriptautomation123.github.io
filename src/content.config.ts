import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({
    base: './src/content/blog',
    pattern: ['*.{md,mdx}', '**/index.mdx', 'astro-learning-guide/lesson-*.mdx'],
  }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      series: z.string().optional(),
      canonicalURL: z.url().optional(),
      heroImage: z.optional(image()),
    }),
});

export const collections = { blog };
