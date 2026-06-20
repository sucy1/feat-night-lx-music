import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
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
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set())
  const scaleAnims = useRef<Map<string, Animated.Value>>(new Map())
  const opacityAnims = useRef<Map<string, Animated.Value>>(new Map())
  const translateAnims = useRef<Map<string, Animated.Value>>(new Map())
  const isAnimating = useRef(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setSelectedMusicIds(new Set())
    }
  }, [isEditMode])

  useEffect(() => {
    if (isEditMode || isReorderMode) {
      setSearchKeyword('')
      setIsSearchVisible(false)
    }
  }, [isEditMode, isReorderMode])

  const filteredMusics = useMemo(() => {
    if (!searchKeyword) return musics
    const keyword = searchKeyword.toLowerCase()
    return musics.filter(m =>
      m.name.toLowerCase().includes(keyword) ||
      m.singer.toLowerCase().includes(keyword)
    )
  }, [musics, searchKeyword])

  const handleSearchChange = useCallback((text: string) => {
    setSearchKeyword(text.trim())
  }, [])

  const handleToggleSearch = useCallback(() => {
    setIsSearchVisible(prev => {
      if (prev) setSearchKeyword('')
      return !prev
    })
  }, [])

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

  const getOrCreateAnim = useCallback((musicId: string) => {
    if (!scaleAnims.current.has(musicId)) {
      scaleAnims.current.set(musicId, new Animated.Value(1))
    }
    if (!opacityAnims.current.has(musicId)) {
      opacityAnims.current.set(musicId, new Animated.Value(1))
    }
    if (!translateAnims.current.has(musicId)) {
      translateAnims.current.set(musicId, new Animated.Value(0))
    }
    return {
      scale: scaleAnims.current.get(musicId)!,
      opacity: opacityAnims.current.get(musicId)!,
      translateY: translateAnims.current.get(musicId)!,
    }
  }, [])

  const playMoveAnimation = useCallback(async (movingIndex: number, targetIndex: number, direction: 'up' | 'down') => {
    if (isAnimating.current) return
    isAnimating.current = true

    const movingMusic = musics[movingIndex]
    const targetMusic = musics[targetIndex]
    if (!movingMusic || !targetMusic) {
      isAnimating.current = false
      return
    }

    const movingAnim = getOrCreateAnim(movingMusic.id)
    const targetAnim = getOrCreateAnim(targetMusic.id)

    setAnimatingIndices(new Set([movingIndex, targetIndex]))
    setDraggedIndex(movingIndex)

    const itemHeight = scaleSizeH(LIST_ITEM_HEIGHT)
    const moveDistance = direction === 'up' ? -itemHeight : itemHeight

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          Animated.parallel([
            Animated.timing(movingAnim.scale,
            {
              toValue: 1.05,
              duration: 150,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(movingAnim.opacity,
            {
              toValue: 0.8,
              duration: 150,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(movingAnim.translateY,
            {
              toValue: moveDistance,
              duration: 250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            movingAnim.scale.setValue(1)
            movingAnim.opacity.setValue(1)
            movingAnim.translateY.setValue(0)
            resolve()
          })
        }),
        new Promise<void>((resolve) => {
          Animated.timing(targetAnim.translateY,
          {
            toValue: -moveDistance,
            duration: 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            targetAnim.translateY.setValue(0)
            resolve()
          })
        }),
      ])

      await updateMusicPosition(playlistId, targetIndex, [movingMusic.id])
    } catch (error) {
      console.error('Animation error:', error)
    } finally {
      setAnimatingIndices(new Set())
      setDraggedIndex(null)
      isAnimating.current = false
    }
  }, [musics, playlistId, getOrCreateAnim])

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0 || isAnimating.current) return
    playMoveAnimation(index, index - 1, 'up')
  }, [playMoveAnimation])

  const handleMoveDown = useCallback((index: number) => {
    if (index >= musics.length - 1 || isAnimating.current) return
    playMoveAnimation(index, index + 1, 'down')
  }, [musics.length, playMoveAnimation])

  const handleAddMusic = useCallback(() => {
    musicSelectModalRef.current?.setVisible(true)
  }, [])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo; index: number }) => {
    const isSelected = selectedMusicIds.has(item.id)
    const isDragged = draggedIndex === index
    const isAnimatingItem = animatingIndices.has(index)
    const anim = getOrCreateAnim(item.id)
    const originalIndex = musics.findIndex(m => m.id === item.id)

    const animatedStyle = {
      transform: [
        { scale: anim.scale },
        { translateY: anim.translateY },
      ],
      opacity: anim.opacity,
    }

    return (
      <Animated.View
        style={[
          {
            ...styles.item,
            backgroundColor: isSelected
              ? theme['c-primary-background-hover']
              : isDragged
                ? theme['c-primary-light-700-alpha-300']
                : 'transparent',
          },
          isAnimatingItem ? animatedStyle : null,
        ]}
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
          <Text style={styles.sn} size={13} color={theme['c-300']}>{originalIndex + 1}</Text>
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
              disabled={index === 0 || isAnimating.current}
            >
              <Icon name="chevron-left-2" size={18} color={theme['c-350']} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderBtn, index === musics.length - 1 && { opacity: 0.3 }]}
              onPress={() => handleMoveDown(index)}
              disabled={index === musics.length - 1 || isAnimating.current}
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
      </Animated.View>
    )
  }, [selectedMusicIds, draggedIndex, animatingIndices, theme, isEditMode, isReorderMode, musics, filteredMusics.length, handleToggleMusic, handleMoveUp, handleMoveDown, getOrCreateAnim])

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
              {searchKeyword ? ` (${filteredMusics.length})` : ''}
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
              <TouchableOpacity style={styles.actionBtn} onPress={handleToggleSearch}>
                <Icon name="search-2" size={18} color={isSearchVisible ? theme['c-primary'] : theme['c-350']} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {isSearchVisible && !isEditMode && !isReorderMode ? (
          <View style={{ ...styles.searchBar, backgroundColor: theme['c-primary-input-background'] }}>
            <Icon name="search-2" size={16} color={theme['c-primary-dark-100-alpha-500']} />
            <Input
              placeholder={t('playlist_search_placeholder')}
              value={searchKeyword}
              onChangeText={handleSearchChange}
              style={styles.searchInput}
              clearBtn
              autoFocus
            />
          </View>
        ) : null}

        <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />
      </View>
    )
  }, [playlist, theme, t, isEditMode, isReorderMode, selectedMusicIds.size, isSearchVisible, searchKeyword, filteredMusics.length, handleSelectAll, handleDeleteSelected, handleAddMusic, handleToggleSearch, handleSearchChange])

  const ListEmptyComponent = useMemo(() => {
    if (searchKeyword && musics.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search-2" size={48} color={theme['c-primary-dark-100-alpha-300']} />
          <Text style={styles.emptyText} color={theme['c-500']}>
            {t('playlist_search_no_result')}
          </Text>
        </View>
      )
    }
    return (
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
    )
  }, [theme, t, searchKeyword, musics.length, handleAddMusic])

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
        data={filteredMusics}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(12),
    marginHorizontal: scaleSizeW(12),
    marginVertical: scaleSizeH(8),
    borderRadius: 4,
    height: 38,
  },
  searchInput: {
    marginLeft: scaleSizeW(8),
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
