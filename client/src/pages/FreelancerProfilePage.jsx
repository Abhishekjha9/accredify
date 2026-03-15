import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Shield, TrendingUp, AlertTriangle, MessageCircle, FolderOpen } from 'lucide-react';

const FreelancerProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await usersAPI.getUserProfile(id);
                setProfile(res.data);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load profile');
                navigate('/freelancers');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    useEffect(() => {
        if (!id || user?.role !== 'client') return;
        usersAPI.getFreelancerProjects(id)
            .then((res) => setProjects(res.data || []))
            .catch(() => setProjects([]));
    }, [id, user?.role]);

    const handleMessage = () => {
        navigate(`/messages?with=${id}`);
    };

    if (loading) return <div className="dashboard-layout"><div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--flux-text-muted)' }}>Loading profile…</div></div>;
    if (!profile) return null;

    const shortId = profile._id ? String(profile._id).slice(-6) : '';

    return (
        <div className="dashboard-layout">
            <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: 720 }}>
                <button
                    onClick={() => navigate('/freelancers')}
                    className="btn btn-secondary"
                    style={{ gap: '0.5rem', marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.9375rem' }}
                >
                    <ArrowLeft size={16} /> Back to Freelancers
                </button>

                <div className="flux-card" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                        <div className="flex-center" style={{ gap: '1rem' }}>
                            <div className="navbar-flux-avatar" style={{ width: '4rem', height: '4rem', background: 'var(--flux-main-bg)' }}>
                                <User size={32} color="var(--flux-text-muted)" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--flux-text)', marginBottom: '0.25rem' }}>{profile.name}</h1>
                                <div style={{ fontSize: '0.9375rem', color: 'var(--flux-text-muted)' }}>Freelancer · ID: {shortId}</div>
                            </div>
                        </div>
                        {user?.role === 'client' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={handleMessage}
                            >
                                <MessageCircle size={20} /> Message
                            </button>
                        )}
                    </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>Scores</h2>
                <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Trust Score</span>
                            <Shield size={20} color="var(--flux-accent)" />
                        </div>
                        <div className="flux-metric">{profile.trustScore ?? '—'}</div>
                        <div className="flux-metric-sub">Good standing</div>
                    </motion.div>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Scope Discipline</span>
                            <TrendingUp size={20} color="var(--flux-purple)" />
                        </div>
                        <div className="flux-metric">{profile.scopeDiscipline ?? '—'}%</div>
                        <div className="flux-metric-sub">Adherence to scope</div>
                    </motion.div>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Scope Creep Index</span>
                            <AlertTriangle size={20} color="var(--flux-text-muted)" />
                        </div>
                        <div className="flux-metric">{profile.scopeCreepIndex ?? '—'}</div>
                        <div className="flux-metric-sub">Historical scope shifts</div>
                    </motion.div>
                </div>

                {user?.role === 'client' && projects.length > 0 && (
                    <>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>Projects with this freelancer</h2>
                        <div className="flux-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.75rem' }}>Ongoing</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                {projects.filter((p) => p.status === 'active').length === 0 ? (
                                    <li style={{ color: 'var(--flux-text-muted)', fontSize: '0.9375rem' }}>No active projects</li>
                                ) : (
                                    projects.filter((p) => p.status === 'active').map((p) => (
                                        <li key={p._id} style={{ marginBottom: '0.5rem' }}>
                                            <Link to={`/projects/${p._id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
                                                <FolderOpen size={18} style={{ flexShrink: 0 }} /> {p.title} · Active
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.75rem' }}>Past projects</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {projects.filter((p) => p.status !== 'active').length === 0 ? (
                                    <li style={{ color: 'var(--flux-text-muted)', fontSize: '0.9375rem' }}>No past projects</li>
                                ) : (
                                    projects.filter((p) => p.status !== 'active').map((p) => (
                                        <li key={p._id} style={{ marginBottom: '0.5rem' }}>
                                            <Link to={`/projects/${p._id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
                                                <FolderOpen size={18} style={{ flexShrink: 0 }} /> {p.title} · {p.status}
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FreelancerProfilePage;
