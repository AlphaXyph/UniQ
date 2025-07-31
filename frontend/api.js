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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

//  Redirect to / (login page) if 401 (Unauthorized)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized – redirecting to /login...");
            localStorage.removeItem("token"); // optional: clear token
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

// Example API calls
export const fetchQuizReport = (quizId) =>
    API.get(`/result/quiz/${quizId}/report`);

export const fetchQuiz = (quizId) =>
    API.get(`/quiz/${quizId}`);

export const refreshToken = () =>
    API.post("/refresh-token");

export default API;