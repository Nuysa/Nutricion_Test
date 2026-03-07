"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    User,
    ChevronLeft,
    Share2,
    Bookmark,
    MessageCircle,
    CheckCircle2,
    Heart,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function ArticlePage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [article, setArticle] = useState<any>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('nutrigo_custom_blog_posts');
        const customPosts = stored ? JSON.parse(stored) : [];
        const custom = customPosts.find((p: any) => p.slug === params.slug);

        if (custom) {
            setArticle(custom);
        } else {
            router.push("/dashboard/paciente/blog");
        }

        const userLikesKey = 'nutrigo_blog_user_likes';
        const globalLikesKey = 'nutrigo_blog_likes_count';

        const userLikes = JSON.parse(localStorage.getItem(userLikesKey) || '{}');
        const globalLikes = JSON.parse(localStorage.getItem(globalLikesKey) || '{}');

        setIsLiked(!!userLikes[params.slug]);
        setLikesCount(globalLikes[params.slug] || 0);

        const incrementViews = () => {
            const viewsKey = 'nutrigo_blog_views_count';
            const viewsMap = JSON.parse(localStorage.getItem(viewsKey) || '{}');
            viewsMap[params.slug] = (viewsMap[params.slug] || 0) + 1;
            localStorage.setItem(viewsKey, JSON.stringify(viewsMap));

            const channel = new BroadcastChannel('nutrigo_blog_sync');
            channel.postMessage({ type: 'BLOG_UPDATED' });
            channel.close();
        };

        const timer = setTimeout(incrementViews, 2000);
        return () => clearTimeout(timer);
    }, [params.slug, router]);

    const handleToggleLike = () => {
        const userLikesKey = 'nutrigo_blog_user_likes';
        const globalLikesKey = 'nutrigo_blog_likes_count';
        const userLikes = JSON.parse(localStorage.getItem(userLikesKey) || '{}');
        const globalLikes = JSON.parse(localStorage.getItem(globalLikesKey) || '{}');

        const newLikedStatus = !isLiked;
        const newGlobalCount = (globalLikes[params.slug] || 0) + (newLikedStatus ? 1 : -1);

        userLikes[params.slug] = newLikedStatus;
        globalLikes[params.slug] = Math.max(0, newGlobalCount);

        localStorage.setItem(userLikesKey, JSON.stringify(userLikes));
        localStorage.setItem(globalLikesKey, JSON.stringify(globalLikes));

        setIsLiked(newLikedStatus);
        setLikesCount(globalLikes[params.slug]);

        const channel = new BroadcastChannel('nutrigo_blog_sync');
        channel.postMessage({ type: 'BLOG_UPDATED' });
        channel.close();
    };

    if (!article) return (
        <div className="h-screen flex flex-col items-center justify-center gap-6 bg-[#0B1120]">
            <div className="h-14 w-14 border-4 border-nutrition-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando Conocimiento...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-32 px-4 relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-nutrition-500/5 blur-[150px] pointer-events-none -z-10" />

            {/* Header Actions */}
            <div className="flex items-center justify-between mb-12 pt-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="rounded-2xl gap-3 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 px-6"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Regresar
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/5 bg-white/5 text-slate-400 hover:text-nutrition-500 hover:border-nutrition-500/50 transition-all">
                        <Bookmark className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/5 bg-white/5 text-slate-400 hover:text-nutrition-500 hover:border-nutrition-500/50 transition-all">
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Article Header */}
            <header className="mb-16">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 w-fit px-4 py-2 rounded-2xl mb-8">
                    <Sparkles className="h-4 w-4 text-nutrition-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{article.category}</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-white leading-[1] mb-12 tracking-tighter uppercase">
                    {article.title}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-y border-white/5 py-10">
                    <div className="flex items-center gap-6 group cursor-pointer">
                        <Avatar className="h-16 w-16 border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                            <AvatarImage src={article.authorAvatar} className="object-cover" />
                            <AvatarFallback className="bg-white/5 text-white">{article.author[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-white text-xl uppercase tracking-tight group-hover:text-nutrition-400 transition-colors">{article.author}</span>
                                <CheckCircle2 className="h-5 w-5 text-sky-400 fill-sky-400/10" />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{article.authorRole}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 text-[10px] font-black font-tech text-slate-500 uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2.5 rounded-2xl border border-white/5">
                            <Calendar className="h-4 w-4 text-nutrition-500" />
                            <span>{article.date}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2.5 rounded-2xl border border-white/5">
                            <Clock className="h-4 w-4 text-nutrition-500" />
                            <span>{article.readTime}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[4rem] overflow-hidden mb-20 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
                <img
                    src={article.image}
                    alt={article.title}
                    className="object-cover w-full h-full transition-transform duration-2000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/40 to-transparent" />
            </div>

            {/* Content Area */}
            <article className="max-w-4xl mx-auto">
                <div className="space-y-10">
                    {article.content.map((block: any, idx: number) => {
                        if (block.type === "p") {
                            return <p key={idx} className="text-xl md:text-2xl text-slate-300 leading-[1.7] font-medium selection:bg-nutrition-500/30">{block.text}</p>;
                        }
                        if (block.type === "h2") {
                            return <h2 key={idx} className="text-3xl md:text-4xl font-black text-white pt-12 tracking-tight uppercase border-l-4 border-nutrition-500 pl-8">{block.text}</h2>;
                        }
                        if (block.type === "quote") {
                            return (
                                <div key={idx} className="relative py-12 px-12 rounded-[3.5rem] bg-white/[0.02] border border-white/5 overflow-hidden my-16 group">
                                    <div className="absolute top-0 right-0 h-64 w-64 bg-nutrition-500/10 rounded-full blur-[100px] -translate-y-20 translate-x-20" />
                                    <MessageCircle className="h-14 w-14 text-nutrition-500 mb-6 opacity-30" />
                                    <p className="text-2xl md:text-3xl font-black text-white italic leading-relaxed relative z-10 selection:bg-nutrition-500/30">
                                        "{block.text}"
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </article>

            {/* Interaction Card */}
            <div className="mt-32 p-16 rounded-[4rem] bg-[#151F32] border border-white/5 text-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 max-w-lg mx-auto space-y-8">
                    <button
                        onClick={handleToggleLike}
                        className={cn(
                            "h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-700 active:scale-90",
                            isLiked ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "bg-white/5 text-slate-600 border border-white/10 hover:border-red-500/30 hover:text-red-400"
                        )}
                    >
                        <Heart className={cn("h-12 w-12 transition-transform duration-500", isLiked && "fill-current scale-110")} />
                    </button>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-black text-white tracking-widest uppercase">
                            {isLiked ? "¡Apreciado!" : "¿Contenido útil?"}
                        </h3>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed px-4">
                            {isLiked
                                ? "Este contenido ha sido guardado en tus interacciones favoritas."
                                : "Tu interacción nos ayuda a priorizar los temas más relevantes para tu salud."}
                        </p>
                    </div>

                    <div className="pt-4">
                        <Badge variant="outline" className="px-6 py-2 rounded-2xl border-white/5 bg-white/[0.02] text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                            {likesCount} Reconocimientos
                        </Badge>
                    </div>
                </div>
            </div>
        </div >
    );
}
