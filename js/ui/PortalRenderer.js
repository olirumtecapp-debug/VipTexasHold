import { campaign } from '../engine/CampaignManager.js';
import { shop } from '../engine/ShopManager.js';
import { SaveManager } from '../engine/SaveManager.js';
import { OnlineRoomManager } from '../engine/OnlineRoomManager.js';
import { sound } from '../audio/SoundEffects.js';

export class PortalRenderer {
  constructor(onStartGameCallback, onResumeSavedMatchCallback) {
    this.onStartGame = onStartGameCallback;
    this.onResumeSavedMatch = onResumeSavedMatchCallback;
    this.onlineRoomManager = new OnlineRoomManager((data) => this.handleRoomSync(data));
    this.currentShopCategory = 'felts';

    // Elementos DOM do Portal
    this.portalContainer = document.getElementById('screen-portal');
    this.headerBankrollEl = document.getElementById('portal-bankroll');
    this.headerVipBadgeEl = document.getElementById('portal-vip-badge');
    this.headerLevelEl = document.getElementById('portal-level');
    this.headerXpFillEl = document.getElementById('portal-xp-fill');

    // Container de Conteúdo Principal (Área de Rolagem)
    this.portalMain = document.querySelector('.portal-main');

    // Container de Partida Salva
    this.savedMatchBannerEl = document.getElementById('saved-match-banner');

    // Botões de Navegação do Portal
    this.navBtns = document.querySelectorAll('.portal-nav-tab');
    this.tabSections = document.querySelectorAll('.portal-tab-content');

    // Botão Roleta Diária
    this.btnDailySpin = document.getElementById('btn-daily-bonus');
    this.dailyModal = document.getElementById('daily-spin-modal');
    this.btnCloseDailyModal = document.getElementById('btn-close-daily-modal');
    this.btnSpinWheel = document.getElementById('btn-spin-wheel');
    this.wheelResultEl = document.getElementById('wheel-result-msg');

    this.init();
  }

  init() {
    this.updateHeaderStats();
    this.checkSavedMatch();
    this.initNavEvents();
    this.initDailySpinEvents();
    this.renderCampaignChapters();
    this.renderCareerStats();
    this.renderShop();
    this.initCashGameForm();
    this.initOnlineRoomEvents();
  }

  updateHeaderStats() {
    const tier = campaign.getVipTier();
    if (this.headerBankrollEl) {
      this.headerBankrollEl.textContent = `R$ ${campaign.data.bankroll.toLocaleString('pt-BR')}`;
    }
    if (this.headerVipBadgeEl) {
      this.headerVipBadgeEl.textContent = `${tier.badge} ${tier.name}`;
      this.headerVipBadgeEl.style.color = tier.color;
      this.headerVipBadgeEl.style.borderColor = tier.color;
    }
    if (this.headerLevelEl) {
      this.headerLevelEl.textContent = `Nível ${campaign.data.level}`;
    }
    if (this.headerXpFillEl) {
      const requiredXp = campaign.data.level * 1000;
      const pct = Math.min(100, (campaign.data.xp / requiredXp) * 100);
      this.headerXpFillEl.style.width = `${pct}%`;
    }
  }

  checkSavedMatch() {
    if (!this.savedMatchBannerEl) return;

    if (SaveManager.hasSavedMatch()) {
      const match = SaveManager.getSavedMatch();
      this.savedMatchBannerEl.innerHTML = `
        <div class="saved-match-content">
          <div class="saved-match-info">
            <span class="saved-match-tag">💾 PARTIDA SALVA ENCONTRADA</span>
            <h4 class="saved-match-title">Mão #${match.handCount || 1} • Pote Atual: R$ ${(match.potTotal || 0).toLocaleString('pt-BR')}</h4>
            <span class="saved-match-sub">Retome exatamente de onde parou com seu saldo e cartas.</span>
          </div>
          <div class="saved-match-actions">
            <button id="btn-resume-match" class="btn-resume-match">▶ CONTINUAR PARTIDA</button>
            <button id="btn-discard-match" class="btn-discard-match" title="Descartar partida salva">✕</button>
          </div>
        </div>
      `;
      this.savedMatchBannerEl.classList.remove('hidden');

      const btnResume = document.getElementById('btn-resume-match');
      const btnDiscard = document.getElementById('btn-discard-match');

      btnResume?.addEventListener('click', () => {
        sound.playUiClick();
        if (this.onResumeSavedMatch) {
          this.onResumeSavedMatch(match);
        }
      });

      btnDiscard?.addEventListener('click', () => {
        if (confirm('Deseja descartar a partida salva e iniciar uma nova?')) {
          SaveManager.clearSavedMatch();
          this.savedMatchBannerEl.classList.add('hidden');
        }
      });
    } else {
      this.savedMatchBannerEl.classList.add('hidden');
    }
  }

  initNavEvents() {
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playUiClick();
        const tab = btn.dataset.tab;
        this.navBtns.forEach(b => b.classList.remove('active'));
        this.tabSections.forEach(s => s.classList.add('hidden'));

        btn.classList.add('active');
        const targetSection = document.getElementById(`tab-${tab}`);
        if (targetSection) {
          targetSection.classList.remove('hidden');
        }

        // Reset de rolagem imediato para eliminar qualquer oscilação
        if (this.portalMain) this.portalMain.scrollTop = 0;
        if (this.portalContainer) this.portalContainer.scrollTop = 0;

        if (tab === 'campaign') this.renderCampaignChapters();
        if (tab === 'career') this.renderCareerStats();
        if (tab === 'shop') this.renderShop();
      });
    });
  }

  renderCampaignChapters() {
    const container = document.getElementById('campaign-cards-grid');
    if (!container) return;

    container.innerHTML = '';
    const chapters = campaign.getChapters();

    chapters.forEach(ch => {
      const card = document.createElement('div');
      card.className = `campaign-city-card ${ch.unlocked ? 'unlocked' : 'locked'} ${ch.completed ? 'completed' : ''}`;

      card.innerHTML = `
        <div class="city-card-banner" style="background-image: url('${ch.image}');">
          <div class="city-overlay"></div>
          ${ch.completed ? '<div class="chapter-completed-badge">✓ CONQUISTADO</div>' : ''}
          ${!ch.unlocked ? '<div class="chapter-locked-badge">🔒 BLOQUEADO</div>' : ''}
          <div class="city-info-badge">
            <span class="city-name">${ch.city}</span>
            <h3 class="chapter-title">${ch.title}</h3>
          </div>
        </div>

        <div class="city-card-body">
          <p class="chapter-desc">${ch.description}</p>
          
          <div class="chapter-stats-row">
            <div class="c-stat">
              <span class="c-stat-label">Buy-in</span>
              <span class="c-stat-val">R$ ${ch.buyIn.toLocaleString('pt-BR')}</span>
            </div>
            <div class="c-stat">
              <span class="c-stat-label">Blinds</span>
              <span class="c-stat-val">R$ ${ch.smallBlind}/${ch.bigBlind}</span>
            </div>
            <div class="c-stat">
              <span class="c-stat-label">Prêmio 1º</span>
              <span class="c-stat-val highlight-gold">R$ ${ch.firstPlacePrize.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div class="trophy-preview">
            <span class="trophy-label">Recompensa:</span>
            <span class="trophy-val">${ch.trophy}</span>
          </div>

          ${!ch.unlocked ? `
            <button class="btn-unlock-chapter" data-chapter-id="${ch.id}">
              🔓 LIBERAR (R$ ${(ch.unlockPrice || 10000).toLocaleString('pt-BR')})
            </button>
          ` : `
            <button class="btn-play-chapter" ${campaign.data.bankroll < ch.buyIn ? 'disabled' : ''}>
              ${campaign.data.bankroll < ch.buyIn ? 'Saldo Insuficiente' : 'DISPUTAR TORNEIO'}
            </button>
          `}
        </div>
      `;

      const playBtn = card.querySelector('.btn-play-chapter');
      if (playBtn && ch.unlocked && campaign.data.bankroll >= ch.buyIn) {
        playBtn.addEventListener('click', () => {
          sound.playUiClick();
          const equippedFelt = shop.getEquipped('felt') || 'felt-emerald';
          this.onStartGame({
            playerName: 'Jogador VIP',
            smallBlind: ch.smallBlind,
            bigBlind: ch.bigBlind,
            buyIn: ch.buyIn,
            numBots: 4,
            feltEnv: equippedFelt,
            chapterId: ch.id
          });
        });
      }

      const unlockBtn = card.querySelector('.btn-unlock-chapter');
      if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
          const price = ch.unlockPrice || 10000;
          if (confirm(`Deseja desbloquear antecipadamente o torneio "${ch.title}" (${ch.city}) por R$ ${price.toLocaleString('pt-BR')} em fichas virtuais?`)) {
            sound.playChipSound(true);
            const res = campaign.unlockChapterWithChips(ch.id);
            alert(res.msg);
            if (res.success) {
              sound.playWinFanfare();
              this.updateHeaderStats();
              this.renderCampaignChapters();
            }
          }
        });
      }

      container.appendChild(card);
    });
  }

  renderCareerStats() {
    const d = campaign.data;
    const total = d.totalHands;
    const won = d.handsWon;
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

    const elTotalHands = document.getElementById('stat-total-hands');
    const elHandsWon = document.getElementById('stat-hands-won');
    const elWinRate = document.getElementById('stat-win-rate');
    const elBiggestPot = document.getElementById('stat-biggest-pot');
    const trophiesGrid = document.getElementById('career-trophies-grid');

    if (elTotalHands) elTotalHands.textContent = total;
    if (elHandsWon) elHandsWon.textContent = won;
    if (elWinRate) elWinRate.textContent = `${winRate}%`;
    if (elBiggestPot) elBiggestPot.textContent = `R$ ${d.biggestPot.toLocaleString('pt-BR')}`;

    if (trophiesGrid) {
      trophiesGrid.innerHTML = '';
      if (d.trophies.length === 0) {
        trophiesGrid.innerHTML = '<div class="no-trophies-msg">Nenhum troféu conquistado ainda. Vença as etapas da Campanha para preencher sua sala de troféus!</div>';
      } else {
        d.trophies.forEach(t => {
          const item = document.createElement('div');
          item.className = 'trophy-item-card';
          item.innerHTML = `
            <div class="trophy-item-icon">🏆</div>
            <div class="trophy-item-name">${t}</div>
          `;
          trophiesGrid.appendChild(item);
        });
      }
    }
  }

  initCashGameForm() {
    const btnStartCash = document.getElementById('btn-start-cash-game');
    if (!btnStartCash) return;

    btnStartCash.addEventListener('click', () => {
      sound.playUiClick();
      const stakesEl = document.getElementById('cash-stakes-select');
      const feltEl = document.getElementById('cash-felt-select');
      const botsEl = document.getElementById('cash-bots-select');

      const [sb, bb, buyIn] = stakesEl.value.split('_').map(Number);
      const felt = feltEl.value;
      const numBots = parseInt(botsEl.value, 10);

      this.onStartGame({
        playerName: 'Jogador VIP',
        smallBlind: sb,
        bigBlind: bb,
        buyIn: buyIn,
        numBots: numBots,
        feltEnv: felt,
        chapterId: null
      });
    });
  }

  renderShop(category = 'felts') {
    this.currentShopCategory = category;
    const container = document.getElementById('shop-items-grid');
    if (!container) return;

    container.innerHTML = '';
    const items = shop.catalog[category] || [];
    const catKey = category.replace(/s$/, '');
    const currentEquipped = shop.getEquipped(catKey);

    // Atualizar botões de sub-abas da loja
    const subtabs = document.querySelectorAll('.shop-subtab-btn');
    subtabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shopTab === category);
    });

    items.forEach(item => {
      const isOwned = shop.isOwned(item.id);
      const isEquipped = currentEquipped === item.id;

      const card = document.createElement('div');
      card.className = `shop-item-card ${isEquipped ? 'is-equipped' : ''}`;

      let previewHtml = '';
      if (category === 'felts') {
        previewHtml = `<div class="shop-item-preview" style="background: ${item.previewColor};"></div>`;
      } else if (category === 'decks') {
        previewHtml = `<div class="shop-item-preview card-back ${item.id}"><span style="font-size: 24px;">${item.icon || '♠'}</span></div>`;
      } else {
        previewHtml = `<div class="shop-item-preview" style="background: rgba(30, 41, 59, 0.8);"><span style="font-size: 32px;">${item.icon || '🎰'}</span></div>`;
      }

      let actionBtnHtml = '';
      if (isEquipped) {
        actionBtnHtml = `<button class="btn-shop-action btn-shop-equipped" disabled>✓ EQUIPADO</button>`;
      } else if (isOwned) {
        actionBtnHtml = `<button class="btn-shop-action btn-shop-equip" data-item-id="${item.id}" data-category="${category}">EQUIPAR</button>`;
      } else {
        actionBtnHtml = `<button class="btn-shop-action btn-shop-buy" data-item-id="${item.id}" data-category="${category}">COMPRAR</button>`;
      }

      card.innerHTML = `
        ${previewHtml}
        <div class="shop-item-header">
          <span class="shop-item-name">${item.name}</span>
          ${item.price > 0 ? `<span class="shop-price-tag">R$ ${item.price.toLocaleString('pt-BR')}</span>` : `<span class="shop-free-tag">GRÁTIS</span>`}
        </div>
        <p class="shop-item-desc">${item.desc}</p>
        <div class="shop-item-footer">
          ${actionBtnHtml}
        </div>
      `;

      // Eventos de compra e equipamento
      const buyBtn = card.querySelector('.btn-shop-buy');
      const equipBtn = card.querySelector('.btn-shop-equip');

      buyBtn?.addEventListener('click', () => {
        sound.playChipSound(true);
        const res = shop.buyItem(category, item.id);
        alert(res.msg);
        this.updateHeaderStats();
        this.renderShop(this.currentShopCategory);
      });

      equipBtn?.addEventListener('click', () => {
        sound.playUiClick();
        shop.equipItem(category, item.id);
        this.renderShop(this.currentShopCategory);
      });

      container.appendChild(card);
    });

    // Sub-abas da loja
    subtabs.forEach(btn => {
      btn.onclick = () => {
        sound.playUiClick();
        this.renderShop(btn.dataset.shopTab);
      };
    });
  }

  initOnlineRoomEvents() {
    const btnCreateRoom = document.getElementById('btn-create-online-room');
    const btnJoinRoom = document.getElementById('btn-join-online-room');
    const inputRoomCode = document.getElementById('input-join-room-code');
    const roomCreatedBox = document.getElementById('room-created-info-box');
    const roomDisplayCode = document.getElementById('display-room-code');
    const btnCopyRoomCode = document.getElementById('btn-copy-room-code');
    const btnCopyRoomLink = document.getElementById('btn-copy-room-link');
    const btnEnterCreatedRoom = document.getElementById('btn-enter-created-room');

    // 1. Criar Sala VIP
    btnCreateRoom?.addEventListener('click', () => {
      sound.playChipSound(true);
      const code = this.onlineRoomManager.createRoom();
      if (roomDisplayCode) roomDisplayCode.textContent = code;
      if (roomCreatedBox) roomCreatedBox.classList.remove('hidden');
    });

    // 2. Copiar Código
    btnCopyRoomCode?.addEventListener('click', () => {
      const code = this.onlineRoomManager.currentRoomCode;
      if (code) {
        navigator.clipboard.writeText(code);
        btnCopyRoomCode.textContent = '✓ Copiado!';
        setTimeout(() => { btnCopyRoomCode.textContent = '📋 Copiar Código'; }, 2000);
      }
    });

    // 3. Copiar Link
    btnCopyRoomLink?.addEventListener('click', () => {
      const link = this.onlineRoomManager.getShareableLink();
      if (link) {
        navigator.clipboard.writeText(link);
        btnCopyRoomLink.textContent = '✓ Link Copiado!';
        setTimeout(() => { btnCopyRoomLink.textContent = '🔗 Copiar Link de Convite'; }, 2000);
      }
    });

    // 4. Entrar na Sala Criada
    btnEnterCreatedRoom?.addEventListener('click', () => {
      sound.playUiClick();
      const stakesEl = document.getElementById('online-stakes-select');
      const [sb, bb, buyIn] = stakesEl.value.split('_').map(Number);
      this.onStartGame({
        playerName: 'Jogador VIP (Host)',
        smallBlind: sb,
        bigBlind: bb,
        buyIn: buyIn,
        numBots: 3,
        feltEnv: 'felt-royal-blue',
        roomCode: this.onlineRoomManager.currentRoomCode
      });
    });

    // 5. Entrar com Código Existente
    btnJoinRoom?.addEventListener('click', () => {
      const code = inputRoomCode?.value.trim();
      if (!code) {
        alert('Por favor, digite um código de sala válido (ex: VIP-1234).');
        return;
      }

      sound.playUiClick();
      const success = this.onlineRoomManager.joinRoom(code);
      if (success) {
        this.onStartGame({
          playerName: 'Jogador VIP (Convidado)',
          smallBlind: 10,
          bigBlind: 20,
          buyIn: 1000,
          numBots: 3,
          feltEnv: 'felt-royal-blue',
          roomCode: code
        });
      }
    });
  }

  handleRoomSync(data) {
    console.log('Sincronização de sala recebida:', data);
  }

  initDailySpinEvents() {
    if (this.btnDailySpin && this.dailyModal) {
      this.btnDailySpin.addEventListener('click', () => {
        sound.playUiClick();
        this.dailyModal.classList.remove('hidden');
        if (this.wheelResultEl) this.wheelResultEl.textContent = '';
      });
    }

    if (this.btnCloseDailyModal && this.dailyModal) {
      this.btnCloseDailyModal.addEventListener('click', () => {
        this.dailyModal.classList.add('hidden');
      });
    }

    if (this.btnSpinWheel) {
      this.btnSpinWheel.addEventListener('click', () => {
        sound.playChipSound(true);
        this.btnSpinWheel.disabled = true;

        const wheelEl = document.getElementById('lucky-wheel-disc');
        if (wheelEl) {
          const randomRot = 1440 + Math.floor(Math.random() * 360);
          wheelEl.style.transform = `rotate(${randomRot}deg)`;
        }

        setTimeout(() => {
          const wonAmount = campaign.claimDailyReward();
          this.updateHeaderStats();
          sound.playWinFanfare();
          if (this.wheelResultEl) {
            this.wheelResultEl.textContent = `🎉 Parabéns! Você ganhou R$ ${wonAmount.toLocaleString('pt-BR')} em fichas de bônus!`;
          }
          this.btnSpinWheel.disabled = false;
        }, 2200);
      });
    }
  }
}
