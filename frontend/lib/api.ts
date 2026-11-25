import { headerDeRol } from "./roles";
import {
  CatalogoSintomas,
  Cita,
  Contexto,
  Evento,
  Imagen,
  Medicion,
  PacienteDetalle,
  PacienteResumen,
  Reporte,
  ReporteSintoma,
  Resultado,
  Rol,
  Sintoma,
} from "./tipos";

// Base de la API. En desarrollo apunta al backend FastAPI en el puerto 8000.
const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(public status: number, public detalle: string) {
    super(detalle);
  }
}

async function pedir<T>(
  ruta: string,
  rol: Rol | null,
  init?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (rol) headers["X-Rol"] = headerDeRol(rol);

  const res = await fetch(`${BASE}${ruta}`, { ...init, headers });
  if (!res.ok) {
    let detalle = `Error ${res.status}`;
    try {
      const cuerpo = await res.json();
      if (typeof cuerpo?.detail === "string") detalle = cuerpo.detail;
      else if (Array.isArray(cuerpo?.detail))
        detalle = cuerpo.detail.map((d: any) => d.msg).join("; ");
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new ApiError(res.status, detalle);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ----- Lectura (cualquier rol) -----

export const listarPacientes = (rol: Rol | null) =>
  pedir<PacienteResumen[]>("/pacientes", rol);

export const obtenerPaciente = (id: string, rol: Rol | null) =>
  pedir<PacienteDetalle>(`/pacientes/${id}`, rol);

export const obtenerContexto = (id: string, rol: Rol | null) =>
  pedir<Contexto | null>(`/pacientes/${id}/contexto`, rol);

export const listarSintomas = (id: string, rol: Rol | null) =>
  pedir<Sintoma[]>(`/pacientes/${id}/sintomas`, rol);

export const lineaTiempo = (id: string, rol: Rol | null) =>
  pedir<Evento[]>(`/pacientes/${id}/linea-tiempo`, rol);

export const listarImagenes = (id: string, rol: Rol | null) =>
  pedir<Imagen[]>(`/pacientes/${id}/imagenes`, rol);

export const listarResultados = (id: string, rol: Rol | null) =>
  pedir<Resultado[]>(`/pacientes/${id}/resultados`, rol);

export const listarCitas = (id: string, rol: Rol | null) =>
  pedir<Cita[]>(`/pacientes/${id}/citas`, rol);

export const listarMediciones = (id: string, rol: Rol | null) =>
  pedir<Medicion[]>(`/pacientes/${id}/mediciones`, rol);

export const listarReportesMedicos = (id: string, rol: Rol | null) =>
  pedir<Reporte[]>(`/pacientes/${id}/reportes-medicos`, rol);

export const obtenerCatalogoSintomas = (rol: Rol | null) =>
  pedir<CatalogoSintomas>("/catalogo-sintomas", rol);

// Tablero de triaje (solo call center).
export const tableroReportesSintomas = (rol: Rol | null) =>
  pedir<ReporteSintoma[]>("/reportes-sintomas", rol);

// ----- Escritura (con control de rol) -----

export const crearSintoma = (
  id: string,
  rol: Rol | null,
  cuerpo: {
    modulo: string;
    sintoma: string;
    intensidad: string;
    frecuencia: string;
  }
) =>
  pedir<Sintoma>(`/pacientes/${id}/sintomas`, rol, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

export const crearReporteMedico = (
  id: string,
  rol: Rol | null,
  cuerpo: {
    entrada: string;
    estado_vs_habitual?: string;
    comer_beber?: string;
    actividad?: string;
    sintoma_nuevo_empeora?: string;
    fase_contexto?: string;
  }
) =>
  pedir<Reporte>(`/pacientes/${id}/reportes-medicos`, rol, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

export const crearResultado = (
  id: string,
  rol: Rol | null,
  cuerpo: { examen: string; resultado: string; observacion?: string; fecha?: string | null; hito_id?: string | null }
) =>
  pedir<Resultado>(`/pacientes/${id}/resultados`, rol, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

export const crearImagen = (
  id: string,
  rol: Rol | null,
  cuerpo: { archivo: string; etiqueta?: string; fecha?: string | null }
) =>
  pedir<Imagen>(`/pacientes/${id}/imagenes`, rol, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

export const crearCita = (
  id: string,
  rol: Rol | null,
  cuerpo: { motivo: string; profesional: string; fecha: string; hora: string; nota?: string }
) =>
  pedir<Cita>(`/pacientes/${id}/citas`, rol, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

export const reprogramarCita = (
  citaId: string,
  rol: Rol | null,
  cuerpo: { fecha: string; hora: string; nota?: string }
) =>
  pedir<Cita>(`/citas/${citaId}/reprogramar`, rol, {
    method: "PUT",
    body: JSON.stringify(cuerpo),
  });

export const cancelarCita = (citaId: string, rol: Rol | null, nota = "") =>
  pedir<Cita>(`/citas/${citaId}/cancelar`, rol, {
    method: "PUT",
    body: JSON.stringify({ nota }),
  });
