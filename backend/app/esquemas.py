"""Esquemas Pydantic: forma de las respuestas y peticiones JSON de la API."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class PacienteResumen(BaseModel):
    paciente_id: str
    edad: int | None
    sexo: str
    etiqueta: str


class PacienteDetalle(BaseModel):
    paciente_id: str
    edad: int | None
    sexo: str
    procedencia: str
    estadio: str
    fase_actual: str
    tratamiento_sistemico: str
    inmunoterapia: str
    cirugia_previa: str
    fecha_cirugia: date | None
    apoyo_cuidador: str
    canal_preferido: str


class ContextoOut(BaseModel):
    peso_basal_kg: float | None
    peso_actual_kg: float | None
    perdida_peso_pct: float | None
    actividad_funcional: str
    ingesta: str


class SintomaOut(BaseModel):
    sintoma_id: str
    modulo: str
    sintoma: str
    frecuencia: str
    intensidad: str
    interferencia: str
    evolucion: str


class ReporteOut(BaseModel):
    reporte_id: str
    paciente_id: str
    fecha: date | None
    respondedor: str
    fase_contexto: str
    entrada: str
    estado_vs_habitual: str
    comer_beber: str
    actividad: str
    sintoma_nuevo_empeora: str


class EventoOut(BaseModel):
    fecha: date | None
    tipo: str
    descripcion: str
    es_pasado: bool
    ref: str = ""


class ReporteDetalleOut(BaseModel):
    """Un reporte con sus síntomas (para abrir un autorreporte)."""

    reporte: ReporteOut
    sintomas: list[SintomaOut]


class RutaOut(BaseModel):
    """Ubicación del paciente en la ruta de atención (vía clínica Colombia)."""

    fase: str
    etapa: str
    indice: int
    total: int
    resumen: str
    siguiente: str
    etapas: list[str]


class PendienteOut(BaseModel):
    tipo: str              # "Hito" o "Alerta"
    titulo: str
    detalle: str
    fecha: date | None
    dias_restantes: int | None
    prioritario: bool


class ImagenOut(BaseModel):
    archivo: str
    fecha: date | None
    etiqueta: str
    disponible: bool
    url: str | None


class NuevoReporteIn(BaseModel):
    """Datos que envía el frontend para registrar un reporte ePRO."""

    respondedor: str = "Paciente"
    entrada: str = "Quiero reportar"
    estado_vs_habitual: str = ""
    comer_beber: str = ""
    actividad: str = ""
    sintoma_nuevo_empeora: str = "No"
    fase_contexto: str = ""


class NuevoSintomaIn(BaseModel):
    """Síntoma que registra el paciente."""

    modulo: str = ""
    sintoma: str
    frecuencia: str = ""
    intensidad: str = ""
    interferencia: str = ""
    evolucion: str = ""
    reporte_id: str = ""


class MedicionOut(BaseModel):
    metrica: str
    fecha: date | None
    valor: float
    unidad: str


class ResultadoOut(BaseModel):
    resultado_id: str
    paciente_id: str
    hito_id: str | None
    examen: str
    fecha: date | None
    resultado: str
    observacion: str
    registrado_por: str


class NuevoResultadoIn(BaseModel):
    """Resultado de examen que registra el médico."""

    examen: str
    resultado: str
    observacion: str = ""
    hito_id: str | None = None
    fecha: date | None = None


class NuevaImagenIn(BaseModel):
    """Imagen diagnóstica que registra el médico."""

    archivo: str
    etiqueta: str = ""
    fecha: date | None = None


class CitaOut(BaseModel):
    cita_id: str
    paciente_id: str
    motivo: str
    profesional: str
    fecha: date | None
    hora: str
    estado: str
    nota: str
    creada_en: date | None
    actualizada_en: date | None


class NuevaCitaIn(BaseModel):
    """Cita que asigna el call center."""

    motivo: str
    profesional: str
    fecha: date
    hora: str
    nota: str = ""


class ReprogramarCitaIn(BaseModel):
    """Nueva fecha/hora para una cita existente."""

    fecha: date
    hora: str
    nota: str = ""


class CancelarCitaIn(BaseModel):
    nota: str = ""


class ReporteSintomaOut(BaseModel):
    """Fila del tablero de triaje del call center (síntomas de todos)."""

    paciente_id: str      # se usa como nombre/código (datos sintéticos)
    nombre: str           # etiqueta visible (= paciente_id)
    edad: int | None
    sintoma: str
    modulo: str
    intensidad: str
    frecuencia: str
    interferencia: str
    prioridad: str        # Alta / Media / Baja (prioridad de gestión)
    puntaje: int
    nivel: str            # verde / ambar / rojo (semáforo)
    semaforo: str         # etiqueta legible del semáforo
    accion: str           # acción de gestión recomendada


class NuevoReporteMedicoIn(BaseModel):
    """Reporte clínico que registra el médico."""

    entrada: str = "Nota médica"
    estado_vs_habitual: str = ""
    comer_beber: str = ""
    actividad: str = ""
    sintoma_nuevo_empeora: str = "No"
    fase_contexto: str = ""
