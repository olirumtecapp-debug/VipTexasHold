/**
 * SaveManager.js - Gestão de salvamento e recuperação do estado da partida no localStorage
 */

export class SaveManager {
  static STORAGE_KEY = 'vip_poker_saved_match_v1';

  /**
   * Salva o estado completo da partida atual
   * @param {GameEngine} engine - Instância ativa do motor de jogo
   * @param {Object} extraConfig - Configurações adicionais (feltro, capítulo de campanha)
   */
  static saveMatch(engine, extraConfig = {}) {
    if (!engine) return false;

    try {
      const matchState = {
        timestamp: Date.now(),
        handCount: engine.handCount,
        state: engine.state,
        dealerIndex: engine.dealerIndex,
        currentTurnIndex: engine.currentTurnIndex,
        minRaise: engine.minRaise,
        smallBlind: engine.smallBlind,
        bigBlind: engine.bigBlind,
        buyIn: engine.buyIn,
        chapterId: engine.chapterId,
        feltEnv: extraConfig.feltEnv || 'felt-emerald',
        communityCards: engine.communityCards.map(c => ({
          rank: c.rank,
          suit: c.suit,
          id: c.id
        })),
        potTotal: engine.potManager.getTotalPot(),
        players: engine.players.map(p => ({
          id: p.id,
          name: p.name,
          avatarImg: p.avatarImg,
          country: p.country,
          level: p.level,
          isHuman: p.isHuman,
          chips: p.chips,
          folded: p.folded,
          isAllIn: p.isAllIn,
          cards: p.cards.map(c => ({
            rank: c.rank,
            suit: c.suit,
            id: c.id
          }))
        }))
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(matchState));
      return true;
    } catch (e) {
      console.error('Erro ao salvar partida:', e);
      return false;
    }
  }

  /**
   * Verifica se existe uma partida salva válida
   */
  static hasSavedMatch() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      return parsed && parsed.players && parsed.players.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Retorna os dados da partida salva
   */
  static getSavedMatch() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Remove a partida salva após finalização ou reinício
   */
  static clearSavedMatch() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
