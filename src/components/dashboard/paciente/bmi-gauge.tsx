"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { ArrowRight, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const bmiData = [
    { name: "Bajo Peso", value: 18.5, color: "#3b82f6" }, // Blue
    { name: "Normal", value: 6.5, color: "#22c55e" },   // Green
    { name: "Sobrepeso", value: 5, color: "#eab308" },   // Yellow
    { name: "Obesidad I", value: 5, color: "#ec4899" },  // Pink
    { name: "Obesidad II", value: 5, color: "#f97316" }, // Orange
    { name: "Obesidad III", value: 10, color: "#ef4444" }, // Red
];

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const defaultColors = ["#3b82f6", "#22c55e", "#facc15", "#ec4899", "#f97316", "#ef4444", "#94a3b8"];

const fallbackBmiData = [
    { name: "Bajo Peso", value: 18.5, color: "#3b82f6" },
    { name: "Normal", value: 6.5, color: "#22c55e" },
    { name: "Sobrepeso", value: 5, color: "#eab308" },
    { name: "Obesidad I", value: 5, color: "#ec4899" },
    { name: "Obesidad II", value: 5, color: "#f97316" },
    { name: "Obesidad III", value: 10, color: "#ef4444" },
];

const fallbackGetBMIInfo = (imc: number) => {
    if (imc <= 0) return { category: "S/D", color: "#94a3b8", index: -1, min: 0, max: 1 };
    if (imc < 18.5) return { category: "Bajo Peso", color: "#3b82f6", index: 0, min: 10, max: 18.5 };
    if (imc < 25) return { category: "Normal", color: "#22c55e", index: 1, min: 18.5, max: 25 };
    if (imc < 30) return { category: "Sobrepeso", color: "#facc15", index: 2, min: 25, max: 30 };
    if (imc < 35) return { category: "Obesidad I", color: "#ec4899", index: 3, min: 30, max: 35 };
    if (imc < 40) return { category: "Obesidad II", color: "#f97316", index: 4, min: 35, max: 40 };
    return { category: "Obesidad III", color: "#ef4444", index: 5, min: 40, max: 50 };
};

export function BMIGauge() {
    const [imcData, setImcData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                setShouldAnimate(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading]);
    const supabase = createClient();
    const fetchBMI = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;

            const { data: pData } = await supabase
                .from("patients")
                .select("id, goal_weight, current_weight, height_cm")
                .eq("profile_id", profile.id)
                .single();

            if (!pData) return;

            const { data: wData } = await supabase
                .from("weight_records")
                .select("*")
                .eq("patient_id", pData.id)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false });

            const h = parseFloat(pData.height_cm?.toString() || "0");
            let weightValue = 0;
            let imcValue = 0;
            let startWeightValue = parseFloat(pData.current_weight?.toString() || "0");
            let findingsValue = "No hay una medición registrada.";
            let recommendationsValue = "No hay una medición registrada.";

            if (wData && wData.length > 0) {
                const latest = wData[0];
                weightValue = parseFloat(latest.weight?.toString() || "0");
                if (h > 0 && weightValue > 0) {
                    imcValue = parseFloat((weightValue / ((h / 100) * (h / 100))).toFixed(1));
                }
                findingsValue = (latest.extra_data && latest.extra_data['PRINCIPALES_HALLAZGOS']) || latest.clinical_findings || "No hay hallazgos para esta medición.";
                recommendationsValue = (latest.extra_data && latest.extra_data['RECOMENDACION_NUTRICIONAL']) || latest.nutritional_recommendations || "No hay recomendaciones para esta medición.";

                const oldest = wData[wData.length - 1];
                startWeightValue = parseFloat(oldest.weight?.toString() || startWeightValue.toString());
            } else {
                weightValue = startWeightValue;
                if (h > 0 && weightValue > 0) {
                    imcValue = parseFloat((weightValue / ((h / 100) * (h / 100))).toFixed(1));
                }
                findingsValue = "Evaluación inicial completada.";
                recommendationsValue = "Bienvenido a tu plan de nutrición.";
            }

            const idealWeight = h > 0 ? parseFloat((22 * (h / 100) * (h / 100)).toFixed(1)) : 0;

            const { data: diagVar } = await supabase
                .from("clinical_variables")
                .select("id, code, variable_logic(id, type, condition_name, variable_ranges(*))")
                .eq("code", "DIAGNOSTICO_IMC")
                .single();

            let dynamicSegments = fallbackBmiData;
            let dynamicInfo = fallbackGetBMIInfo(imcValue);

            if (diagVar && diagVar.variable_logic && diagVar.variable_logic.length > 0) {
                const logic = diagVar.variable_logic.find((l: any) => l.condition_name === 'General' || l.type === 'default') || diagVar.variable_logic[0];
                if (logic && logic.variable_ranges && logic.variable_ranges.length > 0) {
                    const sortedRanges = [...logic.variable_ranges].sort((a: any, b: any) => parseFloat(a.min) - parseFloat(b.min));

                    // Build dynamic segments for the pie chart
                    dynamicSegments = [];
                    let previousMin = 0; // Para el primer segmento, o usar el .min
                    sortedRanges.forEach((r: any, idx: number) => {
                        const min = parseFloat(r.min);
                        const max = parseFloat(r.max);
                        // Limitar la "anchura" visual del ultimo tramo grande (ej. 30 a 100) para que no rompa el pie chart
                        const isLast = idx === sortedRanges.length - 1;
                        let span = (max - min);
                        if (isLast && max > 50) span = 10;
                        if (idx === 0) span = max; // desde 0 hasta min

                        dynamicSegments.push({
                            name: r.label,
                            value: span > 0 ? span : 5,
                            color: r.color || defaultColors[idx % defaultColors.length]
                        });
                    });

                    // Build dynamic info
                    const matchedIndex = sortedRanges.findIndex((r: any) => imcValue >= parseFloat(r.min) && imcValue < parseFloat(r.max));
                    if (matchedIndex !== -1) {
                        const r = sortedRanges[matchedIndex];
                        dynamicInfo = {
                            category: r.label,
                            color: r.color || defaultColors[matchedIndex % defaultColors.length],
                            index: matchedIndex,
                            min: parseFloat(r.min),
                            max: parseFloat(r.max) >= 100 ? parseFloat(r.min) + 10 : parseFloat(r.max)
                        };
                    } else if (imcValue > 0) {
                        // Overflow on the right side
                        const lastR = sortedRanges[sortedRanges.length - 1];
                        dynamicInfo = {
                            category: lastR.label,
                            color: lastR.color || defaultColors[(sortedRanges.length - 1) % defaultColors.length],
                            index: sortedRanges.length - 1,
                            min: parseFloat(lastR.min),
                            max: parseFloat(lastR.max) >= 100 ? parseFloat(lastR.min) + 10 : parseFloat(lastR.max)
                        };
                    } else {
                        dynamicInfo = { category: "S/D", color: "#94a3b8", index: -1, min: 0, max: 1 };
                    }
                }
            }

            setImcData({
                currentIMC: imcValue,
                currentWeight: weightValue,
                initialWeight: startWeightValue,
                goalWeight: idealWeight,
                info: dynamicInfo,
                chartSegments: dynamicSegments,
                findings: findingsValue,
                recommendations: recommendationsValue
            });

        } catch (err) {
            console.error("Error fetching BMI:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchBMI();

        // 1. Supabase Realtime
        const channel = supabase
            .channel('patient_bmi_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                console.log("Realtime: Patient basic info changed, refreshing BMI...");
                fetchBMI();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_records' }, () => {
                console.log("Realtime: Weight records changed, refreshing BMI...");
                fetchBMI();
            })
            .subscribe();

        // 2. Local Sync
        const globalSync = new BroadcastChannel('nutrigo_global_sync');
        globalSync.onmessage = () => fetchBMI();

        return () => {
            supabase.removeChannel(channel);
            globalSync.close();
        };
    }, [fetchBMI, supabase]);

    const { currentIMC, currentWeight, initialWeight, goalWeight, info } = imcData || {
        currentIMC: 0,
        currentWeight: 0,
        initialWeight: 0,
        goalWeight: 0,
        info: fallbackGetBMIInfo(0)
    };
    const progress = Math.min(Math.max((currentIMC - info.min) / (info.max - info.min), 0), 1);
    const progressPercent = Math.round(progress * 100);

    const internalData = [
        { value: progress, color: info.color },
        { value: 1 - progress, color: "transparent" }
    ];

    return (
        <div className="relative min-h-[500px] col-span-1 lg:col-span-2">
            {/* Skeleton Overlay */}
            <div
                className={cn(
                    "transition-opacity duration-1000 ease-in-out absolute inset-0 z-10 pointer-events-none",
                    loading ? "opacity-100" : "opacity-0"
                )}
            >
                <Card className="p-6 h-[500px] animate-pulse bg-white/5 border border-white/10 shadow-sm rounded-[2.5rem]" />
            </div>

            {/* Actual Content */}
            <div
                className={cn(
                    "transition-all duration-[2000ms] ease-out will-change-[opacity,transform]",
                    loading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
            >
                <Card className="p-6 border border-white/5 bg-nutri-panel shadow-sm overflow-hidden rounded-[2.5rem]">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Left: Gauge */}
                        <div className="flex-1 flex flex-col items-center w-full">
                            <h3 className="text-lg font-tech font-bold text-white mb-6 self-start flex items-center gap-2">
                                <Activity className="h-7 w-7 text-nutri-brand" />
                                Índice de Masa Corporal (IMC)
                            </h3>

                            <div className="relative h-[200px] w-full max-w-[360px] mb-8">
                                <ResponsiveContainer width="100%" height="100%" className="pointer-events-none">
                                    {shouldAnimate ? (
                                        <PieChart>
                                            {/* Main Category Gauge */}
                                            <Pie
                                                data={imcData?.chartSegments || fallbackBmiData}
                                                cx="50%"
                                                cy="100%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={120}
                                                outerRadius={180}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                                animationDuration={1000}
                                                animationBegin={0}
                                                animationEasing="ease-in-out"
                                            >
                                                {(imcData?.chartSegments || fallbackBmiData).map((entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        opacity={0.8}
                                                        stroke={info.index === index ? "#ffffff" : "none"}
                                                        strokeWidth={info.index === index ? 2 : 0}
                                                        className="transition-all duration-500"
                                                        style={{
                                                            filter: info.index === index ? `drop-shadow(0 0 12px ${entry.color}cc)` : 'none',
                                                            transform: info.index === index ? 'scale(1.05)' : 'scale(1)',
                                                            transformOrigin: 'center bottom'
                                                        }}
                                                    />
                                                ))}
                                            </Pie>

                                            {/* Internal Progress Arc */}
                                            <Pie
                                                data={internalData}
                                                cx="50%"
                                                cy="100%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={90}
                                                outerRadius={115}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                                cornerRadius={10}
                                                animationDuration={1000}
                                                animationBegin={500}
                                                animationEasing="ease-in-out"
                                            >
                                                <Cell fill={info.color} />
                                                <Cell fill="rgba(255,255,255,0.05)" />
                                            </Pie>
                                        </PieChart>
                                    ) : (
                                        <div />
                                    )}
                                </ResponsiveContainer>

                                {/* Internal Percentage Text */}
                                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
                                    <p className="text-xl font-tech font-black leading-none"
                                        style={{ color: info.color }}
                                    >
                                        {progressPercent}%
                                    </p>
                                </div>

                                {/* Centered IMC Text */}
                                <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10 transition-all duration-500">
                                    <span className="text-4xl font-tech font-black text-white tracking-tighter">
                                        {currentIMC || "---"}
                                    </span>
                                    <p className="text-[15px] font-tech font-black tracking-[0.3em] uppercase mt-2 transition-all duration-500"
                                        style={{ color: info.color }}
                                    >
                                        {info.category}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 w-full bg-nutri-base/50 border border-white/5 p-5 rounded-3xl mt-4">
                                <div className="col-span-2 flex flex-col gap-0.5">
                                    <p className="text-[14px] uppercase font-bold text-slate-500 tracking-wider">Peso Actual</p>
                                    <p className="text-xl font-tech font-black text-white tracking-tight">{currentWeight.toFixed(1)} <span className="text-xl font-semibold text-slate-500">kg</span></p>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <p className="text-[14px] uppercase font-bold text-slate-500 tracking-wider">Estado</p>
                                    <p className="text-lg font-tech font-black tracking-tight"
                                        style={{ color: info.color }}>{info.category}</p>
                                </div>
                                <div className="border-t border-white/5 pt-3">
                                    <p className="text-[14px] font-bold text-slate-500 uppercase">Peso Inicial</p>
                                    <p className="text-xl font-tech font-bold text-white tracking-tight">{initialWeight.toFixed(1)} kg</p>
                                </div>
                                <div className="border-t border-white/5 pt-3 text-center">
                                    <p className="text-[14px] font-bold text-slate-500 uppercase">Diferencia Meta</p>
                                    <p className="text-xl font-tech font-bold text-white tracking-tight">{Math.abs(currentWeight - goalWeight).toFixed(1)} kg</p>
                                </div>
                                <div className="border-t border-white/5 pt-3 text-right">
                                    <p className="text-[14px] font-bold text-slate-500 uppercase">Peso Meta</p>
                                    <p className="text-xl font-tech font-bold text-nutri-brand tracking-tight">{goalWeight.toFixed(1)} kg</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Recommendations */}
                        <div className="flex-1 flex flex-col items-center gap-6 w-full max-w-md mx-auto lg:mx-0">
                            <div className="flex-1 space-y-4 w-full">
                                {/* Recommendation Box 1 */}
                                <div className="p-6 bg-nutri-base/30 border border-white/5 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: info.color }} />
                                    <div className="flex items-center gap-2 text-white font-tech font-black text-xs uppercase tracking-widest mb-4">
                                        <Info className="h-5 w-5" style={{ color: info.color }} />
                                        <span>Principales Hallazgos</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative">
                                            <span className="text-4xl absolute -top-2 -left-1 opacity-20 text-slate-700 font-serif">"</span>
                                            <p className="text-[15px] text-slate-300 italic leading-relaxed font-medium relative z-10 px-2 whitespace-pre-wrap">
                                                {imcData?.findings || "Cargando hallazgos..."}
                                            </p>
                                            <span className="text-4xl absolute -bottom-6 -right-1 opacity-20 text-slate-700 font-serif">"</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendation Box 2 */}
                                <div className="p-6 bg-nutri-base border border-nutri-brand/10 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-nutri-brand" />
                                    <div className="flex items-center gap-2 text-white font-tech font-black text-xs uppercase tracking-widest mb-4">
                                        <Activity className="h-5 w-5 text-nutri-brand" />
                                        <span>Recomendación Nutricional</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative">
                                            <span className="text-4xl absolute -top-2 -left-1 opacity-20 text-slate-700 font-serif">"</span>
                                            <p className="text-[15px] text-slate-400 italic leading-relaxed font-medium relative z-10 px-2 whitespace-pre-wrap">
                                                {imcData?.recommendations || "Cargando recomendaciones..."}
                                            </p>
                                            <span className="text-4xl absolute -bottom-6 -right-1 opacity-20 text-slate-700 font-serif">"</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
