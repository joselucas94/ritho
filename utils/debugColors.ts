import { Alert } from 'react-native';
import { colorsService, colorsShadesService, debugColorsShadesTable, debugColorsTable } from '../lib/supabase';

// Função de diagnóstico completa para o sistema de cores
export const debugColorsComplete = async () => {
  console.log('=== DIAGNÓSTICO COMPLETO DO SISTEMA DE CORES ===');
  
  const results = {
    tabelas: false,
    cores: false,
    tons: false,
    integracao: false
  };
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('1. Verificando existência das tabelas...');
    
    const colorsTableOk = await debugColorsTable();
    const shadesTableOk = await debugColorsShadesTable();
    
    results.tabelas = colorsTableOk && shadesTableOk;
    console.log('✅ Tabelas:', results.tabelas ? 'OK' : 'PROBLEMA');
    
    if (!results.tabelas) {
      console.log('❌ ERRO: Uma ou mais tabelas não existem. Execute o script de setup.');
      Alert.alert(
        'Erro de Configuração',
        'As tabelas de cores não foram encontradas. Execute o script setup_colors_complete.sql no seu banco Supabase.',
        [{ text: 'OK' }]
      );
      return results;
    }
    
    // 2. Testar operações básicas de cores
    console.log('2. Testando operações básicas de cores...');
    
    try {
      // Listar cores existentes
      const existingColors = await colorsService.getAll();
      console.log('Cores existentes:', existingColors);
      
      // Criar cor de teste
      const testColorName = 'Cor Diagnóstico ' + Date.now();
      console.log('Criando cor de teste:', testColorName);
      const testColor = await colorsService.create(testColorName);
      console.log('Cor de teste criada:', testColor);
      
      // Buscar cor criada
      const foundColor = await colorsService.getById(testColor.id);
      console.log('Cor encontrada por ID:', foundColor);
      
      if (foundColor && foundColor.name === testColorName) {
        results.cores = true;
        console.log('✅ Operações de cores: OK');
      } else {
        console.log('❌ Operações de cores: PROBLEMA na busca');
      }
      
      // 3. Testar operações de tons
      console.log('3. Testando operações de tons...');
      
      try {
        // Criar tom de teste
        const testShadeName = 'Tom Diagnóstico ' + Date.now();
        console.log('Criando tom de teste:', testShadeName, 'para cor ID:', testColor.id);
        
        const testShade = await colorsShadesService.create(testColor.id, testShadeName);
        console.log('Tom de teste criado:', testShade);
        
        // Buscar tons da cor
        const colorShades = await colorsShadesService.getByColorId(testColor.id);
        console.log('Tons encontrados para a cor:', colorShades);
        
        if (colorShades.length > 0 && colorShades.some(s => s.name === testShadeName)) {
          results.tons = true;
          console.log('✅ Operações de tons: OK');
        } else {
          console.log('❌ Operações de tons: PROBLEMA na busca');
        }
        
        // 4. Testar integração completa
        console.log('4. Testando integração completa...');
        
        try {
          const colorsWithShades = await colorsService.getAllWithShades();
          console.log('Cores com tons obtidas:', colorsWithShades);
          
          const testColorWithShades = colorsWithShades.find(c => c.id === testColor.id);
          
          if (testColorWithShades && testColorWithShades.shades && testColorWithShades.shades.length > 0) {
            results.integracao = true;
            console.log('✅ Integração completa: OK');
          } else {
            console.log('❌ Integração completa: PROBLEMA');
          }
          
          // Limpar dados de teste
          console.log('5. Limpando dados de teste...');
          await colorsShadesService.delete(testShade.id);
          await colorsService.delete(testColor.id);
          console.log('✅ Dados de teste removidos');
          
        } catch (integrationError) {
          console.error('Erro na integração:', integrationError);
          results.integracao = false;
        }
        
      } catch (shadeError) {
        console.error('Erro nas operações de tons:', shadeError);
        results.tons = false;
        
        // Ainda tentar limpar a cor de teste
        try {
          await colorsService.delete(testColor.id);
        } catch (cleanupError) {
          console.error('Erro ao limpar cor de teste:', cleanupError);
        }
      }
      
    } catch (colorError) {
      console.error('Erro nas operações de cores:', colorError);
      results.cores = false;
    }
    
  } catch (generalError) {
    console.error('Erro geral no diagnóstico:', generalError);
  }
  
  // Relatório final
  console.log('=== RELATÓRIO FINAL DO DIAGNÓSTICO ===');
  console.log('Tabelas:', results.tabelas ? '✅ OK' : '❌ PROBLEMA');
  console.log('Cores:', results.cores ? '✅ OK' : '❌ PROBLEMA');
  console.log('Tons:', results.tons ? '✅ OK' : '❌ PROBLEMA');
  console.log('Integração:', results.integracao ? '✅ OK' : '❌ PROBLEMA');
  
  const allOk = Object.values(results).every(r => r === true);
  
  if (allOk) {
    console.log('🎉 DIAGNÓSTICO: SISTEMA FUNCIONANDO PERFEITAMENTE!');
    Alert.alert(
      'Diagnóstico Completo',
      'Sistema de cores funcionando perfeitamente! ✅\n\n' +
      '• Tabelas: OK\n' +
      '• Cores: OK\n' +
      '• Tons: OK\n' +
      '• Integração: OK',
      [{ text: 'Ótimo!' }]
    );
  } else {
    const problemas = Object.entries(results)
      .filter(([_, ok]) => !ok)
      .map(([area, _]) => area)
      .join(', ');
    
    console.log('❌ DIAGNÓSTICO: PROBLEMAS ENCONTRADOS EM:', problemas);
    Alert.alert(
      'Problemas Encontrados',
      `Problemas detectados em: ${problemas}\n\n` +
      'Verifique o console para detalhes específicos.\n\n' +
      'Possíveis soluções:\n' +
      '1. Execute setup_colors_complete.sql\n' +
      '2. Verifique as políticas RLS\n' +
      '3. Confirme se está autenticado',
      [{ text: 'OK' }]
    );
  }
  
  return results;
};

// Função específica para testar criação de tom
export const testShadeCreation = async (colorId: number, shadeName: string) => {
  console.log('=== TESTE ESPECÍFICO DE CRIAÇÃO DE TOM ===');
  console.log('Parâmetros:', { colorId, shadeName });
  
  try {
    // Verificar se a cor existe
    console.log('Verificando se a cor existe...');
    const color = await colorsService.getById(colorId);
    console.log('Cor encontrada:', color);
    
    if (!color) {
      throw new Error(`Cor com ID ${colorId} não encontrada`);
    }
    
    // Tentar criar o tom
    console.log('Tentando criar tom...');
    const shade = await colorsShadesService.create(colorId, shadeName);
    console.log('Tom criado com sucesso:', shade);
    
    return shade;
    
  } catch (error) {
    console.error('Erro no teste de criação de tom:', error);
    throw error;
  }
};

// Função para verificar configuração do Supabase
export const checkSupabaseConfig = () => {
  console.log('=== VERIFICAÇÃO DA CONFIGURAÇÃO DO SUPABASE ===');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('URL do Supabase:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
  console.log('Chave do Supabase:', supabaseKey ? '✅ Configurada' : '❌ Não configurada');
  
  if (!supabaseUrl || !supabaseKey) {
    Alert.alert(
      'Configuração Incompleta',
      'As variáveis de ambiente do Supabase não estão configuradas.\n\n' +
      'Verifique se EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY estão definidas.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
};
