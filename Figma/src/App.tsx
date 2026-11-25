import { useEffect, useState, type ReactNode } from 'react'
import { listarPacientes } from './lib/api'
import type { PacienteResumen } from './lib/types'
import MiProceso from './vistas/MiProceso'
import ComoTeSientes from './vistas/ComoTeSientes'
import Citas from './vistas/Citas'
import Chatbot from './vistas/Chatbot'
import Conecta from './vistas/Conecta'

// Assets oficiales (carpeta Logos/, servidos desde /krebs).
const A = {
  logotipo: '/krebs/logotipo-krebs.svg', // wordmark blanco para el header
  icono: '/krebs/isotipo-central.svg', // isotipo central por defecto
  kiroVideo: '/krebs/kiro-animado.mp4', // animación de carga (splash)
  kiroSonriente: '/krebs/kiro-sonriente.svg',
  kiroTriste: '/krebs/kiro-triste.svg',
  bProceso: '/krebs/icono-mi-proceso.svg',
  bPreguntas: '/krebs/icono-preguntas.svg',
  bConecta: '/krebs/icono-conecta.svg',
  bSientes: '/krebs/icono-como-te-sientes.svg',
}

// Las cuatro herramientas del hub (mockups 13-18).
type Tool = 'proceso' | 'preguntas' | 'conecta' | 'sientes'
const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'proceso', label: 'Mi proceso', icon: A.bProceso },
  { id: 'preguntas', label: 'Preguntas', icon: A.bPreguntas },
  { id: 'conecta', label: 'Conecta', icon: A.bConecta },
  { id: 'sientes', label: '¿Cómó te sientes?', icon: A.bSientes },
]

// Ícono central de la barra inferior según la herramienta abierta.
const ICONO_CENTRAL: Record<Tool, string> = {
  proceso: A.bProceso,
  preguntas: A.bPreguntas,
  conecta: A.bConecta,
  sientes: A.bSientes,
}

// Recorrido explicativo del hub (mockups 13-18): un texto guía y, opcionalmente,
// una herramienta resaltada. tool=null es la intro (13) y el cierre (18).
// Textos tomados de los mockups 13-18.
const TOUR: { text: string; tool: Tool | null }[] = [
  { text: 'Estas son las herramientas que podrán facilitar tu proceso.', tool: null },
  { text: 'En Mi proceso podrás encontrar una línea de tiempo sobre cómo avanza tu condición.', tool: 'proceso' },
  { text: 'En Preguntas podrás consultarme, soy un ChatBot especializado en Cáncer Gástrico; pregúntame acerca de síntomas, consejos y recomendaciones.', tool: 'preguntas' },
  { text: 'En Conecta podrás encontrar comunidades de personas que comparten tu diagnóstico.', tool: 'conecta' },
  { text: 'Es importante conocer cómo te encuentras emocionalmente durante tu proceso. Aquí podrás registrar cómo te sientes y acceder a orientación psicológica o líneas de atención profesional cuando lo necesites.', tool: 'sientes' },
  { text: 'Aquí aparecerán notificaciones importantes.', tool: null },
]

type Step =
  | 'splash' | 'hi' | 'start' | 'before' | 'health' | 'personal' | 'notify'
  | 'terms' | 'tour' | 'hub' | 'section' | 'citas'

const Chevron = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4l8 8-8 8" /></svg>
)

function NextButton({ label = 'siguiente', disabled, onClick, className = '' }: { label?: string; disabled?: boolean; onClick: () => void; className?: string }) {
  return (
    <button disabled={disabled} onClick={onClick} className={`flex items-center gap-1 text-[22px] font-bold transition-colors ${disabled ? 'text-[#b9e7f7]' : 'text-krebs-cyan hover:text-[#16b0ea]'} ${className}`}>
      {label}<Chevron />
    </button>
  )
}

function Check({ checked, label, onChange, small }: { checked: boolean; label: string; onChange: () => void; small?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-krebs-cyan ${small ? 'text-[12px]' : 'text-[19px]'}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={`flex shrink-0 items-center justify-center rounded-[3px] border-2 border-krebs-cyan bg-white/40 peer-focus-visible:ring-2 peer-focus-visible:ring-krebs-ink ${small ? 'h-3.5 w-3.5' : 'h-5 w-5'}`}>
        {checked && <svg viewBox="0 0 24 24" className="h-full w-full text-krebs-ink" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>}
      </span>
      <span>{label}</span>
    </label>
  )
}

const navIcons = {
  home: <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" />,
  cal: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
  user: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6 18c1.5-3 10.500-3 12 0" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-2 5.500-2 6 0M14 10h4M14 14h4" /></>,
}

function Svg({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

function Bubble({ label, icon, highlight, onClick, className = '' }: { label: string; icon: string; highlight?: boolean; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`group flex flex-col items-center gap-1 transition-transform hover:scale-105 active:scale-95 ${className}`}>
      <span className={`flex h-[118px] w-[118px] items-center justify-center rounded-full ${highlight ? 'ring-4 ring-krebs-cyan ring-offset-2' : ''}`}>
        <img src={icon} alt="" className="h-[118px] w-[118px] object-contain" />
      </span>
      <span className="text-[15px] font-semibold text-krebs-cyan">{label}</span>
    </button>
  )
}

// (El placeholder genérico se reemplazó por las vistas Chatbot y Conecta.)

export default function App() {
  const [step, setStep] = useState<Step>('splash')
  const [tool, setTool] = useState<Tool>('proceso')
  const [tourIdx, setTourIdx] = useState(0)
  const [health, setHealth] = useState<boolean | null>(null)
  const [personal, setPersonal] = useState<boolean | null>(null)
  const [notify, setNotify] = useState<boolean | null>(null)
  const [terms, setTerms] = useState(false)
  const [menu, setMenu] = useState(false)

  // Paciente del demo. Control TEMPORAL (ver menú): el diseño no define cómo se
  // identifica al paciente, así que elegimos uno para la demostración.
  const [pacientes, setPacientes] = useState<PacienteResumen[]>([])
  const [pacienteId, setPacienteId] = useState('')

  useEffect(() => {
    listarPacientes()
      .then((ps) => {
        setPacientes(ps)
        setPacienteId((a) => a || ps[0]?.paciente_id || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (step !== 'splash') return
    const t = setTimeout(() => setStep('hi'), 2600)
    return () => clearTimeout(t)
  }, [step])

  const restart = () => {
    setHealth(null); setPersonal(null); setNotify(null); setTerms(false); setMenu(false); setTourIdx(0); setStep('splash')
  }
  const onboarding = ['before', 'health', 'personal', 'notify', 'terms'].includes(step)
  const go = (s: Step) => { setMenu(false); setStep(s) }
  const open = (t: Tool) => { setTool(t); go('section') }

  const choice = (v: boolean | null, set: (b: boolean | null) => void, no: string, yes: string) => (
    <div className="flex justify-center gap-8">
      <Check checked={v === false} label={no} onChange={() => set(v === false ? null : false)} />
      <Check checked={v === true} label={yes} onChange={() => set(v === true ? null : true)} />
    </div>
  )

  const title = (t: string, size = 'text-[26px]') => <h1 className={`text-center font-light text-krebs-cyan ${size}`}>{t}</h1>

  const tourStep = TOUR[tourIdx]
  const avanzarTour = () => {
    if (tourIdx < TOUR.length - 1) setTourIdx(tourIdx + 1)
    else go('hub')
  }

  return (
    <div className="flex min-h-screen items-center justify-center sm:p-4">
      <div className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-white sm:h-[min(100dvh-2rem,780px)] sm:rounded-[28px] sm:shadow-2xl">
        {/* Header */}
        <header className="relative z-20 flex min-h-[136px] shrink-0 items-center justify-between bg-gradient-to-r from-[#0a86d4] to-[#00c2e0] px-5 pb-7 pt-[max(env(safe-area-inset-top),56px)] text-white">
          <button aria-label="Menú" onClick={() => setMenu(!menu)}>
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <img src={A.logotipo} alt="krebs" className="h-9 w-auto" />
          <button aria-label="Cerrar" onClick={restart}>
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
          {menu && (
            <div className="fadein absolute left-3 top-[120px] z-30 w-64 rounded-xl bg-white p-3 text-krebs-ink shadow-xl">
              <button onClick={() => go(step === 'splash' || onboarding || step === 'hi' || step === 'start' ? step : 'hub')} className="block w-full rounded-lg px-3 py-2 text-left font-semibold hover:bg-[#e6f8fd]">Inicio</button>
              <button onClick={restart} className="block w-full rounded-lg px-3 py-2 text-left font-semibold hover:bg-[#e6f8fd]">Reiniciar recorrido</button>
              {/* Control TEMPORAL: selector de paciente del demo */}
              <div className="mt-2 border-t border-krebs-cyan/20 pt-2">
                <p className="px-3 text-[11px] font-semibold text-krebs-ink/60">[TEMPORAL] Paciente del demo</p>
                <select
                  value={pacienteId}
                  onChange={(e) => { setPacienteId(e.target.value); setMenu(false) }}
                  className="mt-1 w-full rounded-lg border border-krebs-cyan/40 bg-white px-2 py-1.5 text-[13px]"
                >
                  {pacientes.map((p) => (
                    <option key={p.paciente_id} value={p.paciente_id}>{p.etiqueta}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="relative -mt-4 -mb-[78px] flex-1 overflow-hidden rounded-t-[28px] bg-white" onClick={() => menu && setMenu(false)}>
          <div key={step + tool + tourIdx} className="fadein absolute inset-0 overflow-hidden pb-24">
            {step === 'splash' && (
              <div className="flex h-full items-center justify-center pb-10">
                <video src={A.kiroVideo} autoPlay muted playsInline className="w-[220px]" />
              </div>
            )}

            {(step === 'hi' || step === 'start') && (
              <div className="relative h-full px-7 pt-14">
                {title('¡Bienvenido!', 'text-[42px]')}
                {step === 'hi' ? (
                  <>
                    <p className="mt-7 text-justify text-[17px] leading-snug text-krebs-cyan">Krebs es un espacio de acompañamiento para personas con cáncer gástrico.</p>
                    <button aria-label="Continuar" onClick={() => go('start')} className="mt-10 block text-krebs-cyan transition-transform hover:translate-x-1"><Chevron className="h-9 w-9" /></button>
                  </>
                ) : (
                  <>
                    <p className="mt-7 text-justify text-[17px] leading-snug text-krebs-cyan">Aquí encontrarás orientación especializada, herramientas para cuidar tu bienestar, seguimiento de tus síntomas y espacios de apoyo para acompañarte durante tu proceso.</p>
                    <button onClick={() => go('before')} className="mt-4 ml-auto flex items-center gap-2 rounded-full bg-[#dcf6fd] px-5 py-1.5 text-[22px] font-semibold text-krebs-cyan hover:bg-[#c7f0fb]">Comienza <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M14 6l6 6-6 6" /></svg></button>
                  </>
                )}
                <img src={A.kiroSonriente} alt="" className="absolute -bottom-10 -left-16 w-[280px]" />
              </div>
            )}

            {step === 'before' && (
              <div className="relative px-5 pt-12">
                {title('Antes de comenzar', 'text-[34px]')}
                <div className="card-krebs relative mt-7 px-5 pb-5 pt-5 text-[14.5px] leading-[1.45] text-krebs-ink">
                  <p className="text-justify">Para acompañarte durante tu proceso, Krebs necesita consultar determinada información clínica disponible en los sistemas de Colsanitas, como tu diagnóstico, tratamientos, citas y resultados médicos.</p>
                  <p className="mt-5 text-justify">Esta información permitirá organizar tu línea de tiempo y ofrecerte contenidos y herramientas relacionados con tu proceso de atención.</p>
                  <NextButton onClick={() => go('health')} className="mt-5 ml-auto" />
                </div>
              </div>
            )}

            {step === 'health' && (
              <div className="px-4 pt-3">
                <h1 className="text-center text-[21px] font-normal text-krebs-cyan">Acceso a tu información de salud</h1>
                <div className="card-krebs mt-3 px-4 py-4 text-[14px] leading-[1.45] text-krebs-ink">
                  <p className="text-justify">Para organizar tu proceso de atención, Krebs necesita <b>consultar información clínica</b> disponible en los sistemas de Colsanitas, como:</p>
                  <ul className="my-4 list-disc space-y-1 pl-6 font-semibold marker:text-krebs-ink">
                    <li>Diagnóstico y antecedentes clínicos relevantes.</li>
                    <li>Estudios, exámenes y resultados.</li>
                    <li>Tratamientos y medicamentos registrados.</li>
                    <li>Citas, procedimientos y controles.</li>
                  </ul>
                  <p className="text-justify">Esta información permitirá construir tu línea de tiempo y mostrarte información relacionada con tu proceso de atención</p>
                  <div className="mt-5">{choice(health, setHealth, 'No autorizo', 'Autorizo')}</div>
                </div>
                <NextButton onClick={() => go('personal')} disabled={health === null} className="ml-auto mt-4" />
              </div>
            )}

            {step === 'personal' && (
              <div className="px-4 pt-3">
                <h1 className="text-center text-[24px] font-normal text-krebs-cyan">Adaptemos Krebs a tu proceso</h1>
                <div className="card-krebs mt-3 px-5 py-5 text-[14.5px] leading-[1.45] text-krebs-ink">
                  <p className="text-justify">Si lo autorizas, podremos utilizar la información clínica disponible para <b>adaptar los contenidos, recursos y herramientas de acompañamiento a tu situación</b></p>
                  <p className="mt-5 text-justify">Por ejemplo, podremos mostrarte información relacionada con tu tratamiento, actividades pertinentes para tu proceso y recursos de orientación acordes con tu momento de atención.</p>
                  <p className="mt-6 text-center font-bold">¿Deseas autorizar esta personalización?</p>
                  <div className="mt-3">{choice(personal, setPersonal, 'No autorizo', 'Autorizo')}</div>
                </div>
                <NextButton onClick={() => go('notify')} disabled={personal === null} className="ml-auto mt-4" />
              </div>
            )}

            {step === 'notify' && (
              <div className="px-4 pt-3">
                <h1 className="text-center text-[22px] font-normal text-krebs-cyan">Mantente al tanto de tu proceso</h1>
                <div className="card-krebs mt-3 px-5 py-4 text-[14.5px] leading-[1.4] text-krebs-ink">
                  <p className="text-justify">Podemos enviarte notificaciones para recordarte actividades importantes y mantenerte informado.</p>
                  <p>Podrías recibir avisos sobre:</p>
                  <ul className="my-4 list-disc space-y-1 pl-8 text-justify">
                    <li>Recordatorios de actividades y controles.</li>
                    <li>Seguimiento de síntomas registrados.</li>
                    <li>Actualizaciones de tu proceso.</li>
                    <li>Respuestas a solicitudes de orientación.</li>
                    <li>Información relevante para tu acompañamiento.</li>
                  </ul>
                  <p className="font-bold">¿Deseas recibir notificaciones de Krebs?</p>
                  <div className="mt-4">{choice(notify, setNotify, 'Ahora no', 'Activar')}</div>
                </div>
                <NextButton onClick={() => go('terms')} disabled={notify === null} className="ml-auto mt-4" />
              </div>
            )}

            {step === 'terms' && (
              <div className="px-4 pt-3">
                {title('Por último', 'text-[22px]')}
                <div className="card-krebs mt-3 px-5 py-5 text-[15px] leading-[1.5] text-krebs-ink">
                  <p className="text-justify">Antes de comenzar a utilizar Krebs, queremos que conozcas las condiciones de uso de sus herramientas y los alcances de sus funcionalidades.</p>
                  <p className="text-justify">Te invitamos a consultar los</p>
                  <p className="text-center"><a href="/krebs/terminos-krebs.pdf" target="_blank" rel="noopener noreferrer" className="font-bold underline">términos y condiciones</a></p>
                  <p className="text-justify">para conocer cómo funcionan los servicios de acompañamiento, orientación, seguimiento y bienestar que ponemos a tu disposición.</p>
                  <p className="text-justify">Al continuar, confirmas que has leído y aceptas las condiciones de uso de Krebs.</p>
                  <div className="-mx-2 mt-5"><Check small checked={terms} onChange={() => setTerms(!terms)} label="He leído y acepto los términos y condiciones de uso de Krebs." /></div>
                </div>
                <NextButton label="Aceptar y continuar" onClick={() => { setTourIdx(0); go('tour') }} disabled={!terms} className="ml-auto mt-4" />
              </div>
            )}

            {step === 'tour' && (
              <div
                onClick={avanzarTour}
                role="button"
                tabIndex={0}
                aria-label={tourIdx < TOUR.length - 1 ? 'Siguiente' : 'Entrar'}
                className="relative flex h-full cursor-pointer flex-col px-4 pt-5"
              >
                <div className="card-krebs relative z-20 p-5 text-[18px] font-bold leading-snug text-krebs-ink">
                  {tourStep.text}
                </div>
                <div className="relative z-10 mt-6 grid grid-cols-2 content-center justify-items-center gap-x-2 gap-y-6">
                  {TOOLS.map((t) => (
                    <Bubble key={t.id} label={t.label} icon={t.icon} highlight={tourStep.tool === t.id} onClick={avanzarTour} />
                  ))}
                </div>
                {/* Mascota por delante de las burbujas; posición por paso (mockups 13-18) */}
                {(() => {
                  const t = tourStep.tool
                  // Conecta (mockup 16): entra rotada desde el lado derecho.
                  if (t === 'conecta')
                    return (
                      <img src={A.kiroSonriente} alt="" className="pointer-events-none absolute -right-12 top-1/3 z-20 w-[200px] rotate-[230deg]" />
                    )
                  // ¿Cómó te sientes? (mockup 18): Kiro sonriente, abajo a la izquierda.
                  if (t === 'sientes')
                    return (
                      <img src={A.kiroSonriente} alt="" className="pointer-events-none absolute -left-10 bottom-6 z-20 w-[200px]" />
                    )
                  // Mi proceso / Preguntas: mascota más abajo, a la izquierda.
                  if (t === 'proceso' || t === 'preguntas')
                    return (
                      <img src={A.kiroSonriente} alt="" className="pointer-events-none absolute -left-10 -bottom-4 z-20 w-[200px]" />
                    )
                  // Último paso (notificaciones): centrado y un poco más arriba.
                  if (tourIdx === TOUR.length - 1)
                    return (
                      <img src={A.kiroSonriente} alt="" className="pointer-events-none absolute bottom-50 left-1/2 z-20 w-[200px] -translate-x-1/2" />
                    )
                  // Intro: abajo a la izquierda.
                  return (
                    <img src={A.kiroSonriente} alt="" className="pointer-events-none absolute -left-10 bottom-16 z-20 w-[200px]" />
                  )
                })()}
                <p className="relative z-10 mt-auto pb-2 text-center text-[13px] font-semibold text-krebs-cyan/80">
                  Toca la pantalla para {tourIdx < TOUR.length - 1 ? 'continuar' : 'entrar'}
                </p>
              </div>
            )}

            {step === 'hub' && (
              <div className="flex h-full flex-col px-4 pt-5">
                <div className="card-krebs flex items-center gap-3 p-4">
                  <img src={A.kiroSonriente} alt="" className="h-12 w-12 shrink-0" />
                  <p className="text-[15px] font-semibold text-krebs-cyan">Aquí aparecerán notificaciones importantes</p>
                </div>
                <div className="mt-4 grid grid-cols-2 content-center justify-items-center gap-x-2 gap-y-6">
                  {TOOLS.map((t) => (
                    <Bubble key={t.id} label={t.label} icon={t.icon} onClick={() => open(t.id)} />
                  ))}
                </div>
              </div>
            )}

            {step === 'section' && (
              tool === 'proceso' ? <MiProceso pacienteId={pacienteId} />
              : tool === 'sientes' ? <ComoTeSientes pacienteId={pacienteId} />
              : tool === 'preguntas' ? <Chatbot onSolicitarCita={() => go('citas')} />
              : <Conecta />
            )}

            {step === 'citas' && <Citas pacienteId={pacienteId} />}
          </div>
        </main>

        {/* Bottom nav */}
        <nav className="relative z-20 h-[78px] shrink-0 rounded-t-[26px] bg-krebs-nav text-white">
          <div className="grid h-full grid-cols-5 items-end pb-2.5">
            <button onClick={() => go(onboarding || ['splash', 'hi', 'start'].includes(step) ? step : 'hub')} className="flex flex-col items-center gap-0.5 text-[11px] opacity-95 hover:opacity-100"><Svg>{navIcons.home}</Svg>inicio</button>
            <button onClick={() => go('citas')} className="flex flex-col items-center gap-0.5 text-[11px] opacity-95 hover:opacity-100"><Svg>{navIcons.cal}</Svg>Citas</button>
            <span />
            {/* Mis Datos / Mi afiliación: placeholder temporal */}
            <button onClick={() => open('proceso')} className="flex flex-col items-center gap-0.5 text-[11px] opacity-95 hover:opacity-100"><Svg>{navIcons.user}</Svg>Mis Datos</button>
            <button onClick={() => alert('[PLACEHOLDER] Mi afiliación — pendiente de diseño')} className="flex flex-col items-center gap-0.5 text-[11px] opacity-95 hover:opacity-100"><Svg>{navIcons.card}</Svg>Mi afiliación</button>
          </div>
          <button aria-label="Krebs" onClick={() => go(onboarding || ['splash', 'hi', 'start'].includes(step) ? step : 'hub')} className="absolute -top-5 left-1/2 flex h-[76px] w-[76px] -translate-x-1/2 items-center justify-center rounded-full bg-krebs-nav">
            <span className="glass flex h-[64px] w-[64px] items-center justify-center rounded-full"><img src={step === 'section' ? ICONO_CENTRAL[tool] : A.icono} alt="" className="h-11 w-11" /></span>
          </button>
        </nav>

      </div>
    </div>
  )
}
