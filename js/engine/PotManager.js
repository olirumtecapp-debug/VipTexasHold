/**
 * PotManager.js - Gerenciador completo de apostas, side pots e distribuição de fichas
 */

import { HandEvaluator } from './HandEvaluator.js';

export class PotManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.mainPot = 0;
    this.bets = new Map(); // player -> amount bet in current street
    this.totalContributed = new Map(); // player -> total amount bet across all streets in the hand
    this.sidePots = []; // array of { amount, eligiblePlayers: Set }
  }

  addBet(player, amount) {
    const currentBet = this.bets.get(player) || 0;
    this.bets.set(player, currentBet + amount);

    const total = this.totalContributed.get(player) || 0;
    this.totalContributed.set(player, total + amount);
  }

  getCurrentBet(player) {
    return this.bets.get(player) || 0;
  }

  getTotalContributed(player) {
    return this.totalContributed.get(player) || 0;
  }

  getHighestBet() {
    let highest = 0;
    for (const bet of this.bets.values()) {
      if (bet > highest) highest = bet;
    }
    return highest;
  }

  getTotalPot() {
    let sum = 0;
    for (const val of this.totalContributed.values()) {
      sum += val;
    }
    return sum;
  }

  /**
   * Chamado ao final de cada street (Pre-flop, Flop, Turn, River) para limpar as apostas correntes da street
   */
  endStreet() {
    this.bets.clear();
  }

  /**
   * Calcula os potes divididos e side pots de acordo com as contribuições e all-ins
   * @param {Array} activePlayers - Todos os jogadores na mão
   */
  calculatePots(allPlayers) {
    // Pegar jogadores que contribuíram para o pote
    const contributors = allPlayers.filter(p => (this.totalContributed.get(p) || 0) > 0);
    if (contributors.length === 0) return [];

    // Obter níveis únicos de contribuição ordenados
    const distinctLevels = Array.from(
      new Set(contributors.map(p => this.totalContributed.get(p)))
    ).sort((a, b) => a - b);

    const pots = [];
    let previousLevel = 0;

    for (const level of distinctLevels) {
      const increment = level - previousLevel;
      if (increment <= 0) continue;

      let potAmount = 0;
      const eligiblePlayers = [];

      for (const p of contributors) {
        const contributed = this.totalContributed.get(p);
        if (contributed >= level) {
          potAmount += increment;
          if (!p.folded) {
            eligiblePlayers.push(p);
          }
        } else if (contributed > previousLevel) {
          potAmount += (contributed - previousLevel);
        }
      }

      if (potAmount > 0 && eligiblePlayers.length > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayers: eligiblePlayers
        });
      }

      previousLevel = level;
    }

    return pots;
  }

  /**
   * Distribui os potes aos vencedores no Showdown
   * @param {Array} activePlayers - Jogadores não foldados
   * @param {Array} communityCards - 5 cartas da mesa
   * @returns {Array} Payout summaries: [{ player, amount, handInfo, potIndex }]
   */
  distributePots(allPlayers, communityCards) {
    const calculatedPots = this.calculatePots(allPlayers);
    const payouts = [];

    // Se todos menos 1 foldaram
    const remainingActive = allPlayers.filter(p => !p.folded);
    if (remainingActive.length === 1) {
      const winner = remainingActive[0];
      const totalAmount = this.getTotalPot();
      winner.chips += totalAmount;
      payouts.push({
        player: winner,
        amount: totalAmount,
        handInfo: null,
        isOnlySurvivor: true
      });
      return payouts;
    }

    // Avaliar a mão de cada jogador elegível
    const playerHands = new Map();
    for (const p of remainingActive) {
      const fullCards = [...p.cards, ...communityCards];
      const evaluation = HandEvaluator.evaluate(fullCards);
      playerHands.set(p, evaluation);
    }

    calculatedPots.forEach((pot, index) => {
      if (pot.eligiblePlayers.length === 0) return;

      // Encontrar a melhor mão entre os elegíveis
      let bestEvaluation = null;
      let winners = [];

      for (const p of pot.eligiblePlayers) {
        const evaluation = playerHands.get(p);
        if (!evaluation) continue;

        if (!bestEvaluation) {
          bestEvaluation = evaluation;
          winners = [p];
        } else {
          const comp = HandEvaluator.compareHands(evaluation, bestEvaluation);
          if (comp > 0) {
            bestEvaluation = evaluation;
            winners = [p];
          } else if (comp === 0) {
            winners.push(p);
          }
        }
      }

      if (winners.length > 0) {
        const splitAmount = Math.floor(pot.amount / winners.length);
        const remainder = pot.amount % winners.length;

        winners.forEach((w, wIdx) => {
          const won = splitAmount + (wIdx === 0 ? remainder : 0);
          w.chips += won;
          payouts.push({
            player: w,
            amount: won,
            handInfo: bestEvaluation,
            potIndex: index,
            isSplit: winners.length > 1
          });
        });
      }
    });

    return payouts;
  }
}
