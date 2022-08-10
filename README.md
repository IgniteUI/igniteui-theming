<h1 align="center">
  Ignite UI Theming - from Infragistics 
</h1>

The Ignite UI Theming repository collects a set of Sass mixins, functions, and variables used to create themes for a variety of UI frameworks built by Infragistics.

## Usage

In order to use the Ignite UI Theming in your application you should install the `igniteui-theming` package:

```
npm install igniteui-theming
```

Next, you will need to **use** it in the file that you want like this:

```scss
@use '.../node_modules/igniteui-theming/' as *;
```

You can also **use** just a fraction of the package:

```scss
@use '.../node_modules/igniteui-theming/sass/color' as *;
```

We provide presets for **material, bootstrap, fluent and indigo** themes for the color(light and dark palettes), typography and elevations fractions. You can import them into your scss file like this:

```scss
@use '.../node_modules/igniteui-theming/sass/typography/presets' as *;
```

You can read more about what the package contains on the [Wiki page](https://github.com/IgniteUI/igniteui-theming/wiki)

## Linting and Testing

To scan the project for linting errors, run

```
npm run lint
```

To run the suite of tests, run

```
npm run test
```

## Building and Running API Docs

To build the docs, run

```
npm run build:docs
```

To start the docs in your browser, run

```
npm run serve:docs
```
