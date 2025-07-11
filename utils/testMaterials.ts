import { materiaisService } from '@/lib/supabase';

// Função para testar os serviços de materiais
export async function testMateriaisService() {
  console.log('=== TESTE DOS SERVIÇOS DE MATERIAIS ===');
  
  try {
    // Teste 1: Listar materiais
    console.log('1. Testando listagem de materiais...');
    const materials = await materiaisService.getAll();
    console.log('Materiais encontrados:', materials);
    
    // Teste 2: Verificar se nome existe
    console.log('2. Testando verificação de nome...');
    const nameExists = await materiaisService.checkNameExists('Teste');
    console.log('Nome "Teste" existe?', nameExists);
    
    // Teste 3: Criar material
    console.log('3. Testando criação de material...');
    const newMaterial = await materiaisService.create({
      name: 'Material de Teste ' + Date.now()
    });
    console.log('Material criado:', newMaterial);
    
    // Teste 4: Listar novamente
    console.log('4. Listando materiais após criação...');
    const updatedMaterials = await materiaisService.getAll();
    console.log('Materiais após criação:', updatedMaterials);
    
    return true;
  } catch (error) {
    console.error('Erro no teste:', error);
    return false;
  }
}

// Função para testar conexão com Supabase
export async function testSupabaseConnection() {
  console.log('=== TESTE DE CONEXÃO SUPABASE ===');
  
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Testar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Usuário atual:', user);
    console.log('Erro de usuário:', userError);
    
    // Testar query simples
    const { data, error } = await supabase
      .from('materials')
      .select('count(*)')
      .limit(1);
    
    console.log('Teste de query:', { data, error });
    
    return true;
  } catch (error) {
    console.error('Erro na conexão:', error);
    return false;
  }
}

// Exportar para uso em componente
export default {
  testMateriaisService,
  testSupabaseConnection
};
