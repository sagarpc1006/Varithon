import React, { useState } from 'react';
import { X, Send, CheckCircle, Phone, MapPin, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { FeedItemData } from './SOSFeedCard';
import { EmergencyTypeIcon } from './EmergencyTypeIcon';

interface SOSResponseModalProps {
  item: FeedItemData | null;
  onClose: () => void;
  onSendReply: (id: number, reply: string) => Promise<void>;
  onUpdateStatus: (id: number, newStatus: 'acknowledged' | 'resolved' | 'active') => Promise<void>;
  isSubmitting: boolean;
}

export const SOSResponseModal: React.FC<SOSResponseModalProps> = ({
  item,
  onClose,
  onSendReply,
  onUpdateStatus,
  isSubmitting,
}) => {
  if (!item) return null;

  const [replyText, setReplyText] = useState('');
  const [quickReplies] = useState([
    'Seva Medical Quick Response Team has been dispatched to your location.',
    'Please remain stationary. Volunteer team is arriving in 3-5 minutes.',
    'Control room has received your report. Marshal on the way.',
    'Nearest First-Aid Post #4 is 200m ahead on the left of Palkhi route.',
  ]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onSendReply(item.id, replyText);
    setReplyText('');
  };

  const isResolved = item.status === 'resolved';
  const isAcknowledged = item.status === 'acknowledged';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#D8CDBE] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ── Modal Header ── */}
        <div className="px-6 py-4.5 border-b border-[#E9E2DB] flex items-center justify-between bg-[#FAF7F3]">
          <div className="flex items-center gap-2.5">
            <EmergencyTypeIcon type={item.type} className="w-5 h-5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#181716] leading-tight">
                  {item.categoryTitle}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                  isResolved ? 'bg-green-100 text-green-800' :
                  isAcknowledged ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {isResolved ? 'RESOLVED' : isAcknowledged ? 'ACKNOWLEDGED / RESPONDED' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-[#514A40] mt-0.5">
                {item.reporterName} ({item.variMitraId}) • {item.timeAgo}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Details & Location Bar */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF7F3] p-3.5 rounded-xl border border-[#E9E2DB]">
            <div className="flex items-center gap-2 text-[#514A40]">
              <MapPin size={15} className="text-[#C51B1B] shrink-0" />
              <span><strong>Distance:</strong> {item.distanceKm.toFixed(1)} km away</span>
            </div>
            {item.mobile && (
              <div className="flex items-center gap-2 text-[#514A40]">
                <Phone size={15} className="text-green-600 shrink-0" />
                <a href={`tel:${item.mobile}`} className="hover:underline font-bold text-gray-800">
                  {item.mobile}
                </a>
              </div>
            )}
          </div>

          {/* User Description */}
          {item.description && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-900">
              <strong className="block text-amber-950 font-bold mb-1">Pilgrim Incident Note:</strong>
              "{item.description}"
            </div>
          )}

          {/* Existing Admin Reply */}
          {item.adminReply && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-900 space-y-1">
              <strong className="block text-blue-950 font-bold">Current Control Room Reply:</strong>
              <p>"{item.adminReply}"</p>
            </div>
          )}

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Send Live Reply to Pilgrim
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Enter instructions, ETA, or response team details..."
              className="w-full p-3 border border-[#D8CDBE] rounded-xl text-sm focus:ring-2 focus:ring-[#8A6800] focus:border-[#8A6800] outline-none placeholder:text-gray-400"
            />

            {/* Quick response pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Quick templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(q)}
                    className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                  >
                    {q.slice(0, 38)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="h-10 px-5 bg-[#765606] hover:bg-[#624603] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send size={14} />
                <span>Send Reply</span>
              </button>

              {/* Status change actions */}
              <div className="flex items-center gap-2">
                {item.status !== 'acknowledged' && item.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.id, 'acknowledged')}
                    className="h-10 px-3.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
                {item.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.id, 'resolved')}
                    className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle size={14} />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
