/**
 * app.js - Ponto de entrada principal da aplicação VIP Texas Hold'em & Portal de Poker
 */

import { GameEngine, GAME_STATES } from './engine/GameEngine.js';
import { TableRenderer } from './ui/TableRenderer.js';
import { SeatRenderer } from './ui/SeatRenderer.js';
import { ControlsManager } from './ui/ControlsManager.js';
import { ChatManager } from './ui/ChatManager.js';
import { PortalRenderer } from './ui/PortalRenderer.js';
import { SaveManager } from './engine/SaveManager.js';
import { campaign } from './engine/CampaignManager.js';
import { shop } from './engine/ShopManager.js';
import { sound } from './audio/SoundEffects.js';

class App {
  constructor() {
    this.engine = null;
    this.tableRenderer = new TableRenderer();
    this.seatRenderer = new SeatRenderer();
    this.controlsManager = null;
    this.chatManager = null;
    this.portalRenderer = null;
    this.currentFeltEnv = 'felt-emerald';

    // Telas
    this.screenPortal = document.getElementById('screen-portal');
    this.screenGame = document.getElementById('screen-game');
    this.pokerAppContainer = document.getElementById('poker-app');

    // HUD Superior da Mesa de Jogo
    this.hudBlindsEl = document.getElementById('hud-blinds');
    this.hudHandCountEl = document.getElementById('hud-hand-count');
    this.hudStatusEl = document.getElementById('hud-status');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.btnSaveAndExit = document.getElementById('btn-save-and-exit');
    this.btnExitToPortal = document.getElementById('btn-exit-to-portal');

    this.init();
  }

  init() {
    this.portalRenderer = new PortalRenderer(
      (gameConfig) => this.launchGame(gameConfig),
      (savedMatch) => this.resumeSavedMatch(savedMatch)
    );

    this.initAdminDevShortcuts();

    if (this.btnAudioToggle) {
      this.btnAudioToggle.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.btnAudioToggle.textContent = isMuted ? '🔇' : '🔊';
        this.btnAudioToggle.title = isMuted ? 'Ativar Som' : 'Desativar Som';
      });
    }

    if (this.btnSaveAndExit) {
      this.btnSaveAndExit.addEventListener('click', () => {
        if (confirm('Deseja salvar a partida atual e retornar ao Portal?')) {
          this.saveCurrentMatchAndExit();
        }
      });
    }

    if (this.btnExitToPortal) {
      this.btnExitToPortal.addEventListener('click', () => {
        if (confirm('Deseja retornar ao Portal de Poker? (O progresso não salvo será perdido)')) {
          this.returnToPortal();
        }
      });
    }
  }

  initAdminDevShortcuts() {
    // 1. Atalho de Teclado Alt + Shift + M
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        this.triggerAdminUnlock();
      }
    });

    // 2. Fallback secreto: Clicar 5x na coroa do topo
    const crownEl = document.querySelector('.brand-crown');
    let crownClicks = 0;
    let crownTimer = null;
    crownEl?.addEventListener('click', () => {
      crownClicks++;
      clearTimeout(crownTimer);
      crownTimer = setTimeout(() => { crownClicks = 0; }, 1500);
      if (crownClicks >= 5) {
        crownClicks = 0;
        this.triggerAdminUnlock();
      }
    });
  }

  triggerAdminUnlock() {
    campaign.unlockAllAdmin();
    shop.unlockAllAdmin();
    sound.playWinFanfare();

    this.portalRenderer.updateHeaderStats();
    this.portalRenderer.renderCampaignChapters();
    this.portalRenderer.renderShop(this.portalRenderer.currentShopCategory);
    this.portalRenderer.renderCareerStats();

    alert('👑 MODO DESENVOLVEDOR VIP ATIVADO!\n\n✓ +R$ 10.000.000 em Fichas Virtuais adicionados\n✓ Todos os 8 Torneios Mundiais Desbloqueados\n✓ Todos os Itens da Loja VIP Liberados\n✓ Nível 60 Lendário Alcançado');
  }

  launchGame(config) {
    sound.ensureContext();
    this.currentFeltEnv = config.feltEnv || 'felt-emerald';
    this.pokerAppContainer.className = `app-container env-${this.currentFeltEnv}`;

    this.engine = new GameEngine({
      playerName: config.playerName || 'Jogador VIP',
      smallBlind: config.smallBlind || 10,
      bigBlind: config.bigBlind || 20,
      buyIn: config.buyIn || 1000,
      numBots: config.numBots || 4,
      chapterId: config.chapterId || null
    });

    this.controlsManager = new ControlsManager(this.engine);
    this.chatManager = new ChatManager(this.engine);

    this.setupEngineHooks();

    this.screenPortal.classList.add('hidden');
    this.screenGame.classList.remove('hidden');

    if (this.hudBlindsEl) {
      this.hudBlindsEl.textContent = `Blinds: R$ ${config.smallBlind} / R$ ${config.bigBlind}`;
    }

    this.engine.initGame();
  }

  resumeSavedMatch(saved) {
    sound.ensureContext();
    this.currentFeltEnv = saved.feltEnv || 'felt-emerald';
    this.pokerAppContainer.className = `app-container env-${this.currentFeltEnv}`;

    this.engine = new GameEngine({
      playerName: saved.players[0]?.name || 'Jogador VIP',
      smallBlind: saved.smallBlind || 10,
      bigBlind: saved.bigBlind || 20,
      buyIn: saved.buyIn || 1000,
      numBots: saved.players.length - 1,
      chapterId: saved.chapterId || null
    });

    this.controlsManager = new ControlsManager(this.engine);
    this.chatManager = new ChatManager(this.engine);

    this.setupEngineHooks();

    // Restaurar dados salvos
    this.engine.handCount = saved.handCount || 1;
    this.engine.dealerIndex = saved.dealerIndex || 0;
    this.engine.currentTurnIndex = saved.currentTurnIndex || 0;
    this.engine.communityCards = saved.communityCards || [];
    this.engine.state = saved.state || 'PRE_FLOP';

    // Restaurar jogadores e fichas
    this.engine.players = saved.players.map(p => ({
      ...p,
      actedThisStreet: false,
      lastAction: null
    }));

    this.screenPortal.classList.add('hidden');
    this.screenGame.classList.remove('hidden');

    if (this.hudBlindsEl) {
      this.hudBlindsEl.textContent = `Blinds: R$ ${saved.smallBlind} / R$ ${saved.bigBlind}`;
    }

    // Renderizar mesa com o estado recuperado
    this.tableRenderer.renderCommunityCards(this.engine.communityCards);
    this.tableRenderer.updatePot(saved.potTotal || 0);
    this.seatRenderer.renderSeats(
      this.engine.players,
      this.engine.dealerIndex,
      this.engine.currentTurnIndex,
      false,
      this.engine.communityCards
    );

    this.engine.notifyTurn();
  }

  saveCurrentMatchAndExit() {
    if (this.engine) {
      SaveManager.saveMatch(this.engine, { feltEnv: this.currentFeltEnv });
      if (this.engine.botThinkingTimer) {
        clearTimeout(this.engine.botThinkingTimer);
      }
    }
    this.returnToPortal();
  }

  returnToPortal() {
    if (this.engine && this.engine.botThinkingTimer) {
      clearTimeout(this.engine.botThinkingTimer);
    }
    this.screenGame.classList.add('hidden');
    this.screenPortal.classList.remove('hidden');
    this.portalRenderer.updateHeaderStats();
    this.portalRenderer.checkSavedMatch();
    this.portalRenderer.renderCampaignChapters();
    this.portalRenderer.renderCareerStats();
  }

  setupEngineHooks() {
    this.engine.on('onStateChange', (data) => {
      if (this.hudHandCountEl) {
        this.hudHandCountEl.textContent = `Mão #${this.engine.handCount}`;
      }
      this.updateHudStatus(data.state);
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        this.engine.currentTurnIndex,
        data.state === GAME_STATES.SHOWDOWN || data.state === GAME_STATES.PAYOUT,
        this.engine.communityCards
      );
    });

    this.engine.on('onDealPlayerCards', () => {
      this.tableRenderer.renderCommunityCards([]);
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        this.engine.currentTurnIndex,
        false,
        this.engine.communityCards
      );
    });

    this.engine.on('onDealCommunityCard', (data) => {
      this.tableRenderer.renderCommunityCards(data.cards);
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        this.engine.currentTurnIndex,
        false,
        data.cards
      );
    });

    this.engine.on('onTurnChange', (data) => {
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        data.playerIndex,
        false,
        this.engine.communityCards
      );

      this.controlsManager.updateControlsState(data);

      if (data.player.isHuman) {
        this.setHudMessage('👉 Sua vez de agir!');
      } else {
        this.setHudMessage(`Aguardando ${data.player.name}...`);
      }
    });

    this.engine.on('onPlayerAction', () => {
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        this.engine.currentTurnIndex,
        false,
        this.engine.communityCards
      );
    });

    this.engine.on('onPotUpdate', (data) => {
      this.tableRenderer.updatePot(data.totalPot);
    });

    this.engine.on('onShowdown', () => {
      this.setHudMessage('🔍 Showdown! Revelando mãos dos jogadores...');
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        -1,
        true,
        this.engine.communityCards
      );
    });

    this.engine.on('onPayout', (data) => {
      const winnerId = data.payouts[0]?.player?.id;
      this.tableRenderer.showWinnerAnnouncement(data.payouts);
      this.seatRenderer.renderSeats(
        this.engine.players,
        this.engine.dealerIndex,
        -1,
        true,
        this.engine.communityCards,
        winnerId
      );
      this.setHudMessage('Distribuindo fichas aos vencedores...');
    });

    this.engine.on('onChatMessage', (msg) => {
      this.chatManager.addMessage(msg);
    });
  }

  updateHudStatus(state) {
    const stageNames = {
      [GAME_STATES.PRE_FLOP]: 'Pré-Flop',
      [GAME_STATES.FLOP]: 'Flop',
      [GAME_STATES.TURN]: 'Turn',
      [GAME_STATES.RIVER]: 'River',
      [GAME_STATES.SHOWDOWN]: 'Showdown',
      [GAME_STATES.PAYOUT]: 'Vencedores'
    };
    const name = stageNames[state] || state;
    if (this.hudStatusEl) {
      this.hudStatusEl.textContent = `Etapa: ${name}`;
    }
  }

  setHudMessage(msg) {
    const statusFooter = document.getElementById('table-status-footer');
    if (statusFooter) {
      statusFooter.textContent = msg;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pokerApp = new App();
});
