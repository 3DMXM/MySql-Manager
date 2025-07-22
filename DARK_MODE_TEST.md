# 暗色模式测试指南

## 功能测试清单

### ✅ 基本功能
- [ ] 点击右上角主题切换按钮可以切换暗色/亮色模式
- [ ] 使用键盘快捷键 `Ctrl+Shift+T` 可以切换主题
- [ ] 主题设置能够持久化保存（刷新页面后保持）
- [ ] 首次启动时自动检测系统主题偏好

### ✅ UI 组件适配
- [ ] 主界面背景色正确切换
- [ ] 头部导航栏暗色适配
- [ ] 侧边栏数据库浏览器暗色适配
- [ ] SQL 编辑器暗色语法高亮
- [ ] 表格查看器暗色适配
- [ ] 连接对话框暗色适配
- [ ] 所有 Element Plus 组件暗色适配

### ✅ 交互体验
- [ ] 主题切换动画平滑
- [ ] 按钮 hover 效果正常
- [ ] 文字颜色对比度合适
- [ ] 滚动条暗色适配
- [ ] Tooltip 暗色适配

### ✅ 代码编辑器
- [ ] SQL 编辑器在暗色模式下使用 OneDark 主题
- [ ] SQL 编辑器在亮色模式下使用默认主题
- [ ] 语法高亮正常显示
- [ ] 光标和选择区域颜色正确

## 技术实现

### 架构设计
```
src/
├── composables/
│   └── useTheme.ts          # 主题管理 composable
├── styles/
│   └── dark-mode.css        # 暗色模式样式
└── components/
    ├── App.vue              # 主应用组件
    ├── SqlEditor.vue        # SQL 编辑器组件
    ├── DatabaseBrowser.vue  # 数据库浏览器组件
    ├── TableViewer.vue      # 表格查看器组件
    └── ConnectionDialog.vue # 连接对话框组件
```

### 核心功能
1. **主题管理**: `useTheme` composable 提供统一的主题管理
2. **样式系统**: 使用 CSS 类切换和 CSS 变量系统
3. **持久化**: localStorage 存储主题偏好
4. **快捷键**: `Ctrl+Shift+T` 快速切换主题
5. **系统主题**: 自动检测系统偏好

### 样式实现
- 使用 `body.dark` 和 `body.light` 类来区分主题
- CSS 变量定义颜色系统
- 平滑的过渡动画
- Element Plus 组件全局样式覆盖

## 使用说明

### 切换主题
1. **按钮切换**: 点击右上角的月亮/太阳图标
2. **键盘快捷键**: 按 `Ctrl+Shift+T`

### 主题持久化
- 主题设置自动保存到 localStorage
- 应用重启后会恢复上次使用的主题
- 首次使用时会检测系统偏好

### 开发者说明
如需添加新组件的暗色模式支持：

1. 在组件中导入 `useTheme`:
```typescript
import { useTheme } from '../composables/useTheme'
const { isDark } = useTheme()
```

2. 在样式中添加暗色模式规则:
```css
.component {
  background-color: #fff;
  transition: background-color 0.3s ease;
}

:global(body.dark) .component {
  background-color: #1a1a1a;
}
```

## 已知问题
- 无重大已知问题

## 后续优化
- [ ] 可考虑添加更多主题选项（如蓝色主题、绿色主题等）
- [ ] 可考虑添加主题切换的音效反馈
- [ ] 可考虑添加主题切换的动画效果
