import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import FiltroMultiSelecao from './FiltroMultiSelecao'
import cidadesData from '../data/cidades.json'
import {
  Users,
  ShieldCheck,
  UserPlus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Lock,
  Search,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'

const TODOS_CARGOS = [
  'GESTOR',
  'COORDENADOR',
  'RADIO OPERADOR',
  'MEDICO REGULADOR',
  'TARM',
  'TRIPULANTE',
]

const FUNCOES_VTR = [
  'MEDICO',
  'ENFERMEIRO',
  'CONDUTOR',
  'TECNICO',
  'ESTAGIO OP.',
  'ALUNO',
  'COORDENACAO',
]

const STATUS_ATIVO = ['ATIVO', 'INATIVO']

const FORM_NOVO_INICIAL = {
  nome_completo: '',
  cpf: '',
  matricula: '',
  email: '',
  cargo: '',
  funcao_vtr: '',
  base: '',
  municipio_lotacao: '',
  instituicao_id: '',
  viatura_atual_id: '',
  ativo: 'ATIVO',
}

export default function PainelGestor({ perfilLogado }) {
  const isMaster = Boolean(perfilLogado?.is_platform_owner)
  const instituicaoLogadaId = perfilLogado?.instituicao_id || ''
  const cargoLogado = (perfilLogado?.cargo || '').toUpperCase()
  const isGestor = cargoLogado === 'GESTOR' || isMaster
  const isCoordenador = cargoLogado === 'COORDENADOR'
  const cargosDisponiveis = isGestor
    ? TODOS_CARGOS
    : TODOS_CARGOS.filter((c) => c !== 'GESTOR')

  const [perfis, setPerfis] = useState([])
  const [viaturas, setViaturas] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false)
  const [formNovo, setFormNovo] = useState({
    ...FORM_NOVO_INICIAL,
    instituicao_id: instituicaoLogadaId,
  })
  const [criando, setCriando] = useState(false)
  const [erroNovo, setErroNovo] = useState('')
  const [sucessoNovo, setSucessoNovo] = useState('')

  // Pesquisa global e filtros da aba GESTOR
  const [buscaTexto, setBuscaTexto] = useState('')
  const [filtroCargos, setFiltroCargos] = useState([])
  const [filtroBases, setFiltroBases] = useState([])
  const [filtroMunicipios, setFiltroMunicipios] = useState([])
  const [filtroFuncoes, setFiltroFuncoes] = useState([])
  const [filtroViaturas, setFiltroViaturas] = useState([])
  const [filtroStatusContas, setFiltroStatusContas] = useState([])

  const [expandidoId, setExpandidoId] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  // Estados para reset de senha
  const [resetSenhaUsuarioId, setResetSenhaUsuarioId] = useState(null)
  const [novaSenhaReset, setNovaSenhaReset] = useState('')
  const [mostrarSenhaReset, setMostrarSenhaReset] = useState(false)
  const [resetandoSenha, setResetandoSenha] = useState(false)
  const [erroResetSenha, setErroResetSenha] = useState('')
  const [sucessoResetSenha, setSucessoResetSenha] = useState('')

  const todasCidades = useMemo(() => {
    const lista = []
    for (const est of cidadesData?.estados || []) {
      for (const cid of est.cidades || []) {
        lista.push(`${cid.toUpperCase()} - ${est.sigla.toUpperCase()}`)
      }
    }
    return lista.sort()
  }, [])

  const viaturasEscopo = useMemo(() => {
    if (isMaster) return viaturas
    if (!instituicaoLogadaId) return viaturas
    return viaturas.filter((v) => v.instituicao_id === instituicaoLogadaId)
  }, [viaturas, isMaster, instituicaoLogadaId])

  const opcoesViaturas = useMemo(
    () => viaturasEscopo.map((v) => v.prefixo.toUpperCase()),
    [viaturasEscopo]
  )

  const mapaPrefixoPorId = useMemo(() => {
    const map = new Map()
    for (const v of viaturasEscopo) {
      map.set(v.id, (v.prefixo || '').toUpperCase())
    }
    return map
  }, [viaturasEscopo])

  const opcoesBases = useMemo(() => {
    const setBases = new Set()
    for (const p of perfis) {
      const b = (p.base || '').trim().toUpperCase()
      if (b) setBases.add(b)
    }
    return Array.from(setBases).sort()
  }, [perfis])

  const opcoesMunicipiosFiltro = useMemo(() => {
    const setMun = new Set()
    for (const p of perfis) {
      const m = (p.municipio_lotacao || '').trim().toUpperCase()
      if (m) setMun.add(m)
    }
    return Array.from(setMun).sort()
  }, [perfis])

  const opcoesFuncoesFiltro = useMemo(
    () => [...FUNCOES_VTR, 'SEM FUNÇÃO'],
    []
  )

  const opcoesViaturasFiltro = useMemo(
    () => [...opcoesViaturas, 'SEM VIATURA'],
    [opcoesViaturas]
  )

  const prefixoVtrNovo = useMemo(() => {
    const v = viaturasEscopo.find((i) => i.id === formNovo.viatura_atual_id)
    return v ? v.prefixo.toUpperCase() : ''
  }, [viaturasEscopo, formNovo.viatura_atual_id])

  useEffect(() => {
    buscarDados()
  }, [isMaster, instituicaoLogadaId])

  async function buscarDados() {
    setCarregando(true)
    let queryPerfis = supabase.from('perfis').select('*')
    let queryViaturas = supabase
      .from('viaturas')
      .select('id, prefixo, instituicao_id')
      .order('prefixo', { ascending: true })

    if (!isMaster && instituicaoLogadaId) {
      queryPerfis = queryPerfis.eq('instituicao_id', instituicaoLogadaId)
      queryViaturas = queryViaturas.eq('instituicao_id', instituicaoLogadaId)
    }

    const [{ data: dataPerfis }, { data: dataVtrs }, { data: dataInsts }] = await Promise.all([
      queryPerfis,
      queryViaturas,
      isMaster
        ? supabase.from('instituicoes').select('*').order('nome', { ascending: true })
        : Promise.resolve({ data: [] }),
    ])

    if (dataPerfis) {
      const ordenados = [...dataPerfis].sort((a, b) =>
        (a.nome_completo || '').localeCompare(b.nome_completo || '')
      )
      setPerfis(ordenados)
    }
    if (dataVtrs) setViaturas(dataVtrs)
    if (dataInsts) setInstituicoes(dataInsts)
    setCarregando(false)
  }

  function podeResetarSenhaAlvo(usuario) {
    if (!isMaster && instituicaoLogadaId && usuario?.instituicao_id && usuario.instituicao_id !== instituicaoLogadaId) {
      return false
    }
    const cargoAlvo = (usuario?.cargo || '').trim().toUpperCase()
    if (isGestor) return true
    if (isCoordenador) {
      return cargoAlvo !== 'GESTOR' && cargoAlvo !== 'COORDENADOR'
    }
    return false
  }

  const temFiltroAtivo =
    buscaTexto.trim() !== '' ||
    filtroCargos.length > 0 ||
    filtroBases.length > 0 ||
    filtroMunicipios.length > 0 ||
    filtroFuncoes.length > 0 ||
    filtroViaturas.length > 0 ||
    filtroStatusContas.length > 0

  function limparFiltros() {
    setBuscaTexto('')
    setFiltroCargos([])
    setFiltroBases([])
    setFiltroMunicipios([])
    setFiltroFuncoes([])
    setFiltroViaturas([])
    setFiltroStatusContas([])
  }

  const perfisFiltrados = useMemo(() => {
    const termo = buscaTexto.trim().toUpperCase()
    const termoDigitos = termo.replace(/\D/g, '')

    return perfis.filter((u) => {
      if (!isMaster && instituicaoLogadaId && u.instituicao_id !== instituicaoLogadaId && u.id !== perfilLogado?.id) {
        return false
      }

      const nome = (u.nome_completo || '').toUpperCase()
      const matricula = (u.matricula || '').toUpperCase()
      const cpf = (u.cpf || '').replace(/\D/g, '')
      const email = (u.email || '').toUpperCase()
      const base = (u.base || '').toUpperCase()
      const municipio = (u.municipio_lotacao || '').toUpperCase()
      const cargo = (u.cargo || '').toUpperCase()
      const funcao = (u.funcao_vtr || '').toUpperCase()
      const prefixoVtr = u.viatura_atual_id
        ? mapaPrefixoPorId.get(u.viatura_atual_id) || ''
        : ''
      const statusConta = u.ativo === false ? 'INATIVO' : 'ATIVO'

      if (termo) {
        const matchTexto =
          nome.includes(termo) ||
          matricula.includes(termo) ||
          email.includes(termo) ||
          base.includes(termo) ||
          municipio.includes(termo) ||
          prefixoVtr.includes(termo)
        const matchCpf = termoDigitos.length > 0 && cpf.includes(termoDigitos)
        if (!matchTexto && !matchCpf) return false
      }

      if (filtroCargos.length > 0 && !filtroCargos.includes(cargo)) return false
      if (filtroBases.length > 0 && !filtroBases.includes(base)) return false
      if (filtroMunicipios.length > 0 && !filtroMunicipios.includes(municipio)) return false

      if (filtroFuncoes.length > 0) {
        const valorFuncao = funcao || 'SEM FUNÇÃO'
        if (!filtroFuncoes.includes(valorFuncao)) return false
      }

      if (filtroViaturas.length > 0) {
        const valorViatura = prefixoVtr || 'SEM VIATURA'
        if (!filtroViaturas.includes(valorViatura)) return false
      }

      if (filtroStatusContas.length > 0 && !filtroStatusContas.includes(statusConta)) {
        return false
      }

      return true
    })
  }, [
    perfis,
    isMaster,
    instituicaoLogadaId,
    perfilLogado?.id,
    buscaTexto,
    filtroCargos,
    filtroBases,
    filtroMunicipios,
    filtroFuncoes,
    filtroViaturas,
    filtroStatusContas,
    mapaPrefixoPorId,
  ])

  function alternarCard(u) {
    if (expandidoId === u.id) {
      setExpandidoId(null)
      setResetSenhaUsuarioId(null)
      setNovaSenhaReset('')
      setErroResetSenha('')
      setSucessoResetSenha('')
      return
    }
    setExpandidoId(u.id)
    setResetSenhaUsuarioId(null)
    setNovaSenhaReset('')
    setMostrarSenhaReset(false)
    setErroResetSenha('')
    setSucessoResetSenha('')
    setFormEdit({
      nome_completo: (u.nome_completo || '').toUpperCase(),
      cpf: u.cpf || '',
      matricula: (u.matricula || '').toUpperCase(),
      email: u.email || '',
      cargo: (u.cargo || '').toUpperCase(),
      funcao_vtr: (u.funcao_vtr || '').toUpperCase(),
      base: (u.base || '').toUpperCase(),
      municipio_lotacao: (u.municipio_lotacao || '').toUpperCase(),
      instituicao_id: u.instituicao_id || instituicaoLogadaId || '',
      viatura_atual_id: u.viatura_atual_id || '',
      ativo: u.ativo === false ? 'INATIVO' : 'ATIVO',
    })
  }

  function abrirPainelResetSenha(usuario) {
    if (!podeResetarSenhaAlvo(usuario)) return
    if (resetSenhaUsuarioId === usuario.id) {
      setResetSenhaUsuarioId(null)
      setNovaSenhaReset('')
      setErroResetSenha('')
      setSucessoResetSenha('')
      return
    }
    setResetSenhaUsuarioId(usuario.id)
    setNovaSenhaReset('')
    setMostrarSenhaReset(false)
    setErroResetSenha('')
    setSucessoResetSenha('')
  }

  async function handleConfirmarResetSenha(usuario) {
    if (!podeResetarSenhaAlvo(usuario)) return
    setErroResetSenha('')
    setSucessoResetSenha('')

    const senhaDigitada = novaSenhaReset
    if (senhaDigitada.length < 6) {
      setErroResetSenha('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    setResetandoSenha(true)
    const { error } = await supabase.rpc('resetar_senha_usuario', {
      p_usuario_id: usuario.id,
      p_nova_senha: senhaDigitada,
    })

    if (error) {
      setErroResetSenha(`Erro ao resetar senha: ${error.message}`)
    } else {
      const nomeAlvo = (usuario.nome_completo || 'USUÁRIO').toUpperCase()
      await registrarAuditoria({
        perfil: perfilLogado,
        tabela: 'perfis',
        registroId: usuario.id,
        acao: 'EDICAO',
        campo: 'RESET_SENHA_USUARIO',
        valorNovo: `Senha redefinida para ${nomeAlvo} (${(usuario.cargo || '').toUpperCase()})`,
      })
      setSucessoResetSenha(
        `Senha de ${nomeAlvo} redefinida com sucesso. Nova senha definida: ${senhaDigitada}`
      )
      setNovaSenhaReset('')
    }

    setResetandoSenha(false)
  }

  async function handleCriarUsuario(e) {
    e.preventDefault()
    setErroNovo('')
    setSucessoNovo('')

    const matriculaLimpa = formNovo.matricula.trim().toUpperCase()
    if (!matriculaLimpa) {
      setErroNovo('Informe a matrícula ou registro do integrante.')
      return
    }

    const instituicaoDestinoId = isMaster
      ? formNovo.instituicao_id || instituicaoLogadaId || null
      : instituicaoLogadaId || null

    if (!isMaster && !instituicaoDestinoId) {
      setErroNovo('Seu usuário não está vinculado a uma instituição.')
      return
    }

    const senhaInicial = `@${matriculaLimpa}`

    setCriando(true)
    const nomeUpper = formNovo.nome_completo.trim().toUpperCase()
    const cargoUpper = formNovo.cargo.trim().toUpperCase()
    const baseUpper = formNovo.base.trim().toUpperCase()
    const municipioUpper = formNovo.municipio_lotacao.trim().toUpperCase()
    const cpfLimpo = formNovo.cpf.replace(/\D/g, '') || null
    const emailLimpo = formNovo.email.trim().toLowerCase() || null
    const funcaoUpper = formNovo.funcao_vtr.trim().toUpperCase() || null

    const { data: novoId, error: rpcError } = await supabase.rpc(
      'criar_usuario_equipe',
      {
        p_nome_completo: nomeUpper,
        p_cargo: cargoUpper,
        p_base: baseUpper,
        p_municipio_lotacao: municipioUpper,
        p_matricula: matriculaLimpa,
        p_cpf: cpfLimpo,
        p_email: emailLimpo,
        p_funcao_vtr: funcaoUpper,
        p_viatura_atual_id: formNovo.viatura_atual_id || null,
        p_ativo: formNovo.ativo !== 'INATIVO',
      }
    )

    if (rpcError || !novoId) {
      setErroNovo(`Erro ao criar conta: ${rpcError?.message || 'Verifique os dados.'}`)
    } else {
      if (instituicaoDestinoId) {
        await supabase
          .from('perfis')
          .update({ instituicao_id: instituicaoDestinoId })
          .eq('id', novoId)
      }

      await registrarAuditoria({
        perfil: perfilLogado,
        tabela: 'perfis',
        registroId: novoId,
        acao: 'CRIACAO',
        campo: 'USUARIO',
        valorNovo: `${nomeUpper} (${cargoUpper}) - MAT: ${matriculaLimpa} - BASE: ${baseUpper}`,
      })
      setSucessoNovo(
        `Usuário ${nomeUpper} criado. 1º login com Nome, CPF ou Matrícula e senha "${senhaInicial}".`
      )
      setFormNovo({
        ...FORM_NOVO_INICIAL,
        instituicao_id: instituicaoLogadaId,
      })
      buscarDados()
    }

    setCriando(false)
  }

  async function handleSalvarEdicao(usuario) {
    setSalvandoEdicao(true)

    const instituicaoFinalId = isMaster
      ? formEdit.instituicao_id || usuario.instituicao_id || null
      : instituicaoLogadaId || usuario.instituicao_id || null

    const payload = {
      nome_completo: (formEdit.nome_completo || '').trim().toUpperCase(),
      cpf: (formEdit.cpf || '').replace(/\D/g, '') || null,
      matricula: (formEdit.matricula || '').trim().toUpperCase() || null,
      email: (formEdit.email || '').trim().toLowerCase() || null,
      cargo: (formEdit.cargo || '').trim().toUpperCase(),
      funcao_vtr: (formEdit.funcao_vtr || '').trim().toUpperCase() || null,
      base: (formEdit.base || '').trim().toUpperCase(),
      municipio_lotacao: (formEdit.municipio_lotacao || '').trim().toUpperCase(),
      instituicao_id: instituicaoFinalId,
      viatura_atual_id: formEdit.viatura_atual_id || null,
      ativo: formEdit.ativo !== 'INATIVO',
    }

    const { error } = await supabase
      .from('perfis')
      .update(payload)
      .eq('id', usuario.id)

    if (error) {
      alert(`Erro ao atualizar usuário: ${error.message}`)
    } else {
      await registrarAlteracoesEmLote({
        perfil: perfilLogado,
        tabela: 'perfis',
        registroId: usuario.id,
        anterior: usuario,
        novo: payload,
        campos: [
          'nome_completo',
          'cpf',
          'matricula',
          'email',
          'cargo',
          'funcao_vtr',
          'base',
          'municipio_lotacao',
          'instituicao_id',
          'viatura_atual_id',
          'ativo',
        ],
      })
      setExpandidoId(null)
      buscarDados()
    }

    setSalvandoEdicao(false)
  }

  async function handleExcluirUsuario(usuario) {
    if (usuario.id === perfilLogado?.id) {
      alert('Você não pode excluir o seu próprio usuário enquanto está logado.')
      return
    }

    const nomeAtual = (usuario.nome_completo || 'ESTE USUÁRIO').toUpperCase()
    const confirmou = window.confirm(
      `Deseja remover o perfil de ${nomeAtual}? Ele perderá o acesso ao sistema.`
    )
    if (!confirmou) return

    const { error } = await supabase.from('perfis').delete().eq('id', usuario.id)

    if (error) {
      alert(`Erro ao excluir usuário: ${error.message}`)
    } else {
      await registrarAuditoria({
        perfil: perfilLogado,
        tabela: 'perfis',
        registroId: usuario.id,
        acao: 'EXCLUSAO',
        campo: 'USUARIO',
        valorAnterior: `${nomeAtual} (${usuario.cargo || ''})`,
      })
      setExpandidoId(null)
      buscarDados()
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
            <Users className="w-4 h-4" />
            Gestão de Equipes e Permissões
          </h2>

          <button
            type="button"
            onClick={() => {
              setMostrarFormNovo(!mostrarFormNovo)
              setErroNovo('')
              setSucessoNovo('')
            }}
            className="bg-qth-green hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {mostrarFormNovo ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {mostrarFormNovo ? 'FECHAR' : 'NOVO USUÁRIO'}
          </button>
        </div>

        {/* Formulário Completo de Criação */}
        {mostrarFormNovo && (
          <form
            onSubmit={handleCriarUsuario}
            className="bg-qth-bg/70 border border-slate-700 rounded-xl p-3.5 space-y-3"
          >
            <p className="text-xs font-bold text-slate-200 uppercase">
              Cadastrar Novo Integrante (Campos com * são obrigatórios • Senha inicial = @ + Matrícula)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                  Nome Completo <span className="text-qth-orange">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: JOÃO DA SILVA"
                  value={formNovo.nome_completo}
                  onChange={(e) =>
                    setFormNovo({ ...formNovo, nome_completo: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="APENAS NÚMEROS"
                  value={formNovo.cpf}
                  onChange={(e) =>
                    setFormNovo({ ...formNovo, cpf: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-qth-orange"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                  Matrícula / Registro <span className="text-qth-orange">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: 49300"
                  value={formNovo.matricula}
                  onChange={(e) =>
                    setFormNovo({ ...formNovo, matricula: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={formNovo.email}
                  onChange={(e) =>
                    setFormNovo({ ...formNovo, email: e.target.value })
                  }
                  className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-qth-orange"
                />
              </div>

              <SelectPesquisavel
                label="Cargo"
                opcoes={cargosDisponiveis}
                valor={formNovo.cargo}
                onChange={(val) => setFormNovo({ ...formNovo, cargo: val })}
                required
              />

              <SelectPesquisavel
                label="Função na VTR (Opcional)"
                opcoes={FUNCOES_VTR}
                valor={formNovo.funcao_vtr}
                onChange={(val) => setFormNovo({ ...formNovo, funcao_vtr: val })}
              />

              <SelectPesquisavel
                label="Base"
                opcoes={opcoesBases}
                valor={formNovo.base}
                onChange={(val) => setFormNovo({ ...formNovo, base: val })}
                permiteTextoLivre={true}
                placeholder="EX: BASE UMUARAMA"
                required
              />

              <SelectPesquisavel
                label="Município de Lotação"
                opcoes={todasCidades}
                valor={formNovo.municipio_lotacao}
                onChange={(val) => setFormNovo({ ...formNovo, municipio_lotacao: val })}
                permiteTextoLivre={true}
                placeholder="EX: UMUARAMA - PR"
                required
              />

              {isMaster && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                    Instituição
                  </label>
                  <select
                    value={formNovo.instituicao_id}
                    onChange={(e) =>
                      setFormNovo({ ...formNovo, instituicao_id: e.target.value })
                    }
                    className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
                  >
                    <option value="">SELECIONE A INSTITUIÇÃO</option>
                    {instituicoes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {(inst.sigla ? `${inst.sigla} - ` : '') + inst.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <SelectPesquisavel
                label="Viatura Atual (Opcional)"
                opcoes={opcoesViaturas}
                valor={prefixoVtrNovo}
                onChange={(prefixo) => {
                  const v = viaturasEscopo.find((i) => i.prefixo.toUpperCase() === prefixo)
                  setFormNovo({ ...formNovo, viatura_atual_id: v ? v.id : '' })
                }}
              />

              <SelectPesquisavel
                label="Status da Conta"
                opcoes={STATUS_ATIVO}
                valor={formNovo.ativo}
                onChange={(val) => setFormNovo({ ...formNovo, ativo: val })}
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={criando}
                className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
              >
                {criando ? 'CADASTRANDO...' : 'CRIAR USUÁRIO'}
              </button>
            </div>

            {erroNovo && (
              <p className="text-xs text-red-400 bg-qth-red/15 border border-qth-red/40 p-2 rounded-lg">
                {erroNovo}
              </p>
            )}
            {sucessoNovo && (
              <p className="text-xs text-green-400 bg-qth-green/15 border border-qth-green/40 p-2 rounded-lg">
                {sucessoNovo}
              </p>
            )}
          </form>
        )}

        {/* Pesquisa Global e Filtros da Aba GESTOR */}
        <div className="bg-qth-bg/70 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value.toUpperCase())}
                placeholder="PESQUISAR POR NOME, MATRÍCULA, CPF, E-MAIL, BASE OU MUNICÍPIO..."
                className="w-full bg-qth-card border border-slate-600 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange"
              />
              {buscaTexto && (
                <button
                  type="button"
                  onClick={() => setBuscaTexto('')}
                  className="text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300 bg-qth-card border border-slate-700 px-2.5 py-1.5 rounded-lg">
                {perfisFiltrados.length} DE {perfis.length}
              </span>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="bg-slate-800 hover:bg-slate-700 text-qth-orange border border-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  LIMPAR FILTROS
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <FiltroMultiSelecao
              label="Cargo"
              opcoes={TODOS_CARGOS}
              valores={filtroCargos}
              onChange={setFiltroCargos}
              placeholderVazio="TODOS"
            />

            <FiltroMultiSelecao
              label="Base"
              opcoes={opcoesBases}
              valores={filtroBases}
              onChange={setFiltroBases}
              placeholderVazio="TODAS"
            />

            <FiltroMultiSelecao
              label="Município"
              opcoes={opcoesMunicipiosFiltro}
              valores={filtroMunicipios}
              onChange={setFiltroMunicipios}
              placeholderVazio="TODOS"
            />

            <FiltroMultiSelecao
              label="Função na VTR"
              opcoes={opcoesFuncoesFiltro}
              valores={filtroFuncoes}
              onChange={setFiltroFuncoes}
              placeholderVazio="TODAS"
            />

            <FiltroMultiSelecao
              label="Viatura Atual"
              opcoes={opcoesViaturasFiltro}
              valores={filtroViaturas}
              onChange={setFiltroViaturas}
              placeholderVazio="TODAS"
            />

            <FiltroMultiSelecao
              label="Status da Conta"
              opcoes={STATUS_ATIVO}
              valores={filtroStatusContas}
              onChange={setFiltroStatusContas}
              placeholderVazio="TODOS"
            />
          </div>
        </div>

        {/* Lista de Usuários */}
        {carregando ? (
          <p className="text-xs text-slate-400 py-4 text-center">CARREGANDO EQUIPES...</p>
        ) : perfisFiltrados.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-slate-400">
              NENHUM USUÁRIO ENCONTRADO COM OS FILTROS ATUAIS.
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
          <div className="space-y-2.5">
            {perfisFiltrados.map((u) => {
              const aberto = expandidoId === u.id
              const cargoAlvo = (u.cargo || 'SEM CARGO').toUpperCase()
              const bloqueadoPorHierarquia = !isGestor && cargoAlvo === 'GESTOR'
              const permiteResetarSenha = podeResetarSenhaAlvo(u)
              const painelResetAberto = resetSenhaUsuarioId === u.id
              const prefixoVtrEdit =
                viaturasEscopo.find((v) => v.id === formEdit.viatura_atual_id)?.prefixo?.toUpperCase() || ''
              const prefixoVtrCard = u.viatura_atual_id
                ? mapaPrefixoPorId.get(u.viatura_atual_id) || ''
                : ''

              return (
                <div
                  key={u.id}
                  className="bg-qth-bg/60 border border-slate-700/60 rounded-lg transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => alternarCard(u)}
                    className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-white uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-qth-orange" />
                        {(u.nome_completo || 'SEM NOME').toUpperCase()}
                        {u.ativo === false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-qth-red/20 text-red-400">
                            INATIVO
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        MAT: {u.matricula || '—'} • BASE: {u.base || '—'} • {u.municipio_lotacao || '—'}
                        {u.funcao_vtr ? ` • ${u.funcao_vtr.toUpperCase()}` : ''}
                        {prefixoVtrCard ? ` • VTR: ${prefixoVtrCard}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-800 border border-slate-600 text-qth-orange">
                        {cargoAlvo}
                      </span>
                      {aberto ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {aberto && (
                    <div className="p-3 pt-2 border-t border-slate-700/60 space-y-3">
                      {bloqueadoPorHierarquia && (
                        <p className="text-[11px] text-yellow-300 bg-qth-yellow/10 border border-qth-yellow/30 p-2 rounded-lg flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          PERFIL DE GESTOR — SOMENTE LEITURA PARA COORDENADORES.
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            disabled={bloqueadoPorHierarquia}
                            value={formEdit.nome_completo || ''}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, nome_completo: e.target.value.toUpperCase() })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            CPF
                          </label>
                          <input
                            type="text"
                            disabled={bloqueadoPorHierarquia}
                            value={formEdit.cpf || ''}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, cpf: e.target.value.replace(/\D/g, '') })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Matrícula / Registro
                          </label>
                          <input
                            type="text"
                            disabled={bloqueadoPorHierarquia}
                            value={formEdit.matricula || ''}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, matricula: e.target.value.toUpperCase() })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            E-mail
                          </label>
                          <input
                            type="email"
                            disabled={bloqueadoPorHierarquia}
                            value={formEdit.email || ''}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, email: e.target.value })
                            }
                            className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                          />
                        </div>

                        <SelectPesquisavel
                          label="Cargo"
                          opcoes={bloqueadoPorHierarquia ? TODOS_CARGOS : cargosDisponiveis}
                          valor={formEdit.cargo || ''}
                          disabled={bloqueadoPorHierarquia}
                          onChange={(val) => setFormEdit({ ...formEdit, cargo: val })}
                        />

                        <SelectPesquisavel
                          label="Função na VTR"
                          opcoes={FUNCOES_VTR}
                          valor={formEdit.funcao_vtr || ''}
                          disabled={bloqueadoPorHierarquia}
                          onChange={(val) => setFormEdit({ ...formEdit, funcao_vtr: val })}
                        />

                        <SelectPesquisavel
                          label="Base"
                          opcoes={opcoesBases}
                          valor={formEdit.base || ''}
                          disabled={bloqueadoPorHierarquia}
                          permiteTextoLivre={true}
                          placeholder="EX: BASE UMUARAMA"
                          onChange={(val) => setFormEdit({ ...formEdit, base: val })}
                        />

                        <SelectPesquisavel
                          label="Município de Lotação"
                          opcoes={todasCidades}
                          valor={formEdit.municipio_lotacao || ''}
                          disabled={bloqueadoPorHierarquia}
                          permiteTextoLivre={true}
                          onChange={(val) => setFormEdit({ ...formEdit, municipio_lotacao: val })}
                        />

                        {isMaster && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                              Instituição
                            </label>
                            <select
                              disabled={bloqueadoPorHierarquia}
                              value={formEdit.instituicao_id || ''}
                              onChange={(e) =>
                                setFormEdit({ ...formEdit, instituicao_id: e.target.value })
                              }
                              className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                            >
                              <option value="">SEM INSTITUIÇÃO</option>
                              {instituicoes.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                  {(inst.sigla ? `${inst.sigla} - ` : '') + inst.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <SelectPesquisavel
                          label="Viatura Atual"
                          opcoes={opcoesViaturas}
                          valor={prefixoVtrEdit}
                          disabled={bloqueadoPorHierarquia}
                          onChange={(prefixo) => {
                            const v = viaturasEscopo.find((i) => i.prefixo.toUpperCase() === prefixo)
                            setFormEdit({ ...formEdit, viatura_atual_id: v ? v.id : '' })
                          }}
                        />

                        <SelectPesquisavel
                          label="Status da Conta"
                          opcoes={STATUS_ATIVO}
                          valor={formEdit.ativo || 'ATIVO'}
                          disabled={bloqueadoPorHierarquia}
                          onChange={(val) => setFormEdit({ ...formEdit, ativo: val })}
                        />
                      </div>

                      {painelResetAberto && permiteResetarSenha && (
                        <div className="bg-qth-card border border-qth-orange/60 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" />
                              Redefinir Senha de {(u.nome_completo || 'USUÁRIO').toUpperCase()}
                            </span>
                            <button
                              type="button"
                              onClick={() => abrirPainelResetSenha(u)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="Fechar redefinição de senha"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[220px]">
                              <input
                                type={mostrarSenhaReset ? 'text' : 'password'}
                                value={novaSenhaReset}
                                onChange={(e) => setNovaSenhaReset(e.target.value)}
                                placeholder="DIGITE A NOVA SENHA (MÍN. 6 CARACTERES)"
                                className="w-full bg-qth-bg border border-slate-600 rounded-lg pl-3 pr-9 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-qth-orange"
                              />
                              <button
                                type="button"
                                onClick={() => setMostrarSenhaReset((prev) => !prev)}
                                className="text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                                title={mostrarSenhaReset ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {mostrarSenhaReset ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={resetandoSenha || novaSenhaReset.length < 6}
                              onClick={() => handleConfirmarResetSenha(u)}
                              className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              {resetandoSenha ? 'REDEFININDO...' : 'CONFIRMAR NOVA SENHA'}
                            </button>
                          </div>

                          {erroResetSenha && (
                            <p className="text-xs text-red-400 bg-qth-red/15 border border-qth-red/40 p-2 rounded-lg">
                              {erroResetSenha}
                            </p>
                          )}

                          {sucessoResetSenha && (
                            <p className="text-xs text-green-400 bg-qth-green/15 border border-qth-green/40 p-2 rounded-lg font-semibold">
                              {sucessoResetSenha}
                            </p>
                          )}
                        </div>
                      )}

                      {(!bloqueadoPorHierarquia || permiteResetarSenha) && (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          {permiteResetarSenha && (
                            <button
                              type="button"
                              onClick={() => abrirPainelResetSenha(u)}
                              className="bg-qth-orange/20 hover:bg-qth-orange text-orange-300 hover:text-white border border-qth-orange/40 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              RESETAR SENHA
                            </button>
                          )}

                          {!bloqueadoPorHierarquia && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleExcluirUsuario(u)}
                                className="bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                EXCLUIR
                              </button>

                              <button
                                type="button"
                                disabled={salvandoEdicao}
                                onClick={() => handleSalvarEdicao(u)}
                                className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                {salvandoEdicao ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
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