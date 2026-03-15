import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, User, Shield, MessageCircle } from 'lucide-react';

const FreelancersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const fetchFreelancers = async () => {
            setLoading(true);
            try {
                const res = await usersAPI.getFreelancers(debouncedQuery);
                setFreelancers(res.data || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load freelancers');
                setFreelancers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFreelancers();
    }, [debouncedQuery]);

    return (
        <div className="dashboard-layout">
            <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: 900 }}>
                <h1 style={{ fontSize: '2.125rem', fontWeight: 700, color: 'var(--flux-text)', marginBottom: '0.35rem' }}>
                    Find Freelancers
                </h1>
                <p style={{ color: 'var(--flux-text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    Search by name and view profiles. Message to start a conversation.
                </p>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--flux-text-muted)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ paddingLeft: '2.75rem' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--flux-text-muted)', padding: '2rem' }}>Loading…</div>
                ) : freelancers.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--flux-text-muted)', padding: '2rem' }}>
                        No freelancers found. Try a different search.
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {freelancers.map((f, i) => (
                            <motion.li
                                key={f._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flux-card"
                                style={{ padding: '1.25rem 1.5rem' }}
                            >
                                <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                                    <div className="flex-center" style={{ gap: '1rem' }}>
                                        <div className="navbar-flux-avatar" style={{ width: '3rem', height: '3rem', background: 'var(--flux-main-bg)' }}>
                                            <User size={24} color="var(--flux-text-muted)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--flux-text)' }}>{f.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--flux-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                <Shield size={14} /> Trust: {f.trustScore ?? '—'} · Scope: {f.scopeDiscipline ?? '—'}%
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <Link
                                            to={`/freelancers/${f._id}`}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                        >
                                            View profile
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                            onClick={() => navigate(`/messages?with=${f._id}`)}
                                        >
                                            <MessageCircle size={18} /> Message
                                        </button>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FreelancersPage;
