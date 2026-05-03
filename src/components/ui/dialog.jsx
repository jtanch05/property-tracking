import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import '../common/Modal.css';

export function Dialog({
    open,
    onOpenChange,
    title,
    children,
    footer,
    size = 'md',
    className,
}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape' && open) onOpenChange(false);
        }

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onOpenChange]);

    if (!open) return null;

    function handleOverlayClick(e) {
        if (e.target === overlayRef.current) onOpenChange(false);
    }

    return createPortal(
        <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className={cn(`modal-container modal-${size} animate-slide-up`, className)}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </Button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>,
        document.body
    );
}
