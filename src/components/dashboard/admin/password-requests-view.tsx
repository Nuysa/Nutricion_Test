"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    KeyRound,
    Copy,
    Check,
    Trash2,
    CheckCircle2,
    Clock,
    Search,
    RefreshCw,
    Shield,
    Mail,
    FileText,
    Eye,
    EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PasswordRequestService, PasswordRequestItem } from "@/lib/password-request-service";

export function PasswordRequestsAdminView() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<PasswordRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "resolved">("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await PasswordRequestService.getAll();
            setRequests(data);
        } catch (error: any) {
            console.error("Error al cargar solicitudes:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las solicitudes de contraseñas.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleCopy = (text: string, id: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast({
            title: "Copiado al portapapeles",
            description: `${label}: ${text}`,
            variant: "success"
        });
        setTimeout(() => setCopiedId(null), 2500);
    };

    const handleMarkResolved = async (requestId: string) => {
        try {
            await PasswordRequestService.updateStatus(requestId, "resolved");
            toast({
                title: "Solicitud Marcada como Atendida",
                description: "La contraseña solicitada ya puede ser brindada al usuario.",
                variant: "success"
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo actualizar el estado.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (requestId: string) => {
        if (!confirm("¿Deseas eliminar este registro de solicitud?")) return;

        try {
            await PasswordRequestService.deleteRequest(requestId);
            toast({
                title: "Solicitud eliminada",
                variant: "success"
            });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo eliminar la solicitud.",
                variant: "destructive"
            });
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            (req.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.note || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            filterStatus === "all" ? true : req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = requests.filter(r => r.status === "pending").length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-tech">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                        <KeyRound className="h-8 w-8 text-nutri-brand" />
                        Solicitudes de Contraseña (Admin Root)
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                        Contraseñas solicitadas por usuarios con correos ficticios o cuentas de prueba.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={loadRequests}
                        className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-black uppercase tracking-widest h-12"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pendientes de Entrega</p>
                        <p className="text-3xl font-black text-nutri-brand mt-1">{pendingCount}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-nutri-brand/10 border border-nutri-brand/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-nutri-brand" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atendidas / Resueltas</p>
                        <p className="text-3xl font-black text-green-400 mt-1">
                            {requests.filter(r => r.status === "resolved").length}
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Solicitudes</p>
                        <p className="text-3xl font-black text-white mt-1">{requests.length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtro */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por correo ficticio o nota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-white/5 bg-white/5 text-white placeholder:text-slate-600 focus:ring-nutri-brand/50 font-bold text-xs"
                    />
                </div>

                <div className="flex gap-2">
                    {[
                        { id: "all", label: "Todas" },
                        { id: "pending", label: "Pendientes" },
                        { id: "resolved", label: "Atendidas" }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterStatus(f.id as any)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                filterStatus === f.id
                                    ? "bg-nutri-brand text-nutri-base shadow-lg shadow-nutri-brand/20"
                                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado de Solicitudes */}
            {loading ? (
                <div className="py-20 text-center space-y-4">
                    <div className="h-10 w-10 border-4 border-nutri-brand border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Cargando solicitudes de contraseñas...
                    </p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <Card className="p-12 text-center rounded-[2.5rem] bg-white/[0.02] border-white/5 space-y-3">
                    <KeyRound className="h-12 w-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-black uppercase text-white">No hay solicitudes</h3>
                    <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                        {searchTerm
                            ? "No se encontraron solicitudes que coincidan con la búsqueda."
                            : "Cuando un usuario con correo ficticio solicite una contraseña desde el login, aparecerá aquí inmediatamente con su contraseña solicitada."}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRequests.map(req => {
                        const isVisible = visiblePasswords[req.id];
                        const isPending = req.status === "pending";

                        return (
                            <Card
                                key={req.id}
                                className={`p-6 rounded-[2rem] border transition-all space-y-5 ${
                                    isPending
                                        ? "bg-white/[0.03] border-nutri-brand/30 shadow-lg shadow-nutri-brand/5"
                                        : "bg-white/[0.01] border-white/5 opacity-80 hover:opacity-100"
                                }`}
                            >
                                {/* Header de la tarjeta */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-nutri-brand shrink-0" />
                                            <span className="text-sm font-black text-white uppercase tracking-tight">
                                                {req.email}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold">
                                            Recibida: {new Date(req.createdAt).toLocaleString("es-ES", {
                                                dateStyle: "short",
                                                timeStyle: "short"
                                            })}
                                        </p>
                                    </div>

                                    <Badge
                                        className={`px-3 py-1 font-black uppercase text-[9px] tracking-widest border-none ${
                                            isPending
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-green-500/10 text-green-400"
                                        }`}
                                    >
                                        {isPending ? "Pendiente" : "Atendida"}
                                    </Badge>
                                </div>

                                {/* Contraseña solicitada para brindar al usuario */}
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <KeyRound className="h-3.5 w-3.5 text-nutri-brand" />
                                            Contraseña Solicitada para el Usuario:
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility(req.id)}
                                            className="text-slate-400 hover:text-white transition-colors"
                                            title={isVisible ? "Ocultar" : "Mostrar"}
                                        >
                                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="font-mono text-base font-black text-nutri-brand tracking-wider select-all">
                                            {isVisible ? req.requestedPassword : "•".repeat(Math.min(req.requestedPassword.length, 12))}
                                        </span>

                                        <Button
                                            size="sm"
                                            onClick={() => handleCopy(req.requestedPassword, req.id, "Contraseña")}
                                            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-nutri-brand hover:text-nutri-base text-white text-[10px] font-black uppercase transition-all"
                                        >
                                            {copiedId === req.id ? (
                                                <>
                                                    <Check className="h-3 w-3 mr-1 text-green-400" /> Copiado
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3 mr-1" /> Copiar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Nota o detalles opcionales */}
                                {req.note && (
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
                                        <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-300 font-bold leading-relaxed">
                                            {req.note}
                                        </p>
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                    {isPending ? (
                                        <Button
                                            onClick={() => handleMarkResolved(req.id)}
                                            className="flex-1 h-10 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-nutri-base text-[10px] font-black uppercase tracking-widest border border-green-500/20 transition-all"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                            Marcar como Atendida
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-500 italic">
                                            Atendida el {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString("es-ES") : ""}
                                        </span>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(req.id)}
                                        className="h-10 px-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        title="Eliminar solicitud"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
