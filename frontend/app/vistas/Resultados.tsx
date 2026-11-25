"use client";

import { useEffect, useState } from "react";
import {
  listarResultados,
  listarImagenes,
  crearResultado,
  crearImagen,
  ApiError,
} from "@/lib/api";
import { Imagen, Resultado, Rol } from "@/lib/tipos";

// Resultados e imágenes: lectura para todos; alta solo para el médico.
export default function Resultados({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [error, setError] = useState("");
  const [res, setRes] = useState({ examen: "", resultado: "", observacion: "" });
  const [img, setImg] = useState({ archivo: "", etiqueta: "" });

  const esMedico = rol === "medico";

  const recargar = () =>
    Promise.all([
      listarResultados(pacienteId, rol),
      listarImagenes(pacienteId, rol),
    ]).then(([r, i]) => {
      setResultados(r);
      setImagenes(i);
    });

  useEffect(() => {
    recargar().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, rol]);

  const enviarResultado = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await crearResultado(pacienteId, rol, res);
      setRes({ examen: "", resultado: "", observacion: "" });
      await recargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : "No se pudo registrar.");
    }
  };

  const enviarImagen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await crearImagen(pacienteId, rol, img);
      setImg({ archivo: "", etiqueta: "" });
      await recargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : "No se pudo registrar.");
    }
  };

  return (
    <div>
      <h1>Resultados e imágenes</h1>

      {esMedico ? (
        <>
          <form onSubmit={enviarResultado} className="tarjeta">
            <h3 style={{ marginTop: 0 }}>Agregar resultado de examen</h3>
            <div className="form-grid">
              <div className="campo">
                <label>Examen *</label>
                <input
                  required
                  value={res.examen}
                  onChange={(e) => setRes({ ...res, examen: e.target.value })}
                />
              </div>
              <div className="campo">
                <label>Resultado *</label>
                <input
                  required
                  value={res.resultado}
                  onChange={(e) =>
                    setRes({ ...res, resultado: e.target.value })
                  }
                />
              </div>
              <div className="campo">
                <label>Observación</label>
                <input
                  value={res.observacion}
                  onChange={(e) =>
                    setRes({ ...res, observacion: e.target.value })
                  }
                />
              </div>
            </div>
            <button className="btn" disabled={!res.examen || !res.resultado}>
              Registrar resultado
            </button>
          </form>

          <form onSubmit={enviarImagen} className="tarjeta">
            <h3 style={{ marginTop: 0 }}>Agregar imagen diagnóstica</h3>
            <div className="form-grid">
              <div className="campo">
                <label>Archivo *</label>
                <input
                  required
                  placeholder="tac_kg0001.png"
                  value={img.archivo}
                  onChange={(e) => setImg({ ...img, archivo: e.target.value })}
                />
              </div>
              <div className="campo">
                <label>Etiqueta</label>
                <input
                  value={img.etiqueta}
                  onChange={(e) => setImg({ ...img, etiqueta: e.target.value })}
                />
              </div>
            </div>
            <button className="btn" disabled={!img.archivo}>
              Registrar imagen
            </button>
          </form>
        </>
      ) : (
        <p className="sin-permiso">
          Solo el médico puede agregar resultados e imágenes. Cambie el rol a
          “Médico” para registrarlos.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <h3>Resultados de exámenes</h3>
      {resultados.length === 0 ? (
        <p className="vacio">Sin resultados registrados.</p>
      ) : (
        resultados.map((r) => (
          <div className="tarjeta" key={r.resultado_id}>
            <strong>{r.examen}</strong>
            <span className="fecha" style={{ marginLeft: 8 }}>
              {r.fecha ?? "sin fecha"} · {r.registrado_por}
            </span>
            <div>{r.resultado}</div>
            {r.observacion && <div className="fecha">{r.observacion}</div>}
          </div>
        ))
      )}

      <h3>Imágenes diagnósticas</h3>
      {imagenes.length === 0 ? (
        <p className="vacio">Sin imágenes registradas.</p>
      ) : (
        <div className="galeria">
          {imagenes.map((i) => (
            <div className="tarjeta" key={i.archivo}>
              <div className="fecha">
                {i.etiqueta || i.archivo} · {i.fecha ?? "sin fecha"}
              </div>
              {i.disponible && i.url ? (
                <img src={i.url} alt={i.etiqueta || i.archivo} />
              ) : (
                <div className="vacio">
                  Archivo no disponible en el servidor ({i.archivo}).
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
