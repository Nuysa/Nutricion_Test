import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { PresenceProvider } from "@/components/providers/presence-provider";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let userName = "Usuario";
    let userAvatar: string | undefined;
    let userRole: string = "paciente";
    let userPlanType: string | undefined;
    let currentProfileId: string | undefined;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .eq("user_id", user.id)
            .single();

        if (profile) {
            userName = profile.full_name;
            // Normalización de nombre para Juan Pérez
            if (userName.trim().toLowerCase() === "juan paciente") {
                userName = "Juan Pérez";
            }
            userAvatar = profile.avatar_url || undefined;
            userRole = profile.role;
            // Use the profile internal ID for business logic (messaging, etc)
            currentProfileId = profile.id;

            if (userRole === "paciente") {
                const { data: patient } = await supabase
                    .from("patients")
                    .select("plan_type")
                    .eq("profile_id", profile.id)
                    .single();
                if (patient) {
                    userPlanType = patient.plan_type;
                }
            }
        }
    }

    const currentUserId = user?.id;
    // Fallback if profile fetch fails, but usually we want to pass currentProfileId to components
    const businessId = currentProfileId || currentUserId || "";

    if (!currentUserId) {
        redirect("/login");
    }

    return (
        <PresenceProvider currentUserId={businessId}>
            <div className="min-h-screen bg-nutri-base text-white">
                <Sidebar currentUserId={businessId} />
                <div className="lg:pl-64">
                    <Topbar
                        userName={userName}
                        userAvatar={userAvatar}
                        userRole={userRole}
                        currentUserId={businessId}
                        planType={userPlanType}
                    />
                    <main className="p-4 lg:p-6">{children}</main>
                </div>
            </div>
        </PresenceProvider>
    );
}
