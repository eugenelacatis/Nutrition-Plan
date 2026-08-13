import MacroRing from '@/components/ui/MacroRing'

const CALLOUTS = [
  { input: 'Favorite proteins', example: 'chicken, salmon, eggs', effect: 'plan built around them' },
  { input: 'Workout time', example: '4:00 PM', effect: 'clock-anchored pre/post-workout meals' },
  { input: 'Cook time', example: 'under 15 min', effect: 'recipes filtered to match' },
  { input: 'Meal count', example: '4-5 meals', effect: 'calories redistributed across the day' },
]

// Section 2: the full-bleed "tailoring band". Static copy pairing each real
// personalization input with its effect on the generated plan.
export default function TailoringShowcase() {
  return (
    <div className="py-20">
      <div className="text-sm uppercase tracking-widest text-cream-50/40">Personalization</div>
      <h2 className="font-display text-4xl md:text-5xl mt-3 text-cream-50 max-w-2xl">
        Every input changes the plan.
      </h2>
      <p className="mt-4 text-cream-50/60 max-w-lg">
        Not just food names — the actual macros, meal timing, and structure shift with what
        you tell it.
      </p>

      <div className="mt-14 grid sm:grid-cols-2 gap-x-10 gap-y-8">
        {CALLOUTS.map((c) => (
          <div key={c.input} className="border-t border-cream-50/15 pt-4">
            <div className="text-xs uppercase tracking-wide text-cream-50/40">{c.input}</div>
            <div className="tabular mt-1 text-cream-50/90">{c.example}</div>
            <div className="mt-1 text-sm text-cream-50/50">→ {c.effect}</div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-10">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-cream-50 p-2">
            <MacroRing
              size={120}
              strokeWidth={12}
              segments={[
                { value: 190, colorVar: '--sage-400', label: 'Protein' },
                { value: 150, colorVar: '--gold-400', label: 'Carbs' },
                { value: 60, colorVar: '--ember-500', label: 'Fat' },
              ]}
              centerValue="2,400"
              centerLabel="cal"
            />
          </div>
          <span className="mt-3 text-xs uppercase tracking-wide text-cream-50/50">Muscle gain</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-cream-50 p-2">
            <MacroRing
              size={120}
              strokeWidth={12}
              segments={[
                { value: 150, colorVar: '--sage-400', label: 'Protein' },
                { value: 90, colorVar: '--gold-400', label: 'Carbs' },
                { value: 45, colorVar: '--ember-500', label: 'Fat' },
              ]}
              centerValue="1,600"
              centerLabel="cal"
            />
          </div>
          <span className="mt-3 text-xs uppercase tracking-wide text-cream-50/50">Weight loss</span>
        </div>
      </div>
    </div>
  )
}
