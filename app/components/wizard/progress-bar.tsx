
'use client';

import { Progress } from '@/components/ui/progress';
import { WizardStep } from '@/lib/types';

interface ProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              index + 1 <= currentStep ? 'text-teal-400' : 'text-gray-500'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                index + 1 <= currentStep
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-700 text-gray-400'
              } ${index + 1 === currentStep ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-gray-900' : ''}`}
            >
              {index + 1}
            </div>
            <span className="text-xs mt-2 text-center max-w-20">{step.title}</span>
          </div>
        ))}
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
