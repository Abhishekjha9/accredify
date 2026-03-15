import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import { Shield, TrendingUp, AlertTriangle, User, FolderOpen } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const shortId = user?.id ? String(user.id).slice(-6) : '';

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectAPI.getUserProjects();
                if (res.success && res.data) setProjects(res.data);
                else if (Array.isArray(res.data)) setProjects(res.data);
                else setProjects([]);
            } catch {
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const ongoingProjects = projects.filter((p) => p.status === 'active');

    return (
        <div className="dashboard-layout">
            <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1280 }}>
                <h1 style={{ fontSize: '2.125rem', fontWeight: 700, color: 'var(--flux-text)', marginBottom: '0.35rem' }}>
                    Profile
                </h1>
                <p style={{ color: 'var(--flux-text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    Your account and performance at a glance.
                </p>

                <div className="flux-card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="flex-center" style={{ gap: '1rem' }}>
                            <div className="navbar-flux-avatar" style={{ width: '3rem', height: '3rem', background: 'var(--flux-main-bg)' }}>
                                <User size={24} color="var(--flux-text-muted)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.9375rem', color: 'var(--flux-text-muted)' }}>{user?.email}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--flux-text-muted)', marginTop: '0.25rem' }}>
                                    ID: {shortId} · {user?.role}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>
                    Scores
                </h2>
                <div className="grid-cards" style={{ marginBottom: '1.75rem' }}>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Trust Score</span>
                            <Shield size={20} color="var(--flux-accent)" />
                        </div>
                        <div className="flux-metric">{user?.trustScore ?? '—'}</div>
                        <div className="flux-metric-sub">Good standing</div>
                    </motion.div>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Scope Discipline</span>
                            <TrendingUp size={20} color="var(--flux-purple)" />
                        </div>
                        <div className="flux-metric">{user?.scopeDiscipline ?? '—'}%</div>
                        <div className="flux-metric-sub">Adherence to scope</div>
                    </motion.div>
                    <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Scope Creep Index</span>
                            <AlertTriangle size={20} color="var(--flux-text-muted)" />
                        </div>
                        <div className="flux-metric">{user?.scopeCreepIndex ?? '—'}</div>
                        <div className="flux-metric-sub">Historical scope shifts</div>
                    </motion.div>
                    {(user?.disputeRatio != null || user?.trustVelocity != null) && (
                        <>
                            {user?.disputeRatio != null && (
                                <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                        <span className="flux-card-title">Dispute Ratio</span>
                                    </div>
                                    <div className="flux-metric">{user.disputeRatio}</div>
                                </motion.div>
                            )}
                            {user?.trustVelocity != null && (
                                <motion.div className="flux-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                        <span className="flux-card-title">Trust Velocity</span>
                                    </div>
                                    <div className="flux-metric">{user.trustVelocity}</div>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>
                    Ongoing projects
                </h2>
                {loading ? (
                    <div style={{ color: 'var(--flux-text-muted)' }}>Loading…</div>
                ) : ongoingProjects.length === 0 ? (
                    <div className="flux-card flex-center" style={{ flexDirection: 'column', padding: '3rem 2rem', textAlign: 'center' }}>
                        <FolderOpen size={40} color="var(--flux-text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                        <p style={{ color: 'var(--flux-text-muted)', marginBottom: '1rem' }}>No active projects.</p>
                        <Link to="/" className="btn btn-primary" style={{ background: 'var(--flux-accent)', color: '#1a1d24' }}>
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {ongoingProjects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                className="flux-card"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Active</span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.5rem' }}>
                                    {project.title}
                                </h3>
                                <p style={{ fontSize: '0.9375rem', color: 'var(--flux-text-muted)', marginBottom: '1rem' }}>
                                    Revisions: {project.revisionsUsed}/{project.revisionLimit}
                                </p>
                                <Link
                                    to={`/projects/${project._id}`}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', borderColor: 'var(--flux-text-muted)', color: 'var(--flux-text)', borderRadius: 'var(--flux-radius-sm)' }}
                                >
                                    View project
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
