import './styles.scss';
import './layout.scss';

let slider = document.querySelector('#slider');
var current = document.querySelector('#current-hue');
let root = document.documentElement;


slider.addEventListener('input', () => {
  root.style.setProperty('--ig-primary-500', `hsl(${slider.value} 100% 50%)`);
  current.textContent = slider.value;
});
