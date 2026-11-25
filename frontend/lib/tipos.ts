// Tipos compartidos con la API de Krebs (ver backend/app/esquemas.py).

export type Rol = "paciente" | "medico" | "call_center";

export interface PacienteResumen {
  paciente_id: string;
  edad: number | null;
  sexo: string;
  etiqueta: string;
}

export interface PacienteDetalle {
  paciente_id: string;
  edad: number | null;
  sexo: string;
  procedencia: string;
  estadio: string;
  fase_actual: string;
  tratamiento_sistemico: string;
  inmunoterapia: string;
  cirugia_previa: string;
  fecha_cirugia: string | null;
  apoyo_cuidador: string;
  canal_preferido: string;
}

export interface Contexto {
  peso_basal_kg: number | null;
  peso_actual_kg: number | null;
  perdida_peso_pct: number | null;
  actividad_funcional: string;
  ingesta: string;
}

export interface Sintoma {
  sintoma_id: string;
  modulo: string;
  sintoma: string;
  frecuencia: string;
  intensidad: string;
  interferencia: string;
  evolucion: string;
}

export interface Evento {
  fecha: string | null;
  tipo: string;
  descripcion: string;
  es_pasado: boolean;
}

export interface Imagen {
  archivo: string;
  fecha: string | null;
  etiqueta: string;
  disponible: boolean;
  url: string | null;
}

export interface Resultado {
  resultado_id: string;
  paciente_id: string;
  hito_id: string | null;
  examen: string;
  fecha: string | null;
  resultado: string;
  observacion: string;
  registrado_por: string;
}

export interface Cita {
  cita_id: string;
  paciente_id: string;
  motivo: string;
  profesional: string;
  fecha: string | null;
  hora: string;
  estado: string;
  nota: string;
  creada_en: string | null;
  actualizada_en: string | null;
}

export interface Reporte {
  reporte_id: string;
  paciente_id: string;
  fecha: string | null;
  respondedor: string;
  fase_contexto: string;
  entrada: string;
  estado_vs_habitual: string;
  comer_beber: string;
  actividad: string;
  sintoma_nuevo_empeora: string;
}

export interface ReporteSintoma {
  paciente_id: string;
  nombre: string;
  edad: number | null;
  sintoma: string;
  modulo: string;
  intensidad: string;
  frecuencia: string;
  prioridad: string;
  puntaje: number;
}

// Catálogo de síntomas: módulo -> lista de síntomas.
export type CatalogoSintomas = Record<string, string[]>;

export interface Medicion {
  metrica: string; // tumoral | cea | nutricional | hemoglobina
  fecha: string | null;
  valor: number;
  unidad: string;
}
