import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import {
  Users,
  RefreshCw,
  Edit3,
  Save,
  X,
  KeyRound,
  ShieldAlert,
  Plus,
  Clock,
  Building2,
} from 'lucide-react'

function obterDataHojeIso() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarDataIsoParaBr(dataIso) {
  const m = String(dataIso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return String(dataIso || '').trim()
  return `${m[3]}/${m[2]}/${m[1]}`
}

function somarDiasIso(dataIso, dias) {
  const m = String(dataIso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return dataIso || ''
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + Number(dias || 0))
  const ano = dt.getFullYear()
  const mes = String(dt.getMonth() + 1).padStart(2, '0')
  const dia = String(dt.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarHoraHhMm(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 4)
  if (digitos.length <= 2) return digitos
  const hh = String(Math.min(23, parseInt(digitos.slice(0, 2), 10) || 0)).padStart(2, '0')
  const mm = String(Math.min(59, parseInt(digitos.slice(2, 4), 10) || 0)).padStart(2, '0')
  return `${hh}:${mm}`
}

function horaValidaHhMm(hora) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(hora || '').trim())
}

function horaParaMinutos(hora) {
  if (!horaValidaHhMm(hora)) return null
  const [hh, mm] = String(hora).trim().split(':').map(Number)
  return hh * 60 + mm
}

function calcularDataFimAutomatica(dataIniIso, horaIni, horaFim, is24h) {
  if (!dataIniIso) return ''
  if (is24h) {
    return somarDiasIso(dataIniIso, 1)
  }
  const minIni = horaParaMinutos(horaIni)
  const minFim = horaParaMinutos(horaFim)
  if (minIni !== null && minFim !== null && minFim <= minIni) {
    return somarDiasIso(dataIniIso, 1)
  }
  return dataIniIso
}

function montarDescricaoJanela(dataInicioIso, horaInicio, dataFimIso, horaFim, is24h) {
  const dIni = formatarDataIsoParaBr(dataInicioIso)
  const dFim = formatarDataIsoParaBr(dataFimIso)
  const hIni = String(horaInicio || '').trim()
  const hFim = String(horaFim || '').trim()

  const inicioStr = [dIni, hIni].filter(Boolean).join(' ')
  const fimStr = [dFim, hFim].filter(Boolean).join(' ')

  if (!inicioStr && !fimStr) return ''
  const base = inicioStr && fimStr ? `${inicioStr} às ${fimStr}` : inicioStr || fimStr
  return is24h ? `${base} (24H)` : base
}

function normalizarListaNomes(raw) {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((item) => String(item || '').trim().toUpperCase())
          .filter(Boolean)
      )
    )
  }
  if (typeof raw === 'string' && raw.trim()) {
    return Array.from(
      new Set(
        raw
          .split(/[,;|]+/)
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      )
    )
  }
  return []
}

function extrairListaTripulacao(trip, chavePlural, chaveSingular) {
  const plural = normalizarListaNomes(trip?.[chavePlural])
  if (plural.length > 0) return plural
  return normalizarListaNomes(trip?.[chaveSingular])
}

export default function AbaPlantoesTripulacoes({
  perfil,
  viaturas = [],
  plantoesAtivos = [],
  mapaInstituicoes = {},
  onAtualizado,
}) {
  const isMaster = Boolean(perfil?.is_platform_owner)
  const instituicaoId = perfil?.instituicao_id || null
  const cargo = (perfil?.cargo || '').toUpperCase()

  const podeAcessar =
    isMaster ||
    ['RADIO OPERADOR', 'COORDENADOR', 'GESTOR'].includes(cargo)

  const [integrantes, setIntegrantes] = useState([])
  const [plantoesLocais, setPlantoesLocais] = useState([])
  const [viaturaSelecionadaId, setViaturaSelecionadaId] = useState('')
  const [dataInicio, setDataInicio] = useState(() => obterDataHojeIso())
  const [horaInicio, setHoraInicio] = useState('')
  const [dataFim, setDataFim] = useState(() => obterDataHojeIso())
  const [horaFim, setHoraFim] = useState('')
  const [plantao24h, setPlantao24h] = useState(false)
  const [kmInicial, setKmInicial] = useState('')

  const [estagioCandidato, setEstagioCandidato] = useState('')
  const [alunoCandidato, setAlunoCandidato] = useState('')

  const [tripulacaoForm, setTripulacaoForm] = useState({
    condutor: '',
    medico: '',
    enfermeiro: '',
    tecnico: '',
    estagios: [],
    alunos: [],
  })

  const [editandoPlantaoId, setEditandoPlantaoId] = useState(null)
  const [tripulacaoEdit, setTripulacaoEdit] = useState({
    condutor: '',
    medico: '',
    enfermeiro: '',
    tecnico: '',
    estagios: [],
    alunos: [],
  })
  const [estagioEditCandidato, setEstagioEditCandidato] = useState('')
  const [alunoEditCandidato, setAlunoEditCandidato] = useState('')
  const [justificativaTroca, setJustificativaTroca] = useState('')
  const [gerarNovoPin, setGerarNovoPin] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!podeAcessar) return
    carregarIntegrantes()
    carregarPlantoesDireto()
  }, [podeAcessar, isMaster, instituicaoId])

  useEffect(() => {
    if (Array.isArray(plantoesAtivos) && plantoesAtivos.length > 0) {
      setPlantoesLocais(plantoesAtivos)
    }
  }, [plantoesAtivos])

  useEffect(() => {
    if (!viaturaSelecionadaId && viaturas.length > 0) {
      setViaturaSelecionadaId(viaturas[0].id)
    }
  }, [viaturas, viaturaSelecionadaId])

  useEffect(() => {
    const vtr = viaturas.find((v) => v.id === viaturaSelecionadaId)
    if (vtr) {
      setKmInicial(vtr.km_atual || '')
    }
  }, [viaturaSelecionadaId, viaturas])

  async function carregarPlantoesDireto() {
    let query = supabase
      .from('viatura_plantoes')
      .select('*')
      .eq('status', 'ATIVO')
      .order('iniciado_em', { ascending: false })

    if (!isMaster && instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId)
    }

    const { data, error: errSelect } = await query
    if (errSelect) {
      setErro(`Erro ao consultar plantões ativos: ${errSelect.message}`)
    } else if (data) {
      setPlantoesLocais(data)
    }
  }

  async function carregarIntegrantes() {
    let query = supabase
      .from('perfis')
      .select('id, nome_completo, cargo, funcao_vtr, instituicao_id, ativo')
      .neq('ativo', false)
      .order('nome_completo', { ascending: true })

    if (!isMaster && instituicaoId) {
      query = query.eq('instituicao_id', instituicaoId)
    }

    const { data } = await query
    if (data) setIntegrantes(data)
  }

  function opcoesPorFuncao(funcaoEsperada) {
    const alvo = funcaoEsperada.toUpperCase()
    const nomes = integrantes
      .filter((p) => {
        const fn = (p.funcao_vtr || '').toUpperCase()
        const cg = (p.cargo || '').toUpperCase()
        if (alvo === 'CONDUTOR') {
          return fn === 'CONDUTOR' || cg.includes('CONDUTOR')
        }
        return fn === alvo
      })
      .map((p) => (p.nome_completo || '').toUpperCase())
      .filter(Boolean)

    return Array.from(new Set(nomes)).sort()
  }

  const plantoesVisiveis = useMemo(() => {
    const base = plantoesLocais.length > 0 ? plantoesLocais : plantoesAtivos
    return [...base].sort((a, b) =>
      (a.prefixo || '').localeCompare(b.prefixo || '', 'pt-BR')
    )
  }, [plantoesLocais, plantoesAtivos])

  function handleChangeDataInicio(novaDataIni) {
    setDataInicio(novaDataIni)
    if (novaDataIni) {
      setDataFim(calcularDataFimAutomatica(novaDataIni, horaInicio, horaFim, plantao24h))
    }
  }

  function handleChangeHoraInicio(valorBruto) {
    const formatada = formatarHoraHhMm(valorBruto)
    setHoraInicio(formatada)
    const proxHoraFim = plantao24h ? formatada : horaFim
    if (plantao24h) {
      setHoraFim(formatada)
    }
    if (dataInicio) {
      setDataFim(calcularDataFimAutomatica(dataInicio, formatada, proxHoraFim, plantao24h))
    }
  }

  function handleChangeHoraFim(valorBruto) {
    const formatada = formatarHoraHhMm(valorBruto)
    setHoraFim(formatada)
    const proximo24h = plantao24h && formatada === horaInicio ? true : false
    if (plantao24h && formatada !== horaInicio) {
      setPlantao24h(false)
    }
    if (dataInicio) {
      setDataFim(calcularDataFimAutomatica(dataInicio, horaInicio, formatada, proximo24h))
    }
  }

  function handleToggle24h() {
    setPlantao24h((prev) => {
      const proximo = !prev
      const proxHoraFim = proximo && horaInicio ? horaInicio : horaFim
      if (proximo && horaInicio) {
        setHoraFim(horaInicio)
      }
      if (dataInicio) {
        setDataFim(calcularDataFimAutomatica(dataInicio, horaInicio, proxHoraFim, proximo))
      }
      return proximo
    })
  }

  function adicionarItemLista(setterState, campoLista, valorCandidato, limparCandidato) {
    const nomeLimpo = String(valorCandidato || '').trim().toUpperCase()
    if (!nomeLimpo) return
    setterState((prev) => {
      const atual = normalizarListaNomes(prev[campoLista])
      if (atual.includes(nomeLimpo)) return prev
      return {
        ...prev,
        [campoLista]: [...atual, nomeLimpo],
      }
    })
    limparCandidato('')
  }

  function removerItemLista(setterState, campoLista, nomeRemover) {
    setterState((prev) => ({
      ...prev,
      [campoLista]: normalizarListaNomes(prev[campoLista]).filter((n) => n !== nomeRemover),
    }))
  }

  function montarPayloadTripulacao(origemState, estagioPendente = '', alunoPendente = '') {
    const estagiosFinal = normalizarListaNomes([
      ...(origemState.estagios || []),
      estagioPendente,
    ])
    const alunosFinal = normalizarListaNomes([
      ...(origemState.alunos || []),
      alunoPendente,
    ])

    return {
      condutor: (origemState.condutor || '').trim().toUpperCase(),
      medico: (origemState.medico || '').trim().toUpperCase(),
      enfermeiro: (origemState.enfermeiro || '').trim().toUpperCase(),
      tecnico: (origemState.tecnico || '').trim().toUpperCase(),
      estagios: estagiosFinal,
      alunos: alunosFinal,
      estagio: estagiosFinal.join(', '),
      aluno: alunosFinal.join(', '),
    }
  }

  async function handleRegistrarTrocaPlantao(e) {
    e.preventDefault()
    if (!podeAcessar || !viaturaSelecionadaId) return
    setErro('')
    setMensagem('')

    if (!horaValidaHhMm(horaInicio)) {
      setErro('Informe o horário de início do plantão no formato HH:MM (ex: 07:00).')
      return
    }
    if (!plantao24h && !horaValidaHhMm(horaFim)) {
      setErro('Informe o horário de fim do plantão no formato HH:MM ou ative o botão 24H.')
      return
    }

    setSalvando(true)

    const vtr = viaturas.find((v) => v.id === viaturaSelecionadaId)
    const tripLimpa = montarPayloadTripulacao(
      tripulacaoForm,
      estagioCandidato,
      alunoCandidato
    )
    const janelaDescricao = montarDescricaoJanela(
      dataInicio,
      horaInicio,
      dataFim,
      horaFim,
      plantao24h
    )

    const { data, error: rpcErr } = await supabase.rpc('assumir_plantao_viatura', {
      p_viatura_id: viaturaSelecionadaId,
      p_tripulacao: tripLimpa,
      p_turno_label: janelaDescricao || null,
      p_device_uuid: null,
      p_plataforma: 'WEB',
      p_push_token: null,
      p_criado_por_nome: perfil?.nome_completo || 'RADIO OPERADOR',
      p_origem: 'RADIO_OPERADOR',
      p_km_inicial: kmInicial || null,
    })

    if (rpcErr) {
      setErro(`Erro ao registrar troca de plantão: ${rpcErr.message}`)
    } else {
      await registrarAuditoria({
        perfil,
        tabela: 'viatura_plantoes',
        registroId: data?.plantao_id || viaturaSelecionadaId,
        acao: 'CRIACAO',
        campo: 'TROCA_PLANTAO_CENTRAL',
        valorNovo: `VTR ${vtr?.prefixo || ''} • JANELA: ${janelaDescricao || 'N/I'} • CONDUTOR: ${tripLimpa.condutor || '—'}`,
      })
      setMensagem(
        `Novo plantão registrado para ${vtr?.prefixo || 'VIATURA'} (PIN: ${data?.pin_acesso || '—'}).`
      )
      setTripulacaoForm({
        condutor: '',
        medico: '',
        enfermeiro: '',
        tecnico: '',
        estagios: [],
        alunos: [],
      })
      setEstagioCandidato('')
      setAlunoCandidato('')
      await carregarPlantoesDireto()
      await onAtualizado?.()
    }

    setSalvando(false)
  }

  function iniciarEdicaoTripulacao(pl) {
    setEditandoPlantaoId(pl.id)
    setTripulacaoEdit({
      condutor: pl.tripulacao?.condutor || '',
      medico: pl.tripulacao?.medico || '',
      enfermeiro: pl.tripulacao?.enfermeiro || '',
      tecnico: pl.tripulacao?.tecnico || '',
      estagios: extrairListaTripulacao(pl.tripulacao, 'estagios', 'estagio'),
      alunos: extrairListaTripulacao(pl.tripulacao, 'alunos', 'aluno'),
    })
    setEstagioEditCandidato('')
    setAlunoEditCandidato('')
    setJustificativaTroca('')
    setGerarNovoPin(false)
    setErro('')
    setMensagem('')
  }

  async function handleSalvarEdicaoTripulacao(pl) {
    if (!podeAcessar || !pl) return
    if (!justificativaTroca.trim()) {
      setErro('Informe a justificativa para editar/incluir tripulação no plantão ativo.')
      return
    }

    setErro('')
    setMensagem('')
    setSalvando(true)

    const novaTrip = montarPayloadTripulacao(
      tripulacaoEdit,
      estagioEditCandidato,
      alunoEditCandidato
    )

    const { error: rpcErr } = await supabase.rpc('alterar_tripulacao_plantao', {
      p_plantao_id: pl.id,
      p_nova_tripulacao: novaTrip,
      p_justificativa: justificativaTroca.trim(),
      p_gerar_novo_pin: gerarNovoPin,
      p_autor_nome: perfil?.nome_completo || 'RADIO OPERADOR',
    })

    if (rpcErr) {
      setErro(`Erro ao atualizar tripulação: ${rpcErr.message}`)
    } else {
      await registrarAuditoria({
        perfil,
        tabela: 'viatura_plantoes',
        registroId: pl.id,
        acao: 'EDICAO',
        campo: 'ALTERACAO_TRIPULACAO_PLANTAO',
        valorNovo: `VTR ${pl.prefixo} • JUSTIFICATIVA: ${justificativaTroca.trim()}`,
      })
      setMensagem(`Tripulação da ${pl.prefixo} atualizada com sucesso.`)
      setEditandoPlantaoId(null)
      setEstagioEditCandidato('')
      setAlunoEditCandidato('')
      setJustificativaTroca('')
      await carregarPlantoesDireto()
      await onAtualizado?.()
    }

    setSalvando(false)
  }

  if (!podeAcessar) {
    return (
      <div className="bg-qth-bg/70 border border-slate-700 rounded-xl p-4 text-center space-y-1.5">
        <ShieldAlert className="w-6 h-6 text-qth-yellow mx-auto" />
        <p className="text-xs font-extrabold text-white uppercase">Acesso Restrito</p>
        <p className="text-[11px] text-slate-400">
          Apenas Rádio Operador, Coordenador, Gestor ou Master podem gerenciar plantões e tripulações.
        </p>
      </div>
    )
  }

  const resumoJanelaAtual = montarDescricaoJanela(
    dataInicio,
    horaInicio,
    dataFim,
    horaFim,
    plantao24h
  )

  return (
    <div className="space-y-4">
      {/* Registrar Troca de Plantão / Assunção pela Central */}
      <form
        onSubmit={handleRegistrarTrocaPlantao}
        className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Registrar Troca de Plantão / Composição de Viatura
          </h3>
          {resumoJanelaAtual && (
            <span className="text-[11px] font-bold text-sky-300 bg-sky-950/50 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
              {resumoJanelaAtual}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
              Viatura
            </label>
            <select
              value={viaturaSelecionadaId}
              onChange={(e) => setViaturaSelecionadaId(e.target.value)}
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-bold text-white uppercase"
            >
              {viaturas.map((v) => {
                const instLabel = isMaster ? mapaInstituicoes[v.instituicao_id] : ''
                return (
                  <option key={v.id} value={v.id}>
                    {v.prefixo} ({v.tipo}){instLabel ? ` • ${instLabel}` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
              Data de Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => handleChangeDataInicio(e.target.value)}
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
              Início do Plantão (HH:MM) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={horaInicio}
              onChange={(e) => handleChangeHoraInicio(e.target.value)}
              placeholder="EX: 07:00"
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
              KM Inicial do Plantão
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={kmInicial}
              onChange={(e) => setKmInicial(e.target.value.replace(/\D/g, ''))}
              placeholder="EX: 145200"
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
              Data de Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="block text-[10px] font-bold text-slate-300 uppercase">
                Fim do Plantão (HH:MM) *
              </label>
              <button
                type="button"
                onClick={handleToggle24h}
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer border transition-colors ${
                  plantao24h
                    ? 'bg-qth-orange text-white border-qth-orange'
                    : 'bg-qth-card text-slate-300 border-slate-600 hover:border-qth-orange'
                }`}
                title="Preencher automaticamente 24h a partir da data e hora de início (editável)"
              >
                <Clock className="w-2.5 h-2.5" />
                24H
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              required={!plantao24h}
              value={horaFim}
              onChange={(e) => handleChangeHoraFim(e.target.value)}
              placeholder={plantao24h ? horaInicio || '24H' : 'EX: 19:00'}
              className="w-full bg-qth-card border border-slate-600 rounded-lg px-2.5 py-2 text-xs font-semibold text-white"
            />
          </div>

          <SelectPesquisavel
            label="Condutor"
            opcoes={opcoesPorFuncao('CONDUTOR')}
            valor={tripulacaoForm.condutor}
            permiteTextoLivre={true}
            onChange={(val) => setTripulacaoForm({ ...tripulacaoForm, condutor: val })}
          />

          <SelectPesquisavel
            label="Médico"
            opcoes={opcoesPorFuncao('MEDICO')}
            valor={tripulacaoForm.medico}
            permiteTextoLivre={true}
            onChange={(val) => setTripulacaoForm({ ...tripulacaoForm, medico: val })}
          />

          <SelectPesquisavel
            label="Enfermeiro"
            opcoes={opcoesPorFuncao('ENFERMEIRO')}
            valor={tripulacaoForm.enfermeiro}
            permiteTextoLivre={true}
            onChange={(val) => setTripulacaoForm({ ...tripulacaoForm, enfermeiro: val })}
          />

          <SelectPesquisavel
            label="Técnico"
            opcoes={opcoesPorFuncao('TECNICO')}
            valor={tripulacaoForm.tecnico}
            permiteTextoLivre={true}
            onChange={(val) => setTripulacaoForm({ ...tripulacaoForm, tecnico: val })}
          />
        </div>

        {/* Campos distintos e múltiplos: Estágio Operacional e Aluno */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
          <div className="bg-qth-card/70 border border-slate-700/80 rounded-xl p-3 space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectPesquisavel
                  label="Estágio Operacional (Opcional • 1 ou mais)"
                  opcoes={opcoesPorFuncao('ESTAGIO OP.')}
                  valor={estagioCandidato}
                  permiteTextoLivre={true}
                  placeholder="SELECIONAR OU DIGITAR ESTAGIÁRIO..."
                  onChange={setEstagioCandidato}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  adicionarItemLista(
                    setTripulacaoForm,
                    'estagios',
                    estagioCandidato,
                    setEstagioCandidato
                  )
                }
                className="bg-slate-800 hover:bg-qth-orange text-white border border-slate-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD
              </button>
            </div>
            {tripulacaoForm.estagios.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tripulacaoForm.estagios.map((nome) => (
                  <span
                    key={nome}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 flex items-center gap-1"
                  >
                    {nome}
                    <button
                      type="button"
                      onClick={() =>
                        removerItemLista(setTripulacaoForm, 'estagios', nome)
                      }
                      className="text-red-400 hover:text-red-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-qth-card/70 border border-slate-700/80 rounded-xl p-3 space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectPesquisavel
                  label="Aluno (Opcional • 1 ou mais)"
                  opcoes={opcoesPorFuncao('ALUNO')}
                  valor={alunoCandidato}
                  permiteTextoLivre={true}
                  placeholder="SELECIONAR OU DIGITAR ALUNO..."
                  onChange={setAlunoCandidato}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  adicionarItemLista(
                    setTripulacaoForm,
                    'alunos',
                    alunoCandidato,
                    setAlunoCandidato
                  )
                }
                className="bg-slate-800 hover:bg-qth-orange text-white border border-slate-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD
              </button>
            </div>
            {tripulacaoForm.alunos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tripulacaoForm.alunos.map((nome) => (
                  <span
                    key={nome}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 flex items-center gap-1"
                  >
                    {nome}
                    <button
                      type="button"
                      onClick={() =>
                        removerItemLista(setTripulacaoForm, 'alunos', nome)
                      }
                      className="text-red-400 hover:text-red-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {erro && (
          <p className="text-xs text-red-400 bg-qth-red/15 border border-qth-red/40 p-2 rounded-lg">
            {erro}
          </p>
        )}
        {mensagem && (
          <p className="text-xs text-green-300 bg-green-950/40 border border-green-500/40 p-2 rounded-lg">
            {mensagem}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={salvando || !viaturaSelecionadaId}
            className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
          >
            {salvando ? 'REGISTRANDO...' : 'REGISTRAR TROCA DE PLANTÃO'}
          </button>
        </div>
      </form>

      {/* Plantões Ativos e Edição de Tripulação */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold text-white uppercase flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-qth-orange" />
          Plantões e Tripulações Ativas ({plantoesVisiveis.length})
        </h3>

        {plantoesVisiveis.length === 0 ? (
          <p className="text-xs text-slate-400 bg-qth-bg/60 border border-slate-700 rounded-xl p-4 text-center">
            Nenhum plantão ativo registrado no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plantoesVisiveis.map((pl) => {
              const emEdicao = editandoPlantaoId === pl.id
              const trip = pl.tripulacao || {}
              const estagiosLista = extrairListaTripulacao(trip, 'estagios', 'estagio')
              const alunosLista = extrairListaTripulacao(trip, 'alunos', 'aluno')
              const nomeConsorcio = isMaster ? mapaInstituicoes[pl.instituicao_id] || '' : ''

              return (
                <div
                  key={pl.id}
                  className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white uppercase">
                          {pl.prefixo}
                        </span>
                        {nomeConsorcio && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-500/40 uppercase flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {nomeConsorcio}
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-qth-orange border border-slate-600 uppercase">
                          {pl.origem || 'APP_CONDUTOR'}
                        </span>
                        {pl.pin_acesso && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                            <KeyRound className="w-3 h-3" /> PIN: {pl.pin_acesso}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 uppercase">
                        {pl.turno_label || 'HORÁRIO NÃO INFORMADO'}
                        {pl.km_inicial ? ` • KM INICIAL: ${pl.km_inicial}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        emEdicao ? setEditandoPlantaoId(null) : iniciarEdicaoTripulacao(pl)
                      }
                      className="px-2.5 py-1 rounded-lg bg-qth-blue/20 hover:bg-qth-blue text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {emEdicao ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      {emEdicao ? 'FECHAR' : 'EDITAR EQUIPE'}
                    </button>
                  </div>

                  {!emEdicao ? (
                    <div className="text-xs text-slate-200 space-y-1 bg-qth-card/70 border border-slate-700/70 rounded-lg p-2.5">
                      {trip.condutor && <p><strong className="text-slate-400">CONDUTOR:</strong> {trip.condutor}</p>}
                      {trip.medico && <p><strong className="text-slate-400">MÉDICO:</strong> {trip.medico}</p>}
                      {trip.enfermeiro && <p><strong className="text-slate-400">ENFERMEIRO:</strong> {trip.enfermeiro}</p>}
                      {trip.tecnico && <p><strong className="text-slate-400">TÉCNICO:</strong> {trip.tecnico}</p>}
                      {estagiosLista.length > 0 && (
                        <p><strong className="text-slate-400">ESTÁGIO OPERACIONAL:</strong> {estagiosLista.join(', ')}</p>
                      )}
                      {alunosLista.length > 0 && (
                        <p><strong className="text-slate-400">ALUNO:</strong> {alunosLista.join(', ')}</p>
                      )}
                      {!trip.condutor &&
                        !trip.medico &&
                        !trip.enfermeiro &&
                        !trip.tecnico &&
                        estagiosLista.length === 0 &&
                        alunosLista.length === 0 && (
                          <p className="text-slate-400 italic">Nenhum tripulante informado ainda.</p>
                        )}
                    </div>
                  ) : (
                    <div className="bg-qth-card border border-qth-orange/50 rounded-lg p-3 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <SelectPesquisavel
                          label="Condutor"
                          opcoes={opcoesPorFuncao('CONDUTOR')}
                          valor={tripulacaoEdit.condutor || ''}
                          permiteTextoLivre={true}
                          onChange={(val) => setTripulacaoEdit({ ...tripulacaoEdit, condutor: val })}
                        />
                        <SelectPesquisavel
                          label="Médico"
                          opcoes={opcoesPorFuncao('MEDICO')}
                          valor={tripulacaoEdit.medico || ''}
                          permiteTextoLivre={true}
                          onChange={(val) => setTripulacaoEdit({ ...tripulacaoEdit, medico: val })}
                        />
                        <SelectPesquisavel
                          label="Enfermeiro"
                          opcoes={opcoesPorFuncao('ENFERMEIRO')}
                          valor={tripulacaoEdit.enfermeiro || ''}
                          permiteTextoLivre={true}
                          onChange={(val) => setTripulacaoEdit({ ...tripulacaoEdit, enfermeiro: val })}
                        />
                        <SelectPesquisavel
                          label="Técnico"
                          opcoes={opcoesPorFuncao('TECNICO')}
                          valor={tripulacaoEdit.tecnico || ''}
                          permiteTextoLivre={true}
                          onChange={(val) => setTripulacaoEdit({ ...tripulacaoEdit, tecnico: val })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <SelectPesquisavel
                              label="Estágio Operacional (1 ou mais)"
                              opcoes={opcoesPorFuncao('ESTAGIO OP.')}
                              valor={estagioEditCandidato}
                              permiteTextoLivre={true}
                              onChange={setEstagioEditCandidato}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              adicionarItemLista(
                                setTripulacaoEdit,
                                'estagios',
                                estagioEditCandidato,
                                setEstagioEditCandidato
                              )
                            }
                            className="bg-slate-800 hover:bg-qth-orange text-white border border-slate-600 px-2.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            + ESTÁGIO
                          </button>
                        </div>
                        {(tripulacaoEdit.estagios || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tripulacaoEdit.estagios.map((nome) => (
                              <span
                                key={nome}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 flex items-center gap-1"
                              >
                                {nome}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removerItemLista(setTripulacaoEdit, 'estagios', nome)
                                  }
                                  className="text-red-400 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <SelectPesquisavel
                              label="Aluno (1 ou mais)"
                              opcoes={opcoesPorFuncao('ALUNO')}
                              valor={alunoEditCandidato}
                              permiteTextoLivre={true}
                              onChange={setAlunoEditCandidato}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              adicionarItemLista(
                                setTripulacaoEdit,
                                'alunos',
                                alunoEditCandidato,
                                setAlunoEditCandidato
                              )
                            }
                            className="bg-slate-800 hover:bg-qth-orange text-white border border-slate-600 px-2.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            + ALUNO
                          </button>
                        </div>
                        {(tripulacaoEdit.alunos || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tripulacaoEdit.alunos.map((nome) => (
                              <span
                                key={nome}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 flex items-center gap-1"
                              >
                                {nome}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removerItemLista(setTripulacaoEdit, 'alunos', nome)
                                  }
                                  className="text-red-400 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-qth-orange mb-1 uppercase">
                          Justificativa da Alteração *
                        </label>
                        <input
                          type="text"
                          value={justificativaTroca}
                          onChange={(e) => setJustificativaTroca(e.target.value)}
                          placeholder="EX: TROCA DE TRIPULANTE NO MEIO DO PLANTÃO"
                          className="w-full bg-qth-bg border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gerarNovoPin}
                          onChange={(e) => setGerarNovoPin(e.target.checked)}
                        />
                        <span>Gerar novo PIN de acesso para celulares secundários</span>
                      </label>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleSalvarEdicaoTripulacao(pl)}
                          className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {salvando ? 'SALVANDO...' : 'SALVAR EQUIPE'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}