import state, { type InitState } from './state'

export default {
  setPlaylists(playlists: LX.Playlist.PlaylistInfo[]) {
    state.playlists = playlists
    global.state_event.playlistsUpdated(state.playlists)
  },

  addPlaylist(playlist: LX.Playlist.PlaylistInfo) {
    state.playlists = [...state.playlists, playlist]
    global.state_event.playlistsUpdated(state.playlists)
  },

  removePlaylist(playlistId: string) {
    state.playlists = state.playlists.filter(p => p.id !== playlistId)
    state.playlistMusics.delete(playlistId)
    if (state.activePlaylistId === playlistId) {
      state.activePlaylistId = null
      global.state_event.activePlaylistUpdated(null)
    }
    global.state_event.playlistsUpdated(state.playlists)
  },

  updatePlaylist(playlist: LX.Playlist.PlaylistInfo) {
    state.playlists = state.playlists.map(p =>
      p.id === playlist.id ? { ...p, ...playlist } : p
    )
    global.state_event.playlistsUpdated(state.playlists)
  },

  setActivePlaylist(playlistId: string | null) {
    state.activePlaylistId = playlistId
    global.state_event.activePlaylistUpdated(playlistId)
  },

  setPlaylistMusics(playlistId: string, musics: LX.Music.MusicInfo[]) {
    state.playlistMusics.set(playlistId, musics)
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (playlist) {
      playlist.musicCount = musics.length
      playlist.updateTime = Date.now()
      global.state_event.playlistsUpdated([...state.playlists])
    }
    global.state_event.playlistMusicsUpdated(playlistId, musics)
  },

  addPlaylistMusics(playlistId: string, musics: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType) {
    const currentMusics = state.playlistMusics.get(playlistId) || []
    const existingIds = new Set(currentMusics.map(m => m.id))
    const newMusics = musics.filter(m => !existingIds.has(m.id))
    const updatedMusics = addMusicLocationType === 'top'
      ? [...newMusics, ...currentMusics]
      : [...currentMusics, ...newMusics]
    state.playlistMusics.set(playlistId, updatedMusics)
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (playlist) {
      playlist.musicCount = updatedMusics.length
      playlist.updateTime = Date.now()
      global.state_event.playlistsUpdated([...state.playlists])
    }
    global.state_event.playlistMusicsUpdated(playlistId, updatedMusics)
  },

  removePlaylistMusics(playlistId: string, musicIds: string[]) {
    const currentMusics = state.playlistMusics.get(playlistId) || []
    const idSet = new Set(musicIds)
    const updatedMusics = currentMusics.filter(m => !idSet.has(m.id))
    state.playlistMusics.set(playlistId, updatedMusics)
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (playlist) {
      playlist.musicCount = updatedMusics.length
      playlist.updateTime = Date.now()
      global.state_event.playlistsUpdated([...state.playlists])
    }
    global.state_event.playlistMusicsUpdated(playlistId, updatedMusics)
  },

  updatePlaylistMusicPosition(playlistId: string, position: number, musicIds: string[]) {
    const currentMusics = state.playlistMusics.get(playlistId) || []
    const idSet = new Set(musicIds)
    const movingMusics = currentMusics.filter(m => idSet.has(m.id))
    const remainingMusics = currentMusics.filter(m => !idSet.has(m.id))
    const updatedMusics = [
      ...remainingMusics.slice(0, position),
      ...movingMusics,
      ...remainingMusics.slice(position),
    ]
    state.playlistMusics.set(playlistId, updatedMusics)
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (playlist) {
      playlist.updateTime = Date.now()
      global.state_event.playlistsUpdated([...state.playlists])
    }
    global.state_event.playlistMusicsUpdated(playlistId, updatedMusics)
  },

  setPlaylist(playlistInfoFull: LX.Playlist.PlaylistInfoFull) {
    const { list, ...playlistInfo } = playlistInfoFull
    const exists = state.playlists.some(p => p.id === playlistInfo.id)
    if (!exists) {
      state.playlists.push(playlistInfo)
    } else {
      state.playlists = state.playlists.map(p =>
        p.id === playlistInfo.id ? playlistInfo : p
      )
    }
    state.playlistMusics.set(playlistInfo.id, list)
    global.state_event.playlistsUpdated([...state.playlists])
    global.state_event.playlistMusicsUpdated(playlistInfo.id, list)
  },
}
