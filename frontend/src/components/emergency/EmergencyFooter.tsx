import React from 'react';

interface EmergencyFooterProps {
  onOpenProtocol?: () => void;
}

export const EmergencyFooter: React.FC<EmergencyFooterProps> = ({ onOpenProtocol }) => {
  return (
    <footer className="w-full bg-[#E9E2DB] border-t border-[#D8CDBE] py-6 sm:py-8 mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#514A40]">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#C51B1B]">VariMitra</span>
        </div>

        {/* Center: Copyright */}
        <div className="text-center font-normal">
          © 2024 VariMitra - Guided Pilgrimage Safety Portal
        </div>

        {/* Right: Policy Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-[#181716] underline underline-offset-4 decoration-[#B8ACA0] hover:decoration-[#181716] transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-[#181716] underline underline-offset-4 decoration-[#B8ACA0] hover:decoration-[#181716] transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="tel:18002332026"
            className="hover:text-[#181716] underline underline-offset-4 decoration-[#B8ACA0] hover:decoration-[#181716] transition-colors"
          >
            Contact Support
          </a>
          <button
            onClick={onOpenProtocol}
            className="hover:text-[#181716] underline underline-offset-4 decoration-[#B8ACA0] hover:decoration-[#181716] transition-colors cursor-pointer"
          >
            Emergency Protocol
          </button>
        </div>

      </div>
    </footer>
  );
};
