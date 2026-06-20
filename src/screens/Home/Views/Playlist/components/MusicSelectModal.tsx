import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Button from '@/components/common/Button'
import Modal, { type ModalType } from '@/components/common/Modal'
import Checkbox from '@/components/common/CheckBox/Checkbox'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/config/constant'
import { addMusicsToPlaylist } from '@/core/playlist'
import { useMyList } from '@/store/list/hook'
import { getListMusics } from '@/core/list'

interface Props {
  playlistId: string | null
}

const MusicSelectModal = forwardRef<ModalType, Props>(({ playlistId }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const [selectedMusicIds, setSelectedMusicIds] = useState<Set<string>>(new Set())
  const [allMusics, setAllMusics] = useState<LX.Music.MusicInfo[]>([])
  const [currentListIndex, setCurrentListIndex] = useState(0)
  const myLists = useMyList()

  useImperativeHandle(ref, () => ({
    setVisible: (visible: boolean) => {
      modalRef.current?.setVisible(visible)
    },
  }))

  useEffect(() => {
    const loadMusics = async () => {
      if (myLists.length > 0) {
        const list = myLists[currentListIndex]
        if (list) {
          const musics = await getListMusics(list.id)
          setAllMusics(musics)
        }
      }
    }
    void loadMusics()
  }, [currentListIndex, myLists])

  const handleToggleMusic = useCallback((musicId: string) => {
    setSelectedMusicIds(prev => {
      const next = new Set(prev)
      if (next.has(musicId)) {
        next.delete(musicId)
      } else {
        next.add(musicId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedMusicIds.size === allMusics.length) {
      setSelectedMusicIds(new Set())
    } else {
      setSelectedMusicIds(new Set(allMusics.map(m => m.id)))
    }
  }, [selectedMusicIds.size, allMusics.length])

  const handleConfirm = useCallback(async () => {
    if (selectedMusicIds.size === 0) {
      toast(t('playlist_select_music'))
      return
    }
    if (!playlistId) return

    const selectedMusics = allMusics.filter(m => selectedMusicIds.has(m.id))
    try {
      await addMusicsToPlaylist(playlistId, selectedMusics, 'bottom')
      toast(t('list_edit_action_tip_add_success'))
      setSelectedMusicIds(new Set())
      modalRef.current?.setVisible(false)
    } catch (error) {
      toast(t('load_failed'))
    }
  }, [selectedMusicIds, allMusics, playlistId, t])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo; index: number }) => {
    const isSelected = selectedMusicIds.has(item.id)
    return (
      <TouchableOpacity
        style={{ ...styles.item, backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'transparent' }}
        onPress={() => handleToggleMusic(item.id)}
      >
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          tintColors={{
            true: theme['c-primary'],
            false: theme['c-350'],
          }}
          onPress={() => handleToggleMusic(item.id)}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemSinger} size={12} color={theme['c-500']} numberOfLines={1}>
            {item.singer}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }, [selectedMusicIds, theme, handleToggleMusic])

  const keyExtractor = useCallback((item: LX.Music.MusicInfo) => item.id, [])

  const ListHeaderComponent = useMemo(() => (
    <View>
      <View style={styles.listSelector}>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={handleSelectAll}
        >
          <Checkbox
            status={selectedMusicIds.size === allMusics.length && allMusics.length > 0 ? 'checked' : 'unchecked'}
            tintColors={{
              true: theme['c-primary'],
              false: theme['c-350'],
            }}
            onPress={handleSelectAll}
          />
          <Text style={styles.selectAllText}>
            {t('list_select_all')} ({selectedMusicIds.size}/{allMusics.length})
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />
      <View style={styles.listTabs}>
        {myLists.map((list, index) => (
          <TouchableOpacity
            key={list.id}
            style={[
              styles.tabItem,
              currentListIndex === index && { backgroundColor: theme['c-primary-light-700-alpha-300'] },
            ]}
            onPress={() => setCurrentListIndex(index)}
          >
            <Text
              style={styles.tabText}
              color={currentListIndex === index ? theme['c-primary-font'] : theme['c-font']}
            >
              {list.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />
    </View>
  ), [myLists, currentListIndex, allMusics.length, selectedMusicIds.size, theme, t, handleSelectAll])

  return (
    <Modal
      ref={modalRef}
      bgColor="rgba(0,0,0,0.5)"
      bgHide={false}
    >
      <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme['c-content-background'] }}>
          <View style={{ ...styles.header, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => modalRef.current?.setVisible(false)}
            >
              <Icon name="close" size={20} color={theme['c-primary-font']} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} size={16} color={theme['c-primary-font']}>
              {t('playlist_select_music_title')}
            </Text>
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnRight]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText} color={theme['c-primary-font']}>
                {t('confirm')}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={allMusics}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeaderComponent}
            ItemSeparatorComponent={() => <View style={{ ...styles.separator, backgroundColor: theme['c-border-background'] }} />}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    height: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSizeW(16),
  },
  headerBtn: {
    width: scaleSizeW(50),
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnRight: {
    width: 'auto',
    paddingHorizontal: scaleSizeW(12),
  },
  headerTitle: {
    fontWeight: '500',
  },
  confirmText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listSelector: {
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: scaleSizeW(12),
    fontSize: 14,
  },
  listTabs: {
    flexDirection: 'row',
    paddingHorizontal: scaleSizeW(8),
    paddingVertical: scaleSizeH(8),
  },
  tabItem: {
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(8),
    borderRadius: 4,
    marginRight: scaleSizeW(8),
  },
  tabText: {
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(16),
    height: scaleSizeH(LIST_ITEM_HEIGHT),
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
  separator: {
    height: 1,
    marginLeft: scaleSizeW(56),
  },
})

export default MusicSelectModal
