/// <reference types="jest" />
import * as playlistCore from '../playlist'
import playlistAction from '@/store/playlist/action'
import { storageDataPrefix } from '@/config/constant'

const mockSetPlaylists = jest.fn()
const mockAddPlaylist = jest.fn()
const mockRemovePlaylist = jest.fn()
const mockUpdatePlaylist = jest.fn()
const mockSetPlaylistMusics = jest.fn()
const mockAddPlaylistMusics = jest.fn()
const mockRemovePlaylistMusics = jest.fn()
const mockUpdatePlaylistMusicPosition = jest.fn()

// 模拟 storage
jest.mock('@/plugins/storage', () => ({
  saveData: jest.fn(),
  getData: jest.fn(),
  removeData: jest.fn(),
}))

// 模拟 action
jest.mock('@/store/playlist/action', () => ({
  default: {
    setPlaylists: (...args: any[]) => mockSetPlaylists(...args),
    addPlaylist: (...args: any[]) => mockAddPlaylist(...args),
    removePlaylist: (...args: any[]) => mockRemovePlaylist(...args),
    updatePlaylist: (...args: any[]) => mockUpdatePlaylist(...args),
    setPlaylistMusics: (...args: any[]) => mockSetPlaylistMusics(...args),
    addPlaylistMusics: (...args: any[]) => mockAddPlaylistMusics(...args),
    removePlaylistMusics: (...args: any[]) => mockRemovePlaylistMusics(...args),
    updatePlaylistMusicPosition: (...args: any[]) => mockUpdatePlaylistMusicPosition(...args),
  },
}))

import { saveData, getData, removeData } from '@/plugins/storage'

const mockGetData = getData as jest.MockedFunction<typeof getData>
const mockSaveData = saveData as jest.MockedFunction<typeof saveData>
const mockRemoveData = removeData as jest.MockedFunction<typeof removeData>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('core/playlist', () => {
  const mockMusicInfo: LX.Music.MusicInfo = {
    id: 'm1',
    name: 'Test Song',
    singer: 'Test Artist',
    source: 'kw',
    interval: '3:45',
    meta: {} as any,
  } as any

  describe('loadPlaylists', () => {
    it('should load playlists from storage', async () => {
      const playlistInfo: LX.Playlist.PlaylistInfo = {
        id: 'playlist_1',
        name: 'Test Playlist',
        createTime: 1234567890,
        updateTime: 1234567890,
        musicCount: 1,
      }
      mockGetData.mockImplementation(async (key: string) => {
        if (key === storageDataPrefix.playlistList) {
          return [playlistInfo]
        } else if (key === `${storageDataPrefix.playlist}playlist_1`) {
          return [mockMusicInfo]
        }
        return null
      })

      await playlistCore.loadPlaylists()

      expect(mockSetPlaylists).toHaveBeenCalledWith([playlistInfo])
      expect(mockSetPlaylistMusics).toHaveBeenCalledWith('playlist_1', [mockMusicInfo])
    })

    it('should handle empty storage gracefully', async () => {
      mockGetData.mockResolvedValue(null)

      await playlistCore.loadPlaylists()

      expect(mockSetPlaylists).toHaveBeenCalledWith([])
      expect(mockSetPlaylistMusics).not.toHaveBeenCalled()
    })

    it('should skip playlist without music data', async () => {
      const playlistInfo: LX.Playlist.PlaylistInfo = {
        id: 'playlist_1',
        name: 'Test Playlist',
        createTime: 1234567890,
        updateTime: 1234567890,
        musicCount: 1,
      }
      mockGetData.mockImplementation(async (key: string) => {
        if (key === storageDataPrefix.playlistList) {
          return [playlistInfo]
        }
        return null
      })

      await playlistCore.loadPlaylists()

      expect(mockSetPlaylists).toHaveBeenCalledWith([playlistInfo])
      expect(mockSetPlaylistMusics).toHaveBeenCalledWith('playlist_1', [])
    })
  })

  describe('createPlaylist', () => {
    it('should create a new playlist with music', async () => {
      const params: LX.Playlist.CreatePlaylistParams = {
        name: 'My Playlist',
        description: 'Test description',
        musics: [mockMusicInfo],
      }

      const result = await playlistCore.createPlaylist(params)

      expect(result.id).toMatch(/^playlist_\d+$/)
      expect(result.name).toBe('My Playlist')
      expect(result.description).toBe('Test description')
      expect(result.musicCount).toBe(1)
      expect(result.createTime).toBeDefined()
      expect(result.updateTime).toBeDefined()

      expect(mockAddPlaylist).toHaveBeenCalled()
      expect(mockSetPlaylistMusics).toHaveBeenCalledWith(result.id, [mockMusicInfo])
      expect(mockSaveData).toHaveBeenCalledTimes(2)
    })

    it('should create a new playlist without music', async () => {
      const params: LX.Playlist.CreatePlaylistParams = {
        name: 'Empty Playlist',
      }

      const result = await playlistCore.createPlaylist(params)

      expect(result.musicCount).toBe(0)
      expect(mockSetPlaylistMusics).toHaveBeenCalledWith(result.id, [])
    })
  })

  describe('deletePlaylist', () => {
    it('should delete playlist and its music data', async () => {
      const playlistId = 'playlist_123'

      await playlistCore.deletePlaylist(playlistId)

      expect(mockRemovePlaylist).toHaveBeenCalledWith(playlistId)
      expect(mockRemoveData).toHaveBeenCalledWith(`${storageDataPrefix.playlist}${playlistId}`)
    })
  })

  describe('updatePlaylistInfo', () => {
    it('should update playlist info', async () => {
      const params: LX.Playlist.UpdatePlaylistParams = {
        id: 'playlist_123',
        name: 'Updated Name',
        description: 'Updated description',
      }

      await playlistCore.updatePlaylistInfo(params)

      expect(mockUpdatePlaylist).toHaveBeenCalled()
      expect(mockSaveData).toHaveBeenCalled()
    })
  })

  describe('addMusicsToPlaylist', () => {
    it('should add musics to playlist', async () => {
      const playlistId = 'playlist_123'
      const newMusics = [mockMusicInfo]

      mockGetData.mockResolvedValueOnce([mockMusicInfo])

      await playlistCore.addMusicsToPlaylist(playlistId, newMusics)

      expect(mockAddPlaylistMusics).toHaveBeenCalledWith(playlistId, newMusics, 'bottom')
      expect(mockSaveData).toHaveBeenCalled()
    })
  })

  describe('removeMusicsFromPlaylist', () => {
    it('should remove musics from playlist', async () => {
      const playlistId = 'playlist_123'
      const musicIds = ['m1', 'm2']

      mockGetData.mockResolvedValueOnce([mockMusicInfo])

      await playlistCore.removeMusicsFromPlaylist(playlistId, musicIds)

      expect(mockRemovePlaylistMusics).toHaveBeenCalledWith(playlistId, musicIds)
      expect(mockSaveData).toHaveBeenCalled()
    })
  })

  describe('updateMusicPosition', () => {
    it('should update music position', async () => {
      const playlistId = 'playlist_123'
      const position = 1
      const musicIds = ['m3']

      mockGetData.mockResolvedValueOnce([mockMusicInfo])

      await playlistCore.updateMusicPosition(playlistId, position, musicIds)

      expect(mockUpdatePlaylistMusicPosition).toHaveBeenCalledWith(playlistId, position, musicIds)
      expect(mockSaveData).toHaveBeenCalled()
    })
  })
})
