"use client";

import React, { useState } from 'react';
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
import { Scale, Droplet, BicepsFlexed, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

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
    etiquetasDiagnosticoCintura
}: PatientHistoryChartsProps) {
    const [activeTab, setActiveTab] = useState<'peso' | 'grasa' | 'musculo' | 'cintura'>('peso');

    // Premium Dark Button Styles
    const btnBase = "rounded-2xl flex flex-col items-center justify-center py-4 w-[24%] transition-all cursor-pointer border border-transparent";
    const btnActive = "bg-white/5 border-white/10 text-white shadow-2xl scale-105 relative before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-1 before:bg-nutrition-500 before:rounded-t-full";
    const btnInactive = "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]";

    const getChartOptions = (dataPoints: number[], customLabels?: any[]) => {
        let minVal = Math.min(...dataPoints);
        let maxVal = Math.max(...dataPoints);
        let paddingY = Math.abs(maxVal - minVal) * 0.1 || 1;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'inherit', size: 10, weight: 'bold' },
                    bodyFont: { family: 'inherit', size: 12 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: 9, weight: '800', family: 'var(--font-tech)' },
                        padding: 10,
                        maxRotation: 0,
                        callback: function (value: any, index: number) {
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
            layout: { padding: { top: 20, bottom: 0, left: 10, right: 10 } }
        };
    };

    const getChartData = (dataPoints: number[], lineColor: string, customLabels?: any[]) => ({
        labels: customLabels ? customLabels : dataPoints,
        datasets: [{
            data: dataPoints,
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
    });

    const FechasRow = () => (
        <div className="flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 mb-4 px-10">
            <div className="w-1/4"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro Histórico</h3></div>
            <div className="w-3/4 flex justify-between text-[11px] font-tech font-black text-slate-400 uppercase tracking-widest">
                {fechasHistorial.map((f, i) => <span key={i} className="opacity-60">{f}</span>)}
            </div>
        </div>
    );

    const ChartCard = ({ title, subtitle, dataPoints, lineColor, customLabels }: any) => (
        <div className="flex items-center justify-between bg-[#151F32] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-white/10 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-3xl -mr-16 -mt-16" />
            <div className="w-1/3 relative z-10">
                <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                    {title}
                    {subtitle && <><br /><span className="text-[10px] text-slate-500 font-tech font-black tracking-widest uppercase mt-2 block opacity-60">{subtitle}</span></>}
                </h3>
            </div>
            <div className="w-2/3 h-24 relative z-10">
                <Line options={getChartOptions(dataPoints, customLabels)} data={getChartData(dataPoints, lineColor, customLabels)} />
            </div>
        </div>
    );

    return (
        <div className="bg-[#0B1120] rounded-[3rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-0 flex flex-col overflow-hidden m-auto w-full mb-12 pb-12 relative">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-nutrition-500/5 blur-[120px] pointer-events-none" />

            <div className="bg-white/[0.02] border-b border-white/5 rounded-b-[3rem] px-10 py-6 mb-10 flex justify-between items-center z-10 w-full relative">
                <button onClick={() => setActiveTab('peso')} className={cn(btnBase, activeTab === 'peso' ? btnActive : btnInactive)}>
                    <Scale className={cn("h-6 w-6 mb-2 transition-colors", activeTab === 'peso' ? "text-nutrition-400" : "text-slate-600")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Peso</span>
                </button>
                <button onClick={() => setActiveTab('grasa')} className={cn(btnBase, activeTab === 'grasa' ? btnActive : btnInactive)}>
                    <Droplet className={cn("h-6 w-6 mb-2 transition-colors", activeTab === 'grasa' ? "text-blue-400" : "text-slate-600")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Grasa</span>
                </button>
                <button onClick={() => setActiveTab('musculo')} className={cn(btnBase, activeTab === 'musculo' ? btnActive : btnInactive)}>
                    <BicepsFlexed className={cn("h-6 w-6 mb-2 transition-colors", activeTab === 'musculo' ? "text-red-400" : "text-slate-600")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Músculo</span>
                </button>
                <button onClick={() => setActiveTab('cintura')} className={cn(btnBase, activeTab === 'cintura' ? btnActive : btnInactive)}>
                    <Ruler className={cn("h-6 w-6 mb-2 transition-colors", activeTab === 'cintura' ? "text-purple-400" : "text-slate-600")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cintura</span>
                </button>
            </div>

            {activeTab === 'peso' && (
                <div className="flex-1 flex flex-col gap-6 px-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Evolución Peso" subtitle="Peso Actual (kg)" dataPoints={pesoData} lineColor="#10b981" />
                    <ChartCard title="Índice de Masa" subtitle="IMC Bio-Calculado" dataPoints={imcData} lineColor="#3b82f6" />
                </div>
            )}

            {activeTab === 'grasa' && (
                <div className="flex-1 flex flex-col gap-6 px-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Grasa Relativa" subtitle="Porcentaje (%)" dataPoints={grasaPctData} lineColor="#3b82f6" />
                    <ChartCard title="Grasa Absoluta" subtitle="Masa Grasa (kg)" dataPoints={grasaKgData} lineColor="#3b82f6" />
                    <ChartCard title="Diferencial" subtitle="Variación (kg)" dataPoints={diffGrasaData} lineColor="#60a5fa" />
                    <ChartCard title="Diagnóstico" subtitle="Estado de Grasa" dataPoints={grasaPctData} lineColor="#2563eb" customLabels={etiquetasDiagnosticoGrasa} />
                </div>
            )}

            {activeTab === 'musculo' && (
                <div className="flex-1 flex flex-col gap-6 px-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Músculo Lee" subtitle="Porcentaje (%)" dataPoints={musculoPctData} lineColor="#ef4444" />
                    <ChartCard title="Masa Muscular" subtitle="Masa Lee (kg)" dataPoints={musculoKgData} lineColor="#ef4444" />
                    <ChartCard title="Diferencial" subtitle="Variación (kg)" dataPoints={diffMusculoData} lineColor="#f87171" />
                    <ChartCard title="Diagnóstico" subtitle="Estado Muscular" dataPoints={musculoPctData} lineColor="#dc2626" customLabels={etiquetasDiagnosticoMusculo} />
                </div>
            )}

            {activeTab === 'cintura' && (
                <div className="flex-1 flex flex-col gap-6 px-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                    <FechasRow />
                    <ChartCard title="Cintura Mín." subtitle="Medición (cm)" dataPoints={cinturaCmData} lineColor="#a855f7" />
                    <ChartCard title="Estado Metabólico" subtitle="Riesgo Cintura" dataPoints={cinturaCmData} lineColor="#7c3aed" customLabels={etiquetasDiagnosticoCintura} />
                </div>
            )}

        </div>
    );
}
