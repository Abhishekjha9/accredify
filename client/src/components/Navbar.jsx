import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 50
        }}>
            <div className="container flex-between" style={{ height: '4rem' }}>
                <Link
                    to="/"
                    className="flex-center"
                    style={{ gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}
                >
                    <div style={{
                        background: 'var(--primary)',
                        padding: '0.25rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <ShieldCheck size={24} color="white" />
                    </div>
                    Accredify
                </Link>

                {isAuthenticated ? (
                    <div className="flex-center" style={{ gap: '1.5rem' }}>
                        <div className="flex-center" style={{ gap: '0.75rem' }}>
                            <div
                                className="flex-center"
                                style={{
                                    background: 'var(--bg-card)',
                                    width: '2.25rem',
                                    height: '2.25rem',
                                    borderRadius: '50%',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <User size={16} color="var(--text-muted)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span className={`badge ${user.role === 'client' ? 'badge-primary' : 'badge-success'}`} style={{ padding: '0 0.5rem', fontSize: '0.65rem' }}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', borderRadius: '50%' }}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex-center" style={{ gap: '1rem' }}>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Log in</Link>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign up</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
