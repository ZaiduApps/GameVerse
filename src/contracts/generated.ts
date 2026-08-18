/**
 * 此文件由 openapi-typescript 自动生成，请勿直接修改。
 */

export interface paths {
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户名密码注册 */
        post: operations["AuthController_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户名密码登录 */
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/send-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 发送邮箱验证码 */
        post: operations["AuthController_sendEmailCode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/register-by-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 邮箱验证码注册 */
        post: operations["AuthController_registerByEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login-by-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 邮箱验证码登录 */
        post: operations["AuthController_loginByEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 修改当前用户密码 */
        post: operations["AuthController_changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/verify-email/send-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 发送当前用户邮箱认证验证码 */
        post: operations["AuthController_sendCurrentUserEmailVerificationCode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 认证当前用户邮箱 */
        post: operations["AuthController_verifyCurrentUserEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 退出登录 */
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 刷新登录令牌 */
        post: operations["AuthController_refreshToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户信息 */
        get: operations["AuthController_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/codes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户权限码 */
        get: operations["AuthController_getCodes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/public/{idOrUsername}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取用户公开主页资料 */
        get: operations["UserPublicController_getPublicProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取用户列表 */
        get: operations["UserController_findAll"];
        put?: never;
        /** 创建用户 */
        post: operations["UserController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前登录用户信息 */
        get: operations["UserController_getProfile"];
        /** 更新当前用户资料（PUT） */
        put: operations["UserController_updateProfileByPut"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新当前用户资料（PATCH） */
        patch: operations["UserController_updateProfile"];
        trace?: never;
    };
    "/users/preferences/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户通知偏好 */
        get: operations["UserController_getNotificationPreferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新当前用户通知偏好 */
        patch: operations["UserController_updateNotificationPreferences"];
        trace?: never;
    };
    "/users/preferences/game-reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户游戏评论通知偏好 */
        get: operations["UserController_getGameReviewPreferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新当前用户游戏评论通知偏好 */
        patch: operations["UserController_updateGameReviewPreferences"];
        trace?: never;
    };
    "/users/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的 API Key 列表 */
        get: operations["UserController_listApiKeys"];
        put?: never;
        /** 创建 API Key（登录用户） */
        post: operations["UserController_createApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/api-keys/{id}/secret": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查看我的 API Key 明文 */
        get: operations["UserController_revealApiKeySecret"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/api-keys/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 修改我的 API Key 状态（PUT） */
        put: operations["UserController_setApiKeyStatusByPut"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 修改我的 API Key 状态 */
        patch: operations["UserController_setApiKeyStatus"];
        trace?: never;
    };
    "/users/api-keys/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的 API Key 详情 */
        get: operations["UserController_getApiKeyDetail"];
        put?: never;
        post?: never;
        /** 吊销我的 API Key */
        delete: operations["UserController_revokeApiKey"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin API Key 列表 */
        get: operations["UserController_adminApiKeyList"];
        put?: never;
        /** Admin 创建 API Key（仅当前管理员） */
        post: operations["UserController_adminCreateApiKey"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/api-keys/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin API Key 调用统计 */
        get: operations["UserController_adminApiKeyStats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/api-keys/{id}/usage-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的 API Key 调用摘要 */
        get: operations["UserController_getApiKeyUsageSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/api-keys/{id}/usage-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的 API Key 调用日志 */
        get: operations["UserController_getApiKeyUsageLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/api-keys/{id}/secret": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin 查看 API Key 明文 */
        get: operations["UserController_adminRevealApiKeySecret"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/api-keys/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin 获取 API Key 详情 */
        get: operations["UserController_adminGetApiKeyDetail"];
        put?: never;
        post?: never;
        /** Admin 吊销 API Key */
        delete: operations["UserController_adminRevokeApiKey"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/api-keys/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin 修改 API Key 状态（PUT） */
        put: operations["UserController_adminSetApiKeyStatusByPut"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Admin 修改 API Key 状态 */
        patch: operations["UserController_adminSetApiKeyStatus"];
        trace?: never;
    };
    "/users/admin/users/{userId}/api-keys/disable-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Admin 按用户批量禁用全部活跃 API Key */
        post: operations["UserController_adminDisableAllApiKeysByUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/users/{userId}/api-keys/active-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin 获取用户活跃 API Key 数量 */
        get: operations["UserController_adminGetUserActiveApiKeyCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/admin/users/{userId}/api-keys/revoke-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Admin 按用户批量吊销全部 API Key */
        post: operations["UserController_adminRevokeAllApiKeysByUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/login-bans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取登录IP/设备封禁列表 */
        get: operations["UserController_getLoginBanList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/login-bans/ip": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 封禁登录IP */
        post: operations["UserController_banLoginIp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/login-bans/ip/{ip}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 解除登录IP封禁 */
        delete: operations["UserController_removeLoginIpBan"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/login-bans/device": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 封禁设备ID */
        post: operations["UserController_banLoginDevice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/login-bans/device/{deviceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 解除设备ID封禁 */
        delete: operations["UserController_removeLoginDeviceBan"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取用户详情 */
        get: operations["UserController_findOne"];
        /** 更新用户信息（PUT） */
        put: operations["UserController_updateByPut"];
        post?: never;
        /** 删除用户 */
        delete: operations["UserController_remove"];
        options?: never;
        head?: never;
        /** 更新用户信息（PATCH） */
        patch: operations["UserController_update"];
        trace?: never;
    };
    "/users/{id}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 禁用用户（PUT） */
        put: operations["UserController_disableUserByPut"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 禁用用户（PATCH） */
        patch: operations["UserController_disableUser"];
        trace?: never;
    };
    "/users/{id}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 启用用户（PUT） */
        put: operations["UserController_enableUserByPut"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 启用用户（PATCH） */
        patch: operations["UserController_enableUser"];
        trace?: never;
    };
    "/users/{id}/block": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 封禁账号 */
        post: operations["UserController_blockUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/unblock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 解除账号封禁 */
        post: operations["UserController_unblockUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 分配角色给用户 */
        post: operations["UserController_assignRoles"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取用户权限列表 */
        get: operations["UserController_getPermissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取角色列表 */
        get: operations["RoleController_findAll"];
        put?: never;
        /** 创建角色 */
        post: operations["RoleController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/roles/permissions/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有可用权限列表 */
        get: operations["RoleController_getAllPermissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/roles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取角色详情 */
        get: operations["RoleController_findOne"];
        /** 更新角色 */
        put: operations["RoleController_update"];
        post?: never;
        /** 删除角色 */
        delete: operations["RoleController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/home": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取首页聚合数据 */
        get: operations["HomeController_home"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/feed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 内容中心公开列表（新闻/帖子混排） */
        get: operations["ContentController_publicFeed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 内容中心公开详情 */
        get: operations["ContentController_publicDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}/view": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 公开帖子浏览上报 */
        post: operations["ContentController_publicView"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}/link-click": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 公开帖子外链点击上报 */
        post: operations["ContentController_publicLinkClick"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开评论列表（楼中楼） */
        get: operations["ContentController_publicComments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}/comments/{commentId}/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开评论定位上下文 */
        get: operations["ContentController_publicCommentContext"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/public/{id}/comments/{rootId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开评论回复分页列表（用于查看更多回复） */
        get: operations["ContentController_publicCommentReplies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{id}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 发表评论/回复（需登录） */
        post: operations["ContentController_comment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/comments/{id}/like": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 评论点赞/取消点赞（需登录） */
        post: operations["ContentController_likeComment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/comments/{id}/like-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户评论点赞状态（需登录） */
        get: operations["ContentController_commentLikeStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/comments/like-status-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 批量查询当前用户评论点赞状态（需登录） */
        post: operations["ContentController_commentLikeStatusBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{id}/like": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 点赞/取消点赞（需登录） */
        post: operations["ContentController_like"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{id}/dislike": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 点踩/取消点踩（需登录） */
        post: operations["ContentController_dislike"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{id}/like-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户点赞状态（需登录） */
        get: operations["ContentController_likeStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{id}/dislike-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户点踩状态（需登录） */
        get: operations["ContentController_dislikeStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开话题列表 */
        get: operations["ContentController_publicTopics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/public/{idOrSlug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开话题详情（支持 ID 或 slug） */
        get: operations["ContentController_publicTopicDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/suggest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 话题联想搜索（用于 # 输入） */
        get: operations["ContentController_suggestTopics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/quick-create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 快捷创建话题（需登录） */
        post: operations["ContentController_quickCreateTopic"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{id}/follow-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户话题关注状态（需登录） */
        get: operations["ContentController_topicFollowStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{id}/moderator-application": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户版主申请状态 */
        get: operations["ContentController_topicModeratorApplication"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{id}/moderator-applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 申请成为圈子版主 */
        post: operations["ContentController_applyTopicModerator"];
        /** 撤回圈子版主申请 */
        delete: operations["ContentController_withdrawTopicModerator"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{id}/follow": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 关注话题（需登录） */
        post: operations["ContentController_followTopic"];
        /** 取消关注话题（需登录） */
        delete: operations["ContentController_unfollowTopic"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/my/topics/follows": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 我的关注话题列表（需登录） */
        get: operations["ContentController_myTopicFollows"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/apps/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 用户发帖游戏快捷搜索（需登录） */
        get: operations["ContentController_searchApps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户发布帖子（需登录，自动绑定作者） */
        post: operations["ContentController_createUserPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/my/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的帖子列表（需登录） */
        get: operations["ContentController_myPosts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/my/posts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的帖子详情（需登录） */
        get: operations["ContentController_myPostDetail"];
        /** 编辑我的帖子（需登录） */
        put: operations["ContentController_updateMyPost"];
        post?: never;
        /** 删除我的帖子（需登录） */
        delete: operations["ContentController_deleteMyPost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/my/posts/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新我的帖子状态（需登录） */
        patch: operations["ContentController_setMyPostStatus"];
        trace?: never;
    };
    "/content/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台内容列表 */
        get: operations["ContentController_adminList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 后台创建内容 */
        post: operations["ContentController_adminCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 后台更新内容 */
        put: operations["ContentController_adminUpdate"];
        post?: never;
        /** 删除内容 */
        delete: operations["ContentController_adminDelete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/{id}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 审核内容 */
        patch: operations["ContentController_review"];
        trace?: never;
    };
    "/content/admin/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 上下架内容 */
        patch: operations["ContentController_status"];
        trace?: never;
    };
    "/content/admin/batch/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 批量上下架内容 */
        patch: operations["ContentController_batchStatus"];
        trace?: never;
    };
    "/content/admin/{id}/top": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置置顶 */
        patch: operations["ContentController_top"];
        trace?: never;
    };
    "/content/admin/{id}/recommend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置推荐 */
        patch: operations["ContentController_recommend"];
        trace?: never;
    };
    "/content/admin/batch/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 批量删除内容 */
        post: operations["ContentController_adminBatchDelete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/{id}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台评论列表 */
        get: operations["ContentController_adminComments"];
        put?: never;
        /** 后台发表评论/回复 */
        post: operations["ContentController_adminComment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 内容中心评论列表（支持按话题/帖子筛选） */
        get: operations["ContentController_adminAllComments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/comments/{commentId}/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 评论治理详情上下文（楼中楼链路） */
        get: operations["ContentController_adminCommentContext"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/comments/{commentId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 后台更新评论状态 */
        patch: operations["ContentController_adminCommentStatus"];
        trace?: never;
    };
    "/content/admin/comments/status-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 批量更新评论状态 */
        patch: operations["ContentController_adminBatchCommentStatus"];
        trace?: never;
    };
    "/content/admin/topics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台话题列表 */
        get: operations["ContentController_adminTopicList"];
        put?: never;
        /** 创建话题 */
        post: operations["ContentController_createTopic"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/topic-moderator-applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台版主申请列表 */
        get: operations["ContentController_adminTopicModeratorApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/topic-moderator-applications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 审核版主申请 */
        patch: operations["ContentController_reviewTopicModeratorApplication"];
        trace?: never;
    };
    "/content/admin/topics/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新话题 */
        put: operations["ContentController_updateTopic"];
        post?: never;
        /** 删除话题 */
        delete: operations["ContentController_deleteTopic"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/admin/topics/{id}/moderators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置话题版主 */
        patch: operations["ContentController_setTopicModerators"];
        trace?: never;
    };
    "/content/topics/{id}/moderation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 话题版主更新话题治理项（锁定/推荐/公告/置顶） */
        patch: operations["ContentController_moderatorUpdateTopic"];
        trace?: never;
    };
    "/content/topics/{topicId}/moderation/posts/{postId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 话题版主删除帖子 */
        delete: operations["ContentController_moderatorDeletePost"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{topicId}/moderation/posts/{postId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 话题版主上下线帖子 */
        patch: operations["ContentController_moderatorSetPostStatus"];
        trace?: never;
    };
    "/content/topics/{topicId}/moderation/comments/{commentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 话题版主删除评论 */
        delete: operations["ContentController_moderatorDeleteComment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/topics/{topicId}/moderation/comments/{commentId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 话题版主上下线评论 */
        patch: operations["ContentController_moderatorSetCommentStatus"];
        trace?: never;
    };
    "/game/reviews/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_summary[0]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_summary[1]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_summary[2]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/apps/{appId}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_appSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/pkg/{pkg}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_pkgSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/community/reply-email/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_adminSettings[0]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["GameReviewController_updateAdminSettings[0]"];
        trace?: never;
    };
    "/admin/game-reviews/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_adminSettings[1]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["GameReviewController_updateAdminSettings[1]"];
        trace?: never;
    };
    "/game/reviews/admin/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_adminSettings[2]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["GameReviewController_updateAdminSettings[2]"];
        trace?: never;
    };
    "/game/reviews/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_comments[0]"];
        put?: never;
        post: operations["GameReviewController_comment[0]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_comments[1]"];
        put?: never;
        post: operations["GameReviewController_comment[1]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_comments[2]"];
        put?: never;
        post: operations["GameReviewController_comment[2]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/apps/{appId}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_appComments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/comments/{rootId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_replies[0]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/comments/{rootId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_replies[1]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/comments/{rootId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_replies[2]"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/apps/{appId}/comments/{rootId}/replies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameReviewController_appReplies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/rating": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_rating[0]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/rating": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_rating[1]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/rating": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_rating[2]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/comments/{id}/like": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeComment[0]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/comments/{id}/like": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeComment[1]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/comments/{id}/like": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeComment[2]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reviews/comments/like-status-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeStatusBatch[0]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/review/comments/like-status-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeStatusBatch[1]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/game-reviews/comments/like-status-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["GameReviewController_likeStatusBatch[2]"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/open/content/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** API Key 发布内容（post/news，作者自动绑定当前 Key 用户） */
        post: operations["OpenContentController_createPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/open/content/my/posts/{id}/publish-at": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** API Key 修改本人内容发布时间 */
        patch: operations["OpenContentController_updateMyPostPublishAt"];
        trace?: never;
    };
    "/open/content/my/posts/batch-update-publish-at": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** API Key 批量修改本人内容发布时间 */
        post: operations["OpenContentController_batchUpdateMyPostsPublishAt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/open/content/my/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** API Key 获取当前用户发布内容列表 */
        get: operations["OpenContentController_myPosts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/open/content/my/posts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** API Key 获取当前用户内容详情（post/news） */
        get: operations["OpenContentController_myPostDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/open/content/posts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** API Key 获取内容详情（本人可见本人未公开内容，其它按公开规则） */
        get: operations["OpenContentController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/share/content/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开分享页（HTML） */
        get: operations["ShareController_shareDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取未读消息摘要 */
        get: operations["NotificationsController_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 消息列表（分页） */
        get: operations["NotificationsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 单条消息已读 */
        post: operations["NotificationsController_markRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 按分类或全部标记已读 */
        post: operations["NotificationsController_markReadAll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/sent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 我发出的消息记录（分页） */
        get: operations["NotificationsController_sent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin：消息发送目标用户列表 */
        get: operations["NotificationsController_adminUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/admin/sent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin：已发送系统消息列表 */
        get: operations["NotificationsController_adminSent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/admin/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Admin：发送系统消息（全员/单用户） */
        post: operations["NotificationsController_adminSend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin 测试接口 */
        get: operations["AdminController_getHello"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/resources/get": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询应用资源 */
        get: operations["AdminController_findAppResources"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/resources/post": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 新增或更新应用资源 */
        post: operations["AdminController_postAppResources"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/get-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 抓取 Google Play 信息 */
        get: operations["AdminController_getGooglePlayInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/get-qoo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 抓取 Qoo 信息 */
        get: operations["AdminController_getQooInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import-app/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 预览导入游戏数据（支持多渠道） */
        post: operations["AdminController_previewImportApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import-app/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 提交导入任务（异步入库） */
        post: operations["AdminController_submitImportApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import-app/google/batch-submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 批量提交 Google 导入任务（不预览） */
        post: operations["AdminController_submitGoogleImportBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import-app/google/batch-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询 Google 批量导入状态 */
        get: operations["AdminController_getGoogleImportBatchStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import-app/task-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询导入任务状态 */
        get: operations["AdminController_getImportAppTaskStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/post-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 写入单个应用抓取结果 */
        get: operations["AdminController_postGameInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/content": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 批量更新内容 */
        get: operations["AdminController_postGameInfoContent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/up/get-up-apk-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询待更新应用列表 */
        get: operations["AdminController_getAppUpdateList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/up/all-apk-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 批量执行应用更新 */
        get: operations["AdminController_AppUpdateAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/up/one-apk-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 执行单个应用更新 */
        get: operations["AdminController_AppUpdateOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tools/post-gp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 公开受控写入 Google 应用抓取结果（固定签名鉴权） */
        get: operations["AdminPublicController_postGameInfoPublic"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取游戏列表 */
        get: operations["GameController_getGames"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GameController_getAppTypes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/{id}/download-channel-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取应用特殊下载渠道开关 */
        get: operations["GameController_getDownloadChannelSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置应用特殊下载渠道 */
        patch: operations["GameController_setDownloadChannelSettings"];
        trace?: never;
    };
    "/game/download-channel-settings/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 批量设置应用特殊下载渠道 */
        patch: operations["GameController_batchSetDownloadChannelSettings"];
        trace?: never;
    };
    "/game/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新游戏信息 */
        put: operations["GameController_updateGame"];
        post?: never;
        /** Delete app (soft delete) */
        delete: operations["GameController_deleteGame"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update app online status */
        patch: operations["GameController_updateGameStatus"];
        trace?: never;
    };
    "/game/apps/refresh-media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 按来源类型刷新应用媒体资源（icon + 五图 + 视频封面） */
        post: operations["GameController_refreshAppMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/site-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取站点配置 */
        get: operations["GameController_getSiteConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取单个游戏信息 */
        get: operations["GameController_GetGameInformation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 搜索应用 */
        get: operations["GameController_searchApps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/rankings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取排行榜数据 */
        get: operations["GameController_getRankings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/gp-apk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 Google APK 数据 */
        get: operations["GameController_getGP"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/details": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取游戏详情 */
        get: operations["GameController_Info"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/getAppDownload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 获取真实下载地址 */
        post: operations["GameController_downloadInfo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/track/detail": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Track game detail page view */
        post: operations["GameController_trackDetail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/recommendedApp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取推荐应用 */
        get: operations["GameController_recommendedApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/q": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 关键字搜索游戏 */
        get: operations["GameController_searchFn"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/installed/updates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 根据本机已安装包名批量比对可更新应用 */
        post: operations["GameController_getInstalledUpdates"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reservations/follow": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 关注预约中的应用（需登录） */
        post: operations["GameController_followReservation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reservations/follow/{appId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 取消关注预约应用（需登录） */
        delete: operations["GameController_unfollowReservation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reservations/follow-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询当前用户是否已关注预约应用（需登录） */
        get: operations["GameController_reservationFollowStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/game/reservations/my": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 我的已关注预约应用列表（需登录） */
        get: operations["GameController_myReservationList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/event": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 客户端业务事件上报 */
        post: operations["TrackingController_trackClientEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 埋点概览统计 */
        get: operations["TrackingController_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/top-apps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 游戏维度统计 Top 列表 */
        get: operations["TrackingController_topApps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 渠道下载统计 */
        get: operations["TrackingController_channels"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/api-performance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 接口性能统计 */
        get: operations["TrackingController_apiPerformance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/event-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 客户端业务事件选项 */
        get: operations["TrackingController_eventOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/community-overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 社区与反馈概览统计 */
        get: operations["TrackingController_communityOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/community-trends": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 社区与反馈趋势统计 */
        get: operations["TrackingController_communityTrends"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/request-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 访问请求日志（支持搜索和分页） */
        get: operations["TrackingController_requestLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/event-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 客户端业务事件日志（支持搜索和分页） */
        get: operations["TrackingController_eventLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/recent-visitors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 最近访问者（登录用户/游客设备聚合） */
        get: operations["TrackingController_recentVisitors"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tracking/admin/rebuild-daily-stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 回填埋点日聚合统计 */
        post: operations["TrackingController_rebuildDailyStats"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 上传文件（需要 file:upload 权限） */
        post: operations["UploadController_uploadFiles"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/upload/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 公共上传（登录可用） */
        post: operations["UploadController_uploadPublicFiles"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/upload/public/transfer-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 公共上传：外链图片转存（登录可用） */
        post: operations["UploadController_transferPublicUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/faq-config/global": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取全站 FAQ 模板 */
        get: operations["FaqConfigController_getGlobal"];
        /** 保存全站 FAQ 模板 */
        put: operations["FaqConfigController_saveGlobal"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/faq-config/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询游戏 FAQ 配置 */
        get: operations["FaqConfigController_listGames"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/faq-config/games/{appId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取指定游戏 FAQ 配置 */
        get: operations["FaqConfigController_getGame"];
        /** 保存指定游戏 FAQ 配置 */
        put: operations["FaqConfigController_saveGame"];
        post?: never;
        /** 删除指定游戏 FAQ 配置 */
        delete: operations["FaqConfigController_deleteGame"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/banner": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询轮播图 */
        get: operations["BannerController_list"];
        put?: never;
        /** 创建轮播图 */
        post: operations["BannerController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/banner/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新轮播图 */
        put: operations["BannerController_update"];
        post?: never;
        /** 删除轮播图 */
        delete: operations["BannerController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/banner/active/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取轮播图详情（公开） */
        get: operations["BannerController_findById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/banner/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取启用轮播图（公开） */
        get: operations["BannerController_listActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询专辑 */
        get: operations["AlbumsController_list"];
        put?: never;
        /** 创建专辑 */
        post: operations["AlbumsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/apps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 向专辑添加应用 */
        post: operations["AlbumsController_CreateAlbum"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新专辑 */
        put: operations["AlbumsController_update"];
        post?: never;
        /** 删除专辑 */
        delete: operations["AlbumsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/apps/{album_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 从专辑移除应用 */
        delete: operations["AlbumsController_removeApps"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/actives/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取专辑详情（公开） */
        get: operations["AlbumsController_findById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/album-details/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取专辑下应用列表（公开） */
        get: operations["AlbumsController_findByIdDes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/{id}/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页获取专辑下游戏（公开） */
        get: operations["AlbumsController_listGames"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/albums/home": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取首页启用专辑（公开） */
        get: operations["AlbumsController_listActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台分页查询新闻 */
        get: operations["NewsController_adminList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建新闻 */
        post: operations["NewsController_adminCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新新闻 */
        put: operations["NewsController_adminUpdate"];
        post?: never;
        /** 删除新闻 */
        delete: operations["NewsController_adminDelete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/admin/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新新闻状态 */
        patch: operations["NewsController_setStatus"];
        trace?: never;
    };
    "/news/admin/{id}/top": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置新闻置顶 */
        patch: operations["NewsController_setTop"];
        trace?: never;
    };
    "/news/admin/{id}/recommend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置新闻推荐 */
        patch: operations["NewsController_setRecommend"];
        trace?: never;
    };
    "/news/upload-image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 上传新闻图片 */
        post: operations["NewsController_uploadImage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/active/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取新闻详情（公开） */
        get: operations["NewsController_findById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/news/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 搜索新闻（公开） */
        get: operations["NewsController_searchFn"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TagsController_health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["TagsController_audit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/cleanup/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["TagsController_cleanupPreview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/cleanup/execute": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["TagsController_cleanupExecute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/cleanup/batches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TagsController_cleanupBatches"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/admin/cleanup/{batchId}/rollback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["TagsController_rollback"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建标签 */
        post: operations["TagsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新标签 */
        put: operations["TagsController_update"];
        post?: never;
        /** 删除标签 */
        delete: operations["TagsController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/active/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取标签详情 */
        get: operations["TagsController_findById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 分页查询标签 */
        post: operations["TagsController_list"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tags/list-games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 查询标签下游戏 */
        post: operations["TagsController_AppList"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取反馈列表（管理端） */
        get: operations["FeedbacksController_findAll"];
        put?: never;
        /** 创建反馈 */
        post: operations["FeedbacksController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/public/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取公开反馈列表 */
        get: operations["FeedbacksController_findPublicList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/public/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取公开反馈详情 */
        get: operations["FeedbacksController_findPublicOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/my/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的反馈列表 */
        get: operations["FeedbacksController_findMyList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/my/{id}/detail": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取我的反馈详情（含多轮对话） */
        get: operations["FeedbacksController_findMyDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/batch/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 批量更新反馈状态 */
        put: operations["FeedbacksController_batchUpdateStatus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/batch/reply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 批量回复反馈 */
        post: operations["FeedbacksController_batchReply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/reply-templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取反馈回复常用话术 */
        get: operations["FeedbacksController_listReplyTemplates"];
        put?: never;
        /** 新增反馈回复常用话术 */
        post: operations["FeedbacksController_createReplyTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/reply-templates/{templateId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新反馈回复常用话术 */
        put: operations["FeedbacksController_updateReplyTemplate"];
        post?: never;
        /** 删除反馈回复常用话术 */
        delete: operations["FeedbacksController_removeReplyTemplate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新反馈状态 */
        put: operations["FeedbacksController_updateStatus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}/reply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理员回复反馈 */
        post: operations["FeedbacksController_reply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}/vote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 反馈点赞/同求 */
        post: operations["FeedbacksController_incrementVote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}/detail": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取反馈详情（含多轮对话） */
        get: operations["FeedbacksController_findDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户追加反馈消息 */
        post: operations["FeedbacksController_addMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedbacks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取反馈详情 */
        get: operations["FeedbacksController_findOne"];
        /** 更新反馈 */
        put: operations["FeedbacksController_update"];
        post?: never;
        /** 删除反馈 */
        delete: operations["FeedbacksController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedback-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all feedback configs */
        get: operations["FeedbackConfigController_findAll"];
        put?: never;
        /** Create feedback config */
        post: operations["FeedbackConfigController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedback-config/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List active feedback configs */
        get: operations["FeedbackConfigController_findActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedback-config/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get feedback config */
        get: operations["FeedbackConfigController_findOne"];
        /** Update feedback config */
        put: operations["FeedbackConfigController_update"];
        post?: never;
        /** Delete feedback config */
        delete: operations["FeedbackConfigController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feedback-config/{id}/toggle": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Toggle active */
        patch: operations["FeedbackConfigController_toggleActive"];
        trace?: never;
    };
    "/app_card/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建资源位配置 */
        post: operations["CardConfigController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app_card/update/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新资源位配置 */
        put: operations["CardConfigController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app_card/delete/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除资源位配置 */
        delete: operations["CardConfigController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app_card/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询资源位配置 */
        get: operations["CardConfigController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app_card/status/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新资源位状态 */
        patch: operations["CardConfigController_setStatus"];
        trace?: never;
    };
    "/app_card/grouped/{gameId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 按分组获取资源位配置（公开） */
        get: operations["CardConfigController_getGrouped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/announcements/available": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询可用公告（公开） */
        get: operations["AnnouncementsController_getAvailable"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/announcements/{id}/view": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 记录公告浏览次数（公开） */
        patch: operations["AnnouncementsController_trackView"];
        trace?: never;
    };
    "/announcements/{id}/click": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 记录公告点击次数（公开） */
        patch: operations["AnnouncementsController_trackClick"];
        trace?: never;
    };
    "/announcements/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台分页查询公告 */
        get: operations["AnnouncementsController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/announcements/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建公告 */
        post: operations["AnnouncementsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/announcements/update/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新公告 */
        put: operations["AnnouncementsController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/announcements/admin/status/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新公告状态 */
        patch: operations["AnnouncementsController_setStatus"];
        trace?: never;
    };
    "/announcements/delete/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除公告 */
        delete: operations["AnnouncementsController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建配置 */
        post: operations["SettingController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取配置信息 */
        get: operations["SettingController_getInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新配置 */
        post: operations["SettingController_update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/sites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有站点列表 */
        get: operations["SettingController_getAllSites"];
        put?: never;
        /** 创建新站点 */
        post: operations["SettingController_createSite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/sites/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除站点 */
        delete: operations["SettingController_deleteSite"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/site": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取站点配置 */
        get: operations["SettingController_getSiteConfig"];
        put?: never;
        /** 更新站点配置 */
        post: operations["SettingController_updateSiteConfig"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/site/landing-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 专题页公开配置预览与 SEO 健康检查 */
        get: operations["SettingController_getLandingPreview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/site/landing-source-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 专题页配置数据源选项（游戏/话题/帖子/文章） */
        get: operations["SettingController_getLandingSourceOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/system": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取系统配置 */
        get: operations["SettingController_getSystemConfig"];
        put?: never;
        /** 更新系统配置 */
        post: operations["SettingController_updateSystemConfig"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/admin/system/email/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 测试邮件配置 */
        post: operations["SettingController_testSystemEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/config/site/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取站点公开配置（Web 前台） */
        get: operations["SettingPublicController_getPublicSiteConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/landing-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 SEO 子站专题页配置 */
        get: operations["SitePublicController_getLandingConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resources/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询资源列表 */
        get: operations["ResourcesController_listResources"];
        put?: never;
        /** 创建资源 */
        post: operations["ResourcesController_createResource"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resources/list/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新资源 */
        put: operations["ResourcesController_updateResource"];
        post?: never;
        /** 删除资源 */
        delete: operations["ResourcesController_deleteResource"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resources/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询渠道 */
        get: operations["ResourcesController_listChannels"];
        put?: never;
        /** 创建渠道 */
        post: operations["ResourcesController_createChannel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resources/channels/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新渠道 */
        put: operations["ResourcesController_updateChannel"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resources/channels/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新渠道状态 */
        patch: operations["ResourcesController_setChannelStatus"];
        trace?: never;
    };
    "/resources/updates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询更新任务 */
        get: operations["ResourcesController_listUpdates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/articles/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台分页查询文章 */
        get: operations["ArticleController_adminList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/articles/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建文章 */
        post: operations["ArticleController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/articles/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新文章 */
        put: operations["ArticleController_update"];
        post?: never;
        /** 删除文章 */
        delete: operations["ArticleController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/articles/admin/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新文章状态 */
        patch: operations["ArticleController_setStatus"];
        trace?: never;
    };
    "/articles/admin/{id}/top": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置文章置顶 */
        patch: operations["ArticleController_setTop"];
        trace?: never;
    };
    "/articles/admin/{id}/recommend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 设置文章推荐 */
        patch: operations["ArticleController_setRecommend"];
        trace?: never;
    };
    "/client/webview-acceleration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get client WebView acceleration policy */
        get: operations["WebviewAccelerationController_getClientPolicy"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webview-acceleration/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List WebView acceleration policies */
        get: operations["WebviewAccelerationController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webview-acceleration/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one WebView acceleration policy */
        get: operations["WebviewAccelerationController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webview-acceleration/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create WebView acceleration policy */
        post: operations["WebviewAccelerationController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webview-acceleration/update/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update WebView acceleration policy */
        put: operations["WebviewAccelerationController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webview-acceleration/admin/status/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update WebView acceleration policy status */
        patch: operations["WebviewAccelerationController_setStatus"];
        trace?: never;
    };
    "/webview-acceleration/delete/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete WebView acceleration policy */
        delete: operations["WebviewAccelerationController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client/version/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 客户端版本检查（安卓） */
        get: operations["ClientVersionController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client/landing/app": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 下载落地页聚合信息（Web /download/app） */
        get: operations["ClientVersionController_landingApp"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client-version/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台版本规则列表 */
        get: operations["ClientVersionController_adminList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client-version/admin/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 后台版本规则审计日志 */
        get: operations["ClientVersionController_adminLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client-version/admin/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建版本规则 */
        post: operations["ClientVersionController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client-version/admin/update/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新版本规则 */
        put: operations["ClientVersionController_update"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/client-version/admin/status/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新规则状态 */
        patch: operations["ClientVersionController_setStatus"];
        trace?: never;
    };
    "/client-version/admin/delete/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除版本规则 */
        delete: operations["ClientVersionController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/app-releases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 版本发布列表 */
        get: operations["AdminAppReleasesController_list"];
        put?: never;
        /** 创建版本草稿 */
        post: operations["AdminAppReleasesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/app-releases/upload-apk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 上传 APK 并创建版本草稿 */
        post: operations["AdminAppReleasesController_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/app-releases/web-distribution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 Web 下载分发配置 */
        get: operations["AdminAppReleasesController_distribution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新 Web 下载分发配置 */
        patch: operations["AdminAppReleasesController_updateDistribution"];
        trace?: never;
    };
    "/admin/app-releases/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 编辑版本草稿 */
        patch: operations["AdminAppReleasesController_update"];
        trace?: never;
    };
    "/admin/app-releases/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 发布版本 */
        post: operations["AdminAppReleasesController_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/app-releases/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 归档版本 */
        post: operations["AdminAppReleasesController_archive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app/releases/distribution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取客户端公开分发信息 */
        get: operations["PublicAppReleasesController_distribution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app/releases/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取最近发布的 Android 客户端版本日志 */
        get: operations["PublicAppReleasesController_history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/app/releases/android/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 跳转到最新 Android APK */
        get: operations["PublicAppReleasesController_download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/executors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List available task executors */
        get: operations["TaskSchedulerController_listExecutors"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List scheduled tasks */
        get: operations["TaskSchedulerController_listTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/upsert": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create or update task */
        post: operations["TaskSchedulerController_upsertTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/{id}/toggle": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enable or disable task */
        post: operations["TaskSchedulerController_toggleTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/{id}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Run task now */
        post: operations["TaskSchedulerController_runTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/{id}/run-manual": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Run task manually (execute now without queue) */
        post: operations["TaskSchedulerController_runTaskManual"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/{id}/stop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Stop task scheduling and pending jobs */
        post: operations["TaskSchedulerController_stopTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List task run history */
        get: operations["TaskSchedulerController_listRuns"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get task run detail */
        get: operations["TaskSchedulerController_getRunDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/tasks/{id}/policy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新任务重试/熔断/冷却策略 */
        post: operations["TaskSchedulerController_updateTaskPolicy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/task-scheduler/admin/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取任务执行器健康与拥塞状态 */
        get: operations["TaskSchedulerController_getSchedulerHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/logs/admin/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** System log list */
        get: operations["LogsController_getSystemLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/logs/admin/operations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin operation log list */
        get: operations["LogsController_getAdminOperationLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/log-system/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 日志系统列表（默认返回定时任务日志，可按 source 切换） */
        get: operations["LogSystemController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mcp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** MCP JSON-RPC endpoint (public, read-only tools) */
        post: operations["McpController_rpc"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/mcp/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** MCP JSON-RPC endpoint for admin writable tools (X-API-Key only) */
        post: operations["McpController_adminRpc"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 AI 助手配置 */
        get: operations["AiAssistantController_getConfig"];
        put?: never;
        /** 更新 AI 助手配置 */
        post: operations["AiAssistantController_updateConfig"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 AI 运营工具列表 */
        get: operations["AiAssistantController_getTools"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/chat/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** AI 对话流式输出（SSE） */
        post: operations["AiAssistantController_chatStream"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 AI 助手任务列表 */
        get: operations["AiAssistantController_getJobs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/steps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 AI 助手任务步骤 */
        get: operations["AiAssistantController_getJobSteps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/graph": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取 AI 助手任务步骤图 */
        get: operations["AiAssistantController_getJobGraph"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 重试 AI 助手任务 */
        post: operations["AiAssistantController_retryJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 取消 AI 助手任务 */
        post: operations["AiAssistantController_cancelJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 恢复 AI 助手任务（断点续跑） */
        post: operations["AiAssistantController_resumeJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/jobs/{jobId}/rollback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 记录 AI 助手任务回滚动作 */
        post: operations["AiAssistantController_rollbackJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/ops/albums/random-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 随机选取专辑游戏（预览） */
        post: operations["AiAssistantController_previewRandomPick"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-assistant/admin/ops/albums/random-apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 随机选取并写入专辑游戏 */
        post: operations["AiAssistantController_applyRandomPick"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/seo/push": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 提交 URL 到 SEO 推送引擎（百度/IndexNow） */
        post: operations["SeoController_push"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/seo/sitemap/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取游戏 sitemap 数据（公开） */
        get: operations["SeoController_sitemapGames"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/seo/game-page": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取游戏详情页 SEO 快照（公开） */
        get: operations["SeoController_gamePage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/seo/audit/games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取游戏 SEO 质量审计数据（公开） */
        get: operations["SeoController_auditGames"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/seo/sitemap/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取公开用户主页 sitemap 数据（公开） */
        get: operations["SeoController_sitemapUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/search/global": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 全站统一搜索 */
        get: operations["SearchController_global"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/detections/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_previewDetection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/detections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ResourceUpdateController_listDetections"];
        put?: never;
        post: operations["ResourceUpdateController_createDetection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/detections/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ResourceUpdateController_getDetection"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/detections/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_cancelDetection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 资源更新子系统概览 */
        get: operations["ResourceUpdateController_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/source-policies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询 APK 更新源策略 */
        get: operations["ResourceUpdateController_sourcePolicies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/source-policies/{ingestionSource}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** 更新 APK 更新源策略 */
        put: operations["ResourceUpdateController_updateSourcePolicy"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 只读审计游戏元数据或下载来源 */
        post: operations["ResourceUpdateController_audit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/source-probe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 按 APK 更新源策略进行只读来源探测 */
        post: operations["ResourceUpdateController_sourceProbe"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询逐游戏更新作业 */
        get: operations["ResourceUpdateController_listJobs"];
        put?: never;
        /** 创建单包或小批资源更新作业 */
        post: operations["ResourceUpdateController_createJobs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/failures": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 分页查询异常更新作业 */
        get: operations["ResourceUpdateController_listFailures"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询更新作业及尝试时间线 */
        get: operations["ResourceUpdateController_getJob"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_retryJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs/batch-retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_retryJobs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs/{id}/ignore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_ignoreJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/jobs/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_cancelJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/queue/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_pauseQueue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/queue/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_resumeQueue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/workspace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ResourceUpdateController_inspectWorkspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/resource-update/admin/workspace/cleanup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ResourceUpdateController_cleanupWorkspace"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/web-games/discover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WebGamesPublicController_discover"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/web-games/import/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebGamesAdminController_preview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/web-games/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebGamesAdminController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/web-games": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WebGamesAdminController_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/web-games/{appId}/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["WebGamesAdminController_updateConfig"];
        trace?: never;
    };
    "/admin/web-games/sort": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["WebGamesAdminController_updateSort"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        RegisterDto: {
            /** @description 用户名 */
            username: string;
            /** @description 邮箱 */
            email: string;
            /** @description 密码，至少 6 位，需包含大小写和数字/特殊字符 */
            password: string;
            /** @description 昵称 */
            name?: string;
        };
        LoginDto: {
            /** @description 用户名 */
            username: string;
            /** @description 密码 */
            password: string;
            /** @description 设备 ID */
            device_id?: string;
            /** @description 设备名称 */
            device_name?: string;
        };
        SendEmailCodeDto: {
            /** @description 邮箱 */
            email: string;
            /**
             * @description 验证码用途
             * @enum {string}
             */
            type: "register" | "login" | "reset" | "verify";
        };
        RegisterByEmailDto: {
            /** @description 邮箱 */
            email: string;
            /** @description 6 位验证码 */
            code: string;
            /** @description 用户名 */
            username: string;
            /** @description 可选密码（不传则系统生成） */
            password?: string;
            /** @description 昵称 */
            name?: string;
        };
        LoginByEmailDto: {
            /** @description 邮箱 */
            email: string;
            /** @description 6 位验证码 */
            code: string;
            /** @description 设备 ID */
            device_id?: string;
            /** @description 设备名称 */
            device_name?: string;
        };
        ChangePasswordDto: {
            /** @description 旧密码 */
            oldPassword: string;
            /** @description 新密码 */
            newPassword: string;
        };
        VerifyEmailDto: {
            /** @description 6 位验证码 */
            code: string;
        };
        CreateUserDto: {
            /** @description 用户名 */
            username: string;
            /** @description 邮箱 */
            email: string;
            /** @description 密码 */
            password: string;
            /** @description 昵称 */
            name?: string;
            /** @description 头像 URL */
            avatar?: string;
            /**
             * @description 性别
             * @enum {string}
             */
            gender?: "male" | "female" | "other" | "";
            /**
             * @description 生日（ISO 日期）
             * @example 1998-01-01
             */
            birthday?: string;
            /** @description 个性签名 */
            signature?: string;
            /** @description 国家 */
            country?: string;
            /** @description 省份 */
            province?: string;
            /** @description 城市 */
            city?: string;
            /** @description 注册 IP */
            ipAddress?: string;
            /** @description 角色 ID 列表 */
            roleIds?: string[];
            /** @description 直接权限码列表 */
            permissions?: string[];
        };
        UpdateProfileDto: {
            /** @description 昵称 */
            name?: string;
            /** @description 头像 URL */
            avatar?: string;
            /**
             * @description 性别
             * @enum {string}
             */
            gender?: "male" | "female" | "other" | "";
            /**
             * @description 生日（ISO 日期）
             * @example 1998-01-01
             */
            birthday?: string;
            /** @description 个性签名 */
            signature?: string;
            /** @description 国家 */
            country?: string;
            /** @description 省份 */
            province?: string;
            /** @description 城市 */
            city?: string;
        };
        UpdateNotificationPreferencesDto: {
            /** @description 回复与系统消息邮件提醒 */
            notification_email_enabled?: boolean;
            /** @description 回复邮件提醒，兼容旧前端字段 */
            reply_email_enabled?: boolean;
        };
        UserApiKeyCreateDto: {
            /**
             * @description 密钥名称
             * @example 内容发布机器人
             */
            name: string;
            /**
             * @description 过期时间（ISO），不传或传 null 表示永久有效
             * @example 2026-06-10T08:00:00.000Z
             */
            expires_at?: Record<string, never> | null;
            /**
             * @description 权限范围，默认包含 content:write 与 mcp:admin
             * @example [
             *       "content:write",
             *       "mcp:admin"
             *     ]
             */
            scopes?: string[];
            /**
             * @description 密钥类型，默认 content_user
             * @example content_user
             * @enum {string}
             */
            key_type?:
                | "content_user"
                | "admin_agent"
                | "integration"
                | "legacy";
            /**
             * @description 能力列表，默认由 key_type 决定
             * @example [
             *       "content:write",
             *       "content:read"
             *     ]
             */
            capabilities?: string[];
        };
        UserApiKeyStatusDto: {
            /**
             * @description 密钥状态
             * @example disabled
             * @enum {string}
             */
            status: "active" | "disabled";
        };
        UserApiKeyBatchActionDto: {
            /**
             * @description 批量操作原因
             * @example 疑似异常流量，先禁用排查
             */
            reason?: string;
        };
        BanLoginIpDto: {
            /** @description IP 地址 */
            ip: string;
            /** @description 封禁原因 */
            reason?: string;
        };
        BanLoginDeviceDto: {
            /** @description 设备 ID */
            deviceId: string;
            /** @description 封禁原因 */
            reason?: string;
        };
        UpdateUserDto: {
            /** @description 邮箱 */
            email?: string;
            /** @description 昵称 */
            name?: string;
            /** @description 头像 URL */
            avatar?: string;
            /**
             * @description 性别
             * @enum {string}
             */
            gender?: "male" | "female" | "other" | "";
            /**
             * @description 生日（ISO 日期）
             * @example 1998-01-01
             */
            birthday?: string;
            /** @description 个性签名 */
            signature?: string;
            /** @description 国家 */
            country?: string;
            /** @description 省份 */
            province?: string;
            /** @description 城市 */
            city?: string;
            /** @description 是否启用 */
            isActive?: boolean;
            /** @description 角色 ID 列表 */
            roleIds?: string[];
            /** @description 直接权限码列表 */
            permissions?: string[];
            /** @description 新密码 */
            password?: string;
        };
        BlockUserDto: {
            /** @description 封禁原因 */
            reason: string;
        };
        CreateRoleDto: {
            /**
             * @description 角色名称
             * @example 内容编辑
             */
            name: string;
            /**
             * @description 角色代码（唯一标识）
             * @example content_editor
             */
            code: string;
            /**
             * @description 角色描述
             * @example 负责文章和新闻的编辑发布
             */
            description?: string;
            /**
             * @description 权限列表
             * @example [
             *       "article:read",
             *       "article:create",
             *       "article:update"
             *     ]
             */
            permissions: string[];
            /**
             * @description 是否为默认角色（新用户自动分配）
             * @default false
             */
            isDefault: boolean;
        };
        UpdateRoleDto: {
            /**
             * @description 角色名称
             * @example 内容编辑
             */
            name?: string;
            /**
             * @description 角色描述
             * @example 负责文章和新闻的编辑发布
             */
            description?: string;
            /**
             * @description 权限列表
             * @example [
             *       "article:read",
             *       "article:create",
             *       "article:update"
             *     ]
             */
            permissions?: string[];
            /** @description 是否激活 */
            isActive?: boolean;
        };
        ContentListDataDto: {
            /** @example [] */
            list: {
                [key: string]: unknown;
            }[];
            /** @example 0 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            pageSize: number;
            /** @example false */
            hasMore: boolean;
            /** @example null */
            nextPage: Record<string, never> | null;
        };
        ContentDetailDataDto: {
            /** @example post_id */
            _id: string;
            /** @example 标题 */
            title: string;
            /** @example {} */
            extra: {
                [key: string]: unknown;
            };
        };
        ContentCommentSubmitDataDto: {
            /** @example comment_id */
            _id: string;
        };
        ContentCommentPayloadDto: {
            /**
             * @description 评论内容
             * @example 这篇内容很有帮助
             */
            content: string;
            /** @description 父评论 ID（回复时传） */
            parent_id?: string;
        };
        ContentLikeDataDto: {
            /** @example true */
            liked: boolean;
            /** @example 1 */
            like_count: number;
        };
        ContentLikePayloadDto: {
            /**
             * @description 点赞动作，默认 toggle
             * @example toggle
             * @enum {string}
             */
            action?: "like" | "unlike" | "toggle";
        };
        ContentLikeStatusDataDto: {
            /** @example true */
            liked: boolean;
        };
        ContentCommentLikeStatusBatchDto: {
            /**
             * @description 评论 ID 列表（最大 200 条）
             * @example [
             *       "682f0f0f0f0f0f0f0f0f0f01",
             *       "682f0f0f0f0f0f0f0f0f0f02"
             *     ]
             */
            ids: string[];
        };
        ContentPostReactionDataDto: {
            /** @example true */
            liked: boolean;
            /** @example 1 */
            like_count: number;
            /** @example false */
            disliked: boolean;
            /** @example 0 */
            dislike_count: number;
        };
        ContentDislikeStatusDataDto: {
            /** @example true */
            disliked: boolean;
        };
        ContentSearchAppsDataDto: {
            /**
             * @example [
             *       {
             *         "_id": "app_id",
             *         "name": "游戏名",
             *         "pkg": "com.demo.app",
             *         "icon": ""
             *       }
             *     ]
             */
            list: {
                [key: string]: unknown;
            }[];
        };
        ContentPublishPostDataDto: {
            /** @example post_id */
            _id: string;
            /** @example pending */
            review_status: string;
            /** @example 0 */
            status: number;
        };
        ContentAdminSetCommentStatusDto: {
            /**
             * @description 评论状态
             * @example 1
             * @enum {number}
             */
            status: 0 | 1;
            /**
             * @description 处理原因（可选）
             * @example 命中社区规则，先隐藏待复核
             */
            reason?: string;
        };
        ContentAdminBatchSetCommentStatusDto: {
            /** @description 评论 ID 列表（最大 200 条） */
            ids: string[];
            /**
             * @description 目标状态
             * @example 0
             * @enum {number}
             */
            status: 0 | 1;
            /**
             * @description 批量处理原因（可选）
             * @example 批量清理违规评论
             */
            reason?: string;
        };
        ContentCommentModerationReasonDto: {
            /**
             * @description 处理原因（可选）
             * @example 含广告引流信息
             */
            reason?: string;
        };
        OpenContentLinkDto: {
            /**
             * @description 链接标题
             * @example 官网
             */
            title: string;
            /**
             * @description 链接地址
             * @example https://apks.cc
             */
            url: string;
        };
        OpenContentCreatePostDto: {
            /**
             * @description 内容类型
             * @example post
             * @enum {string}
             */
            post_type?: "post" | "news";
            /**
             * @description 标题，可选
             * @example 今日更新进度
             */
            title?: string;
            /**
             * @description 摘要
             * @example 更新了活动奖励
             */
            summary?: string;
            /**
             * @description 正文（Markdown）
             * @example 正文内容
             */
            content: string;
            /** @description 正文 HTML（可选） */
            content_html?: string;
            /** @description 封面图 URL */
            cover?: string;
            /** @description 媒体 URL 列表 */
            media_urls?: string[];
            /** @description 扩展链接 */
            addition_links?: components["schemas"]["OpenContentLinkDto"][];
            /** @description 关联游戏 ID */
            app_id?: string;
            /** @description 主话题 ID */
            topic_id?: string;
            /** @description 多话题 ID 列表 */
            topic_ids?: string[];
            /** @description 标签 */
            tags?: string[];
            /**
             * @description 发布时间（可选）
             * @example 2026-05-10T10:00:00.000Z
             */
            publish_at?: string;
        };
        OpenContentUpdatePublishAtDto: {
            /**
             * @description 新的发布时间，必须为 ISO-8601 时间
             * @example 2024-10-15T09:02:41.901Z
             */
            publish_at: string;
        };
        OpenContentBatchUpdatePublishAtItemDto: {
            /**
             * @description 内容 ID
             * @example 6a26e84659d289afdccbc14c
             */
            post_id: string;
            /**
             * @description 新的发布时间，必须为 ISO-8601 时间
             * @example 2024-10-15T09:02:41.901Z
             */
            publish_at: string;
        };
        OpenContentBatchUpdatePublishAtDto: {
            /** @description 批量发布时间更新任务，单次最多 500 条 */
            items: components["schemas"]["OpenContentBatchUpdatePublishAtItemDto"][];
        };
        NotificationUnreadByCategoryDto: {
            /** @example 0 */
            system: number;
            /** @example 0 */
            reply: number;
            /** @example 0 */
            like: number;
        };
        NotificationSummaryDataDto: {
            /** @example 0 */
            total_unread: number;
            unread_by_category: components["schemas"]["NotificationUnreadByCategoryDto"];
        };
        NotificationItemDto: {
            /** @example 67f000000000000000000101 */
            _id: string;
            /** @example system */
            category: string;
            /** @example 版本更新通知 */
            title: string;
            /** @example 3.2.0 版本已发布 */
            content: string;
            /** @example false */
            is_read: boolean;
            /** @example 2026-03-13T10:10:00.000Z */
            created_at: string;
        };
        NotificationListDataDto: {
            list: components["schemas"]["NotificationItemDto"][];
            /** @example 0 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            pageSize: number;
        };
        NotificationActionResultDataDto: {
            /** @example true */
            success: boolean;
        };
        NotificationAdminUserItemDto: {
            /** @example 67f000000000000000000001 */
            _id: string;
            /** @example user001 */
            username: string;
            /** @example Zhang San */
            name: string;
            /** @example user001@example.com */
            email: string;
            /** @example  */
            avatar: string;
            /** @example true */
            isActive: boolean;
            /** @example false */
            isBlocked: boolean;
        };
        NotificationAdminUsersDataDto: {
            list: components["schemas"]["NotificationAdminUserItemDto"][];
            /** @example 1 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            pageSize: number;
        };
        NotificationSentLogItemDto: {
            /** @example 67f000000000000000000301 */
            _id: string;
            /** @example 管理员 */
            sender_name: string;
            /** @example all */
            mode: string;
            /** @example 版本更新通知 */
            title: string;
            /** @example 3.2.0 版本已发布 */
            content: string;
            /** @example 1024 */
            recipient_count: number;
            /** @example [] */
            recipient_ids: string[];
            /** @example true */
            send_in_app: boolean;
            /** @example false */
            send_email: boolean;
            /** @example system_message_all */
            email_template_key: string;
            /** @example 0 */
            email_sent_count: number;
            /** @example 0 */
            email_failed_count: number;
            /** @example 0 */
            email_skipped_count: number;
            /** @example 2026-03-13T10:10:00.000Z */
            created_at: string;
        };
        NotificationSentLogsDataDto: {
            list: components["schemas"]["NotificationSentLogItemDto"][];
            /** @example 1 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            pageSize: number;
        };
        NotificationAdminSendDataDto: {
            /** @example true */
            success: boolean;
            /** @example single */
            mode: string;
            /** @example 1 */
            recipient_count: number;
            /**
             * @example [
             *       "67f000000000000000000001"
             *     ]
             */
            recipient_ids: string[];
            /** @example true */
            send_in_app: boolean;
            /** @example false */
            send_email: boolean;
            /** @example 0 */
            email_sent_count: number;
            /** @example 0 */
            email_failed_count: number;
            /** @example 0 */
            email_skipped_count: number;
        };
        SendSystemNotificationDto: {
            /**
             * @description 发送模式：single=单用户，all=全员
             * @default single
             * @enum {string}
             */
            mode: "single" | "all";
            /**
             * @description 单用户发送时必填，目标用户 ID
             * @example 67f000000000000000000001
             */
            user_id?: string;
            /** @description 消息标题 */
            title: string;
            /** @description 消息内容 */
            content?: string;
            /** @description 封面图 URL */
            cover?: string;
            /** @description 目标类型（如 post/app/url） */
            target_type?: string;
            /** @description 目标 ID（如帖子ID、应用ID） */
            target_id?: string;
            /** @description 跳转 URL */
            target_url?: string;
            /** @description 去重键（可选，单用户场景建议传） */
            dedupe_key?: string;
            /**
             * @description 是否发送站内消息，默认 true
             * @default true
             */
            send_in_app: boolean;
            /** @description 是否发送邮件（若不传则按系统配置策略） */
            send_email?: boolean;
            /** @description 邮件模板 key（可选，未传则按场景默认） */
            email_template_key?: string;
        };
        BatchDownloadChannelSettingDto: Record<string, never>;
        UpdateDownloadChannelSettingDto: Record<string, never>;
        UpdateGameStatusDto: Record<string, never>;
        RefreshAppMediaDto: Record<string, never>;
        CreateDownloadInfoDto: Record<string, never>;
        TrackGameDetailDto: Record<string, never>;
        InstalledUpdatesDto: Record<string, never>;
        FollowReservationDto: Record<string, never>;
        TrackClientEventDto: {
            /**
             * @description 客户端事件名
             * @example link_click
             * @enum {string}
             */
            event_name?:
                | "client_action"
                | "screen_view"
                | "search_submit"
                | "link_click"
                | "webview_action"
                | "route_decision"
                | "accel_hit"
                | "external_open"
                | "fail_reason"
                | "game_detail_view"
                | "download_click"
                | "download_url_issued"
                | "splash_ad_impression"
                | "splash_ad_click"
                | "splash_ad_skip"
                | "download_task_pause"
                | "download_task_resume"
                | "download_task_retry"
                | "download_task_delete"
                | "download_file_open"
                | "download_file_missing"
                | "install_click"
                | "install_submitted"
                | "install_success"
                | "install_failed"
                | "install_cancelled";
            /**
             * @description 客户端生成的幂等事件 ID
             * @example evt-m3abc-xyz
             */
            event_id?: string;
            /**
             * @description 客户端事件发生时间（ISO 8601）
             * @example 2026-06-05T12:00:00.000Z
             */
            occurred_at?: string;
            /** @description 应用 ID */
            app_id?: string;
            /** @description 应用包名 */
            pkg?: string;
            /** @description 资源 ID */
            resource_id?: string;
            /** @description 下载渠道 ID */
            channel_id?: string;
            /** @description 下载渠道编码 */
            channel_code?: string;
            /** @description 下载渠道名称 */
            channel_name?: string;
            /**
             * @description 事件属性，建议只传关键动作上下文
             * @example {
             *       "source": "android",
             *       "decision": "webview"
             *     }
             */
            props?: Record<string, never>;
        };
        UploadDto: {
            /**
             * @description 上传场景
             * @example image
             */
            scene?: string;
            /**
             * @description 指定上传渠道ID（可选）
             * @example s3_1743000000000_ab12cd
             */
            channel_id?: string;
            /**
             * @description 指定上传渠道类型（可选）
             * @example s3
             * @enum {string}
             */
            channel_type?: "s3" | "image_hosting";
            /**
             * @description 临时渠道配置 JSON（用于测试上传，不落库）。传入后可不传 channel_id
             * @example {"r2_account_id":"xxx","r2_access_key_id":"xxx","r2_secret_access_key":"xxx","r2_bucket_name":"xxx","r2_public_domain":"https://cdn.example.com","r2_custom_path":"uploads"}
             */
            channel_config?: string;
        };
        UploadResponseDto: {
            /**
             * @description 上传成功的文件 URL 列表
             * @example [
             *       "https://cdn.example.com/uploads/avatar.png"
             *     ]
             */
            urls: string[];
            /**
             * @description 上传成功的文件数量
             * @example 1
             */
            count: number;
            /**
             * @description 存储类型
             * @example s3
             */
            storage_type: string;
        };
        UploadTransferDto: {
            /**
             * @description 上传场景
             * @example image
             */
            scene?: string;
            /**
             * @description 指定上传渠道ID（可选）
             * @example s3_1743000000000_ab12cd
             */
            channel_id?: string;
            /**
             * @description 指定上传渠道类型（可选）
             * @example s3
             * @enum {string}
             */
            channel_type?: "s3" | "image_hosting";
            /**
             * @description 临时渠道配置 JSON（用于测试上传，不落库）。传入后可不传 channel_id
             * @example {"r2_account_id":"xxx","r2_access_key_id":"xxx","r2_secret_access_key":"xxx","r2_bucket_name":"xxx","r2_public_domain":"https://cdn.example.com","r2_custom_path":"uploads"}
             */
            channel_config?: string;
            /**
             * @description 需要转存的图片 URL
             * @example https://example.com/image.png
             */
            url: string;
        };
        SaveFaqConfigDto: Record<string, never>;
        CreateFeedbackDto: {
            /**
             * @description 反馈类型
             * @enum {string}
             */
            type: "missing" | "update" | "broken" | "suggestion";
            /** @description 标题 */
            title: string;
            /** @description 详细描述 */
            description: string;
            /** @description 关联目标资源 ID */
            target_id?: string;
            /** @description 用户 ID（兼容历史调用） */
            user_id?: string;
            /** @description 用户昵称 */
            nickname?: string;
            /** @description 联系方式 */
            contact?: string;
            /**
             * @description 客户端类型
             * @enum {string}
             */
            clientType?: "Web" | "iOS" | "Android" | "Desktop";
            /** @description 客户端版本 */
            clientVersion?: string;
            /** @description 操作系统版本 */
            osVersion?: string;
            /** @description 设备型号 */
            deviceModel?: string;
            /** @description IP 地址 */
            ipAddress?: string;
            /** @description User Agent */
            userAgent?: string;
            /** @description 截图 URL 数组 */
            images?: string[];
            /** @description 参考链接 */
            ref_url?: string;
        };
        Object: Record<string, never>;
        BatchFeedbackStatusDto: {
            /** @description 反馈 ID 列表 */
            ids: string[];
            /**
             * @description 处理状态：0-待处理 1-处理中 2-已完成 -1-已忽略
             * @enum {number}
             */
            status: 0 | 1 | 2 | -1;
        };
        BatchFeedbackReplyDto: {
            /** @description 管理员回复内容 */
            admin_note: string;
            /**
             * @description 回复后设置的处理状态：0-待处理 1-处理中 2-已完成 -1-已忽略
             * @enum {number}
             */
            status?: 0 | 1 | 2 | -1;
            /** @description 是否发送邮件通知用户 */
            send_email?: boolean;
            /** @description 邮件模板 Key */
            template_key?: string;
            /** @description 自定义邮件主题 */
            subject?: string;
            /** @description 反馈 ID 列表 */
            ids: string[];
        };
        CreateFeedbackReplyTemplateDto: {
            /** @description 话术名称 */
            name: string;
            /** @description 回复内容 */
            content: string;
            /** @description 邮件主题 */
            subject?: string;
            /** @description 排序值 */
            sort?: number;
            /** @description 是否启用 */
            isActive?: boolean;
        };
        UpdateFeedbackReplyTemplateDto: {
            /** @description 话术名称 */
            name?: string;
            /** @description 回复内容 */
            content?: string;
            /** @description 邮件主题 */
            subject?: string;
            /** @description 排序值 */
            sort?: number;
            /** @description 是否启用 */
            isActive?: boolean;
        };
        UpdateFeedbackStatusDto: {
            /**
             * @description 处理状态：0-待处理 1-处理中 2-已完成 -1-已忽略
             * @enum {number}
             */
            status: 0 | 1 | 2 | -1;
        };
        ReplyFeedbackDto: {
            /** @description 管理员回复内容 */
            admin_note: string;
            /**
             * @description 回复后设置的处理状态：0-待处理 1-处理中 2-已完成 -1-已忽略
             * @enum {number}
             */
            status?: 0 | 1 | 2 | -1;
            /** @description 是否发送邮件通知用户 */
            send_email?: boolean;
            /** @description 邮件模板 Key */
            template_key?: string;
            /** @description 自定义邮件主题 */
            subject?: string;
        };
        AddFeedbackMessageDto: {
            /** @description 消息内容 */
            content: string;
            /** @description 消息附图 URL 数组 */
            images?: string[];
        };
        UpdateFeedbackDto: {
            /** @description 标题 */
            title?: string;
            /** @description 详细描述 */
            description?: string;
            /**
             * @description 处理状态
             * @enum {number}
             */
            status?: 0 | 1 | 2 | -1;
            /** @description 管理员回复备注（历史字段） */
            admin_note?: string;
            /** @description 热度统计 */
            vote_count?: number;
        };
        CreateFeedbackConfigDto: {
            /**
             * @description 反馈类型代码（唯一标识）
             * @example missing
             */
            code: string;
            /**
             * @description 反馈类型名称
             * @example 缺失资源
             */
            name: string;
            /** @description 反馈类型描述 */
            description?: string;
            /** @description 图标 */
            icon?: string;
            /**
             * @description 排序权重
             * @default 0
             */
            sort: number;
            /**
             * @description 是否启用
             * @default true
             */
            isActive: boolean;
            /** @description 帮助中心 URL */
            helpUrl?: string;
            /** @description 占位符文本 */
            placeholder?: string;
            /**
             * @description 是否必填目标资源 ID
             * @default false
             */
            requireTargetId: boolean;
        };
        UpdateFeedbackConfigDto: {
            /** @description 反馈类型名称 */
            name?: string;
            /** @description 反馈类型描述 */
            description?: string;
            /** @description 图标 */
            icon?: string;
            /** @description 排序权重 */
            sort?: number;
            /** @description 是否启用 */
            isActive?: boolean;
            /** @description 帮助中心 URL */
            helpUrl?: string;
            /** @description 占位符文本 */
            placeholder?: string;
            /** @description 是否必填目标资源 ID */
            requireTargetId?: boolean;
        };
        SettingCreateDataDto: {
            /** @example main */
            key: string;
            /** @example 67f000000000000000000001 */
            _id: string;
        };
        SettingSiteConfigDataDto: {
            /** @example main */
            key: string;
            /** @example {} */
            basic: {
                [key: string]: unknown;
            };
            /** @example {} */
            system: {
                [key: string]: unknown;
            };
        };
        SettingModifiedDataDto: {
            /** @example true */
            modified: boolean;
        };
        SettingKeyDto: {
            /** @example main */
            key: string;
        };
        SettingDeletedDataDto: {
            /** @example true */
            deleted: boolean;
        };
        TestSystemEmailDto: Record<string, never>;
        SettingPublicSiteConfigDataDto: {
            /** @example main */
            key: string;
            /** @example {} */
            basic: {
                [key: string]: unknown;
            };
            /** @example {} */
            header: {
                [key: string]: unknown;
            };
            /** @example {} */
            seo: {
                [key: string]: unknown;
            };
            /** @example {} */
            app_seo: {
                [key: string]: unknown;
            };
            /** @example {} */
            footer: {
                [key: string]: unknown;
            };
            /** @example [] */
            friend_links: {
                [key: string]: unknown;
            }[];
            /** @example [] */
            quick_links: {
                [key: string]: unknown;
            }[];
            /** @example {} */
            static_pages: {
                [key: string]: unknown;
            };
            /** @example true */
            is_active: boolean;
            /** @example false */
            is_maintenance: boolean;
        };
        CreateClientVersionDto: Record<string, never>;
        CreateAppReleaseDto: Record<string, never>;
        UpdateDistributionDto: Record<string, never>;
        UpdateAppReleaseDto: Record<string, never>;
        UpsertTaskBodyDto: {
            /** @description 任务ID（更新时传） */
            id?: string;
            /**
             * @description 任务执行器 key
             * @example admin.content.update
             * @enum {string}
             */
            task_key?:
                | "system.daily-log"
                | "tracking.daily-rollup"
                | "tracking.daily-rollup-yesterday"
                | "admin.post-gp"
                | "admin.content.update"
                | "admin.update.all-gp"
                | "admin.update.one-gp"
                | "admin.get-gp"
                | "admin.get-qoo"
                | "admin.resource.audit"
                | "system.task-run-log-retention";
            /** @description 任务名称 */
            name?: string;
            /** @description 任务说明 */
            description?: string;
            /**
             * @description cron 表达式，5位
             * @example 0 10,13,19 * * *
             */
            cron?: string;
            /**
             * @description 时区
             * @example Asia/Shanghai
             */
            timezone?: string;
            /**
             * @description 执行参数
             * @example {
             *       "mode": "text",
             *       "type": "GP"
             *     }
             */
            payload?: Record<string, never>;
            /**
             * @description 启用状态
             * @default true
             */
            enabled: boolean;
            /**
             * @description 失败重试次数
             * @default 1
             */
            attempts: number;
            /**
             * @description 超时毫秒
             * @default 0
             */
            timeout_ms: number;
        };
        RunTaskBodyDto: {
            /**
             * @description 触发类型
             * @enum {string}
             */
            trigger_type?: "manual" | "schedule";
            /**
             * @description 本次覆盖参数（可选）
             * @example {
             *       "pkg": "com.tencent.ig"
             *     }
             */
            payload_override?: Record<string, never>;
        };
        UpdateTaskPolicyBodyDto: {
            /**
             * @description 最大重试次数
             * @example 3
             */
            max_retry?: number;
            /**
             * @description 退避策略
             * @example linear
             * @enum {string}
             */
            backoff?: "none" | "fixed" | "linear" | "exponential";
            /**
             * @description 是否启用熔断器
             * @example true
             */
            circuit_breaker?: boolean;
            /**
             * @description 冷却时长毫秒
             * @example 60000
             */
            cooldown_ms?: number;
            /**
             * @description 自动禁用阈值
             * @example 5
             */
            auto_disable_threshold?: number;
        };
        SystemLogItemDto: {
            /** @example combined-123-2026-03-22T10:30:08.000Z */
            id: string;
            /**
             * @example combined
             * @enum {string}
             */
            source:
                | "combined"
                | "error"
                | "tracking"
                | "import"
                | "task_scheduler"
                | "upload";
            /** @example 2026-03-22T10:30:08.348Z */
            timestamp: string;
            /** @example warn */
            level: string;
            /** @example AllExceptionsFilter */
            context: string;
            /** @example Unauthorized */
            message: string;
            /** @example req-mn1iuknw-3td6lvp30r */
            request_id: string;
            /** @example /notifications/summary */
            path: string;
            /** @example GET */
            method: string;
            /** @example 6972244ef772558bc8e0f5e6 */
            user_id: string;
            /** @example admin_user */
            user_name: string;
            /** @example 127.0.0.1 */
            ip: string;
            /** @example CN/Beijing/Beijing */
            ip_region: string;
            /**
             * @example {
             *       "statusCode": 401,
             *       "errorCode": 401
             *     }
             */
            payload: {
                [key: string]: unknown;
            };
        };
        SystemLogListDataDto: {
            list: components["schemas"]["SystemLogItemDto"][];
            /** @example 120 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 50 */
            pageSize: number;
            /** @example false */
            realtime: boolean;
            /** @example 2026-03-22T10:30:08.348Z */
            next_cursor: string;
        };
        AdminOperationLogItemDto: {
            /** @example 67e8bc3ef772558bc8e0f5e7 */
            id: string;
            /** @example 67e8bc3ef772558bc8e0f5e7 */
            _id: string;
            /** @example 67e8bc3ef772558bc8e0f5e6 */
            operator_id: string;
            /** @example admin_user */
            operator_username: string;
            /** @example Administrator */
            operator_name: string;
            /**
             * @example [
             *       "super_admin"
             *     ]
             */
            role_codes: string[];
            /**
             * @example [
             *       "log:read",
             *       "content:update"
             *     ]
             */
            permission_codes: string[];
            /** @example GET */
            method: string;
            /** @example /roles?page=1&limit=20 */
            path: string;
            /** @example /roles */
            route: string;
            /** @example 403 */
            status_code: number;
            /** @example 36 */
            duration_ms: number;
            /** @example 127.0.0.1 */
            ip: string;
            /** @example Mozilla/5.0 */
            user_agent: string;
            /** @example req-mn1iuknw-3td6lvp30r */
            request_id: string;
            /**
             * @example {
             *       "page": 1,
             *       "limit": 20
             *     }
             */
            query: {
                [key: string]: unknown;
            };
            /** @example {} */
            params: {
                [key: string]: unknown;
            };
            /** @example {} */
            body: {
                [key: string]: unknown;
            };
            /**
             * @example {
             *       "code": 403,
             *       "message": "用户不存在"
             *     }
             */
            response: {
                [key: string]: unknown;
            };
            /** @example 用户不存在 */
            error_message: string;
            /** @example false */
            success: boolean;
            /** @example 2026-03-22T10:30:08.348Z */
            created_at: string;
            /** @example 2026-03-22T10:30:08.348Z */
            updated_at: string;
        };
        AdminOperationLogListDataDto: {
            list: components["schemas"]["AdminOperationLogItemDto"][];
            /** @example 42 */
            total: number;
            /** @example 1 */
            page: number;
            /** @example 20 */
            pageSize: number;
        };
        AiChatMessageDto: {
            /**
             * @description 角色
             * @enum {string}
             */
            role: "system" | "user" | "assistant";
            /** @description 消息内容 */
            content: string;
        };
        AiChatStreamDto: {
            /** @description 会话消息列表，不传则仅使用 prompt */
            messages?: components["schemas"]["AiChatMessageDto"][];
            /** @description 单条输入内容（便捷模式） */
            prompt?: string;
            /** @description 模型ID，不传则使用默认/选中模型 */
            model_id?: string;
            /** @description 会话ID（用于任务追踪） */
            conversation_id?: string;
            /** @description 温度参数 */
            temperature?: number;
            /** @description 最大tokens */
            max_tokens?: number;
        };
        AlbumRandomPickPreviewDto: {
            /** @description 专辑ID */
            album_id: string;
            /**
             * @description 随机数量
             * @default 10
             */
            count: number;
            /**
             * @description 来源类型过滤，例如 GP
             * @example GP
             */
            source_type?: string;
            /**
             * @description 状态过滤（0预约，1正常，2下线）
             * @example 1
             */
            status?: number;
            /**
             * @description 是否排除已在专辑中的应用
             * @default true
             */
            exclude_existing: boolean;
        };
        AlbumRandomPickApplyDto: {
            /** @description 专辑ID */
            album_id: string;
            /**
             * @description 随机数量
             * @default 10
             */
            count: number;
            /**
             * @description 来源类型过滤，例如 GP
             * @example GP
             */
            source_type?: string;
            /**
             * @description 状态过滤（0预约，1正常，2下线）
             * @example 1
             */
            status?: number;
            /**
             * @description 是否排除已在专辑中的应用
             * @default true
             */
            exclude_existing: boolean;
            /**
             * @description true=追加到原列表，false=覆盖专辑列表
             * @default true
             */
            append_mode: boolean;
        };
        GlobalSearchItemDto: {
            /** @example 67f000000000000000000001 */
            id: string;
            /** @example PUBG MOBILE */
            title: string;
            /**
             * @example game
             * @enum {string}
             */
            type: "game" | "article" | "post" | "topic";
            /** @example 游戏 */
            category: string;
            /** @example https://example.com/image.png */
            imageUrl: string;
            /** @example 热门多人竞技手游 */
            subtitle?: string;
            /** @example /app/com.tencent.ig */
            href?: string;
            /** @example com.tencent.ig */
            pkg?: string;
            /** @example 国际服 */
            region?: string;
            /** @example 4.8 */
            rating?: number;
        };
        GlobalSearchSectionDto: {
            list: components["schemas"]["GlobalSearchItemDto"][];
            /** @example 0 */
            total: number;
        };
        GlobalSearchDataDto: {
            /** @example pubg */
            q: string;
            /** @example 6 */
            limitPerType: number;
            /** @example 12 */
            total: number;
            games: components["schemas"]["GlobalSearchSectionDto"];
            articles: components["schemas"]["GlobalSearchSectionDto"];
            posts: components["schemas"]["GlobalSearchSectionDto"];
            topics: components["schemas"]["GlobalSearchSectionDto"];
        };
        WebGameImportPreviewDto: Record<string, never>;
        WebGameImportDto: Record<string, never>;
        WebGameConfigDto: Record<string, never>;
        WebGameSortDto: Record<string, never>;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AuthController_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 注册成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 用户名或邮箱已存在 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            /** @description 登录成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 用户名或密码错误 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_sendEmailCode: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendEmailCodeDto"];
            };
        };
        responses: {
            /** @description 验证码已发送 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 发送过于频繁或邮箱不存在 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_registerByEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterByEmailDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 注册成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 验证码错误或已过期 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 用户名或邮箱已存在 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_loginByEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginByEmailDto"];
            };
        };
        responses: {
            /** @description 登录成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 验证码错误或已过期 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 用户不存在或账号已被禁用 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordDto"];
            };
        };
        responses: {
            /** @description 密码修改成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_sendCurrentUserEmailVerificationCode: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 验证码已发送 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_verifyCurrentUserEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyEmailDto"];
            };
        };
        responses: {
            /** @description 邮箱认证成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 退出成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_refreshToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 刷新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_getCodes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserPublicController_getPublicProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 用户 ID 或用户名 */
                idOrUsername: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    UserController_findAll: {
        parameters: {
            query?: {
                /** @description 搜索关键词（用户名/邮箱/昵称） */
                search?: string;
                /** @description 是否启用 */
                isActive?: boolean;
                /** @description 是否封禁 */
                isBlocked?: boolean;
                /** @description 角色代码 */
                role?: string;
                /** @description 性别 */
                gender?: "male" | "female" | "other" | "";
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                limit?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_updateProfileByPut: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getNotificationPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_updateNotificationPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateNotificationPreferencesDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getGameReviewPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_updateGameReviewPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateNotificationPreferencesDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_listApiKeys: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_createApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyCreateDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_revealApiKeySecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_setApiKeyStatusByPut: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_setApiKeyStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getApiKeyDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_revokeApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminApiKeyList: {
        parameters: {
            query?: {
                /** @description 关键词（用户ID/密钥名/前缀） */
                keyword?: string;
                /** @description 状态筛选 */
                status?: "active" | "disabled" | "revoked";
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                pageSize?: string;
                /** @description 密钥类型 */
                key_type?:
                    | "content_user"
                    | "admin_agent"
                    | "integration"
                    | "legacy";
                /** @description 风险等级 */
                risk_level?: "low" | "medium" | "high";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminCreateApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyCreateDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminApiKeyStats: {
        parameters: {
            query?: {
                /** @description 开始时间（ISO） */
                from?: string;
                /** @description 结束时间（ISO） */
                to?: string;
                /** @description 用户ID */
                user_id?: string;
                /** @description 密钥ID */
                api_key_id?: string;
                /** @description 接口路径 */
                path?: string;
                /** @description 幂等键 */
                idempotency_key?: string;
                /** @description 是否重放 */
                is_replay?: "true" | "false";
                /** @description 错误码 */
                error_code?: string;
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getApiKeyUsageSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getApiKeyUsageLogs: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                pageSize?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminRevealApiKeySecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminGetApiKeyDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminRevokeApiKey: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminSetApiKeyStatusByPut: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminSetApiKeyStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyStatusDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminDisableAllApiKeysByUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyBatchActionDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminGetUserActiveApiKeyCount: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_adminRevokeAllApiKeysByUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserApiKeyBatchActionDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getLoginBanList: {
        parameters: {
            query?: {
                /** @description 封禁类型 */
                type?: "ip" | "device";
                /** @description 关键词（IP/设备ID） */
                keyword?: string;
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                limit?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_banLoginIp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BanLoginIpDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_removeLoginIpBan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ip: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_banLoginDevice: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BanLoginDeviceDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_removeLoginDeviceBan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deviceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 用户 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_updateByPut: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_disableUserByPut: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_disableUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_enableUserByPut: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_enableUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_blockUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BlockUserDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_unblockUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_assignRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UserController_getPermissions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_findAll: {
        parameters: {
            query?: {
                /** @description 搜索关键词 */
                search?: string;
                /** @description 是否激活 */
                isActive?: boolean;
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 返回角色列表 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRoleDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 角色创建成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 角色代码已存在 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_getAllPermissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 返回权限列表 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 角色ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 返回角色详情 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 角色不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 角色ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRoleDto"];
            };
        };
        responses: {
            /** @description 角色更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 角色不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    RoleController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 角色ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 角色删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 不能删除系统内置角色或有用户使用的角色 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 角色不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    HomeController_home: {
        parameters: {
            query?: {
                /** @description 动态内容条数，默认 8，最大 20 */
                dynamic_count?: string;
                /** @description 首页资讯条数，默认 6，最大 12 */
                news_count?: string;
                /** @description 平台规则过滤，如 android/web/ios */
                platform?: string;
                /** @description 地区规则过滤 */
                region?: string;
                /** @description 客户端版本，用于公告 min/max_version 规则 */
                client_version?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取首页聚合数据成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_publicFeed: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
                /** @description 内容类型：news/post */
                post_type?: string;
                /** @description 话题 ID */
                topic_id?: string;
                /** @description 应用 ID */
                app_id?: string;
                /** @description 关键词 */
                q?: string;
                /** @description 排序方式：latest/hot/latest_reply */
                sort?: string;
                /** @description 视图模式：card（精简卡片，不含 content/content_html）/full（完整内容，默认） */
                view?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentListDataDto"];
                    };
                };
            };
        };
    };
    ContentController_publicDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentDetailDataDto"];
                    };
                };
            };
        };
    };
    ContentController_publicView: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 上报成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_publicLinkClick: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 上报成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_publicComments: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                /** @description 每条根评论返回的回复数量，默认 20，最大 50 */
                replyPageSize?: string;
                sort: string;
            };
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentListDataDto"];
                    };
                };
            };
        };
    };
    ContentController_publicCommentContext: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
                /** @description 评论 ID */
                commentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_publicCommentReplies: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 100 */
                pageSize?: string;
                /** @description 排序：latest/hot */
                sort?: string;
            };
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
                /** @description 根评论 ID */
                rootId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_comment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentPayloadDto"];
            };
        };
        responses: {
            /** @description 提交成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentCommentSubmitDataDto"];
                    };
                };
            };
        };
    };
    ContentController_likeComment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 评论 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            /** @description 操作成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentLikeDataDto"];
                    };
                };
            };
        };
    };
    ContentController_commentLikeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 评论 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentLikeStatusDataDto"];
                    };
                };
            };
        };
    };
    ContentController_commentLikeStatusBatch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentLikeStatusBatchDto"];
            };
        };
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_like: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            /** @description 操作成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentLikeDataDto"];
                    };
                };
            };
        };
    };
    ContentController_dislike: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            /** @description 操作成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentPostReactionDataDto"];
                    };
                };
            };
        };
    };
    ContentController_likeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentLikeStatusDataDto"];
                    };
                };
            };
        };
    };
    ContentController_dislikeStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentDislikeStatusDataDto"];
                    };
                };
            };
        };
    };
    ContentController_publicTopics: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                q: string;
                type: string;
                app_id: string;
                is_official: string;
                sort: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentListDataDto"];
                    };
                };
            };
        };
    };
    ContentController_publicTopicDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID 或 slug */
                idOrSlug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_suggestTopics: {
        parameters: {
            query?: {
                /** @description 关键词 */
                q?: string;
                /** @description 数量，默认 10 */
                limit?: string;
                /** @description 绑定游戏 ID */
                app_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_quickCreateTopic: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_topicFollowStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_topicModeratorApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContentController_applyTopicModerator: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContentController_withdrawTopicModerator: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContentController_followTopic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 关注成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_unfollowTopic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 取消成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_myTopicFollows: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_searchApps: {
        parameters: {
            query: {
                /** @description 关键词（游戏名/包名） */
                q: string;
                /** @description 返回数量，默认 10，最大 30 */
                limit?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentSearchAppsDataDto"];
                    };
                };
            };
        };
    };
    ContentController_createUserPost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建成功（进入待审核） */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["ContentPublishPostDataDto"];
                    };
                };
            };
        };
    };
    ContentController_myPosts: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: string;
                /** @description 每页数量 */
                pageSize?: string;
                /** @description 审核状态：draft/pending/published/rejected */
                review_status?: string;
                /** @description 上下线状态：0/1 */
                status?: string;
                /** @description 关键词 */
                q?: string;
                /** @description 排序：latest/likes/comments */
                sort?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_myPostDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 帖子 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_updateMyPost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 帖子 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_deleteMyPost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 帖子 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_setMyPostStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 帖子 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminList: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                /** @description 内容类型：news/post */
                post_type?: string;
                /** @description 审核状态：draft/pending/published/rejected */
                review_status?: string;
                /** @description 上下线状态：0/1 */
                status?: string;
                /** @description 是否置顶：true/false */
                is_top?: string;
                /** @description 是否推荐：true/false */
                is_recommended?: string;
                /** @description 关联游戏 ID */
                app_id?: string;
                /** @description 关联游戏包名，支持模糊匹配 */
                pkg?: string;
                /** @description 关联话题 ID */
                topic_id?: string;
                /** @description 内容关键词 */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminCreate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminUpdate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminDelete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 审核成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_batchStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_top: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_recommend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminBatchDelete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminComments: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                status: string;
            };
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminComment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentPayloadDto"];
            };
        };
        responses: {
            /** @description 提交成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminAllComments: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: number;
                /** @description 每页条数（最大 100） */
                pageSize?: number;
                /** @description 评论状态 */
                status?: 0 | 1;
                /** @description 话题 ID */
                topic_id?: string;
                /** @description 帖子 ID */
                post_id?: string;
                /** @description 评论关键词 */
                keyword?: string;
                /** @description 用户关键词（昵称/ID） */
                user_keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminCommentContext: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 评论 ID */
                commentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminCommentStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 评论 ID */
                commentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentAdminSetCommentStatusDto"];
            };
        };
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminBatchCommentStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentAdminBatchSetCommentStatusDto"];
            };
        };
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminTopicList: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                q: string;
                type: string;
                status: string;
                app_id: string;
                sort: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_createTopic: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_adminTopicModeratorApplications: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                topic_id: string;
                status: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContentController_reviewTopicModeratorApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContentController_updateTopic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_deleteTopic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_setTopicModerators: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_moderatorUpdateTopic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 话题 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_moderatorDeletePost: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topicId: string;
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_moderatorSetPostStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topicId: string;
                postId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_moderatorDeleteComment: {
        parameters: {
            query: {
                reason: string;
            };
            header?: never;
            path: {
                topicId: string;
                commentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentModerationReasonDto"];
            };
        };
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ContentController_moderatorSetCommentStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topicId: string;
                commentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentAdminSetCommentStatusDto"];
            };
        };
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    "GameReviewController_summary[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_summary[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_summary[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameReviewController_appSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameReviewController_pkgSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                pkg: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_adminSettings[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_updateAdminSettings[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_adminSettings[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_updateAdminSettings[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_adminSettings[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_updateAdminSettings[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comments[0]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                replyPageSize: string;
                sort: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comment[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comments[1]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                replyPageSize: string;
                sort: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comment[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comments[2]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                replyPageSize: string;
                sort: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_comment[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameReviewController_appComments: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                replyPageSize: string;
                sort: string;
            };
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_replies[0]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                sort: string;
            };
            header?: never;
            path: {
                rootId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_replies[1]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                sort: string;
            };
            header?: never;
            path: {
                rootId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_replies[2]": {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                sort: string;
            };
            header?: never;
            path: {
                rootId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameReviewController_appReplies: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                sort: string;
            };
            header?: never;
            path: {
                appId: string;
                rootId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_rating[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_rating[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_rating[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeComment[0]": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeComment[1]": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeComment[2]": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentLikePayloadDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeStatusBatch[0]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentLikeStatusBatchDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeStatusBatch[1]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentLikeStatusBatchDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    "GameReviewController_likeStatusBatch[2]": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentCommentLikeStatusBatchDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_createPost: {
        parameters: {
            query?: never;
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
                "idempotency-key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenContentCreatePostDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_updateMyPostPublishAt: {
        parameters: {
            query?: never;
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
                "idempotency-key": string;
            };
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenContentUpdatePublishAtDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_batchUpdateMyPostsPublishAt: {
        parameters: {
            query?: never;
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
                "idempotency-key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenContentBatchUpdatePublishAtDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_myPosts: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: number;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: number;
                /** @description 内容类型：post/news，不传默认全部 */
                post_type?: "post" | "news";
                /** @description 审核状态：draft/pending/published/rejected */
                review_status?: "draft" | "pending" | "published" | "rejected";
                /** @description 上下线状态：0/1 */
                status?: 0 | 1;
                /** @description 关键词 */
                q?: string;
            };
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_myPostDetail: {
        parameters: {
            query?: never;
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
            };
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OpenContentController_detail: {
        parameters: {
            query?: never;
            header: {
                /** @description 幂等键：同 key + 同请求体返回首次结果，同 key + 不同请求体返回 409 */
                "Idempotency-Key": string;
                /** @description 用户在个人资料中创建的 API Key */
                "X-API-Key": string;
            };
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ShareController_shareDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 内容 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 返回可直接渲染的分享页 HTML */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
            /** @description 内容不存在或已下线，返回 404 HTML 页面 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationSummaryDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_list: {
        parameters: {
            query?: {
                /** @description system/reply/like，不传则全部 */
                category?: string;
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationListDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_markRead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationActionResultDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_markReadAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationActionResultDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_sent: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationListDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_adminUsers: {
        parameters: {
            query?: {
                /** @description 关键词（用户名/昵称/邮箱） */
                keyword?: string;
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationAdminUsersDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_adminSent: {
        parameters: {
            query?: {
                /** @description 标题/内容/发送人关键词 */
                keyword?: string;
                /** @description single/all */
                mode?: "single" | "all";
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationSentLogsDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    NotificationsController_adminSend: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendSystemNotificationDto"];
            };
        };
        responses: {
            /** @description 发送成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["NotificationAdminSendDataDto"];
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权限访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    AdminController_getHello: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_findAppResources: {
        parameters: {
            query: {
                id: string;
                pkg: string;
                type: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询应用资源成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_postAppResources: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 保存资源成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_getGooglePlayInfo: {
        parameters: {
            query: {
                /** @description 应用包名 */
                pkg: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 抓取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_getQooInfo: {
        parameters: {
            query?: {
                /** @description Qoo 详情页 URL */
                url?: string;
                /** @description 兼容旧参数 */
                pkg?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 抓取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_previewImportApp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 预览成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_submitImportApp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 提交成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_submitGoogleImportBatch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 提交成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_getGoogleImportBatchStatus: {
        parameters: {
            query: {
                /** @description 批次 ID */
                batch_id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_getImportAppTaskStatus: {
        parameters: {
            query: {
                /** @description 任务 ID */
                job_id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_postGameInfo: {
        parameters: {
            query: {
                pkg: string;
                v: boolean;
                img: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 写入成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_postGameInfoContent: {
        parameters: {
            query: {
                pkg: string;
                mode: string;
                page: number;
                pageSize: number;
                type: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 批量更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_getAppUpdateList: {
        parameters: {
            query: {
                page: number;
                pageSize: number;
                pkg: string;
                is_hot: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询待更新应用列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_AppUpdateAll: {
        parameters: {
            query: {
                pkg: string;
                is_hot: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 批量更新触发成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminController_AppUpdateOne: {
        parameters: {
            query: {
                pkg: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 单个更新触发成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminPublicController_postGameInfoPublic: {
        parameters: {
            query: {
                /** @description 应用包名 */
                pkg: string;
                /** @description 是否开启版本校验（默认 false） */
                v?: boolean;
                /** @description 是否更新媒体资源（默认 false） */
                img?: boolean;
                /** @description 固定签名，可用 query 或 x-signature 请求头传入 */
                signature?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 写入成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getGames: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取游戏列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getAppTypes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameController_getDownloadChannelSettings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameController_setDownloadChannelSettings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDownloadChannelSettingDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameController_batchSetDownloadChannelSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchDownloadChannelSettingDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GameController_updateGame: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 游戏ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新游戏信息成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_deleteGame: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 游戏ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Delete app success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_updateGameStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateGameStatusDto"];
            };
        };
        responses: {
            /** @description Update app online status success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_refreshAppMedia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshAppMediaDto"];
            };
        };
        responses: {
            /** @description 刷新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getSiteConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取站点配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_GetGameInformation: {
        parameters: {
            query?: {
                /** @description 包名 */
                pkg?: string;
                /** @description 资源ID */
                id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取游戏信息成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_searchApps: {
        parameters: {
            query: {
                pkg: string;
                q: string;
                status: string;
                source_type: string;
                type: string;
                types: string;
                is_hot: string;
                page: string;
                pageSize: string;
                sortBy: string;
                sortOrder: string;
                date_field: string;
                date_from: string;
                date_to: string;
                fields: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 搜索应用成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getRankings: {
        parameters: {
            query?: {
                /** @description 按标签过滤（可选） */
                tag?: unknown;
                /** @description 每个榜单数量，默认 10，最大 50 */
                limit?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取排行榜成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getGP: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_Info: {
        parameters: {
            query: {
                /** @description 包名或ID */
                param: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取游戏详情成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_downloadInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDownloadInfoDto"];
            };
        };
        responses: {
            /** @description 获取下载地址成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_trackDetail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrackGameDetailDto"];
            };
        };
        responses: {
            /** @description Tracked */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_recommendedApplications: {
        parameters: {
            query: {
                /** @description 包名或ID */
                param: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取推荐应用成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_searchFn: {
        parameters: {
            query: {
                q: string;
                page: number;
                pageSize: number;
                type: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 搜索成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_getInstalledUpdates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InstalledUpdatesDto"];
            };
        };
        responses: {
            /** @description 比对成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_followReservation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FollowReservationDto"];
            };
        };
        responses: {
            /** @description 关注成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_unfollowReservation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 取消成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_reservationFollowStatus: {
        parameters: {
            query: {
                /** @description 应用 ID */
                app_id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    GameController_myReservationList: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页数量，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TrackingController_trackClientEvent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrackClientEventDto"];
            };
        };
        responses: {
            /** @description 上报成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_overview: {
        parameters: {
            query?: {
                /** @description 开始日期 YYYY-MM-DD */
                date_from?: string;
                /** @description 结束日期 YYYY-MM-DD */
                date_to?: string;
                /** @description 平台 web/android */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_topApps: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_channels: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_apiPerformance: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_eventOptions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_communityOverview: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_communityTrends: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 应用 ID */
                app_id?: string;
                /** @description 渠道 ID */
                channel_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_requestLogs: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                pageSize?: number;
                /** @description 关键词（路径、消息等） */
                keyword?: string;
                /** @description 用户 ID */
                user_id?: string;
                /** @description 设备 ID */
                device_id?: string;
                /** @description IP 地址 */
                ip?: string;
                /** @description 请求路径 */
                path?: string;
                /** @description HTTP 方法 */
                method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
                /** @description 状态码 */
                status_code?: number;
                /** @description 登录类型 */
                login_type?: "all" | "login" | "guest";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_eventLogs: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 事件名 */
                event_name?: string;
                /** @description 事件 ID */
                event_id?: string;
                /** @description 会话 ID */
                session_id?: string;
                /** @description 应用 ID */
                app_id?: string;
                /** @description 应用包名 */
                pkg?: string;
                /** @description 渠道 ID */
                channel_id?: string;
                /** @description 渠道编码 */
                channel_code?: string;
                /** @description 设备 ID */
                device_id?: string;
                /** @description 用户 ID */
                user_id?: string;
                /** @description IP 地址 */
                ip?: string;
                /** @description 事件来源（props.source） */
                source?: string;
                /** @description 动作（props.action） */
                action?: string;
                /** @description 结果（props.result） */
                result?: string;
                /** @description 文件缺失标记结果（props.markResult） */
                mark_result?: string;
                /** @description 阶段（props.stage） */
                stage?: string;
                /** @description 原因（props.reason） */
                reason?: string;
                /** @description 业务错误码（props.code） */
                code?: string;
                /** @description 系统错误码（props.errorCode） */
                error_code?: string;
                /** @description 任务 ID（props.taskId） */
                task_id?: string;
                /** @description 模块（props.module） */
                module?: string;
                /** @description Tab 标识（props.tab） */
                tab?: string;
                /** @description 目标类型（props.target_type） */
                target_type?: string;
                /** @description 目标 ID（props.target_id） */
                target_id?: string;
                /** @description WebView 动作码（props.elementName / data-acbox-action） */
                element_name?: string;
                /** @description 关键词（事件、包名、渠道、属性等） */
                keyword?: string;
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_recentVisitors: {
        parameters: {
            query?: {
                /** @description 开始日期（YYYY-MM-DD） */
                date_from?: string;
                /** @description 结束日期（YYYY-MM-DD） */
                date_to?: string;
                /** @description 平台 */
                platform?: "web" | "android";
                /** @description 返回条数 */
                limit?: number;
                /** @description 关键词（用户昵称/设备等） */
                keyword?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    TrackingController_rebuildDailyStats: {
        parameters: {
            query?: {
                /** @description 开始日期 YYYY-MM-DD */
                date_from?: string;
                /** @description 结束日期 YYYY-MM-DD */
                date_to?: string;
                /** @description 未传 date_from/date_to 时向前回填天数，最大 31 */
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 回填完成 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
            /** @description 未登录或登录态失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 无权访问该接口 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    UploadController_uploadFiles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["UploadDto"];
            };
        };
        responses: {
            /** @description 上传成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponseDto"];
                };
            };
            /** @description 参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未授权 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 请求过于频繁 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UploadController_uploadPublicFiles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["UploadDto"];
            };
        };
        responses: {
            /** @description 上传成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponseDto"];
                };
            };
            /** @description 参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未授权 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 请求过于频繁 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UploadController_transferPublicUrl: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UploadTransferDto"];
            };
        };
        responses: {
            /** @description 转存成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponseDto"];
                };
            };
            /** @description 参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未授权 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 请求过于频繁 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_getGlobal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_saveGlobal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveFaqConfigDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_listGames: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_getGame: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_saveGame: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveFaqConfigDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FaqConfigController_deleteGame: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BannerController_list: {
        parameters: {
            query?: {
                /** @description 应用ID */
                app_id?: string;
                /** @description 是否启用 */
                is_active?: boolean;
                page?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取轮播图列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    BannerController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建轮播图成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    BannerController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 轮播图ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新轮播图成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    BannerController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 轮播图ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除轮播图成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    BannerController_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 轮播图ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取轮播图成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    BannerController_listActive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取启用轮播图成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_list: {
        parameters: {
            query?: {
                /** @description 是否首页展示 */
                is_home?: boolean;
                /** @description 是否启用 */
                is_active?: boolean;
                page?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取专辑列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建专辑成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_CreateAlbum: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 添加应用成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 专辑ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新专辑成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 专辑ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除专辑成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_removeApps: {
        parameters: {
            query: {
                /** @description 应用包名 */
                pkg: string;
            };
            header?: never;
            path: {
                /** @description 专辑ID */
                album_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 移除应用成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 专辑ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取专辑详情成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_findByIdDes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 专辑ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取专辑应用成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_listGames: {
        parameters: {
            query?: {
                page?: string;
                pageSize?: string;
            };
            header?: never;
            path: {
                /** @description 专辑ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取专辑游戏成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AlbumsController_listActive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取首页专辑成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_adminList: {
        parameters: {
            query: {
                q: string;
                status: string;
                is_top: string;
                is_recommended: string;
                source: string;
                author: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询新闻列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_adminCreate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建新闻成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_adminUpdate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新新闻成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_adminDelete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除新闻成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新状态成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_setTop: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置置顶成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_setRecommend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置推荐成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_uploadImage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 上传图片成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 新闻ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取新闻详情成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    NewsController_searchFn: {
        parameters: {
            query: {
                q: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 搜索新闻成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_audit: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_cleanupPreview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_cleanupExecute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_cleanupBatches: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_rollback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                batchId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TagsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建标签成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 标签ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新标签成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 标签ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除标签成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 标签ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取标签详情成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询标签列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TagsController_AppList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询标签下游戏成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    FeedbacksController_findAll: {
        parameters: {
            query?: {
                /** @description 反馈类型 */
                type?: "missing" | "update" | "broken" | "suggestion";
                /** @description 处理状态 */
                status?: 0 | 1 | 2 | -1;
                /** @description 关联目标资源 ID */
                target_id?: string;
                /** @description 用户 ID */
                user_id?: string;
                /** @description 用户关键词（匹配用户ID/昵称/联系方式） */
                user_keyword?: string;
                /** @description 搜索关键词（标题、描述） */
                search?: string;
                /** @description 页码 */
                page?: components["schemas"]["Object"];
                /** @description 每页数量 */
                limit?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFeedbackDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description 反馈创建成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 未登录 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findPublicList: {
        parameters: {
            query?: {
                /** @description 反馈类型 */
                type?: "missing" | "update" | "broken" | "suggestion";
                /** @description 处理状态 */
                status?: 0 | 1 | 2 | -1;
                /** @description 关联目标资源 ID */
                target_id?: string;
                /** @description 用户 ID */
                user_id?: string;
                /** @description 用户关键词（匹配用户ID/昵称/联系方式） */
                user_keyword?: string;
                /** @description 搜索关键词（标题、描述） */
                search?: string;
                /** @description 页码 */
                page?: components["schemas"]["Object"];
                /** @description 每页数量 */
                limit?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findPublicOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findMyList: {
        parameters: {
            query?: {
                /** @description 反馈类型 */
                type?: "missing" | "update" | "broken" | "suggestion";
                /** @description 处理状态 */
                status?: 0 | 1 | 2 | -1;
                /** @description 关联目标资源 ID */
                target_id?: string;
                /** @description 用户 ID */
                user_id?: string;
                /** @description 用户关键词（匹配用户ID/昵称/联系方式） */
                user_keyword?: string;
                /** @description 搜索关键词（标题、描述） */
                search?: string;
                /** @description 页码 */
                page?: components["schemas"]["Object"];
                /** @description 每页数量 */
                limit?: components["schemas"]["Object"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findMyDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 无权限访问 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_batchUpdateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchFeedbackStatusDto"];
            };
        };
        responses: {
            /** @description 批量状态更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_batchReply: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchFeedbackReplyDto"];
            };
        };
        responses: {
            /** @description 批量回复成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_listReplyTemplates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_createReplyTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFeedbackReplyTemplateDto"];
            };
        };
        responses: {
            /** @description 标准成功响应示例 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_updateReplyTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeedbackReplyTemplateDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_removeReplyTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeedbackStatusDto"];
            };
        };
        responses: {
            /** @description 状态更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_reply: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplyFeedbackDto"];
            };
        };
        responses: {
            /** @description 回复成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_incrementVote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 操作成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_addMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddFeedbackMessageDto"];
            };
        };
        responses: {
            /** @description 追加成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 无权限操作此反馈 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeedbackDto"];
            };
        };
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbacksController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 反馈 ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 反馈不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    FeedbackConfigController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFeedbackConfigDto"];
            };
        };
        responses: {
            /** @description Standard success response example */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Duplicate code */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_findActive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Config id or code */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Config id or code */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateFeedbackConfigDto"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Config id or code */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FeedbackConfigController_toggleActive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Config id or code */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CardConfigController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建资源位配置成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    CardConfigController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 配置ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新资源位配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    CardConfigController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 配置ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除资源位配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    CardConfigController_list: {
        parameters: {
            query: {
                q: string;
                scope: string;
                target_id: string;
                target_pkg: string;
                position: string;
                status: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询资源位配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    CardConfigController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 配置ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新资源位状态成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    CardConfigController_getGrouped: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 游戏ID */
                gameId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取分组配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_getAvailable: {
        parameters: {
            query: {
                /** @description 展示位置 */
                position: string;
                /** @description 平台 */
                platform?: string;
                /** @description 地区 */
                region?: string;
                /** @description 客户端版本（用于 min/max_version 规则） */
                client_version?: string;
                /** @description 是否包含 global 位置公告 */
                include_global?: string;
                /** @description 目标ID */
                targetId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询可用公告成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_trackView: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 公告ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 记录浏览成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_trackClick: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 公告ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 记录点击成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_list: {
        parameters: {
            query?: {
                /** @description 标题/摘要/内容关键词 */
                q?: string;
                /** @description 公告类型 */
                type?: string;
                /** @description 展示位置 */
                position?: string;
                /** @description 状态 true/false */
                is_active?: string;
                /** @description 目标游戏ID（精确） */
                target_id?: string;
                /** @description 目标游戏关键词（游戏名/包名） */
                target_keyword?: string;
                /** @description 页码，默认 1 */
                page?: string;
                /** @description 每页条数，默认 20，最大 100 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询公告列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建公告成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 公告ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新公告成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 公告ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新状态成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AnnouncementsController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 公告ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除公告成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SettingController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建配置成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingCreateDataDto"];
                    };
                };
            };
        };
    };
    SettingController_getInfo: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取配置信息成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingSiteConfigDataDto"];
                    };
                };
            };
        };
    };
    SettingController_update: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingModifiedDataDto"];
                    };
                };
            };
        };
    };
    SettingController_getAllSites: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取站点列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingSiteConfigDataDto"][];
                    };
                };
            };
        };
    };
    SettingController_createSite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建站点成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingKeyDto"];
                    };
                };
            };
        };
    };
    SettingController_deleteSite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除站点成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingDeletedDataDto"];
                    };
                };
            };
        };
    };
    SettingController_getSiteConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取站点配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingSiteConfigDataDto"];
                    };
                };
            };
        };
    };
    SettingController_updateSiteConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新站点配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingModifiedDataDto"];
                    };
                };
            };
        };
    };
    SettingController_getLandingPreview: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取预览成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SettingController_getLandingSourceOptions: {
        parameters: {
            query: {
                /** @description apps/topics/posts/articles */
                type: string;
                /** @description 搜索关键词 */
                q?: string;
                /** @description 关联游戏 ID */
                app_id?: string;
                /** @description 按 ID 定向回填，支持逗号分隔 */
                ids?: string;
                /** @description 关联话题 ID */
                topic_id?: string;
                /** @description 返回条数，默认 20，最大 50 */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SettingController_getSystemConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取系统配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SettingController_updateSystemConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新系统配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingModifiedDataDto"];
                    };
                };
            };
        };
    };
    SettingController_testSystemEmail: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TestSystemEmailDto"];
            };
        };
        responses: {
            /** @description 测试邮件发送成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SettingPublicController_getPublicSiteConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取站点公开配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SettingPublicSiteConfigDataDto"];
                    };
                };
            };
        };
    };
    SitePublicController_getLandingConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_listResources: {
        parameters: {
            query: {
                id: string;
                pkg: string;
                q: string;
                type: string;
                channel_id: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询资源列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_createResource: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建资源成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_updateResource: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 资源ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新资源成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_deleteResource: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 资源ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除资源成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_listChannels: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
                is_active: string;
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询渠道列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_createChannel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建渠道成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_updateChannel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 渠道ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新渠道成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_setChannelStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 渠道ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新渠道状态成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ResourcesController_listUpdates: {
        parameters: {
            query: {
                pkg: string;
                version_date: string;
                is_hot: string;
                source_type: string;
                status: string;
                scope: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询更新任务成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_adminList: {
        parameters: {
            query: {
                q: string;
                status: string;
                is_top: string;
                is_recommended: string;
                app_id: string;
                pkg: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询文章列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 创建文章成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 文章ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新文章成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 文章ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除文章成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 文章ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新状态成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_setTop: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 文章ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置置顶成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ArticleController_setRecommend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 文章ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 设置推荐成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_getClientPolicy: {
        parameters: {
            query?: {
                /** @description Site name */
                site_name?: string;
                /** @description Specific strategy id; if provided, takes precedence */
                strategy_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_list: {
        parameters: {
            query?: {
                /** @description Keyword in name/description */
                q?: string;
                /** @description Site name */
                siteName?: string;
                /** @description true/false */
                isActive?: string;
                /** @description Page number */
                page?: string;
                /** @description Page size */
                pageSize?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Policy id */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Policy id */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Policy id */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Status updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    WebviewAccelerationController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Policy id */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_check: {
        parameters: {
            query?: {
                /** @description 地区编码 */
                region?: unknown;
                /** @description 用户ID（灰度命中兜底） */
                user_id?: unknown;
                /** @description 设备ID（灰度命中） */
                device_id?: unknown;
                /** @description 当前版本码 */
                current_version_code?: unknown;
                /** @description 当前版本号，如 1.0.3 */
                current_version?: unknown;
                /** @description 应用包名 */
                pkg?: unknown;
                /** @description 渠道，如 official/googleplay */
                channel?: unknown;
                /** @description 平台，默认 android */
                platform?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 版本检查成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_landingApp: {
        parameters: {
            query?: {
                /** @description 地区编码 */
                region?: unknown;
                /** @description 用户ID（灰度命中兜底） */
                user_id?: unknown;
                /** @description 设备ID（灰度命中） */
                device_id?: unknown;
                /** @description 包名（可选） */
                pkg?: unknown;
                /** @description 渠道，默认 official */
                channel?: unknown;
                /** @description 平台，默认 android */
                platform?: unknown;
                /** @description 站点标识，默认 main */
                key?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_adminList: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_adminLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateClientVersionDto"];
            };
        };
        responses: {
            /** @description 创建成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 规则ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateClientVersionDto"];
            };
        };
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 规则ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    ClientVersionController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 规则ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 删除成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AdminAppReleasesController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAppReleaseDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_distribution: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_updateDistribution: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDistributionDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAppReleaseDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminAppReleasesController_archive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicAppReleasesController_distribution: {
        parameters: {
            query: {
                channel: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicAppReleasesController_history: {
        parameters: {
            query?: {
                limit?: unknown;
                pkg?: unknown;
                platform?: unknown;
                channel?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicAppReleasesController_download: {
        parameters: {
            query: {
                channel: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TaskSchedulerController_listExecutors: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_listTasks: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                pageSize?: number;
                /** @description 任务类型 key */
                task_key?: string;
                /** @description 任务名称关键词 */
                keyword?: string;
                /** @description 是否启用 */
                enabled?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_upsertTask: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertTaskBodyDto"];
            };
        };
        responses: {
            /** @description Saved */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_toggleTask: {
        parameters: {
            query: {
                enabled: boolean;
            };
            header?: never;
            path: {
                /** @description Task ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_runTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Task ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunTaskBodyDto"];
            };
        };
        responses: {
            /** @description Triggered */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_runTaskManual: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Task ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunTaskBodyDto"];
            };
        };
        responses: {
            /** @description Executed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_stopTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Task ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Stopped */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_listRuns: {
        parameters: {
            query?: {
                /** @description 页码 */
                page?: number;
                /** @description 每页数量 */
                pageSize?: number;
                /** @description 任务ID */
                task_id?: string;
                /** @description 任务类型 key */
                task_key?: string;
                /** @description 执行状态 */
                status?: string;
                /** @description 触发类型 */
                trigger_type?: "manual" | "schedule";
                /** @description 操作人ID */
                operator_id?: string;
                /** @description 开始时间（ISO） */
                date_from?: string;
                /** @description 结束时间（ISO） */
                date_to?: string;
                /** @description 仅错误记录 */
                has_error?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_getRunDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Run ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_updateTaskPolicy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 任务ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTaskPolicyBodyDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    TaskSchedulerController_getSchedulerHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    LogsController_getSystemLogs: {
        parameters: {
            query?: {
                /** @description Page number */
                page?: number;
                /** @description Page size */
                pageSize?: number;
                /** @description all | combined | error | tracking | import | task_scheduler | upload */
                source?:
                    | "all"
                    | "combined"
                    | "error"
                    | "tracking"
                    | "import"
                    | "task_scheduler"
                    | "upload";
                /** @description error | warn | info | debug | verbose */
                level?: "error" | "warn" | "info" | "debug" | "verbose";
                /** @description Log context */
                context?: string;
                /** @description Keyword search in message and payload */
                keyword?: string;
                /** @description Task log type filter, e.g. task_admin_update_all_gp / task_admin_content_update_gp */
                log_type?: string;
                /** @description Request id filter */
                request_id?: string;
                /** @description API key id filter */
                api_key_id?: string;
                /** @description Request path filter */
                path?: string;
                /** @description User id exact match */
                user_id?: string;
                /** @description User keyword in user_id or user_name */
                user_keyword?: string;
                /** @description IP exact or fuzzy match */
                ip?: string;
                /** @description IP region fuzzy match */
                ip_region?: string;
                /** @description Start timestamp (ISO string) */
                start_time?: string;
                /** @description End timestamp (ISO string) */
                end_time?: string;
                /** @description true/false */
                realtime?: boolean;
                /** @description Use previous next_cursor */
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Query success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SystemLogListDataDto"];
                    };
                };
            };
        };
    };
    LogsController_getAdminOperationLogs: {
        parameters: {
            query?: {
                /** @description Page number */
                page?: number;
                /** @description Page size (max 200) */
                pageSize?: number;
                /** @description Keyword in username, name, path, or error */
                keyword?: string;
                /** @description Operator user id */
                operator_id?: string;
                /** @description Role code */
                role_code?: string;
                /** @description HTTP method */
                method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
                /** @description Request path filter */
                path?: string;
                /** @description Operation success filter */
                success?: boolean;
                /** @description Start timestamp (ISO string) */
                start_time?: string;
                /** @description End timestamp (ISO string) */
                end_time?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Query success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["AdminOperationLogListDataDto"];
                    };
                };
            };
        };
    };
    LogSystemController_list: {
        parameters: {
            query?: {
                /** @description Page number */
                page?: number;
                /** @description Page size */
                pageSize?: number;
                /** @description all | combined | error | tracking | import | task_scheduler | upload */
                source?:
                    | "all"
                    | "combined"
                    | "error"
                    | "tracking"
                    | "import"
                    | "task_scheduler"
                    | "upload";
                /** @description error | warn | info | debug | verbose */
                level?: "error" | "warn" | "info" | "debug" | "verbose";
                /** @description Log context */
                context?: string;
                /** @description Keyword search in message and payload */
                keyword?: string;
                /** @description Task log type filter, e.g. task_admin_update_all_gp / task_admin_content_update_gp */
                log_type?: string;
                /** @description Request id filter */
                request_id?: string;
                /** @description API key id filter */
                api_key_id?: string;
                /** @description Request path filter */
                path?: string;
                /** @description User id exact match */
                user_id?: string;
                /** @description User keyword in user_id or user_name */
                user_keyword?: string;
                /** @description IP exact or fuzzy match */
                ip?: string;
                /** @description IP region fuzzy match */
                ip_region?: string;
                /** @description Start timestamp (ISO string) */
                start_time?: string;
                /** @description End timestamp (ISO string) */
                end_time?: string;
                /** @description true/false */
                realtime?: boolean;
                /** @description Use previous next_cursor */
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Query success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["SystemLogListDataDto"];
                    };
                };
            };
        };
    };
    McpController_rpc: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    McpController_adminRpc: {
        parameters: {
            query?: never;
            header: {
                "X-API-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_getConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取 AI 配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AiAssistantController_updateConfig: {
        parameters: {
            query?: {
                key?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 更新 AI 配置成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AiAssistantController_getTools: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取工具列表成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AiAssistantController_chatStream: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiChatStreamDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_getJobs: {
        parameters: {
            query: {
                page: number;
                pageSize: number;
                status: string;
                tool_name: string;
                user_id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_getJobSteps: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_getJobGraph: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_retryJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_cancelJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_resumeJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_rollbackJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AiAssistantController_previewRandomPick: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AlbumRandomPickPreviewDto"];
            };
        };
        responses: {
            /** @description 预览成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    AiAssistantController_applyRandomPick: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AlbumRandomPickApplyDto"];
            };
        };
        responses: {
            /** @description 执行成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SeoController_push: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description 单条或批量 URL 提交，最多 50 条 */
        requestBody: {
            content: {
                "application/json": {
                    /** @example https://apks.cc/app/com.tencent.ig */
                    url?: string;
                    /**
                     * @example [
                     *       "https://apks.cc/",
                     *       "https://apks.cc/community/post/abc123"
                     *     ]
                     */
                    urls?: string[];
                    /**
                     * @example [
                     *       "baidu",
                     *       "indexnow"
                     *     ]
                     */
                    providers?: ("baidu" | "indexnow")[];
                };
            };
        };
        responses: {
            /** @description 推送处理完成 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SeoController_sitemapGames: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: number;
                /** @description 每页条数，默认 500，最大 1000 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SeoController_gamePage: {
        parameters: {
            query: {
                /** @description 游戏包名 */
                pkg: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SeoController_auditGames: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: number;
                /** @description 每页条数，默认 100，最大 500 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SeoController_sitemapUsers: {
        parameters: {
            query?: {
                /** @description 页码，默认 1 */
                page?: number;
                /** @description 每页条数，默认 500，最大 1000 */
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 获取成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: unknown;
                    };
                };
            };
        };
    };
    SearchController_global: {
        parameters: {
            query?: {
                /** @description 每种内容类型返回数量，默认 6，最大 12 */
                limitPerType?: unknown;
                /** @description 关键词 */
                q?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 查询成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 0 */
                        code: number;
                        /** @example ok */
                        message: string;
                        data: components["schemas"]["GlobalSearchDataDto"];
                    };
                };
            };
        };
    };
    ResourceUpdateController_previewDetection: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_listDetections: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_createDetection: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_getDetection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_cancelDetection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_overview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_sourcePolicies: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_updateSourcePolicy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ingestionSource: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_audit: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_sourceProbe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_listJobs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_createJobs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_listFailures: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_getJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_retryJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_retryJobs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_ignoreJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_cancelJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_pauseQueue: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_resumeQueue: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_inspectWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourceUpdateController_cleanupWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesPublicController_discover: {
        parameters: {
            query: {
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesAdminController_preview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebGameImportPreviewDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesAdminController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebGameImportDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesAdminController_list: {
        parameters: {
            query: {
                q: string;
                status: string;
                page: string;
                pageSize: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesAdminController_updateConfig: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebGameConfigDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebGamesAdminController_updateSort: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebGameSortDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
