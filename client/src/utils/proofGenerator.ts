import { Noir } from "@noir-lang/noir_js";
import type { DebugFileMap } from "@noir-lang/types";
import { UltraHonkBackend } from "@aztec/bb.js";
import { getZKHonkCallData, init as initGaraga } from "garaga";
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import type { ProofInput, ProofGenerationResult } from "../types/proof";
import { flattenFieldsAsArray, loadVerificationKey } from "./proofHelpers";
import { bytecode, abi } from "../assets/circuit.json";
import vkUrl from "../assets/vk.bin?url";

// WASM imports - these should be available in your vite config
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";

let wasmInitialized = false;
let vk: Uint8Array | null = null;

/**
 * Initialize WASM modules (ACVM and NoirC)
 * This should be called once at application startup
 */
export async function initializeWasm(): Promise<void> {
	if (wasmInitialized) {
		return;
	}

	try {
		await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);
		console.log("WASM modules initialized successfully");
		wasmInitialized = true;
	} catch (error) {
		console.error("Failed to initialize WASM modules:", error);
		throw new Error(
			`WASM initialization failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Load the verification key
 * This should be called once at application startup
 */
export async function initializeVerificationKey(): Promise<void> {
	if (vk) {
		return;
	}

	try {
		vk = await loadVerificationKey(vkUrl);
		console.log("Verification key loaded successfully");
	} catch (error) {
		console.error("Failed to load verification key:", error);
		throw new Error(
			`Verification key loading failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Initialize all required dependencies for proof generation
 * Call this once at application startup
 */
export async function initializeProofSystem(): Promise<void> {
	await initializeWasm();
	await initializeVerificationKey();
	await initGaraga();
	console.log("Proof system initialized successfully");
}

/**
 * Generate a ZK proof and prepare calldata for Starknet verification
 *
 * @param input - The proof input containing game data and hand information
 * @returns ProofGenerationResult containing calldata, proof, and public inputs
 *
 * @example
 * const input = {
 *   _game_id: "1",
 *   comparator: "2",
 *   condition_id: "1",
 *   hand_commitment: "0x1722567aaeb8c868b218fd87d8cc5d15a9823b55501321d4cb0d1b8a3c3d583f",
 *   suit: "0",
 *   value: "1",
 *   hand: {
 *     card1_suit: "2",
 *     card1_value: "1",
 *     card2_suit: "3",
 *     card2_value: "2",
 *     card3_suit: "4",
 *     card3_value: "3"
 *   }
 * };
 *
 * const result = await generateProofAndCalldata(input);
 * // Use result.calldata for Starknet contract call
 */
export async function generateProofAndCalldata(
	input: ProofInput,
): Promise<ProofGenerationResult> {
	// Ensure WASM is initialized
	if (!wasmInitialized) {
		throw new Error(
			"WASM not initialized. Call initializeProofSystem() first.",
		);
	}

	// Ensure VK is loaded
	if (!vk) {
		throw new Error(
			"Verification key not loaded. Call initializeProofSystem() first.",
		);
	}

	try {
		// Step 1: Generate witness
		console.log("Generating witness...");
		const noir = new Noir({
			bytecode,
			abi: abi as never,
			debug_symbols: "",
			file_map: {} as DebugFileMap,
		});

		const execResult = await noir.execute(input);
		console.log("Witness generated:", execResult);

		// Step 2: Generate proof with UltraHonk backend
		console.log("Generating proof...");
		const honk = new UltraHonkBackend(bytecode, { threads: 1 });

		const proof = await honk.generateProof(execResult.witness, {
			starknetZK: true,
		});

		// Clean up backend
		honk.destroy();
		console.log("Proof generated:", proof);

		// Step 3: Prepare calldata for Starknet
		console.log("Preparing calldata...");
		const callData = getZKHonkCallData(
			proof.proof,
			flattenFieldsAsArray(proof.publicInputs),
			vk,
			1, // HonkFlavor.STARKNET
		);

		console.log("Calldata prepared:", callData);

		return {
			calldata: callData,
			proof: proof.proof,
			publicInputs: proof.publicInputs,
		};
	} catch (error) {
		console.error("Proof generation failed:", error);
		throw new Error(
			`Proof generation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Generate calldata only (useful when you already have the proof)
 * This is primarily for testing or when reprocessing existing proofs
 */
export function generateCalldata(
	proof: Uint8Array,
	publicInputs: string[],
): string[] {
	if (!vk) {
		throw new Error(
			"Verification key not loaded. Call initializeProofSystem() first.",
		);
	}

	return getZKHonkCallData(
		proof,
		flattenFieldsAsArray(publicInputs),
		vk,
		1, // HonkFlavor.STARKNET
	);
}
