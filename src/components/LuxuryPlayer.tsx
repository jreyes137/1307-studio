"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Loader2, Activity, Zap, Volume2, Clock } from 'lucide-react';

interface LuxuryPlayerProps {
  beforeUrl: string;
  afterUrl: string;
  title: string;
  artist: string;
  tags?: string[];
}

export default function LuxuryPlayer({ beforeUrl, afterUrl, title, artist, tags }: LuxuryPlayerProps) {
  const playerId = useRef(Math.random().toString(36).substr(2, 9));

  // Referencias DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const masterContainerRef = useRef<HTMLDivElement>(null);
  const mixContainerRef = useRef<HTMLDivElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Referencias Audio y Lógica
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodesRef = useRef<Map<string, MediaElementAudioSourceNode>>(new Map());
  
  // --- CORRECCIÓN PARA VERCEL (TypeScript Strict) ---
  const animationRef = useRef<number | null>(null);
  
  const isComponentMounted = useRef(true);
  
  // Referencia para los "Picos Voladores"
  const capsRef = useRef<number[]>([]); 

  const masterWave = useRef<WaveSurfer | null>(null);
  const mixWave = useRef<WaveSurfer | null>(null);

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMaster, setIsMaster] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [detectedLufs, setDetectedLufs] = useState<string>("ANALIZANDO...");
  
  const [gainMatch, setGainMatch] = useState(false);
  const [calculatedReduction, setCalculatedReduction] = useState(1);

  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalDuration, setTotalDuration] = useState("0:00");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- CLICK MAESTRO ---
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!masterWave.current || !mixWave.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    
    masterWave.current.seekTo(progress);
    mixWave.current.seekTo(progress);
  };

  useEffect(() => {
    const handleGlobalPlay = (e: any) => {
      if (e.detail.id !== playerId.current) {
        if (masterWave.current?.isPlaying()) {
          masterWave.current.pause();
          mixWave.current?.pause();
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('luxury-player:play', handleGlobalPlay);
    return () => window.removeEventListener('luxury-player:play', handleGlobalPlay);
  }, []);

  const analyzeAudio = (master: WaveSurfer, mix: WaveSurfer) => {
    try {
      const masterBuffer = master.getDecodedData();
      const mixBuffer = mix.getDecodedData();
      if (!masterBuffer || !mixBuffer) return;

      const rawMaster = masterBuffer.getChannelData(0);
      let sumMaster = 0;
      const step = Math.ceil(rawMaster.length / 1000);
      for (let i = 0; i < rawMaster.length; i += step) sumMaster += rawMaster[i] * rawMaster[i];
      const rmsMaster = Math.sqrt(sumMaster / (rawMaster.length / step));
      const db = 20 * Math.log10(rmsMaster);
      setDetectedLufs(`${(db + 2.5).toFixed(1)} LUFS`);

      const rawMix = mixBuffer.getChannelData(0);
      let sumMix = 0;
      for (let i = 0; i < rawMix.length; i += step) sumMix += rawMix[i] * rawMix[i];
      const rmsMix = Math.sqrt(sumMix / (rawMix.length / step));
      const ratio = rmsMix / rmsMaster;
      setCalculatedReduction(Math.min(Math.max(ratio, 0.1), 1.0));
      setTotalDuration(formatTime(master.getDuration()));
    } catch (e) {
      setDetectedLufs("-.- LUFS");
    }
  };

  // --- DIBUJAR ESPECTRO FANTASMA (SUTIL) ---
  const drawSpectrum = () => {
    if (!analyserRef.current || !spectrumCanvasRef.current || !isComponentMounted.current) return;
    const canvas = spectrumCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyserRef.current.fftSize = 256; 
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barsToShow = 64; 
    
    if (capsRef.current.length !== barsToShow) {
        capsRef.current = new Array(barsToShow).fill(0);
    }

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.1)');
    gradient.addColorStop(0.5, 'rgba(184, 134, 11, 0.3)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.5)');

    const draw = () => {
      if (!isComponentMounted.current) return;
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(212, 175, 55, 0.15)";

      const barWidth = (canvas.width / barsToShow) * 0.8;
      const gap = (canvas.width / barsToShow) * 0.2;
      let x = 0;

      for (let i = 0; i < barsToShow; i++) {
        const dataIndex = Math.floor(i * (bufferLength / barsToShow) * 0.8);
        let barHeight = (dataArray[dataIndex] / 255) * canvas.height;

        if (barHeight > capsRef.current[i]) {
            capsRef.current[i] = barHeight;
        } else {
            capsRef.current[i] = Math.max(barHeight, capsRef.current[i] - 1.2); 
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const visualBarHeight = barHeight * 0.8; 
        ctx.roundRect(x, canvas.height - visualBarHeight, barWidth, visualBarHeight, [2, 2, 0, 0]);
        ctx.fill();

        const capY = canvas.height - (capsRef.current[i] * 0.8) - 4; 
        ctx.fillStyle = 'rgba(255, 248, 220, 0.5)'; 
        ctx.fillRect(x, capY, barWidth, 2); 
        x += barWidth + gap;
      }
    };
    draw();
  };

  const connectToAnalyser = (waveInstance: WaveSurfer | null) => {
    if (!waveInstance || !audioContextRef.current || !analyserRef.current) return;
    const mediaElement = waveInstance.getMediaElement();
    const sourceId = mediaElement.src; 
    if (sourceId && !sourceNodesRef.current.has(sourceId)) {
        try {
            const source = audioContextRef.current.createMediaElementSource(mediaElement);
            source.connect(analyserRef.current);
            sourceNodesRef.current.set(sourceId, source);
        } catch (e) { /* Ya conectado */ }
    }
  };

  useEffect(() => {
    if (!masterWave.current) return;
    if (isMaster) {
        masterWave.current.setVolume(gainMatch ? calculatedReduction : 1);
    }
  }, [gainMatch, isMaster, calculatedReduction]);

  useEffect(() => {
    isComponentMounted.current = true;
    if (!masterContainerRef.current || !mixContainerRef.current) return;

    const ctx = document.createElement('canvas').getContext('2d')!;

    // MASTER COLORES (SOLIDOS)
    const gradMasterProgress = ctx.createLinearGradient(0, 0, 0, 100);
    gradMasterProgress.addColorStop(0, '#FFFFFF'); 
    gradMasterProgress.addColorStop(0.3, '#FFD700'); 
    gradMasterProgress.addColorStop(1, '#FF8C00'); 
    const waveColorMaster = '#B8860B';

    // MIX COLORES (SOLIDOS)
    const gradMixProgress = ctx.createLinearGradient(0, 0, 0, 100);
    gradMixProgress.addColorStop(0, '#FFFFFF'); 
    gradMixProgress.addColorStop(1, '#00FFFF');
    const waveColorMix = '#A0A0A0';

    const commonOptions = {
      cursorColor: 'transparent',
      cursorWidth: 0,
      barWidth: 3, 
      barGap: 2,
      barRadius: 2,
      height: 80,
      barAlign: 'center' as const,
      normalize: true,
      interact: false, 
    };

    masterWave.current = WaveSurfer.create({
      ...commonOptions,
      container: masterContainerRef.current,
      progressColor: gradMasterProgress,
      waveColor: waveColorMaster,
    });

    mixWave.current = WaveSurfer.create({
      ...commonOptions,
      container: mixContainerRef.current,
      progressColor: gradMixProgress,
      waveColor: waveColorMix,
    });

    const loadAudios = async () => {
        try {
          await Promise.all([
              masterWave.current?.load(afterUrl),
              mixWave.current?.load(beforeUrl)
          ]);
          if (!isComponentMounted.current) return;
          masterWave.current?.setVolume(1);
          mixWave.current?.setVolume(0);
          if (masterWave.current && mixWave.current) {
            setTimeout(() => {
                if (masterWave.current && mixWave.current) {
                    analyzeAudio(masterWave.current, mixWave.current);
                }
            }, 500);
          }
          setIsReady(true);
        } catch (error) {
          console.error("Error loading audio");
        }
    };

    loadAudios();

    masterWave.current.on('play', () => {
        mixWave.current?.play();
        if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (!analyserRef.current) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256; 
                analyserRef.current.smoothingTimeConstant = 0.5; 
                analyserRef.current.connect(audioContextRef.current.destination);
                drawSpectrum();
            }
            audioContextRef.current.resume().then(() => {
                connectToAnalyser(masterWave.current);
                connectToAnalyser(mixWave.current);
            });
        }
    });

    masterWave.current.on('audioprocess', () => {
        if(masterWave.current) setCurrentTime(formatTime(masterWave.current.getCurrentTime()));
    });

    masterWave.current.on('pause', () => mixWave.current?.pause());
    masterWave.current.on('finish', () => setIsPlaying(false));

    return () => {
      isComponentMounted.current = false;
      
      // --- CORRECCIÓN DE TIPOS PARA VERCEL ---
      if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
      }
      
      masterWave.current?.destroy();
      mixWave.current?.destroy();
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      sourceNodesRef.current.clear();
    };
  }, [afterUrl, beforeUrl]);

  const togglePlay = () => {
    if (masterWave.current && isReady) {
      if (!isPlaying) {
        const event = new CustomEvent('luxury-player:play', { detail: { id: playerId.current } });
        window.dispatchEvent(event);
        masterWave.current.play();
      } else {
        masterWave.current.pause();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleVersion = () => {
    if (!masterWave.current || !mixWave.current || !isReady) return;
    if (isMaster) {
        masterWave.current.setVolume(0);
        mixWave.current.setVolume(1);
    } else {
        masterWave.current.setVolume(gainMatch ? calculatedReduction : 1);
        mixWave.current.setVolume(0);
    }
    setIsMaster(!isMaster);
  };

  return (
    <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/80 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white tracking-wide truncate pr-4">{title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
             <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase truncate mr-2">{artist}</p>
             {tags && tags.map((tag, i) => (
               <span key={i} className="text-[8px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 font-mono tracking-wide">{tag}</span>
             ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={(e) => { e.stopPropagation(); setGainMatch(!gainMatch); }}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold tracking-wider transition-all ${gainMatch ? 'bg-green-900/30 border-green-500 text-green-400' : 'border-gray-800 text-gray-600 hover:border-gray-600'}`}
                title="Igualar volumen"
            >
                <Volume2 size={10} />
                <span>GAIN MATCH</span>
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-[10px] transition-all duration-700 ${detectedLufs === "ANALIZANDO..." ? 'border-gray-800 text-gray-500' : 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5'}`}>
                {detectedLufs === "ANALIZANDO..." ? <Activity size={12} className="animate-spin" /> : <Zap size={12} fill="#D4AF37" />}
                <span className="tracking-wider font-bold">{detectedLufs}</span>
            </div>
        </div>
      </div>

      {/* ZONA VISUAL */}
      <div 
        ref={containerRef}
        onClick={handleSeek} 
        className="relative h-24 mb-6 bg-black/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 group-hover:bg-black/90 cursor-crosshair z-20 flex items-center justify-center"
      >
        {/* CANVAS */}
        <canvas 
            ref={spectrumCanvasRef} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%]" 
            width={600} 
            height={100}
            style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
        />

        {/* Ondas Invisibles (Lógica de audio) */}
        <div className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-0">
            <div ref={masterContainerRef} className="absolute inset-0 w-full" />
            <div ref={mixContainerRef} className="absolute inset-0 w-full" />
        </div>

        {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/90 backdrop-blur-sm">
                <Loader2 className="animate-spin text-[#D4AF37] w-6 h-6" />
            </div>
        )}
      </div>

      {/* CONTROLES */}
      <div className="flex items-center justify-between px-4 relative z-30">
        <div className="flex items-center gap-4">
            <button onClick={toggleVersion} disabled={!isReady} className="flex flex-col items-center gap-1 group/btn opacity-80 hover:opacity-100 transition disabled:opacity-30 cursor-pointer">
            <div className={`w-8 h-4 rounded-full border flex items-center p-0.5 transition-colors ${isMaster ? 'border-[#D4AF37] justify-end' : 'border-gray-600 justify-start'}`}>
                <div className={`w-3 h-3 rounded-full shadow-sm ${isMaster ? 'bg-[#D4AF37]' : 'bg-gray-500'}`} />
            </div>
            <span className="text-[8px] text-gray-500 font-bold tracking-widest">{isMaster ? 'MASTER' : 'MIX'}</span>
            </button>
            <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[10px]">
                <Clock size={10} />
                <span>{currentTime}</span>
                <span className="opacity-50">/</span>
                <span className="opacity-50">{totalDuration}</span>
            </div>
        </div>

        <button onClick={togglePlay} disabled={!isReady} className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${isReady ? 'bg-white text-black hover:scale-110 shadow-[0_0_25px_rgba(212,175,55,0.15)]' : 'bg-gray-800 text-gray-600'}`}>
          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
        </button>

        <div className="w-8"></div>
      </div>
    </div>
  );
}