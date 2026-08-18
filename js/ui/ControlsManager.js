/**
 * ControlsManager.js - Barra de ações circulares estilo GGPoker / WSOP Mobile e fichas rápidas
 */

import { sound } from '../audio/SoundEffects.js';

export class ControlsManager {
  constructor(engine) {
    this.engine = engine;

    this.controlsContainer = document.getElementById('player-controls');
    this.btnFold = document.getElementById('btn-fold');
    this.btnCheckCall = document.getElementById('btn-check-call');
    this.btnRaise = document.getElementById('btn-raise');
    this.btnAllIn = document.getElementById('btn-all-in');

    this.raiseSliderPopup = document.getElementById('raise-slider-popup');
    this.betSlider = document.getElementById('bet-slider');
    this.betAmountInput = document.getElementById('bet-amount-input');
    this.raiseValueDisplay = document.getElementById('raise-value-display');
    this.btnConfirmRaise = document.getElementById('btn-confirm-raise');

    // Quick chip buttons
    this.chipButtons = document.querySelectorAll('.quick-chip-btn');

    this.currentMinRaise = 20;
    this.currentMaxRaise = 1000;
    this.selectedRaiseAmount = 20;

    this.initEventListeners();
  }

  initEventListeners() {
    if (!this.controlsContainer) return;

    // 1. Fold (Correr)
    this.btnFold.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playUiClick();
      const human = this.engine.players[0];
      if (this.isHumanTurn()) {
        this.closeRaisePopup();
        this.disableControls();
        this.engine.handleFold(human);
      }
    });

    // 2. Check / Call (Mesa / Pagar)
    this.btnCheckCall.addEventListener('click', (e) => {
      e.stopPropagation();
      const human = this.engine.players[0];
      if (this.isHumanTurn()) {
        const highestBet = this.engine.potManager.getHighestBet();
        const currentBet = this.engine.potManager.getCurrentBet(human);
        const toCall = highestBet - currentBet;

        this.closeRaisePopup();
        this.disableControls();
        if (toCall <= 0) {
          this.engine.handleCheck(human);
        } else {
          this.engine.handleCall(human);
        }
      }
    });

    // 3. Apostar / Aumentar (Toggle Slider Popup)
    this.btnRaise.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.isHumanTurn()) return;

      if (this.raiseSliderPopup.classList.contains('hidden')) {
        this.raiseSliderPopup.classList.remove('hidden');
      } else {
        // Se já estava aberto, confirma o raise
        const human = this.engine.players[0];
        const amount = parseInt(this.selectedRaiseAmount, 10);
        this.closeRaisePopup();
        this.disableControls();
        this.engine.handleRaise(human, amount);
      }
    });

    if (this.btnConfirmRaise) {
      this.btnConfirmRaise.addEventListener('click', (e) => {
        e.stopPropagation();
        const human = this.engine.players[0];
        if (this.isHumanTurn()) {
          const amount = parseInt(this.selectedRaiseAmount, 10);
          this.closeRaisePopup();
          this.disableControls();
          this.engine.handleRaise(human, amount);
        }
      });
    }

    // 4. All-In
    if (this.btnAllIn) {
      this.btnAllIn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playChipSound(true);
        const human = this.engine.players[0];
        if (this.isHumanTurn()) {
          const currentBet = this.engine.potManager.getCurrentBet(human);
          const maxBet = currentBet + human.chips;
          this.closeRaisePopup();
          this.disableControls();
          this.engine.handleRaise(human, maxBet);
        }
      });
    }

    // 5. Slider de aposta
    if (this.betSlider) {
      this.betSlider.addEventListener('input', (e) => {
        this.updateRaiseValue(parseInt(e.target.value, 10));
      });
    }

    // 6. Input numérico
    if (this.betAmountInput) {
      this.betAmountInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10) || this.currentMinRaise;
        val = Math.max(this.currentMinRaise, Math.min(this.currentMaxRaise, val));
        this.updateRaiseValue(val);
      });
    }

    // 7. Fichas Rápidas
    this.chipButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.isHumanTurn()) return;
        sound.playChipSound();
        const chipVal = parseInt(btn.dataset.value, 10) || 50;
        const currentTarget = this.selectedRaiseAmount + chipVal;
        const bounded = Math.max(this.currentMinRaise, Math.min(this.currentMaxRaise, currentTarget));
        this.updateRaiseValue(bounded);
        this.raiseSliderPopup?.classList.remove('hidden');
      });
    });

    // Botões de fração de pote dentro do popup
    const qMin = document.getElementById('quick-min');
    const qHalf = document.getElementById('quick-half-pot');
    const qThreeQ = document.getElementById('quick-three-quarter');
    const qPot = document.getElementById('quick-pot');
    const qMax = document.getElementById('quick-max');

    qMin?.addEventListener('click', () => this.setQuickFraction('min'));
    qHalf?.addEventListener('click', () => this.setQuickFraction('half'));
    qThreeQ?.addEventListener('click', () => this.setQuickFraction('three-quarter'));
    qPot?.addEventListener('click', () => this.setQuickFraction('pot'));
    qMax?.addEventListener('click', () => this.setQuickFraction('max'));
  }

  isHumanTurn() {
    const human = this.engine.players[0];
    return (
      this.engine.currentTurnIndex === 0 &&
      !human.folded &&
      !human.isAllIn &&
      (this.engine.state === 'PRE_FLOP' ||
       this.engine.state === 'FLOP' ||
       this.engine.state === 'TURN' ||
       this.engine.state === 'RIVER')
    );
  }

  closeRaisePopup() {
    if (this.raiseSliderPopup) {
      this.raiseSliderPopup.classList.add('hidden');
    }
  }

  updateControlsState(turnData) {
    const human = this.engine.players[0];
    const isMyTurn = this.isHumanTurn();

    if (!isMyTurn) {
      this.closeRaisePopup();
      this.disableControls();
      return;
    }

    this.controlsContainer.classList.remove('disabled');
    this.controlsContainer.style.pointerEvents = 'auto';

    const highestBet = turnData.highestBet || 0;
    const currentBet = turnData.currentBet || 0;
    const callAmount = highestBet - currentBet;

    // Atualizar Botão Mesa / Pagar
    const callLabelEl = document.getElementById('call-btn-label');
    const callAmountEl = document.getElementById('call-btn-amount');

    if (callAmount <= 0) {
      if (callLabelEl) callLabelEl.textContent = 'Mesa';
      if (callAmountEl) callAmountEl.textContent = 'Check';
    } else {
      const actualCall = Math.min(human.chips, callAmount);
      if (callLabelEl) callLabelEl.textContent = 'Pagar';
      if (callAmountEl) callAmountEl.textContent = `$${actualCall.toLocaleString('en-US')}`;
    }

    // Configurar limites do Raise
    const minRaiseInc = turnData.minRaise || this.engine.bigBlind;
    const minRaiseTotal = highestBet + minRaiseInc;
    const maxRaiseTotal = currentBet + human.chips;

    if (maxRaiseTotal <= highestBet) {
      this.btnRaise.disabled = true;
    } else {
      this.btnRaise.disabled = false;
      this.currentMinRaise = Math.min(minRaiseTotal, maxRaiseTotal);
      this.currentMaxRaise = maxRaiseTotal;

      if (this.betSlider) {
        this.betSlider.min = this.currentMinRaise;
        this.betSlider.max = this.currentMaxRaise;
        this.betSlider.step = this.engine.smallBlind;
      }

      this.updateRaiseValue(this.currentMinRaise);
    }
  }

  updateRaiseValue(val) {
    this.selectedRaiseAmount = val;
    if (this.betSlider) this.betSlider.value = val;
    if (this.betAmountInput) this.betAmountInput.value = val;
    if (this.raiseValueDisplay) {
      this.raiseValueDisplay.textContent = `$${val.toLocaleString('en-US')}`;
    }
  }

  setQuickFraction(type) {
    if (!this.isHumanTurn()) return;
    sound.playUiClick();

    const human = this.engine.players[0];
    const highestBet = this.engine.potManager.getHighestBet();
    const currentBet = this.engine.potManager.getCurrentBet(human);
    const potTotal = this.engine.potManager.getTotalPot();

    let target = this.currentMinRaise;

    switch (type) {
      case 'min':
        target = this.currentMinRaise;
        break;
      case 'half':
        target = highestBet + Math.max(this.engine.bigBlind, Math.floor(potTotal * 0.5));
        break;
      case 'three-quarter':
        target = highestBet + Math.max(this.engine.bigBlind, Math.floor(potTotal * 0.75));
        break;
      case 'pot':
        target = highestBet + Math.max(this.engine.bigBlind, potTotal);
        break;
      case 'max':
        target = this.currentMaxRaise;
        break;
    }

    target = Math.max(this.currentMinRaise, Math.min(this.currentMaxRaise, target));
    this.updateRaiseValue(target);
  }

  disableControls() {
    if (this.controlsContainer) {
      this.controlsContainer.classList.add('disabled');
    }
  }
}
