"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Plus, Calculator, Pencil, Activity, DatabaseZap, Save, Play,
    Trash2, Info, Settings as SettingsIcon, Layers, X, GripVertical,
    Users, User, UserCheck, Timer, ChevronRight, ChevronUp, ChevronDown, CheckCircle2, Split, Loader2, Eye, Scale, Ruler, Milestone, LayoutTemplate, GitBranch
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { VariablesService } from "@/lib/variables-service";

// --- Types ---

interface VariableRange {
    min: number;
    max: number;
    label: string;
    color: string;
}

type TokenType = 'input' | 'operator' | 'function' | 'number' | 'formula_text';

interface Token {
    id: string;
    type: TokenType;
    value: string;
    display: string;
}

interface LogicBranch {
    id: string;
    conditionName: string; // "General", "Varones", "Mujeres", "Mayores 60", etc.
    type: 'default' | 'gender' | 'age';
    conditionValue?: string | number; // 'M', 'F', 60
    tokens: Token[];
    ranges: VariableRange[];
}

interface Variable {
    id: string;
    name: string;
    code: string;
    dataType: 'number' | 'text' | 'date' | 'boolean';
    unit?: string;
    isManual: boolean;
    isCalculated: boolean;
    hasFormula: boolean;
    hasRanges: boolean;
    branches: LogicBranch[];
    manualInputs: string[];
    isSystem?: boolean;
}

// --- Constants ---

const OPERATORS = ["+", "-", "*", "/", "(", ")", "^"];
const FUNCTIONS = ["REDONDEAR"];

interface CardSlot {
    id: string;
    slot_index: number;
    variable_id: string | null;
    icon: string;
    color: string;
    is_active: boolean;
}

const DEFAULT_SLOTS: CardSlot[] = [
    { id: 's1', slot_index: 0, variable_id: '00000000-0000-0000-0000-00000000000c', icon: 'Scale', color: 'text-nutrition-600', is_active: true }, // Peso Base
    { id: 's2', slot_index: 1, variable_id: '00000000-0000-0000-0000-00000000000d', icon: 'Activity', color: 'text-orange-500', is_active: true }, // Talla
    { id: 's3', slot_index: 2, variable_id: '00000000-0000-0000-0000-00000000000a', icon: 'Ruler', color: 'text-indigo-500', is_active: true }, // Edad
];

const INITIAL_VARIABLES: Variable[] = [
    {
        id: "var_date",
        name: "Fecha",
        code: "FECHA",
        dataType: "date",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_date", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    },
    {
        id: "var_weight",
        name: "Peso Actual",
        code: "PESO",
        dataType: "number",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_weight", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    },
    {
        id: "var_imc",
        name: "Índice de Masa Corporal (IMC)",
        code: "IMC",
        dataType: "number",
        isManual: false,
        isCalculated: true,
        hasFormula: true,
        hasRanges: true,
        manualInputs: ["Peso (kg)", "Talla (m)"],
        branches: [
            {
                id: "b1",
                conditionName: "General",
                type: "default",
                tokens: [
                    { id: "t1", type: "input", value: "PESO", display: "Peso (kg)" },
                    { id: "t2", type: "operator", value: "/", display: "/" },
                    { id: "t3", type: "operator", value: "(", display: "(" },
                    { id: "t4", type: "input", value: "TALLA", display: "Talla (m)" },
                    { id: "t5", type: "operator", value: "*", display: "*" },
                    { id: "t6", type: "input", value: "TALLA", display: "Talla (m)" },
                    { id: "t7", type: "operator", value: ")", display: ")" },
                ],
                ranges: [
                    { label: "Bajo Peso", min: 0, max: 18.5, color: "bg-blue-500" },
                    { label: "Normal", min: 18.5, max: 25, color: "bg-green-500" },
                    { label: "Sobrepeso", min: 25, max: 30, color: "bg-yellow-500" },
                    { label: "Obesidad", min: 30, max: 100, color: "bg-red-500" },
                ]
            }
        ]
    },
    {
        id: "var_waist",
        name: "Cintura",
        code: "CINTURA",
        dataType: "number",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_waist", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    },
    {
        id: "var_fat",
        name: "Grasa (%)",
        code: "GRASA",
        dataType: "number",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: true,
        manualInputs: [],
        branches: [{
            id: "b_fat", conditionName: "General", type: "default", tokens: [], ranges: [
                { label: "Bajo", min: 0, max: 10, color: "bg-blue-400" },
                { label: "Normal", min: 10, max: 20, color: "bg-green-400" },
                { label: "Alto", min: 20, max: 100, color: "bg-red-400" },
            ]
        }]
    },
    {
        id: "var_musc",
        name: "Musculo",
        code: "MUSCULO",
        dataType: "number",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_musc", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    },
    {
        id: "var_findings",
        name: "Hallazgos Especialista",
        code: "HALLAZGOS",
        dataType: "text",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_findings", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    },
    {
        id: "var_recom",
        name: "Recomendaciones",
        code: "RECOM",
        dataType: "text",
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: [],
        branches: [{ id: "b_recom", conditionName: "General", type: "default", tokens: [], ranges: [] }]
    }
];

// --- Sub-Components ---

function DraggableSourceItem({ id, type, value, display }: { id: string, type: TokenType, value: string, display: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: `source_${id}`,
        data: {
            type: 'source',
            content: { type, value, display }
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(
            "cursor-grab active:cursor-grabbing px-4 py-2 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm",
            type === 'input' ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100" :
                type === 'operator' ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200" :
                    "bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100"
        )}>
            {display}
        </div>
    );
}

function SortableToken({ token, onRemove }: { token: Token, onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: token.id,
        data: { type: 'token', content: token }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(
            "group flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 shadow-sm transition-all bg-white relative",
            token.type === 'input' ? "border-blue-200 bg-blue-50/50 text-blue-800" :
                token.type === 'operator' ? "border-slate-300 bg-slate-100 text-slate-800 scale-105" :
                    "border-purple-200 bg-purple-50/50 text-purple-800"
        )}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 p-1">
                <GripVertical className="h-3.5 w-3.5" />
            </div>
            <span className={cn("text-[13px] font-black uppercase tracking-tight", token.type === 'operator' && "text-lg font-bold")}>
                {token.display}
            </span>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(token.id); }}
                className="hover:bg-red-500 hover:text-white text-slate-300 rounded-full p-1.5 transition-all -mr-1"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

// --- Main Component ---

export function VariablesConfig() {
    const [variables, setVariables] = useState<Variable[]>([]);
    const [cardSlots, setCardSlots] = useState<CardSlot[]>(DEFAULT_SLOTS);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVarId, setSelectedVarId] = useState<string | null>(null);
    const [activeBranchId, setActiveBranchId] = useState<string>("b1");
    const [testInputs, setTestInputs] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<number | string | null>(null);
    const [draggingPreview, setDraggingPreview] = useState<Token | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Dashboard Modal state
    const [isDashboardPreviewOpen, setIsDashboardPreviewOpen] = useState(false);

    // New variable modal state
    const [isNewVarOpen, setIsNewVarOpen] = useState(false);
    const [newVarData, setNewVarData] = useState<Partial<Variable>>({
        name: '',
        code: '',
        dataType: 'number',
        unit: '',
        isManual: true,
        isCalculated: false,
        hasFormula: false,
        hasRanges: false,
        manualInputs: []
    });

    // Cargar datos desde la Base de Datos al montar
    useEffect(() => {
        async function loadData() {
            try {
                const [varsData, slotsData] = await Promise.all([
                    VariablesService.getVariables(),
                    VariablesService.getCardSlots('paciente')
                ]);

                if (varsData) {
                    const mappedVars: Variable[] = varsData.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        code: v.code,
                        dataType: v.data_type || 'number',
                        unit: v.unit,
                        isManual: v.is_manual ?? true,
                        isCalculated: v.is_calculated ?? false,
                        hasFormula: v.has_formula ?? false,
                        hasRanges: v.has_ranges ?? false,
                        manualInputs: v.manual_inputs || [],
                        isSystem: v.is_system || false,
                        branches: (v.variable_logic && v.variable_logic.length > 0) ? v.variable_logic.map((l: any) => ({
                            id: l.id,
                            conditionName: l.condition_name,
                            type: l.type,
                            conditionValue: l.condition_value,
                            tokens: l.tokens || [],
                            ranges: l.variable_ranges?.sort((a: any, b: any) => a.min - b.min) || []
                        })) : [{
                            // Fallback dummy branch if DB doesn't have it yet to not crash UI
                            id: "b_fallback",
                            conditionName: "General",
                            type: "default",
                            tokens: [],
                            ranges: []
                        }]
                    }));

                    const regularVars = mappedVars.filter(v => !v.isSystem);
                    const systemVars = mappedVars.filter(v => v.isSystem);
                    const orderedVars = [...regularVars, ...systemVars];

                    setVariables(orderedVars);
                    if (orderedVars.length > 0) setSelectedVarId(orderedVars[0].id);
                }

                if (slotsData && slotsData.length > 0) {
                    // Solo cargar y permitir editar los 3 primeros slots dinámicos
                    const editableSlots = slotsData
                        .filter((s: any) => s.slot_index < 3)
                        .map((s: any) => ({
                            id: s.id,
                            slot_index: s.slot_index,
                            variable_id: s.variable_id,
                            icon: s.icon,
                            color: s.color,
                            is_active: s.is_active
                        }));

                    // Asegurar que si faltan algunos de los 3 básicos, se completen con DEFAULT_SLOTS
                    const finalSlots = [...DEFAULT_SLOTS];
                    editableSlots.forEach(es => {
                        const idx = finalSlots.findIndex(fs => fs.slot_index === es.slot_index);
                        if (idx !== -1) finalSlots[idx] = es;
                    });

                    setCardSlots(finalSlots);
                }
            } catch (e) {
                console.error("Error loading config:", e);
                toast({ title: "Error", description: "No se pudo cargar la configuración." });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 2 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const selectedVar = useMemo(() =>
        variables.find(v => v.id === selectedVarId),
        [variables, selectedVarId]);

    const activeBranch = useMemo(() =>
        selectedVar?.branches.find(b => b.id === activeBranchId) || selectedVar?.branches[0],
        [selectedVar, activeBranchId]);

    // Reset test inputs and results when changing variables to avoid ghost states
    useEffect(() => {
        setTestResult(null);
        setTestInputs({});
    }, [selectedVarId, activeBranchId]);

    const handleSaveChanges = async () => {
        if (!selectedVar) return;
        if (selectedVar.isSystem) {
            toast({ title: "Variable de Sistema", description: "Las variables de sistema no pueden ser modificadas.", variant: "default" });
            return;
        }

        const isDuplicateName = variables.some(v => v.id !== selectedVar.id && v.name.trim().toLowerCase() === selectedVar.name.trim().toLowerCase());
        if (isDuplicateName) {
            toast({
                title: "Nombre duplicado detectado",
                description: `Ya existe otra variable con el nombre "${selectedVar.name.trim()}". Elija otro.`,
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            // 1. Guardar la variable primero para obtener el ID real
            const saveVarResult = await VariablesService.saveVariable(selectedVar);
            const realVarId = saveVarResult.id;

            // 2. Actualizar slots localmente si usaban el ID temporal de esta variable
            const updatedSlots = cardSlots.map(s =>
                s.variable_id === selectedVar.id ? { ...s, variable_id: realVarId } : s
            );

            // 3. Guardar slots con los IDs reales
            await VariablesService.saveCardSlots('paciente', updatedSlots);

            // 4. Actualizar estado local para que ya no existan IDs temporales 'var_...'
            // We only need to overwrite the basic info and ID, we should NOT overwrite the entire branches/ranges if they were just saved successfully.
            setVariables(prev => prev.map(v => v.id === selectedVar.id ? { ...v, id: realVarId } : v));
            setSelectedVarId(realVarId);
            setCardSlots(updatedSlots);

            toast({
                title: "Cambios Sincronizados",
                description: `La variable ${selectedVar.name} y el mapeo de tarjetas se han actualizado correctamente.`,
                className: "bg-nutrition-600 text-white border-none rounded-2xl",
            });
        } catch (error: any) {
            console.error("Save error:", error);
            toast({
                title: "Error de Conexión",
                description: error.message || "No se pudieron guardar los cambios en la base de datos.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateCurrentVariable = (updates: Partial<Variable>) => {
        if (!selectedVarId) return;
        setVariables(prev => prev.map(v => v.id === selectedVarId ? { ...v, ...updates } : v));
    };

    const updateCurrentBranch = (updates: Partial<LogicBranch>) => {
        if (!selectedVar || !activeBranch) return;
        setVariables(prev => prev.map(v => {
            if (v.id === selectedVarId) {
                return {
                    ...v,
                    branches: v.branches.map(b => b.id === activeBranch.id ? { ...b, ...updates } : b)
                };
            }
            return v;
        }));
    };

    const addTokenAt = (type: TokenType, value: string, display: string, index?: number) => {
        if (!activeBranch) return;
        const newToken: Token = { id: `t_${Date.now()}_${Math.random()}`, type, value, display };
        const currentTokens = [...activeBranch.tokens];
        if (typeof index === 'number' && index >= 0) {
            currentTokens.splice(index, 0, newToken);
        } else {
            currentTokens.push(newToken);
        }
        updateCurrentBranch({ tokens: currentTokens });
    };

    const removeToken = (id: string) => {
        if (!activeBranch) return;
        updateCurrentBranch({ tokens: activeBranch.tokens.filter(t => t.id !== id) });
    };

    const handleUpdateRange = (rangeIdx: number, field: keyof VariableRange, value: any) => {
        if (!activeBranch) return;
        const newRanges = [...activeBranch.ranges];
        newRanges[rangeIdx] = { ...newRanges[rangeIdx], [field]: value };
        updateCurrentBranch({ ranges: newRanges });
    };

    const addRange = () => {
        if (!activeBranch) return;
        const newRanges = [...activeBranch.ranges, { label: "Nueva Etiqueta", min: 0, max: 0, color: "#94a3b8" }];
        updateCurrentBranch({ ranges: newRanges });
    };

    const removeRange = (idx: number) => {
        if (!activeBranch) return;
        const newRanges = activeBranch.ranges.filter((_, i) => i !== idx);
        updateCurrentBranch({ ranges: newRanges });
    };

    const addConditionalBranch = (type: 'gender' | 'age', value: string | number, name: string) => {
        if (!selectedVar) return;
        const newBranch: LogicBranch = {
            id: `b_${Date.now()}`,
            conditionName: name,
            type,
            conditionValue: value,
            tokens: [...activeBranch!.tokens],
            ranges: [...activeBranch!.ranges]
        };
        setVariables(prev => prev.map(v => v.id === selectedVarId ? { ...v, branches: [...v.branches, newBranch] } : v));
        setActiveBranchId(newBranch.id);
    };

    const handleCreateVariable = async () => {
        const proposedName = newVarData.name?.trim() || "Nueva Variable";
        const isDuplicate = variables.some(v => v.name.trim().toLowerCase() === proposedName.toLowerCase());

        if (isDuplicate) {
            toast({
                title: "Nombre duplicado",
                description: `Ya existe una variable o métrica con el nombre "${proposedName}". Elija uno diferente.`,
                variant: "destructive"
            });
            return;
        }

        const tempId = `var_${Date.now()}`;
        // Generar código automático basado en el nombre (primera palabra o acrónimo)
        const generatedCode = newVarData.name
            ? newVarData.name.trim().toUpperCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            : "VAR";

        const newVar: Variable = {
            id: tempId,
            name: newVarData.name || "Nueva Variable",
            code: generatedCode,
            dataType: newVarData.dataType || 'number',
            isManual: newVarData.isManual || false,
            unit: newVarData.unit,
            isCalculated: newVarData.isCalculated || false,
            hasFormula: newVarData.hasFormula || false,
            hasRanges: newVarData.hasRanges || false,
            manualInputs: [],
            branches: [
                {
                    id: "b_init",
                    conditionName: "General",
                    type: "default",
                    tokens: [],
                    ranges: []
                }
            ]
        };

        try {
            const saveResult = await VariablesService.saveVariable(newVar);
            const realId = saveResult.id;
            const finalVar = { ...newVar, id: realId };

            setVariables(prev => [finalVar, ...prev]);
            setSelectedVarId(realId);
            setActiveBranchId("b_init");
            setIsNewVarOpen(false);
            toast({ title: "Variable Creada", description: "Se ha configurado localmente y en la base de datos exitosamente." });
        } catch (e: any) {
            toast({ title: "Error guardando variable", description: "Revisa tu conexión o vuelve a intentarlo.", variant: "destructive" });
        }
    };

    const handleDeleteVariable = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la variable "${name}"? Esta acción no se puede deshacer.`)) return;
        try {
            await VariablesService.deleteVariable(id);
            setVariables(prev => prev.filter(v => v.id !== id));
            if (selectedVarId === id) setSelectedVarId(variables[0]?.id || null);
            toast({ title: "Variable eliminada" });
        } catch (e: any) {
            toast({ title: "Error al eliminar", description: e.message, variant: "destructive" });
        }
    };

    const moveVariable = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === variables.length - 1) return;

        const targetVar = variables[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const swapVar = variables[swapIndex];

        if (targetVar.isSystem || swapVar.isSystem) {
            toast({ title: "Acción no permitida", description: "Las variables de sistema siempre van al final.", variant: "default" });
            return;
        }

        const newVars = [...variables];
        [newVars[index], newVars[swapIndex]] = [newVars[swapIndex], newVars[index]];

        // Revert hook for errors
        const oldVars = variables;
        setVariables(newVars);

        try {
            await VariablesService.updateVariablesOrder(newVars.map(v => v.id));
        } catch (e: any) {
            toast({ title: "Error", description: "No se guardó el orden.", variant: "destructive" });
            setVariables(oldVars);
        }
    };

    const detectedInputs = useMemo(() => {
        if (!activeBranch) return [];
        let inputs: string[] = [];
        if (activeBranch.tokens && activeBranch.tokens.length > 0) {
            if (activeBranch.tokens[0].type === 'formula_text') {
                const text = activeBranch.tokens[0].value || "";
                const matches = text.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
                inputs = matches.filter(m => {
                    const up = m.toUpperCase();
                    return up !== 'REDONDEAR' && up !== 'MATH' && up !== 'ROUND' && up !== 'ABS' && up !== 'POW';
                }).map(m => m.toUpperCase());
            } else {
                inputs = activeBranch.tokens
                    .filter(t => t.type === 'input')
                    .map(t => t.display.split(" (")[0].toUpperCase());
            }
        }
        return Array.from(new Set(inputs));
    }, [activeBranch]);

    const handleTestFormula = () => {
        if (!activeBranch) return;
        try {
            const numericInputs: Record<string, number> = {};
            for (const [k, v] of Object.entries(testInputs)) {
                const parsed = parseFloat(String(v).replace(',', '.').trim());
                numericInputs[k.toUpperCase()] = isNaN(parsed) ? 0 : parsed;
            }
            const result = VariablesService.calculateVariable(activeBranch.tokens, numericInputs);

            let finalOutput: string | number = result;
            if (selectedVar?.hasRanges && activeBranch.ranges && activeBranch.ranges.length > 0) {
                const matched = activeBranch.ranges.find(r => {
                    const min = Math.min(r.min, r.max);
                    const max = Math.max(r.min, r.max);
                    return result >= min && result <= max;
                });
                if (matched) finalOutput = matched.label;
            }
            setTestResult(finalOutput);
        } catch { setTestResult(0); }
    };

    // --- Eliminated DnD Handlers ---
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Layers className="h-8 w-8 text-nutrition-600" />
                        Variables y Algoritmos
                    </h2>
                    <p className="text-slate-500 font-medium italic">Sección avanzada de reglas nutricionales.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* LEFT SECTION: MINIMAL VARIABLE LIST */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
                    <Dialog open={isNewVarOpen} onOpenChange={setIsNewVarOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-[1.5rem] h-14 shadow-xl flex items-center justify-center gap-3">
                                <Plus className="h-5 w-5" /> Agregar Variable
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black">Configurar Variable</DialogTitle>
                                <DialogDescription>Defina las propiedades de la nueva métrica clínica.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Nombre de la Variable</p>
                                    <Input value={newVarData.name} onChange={e => setNewVarData({ ...newVarData, name: e.target.value })} placeholder="Ej: Masa Muscular" className="rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Tipo de Dato</p>
                                    <select
                                        value={newVarData.dataType}
                                        onChange={e => setNewVarData({ ...newVarData, dataType: e.target.value as any })}
                                        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none"
                                    >
                                        <option value="number">Número</option>
                                        <option value="text">Texto</option>
                                        <option value="date">Fecha</option>
                                        <option value="boolean">Booleano</option>
                                    </select>
                                </div>
                                {newVarData.dataType === 'number' && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Unidad de Medida</p>
                                        <select
                                            value={newVarData.unit || ""}
                                            onChange={e => setNewVarData({ ...newVarData, unit: e.target.value })}
                                            className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none bg-white"
                                        >
                                            <option value="">Ninguna</option>
                                            <option value="kg">kg (Kilogramos)</option>
                                            <option value="g">g (Gramos)</option>
                                            <option value="cm">cm (Centímetros)</option>
                                            <option value="m">m (Metros)</option>
                                            <option value="%">% (Porcentaje)</option>
                                            <option value="kcal">kcal (Kilocalorías)</option>
                                            <option value="mm">mm (Milímetros)</option>
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="variableSourceCreation"
                                            checked={newVarData.isManual}
                                            onChange={() => setNewVarData({ ...newVarData, isManual: true, isCalculated: false })}
                                            className="h-4 w-4 rounded border-slate-300 text-nutrition-600 appearance-none custom-radio"
                                        />
                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center pointer-events-none", newVarData.isManual ? "border-nutrition-600 border-4 bg-white" : "border-slate-300 bg-white")} />
                                        <span className="text-[11px] font-black text-slate-600 uppercase">Dato Manual</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="variableSourceCreation"
                                            checked={newVarData.isCalculated}
                                            onChange={() => setNewVarData({ ...newVarData, isCalculated: true, isManual: false })}
                                            className="h-4 w-4 rounded border-slate-300 text-nutrition-600 appearance-none hidden"
                                        />
                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center pointer-events-none", newVarData.isCalculated ? "border-nutrition-600 border-4 bg-white" : "border-slate-300 bg-white")} />
                                        <span className="text-[11px] font-black text-slate-600 uppercase">Calculado</span>
                                    </label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateVariable} className="w-full bg-nutrition-600 hover:bg-nutrition-700 text-white font-black rounded-xl h-12">Crear Variable Clínica</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* CARD MAPPER SECTION: Moved to a Button + Dialog */}
                    <Dialog open={isDashboardPreviewOpen} onOpenChange={setIsDashboardPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-[1.5rem] h-14 shadow-sm flex items-center justify-center gap-3">
                                <LayoutTemplate className="h-5 w-5 text-nutrition-600" /> Configurar Dashboard Paciente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[7xl] w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col bg-slate-100 border-none rounded-[2rem] shadow-2xl">
                            <DialogHeader className="px-8 py-5 bg-white border-b border-slate-200 flex flex-row items-center justify-between shrink-0">
                                <div>
                                    <DialogTitle className="text-xl font-black flex items-center gap-3 text-slate-800">
                                        <LayoutTemplate className="h-6 w-6 text-nutrition-600" /> Editor del Dashboard de Pacientes
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 mt-1 font-medium">
                                        Modifique los elementos visibles del dashboard del paciente. (Solo las "Cards de Resumen" son editables en esta fase).
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => setIsDashboardPreviewOpen(false)}
                                        variant="outline"
                                        className="h-11 px-6 font-black rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                await VariablesService.saveCardSlots('paciente', cardSlots);
                                                const bc = new BroadcastChannel('nutrigo_global_sync');
                                                bc.postMessage({ type: 'config_updated' });
                                                bc.close();
                                                toast({
                                                    title: "Configuración Guardada",
                                                    description: "El dashboard de los pacientes ha sido actualizado exitosamente.",
                                                    className: "bg-nutrition-600 text-white border-none rounded-2xl",
                                                });
                                            } catch (e: any) {
                                                toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-11 px-6 shadow-md transition-all active:scale-95"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-8 bg-slate-100/50">
                                {/* SIMULATED DASHBOARD FULL LAYOUT */}
                                <div className="max-w-6xl mx-auto space-y-10">
                                    {/* SECTION 1: CARDS (Editable) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-3 w-3 rounded-full bg-nutrition-500 animate-pulse" />
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sección Editable: Resumen</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                                            {cardSlots.slice(0, 3).map((slot, idx) => {
                                                const selectedV = variables.find(v => v.id === slot.variable_id);
                                                const Ico = slot.icon === 'Scale' ? Scale : (slot.icon === 'Ruler' ? Ruler : Activity);
                                                let dummyVal = "—";
                                                let dummyUnit = "";

                                                if (selectedV) {
                                                    const code = (selectedV.code || "").toLowerCase();
                                                    const name = (selectedV.name || "").toLowerCase();

                                                    if (name.includes("género") || name.includes("genero")) {
                                                        dummyVal = "Masculino";
                                                        dummyUnit = "";
                                                    } else if (code.includes("peso") || name.includes("peso")) {
                                                        dummyVal = "72.5";
                                                        dummyUnit = "kg";
                                                    } else if (code.includes("talla") || name.includes("talla")) {
                                                        dummyVal = "175";
                                                        dummyUnit = "cm";
                                                    } else if (code.includes("edad") || name.includes("edad")) {
                                                        dummyVal = "32";
                                                        dummyUnit = "años";
                                                    } else if (code.includes("imc") || name.includes("imc")) {
                                                        dummyVal = "23.6";
                                                        dummyUnit = "kg/m²";
                                                    } else if (code.includes("grasa") || name.includes("grasa")) {
                                                        dummyVal = "18.5";
                                                        dummyUnit = "%";
                                                    } else {
                                                        dummyVal = "24";
                                                        dummyUnit = (selectedV as any).unit || "";
                                                    }
                                                } else {
                                                    dummyVal = "—";
                                                    dummyUnit = "";
                                                }

                                                return (
                                                    <div key={slot.id} className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-nutrition-400 hover:shadow-lg relative h-48">
                                                        <div className="p-6 flex flex-col justify-between h-full relative z-10">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", slot.color.replace('text-', 'bg-').replace('600', '100'), slot.color)}>
                                                                        <Ico className="h-5 w-5" />
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right flex-1 ml-4 truncate">
                                                                        {selectedV?.name || "(Vacío)"}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-3xl font-black tracking-tight text-slate-800">
                                                                        {dummyVal}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-black uppercase">{dummyUnit}</span>
                                                                </div>
                                                            </div>

                                                            {/* Dropdown overlay */}
                                                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 rounded-[2.5rem]">
                                                                <select
                                                                    value={slot.variable_id || ""}
                                                                    onChange={e => {
                                                                        const val = e.target.value || null;
                                                                        setCardSlots(prev => prev.map(s => s.id === slot.id ? { ...s, variable_id: val } : s));
                                                                    }}
                                                                    className="w-full h-11 rounded-xl border-none px-3 text-xs font-black uppercase text-slate-700 bg-white shadow-xl outline-none cursor-pointer focus:ring-4 focus:ring-nutrition-500/20"
                                                                >
                                                                    <option value="">(Seleccione Variable)</option>
                                                                    {variables.map(v => (
                                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Loyalty Card (Static) */}
                                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col opacity-80 h-48">
                                                <div className="p-6 flex flex-col justify-between h-full">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-sky-100 text-sky-500">
                                                                <Milestone className="h-5 w-5" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right flex-1 ml-4 truncate">
                                                                Total Mediciones
                                                            </p>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-black tracking-tight text-slate-800">1</span>
                                                            <span className="text-[10px] text-slate-400 font-black uppercase">total</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-6 grid grid-cols-6 gap-1.5">
                                                        {Array.from({ length: 12 }).map((_, i) => (
                                                            <div key={i} className={cn("h-3 flex-1 rounded-[2px]", i === 0 ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]" : (i === 11 ? "bg-amber-400" : "bg-slate-200/50"))} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: BMI GAUGE MOCK (Not Editable Yet) */}
                                    <div className="space-y-4 opacity-50 grayscale pointer-events-none">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">En Próximas Versiones...</h3>
                                        </div>
                                        <Card className="rounded-[2.5rem] border-slate-200 shadow-sm h-72 flex items-center justify-center bg-white">
                                            <div className="text-center">
                                                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                                <h4 className="text-lg font-black text-slate-400">BMI Gauge & Progreso (No Editable)</h4>
                                            </div>
                                        </Card>
                                        <div className="grid grid-cols-2 gap-6">
                                            <Card className="rounded-[2.5rem] border-slate-200 shadow-sm h-64 flex items-center justify-center bg-white">
                                                <div className="text-center">
                                                    <span className="text-lg font-black text-slate-400">Tracking Dashboard</span>
                                                </div>
                                            </Card>
                                            <Card className="rounded-[2.5rem] border-slate-200 shadow-sm h-64 flex items-center justify-center bg-white">
                                                <div className="text-center">
                                                    <span className="text-lg font-black text-slate-400">Subscription Info</span>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col max-h-[600px]">
                        <CardHeader className="bg-slate-50 border-b py-4 px-6">
                            <CardTitle className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Variables Clínicas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 overflow-hidden flex-1">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-3 pb-4">
                                    {variables.map((v) => (
                                        <div key={v.id} onClick={() => { setSelectedVarId(v.id); setActiveBranchId(v.branches[0]?.id || ""); }} className={cn(
                                            "p-4 rounded-3xl border-2 transition-all cursor-pointer group relative",
                                            selectedVarId === v.id ? "border-nutrition-500 bg-white shadow-lg" : "border-slate-50 bg-white hover:border-slate-200 shadow-sm"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-9 w-9 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                                                    selectedVarId === v.id ? "bg-nutrition-600 text-white" : "bg-slate-100 text-slate-400")}>
                                                    <Calculator className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[13px] font-black text-slate-800 leading-tight truncate">{v.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[8px] h-3 px-1">{v.code}</Badge>
                                                        {v.isCalculated && <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[8px] h-3 px-1">AUTO</Badge>}
                                                    </div>
                                                </div>
                                                {selectedVarId === v.id && (
                                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-2 bg-nutrition-600 rounded-r-full" />
                                                )}

                                                {/* Controles Ocultos que se revelan con group-hover */}
                                                <div className="flex items-center gap-1 transition-opacity">
                                                    {!v.isSystem && (
                                                        <div className="flex flex-col">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); moveVariable(variables.findIndex(x => x.id === v.id), 'up'); }}
                                                                className="p-1 text-slate-400 hover:text-nutrition-600 hover:bg-nutrition-50 rounded"
                                                            >
                                                                <ChevronUp className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); moveVariable(variables.findIndex(x => x.id === v.id), 'down'); }}
                                                                className="p-1 text-slate-400 hover:text-nutrition-600 hover:bg-nutrition-50 rounded"
                                                            >
                                                                <ChevronDown className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!v.isSystem && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteVariable(v.id, v.name); }}
                                                            className="p-2 ml-1 text-slate-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT SECTION: FULL EDITOR (WIDER) */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b p-8 space-y-6">
                            <div className="flex flex-row items-center justify-between">
                                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3 flex-1">
                                    <SettingsIcon className="h-5 w-5 text-nutrition-600" />
                                    <span className="shrink-0">Propiedades de</span>
                                    <Input
                                        value={selectedVar?.name || ""}
                                        onChange={e => {
                                            const newName = e.target.value;
                                            const newCode = newName ? newName.trim().toUpperCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "VAR";
                                            updateCurrentVariable({ name: newName, code: newCode });
                                        }}
                                        disabled={selectedVar?.isSystem}
                                        className={cn(
                                            "border-none bg-transparent hover:bg-slate-100/50 focus:bg-white text-xl font-black p-0 px-2 h-9 focus-visible:ring-0 transition-colors w-full max-w-[400px]",
                                            selectedVar?.isSystem && "opacity-70 cursor-not-allowed"
                                        )}
                                        placeholder="Nombre de la variable"
                                    />
                                </CardTitle>
                                {selectedVar?.isSystem && <Badge className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 rounded-full">SISTEMA</Badge>}
                            </div>

                            {/* Property Selection Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-white p-4 rounded-3xl border shadow-sm">
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Dato</p>
                                    <select
                                        value={selectedVar?.dataType}
                                        onChange={e => updateCurrentVariable({ dataType: e.target.value as any })}
                                        className="w-full h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-nutrition-500/20"
                                    >
                                        <option value="number">Número</option>
                                        <option value="text">Texto</option>
                                        <option value="date">Fecha</option>
                                        <option value="boolean">Booleano</option>
                                    </select>
                                </div>
                                {selectedVar?.dataType === 'number' && (
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad</p>
                                        <select
                                            value={selectedVar?.unit || ""}
                                            onChange={e => updateCurrentVariable({ unit: e.target.value })}
                                            className="w-full h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-nutrition-500/20"
                                        >
                                            <option value="">Ninguna</option>
                                            <option value="kg">kg (Kilogramos)</option>
                                            <option value="g">g (Gramos)</option>
                                            <option value="cm">cm (Centímetros)</option>
                                            <option value="m">m (Metros)</option>
                                            <option value="%">% (Porcentaje)</option>
                                            <option value="kcal">kcal (Kilocalorías)</option>
                                            <option value="mm">mm (Milímetros)</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-3 h-10 mt-auto rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer hidden">
                                    <input
                                        type="radio"
                                        name={`editVarType_${selectedVar?.id}`}
                                    />
                                </div>
                                <label className="flex items-center gap-2 px-3 h-10 mt-auto rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors relative">
                                    <input
                                        type="radio"
                                        name={`editVarType_${selectedVar?.id}`}
                                        checked={selectedVar?.isManual}
                                        onChange={() => updateCurrentVariable({ isManual: true, isCalculated: false })}
                                        className="appearance-none absolute opacity-0"
                                    />
                                    <div className={cn("w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center pointer-events-none transition-colors", selectedVar?.isManual ? "border-nutrition-600 border-[5px] bg-white" : "border-slate-300 bg-white")} />
                                    <span className={cn("text-[10px] font-black uppercase transition-colors", selectedVar?.isManual ? "text-nutrition-600" : "text-slate-600")}>Manual</span>
                                </label>
                                <label className="flex items-center gap-2 px-3 h-10 mt-auto rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors relative">
                                    <input
                                        type="radio"
                                        name={`editVarType_${selectedVar?.id}`}
                                        checked={selectedVar?.isCalculated}
                                        onChange={() => updateCurrentVariable({ isCalculated: true, isManual: false })}
                                        className="appearance-none absolute opacity-0"
                                    />
                                    <div className={cn("w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center pointer-events-none transition-colors", selectedVar?.isCalculated ? "border-nutrition-600 border-[5px] bg-white" : "border-slate-300 bg-white")} />
                                    <span className={cn("text-[10px] font-black uppercase transition-colors", selectedVar?.isCalculated ? "text-nutrition-600" : "text-slate-600")}>Calculado</span>
                                </label>
                                <label className="flex items-center gap-2 px-3 h-10 mt-auto rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={selectedVar?.hasFormula} onChange={e => updateCurrentVariable({ hasFormula: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-nutrition-600" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">Fórmula</span>
                                </label>
                                <div className="flex items-center gap-2 px-3 h-10 mt-auto rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={selectedVar?.hasRanges} onChange={e => {
                                        updateCurrentVariable({ hasRanges: e.target.checked });
                                        if (!e.target.checked) updateCurrentBranch({ ranges: [] });
                                    }} className="h-4 w-4 rounded border-slate-300 text-nutrition-600" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase">Rangos</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="p-8">
                                {/* Selector Dinámico de Condiciones y Ramas Lógicas */}
                                <div className="space-y-8">
                                    <div className="flex bg-slate-100/50 p-2 rounded-2xl gap-2 overflow-x-auto items-center">
                                        <div className="flex items-center text-[10px] font-black uppercase text-slate-400 pl-2 pr-4 tracking-widest gap-2">
                                            <GitBranch className="h-4 w-4" /> Condiciones:
                                        </div>
                                        {selectedVar?.branches.map(b => (
                                            <div key={b.id} className={cn("flex items-center rounded-xl text-[11px] font-black transition-all shadow-sm border overflow-hidden", activeBranchId === b.id ? "bg-white text-nutrition-600 border-slate-200" : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50")}>
                                                <button
                                                    onClick={() => setActiveBranchId(b.id)}
                                                    className="px-4 py-2 whitespace-nowrap outline-none"
                                                >
                                                    {b.conditionName}
                                                </button>
                                                {b.conditionName !== 'General' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button className="px-2 py-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors h-full outline-none">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[400px] rounded-[2rem]">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-xl font-black text-slate-800">Eliminar Variación</DialogTitle>
                                                                <DialogDescription>
                                                                    ¿Estás seguro que deseas eliminar la variación de "{b.conditionName}"? Esta acción no se puede deshacer.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="flex gap-3 justify-end mt-4">
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" className="rounded-xl font-bold border-slate-200">Cancelar</Button>
                                                                </DialogTrigger>
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newBranches = selectedVar.branches.filter(br => br.id !== b.id);
                                                                        updateCurrentVariable({ branches: newBranches });
                                                                        if (activeBranchId === b.id) {
                                                                            setActiveBranchId(newBranches[0]?.id || "b_init");
                                                                        }
                                                                    }}
                                                                    className="rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white border-none shadow-md"
                                                                >
                                                                    Sí, eliminar
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex-1" />
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="h-8 text-[10px] font-black uppercase bg-white border border-slate-200 text-nutrition-600 hover:bg-nutrition-50 rounded-lg shrink-0 shadow-sm">
                                                    <Plus className="h-3 w-3 mr-1" /> Variación
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-[400px] rounded-[2rem]">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-black">Añadir Condición Especial</DialogTitle>
                                                    <DialogDescription>
                                                        Permite asignar su propia fórmula matemática y rangos dependiendo de quién sea el paciente analizado.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-4 py-4">
                                                    <Button onClick={() => addConditionalBranch('gender', 'M', 'Hombres')} className="h-16 flex-col gap-1 font-black bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-none rounded-2xl hover:scale-105 transition-all">
                                                        <span className="text-xl px-0 py-0">♂️</span> Hombres
                                                    </Button>
                                                    <Button onClick={() => addConditionalBranch('gender', 'F', 'Mujeres')} className="h-16 flex-col gap-1 font-black bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700 border-none rounded-2xl hover:scale-105 transition-all">
                                                        <span className="text-xl px-0 py-0">♀️</span> Mujeres
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <Accordion type="multiple" defaultValue={["logic", "ranges"]} className="w-full space-y-4">
                                        {selectedVar?.hasFormula && (
                                            <AccordionItem value="logic" className="border border-slate-100 rounded-[2rem] px-8 bg-slate-50/30">
                                                <AccordionTrigger className="font-black uppercase text-sm text-slate-700 py-6 hover:no-underline">
                                                    <div className="flex items-center gap-3">
                                                        <Calculator className="h-5 w-5 text-nutrition-600" />
                                                        Lógica de Cálculo
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-8 space-y-8">
                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fórmula (ej. PESO / (TALLA_V^2))</p>
                                                        <textarea
                                                            value={activeBranch?.tokens?.[0]?.type === 'formula_text' ? activeBranch.tokens[0].value : activeBranch?.tokens?.map(t => t.value).join(" ")}
                                                            onChange={e => updateCurrentBranch({ tokens: [{ id: "t_text", type: "formula_text", value: e.target.value, display: "text" }] })}
                                                            placeholder="Escriba la fórmula aquí. Use el código exacto de la variable en mayúsculas."
                                                            className="w-full min-h-[120px] p-6 rounded-[2rem] border-2 border-slate-200 focus:border-nutrition-500 focus:ring-4 focus:ring-nutrition-500/10 text-lg font-black font-mono text-slate-800 outline-none transition-all resize-y shadow-inner"
                                                        />
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 mr-2">Variables Activas (Clic para añadir):</p>
                                                            {variables.filter(v => v.dataType === 'number').map(v => (
                                                                <Badge key={v.id} onClick={() => {
                                                                    const txt = activeBranch?.tokens?.[0]?.type === 'formula_text' ? activeBranch.tokens[0].value : activeBranch?.tokens?.map(t => t.value).join(" ");
                                                                    updateCurrentBranch({ tokens: [{ id: "t_text", type: "formula_text", value: `${txt || ''} ${v.code}`.trimStart(), display: "text" }] });
                                                                }} className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-2 py-0.5 font-bold uppercase cursor-pointer transition-colors active:scale-95">
                                                                    {v.code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-slate-100">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-2">
                                                                <Play className="h-4 w-4 text-nutrition-600" />
                                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Probador en Vivo</p>
                                                            </div>
                                                            <Button onClick={handleTestFormula} className="bg-nutrition-600 hover:bg-nutrition-700 text-white px-8 h-10 font-black rounded-xl border-none shadow-lg">Ejecutar Prueba</Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                                            {detectedInputs.length > 0 ? detectedInputs.map(input => (
                                                                <div key={input} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-tighter">{input}</p>
                                                                    <Input
                                                                        placeholder="0.00"
                                                                        value={testInputs[input] || ""}
                                                                        onChange={e => setTestInputs({ ...testInputs, [input]: e.target.value })}
                                                                        className="h-9 text-sm font-black rounded-xl border-slate-50 bg-slate-50/50 focus:bg-white transition-colors"
                                                                    />
                                                                </div>
                                                            )) : (
                                                                <div className="col-span-full py-4 text-center">
                                                                    <p className="text-slate-300 text-[10px] font-bold uppercase italic">Construye la fórmula para ver los campos de prueba</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {testResult !== null && (
                                                            <div className="p-6 bg-slate-900 rounded-[2.5rem] flex items-center justify-between shadow-2xl ring-4 ring-nutrition-500/10 transition-all animate-in zoom-in-95 duration-300">
                                                                <div>
                                                                    <span className="text-nutrition-500 text-[10px] font-black uppercase tracking-widest block mb-1">Resultado Simulado</span>
                                                                    <span className="text-white text-4xl font-black">
                                                                        {typeof testResult === 'number' ? testResult.toFixed(2) : testResult} {selectedVar?.unit && <span className="text-2xl opacity-70 ml-1">{selectedVar.unit}</span>}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge className="bg-green-500/20 text-green-400 border-none px-4 py-1 font-black uppercase text-[10px]">Cálculo Correcto</Badge>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {selectedVar?.hasRanges && (
                                            <AccordionItem value="ranges" className="border border-slate-100 rounded-[2rem] px-8 bg-slate-50/30">
                                                <AccordionTrigger className="font-black uppercase text-sm text-slate-700 py-6 hover:no-underline">
                                                    <div className="flex items-center gap-3">
                                                        <Layers className="h-5 w-5 text-purple-600" />
                                                        Configuración de Rangos
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-8">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {activeBranch?.ranges.map((range, idx) => (
                                                            <div key={idx} className="relative p-6 bg-white rounded-[2rem] border-2 border-slate-100/50 space-y-4 shadow-sm group hover:border-purple-200 transition-colors">
                                                                <button onClick={() => removeRange(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="relative h-8 w-8 min-w-[2rem] rounded-full overflow-hidden shadow-sm border-2 border-slate-200 focus-within:border-nutrition-500 focus-within:ring-2 focus-within:ring-nutrition-500/20" style={{ backgroundColor: (range.color && range.color.startsWith('#')) ? range.color : '#94a3b8' }}>
                                                                        <input
                                                                            type="color"
                                                                            value={(range.color && range.color.startsWith('#')) ? range.color : '#94a3b8'}
                                                                            onChange={e => handleUpdateRange(idx, 'color', e.target.value)}
                                                                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer p-0 border-0 opacity-0"
                                                                            title="Elegir color"
                                                                        />
                                                                    </div>
                                                                    <Input value={range.label} onChange={e => handleUpdateRange(idx, 'label', e.target.value)} className="h-8 font-black flex-1 text-slate-700 bg-transparent border-none p-0 focus-visible:ring-0 text-sm" style={{ color: (range.color && range.color.startsWith('#')) ? range.color : undefined }} />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Desde</p>
                                                                        <Input type="number" value={range.min} onChange={e => handleUpdateRange(idx, 'min', parseFloat(e.target.value))} className="h-10 font-black rounded-xl bg-slate-50 border-none" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Hasta</p>
                                                                        <Input type="number" value={range.max} onChange={e => handleUpdateRange(idx, 'max', parseFloat(e.target.value))} className="h-10 font-black rounded-xl bg-slate-50 border-none" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button onClick={addRange} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-nutrition-500 hover:bg-nutrition-50 transition-all text-slate-400 hover:text-nutrition-600 gap-2 min-h-[140px]">
                                                            <Plus className="h-6 w-6" />
                                                            <span className="text-[10px] font-black uppercase">Nueva Etiqueta</span>
                                                        </button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                </div>
                            </div>

                            <div className="p-8 bg-white border-t flex gap-4">
                                <Button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="flex-1 bg-nutrition-600 hover:bg-nutrition-700 text-white font-black rounded-[1.5rem] h-14 shadow-xl shadow-nutrition-200/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3" />}
                                    Guardar Cambios en {selectedVar?.name || 'Variable'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div >
            </div >
        </div >
    );
}
