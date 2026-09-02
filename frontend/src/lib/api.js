import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const getSubjects = () => client.get("/subjects").then((r) => r.data);
export const getSubject = (id) => client.get(`/subjects/${id}`).then((r) => r.data);
export const getAnalytics = (id) => client.get(`/subjects/${id}/analytics`).then((r) => r.data);
export const getPatterns = (subject) =>
  client.get("/patterns", { params: subject ? { subject } : {} }).then((r) => r.data);
export const getQuestions = (subject, pattern) =>
  client.get("/questions", { params: { subject, pattern } }).then((r) => r.data);
export const getCounts = (subject) =>
  client.get("/questions/counts", { params: { subject } }).then((r) => r.data);
export const createQuestion = (payload) => client.post("/questions", payload).then((r) => r.data);
export const updateQuestion = (id, payload) => client.put(`/questions/${id}`, payload).then((r) => r.data);
export const deleteQuestion = (id) => client.delete(`/questions/${id}`).then((r) => r.data);

export const getQuiz = (quizId) => client.get(`/quiz/${quizId}`).then((r) => r.data);
export const submitQuiz = (quizId, answers) =>
  client.post(`/quiz/${quizId}/submit`, { answers }).then((r) => r.data);

export const chapterImageUrl = (filename) => `${API}/chapter-image/${filename}?v=6`;

export const getChapterBank = (bankKey) => client.get(`/chapter-bank/${bankKey}`).then((r) => r.data);
export const editChapterQuestion = (bankKey, questionNo, payload) =>
  client.put(`/chapter-bank/${bankKey}/question/${questionNo}`, payload).then((r) => r.data);

export const getFullPaper = (paperId) => client.get(`/full-paper/${paperId}`).then((r) => r.data);
