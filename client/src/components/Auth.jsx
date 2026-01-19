import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Github, Circle } from 'lucide-react';
import { API_URL } from '../config';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', displayName: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

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
                setIsLogin(true); // Switch to login after register
                alert('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="glass-panel w-full max-w-md p-8 animate-fade-in relative z-10">
                <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    thetalktime
                </h1>
                <p className="text-center text-[var(--text-muted)] mb-8">
                    {isLogin ? 'Welcome back!' : 'Join the conversation today.'}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium ml-1">Display Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-muted)]" />
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
                        <label className="text-sm font-medium ml-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-muted)]" />
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
                        <label className="text-sm font-medium ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-muted)]" />
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

                    <button className="btn btn-primary w-full mt-6" type="submit">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px bg-[var(--border)] flex-1"></div>
                    <span className="text-xs text-[var(--text-muted)] font-medium uppercase">Or continue with</span>
                    <div className="h-px bg-[var(--border)] flex-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="btn btn-secondary flex items-center justify-center gap-2" type="button" onClick={() => alert('Mock Google Login')}>
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">G</div>
                        Google
                    </button>
                    <button className="btn btn-secondary flex items-center justify-center gap-2" type="button" onClick={() => alert('Mock Discord Login')}>
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white"><span className="text-xs">D</span></div>
                        Discord
                    </button>
                </div>

                <p className="text-center mt-8 text-sm text-[var(--text-muted)]">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="text-[var(--primary)] font-semibold hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
