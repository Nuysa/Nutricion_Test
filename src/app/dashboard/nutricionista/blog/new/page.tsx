"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    Save,
    Eye,
    Plus,
    Type,
    Heading2,
    Quote,
    Image as ImageIcon,
    Layout,
    Clock,
    User,
    Send,
    Trash2,
    MoveUp,
    MoveDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

interface ContentBlock {
    id: string;
    type: "p" | "h2" | "quote";
    text: string;
}

export default function NewPostPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Nutrición");
    const [image, setImage] = useState("https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [blocks, setBlocks] = useState<ContentBlock[]>([
        { id: "1", type: "p", text: "" }
    ]);
    const [profile, setProfile] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
                setProfile(data);
            }
        };
        loadProfile();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                toast({ title: "Imagen cargada", description: "La imagen se ha adjuntado correctamente." });
            };
            reader.readAsDataURL(file);
        }
    };

    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const addBlock = (type: "p" | "h2" | "quote") => {
        setBlocks([...blocks, { id: Date.now().toString(), type, text: "" }]);
    };

    const updateBlock = (id: string, text: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, text } : b));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const handleSave = (status: "published" | "draft" = "published") => {
        if (!title.trim()) {
            toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
            return;
        }

        const newPost = {
            id: Date.now().toString(),
            title,
            slug: title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ''),
            category,
            author: profile?.full_name || "Nutricionista",
            authorId: profile?.id || "unknown",
            date: status === "published"
                ? new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : "Borrador",
            readTime: `${Math.max(1, Math.ceil(blocks.reduce((acc, b) => acc + b.text.split(' ').length, 0) / 200))} min`,
            image,
            status,
            views: 0,
            timestamp: Date.now(),
            excerpt: blocks.find(b => b.type === "p")?.text.substring(0, 150) + "...",
            content: blocks.map(b => ({ type: b.type, text: b.text }))
        };

        // Persist to localStorage
        const stored = localStorage.getItem('nutrigo_custom_blog_posts');
        const customPosts = stored ? JSON.parse(stored) : [];
        localStorage.setItem('nutrigo_custom_blog_posts', JSON.stringify([...customPosts, newPost]));

        // Broadcast change
        const channel = new BroadcastChannel('nutrigo_blog_sync');
        channel.postMessage({ type: 'BLOG_UPDATED' });
        channel.close();

        toast({
            title: status === "published" ? "¡Publicación exitosa!" : "Borrador guardado",
            description: status === "published"
                ? "Tu artículo ya está disponible para los pacientes."
                : "El artículo se ha guardado en tus borradores.",
            variant: "success",
        });

        router.push("/dashboard/nutricionista/blog");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between sticky top-4 z-50 bg-white/80 backdrop-blur-xl p-4 rounded-[32px] border shadow-2xl shadow-slate-200/50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest hidden md:block">Nuevo Artículo</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={cn(
                            "rounded-2xl gap-2 font-bold transition-all",
                            isPreviewMode ? "bg-sky-50 text-sky-600" : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <Eye className="h-4 w-4" /> {isPreviewMode ? "Editar" : "Previsualizar"}
                    </Button>
                    <div className="h-4 w-px bg-slate-200 mx-1" />
                    <Button
                        variant="outline"
                        onClick={() => handleSave("draft")}
                        className="border-slate-200 text-slate-600 font-bold rounded-2xl gap-2 px-6 hover:bg-slate-50 transition-all border-none shadow-sm"
                    >
                        <Save className="h-4 w-4" /> Guardar Borrador
                    </Button>
                    <Button
                        onClick={() => handleSave("published")}
                        className="bg-nutrition-600 hover:bg-nutrition-700 text-white font-black rounded-2xl gap-2 px-6 shadow-lg shadow-nutrition-100 transition-all hover:scale-105 active:scale-95 border-none"
                    >
                        <Send className="h-4 w-4" /> Publicar
                    </Button>
                </div>
            </div>

            {/* Post Metadata Card */}
            <Card className="rounded-[40px]">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Título del Artículo</label>
                        <input
                            type="text"
                            placeholder="Escribe un título impactante..."
                            className="w-full text-3xl md:text-4xl font-black text-slate-800 border-none bg-transparent focus:ring-0 placeholder:text-slate-200"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Nutrición", "Recetas", "Educación", "Bienestar"].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-black transition-all",
                                                category === cat ? "bg-nutrition-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Imagen de Portada (URL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border-none rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-nutrition-500"
                                        placeholder="https://..."
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                    />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Overlay */}
            {isPreviewMode ? (
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="text-center space-y-6">
                        <Badge className="bg-nutrition-50 text-nutrition-700 font-black border-none px-4 py-1 rounded-full text-[10px] uppercase tracking-widest">{category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">{title || "Sin Título"}</h1>
                        <div className="flex items-center justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-y border-slate-50 py-6">
                            <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> 5 min lect.</span>
                            <span className="flex items-center gap-2"><User className="h-3 w-3" /> {profile?.full_name || "Nutricionista"}</span>
                        </div>
                    </header>
                    <div className="aspect-video rounded-[32px] overflow-hidden shadow-2xl">
                        <img src={image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <article className="max-w-2xl mx-auto space-y-8">
                        {blocks.map((b) => (
                            <div key={b.id}>
                                {b.type === "h2" && <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-4">{b.text}</h2>}
                                {b.type === "p" && <p className="text-lg text-slate-600 leading-relaxed font-medium">{b.text}</p>}
                                {b.type === "quote" && (
                                    <div className="bg-slate-900 text-white p-8 rounded-[32px] italic text-xl font-bold relative overflow-hidden">
                                        <Quote className="h-8 w-8 text-nutrition-500/30 absolute top-4 left-4" />
                                        <p className="relative z-10">"{b.text}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </article>
                </div>
            ) : (
                <div className="space-y-6">
                    {blocks.map((block, index) => (
                        <div key={block.id} className="group relative flex gap-4">
                            {/* Block Actions (Floating on hover) */}
                            <div className="absolute -left-12 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-grab active:cursor-grabbing"><Layout className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => removeBlock(block.id)} className="h-8 w-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>

                            <div className={cn(
                                "flex-1 p-6 rounded-[32px] transition-all border-2 border-slate-200 hover:border-nutrition-500/30 hover:bg-white shadow-none hover:shadow-xl hover:shadow-slate-200/50",
                                block.type === "quote" && "bg-slate-900 text-white italic",
                                block.type === "h2" && "bg-white"
                            )}>
                                <textarea
                                    className={cn(
                                        "w-full bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden",
                                        block.type === "p" && "text-lg text-slate-600 font-medium leading-relaxed",
                                        block.type === "h2" && "text-2xl font-black text-slate-800 tracking-tight",
                                        block.type === "quote" && "text-xl font-black text-white"
                                    )}
                                    placeholder={block.type === "p" ? "Escribe un párrafo..." : block.type === "h2" ? "Escribe un subtítulo..." : "Escribe una cita motivadora..."}
                                    value={block.text}
                                    onChange={(e) => {
                                        updateBlock(block.id, e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Block Toolset */}
                    <div className="flex items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30 gap-4">
                        <Button
                            onClick={() => addBlock("p")}
                            variant="ghost" className="rounded-2xl flex-col h-24 w-24 gap-3 text-slate-400 hover:text-nutrition-600 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center transition-colors group-hover:bg-nutrition-100">
                                <Type className="h-5 w-5" />
                            </div>
                            Párrafo
                        </Button>
                        <Button
                            onClick={() => addBlock("h2")}
                            variant="ghost" className="rounded-2xl flex-col h-24 w-24 gap-3 text-slate-400 hover:text-nutrition-600 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center transition-colors group-hover:bg-nutrition-100">
                                <Heading2 className="h-5 w-5" />
                            </div>
                            Subtítulo
                        </Button>
                        <Button
                            onClick={() => addBlock("quote")}
                            variant="ghost" className="rounded-2xl flex-col h-24 w-24 gap-3 text-slate-400 hover:text-nutrition-600 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center transition-colors group-hover:bg-nutrition-100">
                                <Quote className="h-5 w-5" />
                            </div>
                            Cita
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
