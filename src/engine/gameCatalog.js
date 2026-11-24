// ==========================================================
// CATÁLOGO OFICIAL DE CARTAS: CRÔNICAS DA ALIANÇA ARCANA
// Blefe, Heróis & Caça a Monstros (Taverna Caótica)
// 6 Classes, Líderes de Grupo, Heróis 2d6, Monstros e Magias
// ==========================================================

export const CLASSES = {
  fighter: {
    id: 'fighter',
    name: 'Guerreiro',
    color: '#EF4444',
    icon: '⚔️',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    description: 'Especialistas em combate bruto e ataque a monstros.',
  },
  wizard: {
    id: 'wizard',
    name: 'Mago',
    color: '#8B5CF6',
    icon: '🔮',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Manipuladores de feitiços arcanos e compra acelerada de cartas.',
  },
  thief: {
    id: 'thief',
    name: 'Ladino',
    color: '#3B82F6',
    icon: '🗡️',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Mestres da extorsão, roubo de cartas e punição de rivais.',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardião',
    color: '#F59E0B',
    icon: '🛡️',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Escudo inabalável contra magias inimigas e ressurreição.',
  },
  ranger: {
    id: 'ranger',
    name: 'Patrulheiro',
    color: '#10B981',
    icon: '🏹',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Rastreadores que facilitam os requisitos dos monstros e bônus de tiro.',
  },
  bard: {
    id: 'bard',
    name: 'Bardo',
    color: '#EC4899',
    icon: '🎵',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    description: 'Inspiradores da Party que elevam as rolagens de dados de todos.',
  },
};

// 1. LÍDERES DE GRUPO (1 por classe, selecionáveis antes da partida com passivas reais)
export const PARTY_LEADERS = [
  {
    id: 'leader_fighter',
    name: 'Valquíria Carmesim',
    heroClass: 'fighter',
    title: 'Líder dos Guerreiros',
    passiveDescription: '+1 permanente em todas as rolagens de ataque contra Monstros.',
    avatar: '⚔️',
    color: '#EF4444',
  },
  {
    id: 'leader_wizard',
    name: 'Arquimago Elminster',
    heroClass: 'wizard',
    title: 'Líder dos Magos',
    passiveDescription: '+1 permanente ao rolar dados para ativar Habilidades de Heróis ou Magias.',
    avatar: '🔮',
    color: '#8B5CF6',
  },
  {
    id: 'leader_thief',
    name: 'Sombra de Velka',
    heroClass: 'thief',
    title: 'Líder dos Ladinos',
    passiveDescription: 'Ao baixar uma carta em Modo Blefe sem ser contestado por "MENTIRA!", compre 1 carta grátis.',
    avatar: '🗡️',
    color: '#3B82F6',
  },
  {
    id: 'leader_guardian',
    name: 'Baluarte de Ferro',
    heroClass: 'guardian',
    title: 'Líder dos Guardiões',
    passiveDescription: 'Suas cartas na Party são imunes a destruição ou sacrifício por penalidades de Monstros.',
    avatar: '🛡️',
    color: '#F59E0B',
  },
  {
    id: 'leader_ranger',
    name: 'Rastreadora Silvestre',
    heroClass: 'ranger',
    title: 'Líder dos Patrulheiros',
    passiveDescription: 'Ao abater com sucesso qualquer Monstro no Covil, ganhe +1 PA imediato no mesmo turno.',
    avatar: '🏹',
    color: '#10B981',
  },
  {
    id: 'leader_bard',
    name: 'Menestrel Dourado',
    heroClass: 'bard',
    title: 'Líder dos Bardos',
    passiveDescription: 'Começa a partida com 6 cartas na mão (em vez de 5) e tem +1 em rolagens de Desafio/Blefe.',
    avatar: '🎵',
    color: '#EC4899',
  },
];

// 2. HERÓIS DA PARTY (24 Heróis - 4 por classe)
export const HEROES_CATALOG = [
  // GUERREIROS
  {
    id: 'hero_f1',
    name: 'Capitão de Armas',
    type: 'hero',
    heroClass: 'fighter',
    rollTarget: 7,
    abilityName: 'Golpe Demolidor',
    abilityDescription: '7+: Destrua 1 Herói à sua escolha da Party de um rival.',
    icon: '⚔️',
  },
  {
    id: 'hero_f2',
    name: 'Gladiador Sangrento',
    type: 'hero',
    heroClass: 'fighter',
    rollTarget: 8,
    abilityName: 'Fúria da Arena',
    abilityDescription: '8+: Rola 2d6 com +2 no seu próximo Ataque a Monstro neste turno.',
    icon: '🩸',
  },
  {
    id: 'hero_f3',
    name: 'Berserker Frenético',
    type: 'hero',
    heroClass: 'fighter',
    rollTarget: 6,
    abilityName: 'Intimidação Brutal',
    abilityDescription: '6+: Todos os rivais devem descartar 1 carta da mão.',
    icon: '🪓',
  },
  {
    id: 'hero_f4',
    name: 'Cavaleiro do Dragão',
    type: 'hero',
    heroClass: 'fighter',
    rollTarget: 9,
    abilityName: 'Investida Dracônica',
    abilityDescription: '9+: Ganhe +3 bônus na sua próxima rolagem de dados neste turno.',
    icon: '🐲',
  },

  // MAGOS
  {
    id: 'hero_w1',
    name: 'Invocador de Faíscas',
    type: 'hero',
    heroClass: 'wizard',
    rollTarget: 7,
    abilityName: 'Centelha Mística',
    abilityDescription: '7+: Compre 2 cartas do baralho imediatamente.',
    icon: '⚡',
  },
  {
    id: 'hero_w2',
    name: 'Feiticeiro do Vórtice',
    type: 'hero',
    heroClass: 'wizard',
    rollTarget: 8,
    abilityName: 'Translocação Arcana',
    abilityDescription: '8+: Roube 1 carta de um rival e compre 1 do baralho.',
    icon: '🌀',
  },
  {
    id: 'hero_w3',
    name: 'Alquimista Astral',
    type: 'hero',
    heroClass: 'wizard',
    rollTarget: 6,
    abilityName: 'Destilação de Alma',
    abilityDescription: '6+: Resgate 1 carta da pilha de descarte para sua mão.',
    icon: '🧪',
  },
  {
    id: 'hero_w4',
    name: 'Arquivista Místico',
    type: 'hero',
    heroClass: 'wizard',
    rollTarget: 9,
    abilityName: 'Canalizar Éter',
    abilityDescription: '9+: Ganhe +1 Ponto de Ação (PA) extra neste turno.',
    icon: '📜',
  },

  // LADINOS
  {
    id: 'hero_t1',
    name: 'Batedor de Carteiras',
    type: 'hero',
    heroClass: 'thief',
    rollTarget: 6,
    abilityName: 'Punga Veloz',
    abilityDescription: '6+: Roube 1 carta aleatória da mão de um rival.',
    icon: '💰',
  },
  {
    id: 'hero_t2',
    name: 'Assassino das Sombras',
    type: 'hero',
    heroClass: 'thief',
    rollTarget: 8,
    abilityName: 'Golpe Traiçoeiro',
    abilityDescription: '8+: Force um rival a sacrificar 1 Herói dele.',
    icon: '🗡️',
  },
  {
    id: 'hero_t3',
    name: 'Espião dos Becos',
    type: 'hero',
    heroClass: 'thief',
    rollTarget: 7,
    abilityName: 'Espionagem',
    abilityDescription: '7+: Olhe a mão de um rival e roube 1 carta à sua escolha.',
    icon: '👁️',
  },
  {
    id: 'hero_t4',
    name: 'Gatuno de Relíquias',
    type: 'hero',
    heroClass: 'thief',
    rollTarget: 9,
    abilityName: 'Furto de Artefato',
    abilityDescription: '9+: Roube 1 Item equipado de qualquer rival para sua Party.',
    icon: '🗝️',
  },

  // GUARDIÕES
  {
    id: 'hero_g1',
    name: 'Paladino da Luz',
    type: 'hero',
    heroClass: 'guardian',
    rollTarget: 7,
    abilityName: 'Escudo Sagrado',
    abilityDescription: '7+: Seus Heróis não podem ser destruídos ou roubados até sua próxima vez.',
    icon: '🛡️',
  },
  {
    id: 'hero_g2',
    name: 'Sentinela de Pedra',
    type: 'hero',
    heroClass: 'guardian',
    rollTarget: 6,
    abilityName: 'Baluarte Fiel',
    abilityDescription: '6+: Compre 1 carta (se tiver menos cartas que o rival líder, compre 2).',
    icon: '🗿',
  },
  {
    id: 'hero_g3',
    name: 'Clérigo Protetor',
    type: 'hero',
    heroClass: 'guardian',
    rollTarget: 8,
    abilityName: 'Ressurreição',
    abilityDescription: '8+: Devolva 1 Herói do descarte diretamente para a sua Party.',
    icon: '✨',
  },
  {
    id: 'hero_g4',
    name: 'Guarda do Santuário',
    type: 'hero',
    heroClass: 'guardian',
    rollTarget: 9,
    abilityName: 'Imunidade Divina',
    abilityDescription: '9+: Compre 2 cartas e anule a próxima tentativa de ataque de monstros dos rivais.',
    icon: '⛪',
  },

  // PATRULHEIROS
  {
    id: 'hero_r1',
    name: 'Atirador de Elite',
    type: 'hero',
    heroClass: 'ranger',
    rollTarget: 7,
    abilityName: 'Disparo Preciso',
    abilityDescription: '7+: Adicione +2 ao ataque de qualquer Monstro neste turno.',
    icon: '🎯',
  },
  {
    id: 'hero_r2',
    name: 'Mestre das Feras',
    type: 'hero',
    heroClass: 'ranger',
    rollTarget: 8,
    abilityName: 'Companheiro Animal',
    abilityDescription: '8+: Compre 1 carta e baixe 1 Herói da mão sem gastar PA extra.',
    icon: '🐺',
  },
  {
    id: 'hero_r3',
    name: 'Caçador Noturno',
    type: 'hero',
    heroClass: 'ranger',
    rollTarget: 6,
    abilityName: 'Rastrear Covil',
    abilityDescription: '6+: Troque 1 Monstro do Covil pelo topo do baralho de monstros.',
    icon: '🏹',
  },
  {
    id: 'hero_r4',
    name: 'Ranger Vento-Leste',
    type: 'hero',
    heroClass: 'ranger',
    rollTarget: 9,
    abilityName: 'Chuva de Flechas',
    abilityDescription: '9+: Compre 3 cartas ou force um rival a descartar 2 cartas.',
    icon: '🍃',
  },

  // BARDOS
  {
    id: 'hero_b1',
    name: 'Trovador Errante',
    type: 'hero',
    heroClass: 'bard',
    rollTarget: 6,
    abilityName: 'Melodia Heroica',
    abilityDescription: '6+: Concede +1 em todas as rolagens de 2d6 da sua Party neste turno.',
    icon: '🪕',
  },
  {
    id: 'hero_b2',
    name: 'Encantadora de Taberna',
    type: 'hero',
    heroClass: 'bard',
    rollTarget: 7,
    abilityName: 'Hipnose Lírica',
    abilityDescription: '7+: Pegue 1 Herói de um rival emprestado para sua Party até o fim do turno.',
    icon: '💃',
  },
  {
    id: 'hero_b3',
    name: 'Poeta Ilusionista',
    type: 'hero',
    heroClass: 'bard',
    rollTarget: 8,
    abilityName: 'Metamorfose Sonora',
    abilityDescription: '8+: Altere a classe declarada de qualquer Herói seu blefado na mesa.',
    icon: '🎭',
  },
  {
    id: 'hero_b4',
    name: 'Violinista Mágico',
    type: 'hero',
    heroClass: 'bard',
    rollTarget: 9,
    abilityName: 'Sinfonia da Discórdia',
    abilityDescription: '9+: Cada oponente na mesa deve entregar 1 carta da mão a você.',
    icon: '🎻',
  },
];

// 3. MONSTROS ÉPICOS DO COVIL (10 Monstros)
export const MONSTERS_CATALOG = [
  {
    id: 'monster_1',
    name: 'Hidra de Cristal',
    title: 'Terror Prismatico',
    requiredClasses: ['fighter', 'wizard'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: +1 em todas as rolagens de Guerreiros e Magos da sua Party.',
    penaltyDescription: 'Falha (5-): Descarte 2 cartas da mão.',
    icon: '🐉',
  },
  {
    id: 'monster_2',
    name: 'Dragão Esqueleto',
    title: 'Soberano das Catacumbas',
    requiredClasses: ['fighter', 'ranger'],
    rollTarget: 9,
    failThreshold: 6,
    rewardDescription: 'Permanente: Você pode Atacar Monstros gastando apenas 1 PA em vez de 2.',
    penaltyDescription: 'Falha (6-): Sacrifique 1 Herói da sua Party.',
    icon: '💀',
  },
  {
    id: 'monster_3',
    name: 'Golem de Obsidiana',
    title: 'Colosso Inquebrável',
    requiredClasses: ['guardian', 'fighter'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: Seus Heróis na mesa ficam imunes a sacrifícios forçados por oponentes.',
    penaltyDescription: 'Falha (5-): Perca 1 Ponto de Ação (PA) no seu próximo turno.',
    icon: '🗿',
  },
  {
    id: 'monster_4',
    name: 'Quimera Arcana',
    title: 'Besta Mutante',
    requiredClasses: ['wizard', 'thief'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: Compre 1 carta extra automaticamente no início do seu turno.',
    penaltyDescription: 'Falha (5-): Descarte 2 cartas da mão.',
    icon: '🦁',
  },
  {
    id: 'monster_5',
    name: 'Rei Lich',
    title: 'Senhor do Trono Sombrio',
    requiredClasses: ['wizard', 'guardian', 'fighter'],
    rollTarget: 10,
    failThreshold: 6,
    rewardDescription: 'Permanente: A cada turno, ressuscite 1 Herói do descarte para sua mão gratuitamente.',
    penaltyDescription: 'Falha (6-): Sacrifique 2 Heróis da sua Party.',
    icon: '👑',
  },
  {
    id: 'monster_6',
    name: 'Kraken das Profundezas',
    title: 'Monstro Abissal',
    requiredClasses: ['ranger', 'thief'],
    rollTarget: 9,
    failThreshold: 6,
    rewardDescription: 'Permanente: No início do seu turno, roube 1 carta aleatória do rival líder em monstros.',
    penaltyDescription: 'Falha (6-): Sacrifique 1 Herói da sua Party.',
    icon: '🐙',
  },
  {
    id: 'monster_7',
    name: 'Basilisco de Jade',
    title: 'Olhar Petrificante',
    requiredClasses: ['ranger', 'guardian'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: +2 permanente em todas as rolagens para Ativar Habilidades de Heróis.',
    penaltyDescription: 'Falha (5-): Descarte 2 cartas da mão.',
    icon: '🐍',
  },
  {
    id: 'monster_8',
    name: 'Fênix Corrompida',
    title: 'Chama Eterna das Trevas',
    requiredClasses: ['bard', 'wizard'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: Sempre que um Herói seu for destruído, ele retorna à sua mão em vez do descarte.',
    penaltyDescription: 'Falha (5-): Descarte toda a sua mão.',
    icon: '🔥',
  },
  {
    id: 'monster_9',
    name: 'Titã da Tempestade',
    title: 'Deus dos Raios',
    requiredClasses: ['fighter', 'bard', 'ranger'],
    rollTarget: 10,
    failThreshold: 6,
    rewardDescription: 'Permanente: Você ganha +1 PA fixo em todos os turnos (total de 4 PA por turno!).',
    penaltyDescription: 'Falha (6-): Sacrifique 2 Heróis da sua Party.',
    icon: '⚡',
  },
  {
    id: 'monster_10',
    name: 'Devorador de Almas',
    title: 'Pesadelo Espectral',
    requiredClasses: ['thief', 'bard'],
    rollTarget: 8,
    failThreshold: 5,
    rewardDescription: 'Permanente: Ao blefar com sucesso sem ser contestado, compre 2 cartas do baralho.',
    penaltyDescription: 'Falha (5-): Sacrifique 1 Herói da sua Party.',
    icon: '👻',
  },
];

// 4. MAGIAS, ITENS E MODIFICADORES DE DADOS (14 Cartas)
export const UTILITY_CATALOG = [
  // MAGIAS
  {
    id: 'spell_1',
    name: 'Raio Arcano',
    type: 'spell',
    description: 'Destrua imediatamente 1 Herói de qualquer oponente na mesa.',
    icon: '⚡',
    color: '#06B6D4',
  },
  {
    id: 'spell_2',
    name: 'Pilhagem das Sombras',
    type: 'spell',
    description: 'Roube 2 cartas aleatórias da mão de um rival à sua escolha.',
    icon: '🖐️',
    color: '#06B6D4',
  },
  {
    id: 'spell_3',
    name: 'Poção da Fortuna',
    type: 'spell',
    description: 'Compre 3 cartas do topo do baralho imediatamente.',
    icon: '🧪',
    color: '#06B6D4',
  },
  {
    id: 'spell_4',
    name: 'Vórtice do Caos',
    type: 'spell',
    description: 'Todos os rivais descartam 1 carta da mão e você compra 2.',
    icon: '🌀',
    color: '#06B6D4',
  },

  // ITENS EQUIPÁVEIS
  {
    id: 'item_1',
    name: 'Espada Vorpal',
    type: 'item',
    bonus: 2,
    description: 'Equipa a 1 Herói: concede +2 bônus permanente em todas as rolagens dele.',
    icon: '🗡️',
    color: '#94A3B8',
  },
  {
    id: 'item_2',
    name: 'Escudo Rúnico',
    type: 'item',
    bonus: 1,
    description: 'Equipa a 1 Herói: concede +1 permanente e o Herói não pode ser destruído por rivais.',
    icon: '🛡️',
    color: '#94A3B8',
  },
  {
    id: 'item_3',
    name: 'Manto da Furtividade',
    type: 'item',
    bonus: 2,
    description: 'Equipa a 1 Herói: concede +2 em rolagens (+1 se não for Ladino/Patrulheiro).',
    icon: '🧥',
    color: '#94A3B8',
  },
  {
    id: 'item_4',
    name: 'Alaúde Encantado',
    type: 'item',
    bonus: 2,
    description: 'Equipa a 1 Herói: se for Bardo concede +2 e +1 para toda a sua Party.',
    icon: '🪕',
    color: '#94A3B8',
  },

  // MODIFICADORES DE DADOS (Podem ser jogados da mão durante rolagens de 2d6)
  {
    id: 'mod_1',
    name: 'Golpe de Sorte',
    type: 'modifier',
    bonus: 2,
    description: 'Adicione +2 ou subtraia -2 em qualquer rolagem de 2d6 na mesa.',
    icon: '🎲',
    color: '#F43F5E',
  },
  {
    id: 'mod_2',
    name: 'Intervenção Divina',
    type: 'modifier',
    bonus: 3,
    description: 'Adicione +3 na rolagem de 2d6 ativa na mesa.',
    icon: '✨',
    color: '#F43F5E',
  },
  {
    id: 'mod_3',
    name: 'Maldição Abissal',
    type: 'modifier',
    bonus: -3,
    description: 'Subtraia -3 da rolagem de 2d6 de um adversário.',
    icon: '💀',
    color: '#F43F5E',
  },
  {
    id: 'mod_4',
    name: 'Fúria Crítica',
    type: 'modifier',
    bonus: 4,
    description: 'Adicione +4 na rolagem de 2d6 ativa na mesa.',
    icon: '💥',
    color: '#F43F5E',
  },
  {
    id: 'mod_5',
    name: 'Azar Nefasto',
    type: 'modifier',
    bonus: -4,
    description: 'Subtraia -4 da rolagem de 2d6 de um adversário prestes a vencer!',
    icon: '🌪️',
    color: '#F43F5E',
  },
  {
    id: 'mod_6',
    name: 'Reviravolta Mágica',
    type: 'modifier',
    bonus: 2,
    description: 'Altere a rolagem de 2d6 ativa em +2 ou -2.',
    icon: '🎭',
    color: '#F43F5E',
  },
];

// Montador de Baralho Principal (Main Deck)
export const buildFullMainDeck = () => {
  const deck = [];

  // 2 cópias de cada Herói (48 cartas)
  HEROES_CATALOG.forEach((hero) => {
    deck.push({ ...hero, instanceId: `${hero.id}_1` });
    deck.push({ ...hero, instanceId: `${hero.id}_2` });
  });

  // 2 cópias de cada Magia, Item e Modificador (28 cartas)
  UTILITY_CATALOG.forEach((card) => {
    deck.push({ ...card, instanceId: `${card.id}_1` });
    deck.push({ ...card, instanceId: `${card.id}_2` });
  });

  return shuffle(deck);
};

// Montador de Baralho de Monstros
export const buildMonsterDeck = () => {
  return shuffle([...MONSTERS_CATALOG]);
};

// Utilitário de Embaralhamento (Fisher-Yates)
export const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Busca qualquer carta por ID
export const getCardById = (id) => {
  return (
    HEROES_CATALOG.find((h) => h.id === id) ||
    UTILITY_CATALOG.find((u) => u.id === id) ||
    MONSTERS_CATALOG.find((m) => m.id === id) ||
    PARTY_LEADERS.find((l) => l.id === id) ||
    null
  );
};
