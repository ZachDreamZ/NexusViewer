import logoSvg from '../assets/logo.svg';

const GLOW_DROP_SHADOW = 'drop-shadow(0 0 6px var(--color-neon-cyan-glow))';
const GLOW_DROP_SHADOW_LARGE = 'drop-shadow(0 0 16px var(--color-neon-cyan-glow))';

export const Logo: React.FC<{ size?: number; large?: boolean }> = ({ size = 22, large = false }) => (
  <img
    src={logoSvg}
    alt=""
    width={size}
    height={size}
    className="shrink-0"
    style={{
      width: size,
      height: size,
      filter: large ? GLOW_DROP_SHADOW_LARGE : GLOW_DROP_SHADOW,
    }}
  />
);
