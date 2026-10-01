/**
 * The shipped components this app uses for its own controls.
 *
 * Registered here rather than at each call site so the set is visible in one place, and
 * so a view that imports it cannot forget one and render an inert custom element.
 *
 * It has to come through the package barrel: `exports` only publishes `.`, `./themes/*`
 * and `./extras`, so there is no subpath to import five components from. That is what
 * the ~59 KB gzipped chunk buys — the whole library, for a button, a button group, a
 * slider and a tooltip.
 *
 * They are themed by `shell/theme.scss`, which emits this branch's palette onto `:root` —
 * the components read `--ig-*` at runtime, so the controls in this app are painted by the
 * generator the app is about.
 */
import {
  configureTheme,
  defineComponents,
  IgcButtonComponent,
  IgcButtonGroupComponent,
  IgcSliderComponent,
  IgcToggleButtonComponent,
  IgcTooltipComponent,
} from "igniteui-webcomponents";

/**
 * The family decides the components' structure — their shapes, densities and the type and
 * elevation scales they assume. `shell/theme.scss` picks the same one for its Sass
 * presets, so the two stay in step.
 */
const THEME = "indigo";

const prefersDark = matchMedia("(prefers-color-scheme: dark)");

/**
 * The scheme the chrome is drawn in: an explicit `data-theme` on the root wins, then the
 * system preference. The same two sources, in the same order, that `shell/theme.scss`
 * reads — a control themed for the other scheme is invisible on the page.
 */
const scheme = () => {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return prefersDark.matches ? "dark" : "light";
};

const applyTheme = () => configureTheme(THEME, scheme());

applyTheme();
prefersDark.addEventListener("change", applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, {
  attributeFilter: ["data-theme"],
});

defineComponents(
  IgcButtonComponent,
  IgcButtonGroupComponent,
  IgcSliderComponent,
  IgcToggleButtonComponent,
  IgcTooltipComponent,
);
