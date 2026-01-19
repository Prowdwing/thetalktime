import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Save, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [msg, setMsg] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');

        const formData = new FormData();
        formData.append('displayName', displayName);
        if (file) {
            formData.append('avatar', file);
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });

            if (res.ok) {
                const updatedUser = await res.json();
                updateProfile(updatedUser);
                setMsg('Profile updated!');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setMsg('Failed to update profile');
            }
        } catch (err) {
            setMsg('Error updating profile');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] relative overflow-hidden">
            {/* Header */}
            <div className="h-48 bg-gradient-to-r from-blue-600 to-cyan-500 w-full relative">
                <button onClick={() => navigate('/')} className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="absolute bottom-4 left-6 text-white text-3xl font-bold tracking-tight">Profile Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="max-w-xl mx-auto -mt-16 relative z-10">
                    <div className="bg-[var(--bg-panel)] rounded-2xl shadow-xl border border-[var(--border)] p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">

                            {/* Avatar Upload */}
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-full border-4 border-[var(--bg-panel)] shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (user?.avatar && user.avatar !== 'default_avatar.png' ? (
                                        <img src={`${API_URL}/uploads/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                            {user?.displayName?.[0]}
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            <div className="w-full space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={`@${user?.username}`}
                                        disabled
                                        className="w-full p-3 rounded-xl bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border)] focus:outline-none cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            className="input pl-10"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                <Save size={18} /> Save Changes
                            </button>

                            {msg && <p className={`text-sm font-medium ${msg.includes('Failed') || msg.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
