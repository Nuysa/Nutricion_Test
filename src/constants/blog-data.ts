export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    authorId: string;
    date: string;
    image: string;
    readTime: string;
    bgColor?: string;
    color?: string;
    status: "published" | "draft";
    views?: number;
    likes?: number;
    timestamp?: number;
}

export const BLOG_POSTS: BlogPost[] = [];
