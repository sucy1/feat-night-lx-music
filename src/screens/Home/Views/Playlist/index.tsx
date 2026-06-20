import { useCallback, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { usePlaylists } from '@/store/playlist/hook'
import { createStyle, confirmDialog, toast } from '@/utils/tools'
import { HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/config/constant'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { deletePlaylist, setActivePlaylist } from '@/core/playlist'
import CreatePlaylistModal from './components/CreatePlaylistModal'
import MusicSelectModal from './components/MusicSelectModal'
import PlaylistDetail from './components/PlaylistDetail'
import type { ModalType } from '@/components/common/Modal'
import { useActivePlaylistId } from '@/store/playlist/hook'

const PlaylistList = () => {
  const theme = useTheme()
  const t = useI18n()
  const playlists = usePlaylists()
  const activePlaylistId = useActivePlaylistId()
  const createModalRef = useRef<ModalType>(null)
  const musicSelectModalRef = useRef<ModalType>(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)

  const handleCreatePlaylist = useCallback(() => {
    setSelectedPlaylistId(null)
    createModalRef.current?.setVisible(true)
  }, [])

  const handlePlaylistPress = useCallback((playlist: LX.Playlist.PlaylistInfo) => {
    setActivePlaylist(playlist.id)
  }, [])

  const handleBackToList = useCallback(() => {
    setActivePlaylist(null)
  }, [])

  const handleAddMusic = useCallback((playlist: LX.Playlist.PlaylistInfo) => {
    setSelectedPlaylistId(playlist.id)
    musicSelectModalRef.current?.setVisible(true)
  }, [])

  const handleDeletePlaylist = useCallback(async (playlist: LX.Playlist.PlaylistInfo) => {
    const isConfirm = await confirmDialog({
      message: t('playlist_delete_tip', { name: playlist.name }),
      confirmButtonText: t('confirm_button_text'),
    })
    if (!isConfirm) return
    await deletePlaylist(playlist.id)
    toast(t('list_edit_action_tip_remove_success'))
  }, [t])

  const handleRenamePlaylist = useCallback((playlist: LX.Playlist.PlaylistInfo) => {
    setSelectedPlaylistId(playlist.id)
    createModalRef.current?.setVisible(true)
  }, [])

  const renderItem = useCallback(({ item }: { item: LX.Playlist.PlaylistInfo }) => {
    return (
      <TouchableOpacity
        style={{ ...styles.item, backgroundColor: activePlaylistId === item.id ? theme['c-primary-background-hover'] : 'transparent' }}
        onPress={() => handlePlaylistPress(item)}
      >
        <View style={styles.itemIcon}>
          <Icon name="add_folder" size={24} color={theme['c-primary-font']} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemDesc} size={12} color={theme['c-500']} numberOfLines={1}>
            {item.musicCount} {t('play_detail_setting_lrc_font_size') === '歌词字体大小' ? '首' : 'songs'}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddMusic(item)}>
            <Icon name="add-music" size={18} color={theme['c-350']} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleRenamePlaylist(item)}>
            <Icon name="slider" size={18} color={theme['c-350']} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeletePlaylist(item)}>
            <Icon name="remove" size={18} color={theme['c-350']} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }, [activePlaylistId, theme, t, handlePlaylistPress, handleAddMusic, handleRenamePlaylist, handleDeletePlaylist])

  const keyExtractor = useCallback((item: LX.Playlist.PlaylistInfo) => item.id, [])

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="add_folder" size={64} color={theme['c-primary-dark-100-alpha-300']} />
      <Text style={styles.emptyText} color={theme['c-500']}>
        {t('playlist_empty')}
      </Text>
    </View>
  ), [theme, t])

  if (activePlaylistId) {
    return (
      <PlaylistDetail
        playlistId={activePlaylistId}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <View style={{ ...styles.header, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>
        <Text style={styles.headerTitle} size={18} color={theme['c-primary-font']}>
          {t('nav_playlist')}
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleCreatePlaylist}>
          <Icon name="add-music" size={22} color={theme['c-primary-font']} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />}
        ListEmptyComponent={ListEmptyComponent}
        style={styles.list}
      />

      <CreatePlaylistModal
        ref={createModalRef}
        editPlaylistId={selectedPlaylistId}
      />

      <MusicSelectModal
        ref={musicSelectModalRef}
        playlistId={selectedPlaylistId}
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
  },
  headerTitle: {
    fontWeight: '500',
  },
  headerBtn: {
    width: scaleSizeW(40),
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
    height: scaleSizeH(LIST_ITEM_HEIGHT),
  },
  itemIcon: {
    width: scaleSizeW(40),
    height: scaleSizeW(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSizeW(12),
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
  },
  itemDesc: {
    marginTop: scaleSizeH(4),
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: scaleSizeW(40),
    height: scaleSizeH(LIST_ITEM_HEIGHT),
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginLeft: scaleSizeW(68),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleSizeH(100),
  },
  emptyText: {
    marginTop: scaleSizeH(16),
    fontSize: 14,
  },
})

export default PlaylistList
