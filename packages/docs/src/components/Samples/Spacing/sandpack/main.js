import './styles.scss';
import './layout.scss';

// Update text function, ran on every edit of the sample
function updateText() {
  const button = document.querySelector('button');

  const size = getComputedStyle(button)
    .getPropertyValue('--component-size')
    .trim();
  let text = '';

  switch (size) {
    case '1':
      text = 'Small padding';
      break;
    case '2':
      text = 'Medium padding';
      break;
    case '3':
      text = 'Large padding';
      break;
    default:
      text = 'Large padding';
      break;
  }

  button.textContent = text;
}

// Initial text update
updateText();

// Creating MutationObserver
const observer = new MutationObserver(() => {
  setTimeout(updateText, 10);
});

// Watch the head for style changes
const styleSheets = document.querySelector('style');
observer.observe(styleSheets, {
  childList: true,
  characterData: true,
  subtree: true,
});
