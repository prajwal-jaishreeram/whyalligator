"use client"

import { useEffect, useRef, useState } from "react"
import { animate } from "motion/react"

const colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff", "#00e5ff", "#ff007f"]
const shapes = ["circle", "rect", "rect", "strip", "strip"] as const
const keyframeCount = 40

type ParticleShape = (typeof shapes)[number]

type Particle = {
  startX: number
  startY: number
  keyframes: { transform: string[]; opacity: number[] }
  duration: number
  size: number
  color: string
  shape: ParticleShape
}

type Wave = {
  id: number
  particles: Particle[]
}

function buildFallingKeyframes({
  startVelocityX,
  startVelocityY,
  gravity,
  wobbleSpeed,
  wobbleOffset,
  size,
  ticks,
  tiltRotations,
  rotation,
}: {
  startVelocityX: number
  startVelocityY: number
  gravity: number
  wobbleSpeed: number
  wobbleOffset: number
  size: number
  ticks: number
  tiltRotations: number
  rotation: number
}) {
  const transforms: string[] = []
  const opacities: number[] = []
  let vx = startVelocityX
  let vy = startVelocityY
  let x = 0
  let y = 0
  let wobble = wobbleOffset
  let tick = 0

  for (let i = 0; i <= keyframeCount; i++) {
    const t = i / keyframeCount
    if (i > 0) {
      const targetTick = Math.round((i * ticks) / keyframeCount)
      while (tick < targetTick) {
        x += vx
        y += vy
        vy += gravity
        vx *= 0.98
        wobble += wobbleSpeed
        tick++
      }
    }
    const translateX = x + Math.sin(wobble) * 20 * size
    const translateY = y
    const scale = t < 0.1 ? t / 0.1 : 1
    const tilt = tiltRotations * 360 * t
    let opacity = 1
    if (t > 0.75) {
      opacity = Math.max(0, 1 - (t - 0.75) / 0.25)
    }
    transforms.push(
      `translate(${translateX}px, ${translateY}px) scale(${scale}) rotateY(${tilt}deg) rotate(${rotation}deg)`
    )
    opacities.push(opacity)
  }

  return { transform: transforms, opacity: opacities }
}

function ParticleDot({ particle }: { particle: Particle }) {
  const ref = useRef<HTMLDivElement>(null)
  const { startX, startY, keyframes, duration, size, color, shape } = particle
  const width = shape === "strip" ? size * 0.35 : shape === "rect" ? size * 0.8 : size
  const height = shape === "strip" ? size * 2.2 : size
  const radius = shape === "circle" ? "50%" : shape === "strip" ? size * 0.15 : 2

  useEffect(() => {
    if (!ref.current) return
    const playback = animate(ref.current, keyframes, { duration, ease: "linear" })
    return () => playback.cancel()
  }, [keyframes, duration])

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: `${startX}px`,
        top: `${startY}px`,
        width,
        height,
        borderRadius: radius,
        backgroundColor: color,
        willChange: "transform, opacity",
        pointerEvents: "none",
      }}
    />
  )
}

export function Confetti() {
  const [waves, setWaves] = useState<Wave[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    const spawnWave = (count: number, duration: number) => {
      const id = nextId.current++
      const ticks = Math.round(duration * 60)
      const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1000
      const centerX = screenWidth / 2

      const particles: Particle[] = Array.from({ length: count }, () => {
        // Start across top center near header (centered, spread horizontally across screen)
        const startX = centerX + (Math.random() - 0.5) * Math.min(screenWidth * 0.75, 700)
        const startY = Math.random() * 30 // Right at top header level

        // Drift outward and downward
        const startVelocityX = (Math.random() - 0.5) * 3
        const startVelocityY = 1 + Math.random() * 3
        const gravity = 0.22 + Math.random() * 0.15
        const size = 8 + Math.random() * 6

        return {
          startX,
          startY,
          keyframes: buildFallingKeyframes({
            startVelocityX,
            startVelocityY,
            gravity,
            wobbleSpeed: Math.random() * 0.1 + 0.05,
            wobbleOffset: Math.random() * Math.PI * 2,
            size: size / 10,
            ticks,
            tiltRotations: 2 + Math.random() * 5,
            rotation: Math.random() * 360,
          }),
          duration,
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        }
      })

      setWaves((current) => [...current, { id, particles }])
      setTimeout(() => {
        setWaves((current) => current.filter((wave) => wave.id !== id))
      }, (duration + 0.5) * 1000)
    }

    // Trigger falling cascade from header
    const t1 = setTimeout(() => spawnWave(60, 3.8), 200)
    const t2 = setTimeout(() => spawnWave(50, 4.0), 800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {waves.map((wave) =>
        wave.particles.map((particle, index) => (
          <ParticleDot key={`${wave.id}-${index}`} particle={particle} />
        ))
      )}
    </div>
  )
}

export default Confetti
