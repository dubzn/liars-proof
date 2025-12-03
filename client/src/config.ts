import { createDojoConfig } from "@dojoengine/core";
import { sepolia } from "@starknet-react/chains";
import { shortString } from "starknet";
import manifestSepolia from "../../manifest_sepolia.json";

// Namespace used for contract addresses in the manifest
export const NAMESPACE = "liars_proof3";

// Default chain is ZN_SEPOLIA (custom ZStarknet network)
export const DEFAULT_CHAIN = import.meta.env.VITE_DEFAULT_CHAIN;
export const DEFAULT_CHAIN_ID = shortString.encodeShortString(
  DEFAULT_CHAIN,
);

// Manifests keyed by chain id (we only use ZN_SEPOLIA pointing to the sepolia manifest for now)
export const manifests = {
  [DEFAULT_CHAIN_ID]: manifestSepolia,
};

// Starknet-react chains mapping – we reuse the sepolia chain definition for wallet / UI
export const chains = {
  [DEFAULT_CHAIN_ID]: sepolia,
};

// Dojo configuration for ZStarknet (RPC + Torii from env)
const dojoConfig = createDojoConfig({
  rpcUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
  toriiUrl: import.meta.env.VITE_ZN_SEPOLIA_TORII_URL,
  manifest: manifestSepolia,
});

export const dojoConfigs = {
  [DEFAULT_CHAIN_ID]: dojoConfig,
};

export const getContractAddress = (
  chainId: bigint,
  namespace: string,
  contractName: string,
) => {
  const chainIdHex = `0x${chainId.toString(16)}`;

  const manifest = manifests[chainIdHex];
  const contract = manifest.contracts.find(
    (i) => i.tag === `${namespace}-${contractName}`,
  );

  return contract!.address;
};


