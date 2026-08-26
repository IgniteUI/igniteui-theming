import * as sass from "sass";
const ROOT=".";
const SH=["50","100","200","300","400","500","600","700","800","900"];
const LAYERS=["50","100","200","300","400","600","700","800","900"];
const SEEDS=["#0099ff","#df1b74","#faa419","#4eb862","#7c3aed","#e11d48","#0d9488","#a99bb0",
 "#00ff00","#ffe9b0","#141225","#8a8a8a","#ff00ff","#00ffff","#123456","#fefefe","#010203","#c0ffee"];
const SURFACES=["#ffffff","#fcfcfd","#f8f8fa","#eeeeee","#1a1a24","#000000","#0d1117","#808080"];
const warn=[];
const run=(b)=>{const css=sass.compileString(`@use 'sass:map';\n@use 'sass/color' as *;\n${b}`,
 {loadPaths:[ROOT],logger:{warn:(m)=>warn.push(m.split("\n")[0])}}).css;
 const o={};for(const l of css.split("\n")){const m=l.match(/^\s*([\w-]+):\s*(.+);\s*$/);if(m)o[m[1]]=m[2].trim();}return o;};
const hx=(s)=>{const m=s.match(/^#?([0-9a-f]{3,6})$/i)||s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
 if(!m)return null;
 if(m.length===2){let h=m[1];if(h.length===3)h=[...h].map(c=>c+c).join("");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
 return [1,2,3].map(i=>+m[i]);};
const NAMED={white:[255,255,255],black:[0,0,0],lightgray:[211,211,211]};
const col=(s)=>NAMED[s]||hx(s);
const lin=v=>(v/=255)<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
const lum=([r,g,b])=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const cr=(a,b)=>{const x=lum(a)+0.05,y=lum(b)+0.05;return Math.max(x,y)/Math.min(x,y);};

let aaF=0,aaT=0,dup=0;
for(const seed of SEEDS){
  const d=run(`$p: palette($primary: ${seed}, $secondary: ${seed}, $surface: #fff, $gray: #333);
   $s: map.get($p,'primary'); out { ${SH.map(v=>`s-${v}: #{map.get($s,'${v}-raw')};`).join("")} }`);
  const c=SH.map(v=>col(d[`s-${v}`]));
  if(new Set(c.map(String)).size!==c.length){dup++;console.log("DUP",seed);}
  for(let i=0;i<5;i++){aaT++;if(cr(c[i],c[i+5])<4.5){aaF++;console.log("AA fail",seed,SH[i],SH[i+5],cr(c[i],c[i+5]).toFixed(2));}}
}
console.log(`color ramps: ${SEEDS.length} seeds | AA 5-rung failures ${aaF}/${aaT} | duplicate-shade families ${dup}\n`);

console.log("surface + gray across backgrounds:");
for(const bg of SURFACES){
  const d=run(`$p: palette($primary: #09f, $secondary: #09f, $surface: ${bg}, $gray: #333);
   $g: map.get($p,'gray'); $s: map.get($p,'surface');
   out { ${SH.map(v=>`g-${v}: #{map.get($g,'${v}-raw')};`).join("")}
         ${SH.map(v=>`s-${v}: #{map.get($s,'${v}-raw')};`).join("")} }`);
  const g=SH.map(v=>col(d[`g-${v}`])), s=SH.map(v=>col(d[`s-${v}`])), b=col(bg);
  const layers=LAYERS.map(v=>col(d[`s-${v}`]));
  let mono=true,prev=1;
  for(const l of layers){const a=cr(l,b);if(a<=prev){mono=false}prev=a;}
  console.log(`  ${bg}  gray ${new Set(g.map(String)).size}/10 distinct, 50-nearest ${cr(g[0],b)<cr(g[9],b)}  |  surface ${new Set(s.map(String)).size}/10 distinct, 500==bg ${String(s[5])===String(b)}, layers monotonic ${mono}, reach ${cr(layers[8],b).toFixed(2)}:1`);
}

console.log("\nladder presets on gray (light surface):");
for(const p of ["even","material","tailwind","carbon"]){
  const d=run(`$p: palette($primary: #09f, $secondary: #09f, $surface: #fff, $gray: #333, $ladders: ('gray': '${p}'));
   $g: map.get($p,'gray'); out { ${SH.map(v=>`g-${v}: #{map.get($g,'${v}-raw')};`).join("")} }`);
  const g=SH.map(v=>col(d[`g-${v}`]));
  let f=0; for(let i=0;i<5;i++) if(cr(g[i],g[i+5])<4.5) f++;
  console.log(`  ${p.padEnd(9)} ${SH.map(v=>d[`g-${v}`]).join(" ")}  AA ${5-f}/5`);
}
console.log("\nwarnings:",[...new Set(warn)].length?[...new Set(warn)]:"none");
