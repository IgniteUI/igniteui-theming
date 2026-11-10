import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await buildLlmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
