import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { conversationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MessageCircle, Send, User } from 'lucide-react';

const POLL_INTERVAL_MS = 4000;

const MessagesPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const withUserId = searchParams.get('with');

    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConv, setLoadingConv] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listEndRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const res = await conversationAPI.getConversations();
            setConversations(res.data || []);
        } catch {
            setConversations([]);
        } finally {
            setLoadingConv(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // When ?with=userId, get or create conversation and select it
    useEffect(() => {
        if (!withUserId || !user?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await conversationAPI.getOrCreateConversation(withUserId);
                if (cancelled) return;
                setSelectedConv(res.data);
                setMessages([]);
                fetchConversations();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start conversation');
            }
        })();
        return () => { cancelled = true; };
    }, [withUserId, user?.id]);

    const selectConversation = (conv) => {
        setSelectedConv(conv);
        setMessages([]);
    };

    useEffect(() => {
        if (!selectedConv?._id) return;
        setLoadingMessages(true);
        conversationAPI.getMessages(selectedConv._id)
            .then((res) => setMessages(res.data || []))
            .catch(() => setMessages([]))
            .finally(() => setLoadingMessages(false));
    }, [selectedConv?._id]);

    useEffect(() => {
        if (!selectedConv?._id) return;
        const interval = setInterval(() => {
            conversationAPI.getMessages(selectedConv._id)
                .then((res) => setMessages(res.data || []))
                .catch(() => {});
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [selectedConv?._id]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || !selectedConv || sending) return;
        setSending(true);
        try {
            const res = await conversationAPI.sendMessage(selectedConv._id, trimmed);
            setMessages((prev) => [...prev, res.data]);
            setInput('');
            listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            fetchConversations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send');
        } finally {
            setSending(false);
        }
    };

    const otherUser = selectedConv?.otherUser || selectedConv?.participants?.find((p) => String(p._id) !== String(user?.id));
    const isMe = (senderId) => senderId && user?.id && String(senderId._id || senderId) === String(user.id);

    return (
        <div
            className="messages-page-full"
            style={{
                position: 'fixed',
                top: '4rem',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                background: 'var(--flux-main-bg)',
                zIndex: 10,
            }}
        >
            {/* Conversation list */}
            <div
                style={{
                    width: 280,
                    minWidth: 280,
                    borderRight: '1px solid #e2e8f0',
                    background: 'var(--flux-card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: 'var(--flux-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageCircle size={22} color="var(--flux-text-muted)" /> Messages
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingConv ? (
                            <div style={{ padding: '1rem', color: 'var(--flux-text-muted)', fontSize: '0.875rem' }}>Loading…</div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: '1rem', color: 'var(--flux-text-muted)', fontSize: '0.875rem' }}>No conversations yet. Message a freelancer from Find Freelancers.</div>
                        ) : (
                            conversations.map((conv) => {
                                const other = conv.otherUser || conv.participants?.find((p) => String(p._id) !== String(user?.id));
                                const active = selectedConv?._id === conv._id;
                                return (
                                    <button
                                        type="button"
                                        key={conv._id}
                                        onClick={() => selectConversation(conv)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.25rem',
                                            border: 'none',
                                            borderBottom: '1px solid #e2e8f0',
                                            background: active ? 'var(--flux-main-bg)' : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                        }}
                                    >
                                        <div className="navbar-flux-avatar" style={{ width: '2.5rem', height: '2.5rem', background: 'var(--flux-main-bg)', flexShrink: 0 }}>
                                            <User size={18} color="var(--flux-text-muted)" />
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--flux-text)', fontSize: '0.9375rem' }}>{other?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--flux-text-muted)' }}>{other?.role === 'freelancer' ? 'Freelancer' : 'Client'}</div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

            {/* Thread */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--flux-main-bg)', minWidth: 0, overflow: 'hidden' }}>
                {!selectedConv ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--flux-text-muted)', fontSize: '1rem' }}>
                        Select a conversation or message a freelancer from Find Freelancers
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: 'var(--flux-card-bg)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            <div className="navbar-flux-avatar" style={{ width: '2.5rem', height: '2.5rem', background: 'var(--flux-main-bg)' }}>
                                <User size={18} color="var(--flux-text-muted)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--flux-text)' }}>{otherUser?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--flux-text-muted)' }}>{otherUser?.role === 'freelancer' ? 'Freelancer' : 'Client'}</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
                                {loadingMessages ? (
                                    <div style={{ color: 'var(--flux-text-muted)', fontSize: '0.875rem' }}>Loading messages…</div>
                                ) : messages.length === 0 ? (
                                    <div style={{ color: 'var(--flux-text-muted)', fontSize: '0.875rem' }}>No messages yet. Say hi!</div>
                                ) : (
                                    messages.map((msg) => {
                                        const me = isMe(msg.senderId);
                                        return (
                                            <div
                                                key={msg._id}
                                                style={{
                                                    alignSelf: me ? 'flex-end' : 'flex-start',
                                                    maxWidth: '80%',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: 'var(--flux-radius-sm)',
                                                    background: me ? 'var(--primary)' : 'var(--flux-card-bg)',
                                                    color: me ? '#fff' : 'var(--flux-text)',
                                                    border: me ? 'none' : '1px solid #e2e8f0',
                                                }}
                                            >
                                                <div style={{ fontSize: '0.7rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                                                    {msg.senderId?.name} · {msg.senderId?.role === 'client' ? 'Client' : 'Freelancer'}
                                                </div>
                                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={listEndRef} />
                            </div>
                            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: 'var(--flux-card-bg)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message…"
                                    maxLength={2000}
                                    style={{
                                        flex: 1,
                                        padding: '0.6rem 1rem',
                                        borderRadius: 'var(--flux-radius-sm)',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem',
                                        background: 'var(--flux-main-bg)',
                                        color: 'var(--flux-text)',
                                    }}
                                />
                                <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending} style={{ padding: '0.6rem 1rem' }}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    )}
            </div>
        </div>
    );
};

export default MessagesPage;
