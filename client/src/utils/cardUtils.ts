/**
 * Utility functions for card handling
 *
 * Card values: A=1, 2-10, J=11, Q=12, K=13
 * Card suits: CLUBS=1, SPADES=2, DIAMONDS=3, HEARTS=4
 */

export const getCardImagePath = (value: number, suit: number): string => {
  return `/images/cards/${value}-${suit}.png`;
};

export const getCardDisplayValue = (value: number): string => {
  if (value === 1) return "A";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  return value.toString();
};

export const getCardDisplaySuit = (suit: number): string => {
  switch (suit) {
    case 1: // CLUBS
      return "♣";
    case 2: // SPADES
      return "♠";
    case 3: // DIAMONDS
      return "♦";
    case 4: // HEARTS
      return "♥";
    default:
      return "?";
  }
};

export const getCardColor = (suit: number): "red" | "black" => {
  // Hearts (4) and Diamonds (3) are red
  return suit === 3 || suit === 4 ? "red" : "black";
};

export const getCardFullName = (value: number, suit: number): string => {
  // Get value name
  let valueName: string;
  if (value === 1) {
    valueName = "Ace";
  } else if (value === 11) {
    valueName = "Jack";
  } else if (value === 12) {
    valueName = "Queen";
  } else if (value === 13) {
    valueName = "King";
  } else {
    valueName = value.toString();
  }

  // Get suit name
  let suitName: string;
  switch (suit) {
    case 1: // CLUBS
      suitName = "Clubs";
      break;
    case 2: // SPADES
      suitName = "Spades";
      break;
    case 3: // DIAMONDS
      suitName = "Diamonds";
      break;
    case 4: // HEARTS
      suitName = "Hearts";
      break;
    default:
      suitName = "Unknown";
  }

  return `${valueName} of ${suitName}`;
};
