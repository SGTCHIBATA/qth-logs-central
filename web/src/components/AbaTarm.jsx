import { Lock, Save } from 'lucide-react'
import SelectPesquisavel from './SelectPesquisavel'
import BlocoLocalizacaoRapida from './BlocoLocalizacaoRapida'
import {
    PRIORIDADES,
    NATUREZAS_ATENDIMENTO,
    TIPOS_LOCAL,
    TIPOS_VIA,
    TIPOS_IDADE,
    SEXOS_PACIENTE,
} from '../utils/painelCentralHelpers'

export default function AbaTarm({
    ocorrenciaSelecionada,
    editTarm,
    setEditTarm,
    podeCriarOuEditarTarm,
    salvandoSecao,
    listaEstados,
    cidadesEditTarmUrb,
    cidadesEditTarmRod,
    cidadesEditTarmOrig,
    handleSalvarTarm,
    handleAlterarPrioridadeImediata,
}) {
    function aoClicarPrioridade(prioId) {
        if (!podeCriarOuEditarTarm) return
        setEditTarm((prev) => (prev ? { ...prev, prioridade: prioId } : prev))
        handleAlterarPrioridadeImediata?.(prioId)
    }

    return (
        <div className="space-y-4">
            {!podeCriarOuEditarTarm && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                        Apenas TARM, Médicos Reguladores, Coordenadores e Gestores podem editar os dados do TARM.
                    </span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase mr-1">
                    Prioridade:
                </span>
                {PRIORIDADES.map((prio) => (
                    <button
                        key={prio.id}
                        type="button"
                        disabled={!podeCriarOuEditarTarm || salvandoSecao}
                        onClick={() => aoClicarPrioridade(prio.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer disabled:opacity-60 ${editTarm.prioridade === prio.id
                            ? prio.btnAtivo
                            : 'bg-qth-bg text-slate-300 border-slate-700'
                            }`}
                    >
                        {prio.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Nº Ocorrência
                    </label>
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        value={editTarm.numero_ocorrencia || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                numero_ocorrencia: e.target.value.toUpperCase(),
                            })
                        }
                        className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Solicitante
                    </label>
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        value={editTarm.solicitante_nome || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                solicitante_nome: e.target.value.toUpperCase(),
                            })
                        }
                        className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Telefone Solicitante
                    </label>
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        value={editTarm.solicitante_telefone || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                solicitante_telefone: e.target.value,
                            })
                        }
                        className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Nº de Vítimas
                    </label>
                    <input
                        type="number"
                        min={1}
                        disabled={!podeCriarOuEditarTarm}
                        value={editTarm.numero_vitimas || 1}
                        onChange={(e) =>
                            setEditTarm({ ...editTarm, numero_vitimas: e.target.value })
                        }
                        className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    />
                </div>

                <SelectPesquisavel
                    label="Natureza"
                    opcoes={NATUREZAS_ATENDIMENTO}
                    valor={editTarm.tipo_atendimento || 'PRIMÁRIO'}
                    disabled={!podeCriarOuEditarTarm}
                    onChange={(val) =>
                        setEditTarm({ ...editTarm, tipo_atendimento: val })
                    }
                />

                <SelectPesquisavel
                    label="Tipo de Local"
                    opcoes={TIPOS_LOCAL}
                    valor={editTarm.tipo_local || 'DOMICÍLIO'}
                    disabled={!podeCriarOuEditarTarm}
                    onChange={(val) => setEditTarm({ ...editTarm, tipo_local: val })}
                />

                <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Motivo
                    </label>
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        value={editTarm.motivo || ''}
                        onChange={(e) =>
                            setEditTarm({ ...editTarm, motivo: e.target.value.toUpperCase() })
                        }
                        className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                    />
                </div>
            </div>

            {editTarm.tipo_atendimento === 'PRIMÁRIO' ? (
                <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-qth-orange uppercase">
                            Tipo de Via:
                        </span>
                        {TIPOS_VIA.map((v) => (
                            <button
                                key={v}
                                type="button"
                                disabled={!podeCriarOuEditarTarm}
                                onClick={() => {
                                    setEditTarm({ ...editTarm, tipo_via: v })
                                }}
                                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer disabled:opacity-60 ${editTarm.tipo_via === v
                                    ? 'bg-qth-orange text-white'
                                    : 'bg-qth-card text-slate-300'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    <BlocoLocalizacaoRapida
                        dados={editTarm}
                        setDados={setEditTarm}
                        desabilitado={!podeCriarOuEditarTarm}
                        resetKey={ocorrenciaSelecionada?.id || ''}
                    />

                    {editTarm.tipo_via === 'Urbana' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="VIA 1"
                                value={editTarm.via1 || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        via1: e.target.value.toUpperCase(),
                                    })
                                }
                                className="lg:col-span-2 bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="VIA 2 / CRUZAMENTO"
                                value={editTarm.via2 || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        via2: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="NÚMERO"
                                value={editTarm.numero_end || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        numero_end: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="BAIRRO"
                                value={editTarm.bairro || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        bairro: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="PONTO DE REFERÊNCIA"
                                value={editTarm.ponto_referencia || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        ponto_referencia: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <SelectPesquisavel
                                label="UF"
                                opcoes={listaEstados}
                                valor={editTarm.estado || 'PR'}
                                disabled={!podeCriarOuEditarTarm}
                                onChange={(uf) =>
                                    setEditTarm({ ...editTarm, estado: uf, cidade_urb: '' })
                                }
                            />
                            <SelectPesquisavel
                                label="Cidade"
                                opcoes={cidadesEditTarmUrb}
                                valor={editTarm.cidade_urb || ''}
                                disabled={!podeCriarOuEditarTarm}
                                permiteTextoLivre={true}
                                onChange={(cid) =>
                                    setEditTarm({ ...editTarm, cidade_urb: cid })
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="PREFIXO (BR / PR)"
                                value={editTarm.rodovia_jurisdicao || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        rodovia_jurisdicao: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="CÓDIGO RODOVIA"
                                value={editTarm.rodovia_codigo || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        rodovia_codigo: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="KM"
                                value={editTarm.rodovia_km || ''}
                                onChange={(e) =>
                                    setEditTarm({ ...editTarm, rodovia_km: e.target.value })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                            />
                            <input
                                type="text"
                                disabled={!podeCriarOuEditarTarm}
                                placeholder="PONTO DE REFERÊNCIA"
                                value={editTarm.ponto_referencia || ''}
                                onChange={(e) =>
                                    setEditTarm({
                                        ...editTarm,
                                        ponto_referencia: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                            />
                            <SelectPesquisavel
                                label="UF Rodovia"
                                opcoes={listaEstados}
                                valor={editTarm.rodovia_uf || 'PR'}
                                disabled={!podeCriarOuEditarTarm}
                                onChange={(uf) =>
                                    setEditTarm({
                                        ...editTarm,
                                        rodovia_uf: uf,
                                        rodovia_cidade: '',
                                    })
                                }
                            />
                            <SelectPesquisavel
                                label="Município Rodovia"
                                opcoes={cidadesEditTarmRod}
                                valor={editTarm.rodovia_cidade || ''}
                                disabled={!podeCriarOuEditarTarm}
                                permiteTextoLivre={true}
                                onChange={(cid) =>
                                    setEditTarm({ ...editTarm, rodovia_cidade: cid })
                                }
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-qth-orange uppercase">
                            Origem da Transferência
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase">
                            Destino é definido pelo Médico Regulador
                        </span>
                    </div>
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        placeholder="INSTITUIÇÃO ORIGEM"
                        value={editTarm.origem_instituicao || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                origem_instituicao: e.target.value.toUpperCase(),
                            })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                            type="text"
                            disabled={!podeCriarOuEditarTarm}
                            placeholder="RUA"
                            value={editTarm.origem_rua || ''}
                            onChange={(e) =>
                                setEditTarm({
                                    ...editTarm,
                                    origem_rua: e.target.value.toUpperCase(),
                                })
                            }
                            className="sm:col-span-2 bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                        />
                        <input
                            type="text"
                            disabled={!podeCriarOuEditarTarm}
                            placeholder="Nº"
                            value={editTarm.origem_numero || ''}
                            onChange={(e) =>
                                setEditTarm({
                                    ...editTarm,
                                    origem_numero: e.target.value.toUpperCase(),
                                })
                            }
                            className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                            type="text"
                            disabled={!podeCriarOuEditarTarm}
                            placeholder="BAIRRO"
                            value={editTarm.origem_bairro || ''}
                            onChange={(e) =>
                                setEditTarm({
                                    ...editTarm,
                                    origem_bairro: e.target.value.toUpperCase(),
                                })
                            }
                            className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                        />
                        <SelectPesquisavel
                            label="UF"
                            opcoes={listaEstados}
                            valor={editTarm.origem_uf || 'PR'}
                            disabled={!podeCriarOuEditarTarm}
                            onChange={(uf) =>
                                setEditTarm({
                                    ...editTarm,
                                    origem_uf: uf,
                                    origem_cidade: '',
                                })
                            }
                        />
                        <SelectPesquisavel
                            label="Cidade"
                            opcoes={cidadesEditTarmOrig}
                            valor={editTarm.origem_cidade || ''}
                            disabled={!podeCriarOuEditarTarm}
                            permiteTextoLivre={true}
                            onChange={(cid) =>
                                setEditTarm({ ...editTarm, origem_cidade: cid })
                            }
                        />
                    </div>
                </div>
            )}

            <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                <p className="text-[11px] font-bold text-qth-orange uppercase">
                    Dados do Paciente
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        placeholder="NOME DO PACIENTE"
                        value={editTarm.nome_paciente || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                nome_paciente: e.target.value.toUpperCase(),
                            })
                        }
                        className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                    />
                    <input
                        type="text"
                        disabled={!podeCriarOuEditarTarm}
                        placeholder="IDADE"
                        value={editTarm.idade_paciente || ''}
                        onChange={(e) =>
                            setEditTarm({
                                ...editTarm,
                                idade_paciente: e.target.value.replace(/\D/g, '').slice(0, 3),
                            })
                        }
                        className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    />
                    <SelectPesquisavel
                        label="Tipo Idade"
                        opcoes={TIPOS_IDADE}
                        valor={editTarm.tipo_idade_paciente || ''}
                        placeholder="SELECIONE..."
                        disabled={!podeCriarOuEditarTarm}
                        onChange={(val) =>
                            setEditTarm({ ...editTarm, tipo_idade_paciente: val })
                        }
                    />
                    <SelectPesquisavel
                        label="Sexo"
                        opcoes={SEXOS_PACIENTE}
                        valor={editTarm.sexo_paciente || ''}
                        placeholder="SELECIONE..."
                        disabled={!podeCriarOuEditarTarm}
                        onChange={(val) =>
                            setEditTarm({ ...editTarm, sexo_paciente: val })
                        }
                    />
                </div>
            </div>

            {podeCriarOuEditarTarm && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        disabled={salvandoSecao}
                        onClick={handleSalvarTarm}
                        className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {salvandoSecao ? 'SALVANDO...' : 'SALVAR DADOS TARM'}
                    </button>
                </div>
            )}
        </div>
    )
}