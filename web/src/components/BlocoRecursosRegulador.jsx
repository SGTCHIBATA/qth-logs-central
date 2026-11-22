import { useState } from 'react'
import { Plus, Trash2, Stethoscope, UserCheck } from 'lucide-react'
import SelectPesquisavel from './SelectPesquisavel'
import { RECURSOS_INDICADOS } from '../utils/painelCentralHelpers'

export default function BlocoRecursosRegulador({
    recursosSolicitados = [],
    onChange,
    pacientesDisponiveis = [],
    disabled = false,
}) {
    const lista = Array.isArray(recursosSolicitados) ? recursosSolicitados : []

    const [novoRecurso, setNovoRecurso] = useState('')
    const [novaQuantidade, setNovaQuantidade] = useState(1)
    const [novoPacienteId, setNovoPacienteId] = useState('')

    const opcoesPacientes = [
        { value: '', label: 'GERAL / SEM PACIENTE ESPECÍFICO' },
        ...pacientesDisponiveis.map((p) => ({
            value: p.id,
            label: `${p.nome}${p.cor_start ? ` [${p.cor_start}]` : ''}${p.vtrPrefixo ? ` • ${p.vtrPrefixo}` : ''}`,
        })),
    ]

    function adicionarSolicitacao() {
        if (disabled) return
        const recursoLimpo = (novoRecurso || '').trim().toUpperCase()
        if (!recursoLimpo) return

        const qtdLimpa = Math.max(1, parseInt(novaQuantidade, 10) || 1)
        const pacObj = pacientesDisponiveis.find((p) => p.id === novoPacienteId) || null

        const novoItem = {
            id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            recurso: recursoLimpo,
            quantidade: qtdLimpa,
            paciente_id: pacObj ? pacObj.id : '',
            paciente_nome: pacObj ? pacObj.nome : '',
            paciente_info: pacObj
                ? {
                    nome: pacObj.nome || '',
                    idade: pacObj.idade || '',
                    tipo_idade: pacObj.tipo_idade || '',
                    sexo: pacObj.sexo || '',
                    cor_start: pacObj.cor_start || '',
                    destino: pacObj.destino || '',
                    quadro_clinico: pacObj.quadro_clinico || '',
                    vtr_origem: pacObj.vtrPrefixo || '',
                }
                : null,
            atendido: false,
            viaturas_vinculadas: [],
        }

        onChange([...lista, novoItem])
        setNovoRecurso('')
        setNovaQuantidade(1)
        setNovoPacienteId('')
    }

    function atualizarItem(id, patch) {
        if (disabled) return
        onChange(
            lista.map((item) => {
                if (item.id !== id) return item
                const proximo = { ...item, ...(typeof patch === 'function' ? patch(item) : patch) }
                if ('paciente_id' in (typeof patch === 'function' ? patch(item) : patch)) {
                    const pacObj =
                        pacientesDisponiveis.find((p) => p.id === proximo.paciente_id) || null
                    proximo.paciente_nome = pacObj ? pacObj.nome : ''
                    proximo.paciente_info = pacObj
                        ? {
                            nome: pacObj.nome || '',
                            idade: pacObj.idade || '',
                            tipo_idade: pacObj.tipo_idade || '',
                            sexo: pacObj.sexo || '',
                            cor_start: pacObj.cor_start || '',
                            destino: pacObj.destino || '',
                            quadro_clinico: pacObj.quadro_clinico || '',
                            vtr_origem: pacObj.vtrPrefixo || '',
                        }
                        : null
                }
                return proximo
            })
        )
    }

    function removerItem(id) {
        if (disabled) return
        onChange(lista.filter((item) => item.id !== id))
    }

    return (
        <div className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
                <div>
                    <h4 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        Solicitação de Recursos para Despacho (Regulador → Rádio Operador)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        Defina quais e quantos recursos destinar e, se desejar, vincule a um paciente específico para identificação na chegada.
                    </p>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                    {lista.length} SOLICITAÇÃO(ÕES)
                </span>
            </div>

            {!disabled && (
                <div className="bg-qth-card/80 border border-slate-700 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4">
                        <SelectPesquisavel
                            label="Recurso Solicitado"
                            opcoes={RECURSOS_INDICADOS}
                            valor={novoRecurso}
                            permiteTextoLivre={true}
                            placeholder="EX: USB, USA, VIR..."
                            onChange={(val) => setNovoRecurso((val || '').toUpperCase())}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Quantidade
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={novaQuantidade}
                            onChange={(e) => setNovaQuantidade(e.target.value)}
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Paciente Específico (Opcional)
                        </label>
                        <select
                            value={novoPacienteId}
                            onChange={(e) => setNovoPacienteId(e.target.value)}
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                        >
                            {opcoesPacientes.map((op) => (
                                <option key={op.value || 'geral'} value={op.value}>
                                    {op.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            type="button"
                            disabled={!(novoRecurso || '').trim()}
                            onClick={adicionarSolicitacao}
                            className="w-full bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            DESTINAR
                        </button>
                    </div>
                </div>
            )}

            {lista.length === 0 ? (
                <p className="text-xs text-slate-400">
                    Nenhum recurso estruturado solicitado ainda. Adicione recurso, quantidade e paciente (opcional).
                </p>
            ) : (
                <div className="space-y-2">
                    {lista.map((item) => {
                        const pacDetalhe = item.paciente_info
                        return (
                            <div
                                key={item.id}
                                className="bg-qth-card border border-slate-700 rounded-lg p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-qth-orange/20 text-qth-orange border border-qth-orange/40 uppercase">
                                            {item.quantidade || 1}x {item.recurso}
                                        </span>
                                        {item.atendido && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                                                ATENDIDO
                                            </span>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <select
                                            disabled={disabled}
                                            value={item.paciente_id || ''}
                                            onChange={(e) => atualizarItem(item.id, { paciente_id: e.target.value })}
                                            className="w-full bg-qth-bg/80 border border-slate-600 rounded px-2.5 py-1.5 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                        >
                                            {opcoesPacientes.map((op) => (
                                                <option key={op.value || 'geral'} value={op.value}>
                                                    {op.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between lg:justify-end gap-2">
                                    {pacDetalhe?.nome ? (
                                        <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1 uppercase">
                                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                            {pacDetalhe.nome}
                                            {pacDetalhe.idade
                                                ? ` (${pacDetalhe.idade}${pacDetalhe.tipo_idade ? ` ${pacDetalhe.tipo_idade}` : ''})`
                                                : ''}
                                            {pacDetalhe.cor_start ? ` • ${pacDetalhe.cor_start}` : ''}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            SEM PACIENTE ESPECÍFICO
                                        </span>
                                    )}

                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => removerItem(item.id)}
                                            className="p-1.5 rounded bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white cursor-pointer"
                                            title="Remover solicitação"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}