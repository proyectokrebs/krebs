import { useEffect, useState } from 'react'
import {
  obtenerPaciente,
  obtenerContexto,
  lineaTiempo,
  listarResultados,
  obtenerReporte,
  ApiError,
} from '../lib/api'
import type {
  Contexto,
  Evento,
  PacienteDetalle,
  ReporteDetalle,
  Resultado,
} from '../lib/types'
import Evolucion from './Evolucion'

// "Mi proceso" con dos vistas: Evolución (gráficas, mockups 19-24, por defecto)
// e Historia (datos clínicos, línea de tiempo y resultados).
export default function MiProceso({ pacienteId }: { pacienteId: string }) {
  const [tab, setTab] = useState<'evolucion' | 'historia'>('evolucion')
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-2 px-4 pt-3">
        <TabBtn activo={tab === 'evolucion'} onClick={() => setTab('evolucion')}>Evolución</TabBtn>
        <TabBtn activo={tab === 'historia'} onClick={() => setTab('historia')}>Historia</TabBtn>
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'evolucion' ? <Evolucion pacienteId={pacienteId} /> : <Historia pacienteId={pacienteId} />}
      </div>
    </div>
  )
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-1.5 text-[14px] font-semibold ${activo ? 'bg-krebs-nav text-white' : 'bg-[#dcf6fd] text-krebs-cyan'}`}
    >
      {children}
    </button>
  )
}

function Historia({ pacienteId }: { pacienteId: string }) {
  const [detalle, setDetalle] = useState<PacienteDetalle | null>(null)
  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    Promise.all([
      obtenerPaciente(pacienteId),
      obtenerContexto(pacienteId),
      lineaTiempo(pacienteId),
      listarResultados(pacienteId),
    ])
      .then(([d, c, e, r]) => {
        if (!vivo) return
        setDetalle(d)
        setContexto(c)
        // Más reciente primero. Los eventos sin fecha quedan al final.
        const ordenados = [...e].sort((a, b) => {
          if (!a.fecha) return 1
          if (!b.fecha) return -1
          return b.fecha.localeCompare(a.fecha)
        })
        setEventos(ordenados)
        setResultados(r)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.detalle : 'No se pudo cargar.'),
      )
    return () => {
      vivo = false
    }
  }, [pacienteId])

  if (error)
    return <p className="px-6 pt-8 text-center text-[15px] text-krebs-ink">{error}</p>
  if (!detalle)
    return <p className="px-6 pt-8 text-center text-krebs-cyan">Cargando tu proceso…</p>

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-5">
      <h1 className="text-center text-[26px] font-light text-krebs-cyan">Mi proceso</h1>

      {/* Datos clínicos */}
      <div className="card-krebs mt-4 p-4 text-[14px] text-krebs-ink">
        <p className="font-bold">Mi información</p>
        <div className="mt-2 grid grid-cols-2 gap-y-1.5">
          <Dato k="Edad" v={detalle.edad ? `${detalle.edad} años` : '—'} />
          <Dato k="Fase actual" v={detalle.fase_actual} />
          <Dato k="Estadio" v={detalle.estadio} />
          <Dato k="Tratamiento" v={detalle.tratamiento_sistemico} />
          {contexto && (
            <>
              <Dato k="Peso actual" v={contexto.peso_actual_kg ? `${contexto.peso_actual_kg} kg` : '—'} />
              <Dato k="Actividad" v={contexto.actividad_funcional} />
            </>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      <p className="mt-6 px-1 font-bold text-krebs-ink">Línea de tiempo</p>
      {eventos.length === 0 ? (
        <p className="px-1 text-[14px] italic text-krebs-cyan">Sin eventos aún.</p>
      ) : (
        <div className="relative mt-2 space-y-2 border-l-2 border-krebs-cyan/40 pl-4">
          {eventos.map((e, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-krebs-cyan" />
              <EventoItem evento={e} />
            </div>
          ))}
        </div>
      )}

      {/* Resultados de exámenes */}
      <p className="mt-6 px-1 font-bold text-krebs-ink">Resultados de exámenes</p>
      {resultados.length === 0 ? (
        <p className="px-1 text-[14px] italic text-krebs-cyan">Sin resultados registrados.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {resultados.map((r) => (
            <div key={r.resultado_id} className="card-krebs p-3 text-[13.5px] text-krebs-ink">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.examen}</span>
                <span className="text-[11px] text-krebs-ink/70">{r.fecha ?? 's/f'}</span>
              </div>
              <p className="mt-1">{r.resultado}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] text-krebs-ink/70">{k}</p>
      <p className="font-semibold">{v || '—'}</p>
    </div>
  )
}

// Ítem de la línea de tiempo. Los Reportes (autorreportes del paciente) se
// pueden abrir para ver los síntomas que se registraron en ese reporte.
function EventoItem({ evento }: { evento: Evento }) {
  const esReporte = evento.tipo === 'Reporte' && !!evento.ref
  const [abierto, setAbierto] = useState(false)
  const [detalle, setDetalle] = useState<ReporteDetalle | null>(null)
  const [cargando, setCargando] = useState(false)

  const alternar = () => {
    if (!esReporte) return
    const nuevo = !abierto
    setAbierto(nuevo)
    if (nuevo && !detalle && !cargando) {
      setCargando(true)
      obtenerReporte(evento.ref)
        .then(setDetalle)
        .catch(() => {})
        .finally(() => setCargando(false))
    }
  }

  return (
    <div
      className={`card-krebs p-3 text-[13.5px] text-krebs-ink ${esReporte ? 'cursor-pointer' : ''}`}
      onClick={alternar}
      role={esReporte ? 'button' : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-krebs-ink">
          {evento.tipo}
        </span>
        <span className="text-[11px] text-krebs-ink/70">{evento.fecha ?? 's/f'}</span>
      </div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <p>{evento.descripcion}</p>
        {esReporte && (
          <span className="shrink-0 text-krebs-cyan">{abierto ? '▲' : '▼'}</span>
        )}
      </div>

      {esReporte && abierto && (
        <div className="mt-2 border-t border-krebs-cyan/30 pt-2">
          {cargando ? (
            <p className="text-[12.5px] italic text-krebs-cyan">Cargando autorreporte…</p>
          ) : detalle && detalle.sintomas.length > 0 ? (
            <>
              <p className="mb-1 text-[12px] font-semibold text-krebs-ink/70">
                Síntomas de este autorreporte:
              </p>
              <div className="space-y-1.5">
                {detalle.sintomas.map((s) => (
                  <div key={s.sintoma_id} className="rounded-lg bg-white/50 px-2.5 py-1.5">
                    <span className="font-semibold">{s.sintoma}</span>
                    {s.modulo && <span className="ml-2 text-[11px] text-krebs-ink/60">{s.modulo}</span>}
                    <p className="text-[12px] text-krebs-ink/80">
                      Intensidad: {s.intensidad || '—'} · Frecuencia: {s.frecuencia || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[12.5px] italic text-krebs-cyan">
              Este reporte no tiene síntomas registrados.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
