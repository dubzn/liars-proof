use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::ContractAddress;
use crate::models::condition::{CONDITION_COUNT_KEY, Condition, ConditionCount};
use crate::models::game::{GAME_COUNT_KEY, Game, GameCount};
use crate::models::player_choice::{PlayerChallengeChoice, PlayerConditionChoice};
use crate::models::proof::{RoundProof, VERIFIER_ADDRESS_KEY, Verifier};

#[derive(Drop)]
pub struct Store {
    pub world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    fn get_game(ref self: Store, id: u32) -> Game {
        self.world.read_model(id)
    }

    fn set_game(ref self: Store, game: Game) {
        self.world.write_model(@game)
    }

    fn get_game_count(ref self: Store) -> GameCount {
        self.world.read_model(GAME_COUNT_KEY)
    }

    fn set_game_count(ref self: Store, count: u32) {
        self.world.write_model(@GameCount { key: GAME_COUNT_KEY, count: count })
    }

    fn get_condition(ref self: Store, game_id: u32) -> Condition {
        self.world.read_model(game_id)
    }

    fn set_condition(ref self: Store, condition: Condition) {
        self.world.write_model(@condition)
    }

    fn get_condition_count(ref self: Store) -> ConditionCount {
        self.world.read_model(CONDITION_COUNT_KEY)
    }

    fn set_condition_count(ref self: Store, count: u32) {
        self.world.write_model(@ConditionCount { key: CONDITION_COUNT_KEY, count: count })
    }

    fn get_player_condition_choice(
        ref self: Store, game_id: u32, round: u32, player: ContractAddress,
    ) -> PlayerConditionChoice {
        self.world.read_model((game_id, round, player))
    }

    fn set_player_condition_choice(
        ref self: Store, player_condition_choice: PlayerConditionChoice,
    ) {
        self.world.write_model(@player_condition_choice)
    }

    fn get_player_challenge_choice(
        ref self: Store, game_id: u32, round: u32, player: ContractAddress,
    ) -> PlayerChallengeChoice {
        self.world.read_model((game_id, round, player))
    }

    fn set_player_challenge_choice(
        ref self: Store, player_challenge_choice: PlayerChallengeChoice,
    ) {
        self.world.write_model(@player_challenge_choice)
    }

    fn get_player_round_proof(
        ref self: Store, game_id: u32, round: u32, player: ContractAddress,
    ) -> RoundProof {
        self.world.read_model((game_id, round, player))
    }

    fn set_player_round_proof(ref self: Store, player_round_proof: RoundProof) {
        self.world.write_model(@player_round_proof)
    }

    fn get_verifier_address(ref self: Store) -> ContractAddress {
        let verifier: Verifier = self.world.read_model(VERIFIER_ADDRESS_KEY);
        verifier.address
    }

    fn set_verifier_address(ref self: Store, verifier_address: ContractAddress) {
        self.world.write_model(@Verifier { key: VERIFIER_ADDRESS_KEY, address: verifier_address })
    }
}
