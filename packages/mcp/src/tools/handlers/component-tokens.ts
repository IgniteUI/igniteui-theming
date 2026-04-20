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

  const primaryNames = new Set(
    (theme.primaryTokens ?? []).map((pt) => pt.name),
  );

  if (theme.primaryTokens && theme.primaryTokens.length > 0) {
    responseParts.push("**\u2705 Primary Tokens \u2014 USE THESE:**");
    responseParts.push("");
    responseParts.push(
      "Use ONLY these tokens when creating the initial theme. " +
        "The framework auto-derives all other tokens from these.",
    );
    responseParts.push("");
    responseParts.push("| Token Name | Type | Description |");
    responseParts.push("|------------|------|-------------|");

    for (const token of theme.tokens) {
      if (primaryNames.has(token.name)) {
        const cleanDesc = token.description.replace(/\s+/g, " ").trim();
        responseParts.push(
          `| \`${token.name}\` | ${token.type} | ${cleanDesc} |`,
        );
      }
    }

    if (theme.primaryTokensSummary) {
      responseParts.push("");
      responseParts.push(theme.primaryTokensSummary);
    }

    responseParts.push("");
  }

  if (isCompoundComponent(normalizedName)) {
    const compoundInfo = getCompoundComponentInfo(normalizedName);

    if (compoundInfo) {
      if (compoundInfo.composed) {
        responseParts.push("**Composed Compound Component:**");
        responseParts.push(compoundInfo.description);
        responseParts.push("");
        responseParts.push(
          "\u26a1 **This is a composed component.** The framework automatically generates internal derived " +
            "themes for all child components from the PRIMARY tokens. " +
            "**Do NOT create separate themes** for the related components listed below \u2014 " +
            "unless instructed otherwise by the user.",
        );
        responseParts.push("");
        responseParts.push(
          `**Internally themed children (auto-derived):** ${compoundInfo.relatedThemes.map((t) => `\`${t}\``).join(", ")}`,
        );
        responseParts.push("");

        if (compoundInfo.guidance) {
          responseParts.push("**Guidance:**");
          responseParts.push(compoundInfo.guidance);
          responseParts.push("");
        }
      } else {
        responseParts.push("**Compound Component:**");
        responseParts.push(compoundInfo.description);
        responseParts.push("");

        responseParts.push(
          `**Related themes:** ${compoundInfo.relatedThemes.map((t) => `\`${t}\``).join(", ")}`,
        );

        const angularSelectors = getComponentSelector(
          normalizedName,
          "angular",
        );
        const wcSelectors = getComponentSelector(
          normalizedName,
          "webcomponents",
        );

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

        if (compoundInfo.guidance) {
          responseParts.push("**Guidance:**");
          responseParts.push(compoundInfo.guidance);
          responseParts.push("");
        }
      }
    }
  }

  const availableTokens = theme.tokens.filter((t) => !primaryNames.has(t.name));

  if (availableTokens.length > 0) {
    responseParts.push(
      `**\ud83d\udcd6 Available Tokens (${availableTokens.length}) \u2014 DO NOT USE unless the user explicitly requests a specific customization:**`,
    );
    responseParts.push("");
    responseParts.push(availableTokens.map((t) => `\`${t.name}\``).join(", "));
    responseParts.push("");
  } else if (theme.tokens.length === 0) {
    responseParts.push(
      "**No customizable tokens available for this component.**",
    );
    responseParts.push("");
  }

  responseParts.push("---");
  responseParts.push(
    "**Next step:** Use `create_component_theme` with ONLY the **primary tokens** above. " +
      "Do NOT add available tokens unless the user explicitly asks for a specific one.",
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
