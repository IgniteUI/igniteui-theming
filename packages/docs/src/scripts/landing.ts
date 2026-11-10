// Landing-page behaviour: inlines the animated SVG illustrations (the variant for the current theme and
// viewport), replays their animations when they scroll into view, and runs the card hover animations.

const MOBILE = window.matchMedia('(max-width: 768px)');
const svgText = new Map<string, Promise<string>>();

function fetchSvg(url: string): Promise<string> {
  let p = svgText.get(url);
  if (!p) {
    p = fetch(url).then((r) => r.text());
    svgText.set(url, p);
  }
  return p;
}

function variantFor(el: HTMLElement | SVGElement): string | undefined {
  const dark = document.documentElement.dataset.theme !== 'light';
  const d = el.dataset;
  const mobile = MOBILE.matches
    ? dark
      ? d.srcDarkMobile
      : d.srcLightMobile
    : undefined;
  return mobile ?? (dark ? d.srcDark : d.srcLight);
}

type Anim = SVGAnimationElement & { beginElementAt?(offset: number): void };
const ANIMS = 'animate, animateMotion, animateTransform';

function play(root: Element): void {
  const svgs =
    root instanceof SVGSVGElement ? [root] : root.querySelectorAll('svg');
  for (const svg of svgs) {
    svg.setCurrentTime?.(0);
    svg.unpauseAnimations?.();
    for (const anim of svg.querySelectorAll<Anim>(ANIMS))
      anim.beginElementAt?.(
        Number.parseFloat(anim.getAttribute('data-delay') ?? '0')
      );
  }
}

function reset(root: Element): void {
  for (const svg of root.querySelectorAll('svg')) {
    svg.pauseAnimations?.();
    svg.setCurrentTime?.(0);
  }
}

function inView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

/** Replaces a placeholder (or a previously inlined svg) with the SVG for the current theme and viewport. */
async function inline(el: HTMLElement | SVGElement): Promise<void> {
  const url = variantFor(el);
  if (!url || el.dataset.currentSrc === url) return;
  const text = await fetchSvg(url);
  const parsed = new DOMParser().parseFromString(
    text,
    'image/svg+xml'
  ).documentElement;
  if (!(parsed instanceof SVGSVGElement)) return;
  const svg = document.importNode(parsed, true);
  for (const [k, v] of Object.entries(el.dataset))
    if (v !== undefined) svg.dataset[k] = v;
  svg.dataset.currentSrc = url;
  const animated = el.closest('[data-animate]');
  el.replaceWith(svg);
  if (animated && inView(animated)) play(svg);
}

function inlineAll(): void {
  for (const el of document.querySelectorAll<HTMLElement | SVGElement>(
    '[data-inline-svg]'
  ))
    void inline(el);
}

function observeAnimations(): void {
  for (const container of document.querySelectorAll<HTMLElement>(
    '[data-animate]'
  )) {
    const threshold = Number.parseFloat(container.dataset.threshold ?? '0.5');
    new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play(container);
        else reset(container);
      },
      { threshold }
    ).observe(container);
  }
}

function hoverAnimations(): void {
  const run = (item: Element, direction: 'forward' | 'backward') => {
    const svg = item.querySelector('svg');
    if (!svg) return;
    for (const anim of svg.querySelectorAll<Anim>(
      `[data-animation="${direction}"], [data-animation="two-way"]`
    ))
      anim.beginElement();
  };
  for (const item of document.querySelectorAll('[data-concept]')) {
    item.addEventListener('mouseenter', () => run(item, 'forward'));
    item.addEventListener('mouseleave', () => run(item, 'backward'));
  }
}

inlineAll();
observeAnimations();
hoverAnimations();
new MutationObserver(inlineAll).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
MOBILE.addEventListener('change', inlineAll);
