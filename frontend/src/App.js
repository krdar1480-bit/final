import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TeacherProvider } from "@/context/TeacherContext";
import { Toaster } from "@/components/ui/sonner";
import SubjectBoard from "@/pages/SubjectBoard";
import ExamHome from "@/pages/ExamHome";
import SubjectDashboard from "@/pages/SubjectDashboard";
import QuestionPatterns from "@/pages/QuestionPatterns";
import Blueprint from "@/pages/Blueprint";
import ChapterWise from "@/pages/ChapterWise";
import ChapterDetail from "@/pages/ChapterDetail";
import FullPaper from "@/pages/FullPaper";
import PaperViewer from "@/pages/PaperViewer";
import ExamDashboard from "@/pages/ExamDashboard";
import ExamChapters from "@/pages/ExamChapters";
import ExamPapers from "@/pages/ExamPapers";
import NeetQuiz from "@/pages/NeetQuiz";
import ChapterPractice from "@/pages/ChapterPractice";
import FullPaperSolutions from "@/pages/FullPaperSolutions";

function App() {
  return (
    <div className="App">
      <TeacherProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ExamHome />} />
            <Route path="/board" element={<SubjectBoard />} />
            <Route path="/exam/:examId" element={<ExamDashboard />} />
            <Route path="/exam/:examId/papers" element={<ExamPapers />} />
          <Route path="/exam/:examId/quiz/:quizId" element={<NeetQuiz />} />
          <Route path="/exam/:examId/paper/:paperId/solutions" element={<FullPaperSolutions />} />
          <Route path="/exam/:examId/:subjectId/practice/:bankKey" element={<ChapterPractice />} />
            <Route path="/exam/:examId/:subjectId/chapters" element={<ExamChapters />} />
            <Route path="/exam/:examId/:subjectId/chapters/:cls" element={<ExamChapters />} />
            <Route path="/subject/:subjectId" element={<SubjectDashboard />} />
            <Route path="/subject/:subjectId/patterns" element={<QuestionPatterns />} />
            <Route path="/subject/:subjectId/blueprint" element={<Blueprint />} />
            <Route path="/subject/:subjectId/chapters" element={<ChapterWise />} />
            <Route path="/subject/:subjectId/chapters/:ch" element={<ChapterDetail />} />
            <Route path="/subject/:subjectId/papers" element={<FullPaper />} />
            <Route path="/subject/:subjectId/papers/:paperId" element={<PaperViewer />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </TeacherProvider>
    </div>
  );
}

export default App;
