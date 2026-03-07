"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ProgressCarousel() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPhotos() {
            setLoading(true);
            const { data, error } = await supabase
                .from("progress_photos")
                .select("*")
                .order("date", { ascending: true });

            if (data && !error) {
                setPhotos(data);
            } else {
                // Fallback
                setPhotos([
                    { id: 1, date: "2026-01-01", label: "Inicio" },
                    { id: 2, date: "2026-01-15", label: "Seguimiento" },
                    { id: 3, date: "2026-02-01", label: "Progreso" },
                    { id: 4, date: "2026-02-15", label: "Resultados" },
                    { id: 5, date: "2026-03-01", label: "Meta Parcial" },
                    { id: 6, date: "2026-03-15", label: "Constancia" },
                    { id: 7, date: "2026-04-01", label: "Transformación" },
                    { id: 8, date: "2026-04-15", label: "Estado Actual" },
                ]);
            }
            setLoading(false);
        }
        fetchPhotos();
    }, []);

    const photosPerSlide = 4;
    const totalSlides = Math.ceil(photos.length / photosPerSlide);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % (totalSlides || 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + (totalSlides || 1)) % (totalSlides || 1));
    };

    const startIndex = currentSlide * photosPerSlide;
    const currentPhotos = photos.slice(startIndex, startIndex + photosPerSlide);

    return (
        <Card className="w-full bg-[#151F32] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-nutrition-500/5 blur-[100px] pointer-events-none" />

            <CardContent className="p-0 flex flex-col relative z-10">
                <div className="p-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Evolución</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro Fotográfico de Progreso</p>
                    </div>
                    <div className="flex gap-4 items-center bg-white/[0.03] border border-white/5 p-2 rounded-2xl">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevSlide}
                            disabled={totalSlides <= 1}
                            className="h-10 w-10 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-20"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentSlide + 1} / {totalSlides}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextSlide}
                            disabled={totalSlides <= 1}
                            className="h-10 w-10 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-20"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="px-10 pb-10">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                            <div className="h-12 w-12 border-4 border-nutrition-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando archivos...</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="py-32 text-center text-slate-600 font-medium italic">Sin registros visuales encontrados.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {currentPhotos.map((photo, idx) => {
                                const placeholders = [
                                    { bg: "bg-white/[0.03]", icon: "text-slate-500" },
                                    { bg: "bg-nutrition-500/5", icon: "text-nutrition-500/30" },
                                    { bg: "bg-blue-500/5", icon: "text-blue-500/30" },
                                    { bg: "bg-purple-500/5", icon: "text-purple-500/30" },
                                ];
                                const style = placeholders[(startIndex + idx) % placeholders.length];

                                return (
                                    <div key={photo.id} className="flex flex-col gap-6 group/photo animate-in zoom-in duration-700">
                                        <div className={cn(
                                            "aspect-[3/4.5] rounded-[2rem] flex items-center justify-center relative overflow-hidden transition-all duration-500",
                                            "border border-white/5 shadow-inner hover:border-nutrition-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
                                            style.bg
                                        )}>
                                            <div className={cn("p-8 rounded-full bg-[#151F32] border border-white/5 shadow-2xl transition-transform duration-500 group-hover/photo:scale-110", style.icon)}>
                                                <Camera className="h-10 w-10" />
                                            </div>
                                            <div className="absolute top-6 left-6">
                                                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl text-[9px] font-tech font-black uppercase tracking-widest text-white border border-white/10 shadow-2xl">
                                                    {new Date(photo.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest group-hover/photo:text-white transition-colors">
                                                {photo.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-10 pb-10 flex gap-3">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-700",
                                i === currentSlide ? "bg-nutrition-500 shadow-[0_0_10px_#10b981]" : "bg-white/5"
                            )}
                        />
                    ))}
                </div>

                <div className="px-10 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Estado Histórico #{startIndex + 1} - {Math.min(startIndex + 4, photos.length)}</p>
                    <div className="h-1.5 w-1.5 rounded-full bg-nutrition-500 animate-pulse" />
                </div>
            </CardContent>
        </Card>
    );
}
