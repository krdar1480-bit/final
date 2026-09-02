// Shared Karnataka II PUC blueprint data (Physics / Chemistry / Mathematics)

// Colour per mark-value (1/2/3/5/6)
export const MARK_COLORS = {
  "1": { cell: "text-blue-700", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  "2": { cell: "text-violet-700", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  "3": { cell: "text-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  "4": { cell: "text-teal-700", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  "5": { cell: "text-rose-700", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  "6": { cell: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// Map a pattern's per-question mark value -> blueprint Part key
export const MARK_TO_PART = { 1: "A", 2: "B", 3: "C", 5: "D", 6: "E", 10: "E" };

// r = [unit, ch, chapter, hours, marks, {A,B,C,D,E}]
const row = (unit, ch, chapter, hours, marks, vals) => ({ unit, ch, chapter, hours, marks, vals });

export const BLUEPRINTS = {
  physics: {
    code: "33", name: "Physics", maxMarks: 70,
    parts: [
      { key: "A", mark: "1", qs: "20", qCount: "20/20", mCount: "20/20" },
      { key: "B", mark: "2", qs: "8", qCount: "05/08", mCount: "10/16" },
      { key: "C", mark: "3", qs: "8", qCount: "05/08", mCount: "15/24" },
      { key: "D", mark: "5", qs: "9", qCount: "05/09", mCount: "25/45" },
    ],
    rows: [
      row("I", 1, "Electric Charges & Fields", 12, 11, { A: 1, B: 1, C: 1, D: 1 }),
      row("II", 2, "Electrostatic Potential and Capacitance", 12, 11, { A: 1, B: 1, C: 1, D: 1 }),
      row("III", 3, "Current Electricity", 15, 13, { A: 1, B: 1, C: "", D: 2 }),
      row("IV", 4, "Moving Charges and Magnetism", 13, 11, { A: 1, B: 1, C: 1, D: 1 }),
      row("V", 5, "Magnetism and Matter", 6, 5, { A: 2, B: "", C: 1, D: "" }),
      row("V", 6, "Electromagnetic Induction", 8, 7, { A: 2, B: 1, C: 1, D: "" }),
      row("VI", 7, "Alternating Current", 8, 7, { A: 2, B: "", C: "", D: 1 }),
      row("VI", 8, "Electromagnetic Waves", 3, 3, { A: 1, B: 1, C: "", D: "" }),
      row("VII", 9, "Ray Optics and Optical Instruments", 11, 10, { A: 2, B: "", C: 1, D: 1 }),
      row("VIII", 10, "Wave Optics", 8, 7, { A: 2, B: "", C: "", D: 1 }),
      row("IX", 11, "Dual Nature of Radiation and Matter", 6, 5, { A: 2, B: "", C: 1, D: "" }),
      row("IX", 12, "Atoms", 4, 3, { A: 1, B: 1, C: "", D: "" }),
      row("X", 13, "Nuclei", 5, 4, { A: 1, B: "", C: 1, D: "" }),
      row("X", 14, "Semiconductor Electronics", 9, 8, { A: 1, B: 1, C: "", D: 1 }),
    ],
  },
  chemistry: {
    code: "34", name: "Chemistry", maxMarks: 70,
    parts: [
      { key: "A", mark: "1", qs: "20", qCount: "20/20", mCount: "20/20" },
      { key: "B", mark: "2", qs: "5", qCount: "03/05", mCount: "06/10" },
      { key: "C", mark: "3", qs: "15", qCount: "08/15", mCount: "24/45" },
      { key: "D", mark: "5", qs: "6", qCount: "04/06", mCount: "20/30" },
    ],
    rows: [
      row("I", 1, "Solutions", 14, 12, { A: 3, B: "", C: 3, D: "" }),
      row("II", 2, "Electrochemistry", 14, 13, { A: 1, B: "", C: 4, D: "" }),
      row("III", 3, "Chemical Kinetics", 14, 12, { A: 1, B: 1, C: 3, D: "" }),
      row("IV", 4, "The d & f Block Elements", 12, 10, { A: 2, B: 1, C: 2, D: "" }),
      row("V", 5, "Coordination Compounds", 12, 11, { A: 2, B: "", C: 3, D: "" }),
      row("VI", 6, "Haloalkanes & Haloarenes", 10, 9, { A: 2, B: 1, C: "", D: 1 }),
      row("VII", 7, "Alcohols, Phenols & Ethers", 12, 10, { A: 3, B: 1, C: "", D: 1 }),
      row("VIII", 8, "Aldehydes, Ketones & Carboxylic Acids", 14, 12, { A: 2, B: "", C: "", D: 2 }),
      row("IX", 9, "Amines", 8, 7, { A: 2, B: "", C: "", D: 1 }),
      row("X", 10, "Biomolecules", 10, 9, { A: 2, B: 1, C: "", D: 1 }),
    ],
  },
  math: {
    code: "35", name: "Mathematics", maxMarks: 80,
    parts: [
      { key: "A", label: "A", mark: "1", qs: "20", qCount: "20/20", mCount: "20/20" },
      { key: "B", label: "B", mark: "2", qs: "9", qCount: "06/09", mCount: "12/18" },
      { key: "C", label: "C", mark: "3", qs: "9", qCount: "06/09", mCount: "18/27" },
      { key: "D", label: "D", mark: "5", qs: "7", qCount: "04/07", mCount: "20/35" },
      { key: "E", label: "E", mark: "6", qs: "2", qCount: "01/02", mCount: "06/12" },
      { key: "E4", label: "E", mark: "4", qs: "2", qCount: "01/02", mCount: "04/08" },
    ],
    rows: [
      row("1", 1, "Relations and Functions", 9, 9, { A: 1, B: "", C: 1, D: 1, E: "", E4: "" }),
      row("2", 2, "Inverse Trigonometric Functions", 6, 6, { A: 1, B: 1, C: 1, D: "", E: "", E4: "" }),
      row("3", 3, "Matrices", 9, 9, { A: 1, B: "", C: 1, D: 1, E: "", E4: "" }),
      row("4", 4, "Determinants", 12, 12, { A: 1, B: 1, C: "", D: 1, E: "", E4: 1 }),
      row("5", 5, "Continuity and Differentiability", 20, 17, { A: 3, B: 1, C: 1, D: 1, E: "", E4: 1 }),
      row("6", 6, "Application of Derivatives", 10, 8, { A: 3, B: 1, C: 1, D: "", E: "", E4: "" }),
      row("7", 7, "Integrals", 22, 18, { A: 2, B: 1, C: 1, D: 1, E: 1, E4: "" }),
      row("8", 8, "Application of Integrals", 5, 5, { A: "", B: "", C: "", D: 1, E: "", E4: "" }),
      row("9", 9, "Differential Equations", 10, 8, { A: 1, B: 1, C: "", D: 1, E: "", E4: "" }),
      row("10", 10, "Vector Algebra", 11, 8, { A: 3, B: 1, C: 1, D: "", E: "", E4: "" }),
      row("11", 11, "Three Dimensional Geometry", 8, 6, { A: 1, B: 1, C: 1, D: "", E: "", E4: "" }),
      row("12", 12, "Linear Programming", 7, 6, { A: "", B: "", C: "", D: "", E: 1, E4: "" }),
      row("13", 13, "Probability", 11, 8, { A: 3, B: 1, C: 1, D: "", E: "", E4: "" }),
    ],
  },
};
