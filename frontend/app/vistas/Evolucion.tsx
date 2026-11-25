"use client";

import { useEffect, useMemo, useState } from "react";
import { listarMediciones, ApiError } from "@/lib/api";
import { Medicion, Rol } from "@/lib/tipos";

// Series de evolución sintéticas (las mismas que grafica la app móvil), aquí
// presentadas para escritorio: gráfico de líneas + tabla de promedios por mes.
// Krebs no interpreta: solo grafica lo registrado.
const SERIES = [
  { metrica: "tumoral", label: "Evolución tumoral", color: "#0a4a8f" },
  { metrica: "cea", label: "Marcador CEA", color: "#e0a400" },
  { metrica: "nutricional", label: "Evolución nutricional", color: "#ff6a00" },
  { metrica: "hemoglobina", label: "Hemoglobina", color: "#5a6cf0" },
];

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default function Evolucion({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [datos, setDatos] = useState<Medicion[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    listarMediciones(pacienteId, rol)
      .then(setDatos)
      .catch((e) =>
        setError(e instanceof ApiError ? e.detalle : "No se pudo cargar.")
      )
      .finally(() => setCargando(false));
  }, [pacienteId, rol]);

  // Meses disponibles (claves "AAAA-MM").
  const meses = useMemo(() => {
    const set = new Set<string>();
    datos.forEach((d) => d.fecha && set.add(d.fecha.slice(0, 7)));
    return [...set].sort();
  }, [datos]);

  // Promedio mensual por métrica.
  const promedios = useMemo(() => {
    const acc: Record<string, Record<string, { suma: number; n: number; unidad: string }>> = {};
    datos.forEach((d) => {
      if (!d.fecha) return;
      const mk = d.fecha.slice(0, 7);
      const s = (acc[d.metrica] ??= {});
      const c = (s[mk] ??= { suma: 0, n: 0, unidad: d.unidad });
      c.suma += d.valor;
      c.n += 1;
    });
    return acc;
  }, [datos]);

  const etiquetas = meses.map((mk) => MESES[Number(mk.slice(5, 7)) - 1]);

  const unidadDe = (metrica: string) =>
    datos.find((d) => d.metrica === metrica)?.unidad ?? "";

  const promedio = (metrica: string, mk: string): number | null => {
    const c = promedios[metrica]?.[mk];
    return c ? Math.round((c.suma / c.n) * 10) / 10 : null;
  };

  return (
    <div>
      <h1>Evolución clínica · {pacienteId}</h1>
      <p className="fecha">
        Evolución tumoral, marcador CEA, evolución nutricional y hemoglobina.
        Promedios mensuales. Datos sintéticos; Krebs no interpreta resultados.
      </p>

      {error && <p className="error">{error}</p>}
      {cargando ? (
        <p className="vacio">Cargando evolución…</p>
      ) : datos.length === 0 ? (
        <p className="vacio">Sin mediciones registradas.</p>
      ) : (
        <>
          {/* Leyenda */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              margin: "0.5rem 0 0.75rem",
            }}
          >
            {SERIES.map((s) => (
              <span
                key={s.metrica}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
              >
                <span
                  style={{
                    width: 12, height: 12, borderRadius: 999, background: s.color,
                    display: "inline-block",
                  }}
                />
                {s.label} <span className="fecha">({unidadDe(s.metrica)})</span>
              </span>
            ))}
          </div>

          <Grafico etiquetasX={etiquetas} meses={meses} promedio={promedio} />

          {/* Tabla de promedios mensuales */}
          <h3 style={{ marginTop: "1.25rem" }}>Promedios por mes</h3>
          <table className="tabla">
            <thead>
              <tr>
                <th>Serie</th>
                {etiquetas.map((e, i) => (
                  <th key={i} style={{ textAlign: "right" }}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERIES.map((s) => (
                <tr key={s.metrica}>
                  <td>
                    <span
                      style={{
                        width: 10, height: 10, borderRadius: 999, background: s.color,
                        display: "inline-block", marginRight: 6,
                      }}
                    />
                    {s.label}
                    <div className="fecha">{unidadDe(s.metrica)}</div>
                  </td>
                  {meses.map((mk) => (
                    <td key={mk} style={{ textAlign: "right" }}>
                      {promedio(s.metrica, mk) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Gráfico de líneas en SVG (promedios mensuales de las 4 series).
function Grafico({
  etiquetasX,
  meses,
  promedio,
}: {
  etiquetasX: string[];
  meses: string[];
  promedio: (metrica: string, mk: string) => number | null;
}) {
  const W = 760;
  const H = 300;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const n = meses.length;

  const valores = SERIES.flatMap((s) =>
    meses.map((mk) => promedio(s.metrica, mk)).filter((v): v is number => v !== null)
  );
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const px = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const py = (v: number) => padT + (1 - (v - min) / rango) * (H - padT - padB);

  // 4 marcas en el eje Y.
  const marcasY = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * rango);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", border: "1px solid var(--borde)", borderRadius: 10, background: "#fff" }}
    >
      {/* grilla + etiquetas eje Y */}
      {marcasY.map((v, k) => {
        const y = py(v);
        return (
          <g key={k}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#d8dee9" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} fontSize="10" fill="#52606d" textAnchor="end">
              {Math.round(v * 10) / 10}
            </text>
          </g>
        );
      })}

      {/* series */}
      {SERIES.map((s) => {
        const pts = meses
          .map((mk, i) => {
            const v = promedio(s.metrica, mk);
            return v === null ? null : { x: px(i), y: py(v), v };
          })
          .filter(Boolean) as { x: number; y: number; v: number }[];
        const d = pts
          .map((p, k) => `${k === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");
        return (
          <g key={s.metrica}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
            {pts.map((p, k) => (
              <g key={k}>
                <circle cx={p.x} cy={p.y} r="4" fill={s.color} stroke="#fff" strokeWidth="1.5" />
                <title>{`${s.label}: ${p.v}`}</title>
              </g>
            ))}
          </g>
        );
      })}

      {/* etiquetas eje X */}
      {etiquetasX.map((t, i) => (
        <text key={i} x={px(i)} y={H - 10} fontSize="11" fill="#1f2933" textAnchor="middle">
          {t}
        </text>
      ))}
    </svg>
  );
}
