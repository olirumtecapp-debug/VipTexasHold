/**
 * TableRenderer.js - Renderização da mesa de feltro verde, crupiê fotorrealista e cartas comunitárias
 */

export class TableRenderer {
  constructor() {
    this.communityCardsEl = document.getElementById('community-cards');
    this.potDisplayEl = document.getElementById('pot-amount');
    this.winnerBannerEl = document.getElementById('winner-banner');
    this.potChipsContainer = document.getElementById('pot-chips');
  }

  updatePot(amount) {
    if (this.potDisplayEl) {
      this.potDisplayEl.textContent = `Pote Total : R$ ${amount.toLocaleString('pt-BR')}`;
    }
    this.renderPotChips(amount);
  }

  renderPotChips(amount) {
    if (!this.potChipsContainer) return;
    this.potChipsContainer.innerHTML = '';
    if (amount <= 0) return;

    const chipDenoms = [
      { val: 1000, class: 'chip-black' },
      { val: 500, class: 'chip-purple' },
      { val: 100, class: 'chip-blue' },
      { val: 25, class: 'chip-green' },
      { val: 5, class: 'chip-red' }
    ];

    let remaining = amount;
    let chipCount = 0;
    const maxVisibleChips = 14;

    for (const d of chipDenoms) {
      while (remaining >= d.val && chipCount < maxVisibleChips) {
        remaining -= d.val;
        chipCount++;
        const chip = document.createElement('div');
        chip.className = `poker-chip ${d.class}`;
        const offset = (chipCount * -3);
        const rotate = (chipCount % 4) * 15 - 30;
        chip.style.transform = `translateY(${offset}px) rotate(${rotate}deg)`;
        this.potChipsContainer.appendChild(chip);
      }
    }
  }

  renderCommunityCards(cards) {
    if (!this.communityCardsEl) return;
    this.communityCardsEl.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const card = cards[i];
      const slot = document.createElement('div');
      slot.className = 'community-card-slot';

      if (card) {
        const cardEl = this.createCardElement(card, true);
        slot.appendChild(cardEl);
      } else {
        slot.classList.add('empty');
      }

      this.communityCardsEl.appendChild(slot);
    }
  }

  createCardElement(card, animated = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `poker-card gg-style rank-${card.rank.short.toLowerCase()} suit-${card.suit.id.toLowerCase()} ${card.suit.color}`;
    if (animated) cardDiv.classList.add('card-flip-in');

    cardDiv.innerHTML = `
      <div class="card-corner top-left">
        <span class="card-rank">${card.rank.short}</span>
        <span class="card-suit-mini">${card.suit.symbol}</span>
      </div>
      <div class="card-center">
        <span class="card-suit-main">${card.suit.symbol}</span>
      </div>
      <div class="card-corner bottom-right">
        <span class="card-rank">${card.rank.short}</span>
        <span class="card-suit-mini">${card.suit.symbol}</span>
      </div>
    `;
    return cardDiv;
  }

  showWinnerAnnouncement(payouts) {
    if (!this.winnerBannerEl) return;
    const p = payouts[0];
    if (!p) return;

    const desc = p.handInfo ? p.handInfo.description : 'Vitória por Desistência Geral';
    this.winnerBannerEl.innerHTML = `
      <div class="winner-title">👑 VENCEDOR DO POTE 👑</div>
      <div class="winner-player">${p.player.name}</div>
      <div class="winner-hand">${desc}</div>
      <div class="winner-payout">+ R$ ${p.amount.toLocaleString('pt-BR')}</div>
    `;
    this.winnerBannerEl.classList.remove('hidden');
    this.winnerBannerEl.classList.add('banner-visible');

    setTimeout(() => {
      this.winnerBannerEl.classList.remove('banner-visible');
      this.winnerBannerEl.classList.add('hidden');
    }, 4500);
  }
}
