"use client";

import { useMemo } from 'react';
import { VariablesService } from '@/lib/variables-service';

interface FormulaContext {
    gender?: string;
    age?: number;
    inputs: Record<string, number>;
}

export function useFormulaEngine() {
    /**
     * Calcula una variable basada en su configuración y el contexto del paciente.
     */
    const calculate = useMemo(() => (variable: any, context: FormulaContext) => {
        if (!variable) return { result: 0, range: null };

        // 1. Encontrar la rama (branch) correcta
        const branches = variable.branches || variable.variable_logic || [];
        let activeBranch = branches.find((b: any) => b.type === 'default');

        if (context.gender) {
            const ctxG = context.gender.toLowerCase().startsWith('m') ? 'm' : (context.gender.toLowerCase().startsWith('f') ? 'f' : context.gender.toLowerCase());
            const genderBranch = branches.find(
                (b: any) => {
                    const bVal = (b.conditionValue || b.condition_value)?.toLowerCase() || '';
                    const mappedBVal = bVal.startsWith('m') ? 'm' : (bVal.startsWith('f') ? 'f' : bVal);
                    return b.type === 'gender' && mappedBVal === ctxG;
                }
            );
            if (genderBranch) activeBranch = genderBranch;
        }

        if (context.age) {
            const ageBranch = branches.find(
                (b: any) => b.type === 'age' && parseFloat(context.age?.toString() || "0") >= parseFloat((b.conditionValue || b.condition_value) || "0")
            );
            // Tomar el de edad si es más específico (esto es simplificado, en prod se buscaría el rango más cercano)
            if (ageBranch) activeBranch = ageBranch;
        }

        if (!activeBranch || !activeBranch.tokens || activeBranch.tokens.length === 0) {
            return { result: 0, range: null };
        }

        // 2. Ejecutar cálculo
        const result = VariablesService.calculateVariable(activeBranch.tokens, context.inputs);

        // 3. Encontrar rango (semáforo)
        const ranges = activeBranch.ranges || activeBranch.variable_ranges || [];
        const range = ranges.find((r: any) => {
            const minStr = r.min?.toString().replace(',', '.') || '0';
            const maxStr = r.max?.toString().replace(',', '.') || '0';
            const minNum = parseFloat(minStr);
            const maxNum = parseFloat(maxStr);
            const min = Math.min(minNum, maxNum);
            const max = Math.max(minNum, maxNum);
            return result >= min && result <= max;
        });

        return { result, range };
    }, []);

    return { calculate };
}
