"use client";

import { Quote } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";

export function LandingTestimonials() {
    const { isEditable } = useVisualEditor();
    const [content, setContent] = useState({
        subtitle: "Resultados del Sistema",
        title: "Casos de Éxito",
        testimonials: [
            {
                id: 1,
                author: "Sandra Alejandro",
                text: "\"Emilia es quien me ayudó a lograr mis objetivos, lograr un cuerpo sano y me impulsó a retomar mi gusto por el ejercicio.\""
            },
            {
                id: 2,
                author: "Yomira Santibañez",
                text: "\"Me resultó muy fácil llevar el plan de alimentación porque seguía comiendo mis comidas normales pero en porciones adecuadas, noté cambios en mi cuerpo y me encantaron. Recomendadísimo!\""
            }
        ]
    });

    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'testimonials').single();
            if (data?.content) {
                setContent(prev => ({ ...prev, ...data.content }));
            }
        };
        fetchContent();
    }, []);

    const handleSave = async (updatedContent: any) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'testimonials', content: updatedContent }, { onConflict: 'section' });

        if (!error) {
            setContent(updatedContent);
        } else {
            throw error;
        }
    };

    const updateTestimonial = (id: number, field: string, value: string) => {
        const newTestimonials = content.testimonials.map(t => t.id === id ? { ...t, [field]: value } : t);
        return handleSave({ ...content, testimonials: newTestimonials });
    };

    return (
        <section id="testimonios" className="scroll-mt-32 py-24 relative z-10 border-y border-white/5">
            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">

                <div className="text-center mb-16">
                    {isEditable ? (
                        <EditableText
                            label="Título Testimonios"
                            value={content.title}
                            onSave={(val) => handleSave({ ...content, title: val })}
                            className="text-4xl lg:text-5xl font-tech font-black text-white mb-5 leading-tight block"
                        />
                    ) : (
                        <h3 className="text-4xl lg:text-5xl font-tech font-black text-white mb-5 leading-tight">{content.title}</h3>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {content.testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-nutri-base border border-white/10 p-8 rounded-3xl relative hover:border-nutri-brand/30 transition-all duration-300">
                            <Quote className="h-10 w-10 text-nutri-brand/20 absolute top-8 right-8" />
                            <div className="flex items-center gap-4 mb-6">
                                <div>
                                    {isEditable ? (
                                        <EditableText
                                            label="Autor Testimonio"
                                            value={testimonial.author}
                                            onSave={(val) => updateTestimonial(testimonial.id, 'author', val)}
                                            className="text-white font-bold font-tech"
                                        />
                                    ) : (
                                        <h4 className="text-white font-bold font-tech">{testimonial.author}</h4>
                                    )}
                                </div>
                            </div>
                            {isEditable ? (
                                <EditableText
                                    label="Texto Testimonio"
                                    value={testimonial.text}
                                    onSave={(val) => updateTestimonial(testimonial.id, 'text', val)}
                                    className="text-slate-300 text-sm leading-relaxed block"
                                    multiline
                                />
                            ) : (
                                <p className="text-slate-300 text-sm leading-relaxed text-justify">
                                    {testimonial.text}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
