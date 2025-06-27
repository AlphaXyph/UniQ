import React, { useEffect } from "react";

const Popup = ({ message, type, onClose, confirmAction }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <div
                className={`relative p-4 rounded-lg shadow-xl border border-opacity-20 ${type === "success" ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600"
                    } opacity-95 transition-all duration-300`}
            >
                <button
                    className="absolute top-1 right-1 text-white hover:text-gray-200 text-lg font-bold"
                    onClick={onClose}
                    aria-label="Close popup"
                >
                    ✕
                </button>
                <p className="text-sm font-medium pr-6">{message}</p>
                {confirmAction && (
                    <div className="mt-2 flex justify-end">
                        <button
                            className="bg-white text-gray-800 px-3 py-1 rounded hover:bg-gray-200 text-sm"
                            onClick={confirmAction}
                        >
                            Confirm
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Popup;