import './styles.scss';
console.log('Styles loaded');
import './layout.scss';

var range = document.querySelector('#slider');
var button = document.querySelector('.button-wrapper');
var current = document.querySelector('#current-value');

range.addEventListener('input', () => {
  button.style.setProperty('--ig-elevation-factor', range.value);
  current.textContent = range.value;
});
