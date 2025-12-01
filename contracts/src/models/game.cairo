use starknet::ContractAddress;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    pub player_1: ContractAddress,
    pub player_1_name: ByteArray,
    pub player_2: ContractAddress,
    pub player_2_name: ByteArray,
    pub player_1_hand_commitment: u256,
    pub player_2_hand_commitment: u256,
    pub player_1_score: u32,
    pub player_2_score: u32,
    pub player_1_lives: u32,
    pub player_2_lives: u32,
    pub round: u32,
    pub state: GameState,
    pub condition_id: u32,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug, DojoStore, Default)]
pub enum GameState {
    #[default]
    WaitingForPlayers,
    WaitingForHandCommitments,
    ConditionPhase,
    ChallengePhase,
    ResultPhase,
    GameOver,
}

pub const GAME_COUNT_KEY: felt252 = selector!("GAME_COUNT");
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct GameCount {
    #[key]
    pub key: felt252,
    pub count: u32,
}

// EVENTS
#[derive(Drop, Serde)]
#[dojo::event]
pub struct GameCreated {
    #[key]
    pub id: u32,
    pub owner: ContractAddress,
    pub name: ByteArray,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct GameJoined {
    #[key]
    pub id: u32,
    pub player: ContractAddress,
    pub name: ByteArray,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct GameOver {
    #[key]
    pub game_id: u32,
    pub winner: ContractAddress,
    pub winner_name: ByteArray,
    pub loser: ContractAddress,
    pub loser_name: ByteArray,
}
