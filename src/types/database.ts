/**
 * Database type definitions
 */

/**
 * Basic document interface for database documents
 */
export interface Document {
    id: string;
    [key: string]: any;

    toJSON: () => any;
} 