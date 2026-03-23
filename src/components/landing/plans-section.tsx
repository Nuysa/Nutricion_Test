"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableLink } from "@/components/dashboard/admin/editable-link";
import { Plus, Trash2, Edit3, Save, X, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Tipos requeridos para el componente
export interface PropiedadesPlan {
    id: string;
    nombre: string;
    precioVirtual: number;
    precioPresencial: number;
    descVirtual?: string;
    descPresencial?: string;
    beneficiosVirtuales: string[];
    beneficiosPresenciales: string[];
    linkVirtual: string;
    linkPresencial: string;
    esRecomendado?: boolean;
    buttonText?: string;
}

// Data Hardcodeada migrada del HTML original de NuySa
export const planesFlexible: PropiedadesPlan[] = [
    {
        id: "mensual",
        nombre: "PLAN MENSUAL",
        precioVirtual: 149,
        precioPresencial: 149,
        beneficiosVirtuales: [
            "2 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Reunión vía Google Meet (45 min).",
            "Suplementación específica, si lo requiere."
        ],
        beneficiosPresenciales: [
            "2 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Evaluación física (Medición ISAK I).",
            "Consulta en consultorio (60 min).",
            "Suplementación específica, si lo requiere."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20mensual,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20mensual,%20de%20manera%20presencial.%20'
    },
    {
        id: "bimestral",
        nombre: "PLAN BIMESTRAL",
        precioVirtual: 259,
        precioPresencial: 259,
        esRecomendado: true,
        beneficiosVirtuales: [
            "4 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Reunión vía Google Meet (45 min).",
            "Suplementación específica, si lo requiere.",
            "Productos recomendados."
        ],
        beneficiosPresenciales: [
            "4 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Evaluación física (Medición ISAK I).",
            "Consulta en consultorio (60 min).",
            "Suplementación específica, si lo requiere.",
            "Productos recomendados."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20bimestral,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20bimestral,%20de%20manera%20presencial.%20'
    },
    {
        id: "trimestral",
        nombre: "PLAN TRIMESTRAL",
        precioVirtual: 400,
        precioPresencial: 400,
        beneficiosVirtuales: [
            "6 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Reunión vía Google Meet (45 min).",
            "Suplementación específica, si lo requiere.",
            "Productos recomendados."
        ],
        beneficiosPresenciales: [
            "6 planes personalizados",
            "Guía de intercambio de alimentos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Evaluación física (Medición ISAK I).",
            "Consulta en consultorio (60 min).",
            "Suplementación específica, si lo requiere.",
            "Productos recomendados."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20trimestral,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20trimestral,%20de%20manera%20presencial.%20'
    }
];

export const planesMenu: PropiedadesPlan[] = [
    {
        id: "mensual-menu",
        nombre: "PLAN MENSUAL",
        precioVirtual: 180,
        precioPresencial: 180,
        beneficiosVirtuales: [
            "2 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Reunión vía Google Meet (50-60 min).",
            "Productos recomendados."
        ],
        beneficiosPresenciales: [
            "2 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Evaluación física (Medición ISAK I).",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Consulta en consultorio (50-60 min).",
            "Productos recomendados."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20mensual,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20mensual,%20de%20manera%20presencial.%20'
    },
    {
        id: "bimestral-menu",
        nombre: "PLAN BIMESTRAL",
        precioVirtual: 300,
        precioPresencial: 300,
        esRecomendado: true,
        beneficiosVirtuales: [
            "4 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Reunión vía Google Meet (50-60 min).",
            "Productos recomendados."
        ],
        beneficiosPresenciales: [
            "4 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Evaluación física (Medición ISAK I).",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Consulta en consultorio (50-60 min).",
            "Productos recomendados."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20bimestral,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20bimestral,%20de%20manera%20presencial.%20'
    },
    {
        id: "trimestral-menu",
        nombre: "PLAN TRIMESTRAL",
        precioVirtual: 449,
        precioPresencial: 449,
        beneficiosVirtuales: [
            "6 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Reunión vía Google Meet (50-60 min).",
            "Productos recomendados."
        ],
        beneficiosPresenciales: [
            "6 planes personalizados",
            "Plan personalizado con 7 menús completos.",
            "Seguimiento vía Web, Gmail o WhatsApp.",
            "Evaluación física (Medición ISAK I).",
            "Recetas fáciles y detalladas.",
            "Suplementación específica si lo requiere.",
            "Consulta en consultorio (50-60 min).",
            "Productos recomendados."
        ],
        linkVirtual: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20trimestral,%20de%20manera%20virtual.%20',
        linkPresencial: 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20trimestral,%20de%20manera%20presencial.%20'
    }
];

export interface PlansSectionProps {
    mode?: "landing" | "dashboard" | "admin_cms";
    onPlanSelect?: (plan: any) => void;
    currentPlanId?: string;
    isEditable?: boolean;
}

export function PlansSection({ mode = "landing", onPlanSelect, currentPlanId, isEditable }: PlansSectionProps) {
    const { toast } = useToast();
    const [tipoServicio, setTipoServicio] = useState<string>("flexible");
    const [dbPlans, setDbPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [isDeletingService, setIsDeletingService] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const [content, setContent] = useState({
        title: "Nuestros Planes",
        description: "Invierte en Salud, selecciona el plan que mejor se adapte a tus necesidades y comienza a transformar tu bienestar hoy mismo.",
        descFlexible: "Esta flexibilidad te ayuda a mantener una alimentación equilibrada incluso en salidas sociales, viajes o días con poco tiempo para cocinar. Ideal para quienes buscan resultados sostenibles sin la rigidez de un menú fijo, pero con la seguridad de tener una estructura y control de porciones claros.",
        descMenu: "Este tipo de plan es ideal para quienes prefieren seguir instrucciones claras y detalladas, desean evitar elecciones poco saludables o necesitan una alimentación más controlada por razones de salud. También ahorra tiempo en la planificación de compras y reduce el estrés de decidir qué cocinar cada día.",
        descExtra: "Descripción de este nuevo servicio adicional para tus pacientes.",
        labelFlexible: "Servicio flexible",
        labelMenu: "Servicio con menú semanal",
        labelExtra: "Nuevo Servicio",
        labelVirtual: "Virtual",
        labelPresencial: "Presencial",
        services: [
            { id: 'flexible', label: "Servicio flexible", desc: "Esta flexibilidad te ayuda a mantener una alimentación equilibrada incluso en salidas sociales, viajes o días con poco tiempo para cocinar. Ideal para quienes buscan resultados sostenibles sin la rigidez de un menú fijo, pero con la seguridad de tener una estructura y control de porciones claros." },
            { id: 'menu', label: "Servicio con menú semanal", desc: "Este tipo de plan es ideal para quienes prefieren seguir instrucciones claras y detalladas, desean evitar elecciones poco saludables o necesitan una alimentación más controlada por razones de salud. También ahorra tiempo en la planificación de compras y reduce el estrés de decidir qué cocinar cada día." },
            { id: 'extra', label: "Nuevo Servicio", desc: "Descripción de este nuevo servicio adicional para tus pacientes." }
        ]
    });

    const services = content.services || [];

    // Carga inicial
    useEffect(() => {
        const fetchInitialData = async () => {
            const supabase = createClient();
            try {
                const { data: plans, error: pError } = await supabase.from('landing_plans').select('*');
                if (plans && !pError) setDbPlans(plans);

                const { data: cData, error: cError } = await supabase.from('landing_content').select('content').eq('section', 'plans').maybeSingle();
                if (cData?.content && !cError) {
                    setContent(prev => ({ ...prev, ...cData.content }));
                }
            } catch (err) {
                console.error("Error fetching landing data:", err);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchInitialData();
    }, []);

    // Escuchador para publicar cambios desde el dashboard
    useEffect(() => {
        const handlePublishEvent = async () => {
            if (mode !== "admin_cms") return;
            await handlePublishAll();
        };

        window.addEventListener('publish-landing-plans', handlePublishEvent);
        return () => window.removeEventListener('publish-landing-plans', handlePublishEvent);
    }, [dbPlans, content, mode]);

    const handlePublishAll = async () => {
        setIsPublishing(true);
        const supabase = createClient();
        try {
            // 1. Guardar Contenido General (Sección planes)
            const { error: cError } = await supabase
                .from('landing_content')
                .upsert({ section: 'plans', content }, { onConflict: 'section' });
            if (cError) throw cError;

            // 2. Guardar Planes (Varios registros)
            // Filtramos planes que puedan haber sido editados pero no tienen ID UUID (fallbacks)
            // En este modelo simplificado, dbPlans contiene tanto los del servidor como los locales
            for (const plan of dbPlans) {
                // Si el ID es uno de los fallbacks (no UUID), creamos uno nuevo o lo ignoramos si no ha cambiado?
                // Mejor: en handleUpdatePlan nos aseguramos de que si es fallback, se le asigne un UUID si se quiere guardar
                // Pero por ahora, upsert funciona si el ID es el mismo
                const { error: pError } = await supabase
                    .from('landing_plans')
                    .upsert({
                        ...plan
                    });
                if (pError) throw pError;
            }

            toast({
                title: "Cambios Publicados",
                description: "La landing page ha sido actualizada con éxito.",
                variant: "success"
            });
        } catch (error: any) {
            console.error("Error publishing:", error);
            toast({
                title: "Error al Publicar",
                description: error.message || "No se pudo sincronizar con la base de datos.",
                variant: "destructive"
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSaveContent = async (updatedContent: any) => {
        // En modo admin_cms, solo actualizamos el estado local
        if (mode === "admin_cms") {
            setContent(updatedContent);
            return;
        }

        // Si no estamos en modo CMS (poco probable aquí), guardamos directo
        const supabase = createClient();
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'plans', content: updatedContent }, { onConflict: 'section' });

        if (!error) {
            setContent(updatedContent);
        } else {
            throw error;
        }
    };

    const handleUpdatePlan = async (id: string, updates: any) => {
        // Buscamos si el plan ya existe en dbPlans
        const planExists = dbPlans.find(p => p.id === id);

        if (mode === "admin_cms") {
            if (planExists) {
                setDbPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            } else {
                // Es un plan fallback que está siendo editado. 
                // Lo convertimos en un objeto de DB para el estado local.
                const fallback = planesActuales.find(p => p.id === id);
                if (fallback) {
                    const newDbPlan = {
                        id: crypto.randomUUID(), // Generamos un ID real para la DB
                        type: tipoServicio,
                        interval: fallback.nombre.replace('PLAN ', '').toLowerCase(),
                        price: fallback.precioVirtual,
                        presential_price: fallback.precioPresencial,
                        virtual_features: fallback.beneficiosVirtuales,
                        presential_features: fallback.beneficiosPresenciales,
                        virtual_description: fallback.descVirtual,
                        presential_description: fallback.descPresencial,
                        is_recommended: fallback.esRecomendado,
                        virtual_link: fallback.linkVirtual,
                        presential_link: fallback.linkPresencial,
                        ...updates
                    };
                    setDbPlans(prev => [...prev, newDbPlan]);
                }
            }
            return;
        }

        // Guardado inmediato (comportamiento original fuera de admin_cms)
        const supabase = createClient();
        const { error } = await supabase.from('landing_plans').update(updates).eq('id', id);
        if (error) throw error;

        // Refrescar localmente
        const { data } = await supabase.from('landing_plans').select('*');
        if (data) setDbPlans(data);
    };

    const handleAddPlan = async () => {
        const newPlan = {
            id: crypto.randomUUID(),
            type: tipoServicio,
            interval: 'Nuevo',
            price: 0,
            virtual_features: ['Primer beneficio'],
            presential_features: ['Primer beneficio presencial']
        };

        if (mode === "admin_cms") {
            setDbPlans(prev => [...prev, newPlan]);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.from('landing_plans').insert(newPlan);
        if (error) throw error;

        const { data } = await supabase.from('landing_plans').select('*');
        if (data) setDbPlans(data);
    };

    const handleDeletePlan = async (id: string) => {
        if (mode === "admin_cms") {
            setDbPlans(prev => prev.filter(p => p.id !== id));
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.from('landing_plans').delete().eq('id', id);
        if (error) throw error;

        const { data } = await supabase.from('landing_plans').select('*');
        if (data) setDbPlans(data);
    };

    const handleAddService = () => {
        const id = `service_${Date.now()}`;
        const newService = { id, label: 'Nuevo Servicio', desc: 'Descripción del nuevo servicio.' };
        const newServices = [...services, newService];
        handleSaveContent({ ...content, services: newServices });
    };

    const handleDeleteService = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setServiceToDelete(id);
    };

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return;

        setIsDeletingService(true);
        try {
            const currentServices = content.services || [];
            const newServices = currentServices.filter((s: any) => s.id !== serviceToDelete);

            await handleSaveContent({ ...content, services: newServices });

            if (tipoServicio === serviceToDelete) {
                const nextServiceId = newServices.length > 0 ? newServices[0].id : 'flexible';
                setTipoServicio(nextServiceId);
            }

            setServiceToDelete(null);
            toast({ title: "Servicio eliminado" });
        } catch (error: any) {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        } finally {
            setIsDeletingService(false);
        }
    };

    const handleUpdateService = async (id: string, updates: any) => {
        const newServices = services.map((s: any) => s.id === id ? { ...s, ...updates } : s);
        await handleSaveContent({ ...content, services: newServices });
    };

    // Estado local para modalidades individuales
    const [modalidades, setModalidades] = useState<Record<string, "virtual" | "presencial">>({});

    const toggleModalidad = (id: string, mod: "virtual" | "presencial") => {
        setModalidades(prev => ({ ...prev, [id]: mod }));
    };

    const fallbackPlans = tipoServicio === "flexible" ? planesFlexible : planesMenu;

    // Listado de planes finales a mostrar
    const planesActuales: PropiedadesPlan[] = useMemo(() => {
        const standardIntervals = ['mensual', 'bimestral', 'trimestral'];
        const list: PropiedadesPlan[] = [];

        // 1. Identificar planes de la DB para el servicio actual
        const dbPlansOfType = dbPlans.filter(p => p.type === tipoServicio);

        // 2. Para cada intervalo estándar, buscamos en DB o usamos fallback
        standardIntervals.forEach(interval => {
            const dbPlan = dbPlansOfType.find(p => p.interval === interval);
            if (dbPlan) {
                list.push({
                    id: dbPlan.id,
                    nombre: `PLAN ${dbPlan.interval.toUpperCase()}`,
                    precioVirtual: dbPlan.price,
                    precioPresencial: dbPlan.presential_price || dbPlan.price,
                    descVirtual: dbPlan.virtual_description,
                    descPresencial: dbPlan.presential_description,
                    beneficiosVirtuales: dbPlan.virtual_features || [],
                    beneficiosPresenciales: dbPlan.presential_features || [],
                    esRecomendado: dbPlan.is_recommended,
                    linkVirtual: dbPlan.virtual_link || dbPlan.custom_link_virtual || "",
                    linkPresencial: dbPlan.presencial_link || dbPlan.custom_link_presencial || "",
                    buttonText: dbPlan.button_text
                });
            } else {
                // Si no hay en DB, buscamos en fallback hardcodeado
                const fallback = fallbackPlans.find(f =>
                    f.id === interval ||
                    f.id === `${interval}-menu` ||
                    f.nombre.toLowerCase().includes(interval)
                );
                if (fallback) list.push(fallback);
            }
        });

        // 3. Añadir planes "Extra" o con intervalos no estándar que estén en DB
        const extraDbPlans = dbPlansOfType.filter(p => !standardIntervals.includes(p.interval));
        extraDbPlans.forEach(p => {
            list.push({
                id: p.id,
                nombre: `PLAN ${p.interval.toUpperCase()}`,
                precioVirtual: p.price,
                precioPresencial: p.presential_price || p.price,
                descVirtual: p.virtual_description,
                descPresencial: p.presential_description,
                beneficiosVirtuales: p.virtual_features || [],
                beneficiosPresenciales: p.presential_features || [],
                esRecomendado: p.is_recommended,
                linkVirtual: p.virtual_link || p.custom_link_virtual || "",
                linkPresencial: p.presencial_link || p.custom_link_presencial || "",
                buttonText: p.button_text
            });
        });

        return list;
    }, [dbPlans, tipoServicio, fallbackPlans]);

    const handleAction = (plan: PropiedadesPlan, modalidad: "virtual" | "presencial") => {
        if (mode === "dashboard" && onPlanSelect) {
            onPlanSelect({
                id: plan.id,
                name: `${plan.nombre} (${tipoServicio === "flexible" ? "Flexible" : "Menú"} - ${modalidad})`,
                price: (modalidad === "virtual" ? plan.precioVirtual : plan.precioPresencial).toString()
            });
        }
    };

    return (
        <section id="planes" className={cn("relative z-10 w-full", (mode === "landing" || mode === "admin_cms") ? "scroll-mt-32 py-16 md:py-24 bg-nutri-base/30 border-y border-white/5" : "py-8")}>
            <div className={cn("mx-auto", (mode === "landing" || mode === "admin_cms") ? "max-w-screen-2xl px-4 md:px-8" : "w-full")}>

                {mode !== "dashboard" && (
                    <div className="text-center mb-10 relative">
                        {isEditable ? (
                            <EditableText
                                label="Título Sección"
                                value={content.title}
                                onSave={(val) => handleSaveContent({ ...content, title: val })}
                                className="text-3xl md:text-5xl lg:text-6xl font-tech font-bold text-white mb-4 block"
                            />
                        ) : (
                            <h3 className="text-3xl md:text-5xl lg:text-6xl font-tech font-black text-white leading-tight">{content.title}</h3>
                        )}
                        {isEditable ? (
                            <EditableText
                                label="Descripción"
                                value={content.description}
                                onSave={(val) => handleSaveContent({ ...content, description: val })}
                                className="text-slate-400 font-sans max-w-2xl mx-auto block"
                                multiline
                            />
                        ) : (
                            <p className="text-slate-400 font-sans max-w-2xl mx-auto">{content.description}</p>
                        )}
                    </div>
                )}

                {/* Switcher Global: Flexible vs Menu */}
                <div className={cn("flex justify-center relative z-20", mode === "dashboard" ? "mb-14" : "mb-6")}>
                    <div className="bg-nutri-panel/80 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex items-center shadow-2xl w-fit mx-auto">
                        {services.map((btn: any) => (
                            <div key={btn.id} className="relative group">
                                <button
                                    onClick={() => setTipoServicio(btn.id)}
                                    className={cn(
                                        "px-3 md:px-8 py-2 md:py-3 rounded-full font-tech font-bold text-xs md:text-sm transition-all duration-300 whitespace-nowrap",
                                        tipoServicio === btn.id
                                            ? "bg-nutri-brand text-nutri-base shadow-[0_0_15px_rgba(255,122,0,0.4)]"
                                            : "text-slate-400 hover:text-white"
                                    )}>
                                    {btn.label}
                                </button>
                                {isEditable && (
                                    <div className="absolute -top-1 -right-1 z-30 transition-opacity flex gap-1">
                                        <EditableText
                                            label={`Editar Etiqueta ${btn.id}`}
                                            value={btn.label || ''}
                                            onSave={(val) => handleUpdateService(btn.id, { label: val })}
                                        >
                                            <button className="p-1 bg-nutri-brand text-nutri-base rounded-full text-[10px] shadow-lg">
                                                <Edit3 className="h-2.5 w-2.5" />
                                            </button>
                                        </EditableText>
                                        <button
                                            onClick={(e) => handleDeleteService(btn.id, e)}
                                            className="p-1 bg-red-500 text-white rounded-full text-[10px] shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isEditable && (
                            <button
                                onClick={handleAddService}
                                className="p-2 ml-2 text-slate-500 hover:text-nutri-brand transition-colors"
                                title="Añadir tipo de servicio"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Description Based on Global Toggle */}
                {mode !== "dashboard" && (
                    <div className="text-center max-w-screen-2xl mx-auto mb-12 min-h-[5rem] flex items-center justify-center">
                        <div className="text-slate-300 font-sans text-sm md:text-base leading-relaxed transition-opacity duration-300">
                            {isEditable ? (
                                <EditableText
                                    label={`Descripción ${tipoServicio}`}
                                    value={services.find((s: any) => s.id === tipoServicio)?.desc || ''}
                                    onSave={(val) => handleUpdateService(tipoServicio, { desc: val })}
                                    multiline
                                />
                            ) : (
                                services.find((s: any) => s.id === tipoServicio)?.desc
                            )}
                        </div>
                    </div>
                )}

                {loadingPlans ? (
                    <div className="py-20 flex justify-center w-full">
                        <Loader2 className="h-10 w-10 animate-spin text-nutri-brand" />
                    </div>
                ) : (
                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto w-full px-4 md:px-6",
                        mode === "dashboard" && "mt-12"
                    )}>
                        {planesActuales.map((plan, index) => {
                            const mod = modalidades[plan.id] || "virtual";
                            const isRecommended = plan.esRecomendado || (index === 1 && !plan.esRecomendado && planesActuales.length === 3);

                            return (
                                <div key={plan.id} className={cn(
                                    "rounded-3xl p-5 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-300 shadow-xl relative", // removed overflow-hidden for badge visibility
                                    isRecommended
                                        ? "bg-nutri-panel border-2 border-nutri-brand transform md:-translate-y-4 shadow-[0_0_40px_rgba(255,122,0,0.2)] mt-4 md:mt-0"
                                        : "bg-nutri-panel/80 backdrop-blur-2xl border border-white/10 hover:border-nutri-brand/50 transform hover:-translate-y-2"
                                )}>
                                    {isRecommended && (
                                        <>
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-nutri-brand text-nutri-base border border-nutri-brand text-[9px] font-tech font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] z-[60] shadow-lg">
                                                Recomendado
                                            </div>
                                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                                <Zap className="h-24 w-24 text-nutri-brand" />
                                            </div>
                                        </>
                                    )}

                                    <div className="relative z-10 flex-grow">
                                        {/* Toggle Modalidad Local */}
                                        <div className="flex items-center bg-black/40 rounded-full p-1 mb-5 w-fit border border-white/10 relative">
                                            {[
                                                { id: 'virtual', label: content.labelVirtual },
                                                { id: 'presencial', label: content.labelPresencial }
                                            ].map(btn => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => toggleModalidad(plan.id, btn.id as any)}
                                                    className={cn(
                                                        "px-3 py-1 text-[10px] uppercase tracking-widest font-tech font-bold rounded-full transition-all duration-300 relative group/tog",
                                                        mod === btn.id
                                                            ? "bg-nutri-brand text-nutri-base"
                                                            : "text-slate-400 hover:text-white"
                                                    )}>
                                                    {btn.label}
                                                    {isEditable && (
                                                        <span className="absolute -top-2 -right-2">
                                                            <EditableText
                                                                label={`Editar label ${btn.id}`}
                                                                value={btn.label}
                                                                onSave={(val) => handleSaveContent({ ...content, [`label${btn.id.charAt(0).toUpperCase() + btn.id.slice(1)}`]: val })}
                                                            >
                                                                <Edit3 className="h-3 w-3 text-white" />
                                                            </EditableText>
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {isEditable && (
                                            <div className="absolute top-8 right-8 flex flex-col gap-2 z-30">
                                                <button
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                                                    title="Eliminar Plan"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdatePlan(plan.id, { is_recommended: !plan.esRecomendado })}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all border",
                                                        plan.esRecomendado
                                                            ? "bg-nutri-brand text-nutri-base border-nutri-brand"
                                                            : "bg-white/5 text-slate-400 border-white/10 hover:border-nutri-brand/50"
                                                    )}
                                                    title="Toggle Recomendado"
                                                >
                                                    <Zap className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {isEditable ? (
                                            <EditableText
                                                label="Intervalo (Mensual/Bimestral...)"
                                                value={plan.nombre.replace('PLAN ', '')}
                                                onSave={(val) => handleUpdatePlan(plan.id, { interval: val })}
                                                className="text-xl font-tech font-bold text-white mb-2 block"
                                            />
                                        ) : (
                                            <h4 className="text-xl font-tech font-bold text-white mb-2">{plan.nombre}</h4>
                                        )}

                                        <div className="flex items-baseline gap-2 mb-2">
                                            {isEditable ? (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-nutri-brand font-extrabold text-xl">S/</span>
                                                    <EditableText
                                                        label={`Precio ${mod}`}
                                                        value={(mod === "virtual" ? plan.precioVirtual : plan.precioPresencial).toString()}
                                                        onSave={(val) => {
                                                            const field = mod === "virtual" ? 'price' : 'presential_price';
                                                            return handleUpdatePlan(plan.id, { [field]: parseFloat(val) });
                                                        }}
                                                        className={cn(
                                                            "font-extrabold text-nutri-brand transition-all duration-300 block",
                                                            isRecommended ? "text-4xl" : "text-3xl"
                                                        )}
                                                    />
                                                </div>
                                            ) : (
                                                <span className={cn(
                                                    "font-extrabold text-nutri-brand transition-all duration-300",
                                                    isRecommended ? "text-4xl" : "text-3xl"
                                                )}>
                                                    S/ {mod === "virtual" ? plan.precioVirtual : plan.precioPresencial}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            {isEditable ? (
                                                <EditableText
                                                    label={`Descripción ${mod}`}
                                                    value={(mod === "virtual" ? plan.descVirtual : plan.descPresencial) || ""}
                                                    onSave={(val) => {
                                                        const field = mod === "virtual" ? 'virtual_description' : 'presential_description';
                                                        return handleUpdatePlan(plan.id, { [field]: val });
                                                    }}
                                                    multiline
                                                >
                                                    <p className="text-slate-400 text-xs italic hover:text-white cursor-pointer min-h-[1em]">
                                                        {(mod === "virtual" ? plan.descVirtual : plan.descPresencial) || "Añadir descripción corta..."}
                                                    </p>
                                                </EditableText>
                                            ) : (
                                                <p className="text-slate-400 text-xs italic text-pretty-justify">
                                                    {mod === "virtual" ? plan.descVirtual : plan.descPresencial}
                                                </p>
                                            )}
                                        </div>

                                        <ul className="space-y-3 mb-8 fade-list relative">
                                            {isEditable && (
                                                <div className="absolute -top-6 -right-2 z-20">
                                                    <button
                                                        onClick={() => {
                                                            const currentFeatures = (mod === "virtual" ? plan.beneficiosVirtuales : plan.beneficiosPresenciales) || [];
                                                            const field = mod === "virtual" ? 'virtual_features' : 'presential_features';
                                                            const newFeatures = [...currentFeatures, "Nuevo Beneficio"];
                                                            handleUpdatePlan(plan.id, { [field]: newFeatures });
                                                        }}
                                                        className="p-1 bg-nutri-brand text-nutri-base rounded-md hover:scale-110 transition-transform shadow-lg"
                                                        title="Añadir Beneficio"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                            {((mod === "virtual" ? plan.beneficiosVirtuales : plan.beneficiosPresenciales) || []).map((beneficio, i) => (
                                                <li key={i} className="flex items-start gap-3 group/benefit">
                                                    <Check className={cn("text-nutri-brand flex-shrink-0 h-4 w-4", i === 0 ? "mt-1.5" : "mt-1")} />
                                                    {isEditable ? (
                                                        <div className="flex-1 flex gap-2">
                                                            <EditableText
                                                                label={`Beneficio ${i + 1}`}
                                                                value={beneficio}
                                                                onSave={(val) => {
                                                                    const currentFeatures = (mod === "virtual" ? plan.beneficiosVirtuales : plan.beneficiosPresenciales) || [];
                                                                    const field = mod === "virtual" ? 'virtual_features' : 'presential_features';
                                                                    const newFeatures = [...currentFeatures];
                                                                    newFeatures[i] = val;
                                                                    return handleUpdatePlan(plan.id, { [field]: newFeatures });
                                                                }}
                                                                className={cn(
                                                                    "font-sans flex-1",
                                                                    i === 0
                                                                        ? "text-white text-lg font-bold"
                                                                        : isRecommended
                                                                            ? "text-slate-200 font-medium text-sm"
                                                                            : "text-slate-300 text-sm"
                                                                )}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const currentFeatures = (mod === "virtual" ? plan.beneficiosVirtuales : plan.beneficiosPresenciales) || [];
                                                                    const field = mod === "virtual" ? 'virtual_features' : 'presential_features';
                                                                    const newFeatures = currentFeatures.filter((_, idx) => idx !== i);
                                                                    handleUpdatePlan(plan.id, { [field]: newFeatures });
                                                                }}
                                                                className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={cn(
                                                            "font-sans text-pretty-justify",
                                                            i === 0
                                                                ? "text-white text-lg font-bold"
                                                                : isRecommended
                                                                    ? "text-slate-200 font-medium text-sm"
                                                                    : "text-slate-300 text-sm"
                                                        )}>
                                                            {beneficio}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto relative z-10 flex flex-col gap-2">
                                        {mode === "landing" ? (
                                            <a
                                                href={mod === "virtual" ? plan.linkVirtual : plan.linkPresencial}
                                                target="_blank" rel="noreferrer"
                                                className={cn(
                                                    "block w-full py-3 px-5 text-center rounded-xl font-tech font-extrabold transition-colors text-sm",
                                                    isRecommended
                                                        ? "bg-nutri-brand text-nutri-base hover:bg-white shadow-[0_0_15px_rgba(255,122,0,0.3)]"
                                                        : "bg-transparent border border-nutri-brand text-nutri-brand hover:bg-nutri-brand hover:text-nutri-base"
                                                )}
                                            >
                                                {(plan as any).buttonText || "Reservar aquí"}
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(plan, mod)}
                                                className={cn(
                                                    "block w-full py-3 px-5 text-center rounded-xl font-tech font-extrabold transition-colors text-sm",
                                                    isRecommended
                                                        ? "bg-nutri-brand text-nutri-base hover:bg-white shadow-[0_0_15px_rgba(255,122,0,0.3)]"
                                                        : "bg-transparent border border-nutri-brand text-nutri-brand hover:bg-nutri-brand hover:text-nutri-base"
                                                )}
                                            >
                                                {currentPlanId === plan.id ? "Plan Actual" : ((plan as any).buttonText || "Elegir Plan")}
                                            </button>
                                        )}

                                        {isEditable && (
                                            <div className="flex gap-2 justify-center">
                                                <EditableText
                                                    label="Texto Botón"
                                                    value={(plan as any).buttonText || "Reservar aquí"}
                                                    onSave={(val) => handleUpdatePlan(plan.id, { button_text: val })}
                                                >
                                                    <button className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1">
                                                        <Edit3 className="h-3 w-3" /> Texto
                                                    </button>
                                                </EditableText>
                                                <EditableLink
                                                    label={`Enlace ${mod}`}
                                                    url={mod === "virtual" ? plan.linkVirtual : plan.linkPresencial}
                                                    onSave={(val) => handleUpdatePlan(plan.id, { [mod === 'virtual' ? 'custom_link_virtual' : 'custom_link_presencial']: val })}
                                                >
                                                    <button className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1">
                                                        <Edit3 className="h-3 w-3" /> Link {mod}
                                                    </button>
                                                </EditableLink>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isEditable && (
                            <button
                                onClick={handleAddPlan}
                                className="rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center gap-4 bg-white/5 border-2 border-dashed border-white/10 hover:border-nutri-brand/50 hover:bg-white/10 transition-all min-h-[400px] group"
                            >
                                <div className="p-4 bg-nutri-brand/20 rounded-full group-hover:scale-110 transition-transform">
                                    <Plus className="h-8 w-8 text-nutri-brand" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xl font-tech font-bold text-white mb-1">Añadir Nuevo Plan</h4>
                                    <p className="text-slate-500 text-sm">Crea una nueva oferta para {tipoServicio}</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* Confirm Delete Service Modal */}
                <Dialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
                    <DialogContent className="sm:max-w-md rounded-[32px] border-none bg-nutri-panel shadow-2xl overflow-hidden p-0">
                        <div className="bg-red-500/10 p-8 flex flex-col items-center gap-4 text-center border-b border-white/5">
                            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-tech font-bold text-white mb-2">Eliminar Servicio</DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">
                                    ¿Estás completamente seguro de eliminar este tipo de servicio? <br />
                                    <span className="text-red-400/80 text-xs mt-2 block italic">Esta acción ocultará todos los planes asociados a este servicio.</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-white/5 sm:justify-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setServiceToDelete(null)}
                                disabled={isDeletingService}
                                className="rounded-xl text-xs font-tech font-bold text-slate-400 hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmDeleteService}
                                disabled={isDeletingService}
                                className="px-8 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-tech font-bold transition-all shadow-lg"
                            >
                                {isDeletingService ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Sí, Eliminar"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
