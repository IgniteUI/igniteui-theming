import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
