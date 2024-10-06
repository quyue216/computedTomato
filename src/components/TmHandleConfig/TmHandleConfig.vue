<template>
    <el-dialog :model-value="visibleDialog" destroy-on-close  title="配置番茄钟" width="60%"  :before-close="handleClose" @open="openPreHandle">
        <el-form :rules="rules" :model="configForm.from" :inline="true" label-width="120px" ref="ruleFormRef"
            class="demo-form-inline">
            <el-form-item label="番茄时间" prop="tomatoTimeSize">
                <el-input-number v-model="configForm.from.tomatoTimeSize" :controls="false" />
            </el-form-item>

            <el-form-item label="休息时间" prop="restTimeSize">
                <el-input-number v-model="configForm.from.restTimeSize" :controls="false" />
            </el-form-item>

            <el-form-item label="大休息时间" prop="bigRestTimeSize">
                <el-input-number v-model="configForm.from.bigRestTimeSize" :controls="false" />
            </el-form-item>

            <el-form-item label="大休息间隔" prop="happenBigSegment">
                <el-input-number v-model="configForm.from.happenBigSegment" :controls="false" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visibleDialog = false">取消</el-button>
                <el-button type="primary" @click="submitForm(ruleFormRef)">
                    确认
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import {
    ref, defineProps, reactive, onMounted, 
    toRefs,
    watchEffect
} from "vue";
import type { TomatoConfig } from "../../global/global.d.ts";
import type { FormInstance} from 'element-plus'

import {
    ElInputNumber,
    ElFormItem,
    ElForm,
    ElInput,
    ElButton,
    ElDialog,
    ElMessage,
} from "element-plus";


const props = defineProps<{
    updateConfigData:(times:TomatoConfig)=> void,
    configData:TomatoConfig
}>();

const ruleFormRef = ref<FormInstance>();

const visibleDialog = defineModel<boolean>()

const  configForm = reactive({
    from: {} as TomatoConfig
})

const openPreHandle = () => {
    ruleFormRef.value!.resetFields();
};

const handleClose = (done:Function) => {
    visibleDialog.value = false
    //本地一定有缓存数据
    done();
};

watchEffect(()=>{
    configForm.from = {...props.configData}     
})

// 表单验证
const validateTomatoTimeSize = (rule:any, value:any, callback:any) => {
    if (value === null) {
        callback(new Error("番茄时间不能为空"));
    } else if (value < 20) {
        callback(new Error("番茄时间不能小于20分钟"));
    } else if (value > 60) {
        callback(new Error("番茄时间不能大于60分钟"));
    } else {
        callback();
    }
};

const validateRestTimeSize = (rule:any, value:any, callback:any) => {
    if (value === null) {
        callback(new Error("休息时间不能为空"));
    } else if (value > 20) {
        callback(new Error("休息时间不能大于20分钟"));
    } else {
        callback();
    }
};

const validateBigRestTimeSize = (rule:any, value:any, callback:any) => {
    if (value === null) {
        callback(new Error("大休息时间不能为空"));
    } else if (value > 30) {
        callback(new Error("大休息时间不能大于30分钟"));
    } else {
        callback();
    }
};

const rules = reactive({
    tomatoTimeSize: [{ validator: validateTomatoTimeSize, trigger: "blur" }],
    restTimeSize: [{ validator: validateRestTimeSize, trigger: "blur" }],
    bigRestTimeSize: [{ validator: validateBigRestTimeSize, trigger: "blur" }],
    happenBigSegment: [
        { required: true, message: "大休息间隔不能为空", trigger: "blur" },
    ],
});
// 初始化发送配置数据  
const submitForm = async (formEl?:FormInstance ) => {
    if (!formEl) return;
    await formEl.validate((valid, fields) => {
        if (valid) {

           props.updateConfigData(configForm.from);
            
           visibleDialog.value = false;
        } else {
            ElMessage({
                message: "请输入合法数据,不要瞎搞",
                type: "error",
                duration: 1500,
            });
        }
    });
};
</script>

<style scoped>
.dialog-footer button:first-child {
    margin-right: 10px;
}
</style>