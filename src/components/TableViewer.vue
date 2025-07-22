<template>
  <div class="table-viewer">
    <div class="viewer-header">
      <div class="table-info">
        <h3>{{ database }} - {{ table }}</h3>
        <el-button-group>
          <el-button size="small" @click="loadData">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
          <el-button size="small" @click="showStructure">
            <el-icon>
              <Menu />
            </el-icon>
            结构
          </el-button>
          <el-button size="small" @click="generateSelect">
            <el-icon>
              <Document />
            </el-icon>
            生成 SELECT
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="viewer-content" v-loading="loading">
      <!-- 表结构视�?-->
      <div v-if="showingStructure" class="structure-view">
        <el-table :data="columns" border size="small">
          <el-table-column prop="name" label="字段" />
          <el-table-column prop="type" label="类型" />
          <el-table-column label="可空">
            <template #default="{ row }">
              {{ row.nullable ? '是' : '否' }}
            </template>
          </el-table-column>
          <el-table-column label="主键">
            <template #default="{ row }">
              <el-tag v-if="row.key === 'PRI'" type="danger" size="small">PK</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="default" label="默认" />
          <el-table-column prop="extra" label="额外" />
        </el-table>
      </div>

      <!-- 数据视图 -->
      <div v-else class="data-view">
        <div class="pagination-info">
          <span>显示 {{ (currentPage - 1) * pageSize + 1 }} 至 {{ Math.min(currentPage * pageSize, totalRows) }} 条， 共 {{
            totalRows
          }} 条</span>
          <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="totalRows"
            layout="prev, pager, next, jumper" @current-change="loadData" />
        </div>

        <el-table :data="tableData" border stripe size="small" max-height="400">
          <el-table-column v-for="column in columns" :key="column.name" :prop="column.name" :label="column.name"
            show-overflow-tooltip>
            <template #header="{ column: col }">
              <div class="column-header">
                <span>{{ col.label }}</span>
                <el-tag v-if="getPrimaryKeyColumn(col.property)" type="danger" size="small">PK</el-tag>
              </div>
            </template>
            <template #default="{ row }">
              <span v-if="row[column.name] === null" class="null-value">NULL</span>
              <span v-else>{{ row[column.name] }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Menu, Document } from '@element-plus/icons-vue'
import { DatabaseService } from '../services/database'
import type { ColumnInfo } from '../types'

const props = defineProps<{
  database: string
  table: string
}>()

const emit = defineEmits<{
  'generate-query': [query: string]
}>()

const loading = ref(false)
const showingStructure = ref(false)
const columns = ref<ColumnInfo[]>([])
const tableData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(100)
const totalRows = ref(0)

const getPrimaryKeyColumn = (columnName: string) => {
  return columns.value.find(col => col.name === columnName && col.key === 'PRI')
}

const loadStructure = async () => {
  try {
    columns.value = await DatabaseService.getTableColumns(props.database, props.table)
  } catch (error: any) {
    console.log(error);
    ElMessage.error(error || '加载表结构失败')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    // 先加载结构信息
    if (columns.value.length === 0) {
      await loadStructure()
    }

    // 获取总行数
    const countResult = await DatabaseService.executeQuery(
      `SELECT COUNT(*) as count FROM \`${props.table}\``
    )
    const countData = countResult.rows || countResult.data || []
    totalRows.value = parseInt(countData[0]?.[0] || countData[0]?.count || '0')

    // 加载分页数据
    const offset = (currentPage.value - 1) * pageSize.value
    const query = `SELECT * FROM \`${props.table}\` LIMIT ${pageSize.value} OFFSET ${offset}`

    const result = await DatabaseService.executeQuery(query)
    const resultData = result.rows || result.data || []

    // 转换数据格式
    if (result.fields && result.rows) {
      // 传统格式 (数组形式)
      tableData.value = result.rows.map((row: any) => {
        const item: any = {}
        result.fields!.forEach((col: any, index: number) => {
          item[col] = row[index]
        })
        return item
      })
    } else {
      // 新格式 (对象形式)
      tableData.value = resultData
    }
  } catch (error: any) {
    console.log(error);
    ElMessage.error(error || '加载表数据失败')
  } finally {
    loading.value = false
  }
}

const showStructure = () => {
  showingStructure.value = !showingStructure.value
}

const generateSelect = () => {
  const columnNames = columns.value.map(col => `\`${col.name}\``).join(', ')
  const query = `SELECT ${columnNames}\nFROM \`${props.database}\`.\`${props.table}\`\nLIMIT 100;`
  emit('generate-query', query)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.table-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.viewer-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

:global(html.dark) .viewer-header {
  background-color: #2a2a2a;
  border-bottom-color: #333;
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-info h3 {
  margin: 0;
  color: #303133;
  transition: color 0.3s ease;
}

:global(html.dark) .table-info h3 {
  color: #e4e7ed;
}

.viewer-content {
  flex: 1;
  overflow: auto;
  padding: 10px;
  background-color: #fff;
  transition: background-color 0.3s ease;
}

:global(html.dark) .viewer-content {
  background-color: #1a1a1a;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  transition: background-color 0.3s ease, color 0.3s ease;
}

:global(html.dark) .pagination-info {
  background-color: #2a2a2a;
  color: #909399;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.null-value {
  color: #909399;
  font-style: italic;
  transition: color 0.3s ease;
}

:global(html.dark) .null-value {
  color: #606266;
}
</style>
