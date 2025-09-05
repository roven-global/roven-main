import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Not Authorized</h1>
            <p className="text-lg text-gray-700 mb-8">
                You do not have permission to access this page.
            </p>
            <Link
                to="/"
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
                Go to Homepage
            </Link>
        </div>
    );
};

export default NotAuthorized;
