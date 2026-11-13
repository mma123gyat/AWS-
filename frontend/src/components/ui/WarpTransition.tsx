import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import './WarpTransition.css'

const WARP_DURATION_MS = 480

/** 単元カードをクリックするとワープ風の演出を再生してから遷移する、Linkの代替コンポーネント。 */
export function WarpLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const navigate = useNavigate()
  const [warping, setWarping] = useState(false)

  useEffect(() => {
    if (!warping) return
    const timer = window.setTimeout(() => navigate(to), WARP_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [warping, to, navigate])

  return <>
    <a href={to} className={className} onClick={event => { event.preventDefault(); setWarping(true) }}>{children}</a>
    {warping && <div className="warp-overlay" role="presentation" aria-hidden="true" />}
  </>
}
