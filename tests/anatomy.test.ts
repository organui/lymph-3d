import { describe, expect, test } from 'bun:test'
import { byId, emphasis, initiallyHidden, structures, tour } from '../src/anatomy'

describe('selection emphasis', () => {
  test('keeps every structure normal without a selection', () => {
    expect(structures.every((s) => emphasis(s.id, null) === 'normal')).toBe(true)
  })

  test('keeps the selection solid and ghosts everything else', () => {
    const states = structures.map((s) => emphasis(s.id, 'paracortex'))
    expect(states.filter((s) => s === 'selected')).toHaveLength(1)
    expect(emphasis('paracortex', 'paracortex')).toBe('selected')
    expect(emphasis('capsule', 'paracortex')).toBe('ghosted')
  })
})

describe('source ownership', () => {
  test('assigns every source node to exactly one structure', () => {
    const elements = structures.flatMap((s) => s.sources.map(({ file, node }) => `${file}#${node}`))
    expect(new Set(elements).size).toBe(elements.length)
  })
})

describe('starting state and tour', () => {
  test('only hides known structures at the start', () => {
    expect(initiallyHidden.every((id) => byId[id])).toBe(true)
  })

  test('points every tour stop at a known structure', () => {
    expect(tour.every((stop) => byId[stop.id])).toBe(true)
  })
})
