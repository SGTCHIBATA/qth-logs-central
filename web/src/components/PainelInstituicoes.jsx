import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import cidadesData from '../data/cidades.json'
import {
  Building2,
  Plus,
  Edit3,
  Save,
  X,
  Server,
  Truck,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'

const FORM_INSTITUICAO_INICIAL = {
  nome: '',
  sigla: '',
  uf: '',
  municipio: '',
  ativa: true,
  limite_viaturas: '50',
  limite_usuarios: '300',
  routing_enabled: false,
  routing_mode: 'OSRM_DEFAULT',
  routing_url: '',
  routing_timeout_ms: '3000',
  observacoes_plataforma: '',
}

export default function PainelInstituicoes({ perfilLogado }) {
  const isMaster = Boolean(perfilLogado?.is_platform_owner)

  const [instituicoes, setInstituicoes] = useState([])
  const [viaturas, setViaturas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [form, setForm] = useState(FORM_INSTITUICAO_INICIAL)
  const [editandoId, setEditandoId] = useState(null)
  const [instOriginal, setInstOriginal] = useState(null)

  const [instituicaoGestaoVtrsId, setInstituicaoGestaoVtrsId] = useState('')
  const [viaturaSelecionadaParaVincular, setViaturaSelecionadaParaVincular] = useState('')

  const listaEstados = useMemo(
    () => (cidadesData?.estados || []).map((e) => e.sigla.toUpperCase()).sort(),
    []
  )

  const listaCidades = useMemo(() => {
    const est = (cidadesData?.estados || []).find(
      (e) => e.sigla.toUpperCase() === (form.uf || '').toUpperCase()
    )
    return est ? est.cidades.map((c) => c.toUpperCase()).sort() : []
  }, [form.uf])

  useEffect(() => {
    if (!isMaster) {
      setCarregando(false)
      return
    }
    carregarDados()
  }, [isMaster])

  async function carregarDados() {
    setCarregando(true)
    const [{ data: dataInsts, error: errInsts }, { data: dataVtrs }] = await Promise.all([
      supabase.from('instituicoes').select('*').order('nome', { ascending: true }),
      supabase.from('viaturas').select('*').order('prefixo', { ascending: true }),
    ])

    if (!errInsts && dataInsts) {
      setInstituicoes(dataInsts)
      if (!instituicaoGestaoVtrsId && dataInsts.length > 0) {
        setInstituicaoGestaoVtrsId(dataInsts[0].id)
      }
    }
    if (dataVtrs) {
      setViaturas(dataVtrs)
    }
    setCarregando(false)
  }

  function iniciarEdicao(inst) {
    setEditandoId(inst.id)
    setInstOriginal(inst)
    setForm({
      nome: (inst.nome || '').toUpperCase(),
      sigla: (inst.sigla || '').toUpperCase(),
      uf: (inst.uf || '').toUpperCase(),
      municipio: (inst.municipio || '').toUpperCase(),
      ativa: inst.ativa !== false,
      limite_viaturas: String(inst.limite_viaturas ?? 50),
      limite_usuarios: String(inst.limite_usuarios ?? 300),
      routing_enabled: Boolean(inst.routing_enabled),
      routing_mode: inst.routing_mode || 'OSRM_DEFAULT',
      routing_url: inst.routing_url || inst.routing_endpoint_url || '',
      routing_timeout_ms: String(inst.routing_timeout_ms ?? 3000),
      observacoes_plataforma: inst.observacoes_plataforma || '',
    })
    setErro('')
    setMensagem('')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setInstOriginal(null)
    setForm(FORM_INSTITUICAO_INICIAL)
    setErro('')
  }

  async function handleSalvarInstituicao(e) {
    e.preventDefault()
    if (!isMaster) return
    setErro('')
    setMensagem('')
    setSalvando(true)

    const urlLimpa = (form.routing_url || '').trim()
    const payload = {
      nome: form.nome.trim().toUpperCase(),
      sigla: form.sigla.trim().toUpperCase() || null,
      uf: form.uf.trim().toUpperCase() || null,
      municipio: form.municipio.trim().toUpperCase() || null,
      ativa: Boolean(form.ativa),
      limite_viaturas: Math.max(1, parseInt(form.limite_viaturas, 10) || 50),
      limite_usuarios: Math.max(1, parseInt(form.limite_usuarios, 10) || 300),
      routing_enabled: Boolean(form.routing_enabled),
      routing_mode: form.routing_enabled
        ? form.routing_mode === 'CENTRAL_SERVER'
          ? 'CENTRAL_SERVER'
          : 'INSTITUTION_URL'
        : 'OSRM_DEFAULT',
      routing_url: urlLimpa || null,
      routing_endpoint_url: urlLimpa || null,
      routing_timeout_ms: Math.max(500, parseInt(form.routing_timeout_ms, 10) || 3000),
      observacoes_plataforma: (form.observacoes_plataforma || '').trim() || null,
      atualizado_em: new Date().toISOString(),
    }

    if (editandoId) {
      const { error } = await supabase
        .from('instituicoes')
        .update(payload)
        .eq('id', editandoId)

      if (error) {
        setErro(`Erro ao atualizar instituição: ${error.message}`)
      } else {
        await registrarAlteracoesEmLote({
          perfil: perfilLogado,
          tabela: 'instituicoes',
          registroId: editandoId,
          anterior: instOriginal,
          novo: payload,
          campos: ['nome', 'sigla', 'ativa', 'routing_enabled', 'routing_mode', 'routing_url'],
        })
        setMensagem(`Instituição "${payload.nome}" atualizada.`)
        cancelarEdicao()
        await carregarDados()
      }
    } else {
      const { data, error } = await supabase
        .from('instituicoes')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setErro(`Erro ao cadastrar instituição: ${error.message}`)
      } else {
        await registrarAuditoria({
          perfil: perfilLogado,
          tabela: 'instituicoes',
          registroId: data?.id,
          acao: 'CRIACAO',
          campo: 'INSTITUICAO',
          valorNovo: `${payload.nome} (${payload.routing_mode}: ${payload.routing_url || 'PADRÃO'})`,
        })
        setMensagem(`Instituição "${payload.nome}" cadastrada.`)
        setForm(FORM_INSTITUICAO_INICIAL)
        if (data?.id) setInstituicaoGestaoVtrsId(data.id)
        await carregarDados()
      }
    }

    setSalvando(false)
  }

  async function handleVincularRecursoInstituicao(e) {
    e.preventDefault()
    if (!isMaster || !instituicaoGestaoVtrsId || !viaturaSelecionadaParaVincular) return
    setSalvando(true)
    setErro('')
    setMensagem('')

    const vtr = viaturas.find((v) => v.id === viaturaSelecionadaParaVincular)
    if (!vtr) {
      setSalvando(false)
      return
    }

    const { error } = await supabase
      .from('viaturas')
      .update({
        instituicao_id: instituicaoGestaoVtrsId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', vtr.id)

    if (error) {
      setErro(`Erro ao vincular viatura ${vtr.prefixo}: ${error.message}`)
    } else {
      const instAlvo = instituicoes.find((i) => i.id === instituicaoGestaoVtrsId)
      await registrarAuditoria({
        perfil: perfilLogado,
        tabela: 'viaturas',
        registroId: vtr.id,
        acao: 'EDICAO',
        campo: 'INSTITUICAO_VTR',
        valorAnterior: vtr.instituicao_id || 'SEM_INSTITUICAO',
        valorNovo: instAlvo ? `${instAlvo.sigla || instAlvo.nome} (${vtr.prefixo})` : instituicaoGestaoVtrsId,
      })
      setViaturaSelecionadaParaVincular('')
      setMensagem(`Recurso ${vtr.prefixo} vinculado com sucesso.`)
      await carregarDados()
    }

    setSalvando(false)
  }

  async function handleDesvincularRecursoInstituicao(vtr) {
    if (!isMaster || !vtr) return
    setSalvando(true)
    const { error } = await supabase
      .from('viaturas')
      .update({
        instituicao_id: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', vtr.id)

    if (!error) {
      await registrarAuditoria({
        perfil: perfilLogado,
        tabela: 'viaturas',
        registroId: vtr.id,
        acao: 'EDICAO',
        campo: 'INSTITUICAO_VTR',
        valorAnterior: vtr.instituicao_id,
        valorNovo: 'SEM_INSTITUICAO',
      })
      setMensagem(`Vínculo da viatura ${vtr.prefixo} removido.`)
      await carregarDados()
    }
    setSalvando(false)
  }

  if (!isMaster) {
    return (
      <div className="bg-qth-card border border-red-500/40 rounded-xl p-6 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm font-extrabold text-white uppercase">Acesso Restrito ao Proprietário da Plataforma</p>
        <p className="text-xs text-slate-400">Este painel é exclusivo do administrador master do sistema.</p>
      </div>
    )
  }

  const recursosDaInstituicaoSelecionada = viaturas.filter(
    (v) => v.instituicao_id === instituicaoGestaoVtrsId
  )

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSalvarInstituicao}
        className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
            <Building2 className="w-4 h-4" />
            {editandoId ? `Editando Instituição: ${form.nome}` : 'Cadastrar Instituição & Servidor de Roteamento'}
          </h2>
          {editandoId && (
            <button
              type="button"
              onClick={cancelarEdicao}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> CANCELAR
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Nome da Instituição <span className="text-qth-orange">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="EX: SAMU NOROESTE DO PARANÁ"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Sigla
            </label>
            <input
              type="text"
              placeholder="EX: CIUENP / SAMU-NW"
              value={form.sigla}
              onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-white w-full cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
              />
              <span>INSTITUIÇÃO ATIVA</span>
            </label>
          </div>

          <SelectPesquisavel
            label="UF Sede"
            opcoes={listaEstados}
            valor={form.uf}
            onChange={(uf) => setForm({ ...form, uf, municipio: '' })}
          />

          <SelectPesquisavel
            label="Município Sede"
            opcoes={listaCidades}
            valor={form.municipio}
            permiteTextoLivre={true}
            onChange={(cid) => setForm({ ...form, municipio: cid })}
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Limite de Viaturas
            </label>
            <input
              type="number"
              min={1}
              value={form.limite_viaturas}
              onChange={(e) => setForm({ ...form, limite_viaturas: e.target.value })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Limite de Usuários
            </label>
            <input
              type="number"
              min={1}
              value={form.limite_usuarios}
              onChange={(e) => setForm({ ...form, limite_usuarios: e.target.value })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white"
            />
          </div>
        </div>

        {/* Bloco individual de servidor de roteamento da instituição */}
        <div className="bg-qth-bg/75 border border-sky-500/35 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-sky-300 uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Servidor de Roteamento Individual desta Instituição
            </span>

            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.routing_enabled}
                onChange={(e) => setForm({ ...form, routing_enabled: e.target.checked })}
              />
              <span>USAR SERVIDOR CONFIGURADO</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                Origem do Servidor
              </label>
              <select
                disabled={!form.routing_enabled}
                value={form.routing_mode === 'CENTRAL_SERVER' ? 'CENTRAL_SERVER' : 'INSTITUTION_URL'}
                onChange={(e) => setForm({ ...form, routing_mode: e.target.value })}
                className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-50"
              >
                <option value="INSTITUTION_URL">SERVIDOR PRÓPRIO DA INSTITUIÇÃO</option>
                <option value="CENTRAL_SERVER">SERVIDOR CENTRAL PRÓPRIO</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                Link / URL do Servidor de Rotas
              </label>
              <input
                type="text"
                disabled={!form.routing_enabled}
                placeholder="EX: https://rotas-instituicao.dominio.com.br"
                value={form.routing_url}
                onChange={(e) => setForm({ ...form, routing_url: e.target.value })}
                className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                Timeout (ms)
              </label>
              <input
                type="number"
                min={500}
                step={100}
                disabled={!form.routing_enabled}
                value={form.routing_timeout_ms}
                onChange={(e) => setForm({ ...form, routing_timeout_ms: e.target.value })}
                className="w-full bg-qth-card border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
            Observações Internas da Plataforma
          </label>
          <input
            type="text"
            placeholder="EX: SERVIDOR DEDICADO NA REDE LOCAL / CONTRATO ATIVO..."
            value={form.observacoes_plataforma}
            onChange={(e) => setForm({ ...form, observacoes_plataforma: e.target.value })}
            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
          />
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
            disabled={salvando}
            className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {editandoId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {salvando ? 'SALVANDO...' : editandoId ? 'SALVAR INSTITUIÇÃO' : 'CADASTRAR INSTITUIÇÃO'}
          </button>
        </div>
      </form>

      {/* Lista de Instituições Cadastradas */}
      <div className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-extrabold text-white uppercase">
          Instituições Cadastradas ({instituicoes.length})
        </h3>

        {carregando ? (
          <p className="text-xs text-slate-400">Carregando instituições...</p>
        ) : instituicoes.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhuma instituição cadastrada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {instituicoes.map((inst) => {
              const qtdVtrs = viaturas.filter((v) => v.instituicao_id === inst.id).length
              const urlExibida = inst.routing_url || inst.routing_endpoint_url
              return (
                <div
                  key={inst.id}
                  className="bg-qth-bg/75 border border-slate-700 rounded-xl p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white uppercase">
                          {inst.nome}
                        </span>
                        {inst.sigla && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                            {inst.sigla}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 uppercase">
                        {inst.municipio || '—'}{inst.uf ? ` - ${inst.uf}` : ''} • {qtdVtrs} RECURSO(S) VINCULADO(S)
                      </p>
                      <p className="text-[11px] text-sky-300 mt-1 break-all">
                        ROTA:{' '}
                        {inst.routing_enabled && urlExibida
                          ? `${inst.routing_mode} (${urlExibida})`
                          : 'PADRÃO (OSRM_DEFAULT)'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                        inst.ativa !== false
                          ? 'bg-qth-green/20 text-green-300 border-qth-green/50'
                          : 'bg-qth-red/20 text-red-300 border-qth-red/50'
                      }`}
                    >
                      {inst.ativa !== false ? (
                        <>
                          <ShieldCheck className="w-3 h-3" /> ATIVA
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3" /> INATIVA
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(inst)}
                      className="px-2.5 py-1 rounded-lg bg-qth-blue/20 hover:bg-qth-blue text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> EDITAR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Vínculo de Recursos (Viaturas) por Instituição */}
      {instituicoes.length > 0 && (
        <div className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-extrabold text-qth-orange uppercase flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            Disponibilizar / Vincular Recursos (Viaturas) à Instituição
          </h3>

          <form onSubmit={handleVincularRecursoInstituicao} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                Instituição
              </label>
              <select
                value={instituicaoGestaoVtrsId}
                onChange={(e) => setInstituicaoGestaoVtrsId(e.target.value)}
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
              >
                {instituicoes.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {(inst.sigla ? `${inst.sigla} - ` : '') + inst.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">
                Recurso / Viatura
              </label>
              <select
                value={viaturaSelecionadaParaVincular}
                onChange={(e) => setViaturaSelecionadaParaVincular(e.target.value)}
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase"
              >
                <option value="">SELECIONE UMA VIATURA...</option>
                {viaturas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.prefixo} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={salvando || !instituicaoGestaoVtrsId || !viaturaSelecionadaParaVincular}
              className="bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
            >
              VINCULAR RECURSO
            </button>
          </form>

          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] font-bold text-slate-300 uppercase">
              Recursos Disponíveis para a Instituição Selecionada ({recursosDaInstituicaoSelecionada.length}):
            </p>
            {recursosDaInstituicaoSelecionada.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum recurso vinculado a esta instituição ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recursosDaInstituicaoSelecionada.map((v) => (
                  <div
                    key={v.id}
                    className="bg-qth-bg/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-2"
                  >
                    <span className="font-extrabold text-white uppercase">{v.prefixo}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{v.tipo}</span>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => handleDesvincularRecursoInstituicao(v)}
                      className="text-red-400 hover:text-red-200 cursor-pointer"
                      title="Desvincular recurso da instituição"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}