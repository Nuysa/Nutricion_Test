"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    Image as ImageIcon,
    LayoutGrid,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Edit3,
    ArrowUp,
    ArrowDown,
    Upload,
    Camera
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExchangeCard {
    id: string;
    title: string;
    description: string;
    image_url: string;
}

interface ExchangeGroup {
    id: string;
    title: string;
    cards: ExchangeCard[];
    order_index: number;
}

export function ExchangeGuideEditor() {
    const [groups, setGroups] = useState<ExchangeGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingCards, setUploadingCards] = useState<Record<string, boolean>>({});
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const supabase = createClient();
    const { toast } = useToast();

    const fetchGroups = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('exchange_guides')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.error("Error fetching exchange guides:", error);
            // If table doesn't exist, we'll handle it later
            setGroups([]);
        } else {
            setGroups(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const addGroup = () => {
        const newGroup: ExchangeGroup = {
            id: crypto.randomUUID(),
            title: "Nueva Categoría",
            cards: [],
            order_index: groups.length
        };
        setGroups([...groups, newGroup]);
    };

    const removeGroup = (groupId: string) => {
        setGroups(groups.filter(g => g.id !== groupId));
    };

    const updateGroupTitle = (groupId: string, title: string) => {
        setGroups(groups.map(g => g.id === groupId ? { ...g, title } : g));
    };

    const addCard = (groupId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    cards: [
                        ...g.cards,
                        { id: crypto.randomUUID(), title: "", description: "", image_url: "" }
                    ]
                };
            }
            return g;
        }));
    };

    const removeCard = (groupId: string, cardId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    cards: g.cards.filter(c => c.id !== cardId)
                };
            }
            return g;
        }));
    };

    const updateCard = (groupId: string, cardId: string, updates: Partial<ExchangeCard>) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    cards: g.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
                };
            }
            return g;
        }));
    };

    const moveGroup = (idx: number, direction: 'up' | 'down') => {
        const newGroups = [...groups];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= newGroups.length) return;
        
        [newGroups[idx], newGroups[targetIdx]] = [newGroups[targetIdx], newGroups[idx]];
        
        // Update order_index
        const updated = newGroups.map((g, i) => ({ ...g, order_index: i }));
        setGroups(updated);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupId: string, cardId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCards(prev => ({ ...prev, [cardId]: true }));
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `exchange-guide/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('public-media')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public-media')
                .getPublicUrl(fileName);

            updateCard(groupId, cardId, { image_url: publicUrl });
            toast({ title: "Imagen subida", variant: "success" });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({ 
                title: "Error al subir", 
                description: error.message.includes("Bucket not found") 
                    ? "El bucket 'public-media' no existe. Créalo en Supabase Storage con acceso público." 
                    : error.message, 
                variant: "destructive" 
            });
        } finally {
            setUploadingCards(prev => ({ ...prev, [cardId]: false }));
        }
    };

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // This is a bit brute force: delete all and insert all
            // Or we can use upsert if they have real IDs in DB
            
            // 1. Delete all existing
            const { error: deleteError } = await supabase
                .from('exchange_guides')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

            if (deleteError) throw deleteError;

            // 2. Insert current
            if (groups.length > 0) {
                const toInsert = groups.map((g, i) => ({
                    title: g.title,
                    cards: g.cards,
                    order_index: i
                }));
                const { error: insertError } = await supabase
                    .from('exchange_guides')
                    .insert(toInsert);
                if (insertError) throw insertError;
            }

            toast({
                title: "Guía Guardada",
                description: "Los cambios han sido publicados exitosamente.",
                variant: "success"
            });
            fetchGroups(); // Refresh with DB IDs
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

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gestión de Guía de Intercambio</h2>
                    <p className="text-slate-400 text-sm">Crea y organiza las categorías de alimentos para tus pacientes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={addGroup}
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest px-6 rounded-xl"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Categoría
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl shadow-lg shadow-orange-500/20"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Publicar Cambios
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {groups.length === 0 ? (
                    <div className="border-2 border-dashed border-white/5 rounded-[2rem] p-20 text-center space-y-4">
                        <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
                            <LayoutGrid className="h-8 w-8" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">No hay categorías creadas aún.</p>
                        <Button onClick={addGroup} variant="link" className="text-orange-500 font-black uppercase text-[10px] tracking-widest">
                            Empezar ahora
                        </Button>
                    </div>
                ) : (
                    groups.map((group, gIdx) => (
                        <Card key={group.id} className="bg-[#151F32] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all">
                            <CardHeader className="bg-white/[0.02] border-b border-white/5 p-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col gap-1">
                                            <button 
                                                onClick={() => moveGroup(gIdx, 'up')}
                                                disabled={gIdx === 0}
                                                className="text-slate-600 hover:text-white disabled:opacity-0 transition-colors"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => moveGroup(gIdx, 'down')}
                                                disabled={gIdx === groups.length - 1}
                                                className="text-slate-600 hover:text-white disabled:opacity-0 transition-colors"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <Input 
                                            value={group.title}
                                            onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                                            placeholder="Título de la Categoría (ej: Almidones)"
                                            className="bg-transparent border-none text-xl font-black text-white focus-visible:ring-0 p-0 h-auto placeholder:text-slate-700 uppercase italic tracking-tighter"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => addCard(group.id)}
                                                size="sm"
                                                variant="outline"
                                                className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 rounded-xl font-bold text-[10px] tracking-widest uppercase h-9"
                                            >
                                                <Plus className="h-3 w-3 mr-2" />
                                                <span className="hidden sm:inline">Añadir Card</span>
                                            </Button>
                                            <Button
                                                onClick={() => removeGroup(group.id)}
                                                size="icon"
                                                variant="ghost"
                                                className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl h-9 w-9"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />
                                        <Button
                                            onClick={() => toggleGroupCollapse(group.id)}
                                            size="icon"
                                            variant="ghost"
                                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-10 w-10 transition-transform duration-300"
                                            style={{ transform: collapsedGroups[group.id] ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                                        >
                                            <ChevronDown className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {!collapsedGroups[group.id] && (
                                <CardContent className="p-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {group.cards.map((card) => (
                                        <Card key={card.id} className="bg-white/5 border-white/5 rounded-2xl overflow-hidden relative group/card hover:border-orange-500/30 transition-all">
                                            <div className="h-32 bg-white/5 relative flex items-center justify-center overflow-hidden">
                                                {uploadingCards[card.id] ? (
                                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm z-10 text-orange-500">
                                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Subiendo...</span>
                                                    </div>
                                                ) : card.image_url ? (
                                                    <img 
                                                        src={card.image_url} 
                                                        alt={card.title}
                                                        className="w-full h-full object-contain transition-transform duration-500 group-hover/card:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ImageIcon className="h-10 w-10 text-slate-800" />
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin Imagen</span>
                                                    </div>
                                                )}
                                                
                                                {!uploadingCards[card.id] && (
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 gap-3">
                                                        <label className="w-full flex items-center justify-center cursor-pointer">
                                                            <div className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
                                                                <Upload className="h-4 w-4" />
                                                                Subir desde PC
                                                            </div>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => handleFileUpload(e, group.id, card.id)}
                                                            />
                                                        </label>
                                                        
                                                        <div className="w-full space-y-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">O usar URL:</p>
                                                            <Input 
                                                                value={card.image_url}
                                                                onChange={(e) => updateCard(group.id, card.id, { image_url: e.target.value })}
                                                                placeholder="https://..."
                                                                className="bg-white/10 border-white/20 text-white text-[10px] rounded-lg h-8 placeholder:text-slate-600"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <Input 
                                                    value={card.title}
                                                    onChange={(e) => updateCard(group.id, card.id, { title: e.target.value })}
                                                    placeholder="Título"
                                                    className="bg-transparent border-none text-[11px] font-black text-white p-0 h-auto focus-visible:ring-0 placeholder:text-slate-700 uppercase leading-none"
                                                />
                                                <Textarea 
                                                    value={card.description}
                                                    onChange={(e) => updateCard(group.id, card.id, { description: e.target.value })}
                                                    placeholder="Descripción"
                                                    className="bg-transparent border-none text-[10px] text-slate-400 p-0 h-auto min-h-[20px] focus-visible:ring-0 resize-none placeholder:text-slate-700 leading-tight"
                                                />
                                                <div className="flex justify-end h-4">
                                                    <Button
                                                        onClick={() => removeCard(group.id, card.id)}
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-5 w-5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity translate-y-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <button 
                                        onClick={() => addCard(group.id)}
                                        className="h-full min-h-[180px] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group p-4"
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold text-[9px] uppercase tracking-widest">Añadir</span>
                                    </button>
                                </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
