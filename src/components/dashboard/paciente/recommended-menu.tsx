"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Wheat, Drumstick, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

const meals = {
    breakfast: [
        {
            name: "Avena con Mantequilla de Almendra y Frutos Rojos",
            description:
                "Rica en fibra y antioxidantes, brinda energía duradera y mejora la digestión.",
            calories: 350,
            carbs: 45,
            protein: 12,
            fats: 14,
            image: "🥣",
        },
    ],
    lunch: [
        {
            name: "Wrap de Pollo Grillado con Aguacate y Espinaca",
            description:
                "Rico en proteína y grasas saludables, perfecto para la recuperación muscular.",
            calories: 450,
            carbs: 40,
            protein: 30,
            fats: 18,
            image: "🌯",
        },
    ],
    dinner: [
        {
            name: "Pollo Grillado con Batata y Ejotes",
            description:
                "Comida equilibrada con proteína magra, carbohidratos complejos y vegetales.",
            calories: 500,
            carbs: 45,
            protein: 35,
            fats: 12,
            image: "🍗",
        },
    ],
};

function MacroTag({
    icon: Icon,
    value,
    unit,
    color,
}: {
    icon: React.ElementType;
    value: number;
    unit: string;
    color: string;
}) {
    return (
        <span className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5", color)}>
            <Icon className="h-3 w-3" />
            {value}{unit}
        </span>
    );
}

export function RecommendedMenu() {
    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Menú Recomendado</h3>
            <Tabs defaultValue="breakfast" className="w-full">
                <TabsList className="bg-[#151F32] border border-white/5 p-1 rounded-2xl h-auto mb-6 grid grid-cols-3">
                    <TabsTrigger value="breakfast" className="rounded-xl py-3 data-[state=active]:bg-nutrition-500 data-[state=active]:text-white transition-all">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">🥣</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Avena</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="lunch" className="rounded-xl py-3 data-[state=active]:bg-nutrition-500 data-[state=active]:text-white transition-all">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">🌯</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Wrap</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="dinner" className="rounded-xl py-3 data-[state=active]:bg-nutrition-500 data-[state=active]:text-white transition-all">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">🍗</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Pollo</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {Object.entries(meals).map(([mealType, items]) => (
                    <TabsContent key={mealType} value={mealType} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 gap-4">
                            {items.map((item) => (
                                <Card key={item.name} className="bg-[#151F32] border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden group hover:border-white/10 transition-all">
                                    <div className="p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-nutrition-500/5 blur-3xl -mr-16 -mt-16" />
                                        <div className="flex items-start gap-6 relative z-10">
                                            <div className="h-20 w-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 transition-transform">
                                                {item.image}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-black text-white tracking-tight leading-none mb-3">
                                                    {item.name}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6 italic">
                                                    "{item.description}"
                                                </p>
                                                <div className="flex flex-wrap gap-3">
                                                    <MacroTag icon={Flame} value={item.calories} unit=" kcal" color="text-orange-400" />
                                                    <MacroTag icon={Wheat} value={item.carbs} unit="g" color="text-amber-400" />
                                                    <MacroTag icon={Drumstick} value={item.protein} unit="g" color="text-nutrition-400" />
                                                    <MacroTag icon={Droplet} value={item.fats} unit="g" color="text-purple-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
