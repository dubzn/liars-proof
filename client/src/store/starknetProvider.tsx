import { type PropsWithChildren } from "react";
import type { Chain } from "@starknet-react/chains";
import {
  Connector,
  jsonRpcProvider,
  StarknetConfig,
  voyager,
} from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { constants, num } from "starknet";
import { SessionPolicies } from "@cartridge/presets";

const GAME_CONTRACT_ADDRESS =
  import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

// Define session policies for the game contract
const policies: SessionPolicies = {
  contracts: {
    [GAME_CONTRACT_ADDRESS]: {
      methods: [
        {
          name: "create",
          entrypoint: "create",
          description: "Create a new game",
        },
        {
          name: "join",
          entrypoint: "join",
          description: "Join an existing game",
        },
        {
          name: "submit_hand_commitment",
          entrypoint: "submit_hand_commitment",
          description: "Submit hand commitment",
        },
        {
          name: "submit_condition_choice",
          entrypoint: "submit_condition_choice",
          description: "Submit condition choice",
        },
        {
          name: "submit_challenge_choice",
          entrypoint: "submit_challenge_choice",
          description: "Submit challenge choice",
        },
        {
          name: "submit_round_proof",
          entrypoint: "submit_round_proof",
          description: "Submit round proof",
        },
      ],
    },
  },
};

// Create ControllerConnector for Sepolia
const controller = new ControllerConnector({
  chains: [
    {
      rpcUrl:
        import.meta.env.VITE_ZN_SEPOLIA_RPC_URL ||
        "https://api.cartridge.gg/x/starknet/sepolia",
    },
  ],
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
  policies,
  signupOptions: ["google", "discord", "webauthn", "password"],
});

// Define Sepolia chain configuration
const sepolia: Chain = {
  id: num.toBigInt(constants.StarknetChainId.SN_SEPOLIA),
  name: "Sepolia",
  network: "sepolia",
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_ZN_SEPOLIA_RPC_URL ||
          "https://api.cartridge.gg/x/starknet/sepolia",
      ],
    },
    public: {
      http: [
        import.meta.env.VITE_ZN_SEPOLIA_RPC_URL ||
          "https://api.cartridge.gg/x/starknet/sepolia",
      ],
    },
  },
  nativeCurrency: {
    name: "Starknet",
    symbol: "STRK",
    decimals: 18,
    address:
      "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
  paymasterRpcUrls: {
    avnu: {
      http: ["http://localhost:5050"],
    },
  },
};

const provider = jsonRpcProvider({
  rpc: () => ({
    nodeUrl:
      import.meta.env.VITE_ZN_SEPOLIA_RPC_URL ||
      "https://api.cartridge.gg/x/starknet/sepolia",
  }),
});

export default function StarknetProvider({ children }: PropsWithChildren) {
  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={provider}
      connectors={[controller as unknown as Connector]}
      explorer={voyager}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
