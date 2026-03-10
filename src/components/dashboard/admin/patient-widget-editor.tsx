"use client";

import React, { useState, useEffect } from 'react';
import { VariablesService } from "@/lib/variables-service";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Trash2, Edit2, Check, Save, Loader2, ArrowLeft, ArrowRight,
    Scale, Droplet, BicepsFlexed, Ruler, Heart, Activity, Flame, Zap,
    Dumbbell, Apple, Carrot, Timer, ActivitySquare, TrendingUp, BarChart2, PieChart, Target, Award,
    ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PatientHistoryCharts } from "../paciente/PatientHistoryCharts";

const AVAILABLE_ICONS: Record<string, any> = {
    Scale,
    Droplet,
    BicepsFlexed,
    Ruler,
    Heart,
    Activity,
    Flame,
    Zap,
    Dumbbell,
    Apple,
    Carrot,
    Timer,
    ActivitySquare,
    TrendingUp,
    BarChart2,
    PieChart,
    Target,
    Award
};

export interface WidgetMetric {
    id: string; // custom id
    label: string; // custom label
    variable_id: string; // which clinical variable
    isSystem?: boolean;
}

export interface WidgetTabConfig {
    id: string;
    name: string;
    icon: string;
    btnColor: string; // e.g., 'white'
    cardBgColor: string; // e.g., 'white/50'
    lineColor: string; // hex
    metrics: WidgetMetric[];
}

export function PatientWidgetEditor() {
    const { toast } = useToast();
    const [tabs, setTabs] = useState<WidgetTabConfig[]>([]);
    const [variables, setVariables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [layout, vars] = await Promise.all([
                VariablesService.getDashboardLayout('paciente_widget'),
                VariablesService.getVariables()
            ]);
            setVariables(vars);

            if (layout && layout.columns && layout.columns.length > 0) {
                setTabs(layout.columns);
            } else {
                const pesoId = vars.find((v: any) => v.name.toLowerCase().includes('peso'))?.id || '';
                const imcId = vars.find((v: any) => v.name.toLowerCase().includes('imc'))?.id || '';
                const grasaPctId = vars.find((v: any) => v.name.toLowerCase().includes('grasa'))?.id || '';
                const musculoPctId = vars.find((v: any) => v.name.toLowerCase().includes('lee') || v.name.toLowerCase().includes('músculo') || v.name.toLowerCase().includes('musculo'))?.id || '';
                const cinturaId = vars.find((v: any) => v.name.toLowerCase().includes('cintura'))?.id || '';

                // Default setup based on what we had
                setTabs([
                    {
                        id: 't1', name: 'Peso', icon: 'Scale', btnColor: '#16a34a', cardBgColor: '#ffffff', lineColor: '#16a34a',
                        metrics: [
                            { id: 'm0-1', label: 'Fecha', variable_id: 'SYSTEM_DATE', isSystem: true },
                            { id: 'm1', label: 'Peso', variable_id: pesoId },
                            { id: 'm2', label: 'IMC', variable_id: imcId }
                        ]
                    },
                    {
                        id: 't2', name: 'Grasa', icon: 'Droplet', btnColor: '#3b82f6', cardBgColor: '#ffffff', lineColor: '#3b82f6',
                        metrics: [
                            { id: 'm0-2', label: 'Fecha', variable_id: 'SYSTEM_DATE', isSystem: true },
                            { id: 'm3', label: 'Grasa (%)', variable_id: grasaPctId },
                            { id: 'm4', label: 'Grasa corporal (kg)', variable_id: 'SYSTEM_CALC_FAT_KG', isSystem: true },
                            { id: 'm_diff_fat', label: 'Diferencia de grasa', variable_id: 'SYSTEM_DIFF_FAT', isSystem: true },
                            { id: 'm_diag_fat', label: 'Diagnóstico (Suma Pliegues)', variable_id: grasaPctId, isSystem: true }
                        ]
                    },
                    {
                        id: 't3', name: 'Músculo', icon: 'BicepsFlexed', btnColor: '#ef4444', cardBgColor: '#ffffff', lineColor: '#ef4444',
                        metrics: [
                            { id: 'm0-3', label: 'Fecha', variable_id: 'SYSTEM_DATE', isSystem: true },
                            { id: 'm5', label: 'Músculo Lee (%)', variable_id: musculoPctId },
                            { id: 'm6', label: 'Masa muscular Lee (kg)', variable_id: 'SYSTEM_CALC_MUSCLE_KG', isSystem: true },
                            { id: 'm_diff_muscle', label: 'Diferencia de músculo', variable_id: 'SYSTEM_DIFF_MUSCLE', isSystem: true },
                            { id: 'm_diag_muscle', label: 'Diagnóstico (Músculo Lee)', variable_id: musculoPctId, isSystem: true }
                        ]
                    },
                    {
                        id: 't4', name: 'Cintura', icon: 'Ruler', btnColor: '#a855f7', cardBgColor: '#ffffff', lineColor: '#a855f7',
                        metrics: [
                            { id: 'm0-4', label: 'Fecha', variable_id: 'SYSTEM_DATE', isSystem: true },
                            { id: 'm7', label: 'Cintura mínima (cm)', variable_id: cinturaId },
                            { id: 'm8', label: 'Diagnóstico (Cintura)', variable_id: cinturaId, isSystem: true }
                        ]
                    },
                ]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // we save the array of tabs into the columns property of the layout
            await VariablesService.saveDashboardLayout('paciente_widget', tabs as any[]);
            toast({ title: 'Configuración guardada.', variant: 'success' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const addTab = () => {
        setTabs([...tabs, {
            id: 't_' + Math.random().toString(36).substr(2, 6),
            name: 'Nueva Categoría',
            icon: 'Activity',
            btnColor: '#3b82f6',
            cardBgColor: '#ffffff',
            lineColor: '#64748b',
            metrics: [
                { id: 'm_date_' + Math.random().toString(36).substr(2, 6), label: 'Fecha', variable_id: 'SYSTEM_DATE', isSystem: true }
            ]
        }]);
    };

    const updateTab = (index: number, changes: Partial<WidgetTabConfig>) => {
        const t = [...tabs];
        t[index] = { ...t[index], ...changes };
        setTabs(t);
    };

    const removeTab = (index: number) => {
        setTabs(tabs.filter((_, i) => i !== index));
    };

    const addMetric = (tabIndex: number) => {
        const t = [...tabs];
        t[tabIndex].metrics.push({
            id: 'm_' + Math.random().toString(36).substr(2, 6),
            label: 'Nueva Métrica',
            variable_id: ''
        });
        setTabs(t);
    };

    const updateMetric = (tabIndex: number, metricIndex: number, changes: Partial<WidgetMetric>) => {
        const t = [...tabs];
        t[tabIndex].metrics[metricIndex] = { ...t[tabIndex].metrics[metricIndex], ...changes };
        setTabs(t);
    };

    const removeMetric = (tabIndex: number, metricIndex: number) => {
        const t = [...tabs];
        t[tabIndex].metrics = t[tabIndex].metrics.filter((_, i) => i !== metricIndex);
        setTabs(t);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin h-10 w-10 text-nutrition-500" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cargando Entorno de Configuración...</p>
        </div>
    );

    const dummyProps = {
        fechasHistorial: ['10 Ene', '15 Feb', '04 Mar'],
        pesoData: [72.1, 71.5, 71.0], imcData: [26.1, 25.8, 25.4],
        grasaPctData: [25, 23, 21], grasaKgData: [18, 16.4, 14.9],
        etiquetasDiagnosticoGrasa: ['Sobrepeso', 'Exceso Leve', 'Normal'], diffGrasaData: [0, -1.6, -1.5],
        musculoPctData: [42, 43, 45], musculoKgData: [30.2, 30.7, 31.9],
        etiquetasDiagnosticoMusculo: ['Bajo', 'Normal', 'Normal'], diffMusculoData: [0, 0.5, 1.2],
        cinturaCmData: [88.5, 87.0, 85.5], etiquetasDiagnosticoCintura: ['Riesgo Alto', 'Riesgo Moderado', 'Normal']
    };

    return (
        <div className="space-y-8 p-8 bg-[#151F32]/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-white/5 pb-8">
                <Button
                    variant="outline"
                    onClick={addTab}
                    className="rounded-2xl border-dashed border-2 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-nutrition-500 transition-all font-black text-xs uppercase tracking-widest h-12 px-8"
                >
                    <Plus className="mr-3 h-4 w-4 text-nutrition-500" /> Añadir Nueva Categoría
                </Button>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-all font-black text-xs uppercase tracking-widest px-8">
                                <Activity className="mr-3 h-4 w-4" /> Previsualizar Widget
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none overflow-visible">
                            <PatientHistoryCharts {...dummyProps} />
                        </DialogContent>
                    </Dialog>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 md:flex-none h-12 rounded-2xl bg-nutrition-500 hover:bg-nutrition-600 text-white font-black text-xs uppercase tracking-widest px-10 shadow-lg shadow-nutrition-500/20 transition-all"
                    >
                        {saving ? <Loader2 className="animate-spin mr-3 h-4 w-4" /> : <Save className="mr-3 h-4 w-4" />}
                        Sincronizar Widget
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {tabs.map((tab, tIdx) => (
                    <Card key={tab.id} className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] shadow-2xl overflow-hidden group hover:border-white/10 transition-all">
                        <div className="flex flex-col lg:flex-row">
                            {/* Left: Settings Panel */}
                            <div className="w-full lg:w-[40%] p-8 bg-white/[0.02] border-r border-white/5 space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Etiqueta de Navegación</label>
                                        <Input
                                            value={tab.name}
                                            onChange={e => updateTab(tIdx, { name: e.target.value })}
                                            className="h-12 rounded-xl bg-white/5 border-white/5 font-black text-white focus:border-nutrition-500 transition-all px-5"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Iconografía del Sistema</label>
                                        <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-6 gap-2 p-4 bg-black/20 rounded-2xl border border-white/5">
                                            {Object.entries(AVAILABLE_ICONS).map(([iconName, IconComponent]) => (
                                                <button
                                                    key={iconName}
                                                    onClick={() => updateTab(tIdx, { icon: iconName })}
                                                    title={iconName}
                                                    className={cn(
                                                        "p-3 rounded-xl transition-all flex items-center justify-center",
                                                        tab.icon === iconName
                                                            ? "bg-nutrition-500 text-white shadow-xl shadow-nutrition-500/20 scale-110"
                                                            : "text-slate-600 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    <IconComponent className="h-5 w-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-3 text-center">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Accento</label>
                                            <div className="relative inline-block group/color">
                                                <input type="color" className="h-12 w-12 cursor-pointer rounded-2xl opacity-0 absolute inset-0 z-10" value={tab.btnColor} onChange={e => updateTab(tIdx, { btnColor: e.target.value })} />
                                                <div className="h-12 w-12 rounded-2xl border-4 border-white/10 shadow-xl group-hover/color:scale-110 transition-transform" style={{ backgroundColor: tab.btnColor }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Fondo</label>
                                            <div className="relative inline-block group/color">
                                                <input type="color" className="h-12 w-12 cursor-pointer rounded-2xl opacity-0 absolute inset-0 z-10" value={tab.cardBgColor} onChange={e => updateTab(tIdx, { cardBgColor: e.target.value })} />
                                                <div className="h-12 w-12 rounded-2xl border-4 border-white/10 shadow-xl group-hover/color:scale-110 transition-transform" style={{ backgroundColor: tab.cardBgColor }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Línea</label>
                                            <div className="relative inline-block group/color">
                                                <input type="color" className="h-12 w-12 cursor-pointer rounded-2xl opacity-0 absolute inset-0 z-10" value={tab.lineColor} onChange={e => updateTab(tIdx, { lineColor: e.target.value })} />
                                                <div className="h-12 w-12 rounded-2xl border-4 border-white/10 shadow-xl group-hover/color:scale-110 transition-transform" style={{ backgroundColor: tab.lineColor }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTab(tIdx)}
                                    className="w-full h-12 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <Trash2 className="h-4 w-4 mr-3" /> Eliminar Categoría
                                </Button>
                            </div>

                            {/* Right: Metrics Panel */}
                            <div className="w-full lg:w-[60%] p-8 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-8 bg-nutrition-500" />
                                        <h4 className="font-black text-white uppercase italic tracking-tighter">Métricas Vinculadas</h4>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addMetric(tIdx)}
                                        className="h-10 rounded-xl border-white/10 bg-white/5 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest px-5"
                                    >
                                        <Plus className="mr-2 h-3.5 w-3.5" /> Añadir Tarjeta
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {tab.metrics.map((metric, mIdx) => (
                                        <div
                                            key={metric.id}
                                            className={cn(
                                                "flex flex-col sm:flex-row gap-4 items-center p-5 rounded-[1.5rem] border transition-all",
                                                metric.isSystem
                                                    ? "bg-white/[0.01] border-white/5 opacity-60"
                                                    : "bg-white/[0.04] border-white/5 hover:border-white/10 shadow-xl"
                                            )}
                                        >
                                            <div className="flex-1 w-full">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1.5 ml-1">Título Visual</label>
                                                <Input
                                                    placeholder="Ej. Grasa %"
                                                    value={metric.label}
                                                    onChange={e => updateMetric(tIdx, mIdx, { label: e.target.value })}
                                                    className="h-10 text-sm font-black bg-black/20 border-white/5 text-white placeholder:text-slate-800 rounded-xl focus:border-nutrition-500"
                                                    disabled={metric.isSystem && metric.variable_id === 'SYSTEM_DATE'}
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1.5 ml-1">Origen de Datos</label>
                                                <div className="relative group/select">
                                                    <select
                                                        disabled={metric.variable_id === 'SYSTEM_DATE'}
                                                        value={metric.variable_id}
                                                        onChange={e => updateMetric(tIdx, mIdx, { variable_id: e.target.value, isSystem: false })}
                                                        className="w-full h-10 appearance-none bg-black/20 border border-white/5 rounded-xl px-4 text-[11px] font-black text-white focus:border-nutrition-500 outline-none transition-all disabled:opacity-50"
                                                    >
                                                        {metric.variable_id === 'SYSTEM_DATE' && <option value="SYSTEM_DATE">[VARIABLE DE SISTEMA]</option>}
                                                        {metric.variable_id !== 'SYSTEM_DATE' && <option value="">SELECCIONAR VARIABLE...</option>}
                                                        {variables.map(v => <option key={v.id} value={v.id} className="bg-[#151F32]">{v.name.toUpperCase()}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 pointer-events-none group-hover/select:text-white transition-colors" />
                                                </div>
                                            </div>
                                            {metric.variable_id !== 'SYSTEM_DATE' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeMetric(tIdx, mIdx)}
                                                    className="text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl mt-4 sm:mt-0"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {tab.metrics.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                                            <ActivitySquare className="h-10 w-10 text-slate-800 mx-auto mb-4 opacity-20" />
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No hay tarjetas configuradas en este bloque.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
