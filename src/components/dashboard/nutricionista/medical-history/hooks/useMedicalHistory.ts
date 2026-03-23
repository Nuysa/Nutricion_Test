"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { excelMapping } from '../utils/excel-mapping';

export function useMedicalHistory(patientId: string) {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [historyData, setHistoryData] = useState<any>(null);
    const [editedData, setEditedData] = useState<any>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchHistory = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("patient_medical_histories")
                .select("*")
                .eq("patient_id", patientId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setHistoryData(data);
            setEditedData(data);
        } catch (err) {
            console.error("Error fetching medical history:", err);
        } finally {
            setLoading(false);
        }
    }, [patientId, supabase]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const calculateAge = (birthday: any) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        if (isNaN(birthDate.getTime())) return '';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const updateField = (field: string, value: any) => {
        setEditedData((prev: any) => {
            const next = { ...prev, [field]: value };
            if (field === 'birth_date') {
                next.age = calculateAge(value);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const cleanBoolean = (val: any) => {
                if (val === null || val === undefined || val === '') return null;
                if (typeof val === 'boolean') return val;
                const s = String(val).toLowerCase().trim();
                if (s === 'true' || s === 'si' || s === 'sí' || s === 'yes' || s.startsWith('yes')) return true;
                if (s === 'false' || s === 'no' || s === 'never' || s === 'nunca') return false;
                return val;
            };

            const dataToSave = { ...editedData };
            const boolFields = [
                'previous_nutrition_service', 'takes_medication', 'recent_lab_tests',
                'does_exercise', 'has_calorie_tracker', 'likes_cooking',
                'food_intolerances', 'supplements_consumption'
            ];

            boolFields.forEach(field => {
                if (dataToSave[field] !== undefined) {
                    dataToSave[field] = cleanBoolean(dataToSave[field]);
                }
            });

            const textArrayFields = ['disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_meats', 'disliked_fats'];
            textArrayFields.forEach(field => {
                if (Array.isArray(dataToSave[field])) {
                    dataToSave[field] = dataToSave[field].join(', ');
                }
            });

            const {
                front_photo_url, side_photo_1_url, side_photo_2_url, back_photo_url,
                dairy_photos, supplement_photos, ...persistenceData
            } = dataToSave;

            const { error } = await supabase
                .from("patient_medical_histories")
                .upsert({
                    ...persistenceData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'patient_id' });

            if (error) throw error;

            setHistoryData(editedData);
            setIsEditing(false);
            toast({
                title: "Historia Clínica Actualizada",
                description: "Los cambios han sido guardados correctamente.",
            });
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!patientId) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from("patient_medical_histories")
                .delete()
                .eq("patient_id", patientId);

            if (error) throw error;

            setHistoryData(null);
            setEditedData(null);
            setIsEditing(false);
            toast({
                title: "Historia Clínica Eliminada",
                description: "Los datos han sido borrados permanentemente.",
            });
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
        } catch (err: any) {
            toast({
                title: "Error al eliminar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const parseExcelDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'number') return new Date(Math.round((val - 25569) * 864e5));
        if (typeof val === 'string') {
            const clean = val.trim();
            const dateParts = clean.split(' ')[0].split('/');
            if (dateParts.length === 3) {
                const [d, m, y] = dateParts.map(Number);
                if (y > 1000) return new Date(y, m - 1, d);
            }
            const date = new Date(val);
            if (!isNaN(date.getTime())) return date;
        }
        return val;
    };

    const parseExcelTime = (val: any) => {
        if (!val) return '';
        if (val instanceof Date) {
            const h = String(val.getHours()).padStart(2, '0');
            const m = String(val.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        }
        if (typeof val === 'string') {
            const clean = val.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
            const match = clean.match(/(\d{1,2}):(\d{2}).*(am|pm|a\s?m|p\s?m)/);
            if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = match[2];
                const modifier = match[3];
                if (modifier.includes('p') && hours < 12) hours += 12;
                if (modifier.includes('a') && hours === 12) hours = 0;
                return `${String(hours).padStart(2, '0')}:${minutes}`;
            }
            const simpleMatch = clean.match(/^(\d{1,2}):(\d{2})/);
            if (simpleMatch) return `${simpleMatch[1].padStart(2, '0')}:${simpleMatch[2]}`;
        }
        return val;
    };

    const handleExcelUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

                if (jsonData.length === 0) {
                    toast({ title: "Archivo vacío", description: "El Excel no contiene datos.", variant: "destructive" });
                    return;
                }

                const row = jsonData[0];
                const newData: any = { patient_id: patientId };
                const rowNormalized: Record<string, any> = {};
                Object.keys(row).forEach(k => {
                    rowNormalized[k.trim().toLowerCase()] = row[k];
                });

                Object.entries(excelMapping).forEach(([excelHeader, dbField]) => {
                    const normalizedHeader = excelHeader.trim().toLowerCase();
                    if (rowNormalized[normalizedHeader] !== undefined) {
                        let val = rowNormalized[normalizedHeader];
                        if (typeof val === 'string') {
                            const normalized = val.toLowerCase().trim();
                            if (normalized === 'si' || normalized === 'sí' || normalized === 'yes') val = true;
                            else if (normalized === 'no') val = false;
                            if (dbField === 'previous_nutrition_service' && (normalized === 'nunca' || normalized === 'never')) val = 'never';
                        }
                        if (['created_at', 'birth_date'].includes(dbField)) val = parseExcelDate(val);
                        const timeFields = ['wake_up_time', 'sleep_time', 'breakfast_time', 'lunch_time', 'dinner_time', 'exercise_time'];
                        if (timeFields.includes(dbField)) val = parseExcelTime(val);
                        const arrayFields = ['health_conditions', 'family_history', 'exercise_types', 'exercise_days', 'appetite_peak_time', 'available_instruments', 'supplement_types', 'previous_unhealthy_habits', 'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_meats', 'disliked_fats'];
                        if (arrayFields.includes(dbField) && typeof val === 'string') val = val.split(',').map(s => s.trim()).filter(Boolean);
                        newData[dbField] = val;
                    }
                });

                if (newData.urine_color_index) newData.urine_color_index = Number(newData.urine_color_index);
                if (newData.weight_kg) newData.weight_kg = Number(newData.weight_kg);
                if (newData.height_cm) newData.height_cm = Number(newData.height_cm);
                if (newData.waist_cm) newData.waist_cm = Number(newData.waist_cm);
                if (newData.age) newData.age = Number(newData.age);
                if (newData.birth_date) newData.age = calculateAge(newData.birth_date);

                setEditedData(newData);
                setIsEditing(true);

                toast({
                    title: "Excel Importado",
                    description: "Los datos han sido cargados. Revisa y presiona Guardar.",
                });
            } catch (error) {
                console.error("Error processing Excel:", error);
                toast({ title: "Error", description: "No se pudo procesar el archivo Excel.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return {
        loading,
        isSaving,
        isEditing,
        setIsEditing,
        historyData,
        editedData,
        setEditedData,
        updateField,
        handleSave,
        handleDelete,
        handleExcelUpload
    };
}
