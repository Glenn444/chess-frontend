interface AvatarProps {
  name?: string
  size?: number
  color?: 'amber' | 'blue' | 'green' | 'violet' | 'rose' | 'teal'
  ring?: boolean
  speaking?: boolean
}

const palette: Record<string, [string, string]> = {
  amber: ['#E5A93B', '#C68A1F'],
  blue:  ['#7EA8E5', '#4F7BC2'],
  green: ['#5FAE7E', '#3F8A5E'],
  violet:['#B68EE5', '#8E63C2'],
  rose:  ['#E58EA2', '#C26483'],
  teal:  ['#5FC6C0', '#3F938E'],
}

export default function Avatar({ name = '?', size = 36, color = 'amber', ring = false, speaking = false }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [c1, c2] = palette[color] || palette.amber

  return (
    <div
      className={speaking ? 'pulse-ring' : ''}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'grid',
        placeItems: 'center',
        color: '#1A1408',
        fontWeight: 700,
        fontSize: size * 0.36,
        border: ring ? '2px solid var(--color-amber)' : '1px solid rgba(0,0,0,0.2)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 14px -8px rgba(0,0,0,0.6)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
