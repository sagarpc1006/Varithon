import React from 'react';
import { Phone, Shield, PlusSquare, PhoneCall, Contact2 } from 'lucide-react';

export const DirectLinesCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#D8CDBE] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-4">
      
      {/* Header */}
      <div className="flex items-center gap-2 font-bold text-[#181716] text-lg tracking-tight">
        <div className="p-1 rounded bg-red-50 text-[#C51B1B]">
          <Contact2 size={20} />
        </div>
        <h2 className="text-lg font-bold text-[#181716]">Direct Lines</h2>
      </div>

      {/* Rows Container */}
      <div className="space-y-3">
        
        {/* Police Helpline */}
        <a
          href="tel:100"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#FAF7F3] border border-[#E9E2DB] hover:border-[#D8CDBE] hover:bg-[#F5EFE6] transition-all duration-200 group text-inherit no-underline"
          title="Call Police Helpline 100"
        >
          <div className="flex items-center gap-3.5">
            {/* Police Shield Icon */}
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D8CDBE] flex items-center justify-center text-[#514A40] group-hover:text-[#181716] group-hover:scale-105 transition-transform shadow-2xs">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-[15px] font-bold text-[#181716] leading-tight">
                Police / पोलीस
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[#514A40] mt-0.5">
                100
              </p>
            </div>
          </div>

          {/* Call Action Button */}
          <div className="p-2.5 rounded-full text-[#C51B1B] bg-red-50 group-hover:bg-[#C51B1B] group-hover:text-white transition-colors">
            <Phone size={18} />
          </div>
        </a>

        {/* Ambulance Helpline */}
        <a
          href="tel:108"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#FAF7F3] border border-[#E9E2DB] hover:border-[#D8CDBE] hover:bg-[#F5EFE6] transition-all duration-200 group text-inherit no-underline"
          title="Call Ambulance Helpline 108"
        >
          <div className="flex items-center gap-3.5">
            {/* Medical Kit Icon */}
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D8CDBE] flex items-center justify-center text-[#514A40] group-hover:text-[#181716] group-hover:scale-105 transition-transform shadow-2xs">
              <PlusSquare size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-[15px] font-bold text-[#181716] leading-tight">
                Ambulance / रुग्णवाहिका
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[#514A40] mt-0.5">
                108
              </p>
            </div>
          </div>

          {/* Call Action Button */}
          <div className="p-2.5 rounded-full text-[#C51B1B] bg-red-50 group-hover:bg-[#C51B1B] group-hover:text-white transition-colors">
            <Phone size={18} />
          </div>
        </a>

      </div>
    </div>
  );
};
