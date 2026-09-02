import { Atom, FlaskConical, Sigma, Dna } from "lucide-react";

export const SUBJECT_META = {
  physics: { name: "Physics", Icon: Atom, bg: "bg-blue-600" },
  chemistry: { name: "Chemistry", Icon: FlaskConical, bg: "bg-emerald-600" },
  math: { name: "Mathematics", Icon: Sigma, bg: "bg-violet-600" },
  biology: { name: "Biology", Icon: Dna, bg: "bg-rose-600" },
};

// Chapter names for 1st PUC (Class 11) and 2nd PUC (Class 12) — Karnataka / NCERT syllabus.
export const EXAM_CHAPTERS = {
  physics: {
    "11": [
      "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane",
      "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion",
      "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
      "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves",
    ],
    "12": [
      "Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity",
      "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction",
      "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments",
      "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics",
    ],
  },
  chemistry: {
    "11": [
      "Some Basic Concepts of Chemistry", "Structure of Atom",
      "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure",
      "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen",
      "The s-Block Elements", "The p-Block Elements",
      "Organic Chemistry – Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry",
    ],
    "12": [
      "Solutions", "Electrochemistry", "Chemical Kinetics", "The d and f Block Elements",
      "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules",
    ],
  },
  math: {
    "11": [
      "Sets", "Relations and Functions", "Trigonometric Functions",
      "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations",
      "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections",
      "Introduction to Three Dimensional Geometry", "Limits and Derivatives", "Statistics", "Probability",
    ],
    "12": [
      "Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants",
      "Continuity and Differentiability", "Application of Derivatives", "Integrals",
      "Application of Integrals", "Differential Equations", "Vector Algebra",
      "Three Dimensional Geometry", "Linear Programming", "Probability",
    ],
  },
  biology: {
    "11": [
      "The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom",
      "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals",
      "Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Transport in Plants",
      "Mineral Nutrition", "Photosynthesis in Higher Plants", "Respiration in Plants",
      "Plant Growth and Development", "Digestion and Absorption", "Breathing and Exchange of Gases",
      "Body Fluids and Circulation", "Excretory Products and their Elimination", "Locomotion and Movement",
      "Neural Control and Coordination", "Chemical Coordination and Integration",
    ],
    "12": [
      "Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction",
      "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance",
      "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production",
      "Microbes in Human Welfare", "Biotechnology: Principles and Processes",
      "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem",
      "Biodiversity and Conservation", "Environmental Issues",
    ],
  },
};
