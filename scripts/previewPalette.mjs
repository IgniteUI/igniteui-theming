import path from 'path';
import { mkdirSync as makeDir } from 'fs';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';
import * as sass from 'sass';
import getArgs from './getArgs.mjs';
import postcss from 'postcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join.bind(null, path.resolve(__dirname, '../dist'));

const {palette, variant, out} = getArgs();

const stripComments = () => {
    return {
        postcssPlugin: 'postcss-strip-comments',
        OnceExit(root) {
            root.walkComments((node) => node.remove());
        },
    };
};

stripComments.postcss = true;

const postProcessor = postcss([stripComments]);

const styles = `
    @use 'sass:string';
    @use 'sass:map';
    @use 'sass' as *;
    @use 'sass/color';
    @use 'sass/color/presets' as *;

    $protoPalette: map.remove(color.$IPalette, '_meta');
    $result: ();

    @each $p, $c in $protoPalette {
        $result: map.merge($result, ($p: ()));

        @each $v in $c {
            $shade: color($${variant}-${palette}-palette, $p, $v);
            $contrast: contrast-color($${variant}-${palette}-palette, $p, $v);
            $result: map.merge($result, $p, ($v: $shade, #{$v}-contrast: $contrast));
        }
    }

    @each $palette, $color in $result {
        #{$palette} {
            @each $shade, $value in $color {
                #{$shade}: #{$value};
            } 
        }
    }
`;

const result = sass.compileString(styles, {loadPaths: ['./']});
let cssStr = postProcessor.process(result.css).css;

// Strip BOM if any
if (cssStr.charCodeAt(0) === 0xfeff) {
    cssStr = cssStr.substring(1);
}

console.log(cssStr);

if (out) {
  const outputFile = DEST_DIR(`${palette}-${variant}.css`);
  makeDir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, cssStr, 'utf-8');
}
