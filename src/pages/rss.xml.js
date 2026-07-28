import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getSiteBaseURL } from '../utils/url';

export async function GET(context) {
  const posts = await getCollection('blog');
  const toPostSlug = (id) => (id.endsWith('/index') ? id.slice(0, -'/index'.length) : id);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: getSiteBaseURL({ site: context.site, url: context.url }),
    items: posts.map((post) => ({
      ...post.data,
      link: `/blog/${toPostSlug(post.id)}/`,
    })),
  });
}
