"use client";

import { useState, useEffect } from "react";
import {
    History,
    Calendar,
    ChevronDown,
    LayoutDashboard,
    Users,
    Activity,
    Edit2,
    Check,
    Save,
    Loader2,
    Scale,
    Plus,
    ChevronLeft as ArrowLeft,
    ChevronRight as ArrowRight,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { VariablesService, DashboardColumn } from "@/lib/variables-service";
import { useToast } from "@/hooks/use-toast";
import { PatientWidgetEditor } from "./patient-widget-editor";
import { ConsultationFormEditor } from "./consultation-form-editor";

interface EditableColumn extends DashboardColumn {
    id: string;
    isEditing?: boolean;
}

export function TableEditor() {
    const { toast } = useToast();
    const [currentRole, setCurrentRole] = useState<'paciente' | 'nutricionista'>('nutricionista');
    const [columns, setColumns] = useState<EditableColumn[]>([]);
    const [variables, setVariables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadLayout = async (role: string) => {
        setLoading(true);
        try {
            const [data, vars] = await Promise.all([
                VariablesService.getDashboardLayout(role),
                VariablesService.getVariables()
            ]);
            setVariables(vars);
            if (data && data.columns && data.columns.length > 0) {
                setColumns(data.columns.map((c: any, i: number) => ({ ...c, id: `${role}-${Math.random().toString(36).substr(2, 9)}` })));
            } else {
                // Si no hay datos, usar los valores por defecto
                const defaults = role === 'nutricionista' ? [
                    { header: "Fecha", fixed_variable: "date" },
                    { header: "Peso Actual", fixed_variable: "weight" },
                    { header: "Grasa (%)", fixed_variable: "body_fat" },
                    { header: "Cintura", fixed_variable: "waist" },
                    { header: "Hallazgos Especialista", fixed_variable: "findings" },
                    { header: "Recomendaciones", fixed_variable: "recommendations" },
                ] : [
                    { header: "Nº", fixed_variable: "index" },
                    { header: "Fecha Consulta", fixed_variable: "date" },
                    { header: "Peso", fixed_variable: "weight" },
                    { header: "IMC", fixed_variable: "bmi" },
                    { header: "Grasa", fixed_variable: "body_fat" },
                    { header: "Cintura", fixed_variable: "waist" },
                    { header: "Especialista", fixed_variable: "nutritionist" },
                ];
                setColumns(defaults.map((c, i) => ({ ...c, id: `${role}-def-${i}` })) as EditableColumn[]);
            }
        } catch (error) {
            console.error("Error loading layout:", error);
            // Fallback en caso de error crítico de red o base de datos
            const roleForFallback = role === 'nutricionista' ? 'nutricionista' : 'paciente';
            const defaults = roleForFallback === 'nutricionista' ? [
                { header: "Fecha", fixed_variable: "date" },
                { header: "Peso Actual", fixed_variable: "weight" },
                { header: "Grasa (%)", fixed_variable: "body_fat" },
                { header: "Cintura", fixed_variable: "waist" },
                { header: "Hallazgos Especialista", fixed_variable: "findings" },
                { header: "Recomendaciones", fixed_variable: "recommendations" },
            ] : [
                { header: "Nº", fixed_variable: "index" },
                { header: "Fecha Consulta", fixed_variable: "date" },
                { header: "Peso", fixed_variable: "weight" },
                { header: "IMC", fixed_variable: "bmi" },
                { header: "Grasa", fixed_variable: "body_fat" },
                { header: "Cintura", fixed_variable: "waist" },
                { header: "Especialista", fixed_variable: "nutritionist" },
            ];
            setColumns(defaults.map((c, i) => ({ ...c, id: `${roleForFallback}-err-${i}` })) as EditableColumn[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLayout(currentRole);
    }, [currentRole]);

    const toggleEdit = (id: string) => {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, isEditing: !c.isEditing } : c));
    };

    const updateHeaderAndToggle = (id: string, newHeader: string, newVarId?: string | null) => {
        setColumns(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    header: newHeader,
                    variable_id: newVarId !== undefined ? newVarId : c.variable_id,
                    fixed_variable: newVarId ? undefined : c.fixed_variable,
                    isEditing: false
                };
            }
            return c;
        }));
    };

    const addColumn = () => {
        const newCol: EditableColumn = {
            id: `new-${Math.random().toString(36).substr(2, 9)}`,
            header: "Nueva Columna",
            variable_id: null,
            isEditing: true
        };
        setColumns([...columns, newCol]);
    };

    const removeColumn = (id: string) => {
        setColumns(columns.filter(c => c.id !== id));
    };

    const moveColumn = (index: number, direction: 'left' | 'right') => {
        const newCols = [...columns];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newCols.length) return;

        const temp = newCols[index];
        newCols[index] = newCols[targetIndex];
        newCols[targetIndex] = temp;
        setColumns(newCols);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const cleanColumns = columns.map(({ id, isEditing, ...rest }) => rest);
            await VariablesService.saveDashboardLayout(currentRole, cleanColumns);
            toast({
                title: "Configuración Guardada",
                description: `Los encabezados para ${currentRole} se han actualizado correctamente.`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error al guardar",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header / Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-nutrition-600 flex items-center justify-center shadow-lg shadow-nutrition-600/20">
                            <History className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Estructura de Tablas</h2>
                    </div>
                    <p className="text-sm font-medium text-slate-500 italic ml-13">Personaliza los títulos de las columnas para cada perfil.</p>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="flex flex-col gap-1.5 min-w-[280px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Seleccionar Perfil</p>
                        <div className="relative group">
                            <select
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value as any)}
                                className="w-full h-12 appearance-none rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-black text-slate-800 outline-none transition-all focus:border-nutrition-600 focus:bg-white cursor-pointer"
                            >
                                <option value="nutricionista">Vista Nutricionista</option>
                                <option value="paciente">Vista Paciente</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {currentRole !== 'paciente' && (
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl px-10 h-12 shadow-xl active:scale-95 transition-all group"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />}
                            Guardar Cambios
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Switcher */}
            {currentRole === 'paciente' ? (
                <PatientWidgetEditor />
            ) : (
                <ConsultationFormEditor />
            )}
        </div>
    );
}
