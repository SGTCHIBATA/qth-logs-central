import { useState, useEffect } from 'react'
import { Compass, Navigation, Loader2, MapPin } from 'lucide-react'
import {
    NOME_PARA_UF,
    normalizarSemAcento,
    extrairLatLngDeTexto,
    construirUrlRota,
} from '../utils/painelCentralHelpers'

export default function BlocoLocalizacaoRapida({
    dados,
    setDados,
    desabilitado = false,
    resetKey = '',
}) {
    const [buscando, setBuscando] = useState(false)
    const [aviso, setAviso] = useState('')

    useEffect(() => {
        setAviso('')
    }, [resetKey, dados?.tipo_via])

    async function executarPreenchimentoPorGeo() {
        setAviso('')
        const coordStr = (dados.coordenadas || '').trim()
        const linkStr = (dados.link_localizacao || '').trim()

        if (!coordStr && !linkStr) {
            setAviso('Informe coordenadas ou cole um link de localização primeiro.')
            return
        }

        const extraido = extrairLatLngDeTexto(coordStr) || extrairLatLngDeTexto(linkStr)
        if (!extraido) {
            setAviso(
                'Link encurtado ou sem coordenadas explícitas na URL: o link ficou salvo e o botão de rota usará o link diretamente.'
            )
            return
        }

        const coordFormatada = `${extraido.lat}, ${extraido.lng}`
        setDados((prev) => ({
            ...prev,
            coordenadas: prev.coordenadas?.trim() ? prev.coordenadas : coordFormatada,
            latitude: extraido.lat,
            longitude: extraido.lng,
        }))

        setBuscando(true)
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${extraido.lat}&lon=${extraido.lng}&accept-language=pt-BR`,
                { headers: { Accept: 'application/json' } }
            )
            if (!resp.ok) throw new Error('Falha na consulta')
            const json = await resp.json()
            const addr = json?.address || {}

            const ufDetectada =
                NOME_PARA_UF[normalizarSemAcento(addr.state)] ||
                (addr['ISO3166-2-lvl4'] || '').split('-')[1]?.toUpperCase() ||
                ''
            const cidadeDetectada = (
                addr.city ||
                addr.town ||
                addr.village ||
                addr.municipality ||
                ''
            ).toUpperCase()
            const viaDetectada = (addr.road || addr.pedestrian || addr.highway || '').toUpperCase()
            const numeroDetectado = (addr.house_number || '').toUpperCase()
            const bairroDetectado = (
                addr.suburb ||
                addr.neighbourhood ||
                addr.quarter ||
                addr.city_district ||
                ''
            ).toUpperCase()
            const refDetectada = (
                addr.amenity ||
                addr.building ||
                addr.shop ||
                addr.hamlet ||
                ''
            ).toUpperCase()

            const camposFaltantes = []

            if (dados.tipo_via === 'Rodovia/Rural') {
                const matchRod = viaDetectada.match(
                    /\b(BR|PR|SP|SC|RS|MS|MT|GO|MG|RJ|BA|PE|CE|PA)\s*-?\s*(\d{2,3})\b/
                )
                const jurisdicao = matchRod ? matchRod[1] : ''
                const codigo = matchRod ? matchRod[2] : ''
                if (!jurisdicao && !codigo) camposFaltantes.push('Prefixo/Código da Rodovia')
                camposFaltantes.push('Marco KM')
                if (!cidadeDetectada) camposFaltantes.push('Município')

                setDados((prev) => ({
                    ...prev,
                    coordenadas: coordFormatada,
                    latitude: extraido.lat,
                    longitude: extraido.lng,
                    rodovia_jurisdicao: jurisdicao || prev.rodovia_jurisdicao,
                    rodovia_codigo: codigo || prev.rodovia_codigo,
                    rodovia_uf: ufDetectada || prev.rodovia_uf,
                    rodovia_cidade: cidadeDetectada || prev.rodovia_cidade,
                    ponto_referencia:
                        prev.ponto_referencia ||
                        refDetectada ||
                        (!matchRod && viaDetectada ? viaDetectada : ''),
                }))
            } else {
                if (!viaDetectada) camposFaltantes.push('Via 1')
                if (!numeroDetectado) camposFaltantes.push('Número')
                if (!bairroDetectado) camposFaltantes.push('Bairro')
                if (!cidadeDetectada) camposFaltantes.push('Cidade')

                setDados((prev) => ({
                    ...prev,
                    coordenadas: coordFormatada,
                    latitude: extraido.lat,
                    longitude: extraido.lng,
                    via1: viaDetectada || prev.via1,
                    numero_end: numeroDetectado || prev.numero_end,
                    bairro: bairroDetectado || prev.bairro,
                    estado: ufDetectada || prev.estado,
                    cidade_urb: cidadeDetectada || prev.cidade_urb,
                    ponto_referencia: prev.ponto_referencia || refDetectada,
                }))
            }

            if (camposFaltantes.length > 0) {
                setAviso(
                    `Endereço aproximado preenchido (${coordFormatada}). Campos sem dado exato (${camposFaltantes.join(', ')}) usarão as coordenadas GPS diretamente na rota.`
                )
            } else {
                setAviso(`Endereço aproximado preenchido com sucesso a partir de ${coordFormatada}.`)
            }
        } catch {
            setAviso(
                `Coordenadas (${coordFormatada}) salvas. Não foi possível consultar o endereço aproximado agora, mas o botão de rota já navega direto pelas coordenadas.`
            )
        } finally {
            setBuscando(false)
        }
    }

    const urlRotaPreview = construirUrlRota(dados)
    const temEntradaGeo = Boolean(
        (dados.coordenadas || '').trim() || (dados.link_localizacao || '').trim()
    )

    return (
        <div className="bg-sky-950/30 border-2 border-dashed border-sky-500/60 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-sky-300 uppercase flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    Localização Rápida (Coordenadas GPS / Link WhatsApp)
                </span>

                <div className="flex flex-wrap items-center gap-2">
                    {urlRotaPreview && (
                        <a
                            href={urlRotaPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-qth-blue hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            ABRIR ROTA / GPS
                        </a>
                    )}

                    <button
                        type="button"
                        disabled={desabilitado || buscando || !temEntradaGeo}
                        onClick={executarPreenchimentoPorGeo}
                        className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        {buscando ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <MapPin className="w-3.5 h-3.5" />
                        )}
                        {buscando ? 'BUSCANDO ENDEREÇO...' : 'PREENCHER ENDEREÇO'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                    <label className="block text-[10px] font-bold text-sky-200 mb-1 uppercase">
                        Coordenadas (Latitude, Longitude)
                    </label>
                    <input
                        type="text"
                        disabled={desabilitado}
                        placeholder="EX: -23.766120, -53.325040"
                        value={dados.coordenadas || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            const parsed = extrairLatLngDeTexto(val)
                            setDados({
                                ...dados,
                                coordenadas: val,
                                latitude: parsed ? parsed.lat : null,
                                longitude: parsed ? parsed.lng : null,
                            })
                        }}
                        className="w-full bg-slate-950/90 border border-sky-500/60 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-sky-100 placeholder-sky-500/60 focus:outline-none focus:border-sky-300 disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-sky-200 mb-1 uppercase">
                        Link de Localização (Google Maps / Waze / WhatsApp)
                    </label>
                    <input
                        type="text"
                        disabled={desabilitado}
                        placeholder="COLE AQUI O LINK ENVIADO PELO SOLICITANTE"
                        value={dados.link_localizacao || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            const parsed = extrairLatLngDeTexto(val)
                            setDados({
                                ...dados,
                                link_localizacao: val,
                                latitude: parsed ? parsed.lat : dados.latitude,
                                longitude: parsed ? parsed.lng : dados.longitude,
                            })
                        }}
                        className="w-full bg-slate-950/90 border border-sky-500/60 rounded-lg px-3 py-2 text-xs font-semibold text-sky-100 placeholder-sky-500/60 focus:outline-none focus:border-sky-300 disabled:opacity-60"
                    />
                </div>
            </div>

            {aviso && (
                <p className="text-[11px] text-sky-200 bg-sky-900/40 border border-sky-500/40 px-2.5 py-1.5 rounded-lg">
                    {aviso}
                </p>
            )}
        </div>
    )
}