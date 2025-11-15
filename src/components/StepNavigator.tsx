'use client';

type StepNavigatorProps = {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function StepNavigator({
  currentStep,
  totalSteps,
  canProceed,
  isSubmitting,
  onPrev,
  onNext
}: StepNavigatorProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-400">
        Step {currentStep + 1} of {totalSteps}
        {!canProceed ? (
          <span className="ml-2 text-xs text-slate-500" aria-live="polite">
            Save this step to enable continue.
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          aria-disabled={isFirst}
          className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || (isLast && Boolean(isSubmitting))}
          aria-disabled={!canProceed}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLast ? (isSubmitting ? 'Submitting…' : 'Finish') : 'Continue'}
        </button>
      </div>
    </div>
  );
}

