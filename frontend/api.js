import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

export const fetchQuizReport = (quizId) =>
    API.get(`/result/quiz/${quizId}/report`);

export const fetchQuiz = (quizId) =>
    API.get(`/quiz/${quizId}`);

export default API;