import { PIECE_THEMES, usePieceTheme } from '../lib/PieceThemeContext'

interface PieceThemeSelectorProps {
  compact?: boolean
}

export default function PieceThemeSelector({ compact = false }: PieceThemeSelectorProps) {
  const { theme, setTheme } = usePieceTheme()

  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PIECE_THEMES.map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            title={t}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              padding: 4,
              cursor: 'pointer',
              border: theme === t ? '2px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
              background: theme === t ? 'rgba(229,169,59,0.1)' : 'var(--color-bg-base)',
              display: 'grid',
              placeItems: 'center',
              transition: 'all .15s ease',
            }}
          >
            <img
              src={`https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/${t}/wK.svg`}
              alt={t}
              width={28}
              height={28}
              style={{ pointerEvents: 'none' }}
              draggable={false}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
        Piece style
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {PIECE_THEMES.map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            title={t}
            style={{
              aspectRatio: '1',
              borderRadius: 12,
              cursor: 'pointer',
              border: theme === t ? '2px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
              background: theme === t ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-base)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all .15s ease',
              padding: 8,
            }}
          >
            <img
              src={`https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/${t}/wK.svg`}
              alt={t}
              width={32}
              height={32}
              style={{ pointerEvents: 'none' }}
              draggable={false}
            />
            <span style={{
              fontSize: 9,
              color: theme === t ? 'var(--color-amber)' : 'var(--color-text-muted)',
              fontWeight: theme === t ? 600 : 400,
              textTransform: 'capitalize',
            }}>
              {t}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
