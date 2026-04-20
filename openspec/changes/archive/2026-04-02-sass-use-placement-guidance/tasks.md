## 1. Centralized Guidance Constants

- [x] 1.1 Add `SASS_USE_INLINE_COMMENT` constant to `utils/sass.ts` with the single-line inline comment text
- [x] 1.2 Add `SASS_USE_ASSEMBLY_NOTE` constant to `utils/sass.ts` with the markdown assembly note text
- [x] 1.3 Export both constants from `utils/sass.ts`

## 2. Inline Comment in Generated Sass

- [x] 2.1 Modify `generateUseStatement` in `utils/sass.ts` to prepend the inline comment above the `@use` line
- [x] 2.2 Modify `generatePresetImports` to not duplicate the comment (only `generateUseStatement` emits it)
- [x] 2.3 Verify platform-specific generators (Angular, Web Components) include the comment via `generateUseStatement`

## 3. Assembly Note in Handler Response Text

- [x] 3.1 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/palette.ts`
- [x] 3.2 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/custom-palette.ts`
- [x] 3.3 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/typography.ts`
- [x] 3.4 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/elevations.ts`
- [x] 3.5 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/theme.ts`
- [x] 3.6 Append `SASS_USE_ASSEMBLY_NOTE` to Sass output in `handlers/component-theme.ts`

## 4. Tool Description Guidance

- [x] 4.1 Add `@use` placement note to `create_palette` description in `tools/descriptions.ts`
- [x] 4.2 Add `@use` placement note to `create_custom_palette` description in `tools/descriptions.ts`
- [x] 4.3 Add `@use` placement note to `create_typography` description in `tools/descriptions.ts`
- [x] 4.4 Add `@use` placement note to `create_elevations` description in `tools/descriptions.ts`
- [x] 4.5 Add `@use` placement note to `create_theme` description in `tools/descriptions.ts`
- [x] 4.6 Add `@use` placement note to `create_component_theme` description in `tools/descriptions.ts`

## 5. Tests and Validation

- [x] 5.1 Add tests verifying inline comment presence in generated Sass output for palette, theme, and component-theme handlers
- [x] 5.2 Add tests verifying assembly note presence in handler response text for palette, theme, and component-theme handlers
- [x] 5.3 Verify CSS output mode does not include the inline comment or assembly note
- [x] 5.4 Run full test suite and fix any regressions
