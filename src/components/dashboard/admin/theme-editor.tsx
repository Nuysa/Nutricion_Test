"use client";

import { useVisualEditor } from "./visual-editor-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Save, Palette, RefreshCw } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ThemeEditor({ onClose }: { onClose: () => void }) {
    const { theme, setTheme } = useVisualEditor();
    const [localTheme, setLocalTheme] = useState(theme);
    const [saving, setSaving] = useState(false);

    const handleColorChange = (key: keyof typeof theme, value: string) => {
        const newTheme = { ...localTheme, [key]: value };
        setLocalTheme(newTheme);
        setTheme(newTheme); // Apply in real-time
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('landing_content')
                .upsert({ section: 'theme', content: localTheme }, { onConflict: 'section' });

            if (error) throw error;
            onClose();
        } catch (error) {
            console.error("Error saving theme:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed top-24 right-80 z-[110] w-72 bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-nutri-brand" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Estilos Globales</h3>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Color de Marca (Naranja)</label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            className="w-12 h-10 p-1 rounded-lg bg-transparent border-white/10"
                            value={localTheme.brand}
                            onChange={(e) => handleColorChange('brand', e.target.value)}
                        />
                        <Input
                            className="bg-transparent border-white/10 font-tech text-xs"
                            value={localTheme.brand}
                            onChange={(e) => handleColorChange('brand', e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Fondo Principal (Base)</label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            className="w-12 h-10 p-1 rounded-lg bg-transparent border-white/10"
                            value={localTheme.base}
                            onChange={(e) => handleColorChange('base', e.target.value)}
                        />
                        <Input
                            className="bg-transparent border-white/10 font-tech text-xs"
                            value={localTheme.base}
                            onChange={(e) => handleColorChange('base', e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Color de Paneles</label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            className="w-12 h-10 p-1 rounded-lg bg-transparent border-white/10"
                            value={localTheme.panel}
                            onChange={(e) => handleColorChange('panel', e.target.value)}
                        />
                        <Input
                            className="bg-transparent border-white/10 font-tech text-xs"
                            value={localTheme.panel}
                            onChange={(e) => handleColorChange('panel', e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-nutri-brand text-nutri-base font-black rounded-2xl h-12"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
}
