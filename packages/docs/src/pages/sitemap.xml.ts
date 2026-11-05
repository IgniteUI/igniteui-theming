// Sitemap: /search, v24 docs, current docs, /. Only the default locale is listed (no ja pages). No lastmod;
// weekly / 0.5.
import type { APIRoute } from 'astro';
import { getDocsModel } from '../lib/docs/astro-model';
import { SITE_BASE, SITE_URL } from '../lib/docs/config';

export const GET: APIRoute = async () => {
  const v24 = await getDocsModel('en', '24.0.0');
  const current = await getDocsModel('en', 'current');
  const paths = [
    '/search',
    ...[...v24.docs].map((d) => d.permalink.slice(SITE_BASE.length)).sort(),
    ...[...current.docs].map((d) => d.permalink.slice(SITE_BASE.length)).sort(),
    '/',
  ];
  const urls = paths
    .map(
      (p) =>
        `<url><loc>${SITE_URL}${SITE_BASE}${p}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
