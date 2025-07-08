import React, { useEffect } from "react";

const Popup = ({ message, type, onClose, confirmAction, confirmInput, setConfirmInput }) => {
    useEffect(() => {
        if (message && !confirmAction) {
            console.log("Popup: Displaying message:", message);
            const timer = setTimeout(() => {
                console.log("Popup: Auto-closing and triggering onClose");
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose, confirmAction]);

    if (!message) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <div
                className={`relative p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    } transition-all duration-300`}
            >
                <button
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base font-bold"
                    onClick={() => {
                        console.log("Popup: Manual close triggered");
                        onClose();
                    }}
                    aria-label="Close popup"
                >
                    <i className="fas fa-times"></i>
                </button>
                <div className="text-xs sm:text-sm font-medium pr-6" dangerouslySetInnerHTML={{ __html: message }} />
                {confirmAction && (
                    <div className="mt-3 sm:mt-4">
                        <input
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder="Type YES to confirm"
                            className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-gray-800"
                        />
                        <div className="flex justify-end gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <button
                                className="p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                                onClick={() => confirmAction(confirmInput)}
                            >
                                Confirm
                            </button>
                            <button
                                className="p-2 sm:p-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-xs sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Popup;