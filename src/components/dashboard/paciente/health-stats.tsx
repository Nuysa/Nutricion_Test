import { Scale, Ruler, Activity, Milestone, Gift, Check, Calculator, Thermometer, User, Droplets, Wind, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

        // Establecer canal de tiempo real para registros de peso de este paciente
        const recordsChannel = supabase.channel("realtime-health-records")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "weight_records" },
                () => fetchHealthStats()
            )
            .subscribe();

        // Establecer canal global para cambios de configuración hechos por el ROOT (card_slots_config)
        const configChannel = supabase.channel("realtime-config-sync")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "card_slots_config" },
                () => fetchHealthStats()
            )
            .subscribe();

        // Broadcast a nivel del mismo navegador en caso el realtime de supabase falle o demore
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
        console.log("[HealthStats] Inicia fetchHealthStats...");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn("[HealthStats] No user session found.");
                setLoading(false);
                return;
            }

            // 1. Perfil y Datos de Paciente
            const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).maybeSingle();
            console.log("[HealthStats] Authenticated User ID:", user.id);
            console.log("[HealthStats] Profile matched:", profile);

            let patientData = null;
            if (profile) {
                const { data: pData, error: pError } = await supabase
                    .from("patients")
                    .select("id, current_weight, height_cm, date_of_birth, gender")
                    .eq("profile_id", profile.id)
                    .maybeSingle();

                if (pError) console.error("[HealthStats] Error fetching patient record:", pError);
                console.log("[HealthStats] Patient record from DB:", pData);
                patientData = pData;
            } else {
                console.warn("[HealthStats] No profile found for UID:", user.id);
            }

            console.log("[HealthStats] Patient Data Result:", patientData);

            // 2. Configuración y Mediciones
            const [slotsRes, recordsRes, varsRes] = await Promise.all([
                VariablesService.getCardSlots('paciente'),
                patientData ? supabase.from("weight_records").select("*").eq("patient_id", patientData.id).order("date", { ascending: false }).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
                VariablesService.getVariables()
            ]);

            const rawSlots = slotsRes || [];
            const allRecords = recordsRes.data || [];
            const rawVariables = varsRes || [];
            const latest = allRecords[0];

            console.log("[HealthStats] Slots from DB:", rawSlots.length);
            console.log("[HealthStats] Latest Record:", latest);

            // Edad
            let age = 0;
            if (patientData?.date_of_birth) {
                // Agregar T12:00:00 evita desfases de zona horaria al parsear fechas YYYY-MM-DD
                const birthStr = patientData.date_of_birth.includes('T') ? patientData.date_of_birth : `${patientData.date_of_birth}T12:00:00`;
                const birth = new Date(birthStr);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
            }

            // Inputs base (Fallback vital para corregir "Peso 0")
            // Prioridad: 1. Ultima medición, 2. Peso actual del perfil (que la nutri llama initial_weight), 3. Cero
            const patientFallbackWeight = patientData?.current_weight != null ? Number(patientData.current_weight) : 0;
            const weightVal = latest?.weight != null ? Number(latest.weight) : patientFallbackWeight;
            const heightVal = Number(patientData?.height_cm || 0);

            const commonInputs: Record<string, number> = {
                "PESO": weightVal, // Último peso o inicial
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

            // Pre-calcular todas las variables en multiples pases para inyectar cálculos encadenados inversos
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

            // Inputs extra para variables de sistema que no son solo números para cálculo
            const systemValueMap: Record<string, string> = {
                "EDAD": age.toString(),
                "GENERO": patientData?.gender === 'masculino' || patientData?.gender === 'M' ? 'Masculino' : (patientData?.gender === 'femenino' || patientData?.gender === 'F' ? 'Femenino' : 'Otro'),
                "NACIMIENTO": patientData?.date_of_birth ? new Date(patientData.date_of_birth + 'T12:00:00').toLocaleDateString() : (patientData?.date_of_birth || "N/A"),
                "TALLA_V": heightVal.toString()
            };

            console.log("[HealthStats] Context Inputs:", commonInputs);
            console.log("[HealthStats] System Values:", systemValueMap);

            // 3. Ensamblaje robusto por Slot Index (0, 1, 2)
            const finalDynamicStats: any[] = [null, null, null];

            // Llenar con lo configurado en la DB primero
            rawSlots.forEach((slot: any) => {
                let variable = slot.clinical_variables;

                // Enriquecer la variable con su lógica y fórmulas desde rawVariables (crucial para is_calculated)
                if (variable && rawVariables.length > 0) {
                    const richVar = rawVariables.find(v => v.id === variable.id);
                    if (richVar) {
                        variable = richVar;
                    }
                }

                // Si la variable es virtual (de sistema), reconstruirla para el procesamiento
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
                    const calcResult = calculate(variable, {
                        gender: patientData?.gender || 'otro',
                        age,
                        inputs: commonInputs
                    });

                    const isNumericCard = Boolean(variable.unit) || variable.code?.toUpperCase().includes('GRASA') || variable.code?.toUpperCase().includes('PESO') || variable.code?.toUpperCase().includes('TALLA');
                    let computedVal = ((variable.has_ranges ?? variable.hasRanges) && calcResult.range && !isNumericCard)
                        ? calcResult.range.label
                        : calcResult.result.toString();

                    // Fallback defensivo si la fórmula arrojó 0 o NaN (problemas de datos faltantes)
                    if (computedVal === "0" || computedVal === "NaN" || computedVal === "0.00" || computedVal === "0.0") {
                        const preComputed = commonInputs[(variable.code || '').toUpperCase()];
                        if (preComputed !== undefined && preComputed !== 0 && !isNaN(preComputed)) {
                            computedVal = preComputed.toString();
                        } else {
                            const techName = (variable.code || "").toLowerCase();
                            const fixedMap: Record<string, string> = { "peso": "weight", "grasa": "body_fat_percentage", "cintura": "waist_circumference_cm", "musculo": "muscle_mass_percentage" };
                            const fCol = fixedMap[techName];
                            if (fCol && latest && latest[fCol]) {
                                computedVal = latest[fCol].toString();
                            }
                        }
                    }

                    value = computedVal;
                    colorRange = calcResult.range?.color;
                } else if (variable.is_system) {
                    // Manejar variables de sistema directamente del mapa de valores
                    value = systemValueMap[variable.code] || "0";
                    chartData = [];
                } else {
                    const techName = (variable.code || "").toLowerCase();
                    const fixedMapping: Record<string, string> = {
                        "peso": "weight",
                        "grasa": "body_fat_percentage",
                        "cintura": "waist_circumference_cm",
                        "musculo": "muscle_mass_percentage"
                    };

                    const col = fixedMapping[techName];
                    const recordValue = (latest && col) ? latest[col] : null;

                    if (recordValue != null) {
                        value = recordValue.toString();
                        chartData = allRecords.slice(0, 5).reverse().map(r => ({ v: r[col] || 0 }));
                    } else {
                        // Fallback a datos estáticos del paciente si el registro no existe o el valor es nulo
                        if (techName === "peso") {
                            value = patientFallbackWeight.toString();
                        } else if (techName === "talla") {
                            value = (patientData?.height_cm != null) ? patientData.height_cm.toString() : "0";
                        } else {
                            value = latest?.extra_data?.[variable.code]?.toString() || "0";
                        }
                        chartData = [];
                    }
                }

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

            // Rellenar slots vacíos con placeholders predefinidos
            const placeholders = [
                { key: "PESO", label: "Peso", value: commonInputs["PESO"].toString(), unit: "kg", iconName: "Scale", icon: Scale, color: "text-nutrition-600", bgColor: "bg-nutrition-50", chartColor: "#22c55e", chartData: [], rangeColor: null },
                { key: "IMC", label: "IMC", value: (commonInputs["PESO"] > 0 && commonInputs["TALLA"] > 0) ? (commonInputs["PESO"] / (commonInputs["TALLA"] ** 2)).toFixed(1) : "0", unit: "kg/m2", iconName: "Activity", icon: Activity, color: "text-orange-500", bgColor: "bg-orange-50", chartColor: "#f97316", chartData: [], rangeColor: null },
                { key: "CINTURA", label: "Cintura", value: commonInputs["CINTURA"].toString(), unit: "cm", iconName: "Ruler", icon: Ruler, color: "text-indigo-500", bgColor: "bg-indigo-50", chartColor: "#6366f1", chartData: [], rangeColor: null }
            ];

            // Si un slot está vacío, poner un placeholder que no esté repetido
            for (let i = 0; i < 3; i++) {
                if (!finalDynamicStats[i]) {
                    // Buscar el primer placeholder que no esté siendo usado en ningún otro slot
                    const availableFallback = placeholders.find(p => !finalDynamicStats.some(s => s && s.key === p.key));
                    if (availableFallback) {
                        finalDynamicStats[i] = availableFallback;
                    } else {
                        // Si todos los placeholders están usados (caso raro), simplemente usar el de su índice
                        finalDynamicStats[i] = placeholders[i];
                    }
                }
            }

            // SLOT 4: Siempre FIDELIDAD
            finalDynamicStats[3] = {
                key: "loyalty",
                label: "Total de Mediciones",
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
                    return (
                        <Card key={`stat-slot-${idx}`} className="rounded-[2.5rem] animated-border-card group border border-white/5 bg-[#151F32] shadow-2xl overflow-hidden h-full transition-all duration-300" style={{ "--border-glow-color": stat.chartColor } as any}>
                            <div className="animated-border-inner" />
                            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500", stat.bgColor?.replace('bg-', 'bg-white/').replace('50', '5').replace('100', '10'), stat.color)}>
                                            <IconComponent className="h-6 w-6" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none text-right flex-1 ml-4">{stat.label}</p>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-4xl font-tech font-black tracking-tighter", (!stat.rangeColor || stat.rangeColor.startsWith('#')) ? "text-white" : stat.rangeColor.replace('bg-', 'text-'))} style={{ color: stat.rangeColor?.startsWith('#') ? stat.rangeColor : undefined }}>
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-tech font-black uppercase tracking-widest">{stat.unit}</span>
                                    </div>
                                </div>

                                {stat.key !== "loyalty" ? (
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
                                    <div className="mt-6 grid grid-cols-6 gap-1.5">
                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const isLast = i === 11;
                                            const segment = (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-3 flex-1 rounded-sm transition-all duration-700 border border-white/10",
                                                        i < stat.currentCount ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]" : "bg-white/5",
                                                        isLast && "bg-nutri-brand animate-pulse border-nutri-brand/50"
                                                    )}
                                                />
                                            );

                                            if (isLast) {
                                                return (
                                                    <Tooltip key={i}>
                                                        <TooltipTrigger asChild>
                                                            {segment}
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-slate-900 text-white border-slate-800 p-3 rounded-xl max-w-[200px]">
                                                            <p className="text-xs font-bold mb-1 flex items-center gap-1.5 text-amber-400">
                                                                RECOMPENSA EXCLUSIVA
                                                            </p>
                                                            <p className="text-[10px] leading-relaxed opacity-90">
                                                                Al llegar a las <strong>12 mediciones</strong>, ¡obtendrás una evaluación y plan nutricional totalmente <strong>GRATIS!</strong>
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return segment;
                                        })}
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
