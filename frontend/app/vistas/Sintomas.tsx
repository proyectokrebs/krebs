"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listarSintomas,
  crearSintoma,
  obtenerCatalogoSintomas,
  ApiError,
} from "@/lib/api";
import { CatalogoSintomas, Rol, Sintoma } from "@/lib/tipos";

// Opciones fijas (listas cerradas). Las intensidades coinciden con las de los
// datos; las frecuencias se estandarizan porque el libro no las trae.
const INTENSIDADES = ["Leve", "Moderada", "Intensa", "Muy intensa"];
const FRECUENCIAS = ["Ocasional", "A veces", "Frecuente", "Constante"];

// Autorreporte de síntomas: el paciente elige de una lista cerrada. Lectura
// para todos; el formulario solo para el paciente.
export default function Sintomas({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [sintomas, setSintomas] = useState<Sintoma[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoSintomas>({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    modulo: "",
    sintoma: "",
    intensidad: "Leve",
    frecuencia: "Ocasional",
  });

  const esPaciente = rol === "paciente";
  const modulos = useMemo(() => Object.keys(catalogo), [catalogo]);
  const opcionesSintoma = form.modulo ? catalogo[form.modulo] ?? [] : [];

  const recargar = () =>
    listarSintomas(pacienteId, rol).then(setSintomas).catch(() => {});

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, rol]);

  useEffect(() => {
    obtenerCatalogoSintomas(rol)
      .then((c) => {
        setCatalogo(c);
        const primerModulo = Object.keys(c)[0] ?? "";
        setForm((f) => ({
          ...f,
          modulo: f.modulo || primerModulo,
          sintoma: f.sintoma || (c[primerModulo]?.[0] ?? ""),
        }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  const cambiarModulo = (modulo: string) =>
    setForm({ ...form, modulo, sintoma: catalogo[modulo]?.[0] ?? "" });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await crearSintoma(pacienteId, rol, form);
      await recargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : "No se pudo registrar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1>Síntomas (autorreporte)</h1>

      {esPaciente ? (
        <form onSubmit={enviar} className="tarjeta">
          <h3 style={{ marginTop: 0 }}>Reportar un síntoma</h3>
          <p className="fecha">
            El síntoma se guarda como autorreporte del paciente.
          </p>
          <div className="form-grid">
            <div className="campo">
              <label>Módulo</label>
              <select
                value={form.modulo}
                onChange={(e) => cambiarModulo(e.target.value)}
              >
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Síntoma</label>
              <select
                value={form.sintoma}
                onChange={(e) => setForm({ ...form, sintoma: e.target.value })}
              >
                {opcionesSintoma.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Intensidad</label>
              <select
                value={form.intensidad}
                onChange={(e) =>
                  setForm({ ...form, intensidad: e.target.value })
                }
              >
                {INTENSIDADES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Frecuencia</label>
              <select
                value={form.frecuencia}
                onChange={(e) =>
                  setForm({ ...form, frecuencia: e.target.value })
                }
              >
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={enviando || !form.sintoma}>
            {enviando ? "Guardando…" : "Registrar autorreporte"}
          </button>
        </form>
      ) : (
        <p className="sin-permiso">
          Los síntomas los autorreporta el paciente desde la app móvil. Aquí se
          muestran solo para consulta.
        </p>
      )}

      <h3>Síntomas registrados</h3>
      {sintomas.length === 0 ? (
        <p className="vacio">Sin síntomas registrados.</p>
      ) : (
        sintomas.map((s) => (
          <div className="tarjeta" key={s.sintoma_id}>
            <strong>{s.sintoma}</strong>
            {s.modulo && (
              <span className="etiqueta-tipo" style={{ marginLeft: 8 }}>
                {s.modulo}
              </span>
            )}
            <div className="fecha">
              Intensidad: {s.intensidad || "—"} · Frecuencia:{" "}
              {s.frecuencia || "—"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
