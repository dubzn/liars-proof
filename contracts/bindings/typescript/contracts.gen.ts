import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_game_create_calldata = (playerName: string): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "create",
			calldata: [playerName],
		};
	};

	const game_create = async (snAccount: Account | AccountInterface, playerName: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_create_calldata(playerName),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_join_calldata = (gameId: BigNumberish, playerName: string): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "join",
			calldata: [gameId, playerName],
		};
	};

	const game_join = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerName: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_join_calldata(gameId, playerName),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_submitChallengeChoice_calldata = (gameId: BigNumberish, playerChoice: boolean): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "submit_challenge_choice",
			calldata: [gameId, playerChoice],
		};
	};

	const game_submitChallengeChoice = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerChoice: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_submitChallengeChoice_calldata(gameId, playerChoice),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_submitConditionChoice_calldata = (gameId: BigNumberish, playerChoice: boolean): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "submit_condition_choice",
			calldata: [gameId, playerChoice],
		};
	};

	const game_submitConditionChoice = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerChoice: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_submitConditionChoice_calldata(gameId, playerChoice),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_submitHandCommitment_calldata = (gameId: BigNumberish, handCommitment: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "submit_hand_commitment",
			calldata: [gameId, handCommitment],
		};
	};

	const game_submitHandCommitment = async (snAccount: Account | AccountInterface, gameId: BigNumberish, handCommitment: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_submitHandCommitment_calldata(gameId, handCommitment),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_submitRoundProof_calldata = (gameId: BigNumberish, fullProofWithHints: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "submit_round_proof",
			calldata: [gameId, fullProofWithHints],
		};
	};

	const game_submitRoundProof = async (snAccount: Account | AccountInterface, gameId: BigNumberish, fullProofWithHints: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_submitRoundProof_calldata(gameId, fullProofWithHints),
				"dojo_starter",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		game: {
			create: game_create,
			buildCreateCalldata: build_game_create_calldata,
			join: game_join,
			buildJoinCalldata: build_game_join_calldata,
			submitChallengeChoice: game_submitChallengeChoice,
			buildSubmitChallengeChoiceCalldata: build_game_submitChallengeChoice_calldata,
			submitConditionChoice: game_submitConditionChoice,
			buildSubmitConditionChoiceCalldata: build_game_submitConditionChoice_calldata,
			submitHandCommitment: game_submitHandCommitment,
			buildSubmitHandCommitmentCalldata: build_game_submitHandCommitment_calldata,
			submitRoundProof: game_submitRoundProof,
			buildSubmitRoundProofCalldata: build_game_submitRoundProof_calldata,
		},
	};
}