<template>
  <div class="g-map-polyline">
    <!-- 你好世界 -->
    <div ref="mapRef" class="map-container" />
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'GMapPolyline',
  props: {
    path: {
      type: Array,
      required: true,
      validator: arr => arr.every(p => Array.isArray(p) && p.length === 2)
    }
  },
  setup(props) {
    /* ---------- 内部常量 ---------- */
    const STROKE_COLOR = '#409EFF'
    const STROKE_WEIGHT = 4
    const HEIGHT = '400px'

    /* ---------- 响应式引用 ---------- */
    const mapRef = ref(null)
    let map = null
    let polyline = null

    /* ---------- 方法 ---------- */
    function init() {
      if (!window.google) return
      map = new google.maps.Map(mapRef.value, {
        zoom: 4,
        center: { lng: 24.6582687, lat: -30.0818797 },
        mapTypeId: 'roadmap',
        disableDefaultUI: false
      })
      drawPolyline(props.path)
    }

    function drawPolyline(pathArr) {
      if (polyline) polyline.setMap(null)
      const gPath = pathArr.map(([lng, lat]) => ({ lng, lat }))
      polyline = new google.maps.Polyline({
        path: gPath,
        geodesic: true,
        strokeColor: STROKE_COLOR,
        strokeWeight: STROKE_WEIGHT,
        map
      })
      if (pathArr.length) {
        const bounds = new google.maps.LatLngBounds()
        gPath.forEach(p => bounds.extend(p))
        map.fitBounds(bounds)
      }
    }

    /* ---------- 生命周期 ---------- */
    onMounted(() => {
      window.google ? init() : console.warn('[GMapPolyline] Google 脚本未加载')
    })
    onBeforeUnmount(() => polyline && polyline.setMap(null))

    /* ---------- 监听 ---------- */
    watch(() => props.path, drawPolyline, { deep: true })

    /* ---------- 暴露给模板 ---------- */
    return { mapRef, HEIGHT }
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: v-bind('HEIGHT');
}
.g-map-polyline {
  width: 100%;
}
</style>