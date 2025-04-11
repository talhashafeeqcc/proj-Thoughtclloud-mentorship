import React from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemsListProps {
    items: any[];
    itemType: string;
    onAdd: () => void;
    onEdit: (item: any) => void;
    onDelete: (itemId: string) => void;
    renderItem: (item: any) => React.ReactNode;
    emptyMessage?: string;
}

const ItemsList: React.FC<ItemsListProps> = ({
    items,
    itemType,
    onAdd,
    onEdit,
    onDelete,
    renderItem,
    emptyMessage = 'No items yet. Add one to get started!'
}) => {
    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">{itemType}</h3>
                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <FaPlus className="mr-1" size={14} />
                    Add {itemType}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow transition-shadow"
                            >
                                <div className="flex justify-between">
                                    <div className="flex-grow">{renderItem(item)}</div>
                                    <div className="flex items-start space-x-2 ml-4">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className="text-gray-500 hover:text-blue-600 transition-colors"
                                            title={`Edit ${itemType}`}
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item.id)}
                                            className="text-gray-500 hover:text-red-600 transition-colors"
                                            title={`Delete ${itemType}`}
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default ItemsList; 