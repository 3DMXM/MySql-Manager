<template>
  <div class="mysql-manager">
    <!-- 头部工具栏-->
    <div class="header">
      <div class="header-left">
        <h1>MySQL 管理</h1>
        <el-button-group>
          <el-button type="primary" @click="showConnectionDialog" :disabled="!isDisconnected">
            <el-icon>
              <Link />
            </el-icon>
            连接
          </el-button>
          <el-button v-if="!isDisconnected" @click="disconnect">
            <el-icon>
              <Close />
            </el-icon>
            断开连接
          </el-button>
        </el-button-group>
      </div>
      <div class="header-right">
        <div class="header-controls">
          <!-- 主题切换按钮 -->
          <el-tooltip :content="isDark ? '切换到亮色模式(Ctrl+Shift+T)' : '切换到暗色模式(Ctrl+Shift+T)'">
            <el-button @click="toggleTheme" :icon="isDark ? Sunny : Moon" circle />
          </el-tooltip>

          <span v-if="connectionInfo" class="connection-info">
            已连连接 {{ connectionInfo.username }}@{{ connectionInfo.host }}:{{ connectionInfo.port }}
          </span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧数据库浏览器 -->
      <div class="sidebar">
        <DatabaseBrowser v-if="!isDisconnected" @node-click="handleNodeClick" />
        <div v-else class="empty-sidebar">
          <el-empty description="请先连接数据库" />
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content">
        <el-tabs v-model="activeTab" type="card" closable @tab-remove="removeTab">
          <!-- SQL 编辑器标签页 -->
          <el-tab-pane label="SQL 查询" name="sql-editor">
            <SqlEditor ref="sqlEditorRef" :initial-query="initialQuery" />
          </el-tab-pane>

          <!-- 表查看器标签�?-->
          <el-tab-pane v-for="tab in tableTabs" :key="tab.name" :label="tab.label" :name="tab.name">
            <TableViewer :database="tab.database" :table="tab.table" @generate-query="handleGenerateQuery" />
          </el-tab-pane>
        </el-tabs>

        <!-- 如果没有连接，显示欢迎界�?-->
        <div v-if="isDisconnected" class="welcome">
          <el-empty>
            <template #description>
              <p>请点击上方的连接按钮连接到数据库</p>
            </template>
            <el-button type="primary" @click="showConnectionDialog">
              立即连接
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 连接对话�?-->
    <ConnectionDialog v-model="connectionDialogVisible" @connected="handleConnected" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link, Close, Sunny, Moon } from '@element-plus/icons-vue'
import ConnectionDialog from './components/ConnectionDialog.vue'
import DatabaseBrowser from './components/DatabaseBrowser.vue'
import SqlEditor from './components/SqlEditor.vue'
import TableViewer from './components/TableViewer.vue'
import { DatabaseService } from './services/database'
import { useTheme } from './composables/useTheme'
import type { ConnectionConfig } from './types'

interface TableTab {
  name: string
  label: string
  database: string
  table: string
}

const connectionDialogVisible = ref(false)
const connectionInfo = ref<ConnectionConfig | null>(null)
const activeTab = ref('sql-editor')
const tableTabs = ref<TableTab[]>([])
const initialQuery = ref('')
const sqlEditorRef = ref()

// 主题功能
const { isDark, toggleTheme, initTheme, setupKeyboardShortcut, removeKeyboardShortcut } = useTheme()

const isDisconnected = computed(() => !connectionInfo.value)

// 初始化主题和键盘快捷�?
onMounted(() => {
  initTheme()
  setupKeyboardShortcut()
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  removeKeyboardShortcut()
})

const showConnectionDialog = () => {
  connectionDialogVisible.value = true
}

const handleConnected = (config: ConnectionConfig) => {
  connectionInfo.value = config
  ElMessage.success('数据库连接成功！')
}

const disconnect = async () => {
  try {
    await ElMessageBox.confirm('确定要断开数据库连接吗？', '确认', {
      type: 'warning'
    })

    await DatabaseService.disconnect()
    connectionInfo.value = null
    tableTabs.value = []
    activeTab.value = 'sql-editor'
    initialQuery.value = ''

    ElMessage.success('已断开连接')
  } catch (error: any) {
    if (error === 'cancel') return
    console.log(error);

    ElMessage.error(error || '断开连接失败')
  }
}

const handleNodeClick = (data: any) => {
  if (data.type === 'database') {
    // 点击数据库，可以在这里添加相关逻辑
    console.log('选择数据�?', data.database)
  } else if (data.type === 'table') {
    // 点击表，打开表查看器
    openTableViewer(data.database, data.table)
  } else if (data.type === 'column') {
    // 点击字段，可以插入到 SQL 编辑�?
    const columnName = `\`${data.database}\`.\`${data.table}\`.\`${data.column.name}\``
    if (sqlEditorRef.value) {
      sqlEditorRef.value.insertQuery(columnName)
    }
  }
}

const openTableViewer = (database: string, table: string) => {
  const tabName = `table_${database}_${table}`
  const existingTab = tableTabs.value.find(tab => tab.name === tabName)

  if (!existingTab) {
    tableTabs.value.push({
      name: tabName,
      label: `${database}.${table}`,
      database,
      table
    })
  }

  activeTab.value = tabName
}

const removeTab = (tabName: string) => {
  if (tabName === 'sql-editor') return

  const index = tableTabs.value.findIndex(tab => tab.name === tabName)
  if (index !== -1) {
    tableTabs.value.splice(index, 1)
    if (activeTab.value === tabName) {
      activeTab.value = 'sql-editor'
    }
  }
}

const handleGenerateQuery = (query: string) => {
  initialQuery.value = query
  activeTab.value = 'sql-editor'

  // 等待标签页切换完成后插入查询
  setTimeout(() => {
    if (sqlEditorRef.value) {
      sqlEditorRef.value.insertQuery(query)
    }
  }, 100)
}
</script>

<style scoped>
.mysql-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  transition: background-color 0.3s ease;
}

:global(html.dark) .mysql-manager {
  background-color: #0a0a0a;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

:global(html.dark) .header {
  background-color: #1a1a1a;
  border-bottom-color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
  transition: color 0.3s ease;
}

:global(html.dark) .header-left h1 {
  color: #e4e7ed;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-info {
  color: #67c23a;
  font-size: 14px;
}

:global(html.dark) .connection-info {
  color: #95d475;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  flex-shrink: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

:global(html.dark) .sidebar {
  background-color: #1a1a1a;
  border-right-color: #333;
}

.empty-sidebar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.content {
  flex: 1;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: background-color 0.3s ease;
}

:global(html.dark) .content {
  background-color: #1a1a1a;
}

.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

:deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* 暗色模式�?Element Plus 组件的样式覆�?*/
:global(body.dark .el-button) {
  background-color: #2a2a2a;
  border-color: #404040;
  color: #e4e7ed;
}

:global(body.dark .el-button:hover) {
  background-color: #3a3a3a;
  border-color: #505050;
}

:global(body.dark .el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:global(body.dark .el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

:global(body.dark .el-tabs__header) {
  background-color: #1a1a1a;
}

:global(body.dark .el-tabs__nav) {
  background-color: #1a1a1a;
}

:global(body.dark .el-tabs__item) {
  color: #909399;
}

:global(body.dark .el-tabs__item.is-active) {
  color: #409eff;
}

:global(body.dark .el-empty__description p) {
  color: #909399;
}
</style>
