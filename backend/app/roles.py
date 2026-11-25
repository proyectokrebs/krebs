"""Control de acceso por rol mediante el header ``X-Rol``.

Roles del sistema:
- ``paciente``    : agrega síntomas y reportes propios.
- ``medico``      : agrega imágenes y resultados de exámenes.
- ``call_center`` : gestiona citas (asignar, reprogramar, cancelar).

Todos los roles pueden leer la historia clínica. Las operaciones de escritura
exigen un rol concreto; si el header falta o no corresponde, se devuelve 403.

Krebs es una herramienta de apoyo con datos sintéticos. Este control es una
simulación de permisos para la demostración, no un mecanismo de autenticación.
"""

from __future__ import annotations

from fastapi import Header, HTTPException

# Valores aceptados y sus alias (tolerante a acentos y separadores).
_ALIAS = {
    "paciente": "paciente",
    "medico": "medico",
    "médico": "medico",
    "call_center": "call_center",
    "call center": "call_center",
    "callcenter": "call_center",
    "call-center": "call_center",
}

ROLES = ("paciente", "medico", "call_center")

# Etiquetas legibles para los mensajes de error.
_ETIQUETA = {
    "paciente": "paciente",
    "medico": "médico",
    "call_center": "call center",
}


def normalizar_rol(valor: str | None) -> str | None:
    """Devuelve el rol canónico o ``None`` si no se reconoce."""
    if not valor:
        return None
    return _ALIAS.get(valor.strip().lower())


def rol_actual(x_rol: str | None = Header(default=None, alias="X-Rol")) -> str:
    """Dependencia: devuelve el rol de la petición (lectura) o lanza 403.

    Exige un header ``X-Rol`` con un rol válido. La lectura la permite cualquier
    rol reconocido; solo se rechaza si falta o es desconocido.
    """
    rol = normalizar_rol(x_rol)
    if rol is None:
        raise HTTPException(
            status_code=403,
            detail=(
                "Falta el header X-Rol o su valor no es válido. "
                f"Roles permitidos: {', '.join(ROLES)}."
            ),
        )
    return rol


def exigir_rol(*permitidos: str):
    """Fábrica de dependencias que exige uno de los roles ``permitidos``.

    Uso::

        @router.post(..., dependencies=[Depends(exigir_rol("medico"))])
    """

    def dependencia(rol: str = Header(default=None, alias="X-Rol")) -> str:
        actual = normalizar_rol(rol)
        if actual is None:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Falta el header X-Rol o su valor no es válido. "
                    f"Roles permitidos: {', '.join(ROLES)}."
                ),
            )
        if actual not in permitidos:
            etiquetas = ", ".join(_ETIQUETA[r] for r in permitidos)
            raise HTTPException(
                status_code=403,
                detail=(
                    f"El rol '{_ETIQUETA[actual]}' no puede realizar esta acción. "
                    f"Requiere: {etiquetas}."
                ),
            )
        return actual

    return dependencia
