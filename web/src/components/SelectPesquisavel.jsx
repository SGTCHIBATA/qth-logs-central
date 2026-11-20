import { useState, useEffect, useRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'

export default function SelectPesquisavel({
    label,
    opcoes = [],
    valor = '',
    onChange,
    permiteTextoLivre = false,
    placeholder = 'PESQUISAR...',
    disabled = false,
    required = false,
}) {
    const [aberto, setAberto] = useState(false)
    const [busca, setBusca] = useState(valor ? String(valor).toUpperCase() : '')
    const [indiceDestaque, setIndiceDestaque] = useState(-1)
    const containerRef = useRef(null)
    const listaRef = useRef(null)
    const menuId = useId()

    useEffect(() => {
        setBusca(valor ? String(valor).toUpperCase() : '')
    }, [valor])

    const opcoesFormatadas = opcoes.map((o) => String(o).toUpperCase())
    const filtradas = opcoesFormatadas.filter((o) =>
        o.includes(busca.toUpperCase())
    )

    useEffect(() => {
        if (!aberto) {
            setIndiceDestaque(-1)
            return
        }
        const idxValorAtual = filtradas.findIndex(
            (o) => o === String(valor).toUpperCase()
        )
        setIndiceDestaque(idxValorAtual >= 0 ? idxValorAtual : filtradas.length > 0 ? 0 : -1)
    }, [aberto, busca])

    useEffect(() => {
        if (!aberto || indiceDestaque < 0 || !listaRef.current) return
        const itemEl = listaRef.current.children[indiceDestaque]
        if (itemEl) {
            itemEl.scrollIntoView({ block: 'nearest' })
        }
    }, [indiceDestaque, aberto])

    useEffect(() => {
        function handleClickFora(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                if (aberto) fecharEValidar()
            }
        }

        function handleFecharOutros(e) {
            if (e.detail?.originId !== menuId && aberto) {
                fecharEValidar()
            }
        }

        document.addEventListener('mousedown', handleClickFora)
        window.addEventListener('qth-fechar-menus', handleFecharOutros)
        return () => {
            document.removeEventListener('mousedown', handleClickFora)
            window.removeEventListener('qth-fechar-menus', handleFecharOutros)
        }
    })

    function abrirMenu() {
        if (disabled) return
        window.dispatchEvent(
            new CustomEvent('qth-fechar-menus', { detail: { originId: menuId } })
        )
        setAberto(true)
    }

    function fecharEValidar() {
        setAberto(false)
        setIndiceDestaque(-1)
        const textoLimpo = busca.trim().toUpperCase()

        if (permiteTextoLivre) {
            if (textoLimpo !== String(valor).toUpperCase()) {
                onChange(textoLimpo)
            }
            return
        }

        const match = opcoesFormatadas.find((o) => o === textoLimpo)
        if (match) {
            onChange(match)
            setBusca(match)
        } else if (textoLimpo === '') {
            onChange('')
            setBusca('')
        } else {
            setBusca(valor ? String(valor).toUpperCase() : '')
        }
    }

    function selecionarOpcao(opcao) {
        setBusca(opcao)
        onChange(opcao)
        setAberto(false)
        setIndiceDestaque(-1)
    }

    function handleKeyDown(e) {
        if (disabled) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!aberto) {
                abrirMenu()
                return
            }
            if (filtradas.length > 0) {
                setIndiceDestaque((prev) =>
                    prev < filtradas.length - 1 ? prev + 1 : 0
                )
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!aberto) {
                abrirMenu()
                return
            }
            if (filtradas.length > 0) {
                setIndiceDestaque((prev) =>
                    prev > 0 ? prev - 1 : filtradas.length - 1
                )
            }
        } else if (e.key === 'Enter') {
            if (aberto && indiceDestaque >= 0 && filtradas[indiceDestaque]) {
                e.preventDefault()
                selecionarOpcao(filtradas[indiceDestaque])
            } else if (aberto) {
                e.preventDefault()
                fecharEValidar()
            }
        } else if (e.key === 'Escape') {
            if (aberto) {
                e.preventDefault()
                fecharEValidar()
            }
        } else if (e.key === 'Tab') {
            if (aberto) {
                fecharEValidar()
            }
        }
    }

    return (
        <div
            ref={containerRef}
            data-qth-interactive="true"
            className={`relative w-full ${aberto ? 'z-50' : 'z-10'}`}
        >
            {label && (
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                    {label} {required && <span className="text-qth-orange">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    disabled={disabled}
                    required={required}
                    value={busca}
                    placeholder={placeholder}
                    onFocus={abrirMenu}
                    onClick={abrirMenu}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        const upper = e.target.value.toUpperCase()
                        setBusca(upper)
                        if (!aberto) abrirMenu()
                        if (permiteTextoLivre) {
                            onChange(upper)
                        }
                    }}
                    className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange disabled:opacity-50 transition-colors"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {aberto && !disabled && filtradas.length > 0 && (
                <ul
                    ref={listaRef}
                    className="absolute z-[9999] mt-1 w-full max-h-48 overflow-y-auto bg-qth-card border border-slate-600 rounded-lg shadow-2xl divide-y divide-slate-700/50"
                >
                    {filtradas.map((opt, idx) => {
                        const selecionado = opt === String(valor).toUpperCase()
                        const destacado = idx === indiceDestaque

                        return (
                            <li
                                key={opt}
                                onMouseEnter={() => setIndiceDestaque(idx)}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    selecionarOpcao(opt)
                                }}
                                className={`px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                    destacado
                                        ? 'bg-qth-orange text-white'
                                        : selecionado
                                            ? 'bg-qth-orange/30 text-white'
                                            : 'text-slate-200 hover:bg-slate-700/80'
                                }`}
                            >
                                {opt}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}