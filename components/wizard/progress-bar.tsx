'use client';

import { Progress } from '@/components/ui/progress';
import { WizardStep } from '@/lib/types';

interface ProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ steps, currentStep, onStepClick }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isReached = stepNum <= currentStep;
          const clickable = !!onStepClick && isReached && stepNum !== currentStep;
          return (
            <button
              key={step.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(stepNum)}
              title={clickable ? `Jump back to step ${stepNum}` : undefined}
              className={`flex flex-col items-center ${
                isReached ? 'text-teal-400' : 'text-gray-500'
              } ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} disabled:cursor-default bg-transparent border-0 p-0`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isReached
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                } ${stepNum === currentStep ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-gray-900' : ''} ${clickable ? 'hover:ring-2 hover:ring-teal-300' : ''}`}
              >
                {stepNum}
              </div>
              <span className="text-xs mt-2 text-center max-w-20">{step.title}</span>
            </button>
          );
        })}
      </div>
      <Progress value={progress} className="h-2" />
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.description}
        </span>
      </div>
    </div>
  );
}
