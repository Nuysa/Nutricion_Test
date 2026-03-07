"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";

const offers = [
    {
        id: "1",
        name: "Plan Básico",
        price: 29.99,
        duration: "mes",
        icon: Zap,
        popular: false,
        color: "from-sky-500 to-sky-600",
        features: [
            "Seguimiento de peso y medidas",
            "Plan alimenticio básico",
            "Acceso al diario alimenticio",
            "1 consulta virtual al mes",
            "Soporte por email",
        ],
    },
    {
        id: "2",
        name: "Plan Premium",
        price: 59.99,
        duration: "mes",
        icon: Star,
        popular: true,
        color: "from-nutrition-500 to-nutrition-600",
        features: [
            "Todo del Plan Básico",
            "Plan alimenticio personalizado",
            "Seguimiento con IA",
            "4 consultas virtuales al mes",
            "Recetas personalizadas",
            "Soporte prioritario 24/7",
            "Rutina de ejercicios",
        ],
    },
    {
        id: "3",
        name: "Plan Anual",
        price: 499.99,
        duration: "año",
        icon: Crown,
        popular: false,
        color: "from-purple-500 to-purple-600",
        features: [
            "Todo del Plan Premium",
            "Consultas ilimitadas",
            "Nutricionista dedicado",
            "Análisis genético básico",
            "Descuento de 40%",
            "Acceso anticipado a funciones",
            "Sesiones presenciales (2/mes)",
        ],
    },
];

export default function SubscriptionsPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Elige tu Plan</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Selecciona el plan que mejor se adapte a tus necesidades. Todos incluyen prueba gratis de 7 días.
                </p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {offers.map((offer) => (
                    <Card
                        key={offer.id}
                        className={`relative overflow-hidden card-hover ${offer.popular ? "ring-2 ring-primary shadow-lg" : ""
                            }`}
                    >
                        {offer.popular && (
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-primary text-white px-3">Más Popular</Badge>
                            </div>
                        )}

                        <CardHeader className="pb-4">
                            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${offer.color} flex items-center justify-center mb-3`}>
                                <offer.icon className="h-6 w-6 text-white" />
                            </div>
                            <CardTitle className="text-lg">{offer.name}</CardTitle>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-3xl font-bold">${offer.price}</span>
                                <span className="text-muted-foreground">/{offer.duration}</span>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <ul className="space-y-2.5">
                                {offer.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-nutrition-500 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${offer.popular
                                    ? "bg-primary hover:bg-primary/90"
                                    : "bg-foreground/90 hover:bg-foreground"
                                    }`}
                                onClick={() => setSelectedPlan(offer.id)}
                            >
                                {selectedPlan === offer.id ? "Seleccionado ✓" : "Empezar Ahora"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Active subscription info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Tu Suscripción Actual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-nutrition-50">
                        <div>
                            <p className="font-semibold text-nutrition-800">Prueba Gratis</p>
                            <p className="text-sm text-nutrition-600">Expira el 18 de Marzo, 2026</p>
                        </div>
                        <Badge variant="success">Activo</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
