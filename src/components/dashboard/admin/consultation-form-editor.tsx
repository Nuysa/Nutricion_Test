"use client";

import { useState, useEffect } from "react";
import { Check, Edit2, Loader2, Plus, Save, Trash2, GripVertical, AlertCircle, Apple, Stethoscope, Ruler, User, Activity, LayoutTemplate, Scale, Droplet, BicepsFlexed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NewConsultationForm } from "@/components/dashboard/nutricionista/NewConsultationForm";
import { cn } from "@/lib/utils";
import { VariablesService, DashboardColumn, ClinicalVariable } from "@/lib/variables-service";
import { useToast } from "@/hooks/use-toast";

interface EditableField extends DashboardColumn {
    id: string;
    isEditing?: boolean;
}

export function ConsultationFormEditor() {
    const { toast } = useToast();
    const [fields, setFields] = useState<EditableField[]>([]);
    const [variables, setVariables] = useState<ClinicalVariable[]>([]);
    const [cardSlots, setCardSlots] = useState<any[]>([]);
    const [isDashboardPreviewOpen, setIsDashboardPreviewOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSavingCards, setIsSavingCards] = useState(false);

    const DEFAULT_SLOTS = [
        { id: 'n1', slot_index: 0, variable_id: '00000000-0000-0000-0000-00000000000b', icon: 'Activity', color: 'text-emerald-500', is_active: true }, // IMC
        { id: 'n2', slot_index: 1, variable_id: '00000000-0000-0000-0000-00000000000e', icon: 'Droplet', color: 'text-orange-500', is_active: true }, // Grasa
        { id: 'n3', slot_index: 2, variable_id: '00000000-0000-0000-0000-00000000000f', icon: 'BicepsFlexed', color: 'text-emerald-500', is_active: true }, // Músculo
        { id: 'n4', slot_index: 3, variable_id: '00000000-0000-0000-0000-000000000010', icon: 'Ruler', color: 'text-indigo-500', is_active: true }, // Cintura
    ];

    // Dummy state para el Preview
    const [dummyDate, setDummyDate] = useState(new Date().toISOString().split('T')[0]);
    const [dummyEditValues, setDummyEditValues] = useState<any>({ weight: '70.6' });
    const [dummyExtraData, setDummyExtraData] = useState<Record<string, any>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [data, vars, slotsData] = await Promise.all([
                    VariablesService.getDashboardLayout('form_nutricionista'),
                    VariablesService.getVariables(),
                    VariablesService.getCardSlots('nutricionista')
                ]);
                setVariables(vars);

                if (slotsData && slotsData.length > 0) {
                    const editableSlots = slotsData
                        .filter((s: any) => s.slot_index < 4)
                        .map((s: any) => ({
                            id: s.id,
                            slot_index: s.slot_index,
                            variable_id: s.variable_id,
                            icon: s.icon,
                            color: s.color,
                            is_active: s.is_active
                        }));

                    const finalSlots = [...DEFAULT_SLOTS];
                    editableSlots.forEach(es => {
                        const idx = finalSlots.findIndex(fs => fs.slot_index === es.slot_index);
                        if (idx !== -1) finalSlots[idx] = es;
                    });
                    setCardSlots(finalSlots);
                } else {
                    setCardSlots(DEFAULT_SLOTS);
                }

                if (data && data.columns && data.columns.length > 10) {
                    setFields(data.columns.map((c: any) => ({
                        ...c,
                        id: `field-${Math.random().toString(36).substr(2, 9)}`,
                        section: c.section || 'base'
                    })));
                } else {
                    // Default layout with sections
                    const defaults: EditableField[] = [
                        { id: 'f1', header: "Fecha", fixed_variable: "date", variable_id: null, section: 'base' },
                        { id: 'f2', header: "Peso Actual", fixed_variable: "weight", variable_id: null, section: 'base' },
                        { id: 'f3', header: "IMC", fixed_variable: "bmi", variable_id: null, section: 'base' },

                        { id: 'f4', header: "B. Relajado", variable_id: vars.find(v => v.code === 'BRAZO_RELAJADO')?.id || null, section: 'perimeters' },
                        { id: 'f5', header: "B. Flexionado", variable_id: vars.find(v => v.code === 'BRAZO_FLEXIONADO')?.id || null, section: 'perimeters' },
                        { id: 'f6', header: "Antebrazo", variable_id: vars.find(v => v.code === 'ANTEBRAZO_MAXIMO')?.id || null, section: 'perimeters' },
                        { id: 'f7', header: "Tórax", variable_id: vars.find(v => v.code === 'TORAX')?.id || null, section: 'perimeters' },
                        { id: 'f8', header: "Cintura Min.", variable_id: vars.find(v => v.code === 'CINTURA_MINIMA')?.id || null, section: 'perimeters' },
                        { id: 'f9', header: "Cintura Max.", variable_id: vars.find(v => v.code === 'CINTURA_MAXIMA')?.id || null, section: 'perimeters' },
                        { id: 'f10', header: "Cadera Max.", variable_id: vars.find(v => v.code === 'CADERA_MAXIMA')?.id || null, section: 'perimeters' },
                        { id: 'f11', header: "Muslo Max.", variable_id: vars.find(v => v.code === 'MUSLO_MAXIMO')?.id || null, section: 'perimeters' },

                        { id: 'f12', header: "Tríceps", variable_id: vars.find(v => v.code === 'P_TRICEPS')?.id || null, section: 'folds' },
                        { id: 'f13', header: "Subescapular", variable_id: vars.find(v => v.code === 'P_SUBESCAPULAR')?.id || null, section: 'folds' },
                        { id: 'f14', header: "Supraespinal", variable_id: vars.find(v => v.code === 'P_SUPRAESPINAL')?.id || null, section: 'folds' },
                        { id: 'f15', header: "Abdominal", variable_id: vars.find(v => v.code === 'P_ABDOMINAL')?.id || null, section: 'folds' },
                        { id: 'f16', header: "Muslo Med.", variable_id: vars.find(v => v.code === 'P_MUSLO_MEDIAL')?.id || null, section: 'folds' },
                        { id: 'f17', header: "Pantorrilla", variable_id: vars.find(v => v.code === 'P_PANTORRILLA')?.id || null, section: 'folds' },
                        { id: 'f18', header: "C. Ilíaca", variable_id: vars.find(v => v.code === 'CRESTA_ILIACA')?.id || null, section: 'folds' },
                        { id: 'f19', header: "Bíceps", variable_id: vars.find(v => v.code === 'BICEPS')?.id || null, section: 'folds' },

                        { id: 'f20', header: "Principales Hallazgos", variable_id: vars.find(v => v.code === 'PRINCIPALES_HALLAZGOS')?.id || null, section: 'findings' },
                        { id: 'f21', header: "Recomendación", variable_id: vars.find(v => v.code === 'RECOMENDACION_NUTRICIONAL')?.id || null, section: 'recommendations' },
                    ];
                    setFields(defaults);

                    // Auto-save so frontend forms don't break
                    VariablesService.saveDashboardLayout('form_nutricionista', defaults.map(({ id, isEditing, ...rest }) => rest)).catch(console.error);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const cleanColumns = fields.map(({ id, isEditing, ...rest }) => rest);
            await VariablesService.saveDashboardLayout('form_nutricionista', cleanColumns);
            toast({
                title: "Layout de Formulario Guardado",
                description: `Los campos se han re-organizado exitosamente.`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error al guardar layout",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const addField = (section: 'base' | 'perimeters' | 'folds' | 'findings' | 'recommendations') => {
        const newCol: EditableField = {
            id: `new-${Math.random().toString(36).substr(2, 9)}`,
            header: "Nuevo Campo",
            variable_id: null,
            section,
            isEditing: true
        };
        setFields([...fields, newCol]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(c => c.id !== id));
    };

    const toggleEdit = (id: string) => {
        setFields(prev => prev.map(c => c.id === id ? { ...c, isEditing: !c.isEditing } : c));
    };

    const updateFieldVar = (id: string, newHeader: string, newVarId?: string | null) => {
        setFields(prev => prev.map(c => {
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

    const renderFieldItem = (field: EditableField) => (
        <div key={field.id} className="group relative bg-white/[0.03] border border-white/5 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-white/20 hover:bg-white/[0.05]">
            <div className="flex justify-between items-center transition-opacity absolute -top-3 right-3 bg-[#151F32] rounded-full shadow-2xl border border-white/10 px-2 py-0.5">
                <button onClick={() => removeField(field.id)} className="p-1 text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-slate-700 cursor-move shrink-0" />
                {field.isEditing ? (
                    <div className="flex items-center gap-2 w-full bg-black/20 p-1.5 rounded-xl animate-in fade-in zoom-in-95 border border-white/5">
                        <select
                            value={field.variable_id || field.header}
                            autoFocus
                            onChange={(e) => {
                                const val = e.target.value;
                                const selectedVar = variables.find(v => v.id === val);
                                if (selectedVar) {
                                    updateFieldVar(field.id, selectedVar.name, selectedVar.id);
                                } else {
                                    updateFieldVar(field.id, val, null);
                                }
                            }}
                            className="flex-1 min-w-0 h-9 px-3 text-xs font-black bg-[#151F32] border border-white/10 rounded-lg outline-none text-white appearance-none"
                        >
                            <option value={field.header} disabled>{field.header.toUpperCase()}</option>
                            {variables.map((v) => (
                                <option key={v.id} value={v.id} className="bg-[#151F32]">{v.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <button onClick={() => toggleEdit(field.id)} className="p-2 bg-nutrition-500 text-white rounded-lg hover:bg-nutrition-600 transition-all shadow-lg shadow-nutrition-500/20 shrink-0">
                            <Check className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex justify-between items-center min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] truncate pr-2" title={field.header}>
                            {field.header}
                        </span>
                        <button onClick={() => toggleEdit(field.id)} className="p-2 text-slate-600 hover:text-nutrition-400 hover:bg-white/5 rounded-xl transition-all shrink-0">
                            <Edit2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
            {!field.isEditing && (
                <div className="h-10 w-full bg-black/20 border border-white/5 rounded-xl px-4 flex items-center shadow-inner pointer-events-none opacity-40">
                    <span className="text-slate-700 text-xs font-black">---</span>
                </div>
            )}
        </div>
    );

    const filterFields = (section: 'base' | 'perimeters' | 'folds' | 'findings' | 'recommendations') => fields.filter(f => f.section === section);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-nutrition-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Arquitectando Formulario...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-12 bg-nutrition-500 rounded-full" />
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gestor de Consultas</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed px-16">Estructura la experiencia clínica definiendo qué variables capturarás en cada sesión presencial.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 lg:flex-none border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white font-black h-12 px-8 rounded-2xl transition-all uppercase text-[10px] tracking-widest">
                                <Stethoscope className="mr-3 h-4 w-4" /> Previsualización Profesional
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[75rem] p-0 border-none bg-transparent shadow-none overflow-visible">
                            <NewConsultationForm
                                patientId="preview-id"
                                date={dummyDate}
                                setDate={setDummyDate}
                                editValues={dummyEditValues}
                                setEditValues={setDummyEditValues}
                                extraData={dummyExtraData}
                                setExtraData={setDummyExtraData}
                                onSave={() => { }}
                                onCancel={() => { }}
                                patientHeight={170}
                                recordNumber={12}
                                layout={fields}
                                clinicalVariables={variables}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDashboardPreviewOpen} onOpenChange={setIsDashboardPreviewOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 lg:flex-none border-white/10 text-white bg-white/5 hover:bg-white/10 font-black h-12 px-8 rounded-2xl transition-all uppercase text-[10px] tracking-widest">
                                <LayoutTemplate className="mr-3 h-4 w-4 text-nutrition-500" /> Configurar Dashboard Nutricionista (Ver Ficha)
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[7xl] w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col bg-[#0A0F1C] border-white/10 rounded-[3rem] shadow-2xl">
                            <DialogHeader className="px-8 py-5 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between shrink-0 backdrop-blur-xl">
                                <div>
                                    <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                                        <LayoutTemplate className="h-6 w-6 text-nutrition-500" /> Editor del Dashboard de Nutricionista (Ver Ficha)
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 mt-1 font-bold">
                                        Modifique los elementos visibles del dashboard "Ver Ficha". (Las 4 "Cards de Resumen" son editables).
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => setIsDashboardPreviewOpen(false)}
                                        variant="outline"
                                        className="h-11 px-6 font-black rounded-xl border-white/10 text-slate-300 hover:bg-white/10 transition-all active:scale-95 bg-transparent"
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            setIsSavingCards(true);
                                            try {
                                                await VariablesService.saveCardSlots('nutricionista', cardSlots);
                                                const bc = new BroadcastChannel('nutrigo_global_sync');
                                                bc.postMessage({ type: 'config_updated' });
                                                bc.close();
                                                toast({
                                                    title: "Configuración Guardada",
                                                    description: "El dashboard del nutricionista ha sido actualizado exitosamente.",
                                                    className: "bg-nutrition-600 text-white border-none rounded-2xl",
                                                });
                                            } catch (e: any) {
                                                toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
                                            } finally {
                                                setIsSavingCards(false);
                                            }
                                        }}
                                        disabled={isSavingCards}
                                        className="bg-nutrition-500 hover:bg-nutrition-600 text-white font-black rounded-xl h-11 px-6 shadow-xl shadow-nutrition-500/20 transition-all active:scale-95 border-none"
                                    >
                                        {isSavingCards ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-8 bg-black/20">
                                <div className="max-w-6xl mx-auto space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-3 w-3 rounded-full bg-nutrition-500 animate-pulse" />
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sección Editable: Tarjetas Principales (Ver Ficha)</h3>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative">
                                            {cardSlots.slice(0, 4).map((slot, idx) => {
                                                const selectedV = variables.find(v => v.id === slot.variable_id);
                                                
                                                let dummyVal = "—";
                                                let dummyUnit = "";
                                                let dummyDiag = "";
                                                let isImc = false;

                                                if (selectedV) {
                                                    const code = (selectedV.code || "").toLowerCase();
                                                    const name = (selectedV.name || "").toLowerCase();

                                                    if (code.includes("imc") || name.includes("imc")) {
                                                        dummyVal = "23.8";
                                                        dummyDiag = "SALUDABLE";
                                                        isImc = true;
                                                    } else if (code.includes("grasa") || name.includes("grasa")) {
                                                        dummyVal = "10.63";
                                                        dummyUnit = "%";
                                                        dummyDiag = "SALUD";
                                                    } else if (code.includes("musculo") || name.includes("músculo") || code.includes("lee")) {
                                                        dummyVal = "19.53";
                                                        dummyUnit = "%";
                                                        dummyDiag = "SALUD";
                                                    } else if (code.includes("cintura") || name.includes("cintura")) {
                                                        dummyVal = "77.2";
                                                        dummyUnit = " cm";
                                                        dummyDiag = "NORMAL";
                                                    } else {
                                                        dummyVal = "24";
                                                        dummyUnit = (selectedV as any).unit || "";
                                                        dummyDiag = "NORMAL";
                                                    }
                                                }

                                                let bgClass = "bg-[#1A253A]/60 backdrop-blur-xl border-white/5";
                                                let textClass = "text-white";
                                                let titleClass = "text-slate-400";
                                                let BadgeClass = "bg-white/10 text-white";
                                                if (isImc) {
                                                    bgClass = "bg-gradient-to-br from-nutri-brand to-emerald-600 border-0";
                                                    titleClass = "text-white opacity-80";
                                                    BadgeClass = "bg-white/20 text-white";
                                                } else if (idx === 1) {
                                                    titleClass = "text-orange-500";
                                                } else if (idx === 2) {
                                                    titleClass = "text-emerald-500";
                                                } else if (idx === 3) {
                                                    titleClass = "text-indigo-500";
                                                }

                                                return (
                                                    <Card key={slot.id} className={cn("shadow-2xl rounded-3xl sm:rounded-[2rem] overflow-hidden relative group transition-all hover:ring-2 hover:ring-nutrition-500/50 cursor-pointer", bgClass)}>
                                                        {!isImc && <div className={cn("absolute top-0 right-10 w-20 h-20 blur-3xl group-hover:opacity-100 transition-all opacity-0", `bg-${titleClass.split('-')[1]}-500/10`)} />}
                                                        {isImc && <div className="absolute top-0 right-10 w-20 h-20 bg-white/10 blur-[50px] rounded-full -mr-10 -mt-10" />}
                                                        
                                                        <CardContent className="p-4 sm:p-7 relative z-10 h-full flex flex-col justify-between">
                                                            <div className={cn("text-[8px] sm:text-[10px] font-black uppercase mb-1 sm:mb-2 tracking-widest", titleClass)}>
                                                                {selectedV ? selectedV.name : "(Vacío)"}
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                                                <span className={cn("text-2xl sm:text-4xl font-black tracking-tighter", textClass)}>
                                                                    {dummyVal}{dummyUnit}
                                                                </span>
                                                                {selectedV && (
                                                                    <Badge variant="secondary" className={cn("text-[7px] sm:text-[9px] border-0 font-black uppercase px-2 w-fit", BadgeClass)}>
                                                                        {dummyDiag}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </CardContent>

                                                        {/* Dropdown overlay */}
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center p-6 z-20">
                                                            <p className="text-[10px] font-black text-nutrition-400 uppercase tracking-widest mb-2 text-center">Cambiar Variable</p>
                                                            <select
                                                                value={slot.variable_id || ""}
                                                                onChange={e => {
                                                                    const val = e.target.value || null;
                                                                    setCardSlots(prev => prev.map(s => s.id === slot.id ? { ...s, variable_id: val } : s));
                                                                }}
                                                                className="w-full h-11 rounded-xl border border-white/10 px-3 text-xs font-black uppercase text-white bg-slate-900 shadow-2xl outline-none cursor-pointer focus:ring-4 focus:ring-nutrition-500/20 transition-all"
                                                            >
                                                                <option value="" className="bg-slate-900">(Seleccione Variable)</option>
                                                                {variables.map(v => (
                                                                    <option key={v.id} value={v.id} className="bg-slate-900">{v.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handleSave} disabled={saving} className="flex-1 lg:flex-none bg-nutrition-500 hover:bg-nutrition-600 text-white font-black h-12 px-10 rounded-2xl shadow-2xl shadow-nutrition-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Sincronizar Protocolo
                    </Button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-nutrition-500/5 blur-[120px] -mr-48 -mt-48" />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
                    {/* Metrics Principales */}
                    <div className="flex flex-col gap-6 bg-black/20 p-6 rounded-[2.5rem] border border-white/5">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[10px] font-black text-nutrition-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-1.5 w-6 bg-nutrition-500 rounded-full" />
                                CORE METRICS
                            </h4>
                            <button onClick={() => addField('base')} className="p-2 text-white bg-white/5 rounded-xl hover:bg-white/10 hover:text-nutrition-400 transition-all border border-white/5">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {filterFields('base').length === 0 && <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl opacity-20"><User className="h-8 w-8 mx-auto" /></div>}
                        <div className="space-y-4">
                            {filterFields('base').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Perimeters */}
                    <div className="flex flex-col gap-6 bg-black/20 p-6 rounded-[2.5rem] border border-white/5">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-1.5 w-6 bg-blue-400 rounded-full" />
                                PERÍMETROS
                            </h4>
                            <button onClick={() => addField('perimeters')} className="p-2 text-white bg-white/5 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all border border-white/5">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {filterFields('perimeters').length === 0 && <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl opacity-20"><Ruler className="h-8 w-8 mx-auto" /></div>}
                        <div className="grid grid-cols-1 gap-4">
                            {filterFields('perimeters').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Folds */}
                    <div className="flex flex-col gap-6 bg-black/20 p-6 rounded-[2.5rem] border border-white/5">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-1.5 w-6 bg-pink-400 rounded-full" />
                                PLIEGUES
                            </h4>
                            <button onClick={() => addField('folds')} className="p-2 text-white bg-white/5 rounded-xl hover:bg-white/10 hover:text-pink-400 transition-all border border-white/5">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {filterFields('folds').length === 0 && <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl opacity-20"><Activity className="h-8 w-8 mx-auto" /></div>}
                        <div className="grid grid-cols-1 gap-4">
                            {filterFields('folds').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Clinic/Recommendations */}
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-[2.5rem] border border-white/5">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="h-1.5 w-6 bg-emerald-400 rounded-full" />
                                    HALLAZGOS
                                </h4>
                                <button onClick={() => addField('findings')} className="p-2 text-white bg-white/5 rounded-xl hover:bg-white/10 hover:text-emerald-400 transition-all border border-white/5">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {filterFields('findings').map(f => renderFieldItem(f))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-[2.5rem] border border-white/5">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="h-1.5 w-6 bg-amber-400 rounded-full" />
                                    CONSEJOS
                                </h4>
                                <button onClick={() => addField('recommendations')} className="p-2 text-white bg-white/5 rounded-xl hover:bg-white/10 hover:text-amber-400 transition-all border border-white/5">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {filterFields('recommendations').map(f => renderFieldItem(f))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
