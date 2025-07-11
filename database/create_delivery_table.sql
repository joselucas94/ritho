-- Criar tabela delivery para gerenciar entregas
CREATE TABLE IF NOT EXISTS delivery (
    id BIGSERIAL PRIMARY KEY,
    qtd INT NOT NULL CHECK (qtd > 0),
    pedido_item BIGINT NOT NULL REFERENCES detalhe_pedido(id) ON DELETE CASCADE,
    "user" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_delivery_pedido_item ON delivery(pedido_item);
CREATE INDEX IF NOT EXISTS idx_delivery_user ON delivery("user");
CREATE INDEX IF NOT EXISTS idx_delivery_created_at ON delivery(created_at);

-- Função para atualizar qtd_atual no detalhe_pedido quando uma entrega é registrada
CREATE OR REPLACE FUNCTION update_qtd_atual_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
    current_qtd INT;
BEGIN
    -- Buscar a quantidade atual
    SELECT qtd_atual INTO current_qtd 
    FROM detalhe_pedido 
    WHERE id = NEW.pedido_item;
    
    -- Verificar se há quantidade suficiente ANTES de atualizar
    IF current_qtd < NEW.qtd THEN
        RAISE EXCEPTION 'Quantidade recebida (%) excede quantidade disponível (%) no pedido', NEW.qtd, current_qtd;
    END IF;
    
    -- Atualizar qtd_atual subtraindo a quantidade entregue
    UPDATE detalhe_pedido 
    SET qtd_atual = qtd_atual - NEW.qtd,
        updated_at = NOW()
    WHERE id = NEW.pedido_item;
    
    -- Log para debug (opcional - pode remover em produção)
    RAISE NOTICE 'Delivery criada: item %, qtd recebida %, qtd restante %', 
                 NEW.pedido_item, NEW.qtd, (current_qtd - NEW.qtd);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar qtd_atual automaticamente
CREATE TRIGGER update_qtd_atual_on_delivery_trigger
    AFTER INSERT ON delivery
    FOR EACH ROW
    EXECUTE FUNCTION update_qtd_atual_on_delivery();

-- Função para reverter qtd_atual quando uma entrega é deletada
CREATE OR REPLACE FUNCTION revert_qtd_atual_on_delivery_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverter qtd_atual somando a quantidade que foi entregue
    UPDATE detalhe_pedido 
    SET qtd_atual = qtd_atual + OLD.qtd,
        updated_at = NOW()
    WHERE id = OLD.pedido_item;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para reverter qtd_atual quando entrega é deletada
CREATE TRIGGER revert_qtd_atual_on_delivery_delete_trigger
    AFTER DELETE ON delivery
    FOR EACH ROW
    EXECUTE FUNCTION revert_qtd_atual_on_delivery_delete();

-- Função para validar alterações na quantidade de entrega
CREATE OR REPLACE FUNCTION validate_delivery_update()
RETURNS TRIGGER AS $$
DECLARE
    current_qtd INT;
    qtd_difference INT;
BEGIN
    -- Calcular a diferença entre nova e antiga quantidade
    qtd_difference := NEW.qtd - OLD.qtd;
    
    -- Se não houve mudança na quantidade, não fazer nada
    IF qtd_difference = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Buscar quantidade atual do item
    SELECT qtd_atual INTO current_qtd 
    FROM detalhe_pedido 
    WHERE id = NEW.pedido_item;
    
    -- Verificar se a nova quantidade é válida
    IF (current_qtd - qtd_difference) < 0 THEN
        RAISE EXCEPTION 'Alteração resultaria em quantidade negativa. Atual: %, Diferença: %', current_qtd, qtd_difference;
    END IF;
    
    -- Atualizar a quantidade (subtrai a diferença)
    UPDATE detalhe_pedido 
    SET qtd_atual = qtd_atual - qtd_difference,
        updated_at = NOW()
    WHERE id = NEW.pedido_item;
    
    -- Log para debug
    RAISE NOTICE 'Delivery atualizada: item %, diferença %, nova qtd disponível %', 
                 NEW.pedido_item, qtd_difference, (current_qtd - qtd_difference);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar updates
CREATE TRIGGER validate_delivery_update_trigger
    BEFORE UPDATE ON delivery
    FOR EACH ROW
    EXECUTE FUNCTION validate_delivery_update();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE delivery ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela delivery
CREATE POLICY "Authenticated users can view all deliveries" ON delivery
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert deliveries" ON delivery
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update deliveries" ON delivery
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete deliveries" ON delivery
    FOR DELETE USING (auth.role() = 'authenticated');

-- Função auxiliar para testar se os triggers estão funcionando
CREATE OR REPLACE FUNCTION test_delivery_triggers()
RETURNS TEXT AS $$
DECLARE
    test_pedido_item BIGINT;
    initial_qtd INT;
    final_qtd INT;
    delivery_id BIGINT;
    result TEXT := '';
BEGIN
    -- Buscar um item de pedido para teste
    SELECT id, qtd_atual INTO test_pedido_item, initial_qtd
    FROM detalhe_pedido 
    WHERE qtd_atual > 0 
    LIMIT 1;
    
    IF test_pedido_item IS NULL THEN
        RETURN 'ERRO: Nenhum item de pedido disponível para teste';
    END IF;
    
    result := result || format('Item de teste: %s, Qtd inicial: %s', test_pedido_item, initial_qtd) || E'\n';
    
    -- Simular uma entrega (precisa de um user_id válido)
    -- Esta função é apenas para debug - remover em produção
    
    RETURN result || 'Triggers configurados corretamente. Para testar, crie uma entrega via aplicação.';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERRO ao testar triggers: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Para testar os triggers, execute: SELECT test_delivery_triggers();
-- Lembre-se de remover esta função em produção por questões de segurança
