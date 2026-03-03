import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, FileEdit, AlertCircle, Send, Check, Plus, Link as LinkIcon, Upload, ExternalLink, FileText, MessageSquare } from 'lucide-react';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isClient = user?.role === 'client';
    const isFreelancer = user?.role === 'freelancer';

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Change request state (client logs; freelancer marks scope)
    const [crData, setCrData] = useState({ description: '' });
    const [showCrForm, setShowCrForm] = useState(false);

    // Freelancer: scope marking (classify change request)
    const [classifyCrId, setClassifyCrId] = useState(null);
    const [classifyForm, setClassifyForm] = useState({ priceAdjustment: 0, timelineAdjustment: 0 });

    // Deliverable form state
    const [deliverableType, setDeliverableType] = useState('link');
    const [deliverableForm, setDeliverableForm] = useState({ title: '', link: '', description: '' });
    const [deliverableFile, setDeliverableFile] = useState(null);
    const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
    const [showDeliverableForm, setShowDeliverableForm] = useState(false);

    // Client: request revision state
    const [revisionDeliverableId, setRevisionDeliverableId] = useState(null);
    const [revisionFeedback, setRevisionFeedback] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await projectAPI.getProjectById(id);
                setProject(res.data);
            } catch (err) {
                toast.error('Failed to load project details');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, navigate]);

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve and activate this project?')) return;
        try {
            const res = await projectAPI.approveProject(id);
            setProject(res.data);
            toast.success('Project approved and active!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Approval failed');
        }
    };

    const incrementRevision = async () => {
        if (!window.confirm('Use 1 revision? This cannot be undone.')) return;
        try {
            const res = await projectAPI.incrementRevision(id);
            setProject(res.data);
            toast.success('Revision logged successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to increment revision');
        }
    };

    const submitChangeRequest = async (e) => {
        e.preventDefault();
        if (!crData.description.trim()) return toast.error('Description is required');

        try {
            await projectAPI.addChangeRequest(id, { description: crData.description.trim() });
            toast.success('Change request submitted');
            setShowCrForm(false);
            setCrData({ description: '' });
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit change request');
        }
    };

    const handleClassifyInScope = async (changeRequestId) => {
        try {
            await projectAPI.classifyChangeRequest(id, changeRequestId, { classification: 'in-scope' });
            toast.success('Marked as in-scope');
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to classify');
        }
    };

    const handleClassifyOutOfScope = async (e, changeRequestId) => {
        e.preventDefault();
        try {
            await projectAPI.classifyChangeRequest(id, changeRequestId, {
                classification: 'out-of-scope',
                priceAdjustment: classifyForm.priceAdjustment || 0,
                timelineAdjustment: classifyForm.timelineAdjustment || 0,
            });
            toast.success('Marked as out-of-scope');
            setClassifyCrId(null);
            setClassifyForm({ priceAdjustment: 0, timelineAdjustment: 0 });
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to classify');
        }
    };

    const submitDeliverable = async (e) => {
        e.preventDefault();
        if (deliverableType === 'link') {
            if (!deliverableForm.title.trim() || !deliverableForm.link.trim()) {
                toast.error('Title and link are required');
                return;
            }
        } else {
            if (!deliverableFile) {
                toast.error('Please select a file');
                return;
            }
        }
        setSubmittingDeliverable(true);
        try {
            if (deliverableType === 'file') {
                const formData = new FormData();
                formData.append('file', deliverableFile);
                formData.append('title', deliverableForm.title || deliverableFile.name);
                if (deliverableForm.description) formData.append('description', deliverableForm.description);
                await projectAPI.addDeliverable(id, formData);
            } else {
                await projectAPI.addDeliverable(id, {
                    title: deliverableForm.title.trim(),
                    link: deliverableForm.link.trim(),
                    description: deliverableForm.description.trim(),
                    type: 'link',
                });
            }
            toast.success('Deliverable submitted');
            setShowDeliverableForm(false);
            setDeliverableForm({ title: '', link: '', description: '' });
            setDeliverableFile(null);
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to submit deliverable');
        } finally {
            setSubmittingDeliverable(false);
        }
    };

    const handleAcceptDeliverable = async (deliverableId) => {
        try {
            await projectAPI.acceptDeliverable(id, deliverableId);
            toast.success('Deliverable accepted');
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept');
        }
    };

    const handleRequestRevision = async (e) => {
        e.preventDefault();
        if (!revisionDeliverableId) return;
        try {
            await projectAPI.requestDeliverableRevision(id, revisionDeliverableId, revisionFeedback);
            toast.success('Revision requested');
            setRevisionDeliverableId(null);
            setRevisionFeedback('');
            const res = await projectAPI.getProjectById(id);
            setProject(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request revision');
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading project...</div>;
    if (!project) return null;

    const revisionPercentage = (project.revisionsUsed / project.revisionLimit) * 100;
    let progressColor = 'var(--success)';
    if (revisionPercentage > 50) progressColor = 'var(--warning)';
    if (revisionPercentage >= 100) progressColor = 'var(--danger)';

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <button
                onClick={() => navigate('/')}
                className="btn-secondary flex-center"
                style={{ gap: '0.5rem', marginBottom: '2rem', padding: '0.5rem 1rem', border: 'none' }}
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            {/* Header */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>{project.title}</h1>
                    <div className="flex-center" style={{ gap: '1rem' }}>
                        <span className={`badge badge-${project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : 'neutral'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                            {project.status.toUpperCase()}
                        </span>
                        {isClient && project.status === 'draft' && (
                            <button className="btn btn-success" onClick={handleApprove}>
                                <CheckCircle size={18} /> Approve Project
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div><strong>Freelancer:</strong> {project.freelancerId?.name || project.freelancerId}</div>
                    <div><strong>Client:</strong> {project.clientId?.name || project.clientId}</div>
                    <div><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }} className="responsive-grid">
                {/* Left Column (Checklist & Details) */}
                <div>
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Scope Checklist</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {(project.scopeChecklist || []).map((item, index) => (
                                <li key={index} style={{ padding: '1rem', background: 'var(--bg-dark)', marginBottom: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--text-muted)', flexShrink: 0 }}></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Deliverables */}
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Deliverables</h2>
                            {isFreelancer && project.status === 'active' && (
                                <button type="button" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setShowDeliverableForm(!showDeliverableForm)}>
                                    <Plus size={16} /> Add Deliverable
                                </button>
                            )}
                        </div>

                        {showDeliverableForm && isFreelancer && project.status === 'active' && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}
                                onSubmit={submitDeliverable}
                            >
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <button type="button" className={`btn ${deliverableType === 'link' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => { setDeliverableType('link'); setDeliverableFile(null); }}>
                                        <LinkIcon size={16} /> Link
                                    </button>
                                    <button type="button" className={`btn ${deliverableType === 'file' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setDeliverableType('file')}>
                                        <Upload size={16} /> File (PDF, video, etc.)
                                    </button>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label className="input-label">Title</label>
                                    <input className="input-field" value={deliverableForm.title} onChange={(e) => setDeliverableForm(f => ({ ...f, title: e.target.value }))} placeholder={deliverableType === 'file' ? 'e.g. Final report' : 'e.g. Design mockups'} />
                                </div>
                                {deliverableType === 'link' ? (
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label className="input-label">URL</label>
                                        <input className="input-field" type="url" value={deliverableForm.link} onChange={(e) => setDeliverableForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
                                    </div>
                                ) : (
                                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                                        <label className="input-label">File</label>
                                        <input type="file" className="input-field" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp4,.webm,.mov,.mp3,.wav,.png,.jpg,.jpeg,.gif,.webp" onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)} />
                                    </div>
                                )}
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label className="input-label">Description (optional)</label>
                                    <textarea className="input-field" rows={2} value={deliverableForm.description} onChange={(e) => setDeliverableForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" style={{ resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={submittingDeliverable}><Send size={16} /> Submit</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowDeliverableForm(false); setDeliverableForm({ title: '', link: '', description: '' }); setDeliverableFile(null); }}>Cancel</button>
                                </div>
                            </motion.form>
                        )}

                        {(!project.deliverables || project.deliverables.length === 0) ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No deliverables yet.</div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {project.deliverables.map((d) => (
                                    <motion.li
                                        key={d._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ padding: '1rem', background: 'var(--bg-dark)', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    {d.type === 'file' ? <FileText size={16} color="var(--text-muted)" /> : <LinkIcon size={16} color="var(--text-muted)" />}
                                                    <strong>{d.title}</strong>
                                                    <span className={`badge badge-${d.status === 'accepted' ? 'success' : d.status === 'revision_requested' ? 'warning' : 'neutral'}`} style={{ fontSize: '0.7rem' }}>{d.status?.replace('_', ' ')}</span>
                                                </div>
                                                {d.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{d.description}</p>}
                                                <a href={d.link.startsWith('http') ? d.link : (d.link.startsWith('/') ? d.link : '/' + d.link)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                                                    {d.type === 'file' ? 'Open file' : 'Open link'} <ExternalLink size={14} />
                                                </a>
                                                {d.status === 'revision_requested' && d.clientFeedback && (
                                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--warning)', display: 'flex', gap: '0.5rem' }}>
                                                        <MessageSquare size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.875rem' }}>{d.clientFeedback}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {isClient && project.status === 'active' && d.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                    <button type="button" className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleAcceptDeliverable(d._id)}>
                                                        <Check size={14} /> Accept
                                                    </button>
                                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setRevisionDeliverableId(d._id)}>
                                                        Request revision
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Submitted {new Date(d.submittedAt).toLocaleString()}</div>
                                    </motion.li>
                                ))}
                            </ul>
                        )}

                        {revisionDeliverableId && (
                            <motion.form
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                onSubmit={handleRequestRevision}
                            >
                                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                                    <label className="input-label">What should be changed?</label>
                                    <textarea className="input-field" rows={3} value={revisionFeedback} onChange={(e) => setRevisionFeedback(e.target.value)} placeholder="Describe the requested changes..." style={{ resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}><Send size={14} /> Send request</button>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }} onClick={() => { setRevisionDeliverableId(null); setRevisionFeedback(''); }}>Cancel</button>
                                </div>
                            </motion.form>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Change Requests</h2>
                            {isClient && (
                                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setShowCrForm(!showCrForm)}>
                                    <Plus size={16} /> Log Change
                                </button>
                            )}
                        </div>

                        {showCrForm && isClient && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}
                                onSubmit={submitChangeRequest}
                            >
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label className="input-label">What changed? (Freelancer will mark in-scope or out-of-scope)</label>
                                    <textarea className="input-field" rows={3} value={crData.description} onChange={(e) => setCrData({ ...crData, description: e.target.value })} placeholder="Describe the change requested..." style={{ resize: 'vertical' }} />
                                </div>
                                <button type="submit" className="btn btn-primary"><Send size={16} /> Submit</button>
                            </motion.form>
                        )}

                        {(!project.changeRequests || project.changeRequests.length === 0) ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No change requests logged yet.</div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {project.changeRequests.map((cr) => (
                                    <motion.li
                                        key={cr._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ padding: '1rem', background: 'var(--bg-dark)', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                    >
                                        <p style={{ margin: '0 0 0.5rem 0' }}>{cr.description}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                            {cr.classification ? (
                                                <>
                                                    <span className={`badge badge-${cr.classification === 'out-of-scope' ? 'warning' : 'success'}`} style={{ fontSize: '0.75rem' }}>
                                                        {cr.classification === 'out-of-scope' ? 'Out-of-scope' : 'In-scope'}
                                                    </span>
                                                    {cr.classification === 'out-of-scope' && (cr.priceAdjustment || cr.timelineAdjustment) && (
                                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                            {cr.priceAdjustment ? `+$${cr.priceAdjustment} ` : ''}
                                                            {cr.timelineAdjustment ? `+${cr.timelineAdjustment} days` : ''}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>Pending scope marking</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(cr.createdAt).toLocaleString()}</div>
                                        {isFreelancer && !cr.classification && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleClassifyInScope(cr._id)}>
                                                    Mark in-scope
                                                </button>
                                                {classifyCrId === cr._id ? (
                                                    <form onSubmit={(e) => handleClassifyOutOfScope(e, cr._id)} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                                        <div className="input-group" style={{ margin: 0 }}>
                                                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Price ($)</label>
                                                            <input type="number" className="input-field" style={{ width: '80px', padding: '0.25rem 0.5rem' }} value={classifyForm.priceAdjustment || ''} onChange={(e) => setClassifyForm(f => ({ ...f, priceAdjustment: Number(e.target.value) || 0 }))} placeholder="0" />
                                                        </div>
                                                        <div className="input-group" style={{ margin: 0 }}>
                                                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Days</label>
                                                            <input type="number" className="input-field" style={{ width: '70px', padding: '0.25rem 0.5rem' }} value={classifyForm.timelineAdjustment || ''} onChange={(e) => setClassifyForm(f => ({ ...f, timelineAdjustment: Number(e.target.value) || 0 }))} placeholder="0" />
                                                        </div>
                                                        <button type="submit" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Mark out-of-scope</button>
                                                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setClassifyCrId(null); setClassifyForm({ priceAdjustment: 0, timelineAdjustment: 0 }); }}>Cancel</button>
                                                    </form>
                                                ) : (
                                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setClassifyCrId(cr._id)}>
                                                        Mark out-of-scope
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right Column (Sidebar / Revisions) */}
                <div>
                    <div className="glass-card" style={{ padding: '2rem', position: 'sticky', top: '5rem' }}>
                        <h2 className="flex-center" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', gap: '0.5rem', justifyContent: 'flex-start' }}>
                            <FileEdit size={20} /> Revision Tracker
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{project.revisionsUsed}</span>
                            <span style={{ color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>/ {project.revisionLimit} Used</span>
                        </div>

                        <div style={{ height: '8px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(revisionPercentage, 100)}%` }}
                                style={{ height: '100%', background: progressColor, borderRadius: '4px' }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>

                        {project.revisionsUsed >= project.revisionLimit ? (
                            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} /> Revision limit reached. Any further changes require an out-of-scope Change Request.
                            </div>
                        ) : (
                            !isClient && project.status === 'active' && (
                                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={incrementRevision}>
                                    <Check size={18} /> Log Revision
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @media (max-width: 768px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
        </div>
    );
};

export default ProjectDetailPage;
