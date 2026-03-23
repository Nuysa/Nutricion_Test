"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserCheck, Check, X } from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";

interface VerificationTabProps {
    pendingNutris: GlobalProfile[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    onVerify: (id: string, status: "Activo" | "Rechazado") => void;
}

export function VerificationTab({
    pendingNutris,
    searchTerm,
    onSearchTermChange,
    onVerify
}: VerificationTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-white">Verificación de Especialistas</h2>
                <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por nombre..."
                        className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-nutrition-500/50"
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingNutris.length > 0 ? (
                        pendingNutris.map(nutri => (
                            <Card key={nutri.id} className="rounded-[2rem] border-white/5 bg-white/[0.02] shadow-lg overflow-hidden flex flex-col group hover:border-white/10 transition-all">
                                <div className="h-20 bg-gradient-to-r from-nutrition-500 to-nutrition-600 relative">
                                    <Badge className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border-none text-[10px] font-black uppercase text-white">
                                        Pendiente
                                    </Badge>
                                </div>
                                <div className="px-6 pb-6 flex-1 flex flex-col items-center -mt-10 text-center">
                                    <Avatar className="h-20 w-20 border-4 border-slate-900 shadow-xl mb-4">
                                        <AvatarFallback className="bg-nutrition-50 text-nutrition-600 text-xl font-black">
                                            {(nutri.name || "?").split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-black text-lg text-white leading-none">{nutri.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium mb-4">Especialista Registrado</p>

                                    <div className="w-full bg-white/[0.03] rounded-2xl p-4 mb-6 text-left space-y-2 border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Documentos</p>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                            <span>Título Profesional</span>
                                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none">Subido</Badge>
                                        </div>
                                    </div>

                                    <div className="mt-auto w-full grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl font-black border-white/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/20"
                                            onClick={() => onVerify(nutri.id, "Rechazado")}
                                        >
                                            <X className="h-4 w-4 mr-2" /> Rechazar
                                        </Button>
                                        <Button
                                            className="rounded-xl font-black bg-nutrition-600 hover:bg-nutrition-700 text-white shadow-lg shadow-nutrition-600/20"
                                            onClick={() => onVerify(nutri.id, "Activo")}
                                        >
                                            <Check className="h-4 w-4 mr-2" /> Verificar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                                <UserCheck className="h-10 w-10 text-slate-600" />
                            </div>
                            <p className="text-slate-500 font-black text-lg">No hay solicitudes pendientes.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
