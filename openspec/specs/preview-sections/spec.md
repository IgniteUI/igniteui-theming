## Purpose

How sections and views of the preview application register themselves, how the shell renders and routes them, and the shared elements a view may compose.

## Requirements

### Requirement: Sections and views are declared in a registry

The application SHALL read its structure from a registry of sections, each declaring an `id`, a display `title`, a short description, an optional persistent controls element, and an ordered list of views. Each view SHALL declare an `id`, a `title`, a one-line statement of what it teaches, its custom element tag, and a loader that imports its module.

#### Scenario: Navigation is derived from the registry

- **GIVEN** a registry containing the color section
- **WHEN** the shell renders
- **THEN** navigation lists exactly the registered sections in their declared order

#### Scenario: Adding a section requires no shell change

- **GIVEN** a new section added to the registry
- **WHEN** the application is rebuilt
- **THEN** the section appears in navigation and its views are reachable
- **AND** no file under the shell was modified

### Requirement: A section renders as one page with its controls pinned

The shell SHALL render every view of the active section on a single page, in declared order, beneath a bar that remains visible while the page scrolls. When the section declares a controls element, the shell SHALL render it into that bar and SHALL NOT read or write the state it owns.

#### Scenario: The nav follows the view being read

- **GIVEN** the reader has scrolled to the last view and then back to the first
- **WHEN** the navigation renders
- **THEN** it marks the view now at the top of the page, not the one that was left

#### Scenario: Controls stay visible while reading

- **GIVEN** a section whose views extend beyond one screen
- **WHEN** the reader scrolls to a later view
- **THEN** the section's controls remain on screen

#### Scenario: A section without controls renders unchanged

- **GIVEN** a section that declares no controls element
- **WHEN** it is displayed
- **THEN** its views render stacked as usual
- **AND** no empty control affordance is shown

#### Scenario: The shell holds no section-specific state

- **GIVEN** a section whose controls element changes its selection
- **WHEN** the views update
- **THEN** the change reached them without passing through the shell

### Requirement: A view's code and data load as it is approached

The shell SHALL import a view's module when that view nears the viewport rather than at page load, and SHALL show a placeholder in its frame until the module has loaded.

#### Scenario: Only the first view loads on arrival

- **GIVEN** a section with four views
- **WHEN** the application is first opened at the top of that section
- **THEN** the modules of views far below the viewport have not been requested

#### Scenario: A view loads before it is reached

- **GIVEN** a view that has not yet been imported
- **WHEN** the reader scrolls toward it
- **THEN** its module is imported before it is fully in view

### Requirement: Sections and views are addressable

The application SHALL route on the URL hash. `#/<section>` SHALL open that section; `#/<section>/<view>` SHALL additionally bring that view into view. An unrecognised or absent section SHALL resolve to the first registered section without raising an error. A section MAY carry its own selection in the hash as a query string, and writing that selection SHALL NOT be treated as navigation.

#### Scenario: A deep link opens a specific view

- **GIVEN** the color section contains a view with the id `scales`
- **WHEN** the application is opened at `#/color/scales`
- **THEN** the color section is active
- **AND** the scales view is brought into view

#### Scenario: An unknown route falls back

- **WHEN** the application is opened at `#/typography/kerning` and no such section is registered
- **THEN** the first section is displayed
- **AND** no error is surfaced to the reader

#### Scenario: A selection is carried by the link

- **GIVEN** a section whose controls have been changed from their defaults
- **WHEN** the current URL is reopened
- **THEN** the same selection is active

#### Scenario: Changing a selection does not move the page

- **GIVEN** the reader is looking at a view partway down the page
- **WHEN** they change a control in the pinned bar
- **THEN** the page does not scroll to another view

### Requirement: The shell frames views from registry metadata

The shell SHALL render a view's title and its statement of what it teaches, taking both from the registry. A view SHALL NOT be required to extend a base class, implement named rendering methods, or render that framing itself.

#### Scenario: The frame is consistent across views

- **GIVEN** two views in different sections
- **WHEN** each is displayed
- **THEN** both present their title and teaching statement in the same position and treatment
- **AND** neither view element renders that text itself

#### Scenario: A view declares no interface

- **GIVEN** a new view implemented as a custom element with no methods beyond rendering itself
- **WHEN** it is registered and displayed
- **THEN** it renders inside the frame without further adaptation

### Requirement: Recurring behaviour is offered, not imposed

The application SHALL provide shared elements for behaviour that recurs across views, including generated Sass with a copy control, a pass or fail readout, and applying a compiled palette to a subtree. A view SHALL be free to use none of them.

#### Scenario: A view with no honest verdict omits one

- **GIVEN** a view whose subject has no pass or fail measure
- **WHEN** it is displayed
- **THEN** no verdict readout is rendered
- **AND** the view is otherwise framed like any other

#### Scenario: A view with no reproducible snippet omits the code block

- **GIVEN** a view that does not correspond to a single Sass call
- **WHEN** it is displayed
- **THEN** no generated-Sass block and no copy control are rendered

#### Scenario: A shared element is reused rather than reimplemented

- **GIVEN** two views that both show generated Sass
- **WHEN** each renders its snippet
- **THEN** both use the shared code block element
- **AND** the copy control behaves identically in both

### Requirement: The application's own controls come from the library

Controls the application renders for itself — pickers, range inputs and action buttons — SHALL be components from `igniteui-webcomponents`, themed by the palette the application emits from the theming source under test rather than by the stylesheet those components shipped with. A control whose presentation the component cannot express MAY remain bespoke, and SHALL say so where it is built.

#### Scenario: A control is painted by the generator under test

- **GIVEN** a control rendered by one of the library's components
- **WHEN** the application applies its own palette at the document level
- **THEN** the control resolves its colors from that palette
- **AND** no rebuild of the component library was required

#### Scenario: A shipped component asks for a token the generator no longer emits

- **GIVEN** a component whose stylesheet references a token the current generator has replaced
- **WHEN** the application supplies its theme
- **THEN** the retired token is provided as an alias onto its replacement
- **AND** the control renders rather than losing that color

#### Scenario: A control stays bespoke for a stated reason

- **GIVEN** a control whose presentation the library's component cannot express
- **WHEN** it is left as a native element
- **THEN** the reason is recorded where the control is built

#### Scenario: Library controls do not compete with the subject

- **GIVEN** controls rendered above content whose colors are the subject of the page
- **WHEN** they are displayed
- **THEN** they are themed to the application's neutrals rather than to a chromatic family

### Requirement: Views are operable by keyboard

Every control a view exposes SHALL be reachable by keyboard, SHALL show a visible focus indicator, and SHALL be adjustable without a pointer. Controls that are dragged with a pointer SHALL also respond to arrow keys. A control that reports a value SHALL report the same value the application is using.

#### Scenario: A control and its label agree

- **GIVEN** a control whose value is also printed beside it
- **WHEN** the view first renders, before any interaction
- **THEN** the value the control holds is the value the label reports

#### Scenario: A dragged control responds to the keyboard

- **GIVEN** a view exposing a control point that is dragged with a pointer
- **WHEN** the control point has focus and an arrow key is pressed
- **THEN** its value changes by a defined step
- **AND** focus remains on that control point after the view re-renders

### Requirement: View styling is self-contained

A view SHALL apply the palettes it needs through a scope element within its own subtree rather than depending on classes applied by an ancestor, so that the view renders correctly when placed in a page other than this application.

#### Scenario: A view renders outside the shell

- **GIVEN** a view element placed in a page that does not include the application shell
- **WHEN** the page renders
- **THEN** the view's swatches resolve their palette custom properties
