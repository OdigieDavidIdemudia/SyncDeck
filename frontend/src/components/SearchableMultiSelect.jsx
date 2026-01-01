import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';

const SearchableMultiSelect = ({
    options = [],
    value = [],
    onChange,
    label = "Select items",
    placeholder = "Search...",
    displayTemplate = (option) => option.label || option.username,
    roleTemplate = (option) => option.role,
    compact = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOptions = options.filter(opt => value.includes(opt.id));
    const filteredOptions = options.filter(opt =>
        displayTemplate(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optionId) => {
        if (value.includes(optionId)) {
            onChange(value.filter(id => id !== optionId));
        } else {
            onChange([...value, optionId]);
        }
    };

    const removeOption = (optionId, e) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== optionId));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-text-muted mb-1">{label}</label>

            {/* Selected Tags */}
            {selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedOptions.map(option => (
                        <div
                            key={option.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm"
                        >
                            <span className="font-medium">{displayTemplate(option)}</span>
                            {roleTemplate && roleTemplate(option) && (
                                <span className="text-xs text-blue-600">({String(roleTemplate(option))})</span>
                            )}
                            <button
                                onClick={(e) => removeOption(option.id, e)}
                                className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                                type="button"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white flex items-center justify-between text-left"
            >
                <span className="text-sm text-text-muted">
                    {selectedOptions.length > 0
                        ? `${selectedOptions.length} selected`
                        : placeholder}
                </span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={placeholder}
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-[180px] overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.id}
                                    onClick={() => toggleOption(option.id)}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${value.includes(option.id) ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={value.includes(option.id)}
                                            onChange={() => { }}
                                            className="w-4 h-4 text-primary rounded focus:ring-primary/20"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-text">
                                                {displayTemplate(option)}
                                            </div>
                                            {roleTemplate && roleTemplate(option) && (
                                                <div className="text-xs text-text-muted">
                                                    {String(roleTemplate(option))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-text-muted text-center">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableMultiSelect;
