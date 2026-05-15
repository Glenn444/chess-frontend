export type IconName =
  | 'logo' | 'mic' | 'mic-off' | 'phone-off' | 'send' | 'chat'
  | 'flag' | 'handshake' | 'clock' | 'trophy' | 'search' | 'plus'
  | 'arrow-right' | 'arrow-left' | 'settings' | 'user' | 'bell'
  | 'check' | 'x' | 'globe' | 'zap' | 'puzzle' | 'bolt' | 'menu' | 'log-out'

const iconPaths: Record<IconName, { viewBox: string; d: string[]; fill?: string; stroke?: string }> = {
  logo: {
    viewBox: '0 0 32 32',
    d: [
      'M10 6 L14 6 L14 9 L18 9 L18 6 L22 6 L22 12 L20 14 L20 22 L22 24 L22 26 L10 26 L10 24 L12 22 L12 14 L10 12 Z',
      'M9 27 L23 27 L24 30 L8 30 Z',
    ],
    fill: '1',
  },
  mic: { viewBox: '0 0 24 24', d: ['M9 3a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'] },
  'mic-off': { viewBox: '0 0 24 24', d: ['M3 3l18 18', 'M9 9v3a3 3 0 0 0 5 2.2', 'M15 9V6a3 3 0 0 0-5.5-1.7', 'M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.5 2.6', 'M12 18v3'] },
  'phone-off': { viewBox: '0 0 24 24', d: ['M2 16.5C7 11 17 11 22 16.5l-2.5 2.5-3-1.5v-3a14 14 0 0 0-9 0v3l-3 1.5z', 'M3 3l18 18'] },
  send: { viewBox: '0 0 24 24', d: ['M3 11l18-8-8 18-2-8z'] },
  chat: { viewBox: '0 0 24 24', d: ['M4 5h16v11H8l-4 4z'] },
  flag: { viewBox: '0 0 24 24', d: ['M5 21V4M5 4h11l-2 4 2 4H5'] },
  handshake: { viewBox: '0 0 24 24', d: ['M3 12l4-4 5 1 3-2 6 4-4 6-3-1-4 3-3-2-4 1z', 'M11 13l3 3'] },
  clock: { viewBox: '0 0 24 24', d: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 7v5l3 2'] },
  trophy: { viewBox: '0 0 24 24', d: ['M8 4h8v6a4 4 0 0 1-8 0z', 'M5 5h3v3a3 3 0 0 1-3-3zM19 5h-3v3a3 3 0 0 0 3-3z', 'M10 14h4v3h-4z', 'M8 19h8'] },
  search: { viewBox: '0 0 24 24', d: ['M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M21 21l-4.5-4.5'] },
  plus: { viewBox: '0 0 24 24', d: ['M12 5v14M5 12h14'] },
  'arrow-right': { viewBox: '0 0 24 24', d: ['M5 12h14M13 6l6 6-6 6'] },
  'arrow-left': { viewBox: '0 0 24 24', d: ['M19 12H5M11 6l-6 6 6 6'] },
  settings: {
    viewBox: '0 0 24 24',
    d: ['M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
  },
  user: { viewBox: '0 0 24 24', d: ['M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M4 21a8 8 0 0 1 16 0'] },
  bell: { viewBox: '0 0 24 24', d: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z', 'M10 21a2 2 0 0 0 4 0'] },
  check: { viewBox: '0 0 24 24', d: ['M5 12l5 5 9-11'] },
  x: { viewBox: '0 0 24 24', d: ['M6 6l12 12M18 6L6 18'] },
  globe: { viewBox: '0 0 24 24', d: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z'] },
  zap: { viewBox: '0 0 24 24', d: ['M13 2 L4 14 L12 14 L11 22 L20 10 L12 10 Z'] },
  puzzle: { viewBox: '0 0 24 24', d: ['M9 3h2a2 2 0 0 1 0 4h3v3a2 2 0 0 0 4 0v3h-3a2 2 0 0 0 0 4h3v3H9v-3a2 2 0 0 1-4 0H3v-7h2a2 2 0 0 0 0-4H3V3z'] },
  bolt: { viewBox: '0 0 24 24', d: ['M13 2 L4 14 L12 14 L11 22 L20 10 L12 10 Z'] },
  menu: { viewBox: '0 0 24 24', d: ['M3 6h18M3 12h18M3 18h18'] },
  'log-out': { viewBox: '0 0 24 24', d: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'] },
}

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export default function Icon({ name, size = 18, color = 'currentColor', className = '' }: IconProps) {
  const icon = iconPaths[name]
  if (!icon) return null

  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      className={className}
      fill={icon.fill ? color : 'none'}
      stroke={icon.fill ? 'none' : color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon.d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  )
}
