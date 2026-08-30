import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  X,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  Sparkles,
  Users,
  Search
} from 'lucide-react';
import { authService } from '../services/auth';
import { VolunteerRequestItem } from '../types';

interface VolunteerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprovalsUpdated?: () => void;
}

export const VolunteerApprovalModal: React.FC<VolunteerApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprovalsUpdated,
}) => {
  const [requests, setRequests] = useState<VolunteerRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await authService.getVolunteerRequests();
      if (res && res.requests) {
        setRequests(res.requests);
      }
    } catch (e: any) {
      console.error('Failed to fetch volunteer requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleApprove = async (userId: number, name: string) => {
    setActionLoadingId(userId);
    try {
      const res = await authService.approveVolunteerRequest(userId);
      setFeedback({
        message: `✅ Volunteer "${name}" approved! Full Admin Access granted.`,
        type: 'success',
      });
      // Optimistically update
      setRequests((prev) =>
        prev.map((r) => (r.user_id === userId ? { ...r, approval_status: 'approved', is_approved: true } : r))
      );
      if (onApprovalsUpdated) onApprovalsUpdated();
    } catch (e: any) {
      setFeedback({
        message: e?.message || 'Failed to approve volunteer request',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    setActionLoadingId(userId);
    try {
      await authService.rejectVolunteerRequest(userId);
      setFeedback({
        message: `❌ Volunteer request for "${name}" rejected.`,
        type: 'success',
      });
      // Optimistically update
      setRequests((prev) =>
        prev.map((r) => (r.user_id === userId ? { ...r, approval_status: 'rejected', is_approved: false } : r))
      );
      if (onApprovalsUpdated) onApprovalsUpdated();
    } catch (e: any) {
      setFeedback({
        message: e?.message || 'Failed to reject volunteer request',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  const pendingRequests = requests.filter((r) => r.approval_status === 'pending' || !r.is_approved);
  const displayedRequests = requests
    .filter((r) => (filter === 'pending' ? r.approval_status === 'pending' || !r.is_approved : true))
    .filter((r) =>
      searchTerm
        ? r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.department.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Volunteer Access Approvals
                </h3>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Confirm field sevekar requests to grant administrative access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              title="Refresh requests"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs font-bold border-b flex items-center gap-2 animate-in slide-in-from-top-2 ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Subheader / Search & Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests ({requests.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, department..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Request Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {displayedRequests.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {filter === 'pending' ? 'No Pending Volunteer Requests' : 'No Volunteer Requests Found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {filter === 'pending'
                  ? 'All volunteer access applications have been reviewed and processed.'
                  : 'No matching records in the system.'}
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isPending = req.approval_status === 'pending' || !req.is_approved;
              const isApproved = req.approval_status === 'approved';
              const isRejected = req.approval_status === 'rejected';
              const isActioning = actionLoadingId === req.user_id;

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 sm:p-4.5 transition-all shadow-xs ${
                    isPending
                      ? 'border-amber-300 bg-amber-50/25 hover:border-amber-400'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {req.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{req.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-500 text-white animate-pulse'
                                : isApproved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {req.approval_status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {req.identifier}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {req.department}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Org: <strong>{req.organization}</strong> • Squad: <strong>{req.squad_id}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>{req.requested_at}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[11px] text-slate-500">
                      {isApproved
                        ? '✅ Granted full Administrative command privileges'
                        : isRejected
                        ? '❌ Application declined'
                        : 'Action required by Officer'}
                    </p>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleReject(req.user_id, req.name)}
                            disabled={isActioning}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => handleApprove(req.user_id, req.name)}
                            disabled={isActioning}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve & Grant Admin Access</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Admin Access</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All accepted volunteers inherit full administrative monitoring and dispatch capabilities.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
