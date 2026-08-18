/**
 * EmojiManager.js - Gestão de reações visuais com emojis animados e flutuantes sobre os assentos
 */

export const EMOJIS = [
  { id: 'fire', symbol: '🔥', label: 'Em Chamas' },
  { id: 'shock', symbol: '😱', label: 'Chocado' },
  { id: 'laugh', symbol: '🤣', label: 'Rindo' },
  { id: 'smirk', symbol: '😏', label: 'Confiante' },
  { id: 'angry', symbol: '🤬', label: 'Bravo' },
  { id: 'cool', symbol: '🕶️', label: 'Tranquilo' },
  { id: 'money', symbol: '🤑', label: 'Ganancioso' },
  { id: 'clover', symbol: '🍀', label: 'Sorte' }
];

export class EmojiManager {
  constructor(engine) {
    this.engine = engine;
    this.container = document.getElementById('floating-emojis-layer');
    this.emojiPicker = document.getElementById('emoji-picker-popup');
    this.btnTogglePicker = document.getElementById('btn-toggle-emoji');

    this.init();
  }

  init() {
    if (this.btnTogglePicker && this.emojiPicker) {
      this.btnTogglePicker.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emojiPicker.classList.toggle('hidden');
      });

      // Fechar ao clicar fora
      document.addEventListener('click', (e) => {
        if (!this.emojiPicker.contains(e.target) && e.target !== this.btnTogglePicker) {
          this.emojiPicker.classList.add('hidden');
        }
      });

      // Popular picker de emojis
      this.emojiPicker.innerHTML = '';
      EMOJIS.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'emoji-select-btn';
        btn.innerHTML = `<span class="emoji-symbol">${item.symbol}</span>`;
        btn.title = item.label;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.triggerEmoji(0, item.symbol);
          this.emojiPicker.classList.add('hidden');
        });
        this.emojiPicker.appendChild(btn);
      });
    }
  }

  /**
   * Dispara um emoji animado flutuando sobre o assento do jogador
   * @param {number} seatIndex - Índice do assento (0 = humano, 1..N = bots)
   * @param {string} symbol - Emoji em texto/caractere
   */
  triggerEmoji(seatIndex, symbol) {
    const seatEl = document.getElementById(`seat-${this.engine.players[seatIndex]?.id}`);
    if (!seatEl || !this.container) return;

    const rect = seatEl.getBoundingClientRect();
    const tableRect = document.querySelector('.poker-table-3d')?.getBoundingClientRect() || { left: 0, top: 0 };

    const emojiEl = document.createElement('div');
    emojiEl.className = 'floating-reaction-emoji';
    emojiEl.textContent = symbol;

    // Posicionar relativo ao palco/mesa
    const x = (rect.left + rect.width / 2) - tableRect.left;
    const y = (rect.top - 20) - tableRect.top;

    emojiEl.style.left = `${x}px`;
    emojiEl.style.top = `${y}px`;

    this.container.appendChild(emojiEl);

    setTimeout(() => {
      emojiEl.remove();
    }, 2400);
  }
}
