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
    pesoData: number[];
    imcData: number[];
    grasaPctData: number[];
    grasaKgData: number[];
    etiquetasDiagnosticoGrasa: (string | string[])[];
    diffGrasaData: number[];
    musculoPctData: number[];
    musculoKgData: number[];
    etiquetasDiagnosticoMusculo: (string | string[])[];
    diffMusculoData: number[];
    cinturaCmData: number[];
    etiquetasDiagnosticoCintura: (string | string[])[];
    // Nuevas Medidas
    brazoRelajadoData?: number[];
    brazoFlexionadoData?: number[];
    antebrazoData?: number[];
    toraxData?: number[];
    cinturaMinData?: number[];
    cinturaMaxData?: number[];
    caderaMaxData?: number[];
    musloMaxData?: number[];
    musloMedialData?: number[];
    pantorrillaPerimData?: number[];
    tricepsData?: number[];
    subescapularData?: number[];
    abdominalData?: number[];
    musloMedialFoldData?: number[];
    pantorrillaFoldData?: number[];
    crestaIliacaData?: number[];
    bicepsData?: number[];
    sumaPlieguesData?: number[];
}

export function PatientHistoryCharts({
    fechasHistorial,
    pesoData,
    imcData,
    grasaPctData,
    grasaKgData,
    etiquetasDiagnosticoGrasa,
    diffGrasaData,
    musculoPctData,
    musculoKgData,
    etiquetasDiagnosticoMusculo,
    diffMusculoData,
    cinturaCmData,
    etiquetasDiagnosticoCintura,
    brazoRelajadoData = [],
    brazoFlexionadoData = [],
    antebrazoData = [],
    toraxData = [],
    cinturaMinData = [],
    cinturaMaxData = [],
    caderaMaxData = [],
    musloMaxData = [],
    musloMedialData = [],
    pantorrillaPerimData = [],
    tricepsData = [],
    subescapularData = [],
    abdominalData = [],
    musloMedialFoldData = [],
    pantorrillaFoldData = [],
    crestaIliacaData = [],
    bicepsData = [],
    sumaPlieguesData = []
}: PatientHistoryChartsProps) {
    const [activeTab, setActiveTab] = useState<'peso' | 'grasa' | 'musculo' | 'cintura' | 'medidas'>('peso');
    const [tabConfigs, setTabConfigs] = useState<any[]>([]);

    useEffect(() => {
        VariablesService.getDashboardLayout('paciente_widget').then(layout => {
            if (layout && layout.columns) {
                setTabConfigs(layout.columns);
            }
        }).catch(console.error);
    }, []);

    const getTabConfig = (defaultName: string, FallbackIcon: any, fallbackColor: string) => {
        const config = tabConfigs.find(t => t.name.toLowerCase() === defaultName.toLowerCase());
        const IconMatch = config && AVAILABLE_ICONS[config.icon] ? AVAILABLE_ICONS[config.icon] : FallbackIcon;
        const color = config ? config.lineColor || config.btnColor || fallbackColor : fallbackColor;
        return { Icon: IconMatch, color, label: config ? config.name : defaultName };
    };

    const pesoConfig = getTabConfig('Peso', Scale, '#10b981');
    const grasaConfig = getTabConfig('Grasa', Droplet, '#3b82f6');
    const musculoConfig = getTabConfig('Músculo', BicepsFlexed, '#ef4444');
    const cinturaConfig = getTabConfig('Cintura', Ruler, '#a855f7');
    const medidasConfig = getTabConfig('Medidas', Heart, '#f472b6');

    // Premium Dark Button Styles
    const btnBase = "rounded-2xl flex flex-col items-center justify-center py-1.5 w-[19%] transition-all cursor-pointer border border-transparent";
    const btnActive = "bg-white/5 border-white/10 text-white shadow-2xl scale-105 relative before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-nutrition-500 before:rounded-t-full";
    const btnInactive = "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]";

    const minSlots = 6;
    const totalSlots = Math.max(minSlots, fechasHistorial.length);
    const renderFechas = Array.from({ length: totalSlots }).map((_, i) => fechasHistorial[i] || "");

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
                    displayColors: false
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
                        callback: function (value: any, index: number) {
                            if (index >= dataPoints.length) return "";
                            return customLabels ? (Array.isArray(customLabels[index]) ? customLabels[index][0] : customLabels[index]) : dataPoints[index];
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

    const getChartData = (dataPoints: number[], lineColor: string, customLabels?: any[]) => {
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
                    <Line options={getChartOptions(dataPoints, customLabels)} data={getChartData(dataPoints, lineColor, customLabels)} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-[#0B1120] rounded-3xl sm:rounded-[3rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-0 flex flex-col overflow-hidden m-auto w-full mb-8 sm:mb-12 pb-8 sm:pb-12 relative">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-nutrition-500/5 blur-[120px] pointer-events-none" />

            <div className="bg-white/[0.02] border-b border-white/5 rounded-b-[2rem] sm:rounded-b-[3rem] px-4 sm:px-10 py-1.5 mb-4 flex justify-between items-center z-10 w-full relative overflow-x-auto no-scrollbar">
                {[
                    { key: 'peso', config: pesoConfig },
                    { key: 'grasa', config: grasaConfig },
                    { key: 'musculo', config: musculoConfig },
                    { key: 'cintura', config: cinturaConfig },
                    { key: 'medidas', config: medidasConfig }
                ].map(({ key, config }) => (
                    <button key={key} onClick={() => setActiveTab(key as any)} className={cn(btnBase, activeTab === key ? btnActive : btnInactive)}>
                        <config.Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 transition-colors", activeTab !== key && "text-slate-600")} style={activeTab === key ? { color: config.color } : {}} />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'peso' && (
                <div className="flex-1 flex flex-col gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Evolución Peso" subtitle="Peso Actual (kg)" dataPoints={pesoData} lineColor={pesoConfig.color} />
                    <ChartCard title="Índice de Masa" subtitle="IMC Bio-Calculado" dataPoints={imcData} lineColor={pesoConfig.color} />
                </div>
            )}

            {activeTab === 'grasa' && (
                <div className="flex-1 flex flex-col gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Grasa Relativa" subtitle="Porcentaje (%)" dataPoints={grasaPctData} lineColor={grasaConfig.color} />
                    <ChartCard title="Grasa Absoluta" subtitle="Masa Grasa (kg)" dataPoints={grasaKgData} lineColor={grasaConfig.color} />
                    <ChartCard title="Diferencial" subtitle="Variación (kg)" dataPoints={diffGrasaData} lineColor={grasaConfig.color} />
                    <ChartCard title="Diagnóstico" subtitle="Estado de Grasa" dataPoints={grasaPctData} lineColor={grasaConfig.color} customLabels={etiquetasDiagnosticoGrasa} />
                </div>
            )}

            {activeTab === 'musculo' && (
                <div className="flex-1 flex flex-col gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Músculo Lee" subtitle="Porcentaje (%)" dataPoints={musculoPctData} lineColor={musculoConfig.color} />
                    <ChartCard title="Masa Muscular" subtitle="Masa Lee (kg)" dataPoints={musculoKgData} lineColor={musculoConfig.color} />
                    <ChartCard title="Diferencial" subtitle="Variación (kg)" dataPoints={diffMusculoData} lineColor={musculoConfig.color} />
                    <ChartCard title="Diagnóstico" subtitle="Estado Muscular" dataPoints={musculoPctData} lineColor={musculoConfig.color} customLabels={etiquetasDiagnosticoMusculo} />
                </div>
            )}

            {activeTab === 'cintura' && (
                <div className="flex-1 flex flex-col gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Cintura Mín." subtitle="Medición (cm)" dataPoints={cinturaCmData} lineColor={cinturaConfig.color} />
                    <ChartCard title="Estado Metabólico" subtitle="Riesgo Cintura" dataPoints={cinturaCmData} lineColor={cinturaConfig.color} customLabels={etiquetasDiagnosticoCintura} />
                </div>
            )}

            {activeTab === 'medidas' && (
                <div className="flex-1 flex flex-col gap-3 px-4 pb-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 h-[500px] overflow-y-auto no-scrollbar">
                    <FechasRow />
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-l-2 pl-4" style={{ borderColor: medidasConfig.color }}>Perímetros (cm)</h4>
                        <div className="flex flex-col gap-4">
                            <ChartCard title="B. Relajado" subtitle="Perímetro" dataPoints={brazoRelajadoData} lineColor={medidasConfig.color} />
                            <ChartCard title="B. Tensión" subtitle="Perímetro" dataPoints={brazoFlexionadoData} lineColor={medidasConfig.color} />
                            <ChartCard title="Antebrazo" subtitle="Perímetro" dataPoints={antebrazoData} lineColor={medidasConfig.color} />
                            <ChartCard title="Tórax" subtitle="Perímetro" dataPoints={toraxData} lineColor={medidasConfig.color} />
                            <ChartCard title="Cintura Mín" subtitle="Perímetro" dataPoints={cinturaMinData} lineColor={medidasConfig.color} />
                            <ChartCard title="Cintura Máx" subtitle="Perímetro" dataPoints={cinturaMaxData} lineColor={medidasConfig.color} />
                            <ChartCard title="Cadera Máx" subtitle="Perímetro" dataPoints={caderaMaxData} lineColor={medidasConfig.color} />
                            <ChartCard title="Muslo Máx" subtitle="Perímetro" dataPoints={musloMaxData} lineColor={medidasConfig.color} />
                            <ChartCard title="Muslo Medial" subtitle="Perímetro" dataPoints={musloMedialData} lineColor={medidasConfig.color} />
                            <ChartCard title="Pantorrilla" subtitle="Perímetro" dataPoints={pantorrillaPerimData} lineColor={medidasConfig.color} />
                        </div>

                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-l-2 pl-4 mt-8" style={{ borderColor: medidasConfig.color }}>Pliegues (mm)</h4>
                        <div className="flex flex-col gap-4">
                            <ChartCard title="P. Tríceps" subtitle="Pliegue" dataPoints={tricepsData} lineColor={medidasConfig.color} />
                            <ChartCard title="P. Subescapular" subtitle="Pliegue" dataPoints={subescapularData} lineColor={medidasConfig.color} />
                            <ChartCard title="P. Abdominal" subtitle="Pliegue" dataPoints={abdominalData} lineColor={medidasConfig.color} />
                            <ChartCard title="P. Muslo Medial" subtitle="Pliegue" dataPoints={musloMedialFoldData} lineColor={medidasConfig.color} />
                            <ChartCard title="P. Pantorrilla" subtitle="Pliegue" dataPoints={pantorrillaFoldData} lineColor={medidasConfig.color} />
                            <ChartCard title="Cresta Ilíaca" subtitle="Pliegue" dataPoints={crestaIliacaData} lineColor={medidasConfig.color} />
                            <ChartCard title="P. Bíceps" subtitle="Pliegue" dataPoints={bicepsData} lineColor={medidasConfig.color} />
                        </div>

                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-l-2 pl-4 mt-8" style={{ borderColor: medidasConfig.color }}>Resultados Totales</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <ChartCard title="Suma de 6 Pliegues" subtitle="Total (mm)" dataPoints={sumaPlieguesData} lineColor={medidasConfig.color} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
