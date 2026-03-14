"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Plus } from "lucide-react";

interface OfferDialogsProps {
    editingOffer: any;
    onCloseEdit: () => void;
    isCreateOpen: boolean;
    onCloseCreate: () => void;
    newOfferName: string;
    onNewOfferNameChange: (v: string) => void;
    newOfferPrice: string;
    onNewOfferPriceChange: (v: string) => void;
    newOfferPriceOffer: string;
    onNewOfferPriceOfferChange: (v: string) => void;
    newOfferFeatures: string;
    onNewOfferFeaturesChange: (v: string) => void;
    newOfferHighlight: string;
    onNewOfferHighlightChange: (v: string) => void;
    newOfferOfferReason: string;
    onNewOfferOfferReasonChange: (v: string) => void;
    newOfferDescription: string;
    onNewOfferDescriptionChange: (v: string) => void;
    onUpdateOffer: () => void;
    onCreateOffer: () => void;
}

export function OfferDialogs({
    editingOffer,
    onCloseEdit,
    isCreateOpen,
    onCloseCreate,
    newOfferName,
    onNewOfferNameChange,
    newOfferPrice,
    onNewOfferPriceChange,
    newOfferPriceOffer,
    onNewOfferPriceOfferChange,
    newOfferFeatures,
    onNewOfferFeaturesChange,
    newOfferHighlight,
    onNewOfferHighlightChange,
    newOfferOfferReason,
    onNewOfferOfferReasonChange,
    newOfferDescription,
    onNewOfferDescriptionChange,
    onUpdateOffer,
    onCreateOffer
}: OfferDialogsProps) {
    return (
        <>
            {/* Offer Edit Dialog */}
            <Dialog open={!!editingOffer} onOpenChange={(open) => !open && onCloseEdit()}>
                <DialogContent className="rounded-[2.5rem] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Editar Plan: {editingOffer?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Plan</label>
                            <Input className="rounded-xl font-bold" value={newOfferName} onChange={(e) => onNewOfferNameChange(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio Regular ($)</label>
                                <Input type="number" className="rounded-xl font-bold" value={newOfferPrice} onChange={(e) => onNewOfferPriceChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest">Precio Oferta ($)</label>
                                <Input type="number" placeholder="Opcional" className="rounded-xl font-bold border-nutrition-200" value={newOfferPriceOffer} onChange={(e) => onNewOfferPriceOfferChange(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Beneficios (Uno por línea)</label>
                            <textarea
                                className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none"
                                placeholder="Ej: Dieta personalizada&#10;Seguimiento semanal"
                                value={newOfferFeatures}
                                onChange={(e) => onNewOfferFeaturesChange(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Resaltado (Short Badge)</label>
                            <Input placeholder="Ej: Plan más popular" className="rounded-xl font-bold" value={newOfferHighlight} onChange={(e) => onNewOfferHighlightChange(e.target.value)} />
                        </div>

                        {newOfferPriceOffer && (
                            <div className="p-4 rounded-2xl bg-nutrition-50 border border-nutrition-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest leading-none">Detalles de la Oferta</label>
                                    <Input placeholder="Motivo: Ej: Black Friday" className="rounded-xl font-bold bg-white" value={newOfferOfferReason} onChange={(e) => onNewOfferOfferReasonChange(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <textarea
                                        placeholder="Descripción de la oferta específica..."
                                        className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none"
                                        value={newOfferDescription}
                                        onChange={(e) => onNewOfferDescriptionChange(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button className="w-full rounded-xl bg-slate-900 font-black h-12" onClick={onUpdateOffer}>
                            <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Offer Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => !open && onCloseCreate()}>
                <DialogContent className="rounded-[2.5rem] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Crear Nuevo Plan</DialogTitle>
                        <DialogDescription>Define un nuevo plan de suscripción para los pacientes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Plan</label>
                            <Input className="rounded-xl font-bold" placeholder="Plan Personalizado..." value={newOfferName} onChange={(e) => onNewOfferNameChange(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio Regular ($)</label>
                                <Input type="number" className="rounded-xl font-bold" value={newOfferPrice} onChange={(e) => onNewOfferPriceChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest">Precio Oferta ($)</label>
                                <Input type="number" placeholder="Opcional" className="rounded-xl font-bold border-nutrition-200" value={newOfferPriceOffer} onChange={(e) => onNewOfferPriceOfferChange(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Beneficios (Uno por línea)</label>
                            <textarea
                                className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none"
                                placeholder="Ej: Acceso a dietas VIP&#10;Seguimiento 24/7"
                                value={newOfferFeatures}
                                onChange={(e) => onNewOfferFeaturesChange(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Resaltado (Short Badge)</label>
                            <Input placeholder="Ej: Oferta de lanzamiento" className="rounded-xl font-bold" value={newOfferHighlight} onChange={(e) => onNewOfferHighlightChange(e.target.value)} />
                        </div>

                        {newOfferPriceOffer && (
                            <div className="p-4 rounded-2xl bg-nutrition-50 border border-nutrition-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest leading-none">Detalles de la Oferta</label>
                                    <Input placeholder="Motivo: Ej: Inauguración" className="rounded-xl font-bold bg-white" value={newOfferOfferReason} onChange={(e) => onNewOfferOfferReasonChange(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <textarea
                                        placeholder="Descripción de la oferta específica..."
                                        className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none"
                                        value={newOfferDescription}
                                        onChange={(e) => onNewOfferDescriptionChange(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button className="w-full rounded-xl bg-nutrition-600 font-black h-12 text-white" onClick={onCreateOffer}>
                            <Plus className="h-4 w-4 mr-2" /> Crear Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
