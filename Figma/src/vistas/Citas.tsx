import { useEffect, useState } from 'react'
import { listarCitas, ApiError } from '../lib/api'
import type { Cita } from '../lib/types'

const COLOR_ESTADO: Record<string, string> = {
  programada: 'bg-[#e8f0fe] text-[#1f6feb]',
  reprogramada: 'bg-[#fff4e5] text-[#b26a00]',
  cancelada: 'bg-[#fde8e8] text-[#b42318]',
  atendida: 'bg-[#e6f4ea] text-[#107569]',
}

// "Citas": agenda real del paciente (solo lectura). La gestión de citas es del
// call center, que no forma parte de este demo de paciente.
export default function Citas({ pacienteId }: { pacienteId: string }) {
  const [citas, setCitas] = useState<Cita[]>([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    listarCitas(pacienteId)
      .then(setCitas)
      .catch((err) => setError(err instanceof ApiError ? err.detalle : 'No se pudo cargar.'))
      .finally(() => setCargando(false))
  }, [pacienteId])

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-5">
      <h1 className="text-center text-[26px] font-light text-krebs-cyan">Mis citas</h1>

      {error && <p className="mt-4 text-center text-[14px] text-krebs-ink">{error}</p>}
      {cargando ? (
        <p className="mt-6 text-center text-krebs-cyan">Cargando…</p>
      ) : citas.length === 0 ? (
        <p className="mt-6 text-center text-[14px] italic text-krebs-cyan">
          No tienes citas registradas.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {citas.map((c) => (
            <div key={c.cita_id} className="card-krebs p-4 text-[14px] text-krebs-ink">
              <div className="flex items-center justify-between">
                <span className="font-bold">{c.motivo}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                    COLOR_ESTADO[c.estado.toLowerCase()] ?? 'bg-white/60'
                  }`}
                >
                  {c.estado}
                </span>
              </div>
              <p className="mt-1 text-[13px]">
                {c.fecha ?? 'sin fecha'} · {c.hora}
              </p>
              <p className="text-[13px] text-krebs-ink/80">{c.profesional}</p>
              {c.nota && <p className="mt-1 text-[12.5px] italic text-krebs-ink/70">{c.nota}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
