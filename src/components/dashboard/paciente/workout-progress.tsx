"use client";

import { Card } from "@/components/ui/card";
import { Dumbbell, Footprints, StretchHorizontal } from "lucide-react";

const workouts = [
    {
        name: "Correr 10 km",
        icon: Footprints,
        progress: 75,
        detail: "(7/10)",
        category: "Cardio",
        color: "#22c55e",
        bgColor: "bg-nutrition-50",
        iconColor: "text-nutrition-600",
    },
    {
        name: "Sentadillas 50kg",
        icon: Dumbbell,
        progress: 60,
        detail: "(6/5)",
        category: "Fuerza",
        color: "#f97316",
        bgColor: "bg-orange-50",
        iconColor: "text-orange-500",
    },
    {
        name: "Tocarse los pies",
        icon: StretchHorizontal,
        progress: 50,
        detail: "(3/5)",
        category: "Flexibilidad",
        color: "#8b5cf6",
        bgColor: "bg-purple-50",
        iconColor: "text-purple-500",
    },
];

export function WorkoutProgress() {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Progreso de Ejercicios</h3>
                <select className="text-sm text-muted-foreground bg-transparent border rounded-lg px-2 py-1">
                    <option>Esta Semana</option>
                    <option>Este Mes</option>
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {workouts.map((workout) => (
                    <Card key={workout.name} className="p-4 card-hover rounded-[2.5rem] border border-slate-300 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-xl ${workout.bgColor}`}>
                                <workout.icon className={`h-5 w-5 ${workout.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{workout.name}</p>
                                <p className="text-xs text-muted-foreground">{workout.category}</p>
                            </div>
                        </div>

                        {/* Circular progress */}
                        <div className="flex items-center justify-center">
                            <div className="relative h-24 w-24">
                                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="#f0f0f0"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke={workout.color}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - workout.progress / 100)}`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-lg font-bold">{workout.progress}%</span>
                                        <span className="text-xs text-muted-foreground block">
                                            {workout.detail}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
