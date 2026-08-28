import React from 'react';
import { X, ShieldAlert, Phone, MapPin, HeartPulse, CheckCircle2 } from 'lucide-react';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#D8CDBE] overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-[#E9E2DB] flex items-center justify-between bg-[#FAF7F3]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 text-[#C51B1B]">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#181716]">VariMitra Emergency Protocol</h3>
              <p className="text-xs text-[#514A40]">Standard Operating Guidelines for Warkaris & Seva Teams</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#514A40] leading-relaxed">
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-100 space-y-2">
            <h4 className="font-bold text-[#A91414] text-base flex items-center gap-2">
              <HeartPulse size={18} />
              1. Medical Triage & Immediate Dispatch
            </h4>
            <p>
              When a <strong>Medical SOS</strong> is triggered, the system instantly broadcasts your live GPS coordinates to all registered medical volunteers and ambulance units within a 2.0 km radius.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-[#181716] text-base">2. Crowd Safety & Route Disruption</h4>
            <p>
              In case of stampede risk, severe roadblock, or water line failure, submit a <strong>Report Issue</strong> alert. The central control room will redirect dindi flow and dispatch police marshals.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-[#181716] text-base">3. Lost Pilgrims & Elders</h4>
            <p>
              Elderly pilgrims or separated children are directed to the nearest <strong>Sant Tukaram Maharaj & Sant Dnyaneshwar Maharaj Seva Kendra</strong> lost-and-found camps. Description and last-known location will be shared via public address systems.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Control Room Helpline: <strong>1800-233-2026</strong></span>
            <span>Emergency Police: <strong>100</strong></span>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FAF7F3] border-t border-[#E9E2DB] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#C51B1B] text-white text-sm font-bold rounded-xl hover:bg-[#A91414] transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
