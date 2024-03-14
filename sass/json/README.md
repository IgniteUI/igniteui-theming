# What is this?

This folder contains generator files that can be used by the `src/buildJSON.mjs` script to produce JSON files containing serialized information about various parts of the theming package (ex. palettes, typography, elevations, etc.);

The `generators.scss` file contains declarations for how each of the JSON files should be generated, where each file should be placed and what its contents are. 

To achieve this a small [DSL](https://en.wikipedia.org/wiki/Domain-specific_language) on top of CSS is used. A tiny [parser](../../scripts/parser.mjs) handles the transformation of this custom CSS into JSON.

From this point on, this document explains the syntax of the DSL.

## Base Syntax

#### Example of the DSL syntax (Input)
```css
/*
* @outputDir - /custom
*/
example {
  --content: "Hello, World!"
}
```

The declaration above will produce the following JSON file when `$ npm run build:json` is run.

#### Output (`igniteui-theming/json/custom/example.json`)

```json
{
  "content": "Hello, World!"
}
```

To generate a new JSON file, you need to add a new `scss` document in this folder or update the contents of the `generators.scss` file.

### Specifying output directory for the JSON file

The output directory is specified using a comment directly above the declaration body with a string marker of `@outputDir` separated by a `-` followed by the desired location of the generated JSON file relative to the `json` directory located at the root of this project(see the example above). If no comment is specified, the last existing comment specifying an `@outputDir` will be used. If there's no other comment above the declaration specifying an `@outputDir`, the declaration is ignored and no output file is generated.

### JSON declaration

```css
example {
  --content: "Hello, World!"
}
```

Given the above snippet, the first present selector, i.e. `example`, will be used as the name of the JSON file. Any custom property declaration in the body of the selector, in this case `--content`, will be used to generate a key within the generated JSON file. The opening `{` and closing `}` braces define the scope of the JSON object. The value that will be assigned to the `content` key is anything to the right of the `:`.

##### Grouping several keys together into an object:

###### Input
```css
example {
  > group > x {
    --a: 'a';
  }

  > group > y {
    --b: 'b';
  }
}
```

The declaration above produces the following JSON:

###### Output
```json
{
  "group": {
    "x": {
      "a": "a"
    },
    "y": {
      "b": "b"
    }
  }
}
```

The `>` operator defines nested structures within the current JSON object. If the parser encounters common denominators like `group` it will group the statements, in this case `x` and `y`, together in the `group` object.

##### Handling array-like objects

You can produce arrays in the JSON file by declaring an array-like object as the value of a key.

###### Example
```css
example {
  --array-like: [1, a, 2.4];
}
```

###### Output
```json
{
  "array-like": ["1", "a", "2.4"]
}
```

**NOTE**: The array-like only supports simple values (strings and numbers). You can't pass in an object block and expect to get a valid JSON.

#### Generating the JSON Files

To generate the JSON files run:

```sh
npm run build:json
```
