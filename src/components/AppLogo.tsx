import type { ReactNode } from "react";

type AppLogoProps = {
  id: string;
};

const tile = {
  fill: "#75a0a0e6",
  border: "#4e9dba",
  draw: "#fff",
} as const;

function LogoFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx="13.5"
        fill={tile.fill}
        stroke={tile.border}
        strokeWidth="1"
      />
      {children}
    </svg>
  );
}

export function BackLogo() {
  return (
    <LogoFrame>
      <path
        d="M30 14 18 24l12 10"
        fill="none"
        stroke={tile.draw}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </LogoFrame>
  );
}

export function AppLogo({ id }: AppLogoProps) {
  switch (id) {
    case "sound-calc":
      return (
        <LogoFrame>
          <path
            d="M13 11v26"
            fill="none"
            stroke={tile.draw}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M20 19c4 2.4 4 7.6 0 10"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M26 14.5c7 3.8 7 15.2 0 19"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M32 11c9 5 9 21 0 26"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </LogoFrame>
      );
    case "acoustic-calc":
      return (
        <LogoFrame>
          <path
            d="M13 34V17.5c0-2.2 1.8-4 4-4h14c2.2 0 4 1.8 4 4V34"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M17 18.5h3.2M22.4 18.5h3.2M27.8 18.5h3.2"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M17 29.5c3.6-4.4 10.4-4.4 14 0"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </LogoFrame>
      );
    case "vibro-compare":
      return (
        <LogoFrame>
          <path
            d="M16 12v3.2c3.6 0 3.6 2.5 0 2.5s-3.6 2.5 0 2.5 3.6 2.5 0 2.5 3.6 2.5 0 2.5v3.3"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 12v2.4c3 0 3 1.9 0 1.9s-3 1.9 0 1.9 3 1.9 0 1.9 3 1.9 0 1.9 3 1.9 0 1.9v2.2"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LogoFrame>
      );
    case "co-worker":
      return (
        <LogoFrame>
          <path
            d="M16 12h11.2L34 18.8V34a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M27.2 12v6.8H34"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M18 26.5h12M18 31h8"
            fill="none"
            stroke={tile.draw}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </LogoFrame>
      );
    default:
      return (
        <LogoFrame>
          <circle cx="24" cy="24" r="8" fill={tile.draw} />
        </LogoFrame>
      );
  }
}
