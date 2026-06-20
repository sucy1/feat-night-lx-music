import state, { type InitState } from '../state'

describe('playlist/state', () => {
  it('should have correct initial state', () => {
    expect(state.playlists).toEqual([])
    expect(state.activePlaylistId).toBeNull()
    expect(state.playlistMusics).toBeInstanceOf(Map)
    expect(state.playlistMusics.size).toBe(0)
  })

  it('should have correct InitState interface', () => {
    const initState: InitState = state
    expect(initState).toHaveProperty('playlists')
    expect(initState).toHaveProperty('activePlaylistId')
    expect(initState).toHaveProperty('playlistMusics')
  })
})
