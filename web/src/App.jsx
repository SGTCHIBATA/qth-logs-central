import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import { LogOut, Radio, Settings, ShieldAlert } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('CENTRAL')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) carregarPerfil(session.user.id)
      else setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) carregarPerfil(session.user.id)
      else {
        setPerfil(null)
        setCarregando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId) {
    setCarregando(true)
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setPerfil(data)
    } else {
      setPerfil(null)
    }
    setCarregando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-qth-bg flex items-center justify-center">
        <span className="text-sm text-slate-400 animate-pulse">Verificando sessão...</span>
      </div>
    )
  }

  // Sem sessão válida no servidor: renderiza APENAS o Login
  if (!session) {
    return <Login />
  }

  const cargo = (perfil?.cargo || perfil?.papel || perfil?.tipo || '').toUpperCase()
  const nomeUsuario = perfil?.nome || perfil?.nome_completo || session.user.email

  // Bloqueia acesso Web para perfis sem cadastro em `perfis` ou exclusivos de App (Tripulante)
  if (!perfil || cargo === 'TRIPULANTE') {
    return (
      <div className="min-h-screen bg-qth-bg flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-qth-card border border-slate-700 rounded-2xl p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-qth-yellow mx-auto" />
          <h2 className="text-lg font-bold text-white">Acesso Restrito à Central</h2>
          <p className="text-xs text-slate-300">
            {cargo === 'TRIPULANTE'
              ? 'Seu perfil é operacional de viatura. Utilize o aplicativo móvel QTH Logs.'
              : 'Seu usuário ainda não possui um perfil operacional vinculado na tabela perfis.'}
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-qth-red hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
          >
            SAIR
          </button>
        </div>
      </div>
    )
  }

  const isGestor = cargo === 'GESTOR'

  return (
    <div className="min-h-screen bg-qth-bg text-white flex flex-col">
      {/* Barra superior compacta e responsiva para tela dividida */}
      <header className="bg-qth-card border-b border-slate-700/70 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-qth-orange tracking-wide text-base">
            QTH LOGS
          </span>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setAbaAtiva('CENTRAL')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${abaAtiva === 'CENTRAL'
                  ? 'bg-qth-orange text-white'
                  : 'text-slate-300 hover:bg-slate-700/60'
                }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Central</span>
            </button>

            {isGestor && (
              <button
                onClick={() => setAbaAtiva('GESTOR')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${abaAtiva === 'GESTOR'
                    ? 'bg-qth-orange text-white'
                    : 'text-slate-300 hover:bg-slate-700/60'
                  }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Gestor</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-tight">{nomeUsuario}</p>
            <p className="text-[10px] text-qth-orange font-semibold">{cargo}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do sistema"
            className="p-2 rounded-lg bg-slate-800 hover:bg-qth-red/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Área principal (próximos passos: substituir pelos componentes lazy de Central e Gestor) */}
      <main className="flex-1 p-4">
        <div className="bg-qth-card/60 border border-slate-700/60 rounded-xl p-6 text-center">
          <p className="text-sm font-bold text-qth-orange">
            {abaAtiva === 'CENTRAL' ? 'PAINEL DA CENTRAL DE REGULAÇÃO' : 'PAINEL GESTOR'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Autenticação validada no servidor com sucesso. Pronto para receber os módulos operacionais.
          </p>
        </div>
      </main>
    </div>
  )
}