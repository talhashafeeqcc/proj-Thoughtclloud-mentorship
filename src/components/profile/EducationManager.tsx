import React, { useState } from 'react';
import ItemsList from './ItemsList';
import ItemModal from './ItemModal';
import { Education } from '../../types';

interface EducationManagerProps {
    educationItems: Education[];
    onChange: (updatedItems: Education[]) => void;
}

const EducationManager: React.FC<EducationManagerProps> = ({
    educationItems,
    onChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Education | null>(null);

    const handleAdd = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Education) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this education entry?')) {
            const updatedItems = educationItems.filter(item => item.id !== itemId);
            onChange(updatedItems);
        }
    };

    const handleSave = (formData: Education) => {
        let updatedItems;

        if (currentItem) {
            // Editing existing item
            updatedItems = educationItems.map(item =>
                item.id === formData.id ? formData : item
            );
        } else {
            // Adding new item
            updatedItems = [...educationItems, formData];
        }

        onChange(updatedItems);
        setIsModalOpen(false);
    };

    const renderEducationItem = (item: Education) => (
        <div>
            <h4 className="text-md font-medium">{item.institution}</h4>
            <p className="text-sm font-medium">{item.degree} in {item.field}</p>
            <p className="text-sm text-gray-600">{item.startDate} - {item.endDate}</p>
        </div>
    );

    const educationFields = [
        { name: 'institution', label: 'Institution', type: 'text', required: true },
        { name: 'degree', label: 'Degree', type: 'text', required: true },
        { name: 'field', label: 'Field of Study', type: 'text', required: true },
        { name: 'startDate', label: 'Start Year', type: 'text', required: true, placeholder: 'YYYY' },
        { name: 'endDate', label: 'End Year', type: 'text', required: true, placeholder: 'YYYY or Present' }
    ];

    return (
        <div>
            <ItemsList
                items={educationItems}
                itemType="Education"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderItem={renderEducationItem}
                emptyMessage="No education history added yet. Add your educational background!"
            />

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
                fields={educationFields}
                title={currentItem ? 'Edit Education' : 'Add Education'}
            />
        </div>
    );
};

export default EducationManager; 