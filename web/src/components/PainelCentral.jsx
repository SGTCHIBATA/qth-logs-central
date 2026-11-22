import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { registrarAuditoria, registrarAlteracoesEmLote } from '../lib/auditoria'
import SelectPesquisavel from './SelectPesquisavel'
import FormNovaOcorrencia from './FormNovaOcorrencia'
import ModalOcorrencia from './ModalOcorrencia'
import cidadesData from '../data/cidades.json'
import {
    PRIORIDADES,
    SUB_ABAS_STATUS,
    NATUREZAS_ATENDIMENTO,
    somarCoresVtr,
    normalizarPacientesVtr,
    obterGrupoDisponibilidadeVtr,
    obterEstiloRecursoMiniPainel,
    criarFormInicialPerfil,
    extrairLatLngDeTexto,
    construirUrlRota,
    obterMetaPrioridade,
    formatarEnderecoOcorrencia,
    obterCidadePrincipal,
    calcularBalancoVitimas,
} from '../utils/painelCentralHelpers'
import {
    executarEmpenharViatura,
    executarAtualizarStatusEmpenho,
    executarAlterarHorarioEStatusVtr,
    executarSalvarHorariosVtr,
    executarDesvincularEmpenho,
    executarSalvarRadio,
    executarAlterarCorVtr,
    renderizarPainelBalancoVitimas,
} from '../utils/despachoRadioHandlers.jsx'
import {
    Radio,
    Plus,
    Search,
    RotateCcw,
    X,
    MapPin,
    Users,
    Trash2,
    Navigation,
} from 'lucide-react'


export default function PainelCentral({ perfil }) {
    const cargo = (perfil?.cargo || '').toUpperCase()
    const userKey = perfil?.id || 'anonimo'
    const chaveRascunhoNova = `qth_rascunho_nova_oc_${userKey}`
    const chaveModalAberto = `qth_modal_oc_aberto_${userKey}`

    const podeCriarOuEditarTarm = [
        'TARM',
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const podeEditarRegulador = [
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const podeEditarClinicaPaciente = [
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
        'MEDICO',
        'ENFERMEIRO',
        'TECNICO',
        'TRIPULANTE',
    ].includes(cargo)

    const podeEditarRadio = [
        'RADIO OPERADOR',
        'MEDICO REGULADOR',
        'COORDENADOR',
        'GESTOR',
    ].includes(cargo)

    const [ocorrencias, setOcorrencias] = useState([])
    const [empenhos, setEmpenhos] = useState([])
    const [evolucoes, setEvolucoes] = useState([])
    const [viaturas, setViaturas] = useState([])
    const [carregando, setCarregando] = useState(true)

    const [rascunhosVtr, setRascunhosVtr] = useState({})
    const [novoPacientePorVtr, setNovoPacientePorVtr] = useState({})
    const [novaEvolucaoPorPaciente, setNovaEvolucaoPorPaciente] = useState({})

    const [novoPacienteCena, setNovoPacienteCena] = useState({
        nome: '',
        idade: '',
        tipo_idade: '',
        sexo: '',
        cor_start: '',
        destino: '',
        hipotese_diagnostica: '',
        detalhamento: '',
        recurso_indicado: '',
        quadro_clinico: '',
    })

    const [subAbaStatus, setSubAbaStatus] = useState('RESUMO_GERAL')

    const rascunhoSalvo = useMemo(() => {
        try {
            const bruto = localStorage.getItem(chaveRascunhoNova)
            return bruto ? JSON.parse(bruto) : null
        } catch {
            return null
        }
    }, [chaveRascunhoNova])

    const [mostrarFormNova, setMostrarFormNova] = useState(
        Boolean(rascunhoSalvo?.aberto)
    )
    const [formNova, setFormNova] = useState(() => ({
        ...criarFormInicialPerfil(perfil),
        ...(rascunhoSalvo?.form || {}),
    }))
    const [criandoOcorrencia, setCriandoOcorrencia] = useState(false)
    const [erroNova, setErroNova] = useState('')

    useEffect(() => {
        try {
            if (!mostrarFormNova) {
                localStorage.removeItem(chaveRascunhoNova)
                return
            }
            localStorage.setItem(
                chaveRascunhoNova,
                JSON.stringify({ aberto: true, form: formNova })
            )
        } catch {
            // ignora
        }
    }, [mostrarFormNova, formNova, chaveRascunhoNova])

    const [buscaTexto, setBuscaTexto] = useState('')
    const [filtroPrioridade, setFiltroPrioridade] = useState('TODAS')
    const [filtroNatureza, setFiltroNatureza] = useState('TODAS')
    const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS')
    const [filtroViatura, setFiltroViatura] = useState('TODAS')
    const [filtroImv, setFiltroImv] = useState('TODAS')

    const modalSalvo = useMemo(() => {
        try {
            const bruto = localStorage.getItem(chaveModalAberto)
            return bruto ? JSON.parse(bruto) : null
        } catch {
            return null
        }
    }, [chaveModalAberto])

    const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState(
        modalSalvo?.ocorrenciaId || null
    )
    const [abaInterna, setAbaInterna] = useState(modalSalvo?.abaInterna || 'RESUMO')

    useEffect(() => {
        try {
            if (!ocorrenciaSelecionadaId) {
                localStorage.removeItem(chaveModalAberto)
                return
            }
            localStorage.setItem(
                chaveModalAberto,
                JSON.stringify({ ocorrenciaId: ocorrenciaSelecionadaId, abaInterna })
            )
        } catch {
            // ignora
        }
    }, [ocorrenciaSelecionadaId, abaInterna, chaveModalAberto])

    const [editTarm, setEditTarm] = useState(null)
    const [editRegulador, setEditRegulador] = useState(null)
    const [editRadio, setEditRadio] = useState(null)
    const [novaEvolucaoTexto, setNovaEvolucaoTexto] = useState('')
    const [novoQuadroClinicoRapido, setNovoQuadroClinicoRapido] = useState('')
    const [viaturaParaEmpenhar, setViaturaParaEmpenhar] = useState('')
    const [salvandoSecao, setSalvandoSecao] = useState(false)
    const [mensagemModal, setMensagemModal] = useState('')

    const idInicializadoRef = useRef(null)

    const listaEstados = useMemo(
        () => (cidadesData?.estados || []).map((e) => e.sigla.toUpperCase()).sort(),
        []
    )

    function cidadesPorUf(uf) {
        const sigla = (uf || '').toUpperCase()
        const est = (cidadesData?.estados || []).find((e) => e.sigla.toUpperCase() === sigla)
        return est ? est.cidades.map((c) => c.toUpperCase()).sort() : []
    }

    const cidadesNovaUrb = useMemo(() => cidadesPorUf(formNova.estado), [formNova.estado])
    const cidadesNovaRod = useMemo(() => cidadesPorUf(formNova.rodovia_uf), [formNova.rodovia_uf])
    const cidadesNovaOrig = useMemo(() => cidadesPorUf(formNova.origem_uf), [formNova.origem_uf])
    const cidadesNovaDest = useMemo(() => cidadesPorUf(formNova.destino_uf), [formNova.destino_uf])

    const cidadesEditTarmUrb = useMemo(() => cidadesPorUf(editTarm?.estado), [editTarm?.estado])
    const cidadesEditTarmRod = useMemo(() => cidadesPorUf(editTarm?.rodovia_uf), [editTarm?.rodovia_uf])
    const cidadesEditTarmOrig = useMemo(() => cidadesPorUf(editTarm?.origem_uf), [editTarm?.origem_uf])
    const cidadesEditTarmDest = useMemo(() => cidadesPorUf(editTarm?.destino_uf), [editTarm?.destino_uf])

    useEffect(() => {
        carregarTudo({ silencioso: false })

        const canal = supabase
            .channel('central-ocorrencias-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencia_viaturas' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencia_evolucoes' }, () =>
                carregarTudo({ silencioso: true })
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'viaturas' }, () =>
                carregarTudo({ silencioso: true })
            )
            .subscribe()

        return () => {
            supabase.removeChannel(canal)
        }
    }, [])

    async function carregarTudo({ silencioso = false } = {}) {
        if (!silencioso && ocorrencias.length === 0) {
            setCarregando(true)
        }

        const [
            { data: dataOc },
            { data: dataEmp },
            { data: dataEvo },
            { data: dataVtr },
        ] = await Promise.all([
            supabase.from('ocorrencias').select('*').order('criado_em', { ascending: false }),
            supabase.from('ocorrencia_viaturas').select('*').order('criado_em', { ascending: true }),
            supabase.from('ocorrencia_evolucoes').select('*').order('criado_em', { ascending: false }),
            supabase
                .from('viaturas')
                .select('id, prefixo, tipo, cidade, base_cidade, estado, status, km_atual')
                .order('prefixo', { ascending: true }),
        ])

        if (dataOc) setOcorrencias(dataOc)
        if (dataEmp) {
            setEmpenhos(dataEmp)
            setRascunhosVtr((prev) => {
                const proximo = { ...prev }
                for (const emp of dataEmp) {
                    const bancoObj = {
                        status_empenho: emp.status_empenho || 'ACIONADA',
                        km_saida: emp.km_saida || '',
                        km_chegada: emp.km_chegada || '',
                        h_acionamento: emp.h_acionamento || '',
                        h_saida_base: emp.h_saida_base || '',
                        h_chegada_qth: emp.h_chegada_qth || '',
                        h_saida_qth: emp.h_saida_qth || '',
                        h_chegada_saude: emp.h_chegada_saude || '',
                        h_saida_saude: emp.h_saida_saude || '',
                        h_encerramento: emp.h_encerramento || '',
                        pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
                    }
                    if (!proximo[emp.id]) {
                        proximo[emp.id] = bancoObj
                    } else if (emp.status_empenho && emp.status_empenho !== proximo[emp.id].status_empenho) {
                        proximo[emp.id] = {
                            ...proximo[emp.id],
                            status_empenho: emp.status_empenho,
                            h_acionamento: emp.h_acionamento || proximo[emp.id].h_acionamento,
                            h_saida_base: emp.h_saida_base || proximo[emp.id].h_saida_base,
                            h_chegada_qth: emp.h_chegada_qth || proximo[emp.id].h_chegada_qth,
                            h_saida_qth: emp.h_saida_qth || proximo[emp.id].h_saida_qth,
                            h_chegada_saude: emp.h_chegada_saude || proximo[emp.id].h_chegada_saude,
                            h_saida_saude: emp.h_saida_saude || proximo[emp.id].h_saida_saude,
                            h_encerramento: emp.h_encerramento || proximo[emp.id].h_encerramento,
                            pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
                        }
                    }
                }
                return proximo
            })
        }
        if (dataEvo) setEvolucoes(dataEvo)
        if (dataVtr) setViaturas(dataVtr)
        setCarregando(false)
    }

    async function handleAlterarPrioridadeImediata(novaPrioridade) {
        if (!ocorrenciaSelecionada) return
        const podeAlterar = podeCriarOuEditarTarm || podeEditarRegulador
        if (!podeAlterar) return

        const prioLimpa = (novaPrioridade || 'MEDIA').toUpperCase()
        setSalvandoSecao(true)
        setMensagemModal('')

        const { error } = await supabase
            .from('ocorrencias')
            .update({
                prioridade: prioLimpa,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao atualizar prioridade: ${error.message}`)
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                anterior: ocorrenciaSelecionada,
                novo: { prioridade: prioLimpa },
                campos: ['prioridade'],
            })

            setEditTarm((prev) => (prev ? { ...prev, prioridade: prioLimpa } : prev))
            setEditRegulador((prev) => (prev ? { ...prev, prioridade: prioLimpa } : prev))
            setOcorrencias((prev) =>
                prev.map((o) =>
                    o.id === ocorrenciaSelecionada.id ? { ...o, prioridade: prioLimpa } : o
                )
            )
            setMensagemModal(`Prioridade da ocorrência alterada para ${prioLimpa}.`)
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    function obterDraftVtr(emp) {
        const draft = rascunhosVtr[emp.id]
        if (draft) return draft
        return {
            status_empenho: emp.status_empenho || 'ACIONADA',
            km_saida: emp.km_saida || '',
            km_chegada: emp.km_chegada || '',
            h_acionamento: emp.h_acionamento || '',
            h_saida_base: emp.h_saida_base || '',
            h_chegada_qth: emp.h_chegada_qth || '',
            h_saida_qth: emp.h_saida_qth || '',
            h_chegada_saude: emp.h_chegada_saude || '',
            h_saida_saude: emp.h_saida_saude || '',
            h_encerramento: emp.h_encerramento || '',
            pacientes_detalhes: normalizarPacientesVtr(emp.pacientes_detalhes),
        }
    }

    function normalizarRecursosSolicitados(raw) {
        if (!Array.isArray(raw)) return []
        return raw.map((item, idx) => ({
            id: item?.id || `req-${idx}`,
            recurso: (item?.recurso || '').toUpperCase(),
            quantidade: Math.max(1, parseInt(item?.quantidade, 10) || 1),
            paciente_id: item?.paciente_id || '',
            paciente_nome: (item?.paciente_nome || '').toUpperCase(),
            paciente_info: item?.paciente_info || null,
            observacao: (item?.observacao || '').toUpperCase(),
            atendido: Boolean(item?.atendido),
            viaturas_vinculadas: Array.isArray(item?.viaturas_vinculadas) ? item.viaturas_vinculadas : [],
            recursos_empenhados_vinculados: Array.isArray(item?.recursos_empenhados_vinculados)
                ? item.recursos_empenhados_vinculados
                : [],
        }))
    }

    function anexarOuConsolidarRecursoParaPaciente(listaRecursosAtual, pacObj, recursoUpper) {
        const recursoLimpo = (recursoUpper || '').trim().toUpperCase()
        const baseLista = normalizarRecursosSolicitados(listaRecursosAtual)
        if (!pacObj) return baseLista

        const pacIdLimpo = pacObj.id || ''
        const semSolicitacaoAnteriorDoPaciente = baseLista.filter(
            (r) => !(!r.atendido && pacIdLimpo && (r.paciente_id || '') === pacIdLimpo)
        )

        if (!recursoLimpo) {
            return semSolicitacaoAnteriorDoPaciente
        }

        const pacInfo = {
            nome: pacObj.nome || '',
            idade: pacObj.idade || '',
            tipo_idade: pacObj.tipo_idade || '',
            sexo: pacObj.sexo || '',
            cor_start: pacObj.cor_start || '',
            destino: pacObj.destino || '',
            hipotese_diagnostica: pacObj.hipotese_diagnostica || '',
            quadro_clinico: pacObj.detalhamento || pacObj.quadro_clinico || '',
            vtr_origem: 'CENA / PRÉ-DESPACHO',
        }

        return [
            ...semSolicitacaoAnteriorDoPaciente,
            {
                id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                recurso: recursoLimpo,
                quantidade: 1,
                paciente_id: pacIdLimpo,
                paciente_nome: pacObj.nome || '',
                paciente_info: pacInfo,
                observacao: (pacObj.detalhamento || pacObj.hipotese_diagnostica || '').trim().toUpperCase(),
                atendido: false,
                viaturas_vinculadas: [],
            },
        ]
    }

    function consolidarRecursosPendentesDaCena(listaRecursosAtual, listaPacientesCena) {
        let atual = normalizarRecursosSolicitados(listaRecursosAtual)
        const pacs = normalizarPacientesVtr(listaPacientesCena)

        for (const pac of pacs) {
            const recLimpo = (pac.recurso_indicado || '').trim().toUpperCase()
            if (!recLimpo) continue
            const jaTemSolicitacaoDoPaciente = atual.some(
                (r) =>
                    !r.atendido &&
                    (r.paciente_id || '') === (pac.id || '') &&
                    (r.recurso || '').toUpperCase() === recLimpo
            )
            if (!jaTemSolicitacaoDoPaciente) {
                atual = anexarOuConsolidarRecursoParaPaciente(atual, pac, recLimpo)
            }
        }

        return atual
    }

    function atualizarDraftVtr(empId, empBase, patch) {
        setRascunhosVtr((prev) => {
            const atual = prev[empId] || {
                status_empenho: empBase.status_empenho || 'ACIONADA',
                km_saida: empBase.km_saida || '',
                km_chegada: empBase.km_chegada || '',
                h_acionamento: empBase.h_acionamento || '',
                h_saida_base: empBase.h_saida_base || '',
                h_chegada_qth: empBase.h_chegada_qth || '',
                h_saida_qth: empBase.h_saida_qth || '',
                h_chegada_saude: empBase.h_chegada_saude || '',
                h_saida_saude: empBase.h_saida_saude || '',
                h_encerramento: empBase.h_encerramento || '',
                pacientes_detalhes: normalizarPacientesVtr(empBase.pacientes_detalhes),
            }
            return {
                ...prev,
                [empId]: {
                    ...atual,
                    ...(typeof patch === 'function' ? patch(atual) : patch),
                },
            }
        })
    }

    const ocorrenciaSelecionada = useMemo(
        () => ocorrencias.find((o) => o.id === ocorrenciaSelecionadaId) || null,
        [ocorrencias, ocorrenciaSelecionadaId]
    )

    const pacientesCenaOcorrencia = useMemo(() => {
        if (!ocorrenciaSelecionadaId) return []
        if (Array.isArray(ocorrenciaSelecionada?.pacientes_cena)) {
            return normalizarPacientesVtr(ocorrenciaSelecionada.pacientes_cena)
        }
        return []
    }, [ocorrenciaSelecionadaId, ocorrenciaSelecionada])

    function popularFormulariosModal(oc) {
        setEditTarm({ ...oc })
        const pacsCenaSalvos = Array.isArray(oc.pacientes_cena) ? oc.pacientes_cena : []

        setEditRegulador({
            prioridade: oc.prioridade || 'MEDIA',
            protocolo_imv: Boolean(oc.protocolo_imv),
            apoio_policia: Boolean(oc.apoio_policia),
            apoio_cobom_resgate: Boolean(oc.apoio_cobom_resgate),
            recursos_solicitados: normalizarRecursosSolicitados(oc.recursos_solicitados),
            pacientes_cena: normalizarPacientesVtr(pacsCenaSalvos),
            numero_vitimas: Math.max(1, parseInt(oc.numero_vitimas, 10) || 1),
            vitimas_meios_proprios: Math.max(0, parseInt(oc.vitimas_meios_proprios, 10) || 0),
            vitimas_terceiros: Math.max(0, parseInt(oc.vitimas_terceiros, 10) || 0),
            vitimas_obito_local: Math.max(0, parseInt(oc.vitimas_obito_local, 10) || 0),
            classificacao_risco: oc.classificacao_risco || '',
            hipotese_diagnostica: oc.hipotese_diagnostica || '',
            quadro_clinico: oc.quadro_clinico || '',
            recurso_indicado: oc.recurso_indicado || '',
            conduta_regulacao: oc.conduta_regulacao || '',
            destino_instituicao: oc.destino_instituicao || '',
            destino_uf: oc.destino_uf || '',
            destino_cidade: oc.destino_cidade || '',
        })
        setEditRadio({
            status_ocorrencia: oc.status_ocorrencia || 'PENDENTE',
            codigo_j: oc.codigo_j || '',
            codigo_qta: oc.codigo_qta || '',
            observacao_radio: oc.observacao_radio || '',
        })
        setNovoQuadroClinicoRapido(oc.quadro_clinico || '')
    }

    useEffect(() => {
        if (!ocorrenciaSelecionadaId) {
            idInicializadoRef.current = null
            return
        }
        if (ocorrenciaSelecionada && idInicializadoRef.current !== ocorrenciaSelecionada.id) {
            idInicializadoRef.current = ocorrenciaSelecionada.id
            popularFormulariosModal(ocorrenciaSelecionada)
        } else if (ocorrenciaSelecionada && idInicializadoRef.current === ocorrenciaSelecionada.id) {
            setEditRegulador((prev) =>
                prev
                    ? {
                        ...prev,
                        pacientes_cena: normalizarPacientesVtr(ocorrenciaSelecionada.pacientes_cena),
                        recursos_solicitados: normalizarRecursosSolicitados(
                            ocorrenciaSelecionada.recursos_solicitados
                        ),
                    }
                    : prev
            )
        }
    }, [ocorrenciaSelecionadaId, ocorrenciaSelecionada])

    const empenhosPorOcorrencia = useMemo(() => {
        const mapa = new Map()
        for (const emp of empenhos) {
            const lista = mapa.get(emp.ocorrencia_id) || []
            lista.push(emp)
            mapa.set(emp.ocorrencia_id, lista)
        }
        return mapa
    }, [empenhos])

    const evolucoesDaOcorrencia = useMemo(() => {
        if (!ocorrenciaSelecionadaId) return []
        return evolucoes.filter((e) => e.ocorrencia_id === ocorrenciaSelecionadaId)
    }, [evolucoes, ocorrenciaSelecionadaId])

    const empenhosDaOcorrencia = useMemo(() => {
        if (!ocorrenciaSelecionadaId) return []
        return empenhos.filter((e) => e.ocorrencia_id === ocorrenciaSelecionadaId)
    }, [empenhos, ocorrenciaSelecionadaId])

    const pacientesDisponiveisRegulador = useMemo(() => {
        const lista = []
        const vistos = new Set()

        const listaCenaAtiva = Array.isArray(editRegulador?.pacientes_cena)
            ? normalizarPacientesVtr(editRegulador.pacientes_cena)
            : pacientesCenaOcorrencia

        for (const pac of listaCenaAtiva) {
            const nomePac = (pac.nome || 'PACIENTE').trim().toUpperCase()
            if (!vistos.has(pac.id)) {
                vistos.add(pac.id)
                lista.push({
                    id: pac.id,
                    nome: nomePac,
                    idade: pac.idade || '',
                    tipo_idade: pac.tipo_idade || '',
                    sexo: pac.sexo || '',
                    cor_start: pac.cor_start || '',
                    destino: pac.destino || '',
                    hipotese_diagnostica: pac.hipotese_diagnostica || '',
                    quadro_clinico: pac.detalhamento || pac.quadro_clinico || '',
                    vtrPrefixo: 'CENA / PRÉ-DESPACHO',
                })
            }
        }

        if (ocorrenciaSelecionada?.nome_paciente) {
            const nomeBase = ocorrenciaSelecionada.nome_paciente.trim().toUpperCase()
            if (!vistos.has('oc-paciente-principal')) {
                vistos.add('oc-paciente-principal')
                lista.push({
                    id: 'oc-paciente-principal',
                    nome: nomeBase,
                    idade: ocorrenciaSelecionada.idade_paciente || '',
                    tipo_idade: ocorrenciaSelecionada.tipo_idade_paciente || '',
                    sexo: ocorrenciaSelecionada.sexo_paciente || '',
                    cor_start: '',
                    destino: '',
                    hipotese_diagnostica: ocorrenciaSelecionada.hipotese_diagnostica || '',
                    quadro_clinico: ocorrenciaSelecionada.quadro_clinico || '',
                    vtrPrefixo: 'TARM',
                })
            }
        }

        for (const emp of empenhosDaOcorrencia || []) {
            const pacs = normalizarPacientesVtr(emp.pacientes_detalhes)
            pacs.forEach((pac, i) => {
                const nomePac = (pac.nome || `PACIENTE #${i + 1}`).toUpperCase()
                if (!vistos.has(pac.id)) {
                    vistos.add(pac.id)
                    lista.push({
                        id: pac.id,
                        nome: nomePac,
                        idade: pac.idade || '',
                        tipo_idade: pac.tipo_idade || '',
                        sexo: pac.sexo || '',
                        cor_start: pac.cor_start || '',
                        destino: pac.destino || '',
                        hipotese_diagnostica: pac.hipotese_diagnostica || '',
                        quadro_clinico: pac.quadro_clinico || '',
                        vtrPrefixo: emp.prefixo || '',
                    })
                }
            })
        }

        return lista
    }, [ocorrenciaSelecionada, empenhosDaOcorrencia, editRegulador?.pacientes_cena, pacientesCenaOcorrencia])

    const contadoresSubAbas = useMemo(() => {
        const counts = {
            RESUMO_GERAL: ocorrencias.length,
            PENDENTE: 0,
            DESPACHADA: 0,
            EM_ANDAMENTO: 0,
            FINALIZADA: 0,
            CANCELADA: 0,
        }
        for (const oc of ocorrencias) {
            const st = (oc.status_ocorrencia || 'PENDENTE').toUpperCase()
            if (counts[st] !== undefined) counts[st] += 1
        }
        return counts
    }, [ocorrencias])

    const opcoesMunicipiosFiltro = useMemo(() => {
        const setMun = new Set()
        for (const oc of ocorrencias) {
            const c = obterCidadePrincipal(oc)
            if (c) setMun.add(c)
        }
        return ['TODOS', ...Array.from(setMun).sort()]
    }, [ocorrencias])

    const opcoesViaturasFiltro = useMemo(() => {
        const setVtr = new Set()
        for (const v of viaturas) {
            if (v.prefixo) setVtr.add(v.prefixo.toUpperCase())
        }
        for (const e of empenhos) {
            if (e.prefixo) setVtr.add(e.prefixo.toUpperCase())
        }
        return ['TODAS', ...Array.from(setVtr).sort()]
    }, [viaturas, empenhos])

    const temFiltroAtivo =
        buscaTexto.trim() !== '' ||
        filtroPrioridade !== 'TODAS' ||
        filtroNatureza !== 'TODAS' ||
        filtroMunicipio !== 'TODOS' ||
        filtroViatura !== 'TODAS' ||
        filtroImv !== 'TODAS'

    function limparFiltros() {
        setBuscaTexto('')
        setFiltroPrioridade('TODAS')
        setFiltroNatureza('TODAS')
        setFiltroMunicipio('TODOS')
        setFiltroViatura('TODAS')
        setFiltroImv('TODAS')
    }

    const ocorrenciasFiltradas = useMemo(() => {
        const termo = buscaTexto.trim().toUpperCase()

        return ocorrencias.filter((oc) => {
            const st = (oc.status_ocorrencia || 'PENDENTE').toUpperCase()
            if (subAbaStatus !== 'RESUMO_GERAL' && st !== subAbaStatus) return false

            const prio = (oc.prioridade || 'MEDIA').toUpperCase()
            if (filtroPrioridade !== 'TODAS' && prio !== filtroPrioridade) return false

            const nat = (oc.tipo_atendimento || 'PRIMÁRIO').toUpperCase()
            if (filtroNatureza !== 'TODAS' && nat !== filtroNatureza) return false

            const cidadeOc = obterCidadePrincipal(oc)
            if (filtroMunicipio !== 'TODOS' && cidadeOc !== filtroMunicipio) return false

            const qtdVit = Math.max(1, parseInt(oc.numero_vitimas, 10) || 1)
            if (filtroImv === 'IMV_ATIVO' && !oc.protocolo_imv) return false
            if (filtroImv === 'MULTIPLAS_VITIMAS' && qtdVit < 2) return false

            const vtrsOc = (empenhosPorOcorrencia.get(oc.id) || []).map((e) =>
                (e.prefixo || '').toUpperCase()
            )
            if (filtroViatura !== 'TODAS' && !vtrsOc.includes(filtroViatura)) return false

            if (termo) {
                const enderecoFmt = formatarEnderecoOcorrencia(oc).toUpperCase()
                const match =
                    (oc.numero_ocorrencia || '').toUpperCase().includes(termo) ||
                    (oc.solicitante_nome || '').toUpperCase().includes(termo) ||
                    (oc.solicitante_telefone || '').toUpperCase().includes(termo) ||
                    (oc.motivo || '').toUpperCase().includes(termo) ||
                    (oc.nome_paciente || '').toUpperCase().includes(termo) ||
                    (oc.quadro_clinico || '').toUpperCase().includes(termo) ||
                    (oc.codigo_j || '').toUpperCase().includes(termo) ||
                    (oc.codigo_qta || '').toUpperCase().includes(termo) ||
                    (oc.coordenadas || '').toUpperCase().includes(termo) ||
                    enderecoFmt.includes(termo) ||
                    vtrsOc.some((p) => p.includes(termo))

                if (!match) return false
            }

            return true
        })
    }, [
        ocorrencias,
        subAbaStatus,
        filtroPrioridade,
        filtroNatureza,
        filtroMunicipio,
        filtroViatura,
        filtroImv,
        buscaTexto,
        empenhosPorOcorrencia,
    ])

    const recursosOrdenadosMiniPainel = useMemo(() => {
        return [...viaturas]
            .map((v) => {
                const prefixoUpper = (v.prefixo || '').toUpperCase().trim()
                const statusUpper = (v.status || 'DISPONIVEL').toUpperCase().trim()
                const grupo = obterGrupoDisponibilidadeVtr(statusUpper)
                return {
                    ...v,
                    prefixoUpper,
                    statusUpper,
                    grupo,
                    meta: obterEstiloRecursoMiniPainel(statusUpper),
                }
            })
            .sort((a, b) => {
                if (a.grupo !== b.grupo) return a.grupo - b.grupo
                return a.prefixoUpper.localeCompare(b.prefixoUpper, 'pt-BR')
            })
    }, [viaturas])

    function horaAtualHhMm() {
        const agora = new Date()
        const hh = String(agora.getHours()).padStart(2, '0')
        const mm = String(agora.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
    }

    function descartarRascunhoNova() {
        setFormNova(criarFormInicialPerfil(perfil))
        setErroNova('')
        setMostrarFormNova(false)
        try {
            localStorage.removeItem(chaveRascunhoNova)
        } catch {
            // ignora
        }
    }

    async function handleCriarOcorrencia(e) {
        e.preventDefault()
        if (!podeCriarOuEditarTarm) return
        setErroNova('')

        const numeroLimpo = formNova.numero_ocorrencia.trim().toUpperCase()
        if (!numeroLimpo) {
            setErroNova('Informe o número da ocorrência.')
            return
        }

        setCriandoOcorrencia(true)

        const coordsParsed =
            formNova.latitude != null && formNova.longitude != null
                ? { lat: formNova.latitude, lng: formNova.longitude }
                : extrairLatLngDeTexto(formNova.coordenadas) ||
                extrairLatLngDeTexto(formNova.link_localizacao)

        const vitimasQtd = Math.max(1, parseInt(formNova.numero_vitimas, 10) || 1)

        const payload = {
            numero_ocorrencia: numeroLimpo,
            status_ocorrencia: 'PENDENTE',
            prioridade: formNova.prioridade || 'MEDIA',
            protocolo_imv: false,
            solicitante_nome: formNova.solicitante_nome.trim().toUpperCase(),
            solicitante_telefone: formNova.solicitante_telefone.trim(),
            numero_vitimas: vitimasQtd,
            tipo_atendimento: formNova.tipo_atendimento || 'PRIMÁRIO',
            tipo_local: formNova.tipo_local || 'DOMICÍLIO',
            tipo_via: formNova.tipo_via || 'Urbana',
            coordenadas:
                formNova.coordenadas.trim() ||
                (coordsParsed ? `${coordsParsed.lat}, ${coordsParsed.lng}` : ''),
            latitude: coordsParsed ? coordsParsed.lat : null,
            longitude: coordsParsed ? coordsParsed.lng : null,
            link_localizacao: formNova.link_localizacao.trim(),
            via1: formNova.via1.trim().toUpperCase(),
            via2: formNova.via2.trim().toUpperCase(),
            numero_end: formNova.numero_end.trim().toUpperCase(),
            bairro: formNova.bairro.trim().toUpperCase(),
            ponto_referencia: formNova.ponto_referencia.trim().toUpperCase(),
            estado: (formNova.estado || 'PR').trim().toUpperCase(),
            cidade_urb: formNova.cidade_urb.trim().toUpperCase(),
            rodovia_jurisdicao: formNova.rodovia_jurisdicao.trim().toUpperCase(),
            rodovia_codigo: formNova.rodovia_codigo.trim().toUpperCase(),
            rodovia_km: formNova.rodovia_km.trim(),
            rodovia_uf: (formNova.rodovia_uf || 'PR').trim().toUpperCase(),
            rodovia_cidade: formNova.rodovia_cidade.trim().toUpperCase(),
            origem_instituicao: formNova.origem_instituicao.trim().toUpperCase(),
            origem_rua: formNova.origem_rua.trim().toUpperCase(),
            origem_numero: formNova.origem_numero.trim().toUpperCase(),
            origem_bairro: formNova.origem_bairro.trim().toUpperCase(),
            origem_uf: (formNova.origem_uf || 'PR').trim().toUpperCase(),
            origem_cidade: formNova.origem_cidade.trim().toUpperCase(),
            destino_instituicao: formNova.destino_instituicao.trim().toUpperCase(),
            destino_rua: formNova.destino_rua.trim().toUpperCase(),
            destino_numero: formNova.destino_numero.trim().toUpperCase(),
            destino_bairro: formNova.destino_bairro.trim().toUpperCase(),
            destino_uf: (formNova.destino_uf || 'PR').trim().toUpperCase(),
            destino_cidade: formNova.destino_cidade.trim().toUpperCase(),
            motivo: formNova.motivo.trim().toUpperCase(),
            criado_por: perfil?.id || null,
            criado_por_nome: (perfil?.nome_completo || '').toUpperCase(),
        }

        const { data, error } = await supabase.from('ocorrencias').insert(payload).select().single()

        if (error || !data) {
            setErroNova(`Erro ao criar ocorrência: ${error?.message || 'Verifique os dados.'}`)
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencias',
                registroId: data.id,
                acao: 'CRIACAO',
                campo: 'OCORRENCIA',
                valorNovo: `Nº ${numeroLimpo} • ${vitimasQtd} VÍTIMA(S) • ${payload.tipo_atendimento} • MOTIVO: ${payload.motivo}`,
            })
            setFormNova(criarFormInicialPerfil(perfil))
            setMostrarFormNova(false)
            try {
                localStorage.removeItem(chaveRascunhoNova)
            } catch {
                // ignora
            }
            setSubAbaStatus('PENDENTE')
            await carregarTudo({ silencioso: true })
        }

        setCriandoOcorrencia(false)
    }

    function abrirOcorrencia(oc, abaInicial = 'RESUMO') {
        setMensagemModal('')
        setNovaEvolucaoTexto('')
        setViaturaParaEmpenhar('')
        idInicializadoRef.current = oc.id
        popularFormulariosModal(oc)
        setOcorrenciaSelecionadaId(oc.id)
        setAbaInterna(abaInicial)
    }

    function fecharModalOcorrencia() {
        idInicializadoRef.current = null
        setOcorrenciaSelecionadaId(null)
        setEditTarm(null)
        setEditRegulador(null)
        setEditRadio(null)
        setMensagemModal('')
        try {
            localStorage.removeItem(chaveModalAberto)
        } catch {
            // ignora
        }
    }

    async function handleSalvarTarm() {
        if (!podeCriarOuEditarTarm || !ocorrenciaSelecionada || !editTarm) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const coordsParsed =
            editTarm.latitude != null && editTarm.longitude != null
                ? { lat: editTarm.latitude, lng: editTarm.longitude }
                : extrairLatLngDeTexto(editTarm.coordenadas) ||
                extrairLatLngDeTexto(editTarm.link_localizacao)

        const payload = {
            numero_ocorrencia: (editTarm.numero_ocorrencia || '').trim().toUpperCase(),
            prioridade: editTarm.prioridade || 'MEDIA',
            solicitante_nome: (editTarm.solicitante_nome || '').trim().toUpperCase(),
            solicitante_telefone: (editTarm.solicitante_telefone || '').trim(),
            numero_vitimas: Math.max(1, parseInt(editTarm.numero_vitimas, 10) || 1),
            tipo_atendimento: editTarm.tipo_atendimento || 'PRIMÁRIO',
            tipo_local: editTarm.tipo_local || 'DOMICÍLIO',
            tipo_via: editTarm.tipo_via || 'Urbana',
            coordenadas:
                (editTarm.coordenadas || '').trim() ||
                (coordsParsed ? `${coordsParsed.lat}, ${coordsParsed.lng}` : ''),
            latitude: coordsParsed ? coordsParsed.lat : null,
            longitude: coordsParsed ? coordsParsed.lng : null,
            link_localizacao: (editTarm.link_localizacao || '').trim(),
            via1: (editTarm.via1 || '').trim().toUpperCase(),
            via2: (editTarm.via2 || '').trim().toUpperCase(),
            numero_end: (editTarm.numero_end || '').trim().toUpperCase(),
            bairro: (editTarm.bairro || '').trim().toUpperCase(),
            ponto_referencia: (editTarm.ponto_referencia || '').trim().toUpperCase(),
            estado: (editTarm.estado || 'PR').trim().toUpperCase(),
            cidade_urb: (editTarm.cidade_urb || '').trim().toUpperCase(),
            rodovia_jurisdicao: (editTarm.rodovia_jurisdicao || '').trim().toUpperCase(),
            rodovia_codigo: (editTarm.rodovia_codigo || '').trim().toUpperCase(),
            rodovia_km: (editTarm.rodovia_km || '').trim(),
            rodovia_uf: (editTarm.rodovia_uf || 'PR').trim().toUpperCase(),
            rodovia_cidade: (editTarm.rodovia_cidade || '').trim().toUpperCase(),
            origem_instituicao: (editTarm.origem_instituicao || '').trim().toUpperCase(),
            origem_rua: (editTarm.origem_rua || '').trim().toUpperCase(),
            origem_numero: (editTarm.origem_numero || '').trim().toUpperCase(),
            origem_bairro: (editTarm.origem_bairro || '').trim().toUpperCase(),
            origem_uf: (editTarm.origem_uf || 'PR').trim().toUpperCase(),
            origem_cidade: (editTarm.origem_cidade || '').trim().toUpperCase(),
            destino_instituicao: (editTarm.destino_instituicao || '').trim().toUpperCase(),
            destino_rua: (editTarm.destino_rua || '').trim().toUpperCase(),
            destino_numero: (editTarm.destino_numero || '').trim().toUpperCase(),
            destino_bairro: (editTarm.destino_bairro || '').trim().toUpperCase(),
            destino_uf: (editTarm.destino_uf || 'PR').trim().toUpperCase(),
            destino_cidade: (editTarm.destino_cidade || '').trim().toUpperCase(),
            motivo: (editTarm.motivo || '').trim().toUpperCase(),
            nome_paciente: (editTarm.nome_paciente || '').trim().toUpperCase(),
            idade_paciente: (editTarm.idade_paciente || '').trim(),
            tipo_idade_paciente: editTarm.tipo_idade_paciente || '',
            sexo_paciente: editTarm.sexo_paciente || '',
            atualizado_em: new Date().toISOString(),
        }

        const { error } = await supabase
            .from('ocorrencias')
            .update(payload)
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao salvar dados TARM: ${error.message}`)
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                anterior: ocorrenciaSelecionada,
                novo: payload,
                campos: [
                    'numero_ocorrencia',
                    'prioridade',
                    'solicitante_nome',
                    'solicitante_telefone',
                    'numero_vitimas',
                    'tipo_atendimento',
                    'coordenadas',
                    'link_localizacao',
                    'motivo',
                    'nome_paciente',
                    'recursos_solicitados'
                ],
            })
            setMensagemModal('Dados da aba TARM salvos com sucesso.')
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function persistirPacientesCenaNoBanco(novaListaPacientes, novaListaRecursos = null, msgSucesso = '') {
        if (!ocorrenciaSelecionada) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const pacientesPreservados = normalizarPacientesVtr(novaListaPacientes)
        const recursosParaSalvar =
            novaListaRecursos !== null
                ? normalizarRecursosSolicitados(novaListaRecursos)
                : normalizarRecursosSolicitados(
                    editRegulador?.recursos_solicitados ?? ocorrenciaSelecionada.recursos_solicitados
                )

        try {
            const { error } = await supabase
                .from('ocorrencias')
                .update({
                    pacientes_cena: pacientesPreservados,
                    recursos_solicitados: recursosParaSalvar,
                    atualizado_em: new Date().toISOString(),
                })
                .eq('id', ocorrenciaSelecionada.id)

            if (error) {
                setMensagemModal(`Erro ao sincronizar em tempo real: ${error.message}`)
            } else {
                setEditRegulador((prev) =>
                    prev
                        ? {
                            ...prev,
                            pacientes_cena: pacientesPreservados,
                            recursos_solicitados: recursosParaSalvar,
                        }
                        : prev
                )
                setOcorrencias((prev) =>
                    prev.map((o) =>
                        o.id === ocorrenciaSelecionada.id
                            ? {
                                ...o,
                                pacientes_cena: pacientesPreservados,
                                recursos_solicitados: recursosParaSalvar,
                            }
                            : o
                    )
                )
                if (msgSucesso) setMensagemModal(msgSucesso)
                await carregarTudo({ silencioso: true })
            }
        } catch (err) {
            setMensagemModal(`Erro inesperado ao salvar paciente da cena: ${err?.message || 'Falha de rede.'}`)
        } finally {
            setSalvandoSecao(false)
        }
    }

    async function handleEnviarRecursosImediato(novaListaRecursos, msgSucesso = '') {
        if (!ocorrenciaSelecionada) return
        const pacsAtuais = normalizarPacientesVtr(
            editRegulador?.pacientes_cena ?? ocorrenciaSelecionada.pacientes_cena
        )
        await persistirPacientesCenaNoBanco(pacsAtuais, novaListaRecursos, msgSucesso)
    }

    async function handleSalvarRegulador() {
        if (!podeEditarRegulador || !ocorrenciaSelecionada || !editRegulador) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const ativandoAgora =
            Boolean(editRegulador.protocolo_imv) && !Boolean(ocorrenciaSelecionada.protocolo_imv)

        const pacsCenaAtual = normalizarPacientesVtr(editRegulador.pacientes_cena)
        const recursosConsolidados = consolidarRecursosPendentesDaCena(
            editRegulador.recursos_solicitados,
            pacsCenaAtual
        )

        const payloadBase = {
            prioridade: editRegulador.prioridade || 'MEDIA',
            protocolo_imv: Boolean(editRegulador.protocolo_imv),
            imv_ativado_por: editRegulador.protocolo_imv
                ? ocorrenciaSelecionada.imv_ativado_por ||
                (perfil?.nome_completo || '').toUpperCase()
                : '',
            imv_ativado_em: editRegulador.protocolo_imv
                ? ocorrenciaSelecionada.imv_ativado_em || new Date().toISOString()
                : null,
            numero_vitimas: Math.max(1, parseInt(editRegulador.numero_vitimas, 10) || 1),
            vitimas_meios_proprios: Math.max(
                0,
                parseInt(editRegulador.vitimas_meios_proprios, 10) || 0
            ),
            vitimas_terceiros: Math.max(0, parseInt(editRegulador.vitimas_terceiros, 10) || 0),
            vitimas_obito_local: Math.max(
                0,
                parseInt(editRegulador.vitimas_obito_local, 10) || 0
            ),
            classificacao_risco: editRegulador.classificacao_risco || '',
            hipotese_diagnostica: (editRegulador.hipotese_diagnostica || '').trim().toUpperCase(),
            quadro_clinico: (editRegulador.quadro_clinico || '').trim(),
            recurso_indicado: (editRegulador.recurso_indicado || '').trim().toUpperCase(),
            conduta_regulacao: (editRegulador.conduta_regulacao || '').trim(),
            destino_instituicao:
                editRegulador.destino_instituicao !== undefined
                    ? (editRegulador.destino_instituicao || '').trim().toUpperCase()
                    : ocorrenciaSelecionada.destino_instituicao || '',
            destino_uf:
                editRegulador.destino_uf !== undefined
                    ? (editRegulador.destino_uf || '').trim().toUpperCase()
                    : ocorrenciaSelecionada.destino_uf || '',
            destino_cidade:
                editRegulador.destino_cidade !== undefined
                    ? (editRegulador.destino_cidade || '').trim().toUpperCase()
                    : ocorrenciaSelecionada.destino_cidade || '',
            atualizado_em: new Date().toISOString(),
            recursos_solicitados: recursosConsolidados,
            pacientes_cena: pacsCenaAtual,
        }

        const { error } = await supabase
            .from('ocorrencias')
            .update(payloadBase)
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao salvar regulação: ${error.message}`)
        } else {
            await registrarAlteracoesEmLote({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                anterior: ocorrenciaSelecionada,
                novo: payloadBase,
                campos: [
                    'prioridade',
                    'protocolo_imv',
                    'numero_vitimas',
                    'vitimas_meios_proprios',
                    'vitimas_terceiros',
                    'vitimas_obito_local',
                    'classificacao_risco',
                    'hipotese_diagnostica',
                    'quadro_clinico',
                    'recurso_indicado',
                    'conduta_regulacao',
                ],
            })
            setEditRegulador((prev) =>
                prev
                    ? {
                        ...prev,
                        pacientes_cena: pacsCenaAtual,
                        recursos_solicitados: recursosConsolidados,
                    }
                    : prev
            )
            setMensagemModal(
                ativandoAgora
                    ? 'PROTOCOLO IMV ATIVADO pelo Médico Regulador, pendências consolidadas e dados salvos.'
                    : 'Registro médico salvo e pendências de recursos verificadas/enviadas.'
            )
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleAdicionarPacienteCena() {
        if (!podeEditarClinicaPaciente || !ocorrenciaSelecionada || !editRegulador) return
        const listaAtual = normalizarPacientesVtr(editRegulador.pacientes_cena)
        const recursoIndicado = (novoPacienteCena.recurso_indicado || '').trim().toUpperCase()
        const hipoteseDiagnostica = (novoPacienteCena.hipotese_diagnostica || '').trim().toUpperCase()
        const destinoTexto = (novoPacienteCena.destino || '').trim().toUpperCase()
        const detalhamentoTexto = (novoPacienteCena.detalhamento || novoPacienteCena.quadro_clinico || '').trim()

        const novoPac = {
            id: `pac-cena-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            nome: (novoPacienteCena.nome || `PACIENTE ${listaAtual.length + 1}`).trim().toUpperCase(),
            idade: (novoPacienteCena.idade || '').trim(),
            tipo_idade: novoPacienteCena.tipo_idade || '',
            sexo: novoPacienteCena.sexo || '',
            cor_start: novoPacienteCena.cor_start || '',
            destino: destinoTexto,
            hipotese_diagnostica: hipoteseDiagnostica,
            recurso_indicado: recursoIndicado,
            detalhamento: detalhamentoTexto,
            quadro_clinico: detalhamentoTexto,
            evolucoes: [],
        }

        const novaLista = [...listaAtual, novoPac]
        const novaListaRecursos = recursoIndicado
            ? anexarOuConsolidarRecursoParaPaciente(
                editRegulador.recursos_solicitados,
                novoPac,
                recursoIndicado
            )
            : editRegulador.recursos_solicitados

        setNovoPacienteCena({
            nome: '',
            idade: '',
            tipo_idade: '',
            sexo: '',
            cor_start: '',
            destino: '',
            hipotese_diagnostica: '',
            detalhamento: '',
            recurso_indicado: '',
            quadro_clinico: '',
        })

        await persistirPacientesCenaNoBanco(
            novaLista,
            novaListaRecursos,
            recursoIndicado
                ? `Paciente ${novoPac.nome} registrado e recurso (${recursoIndicado}) enviado imediatamente ao Rádio Operador.`
                : `Paciente ${novoPac.nome} registrado na cena e sincronizado em tempo real.`
        )
    }

    async function handleAtualizarPacienteCenaLocal(pacienteId, patch) {
        if (!podeEditarClinicaPaciente || !ocorrenciaSelecionada || !editRegulador) return
        const listaAtual = normalizarPacientesVtr(editRegulador.pacientes_cena)
        let pacAtualizado = null
        const dadosPatchBase = typeof patch === 'function' ? null : patch

        const novaLista = listaAtual.map((p) => {
            if (p.id !== pacienteId) return p
            const dadosPatch = typeof patch === 'function' ? patch(p) : patch
            const proximo = normalizarPacientesVtr([{ ...p, ...dadosPatch }])[0]
            pacAtualizado = proximo
            return proximo
        })

        let novaListaRecursos = editRegulador.recursos_solicitados
        const mudouRecurso =
            pacAtualizado &&
            (dadosPatchBase
                ? 'recurso_indicado' in dadosPatchBase
                : true)

        if (mudouRecurso && pacAtualizado) {
            novaListaRecursos = anexarOuConsolidarRecursoParaPaciente(
                editRegulador.recursos_solicitados,
                pacAtualizado,
                pacAtualizado.recurso_indicado
            )
        }

        await persistirPacientesCenaNoBanco(novaLista, novaListaRecursos)
    }

    async function handleRemoverSolicitacaoDespacho(reqItem) {
        if (!podeEditarRadio || !ocorrenciaSelecionada || !reqItem) return
        const listaAtual = normalizarRecursosSolicitados(ocorrenciaSelecionada.recursos_solicitados)
        const alvo = listaAtual.find((r) => r.id === reqItem.id) || reqItem
        const vinculosProprios = Array.isArray(alvo.recursos_empenhados_vinculados)
            ? alvo.recursos_empenhados_vinculados
            : []
        if (vinculosProprios.length === 0) return

        const novaLista = listaAtual.filter((r) => r.id !== alvo.id)
        setSalvandoSecao(true)
        setMensagemModal('')

        try {
            const { error } = await supabase
                .from('ocorrencias')
                .update({
                    recursos_solicitados: novaLista,
                    atualizado_em: new Date().toISOString(),
                })
                .eq('id', ocorrenciaSelecionada.id)

            if (error) {
                setMensagemModal(`Erro ao remover solicitação: ${error.message}`)
            } else {
                setEditRegulador((prev) =>
                    prev ? { ...prev, recursos_solicitados: novaLista } : prev
                )
                setOcorrencias((prev) =>
                    prev.map((o) =>
                        o.id === ocorrenciaSelecionada.id
                            ? { ...o, recursos_solicitados: novaLista }
                            : o
                    )
                )
                setMensagemModal(`Solicitação (${alvo.quantidade}x ${alvo.recurso}) removida.`)
                await carregarTudo({ silencioso: true })
            }
        } finally {
            setSalvandoSecao(false)
        }
    }

    async function handleRemoverPacienteCena(pacienteId) {
        if (!podeEditarClinicaPaciente || !ocorrenciaSelecionada || !editRegulador) return
        const listaAtual = normalizarPacientesVtr(editRegulador.pacientes_cena)
        const novaLista = listaAtual.filter((p) => p.id !== pacienteId)
        const recursosSemPaciente = normalizarRecursosSolicitados(editRegulador.recursos_solicitados).filter(
            (r) => r.atendido || (r.paciente_id || '') !== pacienteId
        )

        await persistirPacientesCenaNoBanco(
            novaLista,
            recursosSemPaciente,
            'Paciente removido da cena e sincronizado em tempo real.'
        )
    }

    async function handleAdicionarPacienteNaVtr(emp) {
        if (!podeEditarClinicaPaciente) return
        const draftNovo = novoPacientePorVtr[emp.id] || {
            nome: '',
            idade: '',
            tipo_idade: '',
            sexo: '',
            cor_start: '',
            destino: '',
            quadro_clinico: '',
        }

        const pacientesAtuais = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novoPac = {
            id: `pac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            nome: (draftNovo.nome || `PACIENTE ${pacientesAtuais.length + 1}`).trim().toUpperCase(),
            idade: (draftNovo.idade || '').trim(),
            tipo_idade: draftNovo.tipo_idade || '',
            sexo: draftNovo.sexo || '',
            cor_start: draftNovo.cor_start || '',
            destino: (draftNovo.destino || '').trim().toUpperCase(),
            quadro_clinico: (draftNovo.quadro_clinico || '').trim(),
            evolucoes: [],
        }

        const novaLista = [...pacientesAtuais, novoPac]
        atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: novaLista,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'CRIACAO',
                campo: `PACIENTE_VTR_${emp.prefixo}`,
                valorNovo: `${novoPac.nome}${novoPac.cor_start ? ` (${novoPac.cor_start})` : ''}`,
            })
            setNovoPacientePorVtr((prev) => ({
                ...prev,
                [emp.id]: {
                    nome: '',
                    idade: '',
                    tipo_idade: '',
                    sexo: '',
                    cor_start: '',
                    destino: '',
                    quadro_clinico: '',
                },
            }))
            setMensagemModal(`Paciente ${novoPac.nome} adicionado ao prontuário da ${emp.prefixo}.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    function handleAtualizarCampoPacienteLocal(emp, pacienteId, patch) {
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novaLista = listaAtual.map((p) =>
            p.id === pacienteId
                ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) }
                : p
        )
        atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })
    }

    async function handleSalvarPacienteNaVtr(emp, pacienteId) {
        if (!podeEditarClinicaPaciente) return
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const pacAlvo = listaAtual.find((p) => p.id === pacienteId)
        if (!pacAlvo) return

        const textoEvo = (novaEvolucaoPorPaciente[pacienteId] || '').trim()
        const listaComEvo = textoEvo
            ? listaAtual.map((p) =>
                p.id === pacienteId
                    ? {
                        ...p,
                        evolucoes: [
                            {
                                id: `evo-${Date.now()}`,
                                texto: textoEvo,
                                autor_nome: (perfil?.nome_completo || '').toUpperCase(),
                                autor_cargo: cargo,
                                criado_em: new Date().toISOString(),
                            },
                            ...(p.evolucoes || []),
                        ],
                    }
                    : p
            )
            : listaAtual

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: listaComEvo,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: listaComEvo })
            if (textoEvo) {
                setNovaEvolucaoPorPaciente((prev) => ({ ...prev, [pacienteId]: '' }))
            }
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_viaturas',
                registroId: emp.id,
                acao: 'EDICAO',
                campo: `PRONTUARIO_PACIENTE_${emp.prefixo}`,
                valorNovo: `${pacAlvo.nome}${pacAlvo.cor_start ? ` (${pacAlvo.cor_start})` : ''}${textoEvo ? ` • EVO: ${textoEvo}` : ''}`,
            })
            setMensagemModal(`Prontuário de ${pacAlvo.nome} na ${emp.prefixo} salvo.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    async function handleRemoverPacienteNaVtr(emp, pacienteId) {
        if (!podeEditarClinicaPaciente) return
        const listaAtual = normalizarPacientesVtr(
            rascunhosVtr[emp.id]?.pacientes_detalhes ?? emp.pacientes_detalhes
        )
        const novaLista = listaAtual.filter((p) => p.id !== pacienteId)

        setSalvandoSecao(true)
        const { error } = await supabase
            .from('ocorrencia_viaturas')
            .update({
                pacientes_detalhes: novaLista,
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', emp.id)

        if (!error) {
            atualizarDraftVtr(emp.id, emp, { pacientes_detalhes: novaLista })
            setMensagemModal(`Ficha do paciente removida da ${emp.prefixo}.`)
            await carregarTudo({ silencioso: true })
        }
        setSalvandoSecao(false)
    }

    async function handleAlterarCorVtr(emp, corId, delta) {
        return executarAlterarCorVtr({
            perfil,
            podeEditarRadio,
            podeEditarRegulador,
            emp,
            corId,
            delta,
            setSalvandoSecao,
            setMensagemModal,
            carregarTudo,
        })
    }

    function renderPainelBalancoVitimas(oc, empenhosDaOc, { permitirEditarVtr = false } = {}) {
        return renderizarPainelBalancoVitimas(oc, empenhosDaOc, {
            permitirEditarVtr,
            salvandoSecao,
            onAlterarCorVtr: (emp, corId, delta) => handleAlterarCorVtr(emp, corId, delta),
        })
    }

    async function handleAlternarApoioImediato(tipoApoio) {
        if (!podeEditarRegulador || !ocorrenciaSelecionada) return
        setSalvandoSecao(true)
        setMensagemModal('')

        const atualPolicia = Boolean(
            editRegulador?.apoio_policia ?? ocorrenciaSelecionada.apoio_policia
        )
        const atualCobom = Boolean(
            editRegulador?.apoio_cobom_resgate ?? ocorrenciaSelecionada.apoio_cobom_resgate
        )

        const proximoPolicia = tipoApoio === 'POLICIA' ? !atualPolicia : atualPolicia
        const proximoCobom = tipoApoio === 'COBOM_RESGATE' ? !atualCobom : atualCobom

        const payloadApoio = {
            apoio_policia: proximoPolicia,
            apoio_cobom_resgate: proximoCobom,
            atualizado_em: new Date().toISOString(),
        }

        const { error } = await supabase
            .from('ocorrencias')
            .update(payloadApoio)
            .eq('id', ocorrenciaSelecionada.id)

        if (error) {
            setMensagemModal(`Erro ao enviar aviso de apoio ao Rádio: ${error.message}`)
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencias',
                registroId: ocorrenciaSelecionada.id,
                acao: 'EDICAO',
                campo: tipoApoio === 'POLICIA' ? 'APOIO_POLICIA' : 'APOIO_COBOM_RESGATE',
                valorNovo:
                    tipoApoio === 'POLICIA'
                        ? proximoPolicia
                            ? 'SOLICITADO AO RÁDIO OPERADOR'
                            : 'CANCELADO'
                        : proximoCobom
                            ? 'SOLICITADO AO RÁDIO OPERADOR'
                            : 'CANCELADO',
            })

            setEditRegulador((prev) =>
                prev
                    ? {
                        ...prev,
                        apoio_policia: proximoPolicia,
                        apoio_cobom_resgate: proximoCobom,
                    }
                    : prev
            )

            const nomeApoio = tipoApoio === 'POLICIA' ? 'APOIO POLÍCIA' : 'APOIO COBOM / RESGATE'
            const ativoApoio = tipoApoio === 'POLICIA' ? proximoPolicia : proximoCobom
            setMensagemModal(
                ativoApoio
                    ? `Aviso de ${nomeApoio} enviado imediatamente ao Rádio Operador.`
                    : `Aviso de ${nomeApoio} desativado.`
            )
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleAdicionarEvolucao(e) {
        e.preventDefault()
        if (!podeEditarRegulador || !ocorrenciaSelecionada) return

        const textoLimpo = novaEvolucaoTexto.trim()
        const quadroAtualizado = novoQuadroClinicoRapido.trim()

        if (!textoLimpo && !quadroAtualizado) return

        setSalvandoSecao(true)
        setMensagemModal('')

        if (quadroAtualizado !== (ocorrenciaSelecionada.quadro_clinico || '').trim()) {
            await supabase
                .from('ocorrencias')
                .update({
                    quadro_clinico: quadroAtualizado,
                    atualizado_em: new Date().toISOString(),
                })
                .eq('id', ocorrenciaSelecionada.id)
        }

        const { data: evoCriada, error } = await supabase
            .from('ocorrencia_evolucoes')
            .insert({
                ocorrencia_id: ocorrenciaSelecionada.id,
                origem_aba: 'REGULADOR',
                quadro_clinico: quadroAtualizado,
                evolucao_texto: textoLimpo || 'Atualização de quadro clínico.',
                autor_id: perfil?.id || null,
                autor_nome: (perfil?.nome_completo || '').toUpperCase(),
                autor_cargo: cargo,
            })
            .select()
            .single()

        if (error) {
            setMensagemModal(`Erro ao registrar evolução: ${error.message}`)
        } else {
            await registrarAuditoria({
                perfil,
                tabela: 'ocorrencia_evolucoes',
                registroId: evoCriada?.id || ocorrenciaSelecionada.id,
                acao: 'CRIACAO',
                campo: 'EVOLUCAO_MEDICA',
                valorNovo: textoLimpo || quadroAtualizado,
            })
            setNovaEvolucaoTexto('')
            setMensagemModal('Evolução e quadro clínico adicionados ao prontuário da ocorrência.')
            await carregarTudo({ silencioso: true })
        }

        setSalvandoSecao(false)
    }

    async function handleEmpenharViatura(prefixoOverride = null, solicitacaoContexto = null) {
        return executarEmpenharViatura({
            perfil,
            podeEditarRadio,
            ocorrenciaSelecionada,
            empenhosDaOcorrencia,
            viaturas,
            viaturaParaEmpenhar,
            setViaturaParaEmpenhar,
            setEditRadio,
            setEditRegulador,
            setOcorrencias,
            setSalvandoSecao,
            setMensagemModal,
            horaAtualHhMm,
            normalizarRecursosSolicitados,
            carregarTudo,
            prefixoOverride,
            solicitacaoContexto,
        })
    }

    async function handleAtualizarStatusEmpenho(emp, novoStatusEmpenho) {
        return executarAtualizarStatusEmpenho({
            perfil,
            podeEditarRadio,
            ocorrenciaSelecionada,
            emp,
            novoStatusEmpenho,
            obterDraftVtr,
            atualizarDraftVtr,
            setEditRadio,
            setSalvandoSecao,
            setMensagemModal,
            horaAtualHhMm,
            carregarTudo,
        })
    }

    function alterarHorarioEStatusVtr(emp, chaveHorario, novoValor) {
        return executarAlterarHorarioEStatusVtr({
            emp,
            chaveHorario,
            novoValor,
            obterDraftVtr,
            atualizarDraftVtr,
        })
    }

    async function handleSalvarHorariosVtr(emp) {
        return executarSalvarHorariosVtr({
            perfil,
            podeEditarRadio,
            emp,
            obterDraftVtr,
            setSalvandoSecao,
            setMensagemModal,
            carregarTudo,
        })
    }

    async function handleDesvincularEmpenho(emp) {
        return executarDesvincularEmpenho({
            perfil,
            podeEditarRadio,
            ocorrenciaSelecionada,
            emp,
            setEditRegulador,
            setOcorrencias,
            setSalvandoSecao,
            setMensagemModal,
            horaAtualHhMm,
            normalizarRecursosSolicitados,
            carregarTudo,
        })
    }

    async function handleSalvarRadio(statusForcado = null) {
        return executarSalvarRadio({
            perfil,
            podeEditarRadio,
            ocorrenciaSelecionada,
            empenhosDaOcorrencia,
            editRadio,
            statusForcado,
            setEditRadio,
            setSalvandoSecao,
            setMensagemModal,
            horaAtualHhMm,
            carregarTudo,
        })
    }

    return (
        <div className="space-y-4">
            <div className="bg-qth-card border border-slate-700/70 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-extrabold text-qth-orange flex items-center gap-2 uppercase">
                            <Radio className="w-4 h-4" />
                            Central de Regulação e Despacho
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Abertura TARM • Regulação Médica & IMV • Empenho Multi-VTR, Códigos J e QTA
                        </p>
                    </div>

                    {podeCriarOuEditarTarm && (
                        <div className="flex items-center gap-2">
                            {mostrarFormNova && (
                                <button
                                    type="button"
                                    onClick={descartarRascunhoNova}
                                    className="bg-slate-800 hover:bg-qth-red/80 text-slate-200 hover:text-white border border-slate-600 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    DESCARTAR RASCUNHO
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setMostrarFormNova(!mostrarFormNova)
                                    setErroNova('')
                                }}
                                className="bg-qth-green hover:bg-green-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                                {mostrarFormNova ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {mostrarFormNova ? 'OCULTAR FORMULÁRIO' : 'NOVA OCORRÊNCIA'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Formulário de Nova Ocorrência (TARM) */}
                {mostrarFormNova && podeCriarOuEditarTarm && (
                    <FormNovaOcorrencia
                        formNova={formNova}
                        setFormNova={setFormNova}
                        criandoOcorrencia={criandoOcorrencia}
                        erroNova={erroNova}
                        listaEstados={listaEstados}
                        cidadesNovaUrb={cidadesNovaUrb}
                        cidadesNovaRod={cidadesNovaRod}
                        cidadesNovaOrig={cidadesNovaOrig}
                        cidadesNovaDest={cidadesNovaDest}
                        onSubmit={handleCriarOcorrencia}
                        onDescartar={descartarRascunhoNova}
                    />
                )}

                {/* Sub-abas por Status + Resumo Geral */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-700/70 pb-3">
                    {SUB_ABAS_STATUS.map((aba) => {
                        const ativa = subAbaStatus === aba.id
                        const qtd = contadoresSubAbas[aba.id] ?? 0
                        return (
                            <button
                                key={aba.id}
                                type="button"
                                onClick={() => setSubAbaStatus(aba.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-colors border ${ativa
                                    ? 'bg-qth-orange text-white border-qth-orange'
                                    : 'bg-qth-bg/70 text-slate-300 border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <span>{aba.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${ativa ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    {qtd}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Barra de Pesquisa Global e Filtros Inteligentes */}
                <div className="bg-qth-bg/70 border border-slate-700/80 rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={buscaTexto}
                                onChange={(e) => setBuscaTexto(e.target.value.toUpperCase())}
                                placeholder="PESQUISAR Nº OCORRÊNCIA, SOLICITANTE, MOTIVO, ENDEREÇO, COORDENADAS OU VTR..."
                                className="w-full bg-qth-card border border-slate-600 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-slate-500 uppercase focus:outline-none focus:border-qth-orange"
                            />
                            {buscaTexto && (
                                <button
                                    type="button"
                                    onClick={() => setBuscaTexto('')}
                                    className="text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-300 bg-qth-card border border-slate-700 px-2.5 py-1.5 rounded-lg">
                                {ocorrenciasFiltradas.length} RESULTADOS
                            </span>
                            {temFiltroAtivo && (
                                <button
                                    type="button"
                                    onClick={limparFiltros}
                                    className="bg-slate-800 hover:bg-slate-700 text-qth-orange border border-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    LIMPAR FILTROS
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        <SelectPesquisavel
                            label="Prioridade"
                            opcoes={['TODAS', ...PRIORIDADES.map((p) => p.id)]}
                            valor={filtroPrioridade}
                            onChange={setFiltroPrioridade}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Natureza"
                            opcoes={['TODAS', ...NATUREZAS_ATENDIMENTO]}
                            valor={filtroNatureza}
                            onChange={setFiltroNatureza}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Município"
                            opcoes={opcoesMunicipiosFiltro}
                            valor={filtroMunicipio}
                            onChange={setFiltroMunicipio}
                            placeholder="TODOS"
                        />

                        <SelectPesquisavel
                            label="Viatura Empenhada"
                            opcoes={opcoesViaturasFiltro}
                            valor={filtroViatura}
                            onChange={setFiltroViatura}
                            placeholder="TODAS"
                        />

                        <SelectPesquisavel
                            label="Vítimas / IMV"
                            opcoes={['TODAS', 'MULTIPLAS_VITIMAS', 'IMV_ATIVO']}
                            valor={filtroImv}
                            onChange={setFiltroImv}
                            placeholder="TODAS"
                        />
                    </div>
                </div>

                {/* Listagem de Cards das Ocorrências */}
                {carregando ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                        CARREGANDO OCORRÊNCIAS...
                    </p>
                ) : ocorrenciasFiltradas.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                        <p className="text-xs text-slate-400">
                            NENHUMA OCORRÊNCIA ENCONTRADA NESTA ABA COM OS FILTROS ATUAIS.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ocorrenciasFiltradas.map((oc) => {
                            const prioMeta = obterMetaPrioridade(oc.prioridade)
                            const vtrsOc = empenhosPorOcorrencia.get(oc.id) || []
                            const enderecoFmt = formatarEnderecoOcorrencia(oc)
                            const urlRotaCard = construirUrlRota(oc)
                            const qtdVit = Math.max(1, parseInt(oc.numero_vitimas, 10) || 1)
                            const balancoCard = calcularBalancoVitimas(oc, vtrsOc)

                            return (
                                <div
                                    key={oc.id}
                                    onClick={() => abrirOcorrencia(oc, 'RESUMO')}
                                    className={`bg-qth-bg/75 border-2 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition-all ${oc.protocolo_imv
                                        ? 'border-qth-red bg-red-950/20 shadow-lg shadow-qth-red/20 hover:border-red-400'
                                        : prioMeta.card
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-extrabold text-white">
                                                    OCORRÊNCIA #{oc.numero_ocorrencia || 'S/N'}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${prioMeta.badge}`}
                                                >
                                                    {prioMeta.label}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase">
                                                    {oc.status_ocorrencia}
                                                </span>
                                                {oc.protocolo_imv ? (
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-red text-white uppercase">
                                                        IMV ATIVO
                                                    </span>
                                                ) : (
                                                    qtdVit >= 2 && (
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-yellow/25 text-yellow-200 border border-qth-yellow/60 uppercase">
                                                            {qtdVit} VÍTIMAS
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-qth-orange mt-1 uppercase">
                                                {oc.tipo_atendimento} • {oc.motivo || 'MOTIVO NÃO INFORMADO'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {urlRotaCard && (
                                                <a
                                                    href={urlRotaCard}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-2 py-1 rounded-lg bg-qth-blue/30 hover:bg-qth-blue text-blue-200 hover:text-white border border-blue-500/40 text-[10px] font-extrabold flex items-center gap-1"
                                                    title="Abrir rota direta no GPS/Maps"
                                                >
                                                    <Navigation className="w-3 h-3" />
                                                    ROTA
                                                </a>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {balancoCard.embarcadasVtr}/{qtdVit}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <span className="uppercase">{enderecoFmt}</span>
                                    </p>

                                    {oc.quadro_clinico && (
                                        <p className="text-[11px] text-slate-300 bg-qth-card/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 line-clamp-2">
                                            <strong className="text-qth-orange uppercase">QUADRO CLÍNICO:</strong>{' '}
                                            {oc.quadro_clinico}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {vtrsOc.length === 0 ? (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    SEM VTR EMPENHADA
                                                </span>
                                            ) : (
                                                vtrsOc.map((emp) => {
                                                    const totalCorEmp = somarCoresVtr(emp.vitimas_cores)
                                                    return (
                                                        <span
                                                            key={emp.id}
                                                            className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-qth-blue/25 text-blue-200 border border-blue-500/40 uppercase"
                                                        >
                                                            {emp.prefixo} ({emp.status_empenho}
                                                            {totalCorEmp > 0 ? ` • ${totalCorEmp} VÍTIMA(S)` : ''})
                                                        </span>
                                                    )
                                                })
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            {oc.codigo_j && (
                                                <span className="text-green-400 uppercase">{oc.codigo_j}</span>
                                            )}
                                            {oc.codigo_qta && (
                                                <span className="text-yellow-300 uppercase">{oc.codigo_qta}</span>
                                            )}
                                            <span className="text-qth-orange">ABRIR ›</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal / Tela Interna da Ocorrência com 4 Abas */}
            <ModalOcorrencia
                ocorrenciaSelecionada={ocorrenciaSelecionada}
                editTarm={editTarm}
                setEditTarm={setEditTarm}
                editRegulador={editRegulador}
                setEditRegulador={setEditRegulador}
                editRadio={editRadio}
                setEditRadio={setEditRadio}
                abaInterna={abaInterna}
                setAbaInterna={setAbaInterna}
                mensagemModal={mensagemModal}
                setMensagemModal={setMensagemModal}
                fecharModalOcorrencia={fecharModalOcorrencia}
                podeCriarOuEditarTarm={podeCriarOuEditarTarm}
                podeEditarClinicaPaciente={podeEditarClinicaPaciente}
                podeEditarRegulador={podeEditarRegulador}
                podeEditarRadio={podeEditarRadio}
                salvandoSecao={salvandoSecao}
                listaEstados={listaEstados}
                cidadesEditTarmUrb={cidadesEditTarmUrb}
                cidadesEditTarmRod={cidadesEditTarmRod}
                cidadesEditTarmOrig={cidadesEditTarmOrig}
                cidadesEditTarmDest={cidadesEditTarmDest}
                empenhosDaOcorrencia={empenhosDaOcorrencia}
                evolucoesDaOcorrencia={evolucoesDaOcorrencia}
                viaturas={viaturas}
                rascunhosVtr={rascunhosVtr}
                novoPacientePorVtr={novoPacientePorVtr}
                setNovoPacientePorVtr={setNovoPacientePorVtr}
                novaEvolucaoPorPaciente={novaEvolucaoPorPaciente}
                setNovaEvolucaoPorPaciente={setNovaEvolucaoPorPaciente}
                novoPacienteCena={novoPacienteCena}
                setNovoPacienteCena={setNovoPacienteCena}
                handleAdicionarPacienteCena={handleAdicionarPacienteCena}
                handleAtualizarPacienteCenaLocal={handleAtualizarPacienteCenaLocal}
                handleRemoverPacienteCena={handleRemoverPacienteCena}
                handleEnviarRecursosImediato={handleEnviarRecursosImediato}
                handleAlternarApoioImediato={handleAlternarApoioImediato}
                handleAlterarPrioridadeImediata={handleAlterarPrioridadeImediata}
                novaEvolucaoTexto={novaEvolucaoTexto}
                setNovaEvolucaoTexto={setNovaEvolucaoTexto}
                setNovoQuadroClinicoRapido={setNovoQuadroClinicoRapido}
                viaturaParaEmpenhar={viaturaParaEmpenhar}
                setViaturaParaEmpenhar={setViaturaParaEmpenhar}
                pacientesDisponiveisRegulador={pacientesDisponiveisRegulador}
                recursosOrdenadosMiniPainel={recursosOrdenadosMiniPainel}
                normalizarRecursosSolicitados={normalizarRecursosSolicitados}
                renderPainelBalancoVitimas={renderPainelBalancoVitimas}
                obterDraftVtr={obterDraftVtr}
                handleSalvarTarm={handleSalvarTarm}
                handleAdicionarPacienteNaVtr={handleAdicionarPacienteNaVtr}
                handleAtualizarCampoPacienteLocal={handleAtualizarCampoPacienteLocal}
                handleSalvarPacienteNaVtr={handleSalvarPacienteNaVtr}
                handleRemoverPacienteNaVtr={handleRemoverPacienteNaVtr}
                handleSalvarRegulador={handleSalvarRegulador}
                handleAdicionarEvolucao={handleAdicionarEvolucao}
                handleEmpenharViatura={handleEmpenharViatura}
                handleAtualizarStatusEmpenho={handleAtualizarStatusEmpenho}
                handleDesvincularEmpenho={handleDesvincularEmpenho}
                alterarHorarioEStatusVtr={alterarHorarioEStatusVtr}
                horaAtualHhMm={horaAtualHhMm}
                handleSalvarHorariosVtr={handleSalvarHorariosVtr}
                handleAlterarCorVtr={handleAlterarCorVtr}
                handleSalvarRadio={handleSalvarRadio}
                handleRemoverSolicitacaoDespacho={handleRemoverSolicitacaoDespacho}
            />
        </div>
    )
}