// copy-to-clipboard for the code block wrapper rendered by src/components/mdx/Pre.astro.
const COPY_RESET_DELAY = 1000;

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '[data-copy-code]'
  );
  if (!button) return;
  const pre = button.parentElement?.querySelector('pre');
  const text = pre?.innerText ?? pre?.textContent ?? '';
  try {
    await navigator.clipboard.writeText(text);
    button.title = 'Copied!';
    button.setAttribute('aria-label', 'Copied!');
    button.querySelector<HTMLElement>('.shiki-code-copy-button__copy')!.hidden =
      true;
    button.querySelector<HTMLElement>(
      '.shiki-code-copy-button__copied'
    )!.hidden = false;
    setTimeout(() => {
      button.title = 'Copy code';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.querySelector<HTMLElement>(
        '.shiki-code-copy-button__copy'
      )!.hidden = false;
      button.querySelector<HTMLElement>(
        '.shiki-code-copy-button__copied'
      )!.hidden = true;
    }, COPY_RESET_DELAY);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
});
