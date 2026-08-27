import React from 'react';

interface SOSTypeSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

const sosTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: '🚑', color: 'bg-red-100 border-red-500 text-red-700 ring-red-500' },
    { id: 'issue', label: 'Report Issue', icon: '⚠️', color: 'bg-orange-100 border-orange-500 text-orange-700 ring-orange-500' },
    { id: 'lost_item', label: 'Lost Item', icon: '🔍', color: 'bg-blue-100 border-blue-500 text-blue-700 ring-blue-500' },
    { id: 'restroom', label: 'Restroom Issue', icon: '🚻', color: 'bg-teal-100 border-teal-500 text-teal-700 ring-teal-500' },
    { id: 'general_issue', label: 'General', icon: 'ℹ️', color: 'bg-gray-100 border-gray-500 text-gray-700 ring-gray-500' }
];

export const SOSTypeSelector: React.FC<SOSTypeSelectorProps> = ({ selectedType, onSelect }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {sosTypes.map(type => (
                <button
                    key={type.id}
                    type="button"
                    onClick={() => onSelect(type.id)}
                    className={`flex flex-col items-center p-4 border rounded-xl transition-all ${
                        selectedType === type.id
                            ? type.color + ' ring-2 ring-offset-2 shadow-md'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                >
                    <span className="text-3xl mb-2">{type.icon}</span>
                    <span className="text-sm font-semibold text-center">{type.label}</span>
                </button>
            ))}
        </div>
    );
};
