/** @type {import('next').NextConfig} */
const nextConfig = {
  // El backend (FastAPI) corre en el puerto 8000. Se puede sobreescribir con
  // la variable NEXT_PUBLIC_API_URL. Las imágenes se sirven desde /imagenes.
  async rewrites() {
    const api = process.env.KREBS_API_PROXY || "http://localhost:8000";
    return [
      { source: "/imagenes/:path*", destination: `${api}/imagenes/:path*` },
    ];
  },
};

export default nextConfig;
