"""Interfaz abstracta de la fuente de datos.

El backend depende solo de esta interfaz. Para cambiar de SQLite a los sistemas de
Keralty basta con crear otra implementación de ``FuenteDatos`` (ver
``fuente_keralty.py``) sin tocar los endpoints.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

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


class FuenteDatos(ABC):
    """Contrato de acceso a los datos de un paciente."""

    @abstractmethod
    def listar_pacientes(self) -> list[Paciente]:
        ...

    @abstractmethod
    def obtener_paciente(self, paciente_id: str) -> Paciente | None:
        ...

    @abstractmethod
    def obtener_contexto(self, paciente_id: str) -> ContextoClinico | None:
        ...

    @abstractmethod
    def listar_reportes(self, paciente_id: str) -> list[Reporte]:
        ...

    @abstractmethod
    def listar_sintomas(self, paciente_id: str) -> list[Sintoma]:
        ...

    @abstractmethod
    def listar_alertas(self, paciente_id: str) -> list[Alerta]:
        ...

    @abstractmethod
    def listar_hitos(self, paciente_id: str) -> list[Hito]:
        ...

    @abstractmethod
    def listar_imagenes(self, paciente_id: str) -> list[Imagen]:
        ...

    @abstractmethod
    def listar_resultados(self, paciente_id: str) -> list[Resultado]:
        ...

    @abstractmethod
    def listar_citas(self, paciente_id: str) -> list[Cita]:
        ...

    @abstractmethod
    def catalogo_sintomas(self) -> dict[str, list[str]]:
        """Síntomas conocidos agrupados por módulo (para listas cerradas)."""
        ...

    @abstractmethod
    def sintomas_de_todos(self) -> list[tuple[Paciente, Sintoma]]:
        """Síntomas de todos los pacientes con su paciente asociado."""
        ...

    @abstractmethod
    def listar_reportes_medicos(self, paciente_id: str) -> list[Reporte]:
        """Reportes cuyo respondedor es el médico."""
        ...

    @abstractmethod
    def listar_mediciones(self, paciente_id: str) -> list["Medicion"]:
        """Serie temporal de evolución (tumoral, CEA, nutricional, hemoglobina)."""
        ...

    @abstractmethod
    def obtener_reporte(self, reporte_id: str) -> Reporte | None:
        """Un reporte por su id."""
        ...

    @abstractmethod
    def sintomas_de_reporte(self, reporte_id: str) -> list[Sintoma]:
        """Síntomas registrados en un reporte."""
        ...

    @abstractmethod
    def linea_de_tiempo(self, paciente_id: str) -> list[Evento]:
        ...

    # ----- Escritura -----

    @abstractmethod
    def crear_reporte(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        """Registra un nuevo reporte ePRO del paciente y lo devuelve."""
        ...

    @abstractmethod
    def crear_reporte_medico(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        """Registra un reporte hecho por el médico (respondedor = Médico)."""
        ...

    @abstractmethod
    def crear_sintoma(self, paciente_id: str, datos: NuevoSintoma) -> Sintoma:
        """Registra un síntoma reportado por el paciente."""
        ...

    @abstractmethod
    def crear_resultado(self, paciente_id: str, datos: NuevoResultado) -> Resultado:
        """Registra un resultado de examen (lo agrega el médico)."""
        ...

    @abstractmethod
    def crear_imagen(self, paciente_id: str, datos: NuevaImagen) -> Imagen:
        """Registra una imagen diagnóstica (la agrega el médico)."""
        ...

    @abstractmethod
    def crear_cita(self, paciente_id: str, datos: NuevaCita) -> Cita:
        """Asigna una cita (la gestiona el call center)."""
        ...

    @abstractmethod
    def reprogramar_cita(self, cita_id: str, datos: ReprogramarCita) -> Cita:
        """Reprograma una cita existente."""
        ...

    @abstractmethod
    def cancelar_cita(self, cita_id: str, nota: str = "") -> Cita:
        """Cancela una cita existente."""
        ...
