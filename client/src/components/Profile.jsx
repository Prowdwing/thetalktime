import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('displayName', displayName);
        if (file) formData.append('avatar', file);

        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                updateProfile(data);
                alert('Profile updated!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 flex items-center justify-center h-full">
            <div className="glass-panel p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>

                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--primary)] shadow-lg relative cursor-pointer group">
                        {file ?
                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" /> :
                            (user?.avatar && user.avatar !== 'default_avatar.png' ?
                                <img src={`${API_URL}/uploads/${user.avatar}`} className="w-full h-full object-cover" /> :
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl font-bold">{user?.displayName[0]}</div>
                            )
                        }
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change</span>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} accept="image/*" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium ml-1">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="input"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Save Changes</button>
                </form>
            </div>
        </div>
    );
}
