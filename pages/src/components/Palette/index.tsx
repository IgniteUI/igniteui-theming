import React, { Fragment } from 'react';
import { PaletteMeta } from 'igniteui-theming';
import styles from './styles.module.css';

function GroupVariants({ name, variants }) {
  return variants.map((variant: string) => {
    return <div
      style={{
        backgroundColor: `hsl(var(--ig-${name}-${variant}))`,
        color: `var(--ig-${name}-${variant}-contrast)`,
        border: `1px solid rgba(255, 255, 255, 0.24)`,
        boxShadow: `0 0 0 1px hsla(var(--ig-${name}-${variant}), 0.7)`,
      }}
      className={styles.variant}
      key={variant}>{variant}
    </div>
  })
}

export default function div() {
  return Object.entries(PaletteMeta).map(([name, variants]) => {
    return <Fragment key={name}>
      <div className={styles.name}>{name}</div>
      <div className={styles.group}>
        <GroupVariants name={name} variants={variants}/>
      </div>
    </Fragment>
  });
}
