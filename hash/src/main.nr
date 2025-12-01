use std::hash::poseidon;

struct Hand {
    card1_value: u8,
    card1_suit: u8,
    card2_value: u8,
    card2_suit: u8,
    card3_value: u8,
    card3_suit: u8,
}

fn main(hand: Hand) {
    let card1 = pack_card(hand.card1_value, hand.card1_suit);
    let card2 = pack_card(hand.card2_value, hand.card2_suit);
    let card3 = pack_card(hand.card3_value, hand.card3_suit);

    let temp = poseidon::bn254::hash_2([card1, card2]);
    let computed_hash = poseidon::bn254::hash_2([temp, card3]);
    println("Computed hash:");
    println(computed_hash);
}

fn pack_card(value: u8, suit: u8) -> Field {
    (value as Field) * 256 + (suit as Field)
}
