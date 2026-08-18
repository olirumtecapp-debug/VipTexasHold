/**
 * BotAI.js - Inteligência Artificial humanizada para oponentes virtuais no poker
 * Comportamento realista, sem re-raises infinitos, com variância e naturalidade humana.
 */

import { HandEvaluator, HAND_TYPES } from './HandEvaluator.js';

export const BOT_PERSONALITIES = {
  STRATEGIST: {
    id: 'strategist',
    name: 'Sophia Chen',
    avatarImg: 'assets/images/sophia.jpg',
    country: '🇲🇴',
    countryName: 'Macau',
    level: 60,
    roleDesc: 'Macau VIP Master (Estrategista Equilibrada)',
    vpip: 0.28,
    pfr: 0.18,
    aggression: 0.45,
    bluffFrequency: 0.10,
    quotes: {
      fold: ['Pot odds desfavoráveis. Fold.', 'Preservando fichas para o momento certo.', 'Passo.'],
      check: ['Check.', 'Controle de pote inteligente.', 'Mesa.'],
      call: ['O preço do pote está correto. Pago.', 'Equidade calculada, eu pago.', 'Acompanho.'],
      raise: ['Extraindo valor da mão. Aumento.', 'Aposta posicional.', 'Subindo a aposta.'],
      allIn: ['All-in. Momento ótimo para arriscar tudo.'],
      win: ['A estratégia prevaleceu com perfeição.', 'Excelente pote. Obrigada a todos.', 'Vitória clássica de Macau.'],
      lose: ['Ótima jogada da sua parte. Ajustando estratégia.', 'Parabéns, muito bem jogado.']
    }
  },
  SHARK: {
    id: 'shark',
    name: 'Mark Vance',
    avatarImg: 'assets/images/mark.jpg',
    country: '🇬🇧',
    countryName: 'Reino Unido',
    level: 45,
    roleDesc: 'Tight-Aggressive (Jogador Disciplinado)',
    vpip: 0.24,
    pfr: 0.16,
    aggression: 0.50,
    bluffFrequency: 0.08,
    quotes: {
      fold: ['Disciplina é o segredo do sucesso no poker. Fold.', 'Não vale o investimento desta vez.', 'Paciência rende mais fichas.'],
      check: ['Mesa. Vamos ver o que o bordo traz.', 'Check por controle de pote.', 'Mesa por enquanto.'],
      call: ['As probabilidades justificam. Pago.', 'Estou no pote.', 'Acompanho o valor.'],
      raise: ['Aumentando para proteger minha mão.', 'Quem quiser ver vai pagar o preço justo.', 'Subindo a aposta!'],
      allIn: ['Minha linha de jogo é clara: All-in.', 'Todas as fichas no centro.'],
      win: ['A estatística nunca falha no longo prazo.', 'Excelente mão, bem jogado por todos.', 'Mais um pote para a gestão de banca.'],
      lose: ['Excelente leitura da sua parte.', 'Parabéns pela jogada, na próxima recupero.']
    }
  },
  BLUFFER: {
    id: 'bluffer',
    name: 'Isabella Rossi',
    avatarImg: 'assets/images/isabella.jpg',
    country: '🇮🇹',
    countryName: 'Itália',
    level: 38,
    roleDesc: 'Loose-Aggressive (Ousada e Espontânea)',
    vpip: 0.35,
    pfr: 0.22,
    aggression: 0.60,
    bluffFrequency: 0.14,
    quotes: {
      fold: ['Mão fraca, sem problemas. Próxima!', 'Não vou me arriscar com isso. Fold.', 'Desço por enquanto.'],
      check: ['Passo a vez.', 'Vamos ver a próxima carta.', 'Check.'],
      call: ['Pago!', 'Não vou abrir mão da mão agora.', 'Estou dentro.'],
      raise: ['Vamos acelerar essa mesa!', 'Vocês têm coragem de pagar?', 'Subindo a aposta!'],
      allIn: ['Chega de conversas: All-in!', 'Tudo na mesa! Mostrem o jogo!'],
      win: ['A audácia sempre vence a timidez!', 'Adoro ver essas fichas vindo pra cá!', 'Outra vitória linda!'],
      lose: ['Você teve coragem de pagar! Boa mão.', 'Essa foi sua, mas não se acostume!']
    }
  },
  ROCK: {
    id: 'rock',
    name: 'Dmitri Volkov',
    avatarImg: 'assets/images/dmitri.jpg',
    country: '🇷🇺',
    countryName: 'Rússia',
    level: 52,
    roleDesc: 'Solid Rock (Frio e Paciente)',
    vpip: 0.18,
    pfr: 0.10,
    aggression: 0.30,
    bluffFrequency: 0.04,
    quotes: {
      fold: ['Risco desnecessário. Passo.', 'Fold.', 'Mão fora dos parâmetros.'],
      check: ['Mesa.', 'Check.', 'Continuar.'],
      call: ['Pago.', 'Estou no jogo.', 'Acompanho.'],
      raise: ['Tenho a melhor mão. Aumento.', 'Aposta de alto valor.'],
      allIn: ['All-in. O cálculo foi concluído.'],
      win: ['Como previsto.', 'Resultado lógico.', 'Obrigado pelo pote.'],
      lose: ['Variância estatística.', 'Bem executado.']
    }
  }
};

export class BotAI {
  static getPreflopScore(cards) {
    if (!cards || cards.length < 2) return 20;

    const [c1, c2] = cards;
    const v1 = Math.max(c1.rank.value, c2.rank.value);
    const v2 = Math.min(c1.rank.value, c2.rank.value);
    const isPair = v1 === v2;
    const isSuited = c1.suit.id === c2.suit.id;
    const gap = v1 - v2;

    let score = 0;

    if (isPair) {
      score = 45 + (v1 * 3.5);
    } else {
      score = (v1 * 2.8) + (v2 * 1.6);
      if (isSuited) score += 6;
      if (gap === 1) score += 5;
      else if (gap === 2) score += 2;
    }

    return Math.min(100, Math.max(10, score));
  }

  static getPostflopScore(cards, communityCards) {
    const fullCards = [...cards, ...communityCards];
    const evaluation = HandEvaluator.evaluate(fullCards);

    const baseScores = {
      [HAND_TYPES.ROYAL_FLUSH]: 100,
      [HAND_TYPES.STRAIGHT_FLUSH]: 98,
      [HAND_TYPES.FOUR_OF_A_KIND]: 95,
      [HAND_TYPES.FULL_HOUSE]: 90,
      [HAND_TYPES.FLUSH]: 82,
      [HAND_TYPES.STRAIGHT]: 74,
      [HAND_TYPES.THREE_OF_A_KIND]: 62,
      [HAND_TYPES.TWO_PAIR]: 50,
      [HAND_TYPES.ONE_PAIR]: 36,
      [HAND_TYPES.HIGH_CARD]: 16
    };

    let score = baseScores[evaluation.rank] || 20;
    if (evaluation.values && evaluation.values.length > 0) {
      score += (evaluation.values[0] / 14) * 4;
    }

    return Math.min(100, Math.max(10, score));
  }

  static decideAction(bot, gameState) {
    const personality = bot.personality || BOT_PERSONALITIES.SHARK;
    const {
      currentHighestBet,
      botCurrentBet,
      potTotal,
      minRaise,
      bigBlind,
      stage,
      communityCards,
      raisesThisStreet = 0
    } = gameState;

    const callAmount = currentHighestBet - botCurrentBet;
    const canCheck = callAmount === 0;
    const isPreflop = stage === 'PRE_FLOP';

    const handScore = isPreflop
      ? this.getPreflopScore(bot.cards)
      : this.getPostflopScore(bot.cards, communityCards);

    // Blefe humano controlado
    const isBluffing = Math.random() < personality.bluffFrequency;
    const effectiveScore = isBluffing ? handScore + 18 : handScore;

    const randomHumanNoise = (Math.random() - 0.5) * 12;
    const decisionMetric = effectiveScore + (personality.aggression * 12) + randomHumanNoise;

    const getQuote = (type) => {
      const list = personality.quotes[type] || ['...'];
      return list[Math.floor(Math.random() * list.length)];
    };

    // Caso o bot tenha menos fichas que o valor para pagar
    if (bot.chips <= callAmount) {
      if (decisionMetric >= 50 || canCheck) {
        return { action: 'call', amount: bot.chips, quote: getQuote(canCheck ? 'check' : 'allIn') };
      } else {
        return { action: 'fold', amount: 0, quote: getQuote('fold') };
      }
    }

    // =========================================================
    // REGRA ANTI-LOOP: LIMITE DE RE-RAISES NA MESMA RODADA
    // =========================================================
    // Se já houveram 3 ou mais aumentos na mesma rodada, BLOQUEIA novos raises!
    if (raisesThisStreet >= 3) {
      if (canCheck) return { action: 'check', amount: 0, quote: getQuote('check') };
      if (decisionMetric >= 55 || (callAmount <= bigBlind * 2 && decisionMetric >= 40)) {
        return { action: 'call', amount: callAmount, quote: getQuote('call') };
      }
      return { action: 'fold', amount: 0, quote: getQuote('fold') };
    }

    // Se já houveram 2 aumentos (3-bet/4-bet), humanos raramente aumentam de novo
    if (raisesThisStreet >= 2) {
      if (canCheck) return { action: 'check', amount: 0, quote: getQuote('check') };
      // Só re-aumenta com mão monstruosa (Full House, Flush, Quad)
      if (handScore >= 88 && Math.random() < 0.15) {
        const rSize = Math.min(bot.chips, callAmount + Math.max(minRaise, bigBlind * 2));
        return { action: 'raise', amount: rSize, quote: getQuote('raise') };
      }
      // Se a mão for boa, apenas paga
      if (decisionMetric >= 52 || (callAmount <= bot.chips * 0.25 && decisionMetric >= 45)) {
        return { action: 'call', amount: callAmount, quote: getQuote('call') };
      }
      return { action: 'fold', amount: 0, quote: getQuote('fold') };
    }

    // Se já houve 1 aumento na mesa
    if (raisesThisStreet === 1) {
      if (canCheck) return { action: 'check', amount: 0, quote: getQuote('check') };
      // Re-raise moderado se tiver mão muito forte
      if (decisionMetric >= 76 && Math.random() < 0.25) {
        const rSize = Math.min(bot.chips, callAmount + Math.max(minRaise, Math.floor(potTotal * 0.5)));
        return { action: 'raise', amount: rSize, quote: getQuote('raise') };
      }
      // Pagar com mãos médias/boas
      if (decisionMetric >= 40 || (callAmount <= bigBlind * 2 && decisionMetric >= 32)) {
        return { action: 'call', amount: callAmount, quote: getQuote('call') };
      }
      return { action: 'fold', amount: 0, quote: getQuote('fold') };
    }

    // =========================================================
    // RONDAS SEM AUMENTO PRÉVIO (raisesThisStreet === 0)
    // =========================================================
    if (decisionMetric >= 75) {
      // Mão muito forte: Aposta com valor razoável (não absurdo)
      if (stage === 'RIVER' && decisionMetric > 90 && Math.random() < 0.20) {
        return { action: 'allin', amount: bot.chips, quote: getQuote('allIn') };
      }
      const raiseSize = Math.max(minRaise, Math.min(bot.chips, Math.floor(Math.max(bigBlind * 2, potTotal * 0.55))));
      const finalAmount = Math.min(bot.chips, callAmount + raiseSize);
      return { action: 'raise', amount: finalAmount, quote: getQuote('raise') };
    }

    if (decisionMetric >= 42) {
      // Mãos médias: Na maioria das vezes dá Check se puder, ou aposta pequena ocasional
      if (canCheck) {
        if (Math.random() < 0.25 && !isPreflop) {
          const smallBet = Math.min(bot.chips, Math.max(minRaise, Math.floor(potTotal * 0.35)));
          return { action: 'raise', amount: smallBet, quote: getQuote('raise') };
        }
        return { action: 'check', amount: 0, quote: getQuote('check') };
      }
      return { action: 'call', amount: callAmount, quote: getQuote('call') };
    }

    // Mãos fracas
    if (canCheck) {
      return { action: 'check', amount: 0, quote: getQuote('check') };
    }

    // Pequeno pagamento se o custo for insignificante
    if (callAmount <= bigBlind && Math.random() < 0.4) {
      return { action: 'call', amount: callAmount, quote: getQuote('call') };
    }

    return { action: 'fold', amount: 0, quote: getQuote('fold') };
  }
}
