-- =====================================================
-- CRÔNICAS DA ALIANÇA ARCANA - SCHEMA & SETUP SUPABASE
-- Baralho de 35 cartas (7 arquétipos x 5 cópias)
-- Sistema de 2 a 5 jogadores com Ranking & Estatísticas
-- =====================================================

-- 0. Extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: card_catalog (35 cartas: 7 cartas x 5 cópias)
CREATE TABLE IF NOT EXISTS card_catalog (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  universe_ref VARCHAR(100) NOT NULL,
  faction_color VARCHAR(20) NOT NULL,
  active_ability_name VARCHAR(100) NOT NULL,
  active_description TEXT NOT NULL,
  block_ability_name VARCHAR(100) NOT NULL,
  block_description TEXT NOT NULL,
  copies_in_deck INT DEFAULT 5
);

-- Popula o catálogo com as 7 cartas lendárias (5 cópias cada = 35 cartas)
INSERT INTO card_catalog (code, name, universe_ref, faction_color, active_ability_name, active_description, block_ability_name, block_description, copies_in_deck)
VALUES
('ARCHMAGE', 'Arquimago Supremo', 'Harry Potter', '#8B5CF6', 'Transfiguração', 'Compra 2 cartas do grimório, escolhe quais manter e devolve 2 ao fundo do baralho.', 'Contrafeitiço', 'Bloqueia o Manto Élfico (Portador do Anel) e a Profecia Arcana (Oráculo).', 5),
('RINGBEARER', 'Portador do Anel', 'O Senhor dos Anéis', '#F59E0B', 'Manto Élfico', 'Rouba até 2 Runas de um adversário à sua escolha.', 'Invisibilidade', 'Bloqueia tentativas de roubo de outro Portador do Anel.', 5),
('DEMIGOD', 'Semideus do Olimpo', 'Percy Jackson', '#06B6D4', 'Fúria Olímpica', 'Paga 3 Runas e desfere um ataque letal: o alvo perde 1 identidade arcana.', 'Barreira Celeste', 'Bloqueia a Ajuda da Guilda coletada por qualquer jogador.', 5),
('DRAGONSLAYER', 'Caçador de Dragões', 'O Hobbit', '#EF4444', 'Pilhagem de Smaug', 'Saqueia o tesouro ancestral de Erebor, recebendo imediatamente +3 Runas.', 'Resistência Dracônica', 'Aura inabalável imune a tributos forçados.', 5),
('RELIC_KEEPER', 'Guardião das Relíquias', 'Harry Potter', '#10B981', 'Voto Perpétuo', 'Recebe +2 Runas puras do santuário arcano (ação sagrada não bloqueável).', 'Escudo das Relíquias', 'Bloqueia o golpe mortal da Fúria Olímpica (Semideus).', 5),
('ORACLE', 'Oráculo de Delfos', 'Percy Jackson', '#EC4899', 'Profecia Arcana', 'Espia secretamente 1 carta oculta de um adversário e ganha +1 Runa de oferenda.', 'Névoa Mística', 'Bloqueia tentativas de espionagem do Oráculo adversário.', 5),
('DARK_LORD', 'Lorde das Sombras', 'Senhor dos Anéis & Harry Potter', '#6366F1', 'Drenagem Sombria', 'Extorque 1 Runa de cada adversário vivo na mesa para o seu poder.', 'Manto das Trevas', 'Bloqueia tentativas de roubo do Portador do Anel e espionagem do Oráculo.', 5)
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  universe_ref = EXCLUDED.universe_ref,
  faction_color = EXCLUDED.faction_color,
  active_ability_name = EXCLUDED.active_ability_name,
  active_description = EXCLUDED.active_description,
  block_ability_name = EXCLUDED.block_ability_name,
  block_description = EXCLUDED.block_description,
  copies_in_deck = EXCLUDED.copies_in_deck;

-- 2. TABELA: rooms (Salas de 2 a 5 jogadores)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  current_turn_player_id UUID,
  turn_phase VARCHAR(30) DEFAULT 'action',
  pending_action JSONB DEFAULT NULL,
  deck JSONB DEFAULT '[]'::jsonb,
  winner_player_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA: players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  avatar_theme VARCHAR(30) DEFAULT 'mago',
  seat_order INT NOT NULL,
  runes INT DEFAULT 2,
  is_alive BOOLEAN DEFAULT TRUE,
  is_host BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA: player_hands
CREATE TABLE IF NOT EXISTS player_hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  card_code VARCHAR(50) REFERENCES card_catalog(code),
  slot_index INT NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA: game_logs
CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  actor_nickname VARCHAR(50),
  event_type VARCHAR(30),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA: player_stats (Ranking, Vitórias, Golpes e Cartas)
CREATE TABLE IF NOT EXISTS player_stats (
  nickname VARCHAR(50) PRIMARY KEY,
  games_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  epic_strikes_dealt INT DEFAULT 0,
  epic_strikes_received INT DEFAULT 0,
  assassinations_dealt INT DEFAULT 0,
  assassinations_received INT DEFAULT 0,
  steals_dealt INT DEFAULT 0,
  steals_received INT DEFAULT 0,
  bluffs_caught INT DEFAULT 0,
  bluffs_exposed INT DEFAULT 0,
  blocks_performed INT DEFAULT 0,
  cards_used JSONB DEFAULT '{}'::jsonb,
  score INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HABILITAR SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_hands;
ALTER PUBLICATION supabase_realtime ADD TABLE game_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE player_stats;

-- 8. DESABILITAR RLS PARA ACESSO ANÔNIMO DIRETO
ALTER TABLE card_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_hands DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;

-- 9. PERMISSÕES PARA AS ROLES anon E authenticated
GRANT ALL ON TABLE card_catalog TO anon, authenticated;
GRANT ALL ON TABLE rooms TO anon, authenticated;
GRANT ALL ON TABLE players TO anon, authenticated;
GRANT ALL ON TABLE player_hands TO anon, authenticated;
GRANT ALL ON TABLE game_logs TO anon, authenticated;
GRANT ALL ON TABLE player_stats TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
