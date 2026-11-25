import { useEffect, useRef, useState } from 'react'

// Chatbot SIMULADO (mockups 26-32). No usa IA real: responde con un guion
// predefinido según palabras clave. La mascota de arriba cambia de expresión
// según el tipo de respuesta. Krebs no diagnostica; ante riesgo deriva al
// equipo médico.
//
// Estados de la mascota (assets en /krebs):
//   dormida  -> intro / cargando
//   feliz    -> respuesta rápida
//   esfuerzo -> respuesta elaborada (tardada)
//   triste   -> no encontrada / urgente
const MASCOTA = {
  dormida: '/krebs/kiro-sonriente.svg', // ojos cerrados: se reutiliza sonriente
  feliz: '/krebs/kiro-sonriente.svg',
  esfuerzo: '/krebs/kiro-sonriente.svg',
  triste: '/krebs/kiro-triste.svg',
}

type Estado = keyof typeof MASCOTA

type Mensaje =
  | { de: 'bot'; texto: string; titulo?: string; accion?: { label: string; tipo: 'cita' | 'llamar' } }
  | { de: 'user'; texto: string }

// Opciones iniciales que ofrece el bot.
const OPCIONES = [
  '¿Qué puedo comer?',
  'Tengo náuseas',
  'Consejos de bienestar',
]

// Guion de respuestas por palabra clave. Cada una define el texto, el estado de
// la mascota y, si aplica, una acción (solicitar cita / llamar).
function responder(texto: string): {
  mensaje: Mensaje
  estado: Estado
  demora: number
} {
  const t = texto.toLowerCase()

  // Señales de alarma -> urgente (mockup 32).
  if (/(sangre|sangrado|vomito con sangre|desmayo|no puedo respirar|dolor fuerte|urgente)/.test(t)) {
    return {
      estado: 'triste',
      demora: 1200,
      mensaje: {
        de: 'bot',
        titulo: 'Consulta urgente',
        texto:
          'La consulta que realizaste describe un síntoma de alto riesgo. Comunícate de inmediato con tu equipo médico o una línea de emergencia.',
        accion: { label: 'Llama 123', tipo: 'llamar' },
      },
    }
  }

  // Temas con respuesta de fuentes (mockup 27).
  if (/(comer|comida|aliment|dieta|nutri)/.test(t)) {
    return {
      estado: 'esfuerzo',
      demora: 1800,
      mensaje: {
        de: 'bot',
        titulo: 'Alimentación',
        texto:
          'Durante el tratamiento suele recomendarse comer porciones pequeñas y frecuentes, priorizar proteínas y mantener buena hidratación. Tu equipo de nutrición puede ajustar esto a tu caso. Krebs no reemplaza esa indicación.',
      },
    }
  }
  if (/(nausea|náusea|vomit|mareo)/.test(t)) {
    return {
      estado: 'feliz',
      demora: 800,
      mensaje: {
        de: 'bot',
        texto:
          'Para las náuseas suele ayudar comer despacio, evitar olores fuertes y fraccionar las comidas. Si son intensas o persistentes, repórtalo en “¿Cómó te sientes?” y consulta con tu médico.',
      },
    }
  }
  if (/(bienestar|consejo|ánimo|animo|emocion|estr[eé]s)/.test(t)) {
    return {
      estado: 'feliz',
      demora: 900,
      mensaje: {
        de: 'bot',
        texto:
          'Cuidar el descanso, mantener rutinas suaves y apoyarte en tus redes cercanas ayuda a tu bienestar. En “Conecta” encuentras grupos de apoyo y fundaciones.',
      },
    }
  }

  // No encontrada -> deriva a cita (mockup 31).
  return {
    estado: 'triste',
    demora: 1500,
    mensaje: {
      de: 'bot',
      texto:
        'No encontré esta consulta en mis fuentes verificadas o requiere atención humana. Te recomiendo solicitar una cita médica.',
      accion: { label: 'Solicitar Cita', tipo: 'cita' },
    },
  }
}

export default function Chatbot({ onSolicitarCita }: { onSolicitarCita: () => void }) {
  const [estado, setEstado] = useState<Estado>('dormida')
  const [cargando, setCargando] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      de: 'bot',
      texto:
        'Hola, soy Kiro, tu asistente especializado en cáncer gástrico. Respondo con base en fuentes verificadas. ¿Sobre qué quieres preguntar?',
    },
  ])
  const [texto, setTexto] = useState('')
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  const enviar = (valor: string) => {
    const limpio = valor.trim()
    if (!limpio || cargando) return
    setMensajes((m) => [...m, { de: 'user', texto: limpio }])
    setTexto('')
    setCargando(true)
    setEstado('dormida')
    const { mensaje, estado: est, demora } = responder(limpio)
    window.setTimeout(() => {
      setMensajes((m) => [...m, mensaje])
      setEstado(est)
      setCargando(false)
    }, demora)
  }

  return (
    <div className="flex h-full flex-col px-3 pb-2 pt-3">
      {/* Mascota (cambia según la respuesta) */}
      <div className="flex shrink-0 justify-center">
        <span className="glass-light flex h-20 w-20 items-center justify-center rounded-full">
          <img src={MASCOTA[estado]} alt="" className="h-14 w-14" />
        </span>
      </div>

      {/* Conversación */}
      <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto px-1">
        {mensajes.map((m, i) =>
          m.de === 'bot' ? (
            <div key={i} className="max-w-[85%] rounded-2xl bg-[#bfeafd] px-4 py-3 text-[14px] text-krebs-ink">
              {m.titulo && (
                <div className="mb-2 rounded-xl bg-[#8fd8f8] py-1.5 text-center font-bold text-white">
                  {m.titulo}
                </div>
              )}
              <p>{m.texto}</p>
              {m.accion && (
                <button
                  onClick={m.accion.tipo === 'cita' ? onSolicitarCita : () => alert('Llamando a la línea de emergencias 123…')}
                  className="mt-3 w-full rounded-xl bg-krebs-nav py-2 font-bold text-white"
                >
                  {m.accion.label}
                </button>
              )}
            </div>
          ) : (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-krebs-nav px-4 py-3 text-right text-[14px] text-white">
              {m.texto}
            </div>
          ),
        )}

        {/* Opciones iniciales (solo al comienzo) */}
        {mensajes.length === 1 && !cargando && (
          <div className="space-y-2">
            {OPCIONES.map((o) => (
              <button
                key={o}
                onClick={() => enviar(o)}
                className="block w-full rounded-xl bg-[#9fdffb] px-4 py-2.5 text-left text-[14px] font-semibold text-krebs-ink"
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {cargando && (
          <div className="ml-auto max-w-[85%] rounded-2xl bg-krebs-nav px-4 py-3 text-right text-[14px] text-white opacity-80">
            Cargando respuesta…
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); enviar(texto) }}
        className="mt-2 flex shrink-0 items-center gap-2 rounded-full bg-white px-2 py-1.5 ring-2 ring-[#8fd8f8]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-krebs-cyan text-[20px] font-bold text-white">+</span>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="min-w-0 flex-1 border-0 text-[14px] outline-none"
        />
        <button type="submit" aria-label="Enviar" className="flex h-9 w-9 items-center justify-center rounded-full text-krebs-cyan">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M3 20l18-8L3 4l4 8-4 8z" /></svg>
        </button>
      </form>
    </div>
  )
}
