# WebVault 待办事项

## 数据相关

### 规范网站状态
**优先级**: 中
**状态**: 待处理
**描述**: 更新数据库中测试网站的 status 字段，确保状态值与网站实际情况一致

**具体任务**:
- 将 "已拒绝网站" (web_1759235558915_taexvc) 状态改为 `rejected`
- 将 "待审核网站 1" (web_1759235558915_f0ap6) 状态改为 `pending`
- 将 "待审核网站 2" (web_1759235558915_x35dvo) 状态改为 `pending`

**SQL 参考**:
```sql
UPDATE websites SET status = 'rejected' WHERE id = 'web_1759235558915_taexvc';
UPDATE websites SET status = 'pending' WHERE id = 'web_1759235558915_x35dvo';
UPDATE websites SET status = 'pending' WHERE id = 'web_1759235558915_f0ap6';
```

**相关文件**:
- `src/lib/db/adapters/d1.ts` - 数据库查询逻辑

---

*最后更新: 2025-10-01*
