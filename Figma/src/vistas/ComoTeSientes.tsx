import { useEffect, useMemo, useState } from 'react'
import {
  obtenerCatalogoSintomas,
  listarSintomas,
  crearSintoma,
  ApiError,
} from '../lib/api'
import type { CatalogoSintomas, Sintoma } from '../lib/types'

// Listas cerradas. Las intensidades coinciden con las de los datos; las
// frecuencias se estandarizan porque el libro no las trae.
const INTENSIDADES = ['Leve', 'Moderada', 'Intensa', 'Muy intensa']
const FRECUENCIAS = ['Ocasional', 'A veces', 'Frecuente', 'Constante']

// Semáforo de gestión que refleja backend/app/triaje.py (verde/ámbar/rojo).
// Es un orden de gestión y un mensaje de autocuidado, NO una valoración médica.
const INTENSIDAD_PUNTAJE: Record<string, number> = {
  leve: 1, moderada: 2, intensa: 3, 'muy intensa': 4,
}
const SINTOMA_SENSIBLE: { clave: string; peso: number }[] = [
  { clave: 'vómito con sangre', peso: 4 },
  { clave: 'melena', peso: 4 },
  { clave: 'desmayo', peso: 3 },
  { clave: 'falta de aire', peso: 3 },
  { clave: 'dolor torácico', peso: 3 },
  { clave: 'confusión', peso: 3 },
  { clave: 'deshidratación', peso: 2 },
  { clave: 'vómitos', peso: 1 },
  { clave: 'diarrea', peso: 1 },
  { clave: 'pérdida involuntaria de peso', peso: 1 },
]

function evaluarSemaforo(sintoma: string, intensidad: string) {
  const base = INTENSIDAD_PUNTAJE[intensidad.trim().toLowerCase()] ?? 0
  const s = sintoma.trim().toLowerCase()
  let extra = 0
  for (const { clave, peso } of SINTOMA_SENSIBLE) {
    if (s.includes(clave)) extra = Math.max(extra, peso)
  }
  const puntaje = base + extra
  if (puntaje >= 6)
    return { nivel: 'rojo', etiqueta: 'Rojo', clase: 'bg-[#fde8e8] text-[#b42318]', accion: 'Conviene una valoración presencial. Tu equipo podría contactarte; si te sientes mal ahora, comunícate con tu equipo o una línea de emergencia.' }
  if (puntaje >= 3)
    return { nivel: 'ambar', etiqueta: 'Ámbar', clase: 'bg-[#fff4e5] text-[#b26a00]', accion: 'Conviene revisar cómo evoluciona en las próximas 24 horas. Si empeora, repórtalo de nuevo.' }
  return { nivel: 'verde', etiqueta: 'Verde', clase: 'bg-[#e6f4ea] text-[#107569]', accion: 'Síntoma leve y estable. Continúa con tus cuidados habituales y registra si cambia.' }
}

// "¿Cómo te sientes?": autorreporte de síntomas del paciente con lista cerrada.
// Usa POST /sintomas (rol paciente); el backend lo guarda como autorreporte.
export default function ComoTeSientes({ pacienteId }: { pacienteId: string }) {
  const [catalogo, setCatalogo] = useState<CatalogoSintomas>({})
  const [sintomas, setSintomas] = useState<Sintoma[]>([])
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<ReturnType<typeof evaluarSemaforo> | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState({
    modulo: '',
    sintoma: '',
    intensidad: 'Leve',
    frecuencia: 'Ocasional',
  })

  const modulos = useMemo(() => Object.keys(catalogo), [catalogo])
  const opciones = form.modulo ? (catalogo[form.modulo] ?? []) : []

  const recargar = () => listarSintomas(pacienteId).then(setSintomas).catch(() => {})

  useEffect(() => {
    recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  useEffect(() => {
    obtenerCatalogoSintomas()
      .then((c) => {
        setCatalogo(c)
        const m0 = Object.keys(c)[0] ?? ''
        setForm((f) => ({ ...f, modulo: m0, sintoma: c[m0]?.[0] ?? '' }))
      })
      .catch(() => {})
  }, [])

  const cambiarModulo = (modulo: string) =>
    setForm({ ...form, modulo, sintoma: catalogo[modulo]?.[0] ?? '' })

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFeedback(null)
    setEnviando(true)
    try {
      await crearSintoma(pacienteId, form)
      setFeedback(evaluarSemaforo(form.sintoma, form.intensidad))
      await recargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : 'No se pudo registrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-5">
      <h1 className="text-center text-[24px] font-light text-krebs-cyan">¿Cómo te sientes?</h1>
      <p className="mt-1 text-center text-[13px] text-krebs-cyan">
        Registra cómo te sientes hoy. Tu reporte queda guardado como autorreporte.
      </p>

      <form onSubmit={enviar} className="card-krebs mt-4 space-y-3 p-4 text-[14px] text-krebs-ink">
        <Campo label="Zona / módulo">
          <select
            value={form.modulo}
            onChange={(e) => cambiarModulo(e.target.value)}
            className="w-full rounded-lg border-2 border-krebs-cyan/50 bg-white/70 px-3 py-2"
          >
            {modulos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Síntoma">
          <select
            value={form.sintoma}
            onChange={(e) => setForm({ ...form, sintoma: e.target.value })}
            className="w-full rounded-lg border-2 border-krebs-cyan/50 bg-white/70 px-3 py-2"
          >
            {opciones.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Intensidad">
            <select
              value={form.intensidad}
              onChange={(e) => setForm({ ...form, intensidad: e.target.value })}
              className="w-full rounded-lg border-2 border-krebs-cyan/50 bg-white/70 px-3 py-2"
            >
              {INTENSIDADES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Frecuencia">
            <select
              value={form.frecuencia}
              onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
              className="w-full rounded-lg border-2 border-krebs-cyan/50 bg-white/70 px-3 py-2"
            >
              {FRECUENCIAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
        {feedback && (
          <div className={`rounded-xl px-3 py-2.5 text-[13px] ${feedback.clase}`}>
            <p className="font-bold">Registrado. Gracias por contarnos.</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold">
              <span>● Nivel {feedback.etiqueta}</span>
            </p>
            <p className="mt-0.5">{feedback.accion}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || !form.sintoma}
          className="w-full rounded-full bg-krebs-nav py-2.5 text-[16px] font-semibold text-white disabled:opacity-50"
        >
          {enviando ? 'Guardando…' : 'Registrar cómo me siento'}
        </button>
      </form>

      <p className="mt-6 px-1 font-bold text-krebs-ink">Mis reportes</p>
      {sintomas.length === 0 ? (
        <p className="px-1 text-[14px] italic text-krebs-cyan">Aún no registraste síntomas.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {sintomas.map((s) => (
            <div key={s.sintoma_id} className="card-krebs p-3 text-[13.5px] text-krebs-ink">
              <span className="font-semibold">{s.sintoma}</span>
              {s.modulo && <span className="ml-2 text-[11px] text-krebs-ink/70">{s.modulo}</span>}
              <p className="mt-0.5 text-[12.5px] text-krebs-ink/80">
                Intensidad: {s.intensidad || '—'} · Frecuencia: {s.frecuencia || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-krebs-ink/80">{label}</span>
      {children}
    </label>
  )
}
