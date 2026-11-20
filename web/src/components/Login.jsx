import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErro('Credenciais inválidas ou acesso não autorizado.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-qth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-qth-card border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-qth-orange/15 border border-qth-orange/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-qth-orange" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-qth-orange">
            QTH LOGS
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Central de Regulação • CIUENP / SAMU 192
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-MAIL OPERACIONAL
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ciuenp.pr.gov.br"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-qth-orange transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              SENHA
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-qth-bg/80 border border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-qth-orange transition-colors"
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-qth-red/15 border border-qth-red/50 text-red-300 text-xs p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-qth-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}