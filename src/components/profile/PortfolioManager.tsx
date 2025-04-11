import React, { useState } from 'react';
import ItemsList from './ItemsList';
import ItemModal from './ItemModal';
import { PortfolioItem } from '../../types';

interface PortfolioManagerProps {
    portfolioItems: PortfolioItem[];
    onChange: (updatedItems: PortfolioItem[]) => void;
}

const PortfolioManager: React.FC<PortfolioManagerProps> = ({
    portfolioItems,
    onChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<PortfolioItem | null>(null);

    const handleAdd = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: PortfolioItem) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this portfolio item?')) {
            const updatedItems = portfolioItems.filter(item => item.id !== itemId);
            onChange(updatedItems);
        }
    };

    const handleSave = (formData: PortfolioItem) => {
        let updatedItems;

        if (currentItem) {
            // Editing existing item
            updatedItems = portfolioItems.map(item =>
                item.id === formData.id ? formData : item
            );
        } else {
            // Adding new item
            updatedItems = [...portfolioItems, formData];
        }

        onChange(updatedItems);
        setIsModalOpen(false);
    };

    const renderPortfolioItem = (item: PortfolioItem) => (
        <div>
            <h4 className="text-md font-medium">{item.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            {item.link && (
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                    View Project
                </a>
            )}
        </div>
    );

    const portfolioFields = [
        { name: 'title', label: 'Project Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'link', label: 'Project URL', type: 'url', placeholder: 'https://example.com' },
        { name: 'image', label: 'Image URL', type: 'url', placeholder: 'https://example.com/image.jpg' }
    ];

    return (
        <div>
            <ItemsList
                items={portfolioItems}
                itemType="Portfolio Item"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderItem={renderPortfolioItem}
                emptyMessage="No portfolio items yet. Add your projects to showcase your work!"
            />

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
                fields={portfolioFields}
                title={currentItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            />
        </div>
    );
};

export default PortfolioManager; 