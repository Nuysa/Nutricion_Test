"use client";

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import {
    Scale, Droplet, BicepsFlexed, Ruler, Heart, Activity, Flame, Zap,
    Dumbbell, Apple, Carrot, Timer, ActivitySquare, TrendingUp, BarChart2, PieChart, Target, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VariablesService } from "@/lib/variables-service";

const AVAILABLE_ICONS: Record<string, any> = {
    Scale, Droplet, BicepsFlexed, Ruler, Heart, Activity, Flame, Zap,
    Dumbbell, Apple, Carrot, Timer, ActivitySquare, TrendingUp, BarChart2, PieChart, Target, Award
};

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface PatientHistoryChartsProps {
    fechasHistorial: string[];
    measurements: any[];
    clinicalVariables: any[];
    patientHeight?: number;
    patientGender?: string;
    patientAge?: number;
}

export function PatientHistoryCharts({
    fechasHistorial = [],
    measurements = [],
    clinicalVariables = [],
    patientHeight = 170,
    patientGender = 'femenino',
    patientAge = 30
}: PatientHistoryChartsProps) {
    const [activeTab, setActiveTab] = useState<string>('peso');
    const [tabConfigs, setTabConfigs] = useState<any[]>([]);

    useEffect(() => {
        VariablesService.getDashboardLayout('paciente_widget').then(layout => {
            if (layout && layout.columns) {
                setTabConfigs(layout.columns);
                if (layout.columns.length > 0) setActiveTab(layout.columns[0].id || layout.columns[0].name.toLowerCase());
            }
        }).catch(console.error);
    }, []);

    // IMPORTANTE: measurements viene [NUEVO -> ANTIGUO] o [ANTIGUO -> NUEVO]?
    // El TrackingDashboard hace un reverse() antes de pasar los arrays.
    // Nosotros necesitamos [ANTIGUO -> NUEVO] para la gráfica.
    // Asumiremos que el padre pasa 'measurements' tal cual vienen de la BD [NUEVO -> ANTIGUO].
    // Mejoramos la ordenación cronológica para que sea robusta
    const chronoMeasurements = React.useMemo(() => {
        if (!measurements || measurements.length === 0) return [];
        
        // Creamos una copia y ordenamos por fecha ascendente [ANTIGUO -> NUEVO]
        return [...measurements].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            // Si las fechas son inválidas (NaN), comparamos los strings como fallback
            if (isNaN(dateA) || isNaN(dateB)) return a.date.localeCompare(b.date);
            return dateA - dateB;
        });
    }, [measurements]);

    const renderFechas = fechasHistorial;
    const totalSlots = renderFechas.length;

    /**
     * Extrae tanto el valor numérico (para la línea) como el texto (para etiquetas/diagnósticos)
     */
    const getMetricData = (metric: any) => {
        const { variable_id, isSystem, label } = metric;
        const values: number[] = [];
        const labels: string[] = [];
        
        // Búsqueda "Ultra-Fuzzy" para encontrar la variable (ID, Código o Nombre)
        const normalize = (s: string) => s?.toUpperCase().replace(/[\s_-]/g, '') || '';
        const targetNorm = normalize(variable_id);
        
        const v = clinicalVariables.find(cv => 
            cv.id === variable_id || 
            normalize(cv.code) === targetNorm || 
            normalize(cv.name) === targetNorm
        );

        chronoMeasurements.forEach((m, idx) => {
            let val: any = null;
            let textLabel: string | null = null;

            const isDiffGrasa = label && label.toLowerCase().includes('diferencia de grasa');
            const isDiffMusculo = label && (label.toLowerCase().includes('diferencia de músculo') || label.toLowerCase().includes('diferencia de musculo'));

            // 1. Caso Variables de Sistema o Diferencias
            if (isSystem || (variable_id && variable_id.startsWith('SYSTEM_')) || isDiffGrasa || isDiffMusculo) {
                if (variable_id === 'SYSTEM_IMC' || (label && label.toUpperCase() === 'IMC')) {
                    const w = parseFloat(m.weight || m._rawSource?.weight) || 0;
                    val = w > 0 ? parseFloat((w / ((patientHeight / 100) * (patientHeight / 100))).toFixed(2)) : 0;
                } else if (variable_id === 'SYSTEM_CALC_FAT_KG' || (label && label.toLowerCase().includes('grasa corporal (kg)'))) {
                    const w = parseFloat(m.weight || m._rawSource?.weight) || 0;
                    const pct = parseFloat(m._computedInputs?.['GRASA_CORPORAL'] || m._computedInputs?.['GRASA'] || m.body_fat_percentage) || 0;
                    val = parseFloat((w * (pct / 100)).toFixed(2));
                } else if (variable_id === 'SYSTEM_CALC_MUSCLE_KG' || (label && label.toLowerCase().includes('masa muscular lee (kg)'))) {
                    const w = parseFloat(m.weight || m._rawSource?.weight) || 0;
                    const pct = parseFloat(m._computedInputs?.['MASA_MUSCULAR_LEE'] || m._computedInputs?.['MUSCULO']) || 0;
                    val = parseFloat((w * (pct / 100)).toFixed(2));
                } else if (label && label.toLowerCase().includes('diferencia de grasa')) {
                    if (idx === 0) {
                        val = 0;
                    } else {
                        const mPrev = chronoMeasurements[idx - 1];
                        
                        const wCurr = parseFloat(m.weight || m._rawSource?.weight) || 0;
                        const pctCurr = parseFloat(m._computedInputs?.['GRASA_CORPORAL'] || m._computedInputs?.['GRASA'] || m.body_fat_percentage) || 0;
                        const currFat = wCurr * (pctCurr / 100);

                        const wPrev = parseFloat(mPrev.weight || mPrev._rawSource?.weight) || 0;
                        const pctPrev = parseFloat(mPrev._computedInputs?.['GRASA_CORPORAL'] || mPrev._computedInputs?.['GRASA'] || mPrev.body_fat_percentage) || 0;
                        const prevFat = wPrev * (pctPrev / 100);

                        val = parseFloat((currFat - prevFat).toFixed(2));
                    }
                } else if (label && (label.toLowerCase().includes('diferencia de músculo') || label.toLowerCase().includes('diferencia de musculo'))) {
                    if (idx === 0) {
                        val = 0;
                    } else {
                        const mPrev = chronoMeasurements[idx - 1];
                        
                        const wCurr = parseFloat(m.weight || m._rawSource?.weight) || 0;
                        const pctCurr = parseFloat(m._computedInputs?.['MASA_MUSCULAR_LEE'] || m._computedInputs?.['MUSCULO']) || 0;
                        const currMusc = wCurr * (pctCurr / 100);

                        const wPrev = parseFloat(mPrev.weight || mPrev._rawSource?.weight) || 0;
                        const pctPrev = parseFloat(mPrev._computedInputs?.['MASA_MUSCULAR_LEE'] || mPrev._computedInputs?.['MUSCULO']) || 0;
                        const prevMusc = wPrev * (pctPrev / 100);

                        val = parseFloat((currMusc - prevMusc).toFixed(2));
                    }
                }
            } else {
                // 2. Caso Variable Clínica Específica
                // Generamos todos los códigos posibles para buscar en _computedInputs
                const possibleCodes = v ? [v.code, v.name, v.id] : [variable_id];
                
                // Prioridad 0: Si el ID de la variable mapeada es directamente una columna nativa
                if (variable_id === 'body_fat_percentage' || variable_id === 'grasa') {
                    const natVal = parseFloat(m.body_fat_percentage || m._rawSource?.body_fat_percentage);
                    if (!isNaN(natVal)) {
                        labels.push("");
                        dataPoints.push(natVal);
                        return;
                    }
                } else if (variable_id === 'weight' || variable_id === 'peso') {
                    const natVal = parseFloat(m.weight || m._rawSource?.weight);
                    if (!isNaN(natVal)) {
                        labels.push("");
                        dataPoints.push(natVal);
                        return;
                    }
                } else if (variable_id === 'waist_circumference_cm' || variable_id === 'cintura') {
                    const natVal = parseFloat(m.waist_circumference_cm || m._rawSource?.waist_circumference_cm);
                    if (!isNaN(natVal)) {
                        labels.push("");
                        dataPoints.push(natVal);
                        return;
                    }
                }

                for (const code of possibleCodes) {
                    if (!code) continue;
                    const codeUpper = code.toUpperCase();
                    const codeNorm = normalize(code);

                    // Prioridad Única: Buscar en _computedInputs por CUALQUIER variante del código
                    // _computedInputs ya contiene los campos nativos, extra_data y resultados de fórmulas.
                    const computedKey = Object.keys(m._computedInputs || {}).find(k => k === codeUpper || normalize(k) === codeNorm);
                    const computed = computedKey ? m._computedInputs[computedKey] : undefined;

                    if (computed !== undefined && computed !== null) {
                        // Leemos la etiqueta si TrackingDashboard la guardó desde el rango
                        const computedLabel = computedKey ? m._computedInputs[`${computedKey}_LABEL`] : undefined;
                        
                        if (computedLabel) {
                            textLabel = computedLabel;
                            val = parseFloat(computed) || 0;
                        } else if (typeof computed === 'string' && isNaN(parseFloat(computed))) {
                            textLabel = computed;
                            // Fallback numérico para que la gráfica no sea plana en 0
                            if (codeNorm.includes('CINTURA')) val = parseFloat(m.waist_circumference_cm || m._rawSource?.waist_circumference_cm) || 0;
                            else if (codeNorm.includes('GRASA')) val = parseFloat(m.body_fat_percentage || m._rawSource?.body_fat_percentage) || 0;
                            else if (codeNorm.includes('PESO')) val = parseFloat(m.weight || m._rawSource?.weight) || 0;
                            else val = 0;
                        } else {
                            val = parseFloat(computed);
                        }
                        break;
                    }

                    // Prioridad 3: extra_data
                    let parsedExtra = m.extra_data || {};
                    if (typeof m.extra_data === 'string') {
                        try {
                            parsedExtra = JSON.parse(m.extra_data);
                        } catch (e) {
                            parsedExtra = {};
                        }
                    }

                    const extraKey = Object.keys(parsedExtra).find(k => k === codeUpper || normalize(k) === codeNorm);
                    const extra = extraKey ? parsedExtra[extraKey] : undefined;
                    
                    if (extra !== undefined && extra !== null) {
                        if (typeof extra === 'string' && isNaN(parseFloat(extra))) {
                            textLabel = extra;
                            val = 0;
                        } else {
                            val = parseFloat(extra);
                        }
                        break;
                    }
                }
            }

            // Si el valor es numérico y no tenemos label, pero la variable tiene rangos, calculamos el label
            if (v && v.ranges && v.ranges.length > 0 && val !== null && !textLabel) {
                const numericVal = parseFloat(val);
                const range = v.ranges.find((r: any) => {
                    const min = parseFloat(r.min);
                    const max = parseFloat(r.max);
                    return (isNaN(min) || numericVal >= min) && (isNaN(max) || numericVal <= max);
                });
                if (range) textLabel = range.label;
            }

            values.push(val || 0);
            labels.push(textLabel || "");
        });

        return { values, labels };
    };

    const getDiagnosticLabels = (metric: any, dataPoints: number[], currentTextLabels: string[]) => {
        // 1. Si la variable ya devolvió un texto (desde la fórmula), lo usamos tal cual
        if (currentTextLabels.some(l => l && l !== "")) {
            return currentTextLabels.map(l => l || "—");
        }

        // 2. Si no, buscamos la variable para ver si tiene rangos configurados
        const v = clinicalVariables.find(cv => cv.id === metric.variable_id || cv.code === metric.variable_id || (cv.name && cv.name === metric.variable_id));
        if (!v || !v.ranges || v.ranges.length === 0) return dataPoints.map(() => "—");

        return dataPoints.map(val => {
            if (val === 0 || val === null || val === undefined) return "—";
            
            // Buscamos en qué rango cae el valor
            const range = v.ranges.find((r: any) => {
                const min = parseFloat(r.min);
                const max = parseFloat(r.max);
                // Si el rango es por ejemplo "Abajo de 80", min suele ser 0 o null
                const minOk = isNaN(min) || val >= min;
                const maxOk = isNaN(max) || val <= max;
                return minOk && maxOk;
            });
            return range ? range.label : "—";
        });
    };

    const getChartOptions = (dataPoints: number[], customLabels?: any[]) => {
        let minVal = Math.min(...dataPoints.filter(n => typeof n === 'number' && !isNaN(n)));
        let maxVal = Math.max(...dataPoints.filter(n => typeof n === 'number' && !isNaN(n)));
        if (!isFinite(minVal)) minVal = 0;
        if (!isFinite(maxVal)) maxVal = 10;
        let paddingY = Math.abs(maxVal - minVal) * 0.1 || 1;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'inherit', size: 10, weight: 'bold' as const },
                    bodyFont: { family: 'inherit', size: 12 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context: any) => {
                            const val = context.parsed.y;
                            const idx = context.dataIndex;
                            if (customLabels && customLabels[idx] && customLabels[idx] !== "—") {
                                return [`${val}`, `Estado: ${customLabels[idx]}`];
                            }
                            return `${val}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    offset: true,
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: 9, weight: '800' as const, family: 'var(--font-tech)' },
                        padding: 5,
                        maxRotation: 0,
                        autoSkip: false,
                        callback: function (value: any, index: number) {
                            const val = dataPoints[index];
                            if (val === undefined || val === null) return "";
                            
                            // Prioridad absoluta a las etiquetas de diagnóstico (customLabels)
                            if (customLabels && customLabels[index]) {
                                if (customLabels[index] === "—") return val; // Si no hay rango, mostramos el número
                                const labelText = Array.isArray(customLabels[index]) ? customLabels[index][0] : customLabels[index];
                                return labelText;
                            }
                            
                            return val;
                        }
                    },
                    border: { display: false }
                },
                y: {
                    display: false,
                    min: minVal - paddingY,
                    max: maxVal + paddingY
                }
            },
            layout: { padding: { top: 10, bottom: 5, left: 0, right: 0 } }
        } as any;
    };

    const getChartData = (dataPoints: number[], lineColor: string) => {
        const paddedData = Array.from({ length: totalSlots }).map((_, i) => i < dataPoints.length ? dataPoints[i] : null);
        return {
            labels: renderFechas,
            datasets: [{
                data: paddedData,
                borderColor: lineColor,
                borderWidth: 3,
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
                    gradient.addColorStop(0, lineColor + '30');
                    gradient.addColorStop(1, lineColor + '00');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: lineColor,
                pointBorderColor: '#151F32',
                pointBorderWidth: 2
            }]
        };
    };

    const FechasRow = () => (
        <div className="flex flex-col sm:flex-row items-center bg-white/[0.03] py-2 rounded-2xl sm:rounded-[2rem] border border-white/5 mb-4 px-4 sm:px-6 w-full gap-4">
            <div className="w-full sm:w-[260px] flex-none text-center sm:text-left"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro Histórico</h3></div>
            <div className="flex-1 min-w-0 w-full flex px-2 text-[11px] font-tech font-black text-slate-400 uppercase tracking-widest relative overflow-hidden">
                <div className="flex justify-between w-full relative">
                    {renderFechas.map((f, i) => <div key={i} className="flex-1 text-center opacity-60 min-w-[50px]">{f}</div>)}
                </div>
            </div>
        </div>
    );

    const ChartCard = ({ title, subtitle, dataPoints, lineColor, customLabels }: { title: string, subtitle?: string, dataPoints: number[], lineColor: string, customLabels?: any[] }) => (
        <div className="flex flex-col sm:flex-row items-center bg-[#151F32] py-4 sm:py-1 px-4 sm:px-6 rounded-2xl sm:rounded-[1.5rem] border border-white/5 shadow-2xl hover:border-white/10 transition-all group overflow-hidden relative w-full gap-4 sm:gap-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-3xl -mr-16 -mt-16" />
            <div className="w-full sm:w-[260px] flex-none relative z-10 pr-0 sm:pr-4 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-none uppercase">
                    {title}
                    {subtitle && <><br /><span className="text-[10px] text-slate-500 font-tech font-black tracking-widest uppercase mt-2 block opacity-60">{subtitle}</span></>}
                </h3>
            </div>
            <div className="flex-1 min-w-0 w-full h-[90px] relative z-10 overflow-hidden text-left flex items-center px-1">
                <div className="w-full h-full relative flex justify-between">
                    <Line options={getChartOptions(dataPoints, customLabels)} data={getChartData(dataPoints, lineColor)} />
                </div>
            </div>
        </div>
    );

    const activeTabConfig = tabConfigs.find(t => t.id === activeTab || t.name.toLowerCase() === activeTab);

    return (
        <div className="bg-[#0B1120] rounded-3xl sm:rounded-[3rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-0 flex flex-col overflow-hidden m-auto w-full mb-8 sm:mb-12 pb-8 sm:pb-12 relative">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-nutrition-500/5 blur-[120px] pointer-events-none" />

            <div className="bg-white/[0.02] border-b border-white/5 rounded-b-[2rem] sm:rounded-b-[3rem] px-4 sm:px-10 py-1.5 mb-4 flex justify-between items-center z-10 w-full relative overflow-x-auto no-scrollbar">
                {tabConfigs.map((config) => {
                    const Icon = AVAILABLE_ICONS[config.icon] || Activity;
                    const isActive = activeTab === config.id || activeTab === config.name.toLowerCase();
                    return (
                        <button 
                            key={config.id} 
                            onClick={() => setActiveTab(config.id)} 
                            className={cn(
                                "rounded-2xl flex flex-col items-center justify-center py-1.5 w-[19%] transition-all cursor-pointer border border-transparent",
                                isActive ? "bg-white/5 border-white/10 text-white shadow-2xl scale-105 relative before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-nutrition-500 before:rounded-t-full" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 transition-colors", !isActive && "text-slate-600")} style={isActive ? { color: config.lineColor || config.btnColor } : {}} />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{config.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 flex flex-col gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <FechasRow />
                {activeTabConfig && activeTabConfig.metrics.filter((m: any) => m.variable_id !== 'SYSTEM_DATE').map((metric: any) => {
                    const { values, labels: extractedLabels } = getMetricData(metric);
                    const labelNorm = (metric.label || metric.visual_title || "").toUpperCase();
                    const isDiagnostic = labelNorm.includes('DIAGNOSTICO') || labelNorm.includes('DIAGNÓSTICO');
                    
                    const labels = isDiagnostic 
                        ? getDiagnosticLabels(metric, values, extractedLabels) 
                        : undefined;
                    
                    return (
                        <ChartCard 
                            key={metric.id}
                            title={metric.label}
                            subtitle={metric.subtitle}
                            dataPoints={values}
                            lineColor={activeTabConfig.lineColor || activeTabConfig.btnColor}
                            customLabels={labels}
                        />
                    );
                })}

                {!activeTabConfig && (
                    <div className="p-20 text-center opacity-20">
                        <Activity className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sin configuración detectada</p>
                    </div>
                )}
            </div>
        </div>
    );
}
