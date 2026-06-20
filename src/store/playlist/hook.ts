import { useEffect, useState } from 'react'
import state from './state'

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState(state.playlists)

  useEffect(() => {
    const handleUpdate = (updated: LX.Playlist.PlaylistInfo[]) => {
      setPlaylists([...updated])
    }
    global.state_event.on('playlistsUpdated', handleUpdate)
    return () => {
      global.state_event.off('playlistsUpdated', handleUpdate)
    }
  }, [])

  return playlists
}

export const useActivePlaylistId = () => {
  const [activeId, setActiveId] = useState(state.activePlaylistId)

  useEffect(() => {
    const handleUpdate = (id: string | null) => {
      setActiveId(id)
    }
    global.state_event.on('activePlaylistUpdated', handleUpdate)
    return () => {
      global.state_event.off('activePlaylistUpdated', handleUpdate)
    }
  }, [])

  return activeId
}

export const usePlaylistMusics = (playlistId: string) => {
  const [musics, setMusics] = useState<LX.Music.MusicInfo[]>(
    state.playlistMusics.get(playlistId) || []
  )

  useEffect(() => {
    const handleUpdate = (id: string, updatedMusics: LX.Music.MusicInfo[]) => {
      if (id === playlistId) {
        setMusics([...updatedMusics])
      }
    }
    global.state_event.on('playlistMusicsUpdated', handleUpdate)

    const currentMusics = state.playlistMusics.get(playlistId)
    if (currentMusics && currentMusics.length !== musics.length) {
      setMusics([...currentMusics])
    }

    return () => {
      global.state_event.off('playlistMusicsUpdated', handleUpdate)
    }
  }, [playlistId, musics.length])

  return musics
}

export const usePlaylist = (playlistId: string) => {
  const [playlist, setPlaylist] = useState<LX.Playlist.PlaylistInfo | undefined>(
    state.playlists.find(p => p.id === playlistId)
  )

  useEffect(() => {
    const handleUpdate = (playlists: LX.Playlist.PlaylistInfo[]) => {
      const found = playlists.find(p => p.id === playlistId)
      setPlaylist(found ? { ...found } : undefined)
    }
    global.state_event.on('playlistsUpdated', handleUpdate)
    return () => {
      global.state_event.off('playlistsUpdated', handleUpdate)
    }
  }, [playlistId])

  return playlist
}
