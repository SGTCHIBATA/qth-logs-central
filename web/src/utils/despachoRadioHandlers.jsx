import { ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import {
    CORES_START,
    CORES_VAZIAS,
    normalizarCoresVtr,
    somarCoresVtr,
    inferirStatusPorHorario,
    calcularBalancoVitimas,
} from './painelCentralHelpers'

function construirDirecionamentoVtr(solicitacaoContexto, ocorrenciaSelecionada, normalizarRecursosSolicitados) {
    const reqFonte =
        solicitacaoContexto ||
        (Array.isArray(normalizarRecursosSolicitados?.(ocorrenciaSelecionada?.recursos_solicitados)) &&
            normalizarRecursosSolicitados(ocorrenciaSelecionada.recursos_solicitados).length === 1
            ? normalizarRecursosSolicitados(ocorrenciaSelecionada.recursos_solicitados)[0]
            : null)

    if (!reqFonte) {
        return {
            recurso_solicitado: (ocorrenciaSelecionada?.recurso_indicado || '').trim().toUpperCase(),
            paciente_id: '',
            paciente_nome: '',
            sem_paciente_especifico: true,
            observacao: '',
        }
    }

    const nomePac = (reqFonte.paciente_info?.nome || reqFonte.paciente_nome || '').trim().toUpperCase()
    const temPacienteEspecifico = Boolean(nomePac || reqFonte.paciente_id)

    return {
        recurso_solicitado: (reqFonte.recurso || '').trim().toUpperCase(),
        paciente_id: reqFonte.paciente_id || '',
        paciente_nome: temPacienteEspecifico ? (nomePac || 'PACIENTE NÃO IDENTIFICADO') : '',
        sem_paciente_especifico: !temPacienteEspecifico,
        observacao: (reqFonte.observacao || '').trim().toUpperCase(),
    }
}

export async function executarEmpenharViatura({
    perfil,
    podeEditarRadio,
    ocorrenciaSelecionada,
    empenhosDaOcorrencia,
    viaturas,
    viaturaParaEmpenhar,
    setViaturaParaEmpenhar,
    setEditRadio,
    setEditRegulador,
    setOcorrencias,
    setSalvandoSecao,
    setMensagemModal,
    horaAtualHhMm,
    normalizarRecursosSolicitados,
    carregarTudo,
    prefixoOverride = null,
    solicitacaoContexto = null,
}) {
    const prefixoAlvo = (prefixoOverride || viaturaParaEmpenhar || '').trim().toUpperCase()
    if (!podeEditarRadio || !ocorrenciaSelecionada || !prefixoAlvo) return
    const vtrObj = viaturas.find(
        (v) => v.prefixo.toUpperCase() === prefixoAlvo
    )
    if (!vtrObj) return

    const jaVinculada = empenhosDaOcorrencia.some((e) => e.viatura_id === vtrObj.id)
    if (jaVinculada) {
        setMensagemModal(`A viatura ${vtrObj.prefixo} já está empenhada nesta ocorrência.`)
        return
    }

    setSalvandoSecao(true)
    setMensagemModal('')
    const horaAcion = horaAtualHhMm()

    const direcionamentoObj = construirDirecionamentoVtr(
        solicitacaoContexto,
        ocorrenciaSelecionada,
        normalizarRecursosSolicitados
    )

    try {
        const insertBase = {
            ocorrencia_id: ocorrenciaSelecionada.id,
            viatura_id: vtrObj.id,
            prefixo: vtrObj.prefixo.toUpperCase(),
            status_empenho: 'ACIONADA',
            vitimas_cores: CORES_VAZIAS,
            pacientes_detalhes: [],
            km_saida: vtrObj.km_atual || '',
            h_acionamento: horaAcion,
            empenhado_por: perfil?.id || null,
            empenhado_por_nome: (perfil?.nome_completo || '').toUpperCase(),
        }

        let { data: empCriado, error } = await supabase
            .from('ocorrencia_viaturas')
            .insert({
                ...insertBase,
                direcionamento_solicitacao: direcionamentoObj,
            })
            .select()
            .single()

        if (error && /direcionamento_solicitacao/i.test(error.message || '')) {
            const retryInsert = await supabase
                .from('ocorrencia_viaturas')
                .insert(insertBase)
                .select()
                .single()
            empCriado = retryInsert.data
            error = retryInsert.error
        }

        if (error) {
            setMensagemModal(`Erro ao empenhar viatura: ${error.message}`)
            return
        }

        await supabase.from('viaturas').update({ status: 'ACIONADA' }).eq('id', vtrObj.id)

        const novoStatusOc =
            ocorrenciaSelecionada.status_ocorrencia === 'PENDENTE'
                ? 'DESPACHADA'
                : ocorrenciaSelecionada.status_ocorrencia

        const updatesOc = {
            status_ocorrencia: novoStatusOc,
            h_acionamento: ocorrenciaSelecionada.h_acionamento || horaAcion,
            atualizado_em: new Date().toISOString(),
        }

        const reqsAtuais = normalizarRecursosSolicitados(ocorrenciaSelecionada.recursos_solicitados)
        let atualizouSolicitacoes = false
        let proximaListaReqs = reqsAtuais

        if (solicitacaoContexto && reqsAtuais.length > 0) {
            const tipoVtr = (vtrObj.tipo || '').trim().toUpperCase()
            const tipoSolicitado = (solicitacaoContexto.recurso || '').trim().toUpperCase()
            const mesmoTipoSolicitado = Boolean(tipoSolicitado) && tipoVtr === tipoSolicitado

            const montada = []
            for (const req of reqsAtuais) {
                const matchId = solicitacaoContexto.id && req.id === solicitacaoContexto.id
                const matchFallback =
                    !solicitacaoContexto.id &&
                    !req.atendido &&
                    (req.recurso || '').toUpperCase() === tipoSolicitado &&
                    (req.paciente_id || '') === (solicitacaoContexto.paciente_id || '')

                if (matchId || matchFallback) {
                    atualizouSolicitacoes = true
                    if (mesmoTipoSolicitado) {
                        const qtdAtual = Math.max(1, parseInt(req.quantidade, 10) || 1)
                        if (qtdAtual > 1) {
                            montada.push({
                                ...req,
                                quantidade: qtdAtual - 1,
                            })
                        }
                    } else {
                        const vinculosAnteriores = Array.isArray(req.recursos_empenhados_vinculados)
                            ? req.recursos_empenhados_vinculados
                            : []
                        montada.push({
                            ...req,
                            atendido: false,
                            recursos_empenhados_vinculados: [
                                ...vinculosAnteriores,
                                {
                                    empenho_id: empCriado?.id || '',
                                    prefixo: vtrObj.prefixo.toUpperCase(),
                                    tipo: tipoVtr,
                                    empenhado_em: new Date().toISOString(),
                                },
                            ],
                        })
                    }
                } else {
                    montada.push(req)
                }
            }

            if (atualizouSolicitacoes) {
                proximaListaReqs = montada
                updatesOc.recursos_solicitados = proximaListaReqs
            }
        }

        await supabase
            .from('ocorrencias')
            .update(updatesOc)
            .eq('id', ocorrenciaSelecionada.id)

        setEditRadio((prev) => (prev ? { ...prev, status_ocorrencia: novoStatusOc } : prev))
        if (atualizouSolicitacoes) {
            setEditRegulador?.((prev) =>
                prev ? { ...prev, recursos_solicitados: proximaListaReqs } : prev
            )
            setOcorrencias?.((prev) =>
                prev.map((o) =>
                    o.id === ocorrenciaSelecionada.id
                        ? { ...o, status_ocorrencia: novoStatusOc, recursos_solicitados: proximaListaReqs }
                        : o
                )
            )
        }

        await registrarAuditoria({
            perfil,
            tabela: 'ocorrencia_viaturas',
            registroId: empCriado?.id || ocorrenciaSelecionada.id,
            acao: 'CRIACAO',
            campo: 'EMPENHO_VTR',
            valorNovo: `VTR ${vtrObj.prefixo.toUpperCase()} empenhada na ocorrência ${ocorrenciaSelecionada.numero_ocorrencia}`,
        })

        if (solicitacaoContexto) {
            const detalheSolic = [
                `SOLICITADO: ${solicitacaoContexto.quantidade || 1}x ${(solicitacaoContexto.recurso || 'RECURSO').toUpperCase()}`,
                `ENVIADO: ${vtrObj.prefixo.toUpperCase()} (${(vtrObj.tipo || '').toUpperCase() || 'VTR'})`,
                direcionamentoObj.sem_paciente_especifico
                    ? 'PACIENTE: SEM PACIENTE ESPECÍFICO'
                    : `PACIENTE: ${direcionamentoObj.paciente_nome}`,
                direcionamentoObj.observacao
                    ? `OBS: ${direcionamentoObj.observacao}`
                    : '',
            ]
                .filter(Boolean)
                .join(' • ')

            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: empCriado?.id || ocorrenciaSelecionada.id,
                acao: 'EDICAO',
                campo: `DIRECIONAMENTO_REGULADOR_${vtrObj.prefixo.toUpperCase()}`,
                valorNovo: detalheSolic,
            })
        } else if (reqsAtuais.length > 0) {
            const resumoReqs = reqsAtuais
                .map(
                    (r) =>
                        `${r.quantidade}x ${r.recurso}${r.paciente_nome ? ` [PAC: ${r.paciente_nome}]` : ' [SEM PACIENTE ESPECÍFICO]'}${r.observacao ? ` (${r.observacao})` : ''}`
                )
                .join(' | ')
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: empCriado?.id || ocorrenciaSelecionada.id,
                acao: 'EDICAO',
                campo: `DIRECIONAMENTO_REGULADOR_${vtrObj.prefixo.toUpperCase()}`,
                valorNovo: resumoReqs,
            })
        }

        setViaturaParaEmpenhar('')
        setMensagemModal(`Viatura ${vtrObj.prefixo.toUpperCase()} empenhada.`)
        await carregarTudo({ silencioso: true })
    } finally {
        setSalvandoSecao(false)
    }
}

export async function executarAtualizarStatusEmpenho({
    perfil,
    podeEditarRadio,
    ocorrenciaSelecionada,
    emp,
    novoStatusEmpenho,
    obterDraftVtr,
    atualizarDraftVtr,
    setEditRadio,
    setSalvandoSecao,
    setMensagemModal,
    horaAtualHhMm,
    carregarTudo,
}) {
    if (!podeEditarRadio) return
    setSalvandoSecao(true)
    setMensagemModal('')

    const horaAgora = horaAtualHhMm()
    const draftAtual = obterDraftVtr(emp)
    const updatesEmp = {
        status_empenho: novoStatusEmpenho,
        atualizado_em: new Date().toISOString(),
    }

    if (novoStatusEmpenho === 'NO QTH' && !draftAtual.h_chegada_qth) {
        updatesEmp.h_chegada_qth = horaAgora
    } else if (novoStatusEmpenho === 'QTI UNIDADE SAUDE' && !draftAtual.h_saida_qth) {
        updatesEmp.h_saida_qth = horaAgora
    } else if (novoStatusEmpenho === 'NA UNIDADE SAUDE' && !draftAtual.h_chegada_saude) {
        updatesEmp.h_chegada_saude = horaAgora
    } else if (
        (novoStatusEmpenho === 'QTI BASE QAP' || novoStatusEmpenho === 'QTA') &&
        !draftAtual.h_encerramento
    ) {
        updatesEmp.h_encerramento = horaAgora
    }

    const { error } = await supabase
        .from('ocorrencia_viaturas')
        .update(updatesEmp)
        .eq('id', emp.id)

    if (!error) {
        atualizarDraftVtr(emp.id, emp, updatesEmp)

        const statusFrota =
            novoStatusEmpenho === 'QTI BASE QAP' || novoStatusEmpenho === 'QTA'
                ? 'DISPONIVEL'
                : novoStatusEmpenho

        await supabase.from('viaturas').update({ status: statusFrota }).eq('id', emp.viatura_id)

        if (ocorrenciaSelecionada) {
            const proximoStatusOc =
                novoStatusEmpenho === 'NO QTH' ||
                    novoStatusEmpenho === 'QTI UNIDADE SAUDE' ||
                    novoStatusEmpenho === 'NA UNIDADE SAUDE'
                    ? 'EM_ANDAMENTO'
                    : ocorrenciaSelecionada.status_ocorrencia

            const updatesOc = {
                status_ocorrencia: proximoStatusOc,
                atualizado_em: new Date().toISOString(),
            }
            if (novoStatusEmpenho === 'NO QTH' && !ocorrenciaSelecionada.h_chegada_qth) {
                updatesOc.h_chegada_qth = horaAgora
            }
            if (novoStatusEmpenho === 'NA UNIDADE SAUDE' && !ocorrenciaSelecionada.h_chegada_saude) {
                updatesOc.h_chegada_saude = horaAgora
            }

            await supabase.from('ocorrencias').update(updatesOc).eq('id', ocorrenciaSelecionada.id)
            setEditRadio((prev) => (prev ? { ...prev, status_ocorrencia: proximoStatusOc } : prev))
        }

        await registrarAuditoria({
            perfil,
            tabela: 'ocorrencia_viaturas',
            registroId: emp.id,
            acao: 'EDICAO',
            campo: 'STATUS_EMPENHO_VTR',
            valorAnterior: emp.status_empenho,
            valorNovo: `${emp.prefixo} -> ${novoStatusEmpenho}`,
        })

        setMensagemModal(`Status da ${emp.prefixo} atualizado para ${novoStatusEmpenho}.`)
        await carregarTudo({ silencioso: true })
    }

    setSalvandoSecao(false)
}

export function executarAlterarHorarioEStatusVtr({
    emp,
    chaveHorario,
    novoValor,
    obterDraftVtr,
    atualizarDraftVtr,
}) {
    const draftAtual = obterDraftVtr(emp)
    const proximoStatus = inferirStatusPorHorario(
        chaveHorario,
        novoValor,
        draftAtual.status_empenho
    )
    atualizarDraftVtr(emp.id, emp, {
        [chaveHorario]: novoValor,
        status_empenho: proximoStatus,
    })
}

export async function executarSalvarHorariosVtr({
    perfil,
    podeEditarRadio,
    emp,
    obterDraftVtr,
    setSalvandoSecao,
    setMensagemModal,
    carregarTudo,
}) {
    if (!podeEditarRadio) return
    const draft = obterDraftVtr(emp)
    setSalvandoSecao(true)
    setMensagemModal('')

    const statusParaSalvar = draft.status_empenho || emp.status_empenho || 'ACIONADA'

    const payloadVtr = {
        status_empenho: statusParaSalvar,
        km_saida: (draft.km_saida || '').trim(),
        km_chegada: (draft.km_chegada || '').trim(),
        h_acionamento: (draft.h_acionamento || '').trim(),
        h_saida_base: (draft.h_saida_base || '').trim(),
        h_chegada_qth: (draft.h_chegada_qth || '').trim(),
        h_saida_qth: (draft.h_saida_qth || '').trim(),
        h_chegada_saude: (draft.h_chegada_saude || '').trim(),
        h_saida_saude: (draft.h_saida_saude || '').trim(),
        h_encerramento: (draft.h_encerramento || '').trim(),
        atualizado_em: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('ocorrencia_viaturas')
        .update(payloadVtr)
        .eq('id', emp.id)

    if (error) {
        setMensagemModal(`Erro ao salvar horários da ${emp.prefixo}: ${error.message}`)
    } else {
        const statusFrota =
            statusParaSalvar === 'QTI BASE QAP' || statusParaSalvar === 'QTA'
                ? 'DISPONIVEL'
                : statusParaSalvar
        await supabase.from('viaturas').update({ status: statusFrota }).eq('id', emp.viatura_id)

        await registrarAuditoria({
            perfil,
            tabela: 'ocorrencia_viaturas',
            registroId: emp.id,
            acao: 'EDICAO',
            campo: `TEMPOS_VTR_${emp.prefixo}`,
            valorNovo: `STATUS:${statusParaSalvar} | ACION:${payloadVtr.h_acionamento || '--:--'} | SAÍDA:${payloadVtr.h_saida_base || '--:--'} | QTH:${payloadVtr.h_chegada_qth || '--:--'} | SAÚDE:${payloadVtr.h_chegada_saude || '--:--'} | ENC:${payloadVtr.h_encerramento || '--:--'}`,
        })
        setMensagemModal(
            `Horários e status (${statusParaSalvar}) da viatura ${emp.prefixo} salvos.`
        )
        await carregarTudo({ silencioso: true })
    }

    setSalvandoSecao(false)
}

export async function executarDesvincularEmpenho({
    perfil,
    podeEditarRadio,
    ocorrenciaSelecionada = null,
    emp,
    setEditRegulador = null,
    setOcorrencias = null,
    setSalvandoSecao,
    setMensagemModal,
    horaAtualHhMm = null,
    normalizarRecursosSolicitados = null,
    carregarTudo,
}) {
    if (!podeEditarRadio || !emp) return
    setSalvandoSecao(true)
    setMensagemModal('')

    const horaQta =
        typeof horaAtualHhMm === 'function'
            ? horaAtualHhMm()
            : new Date().toTimeString().slice(0, 5)

    try {
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                status_empenho: 'QTA',
                h_encerramento: emp.h_encerramento || horaQta,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            if (emp.viatura_id) {
                await supabase.from('viaturas').update({ status: 'DISPONIVEL' }).eq('id', emp.viatura_id)
            }

            if (ocorrenciaSelecionada && typeof normalizarRecursosSolicitados === 'function') {
                const listaAtual = normalizarRecursosSolicitados(ocorrenciaSelecionada.recursos_solicitados)
                let proximaLista = listaAtual.map((req) => {
                    const vinculos = Array.isArray(req.recursos_empenhados_vinculados)
                        ? req.recursos_empenhados_vinculados
                        : []
                    const vinculosFiltrados = vinculos.filter((v) => v.empenho_id !== emp.id)
                    if (vinculosFiltrados.length !== vinculos.length) {
                        return {
                            ...req,
                            recursos_empenhados_vinculados: vinculosFiltrados,
                        }
                    }
                    return req
                })

                const snap = emp?.direcionamento_solicitacao?.solicitacao_atendida_snapshot
                if (snap && snap.recurso) {
                    const recUpper = String(snap.recurso).trim().toUpperCase()
                    const pacIdSnap = snap.paciente_id || ''
                    const pacNomeSnap = String(snap.paciente_nome || '').trim().toUpperCase()

                    const idxExistente = proximaLista.findIndex(
                        (r) =>
                            !r.atendido &&
                            (r.recurso || '').toUpperCase() === recUpper &&
                            (r.paciente_id || '') === pacIdSnap &&
                            (r.paciente_nome || '').toUpperCase() === pacNomeSnap
                    )

                    if (idxExistente >= 0) {
                        proximaLista = proximaLista.map((r, i) =>
                            i === idxExistente
                                ? { ...r, quantidade: (parseInt(r.quantidade, 10) || 1) + 1 }
                                : r
                        )
                    } else {
                        proximaLista = [
                            ...proximaLista,
                            {
                                id: snap.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                recurso: recUpper,
                                quantidade: 1,
                                paciente_id: pacIdSnap,
                                paciente_nome: pacNomeSnap,
                                paciente_info: snap.paciente_info || null,
                                observacao: String(snap.observacao || '').toUpperCase(),
                                atendido: false,
                                viaturas_vinculadas: [],
                                recursos_empenhados_vinculados: [],
                            },
                        ]
                    }
                }

                await supabase
                    .from('ocorrencias')
                    .update({
                        recursos_solicitados: proximaLista,
                        atualizado_em: new Date().toISOString(),
                    })
                    .eq('id', ocorrenciaSelecionada.id)

                setEditRegulador?.((prev) =>
                    prev ? { ...prev, recursos_solicitados: proximaLista } : prev
                )
                setOcorrencias?.((prev) =>
                    prev.map((o) =>
                        o.id === ocorrenciaSelecionada.id
                            ? { ...o, recursos_solicitados: proximaLista }
                            : o
                    )
                )
            }

            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'EDICAO',
                campo: 'EMPENHO_VTR_QTA',
                valorAnterior: `${emp.prefixo} (${emp.status_empenho})`,
                valorNovo: `${emp.prefixo} -> QTA`,
            })

            setMensagemModal(`Comando de QTA enviado para ${emp.prefixo} e solicitação restaurada quando aplicável.`)
            await carregarTudo({ silencioso: true })
        }
    } finally {
        setSalvandoSecao(false)
    }
}

export async function executarSalvarRadio({
    perfil,
    podeEditarRadio,
    ocorrenciaSelecionada,
    empenhosDaOcorrencia,
    editRadio,
    statusForcado = null,
    setEditRadio,
    setSalvandoSecao,
    setMensagemModal,
    horaAtualHhMm,
    carregarTudo,
}) {
    if (!podeEditarRadio || !ocorrenciaSelecionada || !editRadio) return
    setSalvandoSecao(true)
    setMensagemModal('')

    const statusFinal = statusForcado || editRadio.status_ocorrencia || 'PENDENTE'

    const payload = {
        status_ocorrencia: statusFinal,
        codigo_j: (editRadio.codigo_j || '').trim().toUpperCase(),
        codigo_qta: (editRadio.codigo_qta || '').trim().toUpperCase(),
        observacao_radio: (editRadio.observacao_radio || '').trim(),
        atualizado_em: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('ocorrencias')
        .update(payload)
        .eq('id', ocorrenciaSelecionada.id)

    if (error) {
        setMensagemModal(`Erro ao salvar despacho do Rádio: ${error.message}`)
    } else {
        if (statusFinal === 'FINALIZADA' || statusFinal === 'CANCELADA') {
            const horaEnc = horaAtualHhMm()
            for (const emp of empenhosDaOcorrencia) {
                if (emp.status_empenho !== 'QTI BASE QAP' && emp.status_empenho !== 'QTA') {
                    await supabase
                        .from('ocorrencia_viaturas')
                        .update({
                            status_empenho: statusFinal === 'CANCELADA' ? 'QTA' : 'QTI BASE QAP',
                            h_encerramento: emp.h_encerramento || horaEnc,
                            atualizado_em: new Date().toISOString(),
                        })
                        .eq('id', emp.id)

                    await supabase.from('viaturas').update({ status: 'DISPONIVEL' }).eq('id', emp.viatura_id)
                }
            }
        }

        await registrarAlteracoesEmLote({
            perfil,
            tabela: 'ocorrencias',
            registroId: ocorrenciaSelecionada.id,
            anterior: ocorrenciaSelecionada,
            novo: payload,
            campos: ['status_ocorrencia', 'codigo_j', 'codigo_qta', 'observacao_radio'],
        })

        setEditRadio((prev) => (prev ? { ...prev, status_ocorrencia: statusFinal } : prev))
        setMensagemModal(`Registro do Rádio Operador salvo (${statusFinal}).`)
        await carregarTudo({ silencioso: true })
    }

    setSalvandoSecao(false)
}

export async function executarAlterarCorVtr({
    perfil,
    podeEditarRadio,
    podeEditarRegulador,
    emp,
    corId,
    delta,
    setSalvandoSecao,
    setMensagemModal,
    carregarTudo,
}) {
    if (!podeEditarRadio && !podeEditarRegulador) return
    const atual = normalizarCoresVtr(emp.vitimas_cores)
    const proximoValor = Math.max(0, (atual[corId] || 0) + delta)
    const novasCores = { ...atual, [corId]: proximoValor }

    setSalvandoSecao(true)
    setMensagemModal('')

    const { error } = await supabase
        .from('ocorrencia_viaturas')
        .update({
            vitimas_cores: novasCores,
            atualizado_em: new Date().toISOString(),
        })
        .eq('id', emp.id)

    if (!error) {
        await registrarAuditoria({
            perfil,
            tabela: 'ocorrencia_viaturas',
            registroId: emp.id,
            acao: 'EDICAO',
            campo: `VITIMAS_${corId}_${emp.prefixo}`,
            valorAnterior: String(atual[corId] || 0),
            valorNovo: String(proximoValor),
        })
        await carregarTudo({ silencioso: true })
    } else {
        setMensagemModal(`Erro ao atualizar vítimas na ${emp.prefixo}: ${error.message}`)
    }
    setSalvandoSecao(false)
}

export function renderizarPainelBalancoVitimas(
    oc,
    empenhosDaOc,
    { permitirEditarVtr = false, salvandoSecao = false, onAlterarCorVtr } = {}
) {
    const balanco = calcularBalancoVitimas(oc, empenhosDaOc)
    const isMultiplas = balanco.totalEstimado >= 2
    const empenhosAtivosBalanco = (empenhosDaOc || []).filter(
        (emp) => (emp.status_empenho || '').toUpperCase() !== 'QTA'
    )

    if (!isMultiplas && !oc.protocolo_imv && balanco.embarcadasVtr === 0) {
        return null
    }

    return (
        <div
            className={`rounded-xl p-3 space-y-2.5 border ${oc.protocolo_imv
                ? 'bg-red-950/35 border-qth-red'
                : 'bg-amber-950/25 border-qth-yellow/60'
                }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase flex items-center gap-1.5 text-white">
                    <ShieldAlert
                        className={`w-4 h-4 ${oc.protocolo_imv ? 'text-red-400' : 'text-qth-yellow'}`}
                    />
                    {oc.protocolo_imv
                        ? 'PROTOCOLO IMV ATIVO — CONTROLE DE VÍTIMAS E EMBARQUE START'
                        : `MÚLTIPLAS VÍTIMAS (${balanco.totalEstimado} ESTIMADAS) — BALANÇO OPERACIONAL`}
                </span>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold uppercase">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-600">
                        ESTIMADAS: {balanco.totalEstimado}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-qth-blue/30 text-blue-200 border border-blue-500/50">
                        EM VTRs: {balanco.embarcadasVtr}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-500/40">
                        EXT / 3ºs: {balanco.meiosProprios + balanco.terceiros + balanco.obitoLocal}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-qth-orange/25 text-orange-200 border border-qth-orange/50">
                        PENDENTES CENA: {balanco.saldoPendente}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {CORES_START.map((cor) => (
                    <span
                        key={cor.id}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${cor.chip}`}
                    >
                        {cor.label}: {balanco.totaisCor[cor.id] || 0}
                    </span>
                ))}
                {balanco.meiosProprios > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                        MEIOS PRÓPRIOS: {balanco.meiosProprios}
                    </span>
                )}
                {balanco.terceiros > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                        TERCEIROS: {balanco.terceiros}
                    </span>
                )}
                {balanco.obitoLocal > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                        ÓBITO LOCAL: {balanco.obitoLocal}
                    </span>
                )}
            </div>

            {empenhosAtivosBalanco.length > 0 && (
                <div className="space-y-2 pt-1">
                    {empenhosAtivosBalanco.map((emp) => {
                        const coresEmp = normalizarCoresVtr(emp.vitimas_cores)
                        const totalEmp = somarCoresVtr(coresEmp)
                        return (
                            <div
                                key={emp.id}
                                className="bg-qth-card/90 border border-slate-700 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2"
                            >
                                <div>
                                    <span className="text-xs font-extrabold text-white uppercase">
                                        {emp.prefixo}
                                    </span>{' '}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        ({emp.status_empenho}) • {totalEmp} EMBARCADA(S)
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {CORES_START.map((cor) => (
                                        <div
                                            key={cor.id}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-extrabold ${cor.chip}`}
                                        >
                                            <span>{cor.label}:</span>
                                            <span>{coresEmp[cor.id] || 0}</span>
                                            {permitirEditarVtr && (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={salvandoSecao || (coresEmp[cor.id] || 0) <= 0}
                                                        onClick={() => onAlterarCorVtr?.(emp, cor.id, -1)}
                                                        className="ml-1 px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/70 disabled:opacity-30 cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={salvandoSecao}
                                                        onClick={() => onAlterarCorVtr?.(emp, cor.id, 1)}
                                                        className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/70 disabled:opacity-30 cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}