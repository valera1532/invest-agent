import { LoaderCircle } from "lucide-react";

export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <LoaderCircle className={`${className} animate-spin text-[#11795f]`} />
  );
}
