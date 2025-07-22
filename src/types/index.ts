// 数据库连接配置接口
export interface ConnectionConfig {
    host: string
    port: number
    username: string
    password: string
    database?: string
}

// 数据库信息接口
export interface DatabaseInfo {
    name: string
    tables: TableInfo[]
}

// 表信息接口
export interface TableInfo {
    name: string
    type: 'table' | 'view'
    engine?: string
    rows?: number
    rowCount?: number  // 兼容新的实现
    size?: string
    comment?: string
    columns?: ColumnInfo[]  // 改为可选，因为有时候不需要加载列信息
}

// 字段信息接口
export interface ColumnInfo {
    name: string
    type: string
    nullable: boolean
    key: string
    default: any
    defaultValue?: any  // 兼容新的实现
    extra: string
    comment: string
    maxLength?: number | null
    precision?: number | null
    scale?: number | null
}

// 查询结果接口
export interface QueryResult {
    fields?: string[]
    rows?: any[]
    data?: any[]  // 兼容新的实现
    affectedRows?: number
    insertId?: number
    success?: boolean
    executionTime?: number
    message?: string
    error?: Error
    pagination?: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

// 树节点数据接口
export interface TreeNodeData {
    id: string
    label: string
    type: 'connection' | 'database' | 'table' | 'column'
    database?: string
    table?: string
    column?: ColumnInfo
    children?: TreeNodeData[]
}
