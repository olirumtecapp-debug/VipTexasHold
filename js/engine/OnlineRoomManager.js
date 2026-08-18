/**
 * OnlineRoomManager.js - Gestão de salas online com código único e sincronização em tempo real
 */

export class OnlineRoomManager {
  constructor(onRoomAction) {
    this.onRoomAction = onRoomAction;
    this.currentRoomCode = null;
    this.channel = null;
    this.isHost = false;
    this.playerId = 'player_' + Math.random().toString(36).substring(2, 8);

    this.checkUrlForRoomCode();
  }

  /**
   * Gera um código de sala VIP de 6 caracteres (ex: VIP-8392)
   */
  static generateRoomCode() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `VIP-${num}`;
  }

  /**
   * Cria uma nova sala online e abre canal de sincronização
   */
  createRoom(customCode = null) {
    const code = customCode || OnlineRoomManager.generateRoomCode();
    this.currentRoomCode = code;
    this.isHost = true;
    this.setupBroadcastChannel(code);
    return code;
  }

  /**
   * Entra em uma sala online existente pelo código
   */
  joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    this.currentRoomCode = cleanCode;
    this.isHost = false;
    this.setupBroadcastChannel(cleanCode);

    // Notificar os outros jogadores na sala que um novo jogador entrou
    this.broadcastMessage({
      type: 'PLAYER_JOINED',
      playerId: this.playerId,
      timestamp: Date.now()
    });

    return true;
  }

  setupBroadcastChannel(roomCode) {
    if (this.channel) {
      this.channel.close();
    }

    try {
      this.channel = new BroadcastChannel(`poker_room_${roomCode}`);
      this.channel.onmessage = (event) => {
        const data = event.data;
        if (data && this.onRoomAction) {
          this.onRoomAction(data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel não disponível neste ambiente:', e);
    }
  }

  broadcastMessage(data) {
    if (this.channel) {
      this.channel.postMessage({
        ...data,
        roomCode: this.currentRoomCode,
        senderId: this.playerId
      });
    }
  }

  getShareableLink() {
    if (!this.currentRoomCode) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.currentRoomCode);
    return url.toString();
  }

  checkUrlForRoomCode() {
    try {
      const url = new URL(window.location.href);
      const roomParam = url.searchParams.get('room');
      if (roomParam) {
        this.currentRoomCode = roomParam.trim().toUpperCase();
      }
    } catch (e) {
      console.warn('Erro ao ler URL params:', e);
    }
  }

  leaveRoom() {
    if (this.channel) {
      this.broadcastMessage({
        type: 'PLAYER_LEFT',
        playerId: this.playerId
      });
      this.channel.close();
      this.channel = null;
    }
    this.currentRoomCode = null;
    this.isHost = false;
  }
}
