/**
 * WebVault 性能测试配置
 * 
 * 定义性能测试的基准、阈值和配置参数
 * 
 * @version 1.0.0
 * @created 2025-08-19
 */

// ============================================================================
// 性能基准配置
// ============================================================================

export const PERFORMANCE_BENCHMARKS = {
  // 认证系统性能要求 (毫秒)
  AUTH: {
    LOGIN_VALIDATION_MAX: 500,        // 登录验证最大时间
    SESSION_VALIDATION_MAX: 150,      // 会话验证最大时间
    ACCOUNT_LOCKOUT_CHECK_MAX: 50,    // 账户锁定检查最大时间
    PASSWORD_HASH_MAX: 200,           // 密码哈希计算最大时间
    TOKEN_GENERATION_MAX: 100,        // 令牌生成最大时间
    SESSION_REFRESH_MAX: 200,         // 会话刷新最大时间
  },

  // 中间件性能要求 (毫秒)
  MIDDLEWARE: {
    PUBLIC_ROUTE_MAX: 30,             // 公共路由检查最大时间
    PROTECTED_ROUTE_MAX: 100,         // 受保护路由检查最大时间
    SESSION_CHECK_MAX: 60,            // 会话检查最大时间
    ROUTE_MATCHING_MAX: 20,           // 路由匹配最大时间
    REDIRECT_PROCESSING_MAX: 50,      // 重定向处理最大时间
  },

  // CLI工具性能要求 (毫秒)
  CLI: {
    COLD_START_MAX: 1500,             // 冷启动最大时间
    HOT_START_MAX: 400,               // 热启动最大时间
    COMMAND_EXECUTION_MAX: 2000,      // 单个命令执行最大时间
    FULL_WORKFLOW_MAX: 5000,          // 完整工作流最大时间
    TS_COMPILATION_MAX: 300,          // TypeScript编译最大时间
    ENV_VALIDATION_MAX: 100,          // 环境验证最大时间
  },

  // 数据库操作性能要求 (毫秒)
  DATABASE: {
    CONNECTION_MAX: 150,              // 连接建立最大时间
    SIMPLE_QUERY_MAX: 80,             // 简单查询最大时间
    COMPLEX_QUERY_MAX: 200,           // 复杂查询最大时间
    RLS_VALIDATION_MAX: 1000,         // RLS策略验证最大时间
    BATCH_OPERATION_MAX: 500,         // 批量操作最大时间
    INDEX_QUERY_MAX: 50,              // 索引查询最大时间
  },

  // API端点性能要求 (毫秒)
  API: {
    AUTH_ENDPOINT_MAX: 500,           // 认证端点最大响应时间
    DATA_ENDPOINT_MAX: 300,           // 数据端点最大响应时间
    UPLOAD_ENDPOINT_MAX: 2000,        // 上传端点最大响应时间
    SEARCH_ENDPOINT_MAX: 400,         // 搜索端点最大响应时间
    ADMIN_ENDPOINT_MAX: 600,          // 管理端点最大响应时间
  },
} as const;

// ============================================================================
// 性能测试配置
// ============================================================================

export const PERFORMANCE_CONFIG = {
  // 并发测试配置
  CONCURRENCY: {
    LOW_LOAD: 5,                      // 低负载并发数
    MEDIUM_LOAD: 20,                  // 中等负载并发数
    HIGH_LOAD: 50,                    // 高负载并发数
    STRESS_LOAD: 100,                 // 压力测试并发数
  },

  // 测试次数配置
  ITERATIONS: {
    QUICK_TEST: 5,                    // 快速测试次数
    NORMAL_TEST: 20,                  // 正常测试次数
    THOROUGH_TEST: 50,                // 全面测试次数
    BENCHMARK_TEST: 100,              // 基准测试次数
  },

  // 采样配置
  SAMPLING: {
    MIN_SAMPLES: 10,                  // 最少样本数
    TARGET_SAMPLES: 30,               // 目标样本数
    MAX_SAMPLES: 100,                 // 最大样本数
    WARMUP_SAMPLES: 3,                // 预热样本数
  },

  // 超时配置 (毫秒)
  TIMEOUTS: {
    SINGLE_TEST: 10000,               // 单个测试超时
    SUITE_TIMEOUT: 60000,             // 测试套件超时
    INTEGRATION_TIMEOUT: 120000,      // 集成测试超时
  },

  // 统计配置
  STATISTICS: {
    PERCENTILES: [50, 75, 90, 95, 99], // 计算的百分位数
    CONFIDENCE_LEVEL: 0.95,            // 置信水平
    ACCEPTABLE_VARIANCE: 0.1,          // 可接受的方差
  },
} as const;

// ============================================================================
// 性能阈值配置
// ============================================================================

export const PERFORMANCE_THRESHOLDS = {
  // 响应时间阈值
  RESPONSE_TIME: {
    EXCELLENT: 0.5,                   // 优秀: 50%的基准时间
    GOOD: 0.8,                        // 良好: 80%的基准时间
    ACCEPTABLE: 1.0,                  // 可接受: 100%的基准时间
    WARNING: 1.2,                     // 警告: 120%的基准时间
    CRITICAL: 1.5,                    // 严重: 150%的基准时间
  },

  // 成功率阈值
  SUCCESS_RATE: {
    MINIMUM: 0.95,                    // 最低成功率 95%
    TARGET: 0.99,                     // 目标成功率 99%
    EXCELLENT: 0.999,                 // 优秀成功率 99.9%
  },

  // 资源使用阈值
  RESOURCE_USAGE: {
    MEMORY_WARNING: 100 * 1024 * 1024,  // 内存警告阈值 100MB
    MEMORY_CRITICAL: 500 * 1024 * 1024, // 内存严重阈值 500MB
    CPU_WARNING: 0.7,                    // CPU警告阈值 70%
    CPU_CRITICAL: 0.9,                   // CPU严重阈值 90%
  },
} as const;

// ============================================================================
// 测试环境配置
// ============================================================================

export const TEST_ENVIRONMENT = {
  // 模拟环境配置
  SIMULATION: {
    NETWORK_LATENCY_MIN: 10,          // 最小网络延迟 (ms)
    NETWORK_LATENCY_MAX: 50,          // 最大网络延迟 (ms)
    DB_QUERY_MIN: 20,                 // 最小数据库查询时间 (ms)
    DB_QUERY_MAX: 100,                // 最大数据库查询时间 (ms)
    PROCESSING_MIN: 5,                // 最小处理时间 (ms)
    PROCESSING_MAX: 30,               // 最大处理时间 (ms)
  },

  // 测试数据配置
  TEST_DATA: {
    USER_COUNT: 100,                  // 测试用户数量
    ADMIN_COUNT: 5,                   // 测试管理员数量
    SESSION_COUNT: 50,                // 测试会话数量
    REQUEST_COUNT: 1000,              // 测试请求数量
  },

  // Mock配置
  MOCKS: {
    ENABLE_SUPABASE_MOCK: true,       // 启用Supabase模拟
    ENABLE_NETWORK_MOCK: true,        // 启用网络模拟
    ENABLE_DB_MOCK: true,             // 启用数据库模拟
    REALISTIC_DELAYS: true,           // 启用真实延迟模拟
  },
} as const;

// ============================================================================
// 报告配置
// ============================================================================

export const REPORT_CONFIG = {
  // 输出格式
  FORMAT: {
    CONSOLE: true,                    // 控制台输出
    JSON: false,                      // JSON格式输出
    HTML: false,                      // HTML格式输出
    CSV: false,                       // CSV格式输出
  },

  // 详细程度
  VERBOSITY: {
    SILENT: 0,                        // 静默模式
    BASIC: 1,                         // 基础信息
    DETAILED: 2,                      // 详细信息
    VERBOSE: 3,                       // 详细模式
    DEBUG: 4,                         // 调试模式
  },

  // 包含内容
  INCLUDE: {
    SUMMARY: true,                    // 包含摘要
    DETAILED_RESULTS: true,           // 包含详细结果
    STATISTICS: true,                 // 包含统计信息
    CHARTS: false,                    // 包含图表
    RECOMMENDATIONS: true,            // 包含建议
  },
} as const;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取性能基准值
 */
export function getBenchmark(category: string, metric: string): number {
  const benchmarks = PERFORMANCE_BENCHMARKS as any;
  return benchmarks[category]?.[metric] || 1000;
}

/**
 * 检查性能是否在阈值内
 */
export function isWithinThreshold(
  actualTime: number, 
  benchmarkTime: number, 
  threshold: number = PERFORMANCE_THRESHOLDS.RESPONSE_TIME.ACCEPTABLE
): boolean {
  return actualTime <= benchmarkTime * threshold;
}

/**
 * 获取性能等级
 */
export function getPerformanceGrade(
  actualTime: number, 
  benchmarkTime: number
): 'excellent' | 'good' | 'acceptable' | 'warning' | 'critical' {
  const ratio = actualTime / benchmarkTime;
  
  if (ratio <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.EXCELLENT) return 'excellent';
  if (ratio <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.GOOD) return 'good';
  if (ratio <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.ACCEPTABLE) return 'acceptable';
  if (ratio <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.WARNING) return 'warning';
  return 'critical';
}

/**
 * 生成随机延迟
 */
export function generateRandomDelay(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 计算统计信息
 */
export function calculateStatistics(values: number[]) {
  if (values.length === 0) return null;
  
  const sorted = values.sort((a, b) => a - b);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  const percentiles = PERFORMANCE_CONFIG.STATISTICS.PERCENTILES.reduce((acc, p) => {
    const index = Math.floor((sorted.length - 1) * (p / 100));
    acc[`p${p}`] = sorted[index];
    return acc;
  }, {} as Record<string, number>);
  
  return {
    count: values.length,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    ...percentiles,
  };
}

export default {
  BENCHMARKS: PERFORMANCE_BENCHMARKS,
  CONFIG: PERFORMANCE_CONFIG,
  THRESHOLDS: PERFORMANCE_THRESHOLDS,
  ENVIRONMENT: TEST_ENVIRONMENT,
  REPORT: REPORT_CONFIG,
  getBenchmark,
  isWithinThreshold,
  getPerformanceGrade,
  generateRandomDelay,
  calculateStatistics,
};