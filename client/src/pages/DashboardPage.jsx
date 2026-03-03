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
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* Header & Metrics */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user.name}</p>
                    </div>
                    {isFreelancer && (
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} /> New Project
                        </button>
                    )}
                </div>

                {/* Global User Metrics Cards */}
                <div className="grid-cards" style={{ marginBottom: '3rem' }}>
                    <motion.div
                        className="glass-card"
                        style={{ padding: '1.5rem' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Trust Score</span>
                            <Shield size={20} color="var(--primary)" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{user.trustScore}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--success)' }}>Good standing</div>
                    </motion.div>

                    {isFreelancer && (
                        <motion.div
                            className="glass-card"
                            style={{ padding: '1.5rem' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Scope Discipline</span>
                                <TrendingUp size={20} color="var(--success)" />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{user.scopeDiscipline}%</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Adherence to scope</div>
                        </motion.div>
                    )}

                    <motion.div
                        className="glass-card"
                        style={{ padding: '1.5rem' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Scope Creep Index</span>
                            <AlertTriangle size={20} color="var(--warning)" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{user.scopeCreepIndex}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Historical scope shifts</div>
                    </motion.div>
                </div>
            </div>

            {/* Projects List */}
            <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    {isFreelancer ? 'Your Projects' : 'Projects to Review'}
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', textAlign: 'center' }}>
                        <FolderOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No projects yet</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                            {isFreelancer
                                ? "You haven't created any projects. Start a new scope agreement with your client."
                                : "You have no assigned projects. A freelancer needs to create one for you."}
                        </p>
                        {isFreelancer && (
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                <Plus size={18} /> New Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid-cards">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                className="glass-card"
                                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
                            >
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    {getStatusBadge(project.status)}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{project.title}</h3>

                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>
                                    Deliverables: {project.scopeChecklist?.length || 0} items
                                    <br />
                                    Revisions: {project.revisionsUsed} / {project.revisionLimit}
                                </p>

                                <Link to={`/projects/${project._id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                                    View Project Details
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
        </div>
    );
};

export default DashboardPage;
