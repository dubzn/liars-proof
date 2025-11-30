use crate::models::condition::Condition;
use crate::traits::random::RandomTrait;
use crate::traits::store::{Store, StoreTrait};

#[generate_trait]
pub impl ConditionTraitImpl of ConditionTrait {
    fn create(ref store: Store) -> Condition {
        let mut random = RandomTrait::create('random');
        let condition = random.get_random_number_zero_indexed(condition_list().len());
        let quantity = *quantity_list(condition).at(random.get_random_number_zero_indexed(quantity_list(condition).len()));
        let comparator = *comparator_list(condition).at(random.get_random_number_zero_indexed(comparator_list(condition).len()));
        let value = *value_list(condition).at(random.get_random_number_zero_indexed(value_list(condition).len()));
        let suit = *suit_list(condition).at(random.get_random_number_zero_indexed(suit_list(condition).len()));

        let mut count = store.get_condition_count().count + 1;
        store.set_condition_count(count);
        Condition { id: count, condition, quantity, comparator, value, suit }
    }
}

// CONDITION_CARDS_SUM_COMPARATOR_THAN_X
// - Sumo las cartas y veo si es mayor, menor o igual a X
// - COMPARATOR = {1, 2, 3} (<, >, =)
// - VALUE = rango {10, 20}
const CONDITION_CARDS_SUM_COMPARATOR_THAN_X: u32 = 1;

// CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y
// Cuento QUANTITY cartas de un VALUE
// - QUANTITY = rango {1, 2, 3}
// - VALUE = rango {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
const CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y: u32 = 2;

// CONDITION_EXACTLY_X_PAIRS
// Cuento QUANTITY cartas pares
// - QUANTITY = rango {1, 2, 3}
const CONDITION_EXACTLY_X_PAIRS: u32 = 3;

// CONDITION_EXACTLY_X_ODDS
// Cuento QUANTITY cartas impares
// - QUANTITY = rango {1, 2, 3}
const CONDITION_EXACTLY_X_ODDS: u32 = 4;

// CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE
// Si tenes QUANTITY cartas de VALUE menor/mayor/igual que Y
// - QUANTITY = rango {1, 2, 3}
// - COMPARATOR = {1, 2, 3} (<, >, =)
// - VALUE = rango {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
const CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE: u32 = 5;

// CONDITION_EXACTLY_X_DISTINCT_VALUES
// Cuento QUANTITY cartas distintas
// - QUANTITY = rango {1, 2, 3}
const CONDITION_EXACTLY_X_DISTINCT_VALUES: u32 = 6;

// CONDITION_EXACTLY_X_DISTINCT_SUITS
// Cuento QUANTITY cartas distintas
// - QUANTITY = rango {1, 2, 3}
const CONDITION_EXACTLY_X_DISTINCT_SUITS: u32 = 7;

// CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X
// - COMPARATOR = {1, 2, 3} (<, >, =)
// - VALUE = rango {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
const CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X: u32 = 8;

// CONDITION_LOWEST_CARD_COMPARATOR_THAN_X
// - COMPARATOR = {1, 2, 3} (<, >, =)
// - VALUE = range {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
const CONDITION_LOWEST_CARD_COMPARATOR_THAN_X: u32 = 9;

fn condition_list() -> Array<u32> {
    array![
        CONDITION_CARDS_SUM_COMPARATOR_THAN_X, CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y,
        CONDITION_EXACTLY_X_PAIRS, CONDITION_EXACTLY_X_ODDS,
        CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE, CONDITION_EXACTLY_X_DISTINCT_VALUES,
        CONDITION_EXACTLY_X_DISTINCT_SUITS, CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X,
        CONDITION_LOWEST_CARD_COMPARATOR_THAN_X,
    ]
}

fn quantity_list(condition_id: u32) -> Array<u32> {
    if condition_id == CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y {
        array![1, 2, 3]
    } else if condition_id == CONDITION_EXACTLY_X_PAIRS {
        array![1, 2, 3]
    } else if condition_id == CONDITION_EXACTLY_X_ODDS {
        array![1, 2, 3]
    } else if condition_id == CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE {
        array![1, 2, 3]
    } else if condition_id == CONDITION_EXACTLY_X_DISTINCT_VALUES {
        array![1, 2, 3]
    } else if condition_id == CONDITION_EXACTLY_X_DISTINCT_SUITS {
        array![1, 2, 3]
    } else {
        array![0]
    }
}

const LESS_THAN: u32 = 1;
const GREATER_THAN: u32 = 2;
const EQUAL_TO: u32 = 3;

fn comparator_list(condition_id: u32) -> Array<u32> {
    if condition_id == CONDITION_CARDS_SUM_COMPARATOR_THAN_X {
        array![LESS_THAN, GREATER_THAN, EQUAL_TO]
    } else if condition_id == CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE {
        array![LESS_THAN, GREATER_THAN, EQUAL_TO]
    } else if condition_id == CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X {
        array![LESS_THAN, GREATER_THAN, EQUAL_TO]
    } else if condition_id == CONDITION_LOWEST_CARD_COMPARATOR_THAN_X {
        array![LESS_THAN, GREATER_THAN, EQUAL_TO]
    } else {
        array![0]
    }
}

fn value_list(condition_id: u32) -> Array<u32> {
    if condition_id == CONDITION_CARDS_SUM_COMPARATOR_THAN_X {
        array![10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    } else if condition_id == CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y {
        array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    } else if condition_id == CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE {
        array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    } else if condition_id == CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X {
        array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    } else if condition_id == CONDITION_LOWEST_CARD_COMPARATOR_THAN_X {
        array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    } else {
        array![0]
    }
}

const CLUBS: u32 = 1;
const SPADES: u32 = 2;
const DIAMONDS: u32 = 3;
const HEARTS: u32 = 4;

fn suit_list(condition_id: u32) -> Array<u32> {
    array![0]
}
