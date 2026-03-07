"use client";

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingServices } from "@/components/landing/landing-services";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PlansSection } from "@/components/landing/plans-section";
import { VisualEditorProvider } from "@/components/dashboard/admin/visual-editor-context";

export default function Home() {
    return (
        <VisualEditorProvider>
            <main className="relative min-h-screen bg-nutri-base text-slate-200 selection:bg-nutri-brand selection:text-nutri-base overflow-x-hidden">
                <LandingNavbar />

                <div className="relative z-10 w-full pt-10">
                    <LandingHero />
                    <LandingAbout />
                    <LandingServices />
                    <PlansSection />
                    <LandingTestimonials />
                    <LandingFooter />
                </div>

                {/* Ambient Background Lights */}
                <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-nutri-brand/10 blur-[130px] pointer-events-none z-0"></div>
                <div className="fixed bottom-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-nutri-brand/5 blur-[150px] pointer-events-none z-0"></div>
            </main>
        </VisualEditorProvider>
    );
}
