import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './SlidePanel.css';

/**
 * A right-side slide-out panel for displaying details or forms without losing page context.
 * 
 * @param {boolean} isOpen - Whether the panel is open
 * @param {function} onClose - Function to call when closing
 * @param {string} title - The title in the header
 * @param {ReactNode} children - The content
 * @param {string} width - Optional width css value (default 600px)
 */
export default function SlidePanel({ isOpen, onClose, title, children, width = '600px' }) {
    const [isRendered, setIsRendered] = useState(isOpen);

    // Handle mounting animation delays to allow CSS transitions
    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Prevent body scroll when open
            document.body.style.overflow = 'hidden';
        } else {
            // When closing, wait for animation to finish before unmounting
            const timer = setTimeout(() => {
                setIsRendered(false);
                document.body.style.overflow = 'unset';
            }, 300); // 300ms matches the CSS transition time
            return () => clearTimeout(timer);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div className={`slide-panel-overlay ${isOpen ? 'open' : 'closing'}`} onClick={onClose}>
            <div
                className={`slide-panel-container ${isOpen ? 'open' : 'closing'}`}
                style={{ width, maxWidth: '100vw' }}
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking panel
            >
                <div className="slide-panel-header">
                    <h2>{title}</h2>
                    <button className="slide-panel-close-btn" onClick={onClose} aria-label="Close panel">
                        <X size={24} />
                    </button>
                </div>
                <div className="slide-panel-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
