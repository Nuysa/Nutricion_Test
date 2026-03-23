"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Upload, Database, Search, Trash2, FileJson,
    Utensils, Info, AlertCircle, CheckCircle2, MoreVertical
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Food } from "@/lib/types/database";

export function FoodDatabase() {
    const { toast } = useToast();
    const supabase = createClient();
    const [foods, setFoods] = useState<Food[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [encoding, setEncoding] = useState("windows-1252");

    const [newFood, setNewFood] = useState({
        category: "",
        emoji: "🍽️",
        name: "",
        portion: "100g",
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    });

    const loadFoods = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("food_database")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) setFoods(data);
            if (error) {
                // If table doesn't exist, we'll show a friendly message later
                console.error("Error loading foods:", error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFoods();
    }, []);

    const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const decoder = new TextDecoder(encoding);
                const csvText = decoder.decode(e.target?.result as ArrayBuffer);
                const rows = csvText.split(/\r?\n/);

                if (rows.length < 2) {
                    toast({
                        title: "Archivo vacío",
                        description: "El CSV debe tener al menos una fila de datos aparte del encabezado.",
                        variant: "destructive"
                    });
                    return;
                }

                // Detect separator: comma or semicolon
                const firstRow = rows[0];
                const separator = firstRow.includes(';') ? ';' : ',';
                console.log("[FoodDatabase] Using separator:", separator);

                const newFoods: any[] = [];
                for (let i = 1; i < rows.length; i++) {
                    const rowContent = rows[i].trim();
                    if (!rowContent) continue;

                    // Manual parsing to handle types and separators
                    // Improved regex for both , and ;
                    const regex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
                    const cols = rowContent.split(regex);

                    if (cols.length < 3) {
                        console.warn(`[FoodDatabase] Skipping row ${i} due to insufficient columns:`, rowContent);
                        continue;
                    }

                    const parseNum = (val: string) => {
                        if (!val) return 0;
                        // Handle numbers with comma as decimal separator (Excel Latam)
                        const cleaned = val.replace('"', "").replace(",", ".").trim();
                        const num = parseFloat(cleaned);
                        return isNaN(num) ? 0 : num;
                    };

                    newFoods.push({
                        category: (cols[0] || "S/C").replace(/"/g, "").trim().toUpperCase(),
                        name: (cols[1] || "Sin nombre").replace(/"/g, "").trim(),
                        emoji: "🍽️",
                        portion: "100g",
                        kcal: parseNum(cols[2]),
                        protein: parseNum(cols[5]),
                        carbs: parseNum(cols[7]),
                        fat: parseNum(cols[6])
                    });
                }

                if (newFoods.length === 0) {
                    toast({
                        title: "No se encontraron datos",
                        description: "No se pudo procesar ninguna fila del archivo. Verifica el formato.",
                        variant: "destructive"
                    });
                    return;
                }

                console.log(`[FoodDatabase] Attempting to insert ${newFoods.length} items...`);
                const { error } = await supabase.from("food_database").insert(newFoods);

                if (error) {
                    console.error("[FoodDatabase] Supabase Insert Error:", error);
                    throw new Error(error.message || "Error al insertar en la base de datos");
                }

                toast({
                    title: "¡Importación exitosa!",
                    description: `Se han agregado ${newFoods.length} alimentos.`,
                });
                loadFoods();
            } catch (err: any) {
                console.error("[FoodDatabase] Import error:", err);
                toast({
                    title: "Error de importación",
                    description: err.message || "Hubo un problema al procesar el archivo CSV.",
                    variant: "destructive"
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from("food_database").insert([newFood]);
            if (error) throw error;

            toast({
                title: "Alimento agregado",
                description: `${newFood.name} se guardó correctamente.`,
            });

            setNewFood({
                category: "",
                emoji: "🍽️",
                name: "",
                portion: "100g",
                kcal: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            });
            loadFoods();
        } catch (err) {
            console.error(err);
            toast({
                title: "Error al guardar",
                description: "No se pudo insertar el alimento en la base de datos.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("¿Estás seguro de que deseas borrar TODA la base de datos de alimentos?")) return;

        try {
            const { error } = await supabase.from("food_database").delete().neq("id", "00000000-0000-0000-0000-000000000000");
            if (error) throw error;

            toast({
                title: "Base de datos vaciada",
                description: "Se han eliminado todos los registros.",
            });
            loadFoods();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredFoods = foods.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-tech font-bold text-white tracking-tight flex items-center gap-3">
                        <Database className="h-8 w-8 text-nutri-brand" />
                        Base de Datos de Alimentos
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium">Gestiona el inventario nutricional global para los nutricionistas.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="px-4 py-1.5 border-white/10 bg-white/5 text-slate-300 font-tech uppercase tracking-widest text-[10px]">
                        {foods.length} Registros Activos
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Import and Manual Entry */}
                <div className="xl:col-span-4 space-y-6">
                    {/* CSV Import Card */}
                    <Card className="bg-nutri-panel border-white/5 overflow-hidden group">
                        <div className="h-1 bg-gradient-to-r from-emerald-500/50 to-emerald-500 group-hover:from-emerald-400 group-hover:to-emerald-300 transition-all" />
                        <CardHeader>
                            <CardTitle className="text-lg font-tech font-bold text-white flex items-center gap-2">
                                <Upload className="h-5 w-5 text-emerald-400" />
                                Importar CSV Oficial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Sube archivos <span className="text-white font-bold">.CSV</span> con codificación específica para Excel en Español (Windows-1252).
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Codificación</label>
                                <select
                                    value={encoding}
                                    onChange={(e) => setEncoding(e.target.value)}
                                    className="w-full bg-nutri-base border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-nutri-brand transition-all cursor-pointer"
                                >
                                    <option value="utf-8">UTF-8 (Estándar)</option>
                                    <option value="windows-1252">Windows-1252 (Excel Latam)</option>
                                </select>
                            </div>

                            <input
                                type="file"
                                id="csv-upload-input"
                                accept=".csv"
                                className="hidden"
                                onChange={handleCSVUpload}
                            />
                            <Button
                                onClick={() => document.getElementById('csv-upload-input')?.click()}
                                className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/10 font-tech font-bold transition-all shadow-lg"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Seleccionar Archivo
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Manual Entry Card */}
                    <Card className="bg-nutri-panel border-white/5 overflow-hidden group">
                        <div className="h-1 bg-gradient-to-r from-nutri-brand/50 to-nutri-brand group-hover:from-orange-400 group-hover:to-orange-300 transition-all" />
                        <CardHeader>
                            <CardTitle className="text-lg font-tech font-bold text-white flex items-center gap-2">
                                <Plus className="h-5 w-5 text-nutri-brand" />
                                Registro Manual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</label>
                                    <Input
                                        placeholder="Ej: FRUTAS, CARNES..."
                                        className="bg-nutri-base border-white/10 rounded-xl h-11 focus:ring-nutri-brand/20 text-white placeholder:text-slate-600"
                                        value={newFood.category}
                                        onChange={e => setNewFood({ ...newFood, category: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Icono</label>
                                        <Input
                                            placeholder="🍎"
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-center text-xl p-0"
                                            value={newFood.emoji}
                                            onChange={e => setNewFood({ ...newFood, emoji: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Alimento</label>
                                        <Input
                                            placeholder="Pechuga de Pollo..."
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-white"
                                            value={newFood.name}
                                            onChange={e => setNewFood({ ...newFood, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Porción Base</label>
                                    <Input
                                        placeholder="100g, 1 unidad..."
                                        className="bg-nutri-base border-white/10 rounded-xl h-11 text-white"
                                        value={newFood.portion}
                                        onChange={e => setNewFood({ ...newFood, portion: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-white/70">Kcal</label>
                                        <Input
                                            type="number" step="0.1"
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-white font-bold"
                                            value={newFood.kcal}
                                            onChange={e => setNewFood({ ...newFood, kcal: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-nutri-brand">Proteínas (g)</label>
                                        <Input
                                            type="number" step="0.1"
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-white font-bold"
                                            value={newFood.protein}
                                            onChange={e => setNewFood({ ...newFood, protein: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-blue-400">Carbos (g)</label>
                                        <Input
                                            type="number" step="0.1"
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-white font-bold"
                                            value={newFood.carbs}
                                            onChange={e => setNewFood({ ...newFood, carbs: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-yellow-500">Grasas (g)</label>
                                        <Input
                                            type="number" step="0.1"
                                            className="bg-nutri-base border-white/10 rounded-xl h-11 text-white font-bold"
                                            value={newFood.fat}
                                            onChange={e => setNewFood({ ...newFood, fat: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-nutri-brand hover:bg-[#e66a00] text-white font-tech font-black text-lg shadow-[0_0_30px_rgba(255,122,0,0.3)] mt-4 transition-transform active:scale-95"
                                >
                                    Guardar en DB
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: List and Search */}
                <div className="xl:col-span-8 flex flex-col h-[850px]">
                    <Card className="bg-nutri-panel border-white/5 flex flex-col h-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 flex items-center gap-4 z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteAll}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[9px]"
                            >
                                <Trash2 className="h-3 w-3 mr-1.5" /> Borrar Todo
                            </Button>
                        </div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-tech font-bold text-white mb-6">Directorio de Nutrientes</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    placeholder="Buscar por nombre, categoría o nutriente..."
                                    className="pl-12 h-14 bg-nutri-base border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-nutri-brand/20 shadow-inner"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 pt-2">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-nutri-brand border-t-transparent mb-4" />
                                    <p className="font-tech font-bold uppercase tracking-widest text-white">Sincronizando DB...</p>
                                </div>
                            ) : filteredFoods.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredFoods.map(food => (
                                        <div
                                            key={food.id}
                                            className="bg-nutri-base border border-white/5 rounded-2xl p-5 hover:border-nutri-brand/30 transition-all group/card shadow-lg hover:shadow-nutri-brand/5 relative"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-3xl group-hover/card:scale-110 transition-transform">
                                                    {food.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] text-nutri-brand font-tech font-black uppercase tracking-widest mb-0.5">{food.category}</p>
                                                    <h4 className="text-sm font-bold text-white truncate leading-tight">{food.name}</h4>
                                                    <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Base: {food.portion}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 rounded-xl p-3 grid grid-cols-2 gap-y-2 border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Calorías</span>
                                                    <span className="text-xs font-black text-white">{food.kcal.toFixed(0)} kcal</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[8px] text-nutri-brand font-bold uppercase">Proteínas</span>
                                                    <span className="text-xs font-black text-white">{food.protein.toFixed(1)}g</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-blue-400 font-bold uppercase">Carbos</span>
                                                    <span className="text-xs font-black text-white">{food.carbs.toFixed(1)}g</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[8px] text-yellow-500 font-bold uppercase">Grasas</span>
                                                    <span className="text-xs font-black text-white">{food.fat.toFixed(1)}g</span>
                                                </div>
                                            </div>

                                            <button className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20 px-8">
                                    <Utensils className="h-20 w-20 mb-6 text-slate-500" />
                                    <h3 className="text-xl font-tech font-bold text-white uppercase tracking-widest">No hay resultados</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs">Intenta con otros términos o importa un archivo CSV para poblar la base de datos.</p>
                                </div>
                            )}
                        </CardContent>

                        <div className="p-4 bg-nutri-base/30 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Base de datos encriptada y optimizada
                            </div>
                            <span>v1.2.0 Build 2026</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
