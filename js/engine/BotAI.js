/**
 * BotAI.js - Inteligência Artificial para os oponentes virtuais com retratos fotorrealistas e estilos táticos
 */

import { HandEvaluator, HAND_TYPES } from './HandEvaluator.js';

export const BOT_PERSONALITIES = {
  SHARK: {
    id: 'shark',
    name: 'Mark Vance',
    avatarImg: 'assets/images/mark.jpg',
    country: '🇬🇧',
    countryName: 'Reino Unido',
    level: 45,
    roleDesc: 'Tight-Aggressive (Estrategista Sênior)',
    vpip: 0.22,
    pfr: 0.18,
    aggression: 0.75,
    bluffFrequency: 0.12,
    quotes: {
      fold: ['Disciplina é o segredo do sucesso no poker. Fold.', 'Não vale o investimento desta vez.', 'Paciência rende mais fichas.'],
      check: ['Mesa. Vamos ver o que o bordo traz.', 'Check por controle de pote.', 'Mesa por enquanto.'],
      call: ['As probabilidades matemáticas justificam. Pago.', 'Estou no pote.', 'Acompanho o valor.'],
      raise: ['Aumentando para proteger minha equidade.', 'Quem quiser ver vai pagar o preço justo.', 'Subindo a aposta!'],
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
    roleDesc: 'Loose-Aggressive (Campeã Ousada)',
    vpip: 0.45,
    pfr: 0.35,
    aggression: 0.85,
    bluffFrequency: 0.38,
    quotes: {
      fold: ['Mão fraca, sem problemas. Próxima!', 'Não vou me arriscar com isso. Fold.', 'Desço por enquanto.'],
      check: ['Passo a vez.', 'Vamos ver a próxima carta.', 'Check.'],
      call: ['Pago sem hesitar!', 'Não vou abrir mão da mão agora.', 'Estou dentro.'],
      raise: ['Vamos acelerar essa mesa!', 'Vocês têm coragem de pagar esse raise?', 'Subindo bem alto!'],
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
    roleDesc: 'Grandmaster (Frio e Calculista)',
    vpip: 0.18,
    pfr: 0.08,
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
  },
  STRATEGIST: {
    id: 'strategist',
    name: 'Sophia Chen',
    avatarImg: 'assets/images/sophia.jpg',
    country: '🇲🇴',
    countryName: 'Macau',
    level: 60,
    roleDesc: 'Macau VIP Master (Lenda Asiática)',
    vpip: 0.28,
    pfr: 0.22,
    aggression: 0.60,
    bluffFrequency: 0.18,
    quotes: {
      fold: ['Pot odds desfavoráveis. Fold.', 'Preservando fichas para o momento certo.', 'Passo.'],
      check: ['Check.', 'Controle de pote inteligente.', 'Mesa.'],
      call: ['O preço do pote está correto. Pago.', 'Equidade calculada, eu pago.', 'Acompanho.'],
      raise: ['Extraindo o máximo de valor. Subo a aposta.', 'Aposta posicional.', 'Aumento para R$ '],
      allIn: ['All-in. Momento ótimo para arriscar tudo.'],
      win: ['A estratégia prevaleceu com perfeição.', 'Excelente pote. Obrigada a todos.', 'Vitória clássica de Macau.'],
      lose: ['Ótima jogada da sua parte. Ajustando estratégia.', 'Parabéns, muito bem jogado.']
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
      score = 50 + (v1 * 3.5);
    } else {
      score = (v1 * 3.2) + (v2 * 1.8);
      if (isSuited) score += 8;
      if (gap === 1) score += 6;
      else if (gap === 2) score += 3;
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
      [HAND_TYPES.STRAIGHT]: 75,
      [HAND_TYPES.THREE_OF_A_KIND]: 65,
      [HAND_TYPES.TWO_PAIR]: 52,
      [HAND_TYPES.ONE_PAIR]: 38,
      [HAND_TYPES.HIGH_CARD]: 18
    };

    let score = baseScores[evaluation.rank] || 20;
    if (evaluation.values && evaluation.values.length > 0) {
      score += (evaluation.values[0] / 14) * 5;
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
      communityCards
    } = gameState;

    const callAmount = currentHighestBet - botCurrentBet;
    const canCheck = callAmount === 0;
    const isPreflop = stage === 'PRE_FLOP';

    const handScore = isPreflop
      ? this.getPreflopScore(bot.cards)
      : this.getPostflopScore(bot.cards, communityCards);

    const isBluffing = Math.random() < personality.bluffFrequency;
    const effectiveScore = isBluffing ? handScore + 30 : handScore;

    const randomFactor = (Math.random() - 0.5) * 10;
    const decisionMetric = effectiveScore + (personality.aggression * 15) + randomFactor;

    const getQuote = (type) => {
      const list = personality.quotes[type] || ['...'];
      return list[Math.floor(Math.random() * list.length)];
    };

    if (bot.chips <= callAmount) {
      if (decisionMetric >= 45 || canCheck) {
        return { action: 'call', amount: bot.chips, quote: getQuote(canCheck ? 'check' : 'allIn') };
      } else {
        return { action: 'fold', amount: 0, quote: getQuote('fold') };
      }
    }

    // 1. Mãos Monstruosas
    if (decisionMetric >= 75) {
      if (stage === 'RIVER' && decisionMetric > 88 && Math.random() < 0.35) {
        return { action: 'allin', amount: bot.chips, quote: getQuote('allIn') };
      }

      const raiseSize = Math.max(
        minRaise,
        callAmount + Math.floor(Math.min(bot.chips - callAmount, Math.max(bigBlind * 2, potTotal * 0.65)))
      );
      const finalAmount = Math.min(bot.chips, callAmount + raiseSize);

      if (finalAmount >= bot.chips) {
        return { action: 'allin', amount: bot.chips, quote: getQuote('allIn') };
      }
      return { action: 'raise', amount: finalAmount, quote: getQuote('raise') };
    }

    // 2. Mãos Médias/Boas
    if (decisionMetric >= 45) {
      if (canCheck) {
        if (Math.random() < personality.aggression * 0.5) {
          const smallRaise = Math.min(bot.chips, Math.max(minRaise, Math.floor(potTotal * 0.4)));
          if (smallRaise > 0 && smallRaise < bot.chips * 0.4) {
            return { action: 'raise', amount: smallRaise, quote: getQuote('raise') };
          }
        }
        return { action: 'check', amount: 0, quote: getQuote('check') };
      }

      if (callAmount <= bot.chips * 0.35 || callAmount <= bigBlind * 3) {
        return { action: 'call', amount: callAmount, quote: getQuote('call') };
      } else if (decisionMetric >= 60 && callAmount <= bot.chips * 0.6) {
        return { action: 'call', amount: callAmount, quote: getQuote('call') };
      } else {
        return { action: 'fold', amount: 0, quote: getQuote('fold') };
      }
    }

    // 3. Mãos Fracas
    if (canCheck) {
      return { action: 'check', amount: 0, quote: getQuote('check') };
    }

    if (callAmount <= bigBlind && Math.random() < 0.6) {
      return { action: 'call', amount: callAmount, quote: getQuote('call') };
    }

    if (isBluffing && Math.random() < 0.4 && bot.chips > callAmount * 2) {
      const bluffRaise = Math.min(bot.chips, callAmount + Math.max(minRaise, Math.floor(potTotal * 0.5)));
      return { action: 'raise', amount: bluffRaise, quote: getQuote('raise') };
    }

    return { action: 'fold', amount: 0, quote: getQuote('fold') };
  }
}
