
<!-- 线路管理 -->
<template>
    <div>
        <div class="">
            <el-form :inline="true" :model="form" class="form" label-position="top" size="mini">
                <el-form-item :label="$t('line')">
                    <el-input v-model="form.lineName" clearable></el-input>
                </el-form-item>
                <el-form-item :label="$t('departureSite')">
                    <select-with-code v-model="form.startSiteCode" :list="store.state.siteList"> </select-with-code>
                </el-form-item>
                <el-form-item :label="$t('destinationSite')">
                    <select-with-code v-model="form.endSiteCode" :list="store.state.siteList">
                    </select-with-code>
                </el-form-item>
                <el-form-item :label="$t('belongSite')">
                    <select-with-code v-model="form.siteCodeSet" :list="store.state.siteListForScan">
                    </select-with-code>
                </el-form-item>
                <el-form-item :label="$t('enableOrNot')">
                    <el-select v-model="form.status" clearable>
                        <el-option v-for="item in statusList" :label="item.name" :value="item.code"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" v-hasPermi="['lineManagement:page']" @click="onSearch">{{ $t('search')
                    }}</el-button>
                </el-form-item>
            </el-form>
            <div class="button--area mini buttons">
                <div class="left">
                    <el-button v-hasPermi="['lineManagement:add']" type="primary" @click="onAdd">{{ $t('add')
                    }}</el-button>
                </div>
                <div class="right">
                    <el-button v-hasPermi="['lineManagement:export']" :loading="exportLoading" @click="onExport"
                        type="primary">{{
                            $t('exportFile')
                        }}</el-button>
                </div>
            </div>
            <el-table :max-height="store.state.tableHeight" border v-loading="tableLoading" :data="tableData"
                class="table">
                <el-table-column prop="name" :label="$t('lineName')" width="165" align="center" />
                <el-table-column prop="attributeName" :label="$t('attribute')" width="165" align="center" />
                <el-table-column prop="blMainLineName" :label="$t('trunkOrBranchLine')" width="165" align="center" />
                <el-table-column prop="createSiteName" :label="$t('belongSite')" width="165" align="center" />
                <el-table-column prop="startSiteName" :label="$t('siteCode')" width="165" align="center" />
                <el-table-column prop="stopSiteName" :label="$t('stopoverSite')" width="165" align="center" />
                <el-table-column prop="distance" :label="$t('mileage')" width="165" align="center" />
                <el-table-column prop="typeName" :label="$t('type')" width="165" align="center" />
                <el-table-column prop="remark" :label="$t('remark')" width="165" align="center" />
                <el-table-column prop="status" :label="$t('enableOrNot')" min-width="100">
                    <template #default="scope">
                        <el-switch v-model="scope.row.status" active-value="1" inactive-value="0"
                            @change="(value) => changeStatus(scope.row, value)" />
                    </template>
                </el-table-column>
                <el-table-column :label="$t('operation')" width="100" fixed="right">
                    <template #default="scope">
                        <el-button v-hasPermi="['lineManagement:update']" :icon="Edit" @click="onEdit(scope.row)"
                            type="text" size="large"></el-button>
                        <el-button v-hasPermi="['staffDriver:password:reset']" :icon="Position"
                            @click="onPosition(scope.row)" type="text" size="small"></el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination v-model:currentPage="pageNum" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize"
                :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange"
                layout="sizes, prev, pager, next, total">
            </el-pagination>
        </div>
        <!-- 线路拓扑图 -->
        <el-dialog v-model="dialogVisible__position" :title="$t('tip')" custom-class="dialog middle">
            <div class="topology-container">
                <el-steps :space="100" finish-status="success" direction="vertical">
                    <el-step title="网点DCA" description="上游节点"></el-step>
                    <el-step title="网点A" description="中间节点"></el-step>
                    <el-step title="网点B" description="下游节点"></el-step>
                    <el-step title="DCB" description="终点"></el-step>
                </el-steps>
                <!-- 可选：添加双向箭头样式 -->
                <div class="arrow-up">↑</div>
                <div class="arrow-down">↓</div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible__position = false" size="mini">{{ $t('cancel') }}</el-button>
                    <!-- <el-button type="primary" @click="onAlterPwd" size="mini" :disabled="isDisabled">{{
                        $t('ensure')
                        }}</el-button> -->
                </span>
            </template>
        </el-dialog>
        <!-- 新增 -->
        <el-dialog :close-on-click-modal="false" v-model="dialogVisible" :title="dialogTitle" custom-class="dialog"
            :before-close="handleClose">
            <el-form ref="dialogFormRef" :inline="true" :model="dialogForm" :rules="dialogRules" class="form"
                label-position="top" size="mini">
                <el-col :span="12">
                    <!-- 第一行：线路名称 + 属性 -->
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="$t('lineName')" prop="name">
                                <el-input @input="limitEmoji" v-model="dialogForm.name" autocomplete="off"
                                    clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="$t('attribute')" prop="attribute">
                                <el-select v-model="dialogForm.attribute" filterable clearable>
                                    <el-option v-for="item in attributeList" :label="item.name"
                                        :value="item.code"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <!-- 第二行：干/支线 + 类型 -->
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="$t('trunkOrBranchLine')" prop="blMainLine">
                                <el-select v-model="dialogForm.blMainLine" filterable clearable>
                                    <el-option v-for="item in trunkOrBranchLineList" :label="item.name"
                                        :value="item.code"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="$t('type')" prop="type">
                                <el-select filterable v-model="dialogForm.type" clearable>
                                    <el-option v-for="item in levelList" :label="item.name"
                                        :value="item.code"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <!-- 第三行：公里数 + 是否启用 -->
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="$t('mileage')" prop="distance">
                                <el-input v-model="dialogForm.distance" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="$t('enableStatus')" prop="status">
                                <el-switch v-model="dialogForm.status" active-value="1" inactive-value="0" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <!-- 第四行：线路定位（全宽） -->
                    <el-form-item :label="$t('linePositioning')" prop="lineLocation">
                        <el-input v-model="dialogForm.lineLocation" :placeholder="$t('inputTip')" show-word-limit
                            type="textarea" />
                    </el-form-item>
                    <!-- 第五行：备注（全宽） -->
                    <el-form-item :label="$t('remark')" prop="remark">
                        <el-input v-model="dialogForm.remark" :placeholder="$t('inputTip')" show-word-limit
                            type="textarea" />
                    </el-form-item>
                </el-col>
                <div class="line-management">
                    <div class="left-nodes">
                        <div v-for="(item, index) in leftNodeList" :key="index" class="node-item"
                            v-if="state.leftNodeList">
                            {{ item.name }}
                        </div>
                        <div class="add-node-btn" @click="addNodeClick">
                            +
                        </div>
                        <!-- 动态添加的新节点会插入到这里 -->
                    </div>
                    <div class="vertical-line">
                        <div class="arrow-bottom"></div>
                    </div>
                </div>
            </el-form>
            <template #footer v-if="dialogForm_mode !== '3'">
                <span class="dialog-footer mini">
                    <el-button @click="handleClose">{{ $t('cancel') }}</el-button>
                    <el-button type="primary" @click="onSubmit" :loading="submitLoading">{{ $t('submit') }}</el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog title="选择节点" v-model="selectNodeDialogVisible" :close-on-click-modal="false"
            custom-class="dialog middle">
            <el-select v-model="dialogForm.siteCode" clearable filterable>
                <el-option v-for="item in store.state.siteList" :key="item.code" :label="item.name" :value="item.code"
                    @click="getEmployeeList(item)" size="small"></el-option>
            </el-select>
            <!--  <select-with-code v-model="selectedNode" :list="store.state.siteList" size="small" > </select-with-code> -->
            <template #footer>
                <span class="dialog-footer mini">
                    <el-button @click="selectNodeDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="addNode">确认添加</el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog
            style="height: 400px;"
            v-if="fenceDialogVisible"
            v-model="fenceDialogVisible"
            :title="$t('selectNode')"
            custom-class="dialog middle"
            :before-close="handleClose-map"
        >
        < 
        <GMapPolyline />
        </el-dialog>
        <!-- <efence v-if="fenceDialogVisible" v-model:fenceDialogVisible="fenceDialogVisible" :row="row"
             @changeFenceList="getPage"></efence> -->
    </div>
</template>

<script>
import { reactive, toRefs, onMounted, toRaw, ref, computed } from 'vue'
import { empty2null, compressImg, formatTm, getTimeStamp } from '@/utils/common'
import { Edit, Delete, Position, Plus } from '@element-plus/icons'
import { ElMessage } from 'element-plus'
import { getLineListApi, getLineSaveApi, getLineUpdateApi, uploadFileApi, getLineUpdateStatusApi, getLineDetailApi, viewFileApi } from '@/api/capacityManagement'
import { queryListBySite, BCQueryListByTypeCodes } from '@/api/baseInfo'
import { useAsyncExport } from '@/composables/asyncExportTms'
import efence from '@/views/baseInfo/components/eFenceDialog.vue'
import GMapPolyline from '@/components/mapView.vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { get } from 'lodash'
export default ({
    name: 'lineManagement',
    props: [],
    components: {
        Delete,
        efence
    },
    /*  lineList: [
        { name: '网点DCA' },
        { name: '网点A' },
        { name: '网点B' }
      ],
      dcaLineActive false,
      dcbLineActive: false */
    setup() {

        const dialogFormRef = ref(null)
        const store = useStore()
        const { t } = useI18n()
        const state = reactive({
            form: {
                lineName: '',
                startSiteCode: '',
                endSiteCode: '',
                siteCodeSet: [],
                status: '1',
            },
            coordinatesTODO: [],
            leftNodeList: [],
            /* 路线 */
            lineList: [],
            /* 出发网点 */
            departureSiteList: [],
            /* 目的网点 */
            destinationSiteList: [],
            /* 选择的节点 */
            selectedNode: '',
            selectedNodeName: '',
            /* 选择节点弹窗是否显示 */
            selectNodeDialogVisible: false,
            code: '',
            /* 弹窗是否显示 */
            dialogVisible: false,
            /* 属性列表 */
            attributeList: [],
            /* 干线/支线列表 */
            trunkOrBranchLineList: [],
            /* 类型列表 */
            levelList: [],
            /* 状态列表 */
            statusList: [],
            /* 导出加载 */
            exportLoading: false,
            /* 表格加载 */
            tableLoading: false,
            /* 保存加载 */
            submitLoading: false,
            /* 表格数据 */
            tableData: [],
            dialogForm_code: '' /* 修改： 员工编号 */,
            isDisabled: false,
            dialogVisible__position: false,
            fenceDialogVisible: false,
            dialogForm_mode: '1' /* 弹窗模式 新增1  修改2  详情3 */,
            /* 弹窗表单数据 */
            dialogForm: {
                name: '',
                attribute: '',
                blMainLine: '',
                type: '',
                distance: '',
                status: '1',
                lineLocation: '',
                lineSiteDtoList: [],
                remark: '',
            },
            dialogRules: {
                name: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                attribute: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                blMainLine: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                type: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                distance: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                status: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],
                lineLocation: [
                    {
                        required: true,
                        message: t('required'),
                        trigger: 'blur',
                    },
                ],

            },
            uploadImgUrl: '',
            isShowUploadTxt: true,
            imgList: [],
            srcList: [],
            pageSize: 10,
            pageNum: 1,
            total: 0,
        })
        const dialogTitle = computed(() => {
            if (state.dialogForm_mode == '1') return t('add')
            if (state.dialogForm_mode == '2') return t('alter')
            if (state.dialogForm_mode == '3') return t('detail')
        })
        onActivated(() => {
            store.commit('calcHeight', -75)
        })
        onMounted(() => {
            getPage()
            getMulDicts()
        })
        /* 获取字典    */
        const getMulDicts = () => {
            let data = {
                basicTypeCodes: ['10005', '10002', '10003', '10004'],
                status: '1',
            }
            BCQueryListByTypeCodes(data)
                .then((res) => {
                    state.statusList = res['10005'],
                        state.attributeList = res['10002'],
                        state.trunkOrBranchLineList = res['10003'],
                        state.levelList = res['10004']
                })
                .catch(() => { })
        }
        /* 图片处理 */
        const getImageUrl = (imageName) => {
            if (!imageName || imageName === 'null') {
                return []
            }
            if (imageName.includes('\n')) {
                const urls = imageName.split('\n').filter(url => url.trim() !== '')
                return urls
            }
            // 如果是单个URL，则返回一个包含单个URL的数组
            return [imageName]
        }
        const getPreviewList = (imageString) => {
            if (!imageString || imageString === 'null') return []
            return imageString
                .split(';')
                .filter(name => name.trim())
                .map(name => getImageUrl(name))
        }
        /* 导出 */
        const exportLoading = ref(false)
        const onExport = async () => {
            let data = getQueryFormObj()
            exportLoading.value = true
            await useAsyncExport(data, '2')
            state.exportLoading = false
        }
        /* 新增 */
        const onAdd = () => {
            state.dialogVisible = true
            state.dialogForm_mode = '1'
            state.leftNodeList = []
        }
        /* 关闭弹框 */
        const handleClose = () => {
            state.dialogVisible = false
            dialogFormRef.value.resetFields()
            state.imgList = []
            state.srcList = []
        }
        /* 获得查询表单对象 */
        const getQueryFormObj = () => {
            let data = { ...toRaw(state.form) }
            data.pageNum = state.pageNum
            data.pageSize = state.pageSize
            data.siteCodeSet = state.form.siteCodeSet ? [state.form.siteCodeSet] : []
            return empty2null(data)
        }
        /* 获取page */
        const getPage = () => {
            state.tableLoading = true
            let data = getQueryFormObj()
            getLineListApi(data)
                .then((res) => {
                    state.tableData = res.list
                    state.total = res.total
                })
                .catch(() => { })
                .finally(() => {
                    state.tableLoading = false
                })
        }
        const isListUpdating = ref(false)
        const changeStatus = (row, value) => {
            if (isListUpdating.value) return
            const oldStatus = value === '1' ? '0' : '1'
            let params = {
                code: row.code,
                status: value,
            }
            getLineUpdateStatusApi(params)
                .then(() => {
                    $notify(t('changeSucc'))
                })
                .catch(() => {
                    row.status = oldStatus
                })
        }
        const initForm = () => {
            Object.keys(state.dialogForm).forEach((i) => {
                state.dialogForm[i] = ''
            })
            state.dialogForm.status = '1'
            state.dialogForm.roleIds = []
            state.leftNodeList = []

        }
        /* 回填表单 */
        const fillBack = async (row) => {
            Object.keys(state.dialogForm).forEach((i) => {
                state.dialogForm[i] = row[i]
            })
            // 获取详细数据
            const res = await getLineDetailApi(row.code)

            console.log(state.leftNodeList, '测试')
        }
        /* 修改 */
        const onEdit = async (row) => {
            state.code = row.code
            state.dialogVisible = true
            state.dialogForm_mode = '2'
            initForm()
            await nextTick()
            await nextTick()
            setTimeout(() => {
                fillBack(row)
            }, 2)
        }
        /* 查询 */
        const onSearch = () => {
            state.pageNum = 1
            getPage()
        }
        /* 页大小 */
        const handleSizeChange = (val) => {
            state.pageNum = 1
            state.pageSize = val
            getPage()
        }
        /* 切换页 */
        const handleCurrentChange = (val) => {
            state.pageNum = val
            getPage()
        }

        /* 查看路线 */
        const onPosition = (row) => {
           state.fenceDialogVisible = true
        }
        /* 提交新增、修改 */
        const onSubmit = () => {
            let data = { ...toRaw(state.dialogForm) }
            dialogFormRef.value.validate((valid) => {
                if (valid) {
                    state.submitLoading = true
                    let methods = { getLineSaveApi, getLineUpdateApi }
                    let method = ''
                    let message = ''

                    if (state.dialogForm_mode == '1') {
                        method = 'getLineSaveApi'
                        message = t('increaseSucc')

                    } else {
                        method = 'getLineUpdateApi'
                        message = t('alter') + t('success')
                        data.code = state.code
                    }
                    methods[method](data)
                        .then((res) => {
                            handleClose()
                            ElMessage({
                                message,
                                type: 'success',
                            })
                            getPage()
                        })
                        .catch(() => { })
                        .finally(() => {
                            state.submitLoading = false
                        })
                } else {
                    return false
                }
            })
        }
        const addNodeClick = () => {
            state.selectNodeDialogVisible = true
        }
        /* 添加节点 */

        const addNode = async () => {
            state.selectNodeDialogVisible = false
        };
        const getEmployeeList = (item) => {
            if (item && typeof item.longitude !== 'undefined' && typeof item.latitude !== 'undefined') {
                const coordinate = `${item.longitude},${item.latitude}`;
                if (state.dialogForm.lineLocation) {
                    state.dialogForm.lineLocation += ';' + coordinate;
                } else {
                    state.dialogForm.lineLocation = coordinate;
                }
                state.leftNodeList.push({
                    name: item.name,
                    code: item.code
                });
                console.log(state.leftNodeList, '查看节点选择成功');

            }
        }
        /* 限制表情 */
        const emojiRegex =
            /(?:[\u2700-\u27BF]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
        const limitEmoji = (val) => {
            let str = val.replace(emojiRegex, '')
            state.dialogForm.name = str
        }
        const refState = toRefs(state)
        return {
            ...refState,
            onAdd,
            onExport,
            onSearch,
            onEdit,
            changeStatus,
            Edit,
            store,
            state,
            handleCurrentChange,
            handleSizeChange,
            Position,
            handleClose,
            dialogFormRef,
            limitEmoji,
            dialogTitle,
            onSubmit,
            onPosition,
            getPreviewList,
            getImageUrl,
            addNode,
            addNodeClick,
            getEmployeeList,
        }

    },
})
</script>
<style scoped>
.line-management {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding-left: 100px;
}

.vertical-line {
    position: relative;
    width: 2px;
    height: 260px;
    background-color: #FFA500;
    margin: 0 auto;
}

.arrow-top {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid #FFA500;
}

.arrow-bottom {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #FFA500;
}

.left-nodes {
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* 节点之间的间距 */
    text-align: center;

}

.node-item {
    padding: 8px 12px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: background-color 0.2s;
}

.node-item:hover {
    background-color: #e0e0e0;
}

.add-node-btn {
    width: 40px;
    height: 40px;
    font-size: 40px;
    cursor: pointer;
    color: #999;
    text-align: center;
    background-color: #f4f0f0;
    margin-left: auto
}

.add-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.right-panel {
    flex: 1;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
}

.line-list {
    margin-top: 10px;
}

.line-item {
    padding: 8px;
    margin: 4px 0;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.dialog :deep(.el-dialog__body) {
    display: flex;
    gap: 20px;
}

.form :deep(.el-form) {
    flex: 1;
}

.diagram-container {
    flex: 1;
    min-width: 300px;
    padding: 20px;
    border-left: 1px solid #eee;
}

/* .form.el-form--inline .el-date-editor .el-input__inner {
    padding-left: 30px !important;
}
 */
.allLine.el-form-item :deep() .el-textarea__inner {
    width: calc(100% - 300px);
}

.allLine.el-form-item :deep() .el-textarea .el-input__count {
    right: 35px;
}
</style>