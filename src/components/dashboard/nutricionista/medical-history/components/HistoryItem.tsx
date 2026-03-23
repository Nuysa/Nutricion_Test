"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SummaryItem({ label, value, className }: { label: string, value: string, className?: string }) {
    return (
        <div className={cn("space-y-1.5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors", className)}>
            <p className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500">{label}</p>
            <p className="text-slate-200 font-bold text-sm leading-relaxed">{value || 'No registrado'}</p>
        </div>
    );
}

export function EditItem({ label, value, onChange, className, type = "text" }: { label: string, value: any, onChange: (v: any) => void, className?: string, type?: "text" | "number" | "textarea" | "date" | "time" }) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">{label}</Label>
            {type === "textarea" ? (
                <Textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] font-bold focus:ring-nutri-brand/50"
                />
            ) : (
                <Input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold focus:ring-nutri-brand/50"
                />
            )}
        </div>
    );
}
