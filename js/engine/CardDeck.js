/**
 * CardDeck.js - Baralho padrão de 52 cartas com embaralhamento criptográfico
 */

export const SUITS = {
  HEARTS: { id: 'H', name: 'Copas', symbol: '♥', color: 'red' },
  DIAMONDS: { id: 'D', name: 'Ouros', symbol: '♦', color: 'red' },
  CLUBS: { id: 'C', name: 'Paus', symbol: '♣', color: 'black' },
  SPADES: { id: 'S', name: 'Espadas', symbol: '♠', color: 'black' }
};

export const RANKS = [
  { value: 2, label: '2', short: '2' },
  { value: 3, label: '3', short: '3' },
  { value: 4, label: '4', short: '4' },
  { value: 5, label: '5', short: '5' },
  { value: 6, label: '6', short: '6' },
  { value: 7, label: '7', short: '7' },
  { value: 8, label: '8', short: '8' },
  { value: 9, label: '9', short: '9' },
  { value: 10, label: '10', short: '10' },
  { value: 11, label: 'Valete', short: 'J' },
  { value: 12, label: 'Dama', short: 'Q' },
  { value: 13, label: 'Rei', short: 'K' },
  { value: 14, label: 'Ás', short: 'A' }
];

export class Card {
  constructor(rank, suit) {
    this.rank = rank;   // Object with value (2-14) and short label
    this.suit = suit;   // Object with id, symbol, color
    this.id = `${rank.short}${suit.id}`;
  }

  toString() {
    return `${this.rank.short}${this.suit.symbol}`;
  }
}

export class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suitKey in SUITS) {
      const suit = SUITS[suitKey];
      for (const rank of RANKS) {
        this.cards.push(new Card(rank, suit));
      }
    }
    this.shuffle();
  }

  shuffle() {
    // Fisher-Yates shuffle with crypto randomness
    for (let i = this.cards.length - 1; i > 0; i--) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const j = randomBuffer[0] % (i + 1);
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) {
      this.reset();
    }
    return this.cards.pop();
  }

  get remaining() {
    return this.cards.length;
  }
}
