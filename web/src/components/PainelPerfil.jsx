import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import cidadesData from '../data/cidades.json'
import { User, Mail, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react'

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

export default function PainelPerfil({ perfil, sessionEmail, onPerfilAtualizado }) {
    const cargoAtual = (perfil?.cargo || '').toUpperCase()
    const podeEditarDados = cargoAtual === 'GESTOR' || cargoAtual === 'COORDENADOR'
    const cargosPermitidos =
        cargoAtual === 'GESTOR'
            ? TODOS_CARGOS
            : TODOS_CARGOS.filter((c) => c !== 'GESTOR')

    const [viaturas, setViaturas] = useState([])
    const [basesExistentes, setBasesExistentes] = useState([])
    const [form, setForm] = useState({
        nome_completo: (perfil?.nome_completo || '').toUpperCase(),
        cpf: perfil?.cpf || '',
        matricula: (perfil?.matricula || '').toUpperCase(),
        cargo: cargoAtual,
        funcao_vtr: (perfil?.funcao_vtr || '').toUpperCase(),
        base: (perfil?.base || '').toUpperCase(),
        municipio_lotacao: (perfil?.municipio_lotacao || '').toUpperCase(),
        viatura_atual_id: perfil?.viatura_atual_id || '',
    })

    const [salvandoDados, setSalvandoDados] = useState(false)
    const [msgDados, setMsgDados] = useState({ tipo: '', texto: '' })

    const [novoEmail, setNovoEmail] = useState('')
    const [confirmaEmail, setConfirmaEmail] = useState('')
    const [salvandoEmail, setSalvandoEmail] = useState(false)
    const [msgEmail, setMsgEmail] = useState({ tipo: '', texto: '' })

    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmaSenha, setConfirmaSenha] = useState('')
    const [salvandoSenha, setSalvandoSenha] = useState(false)
    const [msgSenha, setMsgSenha] = useState({ tipo: '', texto: '' })

    const todasCidades = useMemo(() => {
        const lista = []
        for (const est of cidadesData?.estados || []) {
            for (const cid of est.cidades || []) {
                lista.push(`${cid.toUpperCase()} - ${est.sigla.toUpperCase()}`)
            }
        }
        return lista.sort()
    }, [])

    useEffect(() => {
        Promise.all([
            supabase.from('viaturas').select('id, prefixo').order('prefixo', { ascending: true }),
            supabase.from('perfis').select('base'),
        ]).then(([{ data: dataVtrs }, { data: dataBases }]) => {
            if (dataVtrs) setViaturas(dataVtrs)
            if (dataBases) {
                const setB = new Set()
                for (const item of dataBases) {
                    const b = (item.base || '').trim().toUpperCase()
                    if (b) setB.add(b)
                }
                setBasesExistentes(Array.from(setB).sort())
            }
        })
    }, [])

    const opcoesViaturas = useMemo(
        () => viaturas.map((v) => v.prefixo.toUpperCase()),
        [viaturas]
    )

    const prefixoVtrAtual = useMemo(() => {
        const encontrada = viaturas.find((v) => v.id === form.viatura_atual_id)
        return encontrada ? encontrada.prefixo.toUpperCase() : ''
    }, [viaturas, form.viatura_atual_id])

    async function handleSalvarDados(e) {
        e.preventDefault()
        if (!podeEditarDados) return
        setMsgDados({ tipo: '', texto: '' })
        setSalvandoDados(true)

        const payload = {
            nome_completo: form.nome_completo.trim().toUpperCase(),
            cpf: form.cpf.replace(/\D/g, '') || null,
            matricula: form.matricula.trim().toUpperCase() || null,
            cargo: form.cargo.trim().toUpperCase(),
            funcao_vtr: form.funcao_vtr.trim().toUpperCase() || null,
            base: form.base.trim().toUpperCase(),
            municipio_lotacao: form.municipio_lotacao.trim().toUpperCase(),
            viatura_atual_id: form.viatura_atual_id || null,
        }

        const { error } = await supabase
            .from('perfis')
            .update(payload)
            .eq('id', perfil.id)

        if (error) {
            setMsgDados({ tipo: 'erro', texto: `Erro ao salvar: ${error.message}` })
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'perfis',
                registroId: perfil.id,
                anterior: perfil,
                novo: payload,
                campos: [
                    'nome_completo',
                    'cpf',
                    'matricula',
                    'cargo',
                    'funcao_vtr',
                    'base',
                    'municipio_lotacao',
                    'viatura_atual_id',
                ],
            })
            setMsgDados({ tipo: 'ok', texto: 'Dados do perfil atualizados com sucesso.' })
            onPerfilAtualizado()
        }
        setSalvandoDados(false)
    }

    async function handleAlterarEmail(e) {
        e.preventDefault()
        setMsgEmail({ tipo: '', texto: '' })

        const e1 = novoEmail.trim().toLowerCase()
        const e2 = confirmaEmail.trim().toLowerCase()

        if (e1 !== e2) {
            setMsgEmail({ tipo: 'erro', texto: 'Os dois e-mails digitados não coincidem.' })
            return
        }

        setSalvandoEmail(true)
        const { error: rpcErr } = await supabase.rpc('atualizar_meu_email', {
            p_novo_email: e1,
        })

        if (rpcErr) {
            setMsgEmail({ tipo: 'erro', texto: `Erro ao alterar e-mail: ${rpcErr.message}` })
            setSalvandoEmail(false)
            return
        }

        await supabase.auth.refreshSession()

        await registrarAuditoria({
            perfil,
            tabela: 'perfis',
            registroId: perfil.id,
            acao: 'EDICAO',
            campo: 'email',
            valorAnterior: perfil?.email || sessionEmail || '',
            valorNovo: e1,
        })

        setNovoEmail('')
        setConfirmaEmail('')
        setMsgEmail({ tipo: 'ok', texto: 'E-mail atualizado com sucesso.' })
        onPerfilAtualizado()
        setSalvandoEmail(false)
    }

    async function handleAlterarSenha(e) {
        e.preventDefault()
        setMsgSenha({ tipo: '', texto: '' })

        if (novaSenha.length < 6) {
            setMsgSenha({ tipo: 'erro', texto: 'A nova senha deve ter no mínimo 6 caracteres.' })
            return
        }
        if (novaSenha !== confirmaSenha) {
            setMsgSenha({ tipo: 'erro', texto: 'As novas senhas não coincidem.' })
            return
        }

        setSalvandoSenha(true)

        const emailParaValidar = sessionEmail || perfil?.email
        const { error: checkErr } = await supabase.auth.signInWithPassword({
            email: emailParaValidar,
            password: senhaAtual,
        })

        if (checkErr) {
            setMsgSenha({ tipo: 'erro', texto: 'A senha atual informada está incorreta.' })
            setSalvandoSenha(false)
            return
        }

        const { error: updateErr } = await supabase.auth.updateUser({ password: novaSenha })
        if (updateErr) {
            setMsgSenha({ tipo: 'erro', texto: `Erro ao alterar senha: ${updateErr.message}` })
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'perfis',
                registroId: perfil.id,
                acao: 'EDICAO',
                campo: 'SENHA',
                valorAnterior: '***',
                valorNovo: 'ALTERADA_PELO_USUARIO',
            })
            setSenhaAtual('')
            setNovaSenha('')
            setConfirmaSenha('')
            setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso.' })
        }
        setSalvandoSenha(false)
    }

    return (
        <div className="space-y-4">
            <form
                onSubmit={handleSalvarDados}
                className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
                        <User className="w-4 h-4" />
                        Meu Perfil {!podeEditarDados && '(Somente Leitura)'}
                    </h2>
                    <span className="text-[11px] text-slate-400">
                        E-MAIL ATUAL: <strong className="text-slate-200">{perfil?.email || sessionEmail}</strong>
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            disabled={!podeEditarDados}
                            value={form.nome_completo}
                            onChange={(e) =>
                                setForm({ ...form, nome_completo: e.target.value.toUpperCase() })
                            }
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            CPF
                        </label>
                        <input
                            type="text"
                            disabled={!podeEditarDados}
                            value={form.cpf}
                            onChange={(e) =>
                                setForm({ ...form, cpf: e.target.value.replace(/\D/g, '') })
                            }
                            placeholder="APENAS NÚMEROS"
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Matrícula / Registro
                        </label>
                        <input
                            type="text"
                            disabled={!podeEditarDados}
                            value={form.matricula}
                            onChange={(e) =>
                                setForm({ ...form, matricula: e.target.value.toUpperCase() })
                            }
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs font-semibold text-white uppercase disabled:opacity-60 focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <SelectPesquisavel
                        label="Cargo"
                        opcoes={cargosPermitidos}
                        valor={form.cargo}
                        disabled={!podeEditarDados}
                        onChange={(val) => setForm({ ...form, cargo: val })}
                    />

                    <SelectPesquisavel
                        label="Função na VTR"
                        opcoes={FUNCOES_VTR}
                        valor={form.funcao_vtr}
                        disabled={!podeEditarDados}
                        onChange={(val) => setForm({ ...form, funcao_vtr: val })}
                    />

                    <SelectPesquisavel
                        label="Base"
                        opcoes={basesExistentes}
                        valor={form.base}
                        disabled={!podeEditarDados}
                        permiteTextoLivre={true}
                        placeholder="EX: BASE UMUARAMA"
                        onChange={(val) => setForm({ ...form, base: val })}
                    />

                    <SelectPesquisavel
                        label="Município de Lotação"
                        opcoes={todasCidades}
                        valor={form.municipio_lotacao}
                        disabled={!podeEditarDados}
                        permiteTextoLivre={true}
                        onChange={(val) => setForm({ ...form, municipio_lotacao: val })}
                    />

                    <SelectPesquisavel
                        label="Viatura Atual"
                        opcoes={opcoesViaturas}
                        valor={prefixoVtrAtual}
                        disabled={!podeEditarDados}
                        onChange={(prefixo) => {
                            const v = viaturas.find((item) => item.prefixo.toUpperCase() === prefixo)
                            setForm({ ...form, viatura_atual_id: v ? v.id : '' })
                        }}
                    />
                </div>

                {podeEditarDados && (
                    <div className="flex justify-end pt-1">
                        <button
                            type="submit"
                            disabled={salvandoDados}
                            className="bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {salvandoDados ? 'SALVANDO...' : 'SALVAR DADOS'}
                        </button>
                    </div>
                )}

                {msgDados.texto && (
                    <p
                        className={`text-xs p-2 rounded-lg border flex items-center gap-1.5 ${msgDados.tipo === 'ok'
                                ? 'bg-qth-green/15 border-qth-green/40 text-green-400'
                                : 'bg-qth-red/15 border-qth-red/40 text-red-400'
                            }`}
                    >
                        {msgDados.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {msgDados.texto}
                    </p>
                )}
            </form>

            {/* Alteração de E-mail e Senha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form
                    onSubmit={handleAlterarEmail}
                    className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3"
                >
                    <h3 className="text-xs font-extrabold text-qth-orange flex items-center gap-1.5 uppercase">
                        <Mail className="w-4 h-4" /> Alterar E-mail de Acesso
                    </h3>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Novo E-mail <span className="text-qth-orange">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={novoEmail}
                            onChange={(e) => setNovoEmail(e.target.value)}
                            placeholder="novo.email@exemplo.com"
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Confirmar Novo E-mail <span className="text-qth-orange">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={confirmaEmail}
                            onChange={(e) => setConfirmaEmail(e.target.value)}
                            placeholder="repita o novo e-mail"
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={salvandoEmail}
                        className="w-full bg-qth-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                    >
                        {salvandoEmail ? 'ATUALIZANDO...' : 'ATUALIZAR E-MAIL'}
                    </button>

                    {msgEmail.texto && (
                        <p
                            className={`text-xs p-2 rounded-lg border ${msgEmail.tipo === 'ok'
                                    ? 'bg-qth-green/15 border-qth-green/40 text-green-400'
                                    : 'bg-qth-red/15 border-qth-red/40 text-red-400'
                                }`}
                        >
                            {msgEmail.texto}
                        </p>
                    )}
                </form>

                <form
                    onSubmit={handleAlterarSenha}
                    className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-3"
                >
                    <h3 className="text-xs font-extrabold text-qth-orange flex items-center gap-1.5 uppercase">
                        <Lock className="w-4 h-4" /> Alterar Senha
                    </h3>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                            Senha Atual <span className="text-qth-orange">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                Nova Senha (mín. 6) <span className="text-qth-orange">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                                Confirmar Nova Senha <span className="text-qth-orange">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmaSenha}
                                onChange={(e) => setConfirmaSenha(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={salvandoSenha}
                        className="w-full bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                    >
                        {salvandoSenha ? 'ALTERANDO...' : 'ALTERAR SENHA'}
                    </button>

                    {msgSenha.texto && (
                        <p
                            className={`text-xs p-2 rounded-lg border ${msgSenha.tipo === 'ok'
                                    ? 'bg-qth-green/15 border-qth-green/40 text-green-400'
                                    : 'bg-qth-red/15 border-qth-red/40 text-red-400'
                                }`}
                        >
                            {msgSenha.texto}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}