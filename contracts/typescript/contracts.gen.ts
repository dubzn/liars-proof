import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_game_system_create_calldata = (playerName: string): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "create",
			calldata: [playerName],
		};
	};

	const game_system_create = async (snAccount: Account | AccountInterface, playerName: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_create_calldata(playerName),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getCondition_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "get_condition",
			calldata: [gameId],
		};
	};

	const game_system_getCondition = async (gameId: BigNumberish) => {
		try {
			return await provider.call("liars_proof", build_game_system_getCondition_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_join_calldata = (gameId: BigNumberish, playerName: string): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "join",
			calldata: [gameId, playerName],
		};
	};

	const game_system_join = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerName: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_join_calldata(gameId, playerName),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_submitChallengeChoice_calldata = (gameId: BigNumberish, playerChoice: boolean): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "submit_challenge_choice",
			calldata: [gameId, playerChoice],
		};
	};

	const game_system_submitChallengeChoice = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerChoice: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_submitChallengeChoice_calldata(gameId, playerChoice),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_submitConditionChoice_calldata = (gameId: BigNumberish, playerChoice: boolean): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "submit_condition_choice",
			calldata: [gameId, playerChoice],
		};
	};

	const game_system_submitConditionChoice = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerChoice: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_submitConditionChoice_calldata(gameId, playerChoice),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_submitHandCommitment_calldata = (gameId: BigNumberish, handCommitment: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "submit_hand_commitment",
			calldata: [gameId, handCommitment],
		};
	};

	const game_system_submitHandCommitment = async (snAccount: Account | AccountInterface, gameId: BigNumberish, handCommitment: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_submitHandCommitment_calldata(gameId, handCommitment),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_submitRoundProof_calldata = (gameId: BigNumberish, fullProofWithHints: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "submit_round_proof",
			calldata: [gameId, fullProofWithHints],
		};
	};

	const game_system_submitRoundProof = async (snAccount: Account | AccountInterface, gameId: BigNumberish, fullProofWithHints: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_submitRoundProof_calldata(gameId, fullProofWithHints),
				"liars_proof",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		game_system: {
			create: game_system_create,
			buildCreateCalldata: build_game_system_create_calldata,
			getCondition: game_system_getCondition,
			buildGetConditionCalldata: build_game_system_getCondition_calldata,
			join: game_system_join,
			buildJoinCalldata: build_game_system_join_calldata,
			submitChallengeChoice: game_system_submitChallengeChoice,
			buildSubmitChallengeChoiceCalldata: build_game_system_submitChallengeChoice_calldata,
			submitConditionChoice: game_system_submitConditionChoice,
			buildSubmitConditionChoiceCalldata: build_game_system_submitConditionChoice_calldata,
			submitHandCommitment: game_system_submitHandCommitment,
			buildSubmitHandCommitmentCalldata: build_game_system_submitHandCommitment_calldata,
			submitRoundProof: game_system_submitRoundProof,
			buildSubmitRoundProofCalldata: build_game_system_submitRoundProof_calldata,
		},
	};
}