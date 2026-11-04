export const sandpackSharedCustomSetup = {
  dependencies: {
    sass: '^1.91.2',
    'igniteui-theming': '^29.0.0',
  },
} as const;

export const sandpackBaseOptions = {
  showInlineErrors: true,
  autorun: true,
  showConsole: false,
  showTabs: true,
  closableTabs: false,
  initMode: 'immediate',
  experimental_enableServiceWorker: true,
} as const;
