/**
 * CampaignManager.js - Gestão da progressão de carreira, capítulos do circuito mundial, troféus e saldo VIP
 */

export const CAMPAIGN_CHAPTERS = [
  {
    id: 'rio',
    title: 'Copacabana Club',
    city: 'Rio de Janeiro, Brasil',
    image: 'assets/images/campaign_rio.jpg',
    buyIn: 1000,
    smallBlind: 10,
    bigBlind: 20,
    firstPlacePrize: 5000,
    unlockPrice: 0,
    trophy: '🏆 Troféu Guanabara',
    boss: 'Isabella Rossi',
    description: 'Comece sua jornada no circuito latino em um clube de luxo na orla de Copacabana.',
    unlocked: true,
    completed: false
  },
  {
    id: 'vegas',
    title: 'Mirage High Roller',
    city: 'Las Vegas, EUA',
    image: 'assets/images/campaign_vegas.jpg',
    buyIn: 5000,
    smallBlind: 50,
    bigBlind: 100,
    firstPlacePrize: 25000,
    unlockPrice: 10000,
    trophy: '👑 Bracelete de Ouro de Vegas',
    boss: 'Mark Vance',
    description: 'Enfrente os tubarões da Strip em um dos cassinos mais prestigiados do mundo.',
    unlocked: false,
    completed: false
  },
  {
    id: 'monaco',
    title: 'Salon Privé Riviera',
    city: 'Monte Carlo, Mônaco',
    image: 'assets/images/campaign_monaco.jpg',
    buyIn: 20000,
    smallBlind: 200,
    bigBlind: 400,
    firstPlacePrize: 100000,
    unlockPrice: 40000,
    trophy: '💎 Cálice de Diamante de Mônaco',
    boss: 'Dmitri Volkov',
    description: 'O reduto dos bilionários europeus e lendas do poker de altíssimo nível.',
    unlocked: false,
    completed: false
  },
  {
    id: 'london',
    title: 'Mayfair Royal Club',
    city: 'Londres, Reino Unido',
    image: 'assets/images/campaign_rio.jpg',
    buyIn: 50000,
    smallBlind: 500,
    bigBlind: 1000,
    firstPlacePrize: 250000,
    unlockPrice: 100000,
    trophy: '👑 Cetro Real Britânico',
    boss: 'Lord Harrington',
    description: 'A aristocracia britânica se reúne em um salão exclusivo de cavalheiros em Mayfair.',
    unlocked: false,
    completed: false
  },
  {
    id: 'macau',
    title: 'Dragon VIP Lounge',
    city: 'Macau, Ásia',
    image: 'assets/images/campaign_macau.jpg',
    buyIn: 100000,
    smallBlind: 1000,
    bigBlind: 2000,
    firstPlacePrize: 500000,
    unlockPrice: 200000,
    trophy: '🔱 Coroa dos Mestres Mundiais',
    boss: 'Sophia Chen',
    description: 'O ápice do poker asiático. As maiores apostas do planeta contra a maior estrategista.',
    unlocked: false,
    completed: false
  },
  {
    id: 'tokyo',
    title: 'Shibuya Cyber Lounge',
    city: 'Tóquio, Japão',
    image: 'assets/images/campaign_macau.jpg',
    buyIn: 250000,
    smallBlind: 2500,
    bigBlind: 5000,
    firstPlacePrize: 1250000,
    unlockPrice: 500000,
    trophy: '⚔️ Katana de Ouro de Tóquio',
    boss: 'Kenji Takahashi',
    description: 'Mesas futuristas no topo de Shibuya com tecnologia de ponta e high-rollers lendários.',
    unlocked: false,
    completed: false
  },
  {
    id: 'dubai',
    title: 'Burj Sky Suite',
    city: 'Dubai, Emirados Árabes',
    image: 'assets/images/campaign_monaco.jpg',
    buyIn: 500000,
    smallBlind: 5000,
    bigBlind: 10000,
    firstPlacePrize: 2500000,
    unlockPrice: 1000000,
    trophy: '🦅 Falcão de Platina de Dubai',
    boss: 'Sheikh Mansoor',
    description: 'Partidas com xeiques bilionários e lendas mundiais a 300 metros de altura.',
    unlocked: false,
    completed: false
  },
  {
    id: 'vegas_masters',
    title: 'The Masters Finale',
    city: 'Las Vegas (Finale), EUA',
    image: 'assets/images/campaign_vegas.jpg',
    buyIn: 1000000,
    smallBlind: 10000,
    bigBlind: 20000,
    firstPlacePrize: 5000000,
    unlockPrice: 2000000,
    trophy: '💍 Anel do Campeão Supremo',
    boss: 'The Grandmaster',
    description: 'O evento final televisionado. Os melhores jogadores do mundo na mesa final definitiva.',
    unlocked: false,
    completed: false
  }
];

export class CampaignManager {
  constructor() {
    this.storageKey = 'vip_poker_career_data_v2';
    this.data = this.loadData();
  }

  loadData() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          bankroll: parsed.bankroll ?? 10000,
          level: parsed.level ?? 1,
          xp: parsed.xp ?? 0,
          completedChapters: parsed.completedChapters || [],
          unlockedChapters: parsed.unlockedChapters || ['rio'],
          trophies: parsed.trophies || [],
          handsWon: parsed.handsWon || 0,
          totalHands: parsed.totalHands || 0,
          biggestPot: parsed.biggestPot || 0,
          lastDailySpin: parsed.lastDailySpin || 0
        };
      } catch (e) {
        console.error('Erro ao carregar dados da carreira:', e);
      }
    }

    return {
      bankroll: 10000,
      level: 1,
      xp: 0,
      completedChapters: [],
      unlockedChapters: ['rio'],
      trophies: [],
      handsWon: 0,
      totalHands: 0,
      biggestPot: 0,
      lastDailySpin: 0
    };
  }

  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  getChapters() {
    return CAMPAIGN_CHAPTERS.map(ch => ({
      ...ch,
      unlocked: this.data.unlockedChapters.includes(ch.id),
      completed: this.data.completedChapters.includes(ch.id)
    }));
  }

  unlockAllAdmin() {
    this.data.bankroll += 10000000;
    this.data.level = 60;
    this.data.xp = 60000;
    this.data.unlockedChapters = CAMPAIGN_CHAPTERS.map(ch => ch.id);
    this.data.trophies = CAMPAIGN_CHAPTERS.map(ch => ch.trophy);
    this.saveData();
    return true;
  }

  unlockChapterWithChips(chapterId) {
    if (this.data.unlockedChapters.includes(chapterId)) {
      return { success: false, msg: 'Este torneio já está desbloqueado!' };
    }
    const chapter = CAMPAIGN_CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) {
      return { success: false, msg: 'Torneio não encontrado.' };
    }
    const price = chapter.unlockPrice || (chapter.buyIn * 2);
    if (this.data.bankroll < price) {
      return { success: false, msg: `Saldo insuficiente! Você precisa de R$ ${price.toLocaleString('pt-BR')} em fichas virtuais para desbloquear ${chapter.title}.` };
    }
    this.data.bankroll -= price;
    this.data.unlockedChapters.push(chapterId);
    this.saveData();
    return { success: true, msg: `🎉 Parabéns! O torneio ${chapter.title} (${chapter.city}) foi desbloqueado com sucesso!` };
  }

  completeChapter(chapterId) {
    if (!this.data.completedChapters.includes(chapterId)) {
      this.data.completedChapters.push(chapterId);
    }

    // Unlock next chapter
    const currentIdx = CAMPAIGN_CHAPTERS.findIndex(c => c.id === chapterId);
    if (currentIdx !== -1 && currentIdx + 1 < CAMPAIGN_CHAPTERS.length) {
      const nextCh = CAMPAIGN_CHAPTERS[currentIdx + 1];
      if (!this.data.unlockedChapters.includes(nextCh.id)) {
        this.data.unlockedChapters.push(nextCh.id);
      }
    }

    const currentCh = CAMPAIGN_CHAPTERS.find(c => c.id === chapterId);
    if (currentCh && !this.data.trophies.includes(currentCh.trophy)) {
      this.data.trophies.push(currentCh.trophy);
      this.data.bankroll += currentCh.firstPlacePrize;
    }

    this.addXp(500);
    this.saveData();
  }

  addXp(amount) {
    this.data.xp += amount;
    const requiredXp = this.data.level * 1000;
    if (this.data.xp >= requiredXp) {
      this.data.level++;
      this.data.xp -= requiredXp;
      this.data.bankroll += this.data.level * 1000; // Bônus de subida de nível
    }
    this.saveData();
  }

  recordHandResult(won, potAmount) {
    this.data.totalHands++;
    if (won) {
      this.data.handsWon++;
      if (potAmount > this.data.biggestPot) {
        this.data.biggestPot = potAmount;
      }
      this.addXp(50);
    } else {
      this.addXp(15);
    }
    this.saveData();
  }

  canClaimDaily() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - this.data.lastDailySpin) > twentyFourHours;
  }

  claimDailyReward() {
    const rewardPrizes = [1000, 2500, 5000, 10000, 20000];
    const prize = rewardPrizes[Math.floor(Math.random() * rewardPrizes.length)];
    this.data.bankroll += prize;
    this.data.lastDailySpin = Date.now();
    this.saveData();
    return prize;
  }

  getVipTier() {
    const b = this.data.bankroll;
    if (b >= 250000) return { name: 'VIP Lendário', color: '#ff4081', badge: '🔱' };
    if (b >= 100000) return { name: 'VIP Diamante', color: '#00e5ff', badge: '💎' };
    if (b >= 40000) return { name: 'VIP Platina', color: '#e0e0e0', badge: '👑' };
    if (b >= 15000) return { name: 'VIP Ouro', color: '#ffd700', badge: '⭐' };
    if (b >= 5000) return { name: 'VIP Prata', color: '#b0bec5', badge: '🥈' };
    return { name: 'VIP Bronze', color: '#cd7f32', badge: '🥉' };
  }
}

export const campaign = new CampaignManager();
