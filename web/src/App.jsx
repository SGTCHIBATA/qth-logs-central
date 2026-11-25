import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import PrimeiroAcesso from './components/PrimeiroAcesso'
import { Building2, LogOut, Radio, Settings, ShieldAlert, Truck, User } from 'lucide-react'

const PainelCentral = lazy(() => import('./components/PainelCentral'))
const PainelFrota = lazy(() => import('./components/PainelFrota'))
const PainelGestor = lazy(() => import('./components/PainelGestor'))
const PainelInstituicoes = lazy(() => import('./components/PainelInstituicoes'))
const PainelPerfil = lazy(() => import('./components/PainelPerfil'))

export default function App() {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('CENTRAL')
  const [abasVisitadas, setAbasVisitadas] = useState({ CENTRAL: true })

  useEffect(() => {
    setAbasVisitadas((prev) => (prev[abaAtiva] ? prev : { ...prev, [abaAtiva]: true }))
  }, [abaAtiva])

  useEffect(() => {
    function handleCliqueAreaVazia(e) {
      const clicouEmInterativo = e.target.closest(
        'input, textarea, select, button, a, label, [data-qth-interactive="true"]'
      )
      if (!clicouEmInterativo) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        window.dispatchEvent(
          new CustomEvent('qth-fechar-menus', { detail: { originId: null } })
        )
      }
    }

    document.addEventListener('mousedown', handleCliqueAreaVazia)
    return () => document.removeEventListener('mousedown', handleCliqueAreaVazia)
  }, [])

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data: { session: sessaoAtual } }) => {
      if (!ativo) return
      setSession(sessaoAtual)
      if (sessaoAtual?.user?.id) {
        carregarPerfil(sessaoAtual.user.id, { bloquearTela: true })
      } else {
        setCarregando(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, novaSessao) => {
      if (!ativo) return
      setSession(novaSessao)

      if (!novaSessao) {
        setPerfil(null)
        setCarregando(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        carregarPerfil(novaSessao.user.id, { bloquearTela: !perfil })
      } else if (event === 'TOKEN_REFRESHED' && !perfil) {
        carregarPerfil(novaSessao.user.id, { bloquearTela: false })
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  async function carregarPerfil(userId, { bloquearTela = false } = {}) {
    if (bloquearTela) setCarregando(true)
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setPerfil(data)
    } else if (!perfil) {
      setPerfil(null)
    }
    if (bloquearTela) setCarregando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-qth-bg flex items-center justify-center">
        <span className="text-sm text-slate-400 animate-pulse">VERIFICANDO SESSÃO...</span>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  const cargo = (perfil?.cargo || '').toUpperCase()
  const nomeUsuario = (perfil?.nome_completo || session.user.email).toUpperCase()
  const isMaster = Boolean(perfil?.is_platform_owner)

  if (!perfil || perfil.ativo === false || cargo === 'TRIPULANTE') {
    return (
      <div className="min-h-screen bg-qth-bg flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-qth-card border border-slate-700 rounded-2xl p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-qth-yellow mx-auto" />
          <h2 className="text-lg font-bold text-white uppercase">Acesso Restrito à Central</h2>
          <p className="text-xs text-slate-300">
            {perfil?.ativo === false
              ? 'Seu usuário está inativo no sistema. Procure a coordenação.'
              : cargo === 'TRIPULANTE'
                ? 'Seu perfil é operacional de viatura. Utilize o aplicativo móvel QTH Logs.'
                : 'Seu usuário ainda não possui um perfil operacional vinculado.'}
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

  if (perfil.primeiro_acesso) {
    return (
      <PrimeiroAcesso
        perfil={perfil}
        onConcluido={() => carregarPerfil(session.user.id, { bloquearTela: false })}
        onLogout={handleLogout}
      />
    )
  }

  const isGestorOuCoord = cargo === 'GESTOR' || cargo === 'COORDENADOR'
  const podeAcessarFrota = isGestorOuCoord || cargo === 'RADIO OPERADOR'

  return (
    <div className="min-h-screen bg-qth-bg text-white flex flex-col">
      <header className="bg-qth-card border-b border-slate-700/70 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-qth-orange tracking-wide text-base">
            QTH LOGS
          </span>

          <nav className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setAbaAtiva('CENTRAL')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                abaAtiva === 'CENTRAL'
                  ? 'bg-qth-orange text-white'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>CENTRAL</span>
            </button>

            {podeAcessarFrota && (
              <button
                onClick={() => setAbaAtiva('FROTA')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  abaAtiva === 'FROTA'
                    ? 'bg-qth-orange text-white'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>FROTA</span>
              </button>
            )}

            {isGestorOuCoord && (
              <button
                onClick={() => setAbaAtiva('GESTOR')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  abaAtiva === 'GESTOR'
                    ? 'bg-qth-orange text-white'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>GESTOR</span>
              </button>
            )}

            {isMaster && (
              <button
                onClick={() => setAbaAtiva('INSTITUICOES')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  abaAtiva === 'INSTITUICOES'
                    ? 'bg-qth-orange text-white'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>INSTITUIÇÕES</span>
              </button>
            )}

            <button
              onClick={() => setAbaAtiva('PERFIL')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                abaAtiva === 'PERFIL'
                  ? 'bg-qth-orange text-white'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>PERFIL</span>
            </button>
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

      <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto">
        <Suspense
          fallback={
            <div className="text-center py-10 text-xs text-slate-400 animate-pulse">
              CARREGANDO MÓDULO...
            </div>
          }
        >
          {abasVisitadas.CENTRAL && (
            <div className={abaAtiva === 'CENTRAL' ? 'block' : 'hidden'}>
              <PainelCentral perfil={perfil} />
            </div>
          )}

          {abasVisitadas.FROTA && podeAcessarFrota && (
            <div className={abaAtiva === 'FROTA' ? 'block' : 'hidden'}>
              <PainelFrota perfil={perfil} />
            </div>
          )}

          {abasVisitadas.GESTOR && isGestorOuCoord && (
            <div className={abaAtiva === 'GESTOR' ? 'block' : 'hidden'}>
              <PainelGestor perfilLogado={perfil} />
            </div>
          )}

          {abasVisitadas.INSTITUICOES && isMaster && (
            <div className={abaAtiva === 'INSTITUICOES' ? 'block' : 'hidden'}>
              <PainelInstituicoes perfilLogado={perfil} />
            </div>
          )}

          {abasVisitadas.PERFIL && (
            <div className={abaAtiva === 'PERFIL' ? 'block' : 'hidden'}>
              <PainelPerfil
                perfil={perfil}
                sessionEmail={session.user.email}
                onPerfilAtualizado={() => carregarPerfil(session.user.id, { bloquearTela: false })}
              />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}