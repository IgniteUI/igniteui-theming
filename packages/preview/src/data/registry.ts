import type { DataProvider } from "./provider.js";

const providers = new Map<string, DataProvider>();

/** Registers a provider. IDs are unique across the whole app. */
export const register = (provider: DataProvider): void => {
  const clash = providers.get(provider.id);

  if (clash && clash.module !== provider.module) {
    throw new Error(
      `Duplicate data provider id "${provider.id}", declared by ${clash.module} and ${provider.module}.`,
    );
  }

  providers.set(provider.id, provider);
};

export const get = (id: string): DataProvider => {
  const provider = providers.get(id);

  if (!provider) {
    const known = [...providers.keys()].sort().join(", ") || "none";
    throw new Error(`Unknown data provider "${id}". Registered: ${known}.`);
  }

  return provider;
};

/** Test seam. */
export const reset = (): void => providers.clear();
