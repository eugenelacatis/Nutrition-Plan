export const GOALS = [
  { value: 'weight_loss', label: 'Lose weight' },
  { value: 'muscle_gain', label: 'Build muscle' },
  { value: 'maintenance', label: 'Maintain' },
] as const

interface GoalToggleProps {
  selectedGoal: string | null
  onSelect: (goal: string) => void
  disabled?: boolean
}

export default function GoalToggle({ selectedGoal, onSelect, disabled }: GoalToggleProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {GOALS.map((goal) => (
        <button
          key={goal.value}
          onClick={() => onSelect(goal.value)}
          disabled={disabled}
          className={`min-h-[44px] px-5 py-3 border text-sm transition-colors disabled:opacity-40 ${
            selectedGoal === goal.value
              ? 'bg-ember-500 text-ink-900 border-ember-500'
              : 'border-ink-900/25 text-ink-900 hover:border-ink-900/50'
          }`}
        >
          {goal.label}
        </button>
      ))}
    </div>
  )
}
