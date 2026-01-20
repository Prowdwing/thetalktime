import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { API_URL } from '../config';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', displayName: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Handle OAuth Callback (Token in URL)
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Fetch user data with token
            fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(user => {
                    login(token, user);
                    navigate('/');
                })
                .catch(() => setError('Failed to verify login'));
        }

        if (searchParams.get('error')) {
            setError('Login failed. Please try again.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            if (isLogin) {
                login(data.token, data.user);
                navigate('/');
            } else {
                setIsLogin(true);
                alert('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleOAuth = (provider) => {
        // Redirect to backend auth route
        window.location.href = `${API_URL}/api/auth/${provider}`;
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-app)] p-4 overflow-hidden relative">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                        thetalktime
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </p>
                </div>

                <div className="bg-[var(--bg-panel)] rounded-2xl shadow-xl border border-[var(--border)] p-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleOAuth('google')}
                            className="flex justify-center items-center gap-2 py-2.5 px-4 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Google
                        </button>
                        <button
                            onClick={() => handleOAuth('discord')}
                            className="flex justify-center items-center gap-2 py-2.5 px-4 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors font-medium text-sm shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 14.397 14.397 0 0 0-.62 1.258 18.375 18.375 0 0 0-5.464 0 14.382 14.382 0 0 0-.62-1.258.072.072 0 0 0-.079-.037A19.503 19.503 0 0 0 3.682 9.278.077.077 0 0 0 3.682 9.278l.006.012c0 .012 3.518 5.438 3.518 5.438s.075 4.37.075 4.37A15.98 15.98 0 0 0 16 19.821a.072.072 0 0 0 .041-.093 18.892 18.892 0 0 0-4.811-3.686.074.074 0 0 0-.083.029c-.198.243-.399.479-.607.712a.077.077 0 0 1-.107.01C7.817 15.65 4.14 13.565 4.14 13.565 " /> </svg>
                            Discord
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px bg-[var(--border)] flex-1"></div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Or</span>
                        <div className="h-px bg-[var(--border)] flex-1"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="input pl-10"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="username"
                                    className="input pl-10"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input pl-10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary w-full mt-4" type="submit">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-[var(--text-muted)]">
                    {isLogin ? "New here? " : "Already have an account? "}
                    <button
                        className="text-[var(--primary)] font-semibold hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Create account' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
