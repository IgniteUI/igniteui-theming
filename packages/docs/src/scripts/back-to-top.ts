// Back-to-top button, shown after scrolling 300px.
const THRESHOLD = 300;
const button = document.querySelector<HTMLButtonElement>(
  '.it-back-to-top__button'
);
if (button) {
  let lastY = window.scrollY;
  let focusedAnchor = false;
  const setShown = (shown: boolean) =>
    button.classList.toggle('it-back-to-top__button--visible', shown);
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (focusedAnchor) {
        focusedAnchor = false;
      } else if (y >= lastY) {
        setShown(false);
      } else if (y < THRESHOLD) {
        setShown(false);
      } else if (
        y + window.innerHeight <
        document.documentElement.scrollHeight
      ) {
        setShown(true);
      }
      lastY = y;
    },
    { passive: true }
  );
  window.addEventListener('hashchange', () => {
    if (location.hash) {
      focusedAnchor = true;
      setShown(false);
    }
  });
  button.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}
