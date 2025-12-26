export interface HandInput {
  card1_suit: string;
  card1_value: string;
  card2_suit: string;
  card2_value: string;
  card3_suit: string;
  card3_value: string;
}

export interface ProofInput {
  _game_id: string;
  comparator: string;
  condition_id: string;
  hand_commitment: string;
  suit: string;
  value: string;
  hand: HandInput;
}

export interface ProofGenerationResult {
  calldata: (string | bigint)[];
  proof: Uint8Array;
  publicInputs: string[];
}

export enum ProofGenerationStatus {
  Idle = "idle",
  InitializingWasm = "initializing_wasm",
  GeneratingWitness = "generating_witness",
  GeneratingProof = "generating_proof",
  PreparingCalldata = "preparing_calldata",
  Complete = "complete",
  Error = "error",
}

export interface ProofGenerationState {
  status: ProofGenerationStatus;
  progress?: number;
  error?: string;
  result?: ProofGenerationResult;
}
