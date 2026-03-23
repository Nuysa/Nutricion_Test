"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateUserDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    newUserFullName: string;
    onNewUserFullNameChange: (value: string) => void;
    newUserEmail: string;
    onNewUserEmailChange: (value: string) => void;
    newUserPassword: string;
    onNewUserPasswordChange: (value: string) => void;
    newUserRole: "staff" | "administrador";
    onNewUserRoleChange: (role: "staff" | "administrador") => void;
    handleCreateUser: () => void;
    isCreatingUser: boolean;
}

export function CreateUserDialog({
    isOpen,
    onOpenChange,
    newUserFullName,
    onNewUserFullNameChange,
    newUserEmail,
    onNewUserEmailChange,
    newUserPassword,
    onNewUserPasswordChange,
    newUserRole,
    onNewUserRoleChange,
    handleCreateUser,
    isCreatingUser
}: CreateUserDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2.5rem] max-w-md bg-nutri-base border-white/10 text-white p-0 overflow-hidden font-tech">
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                            <div className="h-2 w-8 bg-nutri-brand" />
                            Nuevo Acceso
                        </h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Registra personal con privilegios administrativos.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <Input
                                className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                placeholder="Ej: Staff Nutrition"
                                value={newUserFullName}
                                onChange={(e) => onNewUserFullNameChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                            <Input
                                className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                placeholder="admin@nuysa.com"
                                value={newUserEmail}
                                onChange={(e) => onNewUserEmailChange(e.target.value)}
                                type="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Temporal</label>
                            <Input
                                className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newUserPassword}
                                onChange={(e) => onNewUserPasswordChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Designado</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => onNewUserRoleChange("staff")}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                        newUserRole === 'staff' ? "border-nutri-brand bg-nutri-brand/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                    )}
                                >
                                    <Users className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase">Staff</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNewUserRoleChange("administrador")}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                        newUserRole === 'administrador' ? "border-red-500/50 bg-red-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                    )}
                                >
                                    <Shield className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase">Admin Root</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 bg-white text-nutri-base hover:bg-nutri-brand hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-2xl"
                        onClick={handleCreateUser}
                        disabled={isCreatingUser}
                    >
                        {isCreatingUser ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Registros"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
