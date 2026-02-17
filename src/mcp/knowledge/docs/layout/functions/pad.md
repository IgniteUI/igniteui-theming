# The pad() function

Returns a size-aware spacing value based on --ig-spacing and size flags.

## Mechanism
The pad() function uses --is-small/medium/large (from @include sizable()) and multiplies the
chosen size by spacing variables:
- --ig-spacing
- --ig-spacing-inline (optional)
- --ig-spacing-block (optional)
- If --ig-spacing-inline or --ig-spacing-block are not provided, they default to --ig-spacing.

Spacing can be controlled based on the value of --ig-size (small/medium/large) and can be set globally or at the component level:
- --ig-spacing-small/medium/large
- --ig-spacing-inline-small/medium/large
- --ig-spacing-block-small/medium/large

## CSS Variable Fallback Priority
The system checks CSS variables in priority order (first match wins):

### For inline spacing (pad-inline):
1. Most specific: --ig-spacing-inline-small/medium/large (based on current --ig-size)
   - If defined → Use this value
2. Size-specific: --ig-spacing-small/medium/large (based on current --ig-size)
   - If defined → Use this value
3. Direction-specific: --ig-spacing-inline
   - If defined → Use this value (applies to all sizes)
4. Base fallback: --ig-spacing
   - Always use this if none of the above are defined (applies to all sizes)

### For block spacing (pad-block):
1. Most specific: --ig-spacing-block-small/medium/large (based on current --ig-size)
   - If defined → Use this value
2. Size-specific: --ig-spacing-small/medium/large (based on current --ig-size)
   - If defined → Use this value
3. Direction-specific: --ig-spacing-block
   - If defined → Use this value (applies to all sizes)
4. Base fallback: --ig-spacing
   - Always use this if none of the above are defined (applies to all sizes)

#### Example 1: Only base spacing set
```scss
:root {
  --ig-spacing: 1;
}
```
Result: Both inline and block use 1 for all sizes (small/medium/large)

#### Example 2: Direction-specific spacing
```scss
:root {
  --ig-spacing: 1;
  --ig-spacing-inline: 1.5;
  --ig-spacing-block: 0.75;
}
```
Result:
- Inline uses 1.5 for all sizes
- Block uses 0.75 for all sizes

#### Example 3: Size-specific spacing
```scss
:root {
  --ig-spacing: 1;
  --ig-spacing-small: 0.5;
  --ig-spacing-medium: 1;
  --ig-spacing-large: 1.5;
}
```
Result: Both inline and block use size-specific values:
- Small (--ig-size: 1) → 0.5
- Medium (--ig-size: 2) → 1
- Large (--ig-size: 3) → 1.5

#### Example 4: Fully customized (most specific wins)
```scss
:root {
  --ig-spacing: 1;
  --ig-spacing-inline: 1.2;
  --ig-spacing-inline-large: 2;
}
```
Result:
- Inline small/medium: 1.2 (from --ig-spacing-inline)
- Inline large: 2 (from --ig-spacing-inline-large, most specific)
- Block all sizes: 1 (fallback to --ig-spacing)

## How to configure padding in a card component using pad(), pad-inline(), and pad-block()
```scss
.my-card {
  padding: pad(4px, 8px, 16px); // Set both vertical and horizontal padding (configurable via --ig-spacing)
  margin-inline: pad-inline(4px, 8px, 16px); // Set horizontal padding only (configurable via --ig-spacing or --ig-spacing-inline)
  margin-block: pad-block(2px, 4px, 8px); // Set vertical padding only (configurable via --ig-spacing or --ig-spacing-block)
}
```

## Configure the spacing variable to adjust the padding size in the card
```css
.my-card {
  --ig-spacing: 0.75;
}
```

## Notes
- Requires @include sizing() and @include sizable() in component styles.
- Requires @include spacing() once to set spacing variables.
