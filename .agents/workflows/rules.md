---
description: 
---

# Antigravity 通用工程规则（Rules）

## 一、语言与输出约定

* 所有回复、说明、注释、文档 **必须使用简体中文**
* 代码中的标识符保持英文，不使用拼音
* 错误信息、日志内容允许为英文


## 二、技术默认约定

* 前端：默认使用 **React + TypeScript**
* 后端：默认使用 **Python（优先 FastAPI）**
* 若无特殊说明，均遵循以上技术选型


## 三、通用代码规范

### 命名规范

* 变量 / 函数：camelCase
* 类 / 组件：PascalCase
* 常量：UPPER_SNAKE_CASE
* 文件 / 文件夹：kebab-case

命名应语义清晰，禁止随意缩写。


### 注释规范（强制）

* 注释用于解释「为什么这样设计」，而不是代码字面含义
* 复杂逻辑、业务判断、边界条件必须写注释
* 禁止无意义注释

统一注释标记：

```ts
// TODO: 待实现功能
// FIXME: 已知问题或潜在缺陷
// NOTE: 重要设计说明
// HACK: 临时方案，后续必须重构
```

#### 函数注释规范

前端（JSDoc）：

```ts
/**
 * 获取用户信息
 * @param userId 用户 ID
 * @returns 用户数据
 */
```

后端（Python Docstring）：

```python
def get_user(user_id: str):
    """
    根据用户 ID 获取用户信息
    """
```


## 四、前端规范（React）

### 基本原则

* 使用函数组件，不使用类组件
* 单个组件只承担单一职责
* 展示逻辑与业务逻辑分离
* 可复用逻辑必须抽离为自定义 Hook


### 命名约定

* 组件名使用 PascalCase
* 文件名与组件名保持一致
* 自定义 Hook 必须以 `use` 开头

```ts
function UserCard() {}
function useUserData() {}
```


### Hooks 使用规范

* 只能在函数组件或自定义 Hook 中调用
* 不允许在条件、循环中调用
* 一个 Hook 只处理一种职责


### Props 规范

* 必须使用 TypeScript 类型定义
* 使用解构方式接收 props
* 非必传参数使用 `?`

```ts
interface UserCardProps {
  user: User
  onClick?: () => void
}
```


### 性能与结构要求

* 避免不必要的重复渲染
* 合理使用 useMemo / useCallback
* 列表渲染必须提供稳定的 key
* 大数据列表使用虚拟滚动
* 路由与组件支持懒加载


## 五、后端规范（Python）

### 基本要求

* Python ≥ 3.10
* 优先使用 FastAPI
* 所有函数与方法必须标注类型
* 禁止使用裸 `except`
* 禁止使用 `print` 作为日志方式


### 分层结构（必须遵守）

* api：请求解析与响应封装
* service：业务逻辑处理
* repository：数据库访问
* schema：请求 / 响应数据校验
* model：ORM 模型定义

禁止在 api 层直接操作数据库。


### 日志规范

* 使用 logging 模块
* 合理区分日志级别（DEBUG / INFO / WARNING / ERROR）
* 日志中不得包含敏感信息


## 六、安全规范（重点）

### 通用安全原则

* 永远不信任客户端输入
* 所有输入必须进行校验
* 敏感操作必须经过身份与权限校验


### 前端安全

* 禁止使用 dangerouslySetInnerHTML
* 防止 XSS / CSRF 攻击
* 不在前端存储敏感信息
* Token 推荐使用 HttpOnly Cookie


### 后端安全

* 使用 Pydantic 进行参数校验
* 权限校验必须在 service 层完成
* 所有密钥从环境变量中读取

```python
import os
SECRET_KEY = os.getenv("SECRET_KEY")
```

* 敏感字段返回前需脱敏
* 密码等敏感数据必须加密存储


## 七、AI 协作使用规范

* 所有自动生成的代码必须遵守本规则
* 生成结果应：

  * 结构清晰
  * 类型完整
  * 可维护
  * 安全
* 不生成不必要的复杂实现


