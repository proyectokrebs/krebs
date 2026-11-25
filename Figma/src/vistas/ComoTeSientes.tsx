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

// "¿Cómo te sientes?": autorreporte de síntomas del paciente con lista cerrada.
// Usa POST /sintomas (rol paciente); el backend lo guarda como autorreporte.
export default function ComoTeSientes({ pacienteId }: { pacienteId: string }) {
  const [catalogo, setCatalogo] = useState<CatalogoSintomas>({})
  const [sintomas, setSintomas] = useState<Sintoma[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
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
    setOk(false)
    setEnviando(true)
    try {
      await crearSintoma(pacienteId, form)
      setOk(true)
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
        {ok && <p className="text-[13px] font-semibold text-emerald-700">Registrado. Gracias por contarnos.</p>}

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
