## Purpose

The views of the preview application's color section, and the claims each one is responsible for showing.

## Requirements

### Requirement: One selection drives the whole color section

The color section SHALL offer a picker over the palettes the library ships and a theme picker, and every view in the section SHALL render the selection those pickers hold. A view SHALL NOT offer a seed input of its own.

#### Scenario: Changing the palette moves every view

- **GIVEN** the color section with a palette selected
- **WHEN** the reader selects a different shipped palette
- **THEN** the ramps, the surface roles and the scale editor all render the newly selected palette

#### Scenario: A view offers no competing seed

- **GIVEN** any view in the color section
- **WHEN** it is displayed
- **THEN** it exposes no control that sets a seed independently of the section's pickers

### Requirement: The seeds are read from the shipped palettes

The seeds every color view renders SHALL be read from the shipped palette definitions at build time rather than transcribed, and the fitted side of any comparison SHALL be regenerated from exactly those seeds.

#### Scenario: A comparison starts from one input

- **GIVEN** a shipped palette and its regenerated counterpart
- **WHEN** both are rendered
- **THEN** both were produced from the same recorded seeds

#### Scenario: Changing a shipped seed changes the page

- **GIVEN** a preset whose seed is edited in the library
- **WHEN** the application is rebuilt
- **THEN** the views render the new seed without any change to the application's own source

### Requirement: The color section presents the generator comparison

The color section SHALL include a view that renders the selected palette's ramps from both generators, with the same shade in the same column, so that the two can be compared directly.

#### Scenario: Both generators are shown for one family

- **GIVEN** a family in the selected palette
- **WHEN** the view renders
- **THEN** the legacy ramp and the fitted ramp are shown one above the other
- **AND** the shade at a given index occupies the same column in both

#### Scenario: A shade with no color of its own is marked

- **GIVEN** a shade that resolves to the same color as another in its row
- **WHEN** the row renders
- **THEN** that shade is marked
- **AND** the shades it matches are named on inspection

### Requirement: Any two shades can be measured against each other

The color section SHALL let a reader pick a shade number, after which every strip numbered on that scale reports each of its shades' contrast against its own shade of that number, with the strongest WCAG grade the ratio earns. The pick SHALL apply across the section rather than to the strip it was made in, SHALL be operable without a pointer, and SHALL be clearable.

The section SHALL NOT report a count of failures in place of this. A count answers whether the generator's own guarantee held; a reader is choosing two colors to put together, which is a question about an arbitrary pair.

#### Scenario: Both generators answer at once

- **GIVEN** a shade number is picked
- **WHEN** the legacy and fitted rows render
- **THEN** each reports its own ratio between that shade and every other
- **AND** the guarantee can be read off the two rows rather than taken on trust

#### Scenario: A pairing that clears nothing is not dressed as a failure

- **GIVEN** a pairing below every WCAG threshold
- **WHEN** it renders
- **THEN** it shows its ratio without a grade
- **AND** nothing emphasises it over the pairings that do clear, which are what the reader is looking for

#### Scenario: Rows on another scale are unaffected

- **GIVEN** a row whose shades are not numbered on the picked scale, such as accents
- **WHEN** a shade number is picked
- **THEN** that row goes on reporting against its own anchor

#### Scenario: The pick is operable from the keyboard

- **GIVEN** focus inside a strip
- **WHEN** an arrow key is pressed
- **THEN** the pick moves to the adjacent shade
- **AND** Escape clears it

### Requirement: The color section presents surface and grayscale on the page

The color section SHALL include a view that shows the selected palette's surface roles applied to interface elements, alongside the numbered surface ramp the legacy generator produces, and the grayscale measured against the page rather than against white.

#### Scenario: Surface roles are shown in use

- **GIVEN** the selected palette
- **WHEN** the view renders
- **THEN** each generated surface role is shown applied to an interface element rather than only as a swatch

#### Scenario: A role with no room is reported, not hidden

- **GIVEN** a page color at an extreme of the range
- **WHEN** a role resolves onto the background
- **THEN** the view states that rather than showing an apparent difference

#### Scenario: The default gray scale's trade is stated

- **GIVEN** the grayscale ramp under the default scale
- **WHEN** it fails a pair five shades apart
- **THEN** the view attributes that to the scale the gray family defaults to rather than to the generator

### Requirement: The sweep view covers every hue at several saturations

The color section SHALL include a view that sweeps the seed hue across all 360 degrees at more than one saturation, showing both generators' ramps at the selected seed and reporting, for each, how many of its pairs five shades apart clear WCAG AA and how many shades fall outside sRGB. The view SHALL let the reader change saturation as well as hue.

#### Scenario: Changing the hue updates both ramps

- **GIVEN** the sweep view at a given hue
- **WHEN** the reader moves the hue control
- **THEN** both ramps and both verdicts update to that hue

#### Scenario: Clamped shades are marked

- **GIVEN** a hue at which the legacy generator requests a color outside sRGB
- **WHEN** the view renders that ramp
- **THEN** each affected shade is marked as clamped
- **AND** the verdict states how many shades were clamped

#### Scenario: The fitted generator reports no failures anywhere in the grid

- **WHEN** the reader sweeps the full hue range at any available saturation
- **THEN** the fitted verdict reports no AA-pair failures and no clamped shades

#### Scenario: Saturation changes the seed under test

- **GIVEN** the sweep view at a given hue
- **WHEN** the reader changes saturation
- **THEN** both ramps are rebuilt from the seed at that hue and saturation

#### Scenario: The summary does not overstate the gamut result

- **WHEN** the view summarises out-of-gamut shades across the grid
- **THEN** the figure reflects the whole grid rather than its most saturated row alone

### Requirement: The sweep view explains the cause

The sweep view SHALL include a view of the sRGB gamut at the selected hue, plotting lightness against chroma, showing where each generator places its shades, and distinguishing a shade's requested position from the position it resolved to when the request fell outside the gamut.

#### Scenario: The gamut region follows the selected hue

- **GIVEN** the cross-section is displayed
- **WHEN** the reader changes the hue
- **THEN** the plotted region and the marked cusp change to those of the new hue

#### Scenario: A clamped request is shown as displaced

- **GIVEN** a shade whose requested position lies outside the gamut
- **WHEN** the cross-section renders
- **THEN** the requested position is marked distinctly from the resolved position
- **AND** the two are visibly connected

### Requirement: The scales view makes range and curve editable

The color section SHALL include a view presenting each shipped scale flavor with its resulting ramp, and allowing the reader to set a contrast range and manipulate a cubic-bezier curve, showing the resulting shades and the effect on the AA guarantee. Its subjects SHALL be those the selected palette actually has — its chromatic family and its neutral on the page in use — and it SHALL report the highest contrast the selected subject can reach.

#### Scenario: Subjects follow the selection

- **GIVEN** the scales view with one palette selected
- **WHEN** the reader selects a different palette
- **THEN** the subject list is the subjects of the newly selected palette
- **AND** the reader's place is kept rather than reset where the new list allows it

#### Scenario: Selecting a flavor loads its scale

- **GIVEN** the scales view
- **WHEN** the reader selects a scale flavor
- **THEN** the range and curve controls take that flavor's values
- **AND** the ramp shows the shades that flavor produces

#### Scenario: The guarantee responds to the curve

- **GIVEN** a scale whose pairs five apart all clear AA
- **WHEN** the reader moves a control point so the light end bunches
- **THEN** the pairs that no longer clear AA are shown as failing

#### Scenario: A neutral family is anchored to its page

- **GIVEN** the scales view with a neutral subject on a dark page selected
- **WHEN** its ramp renders
- **THEN** contrast is reported against that page rather than against white
- **AND** the ramp runs from near the page color toward its opposite

#### Scenario: A subject that cannot reach the range says so

- **GIVEN** a subject whose highest reachable contrast is below the top of the range
- **WHEN** the reader raises the range above it
- **THEN** the view reports the ceiling rather than showing shades that appear to reach it

#### Scenario: Every flavor's record is computed, not asserted

- **GIVEN** a scale flavor and a selected subject
- **WHEN** the view reports how many pairs clear AA
- **THEN** that count is derived from the compiled shades for that seed rather than from a stored figure

### Requirement: A view that corresponds to one Sass call emits it

A view whose state corresponds to a single call SHALL show that call, including any `$scales` or `$generator` argument, and SHALL offer a control that copies it.

A view whose subject is not one call SHALL omit the snippet rather than print something that does not reproduce what is on screen — a grid of a thousand seeds is not a call, and a facet of a call another view already shows would only be a second copy of it.

#### Scenario: Editing the scale updates the snippet

- **GIVEN** the scales view with a modified curve
- **WHEN** the snippet is displayed
- **THEN** it contains a `$scales` entry carrying the current range and curve values

#### Scenario: A view that is not one call shows no snippet

- **GIVEN** a view whose subject spans many seeds, or one already reproduced by another view's snippet
- **WHEN** it renders
- **THEN** no generated-Sass block is shown
