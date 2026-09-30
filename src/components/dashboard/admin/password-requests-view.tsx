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
    Link as LinkIcon,
    ExternalLink,
    AlertCircle,
    Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PasswordRequestService, PasswordRequestItem } from "@/lib/password-request-service";

export function PasswordRequestsAdminView() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<PasswordRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "link_generated" | "resolved">("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

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

    const handleGenerateLink = async (requestId: string) => {
        setGeneratingId(requestId);
        try {
            const origin = window.location.origin;
            const result = await PasswordRequestService.generateRenewalLink(requestId, origin);
            
            toast({
                title: "¡Enlace Único Generado!",
                description: "El enlace caduca tras su primer uso. Cópialo y envíaselo al usuario.",
                variant: "success"
            });

            // Copiar directamente al portapapeles para conveniencia
            navigator.clipboard.writeText(result.url);
            setCopiedId(requestId);
            setTimeout(() => setCopiedId(null), 3000);

            await loadRequests();
        } catch (error: any) {
            console.error("Error al generar enlace:", error);
            toast({
                title: "Error al generar enlace",
                description: error.message || "No se pudo generar el enlace.",
                variant: "destructive"
            });
        } finally {
            setGeneratingId(null);
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
    const linkGeneratedCount = requests.filter(r => r.status === "link_generated").length;
    const resolvedCount = requests.filter(r => r.status === "resolved").length;

    const getRenewalUrl = (token?: string) => {
        if (!token) return "";
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        return `${origin}/renew-password?token=${encodeURIComponent(token)}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-tech">
            {/* Cabecera de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                        <div className="h-3 w-1.5 bg-nutri-brand rounded-full" />
                        Solicitudes de Renovación de Contraseña
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Genera enlaces únicos de renovación para usuarios con cuentas o correos ficticios
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={loadRequests}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 rounded-[2rem] bg-white/[0.02] border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Pendientes de Enlace</span>
                        <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{pendingCount}</div>
                    <p className="text-[10px] text-slate-500 font-bold">Solicitudes de usuarios esperando enlace</p>
                </Card>

                <Card className="p-5 rounded-[2rem] bg-white/[0.02] border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Enlaces Activos</span>
                        <LinkIcon className="h-4 w-4 text-nutri-brand" />
                    </div>
                    <div className="text-3xl font-black text-nutri-brand">{linkGeneratedCount}</div>
                    <p className="text-[10px] text-slate-500 font-bold">Enlaces generados listos o enviados</p>
                </Card>

                <Card className="p-5 rounded-[2rem] bg-white/[0.02] border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Renovadas / Usadas</span>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-3xl font-black text-green-400">{resolvedCount}</div>
                    <p className="text-[10px] text-slate-500 font-bold">Enlaces usados y caducados</p>
                </Card>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        type="text"
                        placeholder="Buscar por correo o nota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-white/5 bg-white/5 text-white placeholder:text-slate-600 focus:ring-nutri-brand/50 font-bold text-xs"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "all", label: "Todas" },
                        { id: "pending", label: "Pendientes" },
                        { id: "link_generated", label: "Enlace Generado" },
                        { id: "resolved", label: "Renovadas" }
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
                        Cargando solicitudes de renovación...
                    </p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <Card className="p-12 text-center rounded-[2.5rem] bg-white/[0.02] border-white/5 space-y-3">
                    <KeyRound className="h-12 w-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-black uppercase text-white">No hay solicitudes</h3>
                    <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                        {searchTerm
                            ? "No se encontraron solicitudes que coincidan con la búsqueda."
                            : "Cuando un usuario con correo ficticio solicite ayuda desde el login, aparecerá aquí para que le generes un enlace único de renovación."}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRequests.map(req => {
                        const isPending = req.status === "pending";
                        const isLinkGenerated = req.status === "link_generated";
                        const isResolved = req.status === "resolved";
                        const renewalUrl = getRenewalUrl(req.token);

                        return (
                            <Card
                                key={req.id}
                                className={`p-6 rounded-[2rem] border transition-all space-y-5 ${
                                    isPending
                                        ? "bg-white/[0.03] border-amber-500/30 shadow-lg shadow-amber-500/5"
                                        : isLinkGenerated
                                        ? "bg-white/[0.03] border-nutri-brand/40 shadow-lg shadow-nutri-brand/5"
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
                                            Solicitada: {new Date(req.createdAt).toLocaleString("es-ES", {
                                                dateStyle: "short",
                                                timeStyle: "short"
                                            })}
                                        </p>
                                    </div>

                                    <Badge
                                        className={`px-3 py-1 font-black uppercase text-[9px] tracking-widest border-none ${
                                            isPending
                                                ? "bg-amber-500/10 text-amber-400"
                                                : isLinkGenerated
                                                ? "bg-nutri-brand/10 text-nutri-brand border border-nutri-brand/20"
                                                : "bg-green-500/10 text-green-400"
                                        }`}
                                    >
                                        {isPending ? "Pendiente" : isLinkGenerated ? "Enlace Generado" : "Renovada / Usada"}
                                    </Badge>
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

                                {/* Sección de Enlace Único */}
                                {isLinkGenerated && req.token && (
                                    <div className="p-4 rounded-2xl bg-black/40 border border-nutri-brand/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <LinkIcon className="h-3.5 w-3.5 text-nutri-brand" />
                                                Enlace Único de Renovación (Caduca al usarse):
                                            </span>
                                            <span className="text-[9px] font-bold text-amber-400/90 uppercase">
                                                Uso único
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="font-mono text-xs text-white truncate select-all flex-1">
                                                {renewalUrl}
                                            </span>

                                            <Button
                                                size="sm"
                                                onClick={() => handleCopy(renewalUrl, req.id, "Enlace de Renovación")}
                                                className="h-8 px-3 rounded-lg bg-nutri-brand hover:bg-white text-nutri-base text-[10px] font-black uppercase transition-all shrink-0"
                                            >
                                                {copiedId === req.id ? (
                                                    <>
                                                        <Check className="h-3 w-3 mr-1" /> Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3 mr-1" /> Copiar Enlace
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                            Copia este enlace y envíaselo al usuario por WhatsApp, llamada o mensaje directo. Al ingresar podrá elegir su nueva contraseña y el enlace caducará automáticamente.
                                        </p>
                                    </div>
                                )}

                                {isResolved && (
                                    <div className="p-3.5 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                        <p className="text-[11px] text-green-400 font-bold leading-snug">
                                            Contraseña renovada exitosamente por el usuario. El enlace ya fue consumido y caducó.
                                        </p>
                                    </div>
                                )}

                                {/* Acciones del Admin */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                    {isPending && (
                                        <Button
                                            onClick={() => handleGenerateLink(req.id)}
                                            disabled={generatingId === req.id}
                                            className="flex-1 h-11 rounded-xl bg-nutri-brand hover:bg-white text-nutri-base text-xs font-black uppercase tracking-widest shadow-md transition-all"
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            {generatingId === req.id ? "Generando Enlace..." : "Generar Enlace de Renovación"}
                                        </Button>
                                    )}

                                    {isLinkGenerated && (
                                        <Button
                                            onClick={() => handleGenerateLink(req.id)}
                                            disabled={generatingId === req.id}
                                            variant="outline"
                                            className="h-10 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-wider"
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1.5" />
                                            Regenerar Nuevo Enlace
                                        </Button>
                                    )}

                                    {isResolved && (
                                        <span className="text-[10px] font-bold text-slate-500 italic">
                                            Finalizada el {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString("es-ES") : ""}
                                        </span>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(req.id)}
                                        className="h-10 px-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-auto"
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
