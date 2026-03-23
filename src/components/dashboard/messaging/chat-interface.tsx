"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Search,
    Image as ImageIcon,
    Paperclip,
    Send,
    Smile,
    CheckCheck,
    FileText,
    Download,
    Info,
    ChevronLeft,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MessagingService } from "@/lib/messaging-service";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/components/providers/presence-provider";

// Types
export interface Message {
    id: string;
    senderId: string;
    content: string;
    time: string;
    type: "text" | "image" | "document";
    status: "sent" | "delivered" | "read";
    imageUrl?: string;
    file?: { name: string; size: string };
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    info?: {
        label1?: string;
        value1?: string;
        label2?: string;
        value2?: string;
        label3?: string;
        value3?: string;
        label4?: string;
        value4?: string;
    };
}

interface ChatInterfaceProps {
    title: string;
    searchPlaceholder?: string;
    initialContacts: Contact[];
    initialMessages?: Record<string, Message[]>;
    roleLabel?: string;
    currentUserId: string;
    currentUserName: string;
}

const EMOJIS = ["😀", "😂", "🥰", "😊", "🤔", "👍", "🔥", "🙌", "🥑", "🥗", "🍎", "💧", "💪", "📅", "✨", "✅"];

export function ChatInterface({
    title,
    searchPlaceholder = "Buscar chat...",
    initialContacts,
    roleLabel = "Usuario",
    currentUserId,
    currentUserName
}: ChatInterfaceProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContactId, setSelectedContactId] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
    const [messageInput, setMessageInput] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(false);
    const { onlineUsers } = usePresence();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedContactIdRef = useRef(selectedContactId);
    const isFirstLoadRef = useRef(true);
    const initialContactsRef = useRef(initialContacts);

    // Sync refs
    useEffect(() => {
        selectedContactIdRef.current = selectedContactId;
    }, [selectedContactId]);

    useEffect(() => {
        initialContactsRef.current = initialContacts;
    }, [initialContacts]);

    const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }, 150);
    };

    const loadGlobalData = useCallback(async () => {
        const myId = currentUserId?.toLowerCase();
        if (!myId) return;

        const currentBatch = initialContactsRef.current.length > 0
            ? initialContactsRef.current
            : initialContacts;

        if (!currentBatch || currentBatch.length === 0) return;

        try {
            const newMap: Record<string, Message[]> = {};
            const updatedContactsPromises = currentBatch.map(async (c) => {
                const partnerId = c.id.toLowerCase();
                const rawMsgs = await MessagingService.getMessages(myId, partnerId);

                newMap[partnerId] = rawMsgs.map((m: any) => ({
                    id: m.id,
                    senderId: m.senderId.toLowerCase() === myId ? "me" : m.senderId,
                    content: m.content,
                    time: m.time,
                    type: m.type,
                    status: m.status
                }));

                const unreadCount = rawMsgs.filter((m: any) => (m.receiverId || "").toLowerCase() === myId && m.status !== "read").length;
                const lastMsg = rawMsgs.length > 0 ? rawMsgs[rawMsgs.length - 1] : null;

                return {
                    ...c,
                    id: partnerId,
                    unread: unreadCount,
                    lastMessage: lastMsg ? lastMsg.content : c.lastMessage,
                    time: lastMsg ? lastMsg.time : c.time
                };
            });

            const updatedContacts = await Promise.all(updatedContactsPromises);
            setContacts(updatedContacts);
            setMessagesMap(newMap);
        } catch (error) {
            console.error("[Chat] Error loading data:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [currentUserId, initialContacts]);

    useEffect(() => {
        loadGlobalData().then(() => {
            setIsLoaded(true);
        });

        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => loadGlobalData();
        return () => bc.close();
    }, [currentUserId, initialContacts]);

    useEffect(() => {
        if (isLoaded && isFirstLoadRef.current && initialContacts.length > 0) {
            const currentSelected = selectedContactIdRef.current;
            if (!currentSelected) {
                setSelectedContactId(initialContacts[0].id);
            }
            isFirstLoadRef.current = false;
        }
    }, [isLoaded, initialContacts.length]);

    useEffect(() => {
        if (!currentUserId) return;
        const supabase = createClient();
        const myId = currentUserId.toLowerCase();

        const handleRefresh = async (payload?: any) => {
            await new Promise(r => setTimeout(r, 700));
            await loadGlobalData();
            setTimeout(() => scrollToBottom("smooth"), 150);
        };

        const channel = supabase
            .channel(`chat_v6_final`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const msg = payload.new;
                    const senderId = (msg.sender_id || "").toLowerCase();
                    const receiverId = (msg.receiver_id || "").toLowerCase();

                    if (senderId === myId || receiverId === myId) {
                        handleRefresh(msg);
                    }
                }
            )
            .subscribe();

        const onGlobalEvent = (e: any) => handleRefresh(e.detail);
        window.addEventListener("nutrigo-chat-refresh", onGlobalEvent);

        const onFocus = () => loadGlobalData();
        window.addEventListener("focus", onFocus);

        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = (event) => {
            if (event.data.type === 'NEW_MESSAGE') handleRefresh();
        };

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener("nutrigo-chat-refresh", onGlobalEvent);
            window.removeEventListener("focus", onFocus);
            bc.close();
        };
    }, [currentUserId, loadGlobalData]);

    useEffect(() => {
        if (!isLoaded || !selectedContactId || !currentUserId) return;
        MessagingService.markMessagesAsRead(currentUserId, selectedContactId);
    }, [selectedContactId, isLoaded, currentUserId]);

    useEffect(() => {
        if (isLoaded) scrollToBottom("auto");
    }, [selectedContactId, isLoaded]);

    useEffect(() => {
        if (isLoaded) scrollToBottom("smooth");
    }, [messagesMap, isLoaded]);

    const contactsWithPresence = contacts.map(c => ({
        ...c,
        online: onlineUsers.has(c.id)
    }));

    const selectedContact = contactsWithPresence.find(c => c.id === selectedContactId);
    const currentMessages = messagesMap[selectedContactId] || [];

    const filteredContacts = contactsWithPresence.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedContactId) return;

        const text = messageInput;
        const tempId = `temp-${Date.now()}`;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const optimisticMsg: Message = {
            id: tempId,
            senderId: "me",
            content: text,
            time: now,
            type: "text",
            status: "sent"
        };

        setMessagesMap(prev => ({
            ...prev,
            [selectedContactId]: [...(prev[selectedContactId] || []), optimisticMsg]
        }));
        setMessageInput("");
        scrollToBottom("smooth");

        try {
            await MessagingService.sendMessage({
                senderId: currentUserId,
                receiverId: selectedContactId,
                content: text,
                type: "text"
            });
            loadGlobalData();
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessageInput(text);
        }
    };

    const handleEmojiSelect = (emoji: string) => setMessageInput(prev => prev + emoji);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
        const file = e.target.files?.[0];
        if (!file) return;

        await MessagingService.sendMessage({
            senderId: currentUserId,
            receiverId: selectedContactId,
            content: type === "image" ? "📷 Imagen enviada" : `📄 Archivo: ${file.name}`,
            type: type
        });
        loadGlobalData();
    };

    if (!isLoaded) return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 border-4 border-nutrition-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Sincronizando Comunicaciones...</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-12rem)] bg-[#151F32] rounded-[3rem] border border-white/5 shadow-2xl flex overflow-hidden relative">
            <div className="absolute top-0 left-0 w-96 h-96 bg-nutrition-500/5 blur-[120px] pointer-events-none" />

            {/* Contacts Sidebar */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-white/[0.02] relative z-10">
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">{title}</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-nutrition-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContactId(contact.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all group text-left",
                                        selectedContactId === contact.id
                                            ? "bg-white/5 border border-white/10 shadow-2xl"
                                            : "hover:bg-white/[0.02] border border-transparent"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-14 w-14 border-2 border-white/5 shadow-xl">
                                            {contact.avatar ? <AvatarImage src={contact.avatar} className="object-cover" /> : null}
                                            <AvatarFallback className="bg-nutrition-500/20 text-nutrition-400 font-black">
                                                {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {contact.online && (
                                            <span className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 border-2 border-[#151F32] rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-black text-sm text-white truncate tracking-tight">{contact.name}</h4>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{contact.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[11px] text-slate-500 truncate pr-2 font-medium italic">
                                                {contact.lastMessage}
                                            </p>
                                            {contact.unread > 0 && (
                                                <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-nutrition-500 text-white border-none text-[9px] font-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                                    {contact.unread}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Silencio absoluto</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-transparent relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

                    {/* Chat Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#151F32]/80 backdrop-blur-xl sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border border-white/10 shadow-lg">
                                {selectedContact.avatar ? <AvatarImage src={selectedContact.avatar} className="object-cover" /> : null}
                                <AvatarFallback className="bg-white/5 text-slate-400 font-black">
                                    {selectedContact.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-black text-white text-lg tracking-tight uppercase leading-none">{selectedContact.name}</h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={cn(
                                        "h-2 w-2 rounded-full",
                                        selectedContact.online ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-slate-700"
                                    )} />
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.1em]",
                                        selectedContact.online ? "text-emerald-400" : "text-slate-500"
                                    )}>
                                        {selectedContact.online ? "En línea" : "Desconectado"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                        <Info className="h-5 w-5" />
                                    </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 rounded-[2.5rem] bg-[#151F32] border-white/10 p-8 shadow-2xl backdrop-blur-3xl" align="end">
                                    <div className="flex flex-col items-center gap-4">
                                        <Avatar className="h-24 w-24 border-4 border-white/5 shadow-2xl">
                                            {selectedContact.avatar ? <AvatarImage src={selectedContact.avatar} className="object-cover" /> : null}
                                            <AvatarFallback className="text-3xl font-black bg-white/5 text-slate-500">
                                                {selectedContact.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h4 className="font-black text-xl text-white uppercase tracking-tighter">{selectedContact.name}</h4>
                                            <p className="text-[10px] font-black text-nutrition-500 uppercase tracking-widest mt-1">
                                                {selectedContact.role}
                                            </p>
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                    </div>

                    {/* Messages List */}
                    <ScrollArea className="flex-1 p-8">
                        <div className="space-y-10">
                            {currentMessages.map((msg) => {
                                const isMe = msg.senderId === "me";
                                return (
                                    <div key={msg.id} className={cn("flex flex-col group/msg", isMe ? "items-end" : "items-start animate-in slide-in-from-left duration-500")}>
                                        <div className={cn(
                                            "max-w-[75%] rounded-[2rem] p-6 shadow-2xl relative transition-all duration-300",
                                            isMe
                                                ? "bg-nutrition-600 text-white rounded-tr-none hover:bg-nutrition-500 shadow-nutrition-500/10"
                                                : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5 hover:border-white/10"
                                        )}>
                                            <p className="text-sm font-medium leading-[1.6]">{msg.content}</p>
                                            <div className={cn(
                                                "flex items-center gap-2 mt-4",
                                                isMe ? "justify-end text-white/40" : "justify-start text-slate-600"
                                            )}>
                                                <span className="text-[9px] font-tech font-black tracking-widest uppercase">{msg.time}</span>
                                                {isMe && (
                                                    <CheckCheck className={cn(
                                                        "h-3.5 w-3.5",
                                                        msg.status === "read" ? "text-white" : "text-white/20"
                                                    )} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-10" />
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-8 bg-[#151F32]/50 backdrop-blur-md border-t border-white/5">
                        <div className="bg-white/[0.03] rounded-[2.5rem] p-3 flex items-end gap-3 border border-white/5 shadow-inner">
                            <div className="flex items-center gap-1 p-1">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5">
                                            <Smile className="h-7 w-7" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-min p-4 rounded-[2rem] bg-[#151F32] border-white/10 shadow-2xl" side="top" align="start">
                                        <div className="grid grid-cols-4 gap-2">
                                            {EMOJIS.map(e => (
                                                <button key={e} onClick={() => handleEmojiSelect(e)} className="h-12 w-12 flex items-center justify-center text-2xl hover:bg-white/5 rounded-[1rem] transition-all active:scale-90">{e}</button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-7 w-7" /></Button>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-7 w-7" /></Button>
                            </div>
                            <textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 px-2 text-sm font-medium text-white placeholder:text-slate-600 max-h-32 min-h-[44px]"
                                rows={1}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim() || isLoadingData}
                                className="h-14 w-14 rounded-full bg-nutrition-500 hover:bg-nutrition-400 shadow-xl shadow-nutrition-500/20 text-white shrink-0 active:scale-90 transition-all p-0 flex items-center justify-center"
                            >
                                <Send className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-nutrition-500/5 to-transparent pointer-events-none" />
                    <div className="h-28 w-28 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner animate-pulse">
                        <MessageSquare className="h-12 w-12 text-slate-700" />
                    </div>
                    <p className="font-black text-xl text-slate-500 uppercase tracking-tighter mt-8">Selecciona una conversación</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2">La nutrición inteligente empieza aquí</p>
                </div>
            )}
        </div>
    );
}
