import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => void;
    initialData?: any;
    fields: {
        name: string;
        label: string;
        type: string;
        required?: boolean;
        placeholder?: string;
    }[];
    title: string;
}

const ItemModal: React.FC<ItemModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    fields,
    title
}) => {
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Set initial form data when modal opens
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Reset to empty values
            const emptyData: any = {};
            fields.forEach(field => {
                emptyData[field.name] = '';
            });
            setFormData(emptyData);
        }
        setErrors({});
    }, [initialData, isOpen, fields]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
                isValid = false;
            }
        });

        // Check if this is an education form and validate dates
        if (title.toLowerCase().includes('education')) {
            // Check if start date is after end date
            if (formData.startDate && formData.endDate && formData.endDate !== 'Present') {
                // Convert year strings to numbers for comparison
                const startYear = parseInt(formData.startDate, 10);
                const endYear = parseInt(formData.endDate, 10);
                
                if (!isNaN(startYear) && !isNaN(endYear) && startYear > endYear) {
                    newErrors.startDate = 'Start year cannot be later than end year';
                    isValid = false;
                }
            }
        }

        // Email validation if there's an email field
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form behavior

        // Validate form data
        if (validateForm()) {
            try {
                // If there's no id, add a unique id
                const dataToSave = {
                    ...formData,
                    id: formData.id || Date.now().toString()
                };

                // Call the onSave callback and close the modal
                onSave(dataToSave);
                onClose();
            } catch (error) {
                console.error('Error saving form data:', error);
                // Add error handling if needed
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    placeholder={field.placeholder || ''}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    rows={4}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    placeholder={field.placeholder || ''}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            )}

                            {errors[field.name] && (
                                <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemModal; 