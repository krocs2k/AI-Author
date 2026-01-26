
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookSession, WizardStep, Synopsis, BookTitle, Chapter, BookMetrics, Character, CharacterRecommendations, CharacterRole, ChapterRecommendations } from '@/lib/types';
import { ProgressBar } from './wizard/progress-bar';
import { GenreSelection } from './wizard/genre-selection';
import { SynopsisGeneration } from './wizard/synopsis-generation';
import { TitlePlanning } from './wizard/title-planning';
import { CharacterGeneration } from './wizard/character-generation';
import { ContentCreation } from './wizard/content-creation';
import { MarketingFinalization } from './wizard/marketing-finalization';
import { AnimatedProgress, PROGRESS_CONFIGS, ProgressStep } from './ui/animated-progress';
import { calculateReadTime, generateHumanizationScore, generateSuccessProbability, simulateAnalysisDelay, downloadAsFile, downloadBookAsPDF, downloadBookAsDocx, downloadBookAsText } from '@/lib/utils';
import { BOOK_GENRES } from '@/lib/genres';
import { Button } from './ui/button';
import { BookOpen, LogOut, Shield, User, RotateCcw } from 'lucide-react';

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Genre', description: 'Select your book genre', completed: false },
  { id: 2, title: 'Synopsis', description: 'Generate book concepts', completed: false },
  { id: 3, title: 'Title & Plan', description: 'Choose title and structure', completed: false },
  { id: 4, title: 'Characters', description: 'Create your cast', completed: false },
  { id: 5, title: 'Content', description: 'Write your book', completed: false },
  { id: 6, title: 'Marketing', description: 'Create marketing assets', completed: false },
];

export default function AIAuthorWizard() {
  const { data: userSession } = useSession() || {};
  const router = useRouter();
  const isAdmin = (userSession?.user as any)?.role === 'ADMIN';
  
  const [sessionId, setSessionId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState<Partial<BookSession>>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  
  // Animated progress state
  const [progressConfig, setProgressConfig] = useState<{
    isVisible: boolean;
    title: string;
    icon: 'analyze' | 'synopsis' | 'title' | 'content' | 'marketing' | 'general';
    steps: ProgressStep[];
    currentStepIndex: number;
  }>({
    isVisible: false,
    title: '',
    icon: 'general',
    steps: [],
    currentStepIndex: 0,
  });

  const startProgress = useCallback((configKey: keyof typeof PROGRESS_CONFIGS) => {
    const config = PROGRESS_CONFIGS[configKey];
    setProgressConfig({
      isVisible: true,
      title: config.title,
      icon: config.icon,
      steps: config.steps.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })),
      currentStepIndex: 0,
    });
  }, []);

  const advanceProgress = useCallback((detail?: string) => {
    setProgressConfig(prev => {
      const newSteps = [...prev.steps];
      const nextIndex = prev.currentStepIndex + 1;
      
      // Complete current step
      if (prev.currentStepIndex < newSteps.length) {
        newSteps[prev.currentStepIndex] = { ...newSteps[prev.currentStepIndex], status: 'completed' };
      }
      // Set next step as active
      if (nextIndex < newSteps.length) {
        newSteps[nextIndex] = { ...newSteps[nextIndex], status: 'active', detail };
      }
      
      return {
        ...prev,
        steps: newSteps,
        currentStepIndex: Math.min(nextIndex, newSteps.length - 1),
      };
    });
  }, []);

  const completeProgress = useCallback(() => {
    setProgressConfig(prev => ({
      ...prev,
      steps: prev.steps.map(s => ({ ...s, status: 'completed' })),
    }));
    setTimeout(() => {
      setProgressConfig(prev => ({ ...prev, isVisible: false }));
    }, 600);
  }, []);

  const hideProgress = useCallback(() => {
    setProgressConfig(prev => ({ ...prev, isVisible: false }));
  }, []);

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

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/session', { method: 'POST' });
      const data = await response.json();
      setSessionId(data.sessionId);
      setSession({});
      setCurrentStep(1);
      setIsLoading({});
    } catch (error) {
      console.error('Failed to start new session:', error);
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
    if (!session.selectedGenre) {
      console.error('No genre selected');
      return;
    }
    
    setIsLoading({ genre: true });
    startProgress('genreAnalysis');
    
    try {
      // Step 1: Initialize
      advanceProgress('Initializing AI analysis');
      await new Promise(r => setTimeout(r, 500));
      advanceProgress('Fetching bestseller data');
      
      console.log('Starting genre analysis for:', session.selectedGenre);
      
      // Step 2: MojoSauce analysis
      const response = await fetch('/api/analyze-genre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: session.selectedGenre }),
      });
      
      advanceProgress('Analyzing author techniques');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Genre analysis API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const analysis = await response.json();
      console.log('Genre analysis received:', { 
        hasMojoSauce: !!analysis.mojoSauce, 
        hasSecretSauce: !!analysis.secretSauce 
      });
      
      // Step 3: SecretSauce
      advanceProgress('Compiling insights');
      await new Promise(r => setTimeout(r, 300));
      
      // Validate that we have the required data
      if (!analysis.mojoSauce || !analysis.secretSauce) {
        console.error('Invalid analysis response - missing mojoSauce or secretSauce');
        throw new Error('Invalid analysis response');
      }
      
      // Update session state directly first for immediate UI update
      setSession(prev => ({
        ...prev,
        genreAnalysis: analysis.mojoSauce,
        authorAnalysis: analysis.secretSauce,
        currentStep: 2,
      }));
      
      // Then persist to backend
      if (sessionId) {
        fetch('/api/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId,
            genreAnalysis: analysis.mojoSauce,
            authorAnalysis: analysis.secretSauce,
            currentStep: 2,
          }),
        }).catch(err => console.error('Session sync error:', err));
      }
      
      completeProgress();
      setCurrentStep(2);
      console.log('Genre analysis complete, moving to step 2');
      
    } catch (error) {
      console.error('Genre analysis failed:', error);
      hideProgress();
    } finally {
      setIsLoading({ genre: false });
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
      selectedSynopsisId: synopsisId,
    });
  };

  const handleGenerateSynopses = async () => {
    setIsLoading({ synopses: true });
    startProgress('synopsisGeneration');
    
    try {
      // Step 1: Preparing
      await new Promise(r => setTimeout(r, 600));
      advanceProgress('Creating unique concepts');
      
      const response = await fetch('/api/generate-synopses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: session.selectedGenre,
          customTopic: session.customTopic,
          genreAnalysis: session.genreAnalysis,
        }),
      });
      
      advanceProgress('Optimizing for market');
      await new Promise(r => setTimeout(r, 500));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const synopses = await response.json();
      
      // Step 4: Scoring
      advanceProgress('Calculating probabilities');
      await new Promise(r => setTimeout(r, 400));
      
      // Ensure we always have an array
      const validSynopses = Array.isArray(synopses) ? synopses : [];
      
      await updateSession({ synopses: validSynopses });
      completeProgress();
    } catch (error) {
      console.error('Synopsis generation failed:', error);
      hideProgress();
      // Set empty array as fallback to prevent runtime errors
      await updateSession({ synopses: [] });
    } finally {
      setIsLoading({});
    }
  };

  const handleSynopsisNext = async () => {
    if (!session.selectedSynopsis) return;
    
    setIsLoading({ titles: true, chapterRecommendations: true });
    startProgress('titleGeneration');
    
    try {
      // Step 1: Analyzing synopsis
      await new Promise(r => setTimeout(r, 600));
      advanceProgress('Creating title options');
      
      // Fetch titles and chapter recommendations in parallel
      const [titlesResponse, chapterRecResponse] = await Promise.all([
        fetch('/api/generate-titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            synopsis: session.selectedSynopsis,
            genre: session.selectedGenre,
          }),
        }),
        fetch('/api/generate-chapter-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getRecommendations',
            genre: session.selectedGenre,
          }),
        })
      ]);
      
      advanceProgress('Evaluating market appeal');
      await new Promise(r => setTimeout(r, 400));
      
      const titles = await titlesResponse.json();
      const chapterRecData = await chapterRecResponse.json();
      
      // Use chapter recommendations if available, otherwise fall back to genre analysis
      const recommendations = chapterRecData.success ? chapterRecData.recommendations : null;
      
      await updateSession({
        generatedTitles: titles,
        chapterRecommendations: recommendations,
        plannedChapters: recommendations?.recommendedChapters || session.genreAnalysis?.avgChapters || 20,
        wordsPerChapter: recommendations?.recommendedWordsPerChapter || session.genreAnalysis?.avgWordsPerChapter || 3500,
        currentStep: 3,
      });
      
      completeProgress();
      setCurrentStep(3);
    } catch (error) {
      console.error('Title generation failed:', error);
      hideProgress();
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
      selectedTitleId: titleId,
      customTitle: undefined,
    });
  };

  const handleCustomTitleChange = (title: string) => {
    updateSession({ 
      customTitle: title,
      selectedTitle: undefined,
      selectedTitleId: undefined,
    });
  };

  const handleChaptersChange = (chapters: number) => {
    updateSession({ plannedChapters: chapters });
  };

  const handleWordsPerChapterChange = (words: number) => {
    updateSession({ wordsPerChapter: words });
  };

  const handleFetchChapterRecommendations = async () => {
    setIsLoading(prev => ({ ...prev, chapterRecommendations: true }));
    
    try {
      const response = await fetch('/api/generate-chapter-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getRecommendations',
          genre: session.selectedGenre,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recommendations) {
          setSession(prev => ({ 
            ...prev, 
            chapterRecommendations: data.recommendations,
            // Auto-update to recommended values if user hasn't customized
            plannedChapters: prev.plannedChapters || data.recommendations.recommendedChapters,
            wordsPerChapter: prev.wordsPerChapter || data.recommendations.recommendedWordsPerChapter,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch chapter recommendations:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, chapterRecommendations: false }));
    }
  };

  const handlePlanningNext = async () => {
    // Automatically fetch character recommendations when moving to characters step
    setIsLoading(prev => ({ ...prev, recommendations: true }));
    
    try {
      const response = await fetch('/api/generate-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getRecommendations',
          genre: session.selectedGenre
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recommendations) {
          setSession(prev => ({ ...prev, characterRecommendations: data.recommendations }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch character recommendations:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, recommendations: false }));
    }
    
    updateSession({ currentStep: 4 });
    setCurrentStep(4);
  };

  // Step 4: Character Generation
  const handleFetchCharacterRecommendations = async () => {
    setIsLoading(prev => ({ ...prev, recommendations: true }));
    
    try {
      const response = await fetch('/api/generate-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getRecommendations',
          genre: session.selectedGenre
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recommendations) {
          setSession(prev => ({ ...prev, characterRecommendations: data.recommendations }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch character recommendations:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, recommendations: false }));
    }
  };

  const handleGenerateCharacters = async (config: { protagonists: number; antagonists: number; supporting: number; minor: number }) => {
    setIsLoading(prev => ({ ...prev, characters: true }));
    startProgress('characterGeneration');
    
    try {
      advanceProgress('Analyzing genre requirements');
      
      const bookTitle = session.selectedTitle || session.customTitle;
      const bookSynopsis = session.selectedSynopsis;
      const bookGenre = session.selectedGenre;
      
      if (!bookTitle || !bookSynopsis || !bookGenre) {
        throw new Error('Missing required data: title, synopsis, or genre');
      }
      
      advanceProgress('Developing protagonist(s)');
      
      const response = await fetch('/api/generate-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateCharacters',
          genre: bookGenre,
          synopsis: bookSynopsis,
          title: bookTitle,
          characterConfig: config
        }),
      });
      
      advanceProgress('Creating antagonist(s)');
      await new Promise(r => setTimeout(r, 300));
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      advanceProgress('Building supporting cast');
      await new Promise(r => setTimeout(r, 300));
      
      if (!data.success || !data.characters) {
        throw new Error(data.error || 'Failed to generate characters');
      }
      
      advanceProgress('Establishing relationships');
      await new Promise(r => setTimeout(r, 200));
      
      advanceProgress('Finalizing character profiles');
      await new Promise(r => setTimeout(r, 200));
      
      console.log(`Generated ${data.characters.length} characters successfully`);
      
      setSession(prev => ({ ...prev, characters: data.characters }));
      completeProgress();
      
    } catch (error) {
      console.error('Character generation failed:', error);
      hideProgress();
    } finally {
      setIsLoading(prev => ({ ...prev, characters: false }));
    }
  };

  const handleAddCharacter = async (role: CharacterRole) => {
    setIsLoading(prev => ({ ...prev, addCharacter: true }));
    
    try {
      const bookTitle = session.selectedTitle || session.customTitle;
      const bookSynopsis = session.selectedSynopsis;
      const bookGenre = session.selectedGenre;
      
      const response = await fetch('/api/generate-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateSingle',
          genre: bookGenre,
          synopsis: bookSynopsis,
          title: bookTitle,
          role: role,
          existingCharacters: session.characters || []
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.character) {
          setSession(prev => ({
            ...prev,
            characters: [...(prev.characters || []), data.character]
          }));
        }
      }
    } catch (error) {
      console.error('Failed to add character:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, addCharacter: false }));
    }
  };

  const handleCharactersNext = () => {
    updateSession({ currentStep: 5 });
    setCurrentStep(5);
  };

  // Step 5: Content Creation
  const handleGenerateForward = async () => {
    setIsLoading({ forward: true });
    startProgress('contentGeneration');
    
    try {
      // Step 1: Drafting
      await new Promise(r => setTimeout(r, 500));
      advanceProgress('Writing forward section');
      
      const bookTitle = session.selectedTitle || session.customTitle;
      const bookSynopsis = session.selectedSynopsis;
      const bookGenre = session.selectedGenre;
      
      console.log('Generating forward with:', { bookTitle, bookSynopsis: bookSynopsis?.substring(0, 100), bookGenre });
      
      if (!bookTitle || !bookSynopsis || !bookGenre) {
        throw new Error('Missing required data: title, synopsis, or genre');
      }
      
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'forward',
          title: bookTitle,
          synopsis: bookSynopsis,
          genre: bookGenre,
          authorAnalysis: session.authorAnalysis,
        }),
      });
      
      advanceProgress('Applying voice style');
      await new Promise(r => setTimeout(r, 400));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Forward generation API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const content = await response.json();
      
      if (content.error) {
        throw new Error(content.error);
      }
      
      advanceProgress('Validating content');
      await new Promise(r => setTimeout(r, 300));
      
      console.log('Forward generated successfully:', { wordCount: content.wordCount });
      
      await updateSession({
        forward: content.content,
        forwardWordCount: content.wordCount,
      });
      
      completeProgress();
    } catch (error) {
      console.error('Forward generation failed:', error);
      hideProgress();
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateChapter = async (chapterNumber: number) => {
    setIsLoading(prev => ({ ...prev, [`chapter-${chapterNumber}`]: true }));
    startProgress('contentGeneration');
    
    try {
      // Step 1: Starting draft
      advanceProgress(`Preparing chapter ${chapterNumber}`);
      
      const bookTitle = session.selectedTitle || session.customTitle;
      const bookSynopsis = session.selectedSynopsis;
      const bookGenre = session.selectedGenre;
      const targetWords = session.wordsPerChapter || 3500;
      
      console.log(`Generating chapter ${chapterNumber} with multi-stage approach:`, { bookTitle, bookGenre, targetWords });
      
      if (!bookTitle || !bookSynopsis || !bookGenre) {
        throw new Error('Missing required data: title, synopsis, or genre');
      }
      
      // Step 2: Opening section
      advanceProgress(`Writing opening (~${Math.floor(targetWords / 4)} words)`);
      
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chapter',
          sessionId,
          chapterNumber,
          title: bookTitle,
          synopsis: bookSynopsis,
          genre: bookGenre,
          authorAnalysis: session.authorAnalysis,
          wordsPerChapter: targetWords,
        }),
      });
      
      // Step 3: Middle sections (shown while waiting)
      advanceProgress(`Building narrative (~${Math.floor(targetWords / 2)} words)`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chapter generation API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const content = await response.json();
      
      // Step 4: Conclusion
      advanceProgress(`Finalizing chapter`);
      await new Promise(r => setTimeout(r, 200));
      
      if (content.error) {
        throw new Error(content.error);
      }
      
      // Step 5: Humanization
      advanceProgress('Applying humanization');
      await new Promise(r => setTimeout(r, 200));
      
      // Step 6: Final polish
      advanceProgress('Final polish');
      await new Promise(r => setTimeout(r, 150));
      
      const stagesUsed = content.stages || 1;
      console.log(`Chapter ${chapterNumber} generated: ${content.wordCount} words in ${stagesUsed} stages`);
      
      const newChapter: Chapter = {
        id: `chapter-${chapterNumber}`,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content: content.content,
        wordCount: content.wordCount,
        humanizationScore: content.humanizationScore || 95,
        generatedAt: new Date(),
        wordTarget: content.wordTarget,
        meetsWordCountRequirement: content.meetsWordCountRequirement,
        wordCountCompliance: content.wordCountCompliance,
        wordCountStatus: content.wordCountStatus,
        wordCountMessage: content.wordCountMessage,
        wordCountRange: content.wordCountRange,
        generationAttempts: content.generationAttempts,
        finalAttempt: content.finalAttempt,
        validationDetails: content.validationDetails,
        warning: content.warning,
        stages: stagesUsed,
      };
      
      completeProgress();
      
      // Use functional update to avoid stale closure issues
      setSession(prevSession => {
        const currentChapters = prevSession.chapters || [];
        const existingIndex = currentChapters.findIndex(c => c.chapterNumber === chapterNumber);
        
        let updatedChapters: Chapter[];
        if (existingIndex >= 0) {
          updatedChapters = [...currentChapters];
          updatedChapters[existingIndex] = newChapter;
        } else {
          updatedChapters = [...currentChapters, newChapter];
        }
        
        updatedChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
        
        const updatedSession = { ...prevSession, chapters: updatedChapters };
        
        // Fire and forget the API update (chapter is already saved in database by generate-content)
        if (sessionId) {
          fetch('/api/session', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          }).catch(err => console.error('Session sync error:', err));
        }
        
        return updatedSession;
      });
      
    } catch (error) {
      console.error('Chapter generation failed:', error);
      hideProgress();
    } finally {
      setIsLoading(prev => ({ ...prev, [`chapter-${chapterNumber}`]: false }));
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
    updateSession({ currentStep: 6 });
    setCurrentStep(6);
  };

  // Step 6: Marketing
  const handleGenerateCoverPrompts = async () => {
    setIsLoading({ covers: true });
    startProgress('marketingGeneration');
    
    try {
      advanceProgress('Analyzing visual themes');
      
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
      
      advanceProgress('Generating cover concepts');
      await new Promise(r => setTimeout(r, 400));
      
      const prompts = await response.json();
      await updateSession({ coverPrompts: prompts });
      
      completeProgress();
    } catch (error) {
      console.error('Cover prompt generation failed:', error);
      hideProgress();
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateSalesCopy = async () => {
    setIsLoading({ sales: true });
    startProgress('marketingGeneration');
    
    try {
      advanceProgress('Analyzing market appeal');
      
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
      
      advanceProgress('Crafting persuasive copy');
      await new Promise(r => setTimeout(r, 400));
      
      const result = await response.json();
      await updateSession({ salesCopy: result.content });
      
      completeProgress();
    } catch (error) {
      console.error('Sales copy generation failed:', error);
      hideProgress();
    } finally {
      setIsLoading({});
    }
  };

  const handleGenerateBackCover = async () => {
    setIsLoading({ backCover: true });
    startProgress('marketingGeneration');
    
    try {
      advanceProgress('Extracting key hooks');
      
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
      
      advanceProgress('Writing back cover blurb');
      await new Promise(r => setTimeout(r, 400));
      
      const result = await response.json();
      await updateSession({ backCoverCopy: result.copy });
      
      completeProgress();
    } catch (error) {
      console.error('Back cover generation failed:', error);
      hideProgress();
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
      {/* Animated Progress Overlay */}
      <AnimatedProgress
        isVisible={progressConfig.isVisible}
        title={progressConfig.title}
        icon={progressConfig.icon}
        steps={progressConfig.steps}
        currentStepIndex={progressConfig.currentStepIndex}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-teal-400" />
            <h1 className="text-2xl font-bold text-teal-400">AI Author</h1>
          </div>
          <div className="flex items-center gap-4">
            {userSession?.user && (
              <div className="flex items-center gap-2 text-gray-400">
                <User className="h-4 w-4" />
                <span className="text-sm">{userSession.user.name || userSession.user.email}</span>
              </div>
            )}
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewSession}
              className="text-gray-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Session
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

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
              selectedSynopsisId={session.selectedSynopsisId}
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
              selectedTitleId={session.selectedTitleId}
              selectedTitle={session.selectedTitle}
              customTitle={session.customTitle}
              plannedChapters={session.plannedChapters}
              wordsPerChapter={session.wordsPerChapter}
              genreAnalysis={session.genreAnalysis}
              chapterRecommendations={session.chapterRecommendations}
              onTitleSelect={handleTitleSelect}
              onCustomTitleChange={handleCustomTitleChange}
              onChaptersChange={handleChaptersChange}
              onWordsPerChapterChange={handleWordsPerChapterChange}
              onFetchRecommendations={handleFetchChapterRecommendations}
              onNext={handlePlanningNext}
              isLoadingRecommendations={isLoading.chapterRecommendations}
            />
          )}
          
          {currentStep === 4 && (
            <CharacterGeneration
              genre={session.selectedGenre}
              title={session.selectedTitle || session.customTitle}
              synopsis={session.selectedSynopsis}
              recommendations={session.characterRecommendations}
              characters={session.characters}
              onFetchRecommendations={handleFetchCharacterRecommendations}
              onGenerateCharacters={handleGenerateCharacters}
              onAddCharacter={handleAddCharacter}
              onNext={handleCharactersNext}
              isLoading={isLoading}
            />
          )}
          
          {currentStep === 5 && (
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
          
          {currentStep === 6 && (
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

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AI Author. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
