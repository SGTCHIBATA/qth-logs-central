import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from '../lib/auditoria'
import { KeyRound, Mail, Lock, AlertCircle, LogOut } from 'lucide-react'

export default function PrimeiroAcesso({ perfil, onConcluido, onLogout }) {
  const [email, setEmail] = useState(
    perfil?.email && !perfil.email.endsWith('@qthlogs.com.br') ? perfil.email : ''
  )
  const [confirmaEmail, setConfirmaEmail] = useState(
    perfil?.email && !perfil.email.endsWith('@qthlogs.com.br') ? perfil.email : ''
  )
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSalvar(e) {
    e.preventDefault()
    setErro('')

    const emailLimpo = email.trim().toLowerCase()
    const confirmaEmailLimpo = confirmaEmail.trim().toLowerCase()

    if (emailLimpo !== confirmaEmailLimpo) {
      setErro('Os endereços de e-mail não coincidem.')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmaSenha) {
      setErro('As novas senhas não coincidem.')
      return
    }

    const matriculaAtual = String(perfil?.matricula || '').trim().toUpperCase()
    if (
      matriculaAtual &&
      (novaSenha.toUpperCase() === matriculaAtual ||
        novaSenha.toUpperCase() === `@${matriculaAtual}`)
    ) {
      setErro('A nova senha não pode ser igual à sua senha inicial.')
      return
    }

    setSalvando(true)

    const { error: rpcError } = await supabase.rpc('concluir_primeiro_acesso', {
      p_email: emailLimpo,
      p_nova_senha: novaSenha,
    })

    if (rpcError) {
      setErro(`Erro ao atualizar credenciais: ${rpcError.message}`)
      setSalvando(false)
      return
    }

    await supabase.auth.refreshSession()

    await registrarAuditoria({
      perfil,
      tabela: 'perfis',
      registroId: perfil.id,
      acao: 'EDICAO',
      campo: 'PRIMEIRO_ACESSO',
      valorAnterior: 'PENDENTE',
      valorNovo: `CONCLUIDO (EMAIL: ${emailLimpo})`,
    })

    setSalvando(false)
    onConcluido()
  }

  return (
    <div className="min-h-screen bg-qth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-qth-card border border-slate-700/70 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-qth-orange/15 border border-qth-orange/40 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-qth-orange" />
          </div>
          <h1 className="text-lg font-extrabold text-qth-orange uppercase">
            Primeiro Acesso Obrigatório
          </h1>
          <p className="text-xs text-slate-300">
            Olá, <strong>{(perfil?.nome_completo || '').toUpperCase()}</strong>. Confirme seu e-mail e defina uma nova senha pessoal para liberar o sistema.
          </p>
        </div>

        <form onSubmit={handleSalvar} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Seu E-mail <span className="text-qth-orange">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Confirmar E-mail <span className="text-qth-orange">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={confirmaEmail}
                onChange={(e) => setConfirmaEmail(e.target.value)}
                placeholder="repita seu e-mail"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Nova Senha (mín. 6 caracteres) <span className="text-qth-orange">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Confirmar Nova Senha <span className="text-qth-orange">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-qth-orange"
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-qth-red/15 border border-qth-red/50 text-red-300 text-xs p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> SAIR
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-qth-green hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
            >
              {salvando ? 'SALVANDO...' : 'CONCLUIR E ACESSAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}