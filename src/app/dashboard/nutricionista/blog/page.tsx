"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    FileText,
    BookOpen,
    ArrowUpRight,
    AlertTriangle,
    Heart
} from "lucide-react";
import { BLOG_POSTS } from "@/constants/blog-data";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function BlogAdminPage() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [myProfile, setMyProfile] = useState<any>(null);
    const supabase = createClient();

    const loadPosts = async () => {
        // 0. Get current profile if not loaded
        let profileId = myProfile?.id;
        if (!profileId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
            if (!profile) return;
            setMyProfile(profile);
            profileId = profile.id;
        }

        // 1. Get Custom Posts
        const storedCustom = localStorage.getItem('nutrigo_custom_blog_posts');
        const customPosts = storedCustom ? JSON.parse(storedCustom) : [];

        // 2. Get Deleted Slugs
        const storedDeleted = localStorage.getItem('nutrigo_deleted_blog_posts');
        const deletedSlugs = storedDeleted ? JSON.parse(storedDeleted) : [];

        // 3. Get Real-time Views & Likes
        const storedViews = localStorage.getItem('nutrigo_blog_views_count');
        const viewsMap = storedViews ? JSON.parse(storedViews) : {};

        const storedLikes = localStorage.getItem('nutrigo_blog_likes_count');
        const likesMap = storedLikes ? JSON.parse(storedLikes) : {};

        // 4. Merge, Filter by Author ID & Exclude Deleted
        const merged = [...customPosts, ...BLOG_POSTS].reduce((acc: any[], current) => {
            const isDuplicate = acc.find(item => item.slug === current.slug);
            const isDeleted = deletedSlugs.includes(current.slug);
            const isMine = current.authorId === profileId;

            if (!isDuplicate && !isDeleted && isMine) {
                // Attach real-time views and likes
                const updatedPost = {
                    ...current,
                    views: (current.views || 0) + (viewsMap[current.slug] || 0),
                    likes: (current.likes || 0) + (likesMap[current.slug] || 0)
                };
                return acc.concat([updatedPost]);
            }
            return acc;
        }, []).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

        setPosts(merged);
    };

    useEffect(() => {
        loadPosts();

        // 1. Listen for real-time broadcasts (BroadcastChannel)
        const channel = new BroadcastChannel('nutrigo_blog_sync');
        const handleBroadcast = (event: MessageEvent) => {
            if (event.data.type === 'BLOG_UPDATED') {
                loadPosts();
            }
        };
        channel.addEventListener('message', handleBroadcast);

        // 2. Fallback: Listen for direct localStorage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'nutrigo_blog_views_count' ||
                e.key === 'nutrigo_blog_likes_count' ||
                e.key === 'nutrigo_custom_blog_posts' ||
                e.key === 'nutrigo_deleted_blog_posts') {
                loadPosts();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            channel.removeEventListener('message', handleBroadcast);
            channel.close();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const totalPosts = posts.length;
    const totalViews = posts.reduce((acc: number, post: any) => acc + (post.views || 0), 0);
    const totalLikes = posts.reduce((acc: number, post: any) => acc + (post.likes || 0), 0);
    const draftCount = posts.filter((post: any) => post.status === "draft").length;

    const filteredPosts = posts.filter((post: any) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = () => {
        if (!postToDelete) return;
        const slug = postToDelete;

        // 1. Update Persistent Deletions
        const storedDeleted = localStorage.getItem('nutrigo_deleted_blog_posts');
        const deletedSlugs = storedDeleted ? JSON.parse(storedDeleted) : [];
        if (!deletedSlugs.includes(slug)) {
            localStorage.setItem('nutrigo_deleted_blog_posts', JSON.stringify([...deletedSlugs, slug]));
        }

        // 2. Remove from Custom Posts (if it was a custom one)
        const storedCustom = localStorage.getItem('nutrigo_custom_blog_posts');
        if (storedCustom) {
            const customPosts = JSON.parse(storedCustom);
            const filtered = customPosts.filter((p: any) => p.slug !== slug);
            localStorage.setItem('nutrigo_custom_blog_posts', JSON.stringify(filtered));
        }

        // 3. Update State
        setPosts(prev => prev.filter(p => p.slug !== slug));

        // 4. Broadcast change
        const channel = new BroadcastChannel('nutrigo_blog_sync');
        channel.postMessage({ type: 'BLOG_UPDATED' });
        channel.close();

        toast({
            title: "Publicación eliminada",
            description: "El artículo ha sido removido definitivamente para ti y tus pacientes.",
            variant: "destructive"
        });

        setIsDeleteDialogOpen(false);
        setPostToDelete(null);
    };

    const confirmDelete = (slug: string) => {
        setPostToDelete(slug);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión del Blog</h1>
                    <p className="text-slate-500 font-medium">Crea y administra contenido educativo para tus pacientes.</p>
                </div>
                <Link href="/dashboard/nutricionista/blog/new">
                    <Button className="bg-nutrition-600 hover:bg-nutrition-700 text-white font-black rounded-2xl gap-2 py-6 px-6 shadow-xl shadow-nutrition-100 transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5" /> Nueva Publicación
                    </Button>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-slate-500 shadow-xl bg-slate-900 text-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Posts</p>
                                <p className="text-3xl font-black">{totalPosts}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-nutrition-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-slate-300 shadow-xl shadow-slate-200/50 bg-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Vistas Totales</p>
                                <p className="text-3xl font-black">{totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-sky-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-slate-300 shadow-xl shadow-slate-200/50 bg-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Me Gusta</p>
                                <p className="text-3xl font-black">{totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                <Heart className="h-6 w-6 text-red-500 fill-current" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-slate-300 shadow-xl shadow-slate-200/50 bg-white rounded-[32px] overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Borradores</p>
                                <p className="text-3xl font-black">{draftCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Table */}
            <Card className="rounded-[32px]">
                <CardHeader className="border-b bg-white p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-black tracking-tight">Publicaciones Recientes</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar artículo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-nutrition-500"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                                <Filter className="h-4 w-4 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b">
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Artículo</th>
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vistas</th>
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Me Gusta</th>
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                    <th className="text-left p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    <th className="p-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post.slug} className="border-b last:border-0 hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                                    <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-800 truncate max-w-[200px]">{post.title}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">{post.author}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold rounded-lg px-3">
                                                {post.category}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-sky-600 font-black">
                                                <Eye className="h-4 w-4 opacity-50" />
                                                <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-red-500 font-black">
                                                <Heart className="h-4 w-4 fill-current opacity-50" />
                                                <span>{post.likes || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-slate-500">
                                            {post.date}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    post.status === "published" ? "bg-green-500" : "bg-orange-400"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-tighter",
                                                    post.status === "published" ? "text-green-600" : "text-orange-500"
                                                )}>
                                                    {post.status === "published" ? "Publicado" : "Borrador"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/nutricionista/blog/edit/${post.slug}`}>
                                                    <Button variant="ghost" size="icon" className="rounded-xl text-nutrition-600 bg-nutrition-50 hover:bg-nutrition-100 transition-all">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => confirmDelete(post.slug)}
                                                    className="rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/dashboard/paciente/blog/${post.slug}`}>
                                                    <Button variant="ghost" size="icon" className="rounded-xl text-sky-500 bg-sky-50 hover:bg-sky-100 transition-all">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Deletion Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-sm">
                    <DialogHeader className="space-y-4">
                        <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-red-500">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-800 text-center tracking-tight">¿Eliminar artículo?</DialogTitle>
                        <DialogDescription className="text-center font-medium text-slate-500 leading-relaxed px-2">
                            Esta acción es permanente y no podrás recuperar el contenido una vez borrado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col gap-3 mt-6">
                        <Button
                            onClick={handleDelete}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl py-6 shadow-xl shadow-red-100 transition-all hover:scale-105 active:scale-95 border-none"
                        >
                            Sí, eliminar permanentemente
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="w-full font-bold text-slate-400 hover:text-slate-800 transition-all rounded-2xl py-6"
                        >
                            No, mantener publicación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
