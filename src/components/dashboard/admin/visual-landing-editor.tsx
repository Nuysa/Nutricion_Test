"use client";

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingServices } from "@/components/landing/landing-services";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PlansSection } from "@/components/landing/plans-section";
import { VisualEditorProvider, useVisualEditor } from "./visual-editor-context";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Eye, EyeOff, LayoutTemplate, Palette, GripVertical, ChevronRight, Minimize2, Maximize2 } from "lucide-react";
import { ThemeEditor } from "./theme-editor";
import { cn } from "@/lib/utils";

function VisualLandingEditorContent() {
    const { isEditable, setEditable } = useVisualEditor();
    const [showThemeEditor, setShowThemeEditor] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Offset from initial fixed pos
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setEditable(true);
    }, [setEditable]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    return (
        <div className="relative min-h-screen bg-nutri-base text-slate-200 selection:bg-nutri-brand selection:text-nutri-base overflow-x-hidden">
            {/* Admin Toolbar - Draggable */}
            <div
                className={cn(
                    "fixed z-[100] transition-all duration-300",
                    isDragging ? "select-none" : ""
                )}
                style={{
                    top: `calc(6rem + ${position.y}px)`,
                    right: `calc(2rem - ${position.x}px)`,
                }}
            >
                <div className={cn(
                    "bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden",
                    isMinimized ? "rounded-full p-2 w-12 h-12 flex items-center justify-center" : "rounded-[2.5rem] p-4 flex flex-col gap-3 min-w-[240px]"
                )}>
                    {isMinimized ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMinimized(false)}
                            className="h-8 w-8 rounded-full bg-nutri-brand text-nutri-base hover:bg-nutri-brand/80"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <>
                            <div
                                onMouseDown={handleMouseDown}
                                className="flex items-center justify-between gap-3 px-2 pb-1 border-b border-white/5 cursor-move group/drag"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Editor Visual</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMinimized(true)}
                                        className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-500"
                                    >
                                        <Minimize2 className="h-3 w-3" />
                                    </Button>
                                    <GripVertical className="h-4 w-4 text-slate-600 group-hover/drag:text-slate-300 transition-colors" />
                                </div>
                            </div>

                            <Button
                                onClick={() => setEditable(!isEditable)}
                                className={cn(
                                    "rounded-2xl font-black h-12 px-6 transition-all",
                                    isEditable ? "bg-nutri-brand text-nutri-base" : "bg-slate-800 text-white"
                                )}
                            >
                                {isEditable ? <><Eye className="h-4 w-4 mr-2" /> Ver Vista Previa</> : <><EyeOff className="h-4 w-4 mr-2" /> Volver a Editar</>}
                            </Button>

                            <Button
                                onClick={() => setShowThemeEditor(!showThemeEditor)}
                                className={cn(
                                    "rounded-2xl font-black h-12 px-6 transition-all",
                                    showThemeEditor ? "bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-slate-800/80 text-white border border-white/10 hover:bg-slate-700"
                                )}
                            >
                                <Palette className="h-4 w-4 mr-2" /> Estilos Globales
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {showThemeEditor && <ThemeEditor onClose={() => setShowThemeEditor(false)} />}

            {/* Editor Help Tooltip */}
            {isEditable && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-nutri-brand text-nutri-base px-6 py-3 rounded-full font-black text-sm shadow-2xl animate-bounce">
                    Haz clic en los iconos de lápiz para editar el contenido en tiempo real
                </div>
            )}

            {/* The Landing Page Content - Contained within the editor section */}
            <div className={`relative ${isEditable ? "cursor-default" : ""} transition-all duration-500 transform-gpu`}>
                <LandingNavbar />
                <div className="relative z-10 w-full pt-10">
                    <LandingHero />
                    <LandingAbout />
                    <LandingServices />
                    <PlansSection />
                    <LandingTestimonials />
                    <LandingFooter />
                </div>
            </div>

            {/* Ambient Background Lights */}
            <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-nutri-brand/10 blur-[130px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-nutri-brand/5 blur-[150px] pointer-events-none z-0"></div>
        </div>
    );
}

export function VisualLandingEditor() {
    return (
        <VisualEditorProvider>
            <VisualLandingEditorContent />
        </VisualEditorProvider>
    );
}
