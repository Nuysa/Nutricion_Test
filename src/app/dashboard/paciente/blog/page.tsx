"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BLOG_POSTS } from "@/constants/blog-data";

const categories = ["Todos", "Nutrición", "Recetas", "Educación", "Bienestar", "Suplementación"];

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);

            // 1. Get Custom Posts from localStorage (Real-time sync)
            const storedCustom = localStorage.getItem('nutrigo_custom_blog_posts');
            const customPosts = storedCustom ? JSON.parse(storedCustom) : [];

            // 2. Get Deleted Slugs
            const storedDeleted = localStorage.getItem('nutrigo_deleted_blog_posts');
            const deletedSlugs = storedDeleted ? JSON.parse(storedDeleted) : [];

            // 3. Merge with default BLOG_POSTS and filter
            const merged = [...customPosts, ...BLOG_POSTS].reduce((acc: any[], current) => {
                const isDuplicate = acc.find(item => item.slug === current.slug);
                const isDeleted = deletedSlugs.includes(current.slug);

                if (!isDuplicate && !isDeleted && current.status === "published") {
                    return acc.concat([current]);
                }
                return acc;
            }, []).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

            setPosts(merged);
            setLoading(false);
        };

        loadPosts();

        const channel = new BroadcastChannel('nutrigo_blog_sync');
        channel.onmessage = (event) => {
            if (event.data.type === 'BLOG_UPDATED') loadPosts();
        };

        return () => channel.close();
    }, []);

    const filteredPosts = activeCategory === "Todos"
        ? posts
        : posts.filter(post => post.category === activeCategory);

    return (
        <div className="space-y-12 pb-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-nutrition-500/5 blur-[120px] pointer-events-none -z-10" />

            <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl mb-2">
                    <Sparkles className="h-4 w-4 text-nutrition-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Biblioteca Humana</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter text-center md:text-left uppercase">
                    Blog de <span className="text-nutrition-500">Bienestar</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg text-center md:text-left max-w-2xl italic">
                    Descubre conocimientos accionables para optimizar tu metabolismo y estilo de vida.
                </p>
            </div>

            {/* Category Filter Bar */}
            <div className="bg-white/[0.03] p-3 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl sticky top-24 z-20">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                                activeCategory === category
                                    ? "bg-nutrition-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105"
                                    : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, i) => (
                        <Card key={i} className="group overflow-hidden rounded-[3rem] bg-[#151F32] border border-white/5 shadow-2xl hover:border-nutrition-500/50 transition-all duration-700 hover:-translate-y-2">
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#151F32] via-transparent to-transparent opacity-60" />
                                <div className="absolute top-6 left-6">
                                    <Badge className="bg-black/60 text-white font-black border border-white/10 backdrop-blur-xl px-4 py-1.5 rounded-xl uppercase text-[9px] tracking-widest">
                                        {post.category}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                                    <span className="flex items-center gap-2 font-tech"><Calendar className="h-3.5 w-3.5 text-nutrition-500" /> {post.date}</span>
                                    <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-nutrition-500" /> {post.author}</span>
                                </div>
                                <CardTitle className="text-2xl font-black text-white leading-[1.15] group-hover:text-nutrition-400 transition-colors uppercase tracking-tight">
                                    {post.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-10">
                                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 line-clamp-3 italic opacity-80">
                                    "{post.excerpt}"
                                </p>
                                <Link
                                    href={`/dashboard/paciente/blog/${post.slug}`}
                                    className="inline-flex items-center gap-3 text-nutrition-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-nutrition-400 transition-all group/btn"
                                >
                                    Abrir Expediente
                                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center transition-all group-hover/btn:bg-nutrition-500 group-hover/btn:text-white">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                            <BookOpen className="h-8 w-8 text-slate-700" />
                        </div>
                        <p className="text-slate-600 font-black uppercase tracking-widest text-sm">Contenido en proceso de redacción...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
