// The colour swatch used by `core-concepts/colors/overview.mdx`. It renders both hex values and lets CSS pick
// one per theme, so the page needs no JavaScript (Astro renders MDX statically).
import type { ReactNode } from 'react';
import styles from '@/styles/docs/colors.module.scss';

export interface ColorSwatchProps {
  label: string;
  dark: string;
  light?: string;
  swatchClass?: string;
}

export default function ColorSwatch({
  label,
  dark,
  light = dark,
  swatchClass,
}: ColorSwatchProps): ReactNode {
  return (
    <div className={styles.colorItem}>
      <span className={`${styles.colorSwatch} ${swatchClass ?? ''}`}></span>
      <div>
        <p className={styles.colorLabel}>
          {label}{' '}
          <span className={styles.colorCode}>
            <span className={styles.colorCodeDark}>{dark}</span>
            <span className={styles.colorCodeLight}>{light}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
