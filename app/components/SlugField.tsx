const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function SlugField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      共有用URL（任意）
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: sample-name"
        spellCheck={false}
        autoCapitalize="off"
        className={`${inputClass} mt-1`}
      />
      <span className="mt-1 block text-xs text-zinc-500">
        URL末尾。半角英数字とハイフンのみ使用可
      </span>
    </label>
  );
}
