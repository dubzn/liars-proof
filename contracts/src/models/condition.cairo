use starknet::ContractAddress;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct Condition {
    #[key]
    pub id: u32,
    pub condition: u32,
    pub quantity: u32,
    pub comparator: u32,
    pub value: u32,
    pub suit: u32,
}

pub const CONDITION_COUNT_KEY: felt252 = selector!("CONDITION_COUNT");
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct ConditionCount {
    #[key]
    pub key: felt252,
    pub count: u32,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct ConditionCreated {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub name: ByteArray,
    pub choice: bool,
}
