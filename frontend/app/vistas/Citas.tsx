"use client";

import { useEffect, useState } from "react";
import {
  listarCitas,
  crearCita,
  reprogramarCita,
  cancelarCita,
  ApiError,
} from "@/lib/api";
import { Cita, Rol } from "@/lib/tipos";

// Citas: lectura para todos; asignar/reprogramar/cancelar solo call center.
export default function Citas({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [error, setError] = useState("");
  const [nueva, setNueva] = useState({
    motivo: "",
    profesional: "",
    fecha: "",
    hora: "",
    nota: "",
  });
  const [reprog, setReprog] = useState<Record<string, { fecha: string; hora: string }>>({});

  const esCallCenter = rol === "call_center";

  const recargar = () => listarCitas(pacienteId, rol).then(setCitas);

  useEffect(() => {
    recargar().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, rol]);

  const manejar = async (accion: () => Promise<unknown>) => {
    setError("");
    try {
      await accion();
      await recargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : "Operación fallida.");
    }
  };

  const asignar = (e: React.FormEvent) => {
    e.preventDefault();
    manejar(async () => {
      await crearCita(pacienteId, rol, nueva);
      setNueva({ motivo: "", profesional: "", fecha: "", hora: "", nota: "" });
    });
  };

  return (
    <div>
      <h1>Citas</h1>

      {esCallCenter ? (
        <form onSubmit={asignar} className="tarjeta">
          <h3 style={{ marginTop: 0 }}>Asignar cita</h3>
          <div className="form-grid">
            <div className="campo">
              <label>Motivo *</label>
              <input
                required
                value={nueva.motivo}
                onChange={(e) => setNueva({ ...nueva, motivo: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Profesional *</label>
              <input
                required
                value={nueva.profesional}
                onChange={(e) =>
                  setNueva({ ...nueva, profesional: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Fecha *</label>
              <input
                type="date"
                required
                value={nueva.fecha}
                onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Hora *</label>
              <input
                type="time"
                required
                value={nueva.hora}
                onChange={(e) => setNueva({ ...nueva, hora: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Nota</label>
              <input
                value={nueva.nota}
                onChange={(e) => setNueva({ ...nueva, nota: e.target.value })}
              />
            </div>
          </div>
          <button
            className="btn"
            disabled={
              !nueva.motivo || !nueva.profesional || !nueva.fecha || !nueva.hora
            }
          >
            Asignar cita
          </button>
        </form>
      ) : (
        <p className="sin-permiso">
          Solo el call center puede gestionar citas. Cambie el rol a “Call
          center” para asignar, reprogramar o cancelar.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <h3>Citas del paciente</h3>
      {citas.length === 0 ? (
        <p className="vacio">Sin citas registradas.</p>
      ) : (
        citas.map((c) => {
          const activa = !["cancelada", "atendida"].includes(
            c.estado.toLowerCase()
          );
          const edit = reprog[c.cita_id] ?? { fecha: "", hora: "" };
          return (
            <div className="tarjeta" key={c.cita_id}>
              <div>
                <strong>{c.motivo}</strong>
                <span
                  className={`estado-badge estado-${c.estado.toLowerCase()}`}
                  style={{ marginLeft: 8 }}
                >
                  {c.estado}
                </span>
              </div>
              <div className="fecha">
                {c.fecha ?? "sin fecha"} {c.hora} · {c.profesional}
                {c.nota && ` · ${c.nota}`}
              </div>

              {esCallCenter && activa && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className="campo">
                    <label>Nueva fecha</label>
                    <input
                      type="date"
                      value={edit.fecha}
                      onChange={(e) =>
                        setReprog({
                          ...reprog,
                          [c.cita_id]: { ...edit, fecha: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>Nueva hora</label>
                    <input
                      type="time"
                      value={edit.hora}
                      onChange={(e) =>
                        setReprog({
                          ...reprog,
                          [c.cita_id]: { ...edit, hora: e.target.value },
                        })
                      }
                    />
                  </div>
                  <button
                    className="btn secundario"
                    disabled={!edit.fecha || !edit.hora}
                    onClick={() =>
                      manejar(() =>
                        reprogramarCita(c.cita_id, rol, {
                          fecha: edit.fecha,
                          hora: edit.hora,
                        })
                      )
                    }
                  >
                    Reprogramar
                  </button>
                  <button
                    className="btn peligro"
                    onClick={() =>
                      manejar(() => cancelarCita(c.cita_id, rol))
                    }
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
