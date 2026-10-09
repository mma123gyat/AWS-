interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min = 1, max = 5, onChange }: SliderProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700">
        <label htmlFor={label}>{label}</label>
        <span className="text-gray-900">{value}</span>
      </div>
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}
