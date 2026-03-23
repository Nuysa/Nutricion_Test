import { createClient } from "./supabase/client";

export interface ClinicalVariable {
    id: string;
    name: string;
    code: string;
    description?: string;
    unit?: string;
    is_active: boolean;
    variable_logic?: any[];
    is_calculated?: boolean;
    is_manual?: boolean;
}

export interface DashboardColumn {
    header: string;
    variable_id: string | null;
    fixed_variable?: 'weight' | 'bmi' | 'body_fat' | 'waist' | 'nutritionist' | 'findings' | 'recommendations' | 'date' | 'index';
    section?: 'base' | 'perimeters' | 'folds' | 'findings' | 'recommendations';
}

export const VariablesService = {
    async getVariables() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clinical_variables')
            .select(`
                *,
                variable_logic (
                    *,
                    variable_ranges (*)
                )
            `)
            .order('orden', { ascending: true });

        if (error) throw error;

        return data || [];
    },

    async getDashboardLayout(role: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('dashboard_layout')
            .select('*')
            .eq('role', role)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || { role, columns: [] };
    },

    async saveDashboardLayout(role: string, columns: DashboardColumn[]) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('dashboard_layout')
            .upsert({ role, columns, updated_at: new Date().toISOString() }, { onConflict: 'role' });

        if (error) throw error;
        return data;
    },

    async getCardSlots(role: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('card_slots_config')
            .select('*, clinical_variables(*)')
            .eq('role', role)
            .order('slot_index', { ascending: true });

        if (error) throw error;
        return data;
    },

    async saveCardSlots(role: string, slots: any[]) {
        const supabase = createClient();
        const toUpsert = slots.map(s => ({
            role,
            slot_index: s.slot_index,
            // Validar que sea un UUID (los UUIDs generados por Supabase contienen guiones)
            // Permitimos también nuestros UUIDs estáticos para variables de sistema
            variable_id: (s.variable_id && s.variable_id.includes('-') && s.variable_id.length >= 36) ? s.variable_id : null,
            icon: s.icon,
            color: s.color,
            is_active: s.is_active ?? true
        }));

        const { data, error } = await supabase
            .from('card_slots_config')
            .upsert(toUpsert, { onConflict: 'role, slot_index' });

        if (error) throw error;
        return data;
    },

    async saveVariable(variable: any) {
        const supabase = createClient();
        const varData = {
            name: variable.name,
            code: variable.code,
            data_type: variable.dataType,
            unit: variable.unit,
            is_manual: variable.isManual,
            is_calculated: variable.isCalculated,
            has_formula: variable.hasFormula,
            has_ranges: variable.hasRanges,
            manual_inputs: variable.manualInputs,
            is_active: variable.isActive ?? true
        };

        let varId = variable.id;

        // Si el ID empieza con 'var_' o 'new_', intentamos buscar por código primero o insertar
        if (varId && (varId.startsWith('new_') || varId.startsWith('var_'))) {
            // Buscar si ya existe por código
            const { data: existing } = await supabase
                .from('clinical_variables')
                .select('id')
                .eq('code', variable.code)
                .single();

            if (existing) {
                varId = existing.id;
            }
        }

        if (varId && !varId.startsWith('new_') && !varId.startsWith('var_')) {
            const { data: updatedClinicalVar, error: updateError } = await supabase
                .from('clinical_variables')
                .update(varData)
                .eq('id', varId)
                .select();

            if (updateError) throw updateError;
            if (!updatedClinicalVar || updatedClinicalVar.length === 0) {
                throw new Error("No se pudo actualizar la variable. Posible problema de permisos (RLS) en clinical_variables.");
            }
        } else {
            const { data: newVar, error: insertError } = await supabase
                .from('clinical_variables')
                .insert([varData])
                .select()
                .single();
            if (insertError) throw insertError;
            varId = newVar.id;
        }

        // Manejar lógica (ramas)
        if (variable.branches && variable.branches.length > 0) {
            for (const branch of variable.branches) {
                const branchData = {
                    variable_id: varId,
                    condition_name: branch.conditionName || 'General',
                    type: branch.type || 'default',
                    condition_value: branch.conditionValue?.toString() || null,
                    tokens: branch.tokens || []
                };

                let branchId = branch.id;

                // Si la rama no tiene un ID real, buscamos si ya existe una rama 'General' para esta variable
                if (!branchId || branchId.startsWith('b_') || branchId.startsWith('new_')) {
                    const { data: existingBranch } = await supabase
                        .from('variable_logic')
                        .select('id')
                        .eq('variable_id', varId)
                        .eq('condition_name', branchData.condition_name)
                        .single();

                    if (existingBranch) {
                        branchId = existingBranch.id;
                    }
                }

                if (branchId && !branchId.startsWith('b_') && !branchId.startsWith('new_')) {
                    const { data: updatedLogic, error: bUpdateError } = await supabase
                        .from('variable_logic')
                        .update(branchData)
                        .eq('id', branchId)
                        .select();
                    if (bUpdateError) throw bUpdateError;
                    if (!updatedLogic || updatedLogic.length === 0) {
                        throw new Error("No se pudo actualizar la rama lógica. Posible problema de permisos (RLS) en variable_logic.");
                    }
                } else {
                    const { data: newBranch, error: bInsertError } = await supabase
                        .from('variable_logic')
                        .insert([branchData])
                        .select()
                        .single();
                    if (bInsertError) throw bInsertError;
                    branchId = newBranch.id;
                }

                // Guardar rangos
                if (variable.has_ranges || variable.hasRanges) {
                    await supabase.from('variable_ranges').delete().eq('logic_id', branchId);
                    if (branch.ranges && branch.ranges.length > 0) {
                        const rangesToInsert = branch.ranges.map((r: any) => ({
                            logic_id: branchId,
                            label: r.label,
                            min: r.min,
                            max: r.max,
                            color: r.color
                        }));
                        const { error: rangeError } = await supabase.from('variable_ranges').insert(rangesToInsert);
                        if (rangeError) throw rangeError;
                    }
                } else if (branchId && !branchId.startsWith('b_') && !branchId.startsWith('new_')) {
                    // Si no tiene rangos, nos aseguramos de limpiar los viejos en BD si ya existía la rama.
                    await supabase.from('variable_ranges').delete().eq('logic_id', branchId);
                }
            }
        }
        return { success: true, id: varId };
    },

    async updateVariablesOrder(variableIds: string[]) {
        const supabase = createClient();
        for (let i = 0; i < variableIds.length; i++) {
            const { error } = await supabase
                .from('clinical_variables')
                .update({ orden: i })
                .eq('id', variableIds[i]);
            if (error) throw error;
        }
        return { success: true };
    },

    async deleteVariable(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('clinical_variables')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    calculateVariable(tokens: any[], inputs: Record<string, number>): number {
        try {
            if (!tokens || tokens.length === 0) return 0;

            // BACKWARDS COMPATIBILITY: array of UI tokens
            if (tokens[0].type !== 'formula_text') {
                let formulaStr = "";
                let openRoundCount = 0;
                tokens.forEach(t => {
                    if (t.type === 'function' && t.value === 'REDONDEAR') {
                        formulaStr += "Math.round(";
                        openRoundCount++;
                    } else if (t.type === 'input') {
                        const inputCode = t.value.toUpperCase();
                        const val = inputs[inputCode];
                        formulaStr += ` ${val !== undefined ? val : 0} `;
                    } else {
                        formulaStr += ` ${t.value.replace(/\^/g, "**")} `;
                    }
                });
                for (let i = 0; i < openRoundCount; i++) formulaStr += ")";
                if (!formulaStr.trim()) return 0;
                const result = new Function(`return ${formulaStr}`)();
                return Number(result.toFixed(2)) || 0;
            }

            // NUEVA LOGICA: Formula en string de texto
            let formulaStr = tokens[0].value || "";
            if (!formulaStr.trim()) return 0;

            // Limpiar % o (%) basura que se haya filtrado en el texto de la formula original
            formulaStr = formulaStr.replace(/\(\s*%\s*\)/g, "").replace(/%/g, "");

            // Reemplazar ^ por **
            formulaStr = formulaStr.replace(/\^/g, "**");

            // Reemplazar los códigos de las variables por sus valores
            formulaStr = formulaStr.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (match: string) => {
                const upperMatch = match.toUpperCase();
                if (upperMatch === 'REDONDEAR') return 'Math.round';
                if (upperMatch === 'MATH' || upperMatch === 'ROUND' || upperMatch === 'ABS' || upperMatch === 'POW' || upperMatch === 'MATH.ROUND') return match;

                // Buscar en el objeto de entradas, si no existe o es null, usar 0
                if (inputs[upperMatch] !== undefined) {
                    return Number(inputs[upperMatch]).toString();
                }
                return "0";
            });

            const result = new Function(`return ${formulaStr}`)();
            return Number(result.toFixed(2)) || 0;
        } catch (e) {
            console.error("Formula calculation error:", e);
            return 0;
        }
    }
};
