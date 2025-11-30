use starknet::ContractAddress;

#[starknet::interface]
pub trait IUltraStarknetZKHonkVerifier<TContractState> {
    fn verify_ultra_starknet_zk_honk_proof(
        self: @TContractState, full_proof_with_hints: Span<felt252>,
    ) -> Option<Span<u256>>;
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct RoundProof {
    #[key]
    pub game_id: u32,
    #[key]
    pub round: u32,
    #[key]
    pub player: ContractAddress,
    pub submitted: bool,
    pub is_valid: bool,
}

#[derive(Drop, Serde)]
#[dojo::event]
pub struct RoundProofSubmitted {
    #[key]
    pub game_id: u32,
    #[key]
    pub round: u32,
    #[key]
    pub player: ContractAddress,
    pub submitted: bool,
    pub is_valid: bool,
}

pub const VERIFIER_ADDRESS_KEY: felt252 = selector!("VERIFIER_ADDRESS");
#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct Verifier {
    #[key]
    pub key: felt252,
    pub address: ContractAddress,
}
