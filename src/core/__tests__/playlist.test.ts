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

    it('should handle moving music to top position (position 0)', async () => {
      const playlistId = 'playlist_123'
      const music1: LX.Music.MusicInfo = { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any
      const music2: LX.Music.MusicInfo = { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any

      mockGetData.mockResolvedValueOnce([music1, music2])

      await playlistCore.updateMusicPosition(playlistId, 0, ['m2'])

      expect(mockUpdatePlaylistMusicPosition).toHaveBeenCalledWith(playlistId, 0, ['m2'])
      expect(mockSaveData).toHaveBeenCalled()
    })

    it('should handle moving music to bottom position', async () => {
      const playlistId = 'playlist_123'
      const music1: LX.Music.MusicInfo = { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any
      const music2: LX.Music.MusicInfo = { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any
      const music3: LX.Music.MusicInfo = { id: 'm3', name: 'Song 3', singer: 'Artist 3', source: 'kw', interval: '3:30', meta: {} as any } as any

      mockGetData.mockResolvedValueOnce([music1, music2, music3])

      await playlistCore.updateMusicPosition(playlistId, 2, ['m1'])

      expect(mockUpdatePlaylistMusicPosition).toHaveBeenCalledWith(playlistId, 2, ['m1'])
      expect(mockSaveData).toHaveBeenCalled()
    })

    it('should handle moving multiple musics at once', async () => {
      const playlistId = 'playlist_123'
      const music1: LX.Music.MusicInfo = { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any
      const music2: LX.Music.MusicInfo = { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any
      const music3: LX.Music.MusicInfo = { id: 'm3', name: 'Song 3', singer: 'Artist 3', source: 'kw', interval: '3:30', meta: {} as any } as any

      mockGetData.mockResolvedValueOnce([music1, music2, music3])

      await playlistCore.updateMusicPosition(playlistId, 0, ['m2', 'm3'])

      expect(mockUpdatePlaylistMusicPosition).toHaveBeenCalledWith(playlistId, 0, ['m2', 'm3'])
      expect(mockSaveData).toHaveBeenCalled()
    })

    it('should persist music order to storage after position update', async () => {
      const playlistId = 'playlist_123'
      const music1: LX.Music.MusicInfo = { id: 'm1', name: 'Song 1', singer: 'Artist 1', source: 'kw', interval: '3:45', meta: {} as any } as any
      const music2: LX.Music.MusicInfo = { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any

      mockGetData.mockResolvedValueOnce([music1, music2])

      await playlistCore.updateMusicPosition(playlistId, 0, ['m2'])

      expect(mockSaveData).toHaveBeenCalledWith(
        `${storageDataPrefix.playlist}${playlistId}`,
        expect.anything()
      )
    })
  })

  describe('CRUD operations - comprehensive', () => {
    it('should complete full CRUD lifecycle with persistence', async () => {
      const playlistInfo: LX.Playlist.PlaylistInfo = {
        id: 'playlist_crud',
        name: 'CRUD Playlist',
        createTime: 1234567890,
        updateTime: 1234567890,
        musicCount: 0,
      }

      mockGetData.mockResolvedValueOnce([playlistInfo])
      mockGetData.mockResolvedValueOnce([])

      await playlistCore.loadPlaylists()
      expect(mockSetPlaylists).toHaveBeenCalledWith([playlistInfo])

      const createParams: LX.Playlist.CreatePlaylistParams = {
        name: 'New Playlist',
        description: 'Test description',
        musics: [mockMusicInfo],
      }
      const createdPlaylist = await playlistCore.createPlaylist(createParams)
      expect(createdPlaylist.name).toBe('New Playlist')
      expect(mockAddPlaylist).toHaveBeenCalled()
      expect(mockSaveData).toHaveBeenCalled()

      const updateParams: LX.Playlist.UpdatePlaylistParams = {
        id: createdPlaylist.id,
        name: 'Updated Name',
        description: 'Updated description',
      }
      await playlistCore.updatePlaylistInfo(updateParams)
      expect(mockUpdatePlaylist).toHaveBeenCalled()

      const music2: LX.Music.MusicInfo = { id: 'm2', name: 'Song 2', singer: 'Artist 2', source: 'kw', interval: '4:00', meta: {} as any } as any
      mockGetData.mockResolvedValueOnce([mockMusicInfo])
      await playlistCore.addMusicsToPlaylist(createdPlaylist.id, [music2])
      expect(mockAddPlaylistMusics).toHaveBeenCalled()

      mockGetData.mockResolvedValueOnce([mockMusicInfo, music2])
      await playlistCore.removeMusicsFromPlaylist(createdPlaylist.id, ['m1'])
      expect(mockRemovePlaylistMusics).toHaveBeenCalled()

      await playlistCore.deletePlaylist(createdPlaylist.id)
      expect(mockRemovePlaylist).toHaveBeenCalledWith(createdPlaylist.id)
      expect(mockRemoveData).toHaveBeenCalledWith(`${storageDataPrefix.playlist}${createdPlaylist.id}`)
    })

    it('should handle creating playlist with duplicate name', async () => {
      const params1: LX.Playlist.CreatePlaylistParams = { name: 'My Playlist' }
      const params2: LX.Playlist.CreatePlaylistParams = { name: 'My Playlist' }

      const playlist1 = await playlistCore.createPlaylist(params1)
      const playlist2 = await playlistCore.createPlaylist(params2)

      expect(playlist1.id).not.toBe(playlist2.id)
      expect(playlist1.name).toBe('My Playlist')
      expect(playlist2.name).toBe('My Playlist')
    })

    it('should handle updating non-existent playlist gracefully', async () => {
      const params: LX.Playlist.UpdatePlaylistParams = {
        id: 'non_existent',
        name: 'Updated Name',
      }

      mockGetData.mockResolvedValueOnce([])

      await expect(playlistCore.updatePlaylistInfo(params)).resolves.not.toThrow()
    })

    it('should handle adding musics to non-existent playlist', async () => {
      mockGetData.mockResolvedValueOnce(null)

      await playlistCore.addMusicsToPlaylist('non_existent', [mockMusicInfo])

      expect(mockAddPlaylistMusics).toHaveBeenCalled()
      expect(mockSaveData).toHaveBeenCalled()
    })

    it('should handle removing musics from non-existent playlist', async () => {
      mockGetData.mockResolvedValueOnce(null)

      await expect(
        playlistCore.removeMusicsFromPlaylist('non_existent', ['m1'])
      ).resolves.not.toThrow()
    })

    it('should handle deleting non-existent playlist', async () => {
      await expect(
        playlistCore.deletePlaylist('non_existent')
      ).resolves.not.toThrow()
      expect(mockRemovePlaylist).toHaveBeenCalledWith('non_existent')
    })

    it('should handle storage errors gracefully', async () => {
      mockGetData.mockRejectedValueOnce(new Error('Storage error'))

      await expect(playlistCore.loadPlaylists()).resolves.not.toThrow()
    })
  })

  describe('playlist persistence', () => {
    it('should save playlist list to correct storage key', async () => {
      const params: LX.Playlist.CreatePlaylistParams = { name: 'Test' }
      await playlistCore.createPlaylist(params)

      expect(mockSaveData).toHaveBeenCalledWith(
        storageDataPrefix.playlistList,
        expect.anything()
      )
    })

    it('should save individual playlist musics to correct storage key', async () => {
      const params: LX.Playlist.CreatePlaylistParams = { name: 'Test', musics: [mockMusicInfo] }
      const playlist = await playlistCore.createPlaylist(params)

      expect(mockSaveData).toHaveBeenCalledWith(
        `${storageDataPrefix.playlist}${playlist.id}`,
        [mockMusicInfo]
      )
    })

    it('should update playlist list when playlist is deleted', async () => {
      const playlistId = 'test_delete'
      mockGetData.mockResolvedValueOnce([])

      await playlistCore.deletePlaylist(playlistId)

      expect(mockSaveData).toHaveBeenCalledWith(
        storageDataPrefix.playlistList,
        expect.anything()
      )
    })
  })
})
