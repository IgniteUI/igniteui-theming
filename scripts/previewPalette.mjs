import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import sass from "sass";

const { palette, variant } = yargs(hideBin(process.argv)).parse();

const styles = `
    @use 'sass:string';
    @use 'sass:map';
    @use 'sass' as *;
    @use 'sass/color';
    @use 'sass/color/presets' as *;

    @each $p, $c in map.remove(color.$IPalette, '_meta') {
        @each $v in $c {
            @debug string.unquote('#{$p}-#{$v}:') color($${variant}-${palette}-palette, $p, $v);
            @debug string.unquote('#{$p}-#{$v}-contrast:') contrast-color($${variant}-${palette}-palette, $p, $v);
        }
    }
`;

sass.compileString(styles, { loadPaths: ["./"] });
