import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { Building2, Mail, MessageCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
    const { signInWithGoogle } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleGoogleSignIn() {
        setError(null);
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError(null);
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup was blocked. Please allow popups for this site.');
            } else {
                setError('Sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    function handleDummyLogin(provider) {
        setError(`Sign in with ${provider} is not configured yet.`);
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-icon">
                    <Building2 size={40} />
                </div>
                <h1 className="login-title">PropTrack</h1>
                <p className="login-subtitle">
                    Malaysian Property Management — rent, taxes, maintenance & more.
                </p>

                <div className="auth-providers">
                    <button className="btn-provider" onClick={() => handleDummyLogin('Email')} disabled={loading}>
                        <Mail size={20} color="#333" />
                        Continue with Email
                    </button>

                    <div className="provider-divider">or</div>

                    <button className="btn-provider" onClick={() => handleDummyLogin('WhatsApp')} disabled={loading}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        Continue with WhatsApp
                    </button>

                    <button className="btn-provider" onClick={handleGoogleSignIn} disabled={loading}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <button className="btn-provider" onClick={() => handleDummyLogin('Facebook')} disabled={loading}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Continue with Facebook
                    </button>

                    <button className="btn-provider" onClick={() => handleDummyLogin('Apple')} disabled={loading}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#000000" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.36 14.4c-.66.36-1.55.57-2.39.57-1.12 0-2.12-.29-2.92-.81-1.11-.73-1.84-2.16-1.84-3.69 0-2.3 1.83-4.16 4.12-4.16 1.09 0 2.06.42 2.78 1.1l-1.3 1.31c-.4-.4-.9-.63-1.48-.63-1.28 0-2.33 1.04-2.33 2.38s1.05 2.38 2.33 2.38c.61 0 1.15-.22 1.56-.59.51-.45.83-1.07.93-1.74h-2.49v-1.77h4.35c.04.28.06.58.06.88 0 1.48-.56 2.84-1.48 3.86-.44.47-.95.84-1.52 1.12z" />
                        </svg>
                        Continue with Apple
                    </button>
                </div>

                {error && <p className="login-error">{error}</p>}

                <p className="login-footer">
                    Your data is stored securely in the cloud and syncs across all your devices.
                </p>
            </div>
        </div>
    );
}
