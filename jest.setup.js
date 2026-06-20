import 'react-native-gesture-handler/jestSetup'

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

global.state_event = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  playListsUpdated: jest.fn(),
  activePlaylistUpdated: jest.fn(),
  playlistMusicsUpdated: jest.fn(),
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
}

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
