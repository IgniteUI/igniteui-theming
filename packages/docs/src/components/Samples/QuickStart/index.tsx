import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';
import { verifiedAccount } from '@igniteui/material-icons-extended';

import { SampleSandpack, type ThemingSandpackProps } from '../SampleSandpack';

const avatar = createAvatar(shapes, {
  seed: 'Ignite UI',
  scale: 75,
  radius: 50,
});
const avatarSvg = avatar.toString();

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
          active: false,
        },
        '/layout.scss': {
          code: layoutCode,
          hidden: true,
          active: false,
        },
        '/template.html': {
          code: indexHtml,
        },
        '/public/avatar.svg': avatarSvg,
        '/public/verified-account.svg': verifiedAccount.value,
      }}
      options={{
        readOnly: false,
        recompileDelay: 500,
        experimental_enableStableServiceWorkerId: true,
        visibleFiles: ['/styles.scss', '/template.html'],
        activeFile: '/styles.scss',
      }}
    />
  );
}
