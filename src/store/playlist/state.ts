export interface InitState {
  playlists: LX.Playlist.PlaylistInfo[]
  activePlaylistId: string | null
  playlistMusics: Map<string, LX.Music.MusicInfo[]>
}

const state: InitState = {
  playlists: [],
  activePlaylistId: null,
  playlistMusics: new Map(),
}

export default state
