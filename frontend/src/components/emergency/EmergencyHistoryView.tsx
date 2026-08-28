import React from 'react';
import { SOSCard, SOSReport } from '../sos/SOSCard';
import { Clock, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface EmergencyHistoryViewProps {
  reports: SOSReport[];
  onRefresh: () => void;
  isLoading: boolean;
  onBackToDashboard: () => void;
}

export const EmergencyHistoryView: React.FC<EmergencyHistoryViewProps> = ({
  reports,
  onRefresh,
  isLoading,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8CDBE]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl border border-[#D8CDBE] bg-white hover:bg-[#FAF7F3] text-[#514A40] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#181716] tracking-tight">
              Emergency SOS History
            </h2>
            <p className="text-sm text-[#514A40]">
              Track your emergency requests and view live replies from seva officers
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D8CDBE] rounded-xl text-sm font-semibold text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3] transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#C51B1B]' : ''} />
          <span>Refresh Updates</span>
        </button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D8CDBE] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-[#C51B1B] mx-auto flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#181716]">No Active Emergency Reports</h3>
            <p className="text-sm text-[#514A40] max-w-md mx-auto">
              You haven't submitted any SOS alerts during this pilgrimage. If you ever need urgent help, tap the red SOS button on the dashboard.
            </p>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 bg-[#C51B1B] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#A91414] transition-all"
          >
            Return to SOS Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <SOSCard key={report.id} report={report} isAdmin={false} />
          ))}
        </div>
      )}
    </div>
  );
};
