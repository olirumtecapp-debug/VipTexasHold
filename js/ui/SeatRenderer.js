/**
 * SeatRenderer.js - Renderização dos assentos com retratos fotorrealistas em alta definição, níveis e anel neon
 */

import { HandEvaluator } from '../engine/HandEvaluator.js';
import { shop } from '../engine/ShopManager.js';

export class SeatRenderer {
  constructor() {
    this.seatsContainer = document.getElementById('table-seats');
    this.playerHandRankBadge = document.getElementById('player-hand-rank');
  }

  renderSeats(players, dealerIndex, currentTurnIndex, isShowdown = false, communityCards = [], winningPlayerId = null) {
    if (!this.seatsContainer) return;
    this.seatsContainer.innerHTML = '';

    const positionClasses = [
      'seat-bottom-center', // Assento 0: Jogador Humano (Hero - 6h)
      'seat-left-flank',     // Assento 1: Lateral Esquerda (9h)
      'seat-top-left',       // Assento 2: Topo Esquerdo (11h)
      'seat-top-right',      // Assento 3: Topo Direito (1h)
      'seat-right-flank'     // Assento 4: Lateral Direita (3h)
    ];

    players.forEach((player, idx) => {
      const seatDiv = document.createElement('div');
      const posClass = positionClasses[idx] || `seat-pos-${idx}`;
      const isTurn = idx === currentTurnIndex;
      const isDealer = idx === dealerIndex;
      const isWinner = winningPlayerId === player.id;

      seatDiv.className = `player-seat ${posClass} ${player.isHuman ? 'is-human' : 'is-bot'} ${player.folded ? 'is-folded' : ''} ${isTurn ? 'is-turn-active' : ''} ${isWinner ? 'is-winner-seat' : ''}`;
      seatDiv.id = `seat-${player.id}`;

      // 1. Dealer Button
      const dealerBadge = isDealer ? '<div class="dealer-button" title="Botão de Dealer">D</div>' : '';

      // 2. Action Badge
      let actionBadge = '';
      if (player.lastAction) {
        actionBadge = `<div class="action-badge action-${player.lastAction.type}">${player.lastAction.text}</div>`;
      } else if (player.folded) {
        actionBadge = '<div class="action-badge action-fold">Desistiu</div>';
      } else if (player.isAllIn) {
        actionBadge = '<div class="action-badge action-allin">ALL-IN</div>';
      }

      // 3. Cartas do Jogador
      let cardsHtml = '<div class="seat-cards">';
      if (player.cards && player.cards.length > 0) {
        player.cards.forEach((card, cIdx) => {
          if (player.isHuman || isShowdown) {
            const tiltClass = player.isHuman ? (cIdx === 0 ? 'card-tilt-left' : 'card-tilt-right') : '';
            cardsHtml += `
              <div class="poker-card mini ${tiltClass} rank-${card.rank.short.toLowerCase()} suit-${card.suit.id.toLowerCase()} ${card.suit.color}">
                <div class="card-corner top-left">
                  <span>${card.rank.short}</span>
                  <span class="card-suit-mini">${card.suit.symbol}</span>
                </div>
                <div class="card-center">
                  <span>${card.suit.symbol}</span>
                </div>
              </div>
            `;
          } else {
            const equippedDeck = shop.getEquipped('deck') || 'deck-gold';
            cardsHtml += `
              <div class="poker-card mini card-back ${equippedDeck}">
                <div class="card-back-pattern">♠</div>
              </div>
            `;
          }
        });
      }
      cardsHtml += '</div>';

      // 4. Efeito Especial "WIN" Dourado
      const winEffectHtml = isWinner ? `
        <div class="seat-win-burst">
          <div class="win-ring-glow"></div>
          <div class="win-title-badge">WIN</div>
        </div>
      ` : '';

      // Imagem fotorrealista do avatar
      const avatarSrc = player.avatarImg || 'assets/images/player.jpg';

      seatDiv.innerHTML = `
        ${dealerBadge}
        ${actionBadge}
        ${winEffectHtml}
        
        <div class="avatar-wrapper">
          <div class="avatar-circle-frame">
            <img src="${avatarSrc}" alt="${player.name}" class="avatar-photo-img" />
          </div>
          
          <!-- Badge de Nível (Lv) -->
          <div class="player-level-badge">Lv.${player.level || 1}</div>
          
          <!-- Bandeira do País -->
          <div class="player-flag-badge">${player.country || '🇧🇷'}</div>

          <!-- Timer circular neon se for a vez -->
          ${isTurn ? '<div class="neon-timer-ring"></div>' : ''}
        </div>

        <div class="player-info-card">
          <div class="player-name">${player.name}</div>
          <div class="player-chips">R$ ${player.chips.toLocaleString('pt-BR')}</div>
        </div>

        ${cardsHtml}
      `;

      this.seatsContainer.appendChild(seatDiv);
    });

    this.updateHumanHandStrength(players[0], communityCards);
  }

  updateHumanHandStrength(humanPlayer, communityCards) {
    if (!this.playerHandRankBadge || !humanPlayer || humanPlayer.folded || humanPlayer.cards.length < 2) {
      if (this.playerHandRankBadge) this.playerHandRankBadge.classList.add('hidden');
      return;
    }

    const fullCards = [...humanPlayer.cards, ...communityCards];
    if (fullCards.length >= 2) {
      const evalResult = HandEvaluator.evaluate(fullCards);
      this.playerHandRankBadge.innerHTML = `
        <span class="rank-label">Sua Combinação:</span>
        <span class="rank-name">${evalResult.description || evalResult.name}</span>
      `;
      this.playerHandRankBadge.classList.remove('hidden');
    }
  }
}
