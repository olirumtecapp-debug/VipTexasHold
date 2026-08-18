/**
 * HandEvaluator.js - Avaliador completo e preciso de mãos de 7 cartas no Poker Texas Hold'em
 */

export const HAND_TYPES = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
};

export const HAND_NAMES_PT = {
  [HAND_TYPES.HIGH_CARD]: 'Carta Alta',
  [HAND_TYPES.ONE_PAIR]: 'Um Par',
  [HAND_TYPES.TWO_PAIR]: 'Dois Pares',
  [HAND_TYPES.THREE_OF_A_KIND]: 'Trinca',
  [HAND_TYPES.STRAIGHT]: 'Sequência',
  [HAND_TYPES.FLUSH]: 'Flush (Cor)',
  [HAND_TYPES.FULL_HOUSE]: 'Full House',
  [HAND_TYPES.FOUR_OF_A_KIND]: 'Quadra',
  [HAND_TYPES.STRAIGHT_FLUSH]: 'Straight Flush',
  [HAND_TYPES.ROYAL_FLUSH]: 'Royal Flush'
};

export class HandEvaluator {
  /**
   * Avalia a melhor combinação de 5 cartas a partir de um conjunto de cartas (ex: 2 da mão + 5 comunitárias)
   * @param {Array<Card>} cards - Array de 5 a 7 cartas
   * @returns {Object} { rank, name, score, best5Cards, description }
   */
  static evaluate(cards) {
    if (!cards || cards.length < 5) {
      return {
        rank: HAND_TYPES.HIGH_CARD,
        name: 'Incompleto',
        score: 0,
        best5Cards: cards || [],
        description: 'Mão incompleta'
      };
    }

    const combinations = this.getCombinations(cards, 5);
    let bestHand = null;

    for (const combo of combinations) {
      const evaluation = this.evaluate5Cards(combo);
      if (!bestHand || this.compareHands(evaluation, bestHand) > 0) {
        bestHand = evaluation;
      }
    }

    return bestHand;
  }

  /**
   * Gera todas as combinações de tamanho k a partir do array
   */
  static getCombinations(arr, k) {
    const result = [];
    function backtrack(start, current) {
      if (current.length === k) {
        result.push([...current]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    }
    backtrack(0, []);
    return result;
  }

  /**
   * Avalia exatamente 5 cartas
   */
  static evaluate5Cards(cards) {
    // Ordenar cartas por valor decrescente (Ás = 14)
    const sorted = [...cards].sort((a, b) => b.rank.value - a.rank.value);
    const ranks = sorted.map(c => c.rank.value);
    const suits = sorted.map(c => c.suit.id);

    // Contagem de frequência de cada valor
    const rankCounts = {};
    for (const r of ranks) {
      rankCounts[r] = (rankCounts[r] || 0) + 1;
    }

    const counts = Object.entries(rankCounts)
      .map(([rank, count]) => ({ rank: parseInt(rank, 10), count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.rank - a.rank;
      });

    const isFlush = suits.every(s => s === suits[0]);
    const straightInfo = this.checkStraight(ranks);

    // 1. Royal Flush & Straight Flush
    if (isFlush && straightInfo.isStraight) {
      if (straightInfo.highRank === 14) {
        return {
          rank: HAND_TYPES.ROYAL_FLUSH,
          name: HAND_NAMES_PT[HAND_TYPES.ROYAL_FLUSH],
          values: [14],
          best5Cards: sorted,
          description: `Royal Flush de ${sorted[0].suit.name}`
        };
      }
      return {
        rank: HAND_TYPES.STRAIGHT_FLUSH,
        name: HAND_NAMES_PT[HAND_TYPES.STRAIGHT_FLUSH],
        values: [straightInfo.highRank],
        best5Cards: sorted,
        description: `Straight Flush ao ${this.getRankLabel(straightInfo.highRank)}`
      };
    }

    // 2. Four of a Kind (Quadra)
    if (counts[0].count === 4) {
      return {
        rank: HAND_TYPES.FOUR_OF_A_KIND,
        name: HAND_NAMES_PT[HAND_TYPES.FOUR_OF_A_KIND],
        values: [counts[0].rank, counts[1].rank],
        best5Cards: sorted,
        description: `Quadra de ${this.getRankLabel(counts[0].rank)}s`
      };
    }

    // 3. Full House
    if (counts[0].count === 3 && counts[1].count === 2) {
      return {
        rank: HAND_TYPES.FULL_HOUSE,
        name: HAND_NAMES_PT[HAND_TYPES.FULL_HOUSE],
        values: [counts[0].rank, counts[1].rank],
        best5Cards: sorted,
        description: `Full House de ${this.getRankLabel(counts[0].rank)}s com ${this.getRankLabel(counts[1].rank)}s`
      };
    }

    // 4. Flush
    if (isFlush) {
      return {
        rank: HAND_TYPES.FLUSH,
        name: HAND_NAMES_PT[HAND_TYPES.FLUSH],
        values: ranks,
        best5Cards: sorted,
        description: `Flush de ${sorted[0].suit.name} com carta alta ${this.getRankLabel(ranks[0])}`
      };
    }

    // 5. Straight
    if (straightInfo.isStraight) {
      return {
        rank: HAND_TYPES.STRAIGHT,
        name: HAND_NAMES_PT[HAND_TYPES.STRAIGHT],
        values: [straightInfo.highRank],
        best5Cards: sorted,
        description: `Sequência de ${this.getRankLabel(straightInfo.highRank - 4)} ao ${this.getRankLabel(straightInfo.highRank)}`
      };
    }

    // 6. Three of a Kind (Trinca)
    if (counts[0].count === 3) {
      return {
        rank: HAND_TYPES.THREE_OF_A_KIND,
        name: HAND_NAMES_PT[HAND_TYPES.THREE_OF_A_KIND],
        values: [counts[0].rank, counts[1].rank, counts[2].rank],
        best5Cards: sorted,
        description: `Trinca de ${this.getRankLabel(counts[0].rank)}s`
      };
    }

    // 7. Two Pair (Dois Pares)
    if (counts[0].count === 2 && counts[1].count === 2) {
      return {
        rank: HAND_TYPES.TWO_PAIR,
        name: HAND_NAMES_PT[HAND_TYPES.TWO_PAIR],
        values: [counts[0].rank, counts[1].rank, counts[2].rank],
        best5Cards: sorted,
        description: `Dois Pares de ${this.getRankLabel(counts[0].rank)}s e ${this.getRankLabel(counts[1].rank)}s`
      };
    }

    // 8. One Pair (Um Par)
    if (counts[0].count === 2) {
      return {
        rank: HAND_TYPES.ONE_PAIR,
        name: HAND_NAMES_PT[HAND_TYPES.ONE_PAIR],
        values: [counts[0].rank, counts[1].rank, counts[2].rank, counts[3].rank],
        best5Cards: sorted,
        description: `Par de ${this.getRankLabel(counts[0].rank)}s`
      };
    }

    // 9. High Card
    return {
      rank: HAND_TYPES.HIGH_CARD,
      name: HAND_NAMES_PT[HAND_TYPES.HIGH_CARD],
      values: ranks,
      best5Cards: sorted,
      description: `Carta Alta ${this.getRankLabel(ranks[0])}`
    };
  }

  /**
   * Checa se os 5 valores formam uma sequência (incluindo Ás baixo A-2-3-4-5)
   */
  static checkStraight(sortedRanks) {
    // Caso padrão: r[0] - 1 === r[1], etc.
    let isStandard = true;
    for (let i = 0; i < 4; i++) {
      if (sortedRanks[i] - 1 !== sortedRanks[i + 1]) {
        isStandard = false;
        break;
      }
    }

    if (isStandard) {
      return { isStraight: true, highRank: sortedRanks[0] };
    }

    // Sequência Ás baixo: 14, 5, 4, 3, 2
    if (
      sortedRanks[0] === 14 &&
      sortedRanks[1] === 5 &&
      sortedRanks[2] === 4 &&
      sortedRanks[3] === 3 &&
      sortedRanks[4] === 2
    ) {
      return { isStraight: true, highRank: 5 }; // O Ás conta como 1 aqui
    }

    return { isStraight: false, highRank: 0 };
  }

  /**
   * Compara duas mãos avaliadas. Retorna > 0 se handA for melhor, < 0 se handB for melhor, 0 se empate exato.
   */
  static compareHands(handA, handB) {
    if (handA.rank !== handB.rank) {
      return handA.rank - handB.rank;
    }

    for (let i = 0; i < handA.values.length; i++) {
      if (handA.values[i] !== handB.values[i]) {
        return handA.values[i] - handB.values[i];
      }
    }

    return 0;
  }

  static getRankLabel(val) {
    switch (val) {
      case 14: return 'Ás';
      case 13: return 'Rei';
      case 12: return 'Dama';
      case 11: return 'Valete';
      case 10: return '10';
      default: return `${val}`;
    }
  }
}
