"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export interface YearRange {
  from: number;
  to: number;
}

export interface AnalysisResult {
  id: string;
  title: string;
  score: number;
}

export interface UseAnalysisState {
  files: File[];
  syllabus: string;
  subject: string;
  yearRange: YearRange;
  isLoading: boolean;
  results: AnalysisResult[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  setSyllabus: Dispatch<SetStateAction<string>>;
  setSubject: Dispatch<SetStateAction<string>>;
  setYearRange: Dispatch<SetStateAction<YearRange>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setResults: Dispatch<SetStateAction<AnalysisResult[]>>;
}

export function useAnalysis(): UseAnalysisState {
  const [files, setFiles] = useState<File[]>([]);
  const [syllabus, setSyllabus] = useState("");
  const [subject, setSubject] = useState("");
  const [yearRange, setYearRange] = useState<YearRange>({ from: 2019, to: 2024 });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);

  return {
    files,
    syllabus,
    subject,
    yearRange,
    isLoading,
    results,
    setFiles,
    setSyllabus,
    setSubject,
    setYearRange,
    setIsLoading,
    setResults,
  };
}

