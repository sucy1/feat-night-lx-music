import { storageDataPrefix } from '@/config/constant'
import { saveData, getData } from '@/plugins/storage'
import playlistAction from '@/store/playlist/action'
import playlistState from '@/store/playlist/state'
import settingState from '@/store/setting/state'

const getPlaylistStorageKey = (playlistId: string) => `${storageDataPrefix.playlist}${playlistId}`

export const loadPlaylists = async () => {
  const playlistList = await getData<LX.Playlist.PlaylistInfo[]>(storageDataPrefix.playlistList)
  if (playlistList) {
    playlistAction.setPlaylists(playlistList)

    const loadPromises = playlistList.map(async (playlist) => {
      const key = getPlaylistStorageKey(playlist.id)
      const musics = await getData<LX.Music.MusicInfo[]>(key)
      if (musics) {
        playlistState.playlistMusics.set(playlist.id, musics)
      }
    })
    await Promise.all(loadPromises)
  }
}

export const savePlaylistList = async () => {
  await saveData(storageDataPrefix.playlistList, playlistState.playlists)
}

export const savePlaylistMusics = async (playlistId: string) => {
  const musics = playlistState.playlistMusics.get(playlistId) || []
  await saveData(getPlaylistStorageKey(playlistId), musics)
}

export const createPlaylist = async (params: LX.Playlist.CreatePlaylistParams): Promise<LX.Playlist.PlaylistInfo> => {
  const now = Date.now()
  const playlistId = `playlist_${now}`
  const playlist: LX.Playlist.PlaylistInfo = {
    id: playlistId,
    name: params.name,
    description: params.description || '',
    cover: params.cover,
    createTime: now,
    updateTime: now,
    musicCount: params.musics?.length || 0,
  }

  playlistAction.addPlaylist(playlist)

  if (params.musics && params.musics.length > 0) {
    playlistState.playlistMusics.set(playlistId, params.musics)
    await savePlaylistMusics(playlistId)
  }

  await savePlaylistList()

  return playlist
}

export const deletePlaylist = async (playlistId: string) => {
  playlistAction.removePlaylist(playlistId)
  await savePlaylistList()
  await saveData(getPlaylistStorageKey(playlistId), [])
}

export const updatePlaylistInfo = async (params: LX.Playlist.UpdatePlaylistParams) => {
  const playlist = playlistState.playlists.find(p => p.id === params.id)
  if (!playlist) return

  const updated: LX.Playlist.PlaylistInfo = {
    ...playlist,
    ...(params.name !== undefined && { name: params.name }),
    ...(params.description !== undefined && { description: params.description }),
    ...(params.cover !== undefined && { cover: params.cover }),
    updateTime: Date.now(),
  }

  playlistAction.updatePlaylist(updated)
  await savePlaylistList()
}

export const addMusicsToPlaylist = async (
  playlistId: string,
  musicInfos: LX.Music.MusicInfo[],
  addMusicLocationType: LX.AddMusicLocationType = settingState.setting['list.addMusicLocationType']
) => {
  playlistAction.addPlaylistMusics(playlistId, musicInfos, addMusicLocationType)
  await savePlaylistMusics(playlistId)
  await savePlaylistList()
}

export const removeMusicsFromPlaylist = async (playlistId: string, musicIds: string[]) => {
  playlistAction.removePlaylistMusics(playlistId, musicIds)
  await savePlaylistMusics(playlistId)
  await savePlaylistList()
}

export const updateMusicPosition = async (
  playlistId: string,
  position: number,
  musicIds: string[]
) => {
  playlistAction.updatePlaylistMusicPosition(playlistId, position, musicIds)
  await savePlaylistMusics(playlistId)
  await savePlaylistList()
}

export const getPlaylistMusics = async (playlistId: string): Promise<LX.Music.MusicInfo[]> => {
  const cached = playlistState.playlistMusics.get(playlistId)
  if (cached) return cached

  const musics = await getData<LX.Music.MusicInfo[]>(getPlaylistStorageKey(playlistId))
  if (musics) {
    playlistState.playlistMusics.set(playlistId, musics)
    return musics
  }
  return []
}

export const setActivePlaylist = (playlistId: string | null) => {
  playlistAction.setActivePlaylist(playlistId)
}

export const overwritePlaylist = async (playlistInfoFull: LX.Playlist.PlaylistInfoFull) => {
  playlistAction.setPlaylist(playlistInfoFull)
  await savePlaylistMusics(playlistInfoFull.id)
  await savePlaylistList()
}
