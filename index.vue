<template>
  <div class="dialog">
    <el-dialog
      v-model="dialogVisible"
      :title="$t('efence')"
      :visible="dialogVisible"
      :close-on-click-modal="false"
      width="95%"
      :before-close="dialogClose"
      :append-to-body="true"
      top="1vh"
      class="customer-dialog"
      center
    >
      <div style="display: none">
        <div id="map-search"><input id="pac-input" class="controls" type="text" :placeholder="$t('inputPlace')" /></div>
      </div>
      <div style="display: none">
        <div id="legend">
          <!-- province -->
          <div class="color-box">
            <span :style="{backgroundColor: legendColor.province.color}"></span>
            <span>{{ $t('province') }}</span>
          </div>
          <!-- city -->
          <div class="color-box">
            <span :style="{backgroundColor: legendColor.city.color}"></span>
            <span>{{ $t('city') }}</span>
          </div>
          <!-- area -->
          <div class="color-box">
            <span :style="{backgroundColor: legendColor.area.color}"></span>
            <span>{{ $t('area') }}</span>
          </div>
        </div>
      </div>
      <div id="map" class="map"></div>
      <span slot="footer" class="dialog-footer">
        <template v-if="blShowEditSave">
          <el-button class="unify-btn" size="small" @click="remove">{{ $t('removeFence') }}</el-button>
          <el-button type="primary" size="small" class="unify-btn" @click="onSave">{{ $t('save') }}</el-button>
        </template>
        <el-button v-else type="primary" size="small" class="unify-btn" @click="dialogVisible = false">{{
          $t('close')
        }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {reactive, toRefs, onMounted, computed, ref, toRaw} from 'vue'
import {ElMessage} from 'element-plus'
import {useI18n} from 'vue-i18n'
import {useStore} from 'vuex'
import {updateSitePositionById, sitePositionById} from '@/api/baseInfo'
import curSvg from '@/assets/svg/cur-site.svg'
import API from '@/api/electricFence'
import {loadGoogle} from '@/utils/common'

export default {
  name: '',
  props: ['row', 'fenceDialogVisible', 'type'],
  // props.type [province,city,area]
  setup(props, ctx) {
    const {t} = useI18n()
    const store = useStore()
    const state = reactive({
      previewApi: '/basic/manager/file/view/',
      dialogVisible: false,
      allPolygons: [],
      cityArea: ['city', 'area'],
      drawingShapes: [],
      map: null,
      fenceList: [],
      mapCenter: null,
      infoWindow: null,
    })
    let selectedShape
    let selectedOtherSitePolygon
    let searchMarker = []
    onMounted(() => {
      fetchCenter()
    })

    state.dialogVisible = computed({
      get: () => props.fenceDialogVisible,
      set: (val) => {
        ctx.emit('update:fenceDialogVisible', val)
      },
    })

    // 是否可编辑保存 省 + 区【约翰内斯堡】
    const isNotZA = computed(() => store.state.userInfo?.countryCode !== 'ZA')
    const blShowEditSave = computed(() => {
      return isNotZA.value || !state.cityArea.includes(props.type) || props.row.cityCode == 'ZAC01683'
    })

    /* 加载样式  MUNICNAME  DISTRICT_N */
    const loadStyle = () => {
      state.map.data.setStyle(function (feature) {
        let featureName = feature.getProperty('MUNICNAME')
          ? feature.getProperty('MUNICNAME')
          : feature.getProperty('DISTRICT_N')
        let isCurrent = props.row.enName.includes(featureName)
        let fillColor = feature.getProperty('MUNICNAME') ? legendColor.area.color : legendColor.city.color
        if (props.type == 'city' || feature.getProperty('OBJECTID') === 222) fillColor = legendColor.city.color
        return {
          fillColor,
          fillOpacity: isCurrent ? 0.8 : 0.4,
          strokeWeight: 1,
          strokeColor: isCurrent ? legendColor[props.type].color : '#eee',
          zIndex: feature.getProperty('MUNICNAME') ? 100 : 10,
        }
      })
      state.map.data.addListener('click', function (event) {
        console.log(event)
        let feature = event.feature
        let featureName = feature.getProperty('MUNICNAME')
          ? feature.getProperty('MUNICNAME')
          : feature.getProperty('DISTRICT_N')
        let contentString = `
        ${t('typeName')}：${featureName}`
        // 南非的通过名称，去获取简称
        if (!isNotZA.value) {
          let aliasCode = getAliasCode(featureName)
          contentString += `<br/>${t('abbreviation')}: ${aliasCode}`
        }
        state.infoWindow.setContent(contentString)
        state.infoWindow.setPosition(event.latLng)
        state.infoWindow.open(state.map)
      })
    }
    // 南非获取简称
    const getAliasCode = (featureName) => {
      if (state.fenceList?.length > 0 && featureName) {
        return state.fenceList.filter((item) => item.url.includes(featureName))[0]?.aliasCode || ''
      }
      return ''
    }
    /* 1.初始化地图 */
    const initMap = () => {
      state.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6, //省缩放：6
        center: state.mapCenter,
      })
      // 添加网点图例
      const legend = document.getElementById('legend')
      state.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legend)

      //添加点击信息提示框
      let element = document.createElement('span')
      element.innerHTML = `${t('baseInfo')}`
      element.className = 'infoHeader'
      state.infoWindow = new google.maps.InfoWindow({headerContent: element})
    }
    /* 2.添加工具 */
    const addTools = () => {
      state.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: blShowEditSave.value,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          clickable: true,
          editable: true,
          fillColor: legendColor[props.type].color,
          fillOpacity: 0.8,
          strokeWeight: 1,
          strokeColor: legendColor[props.type].color,
          draggable: false,
        },
      })
      state.drawingManager.setMap(state.map)
    }
    const legendColor = {
      province: {color: 'rgb(255,0 , 0)'},
      city: {color: 'rgb(0, 255, 0)'},
      area: {color: '#ff8300'},
    }

    /* 3.回填数据 */
    const fill = (path, info, {isParent = false} = {}) => {
      let {id, rowId} = info
      const isCurrent = !!(id == rowId)
      let color = legendColor[props.type].color
      if (isParent) {
        if (props.type == 'city') color = legendColor.province.color
        if (props.type == 'area') color = legendColor.city.color
      }
      const polygons = new google.maps.Polygon({
        paths: path,
        fillColor: color,
        fillOpacity: isCurrent ? 0.8 : isParent ? 0.3 : 0.4,
        strokeWeight: isCurrent ? 2 : 1,
        strokeColor: color,
        draggable: false,
        editable: isCurrent ? false : false,
        zIndex: isParent ? 1 : 101,
      })
      if (isCurrent) {
        currBindingEvent(polygons)
      }
      polygons.setMap(state.map)
      polygons.addListener('click', function (e) {
        if (selectedOtherSitePolygon) {
          selectedOtherSitePolygon.setOptions({
            strokeWeight: 1,
            fillOpacity: 0.3,
          })
        }
        selectedOtherSitePolygon = polygons
        polygons.setOptions({
          strokeWeight: 1,
          fillOpacity: 0.3,
        })
        console.log(info)
        popInfoWindow(e, info, {isParent})
      })
    }
    /* 4.画图完成 */
    const draw = () => {
      google.maps.event.addListener(state.drawingManager, 'overlaycomplete', function (e) {
        state.allPolygons.push(e.overlay)
        if (e.type != google.maps.drawing.OverlayType.MARKER) {
          let newShape = e.overlay
          newShape.type = e.type
          updateShape()
          google.maps.event.addListener(newShape.getPath(), 'insert_at', function (path) {
            updateShape()
          })
          google.maps.event.addListener(newShape.getPath(), 'set_at', () => {
            updateShape()
          })
          google.maps.event.addListener(newShape, 'click', function () {
            setSelection(newShape)
          })
          setSelection(newShape)
          // 将地图退出绘制模式
          state.drawingManager.setOptions({drawingMode: null})
        }
      })
    }
    /* 5.删除选中 */
    const remove = () => {
      const polygonIdx = state.allPolygons.findIndex((item) => {
        return toRaw(item) == selectedShape
      })
      if (polygonIdx !== -1) {
        state.allPolygons.splice(polygonIdx, 1)
        state.drawingShapes.splice(polygonIdx, 1)
      }
      if (selectedShape) {
        selectedShape.setMap(null)
        selectedShape = null
      }
    }
    /* 6.设置选中 */
    const setSelection = (shape) => {
      clearSelection()
      selectedShape = shape
      if (blShowEditSave.value) shape.setEditable(true)
    }
    /* 7.清除选中 */
    const clearSelection = () => {
      if (selectedShape) {
        selectedShape.setEditable(false)
        selectedShape = null
      }
    }
    // 更新所有的shape保存的经纬度坐标
    const updateShape = () => {
      state.drawingShapes = []
      state.allPolygons.forEach((item) => {
        for (let i = 0; i < item.latLngs.length; i++) {
          let path = []
          for (let j = 0; j < item.latLngs.getAt(i).getLength(); j++) {
            let point = item.latLngs.getAt(i).getAt(j)
            path.push([point.lng(), point.lat()])
          }
          path.push([item.latLngs.getAt(0).getAt(0).lng(), item.latLngs.getAt(0).getAt(0).lat()])
          state.drawingShapes.push(path)
        }
      })
    }

    // 保存网点电子围栏
    const onSave = () => {
      if (state.drawingShapes.length == 0) {
        return ElMessage({
          type: 'warning',
          message: t('drawFence'),
        })
      }
      let data = {
        electricFence: {
          coordinates: state.drawingShapes,
          type: 'Polygon',
        },
        id: props.row.id,
      }
      API[props.type + 'UpdateApi'](data)
        .then((res) => {
          ElMessage({
            type: 'success',
            message: t('updateSuccess'),
          })
          state.dialogVisible = false
        })
        .catch((err) => {})
    }
    // 1.画围栏
    const drawItem = (item, {isParent = false} = {}) => {
      if (!item.electricFence) return
      let path = item.electricFence?.coordinates
      let polygonPaths = []
      let obj = {
        name: item.name,
        id: item.id,
        rowId: props.row.id,
        aliasCode: item.aliasCode,
      }
      path.forEach((pathItem) => {
        let result = pathItem.map((cItem) => {
          return {lng: parseFloat(cItem[0]), lat: parseFloat(cItem[1])}
        })
        polygonPaths.push(result)
      })
      if (isParent) {
        fill(polygonPaths, obj, {isParent: true})
      } else {
        fill(polygonPaths, obj)
      }
    }
    //2.加载geojson围栏
    const loadItemList = (list) => {
      list.forEach((item) => {
        if (item.url) {
          state.map.data.loadGeoJson(state.previewApi + item.url)
        }
      })
      loadStyle()
    }
    // 加载区县的父级
    const loadParent = (res) => {
      if (res.url) state.map.data.loadGeoJson(state.previewApi + res.url)
    }
    // 加载区县
    const loadAreaList = (list) => {
      list.forEach((item) => {
        if (item.url) {
          state.map.data.loadGeoJson(state.previewApi + item.url)
        }
      })
    }
    // 获取父子电子围栏
    const getAllFenceList = () => {
      API[props.type + 'ElectricFencesApi']({id: props.row.id, code: props.row.code}).then((res) => {
        if (props.type == 'province') {
          state.fenceList = res.childElectricFenceVoList
          state.fenceList.forEach((pItem) => {
            drawItem(pItem)
          })
        } else if (props.type == 'city') {
          state.fenceList = res.childElectricFenceVoList
          drawItem(res, {isParent: true})
          if (!blShowEditSave.value) {
            loadItemList(res.childElectricFenceVoList)
            loadStyle()
          } else {
            state.fenceList.forEach((pItem) => {
              drawItem(pItem)
            })
          }
        } else if (props.type == 'area') {
          if (isNotZA.value) {
            drawItem(res, {isParent: true})
          } else {
            loadParent(res)
          }
          state.fenceList = res.childElectricFenceVoList
          state.fenceList.forEach((pItem) => {
            drawItem(pItem)
          })
          loadStyle()
        }
      })
    }

    // 添加网点旗帜
    const addFlag = (position, orginImg, isCenter) => {
      const image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
      const marker = new google.maps.Marker({
        position: position,
        map: state.map,
        icon: orginImg ? orginImg : image,
        draggable: isCenter ? true : false,
      })
      marker.addListener('click', function (e) {
        if (position.siteInfo) {
          popInfoWindow(e, position.siteInfo)
        }
      })
      if (isCenter) {
        marker.addListener('dragend', function (e) {
          state.mapCenter = {lat: e.latLng.lat(), lng: e.latLng.lng()}
          state.map.setCenter(state.mapCenter)
        })
      }
      return marker
    }

    // 定位当前区域位置
    const fetchCenter = () => {
      var mapCenterPoint = {
        ZA: {lat: -30.0818797, lng: 24.6582687}, //南非中心
        EG: {lat: 27.545656, lng: 28.513678}, //埃及中心
      }
      let mapCenter = mapCenterPoint[store.state.userInfo?.countryCode]
        ? mapCenterPoint[store.state.userInfo?.countryCode]
        : mapCenterPoint.ZA
      state.mapCenter = mapCenter
      loadGoogle().then(() => {
        initMap()
        addTools()
        draw()
        initAutoComplete()
        getAllFenceList()
      })
    }

    // 点击围栏或旗帜弹框
    const popInfoWindow = (event, info, {isParent = false} = {}) => {
      let label = t(props.type)
      if (isParent) {
        console.log(isParent)
        if (props.type == 'city') label = t('province')
        if (props.type == 'area') label = t('city')
      }
      let contentString = `
      ${label}：${info.name}`
      if (!isNotZA.value) {
        contentString += `<br/>${t('abbreviation')}: ${info.aliasCode}`
      }
      state.infoWindow.setContent(contentString)
      state.infoWindow.setPosition(event.latLng)
      state.infoWindow.open(state.map)
    }
    // 当前区域绑定更新事件
    const currBindingEvent = (polygons) => {
      state.allPolygons.push(polygons)
      google.maps.event.addListener(polygons, 'click', function () {
        setSelection(polygons)
      })
      google.maps.event.addListener(polygons.getPath(), 'insert_at', function (path) {
        updateShape()
      })
      google.maps.event.addListener(polygons.getPath(), 'set_at', () => {
        updateShape()
      })
      updateShape()
    }
    // 地图上联想输入框
    const initAutoComplete = () => {
      const input = document.getElementById('pac-input')
      const mapSearch = document.getElementById('map-search')
      const searchBox = new google.maps.places.SearchBox(input)
      state.map.controls[google.maps.ControlPosition.TOP_LEFT].push(mapSearch)
      state.map.addListener('bounds_changed', () => {
        searchBox.setBounds(state.map.getBounds())
      })
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces()
        if (searchMarker) {
          searchMarker.forEach((item) => {
            item.setMap(null)
          })
        }
        if (places.length == 0) {
          return
        }
        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds()
        places.forEach((place) => {
          if (!place.geometry || !place.geometry.location) {
            console.log('Returned place contains no geometry')
            return
          }
          const icon = {
            url: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
          }
          searchMarker.push(addFlag(place.geometry.location, icon))
          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport)
          } else {
            bounds.extend(place.geometry.location)
          }
        })
        state.map.fitBounds(bounds)
      })
    }
    const dialogClose = () => {
      state.dialogVisible = false
    }

    const refState = toRefs(state)
    return {
      ...refState,
      dialogClose,
      remove,
      onSave,
      legendColor,
      props,
      blShowEditSave,
    }
  },
}
</script>
<style>
.pac-container {
  z-index: 5000;
}
</style>
<style scoped>
.map {
  height: 750px;
}
#map-search {
  display: flex;
  align-items: center;
  margin-left: 17px;
  margin-top: 10px;
}
#legend {
  background-color: #fff;
  padding: 5px;
  margin: 5px;
}
#legend .color-box {
  display: flex;
  align-items: center;
  margin: 3px;
}
#legend .color-box span:first-child {
  display: inline-block;
  width: 25px;
  height: 25px;
  margin-right: 5px;
  opacity: 0.3;
}
.controls {
  background-color: #fff;
  border-radius: 2px;
  border: 1px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  font-family: Roboto;
  font-size: 15px;
  font-weight: 300;
  height: 39px;
  outline: none;
  padding: 0 11px 0 13px;
  text-overflow: ellipsis;
  width: 400px;
}
.controls:focus {
  border-color: #4d90fe;
}
.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}
</style>
