"use client";

import { MedicalHistoryForm } from "@/components/dashboard/paciente/medical-history-form";

import { Shield, Sparkles } from "lucide-react";

export default function MedicalHistoryPage() {
    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            {/* Header section with branding */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 w-fit px-4 py-2 rounded-2xl shadow-inner">
                    <Shield className="h-4 w-4 text-nutri-brand" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confidencial y Seguro</span>
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                            Historia <span className="text-nutri-brand">Clínica</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg italic mt-2">
                            Tu primer paso hacia una transformación inteligente.
                        </p>
                    </div>
                    <div className="hidden md:flex h-16 w-16 items-center justify-center bg-white/5 rounded-2xl border border-white/5 shadow-2xl">
                        <Sparkles className="h-8 w-8 text-nutri-brand/40" />
                    </div>
                </div>
            </div>

            {/* The multi-step form */}
            <MedicalHistoryForm />

            {/* Footer note */}
            <div className="text-center opacity-30 mt-12">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">NuySa Nutrición Inteligente © 2026</p>
            </div>
        </div>
    );
}
