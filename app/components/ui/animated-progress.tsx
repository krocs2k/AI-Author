'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles, Brain, BookOpen, Wand2, PenTool, Megaphone } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  detail?: string;
}

interface AnimatedProgressProps {
  isVisible: boolean;
  title: string;
  steps: ProgressStep[];
  currentStepIndex: number;
  icon?: 'analyze' | 'synopsis' | 'title' | 'content' | 'marketing' | 'general';
}

const iconMap = {
  analyze: Brain,
  synopsis: Sparkles,
  title: BookOpen,
  content: PenTool,
  marketing: Megaphone,
  general: Wand2,
};

export function AnimatedProgress({ isVisible, title, steps, currentStepIndex, icon = 'general' }: AnimatedProgressProps) {
  const IconComponent = iconMap[icon];
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header with animated icon */}
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="p-3 bg-teal-500/20 rounded-xl"
              >
                <IconComponent className="h-8 w-8 text-teal-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-gray-400 text-sm">Please wait{dots}</p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    step.status === 'active'
                      ? 'bg-teal-500/10 border border-teal-500/30'
                      : step.status === 'completed'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : step.status === 'error'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-gray-700/30 border border-gray-700'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {step.status === 'active' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-5 w-5 text-teal-400" />
                      </motion.div>
                    ) : step.status === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </motion.div>
                    ) : step.status === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                    )}
                  </div>

                  {/* Label and detail */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      step.status === 'active'
                        ? 'text-teal-300'
                        : step.status === 'completed'
                        ? 'text-green-300'
                        : step.status === 'error'
                        ? 'text-red-300'
                        : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.detail && step.status === 'active' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 truncate"
                      >
                        {step.detail}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Preset progress configurations for different actions
export const PROGRESS_CONFIGS = {
  genreAnalysis: {
    title: 'Analyzing Genre',
    icon: 'analyze' as const,
    steps: [
      { id: 'init', label: 'Initializing AI analysis', status: 'pending' as const },
      { id: 'mojo', label: 'Analyzing MojoSauce (bestsellers)', status: 'pending' as const },
      { id: 'secret', label: 'Extracting SecretSauce (author techniques)', status: 'pending' as const },
      { id: 'compile', label: 'Compiling insights', status: 'pending' as const },
    ],
  },
  synopsisGeneration: {
    title: 'Generating Synopses',
    icon: 'synopsis' as const,
    steps: [
      { id: 'init', label: 'Preparing creative engine', status: 'pending' as const },
      { id: 'concepts', label: 'Generating book concepts', status: 'pending' as const },
      { id: 'refine', label: 'Refining for commercial appeal', status: 'pending' as const },
      { id: 'score', label: 'Calculating success probabilities', status: 'pending' as const },
    ],
  },
  titleGeneration: {
    title: 'Generating Titles',
    icon: 'title' as const,
    steps: [
      { id: 'init', label: 'Analyzing synopsis themes', status: 'pending' as const },
      { id: 'generate', label: 'Generating title options', status: 'pending' as const },
      { id: 'market', label: 'Evaluating market appeal', status: 'pending' as const },
    ],
  },
  chapterPlanning: {
    title: 'Planning Chapters',
    icon: 'content' as const,
    steps: [
      { id: 'structure', label: 'Designing story structure', status: 'pending' as const },
      { id: 'outline', label: 'Creating chapter outlines', status: 'pending' as const },
      { id: 'pacing', label: 'Optimizing pacing', status: 'pending' as const },
    ],
  },
  contentGeneration: {
    title: 'Writing Chapter',
    icon: 'content' as const,
    steps: [
      { id: 'draft', label: 'Drafting content', status: 'pending' as const },
      { id: 'stage1', label: 'Writing opening section', status: 'pending' as const },
      { id: 'stage2', label: 'Developing middle sections', status: 'pending' as const },
      { id: 'stage3', label: 'Crafting chapter conclusion', status: 'pending' as const },
      { id: 'humanize', label: 'Applying humanization', status: 'pending' as const },
      { id: 'polish', label: 'Final polish', status: 'pending' as const },
    ],
  },
  marketingGeneration: {
    title: 'Creating Marketing Assets',
    icon: 'marketing' as const,
    steps: [
      { id: 'cover', label: 'Generating cover concept', status: 'pending' as const },
      { id: 'blurb', label: 'Writing book blurb', status: 'pending' as const },
      { id: 'sales', label: 'Crafting sales copy', status: 'pending' as const },
      { id: 'keywords', label: 'Extracting keywords', status: 'pending' as const },
    ],
  },
};

// Hook for managing progress state
export function useAnimatedProgress(config: keyof typeof PROGRESS_CONFIGS) {
  const [isVisible, setIsVisible] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>(
    PROGRESS_CONFIGS[config].steps.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const start = () => {
    setIsVisible(true);
    const initialSteps: ProgressStep[] = PROGRESS_CONFIGS[config].steps.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' : 'pending'
    }));
    setSteps(initialSteps);
    setCurrentStepIndex(0);
  };

  const nextStep = (detail?: string) => {
    setSteps(prev => {
      const newSteps: ProgressStep[] = [...prev];
      // Complete current step
      if (currentStepIndex < newSteps.length) {
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'completed' };
      }
      // Set next step as active
      if (currentStepIndex + 1 < newSteps.length) {
        newSteps[currentStepIndex + 1] = { ...newSteps[currentStepIndex + 1], status: 'active', detail };
      }
      return newSteps;
    });
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  };

  const complete = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
    setTimeout(() => setIsVisible(false), 500);
  };

  const error = (message?: string) => {
    setSteps(prev => prev.map((s, i): ProgressStep => ({
      ...s,
      status: i < currentStepIndex ? 'completed' : i === currentStepIndex ? 'error' : 'pending',
      detail: i === currentStepIndex ? message : s.detail
    })));
    setTimeout(() => setIsVisible(false), 2000);
  };

  const hide = () => setIsVisible(false);

  return {
    isVisible,
    steps,
    currentStepIndex,
    title: PROGRESS_CONFIGS[config].title,
    icon: PROGRESS_CONFIGS[config].icon,
    start,
    nextStep,
    complete,
    error,
    hide,
  };
}
