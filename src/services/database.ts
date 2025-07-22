import Database from '@tauri-apps/plugin-sql'
import type { ConnectionConfig, QueryResult, TableInfo, ColumnInfo } from '../types'


/**
 * 数据库服务类
 * 使用 @tauri-apps/plugin-sql 提供数据库操作接口
 */
export class DatabaseService {
    private static db: Database | null = null
    private static isConnected = false
    private static currentConnection: ConnectionConfig | null = null

    /**
     * 构建 MySQL 连接字符串
     */
    private static buildConnectionString(config: ConnectionConfig): string {
        const { host, port, username, password, database } = config
        let connectionString = `mysql://${username}:${password}@${host}:${port}`
        if (database) {
            connectionString += `/${database}`
        }
        return connectionString
    }

    /**
     * 连接数据库
     */
    static async connect(config: ConnectionConfig): Promise<void> {
        try {
            const connectionString = this.buildConnectionString(config)
            console.log('正在连接数据库...', { host: config.host, port: config.port, database: config.database })

            this.db = await Database.load(connectionString)
            this.isConnected = true
            this.currentConnection = config

            console.log('数据库连接成功')
        } catch (error) {
            this.isConnected = false
            this.currentConnection = null
            this.db = null
            console.error('连接数据库失败:', error)
            throw new Error(`连接数据库失败: ${error}`)
        }
    }

    /**
     * 断开数据库连接
     */
    static async disconnect(): Promise<void> {
        try {
            if (this.db) {
                await this.db.close()
                this.db = null
            }
            this.isConnected = false
            this.currentConnection = null
            console.log('数据库连接已断开')
        } catch (error) {
            console.error('断开连接失败:', error)
            throw new Error(`断开连接失败: ${error}`)
        }
    }

    /**
     * 检查连接状态
     */
    static getConnectionStatus(): boolean {
        return this.isConnected && this.db !== null
    }

    /**
     * 获取当前连接信息
     */
    static getCurrentConnection(): ConnectionConfig | null {
        return this.currentConnection
    }

    /**
     * 确保数据库已连接
     */
    private static ensureConnected(): Database {
        if (!this.isConnected || !this.db) {
            throw new Error('数据库未连接')
        }
        return this.db
    }

    /**
     * 获取数据库列表
     */
    static async getDatabases(): Promise<string[]> {
        try {
            const db = this.ensureConnected()
            const result = await db.select<Array<{ Database: string }>>('SHOW DATABASES')
            return result.map(row => row.Database)
        } catch (error) {
            console.error('获取数据库列表失败:', error)
            throw new Error(`获取数据库列表失败: ${error}`)
        }
    }

    /**
     * 获取指定数据库的表列表
     */
    static async getTables(database: string): Promise<TableInfo[]> {
        try {
            const db = this.ensureConnected()
            const query = `SELECT 
                TABLE_NAME as name,
                TABLE_TYPE as type,
                TABLE_ROWS as row_count,
                TABLE_COMMENT as comment
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?`

            const result = await db.select<Array<{
                name: string,
                type: string,
                row_count: number,
                comment: string
            }>>(query, [database])

            return result.map(row => ({
                name: row.name,
                type: row.type === 'BASE TABLE' ? 'table' : 'view',
                rowCount: row.row_count || 0,
                comment: row.comment || ''
            }))
        } catch (error) {
            console.error('获取表列表失败:', error)
            throw new Error(`获取表列表失败: ${error}`)
        }
    }

    /**
     * 获取指定表的字段信息
     */
    static async getTableColumns(database: string, table: string): Promise<ColumnInfo[]> {
        try {
            const db = this.ensureConnected()
            const query = `SELECT 
                COLUMN_NAME as name,
                DATA_TYPE as type,
                IS_NULLABLE as nullable,
                COLUMN_KEY as \`key\`,
                COLUMN_DEFAULT as default_value,
                EXTRA as extra,
                COLUMN_COMMENT as comment,
                CHARACTER_MAXIMUM_LENGTH as max_length,
                NUMERIC_PRECISION as \`precision\`,
                NUMERIC_SCALE as \`scale\`
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION`

            const result = await db.select<Array<{
                name: string,
                type: string,
                nullable: string,
                key: string,
                default_value: any,
                extra: string,
                comment: string,
                max_length: number | null,
                precision: number | null,
                scale: number | null
            }>>(query, [database, table])

            return result.map(row => ({
                name: row.name,
                type: row.type,
                nullable: row.nullable === 'YES',
                key: row.key,
                default: row.default_value,
                defaultValue: row.default_value,
                extra: row.extra,
                comment: row.comment || '',
                maxLength: row.max_length,
                precision: row.precision,
                scale: row.scale
            }))
        } catch (error) {
            console.error('获取表字段失败:', error)
            throw new Error(`获取表字段失败: ${error}`)
        }
    }

    /**
     * 执行 SQL 查询
     */
    static async executeQuery(sql: string): Promise<QueryResult> {
        try {
            const db = this.ensureConnected()
            console.log('执行 SQL:', sql)

            const trimmedSql = sql.trim().toLowerCase()

            if (trimmedSql.startsWith('select') || trimmedSql.startsWith('show') || trimmedSql.startsWith('describe') || trimmedSql.startsWith('explain')) {
                // 查询操作
                const startTime = Date.now()
                const rows = await db.select(sql) as any[]
                const executionTime = Date.now() - startTime

                return {
                    success: true,
                    data: rows,
                    affectedRows: 0,
                    executionTime,
                    message: `查询成功，返回 ${rows.length} 行数据`
                }
            } else {
                // 修改操作 (INSERT, UPDATE, DELETE, etc.)
                const startTime = Date.now()
                const result = await db.execute(sql)
                const executionTime = Date.now() - startTime

                return {
                    success: true,
                    data: [],
                    affectedRows: result.rowsAffected,
                    executionTime,
                    message: `操作成功，影响 ${result.rowsAffected} 行`
                }
            }
        } catch (error) {
            console.error('执行查询失败:', error)
            return {
                success: false,
                data: [],
                affectedRows: 0,
                executionTime: 0,
                message: `执行失败: ${error}`,
                error: error as Error
            }
        }
    }

    /**
     * 获取表数据（分页）
     */
    static async getTableData(
        database: string,
        table: string,
        page = 1,
        pageSize = 100,
        where?: string,
        orderBy?: string
    ): Promise<QueryResult> {
        try {
            const db = this.ensureConnected()

            // 构建查询语句
            let query = `SELECT * FROM \`${database}\`.\`${table}\``
            const params: any[] = []

            if (where && where.trim()) {
                query += ` WHERE ${where}`
            }

            if (orderBy && orderBy.trim()) {
                query += ` ORDER BY ${orderBy}`
            }

            // 添加分页
            const offset = (page - 1) * pageSize
            query += ` LIMIT ? OFFSET ?`
            params.push(pageSize, offset)

            const startTime = Date.now()
            const rows = await db.select(query, params) as any[]
            const executionTime = Date.now() - startTime

            // 获取总数
            let countQuery = `SELECT COUNT(*) as total FROM \`${database}\`.\`${table}\``
            if (where && where.trim()) {
                countQuery += ` WHERE ${where}`
            }

            const countResult = await db.select<Array<{ total: number }>>(countQuery)
            const total = countResult[0]?.total || 0

            return {
                success: true,
                data: rows,
                affectedRows: 0,
                executionTime,
                message: `查询成功，返回 ${rows.length} 行数据`,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        } catch (error) {
            console.error('获取表数据失败:', error)
            return {
                success: false,
                data: [],
                affectedRows: 0,
                executionTime: 0,
                message: `获取表数据失败: ${error}`,
                error: error as Error
            }
        }
    }

    /**
     * 获取表的创建语句
     */
    static async getTableCreateStatement(database: string, table: string): Promise<string> {
        try {
            const db = this.ensureConnected()
            const query = `SHOW CREATE TABLE \`${database}\`.\`${table}\``
            const result = await db.select<Array<{ 'Create Table': string }>>(query)

            if (result && result.length > 0) {
                return result[0]['Create Table']
            }

            throw new Error('未找到建表语句')
        } catch (error) {
            console.error('获取建表语句失败:', error)
            throw new Error(`获取建表语句失败: ${error}`)
        }
    }

    /**
     * 测试连接
     */
    static async testConnection(config: ConnectionConfig): Promise<boolean> {
        try {
            const connectionString = this.buildConnectionString(config)
            const testDb = await Database.load(connectionString)

            // 执行一个简单的查询来测试连接
            await testDb.select('SELECT 1')
            await testDb.close()

            return true
        } catch (error) {
            console.error('测试连接失败:', error)
            return false
        }
    }

    /**
     * 执行批量 SQL 语句
     */
    static async executeBatch(sqlStatements: string[]): Promise<QueryResult[]> {
        const results: QueryResult[] = []

        for (const sql of sqlStatements) {
            if (sql.trim()) {
                const result = await this.executeQuery(sql)
                results.push(result)

                if (!result.success) {
                    break // 遇到错误时停止执行
                }
            }
        }

        return results
    }

    /**
     * 开始事务
     */
    static async beginTransaction(): Promise<void> {
        try {
            const db = this.ensureConnected()
            await db.execute('START TRANSACTION')
        } catch (error) {
            throw new Error(`开始事务失败: ${error}`)
        }
    }

    /**
     * 提交事务
     */
    static async commitTransaction(): Promise<void> {
        try {
            const db = this.ensureConnected()
            await db.execute('COMMIT')
        } catch (error) {
            throw new Error(`提交事务失败: ${error}`)
        }
    }

    /**
     * 回滚事务
     */
    static async rollbackTransaction(): Promise<void> {
        try {
            const db = this.ensureConnected()
            await db.execute('ROLLBACK')
        } catch (error) {
            throw new Error(`回滚事务失败: ${error}`)
        }
    }
}