import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `liars_proof::models::condition::Condition` struct
export interface Condition {
	id: BigNumberish;
	condition: BigNumberish;
	quantity: BigNumberish;
	comparator: BigNumberish;
	value: BigNumberish;
	suit: BigNumberish;
}

// Type definition for `liars_proof::models::condition::ConditionCount` struct
export interface ConditionCount {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `liars_proof::models::game::Game` struct
export interface Game {
	id: BigNumberish;
	player_1: string;
	player_1_name: string;
	player_2: string;
	player_2_name: string;
	player_1_hand_commitment: BigNumberish;
	player_2_hand_commitment: BigNumberish;
	player_1_score: BigNumberish;
	player_2_score: BigNumberish;
	player_1_lives: BigNumberish;
	player_2_lives: BigNumberish;
	round: BigNumberish;
	state: GameStateEnum;
	condition_id: BigNumberish;
	player_1_condition_submitted: boolean;
	player_1_condition_choice: boolean;
	player_2_condition_submitted: boolean;
	player_2_condition_choice: boolean;
	player_1_challenge_submitted: boolean;
	player_1_challenge_choice: boolean;
	player_2_challenge_submitted: boolean;
	player_2_challenge_choice: boolean;
}

// Type definition for `liars_proof::models::game::GameCount` struct
export interface GameCount {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `liars_proof::models::proof::RoundProof` struct
export interface RoundProof {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	is_valid: boolean;
}

// Type definition for `liars_proof::models::proof::Verifier` struct
export interface Verifier {
	key: BigNumberish;
	address: string;
}

// Type definition for `liars_proof::traits::random::Random` struct
export interface Random {
	key: BigNumberish;
	seed: BigNumberish;
}

// Type definition for `liars_proof::traits::random::Salt` struct
export interface Salt {
	key: BigNumberish;
	value: BigNumberish;
}

// Type definition for `liars_proof::models::condition::ConditionCreated` struct
export interface ConditionCreated {
	game_id: BigNumberish;
	player: string;
	name: string;
	choice: boolean;
}

// Type definition for `liars_proof::models::game::GameCreated` struct
export interface GameCreated {
	id: BigNumberish;
	owner: string;
	name: string;
}

// Type definition for `liars_proof::models::game::GameJoined` struct
export interface GameJoined {
	id: BigNumberish;
	player: string;
	name: string;
}

// Type definition for `liars_proof::models::game::GameOver` struct
export interface GameOver {
	game_id: BigNumberish;
	winner: string;
	winner_name: string;
	loser: string;
	loser_name: string;
}

// Type definition for `liars_proof::models::hand::HandCommitmentSubmitted` struct
export interface HandCommitmentSubmitted {
	game_id: BigNumberish;
	player: string;
	hand_commitment: BigNumberish;
}

// Type definition for `liars_proof::models::proof::RoundProofSubmitted` struct
export interface RoundProofSubmitted {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	is_valid: boolean;
}

// Type definition for `liars_proof::models::game::GameState` enum
export const gameState = [
	'WaitingForPlayers',
	'WaitingForHandCommitments',
	'ConditionPhase',
	'ChallengePhase',
	'ResultPhase',
	'GameOver',
] as const;
export type GameState = { [key in typeof gameState[number]]: string };
export type GameStateEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	liars_proof: {
		Condition: Condition,
		ConditionCount: ConditionCount,
		Game: Game,
		GameCount: GameCount,
		RoundProof: RoundProof,
		Verifier: Verifier,
		Random: Random,
		Salt: Salt,
		ConditionCreated: ConditionCreated,
		GameCreated: GameCreated,
		GameJoined: GameJoined,
		GameOver: GameOver,
		HandCommitmentSubmitted: HandCommitmentSubmitted,
		RoundProofSubmitted: RoundProofSubmitted,
	},
}
export const schema: SchemaType = {
	liars_proof: {
		Condition: {
			id: 0,
			condition: 0,
			quantity: 0,
			comparator: 0,
			value: 0,
			suit: 0,
		},
		ConditionCount: {
			key: 0,
			count: 0,
		},
		Game: {
			id: 0,
			player_1: "",
			player_1_name: "",
			player_2: "",
			player_2_name: "",
			player_1_hand_commitment: 0,
			player_2_hand_commitment: 0,
			player_1_score: 0,
			player_2_score: 0,
			player_1_lives: 0,
			player_2_lives: 0,
			round: 0,
			state: new CairoCustomEnum({
				WaitingForPlayers: "",
				WaitingForHandCommitments: undefined,
				ConditionPhase: undefined,
				ChallengePhase: undefined,
				ResultPhase: undefined,
				GameOver: undefined,
			}),
			condition_id: 0,
			player_1_condition_submitted: false,
			player_1_condition_choice: false,
			player_2_condition_submitted: false,
			player_2_condition_choice: false,
			player_1_challenge_submitted: false,
			player_1_challenge_choice: false,
			player_2_challenge_submitted: false,
			player_2_challenge_choice: false,
		},
		GameCount: {
			key: 0,
			count: 0,
		},
		RoundProof: {
			game_id: 0,
			round: 0,
			player: "",
			submitted: false,
			is_valid: false,
		},
		Verifier: {
			key: 0,
			address: "",
		},
		Random: {
			key: 0,
			seed: 0,
		},
		Salt: {
			key: 0,
			value: 0,
		},
		ConditionCreated: {
			game_id: 0,
			player: "",
			name: "",
			choice: false,
		},
		GameCreated: {
			id: 0,
			owner: "",
			name: "",
		},
		GameJoined: {
			id: 0,
			player: "",
			name: "",
		},
		GameOver: {
			game_id: 0,
			winner: "",
			winner_name: "",
			loser: "",
			loser_name: "",
		},
		HandCommitmentSubmitted: {
			game_id: 0,
			player: "",
			hand_commitment: 0,
		},
		RoundProofSubmitted: {
			game_id: 0,
			round: 0,
			player: "",
			submitted: false,
			is_valid: false,
		},
	},
};
export enum ModelsMapping {
	Condition = 'liars_proof-Condition',
	ConditionCount = 'liars_proof-ConditionCount',
	Game = 'liars_proof-Game',
	GameCount = 'liars_proof-GameCount',
	GameState = 'liars_proof-GameState',
	RoundProof = 'liars_proof-RoundProof',
	Verifier = 'liars_proof-Verifier',
	Random = 'liars_proof-Random',
	Salt = 'liars_proof-Salt',
	ConditionCreated = 'liars_proof-ConditionCreated',
	GameCreated = 'liars_proof-GameCreated',
	GameJoined = 'liars_proof-GameJoined',
	GameOver = 'liars_proof-GameOver',
	HandCommitmentSubmitted = 'liars_proof-HandCommitmentSubmitted',
	RoundProofSubmitted = 'liars_proof-RoundProofSubmitted',
}