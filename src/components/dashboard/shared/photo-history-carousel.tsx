import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Camera } from "lucide-react";

interface PhotoHistoryCarouselProps {
    photoHistory: any[];
}

export function PhotoHistoryCarousel({ photoHistory }: PhotoHistoryCarouselProps) {
    if (!photoHistory || photoHistory.length === 0) {
        return (
            <div className="p-10 sm:p-20 text-center bg-white/[0.02] rounded-2xl sm:rounded-[3rem] border border-white/5 border-dashed">
                <Camera className="h-10 sm:h-12 w-10 sm:w-12 text-slate-500/20 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-black text-white/40 uppercase tracking-widest">Sin Registro Visual</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-xs sm:text-sm italic">No hay fotos cargadas aún.</p>
            </div>
        );
    }

    return (
        <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
            <AccordionItem
                value={`item-0`}
                className="border border-white/5 bg-white/[0.02] rounded-2xl sm:rounded-[2rem] px-4 sm:px-8 overflow-hidden transition-all data-[state=open]:bg-white/[0.04] data-[state=open]:border-nutri-brand/20"
            >
                <AccordionTrigger className="hover:no-underline py-4 sm:py-6">
                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[8px] sm:text-[10px] font-black text-nutri-brand uppercase tracking-widest">Última Medición</p>
                            <p className="text-base sm:text-lg font-tech font-black text-white uppercase">
                                {new Date(photoHistory[photoHistory.length - 1].date + 'T12:00:00').toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 sm:pb-8 pt-2 sm:pt-4 px-0 sm:px-0">
                    <div className="flex overflow-x-auto gap-4 sm:gap-8 pb-4 custom-scrollbar snap-x no-scrollbar">
                        {photoHistory.map((group, idx) => (
                            <div key={`${group.date}-${idx}`} className="flex-none w-48 sm:w-64 snap-start space-y-4 sm:space-y-6">
                                <div className="text-center pb-2 sm:pb-4 border-b border-white/10">
                                    <p className="text-xs sm:text-sm font-tech font-black text-white uppercase">
                                        {new Date(group.date + 'T12:00:00').toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    { [
                                        { id: 1, label: "De frente" },
                                        { id: 2, label: "De lado brazo abajo" },
                                        { id: 3, label: "De lado brazo arriba" },
                                        { id: 4, label: "De espalda" }
                                    ].map((type) => (
                                        <div key={type.id} className="space-y-3 sm:space-y-4 group/photo">
                                            <div className="aspect-[3/4] rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 overflow-hidden relative shadow-inner group-hover/photo:border-nutri-brand/30 transition-all duration-500">
                                                {group.photos[type.id] ? (
                                                    <img
                                                        src={group.photos[type.id]}
                                                        alt={type.label}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3 text-slate-600 grayscale opacity-20 group-hover/photo:opacity-40 transition-opacity">
                                                        <Camera className="h-8 sm:h-12 w-8 sm:w-12" />
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center">Sin Imagen</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-white/5 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 opacity-0 transform translate-y-2 group-hover/photo:opacity-100 group-hover/photo:translate-y-0 transition-all duration-500">
                                                    <p className="text-[7px] sm:text-[9px] font-black text-white uppercase tracking-tighter text-center">{type.label}</p>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] group-hover/photo:text-nutri-brand transition-colors italic">{type.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
