import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Board from '../components/Board'
import type { Position } from '../components/Board'
import Icon from '../components/icons/Icon'
import Sidebar from '../components/Sidebar'
import { useIsMobile } from '../lib/useIsMobile'
import { useGameReplay } from '../lib/queries'
import { applyMove, INITIAL_POSITION } from '../lib/chess'

const RESULT_LABEL: Record<string, string> = {
  checkmate: 'Checkmate',
  stalemate: 'Draw — stalemate',
  timeout: 'Won on time',
  resign: 'Resignation',
  draw: 'Draw',
  abandoned: 'Abandoned',
}

export default function Replay() {
  const navigate = useNavigate()
  const { id: gameId } = useParams<{ id?: string }>()
  const isMobile = useIsMobile()
  const { data: replay, isLoading, error } = useGameReplay(gameId)
  const [step, setStep] = useState(0)   // 0 = initial position, N = after move N
  const [boardSize, setBoardSize] = useState(480)

  // All positions, computed once: positions[i] is the board after i moves.
  const positions = useMemo<Position[]>(() => {
    const list: Position[] = [INITIAL_POSITION]
    let pos = INITIAL_POSITION
    for (const mv of replay?.moves ?? []) {
      pos = applyMove(pos, mv)
      list.push(pos)
    }
    return list
  }, [replay?.moves])

  const total = positions.length - 1
  const clamped = Math.min(step, total)
  const currentMove = clamped > 0 ? replay?.moves[clamped - 1] : null

  // Jump to the final position once loaded
  useEffect(() => { if (replay) setStep(replay.moves.length) }, [replay])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setStep(s => Math.max(0, s - 1))
      if (e.key === 'ArrowRight') setStep(s => Math.min(total, s + 1))
      if (e.key === 'Home') setStep(0)
      if (e.key === 'End') setStep(total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const chrome = w < 860 ? 24 : 220 + 80 + 300
      setBoardSize(Math.min(560, Math.max(280, Math.min(w - chrome, h - 220))))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Loading replay…</div>
      </div>
    )
  }
  if (error || !replay) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>Couldn't load this game.</div>
          <button onClick={() => navigate('/games')} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>Back to games</button>
        </div>
      </div>
    )
  }

  const whiteName = replay.white_player_name ||
    (replay.opponent === 'stockfish' && !replay.white_player_name ? `Stockfish (level ${replay.stockfish_level})` : 'White')
  const blackName = replay.black_player_name ||
    (replay.opponent === 'stockfish' ? `Stockfish (level ${replay.stockfish_level})` : 'Black')
  const resultLabel = RESULT_LABEL[replay.end_reason || replay.state] ?? replay.state
  const lastMoveSquares = currentMove ? [currentMove.slice(0, 2), currentMove.slice(2, 4)] : []

  const controls = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%', maxWidth: 560 }}>
      {([
        ['⏮', () => setStep(0), clamped === 0, 'First move'],
        ['◀', () => setStep(s => Math.max(0, s - 1)), clamped === 0, 'Previous move'],
        ['▶', () => setStep(s => Math.min(total, s + 1)), clamped >= total, 'Next move'],
        ['⏭', () => setStep(total), clamped >= total, 'Last move'],
      ] as const).map(([label, onClick, disabled, title], i) => (
        <button
          key={i}
          onClick={onClick}
          disabled={disabled}
          title={title}
          style={{
            flex: 1, minHeight: 44, borderRadius: 12, fontSize: 16, cursor: disabled ? 'default' : 'pointer',
            background: 'var(--color-bg-elev)', color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)', opacity: disabled ? 0.5 : 1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const moveList = (
    <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 12, overflowY: 'auto', maxHeight: isMobile ? 200 : boardSize + 60 }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>
        Moves ({replay.moves.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 4 }}>
        {replay.moves.map((mv, i) => (
          <button
            key={i}
            onClick={() => setStep(i + 1)}
            style={{
              padding: '6px 4px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              background: clamped === i + 1 ? 'var(--color-amber)' : 'var(--color-bg-base)',
              color: clamped === i + 1 ? '#1A1408' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-strong)',
            }}
          >
            {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{mv}
          </button>
        ))}
        {replay.moves.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: 'var(--color-text-muted)', fontSize: 13 }}>No moves were played.</div>
        )}
      </div>
    </div>
  )

  const header = (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {whiteName} <span style={{ color: 'var(--color-text-muted)' }}>vs</span> {blackName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {resultLabel} · {new Date(replay.created_at).toLocaleDateString()}
        </div>
      </div>
      <button onClick={() => navigate('/games')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', minHeight: 40, borderRadius: 12, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13 }}>
        <Icon name="arrow-right" size={14} /> Games
      </button>
    </div>
  )

  const boardBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', minWidth: 0 }}>
      {header}
      <Board
        position={positions[clamped]}
        size={boardSize}
        lastMove={lastMoveSquares}
        selected={null}
        hints={[]}
        check={null}
        onSquareClick={() => {}}
      />
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {clamped === 0 ? 'Starting position' : `Move ${clamped} of ${total}`}
      </div>
      {controls}
    </div>
  )

  if (isMobile) {
    return (
      <div className="fade-in" style={{ minHeight: '100dvh', background: 'var(--color-bg-base)', padding: '16px 12px calc(16px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        {boardBlock}
        <div style={{ width: '100%', maxWidth: 560 }}>{moveList}</div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100dvh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
        {boardBlock}
        {moveList}
      </main>
    </div>
  )
}
