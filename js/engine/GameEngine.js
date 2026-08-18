/**
 * GameEngine.js - Máquina de Estados e Motor Principal da Partida de Poker No-Limit Hold'em
 */

import { Deck } from './CardDeck.js';
import { PotManager } from './PotManager.js';
import { BotAI, BOT_PERSONALITIES } from './BotAI.js';
import { campaign } from './CampaignManager.js';
import { sound } from '../audio/SoundEffects.js';

export const GAME_STATES = {
  LOBBY: 'LOBBY',
  WAITING: 'WAITING',
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN',
  PAYOUT: 'PAYOUT',
  NEXT_HAND: 'NEXT_HAND'
};

export class GameEngine {
  constructor(config = {}) {
    this.smallBlind = config.smallBlind || 10;
    this.bigBlind = config.bigBlind || 20;
    this.buyIn = config.buyIn || 1000;
    this.playerName = config.playerName || 'Jogador VIP';
    this.playerAvatarImg = config.playerAvatarImg || 'assets/images/player.jpg';
    this.numBots = config.numBots || 4;
    this.chapterId = config.chapterId || null; // ID da etapa de campanha se aplicável

    this.deck = new Deck();
    this.potManager = new PotManager();
    this.players = [];
    this.communityCards = [];
    this.state = GAME_STATES.LOBBY;
    this.dealerIndex = 0;
    this.currentTurnIndex = -1;
    this.lastActionPlayerIndex = -1;
    this.handCount = 0;
    this.minRaise = this.bigBlind;
    this.raisesThisStreet = 0;
    this.botThinkingTimer = null;

    this.listeners = {
      onStateChange: [],
      onPlayerAction: [],
      onDealPlayerCards: [],
      onDealCommunityCard: [],
      onTurnChange: [],
      onShowdown: [],
      onPayout: [],
      onChatMessage: [],
      onPotUpdate: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  initGame() {
    this.players = [];
    
    // Jogador Humano (Assento 0)
    this.players.push({
      id: 'human',
      name: this.playerName,
      avatarImg: this.playerAvatarImg,
      country: '🇧🇷',
      level: campaign.data.level || 1,
      isHuman: true,
      chips: this.buyIn,
      cards: [],
      folded: false,
      isAllIn: false,
      lastAction: null,
      actedThisStreet: false
    });

    // Bots (Assentos 1 a N)
    const personalityKeys = Object.keys(BOT_PERSONALITIES);
    for (let i = 0; i < this.numBots; i++) {
      const pKey = personalityKeys[i % personalityKeys.length];
      const personality = BOT_PERSONALITIES[pKey];
      this.players.push({
        id: `bot_${i + 1}`,
        name: personality.name,
        avatarImg: personality.avatarImg,
        country: personality.country,
        level: personality.level,
        isHuman: false,
        personality: personality,
        chips: this.buyIn,
        cards: [],
        folded: false,
        isAllIn: false,
        lastAction: null,
        actedThisStreet: false
      });
    }

    this.dealerIndex = 0;
    this.startNewHand();
  }

  startNewHand() {
    if (this.botThinkingTimer) {
      clearTimeout(this.botThinkingTimer);
      this.botThinkingTimer = null;
    }

    this.players.forEach(p => {
      if (p.chips <= 0) {
        p.chips = this.buyIn;
        this.emit('onChatMessage', {
          sender: 'Sistema',
          avatarImg: 'assets/images/dealer.jpg',
          message: `${p.name} realizou Re-buy VIP de R$ ${this.buyIn.toLocaleString('pt-BR')}!`
        });
      }
      p.cards = [];
      p.folded = false;
      p.isAllIn = false;
      p.lastAction = null;
      p.actedThisStreet = false;
    });

    this.handCount++;
    this.communityCards = [];
    this.deck.reset();
    this.potManager.reset();
    this.minRaise = this.bigBlind;
    this.raisesThisStreet = 0;

    if (this.handCount > 1) {
      this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    }

    this.state = GAME_STATES.PRE_FLOP;
    this.emit('onStateChange', { state: this.state, handCount: this.handCount });

    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        player.cards.push(this.deck.draw());
      }
    }

    sound.playCardSlide();
    this.emit('onDealPlayerCards', { players: this.players });

    this.postBlinds();

    this.emit('onPotUpdate', {
      totalPot: this.potManager.getTotalPot(),
      highestBet: this.potManager.getHighestBet()
    });

    const numPlayers = this.players.length;
    const utgIndex = (this.dealerIndex + 3) % numPlayers;
    this.currentTurnIndex = utgIndex;
    this.lastActionPlayerIndex = (this.dealerIndex + 2) % numPlayers;

    this.notifyTurn();
  }

  postBlinds() {
    const numPlayers = this.players.length;
    const sbIndex = (this.dealerIndex + 1) % numPlayers;
    const bbIndex = (this.dealerIndex + 2) % numPlayers;

    const sbPlayer = this.players[sbIndex];
    const bbPlayer = this.players[bbIndex];

    const actualSb = Math.min(sbPlayer.chips, this.smallBlind);
    sbPlayer.chips -= actualSb;
    this.potManager.addBet(sbPlayer, actualSb);
    sbPlayer.lastAction = { type: 'sb', text: `SB R$ ${actualSb}` };
    if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

    const actualBb = Math.min(bbPlayer.chips, this.bigBlind);
    bbPlayer.chips -= actualBb;
    this.potManager.addBet(bbPlayer, actualBb);
    bbPlayer.lastAction = { type: 'bb', text: `BB R$ ${actualBb}` };
    if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

    sound.playChipSound(true);
  }

  notifyTurn() {
    const activeNonFolded = this.players.filter(p => !p.folded);
    const activeCanAct = this.players.filter(p => !p.folded && !p.isAllIn);

    if (activeNonFolded.length <= 1 || activeCanAct.length === 0) {
      if (this.isStreetBettingComplete()) {
        this.nextStreet();
      } else {
        this.advanceTurn();
      }
      return;
    }

    const currentPlayer = this.players[this.currentTurnIndex];

    if (currentPlayer.folded || currentPlayer.isAllIn) {
      this.advanceTurn();
      return;
    }

    this.emit('onTurnChange', {
      playerIndex: this.currentTurnIndex,
      player: currentPlayer,
      highestBet: this.potManager.getHighestBet(),
      currentBet: this.potManager.getCurrentBet(currentPlayer),
      minRaise: this.minRaise,
      canCheck: this.potManager.getHighestBet() === this.potManager.getCurrentBet(currentPlayer)
    });

    if (!currentPlayer.isHuman) {
      this.scheduleBotAction(currentPlayer);
    }
  }

  scheduleBotAction(bot) {
    const delay = 1400 + Math.random() * 800;
    this.botThinkingTimer = setTimeout(() => {
      this.executeBotTurn(bot);
    }, delay);
  }

  executeBotTurn(bot) {
    if (this.state === GAME_STATES.SHOWDOWN || this.state === GAME_STATES.PAYOUT) return;

    const highestBet = this.potManager.getHighestBet();
    const botCurrentBet = this.potManager.getCurrentBet(bot);

    const decision = BotAI.decideAction(bot, {
      currentHighestBet: highestBet,
      botCurrentBet: botCurrentBet,
      potTotal: this.potManager.getTotalPot(),
      minRaise: this.minRaise,
      bigBlind: this.bigBlind,
      stage: this.state,
      communityCards: this.communityCards,
      raisesThisStreet: this.raisesThisStreet
    });

    if (decision.quote && Math.random() < 0.45) {
      this.emit('onChatMessage', {
        sender: bot.name,
        avatarImg: bot.avatarImg,
        message: decision.quote
      });
    }

    if (decision.action === 'fold') {
      this.handleFold(bot);
    } else if (decision.action === 'check') {
      this.handleCheck(bot);
    } else if (decision.action === 'call') {
      this.handleCall(bot);
    } else if (decision.action === 'raise' || decision.action === 'allin') {
      this.handleRaise(bot, decision.amount);
    }
  }

  handleFold(player) {
    player.folded = true;
    player.lastAction = { type: 'fold', text: 'Desistiu' };
    player.actedThisStreet = true;

    this.emit('onPlayerAction', { player, action: 'fold' });

    const active = this.players.filter(p => !p.folded);
    if (active.length <= 1) {
      this.handleEarlyWin();
      return;
    }

    this.advanceTurn();
  }

  handleCheck(player) {
    player.lastAction = { type: 'check', text: 'Mesa' };
    player.actedThisStreet = true;
    sound.playCheckKnock();

    this.emit('onPlayerAction', { player, action: 'check' });
    this.advanceTurn();
  }

  handleCall(player) {
    const highestBet = this.potManager.getHighestBet();
    const currentBet = this.potManager.getCurrentBet(player);
    const needed = highestBet - currentBet;
    const amountToPay = Math.min(player.chips, needed);

    player.chips -= amountToPay;
    this.potManager.addBet(player, amountToPay);
    player.actedThisStreet = true;

    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = { type: 'allin', text: `All-in (R$ ${amountToPay})` };
    } else {
      player.lastAction = { type: 'call', text: `Pagou R$ ${amountToPay}` };
    }

    sound.playChipSound();
    this.emit('onPlayerAction', { player, action: 'call', amount: amountToPay });
    this.emit('onPotUpdate', {
      totalPot: this.potManager.getTotalPot(),
      highestBet: this.potManager.getHighestBet()
    });

    this.advanceTurn();
  }

  handleRaise(player, totalBetAmount) {
    const currentBet = this.potManager.getCurrentBet(player);
    const highestBet = this.potManager.getHighestBet();
    
    let additionalChips = totalBetAmount - currentBet;
    additionalChips = Math.min(player.chips, Math.max(0, additionalChips));

    player.chips -= additionalChips;
    this.potManager.addBet(player, additionalChips);
    player.actedThisStreet = true;

    const newPlayerBet = this.potManager.getCurrentBet(player);
    const raiseIncrement = newPlayerBet - highestBet;
    if (raiseIncrement > this.minRaise) {
      this.minRaise = raiseIncrement;
    }

    this.raisesThisStreet++;

    this.players.forEach(p => {
      if (p !== player && !p.folded && !p.isAllIn) {
        p.actedThisStreet = false;
      }
    });

    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = { type: 'allin', text: `All-in (R$ ${additionalChips})` };
    } else {
      player.lastAction = { type: 'raise', text: `Aumentou para R$ ${newPlayerBet}` };
    }

    sound.playChipSound(true);
    this.emit('onPlayerAction', { player, action: 'raise', amount: newPlayerBet });
    this.emit('onPotUpdate', {
      totalPot: this.potManager.getTotalPot(),
      highestBet: this.potManager.getHighestBet()
    });

    this.advanceTurn();
  }

  advanceTurn() {
    if (this.isStreetBettingComplete()) {
      this.nextStreet();
      return;
    }

    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.notifyTurn();
  }

  isStreetBettingComplete() {
    const active = this.players.filter(p => !p.folded);
    if (active.length <= 1) return true;

    const activeCanAct = active.filter(p => !p.isAllIn);
    if (activeCanAct.length === 0) return true;

    const highestBet = this.potManager.getHighestBet();

    return active.every(p => {
      if (p.isAllIn) return true;
      return p.actedThisStreet && this.potManager.getCurrentBet(p) === highestBet;
    });
  }

  nextStreet() {
    this.potManager.endStreet();
    this.raisesThisStreet = 0;
    this.players.forEach(p => {
      p.actedThisStreet = false;
      p.lastAction = null;
    });
    this.minRaise = this.bigBlind;

    switch (this.state) {
      case GAME_STATES.PRE_FLOP:
        this.dealFlop();
        break;
      case GAME_STATES.FLOP:
        this.dealTurn();
        break;
      case GAME_STATES.TURN:
        this.dealRiver();
        break;
      case GAME_STATES.RIVER:
        this.startShowdown();
        break;
    }
  }

  dealFlop() {
    this.state = GAME_STATES.FLOP;
    this.deck.draw();
    const c1 = this.deck.draw();
    const c2 = this.deck.draw();
    const c3 = this.deck.draw();
    this.communityCards.push(c1, c2, c3);

    sound.playCardFlip();
    this.emit('onStateChange', { state: this.state });
    this.emit('onDealCommunityCard', { cards: this.communityCards, newCards: [c1, c2, c3] });

    this.resetTurnOrderPostFlop();
  }

  dealTurn() {
    this.state = GAME_STATES.TURN;
    this.deck.draw();
    const c = this.deck.draw();
    this.communityCards.push(c);

    sound.playCardFlip();
    this.emit('onStateChange', { state: this.state });
    this.emit('onDealCommunityCard', { cards: this.communityCards, newCards: [c] });

    this.resetTurnOrderPostFlop();
  }

  dealRiver() {
    this.state = GAME_STATES.RIVER;
    this.deck.draw();
    const c = this.deck.draw();
    this.communityCards.push(c);

    sound.playCardFlip();
    this.emit('onStateChange', { state: this.state });
    this.emit('onDealCommunityCard', { cards: this.communityCards, newCards: [c] });

    this.resetTurnOrderPostFlop();
  }

  resetTurnOrderPostFlop() {
    const numPlayers = this.players.length;
    let nextIndex = (this.dealerIndex + 1) % numPlayers;

    this.currentTurnIndex = nextIndex;
    setTimeout(() => {
      this.notifyTurn();
    }, 800);
  }

  advanceAllStreetsToShowdown() {
    const finishDealing = () => {
      if (this.communityCards.length === 0) {
        this.deck.draw();
        this.communityCards.push(this.deck.draw(), this.deck.draw(), this.deck.draw());
      } else if (this.communityCards.length === 3) {
        this.deck.draw();
        this.communityCards.push(this.deck.draw());
      } else if (this.communityCards.length === 4) {
        this.deck.draw();
        this.communityCards.push(this.deck.draw());
      }

      sound.playCardFlip();
      this.emit('onDealCommunityCard', { cards: this.communityCards });

      if (this.communityCards.length < 5) {
        setTimeout(finishDealing, 1000);
      } else {
        setTimeout(() => this.startShowdown(), 1200);
      }
    };

    setTimeout(finishDealing, 800);
  }

  handleEarlyWin() {
    this.state = GAME_STATES.PAYOUT;
    const payouts = this.potManager.distributePots(this.players, this.communityCards);

    const winner = payouts[0]?.player;
    if (winner) {
      const isHumanWinner = winner.isHuman;
      campaign.recordHandResult(isHumanWinner, payouts[0].amount);

      if (isHumanWinner) {
        sound.playWinFanfare();
        if (this.chapterId) {
          campaign.completeChapter(this.chapterId);
        }
      } else {
        sound.playChipSound(true);
      }

      this.emit('onPayout', {
        payouts: payouts,
        totalPot: this.potManager.getTotalPot(),
        isEarlyWin: true
      });

      this.emit('onChatMessage', {
        sender: 'Crupiê',
        avatarImg: 'assets/images/dealer.jpg',
        message: `${winner.name} venceu R$ ${payouts[0].amount.toLocaleString('pt-BR')} (Todos os oponentes desistiram).`
      });
    }

    setTimeout(() => {
      this.startNewHand();
    }, 4500);
  }

  startShowdown() {
    this.state = GAME_STATES.SHOWDOWN;
    this.emit('onStateChange', { state: this.state });
    this.emit('onShowdown', { players: this.players.filter(p => !p.folded), communityCards: this.communityCards });

    setTimeout(() => {
      this.processPayout();
    }, 2000);
  }

  processPayout() {
    this.state = GAME_STATES.PAYOUT;
    const payouts = this.potManager.distributePots(this.players, this.communityCards);

    const hasHumanWon = payouts.some(p => p.player.isHuman);
    const totalWon = payouts.filter(p => p.player.isHuman).reduce((acc, curr) => acc + curr.amount, 0);
    
    campaign.recordHandResult(hasHumanWon, totalWon);

    if (hasHumanWon) {
      sound.playWinFanfare();
      if (this.chapterId) {
        campaign.completeChapter(this.chapterId);
      }
    } else {
      sound.playChipSound(true);
    }

    this.emit('onPayout', {
      payouts: payouts,
      communityCards: this.communityCards,
      isEarlyWin: false
    });

    payouts.forEach(p => {
      const desc = p.handInfo ? `com ${p.handInfo.description}` : '';
      this.emit('onChatMessage', {
        sender: 'Crupiê',
        avatarImg: 'assets/images/dealer.jpg',
        message: `🏆 ${p.player.name} faturou R$ ${p.amount.toLocaleString('pt-BR')} ${desc}!`
      });
    });

    setTimeout(() => {
      this.startNewHand();
    }, 5500);
  }
}
