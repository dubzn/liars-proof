use starknet::ContractAddress;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct PlayerConditionChoice {
    #[key]
    pub game_id: u32,
    #[key]
    pub round: u32,
    #[key]
    pub player: ContractAddress,
    pub choice: u32,
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct PlayerChallengeChoice {
    #[key]
    pub game_id: u32,
    #[key]
    pub round: u32,
    #[key]
    pub player: ContractAddress,
    pub choice: u32,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct PlayerChallengeSubmitted {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub name: ByteArray,
    pub challenge: bool,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct PlayerConditionSubmitted {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub name: ByteArray,
    pub choice: bool,
}
