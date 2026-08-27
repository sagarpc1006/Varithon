import React, { useState } from 'react';
import { X, Send, AlertTriangle, MapPin, CheckCircle, Info } from 'lucide-react';
import { HelpType } from './SpecificHelpSection';

interface EmergencyCategoryModalProps {
  category: HelpType | null;
  onClose: () => void;
  onSubmit: (type: string, description: string) => Promise<void>;
  isSubmitting: boolean;
}

export const EmergencyCategoryModal: React.FC<EmergencyCategoryModalProps> = ({
  category,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  if (!category) return null;

  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categoryDetails = {
    medical: {
      title: 'Medical Emergency / वैद्यकीय मदत',
      desc: 'Immediate dispatch notification will be sent to nearby medical volunteers, doctors, and seva control room ambulances.',
      requiresDesc: false,
      placeholder: 'Optional: describe symptoms, patient age, or visible injury...',
      color: 'bg-red-50 text-[#C51B1B] border-red-200',
      btnColor: 'bg-[#C51B1B] hover:bg-[#A91414]',
    },
    issue: {
      title: 'Report Incident or Issue / समस्या नोंदवा',
      desc: 'Report crowd surge, obstacle, water disruption, or road hazard along the Palkhi Marg.',
      requiresDesc: false,
      placeholder: 'Briefly mention the issue details (optional)...',
      color: 'bg-yellow-50 text-[#854D0E] border-yellow-200',
      btnColor: 'bg-[#CA8A04] hover:bg-[#A16207]',
    },
    restroom: {
      title: 'Restroom Facility Assistance / शौचालय सहाय्य',
      desc: 'Request maintenance, hygiene replenishment, or locate the nearest mobile sanitation van.',
      requiresDesc: false,
      placeholder: 'Optional details regarding sanitation issue or location...',
      color: 'bg-emerald-50 text-[#166534] border-emerald-200',
      btnColor: 'bg-[#15803D] hover:bg-[#166534]',
    },
    lost_item: {
      title: 'Report Lost Item or Person / हरवलेली वस्तू किंवा व्यक्ती',
      desc: 'Notify control room & lost-and-found seva desks across the route.',
      requiresDesc: true,
      placeholder: 'Required: Provide detailed description (name, color, distinguishing marks, last seen location)...',
      color: 'bg-amber-50 text-[#78350F] border-amber-200',
      btnColor: 'bg-[#92400E] hover:bg-[#78350F]',
    },
  }[category];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category === 'lost_item' && !description.trim()) {
      setError('Description is required for lost item / person report.');
      return;
    }
    setError(null);
    await onSubmit(category, description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#D8CDBE] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E9E2DB] flex items-center justify-between bg-[#FAF7F3]">
          <div>
            <h3 className="text-lg font-bold text-[#181716] tracking-tight">
              {categoryDetails.title}
            </h3>
            <p className="text-xs text-[#514A40] mt-0.5">
              Live GPS coordinate will be attached automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className={`p-4 rounded-xl border ${categoryDetails.color} text-xs sm:text-sm leading-relaxed flex items-start gap-2.5`}>
            <Info size={18} className="shrink-0 mt-0.5" />
            <span>{categoryDetails.desc}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#181716] mb-1.5">
              Additional Details {categoryDetails.requiresDesc ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={categoryDetails.placeholder}
              required={categoryDetails.requiresDesc}
              className="w-full p-3.5 border border-[#D8CDBE] rounded-xl text-sm focus:ring-2 focus:ring-[#C51B1B] focus:border-[#C51B1B] outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={14} className="text-[#C51B1B]" />
            <span>Current geolocation will be shared with the field response team</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#514A40] hover:text-[#181716] rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm ${categoryDetails.btnColor} transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer`}
            >
              {isSubmitting ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Help Request</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
