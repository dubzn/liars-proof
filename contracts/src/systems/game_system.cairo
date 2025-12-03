#[starknet::interface]
pub trait IGameSystem<T> {
    fn create(ref self: T, player_name: ByteArray) -> u32;
    fn join(ref self: T, game_id: u32, player_name: ByteArray);
    fn submit_hand_commitment(ref self: T, game_id: u32, hand_commitment: u256);
    fn submit_condition_choice(ref self: T, game_id: u32, player_choice: bool);
    fn submit_challenge_choice(ref self: T, game_id: u32, player_choice: bool);
    fn submit_round_proof(ref self: T, game_id: u32, full_proof_with_hints: Span<felt252>);
    fn get_condition(self: @T, game_id: u32) -> crate::models::condition::Condition;
}

#[dojo::contract]
pub mod game_system {
    use core::num::traits::zero::Zero;
    use dojo::event::EventStorage;
    use starknet::{ContractAddress, SyscallResultTrait, get_caller_address};
    use crate::models::game::{Game, GameCreated, GameJoined, GameOver, GameState};
    use crate::models::hand::HandCommitmentSubmitted;
    use crate::models::proof::RoundProof;
    use crate::traits::condition::ConditionTrait;
    use crate::traits::store::{Store, StoreTrait};
    use super::IGameSystem;

    fn dojo_init(ref self: ContractState, verifier_address: ContractAddress) {
        let mut store = self.store_default();
        store.set_verifier_address(verifier_address);
        store.set_game_count(1);
    }

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
                        player_1_condition_submitted: false,
                        player_1_condition_choice: false,
                        player_2_condition_submitted: false,
                        player_2_condition_choice: false,
                        player_1_challenge_submitted: false,
                        player_1_challenge_choice: false,
                        player_2_challenge_submitted: false,
                        player_2_challenge_choice: false,
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

        fn submit_hand_commitment(ref self: ContractState, game_id: u32, hand_commitment: u256) {
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

                let condition = ConditionTrait::create(ref store);
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

            // Update choice directly in the game model
            if game.player_1 == get_caller_address() {
                game.player_1_condition_submitted = true;
                game.player_1_condition_choice = player_choice;
            } else {
                game.player_2_condition_submitted = true;
                game.player_2_condition_choice = player_choice;
            }

            // Check if both players have submitted
            if game.player_1_condition_submitted && game.player_2_condition_submitted {
                game.state = GameState::ChallengePhase;
            }

            store.set_game(game);
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

            // Update choice directly in the game model
            if game.player_1 == get_caller_address() {
                game.player_1_challenge_submitted = true;
                game.player_1_challenge_choice = player_choice;
            } else {
                game.player_2_challenge_submitted = true;
                game.player_2_challenge_choice = player_choice;
            }

            // Check if both players have submitted
            if game.player_1_challenge_submitted && game.player_2_challenge_submitted {
                game.state = GameState::ResultPhase;
            }

            store.set_game(game);
        }

        fn submit_round_proof(
            ref self: ContractState, game_id: u32, full_proof_with_hints: Span<felt252>,
        ) {
            let mut store = self.store_default();
            let game = store.get_game(game_id);
            let condition = store.get_condition(game.condition_id);
            let caller = get_caller_address();

            assert!(
                game.state == GameState::ResultPhase,
                "[Game] - The game is not in the result phase",
            );
            assert!(
                game.player_1 == caller || game.player_2 == caller,
                "[Game] - You cannot submit a proof if you are not part of this game",
            );

            // Get the hand commitment for the current player
            let hand_commitment = if game.player_1 == caller {
                game.player_1_hand_commitment
            } else {
                game.player_2_hand_commitment
            };

            // Verify the proof using library_call_syscall
            const VERIFIER_CLASSHASH: felt252 =
                0x021ca8867f3e5ff0318ccfb8102c1b303f0d74bdedf8c564dba2786b1b52e6c0;

            let mut is_valid = false;

            if full_proof_with_hints.len() > 0 {
                let mut res = starknet::syscalls::library_call_syscall(
                    VERIFIER_CLASSHASH.try_into().unwrap(),
                    selector!("verify_ultra_starknet_zk_honk_proof"),
                    full_proof_with_hints,
                )
                    .unwrap_syscall();

                // Deserialize the public inputs from the result
                let public_inputs_option = Serde::<Option<Span<u256>>>::deserialize(ref res)
                    .unwrap();

                if public_inputs_option.is_some() {
                    let public_inputs = public_inputs_option.unwrap();

                    // Validate that we have the expected 6 public inputs
                    assert!(public_inputs.len() == 6, "[Game] - Invalid number of public inputs");

                    // Extract and validate public inputs
                    let pi_game_id: u32 = (*public_inputs[0]).try_into().unwrap();
                    let pi_hand_commitment = *public_inputs[1];
                    let pi_condition_id: u32 = (*public_inputs[2]).try_into().unwrap();
                    let pi_comparator: u32 = (*public_inputs[3]).try_into().unwrap();
                    let pi_value: u32 = (*public_inputs[4]).try_into().unwrap();
                    let pi_suit: u32 = (*public_inputs[5]).try_into().unwrap();

                    // Validate all public inputs match the game state
                    assert!(pi_game_id == game_id, "[Game] - Game ID mismatch in proof");
                    assert!(
                        pi_hand_commitment == hand_commitment,
                        "[Game] - Hand commitment mismatch in proof",
                    );
                    assert!(
                        pi_condition_id == condition.condition,
                        "[Game] - Condition type mismatch in proof",
                    );
                    assert!(
                        pi_comparator == condition.comparator,
                        "[Game] - Comparator mismatch in proof",
                    );
                    assert!(pi_value == condition.value, "[Game] - Value mismatch in proof");
                    assert!(pi_suit == condition.suit, "[Game] - Suit mismatch in proof");

                    is_valid = true;
                }
            }

            store
                .set_player_round_proof(
                    RoundProof {
                        game_id: game.id,
                        round: game.round,
                        player: caller,
                        submitted: true,
                        is_valid,
                    },
                );
            let player_1_proof = store.get_player_round_proof(game.id, game.round, game.player_1);
            let player_2_proof = store.get_player_round_proof(game.id, game.round, game.player_2);

            if player_1_proof.submitted && player_2_proof.submitted {
                let mut game = self.resolve_round(game.id, player_1_proof, player_2_proof);

                match game.state {
                    GameState::GameOver => {
                        let (winner_name, winner_address, loser_name, loser_address) = self
                            .resolve_game_over(@game);
                        store
                            .world
                            .emit_event(
                                @GameOver {
                                    game_id: game_id,
                                    winner: *winner_address,
                                    winner_name: winner_name.clone(),
                                    loser: *loser_address,
                                    loser_name: loser_name.clone(),
                                },
                            );
                    },
                    GameState::ConditionPhase => {
                        let condition = ConditionTrait::create(ref store);
                        game.condition_id = condition.id;
                        store.set_condition(condition);
                    },
                    _ => {},
                }
                store.set_game(game);
            }
        }

        fn get_condition(
            self: @ContractState, game_id: u32,
        ) -> crate::models::condition::Condition {
            let mut store = self.store_default();
            let game = store.get_game(game_id);
            store.get_condition(game.condition_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn resolve_round(
            ref self: ContractState,
            game_id: u32,
            player_1_proof: RoundProof,
            player_2_proof: RoundProof,
        ) -> Game {
            let mut store = self.store_default();
            let mut game = store.get_game(game_id);

            // Get choices from game model
            let player_1_lies = game.player_1_condition_choice && !player_1_proof.is_valid;
            let player_2_lies = game.player_2_condition_choice && !player_2_proof.is_valid;

            // player_x_challenge_choice = false -> PX thinks the other player is lying
            // player_x_challenge_choice = true  -> PX thinks the other player is telling the truth
            let player_1_call_lier = !game.player_1_challenge_choice;
            let player_2_call_lier = !game.player_2_challenge_choice;

            // - If Player 1 lies and Player 2 doesn't believe -> Player 2 gets 20 points and
            // Player 1 loses 1 life - If Player 1 lies and Player 2 believes -> Player 1 gets 10
            // points (lied successfully)
            // - If Player 1 doesn't lie and Player 2 doesn't believe -> Player 2 loses 1 life
            // - If Player 1 doesn't lie and Player 2 believes -> Nothing happens
            if player_1_lies && player_2_call_lier {
                game.player_2_score += 20;
                game.player_1_lives -= 1;
            } else if player_1_lies && !player_2_call_lier {
                game.player_1_score += 10;
            } else if !player_1_lies && player_2_call_lier {
                game.player_2_lives -= 1;
            }

            // - If Player 2 lies and Player 1 doesn't believe -> Player 1 gets 20 points and
            // Player 2 loses 1 life - If Player 2 lies and Player 1 believes -> Player 2 gets 10
            // points (lied successfully)
            // - If Player 2 doesn't lie and Player 1 doesn't believe -> Player 1 loses 1 life
            // - If Player 2 doesn't lie and Player 1 believes -> Nothing happens
            if player_2_lies && player_1_call_lier {
                game.player_1_score += 20;
                game.player_2_lives -= 1;
            } else if player_2_lies && !player_1_call_lier {
                game.player_2_score += 10;
            } else if !player_2_lies && player_1_call_lier {
                game.player_1_lives -= 1;
            }

            if game.player_1_lives == 0 || game.player_2_lives == 0 {
                game.state = GameState::GameOver;
            } else if game.player_1_score >= 50 || game.player_2_score >= 50 {
                game.state = GameState::GameOver;
            } else {
                // Advance to next round and reset choice fields
                game.round += 1;
                game.state = GameState::ConditionPhase;

                // Reset condition and challenge choices for the new round
                game.player_1_condition_submitted = false;
                game.player_1_condition_choice = false;
                game.player_2_condition_submitted = false;
                game.player_2_condition_choice = false;
                game.player_1_challenge_submitted = false;
                game.player_1_challenge_choice = false;
                game.player_2_challenge_submitted = false;
                game.player_2_challenge_choice = false;
            }
            game
        }

        fn resolve_game_over(
            ref self: ContractState, game: @Game,
        ) -> (@ByteArray, @ContractAddress, @ByteArray, @ContractAddress) {
            if game.player_1_lives == @0 {
                (game.player_2_name, game.player_2, game.player_1_name, game.player_1)
            } else if game.player_2_lives == @0 {
                (game.player_1_name, game.player_1, game.player_2_name, game.player_2)
            } else if game.player_1_score >= @50 {
                (game.player_1_name, game.player_1, game.player_2_name, game.player_2)
            } else {
                (game.player_2_name, game.player_2, game.player_1_name, game.player_1)
            }
        }

        fn store_default(self: @ContractState) -> Store {
            StoreTrait::new(self.world_default())
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"liars_proof3")
        }
    }
}

fn proof_is_non_empty(proof: Span<felt252>) -> bool {
    proof.len() > 0
}
