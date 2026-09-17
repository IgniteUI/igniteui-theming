/// <reference types="vite/client" />

declare module "virtual:data/color.sweep" {
  const data: import("./data/color/sweep.js").SweepData;
  export default data;
}

declare module "virtual:data/color.scales" {
  const data: import("./data/color/scales.js").ScaleData;
  export default data;
}

declare module "virtual:data/color.presets" {
  const data: import("./data/color/presets.js").PresetData;
  export default data;
}
