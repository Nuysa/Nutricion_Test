import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname: originalPathname } = request.nextUrl;
    // Normalize pathname to remove double slashes
    const pathname = originalPathname.replace(/\/+/g, '/');

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/register", "/", "/pending-approval", "/manifest.json", "/sw.js"];
    const isPublicPath = publicPaths.some(
        (p) => pathname === p || pathname.startsWith("/api/auth")
    );

    // If not authenticated and trying to access protected routes
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // 2. Load profile and check status
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("user_id", user?.id || "")
        .single();

    const role = profile?.role || "paciente";
    const status = profile?.status || "Pendiente";

    // 3. Block access to dashboard if status is not 'Activo'
    if (user && pathname.startsWith("/dashboard") && status !== "Activo") {
        // Redirect to a specific page or login with a message
        const url = request.nextUrl.clone();
        url.pathname = "/pending-approval";
        url.searchParams.set("status", status);
        return NextResponse.redirect(url);
    }

    // 4. Handle automatic dashboard redirection from root/login/register
    if (user && (pathname === "/register" || pathname === "/login" || pathname === "/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${role}`;
        return NextResponse.redirect(url);
    }

    // 5. check role-based access
    if (user && pathname.startsWith("/dashboard/")) {
        const segments = pathname.split("/");
        const dashboardRole = segments[2]; // /dashboard/{role}/...

        // Ensure users can only access their own dashboard type
        if (dashboardRole && dashboardRole !== role) {
            const url = request.nextUrl.clone();
            url.pathname = `/dashboard/${role}`;
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
