import { useCallback, useEffect, useState } from "react";
import type {
	ProofGenerationState,
	ProofGenerationStatus,
	ProofInput,
} from "../types/proof";
import {
	generateProofAndCalldata,
	initializeProofSystem,
} from "../utils/proofGenerator";

/**
 * Hook for managing ZK proof generation state
 *
 * @example
 * const { generateProof, state, reset } = useProofGeneration();
 *
 * const handleSubmit = async () => {
 *   const input = {
 *     _game_id: "1",
 *     comparator: "2",
 *     condition_id: "1",
 *     hand_commitment: "0x1722567aaeb8c868b218fd87d8cc5d15a9823b55501321d4cb0d1b8a3c3d583f",
 *     suit: "0",
 *     value: "1",
 *     hand: {
 *       card1_suit: "2",
 *       card1_value: "1",
 *       card2_suit: "3",
 *       card2_value: "2",
 *       card3_suit: "4",
 *       card3_value: "3"
 *     }
 *   };
 *
 *   await generateProof(input);
 *
 *   // Use state.result.calldata for contract interaction
 *   if (state.result) {
 *     await submitToContract(state.result.calldata);
 *   }
 * };
 */
export function useProofGeneration() {
	const [state, setState] = useState<ProofGenerationState>({
		status: "idle" as ProofGenerationStatus,
	});

	// Initialize proof system on mount
	useEffect(() => {
		const initialize = async () => {
			try {
				setState({
					status: "initializing_wasm" as ProofGenerationStatus,
				});
				await initializeProofSystem();
				setState({
					status: "idle" as ProofGenerationStatus,
				});
			} catch (error) {
				setState({
					status: "error" as ProofGenerationStatus,
					error:
						error instanceof Error
							? error.message
							: "Failed to initialize proof system",
				});
			}
		};

		initialize();
	}, []);

	const generateProof = useCallback(async (input: ProofInput) => {
		try {
			// Generate witness
			setState({
				status: "generating_witness" as ProofGenerationStatus,
				progress: 25,
			});

			// Generate proof
			setState({
				status: "generating_proof" as ProofGenerationStatus,
				progress: 50,
			});

			// Prepare calldata
			setState({
				status: "preparing_calldata" as ProofGenerationStatus,
				progress: 75,
			});

			const result = await generateProofAndCalldata(input);

			setState({
				status: "complete" as ProofGenerationStatus,
				progress: 100,
				result,
			});

			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			setState({
				status: "error" as ProofGenerationStatus,
				error: errorMessage,
			});
			throw error;
		}
	}, []);

	const reset = useCallback(() => {
		setState({
			status: "idle" as ProofGenerationStatus,
		});
	}, []);

	return {
		generateProof,
		state,
		reset,
		isLoading:
			state.status !== "idle" &&
			state.status !== "complete" &&
			state.status !== "error",
		isError: state.status === "error",
		isSuccess: state.status === "complete",
	};
}
