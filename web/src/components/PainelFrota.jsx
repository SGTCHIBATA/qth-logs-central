import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import FiltroMultiSelecao from './FiltroMultiSelecao'
import cidadesData from '../data/cidades.json'
import { Truck, Plus, Edit3, Trash2, Save, X, Gauge, Search, RotateCcw, Building2 } from 'lucide-react'

const TIPOS_VTR = ['USA', 'USB', 'MOTOLANCIA', 'AEROMEDICO', 'VIR', 'APOIO']
const STATUS_VTR = [
  'DISPONIVEL',
  'ACIONADA',
  'EMPENHADA',
  'QTI',
  'NO QTH',
  'QTI UNIDADE SAUDE',
  'NA UNIDADE SAUDE',
  'QTI BASE QAP',
  'QTI BASE SEM CONDICOES',
  'SEM CONDICOES',
  'INTERCORRENCIA',
  'BAIXADA',
]

const STATUS_LIVRES_QAP = ['DISPONIVEL', 'QTI BASE QAP']
const STATUS_EM_ATENDIMENTO = [
  'ACIONADA',
  'EMPENHADA',
  'QTI',
  'NO QTH',
  'QTI UNIDADE SAUDE',
  'NA UNIDADE SAUDE',
]
const STATUS_INDISPONIVEIS = [
  'SEM CONDICOES',
  'QTI BASE SEM CONDICOES',
  'INTERCORRENCIA',
  'BAIXADA',
]

const FORM_INICIAL = {
  prefixo: '',
  placa: '',
  tipo: '',
  instituicao_id: '',
  estado: '',
  cidade: '',
  km_atual: '',
  status: '',
}

export default function PainelFrota({ perfil }) {
  const [viaturas, setViaturas] = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState(FORM_INICIAL)
  const [editandoId, setEditandoId] = useState(null)
  const [vtrOriginal, setVtrOriginal] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Pesquisa global e filtros da aba FROTA
  const [buscaTexto, setBuscaTexto] = useState('')
  const [chipGrupo, setChipGrupo] = useState('TODOS')
  const [filtroStatuses, setFiltroStatuses] = useState([])
  const [filtroTipos, setFiltroTipos] = useState([])
  const [filtroInstituicoes, setFiltroInstituicoes] = useState([])
  const [filtroCidades, setFiltroCidades] = useState([])
  const [filtroEstados, setFiltroEstados] = useState([])
  const [filtroVinculosPlaca, setFiltroVinculosPlaca] = useState([])

  const listaEstados = useMemo(
    () => (cidadesData?.estados || []).map((e) => e.sigla.toUpperCase()).sort(),
    []
  )

  const listaCidades = useMemo(() => {
    const est = (cidadesData?.estados || []).find(
      (e) => e.sigla.toUpperCase() === (form.estado || '').toUpperCase()
    )
    return est ? est.cidades.map((c) => c.toUpperCase()).sort() : []
  }, [form.estado])

  const mapaInstituicoes = useMemo(() => {
    const map = {}
    for (const inst of instituicoes) {
      map[inst.id] = (inst.sigla || inst.nome || '').toUpperCase()
    }
    return map
  }, [instituicoes])

  const opcoesInstituicoesFiltro = useMemo(
    () => instituicoes.map((inst) => (inst.sigla || inst.nome || '').toUpperCase()).filter(Boolean).sort(),
    [instituicoes]
  )

  const opcoesPlacas = useMemo(
    () => veiculos.map((v) => v.placa.toUpperCase()).sort(),
    [veiculos]
  )

  const opcoesCidadesFiltro = useMemo(() => {
    const setCid = new Set()
    for (const v of viaturas) {
      const c = (v.cidade || v.base_cidade || '').trim().toUpperCase()
      if (c) setCid.add(c)
    }
    return Array.from(setCid).sort()
  }, [viaturas])

  const opcoesEstadosFiltro = useMemo(() => {
    const setUf = new Set()
    for (const v of viaturas) {
      const uf = (v.estado || '').trim().toUpperCase()
      if (uf) setUf.add(uf)
    }
    return Array.from(setUf).sort()
  }, [viaturas])

  useEffect(() => {
    buscarFrota()

    const channel = supabase
      .channel('frota-e-veiculos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viaturas' },
        () => buscarFrota()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'veiculos' },
        () => buscarFrota()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'instituicoes' },
        () => buscarFrota()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function buscarFrota() {
    const [{ data: dataVtrs, error: errVtrs }, { data: dataVecs }, { data: dataInsts }] = await Promise.all([
      supabase
        .from('viaturas')
        .select('*, veiculo:veiculos(id, placa, km_atual)')
        .order('prefixo', { ascending: true }),
      supabase.from('veiculos').select('*').order('placa', { ascending: true }),
      supabase.from('instituicoes').select('*').order('nome', { ascending: true }),
    ])

    if (!errVtrs && dataVtrs) setViaturas(dataVtrs)
    if (dataVecs) setVeiculos(dataVecs)
    if (dataInsts) setInstituicoes(dataInsts)
    setCarregando(false)
  }

  const temFiltroAtivo =
    buscaTexto.trim() !== '' ||
    chipGrupo !== 'TODOS' ||
    filtroStatuses.length > 0 ||
    filtroTipos.length > 0 ||
    filtroInstituicoes.length > 0 ||
    filtroCidades.length > 0 ||
    filtroEstados.length > 0 ||
    filtroVinculosPlaca.length > 0

  function limparFiltros() {
    setBuscaTexto('')
    setChipGrupo('TODOS')
    setFiltroStatuses([])
    setFiltroTipos([])
    setFiltroInstituicoes([])
    setFiltroCidades([])
    setFiltroEstados([])
    setFiltroVinculosPlaca([])
  }

  const viaturasFiltradas = useMemo(() => {
    const termo = buscaTexto.trim().toUpperCase()

    return viaturas.filter((vtr) => {
      const prefixo = (vtr.prefixo || '').toUpperCase()
      const placaReal = (vtr.veiculo?.placa || vtr.placa || '').toUpperCase()
      const kmReal = String(vtr.veiculo?.km_atual ?? vtr.km_atual ?? '').toUpperCase()
      const tipo = (vtr.tipo || '').toUpperCase()
      const nomeInst = (mapaInstituicoes[vtr.instituicao_id] || '').toUpperCase()
      const cidade = (vtr.cidade || vtr.base_cidade || '').toUpperCase()
      const estado = (vtr.estado || '').toUpperCase()
      const status = (vtr.status || '').toUpperCase()

      if (termo) {
        const match =
          prefixo.includes(termo) ||
          placaReal.includes(termo) ||
          nomeInst.includes(termo) ||
          cidade.includes(termo) ||
          estado.includes(termo) ||
          tipo.includes(termo) ||
          status.includes(termo) ||
          kmReal.includes(termo)
        if (!match) return false
      }

      if (chipGrupo === 'LIVRES' && !STATUS_LIVRES_QAP.includes(status)) return false
      if (chipGrupo === 'ATENDIMENTO' && !STATUS_EM_ATENDIMENTO.includes(status)) return false
      if (chipGrupo === 'INDISPONIVEIS' && !STATUS_INDISPONIVEIS.includes(status)) return false

      if (filtroStatuses.length > 0 && !filtroStatuses.includes(status)) return false
      if (filtroTipos.length > 0 && !filtroTipos.includes(tipo)) return false
      if (filtroInstituicoes.length > 0 && !filtroInstituicoes.includes(nomeInst)) return false
      if (filtroCidades.length > 0 && !filtroCidades.includes(cidade)) return false
      if (filtroEstados.length > 0 && !filtroEstados.includes(estado)) return false

      if (filtroVinculosPlaca.length > 0) {
        const temPlaca = Boolean(vtr.veiculo?.placa || vtr.placa)
        const bateVinculo =
          (filtroVinculosPlaca.includes('COM PLACA VINCULADA') && temPlaca) ||
          (filtroVinculosPlaca.includes('SEM PLACA VINCULADA') && !temPlaca)
        if (!bateVinculo) return false
      }

      return true
    })
  }, [
    viaturas,
    buscaTexto,
    chipGrupo,
    filtroStatuses,
    filtroTipos,
    filtroInstituicoes,
    filtroCidades,
    filtroEstados,
    filtroVinculosPlaca,
    mapaInstituicoes,
  ])

  function handlePlacaChange(novaPlaca) {
    const placaUpper = novaPlaca.trim().toUpperCase()
    const veiculoExistente = veiculos.find((v) => v.placa.toUpperCase() === placaUpper)

    setForm((prev) => ({
      ...prev,
      placa: placaUpper,
      km_atual: veiculoExistente ? veiculoExistente.km_atual || '' : prev.km_atual,
    }))
  }

  function iniciarEdicao(vtr) {
    const placaReal = (vtr.veiculo?.placa || vtr.placa || '').toUpperCase()
    const kmReal = vtr.veiculo?.km_atual ?? vtr.km_atual ?? ''

    setEditandoId(vtr.id)
    setVtrOriginal({ ...vtr, placa: placaReal, km_atual: kmReal })
    setForm({
      prefixo: (vtr.prefixo || '').toUpperCase(),
      placa: placaReal,
      tipo: (vtr.tipo || '').toUpperCase(),
      instituicao_id: vtr.instituicao_id || perfil?.instituicao_id || '',
      estado: (vtr.estado || '').toUpperCase(),
      cidade: (vtr.cidade || vtr.base_cidade || '').toUpperCase(),
      km_atual: kmReal,
      status: (vtr.status || '').toUpperCase(),
    })
    setErro('')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setVtrOriginal(null)
    setForm(FORM_INICIAL)
    setErro('')
  }

  async function handleSalvar(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    const placaUpper = form.placa.trim().toUpperCase()
    const kmLimpo = String(form.km_atual || '').replace(/\D/g, '')
    const cidadeUpper = form.cidade.trim().toUpperCase()

    const veiculoAnterior = veiculos.find((v) => v.placa.toUpperCase() === placaUpper)

    const { data: veiculoSalvo, error: errVeiculo } = await supabase
      .from('veiculos')
      .upsert(
        {
          placa: placaUpper,
          km_atual: kmLimpo,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'placa' }
      )
      .select()
      .single()

    if (errVeiculo || !veiculoSalvo) {
      setErro(`Erro ao salvar veículo (placa): ${errVeiculo?.message || 'Verifique os dados.'}`)
      setSalvando(false)
      return
    }

    if (veiculoAnterior && String(veiculoAnterior.km_atual || '') !== String(kmLimpo)) {
      await registrarAuditoria({
        perfil,
        tabela: 'veiculos',
        registroId: veiculoSalvo.id,
        acao: 'EDICAO',
        campo: `KM_PLACA_${placaUpper}`,
        valorAnterior: veiculoAnterior.km_atual || '0',
        valorNovo: kmLimpo || '0',
      })
    } else if (!veiculoAnterior) {
      await registrarAuditoria({
        perfil,
        tabela: 'veiculos',
        registroId: veiculoSalvo.id,
        acao: 'CRIACAO',
        campo: 'VEICULO',
        valorNovo: `PLACA ${placaUpper} - KM: ${kmLimpo || '0'}`,
      })
    }

    const instituicaoEscolhida = form.instituicao_id || perfil?.instituicao_id || null

    const payload = {
      prefixo: form.prefixo.trim().toUpperCase(),
      placa: placaUpper,
      veiculo_id: veiculoSalvo.id,
      instituicao_id: instituicaoEscolhida,
      tipo: form.tipo.trim().toUpperCase(),
      estado: form.estado.trim().toUpperCase(),
      cidade: cidadeUpper,
      base_cidade: cidadeUpper,
      km_atual: kmLimpo,
      status: form.status.trim().toUpperCase(),
    }

    if (editandoId) {
      const { error } = await supabase
        .from('viaturas')
        .update(payload)
        .eq('id', editandoId)

      if (error) {
        setErro(`Erro ao atualizar viatura: ${error.message}`)
      } else {
        await registrarAlteracoesEmLote({
          perfil,
          tabela: 'viaturas',
          registroId: editandoId,
          anterior: vtrOriginal,
          novo: payload,
          campos: ['prefixo', 'placa', 'tipo', 'instituicao_id', 'estado', 'cidade', 'status'],
        })
        cancelarEdicao()
        buscarFrota()
      }
    } else {
      const { data, error } = await supabase
        .from('viaturas')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setErro(`Erro ao cadastrar viatura: ${error.message}`)
      } else {
        await registrarAuditoria({
          perfil,
          tabela: 'viaturas',
          registroId: data?.id,
          acao: 'CRIACAO',
          campo: 'VIATURA',
          valorNovo: `${payload.prefixo} (${placaUpper}) - KM: ${kmLimpo || '0'}`,
        })
        setForm(FORM_INICIAL)
        buscarFrota()
      }
    }

    setSalvando(false)
  }

  async function handleExcluir(vtr) {
    const placaAtual = vtr.veiculo?.placa || vtr.placa
    const confirmou = window.confirm(
      `Deseja remover a viatura ${vtr.prefixo} (${placaAtual})? O histórico de KM da placa será preservado.`
    )
    if (!confirmou) return

    const { error } = await supabase.from('viaturas').delete().eq('id', vtr.id)
    if (error) {
      alert(`Não foi possível remover (pode estar vinculada a ocorrências): ${error.message}`)
    } else {
      await registrarAuditoria({
        perfil,
        tabela: 'viaturas',
        registroId: vtr.id,
        acao: 'EXCLUSAO',
        campo: 'VIATURA',
        valorAnterior: `${vtr.prefixo} (${placaAtual})`,
      })
      buscarFrota()
    }
  }

  function corStatus(status) {
    if (status === 'DISPONIVEL' || status === 'QTI BASE QAP')
      return 'bg-qth-green/20 text-green-400 border-qth-green/50'
    if (
      status === 'BAIXADA' ||
      status === 'INTERCORRENCIA' ||
      status === 'SEM CONDICOES' ||
      status === 'QTI BASE SEM CONDICOES'
    )
      return 'bg-qth-red/20 text-red-400 border-qth-red/50'
    return 'bg-qth-yellow/20 text-yellow-300 border-qth-yellow/50'
  }

  return (
    <div className="space-y-4">
      {/* Formulário de Cadastro / Edição */}
      <form
        onSubmit={handleSalvar}
        className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
            <Truck className="w-4 h-4" />
            {editandoId ? `Editando ${form.prefixo}` : 'Cadastrar Nova Viatura'}
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
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Prefixo <span className="text-qth-orange">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="EX: USA 01"
              value={form.prefixo}
              onChange={(e) => setForm({ ...form, prefixo: e.target.value.toUpperCase() })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
            />
          </div>

          <SelectPesquisavel
            label="Placa do Veículo (KM vinculado)"
            opcoes={opcoesPlacas}
            valor={form.placa}
            onChange={handlePlacaChange}
            permiteTextoLivre={true}
            placeholder="SELECIONE OU DIGITE A PLACA"
            required
          />

          <SelectPesquisavel
            label="Tipo"
            opcoes={TIPOS_VTR}
            valor={form.tipo}
            onChange={(val) => setForm({ ...form, tipo: val })}
            required
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Instituição Vinculada
            </label>
            <select
              value={form.instituicao_id}
              onChange={(e) => setForm({ ...form, instituicao_id: e.target.value })}
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase focus:outline-none focus:border-qth-orange"
            >
              <option value="">PADRÃO / SEM VÍNCULO</option>
              {instituicoes.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {(inst.sigla ? `${inst.sigla} - ` : '') + inst.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              KM Atual da Placa
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="EX: 145200"
              value={form.km_atual}
              onChange={(e) =>
                setForm({ ...form, km_atual: e.target.value.replace(/\D/g, '') })
              }
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-qth-orange uppercase focus:outline-none focus:border-qth-orange"
            />
          </div>

          <SelectPesquisavel
            label="UF Base"
            opcoes={listaEstados}
            valor={form.estado}
            onChange={(val) => setForm({ ...form, estado: val, cidade: '' })}
            required
          />

          <SelectPesquisavel
            label="Cidade Base (Aceita Distrito)"
            opcoes={listaCidades}
            valor={form.cidade}
            onChange={(val) => setForm({ ...form, cidade: val })}
            permiteTextoLivre={true}
            placeholder="EX: UMUARAMA OU LOVAT"
            required
          />

          <SelectPesquisavel
            label="Status Operacional"
            opcoes={STATUS_VTR}
            valor={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            required
          />

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {editandoId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {salvando ? 'SALVANDO...' : editandoId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR VIATURA'}
            </button>
          </div>
        </div>

        {erro && (
          <p className="text-xs text-red-400 bg-qth-red/15 border border-qth-red/40 p-2 rounded-lg">
            {erro}
          </p>
        )}
      </form>

      {/* Pesquisa Global e Filtros da Aba FROTA */}
      <div className="bg-qth-card border border-slate-700/70 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value.toUpperCase())}
              placeholder="PESQUISAR POR PREFIXO, PLACA, INSTITUIÇÃO, CIDADE, UF, TIPO OU KM..."
              className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange"
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
            <span className="text-[11px] font-bold text-slate-300 bg-qth-bg/80 border border-slate-700 px-2.5 py-1.5 rounded-lg">
              {viaturasFiltradas.length} DE {viaturas.length}
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

        {/* Chips Rápidos de Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'TODOS', label: 'TODAS' },
            { id: 'LIVRES', label: 'LIVRES / QAP' },
            { id: 'ATENDIMENTO', label: 'EM ATENDIMENTO' },
            { id: 'INDISPONIVEIS', label: 'INDISPONÍVEIS / BAIXADAS' },
          ].map((chip) => {
            const ativo = chipGrupo === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setChipGrupo(chip.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase cursor-pointer transition-colors border ${ativo
                    ? 'bg-qth-orange text-white border-qth-orange'
                    : 'bg-qth-bg/70 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Filtros Específicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <FiltroMultiSelecao
            label="Status"
            opcoes={STATUS_VTR}
            valores={filtroStatuses}
            onChange={setFiltroStatuses}
            placeholderVazio="TODOS"
          />

          <FiltroMultiSelecao
            label="Tipo"
            opcoes={TIPOS_VTR}
            valores={filtroTipos}
            onChange={setFiltroTipos}
            placeholderVazio="TODOS"
          />

          <FiltroMultiSelecao
            label="Instituição"
            opcoes={opcoesInstituicoesFiltro}
            valores={filtroInstituicoes}
            onChange={setFiltroInstituicoes}
            placeholderVazio="TODAS"
          />

          <FiltroMultiSelecao
            label="Cidade / Base"
            opcoes={opcoesCidadesFiltro}
            valores={filtroCidades}
            onChange={setFiltroCidades}
            placeholderVazio="TODAS"
          />

          <FiltroMultiSelecao
            label="UF"
            opcoes={opcoesEstadosFiltro}
            valores={filtroEstados}
            onChange={setFiltroEstados}
            placeholderVazio="TODAS"
          />

          <FiltroMultiSelecao
            label="Vínculo de Placa"
            opcoes={['COM PLACA VINCULADA', 'SEM PLACA VINCULADA']}
            valores={filtroVinculosPlaca}
            onChange={setFiltroVinculosPlaca}
            placeholderVazio="TODAS"
          />
        </div>
      </div>

      {/* Lista de Viaturas */}
      {carregando ? (
        <p className="text-xs text-slate-400 text-center py-6">CARREGANDO FROTA...</p>
      ) : viaturasFiltradas.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-slate-400">
            NENHUMA VIATURA ENCONTRADA COM OS FILTROS ATUAIS.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {viaturasFiltradas.map((vtr) => {
            const placaExibicao = vtr.veiculo?.placa || vtr.placa
            const kmExibicao = vtr.veiculo?.km_atual || vtr.km_atual || '0'
            const nomeInstituicao = mapaInstituicoes[vtr.instituicao_id] || ''

            return (
              <div
                key={vtr.id}
                className="bg-qth-card border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-extrabold text-white">{vtr.prefixo}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                        {vtr.tipo}
                      </span>
                      {nomeInstituicao && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-900/50 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
                          {nomeInstituicao}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      PLACA: <strong className="text-slate-200">{placaExibicao}</strong> • {vtr.cidade || vtr.base_cidade} - {vtr.estado}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${corStatus(
                      vtr.status
                    )}`}
                  >
                    {vtr.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-xs text-qth-yellow font-bold">
                    <Gauge className="w-4 h-4" />
                    <span>KM: {kmExibicao}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => iniciarEdicao(vtr)}
                      className="p-1.5 rounded-lg bg-qth-blue/20 hover:bg-qth-blue text-blue-300 hover:text-white transition-colors cursor-pointer"
                      title="Trocar Placa / Editar KM / Status / Instituição"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExcluir(vtr)}
                      className="p-1.5 rounded-lg bg-qth-red/20 hover:bg-qth-red text-red-300 hover:text-white transition-colors cursor-pointer"
                      title="Remover Viatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}