"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, BookOpen, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/constants/blog-data";
import Link from "next/link";
import { cn } from "@/lib/utils";

const blogPosts = BLOG_POSTS.slice(0, 4);

export function BlogPostsSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % blogPosts.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + blogPosts.length) % blogPosts.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    const post = blogPosts[currentIndex];

    return (
        <Card className="h-full flex flex-col relative group bg-[#151F32] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151F32] via-transparent to-transparent" />
                    <div className="absolute top-6 left-6">
                        <span className="px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 text-white shadow-2xl backdrop-blur-xl border border-white/10">
                            {post.category}
                        </span>
                    </div>
                </div>

                <div className="p-10 flex flex-col flex-1 relative z-10 -mt-10">
                    <div className="flex items-center gap-6 mb-6 text-[10px] font-tech font-black text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-nutrition-500" />
                            {post.readTime}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-white/10" />
                        <div>{post.date}</div>
                    </div>

                    <Link href={`/dashboard/paciente/blog/${post.slug}`}>
                        <h3 className="text-3xl font-black text-white hover:text-nutrition-400 leading-[1.1] mb-6 transition-all tracking-tight cursor-pointer uppercase">
                            {post.title}
                        </h3>
                    </Link>

                    <p className="text-slate-400 leading-relaxed mb-10 flex-1 line-clamp-3 font-medium italic">
                        "{post.excerpt}"
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Autoría</span>
                                <span className="text-sm font-black text-white uppercase tracking-tight">{post.author}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={prevSlide}
                                className="h-12 w-12 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-nutrition-500 hover:border-nutrition-500 transition-all active:scale-90"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={nextSlide}
                                className="h-12 w-12 rounded-2xl border-white/5 bg-white/5 text-white hover:bg-nutrition-500 hover:border-nutrition-500 transition-all active:scale-90"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Pagination dots */}
            <div className="absolute top-6 right-6 flex gap-2">
                {blogPosts.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-700",
                            i === currentIndex ? "w-8 bg-nutrition-500 shadow-[0_0_10px_#10b981]" : "w-1.5 bg-white/10"
                        )}
                    />
                ))}
            </div>
        </Card>
    );
}
