"use client";

import Link from "next/link";
import { User, Menu, X, Home, Info, Briefcase, CreditCard, MessageSquare, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableImage } from "@/components/dashboard/admin/editable-image";
import { EditableLink } from "@/components/dashboard/admin/editable-link";

export function LandingNavbar() {
    const { isEditable } = useVisualEditor();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMenuOpen]);
    const [content, setContent] = useState({
        welcomeText: "¡Bienvenido(a) a NUYSA!",
        welcomeBg: "bg-gradient-to-r from-nutri-brand to-nutri-mint",
        welcomeTextColor: "text-nutri-base",
        brandMain: "Nuy",
        brandHighlight: "Sa",
        logoUrl: "/logo Nuysa.png",
        logoHref: "/",
        menuHome: "Inicio",
        menuAbout: "Sobre Nosotros",
        menuServices: "Servicios",
        menuPlans: "Planes",
        menuTestimonials: "Testimonios",
        menuContact: "Contacto",
        loginText: "Iniciar sesión / Registrarse"
    });

    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'navbar').single();
            if (data?.content) {
                setContent(prev => ({ ...prev, ...data.content }));
            }
        };
        fetchContent();
    }, []);

    const handleSave = async (field: string, value: string) => {
        const supabase = createClient();
        const newContent = { ...content, [field]: value };
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'navbar', content: newContent }, { onConflict: 'section' });

        if (!error) {
            setContent(newContent);
        } else {
            throw error;
        }
    };

    return (
        <>
            <div className={cn(
                "w-full h-10 z-[60] flex items-center justify-center font-tech font-black text-xs md:text-sm tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(163,230,53,0.3)] overflow-hidden",
                content.welcomeBg || "bg-gradient-to-r from-nutri-brand to-nutri-mint",
                content.welcomeTextColor || "text-nutri-base",
                isEditable ? "absolute top-0" : "fixed top-0"
            )}>
                <div className="flex items-center gap-4">
                    {isEditable ? (
                        <>
                            <EditableText
                                label="Texto Bienvenida"
                                value={content.welcomeText}
                                onSave={(val) => handleSave('welcomeText', val)}
                            />
                            <div className="flex gap-2 ml-4">
                                <EditableText
                                    label="Clase de Fondo (ej: bg-red-500 o bg-[#ff0000])"
                                    value={content.welcomeBg || ""}
                                    onSave={(val) => handleSave('welcomeBg', val)}
                                >
                                    <div className="p-1 bg-white/20 rounded-md hover:bg-white/40 transition-all text-[8px] flex items-center gap-1">
                                        🎨 FONDO
                                    </div>
                                </EditableText>
                                <EditableText
                                    label="Clase de Texto (ej: text-white o text-[#000000])"
                                    value={content.welcomeTextColor || ""}
                                    onSave={(val) => handleSave('welcomeTextColor', val)}
                                >
                                    <div className="p-1 bg-white/20 rounded-md hover:bg-white/40 transition-all text-[8px] flex items-center gap-1">
                                        A COLOR
                                    </div>
                                </EditableText>
                            </div>
                        </>
                    ) : content.welcomeText}
                </div>
            </div>

            <nav className={cn(
                "w-full bg-nutri-base/90 backdrop-blur-xl z-50 border-b border-white/5 shadow-2xl transition-all",
                isEditable ? "absolute top-10" : "fixed top-10"
            )}>
                <div className="max-w-full mx-auto px-4 lg:px-6">
                    <div className="flex justify-between h-20 items-center gap-4">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="relative group overflow-visible">
                                <Link href={content.logoHref || "/"} className="cursor-pointer hover:opacity-80 transition-opacity">
                                    <img src={content.logoUrl} alt="Logo NuySa" className="h-10 md:h-12 w-auto object-contain" />
                                </Link>
                                {isEditable && (
                                    <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                                        <EditableImage
                                            label="Logo"
                                            src={content.logoUrl}
                                            onSave={(val) => handleSave('logoUrl', val)}
                                            className="static"
                                        />
                                        <EditableLink
                                            label="Link Logo"
                                            url={content.logoHref || "/"}
                                            onSave={(val: string) => handleSave('logoHref', val)}
                                            className="static mt-0"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center">
                                {isEditable ? (
                                    <>
                                        <EditableText
                                            label="Marca Base"
                                            value={content.brandMain}
                                            onSave={(val) => handleSave('brandMain', val)}
                                            className="font-tech font-bold text-lg md:text-3xl tracking-tight text-white"
                                        />
                                        <EditableText
                                            label="Marca Resaltado"
                                            value={content.brandHighlight}
                                            onSave={(val) => handleSave('brandHighlight', val)}
                                            className="font-tech font-bold text-lg md:text-3xl tracking-tight text-nutri-brand ml-1"
                                        />
                                    </>
                                ) : (
                                    <Link href="/" className="font-tech font-bold text-lg md:text-3xl tracking-tight text-white">
                                        {content.brandMain}<span className="text-nutri-brand">{content.brandHighlight}</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="hidden xl:flex space-x-1 items-center font-tech font-semibold text-[12px] text-slate-300 tracking-widest uppercase flex-grow justify-center px-4">
                            {[
                                { id: 'menuHome', href: '#inicio', label: content.menuHome },
                                { id: 'menuAbout', href: '#nosotros', label: content.menuAbout },
                                { id: 'menuServices', href: '#servicios', label: content.menuServices },
                                { id: 'menuPlans', href: '#planes', label: content.menuPlans },
                                { id: 'menuTestimonials', href: '#testimonios', label: content.menuTestimonials },
                                { id: 'menuContact', href: '#contacto', label: content.menuContact },
                            ].map((item) => (
                                <div key={item.id} className="relative">
                                    {isEditable ? (
                                        <EditableText
                                            label={item.id}
                                            value={item.label}
                                            onSave={(val) => handleSave(item.id, val)}
                                            className="px-2 py-2 rounded-full hover:bg-white/5 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                                        />
                                    ) : (
                                        <a href={item.href} className="px-3 py-2 rounded-full hover:bg-white/5 hover:text-white transition-all whitespace-nowrap">{item.label}</a>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex xl:hidden items-center mr-2">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>

                        <div className="flex-shrink-0 flex items-center">
                            {isEditable ? (
                                <div className="flex items-center gap-2 bg-nutri-panel border border-white/10 px-3 md:px-6 py-2 rounded-full relative group/login-btn">
                                    <User className="h-3.5 w-3.5 md:h-4 w-4 text-nutri-brand/70" />
                                    <EditableText
                                        label="Botón Login"
                                        value={content.loginText}
                                        onSave={(val) => handleSave('loginText', val)}
                                        className="font-tech font-bold tracking-wider text-[9px] md:text-xs text-white"
                                    />
                                </div>
                            ) : (
                                <Link href="/login" className="flex items-center gap-2 font-tech font-bold tracking-wider text-[10px] md:text-xs bg-nutri-panel border border-white/10 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-nutri-brand hover:text-nutri-base hover:border-nutri-brand transition-all whitespace-nowrap">
                                    <User className="h-4 w-4" />
                                    <span className="hidden sm:inline">{content.loginText}</span>
                                    <span className="inline sm:hidden">Ingresar</span>
                                </Link>
                            )}
                        </div>

                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={cn(
                    "fixed inset-0 z-[100] transition-all duration-300",
                    isMenuOpen ? "visible" : "invisible"
                )}>
                    {/* Dark Backdrop Overlay */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-black/60 transition-opacity duration-300",
                            isMenuOpen ? "opacity-100" : "opacity-0"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Single Main Card - Positioned EXACTLY below Welcome Bar (40px / top-10) */}
                    <div className={cn(
                        "absolute top-10 right-2 w-full max-w-[280px] bg-[#151F32] border border-white/10 rounded-[1.5rem] shadow-2xl transition-all duration-300 overflow-hidden origin-top-right z-[110]",
                        isMenuOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 -translate-y-4 translate-x-4"
                    )}>
                        {/* Header of the Card */}
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#0B1120]/50">
                            <div className="flex items-center gap-2">
                                <img src={content.logoUrl} alt="Logo" className="h-6 w-auto" />
                                <span className="font-tech font-bold text-base text-white">Menú <span className="text-nutri-brand">NuySa</span></span>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-white bg-white/5 rounded-full hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Navigation List - In a single block */}
                        <div className="p-2">
                            <nav className="flex flex-col">
                                {[
                                    { id: 'menuHome', href: '#inicio', label: content.menuHome || "Inicio", icon: Home },
                                    { id: 'menuAbout', href: '#nosotros', label: content.menuAbout || "Nosotros", icon: Info },
                                    { id: 'menuServices', href: '#servicios', label: content.menuServices || "Servicios", icon: Briefcase },
                                    { id: 'menuPlans', href: '#planes', label: content.menuPlans || "Planes", icon: CreditCard },
                                    { id: 'menuTestimonials', href: '#testimonios', label: content.menuTestimonials || "Testimonios", icon: MessageSquare },
                                    { id: 'menuContact', href: '#contacto', label: content.menuContact || "Contacto", icon: PhoneCall },
                                ].map((item, idx, arr) => {
                                    const Icon = item.icon;
                                    const isLast = idx === arr.length - 1;
                                    return (
                                        <div key={item.id} className="w-full">
                                            {isEditable ? (
                                                <div className={cn(
                                                    "flex items-center gap-4 py-4 px-6 border-white/5",
                                                    !isLast && "border-b"
                                                )}>
                                                    <Icon className="h-5 w-5 text-nutri-brand shrink-0" />
                                                    <EditableText
                                                        label={item.id}
                                                        value={item.label}
                                                        onSave={(val) => handleSave(item.id, val)}
                                                        className="text-sm font-tech font-bold uppercase tracking-widest text-white flex-1"
                                                    />
                                                </div>
                                            ) : (
                                                <a
                                                    href={item.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-4 py-5 px-6 transition-all text-white active:bg-nutri-brand/20 group border-white/5",
                                                        !isLast && "border-b"
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5 text-nutri-brand group-active:scale-110 transition-transform shrink-0" />
                                                    <span className="text-sm font-tech font-bold uppercase tracking-widest font-black">{item.label}</span>
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Footer decorative bar */}
                        <div className="h-2 bg-gradient-to-r from-nutri-brand to-nutri-mint" />
                    </div>
                </div>
            </nav>
        </>
    );
}
