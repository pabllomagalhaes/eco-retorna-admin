import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const btnVariants = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center gap-3.5 mb-4">
          <div
            className={`p-3 rounded-xl ${
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">EcoRetorna Operação</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50 ${btnVariants[variant]}`}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
