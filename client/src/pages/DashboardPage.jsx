import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import { Plus, FolderOpen, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';

const DashboardPage = () => {
    const { user } = useAuth();
    const isFreelancer = user.role === 'freelancer';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // In a real scenario, this endpoint fetches projects where the user is either the freelancer or client
        // Our backend currently doesn't have `GET /api/projects` configured to fetch list, you created it as a placeholder.
        // If getting all projects route doesn't exist, we will mock empty list and let user create one.
        const fetchProjects = async () => {
            try {
                const res = await projectAPI.getUserProjects();
                // Fallback robust check in case backend returns unexpected wrapper
                if (res.success && res.data) {
                    setProjects(res.data);
                } else if (Array.isArray(res.data)) {
                    setProjects(res.data);
                } else {
                    setProjects([]);
                }
            } catch (err) {
                console.error("Failed to fetch projects (endpoint might not exist yet)", err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleProjectCreated = (newProject) => {
        setProjects([newProject, ...projects]);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="badge badge-primary">Active</span>;
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'draft': return <span className="badge badge-neutral">Draft</span>;
            default: return null;
        }
    };

    return (
        <div className="dashboard-layout">
            <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1280 }}>
                {/* Header */}
                <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.125rem', fontWeight: 700, color: 'var(--flux-text)', marginBottom: '0.35rem' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: 'var(--flux-text-muted)', fontSize: '1rem' }}>
                            Take control of your projects today!
                        </p>
                    </div>
                    {isFreelancer && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                            style={{ background: 'var(--flux-accent)', color: '#1a1d24' }}
                        >
                            <Plus size={18} /> New Project
                        </button>
                    )}
                </div>

                {/* Metric Cards (flux-style) */}
                <div className="grid-cards" style={{ marginBottom: '1.75rem' }}>
                    <motion.div
                        className="flux-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Trust Score</span>
                            <Shield size={20} color="var(--flux-accent)" />
                        </div>
                        <div className="flux-metric">{user.trustScore}</div>
                        <div className="flux-metric-sub" style={{ color: 'var(--flux-accent)' }}>Good standing</div>
                    </motion.div>

                    {isFreelancer && (
                        <motion.div
                            className="flux-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                <span className="flux-card-title">Scope Discipline</span>
                                <TrendingUp size={20} color="var(--flux-purple)" />
                            </div>
                            <div className="flux-metric">{user.scopeDiscipline}%</div>
                            <div className="flux-metric-sub">Adherence to scope</div>
                        </motion.div>
                    )}

                    <motion.div
                        className="flux-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="flux-card-title">Scope Creep Index</span>
                            <AlertTriangle size={20} color="var(--flux-text-muted)" />
                        </div>
                        <div className="flux-metric">{user.scopeCreepIndex}</div>
                        <div className="flux-metric-sub">Historical scope shifts</div>
                    </motion.div>
                </div>

                {/* Projects */}
                <h2 style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.85rem' }}>
                    {isFreelancer ? 'Your Projects' : 'Projects to Review'}
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--flux-text-muted)' }}>Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="flux-card flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', textAlign: 'center' }}>
                        <FolderOpen size={48} color="var(--flux-text-muted)" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--flux-text)' }}>No projects yet</h3>
                        <p style={{ color: 'var(--flux-text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                            {isFreelancer
                                ? "You haven't created any projects. Start a new scope agreement with your client."
                                : "You have no assigned projects. A freelancer needs to create one for you."}
                        </p>
                        {isFreelancer && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsModalOpen(true)}
                                style={{ background: 'var(--flux-accent)', color: '#1a1d24' }}
                            >
                                <Plus size={18} /> New Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid-cards">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                className="flux-card"
                                style={{ display: 'flex', flexDirection: 'column' }}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            >
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    {getStatusBadge(project.status)}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--flux-text-muted)' }}>
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--flux-text)', marginBottom: '0.5rem' }}>
                                    {project.title}
                                </h3>
                                <p style={{ fontSize: '0.9375rem', color: 'var(--flux-text-muted)', marginBottom: '1rem', flex: 1 }}>
                                    Deliverables: {project.scopeChecklist?.length || 0} items · Revisions: {project.revisionsUsed}/{project.revisionLimit}
                                </p>
                                <Link
                                    to={`/projects/${project._id}`}
                                    className="btn btn-secondary"
                                    style={{
                                        width: '100%',
                                        borderColor: 'var(--flux-text-muted)',
                                        color: 'var(--flux-text)',
                                        borderRadius: 'var(--flux-radius-sm)'
                                    }}
                                >
                                    View Project Details
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                <CreateProjectModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onProjectCreated={handleProjectCreated}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
