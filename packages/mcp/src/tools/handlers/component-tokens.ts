import {
  COMPONENT_METADATA,
  COMPONENT_NAMES,
  getComponentSelector,
  getCompoundComponentInfo,
  getTokenDerivationsForChild,
  getVariants,
  hasVariants,
  isCompoundComponent,
  resolveComponentTheme,
  searchComponents,
} from "../../knowledge/index.js";
import type { GetComponentDesignTokensParams } from "../schemas.js";

export async function handleGetComponentDesignTokens(
  params: GetComponentDesignTokensParams,
) {
  const { component } = params;
  const normalizedName = component.toLowerCase().trim();

  const resolution = resolveComponentTheme(normalizedName);
  const theme = resolution?.theme;

  if (!theme) {
    if (resolution?.error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `**Error:** ${resolution.error}

Use a valid component name or update component metadata to point to a valid theme.`,
          },
        ],
        isError: true,
      };
    }

    // Component not found - provide helpful suggestions
    const suggestions = searchComponents(normalizedName);

    // If no suggestions from search, show a subset of available components
    const componentList =
      suggestions.length > 0
        ? suggestions.slice(0, 10)
        : COMPONENT_NAMES.slice(0, 20);

    return {
      content: [
        {
          type: "text" as const,
          text: `Component "${component}" not found.

${suggestions.length > 0 ? "**Similar components:**" : "**Available components (partial list):**"}
${componentList.map((c) => `- ${c}`).join("\n")}

${suggestions.length === 0 ? `\nTotal available: ${COMPONENT_NAMES.length} components. Use a more specific name to search.` : ""}

**Tip:** For button variants, use specific names like "flat-button", "contained-button", "outlined-button", or "fab-button".`,
        },
      ],
    };
  }

  // Build response parts
  const responseParts: string[] = [];

  // 1. Opening instruction line
  responseParts.push(
    `Implement a theme for the \`${normalizedName}\` component using the following guidance.`,
  );
  responseParts.push("");

  // 1b. Child component relationship note
  const metadata = COMPONENT_METADATA[normalizedName];

  if (metadata?.childOf) {
    const parentName = metadata.childOf;

    responseParts.push(
      `**Note:** \`${normalizedName}\` is a child of the \`${parentName}\` component. Its styling is controlled through the \`${parentName}\` theme — all tokens below apply at the ${parentName} level.`,
    );
    responseParts.push("");
  }

  // 2. Theme function
  responseParts.push(`**Theme Function:** \`${theme.themeFunctionName}()\``);
  responseParts.push("");

  // Variants hint for base components
  if (hasVariants(normalizedName)) {
    const variants = getVariants(normalizedName);

    responseParts.push("**Note:** This component has variant-specific themes:");
    responseParts.push(variants.map((v) => `- \`${v}\``).join("\n"));
    responseParts.push("");
    responseParts.push(
      "Consider using the specific variant theme for more targeted styling.",
    );
    responseParts.push("");
  }

  if (isCompoundComponent(normalizedName)) {
    const compoundInfo = getCompoundComponentInfo(normalizedName);

    if (compoundInfo) {
      // 3. Compound Component description
      responseParts.push("**Compound Component:**");
      responseParts.push(compoundInfo.description);
      responseParts.push("");

      // 4. Related themes list
      responseParts.push(
        `**Related themes:** ${compoundInfo.relatedThemes.map((t) => `\`${t}\``).join(", ")}`,
      );

      // 5. Scoping instruction with per-platform parent selectors
      const angularSelectors = getComponentSelector(normalizedName, "angular");
      const wcSelectors = getComponentSelector(normalizedName, "webcomponents");

      const platformLines: string[] = [];
      if (angularSelectors.length > 0) {
        const selectorText =
          angularSelectors.length === 1
            ? angularSelectors[0]
            : angularSelectors.join(" | ");
        platformLines.push(`- **Angular:** \`${selectorText}\``);
      }
      if (wcSelectors.length > 0) {
        const selectorText =
          wcSelectors.length === 1 ? wcSelectors[0] : wcSelectors.join(" | ");
        platformLines.push(
          `- **Web Components / React / Blazor:** \`${selectorText}\``,
        );
      }

      if (platformLines.length > 0) {
        responseParts.push(
          "Scope all related themes under the parent component selector:",
        );
        responseParts.push(platformLines.join("\n"));
      }
      responseParts.push("");

      // 6. Token derivations (platform-agnostic)
      const derivationRows = compoundInfo.relatedThemes.flatMap(
        (relatedTheme) => {
          const derivations = getTokenDerivationsForChild(
            normalizedName,
            relatedTheme,
          );

          return Object.entries(derivations).map(([token, derivation]) => {
            const transformDesc =
              derivation.transform === "identity"
                ? `same as \`${derivation.from}\``
                : `\`${derivation.transform}\` of \`${derivation.from}\``;

            return `| \`${relatedTheme}\` | \`${token}\` | ${transformDesc} |`;
          });
        },
      );

      responseParts.push("**Token derivations:**");

      if (derivationRows.length > 0) {
        responseParts.push("| Theme | Token | Derivation |");
        responseParts.push("| --- | --- | --- |");
        responseParts.push(derivationRows.join("\n"));
      } else {
        responseParts.push("None.");
      }

      responseParts.push("");

      // 7. Guidance
      if (compoundInfo.guidance) {
        responseParts.push("**Guidance:**");
        responseParts.push(compoundInfo.guidance);
        responseParts.push("");
      }
    }
  }

  // 8. Primary Tokens (for both compound and simple)
  if (theme.primaryTokens && theme.primaryTokens.length > 0) {
    responseParts.push("**Primary Tokens:**");

    for (const pt of theme.primaryTokens) {
      responseParts.push(`- \`$${pt.name}\` — ${pt.description}`);
    }

    if (theme.primaryTokensSummary) {
      responseParts.push("");
      responseParts.push(theme.primaryTokensSummary);
    }

    responseParts.push("");
  }

  // 9. Available Tokens table
  if (theme.tokens.length > 0) {
    responseParts.push(`**Available Tokens (${theme.tokens.length}):**`);
    responseParts.push("");
    responseParts.push("| Token Name | Type | Description |");
    responseParts.push("|------------|------|-------------|");

    for (const token of theme.tokens) {
      // Clean up description - remove newlines and extra whitespace
      const cleanDesc = token.description.replace(/\s+/g, " ").trim();

      responseParts.push(
        `| \`${token.name}\` | ${token.type} | ${cleanDesc} |`,
      );
    }

    responseParts.push("");
  } else {
    responseParts.push(
      "**No customizable tokens available for this component.**",
    );
    responseParts.push("");
  }

  // 10. Next step
  responseParts.push("---");
  responseParts.push(
    "**Next step:** Use `create_component_theme` with the tokens above to generate Sass/CSS code.",
  );

  return {
    content: [
      {
        type: "text" as const,
        text: responseParts.join("\n"),
      },
    ],
  };
}
