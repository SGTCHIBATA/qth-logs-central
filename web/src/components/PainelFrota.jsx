import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import cidadesData from '../data/cidades.json'
import { Truck, Plus, Edit3, Trash2, Save, X, Gauge } from 'lucide-react'

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

const FORM_INICIAL = {
  prefixo: '',
  placa: '',
  tipo: '',
  estado: '',
  cidade: '',
  km_atual: '',
  status: '',
}

export default function PainelFrota({ perfil }) {
  const [viaturas, setViaturas] = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState(FORM_INICIAL)
  const [editandoId, setEditandoId] = useState(null)
  const [vtrOriginal, setVtrOriginal] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

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

  const opcoesPlacas = useMemo(
    () => veiculos.map((v) => v.placa.toUpperCase()).sort(),
    [veiculos]
  )

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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function buscarFrota() {
    const [{ data: dataVtrs, error: errVtrs }, { data: dataVecs }] = await Promise.all([
      supabase
        .from('viaturas')
        .select('*, veiculo:veiculos(id, placa, km_atual)')
        .order('prefixo', { ascending: true }),
      supabase.from('veiculos').select('*').order('placa', { ascending: true }),
    ])

    if (!errVtrs && dataVtrs) setViaturas(dataVtrs)
    if (dataVecs) setVeiculos(dataVecs)
    setCarregando(false)
  }

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
    const kmLimpo = form.km_atual.replace(/\D/g, '')
    const cidadeUpper = form.cidade.trim().toUpperCase()

    // 1. Cria ou atualiza o veículo físico (Placa -> KM)
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

    // Registra auditoria específica de KM na placa, se mudou
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

    // 2. Salva ou atualiza a viatura operacional vinculada à placa
    const payload = {
      prefixo: form.prefixo.trim().toUpperCase(),
      placa: placaUpper,
      veiculo_id: veiculoSalvo.id,
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
          campos: ['prefixo', 'placa', 'tipo', 'estado', 'cidade', 'status'],
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
    if (status === 'DISPONIVEL') return 'bg-qth-green/20 text-green-400 border-qth-green/50'
    if (status === 'BAIXADA' || status === 'INTERCORRENCIA' || status === 'SEM CONDICOES')
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

          <div className="flex items-end">
            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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

      {/* Lista de Viaturas */}
      {carregando ? (
        <p className="text-xs text-slate-400 text-center py-6">CARREGANDO FROTA...</p>
      ) : viaturas.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">
          NENHUMA VIATURA CADASTRADA.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {viaturas.map((vtr) => {
            const placaExibicao = vtr.veiculo?.placa || vtr.placa
            const kmExibicao = vtr.veiculo?.km_atual || vtr.km_atual || '0'

            return (
              <div
                key={vtr.id}
                className="bg-qth-card border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">{vtr.prefixo}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                        {vtr.tipo}
                      </span>
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
                      title="Trocar Placa / Editar KM / Status"
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