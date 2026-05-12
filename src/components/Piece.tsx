import { memo } from 'react'
import { usePieceTheme } from '../lib/PieceThemeContext'

interface PieceProps {
  type: string
  color?: 'light' | 'dark'
  size?: number
}

const LICHESS_CDN = 'https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece'

export default memo(function Piece({ type, color = 'light', size = 56 }: PieceProps) {
  const { theme } = usePieceTheme()
  const pieceColor = color === 'light' ? 'w' : 'b'
  const pieceType = (type || '').toUpperCase()
  const src = `${LICHESS_CDN}/${theme}/${pieceColor}${pieceType}.svg`

  return (
    <img
      src={src}
      alt={`${color} ${pieceType}`}
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.45)) drop-shadow(0 4px 6px rgba(0,0,0,0.35))',
        transition: 'transform .15s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      draggable={true}
    />
  )
})
