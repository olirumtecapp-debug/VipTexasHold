/**
 * ChatManager.js - Gestão do bate-papo lateral dos bots, logs do dealer e mensagens do jogador
 */

export class ChatManager {
  constructor(engine) {
    this.engine = engine;
    this.chatMessagesContainer = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.btnSendChat = document.getElementById('btn-send-chat');
    this.chatPanel = document.getElementById('chat-panel');
    this.btnToggleChat = document.getElementById('btn-toggle-chat');

    this.initEventListeners();
  }

  initEventListeners() {
    if (this.btnSendChat && this.chatInput) {
      const sendMessage = () => {
        const text = this.chatInput.value.trim();
        if (text) {
          this.addMessage({
            sender: this.engine.playerName || 'Você',
            avatar: '👑',
            message: text,
            isUser: true
          });
          this.chatInput.value = '';
        }
      };

      this.btnSendChat.addEventListener('click', sendMessage);
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    if (this.btnToggleChat && this.chatPanel) {
      this.btnToggleChat.addEventListener('click', () => {
        this.chatPanel.classList.toggle('chat-collapsed');
      });
    }
  }

  addMessage(data) {
    if (!this.chatMessagesContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${data.isUser ? 'user-msg' : ''} ${data.sender === 'Dealer' || data.sender === 'Sistema' ? 'system-msg' : ''}`;

    msgEl.innerHTML = `
      <span class="chat-avatar">${data.avatar || '💬'}</span>
      <div class="chat-body">
        <span class="chat-author">${data.sender}:</span>
        <span class="chat-text">${data.message}</span>
      </div>
    `;

    this.chatMessagesContainer.appendChild(msgEl);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }
}
