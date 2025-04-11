import React, { useState } from 'react';
import ItemsList from './ItemsList';
import ItemModal from './ItemModal';
import { WorkExperience } from '../../types';

interface WorkExperienceManagerProps {
    workExperienceItems: WorkExperience[];
    onChange: (updatedItems: WorkExperience[]) => void;
}

const WorkExperienceManager: React.FC<WorkExperienceManagerProps> = ({
    workExperienceItems,
    onChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<WorkExperience | null>(null);

    const handleAdd = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: WorkExperience) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this work experience entry?')) {
            const updatedItems = workExperienceItems.filter(item => item.id !== itemId);
            onChange(updatedItems);
        }
    };

    const handleSave = (formData: WorkExperience) => {
        let updatedItems;

        if (currentItem) {
            // Editing existing item
            updatedItems = workExperienceItems.map(item =>
                item.id === formData.id ? formData : item
            );
        } else {
            // Adding new item
            updatedItems = [...workExperienceItems, formData];
        }

        onChange(updatedItems);
        setIsModalOpen(false);
    };

    const renderWorkExperienceItem = (item: WorkExperience) => (
        <div>
            <h4 className="text-md font-medium">{item.position}</h4>
            <p className="text-sm font-medium">{item.company}</p>
            <p className="text-sm text-gray-600">
                {item.startDate} - {item.endDate || 'Present'}
            </p>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        </div>
    );

    const workExperienceFields = [
        { name: 'company', label: 'Company', type: 'text', required: true },
        { name: 'position', label: 'Position', type: 'text', required: true },
        { name: 'startDate', label: 'Start Date', type: 'text', required: true, placeholder: 'YYYY-MM' },
        { name: 'endDate', label: 'End Date', type: 'text', placeholder: 'YYYY-MM or leave blank for current position' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Brief description of your responsibilities and achievements' }
    ];

    return (
        <div>
            <ItemsList
                items={workExperienceItems}
                itemType="Work Experience"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderItem={renderWorkExperienceItem}
                emptyMessage="No work experience added yet. Add your professional background!"
            />

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
                fields={workExperienceFields}
                title={currentItem ? 'Edit Work Experience' : 'Add Work Experience'}
            />
        </div>
    );
};

export default WorkExperienceManager; 