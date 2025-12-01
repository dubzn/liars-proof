use std::hash::pedersen_hash;

// Condition IDs aligned with contract specification
global CONDITION_CARDS_SUM_COMPARATOR_THAN_X: u8 = 1;
global CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y: u8 = 2;
global CONDITION_EXACTLY_X_CARDS_OF_SUIT_Y: u8 = 3;
global CONDITION_EXACTLY_X_PAIRS: u8 = 4;
global CONDITION_EXACTLY_X_ODDS: u8 = 5;
global CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE: u8 = 6;
global CONDITION_EXACTLY_X_DISTINCT_VALUES: u8 = 7;
global CONDITION_EXACTLY_X_DISTINCT_SUITS: u8 = 8;
global CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X: u8 = 9;
global CONDITION_LOWEST_CARD_COMPARATOR_THAN_X: u8 = 10;

// Comparator values
global LESS_THAN: u8 = 1;
global GREATER_THAN: u8 = 2;
global EQUAL_TO: u8 = 3;

// Suit values
global CLUBS: u8 = 1;
global SPADES: u8 = 2;
global DIAMONDS: u8 = 3;
global HEARTS: u8 = 4;

// Private inputs - the actual cards
// Represented as [value1, suit1, value2, suit2, value3, suit3]
struct Hand {
    card1_value: u8,
    card1_suit: u8,
    card2_value: u8,
    card2_suit: u8,
    card3_value: u8,
    card3_suit: u8,
}

// Main circuit that validates a player's hand meets the condition
fn main(
    // Private inputs (known only to the player)
    hand: Hand,
    // Public inputs (known to everyone)
    _game_id: pub u32,
    hand_commitment: pub Field,
    condition_id: pub u8,
    comparator: pub u8,
    value: pub u8,
    suit: pub u8,
) {
    // 1. Verify that the hand matches the commitment
    verify_hand_commitment(hand, hand_commitment);

    // 2. Validate the hand meets the condition
    let meets_condition = validate_condition(hand, condition_id, comparator, value, suit);
    assert(meets_condition, "Hand does not meet the condition");
}

// Verify that the hand commitment matches the actual cards
fn verify_hand_commitment(hand: Hand, commitment: Field) {
    let card1 = pack_card(hand.card1_value, hand.card1_suit);
    let card2 = pack_card(hand.card2_value, hand.card2_suit);
    let card3 = pack_card(hand.card3_value, hand.card3_suit);

    let temp = pedersen_hash([card1, card2]);
    let computed_hash = pedersen_hash([temp, card3]);
    // println("Computed hash:");
    // println(computed_hash);

    assert(computed_hash == commitment, "Hand commitment does not match");
}

// Pack a card (value, suit) into a single Field element
fn pack_card(value: u8, suit: u8) -> Field {
    (value as Field) * 256 + (suit as Field)
}

// Main validation function that routes to specific condition checks
fn validate_condition(hand: Hand, condition_id: u8, comparator: u8, value: u8, suit: u8) -> bool {
    if condition_id == CONDITION_CARDS_SUM_COMPARATOR_THAN_X {
        validate_sum_comparator(hand, comparator, value)
    } else if condition_id == CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y {
        validate_exactly_x_cards_of_value_y(hand, value, suit)
    } else if condition_id == CONDITION_EXACTLY_X_CARDS_OF_SUIT_Y {
        validate_exactly_x_cards_of_suit_y(hand, value, suit)
    } else if condition_id == CONDITION_EXACTLY_X_PAIRS {
        validate_exactly_x_pairs(hand, value)
    } else if condition_id == CONDITION_EXACTLY_X_ODDS {
        validate_exactly_x_odds(hand, value)
    } else if condition_id == CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE {
        validate_exactly_x_comparator_than_specific_value(hand, value, comparator, suit)
    } else if condition_id == CONDITION_EXACTLY_X_DISTINCT_VALUES {
        validate_exactly_x_distinct_values(hand, value)
    } else if condition_id == CONDITION_EXACTLY_X_DISTINCT_SUITS {
        validate_exactly_x_distinct_suits(hand, value)
    } else if condition_id == CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X {
        validate_highest_card_comparator_than_x(hand, comparator, value)
    } else if condition_id == CONDITION_LOWEST_CARD_COMPARATOR_THAN_X {
        validate_lowest_card_comparator_than_x(hand, comparator, value)
    } else {
        false
    }
}

// Condition 1: Cards sum comparator than X
// COMPARATOR = {1, 2, 3} (<, >, =)
// VALUE = range {10, 20}
fn validate_sum_comparator(hand: Hand, comparator: u8, threshold: u8) -> bool {
    let sum = hand.card1_value + hand.card2_value + hand.card3_value;

    if comparator == LESS_THAN {
        sum < threshold
    } else if comparator == GREATER_THAN {
        sum > threshold
    } else if comparator == EQUAL_TO {
        sum == threshold
    } else {
        false
    }
}

// Condition 2: Exactly X cards of value Y
// QUANTITY = range {1, 2, 3}
// VALUE = range {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
fn validate_exactly_x_cards_of_value_y(hand: Hand, quantity: u8, target_value: u8) -> bool {
    let mut matches = 0;
    if hand.card1_value == target_value {
        matches += 1;
    }
    if hand.card2_value == target_value {
        matches += 1;
    }
    if hand.card3_value == target_value {
        matches += 1;
    }
    matches == quantity
}

// Condition 3: Exactly X cards of suit Y
// QUANTITY = range {1, 2, 3}
// SUIT = range {1, 2, 3, 4}
fn validate_exactly_x_cards_of_suit_y(hand: Hand, quantity: u8, target_suit: u8) -> bool {
    let mut matches = 0;
    if hand.card1_suit == target_suit {
        matches += 1;
    }
    if hand.card2_suit == target_suit {
        matches += 1;
    }
    if hand.card3_suit == target_suit {
        matches += 1;
    }
    matches == quantity
}

// Condition 4: Exactly X pairs (even cards)
// QUANTITY = range {1, 2, 3}
fn validate_exactly_x_pairs(hand: Hand, quantity: u8) -> bool {
    let mut even_count = 0;
    if is_even(hand.card1_value) {
        even_count += 1;
    }
    if is_even(hand.card2_value) {
        even_count += 1;
    }
    if is_even(hand.card3_value) {
        even_count += 1;
    }
    even_count == quantity
}

// Condition 5: Exactly X odds (odd cards)
// QUANTITY = range {1, 2, 3}
fn validate_exactly_x_odds(hand: Hand, quantity: u8) -> bool {
    let mut odd_count = 0;
    if !is_even(hand.card1_value) {
        odd_count += 1;
    }
    if !is_even(hand.card2_value) {
        odd_count += 1;
    }
    if !is_even(hand.card3_value) {
        odd_count += 1;
    }
    odd_count == quantity
}

// Condition 6: Exactly X cards comparator than specific value
// QUANTITY = range {1, 2, 3}
// COMPARATOR = {1, 2, 3} (<, >, =)
// VALUE = range {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
fn validate_exactly_x_comparator_than_specific_value(
    hand: Hand,
    quantity: u8,
    comparator: u8,
    threshold: u8,
) -> bool {
    let mut matches = 0;

    if comparator == LESS_THAN {
        if hand.card1_value < threshold {
            matches += 1;
        }
        if hand.card2_value < threshold {
            matches += 1;
        }
        if hand.card3_value < threshold {
            matches += 1;
        }
    } else if comparator == GREATER_THAN {
        if hand.card1_value > threshold {
            matches += 1;
        }
        if hand.card2_value > threshold {
            matches += 1;
        }
        if hand.card3_value > threshold {
            matches += 1;
        }
    } else if comparator == EQUAL_TO {
        if hand.card1_value == threshold {
            matches += 1;
        }
        if hand.card2_value == threshold {
            matches += 1;
        }
        if hand.card3_value == threshold {
            matches += 1;
        }
    }

    matches == quantity
}

// Condition 7: Exactly X distinct values
// QUANTITY = range {1, 2, 3}
fn validate_exactly_x_distinct_values(hand: Hand, quantity: u8) -> bool {
    let mut distinct = 1; // Card 1 is always counted

    if hand.card2_value != hand.card1_value {
        distinct += 1;
    }

    if (hand.card3_value != hand.card1_value) & (hand.card3_value != hand.card2_value) {
        distinct += 1;
    }

    distinct == quantity
}

// Condition 8: Exactly X distinct suits
// QUANTITY = range {1, 2, 3}
fn validate_exactly_x_distinct_suits(hand: Hand, quantity: u8) -> bool {
    let mut distinct_suits = 1; // Card 1 suit is always counted

    if hand.card2_suit != hand.card1_suit {
        distinct_suits += 1;
    }

    if (hand.card3_suit != hand.card1_suit) & (hand.card3_suit != hand.card2_suit) {
        distinct_suits += 1;
    }

    distinct_suits == quantity
}

// Condition 9: Highest card comparator than X
// COMPARATOR = {1, 2, 3} (<, >, =)
// VALUE = range {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
fn validate_highest_card_comparator_than_x(hand: Hand, comparator: u8, threshold: u8) -> bool {
    let max_val = max_of_three(hand.card1_value, hand.card2_value, hand.card3_value);

    if comparator == LESS_THAN {
        max_val < threshold
    } else if comparator == GREATER_THAN {
        max_val > threshold
    } else if comparator == EQUAL_TO {
        max_val == threshold
    } else {
        false
    }
}

// Condition 10: Lowest card comparator than X
// COMPARATOR = {1, 2, 3} (<, >, =)
// VALUE = range {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}
fn validate_lowest_card_comparator_than_x(hand: Hand, comparator: u8, threshold: u8) -> bool {
    let min_val = min_of_three(hand.card1_value, hand.card2_value, hand.card3_value);

    if comparator == LESS_THAN {
        min_val < threshold
    } else if comparator == GREATER_THAN {
        min_val > threshold
    } else if comparator == EQUAL_TO {
        min_val == threshold
    } else {
        false
    }
}

// Helper: Check if a value is even
fn is_even(value: u8) -> bool {
    (value % 2) == 0
}

// Helper: Find max of three values
fn max_of_three(a: u8, b: u8, c: u8) -> u8 {
    let max_ab = if a > b { a } else { b };
    if max_ab > c {
        max_ab
    } else {
        c
    }
}

// Helper: Find min of three values
fn min_of_three(a: u8, b: u8, c: u8) -> u8 {
    let min_ab = if a < b { a } else { b };
    if min_ab < c {
        min_ab
    } else {
        c
    }
}

// ============================================================================
// TESTS
// ============================================================================

// Test Condition 1: Cards sum comparator than X
#[test]
fn test_condition_1_sum_less_than() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 3,
        card2_suit: 2,
        card3_value: 4,
        card3_suit: 3,
    };
    // Sum is 9
    assert(validate_sum_comparator(hand, LESS_THAN, 10));
    assert(!validate_sum_comparator(hand, LESS_THAN, 9));
}

#[test]
fn test_condition_1_sum_greater_than() {
    let hand = Hand {
        card1_value: 10,
        card1_suit: 1,
        card2_value: 8,
        card2_suit: 2,
        card3_value: 7,
        card3_suit: 3,
    };
    // Sum is 25
    assert(validate_sum_comparator(hand, GREATER_THAN, 20));
    assert(!validate_sum_comparator(hand, GREATER_THAN, 25));
}

#[test]
fn test_condition_1_sum_equal_to() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: 1,
        card2_value: 5,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    // Sum is 15
    assert(validate_sum_comparator(hand, EQUAL_TO, 15));
    assert(!validate_sum_comparator(hand, EQUAL_TO, 14));
}

// Test Condition 2: Exactly X cards of value Y
#[test]
fn test_condition_2_one_card_of_value() {
    let hand = Hand {
        card1_value: 7,
        card1_suit: 1,
        card2_value: 3,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    assert(validate_exactly_x_cards_of_value_y(hand, 1, 7));
    assert(!validate_exactly_x_cards_of_value_y(hand, 2, 7));
}

#[test]
fn test_condition_2_two_cards_of_value() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: 1,
        card2_value: 5,
        card2_suit: 2,
        card3_value: 8,
        card3_suit: 3,
    };
    assert(validate_exactly_x_cards_of_value_y(hand, 2, 5));
    assert(!validate_exactly_x_cards_of_value_y(hand, 1, 5));
}

#[test]
fn test_condition_2_three_cards_of_value() {
    let hand = Hand {
        card1_value: 11,
        card1_suit: 1,
        card2_value: 11,
        card2_suit: 2,
        card3_value: 11,
        card3_suit: 3,
    };
    assert(validate_exactly_x_cards_of_value_y(hand, 3, 11));
    assert(!validate_exactly_x_cards_of_value_y(hand, 2, 11));
}

// Test Condition 3: Exactly X cards of suit Y
#[test]
fn test_condition_3_one_card_of_suit() {
    let hand = Hand {
        card1_value: 7,
        card1_suit: HEARTS,
        card2_value: 3,
        card2_suit: CLUBS,
        card3_value: 5,
        card3_suit: SPADES,
    };
    assert(validate_exactly_x_cards_of_suit_y(hand, 1, HEARTS));
    assert(!validate_exactly_x_cards_of_suit_y(hand, 2, HEARTS));
}

#[test]
fn test_condition_3_two_cards_of_suit() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: DIAMONDS,
        card2_value: 8,
        card2_suit: DIAMONDS,
        card3_value: 3,
        card3_suit: CLUBS,
    };
    assert(validate_exactly_x_cards_of_suit_y(hand, 2, DIAMONDS));
    assert(!validate_exactly_x_cards_of_suit_y(hand, 3, DIAMONDS));
}

#[test]
fn test_condition_3_three_cards_of_suit() {
    let hand = Hand {
        card1_value: 1,
        card1_suit: SPADES,
        card2_value: 9,
        card2_suit: SPADES,
        card3_value: 13,
        card3_suit: SPADES,
    };
    assert(validate_exactly_x_cards_of_suit_y(hand, 3, SPADES));
    assert(!validate_exactly_x_cards_of_suit_y(hand, 2, SPADES));
}

// Test Condition 4: Exactly X pairs (even cards)
#[test]
fn test_condition_4_one_even_card() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 3,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    assert(validate_exactly_x_pairs(hand, 1));
    assert(!validate_exactly_x_pairs(hand, 2));
}

#[test]
fn test_condition_4_two_even_cards() {
    let hand = Hand {
        card1_value: 4,
        card1_suit: 1,
        card2_value: 8,
        card2_suit: 2,
        card3_value: 7,
        card3_suit: 3,
    };
    assert(validate_exactly_x_pairs(hand, 2));
    assert(!validate_exactly_x_pairs(hand, 1));
}

#[test]
fn test_condition_4_three_even_cards() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 6,
        card2_suit: 2,
        card3_value: 10,
        card3_suit: 3,
    };
    assert(validate_exactly_x_pairs(hand, 3));
    assert(!validate_exactly_x_pairs(hand, 2));
}

// Test Condition 5: Exactly X odds (odd cards)
#[test]
fn test_condition_5_one_odd_card() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: 1,
        card2_value: 4,
        card2_suit: 2,
        card3_value: 6,
        card3_suit: 3,
    };
    assert(validate_exactly_x_odds(hand, 1));
    assert(!validate_exactly_x_odds(hand, 2));
}

#[test]
fn test_condition_5_two_odd_cards() {
    let hand = Hand {
        card1_value: 1,
        card1_suit: 1,
        card2_value: 7,
        card2_suit: 2,
        card3_value: 8,
        card3_suit: 3,
    };
    assert(validate_exactly_x_odds(hand, 2));
    assert(!validate_exactly_x_odds(hand, 3));
}

#[test]
fn test_condition_5_three_odd_cards() {
    let hand = Hand {
        card1_value: 3,
        card1_suit: 1,
        card2_value: 9,
        card2_suit: 2,
        card3_value: 11,
        card3_suit: 3,
    };
    assert(validate_exactly_x_odds(hand, 3));
    assert(!validate_exactly_x_odds(hand, 2));
}

// Test Condition 6: Exactly X cards comparator than specific value
#[test]
fn test_condition_6_less_than() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 4,
        card2_suit: 2,
        card3_value: 8,
        card3_suit: 3,
    };
    // 2 cards are less than 5
    assert(validate_exactly_x_comparator_than_specific_value(hand, 2, LESS_THAN, 5));
    assert(!validate_exactly_x_comparator_than_specific_value(hand, 1, LESS_THAN, 5));
}

#[test]
fn test_condition_6_greater_than() {
    let hand = Hand {
        card1_value: 10,
        card1_suit: 1,
        card2_value: 12,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    // 2 cards are greater than 7
    assert(validate_exactly_x_comparator_than_specific_value(hand, 2, GREATER_THAN, 7));
    assert(!validate_exactly_x_comparator_than_specific_value(hand, 3, GREATER_THAN, 7));
}

#[test]
fn test_condition_6_equal_to() {
    let hand = Hand {
        card1_value: 7,
        card1_suit: 1,
        card2_value: 7,
        card2_suit: 2,
        card3_value: 9,
        card3_suit: 3,
    };
    // 2 cards are equal to 7
    assert(validate_exactly_x_comparator_than_specific_value(hand, 2, EQUAL_TO, 7));
    assert(!validate_exactly_x_comparator_than_specific_value(hand, 1, EQUAL_TO, 7));
}

// Test Condition 7: Exactly X distinct values
#[test]
fn test_condition_7_one_distinct_value() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: 1,
        card2_value: 5,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    assert(validate_exactly_x_distinct_values(hand, 1));
    assert(!validate_exactly_x_distinct_values(hand, 2));
}

#[test]
fn test_condition_7_two_distinct_values() {
    let hand = Hand {
        card1_value: 3,
        card1_suit: 1,
        card2_value: 3,
        card2_suit: 2,
        card3_value: 8,
        card3_suit: 3,
    };
    assert(validate_exactly_x_distinct_values(hand, 2));
    assert(!validate_exactly_x_distinct_values(hand, 1));
}

#[test]
fn test_condition_7_three_distinct_values() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 7,
        card2_suit: 2,
        card3_value: 11,
        card3_suit: 3,
    };
    assert(validate_exactly_x_distinct_values(hand, 3));
    assert(!validate_exactly_x_distinct_values(hand, 2));
}

// Test Condition 8: Exactly X distinct suits
#[test]
fn test_condition_8_one_distinct_suit() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: CLUBS,
        card2_value: 7,
        card2_suit: CLUBS,
        card3_value: 11,
        card3_suit: CLUBS,
    };
    assert(validate_exactly_x_distinct_suits(hand, 1));
    assert(!validate_exactly_x_distinct_suits(hand, 2));
}

#[test]
fn test_condition_8_two_distinct_suits() {
    let hand = Hand {
        card1_value: 3,
        card1_suit: HEARTS,
        card2_value: 8,
        card2_suit: HEARTS,
        card3_value: 5,
        card3_suit: DIAMONDS,
    };
    assert(validate_exactly_x_distinct_suits(hand, 2));
    assert(!validate_exactly_x_distinct_suits(hand, 1));
}

#[test]
fn test_condition_8_three_distinct_suits() {
    let hand = Hand {
        card1_value: 1,
        card1_suit: CLUBS,
        card2_value: 9,
        card2_suit: SPADES,
        card3_value: 13,
        card3_suit: DIAMONDS,
    };
    assert(validate_exactly_x_distinct_suits(hand, 3));
    assert(!validate_exactly_x_distinct_suits(hand, 2));
}

// Test Condition 9: Highest card comparator than X
#[test]
fn test_condition_9_highest_less_than() {
    let hand = Hand {
        card1_value: 3,
        card1_suit: 1,
        card2_value: 7,
        card2_suit: 2,
        card3_value: 5,
        card3_suit: 3,
    };
    // Highest is 7, should be less than 10
    assert(validate_highest_card_comparator_than_x(hand, LESS_THAN, 10));
    assert(!validate_highest_card_comparator_than_x(hand, LESS_THAN, 7));
}

#[test]
fn test_condition_9_highest_greater_than() {
    let hand = Hand {
        card1_value: 2,
        card1_suit: 1,
        card2_value: 11,
        card2_suit: 2,
        card3_value: 6,
        card3_suit: 3,
    };
    // Highest is 11, should be greater than 9
    assert(validate_highest_card_comparator_than_x(hand, GREATER_THAN, 9));
    assert(!validate_highest_card_comparator_than_x(hand, GREATER_THAN, 11));
}

#[test]
fn test_condition_9_highest_equal_to() {
    let hand = Hand {
        card1_value: 4,
        card1_suit: 1,
        card2_value: 13,
        card2_suit: 2,
        card3_value: 9,
        card3_suit: 3,
    };
    // Highest is 13
    assert(validate_highest_card_comparator_than_x(hand, EQUAL_TO, 13));
    assert(!validate_highest_card_comparator_than_x(hand, EQUAL_TO, 12));
}

// Test Condition 10: Lowest card comparator than X
#[test]
fn test_condition_10_lowest_less_than() {
    let hand = Hand {
        card1_value: 8,
        card1_suit: 1,
        card2_value: 3,
        card2_suit: 2,
        card3_value: 10,
        card3_suit: 3,
    };
    // Lowest is 3, should be less than 5
    assert(validate_lowest_card_comparator_than_x(hand, LESS_THAN, 5));
    assert(!validate_lowest_card_comparator_than_x(hand, LESS_THAN, 3));
}

#[test]
fn test_condition_10_lowest_greater_than() {
    let hand = Hand {
        card1_value: 7,
        card1_suit: 1,
        card2_value: 10,
        card2_suit: 2,
        card3_value: 9,
        card3_suit: 3,
    };
    // Lowest is 7, should be greater than 5
    assert(validate_lowest_card_comparator_than_x(hand, GREATER_THAN, 5));
    assert(!validate_lowest_card_comparator_than_x(hand, GREATER_THAN, 7));
}

#[test]
fn test_condition_10_lowest_equal_to() {
    let hand = Hand {
        card1_value: 11,
        card1_suit: 1,
        card2_value: 2,
        card2_suit: 2,
        card3_value: 6,
        card3_suit: 3,
    };
    // Lowest is 2
    assert(validate_lowest_card_comparator_than_x(hand, EQUAL_TO, 2));
    assert(!validate_lowest_card_comparator_than_x(hand, EQUAL_TO, 3));
}

// Test hand commitment verification
#[test]
fn test_hand_commitment() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: 1,
        card2_value: 10,
        card2_suit: 2,
        card3_value: 13,
        card3_suit: 3,
    };

    let card1 = pack_card(5, 1);
    let card2 = pack_card(10, 2);
    let card3 = pack_card(13, 3);

    let temp = pedersen_hash([card1, card2]);
    let commitment = pedersen_hash([temp, card3]);

    verify_hand_commitment(hand, commitment);
}

// Test full circuit integration
#[test]
fn test_full_circuit_condition_1() {
    let hand = Hand {
        card1_value: 10,
        card1_suit: 1,
        card2_value: 5,
        card2_suit: 2,
        card3_value: 8,
        card3_suit: 3,
    };

    let card1 = pack_card(10, 1);
    let card2 = pack_card(5, 2);
    let card3 = pack_card(8, 3);

    let temp = pedersen_hash([card1, card2]);
    let commitment = pedersen_hash([temp, card3]);

    // Sum is 23, greater than 20
    main(
        hand,
        1,
        commitment,
        CONDITION_CARDS_SUM_COMPARATOR_THAN_X,
        GREATER_THAN,
        20,
        0,
    );
}

#[test]
fn test_full_circuit_condition_3() {
    let hand = Hand {
        card1_value: 5,
        card1_suit: HEARTS,
        card2_value: 10,
        card2_suit: HEARTS,
        card3_value: 3,
        card3_suit: CLUBS,
    };

    let card1 = pack_card(5, HEARTS);
    let card2 = pack_card(10, HEARTS);
    let card3 = pack_card(3, CLUBS);

    let temp = pedersen_hash([card1, card2]);
    let commitment = pedersen_hash([temp, card3]);

    // 2 cards of HEARTS
    main(
        hand,
        1,
        commitment,
        CONDITION_EXACTLY_X_CARDS_OF_SUIT_Y,
        0,
        2,
        HEARTS,
    );
}
