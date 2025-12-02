"use client";

import { useState, useEffect } from "react";
import LuxuryPlayer from "@/components/LuxuryPlayer";
import { createClient } from "next-sanity";
import { MessageCircle } from "lucide-react";

// --- 1. CONFIGURACIÓN DE SANITY ---
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// --- 2. DEFINICIÓN DEL TRACK ---
interface SanityTrack {
  _id: string;
  title: string;
  artist: string;
  mixUrl: string;
  masterUrl: string;
  tags: string[];
  lufs: string; // <--- El dato importante
}

export default function Home() {
  // Estados de la página
  const [activeTab, setActiveTab] = useState<'portfolio' | 'services'>('portfolio');
  const [tracks, setTracks] = useState<SanityTrack[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 3. CARGAR CANCIONES AL INICIAR ---
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // Pedimos también el campo "lufs" a la base de datos
        const query = `*[_type == "track"] | order(order asc) {
          _id,
          title,
          artist,
          "mixUrl": mix.asset->url,
          "masterUrl": master.asset->url,
          tags,
          lufs
        }`;
        const data = await client.fetch(query);
        setTracks(data);
      } catch (error) {
        console.error("Error cargando tracks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center py-12 px-4 selection:bg-[#D4AF37] selection:text-black">
      
      {/* --- HEADER FIJO --- */}
      <div className="text-center mb-10 w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
          1307 STUDIO.
        </h1>
        <div className="h-px w-16 bg-[#D4AF37] mx-auto mb-8 opacity-80" />
        
        {/* NAVEGACIÓN (TABS) */}
        <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-full backdrop-blur-md border border-white/10 mx-auto w-fit">
            <button 
                onClick={() => setActiveTab('portfolio')}
                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 ${activeTab === 'portfolio' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
                PORTAFOLIO
            </button>
            <button 
                onClick={() => setActiveTab('services')}
                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 ${activeTab === 'services' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
                SERVICIOS
            </button>
        </div>
      </div>

      {/* --- CONTENIDO PESTAÑA 1: PORTAFOLIO --- */}
      {activeTab === 'portfolio' && (
        <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 mb-20">
            {loading ? (
                <div className="text-[#D4AF37] text-xs font-mono animate-pulse mt-10">CARGANDO ESTUDIO...</div>
            ) : tracks.length > 0 ? (
                tracks.map((track) => (
                    <LuxuryPlayer 
                        key={track._id}
                        title={track.title}
                        artist={track.artist}
                        beforeUrl={track.mixUrl}
                        afterUrl={track.masterUrl}
                        tags={track.tags}
                        lufs={track.lufs || "-14.0 LUFS"} // Pasamos el dato a la vista
                    />
                ))
            ) : (
                <div className="text-gray-500 text-xs border border-white/10 p-4 rounded bg-white/5 mt-10">
                    No hay tracks cargados aún. Ve a /studio para subir uno.
                </div>
            )}
        </div>
      )}

      {/* --- CONTENIDO PESTAÑA 2: SERVICIOS --- */}
      {activeTab === 'services' && (
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            
            {/* TARJETA MEZCLA */}
            <div className="group bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl hover:border-[#D4AF37]/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">MEZCLA</h3>
                    <p className="text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase mb-6">Mixing Profesional</p>
                    <ul className="text-gray-400 text-sm space-y-4 mb-8 font-light">
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Balance y Panorama Estéreo</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Ecualización Quirúrgica</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Compresión Analógica/Digital</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Afinación Vocal (Melodyne)</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Efectos Creativos y Ambientes</li>
                    </ul>
                    <a 
                        href="https://wa.me/5216635211254?text=Hola%201307%20STUDIO,%20me%20interesa%20cotizar%20un%20servicio%20de%20MEZCLA."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 rounded bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={16} />
                        COTIZAR MEZCLA
                    </a>
                </div>
            </div>

            {/* TARJETA MASTERING */}
            <div className="group bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl hover:border-[#D4AF37]/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">MASTERING</h3>
                    <p className="text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase mb-6">Finalización de Audio</p>
                    <ul className="text-gray-400 text-sm space-y-4 mb-8 font-light">
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Volumen Competitivo (LUFS)</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Equilibrio Tonal y Color</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Imagen Estéreo y Profundidad</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Optimización para Streaming</li>
                        <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Entrega en WAV 24bit + MP3</li>
                    </ul>
                    <a 
                        href="https://wa.me/5216635211254?text=Hola%201307%20STUDIO,%20me%20interesa%20cotizar%20un%20servicio%20de%20MASTERING."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 rounded bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={16} />
                        COTIZAR MASTER
                    </a>
                </div>
            </div>

            </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-10 text-center opacity-40 hover:opacity-100 transition-opacity pb-10">
        <p className="text-gray-500 text-[9px] tracking-[0.3em]">© 2024 1307 STUDIO • TIJUANA, MX</p>
      </footer>

    </main>
  );
}