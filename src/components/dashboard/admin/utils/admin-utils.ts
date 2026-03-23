export const getAppointmentStatus = (status: string, date: string, time: string) => {
    const lowerStatus = (status || '').toLowerCase();
    const normalizedTime = time.includes(':') ? time : '00:00';
    const aptDate = new Date(`${date}T${normalizedTime}`);
    const now = new Date();
    
    if (['programada', 'scheduled', 'programado'].includes(lowerStatus)) {
        if (now > aptDate) return { label: 'no confirmado', className: "bg-red-500/10 text-red-500" };
        return { label: 'programada', className: "bg-blue-500/10 text-blue-500" };
    }
    
    if (['completada', 'completed', 'atendida'].includes(lowerStatus)) {
        return { label: 'completada', className: "bg-green-500/10 text-green-500" };
    }
    
    if (['confirmada', 'confirmed'].includes(lowerStatus)) {
        return { label: 'confirmada', className: "bg-emerald-500/10 text-emerald-500" };
    }

    if (['cancelada', 'cancelled', 'cancelado'].includes(lowerStatus)) {
        return { label: 'cancelada', className: "bg-slate-500/10 text-slate-500" };
    }

    return { label: status, className: "bg-slate-500/10 text-slate-500" };
};

export const isSlotPast = (slotTime: string, dateStr: string) => {
    const now = new Date();
    const targetDate = new Date(dateStr + 'T' + slotTime);
    return targetDate < now;
};

export const adminTimeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];
