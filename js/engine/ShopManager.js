/**
 * ShopManager.js - Gestão da Loja VIP de Cosméticos, Inventário e Itens Equipados
 */

import { campaign } from './CampaignManager.js';

export class ShopManager {
  static STORAGE_KEY = 'vip_poker_shop_inventory_v1';

  constructor() {
    this.catalog = {
      felts: [
        { id: 'felt-emerald', name: 'Verde Esmeralda Clássico', price: 0, previewColor: '#1b6338', desc: 'O feltro clássico dos maiores cassinos de Las Vegas.' },
        { id: 'felt-royal-blue', name: 'Azul Safira Noturno', price: 0, previewColor: '#1a3e6d', desc: 'Elegância e foco para torneios profissionais.' },
        { id: 'felt-crimson', name: 'Vermelho Carmesim Real', price: 0, previewColor: '#881313', desc: 'A atmosfera nobre dos salões privados de Mônaco.' },
        { id: 'felt-obsidian', name: 'Preto Ônix High-Roller', price: 0, previewColor: '#282c37', desc: 'Visual escuro moderno para mesas de altíssimo calibre.' },
        { id: 'felt-purple', name: 'Roxo Imperial VIP', price: 25000, previewColor: '#4a154b', desc: 'Feltro de veludo roxo exclusivo para magnatas.' },
        { id: 'felt-marble', name: 'Mármore Branco & Ouro', price: 100000, previewColor: '#b89d6c', desc: 'Acabamento refinado de mármore de Carrara com detalhes em ouro.' },
        { id: 'felt-neon', name: 'Cyberpunk Neon Matrix', price: 250000, previewColor: '#06b6d4', desc: 'Iluminação futurista de neon ciano para mesas cibernéticas.' }
      ],
      decks: [
        { id: 'deck-gold', name: 'Dourado Clássico VIP', price: 0, icon: '♠', desc: 'Verso tradicional com arabescos dourados.' },
        { id: 'deck-dragon', name: 'Dragão de Macau', price: 15000, icon: '🐉', desc: 'Inspirado nos salões VIP dos cassinos asiáticos.' },
        { id: 'deck-carbon', name: 'Fibra de Carbono High-Tech', price: 50000, icon: '🏁', desc: 'Textura acetinada em fibra de carbono 3K.' },
        { id: 'deck-diamond', name: 'Mônaco Royal Diamond', price: 15000, icon: '💎', desc: 'Incrustado com brilho de diamante lapidado.' },
        { id: 'deck-matrix', name: 'Cyber Holographic', price: 300000, icon: '⚡', desc: 'Efeito holográfico cintilante de alta performance.' }
      ],
      environments: [
        { id: 'env-classic', name: 'Cassino Noturno Clássico', price: 0, icon: '🎰', desc: 'Ambiente intimista de cassino com luz suave.' },
        { id: 'env-penthouse', name: 'Penthouse Copacabana', price: 50000, icon: '🌆', desc: 'Vista panorâmica do litoral carioca iluminado.' },
        { id: 'env-monaco', name: 'Salão Privé Riviera', price: 200000, icon: '🛥️', desc: 'Ambiente suntuoso com vista para a marina de Mônaco.' },
        { id: 'env-dubai', name: 'Suíte Presidencial Dubai', price: 500000, icon: '✨', desc: 'O ápice do luxo no 80º andar do Burj Al-Arab.' }
      ]
    };

    this.data = this.loadData();
  }

  loadData() {
    const saved = localStorage.getItem(ShopManager.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar dados da loja:', e);
      }
    }

    return {
      ownedItems: ['felt-emerald', 'felt-royal-blue', 'felt-crimson', 'felt-obsidian', 'deck-gold', 'env-classic'],
      equipped: {
        felt: 'felt-emerald',
        deck: 'deck-gold',
        env: 'env-classic'
      }
    };
  }

  saveData() {
    localStorage.setItem(ShopManager.STORAGE_KEY, JSON.stringify(this.data));
  }

  isOwned(itemId) {
    return this.data.ownedItems.includes(itemId);
  }

  isEquipped(category, itemId) {
    return this.data.equipped[category] === itemId;
  }

  buyItem(category, itemId) {
    if (this.isOwned(itemId)) return { success: false, msg: 'Você já possui este item!' };

    const item = this.catalog[category]?.find(i => i.id === itemId);
    if (!item) return { success: false, msg: 'Item não encontrado.' };

    if (campaign.data.bankroll < item.price) {
      return { success: false, msg: `Saldo insuficiente! Você precisa de R$ ${item.price.toLocaleString('pt-BR')}.` };
    }

    // Deduz saldo
    campaign.data.bankroll -= item.price;
    campaign.saveData();

    // Adiciona ao inventário e equipa automaticamente
    this.data.ownedItems.push(itemId);
    this.data.equipped[category.replace(/s$/, '')] = itemId;
    this.saveData();

    return { success: true, msg: `🎉 Parabéns! Você adquiriu "${item.name}"!` };
  }

  equipItem(category, itemId) {
    if (!this.isOwned(itemId)) return { success: false, msg: 'Você precisa comprar este item primeiro.' };

    const catKey = category.replace(/s$/, '');
    this.data.equipped[catKey] = itemId;
    this.saveData();

    return { success: true, msg: `"${itemId}" equipado com sucesso!` };
  }

  getEquipped(category) {
    const catKey = category.replace(/s$/, '');
    return this.data.equipped[catKey] || null;
  }

  unlockAllAdmin() {
    const allFelts = this.catalog.felts.map(i => i.id);
    const allDecks = this.catalog.decks.map(i => i.id);
    const allEnvs = this.catalog.environments.map(i => i.id);
    this.data.ownedItems = [...new Set([...this.data.ownedItems, ...allFelts, ...allDecks, ...allEnvs])];
    this.saveData();
    return true;
  }
}

export const shop = new ShopManager();
