import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-nutri-base flex items-center justify-center relative overflow-hidden font-tech">
            {/* Background elements to match the "premium" feel */}
            <div className="absolute inset-0 organic-grid opacity-20 pointer-events-none" />

            {/* Animated Glows */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-nutri-brand/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-[1240px] px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10 py-12">

                {/* Left: Branding panel (Premium) */}
                <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                    <Link href="/" className="inline-flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-all group">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <img src="/logo Nuysa.png" alt="NuySa Logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-left">
                            <span className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase leading-none">NuySa</span>
                            <div className="h-1 w-full bg-gradient-to-r from-nutri-brand to-transparent rounded-full mt-1 sm:mt-2" />
                        </div>
                    </Link>

                    <div className="space-y-4 sm:space-y-6">
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
                            Tu Biología <br />
                            <span className="text-nutri-brand drop-shadow-[0_0_30px_rgba(255,122,0,0.3)]">Optimizada.</span>
                        </h1>
                        <p className="text-slate-400 text-lg lg:text-xl font-bold leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Sincroniza tus metas con nutrición clínica de precisión y seguimiento en tiempo real.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-8 max-w-sm mx-auto lg:mx-0">
                        {[
                            { label: "Pacientes", val: "5K+" },
                            { label: "Resultados", val: "100%" },
                            { label: "Precisión", val: "Gold" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                                <div className="text-lg sm:text-2xl font-black text-white italic">{stat.val}</div>
                                <div className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Auth form Wrapper (Glassmorphism) */}
                <div className="w-full lg:w-[480px] shrink-0">
                    <div className="nutri-panel p-8 sm:p-12 relative group">
                        {/* Decorative Corner */}
                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-2 border-r-2 border-nutri-brand/50 rounded-tr-3xl" />

                        {/* Top Badge for Mobile */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <Badge className="bg-nutri-brand/20 text-nutri-brand border-nutri-brand/30 py-1.5 px-4 font-black tracking-widest uppercase text-[10px]">
                                Acceso Seguro
                            </Badge>
                        </div>

                        {children}
                    </div>

                    <p className="mt-8 text-center text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                        &copy; 2026 NuySa Clinical Nutrition • Todos los derechos reservados
                    </p>
                </div>
            </div>
        </div>
    );
}
