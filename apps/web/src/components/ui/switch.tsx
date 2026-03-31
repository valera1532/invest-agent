type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? "bg-[#11795f]" : "bg-[#d5e2dc]"}`}
    >
      <span
        className={`ml-1 inline-block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
