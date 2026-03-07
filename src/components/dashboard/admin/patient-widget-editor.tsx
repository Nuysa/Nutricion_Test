"use client";

import React, { useState, useEffect } from 'react';
import { VariablesService } from "@/lib/variables-service";
import { useToast } from "@/hooks/use-toast";
import {
    Plus, Trash2, Edit2, Check, Save, Loader2, ArrowLeft, ArrowRight,
    Scale, Droplet, BicepsFlexed, Ruler, Heart, Activity, Flame, Zap,
    Dumbbell, Apple, Carrot, Timer, ActivitySquare, TrendingUp, BarChart2, PieChart, Target, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
            name: 'Nueva Etiqueta',
            icon: 'Activity',
            btnColor: '#3b82f6',
            cardBgColor: '#ffffff',
            lineColor: '#64748b',
            metrics: []
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

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" onClick={addTab} className="rounded-xl border-dashed border-2 bg-slate-50"><Plus className="mr-2 h-4 w-4" /> Añadir Pestaña</Button>
                <div className="flex gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-slate-200">Previsualizar Widget</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none overflow-visible">
                            <PatientHistoryCharts {...dummyProps} />
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white rounded-xl">
                        {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Widget
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {tabs.map((tab, tIdx) => (
                    <Card key={tab.id} className="rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-6 flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3 space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400">Nombre de la Pestaña</label>
                                    <Input value={tab.name} onChange={e => updateTab(tIdx, { name: e.target.value })} className="font-bold bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400">Icono</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(AVAILABLE_ICONS).map(([iconName, IconComponent]) => (
                                            <button
                                                key={iconName}
                                                onClick={() => updateTab(tIdx, { icon: iconName })}
                                                title={iconName}
                                                className={`p-2.5 rounded-xl transition-all border ${tab.icon === iconName ? 'bg-nutrition-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-200'}`}
                                            >
                                                <IconComponent className="h-5 w-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex-1">
                                        <label className="text-xs font-black text-slate-400">Color Ícono/Botón</label>
                                        <div className="flex gap-3 items-center mt-1">
                                            <div className="relative">
                                                <input type="color" className="h-10 w-10 cursor-pointer rounded-full opacity-0 absolute inset-0" value={tab.btnColor} onChange={e => updateTab(tIdx, { btnColor: e.target.value })} />
                                                <div className="h-10 w-10 rounded-full border-2 border-slate-200 pointer-events-none shadow-sm" style={{ backgroundColor: tab.btnColor }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{tab.btnColor}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-black text-slate-400">Fondo Tarjeta</label>
                                        <div className="flex gap-3 items-center mt-1">
                                            <div className="relative">
                                                <input type="color" className="h-10 w-10 cursor-pointer rounded-full opacity-0 absolute inset-0" value={tab.cardBgColor} onChange={e => updateTab(tIdx, { cardBgColor: e.target.value })} />
                                                <div className="h-10 w-10 rounded-full border-2 border-slate-200 pointer-events-none shadow-sm" style={{ backgroundColor: tab.cardBgColor }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{tab.cardBgColor}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-black text-slate-400">Color Línea Curva</label>
                                        <div className="flex gap-3 items-center mt-1">
                                            <div className="relative">
                                                <input type="color" className="h-10 w-10 cursor-pointer rounded-full opacity-0 absolute inset-0" value={tab.lineColor} onChange={e => updateTab(tIdx, { lineColor: e.target.value })} />
                                                <div className="h-10 w-10 rounded-full border-2 border-slate-200 pointer-events-none shadow-sm" style={{ backgroundColor: tab.lineColor }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{tab.lineColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => removeTab(tIdx)} className="w-full mt-4"><Trash2 className="h-4 w-4 mr-2" /> Eliminar Pestaña</Button>
                            </div>

                            <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-inner border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-slate-700">Métricas Vinculadas (Tarjetas)</h4>
                                    <Button size="sm" variant="outline" onClick={() => addMetric(tIdx)} className="rounded-xl"><Plus className="mr-2 h-3 w-3" /> Añadir Métrica</Button>
                                </div>

                                <div className="space-y-3">
                                    {tab.metrics.map((metric, mIdx) => (
                                        <div key={metric.id} className={`flex gap-3 items-center p-3 rounded-xl border ${metric.isSystem ? 'bg-slate-100 border-slate-200 opacity-80' : 'bg-slate-50'}`}>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Título (ej. Grasa %)"
                                                    value={metric.label}
                                                    onChange={e => updateMetric(tIdx, mIdx, { label: e.target.value })}
                                                    className="text-sm font-bold h-8 bg-white"
                                                    disabled={metric.isSystem && metric.variable_id === 'SYSTEM_DATE'}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    disabled={metric.isSystem}
                                                    value={metric.variable_id}
                                                    onChange={e => updateMetric(tIdx, mIdx, { variable_id: e.target.value })}
                                                    className="w-full p-2 h-8 text-xs font-bold rounded-lg border bg-white text-slate-700 disabled:opacity-50"
                                                >
                                                    {metric.isSystem && <option value={metric.variable_id}>[Variable de Sistema]</option>}
                                                    {!metric.isSystem && <option value="">Selecciona Variable</option>}
                                                    {variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                </select>
                                            </div>
                                            {!metric.isSystem && (
                                                <Button variant="ghost" size="icon" onClick={() => removeMetric(tIdx, mIdx)} className="text-red-400 pointer"><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    ))}
                                    {tab.metrics.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay variables vinculadas en esta pestaña.</p>}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
