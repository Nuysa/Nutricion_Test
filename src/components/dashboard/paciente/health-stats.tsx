import { Scale, Ruler, Activity, Milestone, Gift, Check, Calculator, Thermometer, User, Droplets, Wind, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    YAxis,
    ResponsiveContainer,
    Line
} from "recharts";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { VariablesService } from "@/lib/variables-service";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";

const ICON_MAP: Record<string, any> = {
    Scale,
    Ruler,
    Activity,
    Milestone,
    Gift,
    Check,
    Calculator,
    Thermometer,
    User,
    Droplets,
    Wind,
    Heart
};

export function HealthStats() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const supabase = createClient();
    const { calculate } = useFormulaEngine();

    useEffect(() => {
        fetchHealthStats();

        const recordsChannel = supabase.channel("realtime-health-records")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "weight_records" },
                () => fetchHealthStats()
            )
            .subscribe();

        const configChannel = supabase.channel("realtime-config-sync")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "card_slots_config" },
                () => fetchHealthStats()
            )
            .subscribe();

        const globalSync = new BroadcastChannel('nutrigo_global_sync');
        globalSync.onmessage = () => fetchHealthStats();

        return () => {
            supabase.removeChannel(recordsChannel);
            supabase.removeChannel(configChannel);
            globalSync.close();
        };
    }, []);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                setShouldAnimate(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    async function fetchHealthStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).maybeSingle();
            let patientData = null;
            if (profile) {
                const { data: pData } = await supabase
                    .from("patients")
                    .select("id, current_weight, height_cm, date_of_birth, gender")
                    .eq("profile_id", profile.id)
                    .maybeSingle();
                patientData = pData;
            }

            const [slotsRes, recordsRes, varsRes] = await Promise.all([
                VariablesService.getCardSlots('paciente'),
                patientData ? supabase.from("weight_records").select("id, weight, waist_circumference_cm, body_fat_percentage, muscle_mass_percentage, extra_data").eq("patient_id", patientData.id).order("date", { ascending: false }).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
                VariablesService.getVariables()
            ]);

            const rawSlots = slotsRes || [];
            const allRecords = recordsRes.data || [];
            const rawVariables = varsRes || [];
            const latest = allRecords[0];

            let age = 0;
            if (patientData?.date_of_birth) {
                const birthStr = patientData.date_of_birth.includes('T') ? patientData.date_of_birth : `${patientData.date_of_birth}T12:00:00`;
                const birth = new Date(birthStr);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
            }

            const patientFallbackWeight = patientData?.current_weight != null ? Number(patientData.current_weight) : 0;
            const weightVal = latest?.weight != null ? Number(latest.weight) : patientFallbackWeight;
            const heightVal = Number(patientData?.height_cm || 0);

            const commonInputs: Record<string, number> = {
                "PESO": weightVal,
                "TALLA": heightVal,
                "TALLA_CM": heightVal,
                "EDAD": age,
                "CINTURA": Number(latest?.waist_circumference_cm || 0),
                "GRASA": Number(latest?.body_fat_percentage || 0),
                "PESO_BASE": patientFallbackWeight,
                "IMC": weightVal > 0 && heightVal > 0 ? Number((weightVal / ((heightVal / 100) * (heightVal / 100))).toFixed(1)) : 0,
                "GENERO_V": patientData?.gender === 'masculino' || patientData?.gender === 'M' ? 1 : (patientData?.gender === 'femenino' || patientData?.gender === 'F' ? 2 : 0),
                ...(latest?.extra_data || {})
            };

            if (rawVariables) {
                for (let pass = 0; pass < 3; pass++) {
                    rawVariables.forEach(v => {
                        if (v.is_calculated) {
                            const res = calculate(v, { gender: patientData?.gender || 'otro', age, inputs: commonInputs });
                            if (res && typeof res.result === 'number' && !isNaN(res.result)) {
                                commonInputs[(v.code || '').toUpperCase()] = res.result;
                            }
                        }
                    });
                }
            }

            const systemValueMap: Record<string, string> = {
                "EDAD": age.toString(),
                "GENERO": patientData?.gender === 'masculino' || patientData?.gender === 'M' ? 'Masculino' : (patientData?.gender === 'femenino' || patientData?.gender === 'F' ? 'Femenino' : 'Otro'),
                "NACIMIENTO": patientData?.date_of_birth ? new Date(patientData.date_of_birth + 'T12:00:00').toLocaleDateString() : (patientData?.date_of_birth || "N/A"),
                "TALLA_V": heightVal.toString()
            };

            const finalDynamicStats: any[] = [null, null, null];

            rawSlots.forEach((slot: any) => {
                let variable = slot.clinical_variables;
                if (variable && rawVariables.length > 0) {
                    const richVar = rawVariables.find(v => v.id === variable.id);
                    if (richVar) variable = richVar;
                }

                if (!variable) {
                    const sysMapping: Record<string, any> = {
                        'ffffffff-ffff-ffff-ffff-00000000000a': { code: 'EDAD', name: 'Edad (Sistema)', unit: 'años', is_system: true },
                        'ffffffff-ffff-ffff-ffff-00000000000b': { code: 'GENERO', name: 'Género (Sistema)', unit: '', is_system: true },
                        'ffffffff-ffff-ffff-ffff-00000000000d': { code: 'TALLA_V', name: 'Talla (Sistema)', unit: 'cm', is_system: true },
                        'ffffffff-ffff-ffff-ffff-00000000000e': { code: 'NACIMIENTO', name: 'Nacimiento (Sistema)', unit: '', is_system: true }
                    };
                    variable = sysMapping[slot.variable_id];
                }

                if (!variable || slot.slot_index >= 3) return;

                let value = "0";
                let chartData: any[] = [];
                let colorRange = null;

                if (variable.is_calculated) {
                    const calcResult = calculate(variable, { gender: patientData?.gender || 'otro', age, inputs: commonInputs });
                    const isNumericCard = Boolean(variable.unit) || (variable.code || '').toUpperCase().includes('GRASA') || (variable.code || '').toUpperCase().includes('PESO') || (variable.code || '').toUpperCase().includes('TALLA');
                    let computedVal = ((variable.has_ranges ?? variable.hasRanges) && calcResult.range && !isNumericCard) ? calcResult.range.label : calcResult.result.toString();

                    if (computedVal === "0" || computedVal === "NaN" || computedVal === "0.00" || computedVal === "0.0") {
                        const preComputed = commonInputs[(variable.code || '').toUpperCase()];
                        if (preComputed !== undefined && preComputed !== 0 && !isNaN(preComputed)) {
                            computedVal = preComputed.toString();
                        } else {
                            const techName = (variable.code || "").toLowerCase();
                            const fixedMap: Record<string, string> = { "peso": "weight", "grasa": "body_fat_percentage", "cintura": "waist_circumference_cm", "musculo": "muscle_mass_percentage" };
                            const fCol = fixedMap[techName];
                            if (fCol && latest && latest[fCol]) computedVal = latest[fCol].toString();
                        }
                    }
                    value = computedVal;
                    colorRange = calcResult.range?.color;
                } else if (variable.is_system) {
                    value = systemValueMap[variable.code] || "0";
                } else {
                    const techName = (variable.code || "").toLowerCase();
                    const fixedMapping: Record<string, string> = { "peso": "weight", "grasa": "body_fat_percentage", "cintura": "waist_circumference_cm", "musculo": "muscle_mass_percentage" };
                    const col = fixedMapping[techName];
                    const recordValue = (latest && col) ? latest[col] : null;

                    if (recordValue != null) {
                        value = recordValue.toString();
                        chartData = allRecords.slice(0, 5).reverse().map(r => ({ v: r[col] || 0 }));
                    } else {
                        if (techName === "peso") value = patientFallbackWeight.toString();
                        else if (techName === "talla") value = (patientData?.height_cm != null) ? patientData.height_cm.toString() : "0";
                        else value = latest?.extra_data?.[variable.code]?.toString() || "0";
                    }
                }

                if (value === "NaN" || value === "undefined" || !value) value = "0";
                const variableCode = (variable.code || "").toUpperCase();
                const isBaseVar = ["PESO", "TALLA", "TALLA_V", "IMC", "EDAD", "GENERO", "NACIMIENTO"].includes(variableCode);
                if (!latest && !isBaseVar && !variable.is_system) value = "0";

                finalDynamicStats[slot.slot_index] = {
                    key: variable.code,
                    label: variable.name,
                    value,
                    unit: variable.unit || "",
                    iconName: slot.icon,
                    color: slot.color,
                    bgColor: slot.color?.replace('text-', 'bg-').replace('600', '50').replace('500', '50'),
                    chartData,
                    chartColor: slot.color?.includes('nutrition') ? '#22c55e' : (slot.color?.includes('orange') ? '#f97316' : '#6366f1'),
                    icon: ICON_MAP[slot.icon] || Activity,
                    rangeColor: colorRange
                };
            });

            const placeholders = [
                { key: "PESO", label: "Peso", value: commonInputs["PESO"].toString(), unit: "kg", iconName: "Scale", icon: Scale, color: "text-nutrition-600", bgColor: "bg-nutrition-50", chartColor: "#22c55e", chartData: [], rangeColor: null },
                { key: "IMC", label: "IMC", value: (commonInputs["PESO"] > 0 && commonInputs["TALLA"] > 0) ? (commonInputs["PESO"] / ((commonInputs["TALLA"] / 100) ** 2)).toFixed(1) : "0", unit: "kg/m2", iconName: "Activity", icon: Activity, color: "text-orange-500", bgColor: "bg-orange-50", chartColor: "#f97316", chartData: [], rangeColor: null },
                { key: "CINTURA", label: "Cintura", value: commonInputs["CINTURA"].toString(), unit: "cm", iconName: "Ruler", icon: Ruler, color: "text-indigo-500", bgColor: "bg-indigo-50", chartColor: "#6366f1", chartData: [], rangeColor: null }
            ];

            for (let i = 0; i < 3; i++) {
                if (!finalDynamicStats[i]) {
                    const availableFallback = placeholders.find(p => !finalDynamicStats.some(s => s && s.key === p.key));
                    finalDynamicStats[i] = availableFallback || placeholders[i];
                }
            }

            finalDynamicStats[3] = {
                key: "loyalty",
                label: "Progreso de Evaluación",
                value: allRecords.length.toString(),
                unit: "total",
                iconName: "Milestone",
                color: "text-sky-500",
                bgColor: "bg-sky-100",
                currentCount: allRecords.length,
                chartData: [],
                chartColor: "#0ea5e9",
                icon: Milestone,
                rangeColor: null
            };

            setStats(finalDynamicStats.slice(0, 4));
        } catch (err) {
            console.error("[HealthStats] Error fatal:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-32 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white/5 rounded-[2.5rem]" />)}
        </div>
    );

    return (
        <TooltipProvider>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.filter(Boolean).map((stat, idx) => {
                    const IconComponent = stat.icon;
                    const isLoyalty = stat.key === "loyalty";

                    return (
                        <Card key={`stat-slot-${idx}`} className={cn("rounded-[2.5rem] animated-border-card group border border-white/5 bg-[#151F32] shadow-2xl overflow-hidden h-full transition-all duration-300", isLoyalty && "h-fit min-h-[240px]")} style={{ "--border-glow-color": stat.chartColor } as any}>
                            <div className="animated-border-inner" />
                            <CardContent className={cn("p-8 relative z-10 flex flex-col h-full", isLoyalty ? "p-6 justify-start" : "justify-between")}>
                                <div className={cn(isLoyalty ? "mb-2" : "mb-4")}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500", stat.bgColor?.replace('bg-', 'bg-white/').replace('50', '5').replace('100', '10'), stat.color)}>
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-end flex-1 ml-4 gap-0.5">
                                            {isLoyalty && stat.currentCount >= 12 && (
                                                <span className="text-[8px] font-black text-white bg-orange-600 px-2 py-0.5 rounded-full tracking-wider animate-pulse uppercase">Meta Alcanzada</span>
                                            )}
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none text-right">{stat.label}</p>
                                        </div>
                                    </div>
                                    {!isLoyalty && (
                                        <div className="flex items-baseline gap-2">
                                            <span className={cn("text-4xl font-tech font-black tracking-tighter", (!stat.rangeColor || stat.rangeColor.startsWith('#')) ? "text-white" : stat.rangeColor.replace('bg-', 'text-'))} style={{ color: stat.rangeColor?.startsWith('#') ? stat.rangeColor : undefined }}>
                                                {stat.value}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-tech font-black uppercase tracking-widest">{stat.unit}</span>
                                        </div>
                                    )}
                                </div>

                                {!isLoyalty ? (
                                    <div className="h-10 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {shouldAnimate && stat.chartData && stat.chartData.length > 0 ? (
                                                <LineChart data={stat.chartData}>
                                                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="v"
                                                        stroke={stat.chartColor}
                                                        strokeWidth={3}
                                                        dot={false}
                                                        animationDuration={1000}
                                                    />
                                                </LineChart>
                                            ) : (
                                                <div className="flex items-center justify-center h-full opacity-10">
                                                    <div className="h-px w-full bg-slate-400" />
                                                </div>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center flex-1 w-full gap-2 -mt-2">
                                        {/* Horizontal Rounded Segmented Tracker */}
                                        <div className="w-full relative h-16 flex items-center justify-center p-2">
                                            <svg className="absolute inset-0 w-full h-full transform" viewBox="0 0 160 60" preserveAspectRatio="none">
                                                {/* Background Segments */}
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <rect
                                                        key={`bg-${i}`}
                                                        x="5" y="5" width="150" height="50" rx="18"
                                                        fill="none"
                                                        stroke="rgba(255,255,255,0.06)"
                                                        strokeWidth="5"
                                                        strokeDasharray="28 4"
                                                        strokeDashoffset={-i * 32}
                                                    />
                                                ))}
                                                {/* Progress Segments */}
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const isTarget = i === 11;
                                                    const isActive = i < stat.currentCount;
                                                    const segment = (
                                                        <rect
                                                            key={`prog-${i}`}
                                                            x="5" y="5" width="150" height="50" rx="18"
                                                            fill="none"
                                                            stroke={isActive ? (isTarget ? "#fb923c" : "#38bdf8") : (isTarget ? "rgba(251,146,60,0.1)" : "transparent")}
                                                            strokeWidth={isTarget ? "7" : "5"}
                                                            strokeDasharray="28 4"
                                                            strokeDashoffset={-i * 32}
                                                            className={cn("transition-all duration-1000", isTarget && "animate-pulse")}
                                                            style={{
                                                                filter: isActive ? `drop-shadow(0 0 8px ${isTarget ? 'rgba(251,146,60,0.6)' : 'rgba(56,189,248,0.5)'})` : 'none'
                                                            }}
                                                        />
                                                    );

                                                    if (isTarget) {
                                                        return (
                                                            <Tooltip key={i} delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <g className="cursor-help pointer-events-auto">
                                                                        {segment}
                                                                    </g>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-slate-900/95 backdrop-blur-md text-white border-white/10 p-3 rounded-xl shadow-2xl max-w-[200px] z-[100]" side="top">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Gift className="h-3 w-3 text-orange-400" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Recompensa</span>
                                                                    </div>
                                                                    <p className="text-[10px] leading-snug font-medium">
                                                                        Al alcanzar <strong>12 mediciones</strong> obtendrás una evaluación y plan nutricional integral <strong>GRATUITO</strong>.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    }
                                                    return segment;
                                                })}
                                            </svg>

                                            <div className="relative z-10 flex items-center justify-center gap-3 mt-0.5 pointer-events-none">
                                                <span className="text-3xl font-tech font-black text-white leading-none">
                                                    {stat.currentCount}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">Mediciones</span>
                                            </div>
                                        </div>

                                        {/* Reward Section (Dynamic based on count) */}
                                        {stat.currentCount >= 12 ? (
                                            <div className="w-full animate-in fade-in zoom-in duration-700">
                                                <Button size="sm" className="w-full bg-nutrition-500 hover:bg-nutrition-600 text-white font-black text-[9px] uppercase tracking-[0.1em] py-4 rounded-xl shadow-lg border border-white/5 group h-8">
                                                    Agendar Gratis
                                                    <Check className="ml-1.5 h-3 w-3 group-hover:scale-125 transition-transform" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="w-full py-2 bg-white/[0.03] border border-white/5 rounded-xl text-center">
                                                <p className="text-[9px] font-bold text-slate-400 leading-none">
                                                    Faltan <span className="text-sky-400 font-tech font-black">{12 - stat.currentCount}</span> para tu beneficio
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
