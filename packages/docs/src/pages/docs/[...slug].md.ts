// Plain-markdown twin of every current doc (`/docs/….md`), the target of the links in llms.txt.
import type { APIRoute, InferGetStaticPropsType } from 'astro';
import { docStaticPaths } from '../../lib/docs/routes';
import { docMarkdown } from '../../lib/llms';

export const getStaticPaths = () => docStaticPaths('en', 'current');
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(await docMarkdown(props.doc), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
