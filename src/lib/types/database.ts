// ─── User Roles ───
export type UserRole = "paciente" | "nutricionista" | "staff" | "administrador";

// ─── Profile ───
export interface Profile {
    id: string;
    user_id: string;
    role: UserRole;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    created_at: string;
}

// ─── Patient ───
export interface Patient {
    id: string;
    profile_id: string;
    height_cm: number | null;
    current_weight: number | null;
    goal_weight: number | null;
    date_of_birth: string | null;
    nutritionist_id: string | null;
    created_at: string;
}

// ─── Weight Record ───
export interface WeightRecord {
    id: string;
    patient_id: string;
    weight: number;
    recorded_at: string;
}

// ─── Meal ───
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
    id: string;
    patient_id: string | null;
    meal_type: MealType;
    name: string;
    description: string | null;
    calories: number;
    carbs_g: number;
    protein_g: number;
    fats_g: number;
    image_url: string | null;
    date: string;
}

// ─── Appointment ───
export type AppointmentType = "virtual" | "in-person";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export interface Appointment {
    id: string;
    patient_id: string;
    nutritionist_id: string;
    appointment_type: AppointmentType;
    date: string;
    start_time: string;
    end_time: string;
    status: AppointmentStatus;
    notes: string | null;
    created_at: string;
}

// ─── Subscription Offer ───
export interface SubscriptionOffer {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
    created_by: string;
    created_at: string;
}

// ─── Subscription ───
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface Subscription {
    id: string;
    patient_id: string;
    offer_id: string;
    start_date: string;
    end_date: string;
    status: SubscriptionStatus;
    payment_status: PaymentStatus;
    created_at: string;
}

// ─── Exercise ───
export type Difficulty = "beginner" | "intermediate" | "hard";

export interface Exercise {
    id: string;
    name: string;
    description: string | null;
    calories_burned: number;
    duration_min: number;
    difficulty: Difficulty;
    image_url: string | null;
}

// ─── Activity Log ───
export interface ActivityLog {
    id: string;
    profile_id: string;
    action: string;
    description: string;
    created_at: string;
}

// ─── Dashboard Stats (computed, not DB) ───
export interface HealthStat {
    label: string;
    value: string | number;
    unit: string;
    icon: string;
    trend?: number;
    chartData?: number[];
}

export interface CalorieBreakdown {
    eaten: number;
    burned: number;
    remaining: number;
    carbs: { grams: number; percentage: number };
    protein: { grams: number; percentage: number };
    fats: { grams: number; percentage: number };
}

export interface WorkoutProgress {
    name: string;
    current: number;
    goal: string;
    percentage: number;
    category: string;
}

// ─── Food Database ───
export interface Food {
    id: string;
    category: string;
    emoji: string;
    name: string;
    portion: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at?: string;
}
