export const PRIORIDADES = [
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

export const CORES_START = [
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

export const CORES_VAZIAS = {
  VERMELHO: 0,
  AMARELO: 0,
  VERDE: 0,
  PRETO: 0,
}

export const SUB_ABAS_STATUS = [
  { id: 'RESUMO_GERAL', label: 'RESUMO GERAL' },
  { id: 'PENDENTE', label: 'PENDENTES' },
  { id: 'DESPACHADA', label: 'DESPACHADAS' },
  { id: 'EM_ANDAMENTO', label: 'EM ANDAMENTO' },
  { id: 'FINALIZADA', label: 'FINALIZADAS' },
  { id: 'CANCELADA', label: 'CANCELADAS / QTA' },
]

export const STATUS_OCORRENCIA_OPCOES = [
  'PENDENTE',
  'DESPACHADA',
  'EM_ANDAMENTO',
  'FINALIZADA',
  'CANCELADA',
]

export const NATUREZAS_ATENDIMENTO = ['PRIMÁRIO', 'TRANSFERÊNCIA']
export const TIPOS_LOCAL = ['DOMICÍLIO', 'VIA PÚBLICA', 'ESTABELECIMENTO']
export const TIPOS_VIA = ['Urbana', 'Rodovia/Rural']
export const TIPOS_IDADE = ['Anos', 'Meses', 'Dias']
export const SEXOS_PACIENTE = ['Masculino', 'Feminino']
export const CLASSIFICACOES_RISCO = ['AZUL', 'VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']
export const RECURSOS_INDICADOS = [
  'USB',
  'USA',
  'MOTOLANCIA',
  'AEROMEDICO',
  'APOIO / DEFESA CIVIL',
  'ORIENTAÇÃO MÉDICA',
]

export const CODIGOS_J = [
  'J01 - SEM VÍTIMA NO LOCAL',
  'J02 - RECUSA DE ATENDIMENTO / REMOÇÃO',
  'J03 - ATENDIDO NO LOCAL SEM REMOÇÃO',
  'J04 - REMOÇÃO PARA UNIDADE DE SAÚDE',
  'J05 - ÓBITO NO LOCAL',
  'J06 - ÓBITO DURANTE ATENDIMENTO / TRANSPORTE',
  'J11 - OCORRÊNCIA CANCELADA / DISPENSADA',
]

export const CODIGOS_QTA = [
  'QTA - SEM ALTERAÇÃO / NADA CONSTATADO',
  'QTA 01 - DISPENSADO PELO SOLICITANTE',
  'QTA 02 - ENDEREÇO NÃO LOCALIZADO',
  'QTA 03 - ATENDIDO POR OUTRO RECURSO',
  'QTA 04 - TROTE / CHAMADO INDEVIDO',
]

export const STATUS_EMPENHO_VTR = [
  'ACIONADA',
  'EMPENHADA',
  'QTI',
  'NO QTH',
  'QTI UNIDADE SAUDE',
  'NA UNIDADE SAUDE',
  'QTI BASE QAP',
  'QTA',
]

export const FORM_NOVA_OCORRENCIA = {
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

export const NOME_PARA_UF = {
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

export function normalizarCoresVtr(raw) {
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

export function somarCoresVtr(cores) {
  const c = normalizarCoresVtr(cores)
  return c.VERMELHO + c.AMARELO + c.VERDE + c.PRETO
}

export function normalizarPacientesVtr(raw) {
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

export function inferirStatusPorHorario(chaveHorario, valorHorario, statusAtual = '') {
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
export function obterGrupoDisponibilidadeVtr(statusRaw) {
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

export function obterEstiloRecursoMiniPainel(statusRaw) {
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

export function criarFormInicialPerfil(perfil) {
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

export function normalizarSemAcento(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

export function extrairLatLngDeTexto(texto) {
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

export function construirUrlRota(oc) {
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

export function obterMetaPrioridade(prioridade) {
  const p = (prioridade || 'MEDIA').toUpperCase()
  return PRIORIDADES.find((item) => item.id === p) || PRIORIDADES[1]
}

export function formatarEnderecoOcorrencia(oc) {
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

export function obterCidadePrincipal(oc) {
  if ((oc.tipo_atendimento || '').toUpperCase() === 'TRANSFERÊNCIA') {
    return (oc.origem_cidade || oc.destino_cidade || '').toUpperCase()
  }
  if (oc.tipo_via === 'Rodovia/Rural') {
    return (oc.rodovia_cidade || '').toUpperCase()
  }
  return (oc.cidade_urb || '').toUpperCase()
}

export function calcularBalancoVitimas(oc, empenhosDaOc) {
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