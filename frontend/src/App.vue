<template>
  <div class="app-root">
    <CustomCursor
      :dot-size="20"
      :expanded-size="40"
      dot-color="snow"
      ring-color="rgba(0, 117, 176, 0.9)"
      :transition-duration="200"
      :smooth-follow="false"
      :smooth-factor="0.95"
      :opacity="0.5"
    />
    <router-view />
  </div>
</template>

<script setup>
import CustomCursor from '@/components/style/CustomCursor.vue'
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
