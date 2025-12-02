import { useAccount, useConnect } from "@starknet-react/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import "./Login.css";

export const Login = () => {
  const { account } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!account) {
      await connectAsync({ connector: connectors[0] });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Liar's Proof</h1>
        <div className="login-content">
          {account ? (
            <div className="login-connected-section">
              <div className="login-address-container">
                <p className="login-address-label">Connected Address:</p>
                <p className="login-address">{account.address}</p>
              </div>
              <Button
                onClick={() => navigate("/game/1")}
                className="login-button-full"
                variant="default"
              >
                Go to Game
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              className="login-button-full"
              variant="default"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

