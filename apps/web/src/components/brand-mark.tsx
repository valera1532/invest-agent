type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 44 }: BrandMarkProps) {
  const sizeClassName = size <= 42 ? "h-10 w-10" : "h-11 w-11";
  const iconSize = size <= 42 ? 24 : 26;

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#1c8c6d_0%,#0f4035_100%)] shadow-[0_18px_40px_rgba(7,34,28,0.22)]`}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none">
        <path
          d="M18 42.5L28.5 21.5L35.5 35.5L46 18.5"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 18.5H46V22.5"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
