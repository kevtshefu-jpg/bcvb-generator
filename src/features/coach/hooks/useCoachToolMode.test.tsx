import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCoachToolMode } from './useCoachToolMode'

describe('useCoachToolMode', () => {
  it('utilise novice par défaut', () => {
    const { result } = renderHook(() => useCoachToolMode())
    expect(result.current.mode).toBe('novice')
    expect(result.current.isNovice).toBe(true)
  })

  it('réagit au changement global vers expert', () => {
    const { result } = renderHook(() => useCoachToolMode())
    act(() => window.dispatchEvent(new CustomEvent('bcvb:coach-tool-mode', { detail: 'expert' })))
    expect(result.current.mode).toBe('expert')
    expect(localStorage.getItem('bcvb.coach.toolMode')).toBe('expert')
  })

  it('ignore un mode global inconnu', () => {
    const { result } = renderHook(() => useCoachToolMode())
    act(() => window.dispatchEvent(new CustomEvent('bcvb:coach-tool-mode', { detail: 'admin' })))
    expect(result.current.mode).toBe('novice')
  })
})
