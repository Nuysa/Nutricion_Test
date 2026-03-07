"use client";

import { HealthStats } from "@/components/dashboard/paciente/health-stats";
import { BMIGauge } from "@/components/dashboard/paciente/bmi-gauge";
import { SubscriptionInfo } from "@/components/dashboard/paciente/subscription-info";
import { BlogPostsSlider } from "@/components/dashboard/paciente/blog-posts-slider";
import { TrackingDashboard } from "@/components/dashboard/paciente/tracking-dashboard";
import { RightSidebar } from "@/components/dashboard/paciente/right-sidebar";
import { cn } from "@/lib/utils";

interface PageProps {
    searchParams: { view?: string };
}

export default function PatientDashboard({ searchParams }: PageProps) {
    const currentView = searchParams.view || "resumen";

    return (
        <div className="flex flex-col xl:flex-row gap-6">
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-full { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                }
            `}</style>
            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6 print-full">
                <div className={cn(currentView === "resumen" ? "block" : "hidden", "space-y-6")}>
                    {/* Health stat cards */}
                    <HealthStats />

                    {/* BMI Gauge Section */}
                    <BMIGauge />

                    <div className="grid grid-cols-1 gap-6">
                        <SubscriptionInfo />
                    </div>
                </div>

                <div className={cn((currentView === "seguimiento" || currentView === "tracking") ? "block" : "hidden")}>
                    <TrackingDashboard />
                </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden xl:block w-80 flex-shrink-0 no-print">
                <RightSidebar />
            </div>
        </div>
    );
}
