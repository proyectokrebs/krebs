// Cliente de la API de Krebs (backend FastAPI).
//
// La URL base se resuelve así, en orden:
//   1. VITE_API_URL si está definida (sobrescritura manual).
//   2. El MISMO host desde el que se abrió la app, puerto 8000.
//
// Gracias al paso 2, cuando abrís la app en el celular con
// http://192.168.x.x:8443, la API se consume en http://192.168.x.x:8000 sin
// reconfigurar nada aunque cambie la red. Solo hace falta que el backend corra
// en la misma PC, escuchando en 0.0.0.0:8000.

import type {
  CatalogoSintomas,
  Cita,
  Contexto,
  Evento,
  Medicion,
  PacienteDetalle,
  PacienteResumen,
  ReporteDetalle,
  Resultado,
  Sintoma,
} from './types'

const PUERTO_API = 8000

function baseUrl(): string {
  const override = import.meta.env.VITE_API_URL as string | undefined
  if (override) return override.replace(/\/$/, '')
  const host = window.location.hostname || 'localhost'
  return `http://${host}:${PUERTO_API}/api`
}

// El demo es la experiencia del paciente: todas las peticiones viajan con
// X-Rol: paciente.
const ROL = 'paciente'

export class ApiError extends Error {
  constructor(public status: number, public detalle: string) {
    super(detalle)
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Rol': ROL,
    ...((init?.headers as Record<string, string>) ?? {}),
  }
  const res = await fetch(`${baseUrl()}${ruta}`, { ...init, headers })
  if (!res.ok) {
    let detalle = `Error ${res.status}`
    try {
      const cuerpo = await res.json()
      if (typeof cuerpo?.detail === 'string') detalle = cuerpo.detail
      else if (Array.isArray(cuerpo?.detail))
        detalle = cuerpo.detail.map((d: { msg: string }) => d.msg).join('; ')
    } catch {
      // sin cuerpo JSON
    }
    throw new ApiError(res.status, detalle)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ----- Lectura -----
export const listarPacientes = () => pedir<PacienteResumen[]>('/pacientes')
export const obtenerPaciente = (id: string) =>
  pedir<PacienteDetalle>(`/pacientes/${id}`)
export const obtenerContexto = (id: string) =>
  pedir<Contexto | null>(`/pacientes/${id}/contexto`)
export const listarSintomas = (id: string) =>
  pedir<Sintoma[]>(`/pacientes/${id}/sintomas`)
export const lineaTiempo = (id: string) =>
  pedir<Evento[]>(`/pacientes/${id}/linea-tiempo`)
export const listarResultados = (id: string) =>
  pedir<Resultado[]>(`/pacientes/${id}/resultados`)
export const listarCitas = (id: string) =>
  pedir<Cita[]>(`/pacientes/${id}/citas`)
export const obtenerReporte = (reporteId: string) =>
  pedir<ReporteDetalle>(`/reportes/${reporteId}`)
export const listarMediciones = (id: string) =>
  pedir<Medicion[]>(`/pacientes/${id}/mediciones`)
export const obtenerCatalogoSintomas = () =>
  pedir<CatalogoSintomas>('/catalogo-sintomas')

// ----- Escritura (paciente) -----
export const crearSintoma = (
  id: string,
  cuerpo: { modulo: string; sintoma: string; intensidad: string; frecuencia: string },
) =>
  pedir<Sintoma>(`/pacientes/${id}/sintomas`, {
    method: 'POST',
    body: JSON.stringify(cuerpo),
  })
