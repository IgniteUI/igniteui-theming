import { SampleSandpack } from '../SampleSandpack';

import mainCode from './sandpack/main.js?raw';
import styles from './sandpack/styles.scss?raw';
import layoutCode from './sandpack/layout.scss?raw';
import indexHtml from './sandpack/template.html?raw';

export default function ThemingSandpack() {
  return (
    <SampleSandpack
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
          code: indexHtml,
        },
      }}
      options={{
        recompileDelay: 500,
      }}
    />
  );
}
