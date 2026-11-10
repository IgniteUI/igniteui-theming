import 'react';

// Augment React JSX to allow Ignite UI Web Components tags without listing each one.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [tagName: `igc-${string}`]: any;
    }
  }
}
