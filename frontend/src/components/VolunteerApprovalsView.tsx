import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  Sparkles,
  Users,
  Search,
  Check,
  X,
  Radio,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { authService } from '../services/auth';
import { VolunteerRequestItem } from '../types';

interface VolunteerApprovalsViewProps {
  onApprovalsUpdated?: () => void;
}

export const VolunteerApprovalsView: React.FC<VolunteerApprovalsViewProps> = ({
  onApprovalsUpdated,
}) => {
  const [requests, setRequests] = useState<VolunteerRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
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
    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const pendingRequests = requests.filter((r) => r.approval_status === 'pending' || !r.is_approved);
  const approvedRequests = requests.filter((r) => r.approval_status === 'approved' && r.is_approved);

  const displayedRequests = requests
    .filter((r) => {
      if (filter === 'pending') return r.approval_status === 'pending' || !r.is_approved;
      if (filter === 'approved') return r.approval_status === 'approved' && r.is_approved;
      return true;
    })
    .filter((r) =>
      searchTerm
        ? r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.squad_id.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div className="space-y-6">
      {/* ── HEADER CARD ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
              <UserCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Volunteer Access Approvals Console
                </h1>
                {pendingRequests.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-md">
                    <Radio size={12} className="animate-spin" />
                    <span>{pendingRequests.length} Pending Approval</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                When field volunteers attempt to log in from the login page, their request appears here instantly. As soon as you approve, the volunteer receives identical administrative access to this control room.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Requests</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{pendingRequests.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Approved Volunteers</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{approvedRequests.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Applications</p>
            <p className="text-2xl font-black text-white mt-0.5">{requests.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Command Access</p>
            <p className="text-xs font-bold text-emerald-300 mt-2">Full Admin Privileges</p>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'approved'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedRequests.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by volunteer name, phone, squad..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* ── REQUESTS LIST ── */}
      <div className="space-y-3.5">
        {displayedRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {filter === 'pending' ? 'No Pending Volunteer Login Requests' : 'No Volunteer Records Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === 'pending'
                ? 'All field volunteer login attempts have been processed. When a new volunteer attempts to login, their request will appear here.'
                : 'Try adjusting your search filters.'}
            </p>
          </div>
        ) : (
          displayedRequests.map((req) => {
            const isPending = req.approval_status === 'pending' || !req.is_approved;
            const isApproved = req.approval_status === 'approved' && req.is_approved;
            const isRejected = req.approval_status === 'rejected';
            const isActioning = actionLoadingId === req.user_id;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border transition-all ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-500/10 hover:border-amber-400'
                    : isApproved
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Avatar & Details */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                        isPending
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                          : isApproved
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                          : 'bg-slate-200 text-slate-700'
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
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900">{req.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                        <span className="flex items-center gap-1.5 font-bold text-slate-700 font-mono">
                          <Phone size={13} className="text-slate-400" />
                          {req.identifier}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {req.department}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          Squad: <strong>{req.squad_id}</strong>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Organization: <strong>{req.organization}</strong> • Requested:{' '}
                        <strong>{req.requested_at}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleReject(req.user_id, req.name)}
                          disabled={isActioning}
                          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(req.user_id, req.name)}
                          disabled={isActioning}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check size={15} />
                          <span>Approve & Grant Admin Access</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>Admin Access Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                        <XCircle size={15} className="text-rose-600" />
                        <span>Request Declined</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
