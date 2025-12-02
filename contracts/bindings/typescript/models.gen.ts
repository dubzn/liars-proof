import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `dojo_starter::models::condition::Condition` struct
export interface Condition {
	id: BigNumberish;
	condition: BigNumberish;
	quantity: BigNumberish;
	comparator: BigNumberish;
	value: BigNumberish;
	suit: BigNumberish;
}

// Type definition for `dojo_starter::models::condition::ConditionCount` struct
export interface ConditionCount {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `dojo_starter::models::game::Game` struct
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
}

// Type definition for `dojo_starter::models::game::GameCount` struct
export interface GameCount {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `dojo_starter::models::player_choice::PlayerChallengeChoice` struct
export interface PlayerChallengeChoice {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	choice: boolean;
}

// Type definition for `dojo_starter::models::player_choice::PlayerConditionChoice` struct
export interface PlayerConditionChoice {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	choice: boolean;
}

// Type definition for `dojo_starter::models::proof::RoundProof` struct
export interface RoundProof {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	is_valid: boolean;
}

// Type definition for `dojo_starter::models::proof::Verifier` struct
export interface Verifier {
	key: BigNumberish;
	address: string;
}

// Type definition for `dojo_starter::traits::random::Random` struct
export interface Random {
	key: BigNumberish;
	seed: BigNumberish;
}

// Type definition for `dojo_starter::traits::random::Salt` struct
export interface Salt {
	key: BigNumberish;
	value: BigNumberish;
}

// Type definition for `dojo_starter::models::condition::ConditionCreated` struct
export interface ConditionCreated {
	game_id: BigNumberish;
	player: string;
	name: string;
	choice: boolean;
}

// Type definition for `dojo_starter::models::game::GameCreated` struct
export interface GameCreated {
	id: BigNumberish;
	owner: string;
	name: string;
}

// Type definition for `dojo_starter::models::game::GameJoined` struct
export interface GameJoined {
	id: BigNumberish;
	player: string;
	name: string;
}

// Type definition for `dojo_starter::models::game::GameOver` struct
export interface GameOver {
	game_id: BigNumberish;
	winner: string;
	winner_name: string;
	loser: string;
	loser_name: string;
}

// Type definition for `dojo_starter::models::hand::HandCommitmentSubmitted` struct
export interface HandCommitmentSubmitted {
	game_id: BigNumberish;
	player: string;
	hand_commitment: BigNumberish;
}

// Type definition for `dojo_starter::models::player_choice::PlayerChallengeSubmitted` struct
export interface PlayerChallengeSubmitted {
	game_id: BigNumberish;
	player: string;
	name: string;
	challenge: boolean;
}

// Type definition for `dojo_starter::models::player_choice::PlayerConditionSubmitted` struct
export interface PlayerConditionSubmitted {
	game_id: BigNumberish;
	player: string;
	name: string;
	choice: boolean;
}

// Type definition for `dojo_starter::models::proof::RoundProofSubmitted` struct
export interface RoundProofSubmitted {
	game_id: BigNumberish;
	round: BigNumberish;
	player: string;
	submitted: boolean;
	is_valid: boolean;
}

// Type definition for `dojo_starter::models::game::GameState` enum
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
	dojo_starter: {
		Condition: Condition,
		ConditionCount: ConditionCount,
		Game: Game,
		GameCount: GameCount,
		PlayerChallengeChoice: PlayerChallengeChoice,
		PlayerConditionChoice: PlayerConditionChoice,
		RoundProof: RoundProof,
		Verifier: Verifier,
		Random: Random,
		Salt: Salt,
		ConditionCreated: ConditionCreated,
		GameCreated: GameCreated,
		GameJoined: GameJoined,
		GameOver: GameOver,
		HandCommitmentSubmitted: HandCommitmentSubmitted,
		PlayerChallengeSubmitted: PlayerChallengeSubmitted,
		PlayerConditionSubmitted: PlayerConditionSubmitted,
		RoundProofSubmitted: RoundProofSubmitted,
	},
}
export const schema: SchemaType = {
	dojo_starter: {
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
				GameOver: undefined, }),
			condition_id: 0,
		},
		GameCount: {
			key: 0,
			count: 0,
		},
		PlayerChallengeChoice: {
			game_id: 0,
			round: 0,
			player: "",
			submitted: false,
			choice: false,
		},
		PlayerConditionChoice: {
			game_id: 0,
			round: 0,
			player: "",
			submitted: false,
			choice: false,
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
		PlayerChallengeSubmitted: {
			game_id: 0,
			player: "",
		name: "",
			challenge: false,
		},
		PlayerConditionSubmitted: {
			game_id: 0,
			player: "",
		name: "",
			choice: false,
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
	Condition = 'dojo_starter-Condition',
	ConditionCount = 'dojo_starter-ConditionCount',
	Game = 'dojo_starter-Game',
	GameCount = 'dojo_starter-GameCount',
	GameState = 'dojo_starter-GameState',
	PlayerChallengeChoice = 'dojo_starter-PlayerChallengeChoice',
	PlayerConditionChoice = 'dojo_starter-PlayerConditionChoice',
	RoundProof = 'dojo_starter-RoundProof',
	Verifier = 'dojo_starter-Verifier',
	Random = 'dojo_starter-Random',
	Salt = 'dojo_starter-Salt',
	ConditionCreated = 'dojo_starter-ConditionCreated',
	GameCreated = 'dojo_starter-GameCreated',
	GameJoined = 'dojo_starter-GameJoined',
	GameOver = 'dojo_starter-GameOver',
	HandCommitmentSubmitted = 'dojo_starter-HandCommitmentSubmitted',
	PlayerChallengeSubmitted = 'dojo_starter-PlayerChallengeSubmitted',
	PlayerConditionSubmitted = 'dojo_starter-PlayerConditionSubmitted',
	RoundProofSubmitted = 'dojo_starter-RoundProofSubmitted',
}