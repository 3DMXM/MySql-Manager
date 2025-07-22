<template>
  <div class="sql-editor">
    <div class="editor-header">
      <div class="toolbar">
        <el-button type="primary" @click="executeQuery" :loading="executing">
          <el-icon>
            <CaretRight />
          </el-icon>
          执行
        </el-button>
        <el-button @click="clearEditor">
          <el-icon>
            <Delete />
          </el-icon>
          清空
        </el-button>
        <el-select v-model="selectedDatabase" placeholder="选择数据库" style="width: 200px; margin-left: 10px" clearable>
          <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
        </el-select>
      </div>
    </div>

    <div class="editor-container">
      <codemirror v-model="sqlQuery" placeholder="请输入 SQL 查询..." :style="{ height: '200px' }" :autofocus="true"
        :indent-with-tab="true" :tab-size="2" :extensions="extensions" />
    </div>

    <div class="results-container" v-if="queryResult">
      <div class="results-header">
        <span class="results-title">执行结果</span>
        <span class="execution-info">
          <template v-if="queryResult.affectedRows !== undefined">
            影响行数: {{ queryResult.affectedRows }}
          </template>
          <template v-else>
            返回行数: {{ (queryResult.rows || queryResult.data || []).length }}
          </template>
        </span>
      </div>

      <div class="results-content" v-if="(queryResult.fields || []).length > 0 || (queryResult.data || []).length > 0">
        <el-table :data="queryResult.rows || queryResult.data || []" border stripe size="small" max-height="300">
          <el-table-column v-for="column in queryResult.fields || Object.keys((queryResult.data || [])[0] || {})"
            :key="column" :prop="column" :label="column" show-overflow-tooltip>
            <template #default="{ row, $index }">
              {{ formatCellValue(row[$index] || row[column]) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="success-message">
        <el-icon>
          <SuccessFilled />
        </el-icon>
        执行成功
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CaretRight, Delete, SuccessFilled } from '@element-plus/icons-vue'
import { Codemirror } from 'vue-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { DatabaseService } from '../services/database'
import { useTheme } from '../composables/useTheme'
import type { QueryResult } from '../types'

const sqlQuery = ref('')
const executing = ref(false)
const queryResult = ref<QueryResult | null>(null)
const databases = ref<string[]>([])
const selectedDatabase = ref<string>('')

// 主题功能
const { isDark } = useTheme()

// 根据主题切换 CodeMirror 扩展
const extensions = computed(() => {
  if (isDark.value) {
    return [sql(), oneDark]
  } else {
    return [sql()]
  }
})

const formatCellValue = (row: Array<string | null>) => (index: number) => {
  const value = row[index]
  return value === null ? 'NULL' : value
}

const executeQuery = async () => {
  if (!sqlQuery.value.trim()) {
    ElMessage.warning('请输入SQL 查询')
    return
  }

  executing.value = true
  try {
    const result = await DatabaseService.executeQuery(sqlQuery.value)
    queryResult.value = result
    ElMessage.success('查询执行成功')
  } catch (error: any) {
    console.error('查询执行失败:', error)
    ElMessage.error(error || '查询执行失败')
    queryResult.value = null
  } finally {
    executing.value = false
  }
}

const clearEditor = () => {
  sqlQuery.value = ''
  queryResult.value = null
}

const loadDatabases = async () => {
  try {
    databases.value = await DatabaseService.getDatabases()
  } catch (error: any) {
    console.error('加载数据库列表失�?', error)
  }
}

const insertQuery = (query: string) => {
  sqlQuery.value = query
}

const props = defineProps<{
  initialQuery?: string
}>()

onMounted(() => {
  loadDatabases()
  if (props.initialQuery) {
    sqlQuery.value = props.initialQuery
  }
})

defineExpose({
  insertQuery,
  executeQuery
})
</script>

<style scoped>
.sql-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fff;
}

:global(html.dark) .editor-header {
  background-color: #1a1a1a;
  border-bottom-color: #333;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-container {
  padding: 16px;
}

.results-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f8f9fa;
}

:global(html.dark) .results-header {
  background-color: #2a2a2a;
  border-bottom-color: #333;
}

.results-title {
  font-weight: 500;
  color: #303133;
}

:global(html.dark) .results-title {
  color: #e4e7ed;
}

.execution-info {
  font-size: 14px;
  color: #909399;
}

.results-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #67c23a;
  font-size: 16px;
}

:global(html.dark) .success-message {
  color: #95d475;
}
</style>
