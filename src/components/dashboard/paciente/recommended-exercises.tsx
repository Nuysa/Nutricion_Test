"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const exercises = [
    {
        name: "Caminata Rápida",
        calories: 200,
        duration: 30,
        difficulty: "Principiante",
        emoji: "🚶",
        color: "emerald",
    },
    {
        name: "Sentadillas con Peso",
        calories: 180,
        duration: 20,
        difficulty: "Intermedio",
        emoji: "🏋️",
        color: "amber",
    },
    {
        name: "Sentadilla Profunda",
        calories: 300,
        duration: 30,
        difficulty: "Avanzado",
        emoji: "💪",
        color: "rose",
    },
];

export function RecommendedExercises() {
    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Ejercicios Recomendados</h3>
            <div className="grid grid-cols-1 gap-4">
                {exercises.map((exercise) => (
                    <Card
                        key={exercise.name}
                        className="bg-[#151F32] border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/10 transition-all shadow-xl"
                    >
                        <div className="p-6 flex items-center gap-6 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-2xl -mr-12 -mt-12" />

                            <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform relative z-10">
                                {exercise.emoji}
                            </div>

                            <div className="flex-1 min-w-0 relative z-10">
                                <h4 className="text-lg font-black text-white tracking-tight uppercase leading-none mb-2">{exercise.name}</h4>
                                <div className="flex items-center gap-4 text-[10px] font-tech font-black uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-1.5 text-orange-400/80">
                                        <Flame className="h-3 w-3" />
                                        {exercise.calories} kcal
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        {exercise.duration} min
                                    </span>
                                </div>
                            </div>

                            <Badge
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-lg relative z-10",
                                    exercise.color === "emerald" && "bg-emerald-500/10 text-emerald-400",
                                    exercise.color === "amber" && "bg-amber-500/10 text-amber-400",
                                    exercise.color === "rose" && "bg-rose-500/10 text-rose-400"
                                )}
                            >
                                {exercise.difficulty}
                            </Badge>

                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/20 group-hover:text-white group-hover:bg-nutrition-500 group-hover:border-nutrition-500 transition-all cursor-pointer">
                                <Play className="h-4 w-4 fill-current ml-0.5" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
