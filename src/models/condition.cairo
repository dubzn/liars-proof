use starknet::ContractAddress;

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct Condition {
    #[key]
    pub id: u32,
    pub condition: u32,
    pub comparator: u32,
    pub value: u32,
    pub suit: u32,
}

impl ConditionDefault of Default<Condition> {
    fn default() -> Condition {
        Condition { id: 0, condition: 0, comparator: 0, value: 0, suit: 0 }
    }
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
