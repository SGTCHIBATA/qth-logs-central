import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Check, X, Search } from 'lucide-react'

export default function FiltroMultiSelecao({
    label = '',
    opcoes = [],
    valores = [],
    onChange,
    placeholderVazio = 'TODAS',
    formatarOpcao,
    habilitarBuscaAcimaDe = 8,
}) {
    const [aberto, setAberto] = useState(false)
    const [buscaOpcao, setBuscaOpcao] = useState('')
    const containerRef = useRef(null)

    const selecionados = useMemo(
        () => (Array.isArray(valores) ? valores : []),
        [valores]
    )

    useEffect(() => {
        function handleClickFora(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setAberto(false)
            }
        }
        document.addEventListener('mousedown', handleClickFora)
        return () => document.removeEventListener('mousedown', handleClickFora)
    }, [])

    function obterTextoOpcao(op) {
        if (typeof formatarOpcao === 'function') return formatarOpcao(op)
        if (op && typeof op === 'object') return String(op.label ?? op.value ?? '')
        return String(op ?? '')
    }

    function obterValorOpcao(op) {
        if (op && typeof op === 'object') return String(op.value ?? op.label ?? '')
        return String(op ?? '')
    }

    const opcoesFiltradas = useMemo(() => {
        const q = buscaOpcao.trim().toUpperCase()
        if (!q) return opcoes || []
        return (opcoes || []).filter((op) =>
            obterTextoOpcao(op).toUpperCase().includes(q)
        )
    }, [opcoes, buscaOpcao])

    function alternarValor(val) {
        if (!val) return
        const existe = selecionados.includes(val)
        const proximo = existe
            ? selecionados.filter((item) => item !== val)
            : [...selecionados, val]
        onChange?.(proximo)
    }

    function limparCategoria(e) {
        e.stopPropagation()
        onChange?.([])
    }

    const resumoBotao = useMemo(() => {
        if (selecionados.length === 0) return placeholderVazio
        if (selecionados.length === 1) {
            const achada = (opcoes || []).find((op) => obterValorOpcao(op) === selecionados[0])
            return achada ? obterTextoOpcao(achada) : selecionados[0]
        }
        return `${selecionados.length} SELECIONADOS`
    }, [selecionados, opcoes, placeholderVazio])

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-extrabold text-slate-300 uppercase">
                        {label}
                    </label>
                    {selecionados.length > 0 && (
                        <button
                            type="button"
                            onClick={limparCategoria}
                            className="text-[9px] font-bold text-qth-orange hover:underline uppercase cursor-pointer"
                        >
                            LIMPAR ({selecionados.length})
                        </button>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={() => setAberto((prev) => !prev)}
                className={`w-full bg-qth-card border rounded-lg px-2.5 py-2 text-xs font-bold uppercase flex items-center justify-between gap-2 cursor-pointer transition-colors ${selecionados.length > 0
                    ? 'border-qth-orange text-white'
                    : 'border-slate-600 text-slate-200 hover:border-slate-500'
                    }`}
            >
                <span className="truncate text-left">{resumoBotao}</span>
                <div className="flex items-center gap-1 shrink-0">
                    {selecionados.length > 0 && (
                        <span
                            onClick={limparCategoria}
                            title="Limpar seleção desta categoria"
                            className="p-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </button>

            {aberto && (
                <div className="absolute z-40 mt-1 w-full min-w-[210px] bg-qth-card border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                    {(opcoes || []).length > habilitarBuscaAcimaDe && (
                        <div className="p-2 border-b border-slate-700/80 bg-qth-bg/70 relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={buscaOpcao}
                                onChange={(e) => setBuscaOpcao(e.target.value)}
                                placeholder="FILTRAR OPÇÕES..."
                                className="w-full bg-qth-card border border-slate-600 rounded-md pl-7 pr-2 py-1 text-[11px] text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange"
                            />
                        </div>
                    )}

                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {opcoesFiltradas.length === 0 ? (
                            <p className="text-[11px] text-slate-400 text-center py-3 uppercase">
                                NENHUMA OPÇÃO
                            </p>
                        ) : (
                            opcoesFiltradas.map((op) => {
                                const val = obterValorOpcao(op)
                                const texto = obterTextoOpcao(op)
                                const marcado = selecionados.includes(val)

                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => alternarValor(val)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold uppercase flex items-center justify-between gap-2 cursor-pointer transition-colors ${marcado
                                            ? 'bg-qth-orange/25 text-white border border-qth-orange/60'
                                            : 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
                                            }`}
                                    >
                                        <span className="truncate">{texto}</span>
                                        <span
                                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${marcado
                                                ? 'bg-qth-orange border-qth-orange text-white'
                                                : 'border-slate-500 bg-qth-bg/60'
                                                }`}
                                        >
                                            {marcado && <Check className="w-3 h-3 stroke-[3]" />}
                                        </span>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {selecionados.length > 0 && (
                        <div className="px-2.5 py-1.5 bg-qth-bg/80 border-t border-slate-700/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-bold uppercase">
                                {selecionados.length} ATIVO(S)
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange?.([])}
                                className="text-qth-orange font-extrabold hover:underline uppercase cursor-pointer"
                            >
                                LIMPAR
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}