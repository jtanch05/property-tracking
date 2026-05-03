import React from 'react';
import { Button, Dialog } from '../ui';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title={title || 'Confirm'}
            size="sm"
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </>
            )}
        >
            <p className="dialog-message">
                {message || 'Are you sure? This action cannot be undone.'}
            </p>
        </Dialog>
    );
}

