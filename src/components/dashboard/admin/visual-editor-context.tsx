"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Theme {
    brand: string;
    base: string;
    panel: string;
    border: string;
}

interface VisualEditorContextType {
    isEditable: boolean;
    setEditable: (val: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export function VisualEditorProvider({ children }: { children: React.ReactNode }) {
    const [isEditable, setEditable] = useState(false);
    const [theme, setTheme] = useState<Theme>({
        brand: '#FF7A00',
        base: '#0B1120',
        panel: '#151F32',
        border: '#FFFFFF10'
    });

    useEffect(() => {
        const loadTheme = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'theme').maybeSingle();
            if (data?.content) {
                setTheme(prev => ({ ...prev, ...data.content }));
            }
        };
        loadTheme();
    }, []);

    return (
        <VisualEditorContext.Provider value={{ isEditable, setEditable, theme, setTheme }}>
            {children}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --nutri-brand: ${theme.brand} !important;
                    --nutri-base: ${theme.base} !important;
                    --nutri-panel: ${theme.panel} !important;
                }
            ` }} />
        </VisualEditorContext.Provider>
    );
}

export function useVisualEditor() {
    const context = useContext(VisualEditorContext);
    if (context === undefined) {
        return {
            isEditable: false,
            setEditable: () => { },
            theme: { brand: '#FF7A00', base: '#0B1120', panel: '#151F32', border: '#FFFFFF10' },
            setTheme: () => { }
        };
    }
    return context;
}
