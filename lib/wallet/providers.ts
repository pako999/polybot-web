export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isPhantom?: boolean;
};

type EthereumWithProviders = Eip1193Provider & {
  providers?: Eip1193Provider[];
};

export type WalletOption = {
  id: "metamask" | "coinbase" | "rabby" | "brave" | "phantom" | "injected";
  label: string;
  provider: Eip1193Provider;
};

declare global {
  interface Window {
    ethereum?: EthereumWithProviders;
    phantom?: {
      ethereum?: Eip1193Provider;
    };
  }
}

function uniqueProviders(providers: Eip1193Provider[]) {
  return Array.from(new Set(providers));
}

function getInjectedProviders(): Eip1193Provider[] {
  if (typeof window === "undefined") return [];

  const providers: Eip1193Provider[] = [];

  // Phantom (EVM) - check first so it's detected when user has only Phantom
  if (window.phantom?.ethereum) {
    providers.push(window.phantom.ethereum);
  }

  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    providers.push(...window.ethereum.providers);
  }

  if (window.ethereum) {
    providers.push(window.ethereum);
  }

  return uniqueProviders(providers);
}

function pickProviderByFlag(providers: Eip1193Provider[], flag: keyof Eip1193Provider) {
  return providers.find((provider) => Boolean(provider[flag]));
}

export function getWalletOptions(): WalletOption[] {
  const providers = getInjectedProviders();
  if (!providers.length) return [];

  const options: WalletOption[] = [];

  const phantom = pickProviderByFlag(providers, "isPhantom") || window.phantom?.ethereum;
  if (phantom) options.push({ id: "phantom", label: "Phantom (EVM)", provider: phantom });

  const metamask = pickProviderByFlag(providers, "isMetaMask");
  if (metamask) options.push({ id: "metamask", label: "MetaMask", provider: metamask });

  const coinbase = pickProviderByFlag(providers, "isCoinbaseWallet");
  if (coinbase) options.push({ id: "coinbase", label: "Coinbase Wallet", provider: coinbase });

  const rabby = pickProviderByFlag(providers, "isRabby");
  if (rabby) options.push({ id: "rabby", label: "Rabby", provider: rabby });

  const brave = pickProviderByFlag(providers, "isBraveWallet");
  if (brave) options.push({ id: "brave", label: "Brave Wallet", provider: brave });

  if (!options.length && providers[0]) {
    options.push({ id: "injected", label: "Injected Wallet", provider: providers[0] });
  }

  return options;
}
