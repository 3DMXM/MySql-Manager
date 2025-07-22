import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')

export const useTheme = () => {
    const isDark = computed(() => theme.value === 'dark')
    const isLight = computed(() => theme.value === 'light')

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
        updateBodyClass()
        localStorage.setItem('mysql-manager-theme', newTheme)
    }

    const toggleTheme = () => {
        setTheme(isDark.value ? 'light' : 'dark')
    }

    const updateBodyClass = () => {
        const html = document.documentElement
        if (isDark.value) {
            html.classList.add('dark')
            html.classList.remove('light')
        } else {
            html.classList.add('light')
            html.classList.remove('dark')
        }
    }

    const initTheme = () => {
        const savedTheme = localStorage.getItem('mysql-manager-theme') as Theme
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            theme.value = savedTheme
        } else {
            // 检查系统偏好
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            theme.value = prefersDark ? 'dark' : 'light'
        }
        updateBodyClass()
    }

    // 键盘快捷键支持 (Ctrl+Shift+T)
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            event.preventDefault()
            toggleTheme()
        }
    }

    // 设置键盘事件监听器
    const setupKeyboardShortcut = () => {
        document.addEventListener('keydown', handleKeydown)
    }

    const removeKeyboardShortcut = () => {
        document.removeEventListener('keydown', handleKeydown)
    }

    return {
        theme: computed(() => theme.value),
        isDark,
        isLight,
        setTheme,
        toggleTheme,
        initTheme,
        setupKeyboardShortcut,
        removeKeyboardShortcut
    }
}

// 立即初始化主题，确保在应用启动时就应用正确的主题
const savedTheme = localStorage.getItem('mysql-manager-theme') as Theme
if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    theme.value = savedTheme
} else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
}

// 立即应用主题类
const html = document.documentElement
if (theme.value === 'dark') {
    html.classList.add('dark')
    html.classList.remove('light')
} else {
    html.classList.add('light')
    html.classList.remove('dark')
}