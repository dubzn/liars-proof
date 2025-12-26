import { useState } from "react";
import { useProofGeneration } from "../hooks/useProofGeneration";
import type { ProofInput } from "../types/proof";

export default function ProofPage() {
  const { generateProof, state, reset, isLoading, isSuccess, isError } =
    useProofGeneration();

  // Form state
  const [formData, setFormData] = useState<ProofInput>({
    _game_id: "1",
    comparator: "2",
    condition_id: "1",
    hand_commitment:
      "0x1722567aaeb8c868b218fd87d8cc5d15a9823b55501321d4cb0d1b8a3c3d583f",
    suit: "0",
    value: "1",
    hand: {
      card1_suit: "2",
      card1_value: "1",
      card2_suit: "3",
      card2_value: "2",
      card3_suit: "4",
      card3_value: "3",
    },
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("hand.")) {
      const handField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        hand: {
          ...prev.hand,
          [handField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleGenerateProof = async () => {
    try {
      const result = await generateProof(formData);
      console.log("Proof generated successfully:", result);
    } catch (error) {
      console.error("Failed to generate proof:", error);
    }
  };

  const getStatusColor = () => {
    if (isError) return "text-red-500";
    if (isSuccess) return "text-green-500";
    if (isLoading) return "text-blue-500";
    return "text-gray-500";
  };

  const getStatusText = () => {
    switch (state.status) {
      case "idle":
        return "Ready to generate proof";
      case "initializing_wasm":
        return "Initializing WASM modules...";
      case "generating_witness":
        return "Generating witness from circuit...";
      case "generating_proof":
        return "Generating ZK proof (this may take a moment)...";
      case "preparing_calldata":
        return "Preparing calldata for Starknet...";
      case "complete":
        return "Proof generated successfully!";
      case "error":
        return `Error: ${state.error}`;
      default:
        return state.status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ZK Proof Generator</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Status</h2>
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {state.progress !== undefined && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {state.progress}% complete
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Input Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Game Parameters */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game ID
              </label>
              <input
                type="text"
                value={formData._game_id}
                onChange={(e) => handleInputChange("_game_id", e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comparator (0=eq, 1=lt, 2=gt)
              </label>
              <input
                type="text"
                value={formData.comparator}
                onChange={(e) =>
                  handleInputChange("comparator", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Condition ID
              </label>
              <input
                type="text"
                value={formData.condition_id}
                onChange={(e) =>
                  handleInputChange("condition_id", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Suit (0-3)
              </label>
              <input
                type="text"
                value={formData.suit}
                onChange={(e) => handleInputChange("suit", e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Value (1-13)
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hand Commitment
              </label>
              <input
                type="text"
                value={formData.hand_commitment}
                onChange={(e) =>
                  handleInputChange("hand_commitment", e.target.value)
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Hand Cards */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Hand Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="bg-gray-700 rounded p-4">
                <h4 className="font-medium mb-3">Card 1</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Suit
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card1_suit}
                      onChange={(e) =>
                        handleInputChange("hand.card1_suit", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card1_value}
                      onChange={(e) =>
                        handleInputChange("hand.card1_value", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-700 rounded p-4">
                <h4 className="font-medium mb-3">Card 2</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Suit
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card2_suit}
                      onChange={(e) =>
                        handleInputChange("hand.card2_suit", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card2_value}
                      onChange={(e) =>
                        handleInputChange("hand.card2_value", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-gray-700 rounded p-4">
                <h4 className="font-medium mb-3">Card 3</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Suit
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card3_suit}
                      onChange={(e) =>
                        handleInputChange("hand.card3_suit", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={formData.hand.card3_value}
                      onChange={(e) =>
                        handleInputChange("hand.card3_value", e.target.value)
                      }
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleGenerateProof}
            disabled={isLoading || state.status === "initializing_wasm"}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
              isLoading || state.status === "initializing_wasm"
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Generating..." : "Generate Proof"}
          </button>

          {(isSuccess || isError) && (
            <button
              type="button"
              onClick={reset}
              className="py-3 px-6 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Results */}
        {isSuccess && state.result && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Results</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Calldata (ready for Starknet contract)
                </h3>
                <div className="bg-gray-900 rounded p-3 font-mono text-xs overflow-x-auto">
                  <pre className="text-green-400">
                    {JSON.stringify(
                      state.result.calldata.map((v: unknown) =>
                        typeof v === "bigint" ? v.toString() : v,
                      ),
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Use calldata.slice(1) when calling the verifier contract
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Length: {state.result.calldata.length} elements
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Public Inputs
                </h3>
                <div className="bg-gray-900 rounded p-3 font-mono text-xs overflow-x-auto">
                  <pre className="text-blue-400">
                    {JSON.stringify(state.result.publicInputs, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Proof Size
                </h3>
                <p className="text-white">{state.result.proof.length} bytes</p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(state.result!.calldata),
                    );
                    alert("Calldata copied to clipboard!");
                  }}
                  className="py-2 px-4 rounded bg-green-600 hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Copy Calldata to Clipboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
