/**
 * Registers a custom element unless that name is already taken.
 *
 * `customElements.define` throws on a repeat, and an uncaught throw aborts the rest of
 * the module — which is how a second copy of a shared element silently stops a whole view
 * from ever being defined. Two views bundled separately and landing on the same page is
 * enough to cause it.
 */
export const define = (tag: string, element: CustomElementConstructor) => {
  if (!customElements.get(tag)) customElements.define(tag, element);
};
