import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions } from "@cartridge/controller";
import { type Chain, mainnet, sepolia } from "@starknet-react/chains";
import {
  type Connector,
  jsonRpcProvider,
  StarknetConfig,
  voyager,
} from "@starknet-react/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { chains, DEFAULT_CHAIN_ID, getNumsAddress } from "@/config";
import { DojoSdkProviderInitialized } from "./context/dojo";
import { Login } from "./pages/Login";
import { Game } from "./pages/Game";
import { queryClient } from "./queries";

const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    switch (chain) {
      case mainnet:
        return { nodeUrl: import.meta.env.VITE_SN_MAIN_RPC_URL };
      case sepolia:
        return { nodeUrl: import.meta.env.VITE_SN_SEPOLIA_RPC_URL };
      default:
        throw new Error(`Unsupported chain: ${chain.network}`);
    }
  },
});

const buildChains = () => {
  const chain = chains[DEFAULT_CHAIN_ID];
  switch (chain) {
    case mainnet:
      return [{ rpcUrl: import.meta.env.VITE_SN_MAIN_RPC_URL }];
    case sepolia:
      return [{ rpcUrl: import.meta.env.VITE_SN_SEPOLIA_RPC_URL }];
    default:
      throw new Error(`Unsupported chain: ${chain.network}`);
  }
};

const buildTokens = () => {
  const chain = chains[DEFAULT_CHAIN_ID];
  const numsAddress = getNumsAddress(chain.id);
  return {
    erc20: [numsAddress],
  };
};

const slot = import.meta.env[
  `VITE_${import.meta.env.VITE_DEFAULT_CHAIN}_TORII_URL`
]
  .split("/")
  .slice(-2, -1)[0];
const options: ControllerOptions = {
  defaultChainId: DEFAULT_CHAIN_ID,
  chains: buildChains(),
  preset: "nums",
  namespace: "NUMS",
  slot: slot,
  tokens: buildTokens(),
};

const connectors = [new ControllerConnector(options) as never as Connector];

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <StarknetConfig
          autoConnect
          chains={[chains[DEFAULT_CHAIN_ID]]}
          connectors={connectors}
          explorer={voyager}
          provider={provider}
        >
          <DojoSdkProviderInitialized>
            <Router>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/game/:game_id" element={<Game />} />
              </Routes>
            </Router>
          </DojoSdkProviderInitialized>
        </StarknetConfig>
      </QueryClientProvider>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
