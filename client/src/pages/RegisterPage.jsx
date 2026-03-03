import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Briefcase, UserCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client' // default
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, role } = formData;

        if (!name || !email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        const success = await register({ name, email, password, role });
        setIsSubmitting(false);

        if (success) {
            toast.success('Account created successfully!');
            navigate('/');
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            <motion.div
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', padding: '2rem', margin: '2rem 0' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join Accredify's trusted network</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex-center"
                        style={{
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            gap: '0.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        <ShieldAlert size={16} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Role selection - Custom UI instead of native select */}
                    <div className="input-group">
                        <label className="input-label" style={{ marginBottom: '0.5rem' }}>I am a...</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div
                                onClick={() => handleRoleSelect('client')}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${formData.role === 'client' ? 'var(--primary)' : 'var(--border)'}`,
                                    background: formData.role === 'client' ? 'var(--primary-light)' : 'var(--bg-dark)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Briefcase size={24} color={formData.role === 'client' ? 'var(--primary)' : 'var(--text-muted)'} />
                                <span style={{ fontWeight: formData.role === 'client' ? 600 : 400 }}>Client</span>
                            </div>

                            <div
                                onClick={() => handleRoleSelect('freelancer')}
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${formData.role === 'freelancer' ? 'var(--success)' : 'var(--border)'}`,
                                    background: formData.role === 'freelancer' ? 'var(--success-bg)' : 'var(--bg-dark)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <UserCheck size={24} color={formData.role === 'freelancer' ? 'var(--success)' : 'var(--text-muted)'} />
                                <span style={{ fontWeight: formData.role === 'freelancer' ? 600 : 400 }}>Freelancer</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="name">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <User size={18} />
                            </div>
                            <input
                                id="name"
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email address</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="Min. 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex-center" style={{ gap: '0.5rem' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                                />
                                Creating Account...
                            </span>
                        ) : (
                            <span className="flex-center" style={{ gap: '0.5rem' }}>
                                <UserPlus size={18} /> Create Account
                            </span>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Sign in</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
