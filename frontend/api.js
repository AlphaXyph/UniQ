import axios from "axios";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add JWT token to all requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    console.log("API Request: Token:", token); // Debug token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchQuizReport = (quizId) =>
    API.get(`/result/quiz/${quizId}/report`);

export const fetchQuiz = (quizId) =>
    API.get(`/quiz/${quizId}`);

export default API;