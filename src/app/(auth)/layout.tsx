import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Left: Branding panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="80" fill="white" opacity="0.1" />
                        <circle cx="300" cy="300" r="120" fill="white" opacity="0.08" />
                        <circle cx="350" cy="80" r="60" fill="white" opacity="0.06" />
                        <circle cx="50" cy="350" r="90" fill="white" opacity="0.05" />
                    </svg>
                </div>
                <div className="relative z-10 text-white max-w-md">
                    <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
                        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center">
                            <img src="/logo Nuysa.png" alt="NuySa Logo" className="h-8 w-auto object-contain drop-shadow-md" />
                        </div>
                        <span className="text-3xl font-bold font-tech text-white">NuySa</span>
                    </Link>
                    <h1 className="text-4xl font-bold font-tech leading-tight mb-4">
                        Tu camino hacia una vida más saludable
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed">
                        Sincroniza tu biología con recetas fáciles, nutrición clínica, asesoría personalizada y planes con resultados sostenibles.
                    </p>
                    <div className="mt-12 grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold">5K+</div>
                            <div className="text-sm text-white/70">Pacientes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">200+</div>
                            <div className="text-sm text-white/70">Nutricionistas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">98%</div>
                            <div className="text-sm text-white/70">Satisfacción</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Auth form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center hover:opacity-80 transition-opacity">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm border">
                            <img src="/logo Nuysa.png" alt="NuySa Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-2xl font-bold font-tech text-primary">NuySa</span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
