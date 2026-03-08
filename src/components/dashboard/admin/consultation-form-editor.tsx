"use client";

import { useState, useEffect } from "react";
import { Check, Edit2, Loader2, Plus, Save, Trash2, GripVertical, AlertCircle, Apple, Stethoscope, Ruler, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dummy state para el Preview
    const [dummyDate, setDummyDate] = useState(new Date().toISOString().split('T')[0]);
    const [dummyEditValues, setDummyEditValues] = useState<any>({ weight: '70.6' });
    const [dummyExtraData, setDummyExtraData] = useState<Record<string, any>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [data, vars] = await Promise.all([
                    VariablesService.getDashboardLayout('form_nutricionista'),
                    VariablesService.getVariables()
                ]);
                setVariables(vars);

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
        <div key={field.id} className="group relative bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex flex-col gap-2 transition-all hover:border-slate-300">
            <div className="flex justify-between items-center transition-opacity absolute -top-3 right-2 bg-white rounded-full shadow-sm border border-slate-100 px-1">
                <button onClick={() => removeField(field.id)} className="p-1.5 text-red-400 hover:text-red-500 rounded-full hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-move shrink-0" />
                {field.isEditing ? (
                    <div className="flex items-center gap-1 w-full bg-slate-50 p-1 rounded-md animate-in fade-in zoom-in-95">
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
                            className="flex-1 min-w-0 h-8 px-2 text-xs font-bold bg-white border border-slate-200 rounded outline-none text-slate-700"
                        >
                            <option value={field.header} disabled>{field.header} (Selecciona)</option>
                            {variables.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                        <button onClick={() => toggleEdit(field.id)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors shrink-0">
                            <Check className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex justify-between items-center min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={field.header}>
                            {field.header}
                        </span>
                        <button onClick={() => toggleEdit(field.id)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all shrink-0">
                            <Edit2 className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>
            {!field.isEditing && (
                <div className="h-8 mt-1 w-full bg-slate-50 border border-slate-100 rounded-md px-2 flex items-center shadow-inner pointer-events-none opacity-60">
                    <span className="text-slate-300 text-xs font-medium">0.0</span>
                </div>
            )}
        </div>
    );

    const filterFields = (section: 'base' | 'perimeters' | 'folds' | 'findings' | 'recommendations') => fields.filter(f => f.section === section);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-green-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Cargando Formulario...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800">Constructor Visual de Consultas</h3>
                    <p className="text-sm text-slate-500">Agrega o remueve los campos a solicitar al especialista en cada nueva cita.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-green-200 text-green-700 bg-white hover:bg-green-50 font-bold h-10 px-6 rounded-xl shadow-sm transition-all focus:ring-0 hover:scale-105 active:scale-95">
                                Previsualizar Formulario
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[70rem] p-0 border-none bg-transparent shadow-none overflow-visible">
                            <NewConsultationForm
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
                    <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Layout
                    </Button>
                </div>
            </div>

            <div className="bg-[#F0FDF4] border-2 border-green-200 rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-br-2xl shadow-sm">
                    Previsualización del Formulario (Vista Nutricionista)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
                    {/* Base fields */}
                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2 px-2 bg-green-50/50 p-2 rounded-lg border border-green-100">
                            <h4 className="text-[11px] font-black text-green-800 uppercase tracking-wider">Métricas Principales</h4>
                            <button onClick={() => addField('base')} className="text-[10px] font-black text-white bg-green-500 px-2 py-1 rounded shadow-sm hover:bg-green-600 transition-colors flex items-center gap-1">
                                <Plus className="h-3 w-3" /> Añadir
                            </button>
                        </div>
                        {filterFields('base').length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Vacío</p>}
                        <div className="flex flex-col gap-3">
                            {filterFields('base').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Perimeters */}
                    <div className="col-span-1 bg-white p-5 rounded-2xl border border-green-100 shadow-sm relative">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <span className="bg-blue-100 p-1.5 rounded-lg text-blue-500"><Ruler className="h-4 w-4" /></span>
                                Perímetros (cm)
                            </h4>
                            <button onClick={() => addField('perimeters')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                <Plus className="h-3 w-3" /> Añadir
                            </button>
                        </div>
                        {filterFields('perimeters').length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No hay variables asignadas</p>}
                        <div className="grid grid-cols-2 gap-3">
                            {filterFields('perimeters').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Folds */}
                    <div className="col-span-1 bg-white p-5 rounded-2xl border border-green-100 shadow-sm relative">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <span className="bg-purple-100 p-1.5 rounded-lg text-purple-500"><User className="h-4 w-4" /></span>
                                Pliegues (mm)
                            </h4>
                            <button onClick={() => addField('folds')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                                <Plus className="h-3 w-3" /> Añadir
                            </button>
                        </div>
                        {filterFields('folds').length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No hay variables asignadas</p>}
                        <div className="grid grid-cols-2 gap-3">
                            {filterFields('folds').map(f => renderFieldItem(f))}
                        </div>
                    </div>

                    {/* Clinic/Recommendations */}
                    <div className="col-span-1 flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center px-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2"><Stethoscope className="h-3 w-3 text-slate-400" /> Hallazgos</h4>
                                <button onClick={() => addField('findings')} className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 shadow-sm flex items-center gap-1"><Plus className="h-3 w-3" /> Añadir</button>
                            </div>
                            {filterFields('findings').length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Vacío</p>}
                            {filterFields('findings').map(f => renderFieldItem(f))}
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center px-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2"><Apple className="h-3 w-3 text-slate-400" /> Recomendaciones</h4>
                                <button onClick={() => addField('recommendations')} className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 shadow-sm flex items-center gap-1"><Plus className="h-3 w-3" /> Añadir</button>
                            </div>
                            {filterFields('recommendations').length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Vacío</p>}
                            {filterFields('recommendations').map(f => renderFieldItem(f))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
