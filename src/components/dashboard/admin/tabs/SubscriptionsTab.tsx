"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Edit3, Check, X, DatabaseZap, Clock, ShoppingBag } from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface SubscriptionsTabProps {
    patients: GlobalProfile[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    selectedPatientId: string | null;
    onSelectedPatientIdChange: (id: string | null) => void;
    selectedOfferId: string | null;
    onSelectedOfferIdChange: (id: string | null) => void;
    offers: any[];
    subscriptions: any[];
    subReviewSearch: string;
    onSubReviewSearchChange: (value: string) => void;
    currentAdminRole: string;
    onRequestSubscription: () => void;
    onHandleSubscriptionStatus: (id: string, status: string) => void;
    onOpenCreateOffer: () => void;
    onOpenEditOffer: (offer: any) => void;
}

export function SubscriptionsTab({
    patients,
    searchTerm,
    onSearchTermChange,
    selectedPatientId,
    onSelectedPatientIdChange,
    selectedOfferId,
    onSelectedOfferIdChange,
    offers,
    subscriptions,
    subReviewSearch,
    onSubReviewSearchChange,
    currentAdminRole,
    onRequestSubscription,
    onHandleSubscriptionStatus,
    onOpenCreateOffer,
    onOpenEditOffer
}: SubscriptionsTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Proposal Section */}
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-purple-500" />
                            </div>
                            <CardTitle className="font-black text-xl uppercase tracking-tight text-white">Solicitar Cambio de Plan</CardTitle>
                        </div>
                        <CardDescription className="text-slate-500 font-tech uppercase text-[10px] tracking-widest mt-1">Propone un nuevo protocolo para un paciente</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Seleccionar Paciente</p>
                                <div className="relative w-32">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                                    <Input
                                        placeholder="Filtrar..."
                                        className="h-8 pl-7 text-[10px] rounded-lg border-white/5 bg-white/5 text-white"
                                        value={searchTerm}
                                        onChange={(e) => onSearchTermChange(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ScrollArea className="h-40 border border-white/5 rounded-2xl p-2 bg-white/[0.02]">
                                <div className="space-y-1">
                                    {patients.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => onSelectedPatientIdChange(selectedPatientId === p.id ? null : p.id)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl flex items-center gap-3 text-xs font-bold transition-all",
                                                selectedPatientId === p.id 
                                                    ? "bg-nutrition-600 text-white shadow-lg" 
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <Avatar className="h-6 w-6 border border-white/10 shadow-sm">
                                                <AvatarFallback className="text-[9px] bg-slate-800">{p.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{p.name}</span>
                                            {selectedPatientId === p.id && <Check className="h-3 w-3 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Plan Sugerido</p>
                            <div className="grid grid-cols-1 gap-2">
                                {offers.map(o => (
                                    <button
                                        key={o.id}
                                        onClick={() => onSelectedOfferIdChange(selectedOfferId === o.id ? null : o.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl flex items-center justify-between text-xs font-black transition-all border group",
                                            selectedOfferId === o.id 
                                                ? "bg-white text-slate-900 border-transparent shadow-xl" 
                                                : "bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="uppercase tracking-tight">{o.name_es || o.name}</span>
                                            <span className={cn(
                                                "text-[9px] mt-1 font-tech uppercase",
                                                selectedOfferId === o.id ? "text-slate-500" : "text-slate-600"
                                            )}>S/. {o.price_pen || o.price} / MES</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-xl transition-all",
                                                selectedOfferId === o.id ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100" : "text-slate-600 hover:text-white hover:bg-white/10"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenEditOffer(o);
                                            }}
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                    </button>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-dashed rounded-2xl border-white/10 bg-white/[0.01] text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/[0.03] hover:text-white hover:border-white/20 transition-all"
                                    onClick={onOpenCreateOffer}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Crear Nuevo Plan Maestro
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full rounded-[1.5rem] bg-nutrition-600 text-white font-black h-14 uppercase tracking-widest shadow-xl shadow-nutrition-600/20 hover:bg-nutrition-500 transition-all transform active:scale-95 disabled:opacity-20 disabled:grayscale"
                            disabled={!selectedPatientId || !selectedOfferId}
                            onClick={onRequestSubscription}
                        >
                            Enviar Propuesta Oficial <Check className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Review Section */}
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                </div>
                                <CardTitle className="font-black text-xl uppercase tracking-tight text-white">Revisión de Solicitudes</CardTitle>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-500 font-black border-none uppercase text-[9px] tracking-widest px-3 h-6">Pendientes</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="mb-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por paciente o plan..."
                                className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-amber-500/50"
                                value={subReviewSearch}
                                onChange={(e) => onSubReviewSearchChange(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[480px] pr-4 no-scrollbar">
                            <div className="space-y-4">
                                {subscriptions.filter(s =>
                                    (s.patient?.profile?.full_name || "").toLowerCase().includes(subReviewSearch.toLowerCase()) ||
                                    (s.plan?.name_es || "").toLowerCase().includes(subReviewSearch.toLowerCase())
                                ).map(sub => (
                                    <div key={sub.id} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-4 group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-white/10">
                                                    <AvatarFallback className="bg-slate-800 text-[10px] text-white">{(sub.patient?.profile?.full_name || "?")[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-black text-white text-sm leading-none">{sub.patient?.profile?.full_name}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <DatabaseZap className="h-3 w-3 text-nutrition-500" />
                                                        <p className="text-[10px] font-black text-nutrition-500 uppercase tracking-tighter">{sub.plan?.name_es || "Plan Activo"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "border-none rounded-lg text-[8px] font-black uppercase px-2 h-5 tracking-widest",
                                                sub.status === 'activa' ? "bg-green-500/10 text-green-500" :
                                                    sub.status === 'pendiente' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {sub.status === 'activa' ? 'Activa' : sub.status === 'pendiente' ? 'Esperando' : 'Cancelada'}
                                            </Badge>
                                        </div>

                                        {sub.status === 'pendiente' && (currentAdminRole === 'administrador' || currentAdminRole === 'staff') && (
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 rounded-xl border-white/5 bg-red-500/10 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                    onClick={() => onHandleSubscriptionStatus(sub.id, 'cancelada')}
                                                >
                                                    Rechazar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 rounded-xl bg-nutrition-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-nutrition-500 shadow-lg shadow-nutrition-600/20 transition-all"
                                                    onClick={() => onHandleSubscriptionStatus(sub.id, 'activa')}
                                                >
                                                    Aprobar Solicitud
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
