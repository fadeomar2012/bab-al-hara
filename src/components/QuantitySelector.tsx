'use client';

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const canIncrease = max === undefined || value < max;
  return (
    <div className="quantitySelector" aria-label="اختيار الكمية">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="تقليل الكمية">−</button>
      <span>{value}</span>
      <button
        type="button"
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        aria-label="زيادة الكمية"
        disabled={!canIncrease}
      >
        +
      </button>
    </div>
  );
}
