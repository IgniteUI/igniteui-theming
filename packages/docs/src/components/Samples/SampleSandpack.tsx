import { Sandpack } from '@codesandbox/sandpack-react';
import { useColorMode } from '@/lib/theme/color-mode';
import { useMemo } from 'react';
import {
  sandpackBaseOptions,
  sandpackSharedCustomSetup,
} from './sandpackConfig';
import { useSandpackTheme } from './useSandpackTheme';
import { AutoResizeSandpack } from './AutoResizeSandpack';

export function useSandpackColorMode(): 'light' | 'dark' {
  const { colorMode } = useColorMode();
  const theme =
    typeof document !== 'undefined'
      ? document.documentElement.dataset.theme
      : undefined;
  return theme === 'light' || theme === 'dark' ? theme : colorMode;
}

export interface ThemingSandpackProps {
  scssCode?: string;
  htmlContent?: string;
  height?: number;
}

export type SandpackFile =
  | string
  | {
      code: string;
      hidden?: boolean;
      active?: boolean;
    };

interface SampleSandpackProps {
  files: Record<string, SandpackFile>;
  options?: Record<string, unknown>;
  /** Auto-resize the preview panel height to match the rendered content. */
  autoResizePreview?: boolean;
}

export function applyTemplateVariables(
  template: string,
  vars: Record<string, string | undefined>
) {
  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`__${name}__`, value ?? ''),
    template
  );
}

function getCode(file: SandpackFile) {
  return typeof file === 'string' ? file : file.code;
}

const MAIN_SCRIPT = /<script\s+type="module"\s+src="\/main\.js"\s*><\/script>/gi;

/** The sample's `<body>` without its own `/main.js` script tag (the wrapper adds that back below). */
function toTemplateBody(template: string) {
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch?.[1] ?? template;
  // Repeat until nothing changes, so no tag can re-form from fragments around a removed one.
  for (let previous = ''; previous !== body; ) {
    previous = body;
    body = body.replace(MAIN_SCRIPT, '');
  }
  return body.trim();
}

function toIndexHtml(templateBody: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">
  </head>
  <body>
${templateBody}
    <script type="module" src="/main.js"></script>
  </body>
</html>`;
}

export function SampleSandpack({
  files,
  options,
  autoResizePreview,
}: SampleSandpackProps) {
  const theme = useSandpackTheme();

  const normalizedFiles = useMemo(() => {
    const templateEntry = files['/template.html'];
    const indexEntry = files['/index.html'];

    if (templateEntry) {
      return {
        ...files,
        '/index.html': {
          code: toIndexHtml(toTemplateBody(getCode(templateEntry))),
          hidden: true,
        },
      };
    }

    if (indexEntry) {
      if (typeof indexEntry === 'string') {
        return {
          ...files,
          '/index.html': toIndexHtml(toTemplateBody(indexEntry)),
        };
      }

      return {
        ...files,
        '/index.html': {
          ...indexEntry,
          code: toIndexHtml(toTemplateBody(indexEntry.code)),
        },
      };
    }

    return files;
  }, [files]);

  if (autoResizePreview) {
    return (
      <AutoResizeSandpack
        files={normalizedFiles}
        options={{ ...sandpackBaseOptions, ...(options ?? {}) }}
      />
    );
  }

  return (
    <Sandpack
      template="vite"
      theme={theme}
      files={normalizedFiles}
      customSetup={sandpackSharedCustomSetup}
      options={{
        ...sandpackBaseOptions,
        ...(options ?? {}),
      }}
    />
  );
}
