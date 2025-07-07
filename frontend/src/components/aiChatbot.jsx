import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Popup from "./popup";

const AIChatbot = ({ onClose, importQuestions }) => {
    const [apiKey, setApiKey] = useState(localStorage.getItem("geminiApiKey") || "");
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [additionalDetails, setAdditionalDetails] = useState("");
    const [questions, setQuestions] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isLoading, setIsLoading] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState("");
    const [step, setStep] = useState("checkApiKey");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const simulateTyping = useCallback((text, callback) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, 1000);
    }, []);

    const addAIMessage = useCallback(
        (text) => {
            simulateTyping(text, () => {
                setMessages((prev) => [...prev, { sender: "AI", text }]);
            });
        },
        [simulateTyping]
    );

    useEffect(() => {
        if (step === "checkApiKey") {
            if (apiKey) {
                addAIMessage("Checking for existing API key...");
                validateApiKey(apiKey).then((isValid) => {
                    if (isValid) {
                        addAIMessage("Validating Existing API Key...");
                        setTimeout(() => {
                            addAIMessage("API key is still valid! What is the subject of the quiz?");
                            setStep("subject");
                        }, 1000);
                    } else {
                        addAIMessage("Seems like your API key isn't working anymore... No worries, we will help you get a new one.");
                        setTimeout(() => {
                            addAIMessage(`
Hello, I am your AI assistant here to help you create quiz questions. 
Do you have a new API key, or need help with generating one?
                            `);
                            setStep("apiKeyPrompt");
                        }, 1000);
                    }
                });
            } else {
                addAIMessage(`
Hello, I am your AI assistant here to help you create quiz questions. 
Do you have an API key, or need help with generating one?
                `);
                setStep("apiKeyPrompt");
            }
        }
    }, [step, apiKey, addAIMessage]);

    const handleApiKeyChoice = (hasKey) => {
        setMessages((prev) => [...prev, { sender: "user", text: hasKey ? "Yes, I have a key." : "No, please help me get one." }]);
        if (hasKey) {
            addAIMessage("Great! Please share your API key with me.");
            setStep("apiKeyInput");
        } else {
            setShowInstructions(true);
            addAIMessage("No problem! Follow the instructions to get your API key, then share it here.");
            setStep("apiKeyInput");
        }
    };

    const validateApiKey = async (key) => {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            await model.generateContent("Test prompt");
            return true;
        } catch (err) {
            console.error("API key validation error:", err.message);
            return false;
        }
    };

    const handleApiKeyInput = async () => {
        if (!currentInput.trim()) {
            setPopup({ message: "Please enter an API key.", type: "error" });
            return;
        }
        setMessages((prev) => [...prev, { sender: "user", text: currentInput }]);
        addAIMessage("Validating API key... Please wait...");
        const isValid = await validateApiKey(currentInput);
        if (isValid) {
            setApiKey(currentInput);
            localStorage.setItem("geminiApiKey", currentInput);
            addAIMessage("API key validated successfully! Now, what is the subject of the quiz?");
            setStep("subject");
        } else {
            addAIMessage("Seems like this isn't a working key. Please try again.");
        }
        setCurrentInput("");
    };

    const validateInputs = () => {
        if (step === "subject" && !currentInput.trim()) return "Subject is required.";
        if (step === "topic" && !currentInput.trim()) return "Topic is required.";
        if (step === "numQuestions" && (!currentInput || isNaN(currentInput) || Number(currentInput) <= 0)) {
            return "Number of questions must be a positive number.";
        }
        if (step === "difficulty" && !["B", "E", "I", "M", "A", "H"].includes(currentInput.toUpperCase())) {
            return "Difficulty must be Beginner (B or E), Intermediate (I or M), or Advanced (A or H).";
        }
        return "";
    };

    const handleSendMessage = () => {
        if (!currentInput.trim()) {
            if (step === "additionalDetails") {
                addAIMessage("Ready to generate questions! Click 'Generate Questions' to proceed.");
                setStep("generate");
                return;
            }
            setPopup({ message: "Input cannot be empty.", type: "error" });
            return;
        }

        const error = validateInputs();
        if (error) {
            setPopup({ message: error, type: "error" });
            return;
        }

        setMessages((prev) => [...prev, { sender: "user", text: currentInput }]);

        if (step === "subject") {
            setSubject(currentInput);
            addAIMessage("Got it! What is the topic?");
            setStep("topic");
        } else if (step === "topic") {
            setTopic(currentInput);
            addAIMessage("How many questions would you like?");
            setStep("numQuestions");
        } else if (step === "numQuestions") {
            setNumQuestions(currentInput);
            addAIMessage("What is the difficulty level? \nBeginner / Easy: B or E \nIntermediate / Medium: I or M \nAdvanced / Hard: A or H");
            setStep("difficulty");
        } else if (step === "difficulty") {
            setDifficulty(currentInput);
            addAIMessage("Any additional details for the quiz questions? (You can skip this by clicking 'Generate Questions'.)");
            setStep("additionalDetails");
        } else if (step === "additionalDetails") {
            setAdditionalDetails(currentInput);
            addAIMessage("Ready to generate questions! Click 'Generate Questions' to proceed.");
            setStep("generate");
        }

        setCurrentInput("");
    };

    const generateQuestions = async () => {
        setIsLoading(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const difficultyMap = {
                B: "Beginner",
                E: "Beginner",
                I: "Intermediate",
                M: "Intermediate",
                A: "Advanced",
                H: "Advanced",
            };
            const prompt = `
Generate ${numQuestions} quiz questions for the subject "${subject}" on the topic "${topic}" with ${difficultyMap[difficulty.toUpperCase()]} difficulty. 
${additionalDetails ? `Additional details: ${additionalDetails}` : ""}
Each question should be a multiple-choice question with 4 options and one correct answer. 
Return the response as a JSON array of objects, each with the fields: 
- question (string)
- optionA (string)
- optionB (string)
- optionC (string)
- optionD (string)
- correct (number, 1 to 4, indicating the correct option)
- subject (string)
- topic (string)
- difficulty (string)
Example:
[
    {
        "question": "What is 2+2?",
        "optionA": "1",
        "optionB": "2",
        "optionC": "3",
        "optionD": "4",
        "correct": 3,
        "subject": "Math",
        "topic": "Arithmetic",
        "difficulty": "Beginner"
    }
]
`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStart = text.indexOf("[");
            const jsonEnd = text.lastIndexOf("]") + 1;
            const jsonText = text.slice(jsonStart, jsonEnd);
            const generatedQuestions = JSON.parse(jsonText);
            setQuestions(generatedQuestions);
            setPopup({ message: "Questions generated successfully!", type: "success" });
            addAIMessage("Questions generated! You can download them as CSV or import them to the form.");
        } catch (err) {
            console.error("Gemini API error:", err.message);
            setPopup({ message: `Failed to generate questions: ${err.message}. Check your API key or rate limits.`, type: "error" });
        }
        setIsLoading(false);
    };

    const downloadCSV = () => {
        if (!questions.length) return;
        const headers = ["question", "optionA", "optionB", "optionC", "optionD", "correct", "subject", "topic", "difficulty"];
        const csvRows = [headers.join(",")];
        questions.forEach((q) => {
            const row = [
                `"${q.question.replace(/"/g, '""')}"`,
                `"${q.optionA.replace(/"/g, '""')}"`,
                `"${q.optionB.replace(/"/g, '""')}"`,
                `"${q.optionC.replace(/"/g, '""')}"`,
                `"${q.optionD.replace(/"/g, '""')}"`,
                q.correct,
                `"${q.subject.replace(/"/g, '""')}"`,
                `"${q.topic.replace(/"/g, '""')}"`,
                `"${q.difficulty.replace(/"/g, '""')}"`,
            ];
            csvRows.push(row.join(","));
        });
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${subject}_${topic}_quiz.csv`;
        link.click();
    };

    const handleImport = () => {
        if (questions.length > 0) {
            importQuestions(questions);
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    return (
        <>
            <div className="fixed bottom-16 right-4 sm:w-96 w-11/12 max-h-[80vh] bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6 z-50 overflow-y-auto">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <div className="flex justify-between items-center">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-robot"></i> AI Quiz Generator
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                        aria-label="Close chatbot"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${msg.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-800"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] p-2 sm:p-3 rounded-lg bg-gray-100 text-gray-800 text-xs sm:text-sm">
                                Typing...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {step === "apiKeyPrompt" && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={() => handleApiKeyChoice(true)}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                        >
                            Yes, I have a key
                        </button>
                        <button
                            onClick={() => handleApiKeyChoice(false)}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs sm:text-sm"
                        >
                            No, help me get one
                        </button>
                    </div>
                )}
                {step === "apiKeyInput" && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <input
                            type="text"
                            placeholder="Enter your Gemini API key"
                            className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleApiKeyInput()}
                        />
                        <button
                            onClick={handleApiKeyInput}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                        >
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                )}
                {step !== "apiKeyPrompt" && step !== "apiKeyInput" && step !== "generate" && step !== "checkApiKey" && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <input
                            type={step === "numQuestions" ? "number" : "text"}
                            placeholder={
                                step === "subject"
                                    ? "Subject"
                                    : step === "topic"
                                        ? "Topic"
                                        : step === "numQuestions"
                                            ? "No. of questions"
                                            : step === "difficulty"
                                                ? "Difficulty (B, E, I, M, A, H)"
                                                : "Any additional details (optional)"
                            }
                            className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                        >
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                )}
                {(step === "generate" || step === "additionalDetails") && (
                    <button
                        onClick={generateQuestions}
                        className="w-full p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? "Generating..." : "Generate Questions"}
                    </button>
                )}
                {questions.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={downloadCSV}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                        >
                            <i className="fas fa-download"></i> Download as CSV
                        </button>
                        <button
                            onClick={handleImport}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs sm:text-sm"
                        >
                            <i className="fas fa-file-import"></i> Import to Form
                        </button>
                    </div>
                )}
            </div>
            {showInstructions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Get Your Gemini API Key</h3>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                                aria-label="Close instructions"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-3">
                            <p>To get your Gemini API key:</p>
                            <ol className="list-decimal ml-4">
                                <li>
                                    Visit{" "}
                                    <a
                                        href="https://aistudio.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        Google AI Studio
                                    </a>
                                    .
                                </li>
                                <li>Sign in with your Google account.</li>
                                <li>Click your profile &gt; API Keys.</li>
                                <li>Click "Create API Key" and copy the key.</li>
                                <li>Paste it in the input field above and keep it secure.</li>
                            </ol>
                            <p>Note: The free tier has rate limits (e.g., 15 requests/min, 1,500/day).</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;