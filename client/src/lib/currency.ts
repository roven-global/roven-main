/**
 * Formats a number as Indian Rupees (INR).
 * @param price The number to format.
 * @returns A string representing the price in INR, e.g., "₹1,499.00".
 */
export const formatRupees = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(price);
};