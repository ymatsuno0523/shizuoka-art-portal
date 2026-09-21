"use client";

import { toggleClosedLabel } from "@/lib/labels";

const checkboxClass = "h-4 w-4 shrink-0 accent-zinc-900";

export default function LabelChecks({
  legend,
  options,
  values,
  onChange,
  hint,
}: {
  legend: string;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm">{legend}</legend>
      <div className="mt-1 grid grid-cols-[repeat(2,auto)] gap-x-3 gap-y-2.5 [&_label]:w-max [&_label]:whitespace-nowrap">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-1.5 text-sm leading-snug">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onChange(toggleClosedLabel(values, option))}
              className={checkboxClass}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {hint ? <p className="mt-[10px] text-xs text-zinc-500">{hint}</p> : null}
    </fieldset>
  );
}
