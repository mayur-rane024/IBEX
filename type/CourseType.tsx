export type Course = {
  courseId: string;
  courseName: string;
  type: string;
  createdAt: string;
  id: string;
  courseLayout: courseLayout;
  chapterContentSlides: ChapterContentSlide[];
};

export type courseLayout = {
  courseId: string;
  courseName: string;
  courseDescription: string;
  level: string;
  totalChapters: number;
  chapters: Chapter[];
  aiProvider?: "global-ai" | "local-ai";
  slideModel?: string;
};

export type Chapter = {
  chapterId: string;
  chapterTitle: string;
  subContent: string[];
};

export type ChapterContentSlide = {
  id: number;
  courseId: string;
  chapterId: string;
  slideId: string;
  slideIndex: number;
  audioFileName: string;
  audioFileUrl: string;
  narration: {
    fullText: string;
  };
  html: string;
  revealData: string[];
};
