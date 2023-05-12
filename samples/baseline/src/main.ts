import logo from '/logo.svg'
import './style.scss'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://github.com/igniteui/igniteui-theming/" target="_blank">
      <img src="${logo}" class="logo" alt="Ignite UI Theming logo" />
    </a>
    <h1><span>Ignite UI</span> Theming</h1>
    <p class="read-the-docs">
      Click on the logo to learn more
    </p>
  </div>
`
