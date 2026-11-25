import { Rol } from "./tipos";

// Catálogo de roles del panel de escritorio. El rol "paciente" vive en la app
// móvil, no aquí: este panel es solo para médico y call center.
// El backend acepta "call center" o "call_center" (ver backend/app/roles.py).
export const ROLES: { valor: Rol; etiqueta: string; header: string }[] = [
  { valor: "medico", etiqueta: "Médico", header: "medico" },
  { valor: "call_center", etiqueta: "Call center", header: "call_center" },
];

// Permisos de escritura por rol. La lectura de la historia clínica la tienen
// todos los roles, por eso no aparece aquí.
export const PERMISOS: Record<Rol, string[]> = {
  paciente: ["Agregar síntomas", "Registrar reportes"],
  medico: ["Agregar imágenes", "Agregar resultados de exámenes"],
  call_center: ["Asignar citas", "Reprogramar citas", "Cancelar citas"],
};

export function puede(rol: Rol | null, accion: keyof typeof acciones): boolean {
  if (!rol) return false;
  return acciones[accion].includes(rol);
}

// Mapa de acción -> roles autorizados. Debe reflejar las dependencias
// exigir_rol(...) del backend.
const acciones = {
  agregarSintoma: ["paciente"] as Rol[],
  agregarResultado: ["medico"] as Rol[],
  agregarImagen: ["medico"] as Rol[],
  gestionarCitas: ["call_center"] as Rol[],
};

export function headerDeRol(rol: Rol): string {
  return ROLES.find((r) => r.valor === rol)?.header ?? rol;
}
