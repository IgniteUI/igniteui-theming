import React, { type ReactNode } from 'react';
import styles from './styles.module.scss';

export default function CodeBlockHeader({ title }: { title: string }) {
  return <div className={styles.code__title}>{title}</div>;
}
