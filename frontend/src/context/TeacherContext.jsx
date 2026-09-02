import React, { createContext, useContext, useState, useEffect } from "react";

const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
  const [teacherMode, setTeacherMode] = useState(
    () => localStorage.getItem("teacherMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("teacherMode", teacherMode);
  }, [teacherMode]);

  return (
    <TeacherContext.Provider value={{ teacherMode, setTeacherMode }}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => useContext(TeacherContext);
