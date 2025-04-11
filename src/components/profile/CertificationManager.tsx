import React, { useState } from 'react';
import ItemsList from './ItemsList';
import ItemModal from './ItemModal';
import { Certification } from '../../types';

interface CertificationManagerProps {
    certificationItems: Certification[];
    onChange: (updatedItems: Certification[]) => void;
}

const CertificationManager: React.FC<CertificationManagerProps> = ({
    certificationItems,
    onChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Certification | null>(null);

    const handleAdd = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Certification) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this certification?')) {
            const updatedItems = certificationItems.filter(item => item.id !== itemId);
            onChange(updatedItems);
        }
    };

    const handleSave = (formData: Certification) => {
        let updatedItems;

        if (currentItem) {
            // Editing existing item
            updatedItems = certificationItems.map(item =>
                item.id === formData.id ? formData : item
            );
        } else {
            // Adding new item
            updatedItems = [...certificationItems, formData];
        }

        onChange(updatedItems);
        setIsModalOpen(false);
    };

    const renderCertificationItem = (item: Certification) => (
        <div>
            <h4 className="text-md font-medium">{item.name}</h4>
            <p className="text-sm text-gray-600">
                Issued by {item.issuer} • {item.date}
                {item.expiryDate && ` • Expires: ${item.expiryDate}`}
            </p>
            {item.link && (
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                    View Certificate
                </a>
            )}
        </div>
    );

    const certificationFields = [
        { name: 'name', label: 'Certification Name', type: 'text', required: true },
        { name: 'issuer', label: 'Issuing Organization', type: 'text', required: true },
        { name: 'date', label: 'Issue Date', type: 'text', required: true, placeholder: 'YYYY-MM or YYYY' },
        { name: 'expiryDate', label: 'Expiry Date', type: 'text', placeholder: 'YYYY-MM or YYYY (if applicable)' },
        { name: 'link', label: 'Certificate URL', type: 'url', placeholder: 'https://example.com/certificate' }
    ];

    return (
        <div>
            <ItemsList
                items={certificationItems}
                itemType="Certification"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderItem={renderCertificationItem}
                emptyMessage="No certifications added yet. Add professional certificates to showcase your expertise!"
            />

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
                fields={certificationFields}
                title={currentItem ? 'Edit Certification' : 'Add Certification'}
            />
        </div>
    );
};

export default CertificationManager; 