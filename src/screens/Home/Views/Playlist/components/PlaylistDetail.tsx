import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList, Alert } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Button from '@/components/common/Button'
import Checkbox from '@/components/common/CheckBox/Checkbox'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, confirmDialog, toast } from '@/utils/tools'
import { HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/config/constant'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { usePlaylist, usePlaylistMusics } from '@/store/playlist/hook'
import { removeMusicsFromPlaylist, updateMusicPosition } from '@/core/playlist'
import type { ModalType } from '@/components/common/Modal'
import MusicSelectModal from './MusicSelectModal'

interface Props {
  playlistId: string
  onBack: () => void
}

const PlaylistDetail = ({ playlistId, onBack }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  const playlist = usePlaylist(playlistId)
  const musics = usePlaylistMusics(playlistId)
  const musicSelectModalRef = useRef<ModalType>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMusicIds, setSelectedMusicIds] = useState<Set<string>>(new Set())
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isEditMode) {
      setSelectedMusicIds(new Set())
    }
  }, [isEditMode])

  const handleToggleMusic = useCallback((musicId: string) => {
    if (!isEditMode) return
    setSelectedMusicIds(prev => {
      const next = new Set(prev)
      if (next.has(musicId)) {
        next.delete(musicId)
      } else {
        next.add(musicId)
      }
      return next
    })
  }, [isEditMode])

  const handleSelectAll = useCallback(() => {
    if (selectedMusicIds.size === musics.length) {
      setSelectedMusicIds(new Set())
    } else {
      setSelectedMusicIds(new Set(musics.map(m => m.id)))
    }
  }, [selectedMusicIds.size, musics.length])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedMusicIds.size === 0) return
    const isConfirm = await confirmDialog({
      message: t('playlist_remove_music_tip', { num: selectedMusicIds.size }),
      confirmButtonText: t('confirm_button_text'),
    })
    if (!isConfirm) return

    try {
      await removeMusicsFromPlaylist(playlistId, Array.from(selectedMusicIds))
      toast(t('list_edit_action_tip_remove_success'))
      setSelectedMusicIds(new Set())
      setIsEditMode(false)
    } catch (error) {
      toast(t('load_failed'))
    }
  }, [selectedMusicIds, playlistId, t])

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return
    const music = musics[index]
    void updateMusicPosition(playlistId, index - 1, [music.id])
  }, [musics, playlistId])

  const handleMoveDown = useCallback((index: number) => {
    if (index >= musics.length - 1) return
    const music = musics[index]
    void updateMusicPosition(playlistId, index + 1, [music.id])
  }, [musics, playlistId])

  const handleAddMusic = useCallback(() => {
    musicSelectModalRef.current?.setVisible(true)
  }, [])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo; index: number }) => {
    const isSelected = selectedMusicIds.has(item.id)
    const isDragged = draggedIndex === index

    return (
      <View
        style={{
          ...styles.item,
          backgroundColor: isSelected
            ? theme['c-primary-background-hover']
            : isDragged
              ? theme['c-primary-light-700-alpha-300']
              : 'transparent',
        }}
      >
        {isEditMode ? (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            tintColors={{
              true: theme['c-primary'],
              false: theme['c-350'],
            }}
            onPress={() => handleToggleMusic(item.id)}
          />
        ) : (
          <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemSinger} size={12} color={theme['c-500']} numberOfLines={1}>
            {item.singer}
          </Text>
        </View>

        {isReorderMode ? (
          <View style={styles.reorderActions}>
            <TouchableOpacity
              style={[styles.reorderBtn, index === 0 && { opacity: 0.3 }]}
              onPress={() => handleMoveUp(index)}
              disabled={index === 0}
            >
              <Icon name="chevron-left-2" size={18} color={theme['c-350']} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderBtn, index === musics.length - 1 && { opacity: 0.3 }]}
              onPress={() => handleMoveDown(index)}
              disabled={index === musics.length - 1}
            >
              <Icon name="chevron-right-2" size={18} color={theme['c-350']} />
            </TouchableOpacity>
          </View>
        ) : null}

        {!isEditMode && !isReorderMode ? (
          <Text style={styles.itemInterval} size={12} color={theme['c-250']} numberOfLines={1}>
            {item.interval || '--:--'}
          </Text>
        ) : null}
      </View>
    )
  }, [selectedMusicIds, draggedIndex, theme, isEditMode, isReorderMode, musics.length, handleToggleMusic, handleMoveUp, handleMoveDown])

  const keyExtractor = useCallback((item: LX.Music.MusicInfo) => item.id, [])

  const ListHeaderComponent = useMemo(() => {
    if (!playlist) return null
    return (
      <View>
        <View style={styles.playlistInfo}>
          <View style={styles.playlistIcon}>
            <Icon name="add_folder" size={48} color={theme['c-primary-font']} />
          </View>
          <View style={styles.playlistMeta}>
            <Text style={styles.playlistName} size={18} numberOfLines={1}>
              {playlist.name}
            </Text>
            {playlist.description ? (
              <Text style={styles.playlistDesc} size={12} color={theme['c-500']} numberOfLines={2}>
                {playlist.description}
              </Text>
            ) : null}
            <Text style={styles.playlistCount} size={12} color={theme['c-500']}>
              {playlist.musicCount} {t('play_detail_setting_lrc_font_size') === '歌词字体大小' ? '首歌曲' : ' songs'}
            </Text>
          </View>
        </View>

        <View style={styles.actionBar}>
          {isEditMode || isReorderMode ? (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setIsEditMode(false)
                  setIsReorderMode(false)
                  setSelectedMusicIds(new Set())
                }}
              >
                <Text style={styles.actionBtnText} color={theme['c-font']}>
                  {t('playlist_cancel')}
                </Text>
              </TouchableOpacity>
              {isEditMode ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleSelectAll}
                  >
                    <Text style={styles.actionBtnText} color={theme['c-font']}>
                      {t('list_select_all')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={handleDeleteSelected}
                    disabled={selectedMusicIds.size === 0}
                  >
                    <Text
                      style={styles.actionBtnText}
                      color={selectedMusicIds.size > 0 ? theme['c-primary'] : theme['c-350']}
                    >
                      {t('playlist_remove_music')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={handleAddMusic}>
                <Icon name="add-music" size={18} color={theme['c-primary']} />
                <Text style={styles.actionBtnText} color={theme['c-primary']}>
                  {t('playlist_add_music')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditMode(true)}>
                <Icon name="remove" size={18} color={theme['c-350']} />
                <Text style={styles.actionBtnText} color={theme['c-font']}>
                  {t('playlist_remove_music')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsReorderMode(true)}>
                <Icon name="slider" size={18} color={theme['c-350']} />
                <Text style={styles.actionBtnText} color={theme['c-font']}>
                  {t('change_position')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />
      </View>
    )
  }, [playlist, theme, t, isEditMode, isReorderMode, selectedMusicIds.size, handleSelectAll, handleDeleteSelected, handleAddMusic])

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="add-music" size={48} color={theme['c-primary-dark-100-alpha-300']} />
      <Text style={styles.emptyText} color={theme['c-500']}>
        {t('playlist_no_music')}
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={handleAddMusic}>
        <Text style={styles.emptyBtnText} color={theme['c-primary']}>
          {t('playlist_add_music')}
        </Text>
      </TouchableOpacity>
    </View>
  ), [theme, t, handleAddMusic])

  if (!playlist) return null

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <View style={{ ...styles.header, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>
        <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
          <Icon name="chevron-left" size={24} color={theme['c-primary-font']} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} size={16} color={theme['c-primary-font']} numberOfLines={1}>
          {playlist.name}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <FlatList
        data={musics}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={() => <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />}
        style={styles.list}
      />

      <MusicSelectModal
        ref={musicSelectModalRef}
        playlistId={playlistId}
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
    paddingHorizontal: scaleSizeW(8),
  },
  headerBtn: {
    width: scaleSizeW(48),
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '500',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  playlistInfo: {
    flexDirection: 'row',
    padding: scaleSizeW(16),
    alignItems: 'center',
  },
  playlistIcon: {
    width: scaleSizeW(72),
    height: scaleSizeW(72),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    marginRight: scaleSizeW(16),
  },
  playlistMeta: {
    flex: 1,
  },
  playlistName: {
    fontWeight: '500',
  },
  playlistDesc: {
    marginTop: scaleSizeH(4),
  },
  playlistCount: {
    marginTop: scaleSizeH(4),
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(8),
    borderBottomWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(8),
    marginRight: scaleSizeW(8),
    borderRadius: 4,
  },
  actionBtnText: {
    fontSize: 13,
    marginLeft: scaleSizeW(4),
  },
  actionBtnDanger: {
    marginLeft: 'auto',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(LIST_ITEM_HEIGHT),
  },
  sn: {
    width: scaleSizeW(38),
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: scaleSizeW(12),
  },
  itemName: {
    fontSize: 14,
  },
  itemSinger: {
    marginTop: scaleSizeH(4),
  },
  itemInterval: {
    marginRight: scaleSizeW(8),
  },
  reorderActions: {
    flexDirection: 'row',
  },
  reorderBtn: {
    width: scaleSizeW(36),
    height: scaleSizeH(LIST_ITEM_HEIGHT),
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginLeft: scaleSizeW(56),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleSizeH(80),
  },
  emptyText: {
    marginTop: scaleSizeH(16),
    fontSize: 14,
  },
  emptyBtn: {
    marginTop: scaleSizeH(16),
    paddingHorizontal: scaleSizeW(24),
    paddingVertical: scaleSizeH(10),
    borderRadius: 4,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 14,
  },
})

export default PlaylistDetail
