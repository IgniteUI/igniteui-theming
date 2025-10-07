# Getting started
  ## Overview 

  The Ignite UI Theming Framework provides a simple solution for implementing and applying design systems across platforms. It enables developers to define, customize, and maintain themes - covering colors, typography, spacing, elevations and more. Built on a rich set of Sass mixins and functions, the framework makes it easy to create reusable design tokens and apply them.

  ## Why we use SASS

  ### Why we chose SASS for our framework

  When building Ignite UI Theming, our goal was to make it easy to create consistent and flexible design systems. Native CSS variables are powerful, but on their own they don’t provide the tools needed to manage complex theme structures yet. Sass fills that gap. It's closer to a programming language thanks to its control flow and logical operators (if, for), data structures (map, list) as well as features like functions and mixins. These capabilities let us add logic, reuse code, and generate styles dynamically — things plain CSS still can’t do. By leveraging these advantages, SASS gave us the missing CSS capabilities we needed to build a theming framework that is organized, reusable, and easy to maintain.

  ### How SASS helps us
    
  **Structured data with maps and lists:**
  Sass provides maps and lists, which are perfect for modeling design systems. Palettes, typography scales, spacing, and elevations can all be stored in maps. This makes them easier to maintain, easier to reference, and easier to update. Change a value once, and it updates everywhere.

  **Reusable logic with functions and mixins:**
  Because CSS still doesn’t have functions and mixins, we cannot create reusable logic. Sass functions and mixins solve this by letting us encapsulate logic and reuse it across styles. Functions generate values and handle logic, while mixins define reusable blocks of styles that can be applied consistently.
    
  **Scalability with modules:**
  Sass modules let us split the Ignite UI Theming into logical parts (colors, typography, utilities, spacing, etc.) and import only what we need. This keeps the codebase organized, maintainable, and scalable.
    
  **A better developer experience**
  With just a few lines of Sass, a complete design system (palette, typography, elevations) can be generated and compiled into CSS variables. Developers don’t need to manually declare every variable — the framework handles the heavy lifting while still outputting clean, standards-based CSS. This allows developers to focus on design decisions instead of boilerplate.

  Since Ignite UI Theming is built with Sass, it works with any framework that supports Sass. As long as Sass is installed in your project, you can use Ignite UI Theming.
    
  ## Installation

  //[Installation structure like the Tailwind one]//

  The installation of Ignite UI Theming is quite simple. Since the theming package is available on npm, all you need is a prepared environment with the framework of your choice and Sass installed.

  After that, you are ready to install Ignite UI Theming:

  ```bash
    npm install igniteui-theming
  ```

  Below, we’ll show you a few examples of what we think is the best approach for setting up the environment, installing Sass, and adding the Ignite UI Theming.

  ### React + Next.js
  
  1. First, create a new project:

  ```bash
    npx create-next-app@latest my-app
    cd my-app
  ```

  During setup, choose the options you prefer — TypeScript or JavaScript, ESLint, etc.

  2. Next, install Sass. The simplest way is:

  ```bash
    npm install sass --save-dev
  ```

  3. With Sass installed, the next step is to install Ignite UI Theming:

  ```bash
    npm install igniteui-theming
  ```

  Finally, to start using Ignite UI Theming functions and mixins, import the theming framework in your .scss file:

  ```scss
    /* Path to node_modules may differ for different projects */
    @use '../node_modules/igniteui-theming/' as *; 
  ```

  That’s it — now your React project is ready to use Ignite UI Theming.

  ### Angular

  1. First, install the Angular CLI (if you don’t already have it):

  ```bash
    npm install -g @angular/cli
  ```

  2. Create a new project with Sass support:

  ```bash
    ng new my-angular-app --style=scss
  ```

  The nice thing about Angular is that it has first-class support for Sass, so you can enable it right from the project creation step.

  3. Next, install the Ignite UI Theming:

  ```bash
    npm install igniteui-theming
  ```

  Finally, to start using Ignite UI Theming functions and mixins, import the theming framework in your .scss file:

  ```scss
    /* Path to node_modules may differ for different projects */
    @use '../node_modules/igniteui-theming/' as *; 
  ```

  That’s it — now your Angular project is ready to use Ignite UI Theming.

  ### Vite

  1. First, create a new project:

  ```bash
    npm create vite@latest my-vite-app
    cd my-vite-app 
  ```

  During setup, select the framework and variant you prefer.

  2. Install Sass:

  ```bash
    npm install sass --save-dev
  ```

  3. Then install Ignite UI Theming:  

  ```bash
    npm install igniteui-theming
  ```

  Finally, to start using Ignite UI Theming functions and mixins, import the theming framework in your .scss file:

  ```scss
    /* Path to node_modules may differ for different projects */
    @use '../node_modules/igniteui-theming/' as *; 
  ```

  That’s it — now your Vite project is ready to use Ignite UI Theming.

  ## Editor setup 

  We would recommend, if you are using VS Code, to try the `Some Sass` extension. With its functionalities like code suggestions, go to definitions, finding references, and many more, it makes using and navigating Ignite UI Theming a lot easier.
    
# Core concepts 

  ## Colors

  ### Overview

  Color palettes are predefined sets of colors that serve as the foundation of our design system. Each palette groups together brand, neutral, and functional colors (such as primary, gray, success, warning, and other colors) into a consistent and reusable collection.

  By using color palettes, you ensure that components across the product share a consistent visual language. Instead of hardcoding values, you reference the palette variables, which makes it easy to:

  - Maintain consistency across all UI elements

  - Apply themes or brand updates quickly

  - Keep accessibility in mind with contrast-ready color pairs

  In practice, palettes act as the single source of truth for color usage. Updating a value in the palette automatically propagates through the entire framework, keeping design and code perfectly aligned.

  For example, let’s say your design system provides the following color palette: [Colors sample](Design_system_color.png)

  You can transform it into a usable SCSS palette as follows:

  ```scss
   $custom-palette: (
    'primary': (
      '500': #f34e4e,
    ),
    'secondary': (
      '500': #fff6ea,
    ),
    'actions': (
      '500': #7bb9fa
    ),
    'grey': (
      '500': #ebebeb
    ),
    'black': (
      '500': #282828
    )
   );

   @include palette($custom-palette);

   .wrapper {
     --bg : color($color: 'primary', $variant: 500);
     background-color: var(--bg);
     color: adaptive-contrast(var(--bg))
   };
  ```

  ### Manually Created Palettes

  To manually create a palette, first you would need to define a variable to hold all palette values. In the context of the Ignite UI Theming, palettes are declared as Sass maps, with map keys representing color groups (e.g., primary, secondary, surface). 
     
  Each color group is itself a map that defines its variants. Variants are key–value pairs: the key is the variant name (like 500 or 600) and the value is the actual color.

  There are no restrictions on:

  - How many color groups you define

  - How many variants each group contains

  - The format of the color value (hex, rgba, hsl() etc.)

  For example:

  ```scss
   $custom-palette: (
      'primary': (
        '500': #6797de,
        '500-contrast': white,
        '600': rgba(54, 129, 221, 1),
        '600-contrast': white
      )
   );
  ```
  It's important to know that the variant names ('500', '600', etc.) are the lowest map level that is supported by our functions and mixins, if you add more levels inside the variant key names, the map becomes unusable.

  When creating a palette map, both color groups and variants can be named however you like, the only requirement is that they are quoted strings.

  Palettes also support contrast colors. You can manually add a contrast color for any variant to ensure text or foreground elements remain readable. The only requirement is that the variant name must end with the `-contrast` suffix, so the Ignite UI theming contrast functions can recognize it.

  [!IMPORTANT] Always wrap map keys in quotes. For example: 'primary', 'secondary', 'gray', '500', '500-contrast'. Unquoted keys will not be recognized correctly.

  ### Palette Mixin

  After creating a palette map with your design system colors, you can include it using the palette mixin. This will generate CSS variables based on the map.

  [CSS Variables](./images/CSS_Variables.png)

  When the palette is passed to the mixin, it first checks whether it was included inside a selector. This is handled by the custom [is-root()](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/utilities/#function-is-root) function. If the mixin isn't inside a selector, the CSS variables are declared at the `:root` level.

  It then iterates through the palette map, processing each color group and variant with a custom mixin called `shade`. The `shade` mixin gathers the color group, variant and color of the passed map and creates new variables based on them. Which means that the names that we set in the map are what the variables are made with. 

  The generated variables follow this structure:

  ```scss
   --ig-{color-type}-{color-variant}: {color-value};
  ```

  For example:

  ```scss
   --ig-primary-500: #f34e4e;
  ```

  **Contrast parameters**

  In addition to the palette, the `palette` mixin also accepts contrast-related parameters such as `$contrast` and `$contrast-level`:
  
  - `$contrast`: a boolean (true or false). Determines whether CSS variables for contrast color calculations are included with the palette. (By default it's set to `true`)

  - `$contrast-level`: sets the [WCAG](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) contrast level (A, AA, or AAA) used when calculating adaptive contrast colors via the `adaptive-contrast()` function. (By default it's set to 'AA')
  
  If you want to change the [WCAG](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) contrast level, you can use the `$contrast-level` parameter and pass one of the three levels (in lowercase): 'a', 'aa', or 'aaa'. For example, if you set the level to AAA ('aaa'), all colors in this scope calculated with `adaptive-contrast()` will be recalculated to meet the AAA requirement.

  [WCAG Levels](./images/WCAG_Levels.png)

  To learn more about the `adaptive-contrast()` function, you can check out the [Adaptive contrast](#adaptive-contrasts) section.

  ### Accessing the CSS variables
  
  After the color variables are generated, there are a few ways to use them for styling in your application.

  One way is to use the color() function. Simply pass the color group and variant you want as parameters. The function then combines this information and resolves it to the correct CSS variable, based on the name assembled from the color group and variant.

  For example: 

  ```scss
    .wrapper {
      background-color: color($color: 'primary', $variant: 500);
    }
    ```

    Will result in the following at runtime:

    ```scss
    .wrapper {
      background-color: var(--ig-primary-500);
    }
  ```

  Now the background color is tied to the value of the `--ig-primary-500` variable. If you update the color value in the palette map at any point, every usage will be updated automatically—because you’re referencing the variable instead of hardcoding the value.

  This only works if the palette has already been included using the `palette` mixin. However, the `color()` function can also pull colors directly from a palette variable, even if that palette hasn’t been included with the mixin. To do this, use the `$palette` parameter:

  ```scss
   $custom-palette: (
      'primary': (
        '500': #f34e4e,
      ),
      'secondary': (
        '500': #fff6ea,
      )
   );

   .wrapper {
      background-color: color($palette: $custom-palette, $color: 'primary', $variant: 500);
   }
  ```

  Here, without including and declaring all palette variables, we selected and applied the `primary-500` color directly from the palette map to the element.

  The result will be:

  ```scss
   .wrapper {
     background-color: #f34e4e;
   }
  ```

  It’s important to note that in this case, the function returns the hex value directly and applies it as a hardcoded value. The benefit of using the `color()` function is that if the palette map value changes, this usage updates automatically, since the color is resolved through the function rather than hardcoded.

  **Opacity**

  Another useful parameter you can use with the `color()` function is `$opacity`. This lets you adjust a color’s opacity directly when selecting it.
  The function takes the resolved color variable and outputs a relative color with the specified opacity.

  For example: 

  ```scss
   .wrapper {
      background-color: color($color: 'primary', $variant: 500, $opacity: 0.5);
   }
  ```

  Will result in: 

  ```scss
   .wrapper {
      background-color: hsl(from var(--ig-primary-500) h s l / 0.5);
   }
  ```

  Opacity can also be applied when selecting the color directly from a palette map.

  ```scss
  $custom-palette: (
      'primary': (
        '500': #f34e4e,
      ),
      'secondary': (
        '500': #fff6ea,
      )
   );

  .wrapper {
      background-color: color($palette: $custom-palette, $color: 'primary', $variant: 500, $opacity: 0.5);
   }
  ```

  **Contrast Color**

  There is also a dedicated `contrast-color()` function, which works like the `color()` one, but is specifically designed for retrieving contrast variants. It works only if the palette includes colors with the '-contrast' suffix.

  For example, given a palette with a declared contrast color:

  ```scss
    $custom-palette: (
      'primary': (
        '500': #f34e4e,
        '500-contrast' : black
      )
    )
  ```

  You can select it like this:

  ```scss
    .wrapper {
      background-color: contrast-color($color: 'primary', $variant: 500);
    }
  ```

  This will result in:

  ```scss
    .wrapper {
      background-color: var(--ig-primary-500-contrast);
    }
  ```

  Just like with the `color()` function, you can also pass the `$opacity` parameter to adjust a color’s opacity directly when selecting it.

  For example:

  ```scss
   .wrapper {
      background-color: contrast-color($color: 'primary', $variant: 500, $opacity: 0.5);
   }
  ```

  Will result in: 

  ```scss
    .wrapper {
      background-color: hsl(from var(--ig-primary-500-contrast) h s l / 0.5);
    }
  ```

  **Using Variables Directly**
   
  Of course, it's not mandatory to use the `color()` or `contrast-color()` functions. You can always reference the generated CSS variables directly if you prefer:

  ```css
     background-color: var(--ig-primary-500);
  ```

  ### Auto-generated Palettes 

  If your design system only provides a single color per group but you need a complete palette with multiple variants, you can use the `palette()` function.

  This function automatically generates additional variants for each provided color group. The base color you pass becomes the 500 shade, and from it the function generates the following variants:

  - **5 lighter shades**: `50, 100, 200, 300, 400`

  - **4 darker shades**: `600, 700, 800, 900`

  - **4 accent colors**: `A100, A200, A400, A700`

  For every generated color, the function also calculates the best contrast color (black or white) and declares it with the '-contrast' suffix.
    
  **Generated color groups**

  Shade variants are generated for the following color groups: `primary, secondary, surface, gray, info, success, warn, error`

  Each type has its own role in the design system:

  - The **primary** and **secondary** colors are the two dominant colors for your brand.

  - The **surface** and **gray** colors impact the background and foreground colors. These two are usually displayed against one another. For that reason, if you provide both manually, the gray color should always contrast the surface color. If you only pass the surface color to the `palette()` function, the gray variants will be automatically calculated, depending on the luminance of the surface color:
   
  - If luminance is above 0.5 (lighter), `--ig-gray-500` will be set to dark gray hsl(0, 0%, 62%).

  - If luminance is below 0.5 (darker), `--ig-gray-500` will be set to light gray hsl(0, 0%, 74%).
   
  - The **surface** color is usually used for element backgrounds, while the **gray** color mostly covers borders, dividers, disabled states, and text colors. 

  [!IMPORTANT] (It's important to know that the **gray** colors only have the 50–900 shades generated, without accent colors.)

  - The **info**, **success**, **warn**, and **error** colors are additional colors, mainly used to indicate the states of elements, such as info messages, success indicators, warning highlights, and error states.

  **Using the palette() function**

  To automatically generate a full color palette, you can invoke the `palette()` function and pass the `$primary`, `$secondary`, and `$surface` colors, which are mandatory for variant generation.

  ```scss 
   $custom-palette: palette(
     $primary: #f34e4e,
     $secondary: #fff6ea, 
     $surface: #7bb9fa
   );

   @include palette($custom-palette);
  ```
  After that, include the newly created palette with the `palette()` mixin.

  The additional parameters that you can pass to the `palette()` function are:

  - **$gray** - the 500 shade of the gray color. If not provided, it will be automatically generated based on the passed `$surface` color.

  - **$info** - the 500 shade for the info color. By default, it uses #1377d5.

  - **$success** - the 500 shade for the success color. By default, it uses #4eb862.

  - **$warn** - the 500 shade for the warn color. By default, it uses #faa419.

  - **$error** - the 500 shade for the error color. By default, it uses #ff134a.

  After the parameters are passed to the function, the `shades()` function is executed for all color groups.
  The `shades()` function loads two predefined type lists:

  $IGrayShades → `('50','100','200','300','400','500','600','700','800','900')`

  $IColorShades → all of $IGrayShades + accent variants `('A100','A200','A400','A700')`

  These two lists act as templates for generating variants from the initial 500 shade value.

  After loading the lists, the function then iterates through each list, and for every variant calls the `shade()` function. This function retrieves the relevant saturation and lightness multipliers from a predefined map and uses them to calculate the new variant color.
  
  - For colors (primary, secondary, etc.), the $IColorShades list is used and both saturation and lightness multipliers are applied.

  - For gray, the $IGrayShades list is used and only the lightness multipliers are applied.

  #### Advanced 

  **How the variants are calculated**

  You can see how the multiplier maps look here: [Multipliers](https://github.com/IgniteUI/igniteui-theming/blob/master/sass/color/_multipliers.scss)

  As you can see we have all of the 14 variants for the color groups `($color)`, and the 9 variants for the gray color `($grayscale)`.
  
  After reviewing the map, let’s see how the variants are actually generated. Let’s take the **600 variant** as an example.
  [Generated variables](./images/Generated_variables.png)

  First, as you can see the `--ig-primary-500` uses the value we passed to our palette function, in this case, #f34e4e.

  To generate the `--ig-primary-600` color, we use the CSS relative color syntax and the function [hsl()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl#from_color). It first loads the `--ig-primary-500` value, keeps the **hue** unchanged, and multiplies the **saturation (s)** and **lightness (l)** by the relevant multipliers from the color multipliers map ($colors).

  The same process is applied for all other color variants, the only difference is the predefined multiplier values for each variant.

  [Multipliers](./images/Multipliers.png)

  [!NOTE] (Unfortunately, at the moment the type lists (`$IGrayShades`, `$IColorShades`) and multiplier maps (`$colors`, `$grayscale`) cannot be customized to produce variables based on your own template and multiplier values. We plan to add this functionality to the Ignite UI Theming very soon.)

  The contrast color variants, on the other hand, are calculated slightly differently. For their generation, the `shades()` function invokes the `adaptive-contrast()` function. You can see more about the contrast color calculations in the [Adaptive contrast](#adaptive-contrasts) section.

  ### Adaptive contrasts

  The Ignite UI Theming provides both a mixin and a function for the adaptive contrasts.
   
  The adaptive contrast mixin is especially useful when we are generating adaptive contrast colors with the adaptive-contrast() function. It sets the [WCAG](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) contrast level variables, which the `adaptive-contrast()` function uses to generate the correct contrast color. There are three [WCAG](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) levels - A, AA, and AAA. And to include them, you just need to pass the desired level (with lowerscore) to the mixin as parameter.

  For example:

  ```scss
    --ig-primary-500: #ee6c6c;

    @include adaptive-contrast($level: 'a');
      
     .wrapper {
      background-color: var(--ig-primary-500);
      color: adaptive-contrast(#{var(--ig-primary-500)});
      // The returned color will be 'white'
   };
  ```

  Because the `adaptive-contrast` mixin sets the WCAG level to 'A', the resulting color for the `.wrapper` class will be white.
  If we change the WCAG level to double or triple A ('aa' or 'aaa'), the resulting color will be black:

  ```scss
      --ig-primary-500: #ee6c6c;

      @include adaptive-contrast($level: 'aaa');
      
      .wrapper {
       background-color: var(--ig-primary-500);
        color: adaptive-contrast(#{var(--ig-primary-500)});
       // The returned color will be 'black'
      };
  ```

  The `adaptive-contrast()` function accepts a color value and, then dynamically calculates which of the two preset colors would be a better fit to be its contrast color - black or white. All of this based on the contrast level that is currently set by the mixin.

  The whole calculation is done by a few clever CSS functions and a little bit of math. We drew inspiration from Lea Verou and her article about [Contrast colors](https://lea.verou.me/blog/2024/contrast-color/#using-rcs-to-automatically-compute-a-contrasting-text-color) and especially from the [Lloyd Kupchanko demo](https://lea.verou.me/blog/2024/contrast-color/#addendum)

  [WCAG Levels](./images/WCAG_Levels.png)

  [Contrast calculations](./images/Contrast_calculations.png)


  ### Scoping

  Another interesting aspect of the palette mixin is that it only declares the palette variables in the current scope.

  If we include our palette with the mixin inside a selector, the variables will only be available within that selector and all its child elements. This allows multiple palettes to coexist in the same application, each used for different elements.

  For example, consider the following HTML structure:

  ```html
   <div class='wrapper'>
    <p class='first'>First text</p>
    <p class='second'>Second text</p>
   <div>
  ```

  And the corresponding SCSS:

  ```scss
   $palette-1: palette(
     $primary: #f34e4e,
     $secondary: #fff6ea, 
     $surface: #7bb9fa
   );

   $palette-2: palette(
     $primary: #66ed4bff,
     $secondary: #fff6ea, 
     $surface: #7bb9fa
   );

    .wrapper * {
     color: color($color: 'primary', $variant: 500);
    }

   .first {
     @include palette($palette-1);
   }
   .second {
     @include palette($palette-2);
   }
  ```

  In this example, all elements inside the `.wrapper` initially reference the `primary-500` color. However, because `$palette-1` is included in the `.first` scope, the `primary-500` color there is #f34e4e. In the `.second` scope, `$palette-2` is included, so the `primary-500` color becomes #66ed4b. This demonstrates how different palette scopes can coexist.

  ### Runtime changes

  As you already saw, all of the auto-generated color variants are based on the passed 500 variant color for each color group.
  A very useful feature of these auto-generated colors is that, since they are calculated dynamically, they can also be updated at runtime.

  This means all color variants of a given type can be recalculated simply by updating the 500 variant color.

  [Runtime change](./images/Runtime_change.gif)
  

  ## Typography

  ### Overview 

  Typography is the system that controls how text looks in your application — things like font, size, weight, and spacing. It makes sure that headings, body text, captions, and other text elements are consistent and readable across your application. A well-structured typography system helps maintain visual consistency and improves the overall user experience.

  In Ignite UI Theming, you define the font scales and styling properties you need, and the framework generates the corresponding CSS variables automatically, saving you from writing repetitive font declarations.

  With this approach, you can:

  - Build a complete type system from a single configuration.

  - Keep text styles consistent with your design system.

  - Apply type styles easily through mixins, functions, or ready-to-use CSS variables.

  The typography in Ignite UI Theming is generated by two main templates: the [$ITypeScale list](https://github.com/IgniteUI/igniteui-theming/blob/f82a03149a0882f9ac5e851d4c9cda06c6e09bc1/sass/typography/_types.scss#L9) and the [$ITypeStyle map](https://github.com/IgniteUI/igniteui-theming/blob/f82a03149a0882f9ac5e851d4c9cda06c6e09bc1/sass/typography/_types.scss#L14), these two templates define all font categories and font properties that will be generated for your typography.

  - The `$ITypeScale` list stores all type scales for which variables will be created. These scales are mandatory when generating typography variables. That means you must supply them whenever you use the typography functions and mixins.

  - The `$ITypeStyle` map stores all styling properties that will be created as variables for each type scale.

  By default the `$ITypeScale` list contains 13 type scales based on the Material Design system:
  
  ```scss
   $ITypeScale: (h1, h2, h3, h4, h5, h6, subtitle-1, subtitle-2, body-1, body-2, button, caption, overline);
  ```

  You are not required to use all of them, you can customize the list as needed.

  By default, `$ITypeStyle` map contains the following properties: 

  ```scss
    font-family: inherit,
    font-size: null,
    font-weight: normal,
    font-style: normal,
    line-height: normal,
    letter-spacing: normal,
    text-transform: none,
    margin-top: 0,
    margin-bottom: 0
  ```

  Each type style has a default value, which will be applied even if you don’t explicitly set it when including the typography.

  Let's say that you have the following typography in your design system: [Typography Sample](./images/Design_system_typography.png)

  The easiest way to convert the typography design system into a usable one is the following: 

  ```scss 
   @use '../node_modules/igniteui-theming/sass/typography/types' as * with (
      $ITypeScale: (h1, subtitle, body),
      $ITypeStyle: (
        font-family: inherit,
        font-size: null,
        font-weight: normal,
        line-height: normal,
      )
   );

   $custom-typography: type-scale(
    $h1: type-style(    
      $font-size: rem(24px),
      $font-weight: 500
    ),
    $subtitle: type-style(    
      $font-size: rem(20px),
      $font-weight: 400
    ),
    $body: type-style(    
      $font-size: rem(14px),
      $font-weight: 300
    )
   );

   @include typography($font-family: 'Inter, sans-serif', $type-scale: $custom-typography);

   .wrapper {
      @include type-style('body')
   }
  ```

  ### Manually creating a type scale 

  The first step is to change the `$ITypeScale` variable to match the styles defined in your design system. In our example, the list becomes: `h1, subtitle, body`.
  We also adjust `$ITypeStyle` to include only the properties we need, instead of the full default set.

  After defining the typography scale structure, we can set the properties for each style. This is done by creating a variable that holds the result of the `type-scale()` function. Each style is passed as a variable containing the return value of the `type-style()` function, where we define the styling properties.

  It's important to note that:

  - The names of the style category variables inside `type-scale()` and style properties inside `type-style()` must exactly match the keys in `$ITypeScale` and `$ITypeStyle`.

  - All style categories must be passed to the `type-scale()` function.

  - For styling properties, it is not necessary to pass all of them, since default values are applied automatically. (In the examples above, that would be `font-family` and `line-height`.)

  The `type-style()` function checks the properties you pass against `$ITypeStyle`.

  - If the property exists, it assigns the given value.

  - If the property does not exist, the function throws an error.

  - If you omit a property that has a default, the default value is used.

  For example, since we set font-size in `$ITypeStyle` to null, we are required to provide a font size whenever we call `type-style()`.

  The `type-scale()` function collects the style property maps for each type style (h1, subtitle, body) and verifies that the variables correspond to the `$ITypeScale` list. If everything is valid, it returns a complete map of all styles with their type properties. Note that all styles from `$ITypeScale` must be included. 

  The complete map, looks like this: 

  ```scss
   'h1': (
    'font-family': inherit, 
    'font-size': 2rem, 
    'font-weight': 300, 
    'line-height': normal
   ), 
   'subtitle': (
    'font-family': inherit, 
    'font-size': 1.25rem, 
    'font-weight': 400, 
    'line-height': normal
   ), 
   'body': (
    'font-family': inherit, 
    'font-size': 1.125rem, 
    'font-weight': 400, 
    'line-height': normal
   )
  ```

  ### Typography mixin 

  The `typography()` mixin is responsible for transforming type scale maps into a set of CSS variables.

  It accepts two mandatory parameters:

  - $font-family – the font family to use
  - $type-scale – the variable containing your custom type scales

  [!Note] The font family passed here has lower specificity than the font family defined in `$ITypeStyle` for each scale.

  After we include the `typography()` mixin, it first checks whether it is included inside a selector. This check is handled by the custom [is-root()](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/utilities/#function-is-root) function. If the mixin is not inside a selector, the CSS variables are declared at the `:root` level.

  Next, the font family passed into the mixin is declared as a variable for the current scope — `--ig-font-family`. 
  Along with it, another variable is declared — `--ig-base-font-size`. This base font size is retrieved from a [standalone file](https://github.com/IgniteUI/igniteui-theming/blob/f82a03149a0882f9ac5e851d4c9cda06c6e09bc1/sass/config/_index.scss#L1) and is mainly used for the calculation of the [rem(), em() and px()](/Utility%20concepts.md) functions.

  After that for all of the typography types in the type scale map, a custom mixin called `type-style-vars()` is included, which goes through every type and declares each of its style properties into a standalone CSS variable. 

  The result is a list of CSS variables that look like this:

  [Typography variables](./images/Typography_variables.png)


  ### Setting the CSS variables to elements

  After you have your CSS variables, it’s time to apply them to the elements in your application. The easiest way to apply a whole group of styles is by using the `type-style()` mixin. 
   
  You can pass the type style that you want to apply as a parameter, and then the mixin will check if the name of the style exists in the `$ITypeScale` variable. If it does, it will apply all the variables associated with that style — meaning all of the declared style property variables from `$ITypeStyle`.

  For example, if we have the following structure: 

  ```html
    <div class="wrapper">
      <h1>Heading text</h1>
      <p>Content text</p>
    </div>
  ```

  We can easily apply all of the generated `body` variables to the `p` element like this:

  ```scss
   .wrapper p {
       @include type-style($category: 'body');
   }
  ```

  Which will result in the following: 

  [Type_style](./images/Type_style_mixin.png)

  Except for the `$category` parameter, the mixin also accepts a `$check` parameter, which by default is set to `true`. 
   
  This parameter is responsible for checking if the passed category style exists in `$ITypeScale`. If set to `true` and the category is missing, no styling will be applied. If we set it to `false`, all styling parameters for the passed category will be applied, even if the category is not part of `$ITypeScale` and its styling variables are not declared.

  **Using Variables Directly**

  Of course, you are not required to use the `type-style()` mixin. You can always apply the generated CSS variables directly if you prefer:

  ```scss
    .wrapper p {
      font-family: var(--ig-font-family);
      font-size: var(--ig-body-font-size);
      font-weight: var(--ig-body-font-weight);
      line-height: var(--ig-body-line-height);
    };    
  ```

  ### Additional ways to use the CSS variables

  Apart from the `type-style()` mixin, we also provide two more mixins that make applying the generated CSS variables easier: `type-style-elements()` and `type-style-classes()`.

  **The type-style-elements()**

  The idea of the `type-style-elements()` mixin is to apply all of the generated category CSS variables directly to the elements they are meant for in the current scope. 
   
  For example, when included, all `h1` elements will automatically get the `h1` CSS variables applied. To do this, the mixin uses an additional map called [$IElementCategories](https://github.com/IgniteUI/igniteui-theming/blob/f82a03149a0882f9ac5e851d4c9cda06c6e09bc1/sass/typography/_types.scss#L29). In this map, the keys are the scale categories from `$ITypeScale`, and the values are the elements to which they will be applied. When included, the `type-style-elements()` mixin goes through this map and applies the CSS variables of each category to the corresponding elements, if those elements are present in the scope.

  By default the map looks like this:

  ```scss
   $IElementCategories: (
      'h1': 'h1',
      'h2': 'h2',
      'h3': 'h3',
      'h4': 'h4',
      'h5': 'h5',
      'h6': 'h6',
      'body-1': 'p',
   )
  ```

  Of course, you are free to edit it as you like.

  Let’s say we want to adjust it to use the type categories from our earlier example. If we have the following HTML structure:

  ```html
     <div class="wrapper">
      <h1>Title</h1>
      <h3>Subtitle</h3>
      <p>Content text</p>
    </div>
  ```

  And we want to apply:

  - the `h1` category variables to the `h1` element

  - the `subtitle` category variables to the `h3` element

  - the `body` category variables to the `p` element

  We would do the following:

  ```scss
   @use '../node_modules/igniteui-theming/sass/typography/types' as * with (
    $ITypeScale: (h1, subtitle, body),
    $ITypeStyle: (
      font-family: inherit,
      font-size: null,
      font-weight: normal,
      line-height: normal,
  ),
    $IElementCategories: (h1: 'h1', subtitle: 'h3', body: 'p')
  );

   .wrapper {
       @include type-style-elements();
   }
  ```

  That way, when we include the `type-style-elements()` mixin, the three elements (`h1`, `h3`, and `p`) will each get their corresponding generated CSS variables.

  [Type_elements_3](./images/Type_elements_3.png)
  [Type_elements_2](./images/Type_elements_2.png)
  [Type_elements_1](./images/Type_elements_1.png)

  **The type-style-classes()**

  Another way to apply the generated CSS variables is with the `type-style-classes()` mixin. When included, it creates classes for all categories in `$ITypeScale`. Each class has the corresponding CSS variables applied to the relevant properties. This gives you ready-to-use classes out of the box.

  These are especially useful when you have multiple elements of the same type but want to apply the style only to some of them. For example, if you have multiple `p` elements, you can assign the generated class only to the ones you want styled.

  The other useful benefit of the `type-style-classes()` mixin is that it helps keep your HTML semantically correct.
  For example, imagine that you want to use an `<h3>` tag for your main heading because of its visual size.
  That’s not ideal, since the first heading in a document should always be an `<h1>` to preserve proper semantic structure.

  With this mixin, you can use the correct `<h1>` element and apply the `typography__subtitle` class generated from the mixin to give it the appearance of an `<h3>`.
  This way, your document remains both semantically valid and visually consistent with your design.

  If you have multiple typographies included in your application, the `type-style-classes()` mixin allows you to have two completely different sets of styles for the same class it declares — each adapting automatically depending on which typography is used in the current scope.

  The naming convention for the classes is the following: 
   
  the selector in which they are included (in our case 'wrapper') + suffix with the category name beggining with two underscores (example '__h1')

  For example, if the parent selector is .wrapper and the category is h1, the class will be .wrapper__h1.

  Let's say that we have the following HTML structure:

  ```html
    <div class="wrapper">
      <h1>Heading text</h1>
      <h3>Subtitle</h3>
      <p>Content text</p>
      <p>Content text</p>
      <p>Content text</p>
    </div>
  ```
  And we included the `type-style-classes()` mixin. 

  ```scss
   @use '../node_modules/igniteui-theming/sass/typography/types' as * with (
    $ITypeScale: (h1, subtitle, body));

   .wrapper {
     @include type-style-classes();
   }
  ```

  Three classes will be created - `wrapper__h1`, `wrapper__subtitle` and `wrapper__body`.
   
  [Note] It's important to know that the mixin works with the `$ITypeScale` and creates classes for all categories mentioned there.

  So now the only thing we need to do is to set some of the new classes to the elements we want.

  ```html
    <div class="wrapper">
      <h1>Heading text</h1>
      <h3>Subtitle</h3>
      <p class="wrapper__body">Content text</p>
      <p>Content text</p>
      <p>Content text</p>
    </div>
  ```

  Now only the first `p` element will have the new generated `body` CSS variables applied to it.

  [Type_classes](./images/Type-style-classes.png)


  ## Elevations

  ### Overview

  Elevations are the shadows that give elements depth and a sense of layering in a design system. They help show which components are on top, which ones are grouped together, and which parts of the interface should draw the most attention.

  In our Ignite UI Theming, elevations are defined as reusable shadow styles that you can apply consistently across your project. Instead of writing box-shadow values by hand, you set up an elevation map with named elevation levels. From there, you can:

  - Use predefined mixins and functions to apply the elevation levels to elements.

  - Keep your elevation styles consistent with your design system.

  - Quickly adjust all shadows at once.

  This way, managing shadows becomes easier, more scalable, and always aligned with your design system.

  Let's say that you have the following elevations in your design system: [Elevations Sample](./images/Design_elevations.png)

  The easiest way to convert the elevation design system into a usable one is the following: 

  ```scss
  $custom-elevations: (
      'xs': 0 1px 2px 0 rgba(0 0 0 / 15%),
      'small': box-shadow(0 2px 4px 0 rgba(0 0 0 / 20%)),
      'medium': box-shadow(0 4px 6px -1px rgba(0 0 0 / 20%)),
      'large': box-shadow(0 8px 12px -2px rgba(0 0 0 / 25%)),
      'xl': box-shadow(0 12px 20px -4px rgba(0 0 0 / 30%)),
      '2xl': box-shadow(0 20px 40px -6px rgba(0 0 0 / 35%))
   );

  @include elevations($custom-elevations);

  .wrapper {
    box-shadow: elevation('medium');
  }
  ```

  ### Elevation map

  To get started, first you need to create a map with all the elevation levels from your design system as keys. For each key, assign the desired box-shadow as the value. You can either write the box-shadow directly (like the `xs` value in the example above) or use the `box-shadow()` function.

  The `box-shadow()` function accepts a single parameter in the standard box-shadow format. Each elevation level you define in the map will be declared.
  Using `box-shadow()` links each box-shadow to the `--ig-elevation-factor` variable, which acts as a multiplier and makes adjustments easier later. The function multiplies the passed box-shadow values by `--ig-elevation-factor` and returns a new list with the calculated box-shadow values.
  We’ll cover the [--ig-elevation-factor](#elevation-factor) variable in more detail below.

  ```scss
    // The passed box-shadow is 0 2px 4px 0 black
    $custom-elevations: (
      'small': box-shadow(0 2px 4px 0 black)
    );
    // The returned value from the box-shadow() function is: 0 0 calc(--ig-elevation-factor * 2px) calc(--ig-elevation-factor * 3px) black
  ```

  ### Including the elevations map

  Once your map is ready, you can include it in your application using the `elevations` mixin. Simply pass the map variable to the mixin. The mixin then iterates through all the keys in the map and declares a new CSS variable for each one, using the matching value.

  The generated variables follow this structure:

  ```scss
     --ig-elevation-{elevation-type}: {elevation-value};
  ```

  Here, `elevation-type` refers to the keys in the elevation map, and `elevation-value` are the values.

  For example:

  ```scss
     --ig-elevation-xs: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  ```

  Before the generation of the CSS variables, the `elevations` mixin first checks whether it is included inside a selector. This is handled by the custom [is-root()](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/utilities/#function-is-root) function. If the mixin is not inside a selector, the CSS variables are declared at the `:root` level. If it is inside a selector, the variables are scoped to that selector.

  The final result looks like this: 

  [Elevation vars](./images/Elevation_vars.png)

  ### Using the elevations CSS variables

  Once the CSS variables for all elevation levels in the map are created, you can apply them to your elements.

  To apply an elevation level, you can use the `elevation()` mixin. You just need to pass the level you want to use, and the mixin will return the box-shadow value of the specified elevation level.

  ```scss
  .wrapper {
    @include elevation('medium');
  }
  ```

  Another way is to use the `elevation()` function, which works similarly to the `elevation()` mixin. You just need to pass the level you want to use, and the function will return the box-shadow value of the specified elevation type.

  ```scss
  .wrapper {
    box-shadow: elevation('medium');
  }
  ```

  A benefit of the elevation() function is that you can easily stack two or more elevation levels together, as with the standard box-shadow CSS property.

  ```scss
  .wrapper {
    box-shadow: elevation('medium'), elevation('large');
  }
  ```

  Alternatively, you can reference the generated CSS variables directly if you prefer:

  ```scss
  .wrapper {
    box-shadow: var(--ig-elevation-medium);
  }
  ```

  ### Elevation factor

  All of the elevation variables generated from the `box-shadow()` function use a variable called `--ig-elevation-factor` in their calculation. This variable allows us to easily adjust the values of the elevations, acting as a multiplier for the returned box-shadow values. It is the ratio by which the provided sizes are multiplied. The default value is `1`.

  Let’s say we have the following scenario: all elements in our application have their appropriate elevations applied, and at some point we want to change the overall look by reducing all elevations by half. Normally, you would need to go back to your elevations map and manually cut all the box-shadow values in half.

  However, if we use the `box-shadow()` function, the `--ig-elevation-factor` is included in the box-shadow calculations. Every part of the box-shadow is multiplied by the value of `--ig-elevation-factor`. So, to cut the elevations in half, we only need to set `--ig-elevation-factor` to `0.5`, and all elevations in the application will adjust automatically. Similarly, to make the elevations twice as large, we can set the factor to `2`. This provides easy control over all elevations and a quick way to adjust them at once.

  Here’s an example:

  ```scss
   $custom-elevations: (
      'small': box-shadow(0 2px 4px 0 black),
   );

   :root {
      @include elevations($custom-elevations);
      --ig-elevation-factor: 2;
    }

   .wrapper {
      @include elevation('small');
    }
  ```

  [Note] ( The `box-shadow()` function doesn’t always need to be used in the elevation map. You can use it everywhere in your application. Everywhere it's used, it will still be linked to the `--ig-elevation-factor` variable and it will be changed when the `--ig-elevation-factor` changes, that way we can make some of our application elements to change easily.)

  [Elevation calculations](./images/Elevation_calcs.png)

  Here, with `--ig-elevation-factor: 2`, the applied box-shadow becomes `0 4px 8px 0 black`. If the factor had not been changed (default `1`), the box-shadow would remain `0 2px 4px 0 black`.

  [Important] The `--ig-elevation-factor` should be declared at the same or a higher scope than where the `elevations` mixin is included, so that all values are calculated correctly.


  ## Sizing and Spacing
  
  ### Sizing Overview
  
  The sizing system in Ignite UI Theming provides a consistent way to define and manage element dimensions. Instead of hardcoding fixed values, you can define up to three distinct size states — `small`, `medium`, and `large`, and switch between them dynamically.
  
  Key benefits of using the sizing system are:
  
  - Making it easy to switch between sizes globally or per component.
  - Reduces hardcoded values, improving maintainability.
  - Keeps your styles flexible and ready for growth.
  
  ```scss
  .wrapper {
    // Make the element sizable
    @include sizable();
  
    // Define sizes for small (10px), medium (20px), and large (50px)
    width: sizable($sm: 10px, $md: 20px, $lg: 50px);
  
    // Sets the element to use the medium size - (--ig-size-medium)
    --component-size: var(--ig-size-medium);
  }
  ```
  
  Here, the `.wrapper` element has assigned three different sizes: `10px`, `20px`, and `50px`, for its width property. These can be easily changed through the value of the `--component-size` variable, making the element’s width easily switchable.
  
  ### Setting up the sizes of the element
  
  **Sizable mixin**
  
  To make an element sizable, you first need to include the sizable mixin. Including the mixin declares three variables in the element’s scope: `--is-small`, `--is-medium`, and `--is-large`. Each variable holds a different calculation that determines which of the three sizes: `small`, `medium`, or `large`, is applied to the element. These variables are required in order to switch between the three sizes. 
  
  It’s important to note that only the element where the `sizable()` mixin is included becomes sizable. Child elements inside it will not automatically inherit this behavior.
  
  **Sizable function**
  
  After including the `sizable` mixin, you can define the three element sizes you want to switch between. To set the sizes, use the `sizable()` function on the CSS property you want to make sizable and pass the values you need. The function accepts up to three values: the first for the `small` size, the second for the `medium` size, and the third for the `large` size. You must provide at least one value. If you provide only two, the second value is applied to both the medium and large sizes.
  
  ```scss
  // Here the small value is 10px, and the medium and large values are 20px
  width: sizable($sm: 10px, $md: 20px);
  ```
  
  You can also assign the value returned by the function to a variable. (Remember to interpolate it, so only the returned value is stored.)
  
  ```scss
  // Define sizes for small (10px), medium (20px), and large (50px) in a variable
  --size: #{sizable($sm: 10px, $md: 20px, $lg: 50px)};
  width: var(--size);
  ```
  
  **Managing the size**
  
  After setting up the sizes with the `sizable()` function, you need to declare the `--component-size` variable. This variable is essential because it is used in the calculations for the `sizable()` mixin variables - `--is-small`, `--is-medium`, and `--is-large`. It must always be declared.
  
  The value of `--component-size` should be the size you want to apply to the sizable element. Sizes are determined by three predefined variables: `--ig-size-small`, `--ig-size-medium`, and `--ig-size-large`. Assigning one of these to `--component-size` applies the corresponding size to the element.
  
  - `--ig-size-small` uses the first value passed to the sizable() function.
  
  - `--ig-size-medium` uses the second value.
  
  - `--ig-size-large` uses the third value.
  
  You can also use numbers instead of the full variable names:
  
  - `--ig-size-small` -> `1`
  
  - `--ig-size-medium` -> `2`
  
  - `--ig-size-large` -> `3`
  
  So that way both of these approaches will be okay:
  
  ```scss
  .wrapper {
    ...
    --component-size: var(--ig-size-medium);
    --component-size: 2;
    ...
  }
  ```
  
  Both of those approaches will apply the medium size to the element.
  
  [Note](Setting `--component-size` to medium, for example, will cause all CSS properties that use the `sizable()` function in the current scope to be sized with the medium value.)
  
  You can also set `--component-size` to reference another variable and define a default size:
  
  ```scss
  // Hooks the element size to the --ig-size variable and sets the --ig-size-medium as the default size
   --component-size: var(--ig-size, var(--ig-size-medium));
  
  // Sets the element size to the large value
   --ig-size: var(--ig-size-large);
  ```
  
  This is especially useful if, for example, you want to change all child elements `--component-size` variable values simultaneously.
  
  **How the calculation is made**
  
  After the `--component-size` value is set, the calculations of the three variables: `--is-small`, `--is-medium`, and `--is-large`, determine which size is active. The selected size is assigned a value of `1`, while the others remain `0`. The `sizable()` function then multiplies these variables by the size values passed as parameters. Since two of them are `0`, only the active size produces a positive result in the calculation, and that value is applied to the element property.
  
  ```scss
  .wrapper {
    @include sizable();
    width: sizable($sm: 10px, $md: 20px, $lg: 50px);
    --component-size: var(--ig-size-medium);
  }
  ```
  
  In this example, the `--is-medium` variable becomes `1`, while the other two (`--is-small` and `--is-large`) remain `0`. This happens because the `--component-size` variable is set to `--ig-size-medium`. As a result, the parameters passed to the `sizable()` function: `$sm: 10px, $md: 20px, $lg: 50px`— resolve to `0, 20px, 0` after the calculations. 
  The function then uses the Sass `max()` function on the three values to extract the positive one — in this case, `20px` — and applies it to the element.
  
  ### Spacing Overview
  
  You also have the ability to set up the spacing of an element, just like the sizing. You can again set up three values, which you can easily switch between.
  The spacing system in Ignite UI Theming makes it easy to define consistent padding values for components. Just like with sizing, you can set up to three levels: `small`, `medium`, and `large` — and switch between them dynamically.
  
  Key benefits of using the spacing system are:
  
  - Apply consistent spacing across all components.
  - Adjust spacing globally or per element with a single variable.
  - Scale layouts easily without rewriting styles.
  
  ### Setting up the spacing of the element 
  
  Just like with the size, to set up the spacing of an element you also need to use the `sizable` mixin and the `--component-size` variable to switch between the three sizes.
  
  The difference from the sizable elements is that spacing values are set using the `pad()` function instead of the `sizable()` function.
  
  Here is a simple example of setting spacing for an element:
  
  ```scss
  .wrapper {
    // Make the element sizable
    @include sizable();
  
    // Define the paddings for small (10px), medium (20px), and large (50px)
    padding: pad($sm: 10px, $md: 20px, $lg: 50px);
  
    // Sets the element to use the medium size - (--ig-size-medium)
    --component-size: var(--ig-size-medium);
  }
  ```
  
  Here, the padding for all directions of the element is set to `20px`.
  
  [Note] (As with the 'sizable' elements, the `--component-size` variable can accept both named sizes and numbers — `1`, `2`, or `3`.)
  
  Just like the `sizable()` function, the `pad()` function also accepts up to three values: the first for the `small` size, the second for the `medium` size, and the third for the `large` size. You must provide at least one value. If you provide only two, the second value is applied to both the medium and large sizes.
   
  **How the calculation is made**
  
  The `pad()` function works in the same way as the `sizable()` function: based on the `--component-size` value, one of the three size variables (`--is-small`, `--is-medium`, and `--is-large`) is set to `1`, while the others remain `0`. The `pad()` function then multiplies these variables by the size values passed as parameters. Since two of them are `0`, only the active size produces a positive result in the calculations. The difference here is that, before the result is applied to the element’s property, it is also multiplied by a spacing factor, `--ig-spacing`, which acts as a multiplier for the values passed to the `pad()` function. We will discuss the multiplier in more detail in the next section about the [Spacing factor](#spacing-factor)
  
  **pad-inline and pad-block functions**
  
  In addition to the `pad()` function, there are two additional functions: `pad-inline()` and `pad-block()`. They can be used to style only the inline padding (left and right) or only the block padding (top and bottom). The two functions work the same way as the `pad()` function, but they tie the returned size calculations to different multipliers than the default `--ig-spacing`.
  
  - `pad-inline()` uses the `--ig-spacing-inline` multiplier.
  
  - `pad-block()` uses the `--ig-spacing-block` multiplier. 
  
  We highly recommend using `pad-inline()` only when styling the padding-inline property, and `pad-block()` only when styling the padding-block property. This ensures that all padding is tied to the correct multipliers and that you are applying padding only where it is needed.
  
  ```scss
  .wrapper {
    @include sizable();
  
    padding-inline: pad-inline($sm: 10px, $md: 20px, $lg: 50px);
    padding-block: pad-block($sm: 10px, $md: 20px, $lg: 50px);
  
    --component-size: var(--ig-size-medium);
  }
  ```
  
  ### Spacing factor
  
  As mentioned, the values returned by the `pad()` function all use the `--ig-spacing` variable in their calculations as a multiplier. This allows us to quickly scale the padding values. By default, `--ig-spacing` is set to `1`, meaning the returned values match the ones passed to the function. For example, if we set it to `2`, all returned values will be twice as large. This provides an easy way to increase or decrease the spacing for all elements at once, ensuring consistency and avoiding missed values.
  
  With the `--ig-spacing` variable, we can control the values of the provided padding for all three functions: `pad()`, `pad-block()`, and `pad-inline()`.
  Apart from the `--ig-spacing` variable, there are two additional specific variables we can use to multiply the passed paddings:
  
  - `--ig-spacing-inline` - which controls only the passed paddings to the `pad-inline()` function.
  
  - `--ig-spacing-block` - which controls only the passed padding to the `pad-block()` function.
  
  Apart from these two direction-based variables, there are also three additional size-based variables for each direction, allowing you to be even more specific when multiplying spacings:
  
  - `--ig-spacing-inline-small` - controls only the passed small size padding with the `pad-inline()` function.
  
  - `--ig-spacing-inline-medium` - controls only the passed medium size padding with the `pad-inline()` function.
  
  - `--ig-spacing-inline-large` - controls only the passed large size padding with the `pad-inline()` function.
  
  - `--ig-spacing-block-small` - controls only the passed small size padding with the `pad-block()` function.
  
  - `--ig-spacing-block-medium` - controls only the passed medium size padding with the `pad-block()` function.
  
  - `--ig-spacing-block-large` - controls only the passed large size padding with the `pad-block()` function.
  
  With these additional variables, we can be even more specific when controlling the spacings. This is another benefit of using the specific `pad-inline()` and `pad-block()` functions.
  
  [Important](All inline and block spacing multiplier variables only affect values passed to `pad-inline()` and `pad-block()`, while `--ig-spacing` affects all spacing values in all three functions. Be careful which multiplier variable you use.)
  
  Because there are multiple multipliers, they follow a specificity order. For example, if we use the following function:
  
  ```scss
    padding-inline: pad-inline($sm: 10px, $md: 20px, $lg: 30px);
  ```
  
  The most specific multiplier variable takes precedence:
  
  1. Size-specific variables: `--ig-spacing-inline-small`, `--ig-spacing-inline-medium`, `--ig-spacing-inline-large` (highest specificity).
  2. Direction-specific variables: `--ig-spacing-inline`.
  3. Default spacing variable: `--ig-spacing` (lowest specificity).
  
  So, if all of the variables are declared:
  
  ```scss
  .wrapper {
    @include sizable();
    padding-inline: pad-inline($sm: 10px, $md: 20px, $lg: 50px);
    --component-size: var(--ig-size-medium);
  
    --ig-spacing-inline-medium: 2;
    --ig-spacing-inline: 3;
    --ig-spacing: 4;
  }
  ```
  
  With the element size set to medium, `--ig-spacing-inline-medium` is applied, so the inline padding is `40px`.
  
  If the element size changes to small, `--ig-spacing-inline` is applied, and the inline padding becomes `30px`.
  
  If `--ig-spacing-inline` is removed and the element size is small or large, `--ig-spacing` is applied.
  
  ## Roundness

  ### Overview

  The Roundness system in Ignite UI Theming provides a consistent way to define and manage element border-radius. Instead of setting fixed values manually, you can define up to three different rounding levels: `default`, `minimum`, and `maximum`, and switch between them dynamically.

  Key benefits of using the Roundness system are:

  - Makes it easy to switch between rounding levels.

  - Reduces hardcoded border-radius values, improving maintainability.

  - Keeps your styles flexible and consistent across your application.

  ```scss
  .wrapper {
    border-radius: border-radius($radius: 10px, $min: 0px, $max: 20px);
    --ig-radius-factor: 1;

    // The border-radius in this example will be 20px
  }
  ```

  When using the Roundness system, there are two main factors that determine the border radius of an element: the `border-radius()` function, which defines the different border-radius values, and the `--ig-radius-factor` variable, which determines what value between the min and max will be applied.

  When using the Roundness system, there are two main factors that determine the border radius of an element: the `border-radius()` function, which defines the default value along with the minimum and maximum limits that can be applied, and the `--ig-radius-factor` variable, which determines which value between those limits will be used.

  ### Border-radius function 

  You can pass up to three values into the function, which can be used at different states:

  - First value (`$radius` parameter - default border radius): This value is always used when the `--ig-radius-factor` variable is not declared in the current scope.

  - Second value (`$min` parameter - minimum border radius): This value is applied when the `--ig-radius-factor` variable is declared and its value is `0`.

  - Third value (`$max` parameter - maximum border radius): This value is applied when the `--ig-radius-factor` variable is declared and its value is `1` or higher. 

  Only the first parameter, `$radius`, is required for the function to work. The `$max` parameter defaults to the `$radius` value, so if you don’t provide `$max`, it will use `$radius` instead. The $min parameter defaults to `0`, so if you don’t provide it, it will automatically be set to `0`.

  ```scss
   .wrapper {
   border-radius: border-radius($radius: 10px, $max: 20px);
   --ig-radius-factor: 0;

   // The border-radius here will be 0px;
   }
  ```

  **How the calculation is made**

  As mentioned earlier, if the `--ig-radius-factor` variable is not declared, the applied value defaults to the `$radius` value. In all other cases, when `--ig-radius-factor` is provided, the function relies on the CSS `clamp()` function to calculate the final value.
   
  The value of the `$min` parameter becomes the minimum of the `clamp()`, while the `$max` parameter becomes the maximum. The current value is then calculated by multiplying the `--ig-radius-factor` by the maximum value.

  - If `--ig-radius-factor = 1`: Current value will be → `1 * 20 = 20` → the maximum value (`20px`) is applied.
   
  [Note](If the value of `--ig-radius-factor` is greater than `1`, the maximum value will still be applied — in this case, `20px`.)

  - If `--ig-radius-factor = 0`: Current value will be → `0 * 20 = 0` → but since the minimum value is `5px`, the applied value is `5px`.

  - If `--ig-radius-factor = 0.75`: Current value will be → `0.75 * 20 = 15` → the applied value is `15px`.

  ### Radius factor

  The radius factor variable `--ig-radius-factor` is an important part of how the `border-radius()` function calculates the final value. It determines which of the provided border-radius values: `minimum`, `maximum`, or a value in between, will be applied. The radius factor acts as a multiplier applied to the maximum value, and the result of this calculation determines whether the border radius will be the `minimum`, the `maximum`, or a custom value between the two.

  - No radius factor declared → the first default (`$radius`) value is applied.

  - Radius factor = 0 → the minimum (`$min`) value is applied.

  - Radius factor = 1 → the maximum (`$max`) value is applied.

  - Radius factor between 0 and 1 → the border radius is calculated proportionally between `$min` and `$max`.

  ```scss
  // Here the border radius will be 5px
  .wrapper1 {
    @include border-radius($radius: 5px, $min: 0px, $max: 20px);
  }

  // Here the border radius will be 0px
  .wrapper2 {
    @include border-radius($radius: 5px, $min: 0px, $max: 20px);
    --ig-radius-factor: 0;
  }

  // Here the border radius will be 20px
  .wrapper3 {
    @include border-radius($radius: 5px, $min: 0px, $max: 20px);
    --ig-radius-factor: 1;
  }

  // Here the border radius will be 10px
  .wrapper4 {
    @include border-radius($radius: 5px, $min: 0px, $max: 20px);
    --ig-radius-factor: 0.5;
  }
  ```

  [Radius factor](./images/Radius_factor_calculations.png) 
  

# Utility concepts

Apart from the larger modules that Ignite UI Theming provides, there are also smaller utility functions and mixins designed to make your development process easier and more efficient. 
   
These utilities are lightweight, fast, and easy to use. They help you avoid repetitive code and keep your styles consistent across the application. Whether you need to convert values between units, apply ready-to-use animations, or simplify BEM selector creation, these tools are designed to save time and reduce complexity in your stylesheets.

  ## Converting functions

  Ignite UI Theming provides converting functions for easy and seamless conversion between relative units (`em`, `rem`) and absolute units (`px`).

  All conversions are based on the base font size defined in the Ignite UI Theming [config file](https://github.com/IgniteUI/igniteui-theming/blob/f82a03149a0882f9ac5e851d4c9cda06c6e09bc1/sass/config/_index.scss#L1). By default, this value is `16px`, but you can customize it when importing Ignite UI Theming in your SCSS file:

  ```scss
   /* Path to node_modules may differ for different projects */
   @use '../node_modules/igniteui-theming/' as * with (
     $base-font-size: 10px
   );
  ```

  With this setup, all converting functions will use `10px` as the base font size instead of `16px`, which will affect the results of your conversions.

  ### To px

  The `px()` function converts relative units (`em` or `rem`) into pixels. You simply provide the value via the `$num` parameter, and the function calculates the new value based on the base font size.

  ```scss
   .wrapper {
     margin: px($num: 3rem);
   }
  ```

  If you want to use a custom font size without modifying the global base font size when importing Ignite UI Theming, you can provide it using the `$context` parameter:

  ```scss
   .wrapper {
     margin: px($num: 3em, $context: 20px);
   }
  ```

  This will result in the following output:
   
  [Px convert](./images/Convert_px.png)

  ### To rem 

  The `rem()` function accepts pixel values and converts them into rem units. Just like the `px()` function, it also accepts two parameters:

  - `$pixels` – the pixel value you want to convert

  - `$context` – an optional custom base font size to use for the conversion

  ```scss
   .wrapper {
     margin: rem($pixels: 40px);
   }
  ```
  ```scss
   .wrapper {
     margin: rem($pixels: 40px, $context: 20px);
   }
  ```

  The above example will result in the following output in the application:

  [Rem convert](./images/Convert_rem.png)

  ### To em

  The `em()` function works just like the `rem()` one, with the same `$pixels` and `$context` parameters. The only difference is that it outputs values in `em` instead of `rem`.

  ```scss
   .wrapper {
     margin: em($pixels: 30px);
   }
  ```
  ```scss
   .wrapper {
     margin: em($pixels: 30px, $context: 20px);
   }
  ```

  This will result in the following output:

  [Em convert](./images/Convert_em.png)

  ## Animations

  ### Overview

  Ignite UI Theming also provides a set of predefined animations that you can use right away in your project.

  ```scss
   //include the 'fade-in-top' keyframes animation mixin
   @include fade-in-top();

   //include the animation mixin with parameters
   .wrapper {
     @include animation('fade-in-top' 3s linear infinite);
   }
  ```

  All predefined Ignite UI animations are stored as mixins, making them easy to include and reuse. When you include one of these animation mixins, it automatically calls another mixin - `keyframes`, which defines the `@keyframes` rule and sets up all the specific animation styles and values.

  [Keyframes](./images/Keyframes.png)

  The predefined list of animations includes groups such as `fade`, `slide`, `rotate`, `bounce`, and many more. Each group contains several different animations with unique styles. You can find the complete list here: [animations](http://infragistics.com/products/ignite-ui-angular/docs/sass/latest/animations/#mixin-animation)
   
  **Animation mixin**

  Once the animation keyframes are defined, you can apply the animation to an element using the `animation` mixin.
  This mixin works just like the CSS animation property: it takes the animation name and lets you specify additional properties such as `duration`, `delay`, `direction`, `iteration count`, and more.

  All of the values are combined into a list and applied as the value of the CSS animation property.

  [Animations](./images/Animations.png)
   
  You can also stack multiple animations in a single include:

  ```scss
   .wrapper {
     @include animation('fade-in-top' 3s linear infinite, 'rotate-in-center' 3s ease-in infinite);
    }
  ```

  *[Add a GIF showing the animation in the browser.]

  Apart from animations, Ignite UI Theming also exposes a set of predefined easing options that you can apply to your animations for smoother transitions. All of these predefined easings are based on the `Cubic Bezier` curve and use the `cubic-bezier()` function. Each easing has different values and is stored in a variable, such as `$ease-out-quad`. 
  
  To use one of them, you simply pass the variable name as a parameter in the `animation` mixin:

  ```scss
   .wrapper {
     @include animation('fade-in-top' 3s $ease-out-quad infinite);
   }
  ```

  Here we are using one of the predefined easings - `$ease-out-quad`, which has the value of - `cubic-bezier(0.25, 0.46, 0.45, 0.94)`. Ignite UI Theming provides many different easing options, and you can check the full list here: [easings](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/animations/)

  *[Add a GIF showing the animation in the browser with, and without easing.]

  ### Manual creation of animation mixins

  You also have the ability to create your own animation mixin, just like the predefined ones, and reuse it throughout your application.
  To create an animation mixin: 

  - First, create a mixin with the name of your choice.

  - Inside that mixin, include the `keyframes` mixin and pass the animation name as a parameter. *(We recommend using the same name for both the mixin and the keyframes parameter to keep things consistent.)* 
  When including the `keyframes` mixin, you also need to define the rules and styles that the animation will follow.

  - Once your custom mixin is ready, you can include it in your project and then apply it to elements using the `animation` mixin, just like you would with the predefined animations.

  ```scss
  // Creating the new animation
  @mixin new-animation {
    @include keyframes(new-animation) {
        0% {
            transform: rotateY(-180deg);
            opacity: 0;
        }

        100% {
            transform: rotateX(360deg);
            opacity: 1;
        }
     }
   }

   // Declaring the keyframe rules of the new animation
   @include new-animation();

   .wrapper {
    // Applying the new animation
    @include animation('new-animation' 3s $ease-out-quad infinite);
   }
  ```

  [New animation](./images/New_animation.png)
  [New animation keyframes](./images/New_animation_keyframes.png)

  ## BEM

  The Ignite UI Theming also offers functions and mixins that can make BEM class selector declarations easier. With them, you no longer need to manually type long and repetitive BEM class names in your styling files. You can choose between different functions and mixins to generate BEM selectors efficiently.

  For example, if you want to create a class consisting of a block, element, and modifier, you can use either the `bem-selector()` function or the `bem` mixin. Both will produce the same output, the only difference is which approach works best for you and your project.

  ```scss
    $selector: bem-selector(block, $elem: (elem, mod));
    
    #{$selector} {
      background: green;
    }
    
    // Both will return .block__elem--mod selectors

    @include bem(block, $elem: (elem, mod)) {
      background: blue;
    }
  ```
  ```html
   <div class="block__elem block__elem--mod">
     <h1>Heading text</h1>
     <p>Content text</p>
   </div>
  ```

  [BEM](./images/Bem.png)

  As you can see, with both the `bem-selector()` function and the `bem` mixin, you only need to provide the names for the block, element, and modifier parts of the class, and the selector is generated automatically. This isn’t the only way to use these functions and mixins, for example, you can also create multiple block modifiers using the same mixin and function.

  ```scss
   $selector: bem-selector(block, $elem: (elem, mod));
    
   #{$selector} {
    background: green;
   }

   // Both will return .block--mod-1.block--mod-2 selectors

   @include bem(block, $mods: (mod-1, mod-2)) {
    background: blue;
   }
  ```
  ```html
   <div class="block block--mod-1 block--mod-2">
     <h1>Heading text</h1>
     <p>Content text</p>
   </div>
  ```

  [Two modifiers](./images/Two_modifiers.png)

  There are many more possibilities and ways to create more advanced selectors with these and the other BEM functions and mixins that Ignite UI Theming offers. You can check them all out here:
  [BEM](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/bem/#function-bem-selector)


# Modularity

  It’s not necessary to include the entire Ignite UI Theming framework if you only need part of it, for example, just `typography`, `colors`, or `elevations`. The Ignite UI Theming is separated into several Sass modules, which can be imported and used independently.

  The available modules are:

  - `color` – Includes all color-related functions and mixins, such as `palette()`, `color()`, and `adaptive-contrast()`.

  - `typography` – Contains typography-related functions and mixins, such as `type-style()`, `type-scale()`, and `typography()`.

  - `elevations` – Provides all elevation functions and mixins, such as `elevation()` and `box-shadow()`.

  - `themes` – Provides component-oriented utilities like `sizable()`, `pad-inline()`, `pad-block()`, and `border-radius()`.

  - `animations` – Contains all predefined animations and easings, along with the functions and mixins for using them.

  - `bem` – Includes BEM helper functions and mixins for easily generating BEM class selectors.

  To use a specific module, simply import it in your Sass file rather than the entire theming package:

  ```scss
  // Use /igniteui-theming/ if you want to use the whole theming package with all its modules. 
  //@use '../node_modules/igniteui-theming/' as *; 

  // Use the specific module name, if you want to only use the specific module
  // Path to node_modules may differ for different projects
  @use '../../../node_modules/igniteui-theming/sass/color' as *;
  ```

  With this setup, only the `color` module will be included in your project, meaning you’ll have access to just the color-related functions and mixins like `palette()`, `color()`, `adaptive-contrast()`, etc.

# Advanced example

  //[A Figma example showing a design with all of it design tokens + pixel perfect example with the same element, right next to it, which have all of the design tokens from the Figma design declared and applied.]//
