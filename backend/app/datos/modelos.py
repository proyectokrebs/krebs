"""Modelos de dominio de Krebs.

Dataclasses que envuelven las filas del libro Excel para que las pantallas trabajen
con objetos y no con nombres de columnas ni con el formato serial de fechas.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass
class Paciente:
    """Fila de la hoja Pacientes_sinteticos."""

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

    @property
    def etiqueta(self) -> str:
        """Texto para listas y selectores."""
        edad = f"{self.edad} años" if self.edad is not None else "edad n/d"
        return f"{self.paciente_id} · {edad}"


@dataclass
class ContextoClinico:
    """Fila de la hoja Contexto_clinico."""

    paciente_id: str
    peso_basal_kg: float | None
    peso_actual_kg: float | None
    perdida_peso_pct: float | None
    actividad_funcional: str
    ingesta: str


@dataclass
class Reporte:
    """Fila de la hoja Reportes_ePRO (autorreporte del paciente o cuidador)."""

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


@dataclass
class Sintoma:
    """Fila de la hoja Sintomas_reportados.

    Solo se exponen los campos que registró el paciente. No se incluyen grados CTCAE
    ni banderas de prioridad: Krebs no interpreta.
    """

    sintoma_id: str
    reporte_id: str
    paciente_id: str
    modulo: str
    sintoma: str
    frecuencia: str
    intensidad: str
    interferencia: str
    evolucion: str


@dataclass
class Alerta:
    """Fila de la hoja Alertas_gestion (gestión operativa de un reporte)."""

    alerta_id: str
    paciente_id: str
    fecha: date | None
    motivo_principal: str
    destinatario: str
    estado_gestion: str

    @property
    def esta_abierta(self) -> bool:
        """True si la alerta aún no está cerrada."""
        return "cierre" not in (self.estado_gestion or "").lower() and \
               "cerrada" not in (self.estado_gestion or "").lower()


@dataclass
class Hito:
    """Fila de la hoja Hitos_seguimiento."""

    hito_id: str
    paciente_id: str
    hito: str
    estado_visible: str
    fecha: date | None
    texto_visible: str

    @property
    def esta_completado(self) -> bool:
        return "completado" in (self.estado_visible or "").lower()


@dataclass
class Imagen:
    """Imagen diagnóstica opcional (JPG/PNG) descrita en imagenes.csv."""

    paciente_id: str
    archivo: str
    fecha: date | None
    etiqueta: str


@dataclass
class Resultado:
    """Resultado de un examen.

    Puede provenir de un hito-examen ya realizado (``hito_id``) o registrarse a
    mano por el médico. Krebs no interpreta: solo guarda el texto registrado.
    """

    resultado_id: str
    paciente_id: str
    hito_id: str | None
    examen: str
    fecha: date | None
    resultado: str
    observacion: str
    registrado_por: str


@dataclass
class Cita:
    """Cita del simulador de agenda."""

    cita_id: str
    paciente_id: str
    motivo: str
    profesional: str
    fecha: date | None
    hora: str
    estado: str          # programada / reprogramada / cancelada / atendida
    nota: str
    creada_en: date | None
    actualizada_en: date | None

    @property
    def esta_activa(self) -> bool:
        return (self.estado or "").lower() not in ("cancelada", "atendida")


@dataclass
class Medicion:
    """Punto de una serie de evolución (gráficas de Mi proceso)."""

    metrica: str        # tumoral | cea | nutricional | hemoglobina
    fecha: date | None
    valor: float
    unidad: str


@dataclass
class Evento:
    """Elemento unificado para la línea de tiempo."""

    fecha: date | None
    tipo: str          # "Hito", "Reporte", "Resultado" o "Cita"
    descripcion: str
    es_pasado: bool
    ref: str = ""       # id de la entidad origen (p. ej. reporte_id) si aplica


@dataclass
class NuevoReporte:
    """Datos de entrada para registrar un reporte ePRO (escritura)."""

    respondedor: str
    entrada: str
    estado_vs_habitual: str
    comer_beber: str
    actividad: str
    sintoma_nuevo_empeora: str
    fase_contexto: str = ""


@dataclass
class NuevoSintoma:
    """Síntoma que registra el paciente."""

    modulo: str
    sintoma: str
    frecuencia: str
    intensidad: str
    interferencia: str
    evolucion: str
    reporte_id: str = ""


@dataclass
class NuevoResultado:
    """Resultado de examen que registra el médico."""

    examen: str
    resultado: str
    observacion: str = ""
    hito_id: str | None = None
    fecha: date | None = None


@dataclass
class NuevaImagen:
    """Imagen diagnóstica que registra el médico."""

    archivo: str
    etiqueta: str
    fecha: date | None = None


@dataclass
class NuevaCita:
    """Cita que asigna el call center."""

    motivo: str
    profesional: str
    fecha: date
    hora: str
    nota: str = ""


@dataclass
class ReprogramarCita:
    """Nueva fecha/hora para una cita existente."""

    fecha: date
    hora: str
    nota: str = ""
