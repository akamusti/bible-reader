import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const MenuIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const ChevronLeftIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const ChevronDownIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const CloseIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const SettingsIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 7h7M15 7h5M4 17h5M13 17h7" />
    <circle cx="13" cy="7" r="2.1" />
    <circle cx="10" cy="17" r="2.1" />
  </svg>
);

export const SunIcon = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
  </svg>
);

export const MoonIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.2 8.2 0 1 0 10.5 10.5Z" />
  </svg>
);

export const BookIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
  </svg>
);

export const CheckIcon = (p: Props) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
