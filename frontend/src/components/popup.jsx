import React, { useEffect } from "react";

const Popup = ({ message, type, onClose, confirmAction, confirmInput, setConfirmInput }) => {
    useEffect(() => {
        if (message && !confirmAction) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose, confirmAction]);

    if (!message) return null;

    return (

        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <div
                className={`relative p-4 rounded-lg shadow-xl shadow-gray-400 border-1 ${type === "success"
                    ? "bg-green-500 text-black border-gray-700"
                    : "bg-red-400 text-black border-gray-700"
                    } transition-all duration-300`}
            >
                <button
                    className="absolute top-2 right-2 text-white hover:text-gray-100 text-xl font-bold"
                    onClick={onClose}
                    aria-label="Close popup"
                >
                    ✕
                </button>
                <div className="text-sm font-medium pr-6" dangerouslySetInnerHTML={{ __html: message }} />
                {confirmAction && (
                    <div className="mt-2">
                        <input
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder="Type YES to confirm"
                            className="w-full border p-2 rounded text-gray-800 mb-2"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="bg-white text-gray-800 px-3 py-1 rounded hover:bg-gray-200 text-sm"
                                onClick={() => confirmAction(confirmInput)}
                            >
                                Confirm
                            </button>
                            <button
                                className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-sm"
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