// the component map passed to every `<Content components={...} />`.
// Astro components take real slots, which React components rendered from MDX do not get.
import Admonition from './Admonition.astro';
import H1 from './H1.astro';
import Pre from './Pre.astro';

export const mdxComponents = {
  h1: H1,
  pre: Pre,
  admonition: Admonition,
};
