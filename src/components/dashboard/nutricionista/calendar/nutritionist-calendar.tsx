"use client";

import React from "react";
import { useNutritionistCalendar } from "./hooks/useNutritionistCalendar";
import { CalendarCard } from "./components/CalendarCard";
import { AppointmentSidebar } from "./components/AppointmentSidebar";
import { EditAppointmentDialog } from "./components/EditAppointmentDialog";

export function NutritionistCalendar() {
    const {
        currentMonth, setCurrentMonth,
        currentYear, setCurrentYear,
        selectedDay, setSelectedDay,
        localAppts,
        loading,
        isEditDialogOpen, setIsEditDialogOpen,
        editingAppt,
        viewMonth, setViewMonth,
        viewYear, setViewYear,
        editValues, setEditValues,
        getOccupiedSlots,
        isSlotPastOrBuffer,
        handleEditAppt,
        saveEdit,
        getAppts
    } = useNutritionistCalendar();

    const selectedAppts = selectedDay ? getAppts(selectedDay) : [];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500 border-t-transparent animate-spin" />
            </div>
            <p className="font-black text-xs text-nutrition-500 uppercase tracking-[0.2em] animate-pulse">Sincronizando agenda...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Agenda</h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Control total de tus consultas y disponibilidad en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <CalendarCard 
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    setCurrentMonth={setCurrentMonth}
                    setCurrentYear={setCurrentYear}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    getAppts={getAppts}
                />

                <AppointmentSidebar 
                    localAppts={localAppts}
                    selectedDay={selectedDay}
                    currentMonth={currentMonth}
                    selectedAppts={selectedAppts}
                    onEditAppt={handleEditAppt}
                />
            </div>

            <EditAppointmentDialog 
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editingAppt={editingAppt}
                editValues={editValues}
                setEditValues={setEditValues}
                viewMonth={viewMonth}
                setViewMonth={setViewMonth}
                viewYear={viewYear}
                setViewYear={setViewYear}
                getOccupiedSlots={getOccupiedSlots}
                isSlotPastOrBuffer={isSlotPastOrBuffer}
                onSave={saveEdit}
            />
        </div>
    );
}
