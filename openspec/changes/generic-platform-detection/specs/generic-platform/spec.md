## ADDED Requirements

### Requirement: Generic is a first-class platform value

The `Platform` type SHALL include `"generic"` as a valid member alongside `"angular"`, `"webcomponents"`, `"react"`, and `"blazor"`. All `Record<Platform, ...>` mappings SHALL include a `generic` entry.

#### Scenario: PLATFORMS array includes generic

- **WHEN** the `PLATFORMS` constant is defined
- **THEN** it SHALL contain `"generic"` as a member
- **AND** the derived `Platform` type includes `"generic"` in its union

#### Scenario: Ignite package patterns for generic

- **WHEN** `IGNITE_PACKAGE_PATTERNS` is defined as `Record<Platform, string[]>`
- **THEN** the `generic` entry SHALL be an empty array
- **AND** the compiler enforces its presence

#### Scenario: Variable prefix for generic

- **WHEN** `PLATFORM_VARIABLE_PREFIX` is defined as `Record<Platform, string>`
- **THEN** the `generic` entry SHALL be `"ig"`

#### Scenario: Platform metadata for generic

- **WHEN** `PLATFORM_METADATA` is accessed with `"generic"`
- **THEN** it SHALL return an entry with `name: "Ignite UI Theming (Standalone)"`, `themingModule: "igniteui-theming"`, and a description stating this is for projects without a specific Ignite UI product

### Requirement: Generic platform uses igniteui-theming import path

The Sass import path for `"generic"` SHALL be `"igniteui-theming"`, consistent with other non-Angular platforms.

#### Scenario: IMPORT_PATHS contains generic key

- **WHEN** `IMPORT_PATHS` is defined
- **THEN** it SHALL contain a `generic` key with value `"igniteui-theming"`
- **AND** the former `default` key SHALL be renamed to `generic`

#### Scenario: getImportPath resolves generic

- **WHEN** `getImportPath("generic")` is called
- **THEN** it SHALL return `"igniteui-theming"`

#### Scenario: generateUseStatement for generic

- **WHEN** `generateUseStatement("generic")` is called
- **THEN** it SHALL return `@use 'igniteui-theming' as *;`

### Requirement: Generic platform has a resource URI

The resource system SHALL expose a `theming://platforms/generic` resource.

#### Scenario: Generic resource is registered

- **WHEN** the resource definitions are loaded
- **THEN** `theming://platforms/generic` SHALL be a valid resource URI

#### Scenario: Generic resource returns common presets

- **WHEN** `theming://platforms/generic` is read
- **THEN** the response SHALL include schemas, palettes, typefaces, typography, and elevation presets
- **AND** the response SHALL include the generic platform metadata

#### Scenario: Platforms list includes generic

- **WHEN** the `theming://platforms` resource is read
- **THEN** the `platforms` array SHALL include `"generic"`

### Requirement: Generic detection response lists tool eligibility

When the detected platform is `"generic"`, the `detect_platform` response SHALL clearly communicate which tools are usable and which are not.

#### Scenario: Usable tools are listed

- **WHEN** `detect_platform` returns `platform: "generic"`
- **THEN** the response SHALL list the following tools as usable: `create_palette`, `create_custom_palette`, `create_typography`, `create_elevations`, `create_theme`, `set_size`, `set_spacing`, `set_roundness`, `get_color`, `read_resource`

#### Scenario: Non-usable tools are listed with reasons

- **WHEN** `detect_platform` returns `platform: "generic"`
- **THEN** the response SHALL list `create_component_theme` and `get_component_design_tokens` as not useful in generic mode
- **AND** the reason SHALL state these tools target Ignite UI framework components

#### Scenario: Layout tools have a scope caveat

- **WHEN** `detect_platform` returns `platform: "generic"`
- **THEN** the response SHALL note that layout tools (`set_size`, `set_spacing`, `set_roundness`) work globally via `:root` or with a custom `scope` selector, but the `component` parameter SHALL NOT be used because it resolves Ignite UI component selectors

### Requirement: Generic detection response provides Sass includePaths guidance

When the detected platform is `"generic"` and the output format is Sass, the response SHALL include project configuration guidance for Sass `includePaths`.

#### Scenario: Angular config file detected

- **WHEN** `detect_platform` returns `platform: "generic"` and `angular.json` was detected as a signal
- **THEN** the response SHALL include guidance to add `"stylePreprocessorOptions": { "includePaths": ["node_modules"] }` in `angular.json`

#### Scenario: Vite config file detected

- **WHEN** `detect_platform` returns `platform: "generic"` and a `vite.config.*` file was detected as a signal
- **THEN** the response SHALL include guidance to add `css: { preprocessorOptions: { scss: { includePaths: ['node_modules'] } } }` in the Vite config

#### Scenario: Next.js config file detected

- **WHEN** `detect_platform` returns `platform: "generic"` and a `next.config.*` file was detected as a signal
- **THEN** the response SHALL include guidance to add `sassOptions: { includePaths: ['node_modules'] }` in the Next.js config

#### Scenario: No config file detected

- **WHEN** `detect_platform` returns `platform: "generic"` and no framework config file was detected
- **THEN** the response SHALL include general guidance to ensure `node_modules` is in the Sass compiler's `includePaths`
- **AND** the response SHALL instruct the model to investigate the project's build configuration

#### Scenario: CSS output does not need includePaths

- **WHEN** the user requests CSS output from any tool
- **THEN** the response SHALL note that CSS output is compiled server-side by the MCP and requires no local `igniteui-theming` installation or `includePaths` configuration

#### Scenario: Theming package not in project dependencies

- **WHEN** `igniteui-theming` is not found in `package.json` dependencies or devDependencies
- **THEN** the response SHALL note that for Sass output, the user needs `igniteui-theming` resolvable in their project (via `npm install igniteui-theming` or appropriate `includePaths`)
- **AND** the response SHALL note that CSS output works regardless since the MCP compiles it server-side

### Requirement: Display names resolve correctly for all platforms

All handlers that display a platform name SHALL use `PLATFORM_METADATA` lookups instead of binary ternary expressions.

#### Scenario: Generic platform display name

- **WHEN** a handler formats a display name for `platform: "generic"`
- **THEN** it SHALL display `"Ignite UI Theming (Standalone)"` (from `PLATFORM_METADATA.generic.name`)
- **AND** it SHALL NOT display `"Ignite UI for Web Components"` or any other product name

#### Scenario: Undefined platform display name

- **WHEN** a handler formats a display name and `platform` is `undefined`
- **THEN** it SHALL display `"Not specified (generic output)"`

### Requirement: Tool descriptions guide generic-mode behavior

Tool descriptions SHALL be updated to guide the model on correct behavior when `platform` is `"generic"`.

#### Scenario: Platform parameter description includes generic

- **WHEN** the `FRAGMENTS.PLATFORM` description is read by the model
- **THEN** it SHALL list `"generic"` as a valid option for platform-agnostic output

#### Scenario: Layout tool descriptions mention scope-only for generic

- **WHEN** the `set_size`, `set_spacing`, or `set_roundness` tool description is read
- **THEN** it SHALL note that when `platform` is `"generic"`, the `component` parameter SHALL NOT be used
- **AND** it SHALL recommend using `scope` with a custom CSS selector instead

#### Scenario: Component tokens tool description notes generic limitation

- **WHEN** the `get_component_design_tokens` tool description is read
- **THEN** it SHALL note that this tool returns tokens for Ignite UI framework components and is not useful when the detected platform is `"generic"`

#### Scenario: Detect platform tool description documents generic output

- **WHEN** the `detect_platform` tool description is read
- **THEN** it SHALL document that `"generic"` is a possible platform value returned when no Ignite UI product is detected
- **AND** it SHALL describe what `"generic"` means for tool usage
