<template>
  <div class="database-browser">
    <el-tree :data="treeData" :props="treeProps" node-key="id" :expand-on-click-node="false" :load="loadNode" lazy
      @node-click="handleNodeClick">
      <template #default="{ node, data }">
        <div class="tree-node">
          <el-icon v-if="data.type === 'database'">
            <Coin />
          </el-icon>
          <el-icon v-else-if="data.type === 'table'">
            <Grid />
          </el-icon>
          <span class="node-label">{{ node.label }}</span>
          <span v-if="data.type === 'table' && data.rows !== undefined" class="node-info">
            ({{ data.rows }} )行
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Grid } from '@element-plus/icons-vue'
import { DatabaseService } from '../services/database'
import type { ColumnInfo } from '../types'

interface TreeNode {
  id: string
  label: string
  type: 'database' | 'table' | 'column'
  leaf?: boolean
  children?: TreeNode[]
  rows?: number
  data?: any
}

const emit = defineEmits<{
  'node-click': [data: { type: string; database?: string; table?: string; column?: ColumnInfo }]
}>()

const treeData = ref<TreeNode[]>([])

const treeProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'leaf'
}

const loadDatabases = async () => {
  try {
    const databases = await DatabaseService.getDatabases()
    treeData.value = databases.map(db => ({
      id: `db_${db}`,
      label: db,
      type: 'database' as const,
      data: { name: db }
    }))
  } catch (error: any) {
    console.log(error);

    ElMessage.error(error || '加载数据库列表失败')
  }
}

const loadNode = async (node: any, resolve: Function) => {
  if (node.level === 0) {
    await loadDatabases()
    resolve(treeData.value)
    return
  }

  const data = node.data as TreeNode

  if (data.type === 'database') {
    try {
      const tables = await DatabaseService.getTables(data.label)
      const tableNodes: TreeNode[] = tables.map(table => ({
        id: `table_${data.label}_${table.name}`,
        label: table.name,
        type: 'table' as const,
        rows: table.rows,
        data: { database: data.label, table }
      }))
      resolve(tableNodes)
    } catch (error: any) {
      console.log(error);

      ElMessage.error(error || '加载表列表失败')
      resolve([])
    }
  } else if (data.type === 'table') {
    try {
      const columns = await DatabaseService.getTableColumns(
        data.data.database,
        data.data.table.name
      )
      const columnNodes: TreeNode[] = columns.map(column => ({
        id: `col_${data.data.database}_${data.data.table.name}_${column.name}`,
        label: `${column.name} (${column.type})`,
        type: 'column' as const,
        leaf: true,
        data: {
          database: data.data.database,
          table: data.data.table.name,
          column
        }
      }))
      resolve(columnNodes)
    } catch (error: any) {
      console.log(error);

      ElMessage.error(error || '加载表结构失败')
      resolve([])
    }
  } else {
    resolve([])
  }
}

const handleNodeClick = (data: TreeNode) => {
  if (data.type === 'database') {
    emit('node-click', { type: 'database', database: data.label })
  } else if (data.type === 'table') {
    emit('node-click', {
      type: 'table',
      database: data.data.database,
      table: data.data.table.name
    })
  } else if (data.type === 'column') {
    emit('node-click', {
      type: 'column',
      database: data.data.database,
      table: data.data.table,
      column: data.data.column
    })
  }
}

onMounted(() => {
  loadDatabases()
})
</script>

<style scoped>
.database-browser {
  height: 100%;
  overflow: auto;
  border-right: 1px solid #e4e7ed;
  transition: border-color 0.3s ease;
}

:global(html.dark) .database-browser {
  border-right-color: #333;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-label {
  flex: 1;
  transition: color 0.3s ease;
}

:global(html.dark) .node-label {
  color: #e4e7ed;
}

.node-info {
  color: #909399;
  font-size: 12px;
  transition: color 0.3s ease;
}

:global(html.dark) .node-info {
  color: #606266;
}

/* Element Plus Tree 组件暗色模式样式 */
:global(body.dark .el-tree) {
  background-color: transparent;
  color: #e4e7ed;
}

:global(body.dark .el-tree-node__content) {
  background-color: transparent;
  color: #e4e7ed;
}

:global(body.dark .el-tree-node__content:hover) {
  background-color: #2a2a2a;
}

:global(body.dark .el-tree .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #409eff;
}

:global(body.dark .el-tree-node__expand-icon) {
  color: #909399;
}

:global(body.dark .el-icon) {
  color: #909399;
}
</style>
