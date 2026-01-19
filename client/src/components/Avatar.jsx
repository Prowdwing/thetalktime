import React from 'react';
import { API_URL } from '../config';

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

export default function Avatar({ user, size = 'md', className = '' }) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-24 h-24 text-3xl',
        '2xl': 'w-32 h-32 text-4xl'
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const getColor = (name) => {
        if (!name) return COLORS[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return COLORS[Math.abs(hash) % COLORS.length];
    };

    const hasImage = user?.avatar && user.avatar !== 'default_avatar.png';

    return (
        <div
            className={`relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm border border-black/5 dark:border-white/10 ${sizeClasses[size] || sizeClasses.md} ${hasImage ? 'bg-gray-100' : getColor(user?.displayName)} ${className}`}
            style={{
                width: size === '2xl' ? '8rem' : size === 'xl' ? '6rem' : size === 'lg' ? '3.5rem' : size === 'md' ? '2.5rem' : size === 'sm' ? '2rem' : '1.5rem',
                height: size === '2xl' ? '8rem' : size === 'xl' ? '6rem' : size === 'lg' ? '3.5rem' : size === 'md' ? '2.5rem' : size === 'sm' ? '2rem' : '1.5rem',
            }}
        >
            {hasImage ? (
                <img
                    src={user.avatar.startsWith('http') || user.avatar.startsWith('blob:') ? user.avatar : `${API_URL}/uploads/${user.avatar}`}
                    alt={user.username || 'avatar'}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add(getColor(user?.displayName)); e.target.parentElement.innerText = getInitials(user?.displayName); }}
                />
            ) : (
                <span>{getInitials(user?.displayName)}</span>
            )}
        </div>
    );
}
