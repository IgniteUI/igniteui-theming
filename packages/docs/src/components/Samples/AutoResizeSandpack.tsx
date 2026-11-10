import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  type SandpackInternalOptions,
} from '@codesandbox/sandpack-react';
import { useEffect, useRef, useState } from 'react';
import {
  sandpackBaseOptions,
  sandpackSharedCustomSetup,
} from './sandpackConfig';
import { useSandpackTheme } from './useSandpackTheme';
import type { SandpackFile } from './SampleSandpack';

const MIN_PREVIEW_HEIGHT = 300;

/** Options accepted by the composable sandpack components, split from preset-only ones. */
interface AutoResizeSandpackOptions extends SandpackInternalOptions {
  showTabs?: boolean;
  closableTabs?: boolean;
  showInlineErrors?: boolean;
}

interface AutoResizeSandpackProps {
  files: Record<string, SandpackFile>;
  options?: AutoResizeSandpackOptions;
}

/**
 * A Sandpack instance whose preview panel automatically grows/shrinks to fit
 * the rendered content inside the iframe.
 *
 * Works by listening to the `resize` postMessage that the sandpack bundler
 * runtime emits whenever `document.body` dimensions change inside the iframe.
 */
export function AutoResizeSandpack({
  files,
  options,
}: AutoResizeSandpackProps) {
  const theme = useSandpackTheme();

  const {
    showTabs = sandpackBaseOptions.showTabs,
    closableTabs = sandpackBaseOptions.closableTabs,
    showInlineErrors = sandpackBaseOptions.showInlineErrors,
    ...providerOptions
  } = options ?? {};

  return (
    <SandpackProvider
      template="vite"
      theme={theme}
      files={
        files as Record<
          string,
          string | { code: string; hidden?: boolean; active?: boolean }
        >
      }
      customSetup={sandpackSharedCustomSetup}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options={
        {
          autorun: sandpackBaseOptions.autorun,
          ...(providerOptions as any),
        } as any
      }
    >
      <AutoResizeSandpackLayout
        showTabs={showTabs}
        closableTabs={closableTabs}
        showInlineErrors={showInlineErrors}
      />
    </SandpackProvider>
  );
}

function AutoResizeSandpackLayout({
  showTabs,
  closableTabs,
  showInlineErrors,
}: {
  showTabs: boolean;
  closableTabs: boolean;
  showInlineErrors: boolean;
}) {
  const [previewHeight, setPreviewHeight] = useState(MIN_PREVIEW_HEIGHT);
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    // SandpackPreview sets the content height as an inline style on the iframe.
    // We watch for changes to that attribute directly.
    let stylesObserver: MutationObserver | null = null;

    const observer = new MutationObserver(() => {
      const iframe = layout.querySelector('iframe');

      if (!iframe || stylesObserver) return;

      stylesObserver = new MutationObserver(() => {
        const h = parseFloat(iframe.style.height);

        if (!isNaN(h)) {
          setPreviewHeight(Math.round(h));
        }
      });

      stylesObserver.observe(iframe, {
        attributes: true,
        attributeFilter: ['style'],
      });
    });

    observer.observe(layout, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      stylesObserver?.disconnect();
    };
  }, []);

  return (
    <div ref={layoutRef} className="sp-layout sp-layout--auto-resize">
      <SandpackCodeEditor
        showTabs={showTabs}
        closableTabs={closableTabs}
        showInlineErrors={showInlineErrors}
        wrapContent
      />
      <SandpackPreview
        style={{ height: previewHeight, minHeight: previewHeight }}
        showRefreshButton={false}
        showOpenInCodeSandbox={false}
      />
    </div>
  );
}
