use crate::models::condition::Condition;
use crate::traits::random::RandomTrait;

#[generate_trait]
pub impl ConditionTraitImpl of ConditionTrait {
    fn create() -> Condition {
        let random = RandomTrait::create('random');
        Condition { id: 0, condition: 0, comparator: 0, value: 0, suit: 0 }
    }
}

fn condition_list() -> Array<u32> {
    array![ // CONDITION_COUNT_GE,
    ]
}

fn comparator_list(condition_id: u32) -> Array<u32> {
    array![]
}

fn value_list(condition_id: u32) -> Array<u32> {
    array![]
}

fn suit_list(condition_id: u32) -> Array<u32> {
    array![]
}
