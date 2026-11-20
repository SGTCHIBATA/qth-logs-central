import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
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
  viatura_atual_id: '',
  ativo: 'ATIVO',
}

export default function PainelGestor({ perfilLogado }) {
  const cargoLogado = (perfilLogado?.cargo || '').toUpperCase()
  const isGestor = cargoLogado === 'GESTOR'
  const cargosDisponiveis = isGestor
    ? TODOS_CARGOS
    : TODOS_CARGOS.filter((c) => c !== 'GESTOR')

  const [perfis, setPerfis] = useState([])
  const [viaturas, setViaturas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false)
  const [formNovo, setFormNovo] = useState(FORM_NOVO_INICIAL)
  const [criando, setCriando] = useState(false)
  const [erroNovo, setErroNovo] = useState('')
  const [sucessoNovo, setSucessoNovo] = useState('')

  const [expandidoId, setExpandidoId] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const todasCidades = useMemo(() => {
    const lista = []
    for (const est of cidadesData?.estados || []) {
      for (const cid of est.cidades || []) {
        lista.push(`${cid.toUpperCase()} - ${est.sigla.toUpperCase()}`)
      }
    }
    return lista.sort()
  }, [])

  const opcoesViaturas = useMemo(
    () => viaturas.map((v) => v.prefixo.toUpperCase()),
    [viaturas]
  )

  const opcoesBases = useMemo(() => {
    const setBases = new Set()
    for (const p of perfis) {
      const b = (p.base || '').trim().toUpperCase()
      if (b) setBases.add(b)
    }
    return Array.from(setBases).sort()
  }, [perfis])

  const prefixoVtrNovo = useMemo(() => {
    const v = viaturas.find((i) => i.id === formNovo.viatura_atual_id)
    return v ? v.prefixo.toUpperCase() : ''
  }, [viaturas, formNovo.viatura_atual_id])

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    const [{ data: dataPerfis }, { data: dataVtrs }] = await Promise.all([
      supabase.from('perfis').select('*'),
      supabase.from('viaturas').select('id, prefixo').order('prefixo', { ascending: true }),
    ])

    if (dataPerfis) {
      const ordenados = [...dataPerfis].sort((a, b) =>
        (a.nome_completo || '').localeCompare(b.nome_completo || '')
      )
      setPerfis(ordenados)
    }
    if (dataVtrs) setViaturas(dataVtrs)
    setCarregando(false)
  }

  function alternarCard(u) {
    if (expandidoId === u.id) {
      setExpandidoId(null)
      return
    }
    setExpandidoId(u.id)
    setFormEdit({
      nome_completo: (u.nome_completo || '').toUpperCase(),
      cpf: u.cpf || '',
      matricula: (u.matricula || '').toUpperCase(),
      email: u.email || '',
      cargo: (u.cargo || '').toUpperCase(),
      funcao_vtr: (u.funcao_vtr || '').toUpperCase(),
      base: (u.base || '').toUpperCase(),
      municipio_lotacao: (u.municipio_lotacao || '').toUpperCase(),
      viatura_atual_id: u.viatura_atual_id || '',
      ativo: u.ativo === false ? 'INATIVO' : 'ATIVO',
    })
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
      setFormNovo(FORM_NOVO_INICIAL)
      buscarDados()
    }

    setCriando(false)
  }

  async function handleSalvarEdicao(usuario) {
    setSalvandoEdicao(true)

    const payload = {
      nome_completo: (formEdit.nome_completo || '').trim().toUpperCase(),
      cpf: (formEdit.cpf || '').replace(/\D/g, '') || null,
      matricula: (formEdit.matricula || '').trim().toUpperCase() || null,
      email: (formEdit.email || '').trim().toLowerCase() || null,
      cargo: (formEdit.cargo || '').trim().toUpperCase(),
      funcao_vtr: (formEdit.funcao_vtr || '').trim().toUpperCase() || null,
      base: (formEdit.base || '').trim().toUpperCase(),
      municipio_lotacao: (formEdit.municipio_lotacao || '').trim().toUpperCase(),
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

              <SelectPesquisavel
                label="Viatura Atual (Opcional)"
                opcoes={opcoesViaturas}
                valor={prefixoVtrNovo}
                onChange={(prefixo) => {
                  const v = viaturas.find((i) => i.prefixo.toUpperCase() === prefixo)
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

        {/* Lista de Usuários */}
        {carregando ? (
          <p className="text-xs text-slate-400 py-4 text-center">CARREGANDO EQUIPES...</p>
        ) : perfis.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            NENHUM USUÁRIO ENCONTRADO.
          </p>
        ) : (
          <div className="space-y-2.5">
            {perfis.map((u) => {
              const aberto = expandidoId === u.id
              const cargoAlvo = (u.cargo || 'SEM CARGO').toUpperCase()
              const bloqueadoPorHierarquia = !isGestor && cargoAlvo === 'GESTOR'
              const prefixoVtrEdit =
                viaturas.find((v) => v.id === formEdit.viatura_atual_id)?.prefixo?.toUpperCase() || ''

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

                        <SelectPesquisavel
                          label="Viatura Atual"
                          opcoes={opcoesViaturas}
                          valor={prefixoVtrEdit}
                          disabled={bloqueadoPorHierarquia}
                          onChange={(prefixo) => {
                            const v = viaturas.find((i) => i.prefixo.toUpperCase() === prefixo)
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

                      {!bloqueadoPorHierarquia && (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
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