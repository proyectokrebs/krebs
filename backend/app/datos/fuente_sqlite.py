"""Implementación de ``FuenteDatos`` sobre SQLite.

Lee y escribe en datos/krebs.db. Las fechas se guardan como texto ISO.
"""

from __future__ import annotations

import sqlite3
from datetime import date

from app import config
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
from app.db import conectar
from app.fechas import es_pasado


def _fecha(valor: str | None) -> date | None:
    if not valor:
        return None
    try:
        return date.fromisoformat(valor)
    except ValueError:
        return None


class FuenteSQLite(FuenteDatos):
    """Fuente de datos respaldada por SQLite."""

    def __init__(self, ruta_db=None):
        self._ruta = ruta_db or config.ARCHIVO_SQLITE

    def _cx(self) -> sqlite3.Connection:
        return conectar(self._ruta)

    # ----- Pacientes -----

    def listar_pacientes(self) -> list[Paciente]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM pacientes ORDER BY paciente_id"
            ).fetchall()
        return [self._a_paciente(f) for f in filas]

    def obtener_paciente(self, paciente_id: str) -> Paciente | None:
        with self._cx() as cx:
            fila = cx.execute(
                "SELECT * FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()
        return self._a_paciente(fila) if fila else None

    @staticmethod
    def _a_paciente(f: sqlite3.Row) -> Paciente:
        return Paciente(
            paciente_id=f["paciente_id"], edad=f["edad"], sexo=f["sexo"],
            procedencia=f["procedencia"], estadio=f["estadio"],
            fase_actual=f["fase_actual"],
            tratamiento_sistemico=f["tratamiento_sistemico"],
            inmunoterapia=f["inmunoterapia"], cirugia_previa=f["cirugia_previa"],
            fecha_cirugia=_fecha(f["fecha_cirugia"]),
            apoyo_cuidador=f["apoyo_cuidador"], canal_preferido=f["canal_preferido"],
        )

    # ----- Contexto -----

    def obtener_contexto(self, paciente_id: str) -> ContextoClinico | None:
        with self._cx() as cx:
            f = cx.execute(
                "SELECT * FROM contexto_clinico WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()
        if not f:
            return None
        return ContextoClinico(
            paciente_id=f["paciente_id"], peso_basal_kg=f["peso_basal_kg"],
            peso_actual_kg=f["peso_actual_kg"], perdida_peso_pct=f["perdida_peso_pct"],
            actividad_funcional=f["actividad_funcional"], ingesta=f["ingesta"],
        )

    # ----- Reportes -----

    def listar_reportes(self, paciente_id: str) -> list[Reporte]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM reportes WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [self._a_reporte(f) for f in filas]

    @staticmethod
    def _a_reporte(f: sqlite3.Row) -> Reporte:
        return Reporte(
            reporte_id=f["reporte_id"], paciente_id=f["paciente_id"],
            fecha=_fecha(f["fecha"]), respondedor=f["respondedor"],
            fase_contexto=f["fase_contexto"], entrada=f["entrada"],
            estado_vs_habitual=f["estado_vs_habitual"], comer_beber=f["comer_beber"],
            actividad=f["actividad"], sintoma_nuevo_empeora=f["sintoma_nuevo_empeora"],
        )

    # ----- Síntomas -----

    def listar_sintomas(self, paciente_id: str) -> list[Sintoma]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM sintomas WHERE paciente_id = ?", (paciente_id,)
            ).fetchall()
        return [
            Sintoma(
                sintoma_id=f["sintoma_id"], reporte_id=f["reporte_id"],
                paciente_id=f["paciente_id"], modulo=f["modulo"],
                sintoma=f["sintoma"], frecuencia=f["frecuencia"],
                intensidad=f["intensidad"], interferencia=f["interferencia"],
                evolucion=f["evolucion"],
            )
            for f in filas
        ]

    # ----- Alertas -----

    def listar_alertas(self, paciente_id: str) -> list[Alerta]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM alertas WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [
            Alerta(
                alerta_id=f["alerta_id"], paciente_id=f["paciente_id"],
                fecha=_fecha(f["fecha"]), motivo_principal=f["motivo_principal"],
                destinatario=f["destinatario"], estado_gestion=f["estado_gestion"],
            )
            for f in filas
        ]

    # ----- Hitos -----

    def listar_hitos(self, paciente_id: str) -> list[Hito]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM hitos WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [
            Hito(
                hito_id=f["hito_id"], paciente_id=f["paciente_id"], hito=f["hito"],
                estado_visible=f["estado_visible"], fecha=_fecha(f["fecha"]),
                texto_visible=f["texto_visible"],
            )
            for f in filas
        ]

    # ----- Imágenes -----

    def listar_imagenes(self, paciente_id: str) -> list[Imagen]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM imagenes WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [
            Imagen(
                paciente_id=f["paciente_id"], archivo=f["archivo"],
                fecha=_fecha(f["fecha"]), etiqueta=f["etiqueta"],
            )
            for f in filas
        ]

    # ----- Resultados -----

    def listar_resultados(self, paciente_id: str) -> list[Resultado]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM resultados WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [self._a_resultado(f) for f in filas]

    @staticmethod
    def _a_resultado(f: sqlite3.Row) -> Resultado:
        return Resultado(
            resultado_id=f["resultado_id"], paciente_id=f["paciente_id"],
            hito_id=f["hito_id"], examen=f["examen"], fecha=_fecha(f["fecha"]),
            resultado=f["resultado"], observacion=f["observacion"],
            registrado_por=f["registrado_por"],
        )

    # ----- Citas -----

    def listar_citas(self, paciente_id: str) -> list[Cita]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM citas WHERE paciente_id = ? ORDER BY fecha, hora",
                (paciente_id,),
            ).fetchall()
        return [self._a_cita(f) for f in filas]

    @staticmethod
    def _a_cita(f: sqlite3.Row) -> Cita:
        return Cita(
            cita_id=f["cita_id"], paciente_id=f["paciente_id"], motivo=f["motivo"],
            profesional=f["profesional"], fecha=_fecha(f["fecha"]), hora=f["hora"],
            estado=f["estado"], nota=f["nota"], creada_en=_fecha(f["creada_en"]),
            actualizada_en=_fecha(f["actualizada_en"]),
        )

    def _obtener_cita(self, cx: sqlite3.Connection, cita_id: str) -> sqlite3.Row | None:
        return cx.execute(
            "SELECT * FROM citas WHERE cita_id = ?", (cita_id,)
        ).fetchone()

    # ----- Catálogo y vistas globales -----

    def catalogo_sintomas(self) -> dict[str, list[str]]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT DISTINCT modulo, sintoma FROM sintomas "
                "WHERE sintoma != '' ORDER BY modulo, sintoma"
            ).fetchall()
        catalogo: dict[str, list[str]] = {}
        for f in filas:
            modulo = f["modulo"] or "Otros"
            catalogo.setdefault(modulo, []).append(f["sintoma"])
        return catalogo

    def sintomas_de_todos(self) -> list[tuple[Paciente, Sintoma]]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM sintomas WHERE sintoma != ''"
            ).fetchall()
        pacientes = {p.paciente_id: p for p in self.listar_pacientes()}
        salida: list[tuple[Paciente, Sintoma]] = []
        for f in filas:
            paciente = pacientes.get(f["paciente_id"])
            if paciente is None:
                continue
            sintoma = Sintoma(
                sintoma_id=f["sintoma_id"], reporte_id=f["reporte_id"],
                paciente_id=f["paciente_id"], modulo=f["modulo"],
                sintoma=f["sintoma"], frecuencia=f["frecuencia"],
                intensidad=f["intensidad"], interferencia=f["interferencia"],
                evolucion=f["evolucion"],
            )
            salida.append((paciente, sintoma))
        return salida

    def listar_reportes_medicos(self, paciente_id: str) -> list[Reporte]:
        return [
            r for r in self.listar_reportes(paciente_id)
            if (r.respondedor or "").strip().lower() in ("médico", "medico")
        ]

    def listar_mediciones(self, paciente_id: str) -> list[Medicion]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT metrica, fecha, valor, unidad FROM mediciones "
                "WHERE paciente_id = ? ORDER BY fecha",
                (paciente_id,),
            ).fetchall()
        return [
            Medicion(
                metrica=f["metrica"], fecha=_fecha(f["fecha"]),
                valor=f["valor"], unidad=f["unidad"],
            )
            for f in filas
        ]

    def obtener_reporte(self, reporte_id: str) -> Reporte | None:
        with self._cx() as cx:
            f = cx.execute(
                "SELECT * FROM reportes WHERE reporte_id = ?", (reporte_id,)
            ).fetchone()
        return self._a_reporte(f) if f else None

    def sintomas_de_reporte(self, reporte_id: str) -> list[Sintoma]:
        with self._cx() as cx:
            filas = cx.execute(
                "SELECT * FROM sintomas WHERE reporte_id = ?", (reporte_id,)
            ).fetchall()
        return [
            Sintoma(
                sintoma_id=f["sintoma_id"], reporte_id=f["reporte_id"],
                paciente_id=f["paciente_id"], modulo=f["modulo"],
                sintoma=f["sintoma"], frecuencia=f["frecuencia"],
                intensidad=f["intensidad"], interferencia=f["interferencia"],
                evolucion=f["evolucion"],
            )
            for f in filas
        ]

    # ----- Línea de tiempo -----

    def linea_de_tiempo(self, paciente_id: str) -> list[Evento]:
        eventos: list[Evento] = []
        for h in self.listar_hitos(paciente_id):
            desc = h.texto_visible or h.estado_visible or ""
            eventos.append(Evento(
                fecha=h.fecha, tipo="Hito",
                descripcion=f"{h.hito} — {desc}".strip(" —"),
                es_pasado=es_pasado(h.fecha) if h.fecha else True,
            ))
        for r in self.listar_reportes(paciente_id):
            quien = r.respondedor or "Paciente"
            eventos.append(Evento(
                fecha=r.fecha, tipo="Reporte",
                descripcion=f"Reporte de {quien}: {r.entrada}".strip(": "),
                es_pasado=es_pasado(r.fecha) if r.fecha else True,
                ref=r.reporte_id,
            ))
        for res in self.listar_resultados(paciente_id):
            eventos.append(Evento(
                fecha=res.fecha, tipo="Resultado",
                descripcion=f"Resultado de {res.examen}: {res.resultado}".strip(": "),
                es_pasado=es_pasado(res.fecha) if res.fecha else True,
                ref=res.resultado_id,
            ))
        for c in self.listar_citas(paciente_id):
            eventos.append(Evento(
                fecha=c.fecha, tipo="Cita",
                descripcion=f"Cita ({c.estado}): {c.motivo} "
                            f"con {c.profesional}".strip(),
                es_pasado=es_pasado(c.fecha) if c.fecha else False,
            ))
        return sorted(eventos, key=lambda e: (e.fecha is None, e.fecha or date.max))

    # ----- Escritura -----

    def crear_reporte(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        hoy = date.today()
        with self._cx() as cx:
            if not cx.execute(
                "SELECT 1 FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone():
                raise ValueError(f"El paciente {paciente_id} no existe.")

            n = cx.execute(
                "SELECT COUNT(*) FROM reportes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()[0]
            reporte_id = f"R-{paciente_id}-{n + 1:02d}"

            reporte = Reporte(
                reporte_id=reporte_id, paciente_id=paciente_id, fecha=hoy,
                respondedor=datos.respondedor, fase_contexto=datos.fase_contexto,
                entrada=datos.entrada, estado_vs_habitual=datos.estado_vs_habitual,
                comer_beber=datos.comer_beber, actividad=datos.actividad,
                sintoma_nuevo_empeora=datos.sintoma_nuevo_empeora,
            )
            cx.execute(
                "INSERT INTO reportes VALUES (?,?,?,?,?,?,?,?,?,?)",
                (
                    reporte.reporte_id, reporte.paciente_id, hoy.isoformat(),
                    reporte.respondedor, reporte.fase_contexto, reporte.entrada,
                    reporte.estado_vs_habitual, reporte.comer_beber,
                    reporte.actividad, reporte.sintoma_nuevo_empeora,
                ),
            )
            cx.commit()
        return reporte

    def crear_reporte_medico(self, paciente_id: str, datos: NuevoReporte) -> Reporte:
        # Igual que crear_reporte, pero forzando respondedor = Médico, de modo
        # que estos reportes puedan verse en una pestaña aparte.
        datos.respondedor = "Médico"
        return self.crear_reporte(paciente_id, datos)

    def crear_sintoma(self, paciente_id: str, datos: NuevoSintoma) -> Sintoma:
        hoy = date.today()
        with self._cx() as cx:
            if not cx.execute(
                "SELECT 1 FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone():
                raise ValueError(f"El paciente {paciente_id} no existe.")

            # Todo síntoma queda como autorreporte del paciente: se crea (o se
            # reutiliza el indicado) un reporte ePRO con respondedor "Paciente".
            reporte_id = (datos.reporte_id or "").strip()
            if not reporte_id:
                nr = cx.execute(
                    "SELECT COUNT(*) FROM reportes WHERE paciente_id = ?",
                    (paciente_id,),
                ).fetchone()[0]
                reporte_id = f"R-{paciente_id}-{nr + 1:02d}"
                cx.execute(
                    "INSERT INTO reportes VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        reporte_id, paciente_id, hoy.isoformat(), "Paciente", "",
                        "Autorreporte de síntoma", "", "", "",
                        "Sí" if datos.sintoma else "No",
                    ),
                )

            n = cx.execute(
                "SELECT COUNT(*) FROM sintomas WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()[0]
            sintoma_id = f"S-{paciente_id}-{n + 1:03d}"
            sintoma = Sintoma(
                sintoma_id=sintoma_id, reporte_id=reporte_id,
                paciente_id=paciente_id, modulo=datos.modulo, sintoma=datos.sintoma,
                frecuencia=datos.frecuencia, intensidad=datos.intensidad,
                interferencia=datos.interferencia, evolucion=datos.evolucion,
            )
            cx.execute(
                "INSERT INTO sintomas VALUES (?,?,?,?,?,?,?,?,?)",
                (
                    sintoma.sintoma_id, sintoma.reporte_id, sintoma.paciente_id,
                    sintoma.modulo, sintoma.sintoma, sintoma.frecuencia,
                    sintoma.intensidad, sintoma.interferencia, sintoma.evolucion,
                ),
            )
            cx.commit()
        return sintoma

    def crear_resultado(self, paciente_id: str, datos: NuevoResultado) -> Resultado:
        fecha = datos.fecha or date.today()
        with self._cx() as cx:
            if not cx.execute(
                "SELECT 1 FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone():
                raise ValueError(f"El paciente {paciente_id} no existe.")

            n = cx.execute(
                "SELECT COUNT(*) FROM resultados WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()[0]
            resultado_id = f"RES-{paciente_id}-{n + 1:03d}"
            resultado = Resultado(
                resultado_id=resultado_id, paciente_id=paciente_id,
                hito_id=datos.hito_id or None, examen=datos.examen, fecha=fecha,
                resultado=datos.resultado, observacion=datos.observacion,
                registrado_por="Médico",
            )
            cx.execute(
                "INSERT INTO resultados VALUES (?,?,?,?,?,?,?,?)",
                (
                    resultado.resultado_id, resultado.paciente_id, resultado.hito_id,
                    resultado.examen, fecha.isoformat(), resultado.resultado,
                    resultado.observacion, resultado.registrado_por,
                ),
            )
            cx.commit()
        return resultado

    def crear_imagen(self, paciente_id: str, datos: NuevaImagen) -> Imagen:
        fecha = datos.fecha or date.today()
        with self._cx() as cx:
            if not cx.execute(
                "SELECT 1 FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone():
                raise ValueError(f"El paciente {paciente_id} no existe.")
            cx.execute(
                "INSERT INTO imagenes (paciente_id, archivo, fecha, etiqueta) "
                "VALUES (?,?,?,?)",
                (paciente_id, datos.archivo, fecha.isoformat(), datos.etiqueta),
            )
            cx.commit()
        return Imagen(
            paciente_id=paciente_id, archivo=datos.archivo, fecha=fecha,
            etiqueta=datos.etiqueta,
        )

    def crear_cita(self, paciente_id: str, datos: NuevaCita) -> Cita:
        hoy = date.today()
        with self._cx() as cx:
            if not cx.execute(
                "SELECT 1 FROM pacientes WHERE paciente_id = ?", (paciente_id,)
            ).fetchone():
                raise ValueError(f"El paciente {paciente_id} no existe.")

            n = cx.execute(
                "SELECT COUNT(*) FROM citas WHERE paciente_id = ?", (paciente_id,)
            ).fetchone()[0]
            cita_id = f"C-{paciente_id}-{n + 1:03d}"
            cita = Cita(
                cita_id=cita_id, paciente_id=paciente_id, motivo=datos.motivo,
                profesional=datos.profesional, fecha=datos.fecha, hora=datos.hora,
                estado="programada", nota=datos.nota, creada_en=hoy,
                actualizada_en=hoy,
            )
            cx.execute(
                "INSERT INTO citas VALUES (?,?,?,?,?,?,?,?,?,?)",
                (
                    cita.cita_id, cita.paciente_id, cita.motivo, cita.profesional,
                    cita.fecha.isoformat(), cita.hora, cita.estado, cita.nota,
                    hoy.isoformat(), hoy.isoformat(),
                ),
            )
            cx.commit()
        return cita

    def reprogramar_cita(self, cita_id: str, datos: ReprogramarCita) -> Cita:
        hoy = date.today()
        with self._cx() as cx:
            fila = self._obtener_cita(cx, cita_id)
            if fila is None:
                raise ValueError(f"La cita {cita_id} no existe.")
            if (fila["estado"] or "").lower() == "cancelada":
                raise ValueError("No se puede reprogramar una cita cancelada.")
            nota = datos.nota or fila["nota"]
            cx.execute(
                "UPDATE citas SET fecha = ?, hora = ?, estado = 'reprogramada', "
                "nota = ?, actualizada_en = ? WHERE cita_id = ?",
                (datos.fecha.isoformat(), datos.hora, nota, hoy.isoformat(), cita_id),
            )
            cx.commit()
            return self._a_cita(self._obtener_cita(cx, cita_id))

    def cancelar_cita(self, cita_id: str, nota: str = "") -> Cita:
        hoy = date.today()
        with self._cx() as cx:
            fila = self._obtener_cita(cx, cita_id)
            if fila is None:
                raise ValueError(f"La cita {cita_id} no existe.")
            nota_final = nota or fila["nota"]
            cx.execute(
                "UPDATE citas SET estado = 'cancelada', nota = ?, "
                "actualizada_en = ? WHERE cita_id = ?",
                (nota_final, hoy.isoformat(), cita_id),
            )
            cx.commit()
            return self._a_cita(self._obtener_cita(cx, cita_id))
