import {
    Lock,
    Save,
    Send,
    Trash2,
    UserPlus,
    FileText,
    ClipboardList,
    Shield,
    Flame,
} from 'lucide-react'
import SelectPesquisavel from './SelectPesquisavel'
import BlocoRecursosRegulador from './BlocoRecursosRegulador'
import {
    PRIORIDADES,
    CORES_START,
    TIPOS_IDADE,
    SEXOS_PACIENTE,
    RECURSOS_INDICADOS,
    normalizarPacientesVtr,
    formatarEnderecoOcorrencia,
    obterCidadePrincipal,
} from '../utils/painelCentralHelpers'

export default function AbaRegulador({
    ocorrenciaSelecionada,
    editRegulador,
    setEditRegulador,
    empenhosDaOcorrencia,
    evolucoesDaOcorrencia,
    podeEditarClinicaPaciente,
    podeEditarRegulador,
    salvandoSecao,
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
    pacientesDisponiveisRegulador,
    renderPainelBalancoVitimas,
    handleAdicionarPacienteNaVtr,
    handleAtualizarCampoPacienteLocal,
    handleSalvarPacienteNaVtr,
    handleRemoverPacienteNaVtr,
    handleSalvarRegulador,
    handleAdicionarEvolucao,
}) {
    const pacientesCena = normalizarPacientesVtr(editRegulador?.pacientes_cena)
    const draftCena = novoPacienteCena || {
        nome: '',
        idade: '',
        tipo_idade: '',
        sexo: '',
        cor_start: '',
        destino: '',
        hipotese_diagnostica: '',
        detalhamento: '',
        recurso_indicado: '',
        quadro_clinico: '',
    }

    const apoioPoliciaAtivo = Boolean(
        editRegulador?.apoio_policia ?? ocorrenciaSelecionada?.apoio_policia
    )
    const apoioCobomAtivo = Boolean(
        editRegulador?.apoio_cobom_resgate ?? ocorrenciaSelecionada?.apoio_cobom_resgate
    )

    const naturezaOc = (ocorrenciaSelecionada?.tipo_atendimento || 'PRIMÁRIO').toUpperCase()
    const isTransferencia = naturezaOc !== 'PRIMÁRIO'
    const municipioOc = obterCidadePrincipal(ocorrenciaSelecionada)
    const ufOc = (
        ocorrenciaSelecionada?.estado ||
        ocorrenciaSelecionada?.rodovia_uf ||
        ocorrenciaSelecionada?.origem_uf ||
        'PR'
    ).toUpperCase()
    const enderecoCompletoOc = formatarEnderecoOcorrencia(ocorrenciaSelecionada)

    const origemResumo = [
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

    return (
        <div className="space-y-4">
            {!podeEditarClinicaPaciente && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                        Seu cargo possui acesso apenas de visualização nesta aba.
                    </span>
                </div>
            )}

            <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                            Total Estimado na Cena
                        </label>
                        <input
                            type="number"
                            min={1}
                            disabled={!podeEditarRegulador}
                            value={editRegulador.numero_vitimas || 1}
                            onChange={(e) =>
                                setEditRegulador({
                                    ...editRegulador,
                                    numero_vitimas: e.target.value,
                                })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                            Meios Próprios / Recusa
                        </label>
                        <input
                            type="number"
                            min={0}
                            disabled={!podeEditarRegulador}
                            value={editRegulador.vitimas_meios_proprios || 0}
                            onChange={(e) =>
                                setEditRegulador({
                                    ...editRegulador,
                                    vitimas_meios_proprios: e.target.value,
                                })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                            Terceiros / Apoio Sem App
                        </label>
                        <input
                            type="number"
                            min={0}
                            disabled={!podeEditarRegulador}
                            value={editRegulador.vitimas_terceiros || 0}
                            onChange={(e) =>
                                setEditRegulador({
                                    ...editRegulador,
                                    vitimas_terceiros: e.target.value,
                                })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                            Óbito no Local (Sem Remoção)
                        </label>
                        <input
                            type="number"
                            min={0}
                            disabled={!podeEditarRegulador}
                            value={editRegulador.vitimas_obito_local || 0}
                            onChange={(e) =>
                                setEditRegulador({
                                    ...editRegulador,
                                    vitimas_obito_local: e.target.value,
                                })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        />
                    </div>
                </div>

                {renderPainelBalancoVitimas(
                    {
                        ...ocorrenciaSelecionada,
                        protocolo_imv: editRegulador.protocolo_imv,
                        numero_vitimas: editRegulador.numero_vitimas,
                        vitimas_meios_proprios: editRegulador.vitimas_meios_proprios,
                        vitimas_terceiros: editRegulador.vitimas_terceiros,
                        vitimas_obito_local: editRegulador.vitimas_obito_local,
                    },
                    empenhosDaOcorrencia,
                    { permitirEditarVtr: podeEditarRegulador }
                )}
            </div>

            {/* Card de detalhamento geral da ocorrência: dados TARM (somente leitura) + prioridade/IMV/apoios + quadro/conduta/destino */}
            <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="bg-qth-card/90 border border-slate-700/80 rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-sky-300 uppercase flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5" />
                            Dados Coletados pelo TARM (Somente Leitura)
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Edição exclusiva na aba TARM
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Natureza
                            </span>
                            <span className="font-extrabold text-white uppercase">
                                {naturezaOc}
                            </span>
                        </div>

                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Tipo de Local
                            </span>
                            <span className="font-extrabold text-white uppercase">
                                {ocorrenciaSelecionada?.tipo_local || 'NÃO INFORMADO'}
                            </span>
                        </div>

                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Nº de Vítimas Relatadas
                            </span>
                            <span className="font-extrabold text-qth-orange uppercase">
                                {ocorrenciaSelecionada?.numero_vitimas || 1}
                            </span>
                        </div>

                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Município / UF
                            </span>
                            <span className="font-extrabold text-white uppercase">
                                {municipioOc ? `${municipioOc} - ${ufOc}` : ufOc}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs">
                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Motivo Informado pelo TARM
                            </span>
                            <span className="font-bold text-white uppercase">
                                {ocorrenciaSelecionada?.motivo || 'NÃO INFORMADO'}
                            </span>
                        </div>

                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Endereço Completo da Ocorrência
                            </span>
                            <span className="font-bold text-slate-200 uppercase">
                                {enderecoCompletoOc || 'NÃO INFORMADO'}
                            </span>
                        </div>
                    </div>

                    {isTransferencia && origemResumo && (
                        <div className="bg-qth-bg/80 border border-slate-700/70 rounded px-2.5 py-1.5 text-xs">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                Origem da Transferência (TARM)
                            </span>
                            <span className="font-bold text-sky-200 uppercase">
                                {origemResumo}
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                    <div>
                        <span className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                            Classificação de Prioridade da Cena:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {PRIORIDADES.map((prio) => (
                                <button
                                    key={prio.id}
                                    type="button"
                                    disabled={!podeEditarRegulador || salvandoSecao}
                                    onClick={() => {
                                        setEditRegulador((prev) =>
                                            prev ? { ...prev, prioridade: prio.id } : prev
                                        )
                                        handleAlterarPrioridadeImediata?.(prio.id)
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer disabled:opacity-60 ${editRegulador.prioridade === prio.id
                                        ? prio.btnAtivo
                                        : 'bg-qth-card text-slate-300 border-slate-700'
                                        }`}
                                >
                                    {prio.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col justify-end space-y-2">
                        <div>
                            <span className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                                Protocolo de Múltiplas Vítimas (IMV):
                            </span>
                            <button
                                type="button"
                                disabled={!podeEditarRegulador}
                                onClick={() =>
                                    setEditRegulador({
                                        ...editRegulador,
                                        protocolo_imv: !editRegulador.protocolo_imv,
                                    })
                                }
                                className={`w-full px-3.5 py-2 rounded-lg text-xs font-extrabold uppercase border cursor-pointer disabled:opacity-60 transition-colors ${editRegulador.protocolo_imv
                                    ? 'bg-qth-red text-white border-red-300'
                                    : 'bg-qth-card text-slate-200 border-slate-600 hover:border-qth-red'
                                    }`}
                            >
                                {editRegulador.protocolo_imv
                                    ? 'PROTOCOLO IMV: ATIVO (CLIQUE PARA DESATIVAR)'
                                    : 'ATIVAR PROTOCOLO IMV'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={!podeEditarRegulador || salvandoSecao}
                                onClick={() => handleAlternarApoioImediato?.('POLICIA')}
                                className={`px-3 py-2 rounded-lg text-[11px] font-extrabold uppercase border flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors ${apoioPoliciaAtivo
                                    ? 'bg-amber-600 text-white border-amber-300'
                                    : 'bg-qth-card text-amber-200 border-amber-500/50 hover:border-amber-400'
                                    }`}
                            >
                                <Shield className="w-3.5 h-3.5 shrink-0" />
                                {apoioPoliciaAtivo ? 'APOIO POLÍCIA: AVISADO' : 'AVISAR APOIO POLÍCIA'}
                            </button>

                            <button
                                type="button"
                                disabled={!podeEditarRegulador || salvandoSecao}
                                onClick={() => handleAlternarApoioImediato?.('COBOM_RESGATE')}
                                className={`px-3 py-2 rounded-lg text-[11px] font-extrabold uppercase border flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors ${apoioCobomAtivo
                                    ? 'bg-qth-red text-white border-red-300'
                                    : 'bg-qth-card text-red-200 border-red-500/50 hover:border-red-400'
                                    }`}
                            >
                                <Flame className="w-3.5 h-3.5 shrink-0" />
                                {apoioCobomAtivo ? 'APOIO COBOM/RESGATE: AVISADO' : 'AVISAR APOIO COBOM/RESGATE'}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        QUADRO CLÍNICO GERAL DA OCORRÊNCIA
                    </label>
                    <textarea
                        rows={3}
                        disabled={!podeEditarRegulador}
                        value={editRegulador.quadro_clinico || ''}
                        onChange={(e) => {
                            setEditRegulador({
                                ...editRegulador,
                                quadro_clinico: e.target.value,
                            })
                            setNovoQuadroClinicoRapido(e.target.value)
                        }}
                        placeholder="Descreva sinais vitais, estado neurológico, queixas e achados clínicos..."
                        className="w-full bg-qth-card border border-slate-600 rounded-lg p-3 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        CONDUTA DA REGULAÇÃO / DESTINO HOSPITALAR
                    </label>
                    <textarea
                        rows={2}
                        disabled={!podeEditarRegulador}
                        value={editRegulador.conduta_regulacao || ''}
                        onChange={(e) =>
                            setEditRegulador({
                                ...editRegulador,
                                conduta_regulacao: e.target.value,
                            })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg p-3 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                    />
                </div>

                {isTransferencia && (
                    <div className="bg-qth-card/90 border border-sky-500/40 rounded-lg p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-extrabold text-qth-orange uppercase">
                                Destino da Transferência (Definido pela Regulação para Rota do Condutor)
                            </p>
                            <span className="text-[10px] text-slate-400">
                                * Campos obrigatórios para geração de rota
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                                    Unidade de Saúde Destino *
                                </label>
                                <input
                                    type="text"
                                    disabled={!podeEditarRegulador}
                                    placeholder="EX: HOSPITAL REGIONAL / UPA / SANTA CASA"
                                    value={editRegulador.destino_instituicao || ''}
                                    onChange={(e) =>
                                        setEditRegulador({
                                            ...editRegulador,
                                            destino_instituicao: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                                    UF *
                                </label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    disabled={!podeEditarRegulador}
                                    placeholder="PR"
                                    value={editRegulador.destino_uf || ''}
                                    onChange={(e) =>
                                        setEditRegulador({
                                            ...editRegulador,
                                            destino_uf: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                                    Cidade / Município *
                                </label>
                                <input
                                    type="text"
                                    disabled={!podeEditarRegulador}
                                    placeholder="MUNICÍPIO DESTINO"
                                    value={editRegulador.destino_cidade || ''}
                                    onChange={(e) =>
                                        setEditRegulador({
                                            ...editRegulador,
                                            destino_cidade: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cadastro individual de pacientes na cena (pré-despacho / vínculo a recursos) */}
            <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
                    <div>
                        <h4 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4" />
                            PACIENTES REGISTRADOS NA CENA (PRÉ-DESPACHO / VÍNCULO A RECURSOS)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Pré-triagem com o solicitante antes do despacho: registre a vítima, hipótese diagnóstica, destino, detalhamento e já indique o recurso a destinar.
                        </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                        {pacientesCena.length} PACIENTE(S) NA CENA
                    </span>
                </div>

                {podeEditarClinicaPaciente && (
                    <div className="bg-qth-card/90 border border-slate-700 rounded-lg p-2.5 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                            <input
                                type="text"
                                placeholder="NOME / IDENTIFICAÇÃO"
                                value={draftCena.nome || ''}
                                onChange={(e) =>
                                    setNovoPacienteCena((prev) => ({
                                        ...prev,
                                        nome: e.target.value.toUpperCase(),
                                    }))
                                }
                                className="lg:col-span-2 bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase"
                            />
                            <input
                                type="text"
                                placeholder="IDADE"
                                value={draftCena.idade || ''}
                                onChange={(e) =>
                                    setNovoPacienteCena((prev) => ({
                                        ...prev,
                                        idade: e.target.value.replace(/\D/g, '').slice(0, 3),
                                    }))
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                            <SelectPesquisavel
                                opcoes={TIPOS_IDADE}
                                valor={draftCena.tipo_idade || ''}
                                placeholder="TIPO IDADE..."
                                onChange={(val) =>
                                    setNovoPacienteCena((prev) => ({ ...prev, tipo_idade: val }))
                                }
                            />
                            <SelectPesquisavel
                                opcoes={SEXOS_PACIENTE}
                                valor={draftCena.sexo || ''}
                                placeholder="SEXO..."
                                onChange={(val) =>
                                    setNovoPacienteCena((prev) => ({ ...prev, sexo: val }))
                                }
                            />
                            <SelectPesquisavel
                                opcoes={CORES_START.map((c) => c.id)}
                                valor={draftCena.cor_start || ''}
                                placeholder="COR START..."
                                onChange={(val) =>
                                    setNovoPacienteCena((prev) => ({ ...prev, cor_start: val }))
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-center">
                            <input
                                type="text"
                                placeholder="HIPÓTESE DIAGNÓSTICA"
                                value={draftCena.hipotese_diagnostica || ''}
                                onChange={(e) =>
                                    setNovoPacienteCena((prev) => ({
                                        ...prev,
                                        hipotese_diagnostica: e.target.value.toUpperCase(),
                                    }))
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase"
                            />
                            <input
                                type="text"
                                placeholder="DESTINO / UNIDADE DE SAÚDE"
                                value={draftCena.destino || ''}
                                onChange={(e) =>
                                    setNovoPacienteCena((prev) => ({
                                        ...prev,
                                        destino: e.target.value.toUpperCase(),
                                    }))
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase"
                            />
                            <div className="lg:col-span-2">
                                <SelectPesquisavel
                                    opcoes={RECURSOS_INDICADOS}
                                    valor={draftCena.recurso_indicado || ''}
                                    placeholder="RECURSO A DESTINAR..."
                                    permiteTextoLivre={true}
                                    onChange={(val) =>
                                        setNovoPacienteCena((prev) => ({
                                            ...prev,
                                            recurso_indicado: (val || '').toUpperCase(),
                                        }))
                                    }
                                />
                            </div>
                            <button
                                type="button"
                                disabled={salvandoSecao}
                                onClick={handleAdicionarPacienteCena}
                                className="lg:col-span-2 bg-qth-blue hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-3 py-1.5 rounded text-xs cursor-pointer"
                            >
                                + REGISTRAR PACIENTE
                            </button>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="DETALHAMENTO DA VÍTIMA (PRÉ-TRIAGEM COM SOLICITANTE: QUEIXAS, SINAIS, MECANISMO...)"
                                value={draftCena.detalhamento || ''}
                                onChange={(e) =>
                                    setNovoPacienteCena((prev) => ({
                                        ...prev,
                                        detalhamento: e.target.value,
                                    }))
                                }
                                className="w-full bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                        </div>
                    </div>
                )}

                {pacientesCena.length === 0 ? (
                    <p className="text-xs text-slate-400">
                        Nenhum paciente registrado na cena ainda.
                    </p>
                ) : (
                    <div className="space-y-2.5">
                        {pacientesCena.map((pac, idxPac) => (
                            <div
                                key={pac.id}
                                className="bg-qth-card border border-slate-700 rounded-lg p-3 space-y-2"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-qth-orange uppercase">
                                        PACIENTE CENA #{idxPac + 1} • {pac.nome}
                                        {pac.hipotese_diagnostica ? ` • HD: ${pac.hipotese_diagnostica}` : ''}
                                        {pac.recurso_indicado ? ` • RECURSO: ${pac.recurso_indicado}` : ''}
                                    </span>

                                    {podeEditarClinicaPaciente && (
                                        <button
                                            type="button"
                                            disabled={salvandoSecao}
                                            onClick={() => handleRemoverPacienteCena(pac.id)}
                                            className="p-1.5 rounded bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white cursor-pointer"
                                            title="Remover paciente da cena"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                                    <input
                                        type="text"
                                        disabled={!podeEditarClinicaPaciente}
                                        placeholder="NOME / IDENTIFICAÇÃO"
                                        value={pac.nome || ''}
                                        onChange={(e) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                nome: e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="lg:col-span-2 bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                    />
                                    <input
                                        type="text"
                                        disabled={!podeEditarClinicaPaciente}
                                        placeholder="IDADE"
                                        value={pac.idade || ''}
                                        onChange={(e) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                idade: e.target.value.replace(/\D/g, '').slice(0, 3),
                                            })
                                        }
                                        className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                                    />
                                    <SelectPesquisavel
                                        opcoes={CORES_START.map((c) => c.id)}
                                        valor={pac.cor_start || ''}
                                        placeholder="COR START..."
                                        disabled={!podeEditarClinicaPaciente}
                                        onChange={(val) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, { cor_start: val })
                                        }
                                    />
                                    <input
                                        type="text"
                                        disabled={!podeEditarClinicaPaciente}
                                        placeholder="HIPÓTESE DIAGNÓSTICA"
                                        value={pac.hipotese_diagnostica || ''}
                                        onChange={(e) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                hipotese_diagnostica: e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase disabled:opacity-60"
                                    />
                                    <SelectPesquisavel
                                        opcoes={RECURSOS_INDICADOS}
                                        valor={pac.recurso_indicado || ''}
                                        placeholder="RECURSO..."
                                        disabled={!podeEditarClinicaPaciente}
                                        permiteTextoLivre={true}
                                        onChange={(val) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                recurso_indicado: (val || '').toUpperCase(),
                                            })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        disabled={!podeEditarClinicaPaciente}
                                        placeholder="DESTINO / UNIDADE"
                                        value={pac.destino || ''}
                                        onChange={(e) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                destino: e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase disabled:opacity-60"
                                    />
                                    <input
                                        type="text"
                                        disabled={!podeEditarClinicaPaciente}
                                        placeholder="Detalhamento / pré-triagem desta vítima..."
                                        value={pac.detalhamento || pac.quadro_clinico || ''}
                                        onChange={(e) =>
                                            handleAtualizarPacienteCenaLocal(pac.id, {
                                                detalhamento: e.target.value,
                                                quadro_clinico: e.target.value,
                                            })
                                        }
                                        className="bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BlocoRecursosRegulador
                recursosSolicitados={editRegulador.recursos_solicitados || []}
                onChange={(novaLista) =>
                    setEditRegulador({
                        ...editRegulador,
                        recursos_solicitados: novaLista,
                    })
                }
                onEnviarImediato={handleEnviarRecursosImediato}
                pacientesDisponiveis={pacientesDisponiveisRegulador}
                disabled={!podeEditarRegulador}
            />

            {/* Prontuários e Evoluções por VTR e por Paciente */}
            <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Prontuários e Evoluções por VTR e por Paciente
                    </h4>
                    <span className="text-[10px] text-slate-400 uppercase">
                        Individualizado mesmo com múltiplos pacientes da mesma cor na VTR
                    </span>
                </div>

                {empenhosDaOcorrencia.length === 0 ? (
                    <p className="text-xs text-slate-400">
                        Nenhuma viatura empenhada nesta ocorrência ainda.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {empenhosDaOcorrencia.map((emp) => {
                            const pacientesVtr = normalizarPacientesVtr(
                                rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
                            )
                            const formNovoPac = novoPacientePorVtr[emp.id] || {
                                nome: '',
                                idade: '',
                                tipo_idade: '',
                                sexo: '',
                                cor_start: '',
                                destino: '',
                                quadro_clinico: '',
                            }

                            return (
                                <div
                                    key={emp.id}
                                    className="bg-qth-card border border-slate-700 rounded-xl p-3 space-y-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
                                        <span className="text-xs font-extrabold text-white uppercase">
                                            {emp.prefixo} ({emp.status_empenho}) • {pacientesVtr.length}{' '}
                                            PACIENTE(S) CADASTRADO(S)
                                        </span>
                                    </div>

                                    {podeEditarClinicaPaciente && (
                                        <div className="bg-qth-bg/70 border border-slate-700/80 rounded-lg p-2.5 space-y-2">
                                            <p className="text-[10px] font-extrabold text-sky-300 uppercase flex items-center gap-1">
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Adicionar Paciente na {emp.prefixo}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="NOME / IDENTIFICAÇÃO"
                                                    value={formNovoPac.nome}
                                                    onChange={(e) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: {
                                                                ...formNovoPac,
                                                                nome: e.target.value.toUpperCase(),
                                                            },
                                                        }))
                                                    }
                                                    className="lg:col-span-2 bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="IDADE"
                                                    value={formNovoPac.idade}
                                                    onChange={(e) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: {
                                                                ...formNovoPac,
                                                                idade: e.target.value.replace(/\D/g, '').slice(0, 3),
                                                            },
                                                        }))
                                                    }
                                                    className="bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white"
                                                />
                                                <SelectPesquisavel
                                                    opcoes={TIPOS_IDADE}
                                                    valor={formNovoPac.tipo_idade}
                                                    placeholder="TIPO IDADE..."
                                                    onChange={(val) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: { ...formNovoPac, tipo_idade: val },
                                                        }))
                                                    }
                                                />
                                                <SelectPesquisavel
                                                    opcoes={SEXOS_PACIENTE}
                                                    valor={formNovoPac.sexo}
                                                    placeholder="SEXO..."
                                                    onChange={(val) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: { ...formNovoPac, sexo: val },
                                                        }))
                                                    }
                                                />
                                                <SelectPesquisavel
                                                    opcoes={CORES_START.map((c) => c.id)}
                                                    valor={formNovoPac.cor_start}
                                                    placeholder="COR START..."
                                                    onChange={(val) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: { ...formNovoPac, cor_start: val },
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="DESTINO / UNIDADE DE SAÚDE"
                                                    value={formNovoPac.destino}
                                                    onChange={(e) =>
                                                        setNovoPacientePorVtr((prev) => ({
                                                            ...prev,
                                                            [emp.id]: {
                                                                ...formNovoPac,
                                                                destino: e.target.value.toUpperCase(),
                                                            },
                                                        }))
                                                    }
                                                    className="flex-1 min-w-[180px] bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={salvandoSecao}
                                                    onClick={() => handleAdicionarPacienteNaVtr(emp)}
                                                    className="bg-qth-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded text-xs cursor-pointer"
                                                >
                                                    + INCLUIR PACIENTE
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {pacientesVtr.length === 0 ? (
                                        <p className="text-[11px] text-slate-400">
                                            Nenhum paciente individualizado cadastrado nesta viatura ainda.
                                        </p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {pacientesVtr.map((pac, idxPac) => {
                                                const textoEvoPac = novaEvolucaoPorPaciente[pac.id] || ''
                                                return (
                                                    <div
                                                        key={pac.id}
                                                        className="bg-qth-bg/80 border border-slate-700 rounded-lg p-3 space-y-2.5"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="text-xs font-extrabold text-qth-orange uppercase">
                                                                PACIENTE #{idxPac + 1} • {pac.nome}
                                                            </span>

                                                            {podeEditarClinicaPaciente && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoverPacienteNaVtr(emp, pac.id)}
                                                                    className="p-1.5 rounded bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white cursor-pointer"
                                                                    title="Remover paciente"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                                            <input
                                                                type="text"
                                                                disabled={!podeEditarClinicaPaciente}
                                                                placeholder="NOME / IDENTIFICAÇÃO"
                                                                value={pac.nome}
                                                                onChange={(e) =>
                                                                    handleAtualizarCampoPacienteLocal(emp, pac.id, {
                                                                        nome: e.target.value.toUpperCase(),
                                                                    })
                                                                }
                                                                className="lg:col-span-2 bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                                            />
                                                            <input
                                                                type="text"
                                                                disabled={!podeEditarClinicaPaciente}
                                                                placeholder="IDADE"
                                                                value={pac.idade}
                                                                onChange={(e) =>
                                                                    handleAtualizarCampoPacienteLocal(emp, pac.id, {
                                                                        idade: e.target.value
                                                                            .replace(/\D/g, '')
                                                                            .slice(0, 3),
                                                                    })
                                                                }
                                                                className="bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                                                            />
                                                            <SelectPesquisavel
                                                                opcoes={CORES_START.map((c) => c.id)}
                                                                valor={pac.cor_start}
                                                                placeholder="COR START..."
                                                                disabled={!podeEditarClinicaPaciente}
                                                                onChange={(val) =>
                                                                    handleAtualizarCampoPacienteLocal(emp, pac.id, {
                                                                        cor_start: val,
                                                                    })
                                                                }
                                                            />
                                                            <input
                                                                type="text"
                                                                disabled={!podeEditarClinicaPaciente}
                                                                placeholder="DESTINO / HOSPITAL"
                                                                value={pac.destino}
                                                                onChange={(e) =>
                                                                    handleAtualizarCampoPacienteLocal(emp, pac.id, {
                                                                        destino: e.target.value.toUpperCase(),
                                                                    })
                                                                }
                                                                className="bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white uppercase disabled:opacity-60"
                                                            />
                                                        </div>

                                                        <textarea
                                                            rows={2}
                                                            disabled={!podeEditarClinicaPaciente}
                                                            placeholder="Quadro clínico individual deste paciente..."
                                                            value={pac.quadro_clinico || ''}
                                                            onChange={(e) =>
                                                                handleAtualizarCampoPacienteLocal(emp, pac.id, {
                                                                    quadro_clinico: e.target.value,
                                                                })
                                                            }
                                                            className="w-full bg-qth-card border border-slate-600 rounded p-2 text-xs text-white disabled:opacity-60"
                                                        />

                                                        {podeEditarClinicaPaciente && (
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nova evolução clínica deste paciente..."
                                                                    value={textoEvoPac}
                                                                    onChange={(e) =>
                                                                        setNovaEvolucaoPorPaciente((prev) => ({
                                                                            ...prev,
                                                                            [pac.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="flex-1 bg-qth-card border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={salvandoSecao}
                                                                    onClick={() => handleSalvarPacienteNaVtr(emp, pac.id)}
                                                                    className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center justify-center gap-1 cursor-pointer"
                                                                >
                                                                    <Save className="w-3.5 h-3.5" />
                                                                    SALVAR PACIENTE
                                                                </button>
                                                            </div>
                                                        )}

                                                        {Array.isArray(pac.evolucoes) &&
                                                            pac.evolucoes.length > 0 && (
                                                                <div className="space-y-1 pt-1">
                                                                    {pac.evolucoes.map((ev) => (
                                                                        <div
                                                                            key={ev.id}
                                                                            className="bg-qth-card/80 border border-slate-700/70 rounded p-2 text-[11px]"
                                                                        >
                                                                            <span className="text-[10px] font-bold text-qth-orange">
                                                                                {ev.autor_nome} ({ev.autor_cargo}) •{' '}
                                                                                {ev.criado_em
                                                                                    ? new Date(ev.criado_em).toLocaleString(
                                                                                        'pt-BR'
                                                                                    )
                                                                                    : ''}
                                                                            </span>
                                                                            <p className="text-white mt-0.5">{ev.texto}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {podeEditarRegulador && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        disabled={salvandoSecao}
                        onClick={handleSalvarRegulador}
                        className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {salvandoSecao ? 'SALVANDO...' : 'SALVAR REGULAÇÃO'}
                    </button>
                </div>
            )}

            {podeEditarRegulador && (
                <form
                    onSubmit={handleAdicionarEvolucao}
                    className="bg-qth-bg/70 border border-slate-700 rounded-xl p-3 space-y-2.5"
                >
                    <p className="text-xs font-extrabold text-qth-orange uppercase">
                        Incluir Evolução Geral da Regulação
                    </p>
                    <textarea
                        rows={2}
                        value={novaEvolucaoTexto}
                        onChange={(e) => setNovaEvolucaoTexto(e.target.value)}
                        placeholder="Digite a evolução clínica geral, intercorrência ou reavaliação..."
                        className="w-full bg-qth-card border border-slate-600 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-qth-orange"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={salvandoSecao}
                            className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" />
                            ADICIONAR EVOLUÇÃO
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-white uppercase">
                    Linha do Tempo de Evoluções Gerais ({evolucoesDaOcorrencia.length})
                </h4>
                {evolucoesDaOcorrencia.map((evo) => (
                    <div
                        key={evo.id}
                        className="bg-qth-bg/70 border border-slate-700/80 rounded-xl p-3 space-y-1"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                            <span className="font-bold text-qth-orange uppercase">
                                {evo.autor_nome || 'REGULADOR'} • {evo.autor_cargo || 'MEDICO REGULADOR'}
                            </span>
                            <span>{new Date(evo.criado_em).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-white whitespace-pre-line">
                            {evo.evolucao_texto}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}