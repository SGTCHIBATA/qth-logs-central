import { useState, useMemo } from 'react'
import {
    AlertTriangle,
    Truck,
    CheckCircle2,
    Lock,
    Clock,
    Save,
    Trash2,
    Layers,
    Share2,
    X,
    MapPin,
} from 'lucide-react'
import SelectPesquisavel from './SelectPesquisavel'
import {
    CORES_START,
    STATUS_OCORRENCIA_OPCOES,
    CODIGOS_J,
    CODIGOS_QTA,
    STATUS_EMPENHO_VTR,
    normalizarCoresVtr,
    formatarEnderecoOcorrencia,
    construirUrlRota,
    obterGrupoDisponibilidadeVtr,
    obterEstiloRecursoMiniPainel,
} from '../utils/painelCentralHelpers'

export default function AbaRadioOperador({
    ocorrenciaSelecionada,
    empenhosDaOcorrencia,
    viaturas,
    editRadio,
    setEditRadio,
    viaturaParaEmpenhar,
    setViaturaParaEmpenhar,
    podeEditarRadio,
    salvandoSecao,
    recursosOrdenadosMiniPainel,
    normalizarRecursosSolicitados,
    renderPainelBalancoVitimas,
    obterDraftVtr,
    handleEmpenharViatura,
    handleAtualizarStatusEmpenho,
    handleDesvincularEmpenho,
    alterarHorarioEStatusVtr,
    horaAtualHhMm,
    handleSalvarHorariosVtr,
    handleAlterarCorVtr,
    handleSalvarRadio,
    handleRemoverSolicitacaoDespacho,
    setMensagemModal,
}) {
    const [solicitacaoPreparando, setSolicitacaoPreparando] = useState(null)

    const naturezaOc = (ocorrenciaSelecionada?.tipo_atendimento || 'PRIMÁRIO').toUpperCase()
    const isTransferencia = naturezaOc !== 'PRIMÁRIO'
    const enderecoOc = formatarEnderecoOcorrencia(ocorrenciaSelecionada)
    const urlRotaOc = construirUrlRota(ocorrenciaSelecionada)

    const origemOc = [
        ocorrenciaSelecionada?.origem_instituicao,
        ocorrenciaSelecionada?.origem_rua
            ? `${ocorrenciaSelecionada.origem_rua}${ocorrenciaSelecionada?.origem_numero ? `, ${ocorrenciaSelecionada.origem_numero}` : ''}`
            : '',
        ocorrenciaSelecionada?.origem_bairro,
        ocorrenciaSelecionada?.origem_cidade || ocorrenciaSelecionada?.origem_uf
            ? `${ocorrenciaSelecionada?.origem_cidade || ''} - ${ocorrenciaSelecionada?.origem_uf || 'PR'}`
            : '',
    ]
        .filter(Boolean)
        .join(' • ')

    const destinoOc = [
        ocorrenciaSelecionada?.destino_instituicao,
        ocorrenciaSelecionada?.destino_cidade || ocorrenciaSelecionada?.destino_uf
            ? `${ocorrenciaSelecionada?.destino_cidade || ''} - ${ocorrenciaSelecionada?.destino_uf || 'PR'}`
            : '',
    ]
        .filter(Boolean)
        .join(' • ')

    const empenhosAtivos = useMemo(() => {
        return (empenhosDaOcorrencia || []).filter(
            (emp) => (emp.status_empenho || '').toUpperCase() !== 'QTA'
        )
    }, [empenhosDaOcorrencia])

    const solicitacoesPendentes = useMemo(() => {
        const todas = normalizarRecursosSolicitados(ocorrenciaSelecionada?.recursos_solicitados)
        return todas.filter((r) => !r.atendido)
    }, [ocorrenciaSelecionada?.recursos_solicitados, normalizarRecursosSolicitados])

    const recursosOrdenadosPopup = useMemo(() => {
        if (!solicitacaoPreparando) return []
        const tipoSolicitado = (solicitacaoPreparando.recurso || '').trim().toUpperCase()

        return [...(viaturas || [])]
            .map((v) => {
                const prefixoUpper = (v.prefixo || '').trim().toUpperCase()
                const tipoUpper = (v.tipo || '').trim().toUpperCase()
                const statusUpper = (v.status || 'DISPONIVEL').trim().toUpperCase()
                const baseLotacao = (v.base_cidade || v.cidade || 'BASE NÃO INFORMADA').trim().toUpperCase()
                const grupoDisp = obterGrupoDisponibilidadeVtr(statusUpper)
                const mesmoTipo = Boolean(tipoSolicitado) && tipoUpper === tipoSolicitado

                let faixaPrioridade = 4
                if (mesmoTipo && grupoDisp === 0) faixaPrioridade = 0
                else if (mesmoTipo && grupoDisp === 1) faixaPrioridade = 1
                else if (!mesmoTipo && grupoDisp === 0) faixaPrioridade = 2
                else if (!mesmoTipo && grupoDisp === 1) faixaPrioridade = 3

                return {
                    ...v,
                    prefixoUpper,
                    tipoUpper: tipoUpper || 'RECURSO',
                    statusUpper,
                    baseLotacao,
                    mesmoTipo,
                    faixaPrioridade,
                    meta: obterEstiloRecursoMiniPainel(statusUpper),
                }
            })
            .sort((a, b) => {
                if (a.faixaPrioridade !== b.faixaPrioridade) {
                    return a.faixaPrioridade - b.faixaPrioridade
                }
                return a.prefixoUpper.localeCompare(b.prefixoUpper, 'pt-BR')
            })
    }, [solicitacaoPreparando, viaturas])

    function obterInfoDirecionamentoCard(emp) {
        const dir = emp?.direcionamento_solicitacao
        if (dir && typeof dir === 'object') {
            const semPac = Boolean(dir.sem_paciente_especifico) || !String(dir.paciente_nome || '').trim()
            return {
                pacienteLabel: semPac
                    ? 'SEM PACIENTE ESPECÍFICO'
                    : String(dir.paciente_nome || '').trim().toUpperCase(),
                semPacienteEspecifico: semPac,
                observacaoLabel: String(dir.observacao || '').trim().toUpperCase(),
                recursoSolicitadoLabel: String(dir.recurso_solicitado || '').trim().toUpperCase(),
            }
        }

        const todasReqs = normalizarRecursosSolicitados(ocorrenciaSelecionada?.recursos_solicitados)
        const reqVinculado = todasReqs.find(
            (r) =>
                Array.isArray(r.recursos_empenhados_vinculados) &&
                r.recursos_empenhados_vinculados.some(
                    (v) => v.empenho_id === emp.id || (v.prefixo || '').toUpperCase() === (emp.prefixo || '').toUpperCase()
                )
        )

        if (reqVinculado) {
            const nomePac = String(reqVinculado.paciente_info?.nome || reqVinculado.paciente_nome || '').trim().toUpperCase()
            const semPac = !nomePac && !reqVinculado.paciente_id
            return {
                pacienteLabel: semPac ? 'SEM PACIENTE ESPECÍFICO' : (nomePac || 'PACIENTE NÃO IDENTIFICADO'),
                semPacienteEspecifico: semPac,
                observacaoLabel: String(reqVinculado.observacao || '').trim().toUpperCase(),
                recursoSolicitadoLabel: String(reqVinculado.recurso || '').trim().toUpperCase(),
            }
        }

        return {
            pacienteLabel: 'SEM PACIENTE ESPECÍFICO',
            semPacienteEspecifico: true,
            observacaoLabel: '',
            recursoSolicitadoLabel: '',
        }
    }

    function montarTextoWhatsApp() {
        const reqs = normalizarRecursosSolicitados(ocorrenciaSelecionada?.recursos_solicitados)
        const resumoReqs =
            reqs.length > 0
                ? reqs
                    .map(
                        (r) =>
                            `${r.quantidade}x ${r.recurso || 'RECURSO'}${r.paciente_nome ? ` (PAC: ${r.paciente_nome})` : ''}`
                    )
                    .join(' | ')
                : ocorrenciaSelecionada?.recurso_indicado || 'A DEFINIR'

        const linhas = [
            `*QTH LOGS — DESPACHO / APOIO*`,
            `*OCORRÊNCIA:* #${ocorrenciaSelecionada?.numero_ocorrencia || 'S/N'}`,
            `*PRIORIDADE:* ${ocorrenciaSelecionada?.prioridade || 'MÉDIA'}${ocorrenciaSelecionada?.protocolo_imv ? ' • *IMV ATIVO*' : ''}`,
            `*NATUREZA:* ${naturezaOc}`,
            `*MOTIVO:* ${ocorrenciaSelecionada?.motivo || 'NÃO INFORMADO'}`,
            `*VÍTIMAS:* ${ocorrenciaSelecionada?.numero_vitimas || 1}`,
        ]

        const apoiosAtivos = [
            ocorrenciaSelecionada?.apoio_policia ? 'POLÍCIA' : '',
            ocorrenciaSelecionada?.apoio_cobom_resgate ? 'COBOM / RESGATE' : '',
        ].filter(Boolean)

        if (apoiosAtivos.length > 0) {
            linhas.push(`*APOIO SOLICITADO:* ${apoiosAtivos.join(' + ')}`)
        }

        if (isTransferencia) {
            if (origemOc) linhas.push(`*ORIGEM:* ${origemOc}`)
            if (destinoOc) linhas.push(`*DESTINO:* ${destinoOc}`)
        } else {
            linhas.push(`*ENDEREÇO:* ${enderecoOc}`)
        }

        if (ocorrenciaSelecionada?.coordenadas) {
            linhas.push(`*GPS:* ${ocorrenciaSelecionada.coordenadas}`)
        }
        if (urlRotaOc) {
            linhas.push(`*ROTA:* ${urlRotaOc}`)
        }
        if (ocorrenciaSelecionada?.quadro_clinico) {
            linhas.push(`*QUADRO CLÍNICO:* ${ocorrenciaSelecionada.quadro_clinico}`)
        }
        if (ocorrenciaSelecionada?.conduta_regulacao) {
            linhas.push(`*CONDUTA/DESTINO:* ${ocorrenciaSelecionada.conduta_regulacao}`)
        }
        linhas.push(`*RECURSOS:* ${resumoReqs}`)

        return linhas.join('\n')
    }

    async function handleCompartilharWhatsApp() {
        const texto = montarTextoWhatsApp()
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(texto)
            }
        } catch {
            // ignora falha de clipboard
        }
        const urlWa = `https://wa.me/?text=${encodeURIComponent(texto)}`
        window.open(urlWa, '_blank', 'noopener,noreferrer')
        setMensagemModal?.('Resumo formatado para WhatsApp copiado e aberto para compartilhamento.')
    }

    async function handleSelecionarRecursoNoPopup(rec) {
        if (!podeEditarRadio || salvandoSecao || !solicitacaoPreparando) return
        const reqItem = solicitacaoPreparando
        const recursoPedidoUpper = (reqItem.recurso || 'RECURSO').toUpperCase()
        const isAlternativo = rec.tipoUpper !== recursoPedidoUpper

        const infoDirecionamento = [
            `RECURSO SOLICITADO: ${reqItem.quantidade}x ${recursoPedidoUpper}`,
            `VTR SELECIONADA: ${rec.prefixoUpper} (${rec.tipoUpper} • ${rec.baseLotacao})`,
            isAlternativo ? `ENVIO PROVISÓRIO/ALTERNATIVO (PEDIDO INICIAL: ${recursoPedidoUpper})` : '',
            reqItem.paciente_nome
                ? `PACIENTE: ${reqItem.paciente_info?.nome || reqItem.paciente_nome}`
                : 'PACIENTE: SEM PACIENTE ESPECÍFICO',
            reqItem.observacao
                ? `OBS/IDENTIFICAÇÃO: ${reqItem.observacao}`
                : '',
        ]
            .filter(Boolean)
            .join(' • ')

        setViaturaParaEmpenhar(rec.prefixoUpper)
        setEditRadio((prev) =>
            prev
                ? {
                    ...prev,
                    observacao_radio: prev.observacao_radio
                        ? `${prev.observacao_radio}\n${infoDirecionamento}`
                        : infoDirecionamento,
                }
                : prev
        )

        setSolicitacaoPreparando(null)
        await handleEmpenharViatura?.(rec.prefixoUpper, reqItem)
    }

    return (
        <div className="space-y-4">
            {!podeEditarRadio && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                        Apenas Rádio Operadores, Médicos Reguladores, Coordenadores e Gestores podem empenhar viaturas e lançar códigos J / QTA.
                    </span>
                </div>
            )}

            {/* Alerta visual quando houver solicitação de apoio Polícia / COBOM */}
            {(ocorrenciaSelecionada?.apoio_policia || ocorrenciaSelecionada?.apoio_cobom_resgate) && (
                <div className="bg-amber-950/35 border border-qth-orange rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-qth-orange uppercase">
                        AVISO DA REGULAÇÃO — ACIONAMENTO DE APOIO SOLICITADO
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {ocorrenciaSelecionada?.apoio_policia && (
                            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded bg-sky-700 text-white border border-sky-300 uppercase">
                                APOIO POLÍCIA
                            </span>
                        )}
                        {ocorrenciaSelecionada?.apoio_cobom_resgate && (
                            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded bg-amber-700 text-white border border-amber-300 uppercase">
                                APOIO COBOM / RESGATE
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Card consolidado TARM + Regulador com compartilhamento WhatsApp */}
            <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
                    <div>
                        <h4 className="text-xs font-extrabold text-qth-orange uppercase">
                            Dados Consolidados (TARM + Regulação) para Despacho e Rota
                        </h4>
                        <p className="text-[10px] text-slate-400">
                            Referência operacional completa para empenho, rotas e envio a recursos sem o app.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCompartilharWhatsApp}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        COMPARTILHAR WHATSAPP
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-qth-card border border-slate-700/80 rounded-lg p-2.5 space-y-1">
                        <p className="text-[10px] font-extrabold text-sky-300 uppercase">
                            Chamado & Localização (TARM)
                        </p>
                        <p className="font-bold text-white uppercase">
                            {naturezaOc} • {ocorrenciaSelecionada?.tipo_local || '—'} •{' '}
                            {ocorrenciaSelecionada?.numero_vitimas || 1} VÍTIMA(S)
                        </p>
                        <p className="text-[11px] text-slate-300 uppercase">
                            MOTIVO: {ocorrenciaSelecionada?.motivo || '—'}
                        </p>
                        <p className="text-[11px] text-slate-300 uppercase">
                            ENDEREÇO: {enderecoOc}
                        </p>
                        {ocorrenciaSelecionada?.coordenadas && (
                            <p className="text-[11px] text-sky-300 font-mono">
                                GPS: {ocorrenciaSelecionada.coordenadas}
                            </p>
                        )}
                    </div>

                    <div className="bg-qth-card border border-slate-700/80 rounded-lg p-2.5 space-y-1">
                        <p className="text-[10px] font-extrabold text-qth-orange uppercase">
                            Rota / Transferência
                        </p>
                        {isTransferencia ? (
                            <>
                                <p className="text-[11px] text-slate-200 uppercase">
                                    <strong>ORIGEM:</strong> {origemOc || 'NÃO INFORMADA'}
                                </p>
                                <p className="text-[11px] text-emerald-300 uppercase">
                                    <strong>DESTINO:</strong> {destinoOc || 'AGUARDANDO REGULADOR'}
                                </p>
                            </>
                        ) : (
                            <p className="text-[11px] text-slate-200 uppercase">
                                <strong>LOCAL DE ATENDIMENTO:</strong> {enderecoOc}
                            </p>
                        )}
                        {urlRotaOc && (
                            <a
                                href={urlRotaOc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[11px] font-bold text-sky-400 hover:underline pt-0.5"
                            >
                                Abrir link de rota ↗
                            </a>
                        )}
                    </div>

                    <div className="bg-qth-card border border-slate-700/80 rounded-lg p-2.5 space-y-1">
                        <p className="text-[10px] font-extrabold text-qth-orange uppercase">
                            Orientações da Regulação
                        </p>
                        <p className="text-[11px] text-slate-200">
                            <strong>QUADRO:</strong>{' '}
                            {ocorrenciaSelecionada?.quadro_clinico || 'Não informado'}
                        </p>
                        <p className="text-[11px] text-slate-200">
                            <strong>CONDUTA:</strong>{' '}
                            {ocorrenciaSelecionada?.conduta_regulacao || 'Não informada'}
                        </p>
                    </div>
                </div>
            </div>

            {renderPainelBalancoVitimas(ocorrenciaSelecionada, empenhosAtivos, {
                permitirEditarVtr: podeEditarRadio,
            })}

            {solicitacoesPendentes.length > 0 && (
                <div className="bg-qth-bg/75 border border-sky-500/40 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-extrabold text-sky-300 uppercase">
                        Solicitações da Regulação para Despacho
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {solicitacoesPendentes.map((reqItem, idxReq) => {
                            const vinculosProprios = Array.isArray(reqItem.recursos_empenhados_vinculados)
                                ? reqItem.recursos_empenhados_vinculados
                                : []
                            const podeRemoverEstaSolicitacao = vinculosProprios.length > 0

                            return (
                                <div
                                    key={reqItem.id || idxReq}
                                    className="bg-qth-card border border-slate-700 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2"
                                >
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-extrabold text-white uppercase">
                                            {reqItem.quantidade}x {reqItem.recurso || 'RECURSO'}
                                        </p>
                                        {reqItem.paciente_nome && (
                                            <p className="text-[10px] font-bold text-sky-300 uppercase">
                                                PACIENTE: {reqItem.paciente_info?.nome || reqItem.paciente_nome}
                                            </p>
                                        )}
                                        {reqItem.observacao && (
                                            <p className="text-[10px] text-slate-300 uppercase">
                                                IDENTIFICAÇÃO / OBS: {reqItem.observacao}
                                            </p>
                                        )}
                                        {podeRemoverEstaSolicitacao && (
                                            <p className="text-[10px] font-bold text-amber-300 uppercase">
                                                EMPENHADO DIVERSO: {vinculosProprios.map((v) => `${v.prefixo} (${v.tipo})`).join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    {podeEditarRadio && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={salvandoSecao}
                                                onClick={() => setSolicitacaoPreparando(reqItem)}
                                                className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] uppercase cursor-pointer"
                                            >
                                                PREPARAR EMPENHO
                                            </button>

                                            {podeRemoverEstaSolicitacao && (
                                                <button
                                                    type="button"
                                                    disabled={salvandoSecao}
                                                    onClick={() => handleRemoverSolicitacaoDespacho?.(reqItem)}
                                                    className="p-1.5 rounded-lg bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white cursor-pointer disabled:opacity-50"
                                                    title="Remover solicitação após recurso empenhado"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Popup compacto de preparação e seleção de recurso */}
            {solicitacaoPreparando && (
                <div className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-3">
                    <div className="bg-qth-card border border-slate-600 rounded-2xl w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-qth-bg border-b border-slate-700 px-4 py-3 flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-extrabold text-qth-orange uppercase">
                                    PREPARAR EMPENHO • SOLICITADO: {solicitacaoPreparando.quantidade}x{' '}
                                    {solicitacaoPreparando.recurso || 'RECURSO'}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase">
                                    {solicitacaoPreparando.paciente_nome
                                        ? `PACIENTE: ${solicitacaoPreparando.paciente_info?.nome || solicitacaoPreparando.paciente_nome} • `
                                        : 'PACIENTE: SEM PACIENTE ESPECÍFICO • '}
                                    PRIORIDADE: TIPO PEDIDO DISPONÍVEL › TIPO PEDIDO OPERACIONAL › OUTROS DISPONÍVEIS › OUTROS OPERACIONAIS
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSolicitacaoPreparando(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-qth-red text-slate-200 hover:text-white cursor-pointer"
                                title="Fechar lista de recursos"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
                            {recursosOrdenadosPopup.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">
                                    Nenhum recurso cadastrado na frota.
                                </p>
                            ) : (
                                recursosOrdenadosPopup.map((rec, idxRec) => {
                                    const faixaAnterior =
                                        idxRec > 0 ? recursosOrdenadosPopup[idxRec - 1].faixaPrioridade : null
                                    const mostrarSeparador =
                                        faixaAnterior !== null && faixaAnterior !== rec.faixaPrioridade

                                    const tituloFaixa =
                                        rec.faixaPrioridade === 0
                                            ? `${rec.tipoUpper} • DISPONÍVEIS`
                                            : rec.faixaPrioridade === 1
                                                ? `${rec.tipoUpper} • OPERACIONAIS / EM ATENDIMENTO`
                                                : rec.faixaPrioridade === 2
                                                    ? 'OUTROS RECURSOS • DISPONÍVEIS (CONTINGÊNCIA)'
                                                    : rec.faixaPrioridade === 3
                                                        ? 'OUTROS RECURSOS • OPERACIONAIS / EM ATENDIMENTO'
                                                        : 'OUTROS RECURSOS • INDISPONÍVEIS / BAIXADOS'

                                    return (
                                        <div key={rec.id} className="space-y-1">
                                            {mostrarSeparador && (
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase pt-1.5 px-1">
                                                    {tituloFaixa}
                                                </p>
                                            )}
                                            {idxRec === 0 && (
                                                <p className="text-[9px] font-extrabold text-sky-300 uppercase px-1">
                                                    {tituloFaixa}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                disabled={salvandoSecao}
                                                onClick={() => handleSelecionarRecursoNoPopup(rec)}
                                                className={`w-full px-3 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase transition-all cursor-pointer disabled:opacity-50 ${rec.meta.rowClass} hover:brightness-110`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="truncate">{rec.prefixoUpper}</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/35 text-white border border-white/15 shrink-0">
                                                        {rec.tipoUpper}
                                                    </span>
                                                    <span className="text-[10px] text-slate-200/90 truncate flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 shrink-0 opacity-80" />
                                                        {rec.baseLotacao}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${rec.meta.pillClass}`}
                                                >
                                                    {rec.statusUpper}
                                                </span>
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Coluna Esquerda: Empenho Multi-VTR, Horários Individuais, J, QTA */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-qth-bg/70 border border-slate-700 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                                <Truck className="w-4 h-4" />
                                Empenho Multi-VTR ({empenhosAtivos.length} vinculada(s))
                            </h4>

                            {podeEditarRadio && (
                                <div className="flex items-center gap-2">
                                    <div className="w-48">
                                        <SelectPesquisavel
                                            opcoes={viaturas.map((v) => v.prefixo.toUpperCase())}
                                            valor={viaturaParaEmpenhar}
                                            permiteTextoLivre={true}
                                            onChange={setViaturaParaEmpenhar}
                                            placeholder="SELECIONAR OU DIGITAR..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={salvandoSecao || !viaturaParaEmpenhar}
                                        onClick={() => handleEmpenharViatura?.()}
                                        className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                                    >
                                        EMPENHAR VTR
                                    </button>
                                </div>
                            )}
                        </div>

                        {empenhosAtivos.length === 0 ? (
                            <p className="text-xs text-slate-400">
                                Nenhuma viatura empenhada nesta ocorrência.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {empenhosAtivos.map((emp) => {
                                    const coresEmp = normalizarCoresVtr(emp.vitimas_cores)
                                    const draftVtr = obterDraftVtr(emp)
                                    const infoDir = obterInfoDirecionamentoCard(emp)
                                    return (
                                        <div
                                            key={emp.id}
                                            className="bg-qth-card border border-slate-700 rounded-xl p-3 space-y-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-extrabold text-white uppercase">
                                                        {emp.prefixo}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase">
                                                        ACION: {draftVtr.h_acionamento || '--:--'} • SAÍDA:{' '}
                                                        {draftVtr.h_saida_base || '--:--'} • QTH:{' '}
                                                        {draftVtr.h_chegada_qth || '--:--'} • SAÚDE:{' '}
                                                        {draftVtr.h_chegada_saude || '--:--'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="w-52">
                                                        <SelectPesquisavel
                                                            opcoes={STATUS_EMPENHO_VTR}
                                                            valor={draftVtr.status_empenho}
                                                            disabled={!podeEditarRadio}
                                                            onChange={(novoSt) =>
                                                                handleAtualizarStatusEmpenho(emp, novoSt)
                                                            }
                                                        />
                                                    </div>

                                                    {podeEditarRadio && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDesvincularEmpenho(emp)}
                                                            className="p-2 rounded-lg bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white cursor-pointer"
                                                            title="Remover viatura do empenho (QTA)"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-qth-bg/85 border border-slate-700/80 rounded-lg px-3 py-2 space-y-0.5">
                                                <p
                                                    className={`text-[11px] font-extrabold uppercase ${infoDir.semPacienteEspecifico
                                                        ? 'text-amber-300'
                                                        : 'text-sky-300'
                                                        }`}
                                                >
                                                    PACIENTE: {infoDir.pacienteLabel}
                                                    {infoDir.recursoSolicitadoLabel
                                                        ? ` • PEDIDO: ${infoDir.recursoSolicitadoLabel}`
                                                        : ''}
                                                </p>
                                                <p className="text-[10px] text-slate-300 uppercase">
                                                    IDENTIFICAÇÃO / OBS: {infoDir.observacaoLabel || '—'}
                                                </p>
                                            </div>

                                            <div className="bg-qth-bg/75 border border-slate-700/70 rounded-lg p-2.5 space-y-2">
                                                <p className="text-[10px] font-bold text-qth-orange uppercase flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Registro de Horários Individual ({emp.prefixo})
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {[
                                                        { key: 'h_acionamento', label: 'Acionamento' },
                                                        { key: 'h_saida_base', label: 'Saída Base' },
                                                        { key: 'h_chegada_qth', label: 'Chegada QTH' },
                                                        { key: 'h_saida_qth', label: 'Saída QTH' },
                                                        { key: 'h_chegada_saude', label: 'Cheg. Saúde' },
                                                        { key: 'h_saida_saude', label: 'Saída Saúde' },
                                                        { key: 'h_encerramento', label: 'Encerramento' },
                                                    ].map((h) => (
                                                        <div key={h.key}>
                                                            <label className="block text-[9px] font-bold text-slate-300 mb-1 uppercase">
                                                                {h.label}
                                                            </label>
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    disabled={!podeEditarRadio}
                                                                    value={draftVtr[h.key] || ''}
                                                                    onChange={(e) =>
                                                                        alterarHorarioEStatusVtr(
                                                                            emp,
                                                                            h.key,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder="HH:MM"
                                                                    className="w-full bg-qth-card border border-slate-600 rounded px-1.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                                                />
                                                                {podeEditarRadio && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            alterarHorarioEStatusVtr(
                                                                                emp,
                                                                                h.key,
                                                                                horaAtualHhMm()
                                                                            )
                                                                        }
                                                                        className="px-1.5 py-1 rounded bg-qth-green hover:bg-green-700 text-[9px] font-extrabold text-white cursor-pointer"
                                                                        title="Registrar hora atual"
                                                                    >
                                                                        AGORA
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {podeEditarRadio && (
                                                    <div className="flex justify-end pt-1">
                                                        <button
                                                            type="button"
                                                            disabled={salvandoSecao}
                                                            onClick={() => handleSalvarHorariosVtr(emp)}
                                                            className="bg-qth-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Save className="w-3 h-3" />
                                                            SALVAR HORÁRIOS {emp.prefixo}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
                                                <span className="text-[10px] font-bold text-slate-300 uppercase mr-1">
                                                    Vítimas na VTR:
                                                </span>
                                                {CORES_START.map((cor) => (
                                                    <div
                                                        key={cor.id}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-extrabold ${cor.chip}`}
                                                    >
                                                        <span>{cor.label}:</span>
                                                        <span>{coresEmp[cor.id] || 0}</span>
                                                        {podeEditarRadio && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        salvandoSecao || (coresEmp[cor.id] || 0) <= 0
                                                                    }
                                                                    onClick={() => handleAlterarCorVtr(emp, cor.id, -1)}
                                                                    className="ml-1 px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/70 disabled:opacity-30 cursor-pointer"
                                                                >
                                                                    -
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={salvandoSecao}
                                                                    onClick={() => handleAlterarCorVtr(emp, cor.id, 1)}
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SelectPesquisavel
                            label="Status da Ocorrência"
                            opcoes={STATUS_OCORRENCIA_OPCOES}
                            valor={editRadio.status_ocorrencia || 'PENDENTE'}
                            disabled={!podeEditarRadio}
                            onChange={(val) =>
                                setEditRadio({ ...editRadio, status_ocorrencia: val })
                            }
                        />

                        <SelectPesquisavel
                            label="Código J"
                            opcoes={CODIGOS_J}
                            valor={editRadio.codigo_j || ''}
                            disabled={!podeEditarRadio}
                            permiteTextoLivre={true}
                            placeholder="SELECIONE OU DIGITE CÓDIGO J"
                            onChange={(val) => setEditRadio({ ...editRadio, codigo_j: val })}
                        />

                        <SelectPesquisavel
                            label="Código QTA"
                            opcoes={CODIGOS_QTA}
                            valor={editRadio.codigo_qta || ''}
                            disabled={!podeEditarRadio}
                            permiteTextoLivre={true}
                            placeholder="SELECIONE OU DIGITE QTA"
                            onChange={(val) => setEditRadio({ ...editRadio, codigo_qta: val })}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Observações do Rádio Operador
                        </label>
                        <textarea
                            rows={2}
                            disabled={!podeEditarRadio}
                            value={editRadio.observacao_radio || ''}
                            onChange={(e) =>
                                setEditRadio({
                                    ...editRadio,
                                    observacao_radio: e.target.value,
                                })
                            }
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg p-3 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    {podeEditarRadio && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                disabled={salvandoSecao}
                                onClick={() => handleSalvarRadio('CANCELADA')}
                                className="bg-qth-red/25 hover:bg-qth-red text-red-200 hover:text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                CANCELAR / QTA
                            </button>

                            <button
                                type="button"
                                disabled={salvandoSecao}
                                onClick={() => handleSalvarRadio('FINALIZADA')}
                                className="bg-qth-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                FINALIZAR OCORRÊNCIA
                            </button>

                            <button
                                type="button"
                                disabled={salvandoSecao}
                                onClick={() => handleSalvarRadio(null)}
                                className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {salvandoSecao ? 'SALVANDO...' : 'SALVAR RÁDIO'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Coluna Direita: Mini Painel de Recursos (1 linha por recurso, ordem decrescente) */}
                <div className="lg:col-span-4 bg-qth-bg/75 border border-slate-700 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
                        <span className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Recursos ({recursosOrdenadosMiniPainel.length})
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                            DISP › EMP › BAIX
                        </span>
                    </div>

                    <p className="text-[10px] text-slate-400">
                        Clique no recurso para selecionar e clicar em <strong>EMPENHAR VTR</strong>.
                    </p>

                    <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-0.5">
                        {recursosOrdenadosMiniPainel.map((rec) => {
                            const selecionado =
                                viaturaParaEmpenhar.toUpperCase() === rec.prefixoUpper
                            return (
                                <button
                                    key={rec.id}
                                    type="button"
                                    onClick={() => {
                                        if (podeEditarRadio) {
                                            setViaturaParaEmpenhar(rec.prefixoUpper)
                                        }
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase transition-all cursor-pointer ${rec.meta.rowClass
                                        } ${selecionado
                                            ? 'ring-2 ring-qth-orange border-qth-orange'
                                            : 'hover:brightness-110'
                                        }`}
                                >
                                    <span className="truncate">{rec.prefixoUpper}</span>
                                    <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${rec.meta.pillClass}`}
                                    >
                                        {rec.statusUpper}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}