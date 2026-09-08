<template>
  <i class="app-icon" aria-hidden="true">
    <FontAwesomeIcon :icon="icon" :spin="spin" />
  </i>
</template>

<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faAngleDown,
  faArrowRight,
  faBars,
  faChevronLeft,
  faChevronRight,
  faCircleInfo,
  faCloudArrowUp,
  faEye,
  faEyeSlash,
  faFile,
  faFileExcel,
  faFileLines,
  faFilePdf,
  faFilePowerpoint,
  faFileWord,
  faMagnifyingGlass,
  faRightFromBracket,
  faSliders,
  faSpinner,
  faTriangleExclamation,
  faUser,
  faUserPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { faBilibili, faGithub, faMarkdown } from '@fortawesome/free-brands-svg-icons'

const props = defineProps({
  name: { type: String, required: true },
  spin: Boolean,
})

const icons = {
  'angle-down': faAngleDown,
  'arrow-right': faArrowRight,
  bars: faBars,
  bilibili: faBilibili,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'cloud-upload-alt': faCloudArrowUp,
  'exclamation-triangle': faTriangleExclamation,
  eye: faEye,
  'eye-slash': faEyeSlash,
  file: faFile,
  'file-alt': faFileLines,
  'file-excel': faFileExcel,
  'file-lines': faFileLines,
  'file-pdf': faFilePdf,
  'file-powerpoint': faFilePowerpoint,
  'file-word': faFileWord,
  github: faGithub,
  'info-circle': faCircleInfo,
  markdown: faMarkdown,
  'magnifying-glass': faMagnifyingGlass,
  'right-from-bracket': faRightFromBracket,
  'sign-in-alt': faRightFromBracket,
  sliders: faSliders,
  spinner: faSpinner,
  times: faXmark,
  user: faUser,
  'user-plus': faUserPlus,
  xmark: faXmark,
}

const icon = computed(() => icons[props.name] || faFile)
</script>
