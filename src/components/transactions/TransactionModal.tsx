import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import type { Transaction } from '../../types';
import Modal from '../ui/Modal';
import TransactionDetails from './TransactionDetails';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export default function TransactionModal({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  const { removeTransaction } = useAppData();
  const notify = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setConfirming(false), [txn]);

  const remove = async () => {
    if (!txn) return;
    if (!confirming) return setConfirming(true);
    setBusy(true);
    try {
      await removeTransaction(txn.id);
      notify(`Transaction ${txn.id} deleted`, 'info');
      onClose();
    } catch (e) {
      notify(`Delete failed: ${e instanceof Error ? e.message : 'unknown error'}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!txn}
      onClose={onClose}
      title="Transaction details"
      subtitle={txn?.id}
      footer={
        <>
          <button className={`btn mr-auto ${confirming ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'}`} onClick={remove} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {confirming ? 'Click again to delete' : 'Delete'}
          </button>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </>
      }
    >
      {txn && <TransactionDetails txn={txn} />}
    </Modal>
  );
}
