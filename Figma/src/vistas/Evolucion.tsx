import { useEffect, useMemo, useState } from 'react'
import { listarMediciones, obtenerRuta, ApiError } from '../lib/api'
import type { Medicion, Ruta } from '../lib/types'

// Series de evolución y sus colores (mockups 19-24).
const SERIES = [
  { metrica: 'tumoral', label: 'Evolución tumoral', color: '#0a4a8f' },
  { metrica: 'cea', label: 'Marcador CEA', color: '#f4c430' },
  { metrica: 'nutricional', label: 'Evolución nutricional', color: '#ff6a00' },
  { metrica: 'hemoglobina', label: 'Hemoglobina', color: '#5a6cf0' },
] as const

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

type Vista = 'mensual' | 'semestral'

// "Mi proceso" → Evolución: gráficas de las 4 series clínicas, en vista mensual
// (día a día de un mes) o semestral (promedio por mes). Al tocar un punto se
// muestra su valor. Datos sintéticos desde el backend. Krebs no interpreta.
export default function Evolucion({ pacienteId }: { pacienteId: string }) {
  const [datos, setDatos] = useState<Medicion[]>([])
  const [ruta, setRuta] = useState<Ruta | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<Vista>('mensual')
  const [mesIdx, setMesIdx] = useState(0) // 0 = primer mes disponible
  const [sel, setSel] = useState<{ serie: string; etiqueta: string; valor: number; unidad: string } | null>(null)

  useEffect(() => {
    listarMediciones(pacienteId)
      .then(setDatos)
      .catch((e) => setError(e instanceof ApiError ? e.detalle : 'No se pudo cargar.'))
    obtenerRuta(pacienteId).then(setRuta).catch(() => {})
  }, [pacienteId])

  // Meses disponibles (claves "AAAA-MM") ordenados.
  const meses = useMemo(() => {
    const set = new Set<string>()
    datos.forEach((d) => d.fecha && set.add(d.fecha.slice(0, 7)))
    return [...set].sort()
  }, [datos])

  useEffect(() => {
    if (mesIdx > meses.length - 1) setMesIdx(0)
  }, [meses, mesIdx])

  if (error) return <p className="px-4 pt-4 text-center text-krebs-ink">{error}</p>
  if (datos.length === 0) return <p className="px-4 pt-4 text-center text-krebs-cyan">Cargando evolución…</p>

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-4">
      {/* Ruta de atención (vía clínica Colombia) */}
      {ruta && ruta.etapa && (
        <div className="card-krebs mb-3 p-3">
          <p className="mb-2 text-[13px] font-bold text-krebs-ink">Tu ruta de atención</p>
          <div className="flex flex-wrap gap-1.5">
            {ruta.etapas.map((e, i) => (
              <span
                key={e}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  i === ruta.indice
                    ? 'bg-krebs-nav text-white'
                    : i < ruta.indice
                      ? 'bg-[#cdeccd] text-[#107569]'
                      : 'bg-white/70 text-krebs-ink/60'
                }`}
              >
                {e}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-krebs-ink/80">
            Estás en <b>{ruta.fase}</b>. {ruta.resumen}
          </p>
        </div>
      )}

      {/* Toggle Mensual / Semestral */}
      <div className="card-krebs mb-3 flex items-center justify-center gap-6 p-3">
        <Toggle activo={vista === 'mensual'} color="#8fd14f" onClick={() => { setVista('mensual'); setSel(null) }}>
          Mensual
        </Toggle>
        <Toggle activo={vista === 'semestral'} color="#3cc8f8" onClick={() => { setVista('semestral'); setSel(null) }}>
          Semestral
        </Toggle>
      </div>

      {vista === 'mensual' ? (
        <VistaMensual
          datos={datos}
          mesClave={meses[mesIdx]}
          puedeAnterior={mesIdx > 0}
          puedeSiguiente={mesIdx < meses.length - 1}
          onAnterior={() => { setMesIdx((i) => Math.max(0, i - 1)); setSel(null) }}
          onSiguiente={() => { setMesIdx((i) => Math.min(meses.length - 1, i + 1)); setSel(null) }}
          onPunto={setSel}
        />
      ) : (
        <VistaSemestral datos={datos} meses={meses} onPunto={setSel} />
      )}

      {/* Valor seleccionado */}
      {sel && (
        <div className="card-krebs mt-3 p-3 text-center text-[14px] text-krebs-ink">
          <span className="font-bold">{sel.etiqueta}</span>: {sel.valor} {sel.unidad}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SERIES.map((s) => (
          <div key={s.metrica} className="flex items-center gap-2 text-[13px] font-semibold text-krebs-ink">
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function Toggle({ activo, color, onClick, children }: { activo: boolean; color: string; onClick: () => void; children: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-[18px] font-bold text-krebs-ink">
      <span
        className="h-6 w-6 rounded-md border-2"
        style={{ background: activo ? color : 'transparent', borderColor: color }}
      />
      {children}
    </button>
  )
}

// ---- Vista mensual: día a día del mes elegido ----
function VistaMensual({
  datos, mesClave, puedeAnterior, puedeSiguiente, onAnterior, onSiguiente, onPunto,
}: {
  datos: Medicion[]
  mesClave: string | undefined
  puedeAnterior: boolean
  puedeSiguiente: boolean
  onAnterior: () => void
  onSiguiente: () => void
  onPunto: (p: { serie: string; etiqueta: string; valor: number; unidad: string }) => void
}) {
  if (!mesClave) return null
  const [anio, mes] = mesClave.split('-').map(Number)
  const diasMes = new Date(anio, mes, 0).getDate()
  const nombreMes = MESES[mes - 1]

  // Mapa: metrica -> (dia -> valor)
  const porSerie: Record<string, Record<number, Medicion>> = {}
  datos.forEach((d) => {
    if (!d.fecha || d.fecha.slice(0, 7) !== mesClave) return
    const dia = Number(d.fecha.slice(8, 10))
    ;(porSerie[d.metrica] ??= {})[dia] = d
  })

  const dias = Array.from({ length: diasMes }, (_, i) => i + 1)

  return (
    <div className="card-krebs p-3">
      <div className="mb-1 flex items-center justify-between px-1">
        <button onClick={onAnterior} disabled={!puedeAnterior} className="text-[22px] font-bold text-krebs-cyan disabled:opacity-30">‹</button>
        <span className="text-[18px] font-bold text-krebs-ink">{nombreMes} {anio}</span>
        <button onClick={onSiguiente} disabled={!puedeSiguiente} className="text-[22px] font-bold text-krebs-cyan disabled:opacity-30">›</button>
      </div>
      <Grafico
        etiquetasX={dias.map(String)}
        series={SERIES.map((s) => ({
          ...s,
          puntos: dias.map((d) => {
            const m = porSerie[s.metrica]?.[d]
            return m ? { x: d - 1, valor: m.valor, unidad: m.unidad } : null
          }),
        }))}
        onPunto={onPunto}
      />
    </div>
  )
}

// ---- Vista semestral: promedio por mes ----
function VistaSemestral({
  datos, meses, onPunto,
}: {
  datos: Medicion[]
  meses: string[]
  onPunto: (p: { serie: string; etiqueta: string; valor: number; unidad: string }) => void
}) {
  // Promedio por metrica y mes.
  const prom: Record<string, Record<string, { suma: number; n: number; unidad: string }>> = {}
  datos.forEach((d) => {
    if (!d.fecha) return
    const mk = d.fecha.slice(0, 7)
    const s = (prom[d.metrica] ??= {})
    const c = (s[mk] ??= { suma: 0, n: 0, unidad: d.unidad })
    c.suma += d.valor
    c.n += 1
  })

  const etiquetas = meses.map((mk) => MESES[Number(mk.slice(5, 7)) - 1])

  return (
    <div className="card-krebs p-3">
      <Grafico
        etiquetasX={etiquetas}
        series={SERIES.map((s) => ({
          ...s,
          puntos: meses.map((mk, i) => {
            const c = prom[s.metrica]?.[mk]
            return c ? { x: i, valor: Math.round((c.suma / c.n) * 10) / 10, unidad: c.unidad } : null
          }),
        }))}
        onPunto={onPunto}
      />
    </div>
  )
}

// ---- Gráfico de líneas en SVG ----
type Punto = { x: number; valor: number; unidad: string } | null
type SerieG = { metrica: string; label: string; color: string; puntos: Punto[] }

function Grafico({ etiquetasX, series, onPunto }: {
  etiquetasX: string[]
  series: SerieG[]
  onPunto: (p: { serie: string; etiqueta: string; valor: number; unidad: string }) => void
}) {
  const W = 320
  const H = 220
  const padL = 10
  const padR = 10
  const padT = 10
  const padB = 28
  const n = etiquetasX.length

  // Rango de valores (todas las series juntas).
  const valores = series.flatMap((s) => s.puntos.filter((p): p is NonNullable<Punto> => !!p).map((p) => p.valor))
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const rango = max - min || 1

  const px = (x: number) => padL + (n <= 1 ? 0 : (x / (n - 1)) * (W - padL - padR))
  const py = (v: number) => padT + (1 - (v - min) / rango) * (H - padT - padB)

  // Menos etiquetas X si son muchas (días) para no saturar.
  const pasoX = n > 16 ? Math.ceil(n / 8) : 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ touchAction: 'manipulation' }}>
      {/* líneas guía horizontales */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={padL} x2={W - padR} y1={padT + f * (H - padT - padB)} y2={padT + f * (H - padT - padB)} stroke="#3cc8f8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
      ))}
      {series.map((s) => {
        const pts = s.puntos.map((p, i) => (p ? { cx: px(p.x), cy: py(p.valor), p, i } : null)).filter(Boolean) as { cx: number; cy: number; p: NonNullable<Punto>; i: number }[]
        const d = pts.map((pt, k) => `${k === 0 ? 'M' : 'L'}${pt.cx.toFixed(1)},${pt.cy.toFixed(1)}`).join(' ')
        return (
          <g key={s.metrica}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((pt) => (
              <circle
                key={pt.i}
                cx={pt.cx}
                cy={pt.cy}
                r="5"
                fill={s.color}
                stroke="#fff"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => onPunto({ serie: s.metrica, etiqueta: s.label, valor: pt.p.valor, unidad: pt.p.unidad })}
              />
            ))}
          </g>
        )
      })}
      {/* etiquetas X */}
      {etiquetasX.map((t, i) =>
        i % pasoX === 0 ? (
          <text key={i} x={px(i)} y={H - 8} fontSize="9" fill="#0a4a8f" textAnchor="middle">{t}</text>
        ) : null,
      )}
    </svg>
  )
}
