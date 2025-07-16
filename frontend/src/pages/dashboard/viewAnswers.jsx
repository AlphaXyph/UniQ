import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/popup";

function ViewAnswers() {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });

    useEffect(() => {
        const fetchAnswers = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await API.get(`/result/answers/${resultId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Result answers:", res.data.answers); // Debug log
                setResult(res.data);
            } catch (err) {
                setPopup({
                    message: err.response?.data?.msg || "Error loading answers",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnswers();
    }, [resultId]);

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const getAnswerColor = (answer) => {
        if (!answer.isAnswered) return "text-gray-500";
        return answer.isCorrect ? "text-green-600" : "text-red-600";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-5">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-5">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-question-circle text-base sm:text-lg"></i> Quiz Answers
                    </h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm font-medium transition duration-200"
                    >
                        Back
                    </button>
                </div>
                {isLoading ? (
                    <p className="text-gray-500 text-xs sm:text-sm">Loading answers...</p>
                ) : !result ? (
                    <p className="text-gray-500 text-xs sm:text-sm">No answers available.</p>
                ) : (
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                            {result.quizSubject} - {result.quizTitle}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3">
                            Student: {result.studentName} ({result.studentEmail}) | Score: {result.score}/{result.total}
                        </p>
                        <ul className="space-y-3 sm:space-y-4">
                            {result.answers.map((answer, index) => (
                                <li
                                    key={index}
                                    className="p-2 sm:p-3 bg-gray-50 rounded-md shadow-md text-xs sm:text-sm"
                                >
                                    <p className="font-semibold">{index + 1}. {answer.question}</p>
                                    <ul className="ml-4 list-disc">
                                        {answer.options.map((option, optIndex) => (
                                            <li
                                                key={optIndex}
                                                className={`${answer.isAnswered && optIndex === answer.correctAnswer
                                                        ? "text-green-600"
                                                        : answer.isAnswered && optIndex === answer.userAnswer
                                                            ? getAnswerColor(answer)
                                                            : "text-gray-600"
                                                    }`}
                                            >
                                                {option}
                                            </li>
                                        ))}
                                    </ul>
                                    {!answer.isAnswered && (
                                        <p className="ml-4 text-gray-500 italic mt-1">Not answered</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewAnswers;