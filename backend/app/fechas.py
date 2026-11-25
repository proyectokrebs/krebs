"""Utilidades de fechas.

El libro Excel guarda varias fechas como número de serie (sistema de fechas 1900
de Excel, con base 1899-12-30). Aquí se convierten a objetos ``date``/``datetime``
y se calculan proximidades para los recordatorios.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

import pandas as pd

# Base del sistema de fechas 1900 de Excel. Se usa 1899-12-30 para compensar el
# error histórico de Excel que trata 1900 como año bisiesto.
_BASE_EXCEL = datetime(1899, 12, 30)


def serial_excel_a_fecha(valor) -> date | None:
    """Convierte un valor de fecha a ``date``.

    Acepta seriales de Excel (int/float), cadenas de fecha y objetos de fecha de
    pandas/datetime. Devuelve ``None`` si el valor está vacío o no es convertible.
    El componente de hora, si existe, se descarta: las pantallas muestran días.
    """
    if valor is None:
        return None

    # Valores nulos de pandas (NaN, NaT).
    try:
        if pd.isna(valor):
            return None
    except (TypeError, ValueError):
        pass

    # Ya es una fecha/hora.
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor

    # Serial de Excel (número de días desde la base).
    if isinstance(valor, (int, float)):
        try:
            return (_BASE_EXCEL + timedelta(days=float(valor))).date()
        except (OverflowError, ValueError):
            return None

    # Cadena: puede ser un número guardado como texto o una fecha ISO.
    if isinstance(valor, str):
        texto = valor.strip()
        if not texto:
            return None
        try:
            return (_BASE_EXCEL + timedelta(days=float(texto))).date()
        except ValueError:
            pass
        convertida = pd.to_datetime(texto, errors="coerce", dayfirst=False)
        if pd.isna(convertida):
            return None
        return convertida.date()

    return None


def dias_hasta(fecha: date | None, referencia: date | None = None) -> int | None:
    """Días desde ``referencia`` (hoy por defecto) hasta ``fecha``.

    Positivo si la fecha es futura, negativo si es pasada, ``None`` si no hay fecha.
    """
    if fecha is None:
        return None
    referencia = referencia or date.today()
    return (fecha - referencia).days


def es_pasado(fecha: date | None, referencia: date | None = None) -> bool:
    """True si la fecha es estrictamente anterior a la referencia."""
    dias = dias_hasta(fecha, referencia)
    return dias is not None and dias < 0


def es_proximo(fecha: date | None, dias: int, referencia: date | None = None) -> bool:
    """True si la fecha ocurre entre hoy y los próximos ``dias`` (ambos incluidos)."""
    restantes = dias_hasta(fecha, referencia)
    return restantes is not None and 0 <= restantes <= dias
