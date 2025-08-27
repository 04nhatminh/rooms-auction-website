// src/components/AuthPopup/AuthPopup.js
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './AuthPopup.css';

const API_BASE_URL =
    (process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '')) || 'http://localhost:3000';

    export default function AuthPopup({ open, onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // GSI init
    useEffect(() => {
        if (!open) return;
        const initializeGoogleLogin = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
            client_id: '643314900099-kcoo1iev0g768of4am5mc6n78c1bgqin.apps.googleusercontent.com',
            callback: handleCredentialResponse,
            ux_mode: 'popup',
            });
        }
        };
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleLogin;
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    }, [open, onClose]);

    const getStorage = () => (rememberMe ? window.localStorage : window.sessionStorage);
    const getOtherStorage = () => (rememberMe ? window.sessionStorage : window.localStorage);

    const persistUser = (user, token) => {
        try {
        getOtherStorage().removeItem('userData');
        getOtherStorage().removeItem('token');
        } catch {}
        const stash = getStorage();
        const userData = {
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        id: user.id,
        role: user.role,
        _ts: Date.now(),
        };
        stash.setItem('userData', JSON.stringify(userData));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (!email || !password) {
        alert('Vui lòng nhập đầy đủ email và mật khẩu!');
        return;
        }
        try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            persistUser(data.user, data.token);
            onSuccess?.(data.user);
            onClose?.();
        } else if (data.needsVerification) {
            const resend = window.confirm(`❌ ${data.message}\n\nBạn có muốn gửi lại email xác thực không?`);
            if (resend) {
            try {
                const resendRes = await fetch(`${API_BASE_URL}/user/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: data.email || email }),
                });
                const resendData = await resendRes.json();
                alert(resendData.message);
            } catch (err) {
                alert('Lỗi gửi email: ' + err.message);
            }
            }
        } else {
            alert('❌ ' + (data.message || 'Đăng nhập thất bại'));
        }
        } catch (err) {
        alert('❌ Lỗi kết nối: ' + err.message);
        } finally {
        setLoading(false);
        }
    };

    const handleCredentialResponse = async (response) => {
        const id_token = response.credential;
        try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/auth/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_token }),
        });
        const data = await res.json();
        if (res.ok) {
            persistUser(data.user, data.token);
            onSuccess?.(data.user);
            onClose?.();
        } else {
            alert('❌ Đăng nhập Google thất bại: ' + (data.message || 'Unknown error'));
        }
        } catch (err) {
        alert('❌ Lỗi kết nối đến server: ' + err.message);
        } finally {
        setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (window.google) window.google.accounts.id.prompt();
    };

    if (!open) return null;

    return createPortal(
        <div className="auth-backdrop" onClick={onClose}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="auth-title">Đăng nhập để tiếp tục</h3>
            <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">Email</label>
            <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <label className="auth-label">Mật khẩu</label>
            <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <div className="auth-row">
                <label className="auth-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Ghi nhớ đăng nhập
                </label>
                <button type="button" className="auth-link" onClick={() => { onClose?.(); window.location.href = '/forgot-password'; }}>
                Quên mật khẩu
                </button>
            </div>

            <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Đang xử lý…' : 'Đăng nhập'}
            </button>
            </form>

            <div className="auth-divider"><span>Hoặc</span></div>

            <button className="auth-btn auth-btn-ghost" type="button" onClick={handleGoogleLogin} disabled={loading}>
            Đăng nhập với Google
            </button>

            <div className="auth-footer">
            Chưa có tài khoản?{' '}
            <a href="/signup" onClick={(e) => { e.preventDefault(); onClose?.(); window.location.href = '/signup'; }}>
                Tạo tài khoản
            </a>
            </div>
        </div>
        </div>,
        document.body
    );
}
