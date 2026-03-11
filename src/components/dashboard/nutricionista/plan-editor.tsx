"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Wheat,
    Drumstick,
    Droplet,
    Info,
    Edit3,
    User,
    Clock,
    Check,
    Save,
    Plus,
    X,
    Trash2,
    Search,
    Sparkles,
    History,
    ChefHat,
    Scale,
    Activity,
    BrainCircuit,
    ArrowRight,
    LayoutDashboard,
    Coffee,
    UtensilsCrossed,
    Moon,
    AlertTriangle,
    LogIn,
    Menu, // Added from instruction
    Star, // Added from instruction
    LayoutPanelLeft // Added from instruction
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlexiblePlanEditor } from "./flexible-plan-editor"; 
import { VariablesService } from "@/lib/variables-service";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";

// --- Types ---
interface Food {
    id: string;
    category: string;
    emoji: string;
    name: string;
    portion: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
}

const DAYS = [
    { id: "Lunes", label: "Lunes", date: "02 Mar" },
    { id: "Martes", label: "Martes", date: "03 Mar" },
    { id: "Miércoles", label: "Miércoles", date: "04 Mar" },
    { id: "Jueves", label: "Jueves", date: "05 Mar" },
    { id: "Viernes", label: "Viernes", date: "06 Mar" },
    { id: "Sábado", label: "Sábado", date: "07 Mar" },
];

const MEAL_CONFIG = [
    { id: "breakfast", label: "Desayuno", time: "08:30 AM", icon: Coffee },
    { id: "mid-morning", label: "Media Mañana", time: "11:00 AM", icon: UtensilsCrossed },
    { id: "lunch", label: "Almuerzo", time: "02:00 PM", icon: UtensilsCrossed },
    { id: "mid-afternoon", label: "Media Tarde", time: "05:00 PM", icon: Coffee },
    { id: "dinner", label: "Cena", time: "08:30 PM", icon: Moon },
];

export function PlanEditor() {
    const { toast } = useToast();
    const supabase = useMemo(() => createClient(), []);
    const { calculate } = useFormulaEngine();

    // Configuration States
    const [activeDay, setActiveDay] = useState("Lunes");
    const [activeMealId, setActiveMealId] = useState("breakfast");
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [patientPlanType, setPatientPlanType] = useState<string>("sin plan");
    const [patientWeight, setPatientWeight] = useState<number | null>(null);

    // Macro Goal States
    const [goalKcal, setGoalKcal] = useState(1820);
    const [goalPro, setGoalPro] = useState(140);
    const [goalCho, setGoalCho] = useState(180);
    const [goalFat, setGoalFat] = useState(60);

    // Distribution States (%)
    const [dist, setDist] = useState<Record<string, number>>({
        "breakfast": 25,
        "mid-morning": 10,
        "lunch": 35,
        "mid-afternoon": 10,
        "dinner": 20
    });

    // Plan Data (Meals from DB)
    const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);

    // UI States
    const [foodSearch, setFoodSearch] = useState("");
    const [searchResults, setSearchResults] = useState<Food[]>([]);
    const [isSearchingFoods, setIsSearchingFoods] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Calculated Table Values
    const distributedTable = useMemo(() => {
        return MEAL_CONFIG.map(m => {
            const perc = dist[m.id] || 0;
            return {
                id: m.id,
                label: m.label,
                perc,
                kcal: Math.round(goalKcal * (perc / 100)),
                pro: (goalPro * (perc / 100)).toFixed(1),
                cho: (goalCho * (perc / 100)).toFixed(1),
                fat: (goalFat * (perc / 100)).toFixed(1)
            };
        });
    }, [dist, goalKcal, goalPro, goalCho, goalFat]);

    // Initial Load - Patients
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiChoices, setAiChoices] = useState<any[]>([]);

    // Initial Load - Patients
    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
                if (!profile) return;
                const { data: dbPatients } = await supabase
                    .from("patients")
                    .select("id, plan_type, profile:profiles!profile_id(full_name)")
                    .eq("nutritionist_id", profile.id);

                if (dbPatients) {
                    const mapped = dbPatients.map(p => ({
                        id: p.id,
                        name: (p.profile as any)?.full_name,
                        planType: p.plan_type || 'sin plan'
                    }));
                    setPatients(mapped);
                    if (mapped.length > 0 && !selectedPatientId) setSelectedPatientId(mapped[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [supabase]);

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!selectedPatientId) return;
            try {
                const { data: pData, error: pError } = await supabase
                    .from("patients")
                    .select("id, plan_type, current_weight, height_cm, date_of_birth, gender")
                    .eq("id", selectedPatientId)
                    .single();
                
                if (pError) throw pError;

                if (pData) {
                    setPatientPlanType(pData.plan_type || "sin plan");
                    
                    // Fetch latest weight record to get current weight and extra_data
                    const { data: latestRecord } = await supabase
                        .from("weight_records")
                        .select("*")
                        .eq("patient_id", selectedPatientId)
                        .order("date", { ascending: false })
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const currentWeight = latestRecord?.weight || pData.current_weight || 0;
                    
                    // Fetch clinical variables for calculation
                    const vars = await VariablesService.getVariables();
                    
                    // Calculate Age
                    let age = 0;
                    if (pData.date_of_birth) {
                        const birth = new Date(pData.date_of_birth.includes('T') ? pData.date_of_birth : `${pData.date_of_birth}T12:00:00`);
                        const now = new Date();
                        age = now.getFullYear() - birth.getFullYear();
                        const m = now.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    }

                    // Prepare inputs for formula engine
                    const inputs: Record<string, any> = {
                        ...(latestRecord?.extra_data || {}),
                        "PESO": currentWeight,
                        "TALLA": pData.height_cm || 0,
                        "TALLA_CM": pData.height_cm || 0,
                        "EDAD": age,
                        "GENERO_V": pData.gender === 'masculino' || pData.gender === 'M' ? 1 : (pData.gender === 'femenino' || pData.gender === 'F' ? 2 : 0)
                    };

                    // Execute calculations (multiple passes for dependencies)
                    let diagnosisLabel = "";
                    for (let pass = 0; pass < 3; pass++) {
                        vars.forEach(v => {
                            if (v.is_calculated && v.code) {
                                const calc = calculate(v, { gender: pData.gender, age, inputs });
                                inputs[v.code.toUpperCase()] = calc.result;
                                if (v.code === 'DIAGNOSTICO_IMC') {
                                    diagnosisLabel = (calc.range?.label || "").toLowerCase();
                                }
                            }
                        });
                    }

                    // Apply requested logic for initial weight in plans
                    let weightToLoad = currentWeight;
                    const diagnosis = diagnosisLabel.toLowerCase();

                    if (diagnosis.includes("sobrepeso")) {
                        weightToLoad = inputs['PESO_IDEAL'] || currentWeight;
                    } else if (diagnosis.includes("obesidad")) {
                        weightToLoad = inputs['PESO_CORREGIDO'] || currentWeight;
                    } else if (diagnosis.includes("normal") || diagnosis.includes("bajo peso")) {
                        weightToLoad = currentWeight;
                    }

                    setPatientWeight(Number(weightToLoad));
                }
            } catch (err) {
                console.error("Error fetching patient data:", err);
            }
        };
        fetchPatientData();
    }, [selectedPatientId, supabase, calculate]);

    const handlePlanTypeChange = async (newType: string) => {
        setPatientPlanType(newType);
        if (!selectedPatientId) return;

        try {
            await supabase
                .from("patients")
                .update({ plan_type: newType })
                .eq("id", selectedPatientId);

            toast({
                title: "Plan Actualizado",
                description: `Cambiado a ${newType}`,
                className: "bg-[#151F32] border-[#FF7A00] text-white"
            });
        } catch (err) {
            console.error("Error updating plan type:", err);
        }
    };

    const generateAIChoices = async () => {
        const target = distributedTable.find(t => t.id === activeMealId);
        if (!target) return;

        setIsGeneratingAI(true);
        setAiChoices([]);

        try {
            const tgtP = Number(target.pro) || 0;
            const tgtC = Number(target.cho) || 0;
            const tgtF = Number(target.fat) || 0;
            const tgtK = Number(target.kcal) || 0;

            const { data: foods, error } = await supabase.from("food_database").select("*").limit(1000);
            if (error || !foods) throw new Error("DB Error");

            const { data: dbTemplates } = await supabase
                .from("recipe_templates")
                .select("*");

            const mealMap: Record<string, string> = {
                "breakfast": "breakfast",
                "mid-morning": "mid-morning",
                "lunch": "lunch",
                "mid-afternoon": "mid-afternoon",
                "dinner": "dinner"
            };

            // Determinar tipo de comida actual para filtrar plantillas
            let currentMealType = "lunch";
            if (activeMealId.toLowerCase().includes("break")) currentMealType = "breakfast";
            if (activeMealId.toLowerCase().includes("mid-morning")) currentMealType = "mid-morning";
            if (activeMealId.toLowerCase().includes("afternoon")) currentMealType = "mid-afternoon";
            if (activeMealId.toLowerCase().includes("dinner")) currentMealType = "dinner";

            // Filtrar plantillas que coincidan con el tipo de comida
            let recipes = dbTemplates?.filter(t => t.meal_types.includes(currentMealType)) || [];

            // Si no hay plantillas en DB, usar las por defecto
            if (recipes.length === 0) {
                const isBreakfast = currentMealType === "breakfast" || currentMealType === "mid-morning";
                recipes = isBreakfast ? [
                    { name: "Sánguche de Pollo con Jugo", slots: [{ type: "pan", ratio: 0.6, macro: "C" }, { type: "pollo", ratio: 0.8, macro: "P" }, { type: "fruta", ratio: 0.3, macro: "C" }] },
                    { name: "Sánguche de Huevo con Bebida", slots: [{ type: "pan", ratio: 0.6, macro: "C" }, { type: "huevo", ratio: 0.6, macro: "P" }, { type: "leche", ratio: 0.3, macro: "P" }] },
                    { name: "Bowl de Avena con Frutas y Nueces", slots: [{ type: "avena", ratio: 0.6, macro: "C" }, { type: "fruta", ratio: 0.3, macro: "C" }, { type: "leche", ratio: 0.5, macro: "P" }, { type: "nuez", ratio: 0.5, macro: "F" }] },
                ] : [
                    { name: "Segundo de Pollo con Acompañante y Ensalada", slots: [{ type: "pollo", ratio: 0.8, macro: "P" }, { type: "arroz", ratio: 0.7, macro: "C" }, { type: "ensalada", ratio: 0.1, macro: "C" }] },
                    { name: "Res Saltada con Tubérculo y Arroz", slots: [{ type: "carne", ratio: 0.7, macro: "P" }, { type: "papa", ratio: 0.4, macro: "C" }, { type: "arroz", ratio: 0.4, macro: "C" }] },
                    { name: "Filete de Pescado con Guarnición", slots: [{ type: "pesca", ratio: 0.8, macro: "P" }, { type: "camote", ratio: 0.6, macro: "C" }, { type: "verdura", ratio: 0.1, macro: "C" }] },
                ];
            }

            const finalChoices = recipes.map((recipe: any, idx: number) => {
                const selectedItems = recipe.slots.map((slot: any) => {
                    // Buscar con mejores filtros y excluir vísceras/crudos
                    let potential = foods.filter(f => {
                        const name = (f.name || "").toLowerCase();
                        const cat = (f.category || "").toLowerCase();
                        const matchesType = name.includes(slot.type) || cat.includes(slot.type);
                        const isUnwanted = name.match(/v[íi]scera|cruda?o?|sangre|menudencia|pezuña|pata/);

                        // Si es fruta, ser más estricto con la categoría
                        if (slot.type === "fruta") {
                            return (cat.includes("fruta") || name.includes("fruta")) && !isUnwanted;
                        }

                        return matchesType && !isUnwanted;
                    });

                    const item = potential.length > 0 ? potential[Math.floor(Math.random() * potential.length)] : foods[Math.floor(Math.random() * foods.length)];

                    // USAR LOS NOMBRES DE COLUMNA CORRECTOS: protein, carbs, fat
                    const pVal = Number(item.protein || 0);
                    const cVal = Number(item.carbs || 0);
                    const fVal = Number(item.fat || 0);

                    const macroValueForSlot = (slot.macro === "P" ? pVal : slot.macro === "C" ? cVal : fVal);
                    const macroPerG = (macroValueForSlot || 1) / 100;

                    const targetForSlot = (slot.macro === "P" ? tgtP : slot.macro === "C" ? tgtC : tgtF) * slot.ratio;

                    let weight = Math.round(targetForSlot / (macroPerG || 0.1));
                    // Límites de sentido común (ej: no más de 120g de pan, no más de 200g de carne)
                    const maxWeight = slot.type === "pan" ? 100 : slot.type === "pollo" || slot.type === "carne" ? 220 : 250;
                    weight = Math.max(20, Math.min(maxWeight, weight));

                    return {
                        id: `${item.id}-${Math.random()}`,
                        name: item.name,
                        emoji: item.emoji || "🥗",
                        portion: `${weight}g`,
                        kcal: Math.round(Number(item.kcal || 0) * weight / 100),
                        protein: Math.round(pVal * weight / 100),
                        carbs: Math.round(cVal * weight / 100),
                        fat: Math.round(fVal * weight / 100)
                    };
                });

                const totalK = selectedItems.reduce((s: number, i: any) => s + i.kcal, 0);
                const totalP = selectedItems.reduce((s: number, i: any) => s + i.protein, 0);
                const totalC = selectedItems.reduce((s: number, i: any) => s + i.carbs, 0);
                const totalG = selectedItems.reduce((s: number, i: any) => s + i.fat, 0);

                return {
                    id: `choice-${idx}-${Date.now()}`,
                    name: recipe.name,
                    kcal: totalK,
                    protein: totalP,
                    carbs: totalC,
                    fat: totalG,
                    match: Math.min(99, Math.round(90 + (totalK / (tgtK || 1) * 10))),
                    description: `Sugerencia de plato real estructurado para cumplir con ${tgtP}g de proteína.`,
                    items: selectedItems
                };
            });

            setAiChoices(finalChoices);
        } catch (err) {
            console.error(err);
            toast({ title: "Error IA", description: "Fallo al estructurar platos.", variant: "destructive" });
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const addAIOptionToMeal = (option: any) => {
        setWeeklyPlan(prev => prev.map(day => {
            if (day.day !== activeDay) return day;
            const mealKey = activeMealId as keyof typeof day.meals;

            const newItems = option.items.map((item: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: item.name,
                kcal: item.kcal,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                portion: item.portion,
                emoji: item.emoji || "✨"
            }));

            const newMeal = {
                ...day.meals[mealKey],
                name: option.name,
                kcal: option.kcal,
                protein_g: option.protein,
                carbs_g: option.carbs,
                fats_g: option.fat,
                items: newItems
            };

            return { ...day, meals: { ...day.meals, [mealKey]: newMeal } };
        }));

        toast({
            title: "Sugerencia IA aplicada",
            description: `${option.name} ha sido desglosado en sus ingredientes.`,
            className: "bg-[#151F32] border-[#FF7A00] text-white"
        });
    };

    const addFoodToMeal = (food: any) => {
        setWeeklyPlan(prev => prev.map(day => {
            if (day.day !== activeDay) return day;

            const mealKey = activeMealId as keyof typeof day.meals;
            const currentMeal = day.meals[mealKey];

            // Si el meal no tiene items, lo inicializamos
            const currentItems = (currentMeal as any).items || [];
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: food.name,
                kcal: food.kcal,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                portion: food.portion,
                emoji: food.emoji
            };

            const newItems = [...currentItems, newItem];

            // Re-calculamos totales basados en los items
            const newMeal = {
                ...currentMeal,
                items: newItems,
                name: newItems.map(i => i.name).join(", "),
                kcal: Math.round(newItems.reduce((sum: number, i: any) => sum + (i.kcal || 0), 0)),
                protein_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.protein || 0), 0).toFixed(1)),
                carbs_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.carbs || 0), 0).toFixed(1)),
                fats_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.fat || 0), 0).toFixed(1)),
            };

            return {
                ...day,
                meals: {
                    ...day.meals,
                    [mealKey]: newMeal
                }
            };
        }));

        toast({
            title: "Alimento agregado",
            description: `${food.name} se añadió a ${MEAL_CONFIG.find(m => m.id === activeMealId)?.label}.`,
            className: "bg-[#151F32] border-[#FF7A00] text-white"
        });
    };

    const removeFoodFromMeal = (mealId: string, itemId: string) => {
        setWeeklyPlan(prev => prev.map(day => {
            if (day.day !== activeDay) return day;

            const mealKey = mealId as keyof typeof day.meals;
            const currentMeal = day.meals[mealKey];
            const currentItems = (currentMeal as any).items || [];
            const newItems = currentItems.filter((i: any) => i.id !== itemId);

            const newMeal = {
                ...currentMeal,
                items: newItems,
                name: newItems.length > 0 ? newItems.map((i: any) => i.name).join(", ") : "-",
                kcal: Math.round(newItems.reduce((sum: number, i: any) => sum + (i.kcal || 0), 0)),
                protein_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.protein || 0), 0).toFixed(1)),
                carbs_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.carbs || 0), 0).toFixed(1)),
                fats_g: Number(newItems.reduce((sum: number, i: any) => sum + (i.fat || 0), 0).toFixed(1)),
            };

            return {
                ...day,
                meals: {
                    ...day.meals,
                    [mealKey]: newMeal
                }
            };
        }));
    };

    // Food Search Effect
    useEffect(() => {
        const searchFoods = async () => {
            // Si hay algo escrito pero menos de 3 letras, no buscamos y limpiamos
            if (foodSearch.length > 0 && foodSearch.length < 3) {
                setSearchResults([]);
                return;
            }

            setIsSearchingFoods(true);
            try {
                let query = supabase.from("food_database").select("*");

                // Si hay búsqueda, filtramos por nombre, si no, traemos los primeros 20
                if (foodSearch.length >= 3) {
                    query = query.ilike("name", `%${foodSearch}%`);
                }

                const { data, error } = await query.limit(20);

                if (error) throw error;

                if (data) {
                    const mapped = data.map(f => ({
                        id: f.id,
                        name: f.name,
                        category: f.category,
                        emoji: f.emoji,
                        portion: f.base_portion,
                        kcal: Number(f.kcal) || 0,
                        protein: Number(f.protein) || 0,
                        carbs: Number(f.carbs) || 0,
                        fat: Number(f.fat) || 0
                    }));
                    setSearchResults(mapped);
                }
            } catch (err) {
                console.error("Food Search Error:", err);
            } finally {
                setIsSearchingFoods(false);
            }
        };

        const timer = setTimeout(searchFoods, 500);
        return () => clearTimeout(timer);
    }, [foodSearch, supabase]);

    // Load Plan Logic
    const loadPlan = async () => {
        if (!selectedPatientId) return;
        setLoading(true);

        const today = new Date();
        const start = new Date(today.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)));
        start.setHours(0, 0, 0, 0);
        const end = new Date(new Date(start).setDate(start.getDate() + 6));
        end.setHours(23, 59, 59, 999);

        const { data: meals } = await supabase
            .from("meals")
            .select("*")
            .eq("patient_id", selectedPatientId)
            .gte("date", start.toISOString().split('T')[0])
            .lte("date", end.toISOString().split('T')[0]);

        const daysArr = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        const plan = daysArr.map((day, i) => {
            const d = new Date(new Date(start).setDate(start.getDate() + i));
            const dateStr = d.toISOString().split('T')[0];
            const findMeal = (type: string) => {
                const m = meals?.find(m => m.date === dateStr && m.meal_type === type);
                // Aseguramos que los macros sean números, ya que DB a veces los devuelve como strings (NUMERIC)
                return m ? {
                    ...m,
                    kcal: Number(m.kcal || m.calories) || 0,
                    protein_g: Number(m.protein_g) || 0,
                    carbs_g: Number(m.carbs_g) || 0,
                    fats_g: Number(m.fats_g) || 0,
                    items: (m as any).items || []
                } : {
                    name: "-",
                    kcal: 0,
                    carbs_g: 0,
                    protein_g: 0,
                    fats_g: 0,
                    date: dateStr,
                    meal_type: type,
                    items: []
                };
            };

            return {
                day,
                date: dateStr,
                dateNum: d.getDate(),
                meals: {
                    breakfast: findMeal("breakfast"),
                    "mid-morning": findMeal("mid-morning"),
                    lunch: findMeal("lunch"),
                    "mid-afternoon": findMeal("mid-afternoon"),
                    dinner: findMeal("dinner")
                }
            };
        });
        setWeeklyPlan(plan);
        setLoading(false);
    };

    useEffect(() => { loadPlan(); }, [selectedPatientId, weekOffset]);

    const handleSavePlan = async () => {
        if (!selectedPatientId) {
            toast({
                title: "Error",
                description: "Selecciona un paciente antes de guardar.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Transformar weeklyPlan a una lista plana para Supabase
            const mealsToUpsert = weeklyPlan.flatMap(day => {
                return Object.entries(day.meals).map(([mealType, mealData]) => {
                    const meal = mealData as any;
                    return {
                        patient_id: selectedPatientId,
                        date: day.date,
                        meal_type: mealType,
                        name: meal.name || "-",
                        // Sincronizamos ambas columnas de calorías por compatibilidad
                        kcal: Math.round(Number(meal.kcal) || 0),
                        calories: Math.round(Number(meal.kcal) || 0),
                        protein_g: Number(meal.protein_g) || 0,
                        carbs_g: Number(meal.carbs_g) || 0,
                        fats_g: Number(meal.fats_g) || 0,
                        items: meal.items || []
                    };
                });
            });

            console.log("Upserting meals:", mealsToUpsert);

            const { error } = await supabase
                .from("meals")
                .upsert(mealsToUpsert, {
                    onConflict: 'patient_id,date,meal_type'
                })
                .select();

            if (error) {
                console.error("Supabase Upsert Error Detail:", error);
                throw error;
            }

            toast({
                title: "Plan Guardado",
                description: "Los cambios se han sincronizado correctamente.",
                className: "bg-[#151F32] border-[#FF7A00] text-white"
            });
        } catch (err: any) {
            console.error("Save Error:", err);
            toast({
                title: "Error al guardar",
                description: err.message || "No se pudo conectar con la base de datos.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#0B1120] text-white overflow-hidden font-sans border-t border-white/5">
            {/* --- TOP GLOBAL BAR --- */}
            <div className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-[#0B1120]">
                <div className="flex items-center gap-10">
                    <div className="bg-[#151F32] border border-white/5 rounded-2xl px-5 py-2.5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/10">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-[180px]">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Paciente Asignado</span>
                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                <SelectTrigger className="border-none bg-transparent p-0 h-auto text-sm font-black text-white focus:ring-0 mt-0.5">
                                    <SelectValue placeholder="Seleccionar paciente..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    {patients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center justify-between w-full min-w-[200px] gap-4">
                                                <span>{p.name}</span>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0",
                                                    p.planType === 'plan flexible' ? "bg-purple-500/20 text-purple-400 border border-purple-500/20" :
                                                        p.planType === 'plan menu semanal' ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                                                            "bg-slate-500/20 text-slate-400 border border-slate-500/20"
                                                )}>
                                                    {p.planType === 'plan menu semanal' ? 'Menú' : p.planType === 'plan flexible' ? 'Flexible' : 'Sin Plan'}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedPatientId && (
                        <div className={cn(
                            "flex bg-[#151F32] p-1.5 rounded-2xl border border-white/5 shadow-2xl transition-all",
                            patientPlanType === "sin plan" && "opacity-50 grayscale pointer-events-none"
                        )}>
                            <button
                                onClick={() => handlePlanTypeChange("plan flexible")}
                                disabled={patientPlanType === "plan menu semanal" || patientPlanType === "sin plan"}
                                className={cn(
                                    "px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
                                    patientPlanType === "plan flexible" ? "bg-[#FF7A00] text-white shadow-[0_10px_20px_rgba(255,122,0,0.3)]" : "text-slate-500 hover:text-slate-300",
                                    (patientPlanType === "plan menu semanal" || patientPlanType === "sin plan") && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                Plan Flexible
                            </button>
                            <button
                                onClick={() => handlePlanTypeChange("plan menu semanal")}
                                disabled={patientPlanType === "plan flexible" || patientPlanType === "sin plan"}
                                className={cn(
                                    "px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
                                    patientPlanType === "plan menu semanal" ? "bg-[#FF7A00] text-white shadow-[0_10px_20px_rgba(255,122,0,0.3)]" : "text-slate-500 hover:text-slate-300",
                                    (patientPlanType === "plan flexible" || patientPlanType === "sin plan") && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                Menú Semanal
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 flex overflow-hidden">
                {patientPlanType === "sin plan" ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1120] relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none" />

                        <div className="relative text-center space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="h-24 w-24 rounded-3xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-500 mx-auto">
                                <AlertTriangle className="h-10 w-10 opacity-50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-[0.3em] text-slate-400">Paciente Sin Plan Asignado</h3>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto">
                                    Este paciente aún no tiene un tipo de plan asignado. Por favor, asigne un plan desde el panel administrativo.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : patientPlanType === "plan menu semanal" ? (
                    <>
                        {/* --- LEFT SIDEBAR: DAYS --- */}
                        <aside className="w-52 bg-[#0B1120] border-r border-white/5 flex flex-col py-8">
                            <div className="px-8 mb-10">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Días de la Semana</h2>
                            </div>
                            <div className="flex-1 space-y-3 px-4">
                                {weeklyPlan.map(dayInfo => (
                                    <button
                                        key={dayInfo.day}
                                        onClick={() => setActiveDay(dayInfo.day)}
                                        className={cn(
                                            "w-full py-4 px-5 rounded-2xl flex items-center justify-between transition-all group",
                                            activeDay === dayInfo.day
                                                ? "bg-white/5 text-white ring-1 ring-white/10"
                                                : "hover:bg-white/5 text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {activeDay === dayInfo.day && <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A00] animate-pulse" />}
                                            <span className="font-tech font-black text-xs uppercase tracking-widest">{dayInfo.day}</span>
                                        </div>
                                        <span className={cn("text-[10px] font-bold opacity-40", activeDay === dayInfo.day && "opacity-100 text-[#FF7A00]")}>
                                            {dayInfo.dateNum}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* --- CENTER SECTION --- */}
                        <main className="flex-1 flex flex-col overflow-hidden">
                            {/* Top Nav BAR */}
                            <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-md z-40">
                                <div className="flex items-center gap-6">
                                    <div className="space-y-1">
                                        <h1 className="text-2xl font-black tracking-tight text-white">Editor de Plan</h1>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5"
                                                onClick={() => setWeekOffset(prev => prev - 1)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 transition-colors">
                                                <Calendar className="h-4 w-4 text-[#FF7A00]" />
                                                <span className="text-sm font-black text-slate-100 tracking-tight">
                                                    {(() => {
                                                        const today = new Date();
                                                        const start = new Date(today.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)));
                                                        const end = new Date(new Date(start).setDate(start.getDate() + 6));
                                                        const format = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                        return `Semana: ${format(start)} - ${format(end)} ${end.getFullYear()}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5"
                                                onClick={() => setWeekOffset(prev => prev + 1)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Button
                                        onClick={handleSavePlan}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-[#FF7A00] to-[#FF9D42] hover:opacity-90 text-white font-black px-10 h-14 rounded-2xl shadow-[0_15px_35px_rgba(255,122,0,0.25)] flex items-center gap-3 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                    >
                                        <Save className="h-5 w-5" />
                                        Guardar Plan Semanal
                                    </Button>
                                </div>
                            </header>

                            {/* Main Scroll Content */}
                            <ScrollArea className="flex-1 bg-[#0B1120]">
                                <div className="max-w-6xl mx-auto p-10 space-y-10 pb-32">

                                    {/* Objetivo del Paciente Card */}
                                    <Card className="bg-[#151F32] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                                        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                                    <Scale className="h-5 w-5" />
                                                </div>
                                                <CardTitle className="text-lg font-black text-white">Objetivo del Paciente</CardTitle>
                                                {patientWeight && (
                                                    <div className="flex items-center gap-2 bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-3 py-1 rounded-lg">
                                                        <Scale className="h-3 w-3 text-orange-500" />
                                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Peso Actual: {patientWeight}kg</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">Proteínas</span>
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <Input
                                                            type="number"
                                                            value={goalPro}
                                                            onChange={e => setGoalPro(Number(e.target.value))}
                                                            className="w-16 h-8 bg-[#0B1120] border-white/10 text-center font-tech font-bold text-orange-400"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-500">g</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">Carbohidratos</span>
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <Input
                                                            type="number"
                                                            value={goalCho}
                                                            onChange={e => setGoalCho(Number(e.target.value))}
                                                            className="w-16 h-8 bg-[#0B1120] border-white/10 text-center font-tech font-bold text-sky-400"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-500">g</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">Grasas</span>
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <Input
                                                            type="number"
                                                            value={goalFat}
                                                            onChange={e => setGoalFat(Number(e.target.value))}
                                                            className="w-16 h-8 bg-[#0B1120] border-white/10 text-center font-tech font-bold text-yellow-500"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-500">g</span>
                                                    </div>
                                                </div>
                                                <div className="h-12 w-px bg-white/5 mx-2" />
                                                <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-4 py-2 rounded-xl text-center">
                                                    <span className="text-[9px] font-black text-orange-500 uppercase block mb-1">Total Kcal</span>
                                                    <span className="text-xl font-tech font-black text-white">{goalKcal}</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.01]">
                                                        <th className="px-8 py-4">Comida</th>
                                                        <th className="px-8 py-4 text-center">%</th>
                                                        <th className="px-8 py-4 text-center">KCAL</th>
                                                        <th className="px-8 py-4 text-center text-orange-400">Proteínas (G)</th>
                                                        <th className="px-8 py-4 text-center text-sky-400">Carbohidratos (G)</th>
                                                        <th className="px-8 py-4 text-center text-yellow-500">Grasas (G)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {distributedTable.map((row: any) => (
                                                        <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-8 py-4 text-[13px] font-bold text-slate-300">{row.label}</td>
                                                            <td className="px-8 py-4 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={row.perc}
                                                                        onChange={e => setDist(prev => ({ ...prev, [row.id]: Number(e.target.value) }))}
                                                                        className="w-12 h-8 bg-transparent border-none text-center font-tech font-bold text-white focus-visible:ring-0"
                                                                    />
                                                                    <span className="text-[10px] text-slate-500">%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-center font-tech font-bold text-white">{row.kcal}</td>
                                                            <td className="px-8 py-4 text-center font-tech font-bold text-slate-400">{row.pro}g</td>
                                                            <td className="px-8 py-4 text-center font-tech font-bold text-sky-400">{row.cho}g</td>
                                                            <td className="px-8 py-4 text-center font-tech font-bold text-yellow-500">{row.fat}g</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-emerald-500/5 text-emerald-400 font-black text-[11px] uppercase tracking-widest border-t border-emerald-500/20">
                                                        <td className="px-8 py-4">TOTAL DISTRIBUIDO</td>
                                                        <td className="px-8 py-4 text-center">{Object.values(dist).reduce((a: number, b: number) => a + b, 0)}%</td>
                                                        <td className="px-8 py-4 text-center">{distributedTable.reduce((a: number, b: any) => a + b.kcal, 0)}</td>
                                                        <td className="px-8 py-4 text-center">{goalPro}g</td>
                                                        <td className="px-8 py-4 text-center">{goalCho}g</td>
                                                        <td className="px-8 py-4 text-center">{goalFat}g</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>

                                    {/* Comparative Bar (Sticky) */}
                                    <div className="sticky top-0 z-50 bg-[#0B1120]/95 backdrop-blur-md py-6 border-b border-white/10 -mx-10 px-10 mb-10 shadow-2xl">
                                        {(() => {
                                            const dayP = weeklyPlan.find(p => p.day === activeDay);
                                            const totals: any = Object.values(dayP?.meals || {}).reduce((acc: any, m: any) => ({
                                                kcal: acc.kcal + (m.kcal || 0),
                                                pro: acc.pro + (parseFloat(m.protein_g?.toString() || "0")),
                                                cho: acc.cho + (parseFloat(m.carbs_g?.toString() || "0")),
                                                fat: acc.fat + (parseFloat(m.fats_g?.toString() || "0")),
                                            }), { kcal: 0, pro: 0, cho: 0, fat: 0 });

                                            return (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF7A00]">Análisis Comparativo del Plan</h4>
                                                        <Badge className="bg-[#FF7A00] text-white font-tech font-black rounded-lg px-3 py-1 text-xs">
                                                            {activeDay} {dayP?.dateNum || ""}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3">
                                                        {/* Row 1: Plan Objetivo */}
                                                        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-500" />
                                                            <div className="w-32 flex-shrink-0">
                                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Plan Objetivo</span>
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-4 gap-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase">Calorías</span>
                                                                    <span className="text-sm font-tech font-bold text-white tracking-widest">{goalKcal}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase">Proteínas</span>
                                                                    <span className="text-sm font-tech font-bold text-orange-400/80">{goalPro}g</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase">Carbos</span>
                                                                    <span className="text-sm font-tech font-bold text-sky-400/80">{goalCho}g</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase">Grasas</span>
                                                                    <span className="text-sm font-tech font-bold text-yellow-500/80">{goalFat}g</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Plan Actual */}
                                                        <div className="flex items-center gap-4 bg-[#FF7A00]/5 border border-[#FF7A00]/20 rounded-2xl p-4 overflow-hidden relative shadow-[0_0_30px_rgba(255,122,0,0.05)] transition-all">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF7A00]" />
                                                            <div className="w-32 flex-shrink-0">
                                                                <span className="text-[10px] font-black uppercase text-orange-500 tracking-tighter">Plan Actual</span>
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-4 gap-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Calorías</span>
                                                                    <span className="text-lg font-tech font-black text-white leading-none pt-1">{totals.kcal}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Proteínas</span>
                                                                    <span className="text-lg font-tech font-black text-orange-400 leading-none pt-1">{totals.pro.toFixed(1)}g</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Carbos</span>
                                                                    <span className="text-lg font-tech font-black text-sky-400 leading-none pt-1">{totals.cho.toFixed(1)}g</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Grasas</span>
                                                                    <span className="text-lg font-tech font-black text-yellow-500 leading-none pt-1">{totals.fat.toFixed(1)}g</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Meal Cards */}
                                    <div className="space-y-6">
                                        {MEAL_CONFIG.map(config => {
                                            const dayP = weeklyPlan.find(p => p.day === activeDay);
                                            const mealData = dayP?.meals[config.id] || { name: "-", kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0, items: [] };
                                            const items = (mealData as any).items || [];

                                            // Macros objetivos para esta comida según distribución
                                            const target = distributedTable.find(t => t.id === config.id);

                                            // Validación de excesos estricta (con conversión a número para evitar errores de comparación)
                                            const isExceeded = {
                                                kcal: Number(mealData.kcal || 0) > Number(target?.kcal || 0),
                                                pro: Number(mealData.protein_g || 0) > Number(target?.pro || 0),
                                                cho: Number(mealData.carbs_g || 0) > Number(target?.cho || 0),
                                                fat: Number(mealData.fats_g || 0) > Number(target?.fat || 0),
                                            };

                                            let exceededLabel = "";
                                            if (isExceeded.kcal) exceededLabel = "Calorías";
                                            else if (isExceeded.cho) exceededLabel = "Carbohidratos";
                                            else if (isExceeded.pro) exceededLabel = "Proteínas";
                                            else if (isExceeded.fat) exceededLabel = "Grasas";

                                            return (
                                                <div key={config.id} className="space-y-4">
                                                    <Card
                                                        onClick={() => setActiveMealId(config.id)}
                                                        className={cn(
                                                            "bg-[#151F32]/60 border-white/5 rounded-[2rem] p-8 shadow-xl transition-all cursor-pointer relative overflow-hidden",
                                                            activeMealId === config.id ? "ring-2 ring-[#FF7A00]/50 bg-[#151F32]" : "hover:bg-[#151F32]"
                                                        )}
                                                    >
                                                        {/* Card Header */}
                                                        <div className="flex items-start justify-between mb-8">
                                                            <div className="flex gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-400 border border-white/5">
                                                                    <config.icon className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.2em]">{config.label}</span>
                                                                        {mealData.name && mealData.name !== "-" && (
                                                                            <Badge className="bg-[#FF7A00]/10 text-[#FF7A00] text-[9px] font-black border-none px-2 h-4 uppercase">Sugerencia IA</Badge>
                                                                        )}
                                                                    </div>
                                                                    <h3 className="text-xl font-black text-white leading-tight">
                                                                        {mealData.name && mealData.name !== "-" ? mealData.name : `Plan de ${config.label}`}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider">{config.time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-baseline gap-1 mb-2">
                                                                    <span className="text-2xl font-tech font-black text-[#FF7A00] leading-none">{mealData.kcal}</span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">kcal</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] font-bold text-slate-500">P:</span>
                                                                        <span className="text-[10px] font-black text-slate-200">{mealData.protein_g}g</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] font-bold text-slate-300">C:</span>
                                                                        <span className="text-[10px] font-black text-sky-400">{mealData.carbs_g}g</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[9px] font-bold text-slate-200">G:</span>
                                                                        <span className="text-[10px] font-black text-yellow-500">{mealData.fats_g}g</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Warning Alert */}
                                                        {exceededLabel && (
                                                            <div className="flex justify-end mb-6">
                                                                <div className="bg-red-500/5 border border-red-500/20 px-6 py-2 rounded-xl flex items-center gap-3 animate-pulse">
                                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                                    <span className="text-[11px] font-black text-red-400 uppercase tracking-widest italic">¡Excedido en: {exceededLabel}!</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* List of items */}
                                                        <div className="space-y-6 mb-10">
                                                            {items.length === 0 ? (
                                                                <div className="py-4 border-t border-white/5 opacity-20 italic text-[11px] text-center text-slate-400 uppercase tracking-[0.2em]">
                                                                    Sin alimentos seleccionados
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {items.map((item: any) => (
                                                                        <div key={item.id} className="flex items-center justify-between group/item border-t border-white/5 pt-6 first:border-0 first:pt-0">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="h-10 w-10 rounded-xl bg-[#0B1120] flex items-center justify-center text-xl border border-white/5">
                                                                                    {item.emoji || "🥗"}
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="text-[14px] font-black text-slate-100 leading-tight">{item.name}</h4>
                                                                                    <span className="text-[10px] font-bold text-slate-500 italic uppercase tracking-tighter">{item.portion}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-8">
                                                                                <div className="flex items-center gap-6">
                                                                                    <div className="flex flex-col items-end">
                                                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">Proteínas</span>
                                                                                        <span className="text-[10px] font-tech font-black text-slate-300">{item.protein}g</span>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end">
                                                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">Carbos</span>
                                                                                        <span className="text-[10px] font-tech font-black text-sky-400">{item.carbs}g</span>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end">
                                                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">Grasas</span>
                                                                                        <span className="text-[10px] font-tech font-black text-yellow-500">{item.fat}g</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex flex-col items-end min-w-[60px]">
                                                                                        <span className="text-[14px] font-tech font-black text-white">{item.kcal} kcal</span>
                                                                                    </div>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            removeFoodFromMeal(config.id, item.id);
                                                                                        }}
                                                                                        className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-all opacity-100"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {/* RESUMEN DE CONTROL DE MACROS */}
                                                                    <div className="mt-8 pt-6 border-t border-dashed border-white/10 space-y-3">
                                                                        <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Valores Totales (Actual)</span>
                                                                            <div className="flex gap-4">
                                                                                <span className="text-[11px] font-tech font-black text-white">{mealData.kcal} Kcal</span>
                                                                                <span className="text-[11px] font-tech font-black text-orange-400">{mealData.protein_g}g P</span>
                                                                                <span className="text-[11px] font-tech font-black text-sky-400">{mealData.carbs_g}g C</span>
                                                                                <span className="text-[11px] font-tech font-black text-yellow-500">{mealData.fats_g}g G</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center bg-[#FF7A00]/5 p-3 rounded-xl border border-[#FF7A00]/10">
                                                                            <span className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.1em]">Valores Objetivo (Plan)</span>
                                                                            <div className="flex gap-4">
                                                                                <span className="text-[11px] font-tech font-black text-white">{target?.kcal} Kcal</span>
                                                                                <span className="text-[11px] font-tech font-black text-orange-400">{target?.pro}g P</span>
                                                                                <span className="text-[11px] font-tech font-black text-sky-400">{target?.cho}g C</span>
                                                                                <span className="text-[11px] font-tech font-black text-yellow-500">{target?.fat}g G</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Footer Add Button */}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-12 bg-white/[0.02] border-white/10 hover:border-[#FF7A00] hover:bg-[#FF7A00]/5 rounded-2xl text-slate-400 hover:text-[#FF7A00] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all group/btn"
                                                        >
                                                            <Plus className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
                                                            Agregar alimentos aquí
                                                        </Button>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </ScrollArea>
                        </main>

                        {/* --- RIGHT SIDEBAR: PANEL DE SELECCIÓN --- */}
                        <aside className="w-96 bg-[#0B1120] border-l border-white/5 flex flex-col py-8 overflow-hidden">
                            <div className="px-6 mb-8 space-y-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-[#FF7A00]" />
                                    <h2 className="text-lg font-black text-white tracking-tight">Panel de Selección</h2>
                                </div>
                                <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Añadiendo a:</span>
                                    <span className="text-sm font-tech font-black text-orange-400 uppercase tracking-tighter">{MEAL_CONFIG.find(m => m.id === activeMealId)?.label}</span>
                                </div>
                            </div>

                            <Tabs defaultValue="ai" className="flex-1 flex flex-col min-h-0">
                                <div className="px-6 shrink-0">
                                    <TabsList className="w-full bg-[#151F32] p-1 rounded-xl h-12 border border-white/5">
                                        <TabsTrigger value="ai" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Asistente IA</TabsTrigger>
                                        <TabsTrigger value="manual" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Búsqueda Manual</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="ai" className="flex-1 min-h-0 data-[state=active]:flex flex-col mt-8 animate-in fade-in zoom-in-95 duration-300">
                                    <ScrollArea className="flex-1 px-6">
                                        <div className="space-y-8 pb-10">
                                            <div className="space-y-4">
                                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">Selecciona una comida. La IA adaptará sus sugerencias automáticamente.</p>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modo de sugerencia</Label>
                                                    <Select value={activeMealId} onValueChange={setActiveMealId}>
                                                        <SelectTrigger className="h-12 bg-[#151F32] border-white/5 rounded-xl text-white font-bold">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                            {MEAL_CONFIG.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-[#151F32] p-4 rounded-2xl border border-white/5 flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Calorías</span>
                                                    <span className="text-lg font-tech font-black text-white">{distributedTable.find((t: any) => t.id === activeMealId)?.kcal}</span>
                                                </div>
                                                <div className="bg-[#151F32] p-4 rounded-2xl border border-white/5 flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Proteínas</span>
                                                    <span className="text-lg font-tech font-black text-orange-400">{distributedTable.find((t: any) => t.id === activeMealId)?.pro}g</span>
                                                </div>
                                                <div className="bg-[#151F32] p-4 rounded-2xl border border-white/5 flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Carbos</span>
                                                    <span className="text-lg font-tech font-black text-sky-400">{distributedTable.find((t: any) => t.id === activeMealId)?.cho}g</span>
                                                </div>
                                                <div className="bg-[#151F32] p-4 rounded-2xl border border-white/5 flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Grasas</span>
                                                    <span className="text-lg font-tech font-black text-yellow-500">{distributedTable.find((t: any) => t.id === activeMealId)?.fat}g</span>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={generateAIChoices}
                                                disabled={isGeneratingAI}
                                                className="w-full h-14 bg-gradient-to-r from-[#FF7A00] to-[#FF9D43] hover:opacity-90 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 border-none transition-all"
                                            >
                                                {isGeneratingAI ? <Activity className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-white" />}
                                                {isGeneratingAI ? "Analizando Objetivos..." : "Generar 5 Opciones"}
                                            </Button>

                                            {isGeneratingAI ? (
                                                <div className="py-12 flex flex-col items-center justify-center animate-pulse">
                                                    <div className="h-12 w-12 rounded-full border-4 border-[#FF7A00]/20 border-t-[#FF7A00] animate-spin mb-4" />
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculando menús óptimos...</p>
                                                </div>
                                            ) : aiChoices.length > 0 ? (
                                                <div className="space-y-4 pt-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sugerencias Disponibles</span>
                                                        <Badge className="bg-emerald-500 text-white text-[9px]">Perfect Match</Badge>
                                                    </div>
                                                    {aiChoices.map((choice) => (
                                                        <Card
                                                            key={choice.id}
                                                            className="bg-[#151F32] border-white/5 hover:border-[#FF7A00]/40 transition-all cursor-pointer group"
                                                            onClick={() => addAIOptionToMeal(choice)}
                                                        >
                                                            <div className="p-5 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="text-[13px] font-black text-white group-hover:text-orange-400 transition-colors leading-tight flex-1">{choice.name}</h4>
                                                                    <span className="text-[11px] font-tech font-bold text-emerald-400 ml-2">{choice.match}%</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 italic leading-snug">{choice.description}</p>
                                                                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                                                    <span className="text-[11px] font-tech font-bold text-white">{choice.kcal} kcal</span>
                                                                    <div className="flex gap-3 opacity-60">
                                                                        <span className="text-[9px] font-bold text-orange-400">P: {choice.protein}g</span>
                                                                        <span className="text-[9px] font-bold text-sky-400">C: {choice.carbs}g</span>
                                                                        <span className="text-[9px] font-bold text-yellow-500">G: {choice.fat}g</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center opacity-20 pt-10">
                                                    <ChefHat className="h-12 w-12 mb-4" />
                                                    <p className="text-[10px] font-bold font-tech uppercase tracking-widest">Opciones de IA aparecerán aquí</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="manual" className="flex-1 min-h-0 data-[state=active]:flex flex-col mt-8 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="px-6 space-y-6 flex flex-col h-full overflow-hidden">
                                        <div className="relative shrink-0">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                placeholder="Buscar en base de datos..."
                                                value={foodSearch}
                                                onChange={(e) => setFoodSearch(e.target.value)}
                                                className="pl-11 h-12 bg-[#151F32] border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-[#FF7A00] border-none"
                                            />
                                        </div>

                                        <ScrollArea className="flex-1 -mx-6 px-6">
                                            <div className="space-y-3 pb-10">
                                                {isSearchingFoods ? (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                        <Activity className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                                                        <p className="text-xs font-bold font-tech uppercase tracking-widest">Buscando...</p>
                                                    </div>
                                                ) : searchResults.length > 0 ? (
                                                    searchResults.map((food: any) => (
                                                        <Card
                                                            key={food.id}
                                                            className="bg-[#151F32]/40 border-white/5 hover:border-[#FF7A00]/50 transition-all group overflow-hidden cursor-pointer"
                                                        >
                                                            <div className="p-4 flex flex-col gap-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex gap-3">
                                                                        <div className="h-10 w-10 rounded-xl bg-[#0B1120] flex items-center justify-center text-xl border border-white/5">
                                                                            {food.emoji || "🥗"}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{food.category}</span>
                                                                            <h4 className="text-[13px] font-black text-white leading-tight">{food.name}</h4>
                                                                            <span className="text-[10px] font-bold text-slate-500 italic mt-0.5">{food.portion}</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            addFoodToMeal(food);
                                                                        }}
                                                                        className="h-8 w-8 rounded-lg bg-[#FF7A00]/10 hover:bg-[#FF7A00] text-[#FF7A00] hover:text-white transition-all shrink-0 border-none"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-slate-500 uppercase">Kcal</span>
                                                                        <span className="text-[11px] font-tech font-bold text-white">{food.kcal}</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-slate-500 uppercase">Pro</span>
                                                                        <span className="text-[11px] font-tech font-bold text-orange-400">{food.protein}g</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-slate-500 uppercase">Cho</span>
                                                                        <span className="text-[11px] font-tech font-bold text-sky-400">{food.carbs}g</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-slate-500 uppercase">Fat</span>
                                                                        <span className="text-[11px] font-tech font-bold text-yellow-500">{food.fat}g</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))
                                                ) : foodSearch.length > 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                        {foodSearch.length < 3 ? (
                                                            <>
                                                                <Search className="h-10 w-10 mb-4" />
                                                                <p className="text-[10px] font-bold font-tech uppercase tracking-widest text-center">Escribe 3 letras para buscar</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <History className="h-10 w-10 mb-4" />
                                                                <p className="text-[10px] font-bold font-tech uppercase tracking-widest text-center">Sin resultados</p>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </aside>
                    </>
                ) : (
                    <FlexiblePlanEditor patientId={selectedPatientId} />
                )}
            </div>
        </div>
    );
}

export default function PlanEditorPage() {
    return <PlanEditor />;
}
