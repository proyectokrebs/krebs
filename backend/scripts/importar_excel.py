"""Importa el libro Excel sintético a la base de datos SQLite.

Uso:
    python -m scripts.importar_excel

Lee las hojas del libro, convierte los seriales de fecha de Excel a texto ISO y
puebla datos/krebs.db. Es idempotente: recrea las tablas desde cero en cada corrida.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

# Permite ejecutar el script como módulo desde la carpeta backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config  # noqa: E402
from app.db import conectar, crear_esquema  # noqa: E402
from app.fechas import serial_excel_a_fecha  # noqa: E402


def _texto(fila, col) -> str:
    if col not in fila or pd.isna(fila[col]):
        return ""
    return str(fila[col]).strip()


def _numero(fila, col):
    if col not in fila or pd.isna(fila[col]):
        return None
    try:
        return float(fila[col])
    except (TypeError, ValueError):
        return None


def _entero(fila, col):
    valor = _numero(fila, col)
    return int(valor) if valor is not None else None


def _fecha_iso(fila, col):
    if col not in fila:
        return None
    fecha = serial_excel_a_fecha(fila[col])
    return fecha.isoformat() if fecha else None


def importar(ruta_excel: Path | None = None, ruta_db: Path | None = None) -> None:
    ruta_excel = Path(ruta_excel) if ruta_excel else config.ARCHIVO_EXCEL
    if not ruta_excel.is_file():
        raise FileNotFoundError(f"No se encontró el libro Excel en: {ruta_excel}")

    hojas = pd.read_excel(ruta_excel, sheet_name=None, engine="openpyxl")
    conexion = conectar(ruta_db)

    # Recrear el esquema desde cero.
    for tabla in ("mediciones", "citas", "resultados", "imagenes", "hitos",
                  "alertas", "sintomas", "reportes", "contexto_clinico",
                  "pacientes"):
        conexion.execute(f"DROP TABLE IF EXISTS {tabla}")
    conexion.commit()
    crear_esquema(conexion)

    _importar_pacientes(conexion, hojas.get(config.HOJA_PACIENTES))
    _importar_contexto(conexion, hojas.get(config.HOJA_CONTEXTO))
    _importar_reportes(conexion, hojas.get(config.HOJA_REPORTES))
    _importar_sintomas(conexion, hojas.get(config.HOJA_SINTOMAS))
    _importar_alertas(conexion, hojas.get(config.HOJA_ALERTAS))
    _importar_hitos(conexion, hojas.get(config.HOJA_HITOS))

    conexion.commit()
    _generar_resultados_sinteticos(conexion)
    _generar_mediciones_sinteticas(conexion)
    conexion.commit()
    _resumen(conexion)
    conexion.close()


def _importar_pacientes(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            """INSERT OR REPLACE INTO pacientes VALUES
               (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                _texto(f, "paciente_id"), _entero(f, "edad"), _texto(f, "sexo"),
                _texto(f, "procedencia_macro"), _texto(f, "estadio_demo"),
                _texto(f, "fase_actual"), _texto(f, "tratamiento_sistemico_actual"),
                _texto(f, "inmunoterapia_actual"), _texto(f, "cirugia_previa"),
                _fecha_iso(f, "fecha_cirugia"), _texto(f, "apoyo_cuidador"),
                _texto(f, "canal_preferido"),
            ),
        )


def _importar_contexto(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            "INSERT OR REPLACE INTO contexto_clinico VALUES (?,?,?,?,?,?)",
            (
                _texto(f, "paciente_id"), _numero(f, "peso_basal_kg"),
                _numero(f, "peso_actual_kg"), _numero(f, "perdida_peso_pct_formula"),
                _texto(f, "actividad_funcional_demo"), _texto(f, "ingesta_demo"),
            ),
        )


def _importar_reportes(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            "INSERT OR REPLACE INTO reportes VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                _texto(f, "reporte_id"), _texto(f, "paciente_id"),
                _fecha_iso(f, "fecha_hora"), _texto(f, "respondedor"),
                _texto(f, "fase_contexto"), _texto(f, "entrada"),
                _texto(f, "estado_vs_habitual"), _texto(f, "comer_beber"),
                _texto(f, "actividad"), _texto(f, "sintoma_nuevo_empeora"),
            ),
        )


def _importar_sintomas(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            "INSERT OR REPLACE INTO sintomas VALUES (?,?,?,?,?,?,?,?,?)",
            (
                _texto(f, "sintoma_id"), _texto(f, "reporte_id"),
                _texto(f, "paciente_id"), _texto(f, "modulo"),
                _texto(f, "sintoma"), _texto(f, "frecuencia"),
                _texto(f, "intensidad"), _texto(f, "interferencia"),
                _texto(f, "evolucion"),
            ),
        )


def _importar_alertas(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            "INSERT OR REPLACE INTO alertas VALUES (?,?,?,?,?,?)",
            (
                _texto(f, "alerta_id"), _texto(f, "paciente_id"),
                _fecha_iso(f, "fecha_hora"), _texto(f, "motivo_principal"),
                _texto(f, "destinatario_funcional_demo"), _texto(f, "estado_gestion"),
            ),
        )


def _importar_hitos(cx, df):
    if df is None:
        return
    for _, f in df.iterrows():
        cx.execute(
            "INSERT OR REPLACE INTO hitos VALUES (?,?,?,?,?,?)",
            (
                _texto(f, "hito_id"), _texto(f, "paciente_id"),
                _texto(f, "hito"), _texto(f, "estado_visible_paciente"),
                _fecha_iso(f, "fecha_confirmada"), _texto(f, "texto_visible_paciente"),
            ),
        )


# Hitos que representan un examen del que puede derivarse un resultado, y el
# catálogo de frases sintéticas (descriptivas, nunca interpretativas: Krebs no
# diagnostica). Se elige de forma determinista según el hito, para que re-correr
# la importación produzca siempre el mismo resultado.
_HITOS_EXAMEN = {
    "Estudios requeridos": ("Estudios de estadificación", [
        "Estudios completados. Informe disponible en la historia clínica.",
        "Imágenes y laboratorios tomados según protocolo.",
        "Estudios realizados; pendiente lectura por el especialista.",
    ]),
    "Reevaluación": ("Reevaluación por imágenes", [
        "Control por imágenes realizado.",
        "Reevaluación tomográfica completada.",
        "Estudio de control efectuado según plan.",
    ]),
    "Control clínico": ("Control clínico", [
        "Valoración clínica registrada.",
        "Signos vitales y examen físico documentados.",
        "Control clínico realizado sin novedades reportadas.",
    ]),
    "Evaluación clínica": ("Evaluación clínica", [
        "Evaluación clínica inicial documentada.",
        "Valoración registrada en historia clínica.",
    ]),
    "Valoración interdisciplinaria": ("Junta interdisciplinaria", [
        "Caso presentado en junta; plan registrado.",
        "Valoración interdisciplinaria completada.",
    ]),
}


def _generar_resultados_sinteticos(cx) -> None:
    """Crea un resultado sintético por cada hito-examen ya completado.

    No interpreta ni asigna grados clínicos: solo deja constancia textual de que
    el examen se realizó, como lo haría el equipo asistencial. El médico puede
    agregar más resultados desde el frontend.
    """
    filas = cx.execute(
        "SELECT hito_id, paciente_id, hito, estado_visible, fecha FROM hitos"
    ).fetchall()

    contador: dict[str, int] = {}
    for f in filas:
        nombre = (f["hito"] or "").strip()
        if nombre not in _HITOS_EXAMEN:
            continue
        if "completado" not in (f["estado_visible"] or "").lower():
            continue  # solo exámenes ya realizados

        examen, frases = _HITOS_EXAMEN[nombre]
        # Selección determinista a partir del hito_id.
        idx = sum(ord(c) for c in (f["hito_id"] or "")) % len(frases)
        texto = frases[idx]

        pid = f["paciente_id"]
        contador[pid] = contador.get(pid, 0) + 1
        resultado_id = f"RES-{pid}-{contador[pid]:03d}"

        cx.execute(
            "INSERT INTO resultados VALUES (?,?,?,?,?,?,?,?)",
            (
                resultado_id, pid, f["hito_id"], examen, f["fecha"], texto,
                "Resultado sintético generado a partir del hito.", "Sistema",
            ),
        )


# Métricas de evolución: rango base y unidad. Valores sintéticos, descriptivos,
# nunca una valoración clínica.
_METRICAS = {
    "tumoral": {"base": 38.0, "amp": 6.0, "tend": -0.03, "unidad": "mm"},
    "cea": {"base": 5.2, "amp": 1.4, "tend": -0.006, "unidad": "ng/ml"},
    "nutricional": {"base": 62.0, "amp": 3.5, "tend": 0.02, "unidad": "Kg"},
    "hemoglobina": {"base": 12.5, "amp": 1.2, "tend": 0.004, "unidad": "g/dL"},
}

# Meses sintéticos del demo: enero a junio de 2026.
_MESES_DEMO = [(2026, m) for m in range(1, 7)]


def _dias_del_mes(anio: int, mes: int) -> int:
    import calendar
    return calendar.monthrange(anio, mes)[1]


def _generar_mediciones_sinteticas(cx) -> None:
    """Genera una serie diaria (ene-jun 2026) por paciente para cada métrica.

    Es determinista por paciente (hash del id), de modo que re-correr la
    importación produce siempre los mismos valores. Alimenta las gráficas de
    evolución de "Mi proceso" (vista mensual y semestral).
    """
    import math

    pacientes = [
        f["paciente_id"]
        for f in cx.execute("SELECT paciente_id FROM pacientes").fetchall()
    ]
    for pid in pacientes:
        semilla = sum(ord(c) for c in pid)
        dia_global = 0
        for anio, mes in _MESES_DEMO:
            for dia in range(1, _dias_del_mes(anio, mes) + 1):
                dia_global += 1
                for metrica, cfg in _METRICAS.items():
                    # Onda suave + tendencia + desfase por paciente/métrica.
                    fase = (semilla + len(metrica)) % 7
                    onda = math.sin((dia_global + fase) / 9.0) * cfg["amp"]
                    valor = cfg["base"] + onda + cfg["tend"] * dia_global
                    valor = round(valor, 1)
                    cx.execute(
                        "INSERT INTO mediciones "
                        "(paciente_id, metrica, fecha, valor, unidad) "
                        "VALUES (?,?,?,?,?)",
                        (pid, metrica, f"{anio:04d}-{mes:02d}-{dia:02d}",
                         valor, cfg["unidad"]),
                    )


def _resumen(cx):
    print("Importación completada:")
    for tabla in ("pacientes", "contexto_clinico", "reportes",
                  "sintomas", "alertas", "hitos", "resultados", "citas",
                  "mediciones"):
        n = cx.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]
        print(f"  {tabla:18s} {n}")


if __name__ == "__main__":
    importar()
