// Database abstraction layer for Firestore
import {
    getDocument,
    getDocuments,
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument, // Used in clearDatabase implementation (commented out for now)
    whereEqual,
    whereIn,
    COLLECTIONS
} from '../firebase/firestore';
import { QueryConstraint } from 'firebase/firestore';

// Define a type for the query object
interface QueryObject {
    selector?: Record<string, any>;
}

// Define document type
interface Document {
    id: string;
    [key: string]: any;
}

// Single instance reference
let databaseInstance: any = null;

/**
 * Convert RxDB/Mango query selector to Firestore constraints
 */
const selectorToConstraints = (selector: Record<string, any>): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    Object.entries(selector).forEach(([key, value]) => {
        // Handle special operators
        if (key === '$and' || key === '$or' || key === '$nor') {
            console.warn(`Complex ${key} queries are not fully supported`);
            // Basic implementation for simple cases
            if (Array.isArray(value) && value.length > 0) {
                // Just take the first condition for now
                const subConstraints = selectorToConstraints(value[0]);
                constraints.push(...subConstraints);
            }
            return;
        }

        // Handle property value
        if (typeof value === 'object' && value !== null) {
            // Handle operators like $in, $eq, etc.
            if ('$in' in value && Array.isArray(value.$in)) {
                // Skip empty arrays for $in operator to avoid Firestore errors
                if (value.$in.length === 0) {
                    console.warn(`Skipping empty array for $in operator on field ${key}`);
                    return;
                }
                constraints.push(whereIn(key, value.$in));
                return;
            }

            if ('$eq' in value) {
                constraints.push(whereEqual(key, value.$eq));
                return;
            }

            // Handle nested objects
            if (typeof value === 'object' && value !== null && Object.keys(value).length > 0 && !Object.keys(value)[0].startsWith('$')) {
                // This is a nested object, not an operator
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    constraints.push(whereEqual(`${key}.${nestedKey}`, nestedValue));
                });
                return;
            }

            console.warn(`Unsupported operator in query for key ${key}:`, value);
        } else {
            // Simple equality
            constraints.push(whereEqual(key, value));
        }
    });

    return constraints;
};

/**
 * Get the database instance
 * This function maintains API compatibility with the old RxDB implementation
 * but now returns a Firestore wrapper
 */
export const getDatabase = async () => {
    if (databaseInstance) {
        return databaseInstance;
    }

    try {
        // Create a wrapper object that mimics the old RxDB interface but uses Firestore
        databaseInstance = {
            // Collection accessors
            users: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        // Convert RxDB style selectors to Firestore constraints
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.USERS, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.USERS, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                },
                                remove: async () => {
                                    await deleteDocument(COLLECTIONS.USERS, doc.id);
                                    return true;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.USERS, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.USERS, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                },
                                remove: async () => {
                                    await deleteDocument(COLLECTIONS.USERS, id);
                                    return true;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    // Use existing id if provided, otherwise addDocument will generate one
                    if (data.id) {
                        await setDocument(COLLECTIONS.USERS, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.USERS, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.USERS, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            },
                            remove: async () => {
                                await deleteDocument(COLLECTIONS.USERS, data.id);
                                return true;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.USERS, data);
                        const doc = await getDocument<Document>(COLLECTIONS.USERS, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.USERS, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            },
                            remove: async () => {
                                await deleteDocument(COLLECTIONS.USERS, id);
                                return true;
                            }
                        };
                    }
                }
            },

            mentors: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.MENTORS, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.MENTORS, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                },
                                remove: async () => {
                                    await deleteDocument(COLLECTIONS.MENTORS, doc.id);
                                    return true;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.MENTORS, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.MENTORS, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                },
                                remove: async () => {
                                    await deleteDocument(COLLECTIONS.MENTORS, id);
                                    return true;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    if (data.id) {
                        await setDocument(COLLECTIONS.MENTORS, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.MENTORS, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.MENTORS, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            },
                            remove: async () => {
                                await deleteDocument(COLLECTIONS.MENTORS, data.id);
                                return true;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.MENTORS, data);
                        const doc = await getDocument<Document>(COLLECTIONS.MENTORS, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.MENTORS, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            },
                            remove: async () => {
                                await deleteDocument(COLLECTIONS.MENTORS, id);
                                return true;
                            }
                        };
                    }
                }
            },

            mentees: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.MENTEES, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.MENTEES, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.MENTEES, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.MENTEES, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    if (data.id) {
                        await setDocument(COLLECTIONS.MENTEES, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.MENTEES, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.MENTEES, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.MENTEES, data);
                        const doc = await getDocument<Document>(COLLECTIONS.MENTEES, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.MENTEES, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    }
                }
            },

            sessions: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.SESSIONS, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.SESSIONS, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.SESSIONS, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.SESSIONS, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    if (data.id) {
                        await setDocument(COLLECTIONS.SESSIONS, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.SESSIONS, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.SESSIONS, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.SESSIONS, data);
                        const doc = await getDocument<Document>(COLLECTIONS.SESSIONS, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.SESSIONS, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    }
                }
            },

            ratings: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.RATINGS, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.RATINGS, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.RATINGS, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.RATINGS, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    if (data.id) {
                        await setDocument(COLLECTIONS.RATINGS, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.RATINGS, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.RATINGS, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.RATINGS, data);
                        const doc = await getDocument<Document>(COLLECTIONS.RATINGS, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.RATINGS, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    }
                }
            },

            availability: {
                find: (query: QueryObject = {}) => {
                    const constraints: QueryConstraint[] = [];
                    if (query.selector) {
                        constraints.push(...selectorToConstraints(query.selector));
                    }

                    return {
                        exec: async () => {
                            const docs = await getDocuments<Document>(COLLECTIONS.AVAILABILITY, constraints);
                            return docs.map(doc => ({
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.AVAILABILITY, doc.id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            }));
                        }
                    };
                },
                findOne: (id: string) => {
                    return {
                        exec: async () => {
                            const doc = await getDocument<Document>(COLLECTIONS.AVAILABILITY, id);
                            if (!doc) return null;
                            return {
                                id: doc.id,
                                toJSON: () => doc,
                                update: async (updateObj: any) => {
                                    if (updateObj.$set) {
                                        await updateDocument(COLLECTIONS.AVAILABILITY, id, updateObj.$set);
                                        return { ...doc, ...updateObj.$set } as Document;
                                    }
                                    return doc;
                                }
                            };
                        }
                    };
                },
                insert: async (data: any) => {
                    if (data.id) {
                        await setDocument(COLLECTIONS.AVAILABILITY, data.id, data);
                        const doc = await getDocument<Document>(COLLECTIONS.AVAILABILITY, data.id);
                        return {
                            id: data.id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.AVAILABILITY, data.id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    } else {
                        const id = await addDocument(COLLECTIONS.AVAILABILITY, data);
                        const doc = await getDocument<Document>(COLLECTIONS.AVAILABILITY, id);
                        return {
                            id,
                            toJSON: () => doc,
                            update: async (updateObj: any) => {
                                if (updateObj.$set) {
                                    await updateDocument(COLLECTIONS.AVAILABILITY, id, updateObj.$set);
                                    return { ...doc, ...updateObj.$set } as Document;
                                }
                                return doc;
                            }
                        };
                    }
                }
            }
        };

        return databaseInstance;
    } catch (error) {
        console.error("Error initializing Firestore database:", error);
        throw error;
    }
};

/**
 * Clears the database (for testing and development purposes)
 */
export const clearDatabase = async (): Promise<boolean> => {
    try {
        console.log("Clearing database not implemented for Firestore yet");
        // In a real implementation, you'd use batches to delete collections
        // Example for future implementation:
        // for (const collName of Object.values(COLLECTIONS)) {
        //   const docs = await getDocuments<Document>(collName, []);
        //   for (const doc of docs) {
        //     await deleteDocument(collName, doc.id);
        //   }
        // }
        return true;
    } catch (error) {
        console.error("Error clearing database:", error);
        return false;
    }
};

/**
 * Resets and initializes the database with sample data
 */
export const resetAndInitializeDatabase = async (): Promise<boolean> => {
    try {
        console.log("Database reset not implemented for Firestore yet");
        // In a real implementation, you'd clear and seed the database
        // await clearDatabase();
        // Add sample data code here
        return true;
    } catch (error) {
        console.error("Error resetting database:", error);
        return false;
    }
};