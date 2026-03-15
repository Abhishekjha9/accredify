import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, ChevronDown, UserCircle } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
        navigate('/login');
    };

    const shortId = user?.id ? String(user.id).slice(-6) : '';

    return (
        <nav className="navbar-flux">
            <div className="navbar-flux-inner">
                <Link to="/" className="navbar-flux-logo">
                    <span className="navbar-flux-logo-icon">
                        <ShieldCheck size={22} color="#84cc16" />
                    </span>
                    <span>Accredify</span>
                </Link>

                {isAuthenticated ? (
                    <div className="navbar-flux-profile-wrap" ref={dropdownRef}>
                        <button
                            type="button"
                            className="navbar-flux-profile-trigger"
                            onClick={() => setDropdownOpen((o) => !o)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="true"
                        >
                            <div className="navbar-flux-avatar">
                                <User size={18} color="var(--flux-text-muted)" />
                            </div>
                            <div className="navbar-flux-user">
                                <span className="navbar-flux-name">{user.name}</span>
                                <span className="navbar-flux-role">{user.role}</span>
                            </div>
                            <ChevronDown size={18} color="var(--flux-text-muted)" style={{ flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {dropdownOpen && (
                            <div className="navbar-flux-dropdown">
                                <div className="navbar-flux-dropdown-id">ID: {shortId}</div>
                                <Link to="/profile" className="navbar-flux-dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <UserCircle size={18} /> Profile
                                </Link>
                                <button type="button" className="navbar-flux-dropdown-item navbar-flux-dropdown-logout" onClick={handleLogout}>
                                    <LogOut size={18} /> Log out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-center" style={{ gap: '1rem' }}>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Log in</Link>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--flux-accent)' }}>Sign up</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
