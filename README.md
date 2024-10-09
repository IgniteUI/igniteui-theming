
<h1 align="center">
  Ignite UI Theming - from Infragistics 
</h1>

[![npm version](https://badge.fury.io/js/igniteui-theming.svg)](https://badge.fury.io/js/igniteui-theming)

The Ignite UI Theming repository collects a set of Sass mixins, functions, and variables used to create themes for a variety of UI frameworks built by Infragistics. The theming package makes it super easy to create palettes, elevations and typography styles for your projects.

## Palettes
We provide four predefined palettes - material, bootstrap, fluent and indigo that have all the necessary colors along with diffent variants of those colors to make it even easier picking the right one for your case. Here's what they look like:

![Palettes](https://user-images.githubusercontent.com/45598235/189592212-0d58b08d-3c98-4f27-8ec3-c6f674c9942b.png)

To access any of the colors in the palettes, you can use the `color` function:

```scss
background: color($light-material-palette, 'primary', 500);
```

You can take a further look on what color functions and mixins the package contains and how to use them in the [Colors Wiki Page](https://github.com/IgniteUI/igniteui-theming/wiki/Colors-(Draft))


## Typography
Another valuable module of our theming package is the typography, helping you have consistency all over your project. There are again four typography presets for the four themes that we provide out of the box.

![Typography](https://user-images.githubusercontent.com/45598235/189596034-d8697bc1-e683-4d4a-a113-96e17fc90d4b.png)

You can set any of the typefaces by using the `typography` mixin, which accepts 2 arguments(font-family and type-scale). By default the typography is using the material typeface and type-scale.

```scss
@include typography($font-family: $material-typeface, $type-scale: $material-type-scale);
```

Learn more about the typography module in the package by checking out the [Typography Wiki Page](https://github.com/IgniteUI/igniteui-theming/wiki/Typography-(Draft))

## Elevations
The theming package is providing one preset of shadows that can be used to give your components a lift. They're super helpful using with buttons, cards, navigation bars, etc.

![Elevations](https://user-images.githubusercontent.com/45598235/189627744-1fa47d35-6b3b-4b7a-b26e-5b46fe4311a4.png)

You can set elevations 0-24, by using the `elevation` function, which accepts the elevation level as an argument:

```scss
box-shadow: elevation(12);
```

Learn more about elevations and their abilities in the [Elevations Wiki Page](https://github.com/IgniteUI/igniteui-theming/wiki/Elevations-(draft))

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

## Testing and Debugging

### Preview Palettes
To preview a palette you can pass the palette (`material`, `bootstrap`, `fluent`, `indigo`) and variant (`light` or `dark`) to the `palette` and `variant` arguments respectively. If you want to output the result to a file in the `./dist` folder add the `out` option.

```
npm run preview:palette -- --palette=material --variant=light --out
```
