import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import cidadesData from '../data/cidades.json'
import {
    Radio,
    Plus,
    Search,
    RotateCcw,
    X,
    AlertTriangle,
    Truck,
    Stethoscope,
    PhoneCall,
    ClipboardList,
    CheckCircle2,
    Lock,
    Clock,
    MapPin,
    Users,
    Save,
    Send,
    Trash2,
    Compass,
    Navigation,
    Loader2,
    ShieldAlert,
    UserPlus,
    FileText,
    Layers,
} from 'lucide-react'

const PRIORIDADES = [
    {
        id: 'BAIXA',
        label: 'BAIXA',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
        card: 'border-slate-700/80 hover:border-sky-500/60',
        btnAtivo: 'bg-sky-600 text-white border-sky-400',
    },
    {
        id: 'MEDIA',
        label: 'MÉDIA',
        badge: 'bg-qth-yellow/20 text-yellow-300 border-qth-yellow/50',
        card: 'border-qth-yellow/50 hover:border-qth-yellow',
        btnAtivo: 'bg-yellow-500 text-black border-yellow-300',
    },
    {
        id: 'ALTA',
        label: 'ALTA',
        badge: 'bg-qth-orange/25 text-orange-300 border-qth-orange',
        card: 'border-qth-orange/80 hover:border-qth-orange',
        btnAtivo: 'bg-qth-orange text-white border-orange-300',
    },
    {
        id: 'CRITICA',
        label: 'CRÍTICA / EMERGÊNCIA',
        badge: 'bg-qth-red/30 text-red-200 border-qth-red animate-pulse',
        card: 'border-qth-red bg-qth-red/10 shadow-lg shadow-qth-red/15 hover:border-red-400',
        btnAtivo: 'bg-qth-red text-white border-red-300',
    },
]

const CORES_START = [
    {
        id: 'VERMELHO',
        label: 'VERMELHO',
        chip: 'bg-red-600/25 text-red-200 border-red-500/60',
        btn: 'bg-red-600 hover:bg-red-500 text-white',
    },
    {
        id: 'AMARELO',
        label: 'AMARELO',
        chip: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/60',
        btn: 'bg-yellow-500 hover:bg-yellow-400 text-black',
    },
    {
        id: 'VERDE',
        label: 'VERDE',
        chip: 'bg-emerald-600/25 text-emerald-200 border-emerald-500/60',
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    {
        id: 'PRETO',
        label: 'PRETO',
        chip: 'bg-slate-700/60 text-slate-200 border-slate-500/60',
        btn: 'bg-slate-700 hover:bg-slate-600 text-white',
    },
]

const CORES_VAZIAS = {
    VERMELHO: 0,
    AMARELO: 0,
    VERDE: 0,
    PRETO: 0,
}

const SUB_ABAS_STATUS = [
    { id: 'RESUMO_GERAL', label: 'RESUMO GERAL' },
    { id: 'PENDENTE', label: 'PENDENTES' },
    { id: 'DESPACHADA', label: 'DESPACHADAS' },
    { id: 'EM_ANDAMENTO', label: 'EM ANDAMENTO' },
    { id: 'FINALIZADA', label: 'FINALIZADAS' },
    { id: 'CANCELADA', label: 'CANCELADAS / QTA' },
]

const STATUS_OCORRENCIA_OPCOES = [
    'PENDENTE',
    'DESPACHADA',
    'EM_ANDAMENTO',
    'FINALIZADA',
    'CANCELADA',
]

const NATUREZAS_ATENDIMENTO = ['PRIMÁRIO', 'TRANSFERÊNCIA']
const TIPOS_LOCAL = ['DOMICÍLIO', 'VIA PÚBLICA', 'ESTABELECIMENTO']
const TIPOS_VIA = ['Urbana', 'Rodovia/Rural']
const TIPOS_IDADE = ['Anos', 'Meses', 'Dias']
const SEXOS_PACIENTE = ['Masculino', 'Feminino']
const CLASSIFICACOES_RISCO = ['AZUL', 'VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']
const RECURSOS_INDICADOS = [
    'USB',
    'USA',
    'MOTOLANCIA',
    'AEROMEDICO',
    'APOIO / DEFESA CIVIL',
    'ORIENTAÇÃO MÉDICA',
]

const CODIGOS_J = [
    'J01 - SEM VÍTIMA NO LOCAL',
    'J02 - RECUSA DE ATENDIMENTO / REMOÇÃO',
    'J03 - ATENDIDO NO LOCAL SEM REMOÇÃO',
    'J04 - REMOÇÃO PARA UNIDADE DE SAÚDE',
    'J05 - ÓBITO NO LOCAL',
    'J06 - ÓBITO DURANTE ATENDIMENTO / TRANSPORTE',
    'J11 - OCORRÊNCIA CANCELADA / DISPENSADA',
]

const CODIGOS_QTA = [
    'QTA - SEM ALTERAÇÃO / NADA CONSTATADO',
    'QTA 01 - DISPENSADO PELO SOLICITANTE',
    'QTA 02 - ENDEREÇO NÃO LOCALIZADO',
    'QTA 03 - ATENDIDO POR OUTRO RECURSO',
    'QTA 04 - TROTE / CHAMADO INDEVIDO',
]

const STATUS_EMPENHO_VTR = [
    'ACIONADA',
    'EMPENHADA',
    'QTI',
    'NO QTH',
    'QTI UNIDADE SAUDE',
    'NA UNIDADE SAUDE',
    'QTI BASE QAP',
    'QTA',
]

const FORM_NOVA_OCORRENCIA = {
    numero_ocorrencia: '',
    prioridade: 'MEDIA',
    solicitante_nome: '',
    solicitante_telefone: '',
    numero_vitimas: '1',
    tipo_atendimento: 'PRIMÁRIO',
    tipo_local: 'DOMICÍLIO',
    tipo_via: 'Urbana',
    coordenadas: '',
    latitude: null,
    longitude: null,
    link_localizacao: '',
    via1: '',
    via2: '',
    numero_end: '',
    bairro: '',
    ponto_referencia: '',
    estado: 'PR',
    cidade_urb: '',
    rodovia_jurisdicao: '',
    rodovia_codigo: '',
    rodovia_km: '',
    rodovia_uf: 'PR',
    rodovia_cidade: '',
    origem_instituicao: '',
    origem_rua: '',
    origem_numero: '',
    origem_bairro: '',
    origem_uf: 'PR',
    origem_cidade: '',
    destino_instituicao: '',
    destino_rua: '',
    destino_numero: '',
    destino_bairro: '',
    destino_uf: 'PR',
    destino_cidade: '',
    motivo: '',
}

const NOME_PARA_UF = {
    ACRE: 'AC',
    ALAGOAS: 'AL',
    AMAPA: 'AP',
    AMAZONAS: 'AM',
    BAHIA: 'BA',
    CEARA: 'CE',
    'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES',
    GOIAS: 'GO',
    MARANHAO: 'MA',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG',
    PARA: 'PA',
    PARAIBA: 'PB',
    PARANA: 'PR',
    PERNAMBUCO: 'PE',
    PIAUI: 'PI',
    'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS',
    RONDONIA: 'RO',
    RORAIMA: 'RR',
    'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP',
    SERGIPE: 'SE',
    TOCANTINS: 'TO',
}

function normalizarCoresVtr(raw) {
    let obj = raw
    if (typeof raw === 'string') {
        try {
            obj = JSON.parse(raw)
        } catch {
            obj = {}
        }
    }
    return {
        VERMELHO: Math.max(0, parseInt(obj?.VERMELHO, 10) || 0),
        AMARELO: Math.max(0, parseInt(obj?.AMARELO, 10) || 0),
        VERDE: Math.max(0, parseInt(obj?.VERDE, 10) || 0),
        PRETO: Math.max(0, parseInt(obj?.PRETO, 10) || 0),
    }
}

function somarCoresVtr(cores) {
    const c = normalizarCoresVtr(cores)
    return c.VERMELHO + c.AMARELO + c.VERDE + c.PRETO
}

function normalizarPacientesVtr(raw) {
    let lista = raw
    if (typeof raw === 'string') {
        try {
            lista = JSON.parse(raw)
        } catch {
            lista = []
        }
    }
    if (!Array.isArray(lista)) return []
    return lista.map((p, idx) => ({
        id: p.id || `pac-${idx}-${Date.now()}`,
        nome: p.nome || `PACIENTE ${idx + 1}`,
        idade: p.idade || '',
        tipo_idade: p.tipo_idade || '',
        sexo: p.sexo || '',
        cor_start: p.cor_start || '',
        destino: p.destino || '',
        quadro_clinico: p.quadro_clinico || '',
        evolucoes: Array.isArray(p.evolucoes) ? p.evolucoes : [],
    }))
}

function inferirStatusPorHorario(chaveHorario, valorHorario, statusAtual = '') {
    if (!valorHorario || !String(valorHorario).trim()) {
        return statusAtual || 'ACIONADA'
    }
    const mapa = {
        h_acionamento: 'ACIONADA',
        h_saida_base: 'QTI',
        h_chegada_qth: 'NO QTH',
        h_saida_qth: 'QTI UNIDADE SAUDE',
        h_chegada_saude: 'NA UNIDADE SAUDE',
        h_saida_saude: 'EM ANDAMENTO',
        h_encerramento: 'QTI BASE QAP',
    }
    return mapa[chaveHorario] || statusAtual || 'ACIONADA'
}

// Ordem decrescente: 0 = Disponíveis, 1 = Empenhados e afins, 2 = Baixados e afins
function obterGrupoDisponibilidadeVtr(statusRaw) {
    const st = (statusRaw || 'DISPONIVEL').toUpperCase().trim()
    if (['DISPONIVEL', 'DISPONÍVEL', 'QAP', 'LIVRE', 'PRONTA'].includes(st)) {
        return 0
    }
    if (
        [
            'BAIXADA',
            'BAIXADO',
            'MANUTENCAO',
            'MANUTENÇÃO',
            'INATIVA',
            'INATIVO',
            'INDISPONIVEL',
            'INDISPONÍVEL',
            'QTA',
            'FORA DE OPERACAO',
            'FORA DE OPERAÇÃO',
        ].includes(st)
    ) {
        return 2
    }
    return 1
}

function obterEstiloRecursoMiniPainel(statusRaw) {
    const grupo = obterGrupoDisponibilidadeVtr(statusRaw)
    if (grupo === 0) {
        return {
            rowClass: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200',
            pillClass: 'bg-emerald-600/30 text-emerald-200 border-emerald-400/50',
        }
    }
    if (grupo === 2) {
        return {
            rowClass: 'bg-red-950/35 border-red-500/50 text-red-200 opacity-85',
            pillClass: 'bg-red-600/30 text-red-200 border-red-400/50',
        }
    }
    return {
        rowClass: 'bg-amber-950/35 border-qth-yellow/50 text-yellow-100',
        pillClass: 'bg-qth-yellow/25 text-yellow-200 border-qth-yellow/50',
    }
}

function criarFormInicialPerfil(perfil) {
    const partesLotacao = (perfil?.municipio_lotacao || '').split(' - ')
    const cidadeLotacao = (partesLotacao[0] || '').trim().toUpperCase()
    const ufLotacao = (partesLotacao[1] || 'PR').trim().toUpperCase() || 'PR'
    return {
        ...FORM_NOVA_OCORRENCIA,
        estado: ufLotacao,
        rodovia_uf: ufLotacao,
        origem_uf: ufLotacao,
        destino_uf: ufLotacao,
        cidade_urb: cidadeLotacao,
        rodovia_cidade: cidadeLotacao,
        origem_cidade: cidadeLotacao,
    }
}

function normalizarSemAcento(texto) {
    return (texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
}

function extrairLatLngDeTexto(texto) {
    if (!texto) return null
    const limpo = texto.trim()

    const dmsRegex =
        /(\d{1,3})[°º]\s*(\d{1,2})['′]\s*(\d{1,2}(?:[.,]\d+)?)["″]?\s*([NSns])\s*[,;\s]+\s*(\d{1,3})[°º]\s*(\d{1,2})['′]\s*(\d{1,2}(?:[.,]\d+)?)["″]?\s*([EWewOo])/
    const mDms = limpo.match(dmsRegex)
    if (mDms) {
        const latDeg = parseFloat(mDms[1])
        const latMin = parseFloat(mDms[2])
        const latSec = parseFloat(mDms[3].replace(',', '.'))
        const latSign = mDms[4].toUpperCase() === 'S' ? -1 : 1

        const lngDeg = parseFloat(mDms[5])
        const lngMin = parseFloat(mDms[6])
        const lngSec = parseFloat(mDms[7].replace(',', '.'))
        const lngHem = mDms[8].toUpperCase()
        const lngSign = lngHem === 'W' || lngHem === 'O' ? -1 : 1

        const lat = latSign * (latDeg + latMin / 60 + latSec / 3600)
        const lng = lngSign * (lngDeg + lngMin / 60 + lngSec / 3600)
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
        }
    }

    const m3d4d = limpo.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/)
    if (m3d4d) {
        const lat = parseFloat(m3d4d[1])
        const lng = parseFloat(m3d4d[2])
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return { lat, lng }
        }
    }

    const decRegex = /(-?\d{1,2}\.\d{3,})\s*[,;\s/]+\s*(-?\d{1,3}\.\d{3,})/
    const mDec = limpo.match(decRegex)
    if (mDec) {
        const lat = parseFloat(mDec[1])
        const lng = parseFloat(mDec[2])
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return { lat, lng }
        }
    }

    return null
}

function construirUrlRota(oc) {
    if (!oc) return null

    const coordsExtraidas =
        oc.latitude != null && oc.longitude != null
            ? { lat: oc.latitude, lng: oc.longitude }
            : extrairLatLngDeTexto(oc.coordenadas) || extrairLatLngDeTexto(oc.link_localizacao)

    if (coordsExtraidas) {
        return `https://www.google.com/maps/dir/?api=1&destination=${coordsExtraidas.lat},${coordsExtraidas.lng}`
    }

    if (oc.link_localizacao && /^https?:\/\//i.test(oc.link_localizacao.trim())) {
        return oc.link_localizacao.trim()
    }

    if ((oc.tipo_atendimento || '').toUpperCase() === 'TRANSFERÊNCIA') {
        const orig = [
            oc.origem_instituicao,
            oc.origem_rua,
            oc.origem_numero,
            oc.origem_cidade,
            oc.origem_uf,
        ]
            .filter(Boolean)
            .join(', ')
        const dest = [
            oc.destino_instituicao,
            oc.destino_rua,
            oc.destino_numero,
            oc.destino_cidade,
            oc.destino_uf,
        ]
            .filter(Boolean)
            .join(', ')
        if (dest) {
            const wp = orig ? `&waypoints=${encodeURIComponent(orig)}` : ''
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}${wp}`
        }
        return null
    }

    if (oc.tipo_via === 'Rodovia/Rural') {
        const rod = [
            oc.rodovia_jurisdicao && oc.rodovia_codigo
                ? `${oc.rodovia_jurisdicao}-${oc.rodovia_codigo}`
                : oc.rodovia_jurisdicao || oc.rodovia_codigo,
            oc.rodovia_km && `km ${oc.rodovia_km}`,
            oc.rodovia_cidade,
            oc.rodovia_uf,
        ]
            .filter(Boolean)
            .join(', ')
        return rod ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(rod)}` : null
    }

    const urb = [
        oc.via1 && oc.via2 ? `${oc.via1} com ${oc.via2}` : oc.via1,
        oc.numero_end,
        oc.bairro,
        oc.cidade_urb,
        oc.estado,
    ]
        .filter(Boolean)
        .join(', ')

    return urb ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(urb)}` : null
}

function obterMetaPrioridade(prioridade) {
    const p = (prioridade || 'MEDIA').toUpperCase()
    return PRIORIDADES.find((item) => item.id === p) || PRIORIDADES[1]
}

function formatarEnderecoOcorrencia(oc) {
    const geoExtra = []
    if (oc.coordenadas) geoExtra.push(`GPS: ${oc.coordenadas}`)
    else if (oc.latitude != null && oc.longitude != null) {
        geoExtra.push(`GPS: ${oc.latitude}, ${oc.longitude}`)
    }
    if (oc.link_localizacao) geoExtra.push('LINK MAPS ANEXADO')

    if ((oc.tipo_atendimento || '').toUpperCase() === 'TRANSFERÊNCIA') {
        const orig = [
            oc.origem_instituicao,
            oc.origem_rua && `${oc.origem_rua}${oc.origem_numero ? `, ${oc.origem_numero}` : ''}`,
            oc.origem_bairro,
            oc.origem_cidade && `${oc.origem_cidade} - ${oc.origem_uf || 'PR'}`,
        ]
            .filter(Boolean)
            .join(', ')
        const dest = [
            oc.destino_instituicao,
            oc.destino_rua && `${oc.destino_rua}${oc.destino_numero ? `, ${oc.destino_numero}` : ''}`,
            oc.destino_bairro,
            oc.destino_cidade && `${oc.destino_cidade} - ${oc.origem_uf || 'PR'}`,
        ]
            .filter(Boolean)
            .join(', ')
        return `${orig || 'ORIGEM N/I'} ➔ ${dest || 'DESTINO N/I'}`
    }

    if (oc.tipo_via === 'Rodovia/Rural') {
        const rod = [
            oc.rodovia_jurisdicao && oc.rodovia_codigo
                ? `${oc.rodovia_jurisdicao}-${oc.rodovia_codigo}`
                : oc.rodovia_jurisdicao || oc.rodovia_codigo,
            oc.rodovia_km && `KM ${oc.rodovia_km}`,
            oc.ponto_referencia && `REF: ${oc.ponto_referencia}`,
            oc.rodovia_cidade && `${oc.rodovia_cidade} - ${oc.rodovia_uf || 'PR'}`,
            ...geoExtra,
        ]
            .filter(Boolean)
            .join(' • ')
        return rod || 'RODOVIA / ÁREA RURAL'
    }

    const viaPrincipal =
        oc.via1 && oc.via2
            ? `${oc.via1} C/ ${oc.via2}`
            : oc.via1
    const urb = [
        viaPrincipal && `${viaPrincipal}${oc.numero_end ? `, ${oc.numero_end}` : ''}`,
        oc.bairro,
        oc.ponto_referencia && `REF: ${oc.ponto_referencia}`,
        oc.cidade_urb && `${oc.cidade_urb} - ${oc.estado || 'PR'}`,
        ...geoExtra,
    ]
        .filter(Boolean)
        .join(' • ')

    return urb || 'ENDEREÇO NÃO INFORMADO'
}

function obterCidadePrincipal(oc) {
    if ((oc.tipo_atendimento || '').toUpperCase() === 'TRANSFERÊNCIA') {
        return (oc.origem_cidade || oc.destino_cidade || '').toUpperCase()
    }
    if (oc.tipo_via === 'Rodovia/Rural') {
        return (oc.rodovia_cidade || '').toUpperCase()
    }
    return (oc.cidade_urb || '').toUpperCase()
}

export default function PainelCentral({ perfil }) {
    const cargo = (perfil?.cargo || '').toUpperCase()
    const userKey = perfil?.id || 'anonimo'
    const chaveRascunhoNova = `qth_rascunho_nova_oc_${userKey}`
    const chaveModalAberto = `qth_modal_oc_aberto_${userKey}`

    const podeCriarOuEditarTarm = [
        'TARM',
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const podeEditarRegulador = [
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const podeEditarClinicaPaciente = [
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
        'MEDICO',
        'ENFERMEIRO',
        'TECNICO',
        'TRIPULANTE',
    ].includes(cargo)

    const podeEditarRadio = [
        'RADIO OPERADOR',
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const [ocorrencias, setOcorrencias] = useState([])
    const [empenhos, setEmpenhos] = useState([])
    const [evolucoes, setEvolucoes] = useState([])
    const [viaturas, setViaturas] = useState([])
    const [carregando, setCarregando] = useState(true)

    const [rascunhosVtr, setRascunhosVtr] = useState({})
    const [novoPacientePorVtr, setNovoPacientePorVtr] = useState({})
    const [novaEvolucaoPorPaciente, setNovaEvolucaoPorPaciente] = useState({})

    const [subAbaStatus, setSubAbaStatus] = useState('RESUMO_GERAL')

    const rascunhoSalvo = useMemo(() => {
        try {
            const bruto = localStorage.getItem(chaveRascunhoNova)
            return bruto ? JSON.parse(bruto) : null
        } catch {
            return null
        }
    }, [chaveRascunhoNova])

    const [mostrarFormNova, setMostrarFormNova] = useState(
        Boolean(rascunhoSalvo?.aberto)
    )
    const [formNova, setFormNova] = useState(() => ({
        ...criarFormInicialPerfil(perfil),
        ...(rascunhoSalvo?.form || {}),
    }))
    const [criandoOcorrencia, setCriandoOcorrencia] = useState(false)
    const [erroNova, setErroNova] = useState('')
    const [buscandoGeoNova, setBuscandoGeoNova] = useState(false)
    const [avisoGeoNova, setAvisoGeoNova] = useState('')

    useEffect(() => {
        try {
            if (!mostrarFormNova) {
                localStorage.removeItem(chaveRascunhoNova)
                return
            }
            localStorage.setItem(
                chaveRascunhoNova,
                JSON.stringify({ aberto: true, form: formNova })
            )
        } catch {
            // ignora
        }
    }, [mostrarFormNova, formNova, chaveRascunhoNova])

    const [buscaTexto, setBuscaTexto] = useState('')
    const [filtroPrioridade, setFiltroPrioridade] = useState('TODAS')
    const [filtroNatureza, setFiltroNatureza] = useState('TODAS')
    const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS')
    const [filtroViatura, setFiltroViatura] = useState('TODAS')
    const [filtroImv, setFiltroImv] = useState('TODAS')

    const modalSalvo = useMemo(() => {
        try {
            const bruto = localStorage.getItem(chaveModalAberto)
            return bruto ? JSON.parse(bruto) : null
        } catch {
            return null
        }
    }, [chaveModalAberto])

    const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState(
        modalSalvo?.ocorrenciaId || null
    )
    const [abaInterna, setAbaInterna] = useState(modalSalvo?.abaInterna || 'RESUMO')

    useEffect(() => {
        try {
            if (!ocorrenciaSelecionadaId) {
                localStorage.removeItem(chaveModalAberto)
                return
            }
            localStorage.setItem(
                chaveModalAberto,
                JSON.stringify({ ocorrenciaId: ocorrenciaSelecionadaId, abaInterna })
            )
        } catch {
            // ignora
        }
    }, [ocorrenciaSelecionadaId, abaInterna, chaveModalAberto])

    const [editTarm, setEditTarm] = useState(null)
    const [buscandoGeoEdit, setBuscandoGeoEdit] = useState(false)
    const [avisoGeoEdit, setAvisoGeoEdit] = useState('')
    const [editRegulador, setEditRegulador] = useState(null)
    const [editRadio, setEditRadio] = useState(null)
    const [novaEvolucaoTexto, setNovaEvolucaoTexto] = useState('')
    const [novoQuadroClinicoRapido, setNovoQuadroClinicoRapido] = useState('')
    const [viaturaParaEmpenhar, setViaturaParaEmpenhar] = useState('')
    const [salvandoSecao, setSalvandoSecao] = useState(false)
    const [mensagemModal, setMensagemModal] = useState('')

    const idInicializadoRef = useRef(null)

    const listaEstados = useMemo(
        () => (cidadesData?.estados || []).map((e) => e.sigla.toUpperCase()).sort(),
        []
    )

    function cidadesPorUf(uf) {
        const sigla = (uf || '').toUpperCase()
        const est = (cidadesData?.estados || []).find((e) => e.sigla.toUpperCase() === sigla)
        return est ? est.cidades.map((c) => c.toUpperCase()).sort() : []
    }

    const cidadesNovaUrb = useMemo(() => cidadesPorUf(formNova.estado), [formNova.estado])
    const cidadesNovaRod = useMemo(() => cidadesPorUf(formNova.rodovia_uf), [formNova.rodovia_uf])
    const cidadesNovaOrig = useMemo(() => cidadesPorUf(formNova.origem_uf), [formNova.origem_uf])
    const cidadesNovaDest = useMemo(() => cidadesPorUf(formNova.destino_uf), [formNova.destino_uf])

    const cidadesEditTarmUrb = useMemo(() => cidadesPorUf(editTarm?.estado), [editTarm?.estado])
    const cidadesEditTarmRod = useMemo(() => cidadesPorUf(editTarm?.rodovia_uf), [editTarm?.rodovia_uf])
    const cidadesEditTarmOrig = useMemo(() => cidadesPorUf(editTarm?.origem_uf), [editTarm?.origem_uf])
    const cidadesEditTarmDest = useMemo(() => cidadesPorUf(editTarm?.destino_uf), [editTarm?.destino_uf])

    useEffect(() => {
        carregarTudo({ silencioso: false })

        const canal = supabase
            .channel('central-ocorrencias-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencia_viaturas' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencia_evolucoes' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'viaturas' }, () =>
                carregarTudo({ silencioso: true })
            )
            .subscribe()

        return () => {
            supabase.removeChannel(canal)
        }
    }, [])

    async function carregarTudo({ silencioso = false } = {}) {
        if (!silencioso && ocorrencias.length === 0) {
            setCarregando(true)
        }

        const [
            { data: dataOc },
            { data: dataEmp },
            { data: dataEvo },
            { data: dataVtr },
        ] = await Promise.all([
            supabase.from('ocorrencias').select('*').order('criado_em', { ascending: false }),
            supabase.from('ocorrencia_viaturas').select('*').order('criado_em', { ascending: true }),
            supabase.from('ocorrencia_evolucoes').select('*').order('criado_em', { ascending: false }),
            supabase
                .from('viaturas')
                .select('id, prefixo, tipo, cidade, base_cidade, estado, status, km_atual')
                .order('prefixo', { ascending: true }),
        ])

        if (dataOc) setOcorrencias(dataOc)
        if (dataEmp) {
            setEmpenhos(dataEmp)
            setRascunhosVtr((prev) => {
                const proximo = { ...prev }
                for (const emp of dataEmp) {
                    const bancoObj = {
                        status_empenho: emp.status_empenho || 'ACIONADA',
                        km_saida: emp.km_saida || '',
                        km_chegada: emp.km_chegada || '',
                        h_acionamento: emp.h_acionamento || '',
                        h_saida_base: emp.h_saida_base || '',
                        h_chegada_qth: emp.h_chegada_qth || '',
                        h_saida_qth: emp.h_saida_qth || '',
                        h_chegada_saude: emp.h_chegada_saude || '',
                        h_saida_saude: emp.h_saida_saude || '',
                        h_encerramento: emp.h_encerramento || '',
                        pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
                    }
                    if (!proximo[emp.id]) {
                        proximo[emp.id] = bancoObj
                    } else if (emp.status_empenho && emp.status_empenho !== proximo[emp.id].status_empenho) {
                        proximo[emp.id] = {
                            ...proximo[emp.id],
                            status_empenho: emp.status_empenho,
                            h_acionamento: emp.h_acionamento || proximo[emp.id].h_acionamento,
                            h_saida_base: emp.h_saida_base || proximo[emp.id].h_saida_base,
                            h_chegada_qth: emp.h_chegada_qth || proximo[emp.id].h_chegada_qth,
                            h_saida_qth: emp.h_saida_qth || proximo[emp.id].h_saida_qth,
                            h_chegada_saude: emp.h_chegada_saude || proximo[emp.id].h_chegada_saude,
                            h_saida_saude: emp.h_saida_saude || proximo[emp.id].h_saida_saude,
                            h_encerramento: emp.h_encerramento || proximo[emp.id].h_encerramento,
                            pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
                        }
                    }
                }
                return proximo
            })
        }
        if (dataEvo) setEvolucoes(dataEvo)
        if (dataVtr) setViaturas(dataVtr)
        setCarregando(false)
    }

    function obterDraftVtr(emp) {
        const draft = rascunhosVtr[emp.id]
        if (draft) return draft
        return {
            status_empenho: emp.status_empenho || 'ACIONADA',
            km_saida: emp.km_saida || '',
            km_chegada: emp.km_chegada || '',
            h_acionamento: emp.h_acionamento || '',
            h_saida_base: emp.h_saida_base || '',
            h_chegada_qth: emp.h_chegada_qth || '',
            h_saida_qth: emp.h_saida_qth || '',
            h_chegada_saude: emp.h_chegada_saude || '',
            h_saida_saude: emp.h_saida_saude || '',
            h_encerramento: emp.h_encerramento || '',
            pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
        }
    }

    function atualizarDraftVtr(empId, empBase, patch) {
        setRascunhosVtr((prev) => {
            const atual = prev[empId] || {
                status_empenho: empBase.status_empenho || 'ACIONADA',
                km_saida: empBase.km_saida || '',
                km_chegada: empBase.km_chegada || '',
                h_acionamento: empBase.h_acionamento || '',
                h_saida_base: empBase.h_saida_base || '',
                h_chegada_qth: empBase.h_chegada_qth || '',
                h_saida_qth: empBase.h_saida_qth || '',
                h_chegada_saude: empBase.h_chegada_saude || '',
                h_saida_saude: empBase.h_saida_saude || '',
                h_encerramento: empBase.h_encerramento || '',
                pacientes_detalhes: normalizarPacientesVtr(empBase.pacientes_detalhes),
            }
            return {
                ...prev,
                [empId]: {
                    ...atual,
                    ...(typeof patch === 'function' ? patch(atual) : patch),
                },
            }
        })
    }

    const ocorrenciaSelecionada = useMemo(
        () => ocorrencias.find((o) => o.id === ocorrenciaSelecionadaId) || null,
        [ocorrencias, ocorrenciaSelecionadaId]
    )

    function popularFormulariosModal(oc) {
        setEditTarm({ ...oc })
        setAvisoGeoEdit('')
        setEditRegulador({
            prioridade: oc.prioridade || 'MEDIA',
            protocolo_imv: Boolean(oc.protocolo_imv),
            numero_vitimas: Math.max(1, parseInt(oc.numero_vitimas, 10) || 1),
            vitimas_meios_proprios: Math.max(0, parseInt(oc.vitimas_meios_proprios, 10) || 0),
            vitimas_terceiros: Math.max(0, parseInt(oc.vitimas_terceiros, 10) || 0),
            vitimas_obito_local: Math.max(0, parseInt(oc.vitimas_obito_local, 10) || 0),
            classificacao_risco: oc.classificacao_risco || '',
            hipotese_diagnostica: oc.hipotese_diagnostica || '',
            quadro_clinico: oc.quadro_clinico || '',
            recurso_indicado: oc.recurso_indicado || '',
            conduta_regulacao: oc.conduta_regulacao || '',
        })
        setEditRadio({
            status_ocorrencia: oc.status_ocorrencia || 'PENDENTE',
            codigo_j: oc.codigo_j || '',
            codigo_qta: oc.codigo_qta || '',
            observacao_radio: oc.observacao_radio || '',
        })
        setNovoQuadroClinicoRapido(oc.quadro_clinico || '')
    }

    useEffect(() => {
        if (!ocorrenciaSelecionadaId) {
            idInicializadoRef.current = null
            return
        }
        if (ocorrenciaSelecionada && idInicializadoRef.current !== ocorrenciaSelecionada.id) {
            idInicializadoRef.current = ocorrenciaSelecionada.id
            popularFormulariosModal(ocorrenciaSelecionada)
        }
    }, [ocorrenciaSelecionadaId, ocorrenciaSelecionada])

    async function executarPreenchimentoPorGeo(dadosAtuais, setDadosFn, setLoadingFn, setAvisoFn) {
        setAvisoFn('')
        const coordStr = (dadosAtuais.coordenadas || '').trim()
        const linkStr = (dadosAtuais.link_localizacao || '').trim()

        if (!coordStr && !linkStr) {
            setAvisoFn('Informe coordenadas ou cole um link de localização primeiro.')
            return
        }

        const extraido = extrairLatLngDeTexto(coordStr) || extrairLatLngDeTexto(linkStr)
        if (!extraido) {
            setAvisoFn(
                'Link encurtado ou sem coordenadas explícitas na URL: o link ficou salvo e o botão de rota usará o link diretamente.'
            )
            return
        }

        const coordFormatada = `${extraido.lat}, ${extraido.lng}`
        setDadosFn((prev) => ({
            ...prev,
            coordenadas: prev.coordenadas?.trim() ? prev.coordenadas : coordFormatada,
            latitude: extraido.lat,
            longitude: extraido.lng,
        }))

        setLoadingFn(true)
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

            if (dadosAtuais.tipo_via === 'Rodovia/Rural') {
                const matchRod = viaDetectada.match(
                    /\b(BR|PR|SP|SC|RS|MS|MT|GO|MG|RJ|BA|PE|CE|PA)\s*-?\s*(\d{2,3})\b/
                )
                const jurisdicao = matchRod ? matchRod[1] : ''
                const codigo = matchRod ? matchRod[2] : ''
                if (!jurisdicao && !codigo) camposFaltantes.push('Prefixo/Código da Rodovia')
                camposFaltantes.push('Marco KM')
                if (!cidadeDetectada) camposFaltantes.push('Município')

                setDadosFn((prev) => ({
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

                setDadosFn((prev) => ({
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
                setAvisoFn(
                    `Endereço aproximado preenchido (${coordFormatada}). Campos sem dado exato (${camposFaltantes.join(', ')}) usarão as coordenadas GPS diretamente na rota.`
                )
            } else {
                setAvisoFn(`Endereço aproximado preenchido com sucesso a partir de ${coordFormatada}.`)
            }
        } catch {
            setAvisoFn(
                `Coordenadas (${coordFormatada}) salvas. Não foi possível consultar o endereço aproximado agora, mas o botão de rota já navega direto pelas coordenadas.`
            )
        } finally {
            setLoadingFn(false)
        }
    }

    function renderBlocoLocalizacaoRapida({
        dados,
        setDados,
        buscando,
        setBuscando,
        aviso,
        setAviso,
        desabilitado = false,
    }) {
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
                            onClick={() =>
                                executarPreenchimentoPorGeo(dados, setDados, setBuscando, setAviso)
                            }
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

    function calcularBalancoVitimas(oc, empenhosDaOc) {
        const totalEstimado = Math.max(1, parseInt(oc?.numero_vitimas, 10) || 1)
        const totaisCor = { ...CORES_VAZIAS }
        let embarcadasVtr = 0

        for (const emp of empenhosDaOc || []) {
            const c = normalizarCoresVtr(emp.vitimas_cores)
            totaisCor.VERMELHO += c.VERMELHO
            totaisCor.AMARELO += c.AMARELO
            totaisCor.VERDE += c.VERDE
            totaisCor.PRETO += c.PRETO
            embarcadasVtr += somarCoresVtr(c)
        }

        const meiosProprios = Math.max(0, parseInt(oc?.vitimas_meios_proprios, 10) || 0)
        const terceiros = Math.max(0, parseInt(oc?.vitimas_terceiros, 10) || 0)
        const obitoLocal = Math.max(0, parseInt(oc?.vitimas_obito_local, 10) || 0)
        const atendidasOuSaidas = embarcadasVtr + meiosProprios + terceiros + obitoLocal
        const saldoPendente = Math.max(0, totalEstimado - atendidasOuSaidas)

        return {
            totalEstimado,
            totaisCor,
            embarcadasVtr,
            meiosProprios,
            terceiros,
            obitoLocal,
            atendidasOuSaidas,
            saldoPendente,
        }
    }

    const empenhosPorOcorrencia = useMemo(() => {
        const mapa = new Map()
        for (const emp of empenhos) {
            const lista = mapa.get(emp.ocorrencia_id) || []
            lista.push(emp)
            mapa.set(emp.ocorrencia_id, lista)
        }
        return mapa
    }, [empenhos])

    const evolucoesDaOcorrencia = useMemo(() => {
        if (!ocorrenciaSelecionadaId) return []
        return evolucoes.filter((e) => e.ocorrencia_id === ocorrenciaSelecionadaId)
    }, [evolucoes, ocorrenciaSelecionadaId])

    const empenhosDaOcorrencia = useMemo(() => {
        if (!ocorrenciaSelecionadaId) return []
        return empenhos.filter((e) => e.ocorrencia_id === ocorrenciaSelecionadaId)
    }, [empenhos, ocorrenciaSelecionadaId])

    const contadoresSubAbas = useMemo(() => {
        const counts = {
            RESUMO_GERAL: ocorrencias.length,
            PENDENTE: 0,
            DESPACHADA: 0,
            EM_ANDAMENTO: 0,
            FINALIZADA: 0,
            CANCELADA: 0,
        }
        for (const oc of ocorrencias) {
            const st = (oc.status_ocorrencia || 'PENDENTE').toUpperCase()
            if (counts[st] !== undefined) counts[st] += 1
        }
        return counts
    }, [ocorrencias])

    const opcoesMunicipiosFiltro = useMemo(() => {
        const setMun = new Set()
        for (const oc of ocorrencias) {
            const c = obterCidadePrincipal(oc)
            if (c) setMun.add(c)
        }
        return ['TODOS', ...Array.from(setMun).sort()]
    }, [ocorrencias])

    const opcoesViaturasFiltro = useMemo(() => {
        const setVtr = new Set()
        for (const v of viaturas) {
            if (v.prefixo) setVtr.add(v.prefixo.toUpperCase())
        }
        for (const e of empenhos) {
            if (e.prefixo) setVtr.add(e.prefixo.toUpperCase())
        }
        return ['TODAS', ...Array.from(setVtr).sort()]
    }, [viaturas, empenhos])

    const temFiltroAtivo =
        buscaTexto.trim() !== '' ||
        filtroPrioridade !== 'TODAS' ||
        filtroNatureza !== 'TODAS' ||
        filtroMunicipio !== 'TODOS' ||
        filtroViatura !== 'TODAS' ||
        filtroImv !== 'TODAS'

    function limparFiltros() {
        setBuscaTexto('')
        setFiltroPrioridade('TODAS')
        setFiltroNatureza('TODAS')
        setFiltroMunicipio('TODOS')
        setFiltroViatura('TODAS')
        setFiltroImv('TODAS')
    }

    const ocorrenciasFiltradas = useMemo(() => {
        const termo = buscaTexto.trim().toUpperCase()

        return ocorrencias.filter((oc) => {
            const st = (oc.status_ocorrencia || 'PENDENTE').toUpperCase()
            if (subAbaStatus !== 'RESUMO_GERAL' && st !== subAbaStatus) return false

            const prio = (oc.prioridade || 'MEDIA').toUpperCase()
            if (filtroPrioridade !== 'TODAS' && prio !== filtroPrioridade) return false

            const nat = (oc.tipo_atendimento || 'PRIMÁRIO').toUpperCase()
            if (filtroNatureza !== 'TODAS' && nat !== filtroNatureza) return false

            const cidadeOc = obterCidadePrincipal(oc)
            if (filtroMunicipio !== 'TODOS' && cidadeOc !== filtroMunicipio) return false

            const qtdVit = Math.max(1, parseInt(oc.numero_vitimas, 10) || 1)
            if (filtroImv === 'IMV_ATIVO' && !oc.protocolo_imv) return false
            if (filtroImv === 'MULTIPLAS_VITIMAS' && qtdVit < 2) return false

            const vtrsOc = (empenhosPorOcorrencia.get(oc.id) || []).map((e) =>
                (e.prefixo || '').toUpperCase()
            )
            if (filtroViatura !== 'TODAS' && !vtrsOc.includes(filtroViatura)) return false

            if (termo) {
                const enderecoFmt = formatarEnderecoOcorrencia(oc).toUpperCase()
                const match =
                    (oc.numero_ocorrencia || '').toUpperCase().includes(termo) ||
                    (oc.solicitante_nome || '').toUpperCase().includes(termo) ||
                    (oc.solicitante_telefone || '').toUpperCase().includes(termo) ||
                    (oc.motivo || '').toUpperCase().includes(termo) ||
                    (oc.nome_paciente || '').toUpperCase().includes(termo) ||
                    (oc.quadro_clinico || '').toUpperCase().includes(termo) ||
                    (oc.codigo_j || '').toUpperCase().includes(termo) ||
                    (oc.codigo_qta || '').toUpperCase().includes(termo) ||
                    (oc.coordenadas || '').toUpperCase().includes(termo) ||
                    enderecoFmt.includes(termo) ||
                    vtrsOc.some((p) => p.includes(termo))

                if (!match) return false
            }

            return true
        })
    }, [
        ocorrencias,
        subAbaStatus,
        filtroPrioridade,
        filtroNatureza,
        filtroMunicipio,
        filtroViatura,
        filtroImv,
        buscaTexto,
        empenhosPorOcorrencia,
    ])

    const recursosOrdenadosMiniPainel = useMemo(() => {
        return [...viaturas]
            .map((v) => {
                const prefixoUpper = (v.prefixo || '').toUpperCase().trim()
                const statusUpper = (v.status || 'DISPONIVEL').toUpperCase().trim()
                const grupo = obterGrupoDisponibilidadeVtr(statusUpper)
                return {
                    ...v,
                    prefixoUpper,
                    statusUpper,
                    grupo,
                    meta: obterEstiloRecursoMiniPainel(statusUpper),
                }
            })
            .sort((a, b) => {
                if (a.grupo !== b.grupo) return a.grupo - b.grupo
                return a.prefixoUpper.localeCompare(b.prefixoUpper, 'pt-BR')
            })
    }, [viaturas])

    function horaAtualHhMm() {
        const agora = new Date()
        const hh = String(agora.getHours()).padStart(2, '0')
        const mm = String(agora.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
    }

    function descartarRascunhoNova() {
        setFormNova(criarFormInicialPerfil(perfil))
        setAvisoGeoNova('')
        setErroNova('')
        setMostrarFormNova(false)
        try {
            localStorage.removeItem(chaveRascunhoNova)
        } catch {
            // ignora
        }
    }

    async function handleCriarOcorrencia(e) {
        e.preventDefault()
        if (!podeCriarOuEditarTarm) return
        setErroNova('')

        const numeroLimpo = formNova.numero_ocorrencia.trim().toUpperCase()
        if (!numeroLimpo) {
            setErroNova('Informe o número da ocorrência.')
            return
        }

        setCriandoOcorrencia(true)

        const coordsParsed =
            formNova.latitude != null && formNova.longitude != null
                ? { lat: formNova.latitude, lng: formNova.longitude }
                : extrairLatLngDeTexto(formNova.coordenadas) ||
                extrairLatLngDeTexto(formNova.link_localizacao)

        const vitimasQtd = Math.max(1, parseInt(formNova.numero_vitimas, 10) || 1)

        const payload = {
            numero_ocorrencia: numeroLimpo,
            status_ocorrencia: 'PENDENTE',
            prioridade: formNova.prioridade || 'MEDIA',
            protocolo_imv: false,
            solicitante_nome: formNova.solicitante_nome.trim().toUpperCase(),
            solicitante_telefone: formNova.solicitante_telefone.trim(),
            numero_vitimas: vitimasQtd,
            tipo_atendimento: formNova.tipo_atendimento || 'PRIMÁRIO',
            tipo_local: formNova.tipo_local || 'DOMICÍLIO',
            tipo_via: formNova.tipo_via || 'Urbana',
            coordenadas:
                formNova.coordenadas.trim() ||
                (coordsParsed ? `${coordsParsed.lat}, ${coordsParsed.lng}` : ''),
            latitude: coordsParsed ? coordsParsed.lat : null,
            longitude: coordsParsed ? coordsParsed.lng : null,
            link_localizacao: formNova.link_localizacao.trim(),
            via1: formNova.via1.trim().toUpperCase(),
            via2: formNova.via2.trim().toUpperCase(),
            numero_end: formNova.numero_end.trim().toUpperCase(),
            bairro: formNova.bairro.trim().toUpperCase(),
            ponto_referencia: formNova.ponto_referencia.trim().toUpperCase(),
            estado: (formNova.estado || 'PR').trim().toUpperCase(),
            cidade_urb: formNova.cidade_urb.trim().toUpperCase(),
            rodovia_jurisdicao: formNova.rodovia_jurisdicao.trim().toUpperCase(),
            rodovia_codigo: formNova.rodovia_codigo.trim().toUpperCase(),
            rodovia_km: formNova.rodovia_km.trim(),
            rodovia_uf: (formNova.rodovia_uf || 'PR').trim().toUpperCase(),
            rodovia_cidade: formNova.rodovia_cidade.trim().toUpperCase(),
            origem_instituicao: formNova.origem_instituicao.trim().toUpperCase(),
            origem_rua: formNova.origem_rua.trim().toUpperCase(),
            origem_numero: formNova.origem_numero.trim().toUpperCase(),
            origem_bairro: formNova.origem_bairro.trim().toUpperCase(),
            origem_uf: (formNova.origem_uf || 'PR').trim().toUpperCase(),
            origem_cidade: formNova.origem_cidade.trim().toUpperCase(),
            destino_instituicao: formNova.destino_instituicao.trim().toUpperCase(),
            destino_rua: formNova.destino_rua.trim().toUpperCase(),
            destino_numero: formNova.destino_numero.trim().toUpperCase(),
            destino_bairro: formNova.destino_bairro.trim().toUpperCase(),
            destino_uf: (formNova.destino_uf || 'PR').trim().toUpperCase(),
            destino_cidade: formNova.destino_cidade.trim().toUpperCase(),
            motivo: formNova.motivo.trim().toUpperCase(),
            criado_por: perfil?.id || null,
            criado_por_nome: (perfil?.nome_completo || '').toUpperCase(),
        }

        const { data, error } = await supabase.from('ocorrencias').insert(payload).select().single()

        if (error || !data) {
            setErroNova(`Erro ao criar ocorrência: ${error?.message || 'Verifique os dados.'}`)
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencias',
                registroId: data.id,
                acao: 'CRIACAO',
                campo: 'OCORRENCIA',
                valorNovo: `Nº ${numeroLimpo} • ${vitimasQtd} VÍTIMA(S) • ${payload.tipo_atendimento} • MOTIVO: ${payload.motivo}`,
            })
            setFormNova(criarFormInicialPerfil(perfil))
            setAvisoGeoNova('')
            setMostrarFormNova(false)
            try {
                localStorage.removeItem(chaveRascunhoNova)
            } catch {
                // ignora
            }
            setSubAbaStatus('PENDENTE')
            await carregarTudo({ silencioso: true })
        }

        setCriandoOcorrencia(false)
    }

    function abrirOcorrencia(oc, abaInicial = 'RESUMO') {
        setMensagemModal('')
        setNovaEvolucaoTexto('')
        setViaturaParaEmpenhar('')
        idInicializadoRef.current = oc.id
        popularFormulariosModal(oc)
        setOcorrenciaSelecionadaId(oc.id)
        setAbaInterna(abaInicial)
    }

    function fecharModalOcorrencia() {
        idInicializadoRef.current = null
        setOcorrenciaSelecionadaId(null)
        setEditTarm(null)
        setEditRegulador(null)
        setEditRadio(null)
        setMensagemModal('')
        try {
            localStorage.removeItem(chaveModalAberto)
        } catch {
            // ignora
        }
    }

    async function handleSalvarTarm() {
        if (!podeCriarOuEditarTarm || !ocorrenciaSelecionada || !editTarm) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const coordsParsed =
            editTarm.latitude != null && editTarm.longitude != null
                ? { lat: editTarm.latitude, lng: editTarm.longitude }
                : extrairLatLngDeTexto(editTarm.coordenadas) ||
                extrairLatLngDeTexto(editTarm.link_localizacao)

        const payload = {
            numero_ocorrencia: (editTarm.numero_ocorrencia || '').trim().toUpperCase(),
            prioridade: editTarm.prioridade || 'MEDIA',
            solicitante_nome: (editTarm.solicitante_nome || '').trim().toUpperCase(),
            solicitante_telefone: (editTarm.solicitante_telefone || '').trim(),
            numero_vitimas: Math.max(1, parseInt(editTarm.numero_vitimas, 10) || 1),
            tipo_atendimento: editTarm.tipo_atendimento || 'PRIMÁRIO',
            tipo_local: editTarm.tipo_local || 'DOMICÍLIO',
            tipo_via: editTarm.tipo_via || 'Urbana',
            coordenadas:
                (editTarm.coordenadas || '').trim() ||
                (coordsParsed ? `${coordsParsed.lat}, ${coordsParsed.lng}` : ''),
            latitude: coordsParsed ? coordsParsed.lat : null,
            longitude: coordsParsed ? coordsParsed.lng : null,
            link_localizacao: (editTarm.link_localizacao || '').trim(),
            via1: (editTarm.via1 || '').trim().toUpperCase(),
            via2: (editTarm.via2 || '').trim().toUpperCase(),
            numero_end: (editTarm.numero_end || '').trim().toUpperCase(),
            bairro: (editTarm.bairro || '').trim().toUpperCase(),
            ponto_referencia: (editTarm.ponto_referencia || '').trim().toUpperCase(),
            estado: (editTarm.estado || 'PR').trim().toUpperCase(),
            cidade_urb: (editTarm.cidade_urb || '').trim().toUpperCase(),
            rodovia_jurisdicao: (editTarm.rodovia_jurisdicao || '').trim().toUpperCase(),
            rodovia_codigo: (editTarm.rodovia_codigo || '').trim().toUpperCase(),
            rodovia_km: (editTarm.rodovia_km || '').trim(),
            rodovia_uf: (editTarm.rodovia_uf || 'PR').trim().toUpperCase(),
            rodovia_cidade: (editTarm.rodovia_cidade || '').trim().toUpperCase(),
            origem_instituicao: (editTarm.origem_instituicao || '').trim().toUpperCase(),
            origem_rua: (editTarm.origem_rua || '').trim().toUpperCase(),
            origem_numero: (editTarm.origem_numero || '').trim().toUpperCase(),
            origem_bairro: (editTarm.origem_bairro || '').trim().toUpperCase(),
            origem_uf: (editTarm.origem_uf || 'PR').trim().toUpperCase(),
            origem_cidade: (editTarm.origem_cidade || '').trim().toUpperCase(),
            destino_instituicao: (editTarm.destino_instituicao || '').trim().toUpperCase(),
            destino_rua: (editTarm.destino_rua || '').trim().toUpperCase(),
            destino_numero: (editTarm.destino_numero || '').trim().toUpperCase(),
            destino_bairro: (editTarm.destino_bairro || '').trim().toUpperCase(),
            destino_uf: (editTarm.destino_uf || 'PR').trim().toUpperCase(),
            destino_cidade: (editTarm.destino_cidade || '').trim().toUpperCase(),
            motivo: (editTarm.motivo || '').trim().toUpperCase(),
            nome_paciente: (editTarm.nome_paciente || '').trim().toUpperCase(),
            idade_paciente: (editTarm.idade_paciente || '').trim(),
            tipo_idade_paciente: editTarm.tipo_idade_paciente || '',
            sexo_paciente: editTarm.sexo_paciente || '',
            atualizado_em: new Date().toISOString(),
        }

        const { error } = await supabase
            .from('ocorrencias')
            .update(payload)
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao salvar dados TARM: ${error.message}`)
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                anterior: ocorrenciaSelecionada,
                novo: payload,
                campos: [
                    'numero_ocorrencia',
                    'prioridade',
                    'solicitante_nome',
                    'solicitante_telefone',
                    'numero_vitimas',
                    'tipo_atendimento',
                    'coordenadas',
                    'link_localizacao',
                    'motivo',
                    'nome_paciente',
                ],
            })
            setMensagemModal('Dados da aba TARM salvos com sucesso.')
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleSalvarRegulador() {
        if (!podeEditarRegulador || !ocorrenciaSelecionada || !editRegulador) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const ativandoAgora =
            Boolean(editRegulador.protocolo_imv) && !Boolean(ocorrenciaSelecionada.protocolo_imv)

        const payload = {
            prioridade: editRegulador.prioridade || 'MEDIA',
            protocolo_imv: Boolean(editRegulador.protocolo_imv),
            imv_ativado_por: editRegulador.protocolo_imv
                ? ocorrenciaSelecionada.imv_ativado_por ||
                (perfil?.nome_completo || '').toUpperCase()
                : '',
            imv_ativado_em: editRegulador.protocolo_imv
                ? ocorrenciaSelecionada.imv_ativado_em || new Date().toISOString()
                : null,
            numero_vitimas: Math.max(1, parseInt(editRegulador.numero_vitimas, 10) || 1),
            vitimas_meios_proprios: Math.max(
                0,
                parseInt(editRegulador.vitimas_meios_proprios, 10) || 0
            ),
            vitimas_terceiros: Math.max(0, parseInt(editRegulador.vitimas_terceiros, 10) || 0),
            vitimas_obito_local: Math.max(
                0,
                parseInt(editRegulador.vitimas_obito_local, 10) || 0
            ),
            classificacao_risco: editRegulador.classificacao_risco || '',
            hipotese_diagnostica: (editRegulador.hipotese_diagnostica || '').trim().toUpperCase(),
            quadro_clinico: (editRegulador.quadro_clinico || '').trim(),
            recurso_indicado: (editRegulador.recurso_indicado || '').trim().toUpperCase(),
            conduta_regulacao: (editRegulador.conduta_regulacao || '').trim(),
            atualizado_em: new Date().toISOString(),
        }

        const { error } = await supabase
            .from('ocorrencias')
            .update(payload)
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao salvar regulação: ${error.message}`)
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                anterior: ocorrenciaSelecionada,
                novo: payload,
                campos: [
                    'prioridade',
                    'protocolo_imv',
                    'numero_vitimas',
                    'vitimas_meios_proprios',
                    'vitimas_terceiros',
                    'vitimas_obito_local',
                    'classificacao_risco',
                    'hipotese_diagnostica',
                    'quadro_clinico',
                    'recurso_indicado',
                    'conduta_regulacao',
                ],
            })
            setMensagemModal(
                ativandoAgora
                    ? 'PROTOCOLO IMV ATIVADO pelo Médico Regulador e dados salvos.'
                    : 'Registro médico e prioridade da aba REGULADOR salvos.'
            )
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleAdicionarPacienteNaVtr(emp) {
        if (!podeEditarClinicaPaciente) return
        const draftNovo = novoPacientePorVtr[emp.id] || {
            nome: '',
            idade: '',
            tipo_idade: '',
            sexo: '',
            cor_start: '',
            destino: '',
            quadro_clinico: '',
        }

        const pacientesAtuais = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novoPac = {
            id: `pac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            nome: (draftNovo.nome || `PACIENTE ${pacientesAtuais.length + 1}`).trim().toUpperCase(),
            idade: (draftNovo.idade || '').trim(),
            tipo_idade: draftNovo.tipo_idade || '',
            sexo: draftNovo.sexo || '',
            cor_start: draftNovo.cor_start || '',
            destino: (draftNovo.destino || '').trim().toUpperCase(),
            quadro_clinico: (draftNovo.quadro_clinico || '').trim(),
            evolucoes: [],
        }

        const novaLista = [...pacientesAtuais, novoPac]
        atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: novaLista,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'CRIACAO',
                campo: `PACIENTE_VTR_${emp.prefixo}`,
                valorNovo: `${novoPac.nome}${novoPac.cor_start ? ` (${novoPac.cor_start})` : ''}`,
            })
            setNovoPacientePorVtr((prev) => ({
                ...prev,
                [emp.id]: {
                    nome: '',
                    idade: '',
                    tipo_idade: '',
                    sexo: '',
                    cor_start: '',
                    destino: '',
                    quadro_clinico: '',
                },
            }))
            setMensagemModal(`Paciente ${novoPac.nome} adicionado ao prontuário da ${emp.prefixo}.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    function handleAtualizarCampoPacienteLocal(emp, pacienteId, patch) {
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novaLista = listaAtual.map((p) =>
            p.id === pacienteId
                ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) }
                : p
        )
        atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })
    }

    async function handleSalvarPacienteNaVtr(emp, pacienteId) {
        if (!podeEditarClinicaPaciente) return
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const pacAlvo = listaAtual.find((p) => p.id === pacienteId)
        if (!pacAlvo) return

        const textoEvo = (novaEvolucaoPorPaciente[pacienteId] || '').trim()
        const listaComEvo = textoEvo
            ? listaAtual.map((p) =>
                p.id === pacienteId
                    ? {
                        ...p,
                        evolucoes: [
                            {
                                id: `evo-${Date.now()}`,
                                texto: textoEvo,
                                autor_nome: (perfil?.nome_completo || '').toUpperCase(),
                                autor_cargo: cargo,
                                criado_em: new Date().toISOString(),
                            },
                            ...(p.evolucoes || []),
                        ],
                    }
                    : p
            )
            : listaAtual

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: listaComEvo,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: listaComEvo })
            if (textoEvo) {
                setNovaEvolucaoPorPaciente((prev) => ({ ...prev, [pacienteId]: '' }))
            }
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'EDICAO',
                campo: `PRONTUARIO_PACIENTE_${emp.prefixo}`,
                valorNovo: `${pacAlvo.nome}${pacAlvo.cor_start ? ` (${pacAlvo.cor_start})` : ''}${textoEvo ? ` • EVO: ${textoEvo}` : ''}`,
            })
            setMensagemModal(`Prontuário de ${pacAlvo.nome} na ${emp.prefixo} salvo.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    async function handleRemoverPacienteNaVtr(emp, pacienteId) {
        if (!podeEditarClinicaPaciente) return
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novaLista = listaAtual.filter((p) => p.id !== pacienteId)

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: novaLista,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })
            setMensagemModal(`Ficha do paciente removida da ${emp.prefixo}.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    async function handleAlterarCorVtr(emp, corId, delta) {
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

    async function handleAdicionarEvolucao(e) {
        e.preventDefault()
        if (!podeEditarRegulador || !ocorrenciaSelecionada) return

        const textoLimpo = novaEvolucaoTexto.trim()
        const quadroAtualizado = novoQuadroClinicoRapido.trim()

        if (!textoLimpo && !quadroAtualizado) return

        setSalvandoSecao(true)
        setMensagemModal('')

        if (quadroAtualizado !== (ocorrenciaSelecionada.quadro_clinico || '').trim()) {
            await supabase
                .from('ocorrencias')
                .update({
                    quadro_clinico: quadroAtualizado,
                    atualizado_em: new Date().toISOString(),
                })
                .eq('id', ocorrenciaSelecionada.id)
        }

        const { data: evoCriada, error } = await supabase
            .from('ocorrencia_evolucoes')
            .insert({
                ocorrencia_id: ocorrenciaSelecionada.id,
                origem_aba: 'REGULADOR',
                quadro_clinico: quadroAtualizado,
                evolucao_texto: textoLimpo || 'Atualização de quadro clínico.',
                autor_id: perfil?.id || null,
                autor_nome: (perfil?.nome_completo || '').toUpperCase(),
                autor_cargo: cargo,
            })
            .select()
            .single()

        if (error) {
            setMensagemModal(`Erro ao registrar evolução: ${error.message}`)
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_evolucoes',
                registroId: evoCriada?.id || ocorrenciaSelecionada.id,
                acao: 'CRIACAO',
                campo: 'EVOLUCAO_MEDICA',
                valorNovo: textoLimpo || quadroAtualizado,
            })
            setNovaEvolucaoTexto('')
            setMensagemModal('Evolução e quadro clínico adicionados ao prontuário da ocorrência.')
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleEmpenharViatura() {
        if (!podeEditarRadio || !ocorrenciaSelecionada || !viaturaParaEmpenhar) return
        const vtrObj = viaturas.find(
            (v) => v.prefixo.toUpperCase() === viaturaParaEmpenhar.toUpperCase()
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

        const { data: empCriado, error } = await supabase
            .from('ocorrencia_viaturas')
            .insert({
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
            })
            .select()
            .single()

        if (error) {
            setMensagemModal(`Erro ao empenhar viatura: ${error.message}`)
        } else {
            await supabase.from('viaturas').update({ status: 'ACIONADA' }).eq('id', vtrObj.id)

            const novoStatusOc =
                ocorrenciaSelecionada.status_ocorrencia === 'PENDENTE'
                    ? 'DESPACHADA'
                    : ocorrenciaSelecionada.status_ocorrencia

            await supabase
                .from('ocorrencias')
                .update({
                    status_ocorrencia: novoStatusOc,
                    h_acionamento: ocorrenciaSelecionada.h_acionamento || horaAcion,
                    atualizado_em: new Date().toISOString(),
                })
                .eq('id', ocorrenciaSelecionada.id)

            setEditRadio((prev) => (prev ? { ...prev, status_ocorrencia: novoStatusOc } : prev))

            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: empCriado?.id || ocorrenciaSelecionada.id,
                acao: 'CRIACAO',
                campo: 'EMPENHO_VTR',
                valorNovo: `VTR ${vtrObj.prefixo.toUpperCase()} empenhada na ocorrência ${ocorrenciaSelecionada.numero_ocorrencia}`,
            })

            setViaturaParaEmpenhar('')
            setMensagemModal(`Viatura ${vtrObj.prefixo.toUpperCase()} empenhada.`)
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleAtualizarStatusEmpenho(emp, novoStatusEmpenho) {
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

    function alterarHorarioEStatusVtr(emp, chaveHorario, novoValor) {
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

    async function handleSalvarHorariosVtr(emp) {
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

    async function handleDesvincularEmpenho(emp) {
        if (!podeEditarRadio) return
        setSalvandoSecao(true)
        const { error } = await supabase.from('ocorrencia_viaturas').delete().eq('id', emp.id)

        if (!error) {
            await supabase.from('viaturas').update({ status: 'DISPONIVEL' }).eq('id', emp.viatura_id)

            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'EXCLUSAO',
                campo: 'EMPENHO_VTR',
                valorAnterior: `${emp.prefixo} (${emp.status_empenho})`,
            })

            setMensagemModal(`Viatura ${emp.prefixo} removida do empenho.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    async function handleSalvarRadio(statusForcado = null) {
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

    function renderPainelBalancoVitimas(oc, empenhosDaOc, { permitirEditarVtr = false } = {}) {
        const balanco = calcularBalancoVitimas(oc, empenhosDaOc)
        const isMultiplas = balanco.totalEstimado >= 2

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

                {empenhosDaOc && empenhosDaOc.length > 0 && (
                    <div className="space-y-2 pt-1">
                        {empenhosDaOc.map((emp) => {
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
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
                            <Radio className="w-4 h-4" />
                            Central de Regulação e Despacho
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Abertura TARM • Regulação Médica & IMV • Empenho Multi-VTR, Códigos J e QTA
                        </p>
                    </div>

                    {podeCriarOuEditarTarm && (
                        <div className="flex items-center gap-2">
                            {mostrarFormNova && (
                                <button
                                    type="button"
                                    onClick={descartarRascunhoNova}
                                    className="bg-slate-800 hover:bg-qth-red/80 text-slate-200 hover:text-white border border-slate-600 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    DESCARTAR RASCUNHO
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setMostrarFormNova(!mostrarFormNova)
                                    setErroNova('')
                                    setAvisoGeoNova('')
                                }}
                                className="bg-qth-green hover:bg-green-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                                {mostrarFormNova ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {mostrarFormNova ? 'OCULTAR FORMULÁRIO' : 'NOVA OCORRÊNCIA'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Formulário de Nova Ocorrência (TARM) */}
                {mostrarFormNova && podeCriarOuEditarTarm && (
                    <form
                        onSubmit={handleCriarOcorrencia}
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
                                            onClick={() => {
                                                setFormNova({ ...formNova, tipo_via: via })
                                                setAvisoGeoNova('')
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border ${formNova.tipo_via === via
                                                ? 'bg-qth-orange/25 text-orange-200 border-qth-orange'
                                                : 'bg-qth-bg text-slate-400 border-slate-700'
                                                }`}
                                        >
                                            {via}
                                        </button>
                                    ))}
                                </div>

                                {renderBlocoLocalizacaoRapida({
                                    dados: formNova,
                                    setDados: setFormNova,
                                    buscando: buscandoGeoNova,
                                    setBuscando: setBuscandoGeoNova,
                                    aviso: avisoGeoNova,
                                    setAviso: setAvisoGeoNova,
                                })}

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
                                onClick={descartarRascunhoNova}
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
                )}

                {/* Sub-abas por Status + Resumo Geral */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-700/70 pb-3">
                    {SUB_ABAS_STATUS.map((aba) => {
                        const ativa = subAbaStatus === aba.id
                        const qtd = contadoresSubAbas[aba.id] ?? 0
                        return (
                            <button
                                key={aba.id}
                                type="button"
                                onClick={() => setSubAbaStatus(aba.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-colors border ${ativa
                                    ? 'bg-qth-orange text-white border-qth-orange'
                                    : 'bg-qth-bg/70 text-slate-300 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <span>{aba.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${ativa ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    {qtd}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Barra de Pesquisa Global e Filtros Inteligentes */}
                <div className="bg-qth-bg/70 border border-slate-700/80 rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={buscaTexto}
                                onChange={(e) => setBuscaTexto(e.target.value.toUpperCase())}
                                placeholder="PESQUISAR Nº OCORRÊNCIA, SOLICITANTE, MOTIVO, ENDEREÇO, COORDENADAS OU VTR..."
                                className="w-full bg-qth-card border border-slate-600 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange"
                            />
                            {buscaTexto && (
                                <button
                                    type="button"
                                    onClick={() => setBuscaTexto('')}
                                    className="text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-300 bg-qth-card border border-slate-700 px-2.5 py-1.5 rounded-lg">
                                {ocorrenciasFiltradas.length} RESULTADOS
                            </span>
                            {temFiltroAtivo && (
                                <button
                                    type="button"
                                    onClick={limparFiltros}
                                    className="bg-slate-800 hover:bg-slate-700 text-qth-orange border border-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    LIMPAR FILTROS
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        <SelectPesquisavel
                            label="Prioridade"
                            opcoes={['TODAS', ...PRIORIDADES.map((p) => p.id)]}
                            valor={filtroPrioridade}
                            onChange={setFiltroPrioridade}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Natureza"
                            opcoes={['TODAS', ...NATUREZAS_ATENDIMENTO]}
                            valor={filtroNatureza}
                            onChange={setFiltroNatureza}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Município"
                            opcoes={opcoesMunicipiosFiltro}
                            valor={filtroMunicipio}
                            onChange={setFiltroMunicipio}
                            placeholder="TODOS"
                        />

                        <SelectPesquisavel
                            label="Viatura Empenhada"
                            opcoes={opcoesViaturasFiltro}
                            valor={filtroViatura}
                            onChange={setFiltroViatura}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Vítimas / IMV"
                            opcoes={['TODAS', 'MULTIPLAS_VITIMAS', 'IMV_ATIVO']}
                            valor={filtroImv}
                            onChange={setFiltroImv}
                            placeholder="TODAS"
                        />
                    </div>
                </div>

                {/* Listagem de Cards das Ocorrências */}
                {carregando ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                        CARREGANDO OCORRÊNCIAS...
                    </p>
                ) : ocorrenciasFiltradas.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                        <p className="text-xs text-slate-400">
                            NENHUMA OCORRÊNCIA ENCONTRADA NESTA ABA COM OS FILTROS ATUAIS.
                        </p>
                        {temFiltroAtivo && (
                            <button
                                type="button"
                                onClick={limparFiltros}
                                className="text-xs font-bold text-qth-orange hover:underline cursor-pointer"
                            >
                                LIMPAR FILTROS
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ocorrenciasFiltradas.map((oc) => {
                            const prioMeta = obterMetaPrioridade(oc.prioridade)
                            const vtrsOc = empenhosPorOcorrencia.get(oc.id) || []
                            const enderecoFmt = formatarEnderecoOcorrencia(oc)
                            const urlRotaCard = construirUrlRota(oc)
                            const qtdVit = Math.max(1, parseInt(oc.numero_vitimas, 10) || 1)
                            const balancoCard = calcularBalancoVitimas(oc, vtrsOc)

                            return (
                                <div
                                    key={oc.id}
                                    onClick={() => abrirOcorrencia(oc, 'RESUMO')}
                                    className={`bg-qth-bg/75 border-2 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition-all ${oc.protocolo_imv
                                        ? 'border-qth-red bg-red-950/20 shadow-lg shadow-qth-red/20 hover:border-red-400'
                                        : prioMeta.card
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-extrabold text-white">
                                                    OCORRÊNCIA #{oc.numero_ocorrencia || 'S/N'}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${prioMeta.badge}`}
                                                >
                                                    {prioMeta.label}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                                                    {oc.status_ocorrencia}
                                                </span>
                                                {oc.protocolo_imv ? (
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-red text-white uppercase">
                                                        IMV ATIVO
                                                    </span>
                                                ) : (
                                                    qtdVit >= 2 && (
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-yellow/25 text-yellow-200 border border-qth-yellow/60 uppercase">
                                                            {qtdVit} VÍTIMAS
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-qth-orange mt-1 uppercase">
                                                {oc.tipo_atendimento} • {oc.motivo || 'MOTIVO NÃO INFORMADO'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {urlRotaCard && (
                                                <a
                                                    href={urlRotaCard}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-2 py-1 rounded-lg bg-qth-blue/30 hover:bg-qth-blue text-blue-200 hover:text-white border border-blue-500/40 text-[10px] font-extrabold flex items-center gap-1"
                                                    title="Abrir rota direta no GPS/Maps"
                                                >
                                                    <Navigation className="w-3 h-3" />
                                                    ROTA
                                                </a>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {balancoCard.embarcadasVtr}/{qtdVit}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <span className="uppercase">{enderecoFmt}</span>
                                    </p>

                                    {oc.quadro_clinico && (
                                        <p className="text-[11px] text-slate-300 bg-qth-card/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 line-clamp-2">
                                            <strong className="text-qth-orange uppercase">QUADRO CLÍNICO:</strong>{' '}
                                            {oc.quadro_clinico}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {vtrsOc.length === 0 ? (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    SEM VTR EMPENHADA
                                                </span>
                                            ) : (
                                                vtrsOc.map((emp) => {
                                                    const totalCorEmp = somarCoresVtr(emp.vitimas_cores)
                                                    return (
                                                        <span
                                                            key={emp.id}
                                                            className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-blue/25 text-blue-200 border border-blue-500/40 uppercase"
                                                        >
                                                            {emp.prefixo} ({emp.status_empenho}
                                                            {totalCorEmp > 0 ? ` • ${totalCorEmp} VÍTIMA(S)` : ''})
                                                        </span>
                                                    )
                                                })
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            {oc.codigo_j && (
                                                <span className="text-green-400 uppercase">{oc.codigo_j}</span>
                                            )}
                                            {oc.codigo_qta && (
                                                <span className="text-yellow-300 uppercase">{oc.codigo_qta}</span>
                                            )}
                                            <span className="text-qth-orange">ABRIR ›</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal / Tela Interna da Ocorrência com 4 Abas */}
            {ocorrenciaSelecionada && editTarm && editRegulador && editRadio && (
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
                                                disabled={!podeCriarOuEditarTarm}
                                                onClick={() => setEditTarm({ ...editTarm, prioridade: prio.id })}
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
                                                            setAvisoGeoEdit('')
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

                                            {renderBlocoLocalizacaoRapida({
                                                dados: editTarm,
                                                setDados: setEditTarm,
                                                buscando: buscandoGeoEdit,
                                                setBuscando: setBuscandoGeoEdit,
                                                aviso: avisoGeoEdit,
                                                setAviso: setAvisoGeoEdit,
                                                desabilitado: !podeCriarOuEditarTarm,
                                            })}

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
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                            <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2">
                                                <p className="text-[11px] font-bold text-qth-orange uppercase">
                                                    Origem
                                                </p>
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
                                                <div className="grid grid-cols-3 gap-2">
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
                                                        className="col-span-2 bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
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
                                                <div className="grid grid-cols-3 gap-2">
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

                                            <div className="bg-qth-bg/70 border border-slate-700/70 rounded-xl p-3 space-y-2">
                                                <p className="text-[11px] font-bold text-qth-orange uppercase">
                                                    Destino
                                                </p>
                                                <input
                                                    type="text"
                                                    disabled={!podeCriarOuEditarTarm}
                                                    placeholder="INSTITUIÇÃO DESTINO"
                                                    value={editTarm.destino_instituicao || ''}
                                                    onChange={(e) =>
                                                        setEditTarm({
                                                            ...editTarm,
                                                            destino_instituicao: e.target.value.toUpperCase(),
                                                        })
                                                    }
                                                    className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        disabled={!podeCriarOuEditarTarm}
                                                        placeholder="RUA"
                                                        value={editTarm.destino_rua || ''}
                                                        onChange={(e) =>
                                                            setEditTarm({
                                                                ...editTarm,
                                                                destino_rua: e.target.value.toUpperCase(),
                                                            })
                                                        }
                                                        className="col-span-2 bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                                    />
                                                    <input
                                                        type="text"
                                                        disabled={!podeCriarOuEditarTarm}
                                                        placeholder="Nº"
                                                        value={editTarm.destino_numero || ''}
                                                        onChange={(e) =>
                                                            setEditTarm({
                                                                ...editTarm,
                                                                destino_numero: e.target.value.toUpperCase(),
                                                            })
                                                        }
                                                        className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        disabled={!podeCriarOuEditarTarm}
                                                        placeholder="BAIRRO"
                                                        value={editTarm.destino_bairro || ''}
                                                        onChange={(e) =>
                                                            setEditTarm({
                                                                ...editTarm,
                                                                destino_bairro: e.target.value.toUpperCase(),
                                                            })
                                                        }
                                                        className="bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                                    />
                                                    <SelectPesquisavel
                                                        label="UF"
                                                        opcoes={listaEstados}
                                                        valor={editTarm.destino_uf || 'PR'}
                                                        disabled={!podeCriarOuEditarTarm}
                                                        onChange={(uf) =>
                                                            setEditTarm({
                                                                ...editTarm,
                                                                destino_uf: uf,
                                                                destino_cidade: '',
                                                            })
                                                        }
                                                    />
                                                    <SelectPesquisavel
                                                        label="Cidade"
                                                        opcoes={cidadesEditTarmDest}
                                                        valor={editTarm.destino_cidade || ''}
                                                        disabled={!podeCriarOuEditarTarm}
                                                        permiteTextoLivre={true}
                                                        onChange={(cid) =>
                                                            setEditTarm({ ...editTarm, destino_cidade: cid })
                                                        }
                                                    />
                                                </div>
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
                            )}

                            {/* ABA 3: REGULADOR */}
                            {abaInterna === 'REGULADOR' && (
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
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-slate-300 uppercase mr-1">
                                                    Prioridade:
                                                </span>
                                                {PRIORIDADES.map((prio) => (
                                                    <button
                                                        key={prio.id}
                                                        type="button"
                                                        disabled={!podeEditarRegulador}
                                                        onClick={() =>
                                                            setEditRegulador({ ...editRegulador, prioridade: prio.id })
                                                        }
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer disabled:opacity-60 ${editRegulador.prioridade === prio.id
                                                            ? prio.btnAtivo
                                                            : 'bg-qth-card text-slate-300 border-slate-700'
                                                            }`}
                                                    >
                                                        {prio.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                disabled={!podeEditarRegulador}
                                                onClick={() =>
                                                    setEditRegulador({
                                                        ...editRegulador,
                                                        protocolo_imv: !editRegulador.protocolo_imv,
                                                    })
                                                }
                                                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold uppercase border cursor-pointer disabled:opacity-60 transition-colors ${editRegulador.protocolo_imv
                                                    ? 'bg-qth-red text-white border-red-300'
                                                    : 'bg-qth-card text-slate-200 border-slate-600 hover:border-qth-red'
                                                    }`}
                                            >
                                                {editRegulador.protocolo_imv
                                                    ? 'PROTOCOLO IMV: ATIVO (CLIQUE PARA DESATIVAR)'
                                                    : 'ATIVAR PROTOCOLO IMV'}
                                            </button>
                                        </div>

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
                                                    const draftVtr = obterDraftVtr(emp)
                                                    const pacientesVtr = normalizarPacientesVtr(
                                                        draftVtr.pacientes_detalhes
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

                                    {/* Regulação Geral da Ocorrência */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <SelectPesquisavel
                                            label="Classificação de Risco"
                                            opcoes={CLASSIFICACOES_RISCO}
                                            valor={editRegulador.classificacao_risco || ''}
                                            placeholder="SELECIONE..."
                                            disabled={!podeEditarRegulador}
                                            onChange={(val) =>
                                                setEditRegulador({ ...editRegulador, classificacao_risco: val })
                                            }
                                        />

                                        <SelectPesquisavel
                                            label="Recurso Indicado"
                                            opcoes={RECURSOS_INDICADOS}
                                            valor={editRegulador.recurso_indicado || ''}
                                            placeholder="SELECIONE OU DIGITE..."
                                            disabled={!podeEditarRegulador}
                                            permiteTextoLivre={true}
                                            onChange={(val) =>
                                                setEditRegulador({ ...editRegulador, recurso_indicado: val })
                                            }
                                        />

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                                Hipótese Diagnóstica
                                            </label>
                                            <input
                                                type="text"
                                                disabled={!podeEditarRegulador}
                                                value={editRegulador.hipotese_diagnostica || ''}
                                                onChange={(e) =>
                                                    setEditRegulador({
                                                        ...editRegulador,
                                                        hipotese_diagnostica: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                            Quadro Clínico Geral da Ocorrência
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
                                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg p-3 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                            Conduta da Regulação / Destino Hospitalar
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
                                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg p-3 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                                        />
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
                            )}

                            {/* ABA 4: RÁDIO OPERADOR (Horários individuais por VTR + Mini Painel Lateral de Recursos) */}
                            {abaInterna === 'RADIO_OPERADOR' && (
                                <div className="space-y-4">
                                    {!podeEditarRadio && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-xs p-2.5 rounded-lg flex items-center gap-2">
                                            <Lock className="w-4 h-4 shrink-0" />
                                            <span>
                                                Apenas Rádio Operadores, Médicos Reguladores, Coordenadores e Gestores podem empenhar viaturas e lançar códigos J / QTA.
                                            </span>
                                        </div>
                                    )}

                                    {renderPainelBalancoVitimas(ocorrenciaSelecionada, empenhosDaOcorrencia, {
                                        permitirEditarVtr: podeEditarRadio,
                                    })}

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                        {/* Coluna Esquerda: Empenho Multi-VTR, Horários Individuais, J, QTA */}
                                        <div className="lg:col-span-8 space-y-4">
                                            <div className="bg-qth-bg/70 border border-slate-700 rounded-xl p-3.5 space-y-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <h4 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                                                        <Truck className="w-4 h-4" />
                                                        Empenho Multi-VTR ({empenhosDaOcorrencia.length} vinculada(s))
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
                                                                onClick={handleEmpenharViatura}
                                                                className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                                                            >
                                                                EMPENHAR VTR
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {empenhosDaOcorrencia.length === 0 ? (
                                                    <p className="text-xs text-slate-400">
                                                        Nenhuma viatura empenhada nesta ocorrência.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {empenhosDaOcorrencia.map((emp) => {
                                                            const coresEmp = normalizarCoresVtr(emp.vitimas_cores)
                                                            const draftVtr = obterDraftVtr(emp)
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
                                                                                    title="Remover viatura do empenho"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}