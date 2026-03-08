import { auth, clerkClient } from "@clerk/nextjs/server";

export type AccountState = {
  walletAddress: string | null;
  chainId: string | null;
  botRunning: boolean;
};

type StoredAccountState = {
  walletAddress?: unknown;
  chainId?: unknown;
  botRunning?: unknown;
};

const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_ACCOUNT_STATE: AccountState = {
  walletAddress: null,
  chainId: null,
  botRunning: false,
};

function parseStoredState(value: unknown): AccountState {
  if (!value || typeof value !== "object") {
    return DEFAULT_ACCOUNT_STATE;
  }

  const candidate = value as StoredAccountState;
  return {
    walletAddress:
      typeof candidate.walletAddress === "string" && WALLET_ADDRESS_REGEX.test(candidate.walletAddress)
        ? candidate.walletAddress
        : null,
    chainId: typeof candidate.chainId === "string" ? candidate.chainId : null,
    botRunning: typeof candidate.botRunning === "boolean" ? candidate.botRunning : false,
  };
}

function buildMetadataPatch(nextState: AccountState) {
  return {
    walletAddress: nextState.walletAddress,
    chainId: nextState.chainId,
    botRunning: nextState.botRunning,
    updatedAt: new Date().toISOString(),
  };
}

export function isValidWalletAddress(walletAddress: string): boolean {
  return WALLET_ADDRESS_REGEX.test(walletAddress);
}

export async function requireAuthenticatedUserId() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, error: "Unauthorized" as const };
  }
  return { userId, error: null };
}

export async function getAccountStateForUser(userId: string): Promise<AccountState> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return parseStoredState(user.privateMetadata?.polybotAccount);
}

export async function updateAccountStateForUser(userId: string, nextState: AccountState): Promise<AccountState> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      polybotAccount: buildMetadataPatch(nextState),
    },
  });

  return nextState;
}

export async function connectWalletForUser(userId: string, walletAddress: string, chainId: string | null) {
  const normalizedAddress = walletAddress.toLowerCase();
  const currentState = await getAccountStateForUser(userId);
  const nextState: AccountState = {
    ...currentState,
    walletAddress: normalizedAddress,
    chainId,
  };
  return updateAccountStateForUser(userId, nextState);
}

export async function disconnectWalletForUser(userId: string) {
  return updateAccountStateForUser(userId, {
    walletAddress: null,
    chainId: null,
    botRunning: false,
  });
}

export async function setBotRunningForUser(userId: string, running: boolean) {
  const currentState = await getAccountStateForUser(userId);
  // Wallet required only for live trading; paper mode can run without wallet
  return updateAccountStateForUser(userId, {
    ...currentState,
    botRunning: running,
  });
}
