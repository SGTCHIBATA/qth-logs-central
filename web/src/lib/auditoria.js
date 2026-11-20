import { supabase } from './supabase'

export async function registrarAuditoria({
    perfil,
    tabela,
    registroId,
    acao,
    campo,
    valorAnterior = null,
    valorNovo = null,
}) {
    if (!perfil) return

    const nome = (perfil.nome || perfil.nome_completo || 'DESCONHECIDO').toUpperCase()
    const cargo = (perfil.cargo || perfil.papel || 'SEM_CARGO').toUpperCase()

    const { error } = await supabase.from('logs_auditoria').insert({
        usuario_id: perfil.id,
        usuario_nome: nome,
        usuario_cargo: cargo,
        tabela_afetada: tabela,
        registro_id: registroId ? String(registroId) : null,
        acao,
        campo_alterado: campo,
        valor_anterior: valorAnterior !== null && valorAnterior !== undefined ? String(valorAnterior) : null,
        valor_novo: valorNovo !== null && valorNovo !== undefined ? String(valorNovo) : null,
        origem: 'PAINEL_WEB',
    })

    if (error) {
        console.error('Erro ao registrar auditoria:', error.message)
    }
}

export async function registrarAlteracoesEmLote({
    perfil,
    tabela,
    registroId,
    anterior,
    novo,
    campos,
}) {
    if (!perfil) return

    const nome = (perfil.nome || perfil.nome_completo || 'DESCONHECIDO').toUpperCase()
    const cargo = (perfil.cargo || perfil.papel || 'SEM_CARGO').toUpperCase()

    const logs = []

    for (const campo of campos) {
        const valAnt = anterior?.[campo] ?? ''
        const valNov = novo?.[campo] ?? ''

        if (String(valAnt) !== String(valNov)) {
            logs.push({
                usuario_id: perfil.id,
                usuario_nome: nome,
                usuario_cargo: cargo,
                tabela_afetada: tabela,
                registro_id: registroId ? String(registroId) : null,
                acao: 'EDICAO',
                campo_alterado: campo,
                valor_anterior: String(valAnt),
                valor_novo: String(valNov),
                origem: 'PAINEL_WEB',
            })
        }
    }

    if (logs.length > 0) {
        const { error } = await supabase.from('logs_auditoria').insert(logs)
        if (error) {
            console.error('Erro ao registrar auditoria em lote:', error.message)
        }
    }
}