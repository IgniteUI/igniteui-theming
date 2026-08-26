import * as sass from "sass";
const ROOT = ".";
const SH = ["50","100","200","300","400","500","600","700","800","900"];
const SEEDS = ["#0099ff","#df1b74","#faa419","#4eb862","#7c3aed","#e11d48","#0d9488","#a99bb0",
  "#00ff00","#ffe9b0","#141225","#8a8a8a","#ff00ff","#00ffff","#123456","#fefefe","#010203","#c0ffee"];
const SURFACES = ["#ffffff","#fcfcfd","#f5f6f8","#eeeeee","#1a1a24","#000000","#0d1117"];
const warn = [];
const run = (body) => {
  const css = sass.compileString(`@use 'sass:map';\n@use 'sass/color' as *;\n${body}`,
    { loadPaths: [ROOT], logger: { warn: (m) => warn.push(m.split(" —")[0]) } }).css;
  const o = {};
  for (const l of css.split("\n")) { const m = l.match(/^\s*([\w-]+):\s*(.+);\s*$/); if (m) o[m[1]] = m[2].trim(); }
  return o;
};
const hex = (s) => { const m = s.match(/^#?([0-9a-f]{6})$/i) || s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (!m) return null;
  return m.length === 2 ? [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)) : [1,2,3].map(i=>+m[i]); };
const lin = v => (v/=255) <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
const lum = ([r,g,b]) => 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const cr = (a,b) => { const x=lum(a)+0.05, y=lum(b)+0.05; return Math.max(x,y)/Math.min(x,y); };

let aaFail=0, aaTot=0, dupFams=0, famTot=0;
for (const seed of SEEDS) {
  const d = run(`$p: palette($primary: ${seed}, $secondary: ${seed}, $surface: #fff, $gray: #333);
    $s: map.get($p,'primary'); out { ${SH.map(v=>`s-${v}: #{map.get($s,'${v}-raw')};`).join("")} }`);
  const c = SH.map(v => hex(d[`s-${v}`]));
  famTot++;
  if (new Set(c.map(String)).size !== c.length) { dupFams++; console.log("DUP", seed); }
  for (let i=0;i<5;i++){ aaTot++; if (cr(c[i],c[i+5]) < 4.5) { aaFail++; console.log("AA fail", seed, SH[i], SH[i+5], cr(c[i],c[i+5]).toFixed(2)); } }
}
console.log(`\ncolor ramps: ${famTot} seeds | AA 5-rung failures ${aaFail}/${aaTot} | families with duplicate shades ${dupFams}`);

console.log("\nsurface + gray across surfaces:");
for (const bg of SURFACES) {
  const d = run(`$p: palette($primary: #09f, $secondary: #09f, $surface: ${bg}, $gray: #333);
    $g: map.get($p,'gray'); $s: map.get($p,'surface');
    out { ${SH.map(v=>`g-${v}: #{map.get($g,'${v}-raw')};`).join("")}
          ${SH.map(v=>`s-${v}: #{map.get($s,'${v}-raw')};`).join("")}
          s500: #{map.get($s,'500-raw')}; }`);
  const g = SH.map(v=>hex(d[`g-${v}`])), s = SH.map(v=>hex(d[`s-${v}`]));
  const bgc = hex(bg);
  const uniqG = new Set(g.map(String)).size, uniqS = new Set(s.map(String)).size;
  const anchored = String(s[5]) === String(bgc);
  const nearest = cr(g[0], bgc) < cr(g[9], bgc);
  console.log(`  ${bg}  gray distinct ${uniqG}/10, 50-nearest-bg ${nearest}  |  surface distinct ${uniqS}/10, 500==bg ${anchored}  span ${cr(s[0],s[9]).toFixed(2)}:1`);
}
console.log("\nwarnings:", [...new Set(warn)].length ? [...new Set(warn)] : "none");
