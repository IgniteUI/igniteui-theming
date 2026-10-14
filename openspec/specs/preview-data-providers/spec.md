## Purpose

How a pillar of the preview application declares the data it needs compiled from Sass, how that data is cached and invalidated, and how a view loads it.

## Requirements

### Requirement: Pillar data is declared as a provider

Every dataset the preview app derives from Sass SHALL be declared as a data provider exposing a unique `id`, a `deps` list of Sass paths whose contents affect its output, and an asynchronous `build` function returning serialisable data. The provider registry SHALL reject duplicate ids at build time.

#### Scenario: A provider is resolved through its virtual module

- **GIVEN** a provider registered with the id `color.sweep`
- **WHEN** a module imports `virtual:data/color.sweep`
- **THEN** the plugin invokes that provider's `build` function
- **AND** the import resolves to the serialised result

#### Scenario: Duplicate ids fail the build

- **GIVEN** two providers registered with the id `color.sweep`
- **WHEN** the build starts
- **THEN** the build fails with an error naming the duplicated id

### Requirement: Provider output is cached against its inputs

Provider output SHALL be cached on disk and keyed on a hash of the contents of every path in `deps` together with the source of the provider module itself. A cache entry SHALL be reused only when that hash is unchanged.

#### Scenario: Unchanged inputs reuse the cache

- **GIVEN** a provider whose output has been built and cached
- **WHEN** the build runs again with no change to its `deps` or its own source
- **THEN** the cached output is used
- **AND** no Sass compilation is performed for that provider

#### Scenario: A changed Sass dependency invalidates the cache

- **GIVEN** a cached provider that lists the shade generator among its `deps`
- **WHEN** the generator source changes and the build runs
- **THEN** the cache entry is discarded
- **AND** the provider is rebuilt

#### Scenario: A changed provider invalidates its own cache

- **GIVEN** a cached provider whose `deps` are unchanged
- **WHEN** the provider module's own source changes and the build runs
- **THEN** the cache entry is discarded
- **AND** the provider is rebuilt

### Requirement: View data loads on demand

A view's data SHALL be loaded through a dynamic import issued when that view first renders, so that entering the application does not transfer data belonging to views the reader has not reached.

#### Scenario: Unopened sections transfer no data

- **GIVEN** an application with a color section and at least one other section
- **WHEN** the reader loads the application and opens a section other than color
- **THEN** the color section's data modules are not requested

### Requirement: Generator warnings survive the cache

A provider whose build raises Sass warnings SHALL carry them in its output, so that a build served from cache reports the same warnings as the build that produced it. A provider that probes deliberately beyond what a subject can reach SHALL record that limit in its data rather than reporting the resulting warnings as findings.

#### Scenario: A cached build still reports a warning

- **GIVEN** a provider whose compilation raised a warning, already cached
- **WHEN** the build runs again and the cache is used
- **THEN** that warning is reported

#### Scenario: Deliberate probing past a limit is not reported as a finding

- **GIVEN** the scale table provider, which samples contrast targets beyond what some subjects can reach
- **WHEN** it builds
- **THEN** warnings that a shade could not reach its target are not carried as findings
- **AND** the subject records the highest contrast it can reach

### Requirement: Compiled values come from the library

Provider output SHALL be produced by compiling the theming library's public Sass API. A provider SHALL NOT reimplement shade generation in TypeScript, and SHALL NOT contain hand-written color values presented as generated output.

#### Scenario: Shade data originates in Sass

- **GIVEN** the scale table provider
- **WHEN** it builds
- **THEN** every color it records is read from the result of compiling `shades()`
