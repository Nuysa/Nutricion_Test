"use client";

import { useState } from "react";
import { PlanEditor } from "@/components/dashboard/nutricionista/plan-editor";

export default function NutritionistPlansPage() {
    return (
        <div className="space-y-6">
            <PlanEditor />
        </div>
    );
}
