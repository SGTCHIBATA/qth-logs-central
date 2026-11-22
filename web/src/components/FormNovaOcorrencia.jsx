import { PhoneCall } from 'lucide-react'
import SelectPesquisavel from './SelectPesquisavel'
import BlocoLocalizacaoRapida from './BlocoLocalizacaoRapida'
import {
    PRIORIDADES,
    NATUREZAS_ATENDIMENTO,
    TIPOS_LOCAL,
    TIPOS_VIA,
} from '../utils/painelCentralHelpers'

export default function FormNovaOcorrencia({
    formNova,
    setFormNova,
    criandoOcorrencia,
    erroNova,
    listaEstados,
    cidadesNovaUrb,
    cidadesNovaRod,
    cidadesNovaOrig,
    cidadesNovaDest,
    onSubmit,
    onDescartar,
}) {
    return (
        <form
            onSubmit={onSubmit}
            className="bg-qth-bg/80 border border-slate-700 rounded-xl p-4 space-y-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-2.5">
                <span className="text-xs font-extrabold text-white uppercase flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-qth-orange" />
                    Abertura de Ocorrência (TARM) • Rascunho Salvo Automaticamente
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase mr-1">
                        Prioridade:
                    </span>
                    {PRIORIDADES.map((prio) => {
                        const selecionada = formNova.prioridade === prio.id
                        return (
                            <button
                                key={prio.id}
                                type="button"
                                onClick={() => setFormNova({ ...formNova, prioridade: prio.id })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer transition-all ${selecionada
                                        ? prio.btnAtivo
                                        : 'bg-qth-card text-slate-300 border-slate-600 hover:border-slate-400'
                                    }`}
                            >
                                {prio.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Nº Ocorrência <span className="text-qth-orange">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="EX: 202600145"
                        value={formNova.numero_ocorrencia}
                        onChange={(e) =>
                            setFormNova({
                                ...formNova,
                                numero_ocorrencia: e.target.value.toUpperCase(),
                            })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-qth-orange uppercase focus:outline-none focus:border-qth-orange"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Nome do Solicitante
                    </label>
                    <input
                        type="text"
                        placeholder="EX: MARIA SOUZA"
                        value={formNova.solicitante_nome}
                        onChange={(e) =>
                            setFormNova({
                                ...formNova,
                                solicitante_nome: e.target.value.toUpperCase(),
                            })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Telefone do Solicitante
                    </label>
                    <input
                        type="text"
                        placeholder="EX: (44) 99999-0000"
                        value={formNova.solicitante_telefone}
                        onChange={(e) =>
                            setFormNova({ ...formNova, solicitante_telefone: e.target.value })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-qth-orange"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Nº Inicial de Vítimas
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={formNova.numero_vitimas}
                        onChange={(e) =>
                            setFormNova({ ...formNova, numero_vitimas: e.target.value })
                        }
                        className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-qth-orange"
                    />
                    {(parseInt(formNova.numero_vitimas, 10) || 1) >= 2 && (
                        <p className="text-[10px] font-extrabold text-qth-yellow mt-1 uppercase">
                            MÚLTIPLAS VÍTIMAS (2+) — REVISÃO DE IMV NA REGULAÇÃO
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Natureza da Ocorrência
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {NATUREZAS_ATENDIMENTO.map((nat) => (
                            <button
                                key={nat}
                                type="button"
                                onClick={() => setFormNova({ ...formNova, tipo_atendimento: nat })}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold uppercase border cursor-pointer transition-colors ${formNova.tipo_atendimento === nat
                                        ? 'bg-qth-orange text-white border-qth-orange'
                                        : 'bg-qth-card text-slate-300 border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                {nat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                        Tipo de Local
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {TIPOS_LOCAL.map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => setFormNova({ ...formNova, tipo_local: loc })}
                                className={`py-2 px-2 rounded-lg text-[11px] font-bold uppercase border cursor-pointer transition-colors ${formNova.tipo_local === loc
                                        ? 'bg-qth-blue text-white border-blue-400'
                                        : 'bg-qth-card text-slate-300 border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {formNova.tipo_atendimento === 'PRIMÁRIO' ? (
                <div className="bg-qth-card/70 border border-slate-700/70 rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[11px] font-bold text-qth-orange uppercase">
                            Endereço (Padrão QTH Logs):
                        </span>
                        {TIPOS_VIA.map((via) => (
                            <button
                                key={via}
                                type="button"
                                onClick={() => setFormNova({ ...formNova, tipo_via: via })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border ${formNova.tipo_via === via
                                        ? 'bg-qth-orange/25 text-orange-200 border-qth-orange'
                                        : 'bg-qth-bg text-slate-400 border-slate-700'
                                    }`}
                            >
                                {via}
                            </button>
                        ))}
                    </div>

                    <BlocoLocalizacaoRapida
                        dados={formNova}
                        setDados={setFormNova}
                        resetKey="nova-ocorrencia"
                    />

                    {formNova.tipo_via === 'Urbana' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Via 1 (Rua / Av / Hospital / UBS)
                                </label>
                                <input
                                    type="text"
                                    value={formNova.via1}
                                    onChange={(e) =>
                                        setFormNova({ ...formNova, via1: e.target.value.toUpperCase() })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Via 2 / Cruzamento
                                </label>
                                <input
                                    type="text"
                                    value={formNova.via2}
                                    onChange={(e) =>
                                        setFormNova({ ...formNova, via2: e.target.value.toUpperCase() })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    value={formNova.numero_end}
                                    onChange={(e) =>
                                        setFormNova({ ...formNova, numero_end: e.target.value.toUpperCase() })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    value={formNova.bairro}
                                    onChange={(e) =>
                                        setFormNova({ ...formNova, bairro: e.target.value.toUpperCase() })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Ponto de Referência
                                </label>
                                <input
                                    type="text"
                                    value={formNova.ponto_referencia}
                                    onChange={(e) =>
                                        setFormNova({
                                            ...formNova,
                                            ponto_referencia: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <SelectPesquisavel
                                label="UF"
                                opcoes={listaEstados}
                                valor={formNova.estado}
                                onChange={(uf) => setFormNova({ ...formNova, estado: uf, cidade_urb: '' })}
                            />
                            <SelectPesquisavel
                                label="Cidade"
                                opcoes={cidadesNovaUrb}
                                valor={formNova.cidade_urb}
                                permiteTextoLivre={true}
                                onChange={(cid) => setFormNova({ ...formNova, cidade_urb: cid })}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Prefixo Rodovia (Ex: BR / PR)
                                </label>
                                <input
                                    type="text"
                                    value={formNova.rodovia_jurisdicao}
                                    onChange={(e) =>
                                        setFormNova({
                                            ...formNova,
                                            rodovia_jurisdicao: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Código (Ex: 323 / 482)
                                </label>
                                <input
                                    type="text"
                                    value={formNova.rodovia_codigo}
                                    onChange={(e) =>
                                        setFormNova({
                                            ...formNova,
                                            rodovia_codigo: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Marco KM
                                </label>
                                <input
                                    type="text"
                                    value={formNova.rodovia_km}
                                    onChange={(e) =>
                                        setFormNova({ ...formNova, rodovia_km: e.target.value })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                    Ponto de Referência
                                </label>
                                <input
                                    type="text"
                                    value={formNova.ponto_referencia}
                                    onChange={(e) =>
                                        setFormNova({
                                            ...formNova,
                                            ponto_referencia: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                                />
                            </div>
                            <SelectPesquisavel
                                label="UF Rodovia"
                                opcoes={listaEstados}
                                valor={formNova.rodovia_uf}
                                onChange={(uf) =>
                                    setFormNova({ ...formNova, rodovia_uf: uf, rodovia_cidade: '' })
                                }
                            />
                            <SelectPesquisavel
                                label="Município Rodovia"
                                opcoes={cidadesNovaRod}
                                valor={formNova.rodovia_cidade}
                                permiteTextoLivre={true}
                                onChange={(cid) => setFormNova({ ...formNova, rodovia_cidade: cid })}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-qth-card/70 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                        <p className="text-[11px] font-extrabold text-qth-orange uppercase">
                            Origem da Transferência
                        </p>
                        <input
                            type="text"
                            placeholder="INSTITUIÇÃO / LOCAL DE ORIGEM"
                            value={formNova.origem_instituicao}
                            onChange={(e) =>
                                setFormNova({
                                    ...formNova,
                                    origem_instituicao: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="RUA / AVENIDA"
                                value={formNova.origem_rua}
                                onChange={(e) =>
                                    setFormNova({ ...formNova, origem_rua: e.target.value.toUpperCase() })
                                }
                                className="sm:col-span-2 bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                            <input
                                type="text"
                                placeholder="Nº"
                                value={formNova.origem_numero}
                                onChange={(e) =>
                                    setFormNova({
                                        ...formNova,
                                        origem_numero: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="BAIRRO"
                                value={formNova.origem_bairro}
                                onChange={(e) =>
                                    setFormNova({
                                        ...formNova,
                                        origem_bairro: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                            <SelectPesquisavel
                                label="UF"
                                opcoes={listaEstados}
                                valor={formNova.origem_uf}
                                onChange={(uf) =>
                                    setFormNova({ ...formNova, origem_uf: uf, origem_cidade: '' })
                                }
                            />
                            <SelectPesquisavel
                                label="Cidade"
                                opcoes={cidadesNovaOrig}
                                valor={formNova.origem_cidade}
                                permiteTextoLivre={true}
                                onChange={(cid) => setFormNova({ ...formNova, origem_cidade: cid })}
                            />
                        </div>
                    </div>

                    <div className="bg-qth-card/70 border border-slate-700/70 rounded-xl p-3 space-y-2.5">
                        <p className="text-[11px] font-extrabold text-qth-orange uppercase">
                            Destino da Transferência
                        </p>
                        <input
                            type="text"
                            placeholder="INSTITUIÇÃO / LOCAL DE DESTINO"
                            value={formNova.destino_instituicao}
                            onChange={(e) =>
                                setFormNova({
                                    ...formNova,
                                    destino_instituicao: e.target.value.toUpperCase(),
                                })
                            }
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="RUA / AVENIDA"
                                value={formNova.destino_rua}
                                onChange={(e) =>
                                    setFormNova({
                                        ...formNova,
                                        destino_rua: e.target.value.toUpperCase(),
                                    })
                                }
                                className="sm:col-span-2 bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                            <input
                                type="text"
                                placeholder="Nº"
                                value={formNova.destino_numero}
                                onChange={(e) =>
                                    setFormNova({
                                        ...formNova,
                                        destino_numero: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="BAIRRO"
                                value={formNova.destino_bairro}
                                onChange={(e) =>
                                    setFormNova({
                                        ...formNova,
                                        destino_bairro: e.target.value.toUpperCase(),
                                    })
                                }
                                className="bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
                            />
                            <SelectPesquisavel
                                label="UF"
                                opcoes={listaEstados}
                                valor={formNova.destino_uf}
                                onChange={(uf) =>
                                    setFormNova({ ...formNova, destino_uf: uf, destino_cidade: '' })
                                }
                            />
                            <SelectPesquisavel
                                label="Cidade"
                                opcoes={cidadesNovaDest}
                                valor={formNova.destino_cidade}
                                permiteTextoLivre={true}
                                onChange={(cid) => setFormNova({ ...formNova, destino_cidade: cid })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                    Motivo da Ocorrência <span className="text-qth-orange">*</span>
                </label>
                <input
                    type="text"
                    required
                    placeholder="EX: QUEDA DE ALTURA / DOR TORÁCICA / TRANSFERÊNCIA UTI..."
                    value={formNova.motivo}
                    onChange={(e) =>
                        setFormNova({ ...formNova, motivo: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                />
            </div>

            {erroNova && (
                <p className="text-xs text-red-400 bg-qth-red/15 border border-qth-red/40 p-2 rounded-lg">
                    {erroNova}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onDescartar}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                >
                    DESCARTAR E FECHAR
                </button>
                <button
                    type="submit"
                    disabled={criandoOcorrencia}
                    className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                    {criandoOcorrencia ? 'CRIANDO...' : 'CRIAR OCORRÊNCIA'}
                </button>
            </div>
        </form>
    )
}