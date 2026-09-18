import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 26, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
      {...props}
    >
      {/* Document outline with prominent 80px folded corner cut */}
      <path
        d="M136 72 H320 L400 152 V400 C400 422.091 382.091 440 360 440 H136 C113.909 440 96 422.091 96 400 V112 C96 89.909 113.909 72 136 72 Z"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Large prominent fold flap connecting seamlessly from (320, 72) to (400, 152) */}
      <path
        d="M320 72 V128 C320 141.255 330.745 152 344 152 H400"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Location pin with hollow center */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M256 186 C219.101 186 189 216.101 189 253 C189 301.5 256 354 256 354 C256 354 323 301.5 323 253 C323 216.101 292.899 186 256 186 Z M256 229 C242.745 229 232 239.745 232 253 C232 266.255 242.745 277 256 277 C269.255 277 280 266.255 280 253 C280 239.745 269.255 229 256 229 Z"
        fill="currentColor"
      />
    </svg>
  );
}
