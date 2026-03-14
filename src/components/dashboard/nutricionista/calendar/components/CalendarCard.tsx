"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { monthNamesFull } from "../hooks/useNutritionistCalendar";

interface CalendarCardProps {
    currentMonth: number;
    currentYear: number;
    setCurrentMonth: (m: number) => void;
    setCurrentYear: (y: number) => void;
    selectedDay: number | null;
    setSelectedDay: (d: number | null) => void;
    getAppts: (day: number) => any[];
}

export function CalendarCard({
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
    selectedDay,
    setSelectedDay,
    getAppts,
}: CalendarCardProps) {
    const nowLocal = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handlePrev = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNext = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <Card className="lg:col-span-2 rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
                <div className="flex items-center gap-6">
                    <CardTitle className="text-lg text-nutrition-500 font-black uppercase tracking-[0.2em]">Calendario Global</CardTitle>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handlePrev} 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[120px] text-center">
                            {monthNamesFull[currentMonth]} {currentYear}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleNext} 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Virtual</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presencial</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                        <div key={d} className="text-center py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                    {daysArray.map((day) => {
                        const appts = getAppts(day);
                        const isSelected = selectedDay === day;
                        const isToday = day === nowLocal.getDate() && currentMonth === nowLocal.getMonth() && currentYear === nowLocal.getFullYear();
                        
                        return (
                            <button 
                                key={day} 
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "aspect-square rounded-[1.2rem] flex flex-col items-center justify-center gap-1.5 text-xs transition-all relative group",
                                    isSelected ? "bg-nutrition-500 text-white shadow-xl shadow-nutrition-500/30 scale-105 z-10" : 
                                    isToday ? "bg-nutrition-500/10 text-nutrition-400 border border-nutrition-500/20 font-black" : 
                                    "bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-white"
                                )}
                            >
                                <span className="relative z-10 font-bold">{day}</span>
                                {appts.length > 0 && (
                                    <div className="flex gap-1 relative z-10">
                                        {appts.slice(0, 3).map((a) => (
                                            <span 
                                                key={a.id} 
                                                className={cn(
                                                    "h-1 w-1 rounded-full", 
                                                    isSelected ? "bg-white" : a.type === "virtual" ? "bg-sky-500" : "bg-orange-500"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                )}
                                {isSelected && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-in zoom-in" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
