<template>
  <el-dialog v-model="dialogVisible" title="数据库连接" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="主机" prop="host">
        <el-input v-model="form.host" placeholder="localhost" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="root" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
      <el-form-item label="数据库" prop="database">
        <el-input v-model="form.database" placeholder="可选，连接后可切换" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConnect" :loading="connecting">
          {{ connecting ? '连接中...' : '连接' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DatabaseService } from '../services/database'
import type { ConnectionConfig } from '../types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  connected: [config: ConnectionConfig]
}>()

const dialogVisible = ref(props.modelValue)
const connecting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<ConnectionConfig>({
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '123456',
  database: ''
})

const rules: FormRules = {
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{
    required: true, message: '请输入密码', trigger: 'blur'
  }]
}

const handleConnect = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    connecting.value = true

    const config = { ...form }
    if (!config.database) {
      delete config.database
    }

    await DatabaseService.connect(config)

    ElMessage.success('连接成功')
    emit('connected', config)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('连接失败:', error)
    ElMessage.error(error || '连接失败')
  } finally {
    connecting.value = false
  }
}

// 监听 props 变化
import { watch } from 'vue'
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})
</script>

<style scoped>
/* Element Plus 对话框暗色模式样�?*/
:global(body.dark .el-dialog) {
  background-color: #2a2a2a;
  border: 1px solid #404040;
}

:global(body.dark .el-dialog__header) {
  background-color: #2a2a2a;
  color: #e4e7ed;
  border-bottom: 1px solid #404040;
}

:global(body.dark .el-dialog__title) {
  color: #e4e7ed;
}

:global(body.dark .el-dialog__body) {
  background-color: #2a2a2a;
  color: #e4e7ed;
}

:global(body.dark .el-form-item__label) {
  color: #e4e7ed;
}

:global(body.dark .el-input__wrapper) {
  background-color: #1a1a1a;
  border-color: #404040;
}

:global(body.dark .el-input__inner) {
  background-color: #1a1a1a;
  color: #e4e7ed;
}

:global(body.dark .el-input-number .el-input__wrapper) {
  background-color: #1a1a1a;
  border-color: #404040;
}

:global(body.dark .el-overlay-dialog) {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
