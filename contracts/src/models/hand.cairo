use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct HandCommitmentSubmitted {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub hand_commitment: felt252,
}
