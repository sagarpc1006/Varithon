import React from 'react';

export interface SOSReport {
    id: number;
    type: string;
    description: string;
    lat: number;
    lng: number;
    status: string;
    admin_reply: string | null;
    created_at: string;
    reporter_name?: string;
    reported_by?: string;
    reporter_mobile?: string;
    admin_name?: string;
    reported_to?: string;
    admin_mobile?: string;
}

interface SOSCardProps {
    report: SOSReport;
    onReply?: (id: number) => void;
    onStatusChange?: (id: number, status: string) => void;
    isAdmin?: boolean;
}

export const SOSCard: React.FC<SOSCardProps> = ({ report, onReply, onStatusChange, isAdmin = false }) => {
    const isMedical = report.type === 'medical';
    const rawStatus = (report.status || 'active').toLowerCase();
    const isResolved = rawStatus === 'resolved';
    const isAcknowledged = rawStatus === 'acknowledged' || rawStatus === 'responded';
    
    // Compute display targets
    const reportedByDisplay = report.reported_by || report.reporter_name || 'Pilgrim';
    const reportedToDisplay = report.reported_to || report.admin_name 
        ? (report.reported_to || report.admin_name)
        : (isMedical ? 'Nearby Admins & Medical Volunteers (Broadcast)' : 'Nearby Wari Control Room Admins');

    let categoryTitle = 'General Issue';
    if (report.type === 'medical') categoryTitle = 'Medical Emergency';
    else if (report.type === 'lost_item' || report.type === 'lost_person') categoryTitle = 'Lost Item / Person';
    else if (report.type === 'restroom') categoryTitle = 'Restroom Assistance';
    else if (report.type === 'issue' || report.type === 'general_issue') categoryTitle = 'Report Incident / Issue';
    
    return (
        <div className={`p-4 mb-4 border rounded-xl shadow-sm ${isMedical ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className={`font-bold text-base sm:text-lg ${isMedical ? 'text-red-700' : 'text-gray-900'}`}>
                        {categoryTitle} {isMedical && '🚨'}
                    </h3>
                    <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full uppercase tracking-wider ${
                    isResolved ? 'bg-green-100 text-green-800' :
                    isAcknowledged ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800 animate-pulse'
                }`}>
                    {isResolved ? 'RESOLVED' : isAcknowledged ? 'ACKNOWLEDGED / RESPONDED' : 'ACTIVE'}
                </span>
            </div>

            <div className="mb-3 text-sm text-gray-700 space-y-1">
                {isAdmin ? (
                    <p>
                        <strong className="text-gray-900">Reported By:</strong>{' '}
                        <span className="font-medium text-indigo-700">{reportedByDisplay}</span>
                        {report.reporter_mobile && ` (${report.reporter_mobile})`}
                    </p>
                ) : (
                    <p>
                        <strong className="text-gray-900">Reported To:</strong>{' '}
                        <span className="font-medium text-emerald-700">{reportedToDisplay}</span>
                        {report.admin_mobile && ` (${report.admin_mobile})`}
                    </p>
                )}
                <p><strong>Location:</strong> {report.lat.toFixed(4)}, {report.lng.toFixed(4)}</p>
                {report.description && <p className="mt-2 bg-white/70 p-2 rounded border border-gray-100"><strong>Details:</strong> {report.description}</p>}
            </div>

            {report.admin_reply && (
                <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-900">
                    <strong>Admin Reply:</strong> {report.admin_reply}
                </div>
            )}

            {isAdmin && report.status !== 'resolved' && (
                <div className="mt-4 flex gap-2">
                    <button 
                        onClick={() => onReply && onReply(report.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reply
                    </button>
                    {report.status === 'open' && (
                        <button 
                            onClick={() => onStatusChange && onStatusChange(report.id, 'acknowledged')}
                            className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            Acknowledge
                        </button>
                    )}
                    <button 
                        onClick={() => onStatusChange && onStatusChange(report.id, 'resolved')}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Resolve
                    </button>
                </div>
            )}
        </div>
    );
};
