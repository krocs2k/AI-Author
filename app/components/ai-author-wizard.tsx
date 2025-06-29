
'use client';

import { useState, useEffect } from 'react';
import { BookSession, WizardStep, Synopsis, BookTitle, Chapter, BookMetrics } from '@/lib/types';
import { ProgressBar } from './wizard/progress-bar';
import { GenreSelection } from './wizard/genre-selection';
import { SynopsisGeneration } from './wizard/synopsis-generation';
import { TitlePlanning } from './wizard/title-planning';
import { ContentCreation } from './wizard/content-creation';
import { MarketingFinalization } from './wizard/marketing-finalization';
import { calculateReadTime, generateHumanizationScore, generateSuccessProbability, simulateAnalysisDelay, downloadAsFile, downloadBookAsPDF, downloadBookAsDocx, downloadBookAsText } from '@/lib/utils';
import { BOOK_GENRES } from '@/lib/genres';

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Genre', description: 'Select your book genre', completed: false },
  { id: 2, title: 'Synopsis', description: 'Generate book concepts', completed: false },
  { id: 3, title: 'Title & Plan', description: 'Choose title and structure', completed: false },
  { id: 4, title: 'Content', description: 'Write your book', completed: false },
  { id: 5, title: 'Marketing', description: 'Create marketing assets', completed: false },
];

export function AIAuthorWizard() {
  const [sessionId, setSessionId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState<Partial<BookSession>>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch('/api/session', { method: 'POST' });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    initSession();
  }, []);

  const updateSession = async (updates: Partial<BookSession>) => {
    if (!sessionId) return;
    
    try {
      const updatedSession = { ...session, ...updates };
      setSession(updatedSession);
      
      await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...updates }),
      });
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const calculateMetrics = (chapters: Chapter[] = [], forward?: string): BookMetrics => {
    const forwardWordCount = forward?.split(/\s+/).length || 0;
    const chapterWordCount = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
    const totalWordCount = forwardWordCount + chapterWordCount;
    
    const avgHumanization = chapters.length > 0 
      ? chapters.reduce((sum, chapter) => sum + (chapter.humanizationScore || 0), 0) / chapters.length
      : 0;
    
    return {
      totalWordCount,
      estimatedReadTime: calculateReadTime(totalWordCount),
      humanizationScore: Math.round(avgHumanization),
      successProbability: generateSuccessProbability(),
    };
  };

  // Step 1: Genre Selection
  const handleGenreSelect = (genreId: string) => {
    updateSession({ selectedGenre: genreId });
  };

  const handleGenreNext = async () => {
    if (!session.selectedGenre) return;
    
    setIsLoading({ genre: true });
    
    try {
      await simulateAnalysisDelay();
      
      const response = await fetch('/api/analyze-genre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: session.selectedGenre }),
      });
      
      const analysis = await response.json();
      
      await updateSession({
        genreAnalysis: analysis.mojoSauce,
        authorAnalysis: analysis.secretSauce,
        currentStep: 2,
      });
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Genre analysis failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  // Step 2: Synopsis Generation
  const handleTopicChange = (topic: string) => {
    updateSession({ customTopic: topic });
  };

  const handleSynopsisSelect = (synopsisId: string) => {
    const selectedSynopsis = session.synopses?.find(s => s.id === synopsisId);
    updateSession({ 
      selectedSynopsis: selectedSynopsis?.content,
    });
  };

  const handleGenerateSynopses = async () => {
    setIsLoading({ synopses: true });
    
    try {
      const response = await fetch('/api/generate-synopses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: session.selectedGenre,
          customTopic: session.customTopic,
          genreAnalysis: session.genreAnalysis,
        }),
      });
      
      const synopses = await response.json();
      await updateSession({ synopses });
    } catch (error) {
      console.error('Synopsis generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  const handleSynopsisNext = async () => {
    if (!session.selectedSynopsis) return;
    
    setIsLoading({ titles: true });
    
    try {
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
        }),
      });
      
      const titles = await response.json();
      
      await updateSession({
        generatedTitles: titles,
        plannedChapters: session.genreAnalysis?.avgChapters || 20,
        wordsPerChapter: session.genreAnalysis?.avgWordsPerChapter || 3500,
        currentStep: 3,
      });
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Title generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  // Generate synopses on step entry
  useEffect(() => {
    if (currentStep === 2 && !session.synopses && session.selectedGenre) {
      handleGenerateSynopses();
    }
  }, [currentStep, session.selectedGenre]);

  // Step 3: Title & Planning
  const handleTitleSelect = (titleId: string) => {
    const selectedTitle = session.generatedTitles?.find(t => t.id === titleId);
    updateSession({ 
      selectedTitle: selectedTitle?.title,
      customTitle: undefined,
    });
  };

  const handleCustomTitleChange = (title: string) => {
    updateSession({ 
      customTitle: title,
      selectedTitle: undefined,
    });
  };

  const handleChaptersChange = (chapters: number) => {
    updateSession({ plannedChapters: chapters });
  };

  const handleWordsPerChapterChange = (words: number) => {
    updateSession({ wordsPerChapter: words });
  };

  const handlePlanningNext = () => {
    updateSession({ currentStep: 4 });
    setCurrentStep(4);
  };

  // Step 4: Content Creation
  const handleGenerateForward = async () => {
    setIsLoading({ forward: true });
    
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'forward',
          title: session.selectedTitle || session.customTitle,
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
          authorAnalysis: session.authorAnalysis,
        }),
      });
      
      const content = await response.json();
      await updateSession({
        forward: content.content,
        forwardWordCount: content.wordCount,
      });
    } catch (error) {
      console.error('Forward generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateChapter = async (chapterNumber: number) => {
    setIsLoading({ [`chapter-${chapterNumber}`]: true });
    
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chapter',
          sessionId,
          chapterNumber,
          title: session.selectedTitle || session.customTitle,
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
          authorAnalysis: session.authorAnalysis,
          wordsPerChapter: session.wordsPerChapter,
        }),
      });
      
      const content = await response.json();
      
      if (content.error) {
        throw new Error(content.error);
      }
      
      const newChapter: Chapter = {
        id: `chapter-${chapterNumber}`,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content: content.content,
        wordCount: content.wordCount,
        humanizationScore: content.humanizationScore,
        generatedAt: new Date(),
        wordTarget: content.wordTarget,
        meetsWordCountRequirement: content.meetsWordCountRequirement,
        wordCountCompliance: content.wordCountCompliance,
        generationAttempts: content.generationAttempts,
        finalAttempt: content.finalAttempt,
      };
      
      const updatedChapters = [...(session.chapters || [])];
      const existingIndex = updatedChapters.findIndex(c => c.chapterNumber === chapterNumber);
      
      if (existingIndex >= 0) {
        updatedChapters[existingIndex] = newChapter;
      } else {
        updatedChapters.push(newChapter);
      }
      
      updatedChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
      
      await updateSession({ chapters: updatedChapters });
    } catch (error) {
      console.error('Chapter generation failed:', error);
    } finally {
      setIsLoading({ ...isLoading, [`chapter-${chapterNumber}`]: false });
    }
  };

  const handleGenerateAllChapters = async () => {
    const totalChapters = session.plannedChapters || 20;
    setIsLoading({ chapters: true });
    
    for (let i = 1; i <= totalChapters; i++) {
      await handleGenerateChapter(i);
    }
    
    setIsLoading({});
  };

  const handleDownloadBook = async (format: 'pdf' | 'docx' | 'txt') => {
    const title = session.selectedTitle || session.customTitle || 'Untitled Book';
    const forward = session.forward || '';
    const chapters = session.chapters || [];
    
    // Use enhanced download functions based on format
    switch (format) {
      case 'pdf':
        await downloadBookAsPDF(title, forward, chapters);
        break;
      case 'docx':
        await downloadBookAsDocx(title, forward, chapters);
        break;
      case 'txt':
        downloadBookAsText(title, forward, chapters);
        break;
      default:
        downloadBookAsText(title, forward, chapters);
    }
  };

  const handleContentNext = () => {
    updateSession({ currentStep: 5 });
    setCurrentStep(5);
  };

  // Step 5: Marketing
  const handleGenerateCoverPrompts = async () => {
    setIsLoading({ covers: true });
    
    try {
      const response = await fetch('/api/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cover-prompts',
          title: session.selectedTitle || session.customTitle,
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
        }),
      });
      
      const prompts = await response.json();
      await updateSession({ coverPrompts: prompts });
    } catch (error) {
      console.error('Cover prompt generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateSalesCopy = async () => {
    setIsLoading({ sales: true });
    
    try {
      const response = await fetch('/api/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales-copy',
          title: session.selectedTitle || session.customTitle,
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
        }),
      });
      
      const result = await response.json();
      await updateSession({ salesCopy: result.content });
    } catch (error) {
      console.error('Sales copy generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateBackCover = async () => {
    setIsLoading({ backCover: true });
    
    try {
      const response = await fetch('/api/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'back-cover',
          title: session.selectedTitle || session.customTitle,
          synopsis: session.selectedSynopsis,
          genre: session.selectedGenre,
        }),
      });
      
      const result = await response.json();
      await updateSession({ backCoverCopy: result.copy });
    } catch (error) {
      console.error('Back cover generation failed:', error);
    } finally {
      setIsLoading({});
    }
  };

  const handleDownloadAll = async () => {
    const title = session.selectedTitle || session.customTitle || 'Untitled Book';
    const forward = session.forward || '';
    const chapters = session.chapters || [];
    
    // Download complete book with marketing materials in all formats
    await downloadBookAsPDF(title, forward, chapters, session.salesCopy, session.backCoverCopy);
    await downloadBookAsDocx(title, forward, chapters, session.salesCopy, session.backCoverCopy);
    downloadBookAsText(title, forward, chapters, session.salesCopy, session.backCoverCopy);
    
    // Download individual marketing assets
    if (session.coverPrompts) {
      const coverPromptsText = 'FRONT COVER PROMPTS:\n\n' + 
        session.coverPrompts.front?.join('\n\n') + 
        '\n\n\nBACK COVER PROMPTS:\n\n' + 
        session.coverPrompts.back?.join('\n\n');
      downloadAsFile(coverPromptsText, 'cover-prompts.txt');
    }
  };

  const metrics = calculateMetrics(session.chapters, session.forward);

  const selectedGenreName = BOOK_GENRES.find(g => g.id === session.selectedGenre)?.name;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <ProgressBar steps={WIZARD_STEPS} currentStep={currentStep} />
        
        <div className="max-w-7xl mx-auto">
          {currentStep === 1 && (
            <GenreSelection
              selectedGenre={session.selectedGenre}
              onGenreSelect={handleGenreSelect}
              onNext={handleGenreNext}
              isLoading={isLoading.genre}
            />
          )}
          
          {currentStep === 2 && (
            <SynopsisGeneration
              genreAnalysis={session.genreAnalysis}
              authorAnalysis={session.authorAnalysis}
              synopses={session.synopses}
              selectedSynopsis={session.selectedSynopsis}
              customTopic={session.customTopic}
              onTopicChange={handleTopicChange}
              onSynopsisSelect={handleSynopsisSelect}
              onRegenerateSynopses={handleGenerateSynopses}
              onNext={handleSynopsisNext}
              isLoading={isLoading.synopses || isLoading.titles}
            />
          )}
          
          {currentStep === 3 && (
            <TitlePlanning
              titles={session.generatedTitles}
              selectedTitle={session.selectedTitle}
              customTitle={session.customTitle}
              plannedChapters={session.plannedChapters}
              wordsPerChapter={session.wordsPerChapter}
              genreAnalysis={session.genreAnalysis}
              onTitleSelect={handleTitleSelect}
              onCustomTitleChange={handleCustomTitleChange}
              onChaptersChange={handleChaptersChange}
              onWordsPerChapterChange={handleWordsPerChapterChange}
              onNext={handlePlanningNext}
            />
          )}
          
          {currentStep === 4 && (
            <ContentCreation
              title={session.selectedTitle || session.customTitle}
              forward={session.forward}
              forwardWordCount={session.forwardWordCount}
              chapters={session.chapters}
              plannedChapters={session.plannedChapters}
              metrics={metrics}
              onGenerateForward={handleGenerateForward}
              onGenerateChapter={handleGenerateChapter}
              onGenerateAllChapters={handleGenerateAllChapters}
              onDownloadBook={handleDownloadBook}
              onNext={handleContentNext}
              isLoading={isLoading}
            />
          )}
          
          {currentStep === 5 && (
            <MarketingFinalization
              title={session.selectedTitle || session.customTitle}
              metrics={metrics}
              coverPrompts={session.coverPrompts}
              salesCopy={session.salesCopy}
              backCoverCopy={session.backCoverCopy}
              onGenerateCoverPrompts={handleGenerateCoverPrompts}
              onGenerateSalesCopy={handleGenerateSalesCopy}
              onGenerateBackCover={handleGenerateBackCover}
              onDownloadAll={handleDownloadAll}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
