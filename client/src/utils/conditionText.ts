/**
 * Utility functions for generating human-readable condition text
 * Based on contracts/src/traits/condition.cairo
 */

// Condition types
const CONDITION_CARDS_SUM_COMPARATOR_THAN_X = 1;
const CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y = 2;
const CONDITION_EXACTLY_X_CARDS_OF_SUIT_Y = 3;
const CONDITION_EXACTLY_X_PAIRS = 4;
const CONDITION_EXACTLY_X_ODDS = 5;
const CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE = 6;
const CONDITION_EXACTLY_X_DISTINCT_VALUES = 7;
const CONDITION_EXACTLY_X_DISTINCT_SUITS = 8;
const CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X = 9;
const CONDITION_LOWEST_CARD_COMPARATOR_THAN_X = 10;

// Comparators
const LESS_THAN = 1;
const GREATER_THAN = 2;
const EQUAL_TO = 3;

// Suits
const CLUBS = 1;
const SPADES = 2;
const DIAMONDS = 3;
const HEARTS = 4;

// Card values mapping
const getCardValueName = (value: number): string => {
  if (value === 1) return "Ace";
  if (value === 11) return "Jack";
  if (value === 12) return "Queen";
  if (value === 13) return "King";
  return value.toString();
};

// Suit names
const getSuitName = (suit: number): string => {
  switch (suit) {
    case CLUBS:
      return "Clubs";
    case SPADES:
      return "Spades";
    case DIAMONDS:
      return "Diamonds";
    case HEARTS:
      return "Hearts";
    default:
      return "Unknown";
  }
};

// Comparator text
const getComparatorText = (comparator: number): string => {
  switch (comparator) {
    case LESS_THAN:
      return "less than";
    case GREATER_THAN:
      return "greater than";
    case EQUAL_TO:
      return "equal to";
    default:
      return "unknown";
  }
};

/**
 * Generates a human-readable English sentence from condition data
 */
export const generateConditionText = (
  condition: number,
  quantity: number,
  comparator: number,
  value: number,
  suit: number
): string => {
  switch (condition) {
    case CONDITION_CARDS_SUM_COMPARATOR_THAN_X:
      return `The sum of your cards is ${getComparatorText(comparator)} ${value}`;

    case CONDITION_EXACTLY_X_CARDS_OF_VALUE_Y:
      const valueName = getCardValueName(value);
      if (quantity === 1) {
        return `You have exactly ${quantity} ${valueName}`;
      }
      return `You have exactly ${quantity} ${valueName}s`;

    case CONDITION_EXACTLY_X_CARDS_OF_SUIT_Y:
      const suitName = getSuitName(suit);
      if (quantity === 1) {
        return `You have exactly ${quantity} card of ${suitName}`;
      }
      return `You have exactly ${quantity} cards of ${suitName}`;

    case CONDITION_EXACTLY_X_PAIRS:
      if (quantity === 1) {
        return `You have exactly ${quantity} pair`;
      }
      return `You have exactly ${quantity} pairs`;

    case CONDITION_EXACTLY_X_ODDS:
      if (quantity === 1) {
        return `You have exactly ${quantity} odd card`;
      }
      return `You have exactly ${quantity} odd cards`;

    case CONDITION_EXACTLY_X_COMPARATOR_THAN_SPECIFIC_VALUE:
      const valueName2 = getCardValueName(value);
      if (quantity === 1) {
        return `You have exactly ${quantity} card ${getComparatorText(comparator)} ${valueName2}`;
      }
      return `You have exactly ${quantity} cards ${getComparatorText(comparator)} ${valueName2}`;

    case CONDITION_EXACTLY_X_DISTINCT_VALUES:
      if (quantity === 1) {
        return `You have exactly ${quantity} distinct value`;
      }
      return `You have exactly ${quantity} distinct values`;

    case CONDITION_EXACTLY_X_DISTINCT_SUITS:
      if (quantity === 1) {
        return `You have exactly ${quantity} distinct suit`;
      }
      return `You have exactly ${quantity} distinct suits`;

    case CONDITION_HIGHEST_CARD_COMPARATOR_THAN_X:
      const valueName3 = getCardValueName(value);
      return `Your highest card is ${getComparatorText(comparator)} ${valueName3}`;

    case CONDITION_LOWEST_CARD_COMPARATOR_THAN_X:
      const valueName4 = getCardValueName(value);
      return `Your lowest card is ${getComparatorText(comparator)} ${valueName4}`;

    default:
      return "Unknown condition";
  }
};

