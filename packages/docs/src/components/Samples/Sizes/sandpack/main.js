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
      text = 'Small sizing';
      break;
    case '2':
      text = 'Medium sizing';
      break;
    case '3':
      text = 'Large sizing';
      break;
    default:
      text = 'Large sizing';
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
