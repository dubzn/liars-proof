import { QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { StarknetKitProvider } from "./context/starknetkit";
import { DojoSdkProviderInitialized } from "./context/dojo";
import { Login } from "./pages/Login";
import { Game } from "./pages/Game";
import ProofPage from "./pages/Proof";
import { queryClient } from "./queries";

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <StarknetKitProvider>
          <DojoSdkProviderInitialized>
            <Router>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/game/:game_id" element={<Game />} />
                <Route path="/proof" element={<ProofPage />} />
              </Routes>
            </Router>
          </DojoSdkProviderInitialized>
        </StarknetKitProvider>
      </QueryClientProvider>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
