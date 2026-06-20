import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Modal, { type ModalType } from '@/components/common/Modal'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { createPlaylist, updatePlaylistInfo } from '@/core/playlist'
import playlistState from '@/store/playlist/state'
import type { InputType } from '@/components/common/Input'

interface Props {
  editPlaylistId?: string | null
}

const CreatePlaylistModal = forwardRef<ModalType, Props>(({ editPlaylistId }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const nameInputRef = useRef<InputType>(null)
  const descInputRef = useRef<InputType>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isEdit, setIsEdit] = useState(false)

  useImperativeHandle(ref, () => ({
    setVisible: (visible: boolean) => {
      modalRef.current?.setVisible(visible)
    },
  }))

  useEffect(() => {
    if (editPlaylistId) {
      const playlist = playlistState.playlists.find(p => p.id === editPlaylistId)
      if (playlist) {
        setName(playlist.name)
        setDescription(playlist.description || '')
        setIsEdit(true)
        return
      }
    }
    setName('')
    setDescription('')
    setIsEdit(false)
  }, [editPlaylistId])

  const handleConfirm = useCallback(async () => {
    if (!name.trim()) {
      toast(t('list_create_input_placeholder'))
      nameInputRef.current?.focus()
      return
    }

    try {
      if (isEdit && editPlaylistId) {
        await updatePlaylistInfo({
          id: editPlaylistId,
          name: name.trim(),
          description: description.trim(),
        })
        toast(t('metadata_edit_modal_success'))
      } else {
        await createPlaylist({
          name: name.trim(),
          description: description.trim(),
        })
        toast(t('playlist_create_success'))
      }
      modalRef.current?.setVisible(false)
    } catch (error) {
      toast(t('load_failed'))
    }
  }, [name, description, isEdit, editPlaylistId, t])

  return (
    <Modal
      ref={modalRef}
      bgColor="rgba(0,0,0,0.5)"
      bgHide={false}
    >
      <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme['c-content-background'] }}>
          <View style={styles.header}>
            <Text style={styles.title} size={16}>
              {t(isEdit ? 'playlist_rename_title' : 'playlist_create_title')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label} color={theme['c-font-label']}>
                {t('songlist_open_input_placeholder').replace('歌单链接或歌单 ID', '歌单名称')}
              </Text>
              <View style={{ ...styles.inputWrapper, borderColor: theme['c-border-background'] }}>
                <Input
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('playlist_name_placeholder')}
                  clearBtn
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label} color={theme['c-font-label']}>
                {t('play_detail_setting_lrc_align').replace('歌词对齐方式', '歌单描述')}
              </Text>
              <View style={{ ...styles.inputWrapper, borderColor: theme['c-border-background'] }}>
                <Input
                  ref={descInputRef}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('playlist_description_placeholder')}
                  clearBtn
                  multiline
                  numberOfLines={3}
                  style={styles.textarea}
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              style={[styles.btn, { borderColor: theme['c-border-background'] }]}
              onPress={() => modalRef.current?.setVisible(false)}
            >
              <Text style={styles.btnText} color={theme['c-font']}>
                {t('cancel')}
              </Text>
            </Button>
            <Button
              style={[styles.btn, styles.btnPrimary, { backgroundColor: theme['c-primary'] }]}
              onPress={handleConfirm}
            >
              <Text style={styles.btnText} color={theme['c-primary-font']}>
                {t('confirm')}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(40),
  },
  content: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: scaleSizeH(16),
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '500',
  },
  form: {
    padding: scaleSizeW(16),
  },
  inputGroup: {
    marginBottom: scaleSizeH(16),
  },
  label: {
    marginBottom: scaleSizeH(8),
    fontSize: 13,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(8),
  },
  textarea: {
    height: scaleSizeH(80),
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    paddingVertical: scaleSizeH(14),
    alignItems: 'center',
    borderRightWidth: 1,
  },
  btnPrimary: {
    borderRightWidth: 0,
  },
  btnText: {
    fontSize: 14,
  },
})

export default CreatePlaylistModal
