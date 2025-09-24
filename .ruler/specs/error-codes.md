# Standard Error Codes — REST v1.0
> 适用范围：REST 接口默认错误码  
> 版本策略：按接口范式拆分；GraphQL / 内部接口可扩展独立清单。

## 元信息
| 项目 | 内容 |
| ---- | ---- |
| 规范版本 | REST v1.0 |
| 适用接口 | RESTful HTTP API |
| 依赖规范 | 《API Response Specification — REST v1.0》 |
| 可扩展位 | GraphQL、内部接口专用错误码 |

---

## 命名约定（REST）
- 使用小写蛇形命名（例：`validation_failed`）。
- 表达问题类别而非实现细节；跨接口复用。
- 面向对内对外场景：若内部接口倾向直接使用 HTTP 状态码，可参考“可裁剪项”。

## 通用错误码（REST）
- `bad_request`（400）：请求格式或语义错误。
- `unauthorized`（401）：未认证或凭证失效。
- `forbidden`（403）：权限不足。
- `not_found`（404）：资源不存在。
- `method_not_allowed`（405）：方法不被允许。
- `conflict`（409）：资源冲突。
- `operation_conflict`（409）：操作冲突或状态机条件不满足。
- `gone`（410）：端点或资源已废弃。
- `precondition_failed`（412）：前置条件失败。
- `payload_too_large`（413）：请求体过大。
- `unsupported_media_type`（415）：媒体类型不支持。
- `validation_failed`（422）：字段校验失败。
- `rate_limited`（429）：达到速率限制。
- `internal_error`（500）：服务器内部错误。
- `service_unavailable`（503）：依赖服务不可用。
- `gateway_timeout`（504）：网关或下游超时。

## 鉴权与账户类
- `login_failed`（401）：登录失败。
- `token_invalid`（401）：令牌无效。
- `token_expired`（401）：令牌过期。
- `mfa_required`（401/403）：需要二次验证。

## 资源与约束类
- `duplicate_resource`（409）：唯一性冲突。
- `invalid_state`（409/422）：资源状态不满足操作条件。
- `dependency_failed`（424/409）：依赖资源失败或不可用。
- `quota_exceeded`（429/403）：配额不足。

## 上传与文件类
- `file_type_not_allowed`（415）：文件类型不允许。
- `file_too_large`（413）：文件过大。
- `file_integrity_error`（422）：文件校验失败。

## 风控与安全类
- `suspicious_activity`（403）：可疑行为拦截。
- `verification_required`（403）：需要额外校验。

---

## 场景标签与裁剪建议
| 场景标签 | 应用方式 | 默认操作 |
| -------- | -------- | -------- |
| `rest_public` | 对外接口，保持稳定错误码和友好提示 | 保留整体清单 |
| `rest_internal` | 内部接口，可将 `message` 改为技术术语 | 保留 `code`，调整 `message` |
| `async_job` | 异步任务接口，建议补充 `job_timeout` 等扩展码 | 在“扩展登记”中追加 |
| `minimal` | 仅依赖 HTTP 状态码，无自定义 `code` | 可跳过此清单 |

> steering 生成器可根据场景标签挑选或裁剪错误码。

---

## 可扩展与登记模板
- 允许定义业务域扩展错误码，但需遵循命名规范并登记。

登记格式：
```
- 错误码：<snake_case_code>
- HTTP 状态码：<number>
- 场景说明：<问题描述与触发条件>
- 首次使用接口：<方法 + 路径>
- 负责人/团队：<姓名或团队>
- 上线日期：<YYYY-MM-DD>
- 兼容/废弃计划：<暂无/预计下线时间>
- 关联文档：<链接，可选>
```

示例：
```
- 错误码：duplicate_payment
- HTTP 状态码：409
- 场景说明：重复提交相同订单
- 首次使用接口：POST /api/orders/{id}/pay
- 负责人/团队：支付服务组 @zhangsan
- 上线日期：2024-05-10
- 兼容/废弃计划：暂无
- 关联文档：支付风控设计 v2
```

---

## 版本与变更
- `REST v1.0`（当前）— 适用于 REST 接口错误码。
- 计划版本：`REST v1.1`（补充批量操作错误码）、`GraphQL v1.0`、`Internal v1.0` 等。

---

*请与《API Response Specification — REST v1.0》配套使用。*
