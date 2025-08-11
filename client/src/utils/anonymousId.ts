// Generate a unique anonymous ID for tracking users who haven't logged in
export const generateAnonymousId = (): string => {
    // Try to get existing ID from localStorage
    const existingId = localStorage.getItem('anonymousId');
    if (existingId) {
        return existingId;
    }

    // Generate new ID
    const newId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousId', newId);
    return newId;
};

// Get the current anonymous ID
export const getAnonymousId = (): string => {
    return generateAnonymousId();
};

// Clear anonymous ID (useful when user logs in)
export const clearAnonymousId = (): void => {
    localStorage.removeItem('anonymousId');
};

// Check if user has an anonymous ID
export const hasAnonymousId = (): boolean => {
    return !!localStorage.getItem('anonymousId');
};
