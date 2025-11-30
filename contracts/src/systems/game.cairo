#[starknet::interface]
pub trait IGameSystem<T> {
    fn create(ref self: T, player_name: ByteArray) -> u32;
    fn join(ref self: T, game_id: u32, player_name: ByteArray);
    fn submit_hand_commitment(ref self: T, game_id: u32, hand_commitment: felt252);
    fn submit_condition_choice(ref self: T, game_id: u32, player_choice: bool);
    fn submit_challenge_choice(ref self: T, game_id: u32, player_choice: bool);
}

#[dojo::contract]
pub mod game {
    use core::num::traits::zero::Zero;
    use dojo::event::EventStorage;
    use starknet::get_caller_address;
    use crate::models::game::{Game, GameCreated, GameJoined, GameState};
    use crate::models::hand::HandCommitmentSubmitted;
    use crate::models::player_choice::{PlayerChallengeChoice, PlayerConditionChoice};
    use crate::traits::condition::ConditionTrait;
    use crate::traits::store::{Store, StoreTrait};
    use super::IGameSystem;

    fn dojo_init(ref self: ContractState) {
        let mut store = self.store_default();
        store.set_game_count(1);
    }

    const CHOICE_TRUE: u32 = 1;
    const CHOICE_FALSE: u32 = 2;

    #[abi(embed_v0)]
    impl GameImpl of IGameSystem<ContractState> {
        fn create(ref self: ContractState, player_name: ByteArray) -> u32 {
            let mut store = self.store_default();
            let mut count = store.get_game_count().count + 1;
            store.set_game_count(count);

            store
                .set_game(
                    Game {
                        id: count,
                        player_1: get_caller_address(),
                        player_1_name: player_name.clone(),
                        player_2: Zero::zero(),
                        player_2_name: Default::default(),
                        player_1_hand_commitment: Zero::zero(),
                        player_2_hand_commitment: Zero::zero(),
                        player_1_score: Zero::zero(),
                        player_2_score: Zero::zero(),
                        player_1_lives: 3,
                        player_2_lives: 3,
                        round: Zero::zero(),
                        state: GameState::WaitingForPlayers,
                        condition_id: Zero::zero(),
                    },
                );

            store
                .world
                .emit_event(
                    @GameCreated { id: count, owner: get_caller_address(), name: player_name },
                );
            count
        }

        fn join(ref self: ContractState, game_id: u32, player_name: ByteArray) {
            let mut store = self.store_default();
            let mut game = store.get_game(game_id);

            assert!(
                game.state == GameState::WaitingForPlayers,
                "[Game] - The game is not waiting for players",
            );
            game.player_2 = get_caller_address();
            game.player_2_name = player_name.clone();
            game.state = GameState::WaitingForHandCommitments;
            store.set_game(game);

            store
                .world
                .emit_event(
                    @GameJoined { id: game_id, player: get_caller_address(), name: player_name },
                );
        }

        fn submit_hand_commitment(ref self: ContractState, game_id: u32, hand_commitment: felt252) {
            let mut store = self.store_default();
            let mut game = store.get_game(game_id);
            assert!(
                game.state == GameState::WaitingForHandCommitments,
                "[Game] - The game is not waiting for hand commitments",
            );
            assert!(
                game.player_1 == get_caller_address() || game.player_2 == get_caller_address(),
                "[Game] - You cannot submit a hand commitment if you are not part of this game",
            );

            if game.player_1 == get_caller_address() {
                game.player_1_hand_commitment = hand_commitment;
            } else {
                game.player_2_hand_commitment = hand_commitment;
            }

            if game.player_1_hand_commitment.is_non_zero()
                && game.player_2_hand_commitment.is_non_zero() {
                game.state = GameState::ConditionPhase;
                game.round = 1;

                let condition = ConditionTrait::create();
                game.condition_id = condition.id;
                store.set_condition(condition);
            }
            store.set_game(game);

            store
                .world
                .emit_event(
                    @HandCommitmentSubmitted {
                        game_id: game_id,
                        player: get_caller_address(),
                        hand_commitment: hand_commitment,
                    },
                );
        }

        fn submit_condition_choice(ref self: ContractState, game_id: u32, player_choice: bool) {
            let mut store = self.store_default();
            let mut game = store.get_game(game_id);
            assert!(
                game.state == GameState::ConditionPhase,
                "[Game] - The game is not in the condition phase",
            );

            store
                .set_player_condition_choice(
                    PlayerConditionChoice {
                        game_id: game_id,
                        round: game.round,
                        player: get_caller_address(),
                        choice: if player_choice {
                            CHOICE_TRUE
                        } else {
                            CHOICE_FALSE
                        },
                    },
                );

            let player_condition_1 = store
                .get_player_condition_choice(game_id, game.round, game.player_1);
            let player_condition_2 = store
                .get_player_condition_choice(game_id, game.round, game.player_2);

            if player_condition_1.choice.is_non_zero() && player_condition_2.choice.is_non_zero() {
                game.state = GameState::ChallengePhase;
                store.set_game(game);
            }
        }

        fn submit_challenge_choice(ref self: ContractState, game_id: u32, player_choice: bool) {
            let mut store = self.store_default();
            let mut game = store.get_game(game_id);
            assert!(
                game.state == GameState::ChallengePhase,
                "[Game] - The game is not in the challenge phase",
            );
            assert!(
                game.player_1 == get_caller_address() || game.player_2 == get_caller_address(),
                "[Game] - You cannot submit a challenge choice if you are not part of this game",
            );

            store
                .set_player_challenge_choice(
                    PlayerChallengeChoice {
                        game_id: game_id,
                        round: game.round,
                        player: get_caller_address(),
                        choice: if player_choice {
                            CHOICE_TRUE
                        } else {
                            CHOICE_FALSE
                        },
                    },
                );

            let player_challenge_1 = store
                .get_player_challenge_choice(game_id, game.round, game.player_1);
            let player_challenge_2 = store
                .get_player_challenge_choice(game_id, game.round, game.player_2);

            if player_challenge_1.choice.is_non_zero() && player_challenge_2.choice.is_non_zero() {
                self.resolve_round(game_id);

                // Create a new condition
                let condition = ConditionTrait::create();
                game.condition_id = condition.id;
                store.set_condition(condition);

                game.round += 1;
                game.state = GameState::ConditionPhase;
                store.set_game(game);
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn resolve_round(ref self: ContractState, game_id: u32) {// let mut store = self.store_default();
        // let game = store.get_game(game_id);
        }

        fn store_default(self: @ContractState) -> Store {
            StoreTrait::new(self.world_default())
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"liars-proof")
        }
    }
}
