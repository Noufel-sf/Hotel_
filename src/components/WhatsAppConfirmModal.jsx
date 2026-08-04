import React from 'react';
import Modal from './Modal.jsx';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppConfirmModal({ order, onClose, onConfirm }) {
  if (!order) return null;
  return (
    <Modal open={!!order} onClose={onClose} title="Send voucher via WhatsApp" maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <MessageCircle size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-ink-700">
            This will simulate sending the voucher for <span className="font-semibold text-ink-900">{order.id}</span> to{' '}
            <span className="font-semibold text-ink-900">{order.customer.firstName} {order.customer.lastName}</span> at{' '}
            <span className="font-medium text-ink-900">{order.customer.phone}</span>.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-700 hover:bg-ink-900/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(order.id)}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Send voucher
        </button>
      </div>
    </Modal>
  );
}
