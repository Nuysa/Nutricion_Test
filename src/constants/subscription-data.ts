export interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    status?: "Activa" | "Próximamente" | "Actual";
    benefits: string[];
    highlight?: boolean;
    color?: string;
    bgClass?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: "free",
        name: "Plan Básico",
        price: "S/0",
        period: "Para siempre",
        benefits: [
            "Contador de calorias diario",
            "Registro de peso",
            "Acceso limitado al Blog",
            "Soporte por correo"
        ],
        highlight: false,
        bgClass: "bg-white"
    },
    {
        id: "premium",
        name: "Premium Nutrition Plan",
        price: "S/29.99",
        period: "Por mes",
        benefits: [
            "Plan de comidas personalizado",
            "Citas virtuales ilimitadas",
            "Seguimiento de macros avanzado",
            "Soporte por chat 24/7",
            "Acceso a recetas exclusivas",
        ],
        highlight: true,
        color: "text-nutrition-600",
        bgClass: "bg-[#0a1a15]"
    },
    {
        id: "elite",
        name: "Elite Performance",
        price: "S/49.99",
        period: "Por mes",
        benefits: [
            "Todo lo de Premium",
            "Análisis de laboratorio trimestral",
            "Personal trainer asignado",
            "Suplementos personalizados",
            "Prioridad en citas"
        ],
        highlight: false,
        bgClass: "bg-white"
    }
];

export const CURRENT_SUBSCRIPTION_ID = "free";
