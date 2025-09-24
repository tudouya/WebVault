# API Response Specification — REST v1.0
> 适用范围：REST 接口（默认）  
> 版本策略：按接口范式拆分；REST 规范为 v1.0。GraphQL 或 RPC 规范可另行追加。

## 元信息
| 项目 | 内容 |
| ---- | ---- |
| 规范版本 | REST v1.0 |
| 适用接口 | RESTful HTTP API |
| 适用环境 | 对外 / 对内均可；如仅面向内部，可在“可裁剪项”中进行调整 |
| 可扩展位 | GraphQL、内部管理接口、移动端特定约束等 |

---

## 通用字段（REST）
- `requestId`：字符串。一次请求的唯一标识，建议透传 `X-Request-Id`，并在响应头回写。
- `timestamp`：字符串。`YYYY-MM-DD HH:MM:SS`，时区统一 `Asia/Shanghai`。
- `code`：成功固定为 `0`；错误为稳定业务错误码（蛇形命名，如 `validation_failed`）。
- `message`：面向终端用户的简短文案（中文优先）。

> **内部接口** 如倾向直接使用 HTTP 状态码，可参考“可裁剪项”进行覆盖或删减。

## 成功响应（REST）
### 非分页
```
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: <uuid>

{
  "code": 0,
  "message": "ok",
  "data": { /* 任意对象 */ },
  "requestId": "<uuid>",
  "timestamp": "2025-09-17 12:34:56"
}
```

### 分页
```
HTTP/1.1 200 OK
{
  "code": 0,
  "message": "ok",
  "data": [ /* 项列表 */ ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 135,
    "has_more": true
  },
  "links": {
    "next": "/api/resources?page=2&per_page=20",
    "prev": null
  },
  "requestId": "<uuid>",
  "timestamp": "2025-09-17 12:34:56"
}
```

## 状态码语义
- 200 OK：读取或计算成功。
- 201 Created：创建成功，返回资源 `data` 或至少 `id`。
- 204 No Content：删除或无需返回体的成功操作。

## 错误响应（REST）
```
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json
X-Request-Id: <uuid>

{
  "status": 422,
  "code": "validation_failed",
  "message": "参数校验失败",
  "errors": {
    "phone": ["手机号格式不合法"],
    "amount": ["金额必须为正数"]
  },
  "requestId": "<uuid>",
  "timestamp": "2025-09-17 12:34:56"
}
```

### 推荐状态码映射
- 400 Bad Request：通用参数错误。
- 401 Unauthorized：未认证或 Token 失效。
- 403 Forbidden：无访问权限。
- 404 Not Found：资源不存在。
- 409 Conflict：并发或状态冲突。
- 422 Unprocessable Entity：字段校验失败。
- 429 Too Many Requests：限流触发。
- 500 Internal Server Error：服务器内部错误。
- 503 Service Unavailable / 504 Gateway Timeout：下游不可用或超时。

---

## GraphQL / RPC / 内部接口扩展（可选）
> 默认 REST steering 不包含此部分。如项目需要 GraphQL、RPC 或特定内部约定，可在生成 steering 时引入对应扩展。

- **GraphQL**：建议遵循 GraphQL `errors` 数组和 `extensions` 字段；可将 `requestId` 放入 `extensions`。
- **RPC / gRPC**：采用状态码 + 详细错误对象；可参考 gRPC status 规范。
- **内部接口**：若无需 `code`、`links` 等包装，可在 steering 生成时剔除或改为日志友好的结构。

---

## 可裁剪项（按标签选择）
| 场景标签 | 可裁剪内容 | 默认操作 |
| -------- | ---------- | -------- |
| `internal_only` | `links`、`meta.has_more`、对终端用户的友好文案 | 可删除或改为内部术语 |
| `mobile_app` | `links` 改为 `next_page_token` 或 `cursor` | 若使用分页 token，可替换 |
| `graphQL` | 全部 REST 包装字段 | 替换为 GraphQL 扩展方案 |
| `minimal` | `requestId` 保留，`timestamp` 可省略 | 视服务端能力选择 |

> steering 生成器可根据项目标签自动裁剪上述内容。

---

## 版本与变更
- `REST v1.0`（当前） — 基础 REST 接口规范。
- 计划中的增量：`REST v1.1`（补充批量操作响应）、`GraphQL v1.0`、`RPC v1.0` 等。

---

*此规范可与《Standard Error Codes — REST v1.0》搭配使用。*
