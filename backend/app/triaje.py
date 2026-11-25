"""Prioridad de gestión de los síntomas reportados.

Krebs no diagnostica ni asigna grados clínicos. Esta prioridad es solo un orden
operativo para que el call center atienda primero lo que luce más urgente,
combinando dos señales que el propio paciente reporta:

- la intensidad declarada (Leve → Muy intensa);
- si el síntoma es de los que, por seguridad, conviene atender antes
  (p. ej. sangrado, desmayo, dificultad para respirar).

El resultado es un puntaje y una etiqueta ("Alta", "Media", "Baja"). No es una
valoración médica.
"""

from __future__ import annotations

# Puntaje por intensidad declarada por el paciente.
_INTENSIDAD = {
    "muy intensa": 4,
    "intensa": 3,
    "moderada": 2,
    "leve": 1,
}

# Síntomas que conviene atender antes por seguridad. Suman al puntaje; no
# implican diagnóstico. Se comparan en minúsculas y por coincidencia parcial.
_SINTOMAS_SENSIBLES = {
    "vómito con sangre / melena": 4,
    "desmayo": 3,
    "falta de aire": 3,
    "dolor torácico": 3,
    "confusión": 3,
    "deshidratación": 2,
    "vómitos": 1,
    "diarrea": 1,
    "pérdida involuntaria de peso": 1,
}


def puntaje(sintoma: str, intensidad: str) -> int:
    """Puntaje de prioridad de gestión (mayor = más urgente)."""
    base = _INTENSIDAD.get((intensidad or "").strip().lower(), 0)
    s = (sintoma or "").strip().lower()
    extra = 0
    for clave, peso in _SINTOMAS_SENSIBLES.items():
        if clave in s:
            extra = max(extra, peso)
    return base + extra


def etiqueta(valor: int) -> str:
    """Convierte el puntaje en una etiqueta legible de prioridad de gestión."""
    if valor >= 6:
        return "Alta"
    if valor >= 3:
        return "Media"
    return "Baja"


# Semáforo de 3 niveles inspirado en el modelo ePRO con triaje de enfermería
# (eHealth Enhanced Chronic Care Model) y en el ensayo PRO-TECT: verde
# (autocuidado), ámbar (reevaluar en 24 h) y rojo (valoración presencial).
# Es un ORDEN DE GESTIÓN, no una valoración médica: Krebs no diagnostica.
_SEMAFORO = {
    "rojo": {
        "nivel": "rojo",
        "etiqueta": "Rojo",
        "accion": "Valoración presencial recomendada. Contactar al paciente.",
    },
    "ambar": {
        "nivel": "ambar",
        "etiqueta": "Ámbar",
        "accion": "Reevaluar en 24 horas; puede cambiar de severidad.",
    },
    "verde": {
        "nivel": "verde",
        "etiqueta": "Verde",
        "accion": "Síntoma leve y estable; apoyo de autocuidado.",
    },
}


def semaforo(valor: int) -> dict:
    """Nivel de semáforo (verde/ámbar/rojo) con su acción recomendada.

    Los cortes siguen el mismo puntaje que ``etiqueta``: alto -> rojo,
    medio -> ámbar, bajo -> verde.
    """
    if valor >= 6:
        return _SEMAFORO["rojo"]
    if valor >= 3:
        return _SEMAFORO["ambar"]
    return _SEMAFORO["verde"]
