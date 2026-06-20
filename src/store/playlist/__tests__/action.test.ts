/// <reference types="jest" />
import playlistAction from '../action'
import state from '../state'

const mockEmit = jest.fn()
global.state_event = {
  on: jest.fn(),
  off: jest.fn(),
  emit: mockEmit,
  // 其他方法
  playListMusicsAdd: jest.fn(),
  playListMusicsRemove: jest.fn(),
  playListMusicsClear: jest.fn(),
  playListMusicsReorder: jest.fn(),
  playListMusicsUpdatePosition: jest.fn(),
  playListNameUpdate: jest.fn(),
  playListInfoUpdate: jest.fn(),
  playListAdd: jest.fn(),
  playListRemove: jest.fn(),
  playListsUpdate: jest.fn(),
  playListHistoryAdd: jest.fn(),
  playListHistoryClear: jest.fn(),
  playListMusicInfoUpdate: jest.fn(),
  playListMusicMetaUpdate: jest.fn(),
  playListMusicLyricUpdate: jest.fn(),
  playListMusicOtherInfoUpdate: jest.fn(),
  userPlaylistUpdate: jest.fn(),
  userPlaylistRemove: jest.fn(),
  userListUpdate: jest.fn(),
  syncListUpdate: jest.fn(),
  syncNameUpdate: jest.fn(),
  navActiveIdUpdate: jest.fn(),
  homeScrollViewRefUpdate: jest.fn(),
  navPositionEditStatusUpdate: jest.fn(),
  themeUpdate: jest.fn(),
  languageUpdate: jest.fn(),
  configUpdate: jest.fn(),
  playListsUpdated: jest.fn(),
  activePlaylistUpdated: jest.fn(),
  playlistMusicsUpdated: jest.fn(),
} as any

beforeEach(() => {
  state.playlists = []
  state.activePlaylistId = null
  state.playlistMusics = new Map()
  mockEmit.mockClear()
})

describe('playlist/action', () => {
  describe('setPlaylists', () => {
    it('should update playlists and emit event', () => {
      const playlists: LX.Playlist.PlaylistInfo[] = [
        {
          id: 'test1',
          name: 'Test Playlist',
          createTime: Date.now(),
          updateTime: Date.now(),
          musicCount: 0,
        },
      ]
      playlistAction.setPlaylists(playlists)
      expect(state.playlists).toBe(playlists)
      expect(mockEmit).toHaveBeenCalledWith('playlistsUpdated', playlists)
    })
  })

  describe('addPlaylist', () => {
    it('should add playlist and emit event', () => {
      const playlist: LX.Playlist.PlaylistInfo = {
        id: 'test1',
        name: 'Test Playlist',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 0,
      }
      playlistAction.addPlaylist(playlist)
      expect(state.playlists).toHaveLength(1)
      expect(state.playlists[0]).toBe(playlist)
      expect(mockEmit).toHaveBeenCalledWith('playlistsUpdated', [playlist])
    })
  })

  describe('removePlaylist', () => {
    it('should remove playlist and emit event', () => {
      const playlist1: LX.Playlist.PlaylistInfo = {
        id: 'test1',
        name: 'Test Playlist 1',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 0,
      }
      const playlist2: LX.Playlist.PlaylistInfo = {
        id: 'test2',
        name: 'Test Playlist 2',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 0,
      }
      state.playlists = [playlist1, playlist2]
      state.playlistMusics.set('test1', [])
      state.playlistMusics.set('test2', [])
      state.activePlaylistId = 'test1'

      playlistAction.removePlaylist('test1')

      expect(state.playlists).toHaveLength(1)
      expect(state.playlists[0].id).toBe('test2')
      expect(state.playlistMusics.has('test1')).toBe(false)
      expect(state.activePlaylistId).toBeNull()
      expect(mockEmit).toHaveBeenCalledWith('playlistsUpdated', [playlist2])
    })
  })

  describe('updatePlaylist', () => {
    it('should update playlist and emit event', () => {
      const playlist: LX.Playlist.PlaylistInfo = {
        id: 'test1',
        name: 'Test Playlist',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 0,
      }
      state.playlists = [playlist]

      const updatedPlaylist: LX.Playlist.PlaylistInfo = {
        ...playlist,
        name: 'Updated Name',
        musicCount: 5,
      }
      playlistAction.updatePlaylist(updatedPlaylist)

      expect(state.playlists[0].name).toBe('Updated Name')
      expect(state.playlists[0].musicCount).toBe(5)
      expect(mockEmit).toHaveBeenCalledWith('playlistsUpdated', [updatedPlaylist])
    })
  })

  describe('setActivePlaylist', () => {
    it('should set active playlist id and emit event', () => {
      playlistAction.setActivePlaylist('test1')
      expect(state.activePlaylistId).toBe('test1')
      expect(mockEmit).toHaveBeenCalledWith('activePlaylistUpdated', 'test1')
    })

    it('should clear active playlist id when null', () => {
      state.activePlaylistId = 'test1'
      playlistAction.setActivePlaylist(null)
      expect(state.activePlaylistId).toBeNull()
      expect(mockEmit).toHaveBeenCalledWith('activePlaylistUpdated', null)
    })
  })

  describe('setPlaylistMusics', () => {
    it('should set playlist musics and emit event', () => {
      const musics: LX.Music.MusicInfo[] = [
        { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any,
      ]
      playlistAction.setPlaylistMusics('test1', musics)
      expect(state.playlistMusics.get('test1')).toBe(musics)
      expect(mockEmit).toHaveBeenCalledWith('playlistMusicsUpdated', 'test1', musics)
    })
  })

  describe('addPlaylistMusics', () => {
    it('should add musics to playlist and emit event', () => {
      const existingMusic: LX.Music.MusicInfo = {
        id: 'm1',
        name: 'Song 1',
        singer: 'Artist 1',
        source: 'kw',
        interval: '3:45',
        meta: {} as any,
      } as any
      state.playlistMusics.set('test1', [existingMusic])
      const playlist: LX.Playlist.PlaylistInfo = {
        id: 'test1',
        name: 'Test Playlist',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 1,
      }
      state.playlists = [playlist]

      const newMusics: LX.Music.MusicInfo[] = [
        { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any,
      ]
      playlistAction.addPlaylistMusics('test1', newMusics)

      const updatedMusics = state.playlistMusics.get('test1')
      expect(updatedMusics).toHaveLength(2)
      expect(updatedMusics![1].id).toBe('m2')
      expect(state.playlists[0].musicCount).toBe(2)
      expect(mockEmit).toHaveBeenCalledWith('playlistMusicsUpdated', 'test1', updatedMusics)
      expect(mockEmit).toHaveBeenCalledWith('playlistsUpdated', state.playlists)
    })
  })

  describe('removePlaylistMusics', () => {
    it('should remove musics from playlist and emit event', () => {
      const musics: LX.Music.MusicInfo[] = [
        { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any,
        { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any,
        { id: 'm3', name: 'Song 3', singer: 'Artist 3', source: 'kw', interval: '3:30', meta: {} as any } as any,
      ]
      state.playlistMusics.set('test1', [...musics])
      const playlist: LX.Playlist.PlaylistInfo = {
        id: 'test1',
        name: 'Test Playlist',
        createTime: Date.now(),
        updateTime: Date.now(),
        musicCount: 3,
      }
      state.playlists = [playlist]

      playlistAction.removePlaylistMusics('test1', ['m1', 'm3'])

      const updatedMusics = state.playlistMusics.get('test1')
      expect(updatedMusics).toHaveLength(1)
      expect(updatedMusics![0].id).toBe('m2')
      expect(state.playlists[0].musicCount).toBe(1)
    })
  })

  describe('updatePlaylistMusicPosition', () => {
    it('should update music position in playlist and emit event', () => {
      const musics: LX.Music.MusicInfo[] = [
        { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any,
        { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any,
        { id: 'm3', name: 'Song 3', singer: 'Artist 3', source: 'kw', interval: '3:30', meta: {} as any } as any,
      ]
      state.playlistMusics.set('test1', [...musics])

      playlistAction.updatePlaylistMusicPosition('test1', 0, ['m3'])

      const updatedMusics = state.playlistMusics.get('test1')
      expect(updatedMusics![0].id).toBe('m3')
      expect(updatedMusics![1].id).toBe('m1')
      expect(updatedMusics![2].id).toBe('m2')
      expect(mockEmit).toHaveBeenCalledWith('playlistMusicsUpdated', 'test1', updatedMusics)
    })
  })
})
