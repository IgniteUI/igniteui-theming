import {
  SampleSandpack,
  type ThemingSandpackProps,
  applyTemplateVariables,
  useSandpackColorMode,
} from '../SampleSandpack';

import mainCode from './sandpack/main.js?raw';
import styles from './sandpack/styles.scss?raw';
import layoutCode from './sandpack/layout.scss?raw';
import indexHtml from './sandpack/template.html?raw';

export default function ThemingSandpack() {
  const colorMode = useSandpackColorMode();
  const resolvedHtml = applyTemplateVariables(indexHtml, {
    COLOR_MODE: colorMode,
  });

  return (
    <SampleSandpack
      autoResizePreview={true}
      files={{
        '/main.js': {
          code: mainCode,
          hidden: true,
        },
        '/styles.scss': {
          code: styles,
          active: true,
        },
        '/layout.scss': {
          code: layoutCode,
          hidden: true,
          active: true,
        },
        '/template.html': {
          code: resolvedHtml,
        },
      }}
      options={{
        recompileDelay: 500,
      }}
    />
  );
}
