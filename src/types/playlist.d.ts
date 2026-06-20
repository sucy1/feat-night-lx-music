declare namespace LX {
  namespace Playlist {
    interface PlaylistInfo {
      id: string
      name: string
      cover?: string
      description?: string
      createTime: number
      updateTime: number
      musicCount: number
    }

    interface PlaylistInfoFull extends PlaylistInfo {
      list: LX.Music.MusicInfo[]
    }

    interface CreatePlaylistParams {
      name: string
      description?: string
      cover?: string
      musics?: LX.Music.MusicInfo[]
    }

    interface UpdatePlaylistParams {
      id: string
      name?: string
      description?: string
      cover?: string
    }

    interface AddMusicParams {
      playlistId: string
      musicInfos: LX.Music.MusicInfo[]
      addMusicLocationType: LX.AddMusicLocationType
    }

    interface RemoveMusicParams {
      playlistId: string
      musicIds: string[]
    }

    interface UpdateMusicPositionParams {
      playlistId: string
      position: number
      musicIds: string[]
    }
  }
}
