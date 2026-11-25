"""Fuente de datos de Keralty (SUPUESTO — no implementada).

Este módulo documenta cómo Krebs se conectaría a los sistemas propios de Keralty
sin depender hoy de ellos. No está implementado: todos los métodos lanzan
``NotImplementedError``. Cuando Keralty entregue su especificación, se completa esta
clase y se cambia la fuente activa en ``main.py``; los endpoints y el frontend no
cambian.

Supuestos de integración pendientes de confirmar con Keralty:
- Protocolo y formato: posiblemente REST + HL7 FHIR (Patient, Observation,
  Appointment, CarePlan). A confirmar.
- Autenticación: OAuth2 / SSO corporativo / certificados. A confirmar.
- Entornos: sandbox de pruebas y producción. A confirmar.
- Reglas de privacidad y habeas data sobre qué se expone al paciente. A confirmar.
"""

from __future__ import annotations

from app.datos.fuente import FuenteDatos
from app.datos.modelos import (
    Alerta,
    Cita,
    ContextoClinico,
    Evento,
    Hito,
    Imagen,
    Medicion,
    NuevaCita,
    NuevaImagen,
    NuevoReporte,
    NuevoResultado,
    NuevoSintoma,
    Paciente,
    ReprogramarCita,
    Reporte,
    Resultado,
    Sintoma,
)

_PENDIENTE = "Integración con Keralty pendiente de especificación."


class FuenteKeralty(FuenteDatos):
    """Stub de la integración con los sistemas de Keralty."""

    def __init__(self, base_url: str = "", token: str = ""):
        self.base_url = base_url
        self.token = token

    def listar_pacientes(self) -> list[Paciente]:
        raise NotImplementedError(_PENDIENTE)

    def obtener_paciente(self, paciente_id: str) -> Paciente | None:
        raise NotImplementedError(_PENDIENTE)

    def obtener_contexto(self, paciente_id: str) -> ContextoClinico | None:
        raise NotImplementedError(_PENDIENTE)

    def listar_reportes(self, paciente_id: str) -> list[Reporte]:
        raise NotImplementedError(_PENDIENTE)

    def listar_sintomas(self, paciente_id: str) -> list[Sintoma]:
        raise NotImplementedError(_PENDIENTE)

    def listar_alertas(self, paciente_id: str) -> list[Alerta]:
        raise NotImplementedError(_PENDIENTE)

    def listar_hitos(self, paciente_id: str) -> list[Hito]:
        raise NotImplementedError(_PENDIENTE)

    def listar_imagenes(self, paciente_id: str) -> list[Imagen]:
        raise NotImplementedError(_PENDIENTE)

    def listar_resultados(self, paciente_id: str) -> list[Resultado]:
        raise NotImplementedError(_PENDIENTE)

    def listar_citas(self, paciente_id: str) -> list[Cita]:
        raise NotImplementedError(_PENDIENTE)

    def catalogo_sintomas(self) -> dict[str, list[str]]:
        raise NotImplementedError(_PENDIENTE)

    def sintomas_de_todos(self) -> list[tuple[Paciente, Sintoma]]:
        raise NotImplementedError(_PENDIENTE)

    def listar_reportes_medicos(self, paciente_id: str) -> list[Reporte]:
        raise NotImplementedError(_PENDIENTE)

    def listar_mediciones(self, paciente_id: str) -> list[Medicion]:
        raise NotImplementedError(_PENDIENTE)

    def obtener_reporte(self, reporte_id: str) -> Reporte | None:
        raise NotImplementedError(_PENDIENTE)

    def sintomas_de_reporte(self, reporte_id: str) -> list[Sintoma]:
        raise NotImplementedError(_PENDIENTE)

    def linea_de_tiempo(self, paciente_id: str) -> list[Evento]:
        raise NotImplementedError(_PENDIENTE)

    def crear_reporte(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        raise NotImplementedError(_PENDIENTE)

    def crear_reporte_medico(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        raise NotImplementedError(_PENDIENTE)

    def crear_sintoma(self, paciente_id: str, datos: NuevoSintoma) -> Sintoma:
        raise NotImplementedError(_PENDIENTE)

    def crear_resultado(self, paciente_id: str, datos: NuevoResultado) -> Resultado:
        raise NotImplementedError(_PENDIENTE)

    def crear_imagen(self, paciente_id: str, datos: NuevaImagen) -> Imagen:
        raise NotImplementedError(_PENDIENTE)

    def crear_cita(self, paciente_id: str, datos: NuevaCita) -> Cita:
        raise NotImplementedError(_PENDIENTE)

    def reprogramar_cita(self, cita_id: str, datos: ReprogramarCita) -> Cita:
        raise NotImplementedError(_PENDIENTE)

    def cancelar_cita(self, cita_id: str, nota: str = "") -> Cita:
        raise NotImplementedError(_PENDIENTE)
