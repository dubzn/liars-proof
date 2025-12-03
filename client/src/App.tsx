import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions } from "@cartridge/controller";
import { type Chain, sepolia } from "@starknet-react/chains";
import {
  jsonRpcProvider,
  StarknetConfig,
  voyager,
} from "@starknet-react/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { chains, DEFAULT_CHAIN_ID } from "@/config";
import { DojoSdkProviderInitialized } from "./context/dojo";
import { Login } from "./pages/Login";
import { Game } from "./pages/Game";
import { queryClient } from "./queries";

const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    return { nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL };
  },
});

const options: ControllerOptions = {
  defaultChainId: DEFAULT_CHAIN_ID,
  rpcUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
};

const connectors = [new ControllerConnector(options)];

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <StarknetConfig
          autoConnect
          chains={[sepolia]}
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
