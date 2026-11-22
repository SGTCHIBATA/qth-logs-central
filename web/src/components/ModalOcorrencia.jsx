import {
    X,
    Truck,
    Stethoscope,
    PhoneCall,
    ClipboardList,
    Lock,
    Navigation,
} from 'lucide-react'
import { normalizarPacientesVtr, construirUrlRota, obterMetaPrioridade, formatarEnderecoOcorrencia } from '../utils/painelCentralHelpers'
import AbaTarm from './AbaTarm'
import AbaRegulador from './AbaRegulador'
import AbaRadioOperador from './AbaRadioOperador'

export default function ModalOcorrencia({
    ocorrenciaSelecionada,
    editTarm,
    setEditTarm,
    editRegulador,
    setEditRegulador,
    editRadio,
    setEditRadio,
    abaInterna,
    setAbaInterna,
    mensagemModal,
    setMensagemModal,
    fecharModalOcorrencia,
    podeCriarOuEditarTarm,
    podeEditarClinicaPaciente,
    podeEditarRegulador,
    podeEditarRadio,
    salvandoSecao,
    listaEstados,
    cidadesEditTarmUrb,
    cidadesEditTarmRod,
    cidadesEditTarmOrig,
    cidadesEditTarmDest,
    empenhosDaOcorrencia,
    evolucoesDaOcorrencia,
    viaturas,
    rascunhosVtr,
    novoPacientePorVtr,
    setNovoPacientePorVtr,
    novaEvolucaoPorPaciente,
    setNovaEvolucaoPorPaciente,
    novoPacienteCena,
    setNovoPacienteCena,
    handleAdicionarPacienteCena,
    handleAtualizarPacienteCenaLocal,
    handleRemoverPacienteCena,
    handleEnviarRecursosImediato,
    handleAlternarApoioImediato,
    handleAlterarPrioridadeImediata,
    novaEvolucaoTexto,
    setNovaEvolucaoTexto,
    setNovoQuadroClinicoRapido,
    viaturaParaEmpenhar,
    setViaturaParaEmpenhar,
    pacientesDisponiveisRegulador,
    recursosOrdenadosMiniPainel,
    normalizarRecursosSolicitados,
    renderPainelBalancoVitimas,
    obterDraftVtr,
    handleSalvarTarm,
    handleAdicionarPacienteNaVtr,
    handleAtualizarCampoPacienteLocal,
    handleSalvarPacienteNaVtr,
    handleRemoverPacienteNaVtr,
    handleSalvarRegulador,
    handleAdicionarEvolucao,
    handleEmpenharViatura,
    handleAtualizarStatusEmpenho,
    handleDesvincularEmpenho,
    alterarHorarioEStatusVtr,
    horaAtualHhMm,
    handleSalvarHorariosVtr,
    handleAlterarCorVtr,
    handleSalvarRadio,
    handleRemoverSolicitacaoDespacho,
}) {
    if (!ocorrenciaSelecionada || !editTarm || !editRegulador || !editRadio) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-qth-card border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="bg-qth-bg border-b border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-extrabold text-white uppercase">
                                OCORRÊNCIA #{ocorrenciaSelecionada.numero_ocorrencia || 'S/N'}
                            </span>
                            <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${obterMetaPrioridade(ocorrenciaSelecionada.prioridade).badge
                                    }`}
                            >
                                PRIORIDADE: {obterMetaPrioridade(ocorrenciaSelecionada.prioridade).label}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-qth-orange border border-slate-600 uppercase">
                                STATUS: {ocorrenciaSelecionada.status_ocorrencia}
                            </span>
                            {ocorrenciaSelecionada.protocolo_imv && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-red text-white uppercase">
                                    PROTOCOLO IMV ATIVO
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 uppercase">
                            {ocorrenciaSelecionada.tipo_atendimento} •{' '}
                            {formatarEnderecoOcorrencia(ocorrenciaSelecionada)}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {construirUrlRota(ocorrenciaSelecionada) && (
                            <a
                                href={construirUrlRota(ocorrenciaSelecionada)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-qth-blue hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                GERAR ROTA GPS
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={fecharModalOcorrencia}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-qth-red text-slate-200 hover:text-white cursor-pointer"
                            title="Fechar ocorrência"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-qth-bg/60 border-b border-slate-700 px-3 pt-2 flex flex-wrap gap-1.5">
                    {[
                        { id: 'RESUMO', label: 'RESUMO', icon: ClipboardList, perm: true },
                        {
                            id: 'TARM',
                            label: 'TARM',
                            icon: PhoneCall,
                            perm: podeCriarOuEditarTarm,
                        },
                        {
                            id: 'REGULADOR',
                            label: 'REGULADOR',
                            icon: Stethoscope,
                            perm: podeEditarClinicaPaciente,
                        },
                        {
                            id: 'RADIO_OPERADOR',
                            label: 'RÁDIO OPERADOR',
                            icon: Truck,
                            perm: podeEditarRadio,
                        },
                    ].map((tab) => {
                        const IconComp = tab.icon
                        const ativa = abaInterna === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setMensagemModal('')
                                    setAbaInterna(tab.id)
                                }}
                                className={`px-3.5 py-2 rounded-t-xl text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer border-t border-x transition-colors ${ativa
                                    ? 'bg-qth-card text-qth-orange border-slate-600'
                                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent'
                                    }`}
                            >
                                <IconComp className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                                {!tab.perm && (
                                    <Lock
                                        className="w-3 h-3 text-slate-500"
                                        title="Somente visualização para o seu cargo"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {mensagemModal && (
                    <div className="mx-4 mt-3 bg-qth-blue/20 border border-blue-500/40 text-blue-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-between">
                        <span>{mensagemModal}</span>
                        <button
                            type="button"
                            onClick={() => setMensagemModal('')}
                            className="text-blue-300 hover:text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    {/* ABA 1: RESUMO */}
                    {abaInterna === 'RESUMO' && (
                        <div className="space-y-4">
                            {renderPainelBalancoVitimas(ocorrenciaSelecionada, empenhosDaOcorrencia, {
                                permitirEditarVtr: false,
                            })}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-1">
                                    <p className="text-[10px] font-extrabold text-qth-orange uppercase">
                                        Chamado & Solicitante (TARM)
                                    </p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        {ocorrenciaSelecionada.solicitante_nome || 'NÃO INFORMADO'}
                                    </p>
                                    <p className="text-[11px] text-slate-300">
                                        TEL: {ocorrenciaSelecionada.solicitante_telefone || '—'} • VÍTIMAS:{' '}
                                        {ocorrenciaSelecionada.numero_vitimas || 1}
                                    </p>
                                    <p className="text-[11px] text-slate-300 uppercase">
                                        MOTIVO: {ocorrenciaSelecionada.motivo || '—'}
                                    </p>
                                    {ocorrenciaSelecionada.coordenadas && (
                                        <p className="text-[11px] text-sky-300 font-mono">
                                            GPS: {ocorrenciaSelecionada.coordenadas}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-1">
                                    <p className="text-[10px] font-extrabold text-qth-orange uppercase">
                                        Regulação Médica
                                    </p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        RISCO: {ocorrenciaSelecionada.classificacao_risco || '—'} • RECURSO:{' '}
                                        {ocorrenciaSelecionada.recurso_indicado || 'A DEFINIR'}
                                    </p>
                                    <p className="text-[11px] text-slate-300 uppercase">
                                        HIPÓTESE: {ocorrenciaSelecionada.hipotese_diagnostica || '—'}
                                    </p>
                                    <p className="text-[11px] text-slate-300">
                                        QUADRO:{' '}
                                        {ocorrenciaSelecionada.quadro_clinico || 'Sem quadro clínico registrado.'}
                                    </p>
                                </div>

                                <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-1">
                                    <p className="text-[10px] font-extrabold text-qth-orange uppercase">
                                        Despacho & Desfecho (Rádio)
                                    </p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        VTRS: {empenhosDaOcorrencia.length} EMPENHADA(S)
                                    </p>
                                    <p className="text-[11px] text-green-400 font-bold uppercase">
                                        CÓDIGO J: {ocorrenciaSelecionada.codigo_j || 'PENDENTE'}
                                    </p>
                                    <p className="text-[11px] text-yellow-300 font-bold uppercase">
                                        QTA: {ocorrenciaSelecionada.codigo_qta || 'PENDENTE'}
                                    </p>
                                </div>
                            </div>

                            {empenhosDaOcorrencia.some(
                                (e) => normalizarPacientesVtr(e.pacientes_detalhes).length > 0
                            ) && (
                                    <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                                        <h4 className="text-xs font-extrabold text-white uppercase">
                                            Prontuários e Evoluções por VTR / Paciente
                                        </h4>
                                        {empenhosDaOcorrencia.map((emp) => {
                                            const pacs = normalizarPacientesVtr(emp.pacientes_detalhes)
                                            if (pacs.length === 0) return null
                                            return (
                                                <div key={emp.id} className="space-y-2">
                                                    <p className="text-[11px] font-extrabold text-qth-orange uppercase">
                                                        {emp.prefixo} ({emp.status_empenho})
                                                    </p>
                                                    {pacs.map((pac) => (
                                                        <div
                                                            key={pac.id}
                                                            className="bg-qth-card border border-slate-700 rounded-lg p-2.5 space-y-1"
                                                        >
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <span className="text-xs font-extrabold text-white uppercase">
                                                                    {pac.nome}
                                                                    {pac.idade
                                                                        ? ` • ${pac.idade}${pac.tipo_idade ? ` ${pac.tipo_idade}` : ''}`
                                                                        : ''}
                                                                    {pac.sexo ? ` • ${pac.sexo}` : ''}
                                                                </span>
                                                                {pac.cor_start && (
                                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-qth-orange border border-slate-600 uppercase">
                                                                        COR: {pac.cor_start}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {pac.destino && (
                                                                <p className="text-[11px] text-slate-300 uppercase">
                                                                    DESTINO: {pac.destino}
                                                                </p>
                                                            )}
                                                            {pac.quadro_clinico && (
                                                                <p className="text-[11px] text-slate-200">
                                                                    <strong>Quadro:</strong> {pac.quadro_clinico}
                                                                </p>
                                                            )}
                                                            {Array.isArray(pac.evolucoes) && pac.evolucoes.length > 0 && (
                                                                <div className="pt-1 space-y-1">
                                                                    {pac.evolucoes.map((ev) => (
                                                                        <div
                                                                            key={ev.id}
                                                                            className="text-[11px] bg-qth-bg/70 rounded p-2 border border-slate-700/60"
                                                                        >
                                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                                {ev.autor_nome} ({ev.autor_cargo}) •{' '}
                                                                                {ev.criado_em
                                                                                    ? new Date(ev.criado_em).toLocaleString('pt-BR')
                                                                                    : ''}
                                                                            </span>
                                                                            <p className="text-white mt-0.5">{ev.texto}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                            <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2">
                                <h4 className="text-xs font-extrabold text-white uppercase">
                                    Evoluções Gerais da Regulação
                                </h4>
                                {evolucoesDaOcorrencia.length === 0 ? (
                                    <p className="text-xs text-slate-400">
                                        Nenhuma evolução geral registrada ainda.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {evolucoesDaOcorrencia.map((evo) => (
                                            <div
                                                key={evo.id}
                                                className="bg-qth-card border border-slate-700/80 rounded-lg p-2.5 space-y-1"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                                                    <span className="font-bold text-qth-orange uppercase">
                                                        {evo.autor_nome || 'EQUIPE'} ({evo.autor_cargo || 'REGULADOR'})
                                                    </span>
                                                    <span>{new Date(evo.criado_em).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <p className="text-xs text-slate-100 whitespace-pre-line">
                                                    {evo.evolucao_texto}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ABA 2: TARM */}
                    {abaInterna === 'TARM' && (
                        <AbaTarm
                            ocorrenciaSelecionada={ocorrenciaSelecionada}
                            editTarm={editTarm}
                            setEditTarm={setEditTarm}
                            podeCriarOuEditarTarm={podeCriarOuEditarTarm}
                            salvandoSecao={salvandoSecao}
                            listaEstados={listaEstados}
                            cidadesEditTarmUrb={cidadesEditTarmUrb}
                            cidadesEditTarmRod={cidadesEditTarmRod}
                            cidadesEditTarmOrig={cidadesEditTarmOrig}
                            cidadesEditTarmDest={cidadesEditTarmDest}
                            handleSalvarTarm={handleSalvarTarm}
                            handleAlterarPrioridadeImediata={handleAlterarPrioridadeImediata}
                        />
                    )}

                    {/* ABA 3: REGULADOR */}
                    {abaInterna === 'REGULADOR' && (
                        <AbaRegulador
                            ocorrenciaSelecionada={ocorrenciaSelecionada}
                            editRegulador={editRegulador}
                            setEditRegulador={setEditRegulador}
                            empenhosDaOcorrencia={empenhosDaOcorrencia}
                            evolucoesDaOcorrencia={evolucoesDaOcorrencia}
                            podeEditarClinicaPaciente={podeEditarClinicaPaciente}
                            podeEditarRegulador={podeEditarRegulador}
                            salvandoSecao={salvandoSecao}
                            rascunhosVtr={rascunhosVtr}
                            novoPacientePorVtr={novoPacientePorVtr}
                            setNovoPacientePorVtr={setNovoPacientePorVtr}
                            novaEvolucaoPorPaciente={novaEvolucaoPorPaciente}
                            setNovaEvolucaoPorPaciente={setNovaEvolucaoPorPaciente}
                            novoPacienteCena={novoPacienteCena}
                            setNovoPacienteCena={setNovoPacienteCena}
                            handleAdicionarPacienteCena={handleAdicionarPacienteCena}
                            handleAtualizarPacienteCenaLocal={handleAtualizarPacienteCenaLocal}
                            handleRemoverPacienteCena={handleRemoverPacienteCena}
                            handleEnviarRecursosImediato={handleEnviarRecursosImediato}
                            handleAlternarApoioImediato={handleAlternarApoioImediato}
                            handleAlterarPrioridadeImediata={handleAlterarPrioridadeImediata}
                            novaEvolucaoTexto={novaEvolucaoTexto}
                            setNovaEvolucaoTexto={setNovaEvolucaoTexto}
                            setNovoQuadroClinicoRapido={setNovoQuadroClinicoRapido}
                            pacientesDisponiveisRegulador={pacientesDisponiveisRegulador}
                            renderPainelBalancoVitimas={renderPainelBalancoVitimas}
                            handleAdicionarPacienteNaVtr={handleAdicionarPacienteNaVtr}
                            handleAtualizarCampoPacienteLocal={handleAtualizarCampoPacienteLocal}
                            handleSalvarPacienteNaVtr={handleSalvarPacienteNaVtr}
                            handleRemoverPacienteNaVtr={handleRemoverPacienteNaVtr}
                            handleSalvarRegulador={handleSalvarRegulador}
                            handleAdicionarEvolucao={handleAdicionarEvolucao}
                        />
                    )}

                    {/* ABA 4: RÁDIO OPERADOR */}
                    {abaInterna === 'RADIO_OPERADOR' && (
                        <AbaRadioOperador
                            ocorrenciaSelecionada={ocorrenciaSelecionada}
                            empenhosDaOcorrencia={empenhosDaOcorrencia}
                            viaturas={viaturas}
                            editRadio={editRadio}
                            setEditRadio={setEditRadio}
                            viaturaParaEmpenhar={viaturaParaEmpenhar}
                            setViaturaParaEmpenhar={setViaturaParaEmpenhar}
                            podeEditarRadio={podeEditarRadio}
                            salvandoSecao={salvandoSecao}
                            recursosOrdenadosMiniPainel={recursosOrdenadosMiniPainel}
                            normalizarRecursosSolicitados={normalizarRecursosSolicitados}
                            renderPainelBalancoVitimas={renderPainelBalancoVitimas}
                            obterDraftVtr={obterDraftVtr}
                            handleEmpenharViatura={handleEmpenharViatura}
                            handleAtualizarStatusEmpenho={handleAtualizarStatusEmpenho}
                            handleDesvincularEmpenho={handleDesvincularEmpenho}
                            alterarHorarioEStatusVtr={alterarHorarioEStatusVtr}
                            horaAtualHhMm={horaAtualHhMm}
                            handleSalvarHorariosVtr={handleSalvarHorariosVtr}
                            handleAlterarCorVtr={handleAlterarCorVtr}
                            handleSalvarRadio={handleSalvarRadio}
                            handleRemoverSolicitacaoDespacho={handleRemoverSolicitacaoDespacho}
                            setMensagemModal={setMensagemModal}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}