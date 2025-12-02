import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1307 STUDIO | PORTAFOLIO",
  description: "Ingeniería de Audio de Precisión. Mezcla y Mastering Profesional. Escucha el antes y el después.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎚️</text></svg>',
  },
  openGraph: {
    title: "1307 STUDIO | PORTAFOLIO",
    description: "Ingeniería de Audio de Precisión. Servicios de Mezcla y Mastering.",
    siteName: "1307 STUDIO",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-[#050505] text-white antialiased">
        {children}
      </body>
    </html>
  );
}