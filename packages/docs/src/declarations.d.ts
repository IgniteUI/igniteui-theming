// Raw imports used by Sandpack samples (e.g. `./sandpack/template.html?raw`).
declare module '*.scss?raw' {
  const content: string;
  export default content;
}
declare module '*.css?raw' {
  const content: string;
  export default content;
}
declare module '*.html?raw' {
  const content: string;
  export default content;
}
declare module '*.js?raw' {
  const content: string;
  export default content;
}
declare module '*.ts?raw' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const src: string;
  export default src;
}
