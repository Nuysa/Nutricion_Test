"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus, Search, Trash2, Edit3, Save,
    Sparkles, Check, X, ChefHat, Layers,
    Clock, Utensils
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface IngredientSlot {
    id: string;
    type: string; // The search term or name
    ratio: number;
    macro: "P" | "C" | "F";
}

interface RecipeTemplate {
    id: string;
    name: string;
    meal_types: string[];
    slots: IngredientSlot[];
}

export function RecipeTemplates() {
    const { toast } = useToast();
    const supabase = createClient();
    const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
    const [slots, setSlots] = useState<IngredientSlot[]>([]);
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [foodResults, setFoodResults] = useState<any[]>([]);

    const mealTypes = [
        { id: "breakfast", label: "Desayuno" },
        { id: "mid-morning", label: "Media Mañana" },
        { id: "lunch", label: "Almuerzo" },
        { id: "mid-afternoon", label: "Media Tarde" },
        { id: "dinner", label: "Cena" }
    ];

    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from("recipe_templates")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) setTemplates(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        const searchFoods = async () => {
            if (ingredientSearch.length < 2) {
                setFoodResults([]);
                return;
            }
            const { data } = await supabase
                .from("food_database")
                .select("*")
                .ilike("name", `%${ingredientSearch}%`)
                .limit(5);
            if (data) setFoodResults(data);
        };
        const timer = setTimeout(searchFoods, 300);
        return () => clearTimeout(timer);
    }, [ingredientSearch]);

    const addIngredientToTemplate = (food: any) => {
        const newSlot: IngredientSlot = {
            id: Math.random().toString(36).substr(2, 9),
            type: food.name.toLowerCase(),
            ratio: 0.5, // Default ratio
            macro: food.protein > food.carbs ? "P" : food.carbs > food.fat ? "C" : "F"
        };
        setSlots([...slots, newSlot]);
        setIngredientSearch("");
        setFoodResults([]);
    };

    const removeSlot = (id: string) => {
        setSlots(slots.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        if (!name || selectedMealTypes.length === 0 || slots.length === 0) {
            toast({ title: "Faltan datos", description: "Completa el nombre, tipos de comida e ingredientes.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.from("recipe_templates").insert([{
                name,
                meal_types: selectedMealTypes,
                slots: slots
            }]);

            if (error) throw error;

            toast({ title: "Plantilla Guardada", description: "La IA podrá usar este plato ahora." });
            setName("");
            setSelectedMealTypes([]);
            setSlots([]);
            loadTemplates();
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo guardar la plantilla.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Plantillas de Recetas para IA</h2>
                <p className="text-slate-400 mt-1 text-sm font-medium">Crea combinaciones lógicas de ingredientes. La IA calculará los gramos automáticamente.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Panel de Creación */}
                <div className="xl:col-span-4">
                    <Card className="bg-[#151F32]/60 border-white/5 rounded-[2rem] p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                <Layers className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-black text-white">Crear Plantilla</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Plato</label>
                                <Input
                                    placeholder="Ej: Sándwich de Pollo y Palta"
                                    className="bg-[#0B1120] border-white/10 rounded-xl h-12 text-white placeholder:text-slate-600 focus:ring-orange-500/20"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apto para (Tipos de Comida)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {mealTypes.map(type => (
                                        <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                                            <div
                                                onClick={() => {
                                                    if (selectedMealTypes.includes(type.id)) {
                                                        setSelectedMealTypes(selectedMealTypes.filter(t => t !== type.id));
                                                    } else {
                                                        setSelectedMealTypes([...selectedMealTypes, type.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    "h-5 w-5 rounded-md border transition-all flex items-center justify-center",
                                                    selectedMealTypes.includes(type.id)
                                                        ? "bg-orange-500 border-orange-500"
                                                        : "bg-[#0B1120] border-white/10 group-hover:border-white/30"
                                                )}
                                            >
                                                {selectedMealTypes.includes(type.id) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingredientes de la Base de Datos</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <Input
                                            placeholder="Buscar para añadir..."
                                            className="pl-11 bg-[#0B1120] border-white/10 rounded-xl h-12 text-white"
                                            value={ingredientSearch}
                                            onChange={e => setIngredientSearch(e.target.value)}
                                        />
                                        {foodResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#151F32] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                {foodResults.map(food => (
                                                    <button
                                                        key={food.id}
                                                        onClick={() => addIngredientToTemplate(food)}
                                                        className="w-full text-left p-4 hover:bg-white/5 text-sm font-bold text-slate-300 border-b border-white/5 last:border-0 flex items-center gap-3"
                                                    >
                                                        <span className="text-lg">{food.emoji || "🥗"}</span>
                                                        {food.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {slots.map((slot) => (
                                        <div key={slot.id} className="bg-[#0B1120] border border-white/5 rounded-xl p-4 flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <Utensils className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm font-bold text-slate-200 capitalize">{slot.type}</span>
                                            </div>
                                            <button
                                                onClick={() => removeSlot(slot.id)}
                                                className="h-6 w-6 rounded-md hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all flex items-center justify-center"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {slots.length === 0 && (
                                        <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Agrega ingredientes</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-95 transition-all mt-6"
                            >
                                {isSaving ? "Guardando..." : "Guardar Plantilla"}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Directorio de Recetas */}
                <div className="xl:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white">Directorio de Recetas</h3>
                        <Badge className="bg-white/5 text-slate-400 border-none font-bold px-3 py-1 uppercase text-[10px]">
                            {templates.length} Recetas activas
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {templates.map(tpl => (
                            <Card key={tpl.id} className="bg-[#151F32]/60 border-white/5 rounded-[2rem] p-8 hover:bg-[#151F32] transition-all group relative">
                                <button className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                    <Edit3 className="h-5 w-5" />
                                </button>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black text-white leading-tight mb-2">{tpl.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {tpl.meal_types.map(m => (
                                                <Badge key={m} className="bg-orange-500/10 text-orange-500 text-[9px] font-black border-none uppercase px-2 h-5">
                                                    {mealTypes.find(mt => mt.id === m)?.label || m}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                                        {tpl.slots.map(slot => (
                                            <div key={slot.id} className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    slot.macro === "P" ? "bg-orange-400" : slot.macro === "C" ? "bg-sky-400" : "bg-yellow-400"
                                                )} />
                                                <span className="text-[11px] font-bold text-slate-300 capitalize">{slot.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {!loading && templates.length === 0 && (
                            <div className="py-20 text-center bg-[#151F32]/20 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                                <ChefHat className="h-16 w-16 mx-auto mb-4 text-slate-500" />
                                <p className="text-sm font-bold uppercase tracking-widest">Aún no hay plantillas creadas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
