"use client";

import Link from "next/link";
import { Phone, Mail, Instagram, Facebook, ImagePlus, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableImage } from "@/components/dashboard/admin/editable-image";
import { EditableLink } from "@/components/dashboard/admin/editable-link";
import { EditableSocialIcon, SOCIAL_ICON_MAP } from "@/components/dashboard/admin/editable-social-icon";

export function LandingFooter() {
    const { isEditable } = useVisualEditor();
    const [content, setContent] = useState({
        ctaTitle: "¿No sabes qué plan elegir?",
        ctaDesc: "Cuéntanos cuáles son tus objetivos nutricionales por WhatsApp, será el punto de partida perfecto para tu cambio físico y de hábitos.",
        ctaButton: "Escríbenos",
        ctaWhatsapp: "https://wa.me/51946759718?text=Hola!,%20quisiera%20informaci%C3%B3n%20sobre%20",
        brandDesc: "Tu aliado en nutrición y bienestar. Un espacio donde te acompañamos a mejorar síntomas, malestares y tu estado físico a través de una alimentación balanceada, práctica y consciente.",
        contactTitle: "Canales de comunicación",
        phone: "(+51) 946759718",
        email: "nuysa.nutricion@gmail.com",
        socialTitle: "Redes Sociales",
        copyright: "© 2026 NUYSA_ORG v7.7. ALL_RIGHTS_RESERVED.",
        logoUrl: "/logo Nuysa.png",
        logoHref: "/",
        facebookUrl: "https://www.facebook.com/profile.php?id=61580140231722",
        facebookIcon: "",
        instagramUrl: "https://www.instagram.com/nuysa.nutricion/",
        instagramIcon: "",
        tiktokUrl: "https://www.tiktok.com/@nuysanutricion",
        tiktokIcon: "",
        socialLinks: [
            { id: '1', icon: 'facebook', url: 'https://www.facebook.com/profile.php?id=61580140231722', label: 'Facebook' },
            { id: '2', icon: 'instagram', url: 'https://www.instagram.com/nuysa.nutricion/', label: 'Instagram' },
            { id: '3', icon: 'tiktok', url: 'https://www.tiktok.com/@nuysanutricion', label: 'TikTok' }
        ] as any[]
    });

    const socialLinks = content.socialLinks || [
        { id: 'fb', icon: content.facebookIcon || 'facebook', url: content.facebookUrl, label: 'Facebook' },
        { id: 'ig', icon: content.instagramIcon || 'instagram', url: content.instagramUrl, label: 'Instagram' },
        { id: 'tk', icon: content.tiktokIcon || 'tiktok', url: content.tiktokUrl, label: 'TikTok' }
    ];




    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'footer').single();
            if (data?.content) {
                setContent(prev => ({ ...prev, ...data.content }));
            }
        };
        fetchContent();
    }, []);

    const handleSave = async (field: string, value: any) => {
        const supabase = createClient();
        const newContent = { ...content, [field]: value };
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'footer', content: newContent }, { onConflict: 'section' });

        if (!error) {
            setContent(newContent);
        } else {
            throw error;
        }
    };

    const handleAddSocial = async () => {
        const newSocial = {
            id: Date.now().toString(),
            icon: 'web',
            url: 'https://',
            label: 'Red Social'
        };
        await handleSave('socialLinks', [...socialLinks, newSocial]);
    };

    const handleDeleteSocial = async (id: string) => {
        const updated = socialLinks.filter(s => s.id !== id);
        await handleSave('socialLinks', updated);
    };

    const handleUpdateSocial = async (id: string, updates: any) => {
        const updated = socialLinks.map(s => s.id === id ? { ...s, ...updates } : s);
        await handleSave('socialLinks', updated);
    };

    return (
        <footer id="contacto" className="scroll-mt-32 relative z-10 pt-20 pb-10 border-t border-white/10 overflow-hidden bg-nutri-base">
            <div className="absolute inset-0 organic-grid opacity-20 pointer-events-none z-0"></div>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 relative z-10">

                {/* CTA WhatsApp Box */}
                <div className="bg-gradient-to-r from-nutri-panel to-nutri-base border border-white/10 rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row justify-between items-center gap-10 mb-16 shadow-2xl">
                    <div>
                        {isEditable ? (
                            <>
                                <EditableText
                                    label="Título CTA"
                                    value={content.ctaTitle}
                                    onSave={(val) => handleSave('ctaTitle', val)}
                                    className="text-3xl md:text-4xl font-tech font-bold text-white mb-3 tracking-tight"
                                />
                                <EditableText
                                    label="Descripción CTA"
                                    value={content.ctaDesc}
                                    onSave={(val) => handleSave('ctaDesc', val)}
                                    className="text-slate-400 max-w-xl leading-relaxed"
                                    multiline
                                />
                            </>
                        ) : (
                            <>
                                <h3 className="text-3xl md:text-4xl font-tech font-bold text-white mb-3 tracking-tight">{content.ctaTitle}</h3>
                                <p className="text-slate-400 max-w-xl leading-relaxed">{content.ctaDesc}</p>
                            </>
                        )}
                    </div>
                    <div className="relative group/cta">
                        <a
                            href={content.ctaWhatsapp}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-nutri-brand text-nutri-base px-8 py-4 rounded-full font-tech font-bold text-lg flex items-center gap-3 transition-transform transform hover:scale-105 shrink-0 shadow-[0_0_20px_rgba(255,122,0,0.3)]"
                        >
                            <Phone className="h-6 w-6" />
                            {isEditable ? (
                                <div className="flex flex-col items-center">
                                    <EditableText
                                        label="Texto Botón"
                                        value={content.ctaButton}
                                        onSave={(val: string) => handleSave('ctaButton', val)}
                                    />
                                    <EditableLink
                                        label="Link WhatsApp"
                                        href={content.ctaWhatsapp}
                                        onSave={(val: string) => handleSave('ctaWhatsapp', val)}
                                        className="bg-white/20 hover:bg-white/40 mt-1"
                                    />
                                </div>
                            ) : content.ctaButton}
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-400 font-sans text-sm">
                    {/* Column 1: Brand Info */}
                    <div>
                        <div className="relative group/footer-logo inline-block">
                            <Link href={content.logoHref || "/"} className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
                                <img src={content.logoUrl} alt="Logo NuySa" className="h-10 md:h-12 w-auto object-contain bg-white rounded-lg p-1 drop-shadow-[0_0_10px_rgba(255,122,0,0.3)]" />
                                <span className="font-tech font-bold text-2xl tracking-tight text-white">Nuy<span className="text-nutri-brand">Sa</span></span>
                            </Link>
                            {isEditable && (
                                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                                    <EditableImage
                                        label="Logo Footer"
                                        src={content.logoUrl}
                                        onSave={(val: string) => handleSave('logoUrl', val)}
                                        className="static"
                                    />
                                    <EditableLink
                                        label="Link Logo Footer"
                                        href={content.logoHref || "/"}
                                        onSave={(val: string) => handleSave('logoHref', val)}
                                        className="static mt-0"
                                    />
                                </div>
                            )}

                        </div>
                        {isEditable ? (
                            <EditableText
                                label="Descripción Marca"
                                value={content.brandDesc}
                                onSave={(val) => handleSave('brandDesc', val)}
                                className="leading-relaxed text-slate-500 max-w-sm block"
                                multiline
                            />
                        ) : (
                            <p className="leading-relaxed text-slate-500 max-w-sm">{content.brandDesc}</p>
                        )}
                    </div>

                    {/* Column 2: Contact Channels */}
                    <div>
                        {isEditable ? (
                            <EditableText
                                label="Título Contacto"
                                value={content.contactTitle}
                                onSave={(val) => handleSave('contactTitle', val)}
                                className="text-white font-tech font-bold mb-6 tracking-widest uppercase text-xs block"
                            />
                        ) : (
                            <h4 className="text-white font-tech font-bold mb-6 tracking-widest uppercase text-xs">{content.contactTitle}</h4>
                        )}
                        <div className="space-y-3">
                            <p className="flex items-center gap-3 hover:text-nutri-brand transition-colors cursor-pointer">
                                <Phone className="text-nutri-brand/50 h-5 w-5" />
                                {isEditable ? (
                                    <EditableText
                                        label="Teléfono"
                                        value={content.phone}
                                        onSave={(val) => handleSave('phone', val)}
                                    />
                                ) : content.phone}
                            </p>
                            <p className="flex items-center gap-3 hover:text-nutri-brand transition-colors cursor-pointer">
                                <Mail className="text-nutri-brand/50 h-5 w-5" />
                                {isEditable ? (
                                    <EditableText
                                        label="Email"
                                        value={content.email}
                                        onSave={(val) => handleSave('email', val)}
                                    />
                                ) : content.email}
                            </p>
                        </div>
                    </div>

                    {/* Column 3: Social Media */}
                    <div>
                        {isEditable ? (
                            <EditableText
                                label="Título Redes"
                                value={content.socialTitle}
                                onSave={(val) => handleSave('socialTitle', val)}
                                className="text-white font-tech font-bold mb-6 tracking-widest uppercase text-xs block"
                            />
                        ) : (
                            <h4 className="text-white font-tech font-bold mb-6 tracking-widest uppercase text-xs">{content.socialTitle}</h4>
                        )}
                        <div className="flex flex-wrap gap-6 items-center">
                            {socialLinks.map((social) => {
                                const IconComponent = SOCIAL_ICON_MAP[social.icon] || SOCIAL_ICON_MAP['web'];
                                return (
                                    <div key={social.id} className="relative group/social flex flex-col items-center gap-2">
                                        <div className="relative group/icon-edit">
                                            <a
                                                href={social.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-14 h-14 border border-white/10 bg-nutri-panel rounded-full flex items-center justify-center hover:bg-nutri-brand hover:text-nutri-base transition-all text-xl shadow-lg relative overflow-hidden"
                                            >
                                                <IconComponent className="h-6 w-6" />
                                            </a>
                                            {isEditable && (
                                                <div className="absolute -top-2 -left-2 flex flex-col gap-1 z-50">
                                                    <EditableSocialIcon
                                                        label={`Icono ${social.label}`}
                                                        value={social.icon}
                                                        onSave={(val: string) => handleUpdateSocial(social.id, { icon: val })}
                                                        className="static scale-90"
                                                    />
                                                    <button
                                                        onClick={() => handleDeleteSocial(social.id)}
                                                        className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors scale-90"
                                                        title="Eliminar red social"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isEditable && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <EditableText
                                                    label="Etiqueta"
                                                    value={social.label}
                                                    onSave={(val) => handleUpdateSocial(social.id, { label: val })}
                                                    className="text-[10px] uppercase font-black tracking-widest text-slate-500 text-center"
                                                />
                                                <EditableLink
                                                    label={`URL ${social.label}`}
                                                    href={social.url}
                                                    onSave={(val: string) => handleUpdateSocial(social.id, { url: val })}
                                                    className="opacity-100 scale-90 mt-0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isEditable && (
                                <button
                                    onClick={handleAddSocial}
                                    className="w-14 h-14 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:border-nutri-brand hover:text-nutri-brand transition-all hover:bg-nutri-brand/5 group/add-btn"
                                    title="Añadir red social"
                                >
                                    <Plus className="h-6 w-6 group-hover/add-btn:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>

                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs font-tech tracking-widest text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-5">
                    {isEditable ? (
                        <EditableText
                            label="Copyright"
                            value={content.copyright}
                            onSave={(val) => handleSave('copyright', val)}
                        />
                    ) : (
                        <p>{content.copyright}</p>
                    )}
                </div>

            </div>
        </footer>
    );
}
