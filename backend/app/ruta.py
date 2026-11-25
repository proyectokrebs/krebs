"""Ruta de atención del cáncer gástrico en Colombia.

Basado en la "Vía clínico-administrativa en cáncer gástrico" (ProPacífico),
que organiza la atención en fases. Krebs ubica al paciente en esa ruta para
dar contexto y combatir uno de los puntos de dolor señalados en el documento:
la fragmentación y la falta de seguimiento continuo.

Krebs no diagnostica ni decide tratamiento: solo ubica la fase declarada del
paciente dentro de la ruta y describe, en lenguaje de acompañamiento, qué
suele seguir.
"""

from __future__ import annotations

# Etapas ordenadas de la ruta (documento ProPacífico).
ETAPAS = [
    "Prevención",
    "Tamización y diagnóstico",
    "Estadificación",
    "Tratamiento",
    "Seguimiento",
]

# Mapeo de la ``fase_actual`` de cada paciente a su etapa en la ruta y un texto
# de acompañamiento sobre lo que suele seguir. Texto descriptivo, no clínico.
_FASES = {
    "estadificación / preparación": {
        "etapa": "Estadificación",
        "resumen": "Se completan estudios para definir el alcance de la enfermedad y preparar el tratamiento.",
        "siguiente": "Definición del plan de tratamiento con el equipo tratante.",
    },
    "neoadyuvancia": {
        "etapa": "Tratamiento",
        "resumen": "Tratamiento sistémico previo a la cirugía para mejorar sus resultados.",
        "siguiente": "Reevaluación y, según respuesta, cirugía.",
    },
    "adyuvancia": {
        "etapa": "Tratamiento",
        "resumen": "Tratamiento posterior a la cirugía para reducir el riesgo de recaída.",
        "siguiente": "Controles y paso a seguimiento.",
    },
    "posoperatorio temprano": {
        "etapa": "Tratamiento",
        "resumen": "Recuperación tras la cirugía, con foco en herida, nutrición y síntomas.",
        "siguiente": "Seguimiento clínico y nutricional.",
    },
    "tratamiento sistémico paliativo": {
        "etapa": "Tratamiento",
        "resumen": "Tratamiento orientado a controlar la enfermedad y los síntomas, y cuidar la calidad de vida.",
        "siguiente": "Seguimiento continuo y apoyo de síntomas.",
    },
    "seguimiento estable": {
        "etapa": "Seguimiento",
        "resumen": "Controles periódicos para vigilar la evolución y la recuperación.",
        "siguiente": "Continuar controles y autocuidado.",
    },
}


def ubicar(fase_actual: str) -> dict:
    """Ubica la fase del paciente en la ruta. Devuelve etapa, índice y textos."""
    info = _FASES.get((fase_actual or "").strip().lower())
    if info is None:
        return {
            "fase": fase_actual,
            "etapa": "",
            "indice": -1,
            "total": len(ETAPAS),
            "resumen": "",
            "siguiente": "",
            "etapas": ETAPAS,
        }
    return {
        "fase": fase_actual,
        "etapa": info["etapa"],
        "indice": ETAPAS.index(info["etapa"]),
        "total": len(ETAPAS),
        "resumen": info["resumen"],
        "siguiente": info["siguiente"],
        "etapas": ETAPAS,
    }
