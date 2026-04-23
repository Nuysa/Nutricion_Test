"use client";

import React, { useState, useEffect } from 'react';
import { VariablesService } from "@/lib/variables-service";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Trash2, Edit2, Check, Save, Loader2, ArrowLeft, ArrowRight,
    Scale, Droplet, BicepsFlexed, Ruler, Heart, Activity, Flame, Zap,
    Dumbbell, Apple, Carrot, Timer, ActivitySquare, TrendingUp, BarChart2, PieChart, Target, Award,
    ChevronDown, LayoutTemplate, Milestone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    subtitle?: string; // custom subtitle
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
    const [cardSlots, setCardSlots] = useState<any[]>([]);
    const [isDashboardPreviewOpen, setIsDashboardPreviewOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSavingCards, setIsSavingCards] = useState(false);

    const DEFAULT_SLOTS = [
        { id: 's1', slot_index: 0, variable_id: '00000000-0000-0000-0000-00000000000c', icon: 'Scale', color: 'text-nutrition-600', is_active: true },
        { id: 's2', slot_index: 1, variable_id: '00000000-0000-0000-0000-00000000000d', icon: 'Activity', color: 'text-orange-500', is_active: true },
        { id: 's3', slot_index: 2, variable_id: '00000000-0000-0000-0000-00000000000a', icon: 'Ruler', color: 'text-indigo-500', is_active: true },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [layout, vars, slotsData] = await Promise.all([
                VariablesService.getDashboardLayout('paciente_widget'),
                VariablesService.getVariables(),
                VariablesService.getCardSlots('paciente')
            ]);
            setVariables(vars);

            if (slotsData && slotsData.length > 0) {
                const editableSlots = slotsData
                    .filter((s: any) => s.slot_index < 3)
                    .map((s: any) => ({
                        id: s.id,
                        slot_index: s.slot_index,
                        variable_id: s.variable_id,
                        icon: s.icon,
                        color: s.color,
                        is_active: s.is_active
                    }));

                const finalSlots = [...DEFAULT_SLOTS];
                editableSlots.forEach(es => {
                    const idx = finalSlots.findIndex(fs => fs.slot_index === es.slot_index);
                    if (idx !== -1) finalSlots[idx] = es;
                });
                setCardSlots(finalSlots);
            } else {
                setCardSlots(DEFAULT_SLOTS);
            }

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
        measurements: [
            { date: '2026-01-10', weight: 72.1, _computedInputs: { 'GRASA_CORPORAL': 25, 'MASA_MUSCULAR_LEE': 42, 'CINTURA_MINIMA': 88.5 } },
            { date: '2026-02-15', weight: 71.5, _computedInputs: { 'GRASA_CORPORAL': 23, 'MASA_MUSCULAR_LEE': 43, 'CINTURA_MINIMA': 87.0 } },
            { date: '2026-03-04', weight: 71.0, _computedInputs: { 'GRASA_CORPORAL': 21, 'MASA_MUSCULAR_LEE': 45, 'CINTURA_MINIMA': 85.5 } }
        ],
        clinicalVariables: variables || [],
        patientHeight: 170
    };

    return (
        <div className="space-y-8 mt-6">
            <Dialog open={isDashboardPreviewOpen} onOpenChange={setIsDashboardPreviewOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-[1.5rem] h-14 shadow-sm flex items-center justify-center gap-3 backdrop-blur-md transition-all active:scale-[0.98]">
                        <LayoutTemplate className="h-5 w-5 text-nutrition-500" /> Configurar Dashboard Paciente (Tarjetas Resumen)
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[7xl] w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col bg-[#0A0F1C] border-white/10 rounded-[3rem] shadow-2xl">
                    <DialogHeader className="px-8 py-5 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between shrink-0 backdrop-blur-xl">
                        <div>
                            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                                <LayoutTemplate className="h-6 w-6 text-nutrition-500" /> Editor del Dashboard de Pacientes
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1 font-bold">
                                Modifique los elementos visibles del dashboard del paciente. (Solo las "Cards de Resumen" son editables en esta fase).
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setIsDashboardPreviewOpen(false)}
                                variant="outline"
                                className="h-11 px-6 font-black rounded-xl border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-95 bg-transparent"
                            >
                                Cerrar
                            </Button>
                            <Button
                                onClick={async () => {
                                    setIsSavingCards(true);
                                    try {
                                        await VariablesService.saveCardSlots('paciente', cardSlots);
                                        const bc = new BroadcastChannel('nutrigo_global_sync');
                                        bc.postMessage({ type: 'config_updated' });
                                        bc.close();
                                        toast({
                                            title: "Configuración Guardada",
                                            description: "El dashboard de los pacientes ha sido actualizado exitosamente.",
                                            className: "bg-nutrition-600 text-white border-none rounded-2xl",
                                        });
                                    } catch (e: any) {
                                        toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
                                    } finally {
                                        setIsSavingCards(false);
                                    }
                                }}
                                disabled={isSavingCards}
                                className="bg-nutrition-500 hover:bg-nutrition-600 text-white font-black rounded-xl h-11 px-6 shadow-xl shadow-nutrition-500/20 transition-all active:scale-95 border-none"
                            >
                                {isSavingCards ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-8 bg-black/20">
                        {/* SIMULATED DASHBOARD FULL LAYOUT */}
                        <div className="max-w-6xl mx-auto space-y-10">
                            {/* SECTION 1: CARDS (Editable) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-3 w-3 rounded-full bg-nutrition-500 animate-pulse" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sección Editable: Resumen</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                    {cardSlots.slice(0, 3).map((slot, idx) => {
                                        const selectedV = variables.find(v => v.id === slot.variable_id);
                                        const Ico = slot.icon === 'Scale' ? Scale : (slot.icon === 'Ruler' ? Ruler : Activity);
                                        let dummyVal = "—";
                                        let dummyUnit = "";

                                        if (selectedV) {
                                            const code = (selectedV.code || "").toLowerCase();
                                            const name = (selectedV.name || "").toLowerCase();

                                            if (name.includes("género") || name.includes("genero")) {
                                                dummyVal = "Masculino";
                                                dummyUnit = "";
                                            } else if (code.includes("peso") || name.includes("peso")) {
                                                dummyVal = "72.5";
                                                dummyUnit = "kg";
                                            } else if (code.includes("talla") || name.includes("talla")) {
                                                dummyVal = "175";
                                                dummyUnit = "cm";
                                            } else if (code.includes("edad") || name.includes("edad")) {
                                                dummyVal = "32";
                                                dummyUnit = "años";
                                            } else if (code.includes("imc") || name.includes("imc")) {
                                                dummyVal = "23.6";
                                                dummyUnit = "kg/m²";
                                            } else if (code.includes("grasa") || name.includes("grasa")) {
                                                dummyVal = "18.5";
                                                dummyUnit = "%";
                                            } else {
                                                dummyVal = "24";
                                                dummyUnit = (selectedV as any).unit || "";
                                            }
                                        } else {
                                            dummyVal = "—";
                                            dummyUnit = "";
                                        }

                                        return (
                                            <div key={slot.id} className="bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-nutrition-500/50 hover:bg-white/10 relative h-48 backdrop-blur-md">
                                                <div className="p-6 flex flex-col justify-between h-full relative z-10">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-black/20", slot.color.replace('text-', 'bg-').replace('600', '500/20'), slot.color)}>
                                                                <Ico className="h-5 w-5" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right flex-1 ml-4 truncate">
                                                                {selectedV?.name || "(Vacío)"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-black tracking-tight text-white">
                                                                {dummyVal}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-black uppercase">{dummyUnit}</span>
                                                        </div>
                                                    </div>

                                                    {/* Dropdown overlay */}
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center p-6 rounded-[2.5rem] z-20 border border-nutrition-500/30">
                                                        <p className="text-[10px] font-black text-nutrition-400 uppercase tracking-widest mb-2 text-center">Cambiar Variable</p>
                                                        <select
                                                            value={slot.variable_id || ""}
                                                            onChange={e => {
                                                                const val = e.target.value || null;
                                                                setCardSlots(prev => prev.map(s => s.id === slot.id ? { ...s, variable_id: val } : s));
                                                            }}
                                                            className="w-full h-11 rounded-xl border border-white/10 px-3 text-xs font-black uppercase text-white bg-slate-900 shadow-2xl outline-none cursor-pointer focus:ring-4 focus:ring-nutrition-500/20 transition-all"
                                                        >
                                                            <option value="" className="bg-slate-900">(Seleccione Variable)</option>
                                                            {variables.map(v => (
                                                                <option key={v.id} value={v.id} className="bg-slate-900">{v.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Loyalty Card (Static) */}
                                    <div className="bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden flex flex-col opacity-60 h-48 backdrop-blur-md">
                                        <div className="p-6 flex flex-col justify-between h-full">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg bg-sky-500/20 text-sky-400">
                                                        <Milestone className="h-5 w-5" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right flex-1 ml-4 truncate">
                                                        Total Mediciones
                                                    </p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black tracking-tight text-white">1</span>
                                                    <span className="text-[10px] text-slate-500 font-black uppercase">total</span>
                                                </div>
                                            </div>
                                            <div className="mt-6 grid grid-cols-6 gap-1.5">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <div key={i} className={cn("h-3 flex-1 rounded-full", i === 0 ? "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]" : (i === 11 ? "bg-amber-400/50" : "bg-white/5"))} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: BMI GAUGE MOCK (Not Editable Yet) */}
                            <div className="space-y-4 opacity-50 grayscale pointer-events-none">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-slate-500" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">En Próximas Versiones...</h3>
                                </div>
                                <Card className="rounded-[2.5rem] border-white/5 shadow-sm h-72 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                    <div className="text-center">
                                        <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                        <h4 className="text-lg font-black text-slate-600">BMI Gauge & Progreso (No Editable)</h4>
                                    </div>
                                </Card>
                                <div className="grid grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] border-white/5 shadow-sm h-64 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                        <div className="text-center">
                                            <span className="text-lg font-black text-slate-600">Tracking Dashboard</span>
                                        </div>
                                    </Card>
                                    <Card className="rounded-[2.5rem] border-white/5 shadow-sm h-64 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                        <div className="text-center">
                                            <span className="text-lg font-black text-slate-600">Subscription Info</span>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-md">
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
                                            <div className="flex-[2] w-full">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1.5 ml-1">Título Visual</label>
                                                <Input
                                                    placeholder="Ej. Grasa %"
                                                    value={metric.label}
                                                    onChange={e => updateMetric(tIdx, mIdx, { label: e.target.value })}
                                                    className="h-10 text-xs font-black bg-black/20 border-white/5 text-white placeholder:text-slate-800 rounded-xl focus:border-nutrition-500"
                                                    disabled={metric.isSystem && metric.variable_id === 'SYSTEM_DATE'}
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1.5 ml-1">Subtítulo</label>
                                                <Input
                                                    placeholder="Ej. Porcentaje (%)"
                                                    value={metric.subtitle || ''}
                                                    onChange={e => updateMetric(tIdx, mIdx, { subtitle: e.target.value })}
                                                    className="h-10 text-[10px] font-bold bg-black/20 border-white/5 text-slate-400 placeholder:text-slate-800 rounded-xl focus:border-nutrition-500"
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
