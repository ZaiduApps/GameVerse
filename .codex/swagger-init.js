
window.onload = function() {
  // Build a system
  let url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  let options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "paths": {
      "/auth/register": {
        "post": {
          "operationId": "AuthController_register",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RegisterDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": "注册成功"
            },
            "409": {
              "description": "用户名或邮箱已存在"
            }
          },
          "summary": "用户名密码注册",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/login": {
        "post": {
          "operationId": "AuthController_login",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "登录成功"
            },
            "401": {
              "description": "用户名或密码错误"
            }
          },
          "summary": "用户名密码登录",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/send-code": {
        "post": {
          "operationId": "AuthController_sendEmailCode",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SendEmailCodeDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "验证码已发送"
            },
            "400": {
              "description": "发送过于频繁或邮箱不存在"
            }
          },
          "summary": "发送邮箱验证码",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/register-by-email": {
        "post": {
          "operationId": "AuthController_registerByEmail",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RegisterByEmailDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": "注册成功"
            },
            "400": {
              "description": "验证码错误或已过期"
            },
            "409": {
              "description": "用户名或邮箱已存在"
            }
          },
          "summary": "邮箱验证码注册",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/login-by-email": {
        "post": {
          "operationId": "AuthController_loginByEmail",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginByEmailDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "登录成功"
            },
            "400": {
              "description": "验证码错误或已过期"
            },
            "401": {
              "description": "用户不存在或账号已被禁用"
            }
          },
          "summary": "邮箱验证码登录",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/change-password": {
        "post": {
          "operationId": "AuthController_changePassword",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ChangePasswordDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "密码修改成功"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "修改当前用户密码",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/logout": {
        "post": {
          "operationId": "AuthController_logout",
          "parameters": [],
          "responses": {
            "200": {
              "description": "退出成功"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "退出登录",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/refresh": {
        "post": {
          "operationId": "AuthController_refreshToken",
          "parameters": [],
          "responses": {
            "200": {
              "description": "刷新成功"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "刷新登录令牌",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/me": {
        "get": {
          "operationId": "AuthController_me",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取成功"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取当前用户信息",
          "tags": [
            "认证"
          ]
        }
      },
      "/auth/codes": {
        "get": {
          "operationId": "AuthController_getCodes",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取成功"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取当前用户权限码",
          "tags": [
            "认证"
          ]
        }
      },
      "/users": {
        "post": {
          "operationId": "UserController_create",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建用户",
          "tags": [
            "用户管理"
          ]
        },
        "get": {
          "operationId": "UserController_findAll",
          "parameters": [
            {
              "name": "search",
              "required": false,
              "in": "query",
              "description": "搜索关键词（用户名/邮箱/昵称）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "isActive",
              "required": false,
              "in": "query",
              "description": "是否启用",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "isBlocked",
              "required": false,
              "in": "query",
              "description": "是否封禁",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "role",
              "required": false,
              "in": "query",
              "description": "角色代码",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "gender",
              "required": false,
              "in": "query",
              "description": "性别",
              "schema": {
                "type": "string",
                "enum": [
                  "male",
                  "female",
                  "other",
                  ""
                ]
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "default": "1",
                "example": 1,
                "type": "string"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "default": "10",
                "example": 10,
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取用户列表",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/profile": {
        "get": {
          "operationId": "UserController_getProfile",
          "parameters": [],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取当前登录用户信息",
          "tags": [
            "用户管理"
          ]
        },
        "patch": {
          "operationId": "UserController_updateProfile",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateProfileDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新当前用户资料（PATCH）",
          "tags": [
            "用户管理"
          ]
        },
        "put": {
          "operationId": "UserController_updateProfileByPut",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateProfileDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新当前用户资料（PUT）",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/login-bans": {
        "get": {
          "operationId": "UserController_getLoginBanList",
          "parameters": [
            {
              "name": "type",
              "required": false,
              "in": "query",
              "description": "封禁类型",
              "schema": {
                "type": "string",
                "enum": [
                  "ip",
                  "device"
                ]
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "关键词（IP/设备ID）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "default": "1",
                "type": "string"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "default": "10",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取登录IP/设备封禁列表",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/login-bans/ip": {
        "post": {
          "operationId": "UserController_banLoginIp",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BanLoginIpDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "封禁登录IP",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/login-bans/ip/{ip}": {
        "delete": {
          "operationId": "UserController_removeLoginIpBan",
          "parameters": [
            {
              "name": "ip",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "解除登录IP封禁",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/login-bans/device": {
        "post": {
          "operationId": "UserController_banLoginDevice",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BanLoginDeviceDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "封禁设备ID",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/login-bans/device/{deviceId}": {
        "delete": {
          "operationId": "UserController_removeLoginDeviceBan",
          "parameters": [
            {
              "name": "deviceId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "解除设备ID封禁",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}": {
        "get": {
          "operationId": "UserController_findOne",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "用户 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取用户详情",
          "tags": [
            "用户管理"
          ]
        },
        "patch": {
          "operationId": "UserController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateUserDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新用户信息（PATCH）",
          "tags": [
            "用户管理"
          ]
        },
        "put": {
          "operationId": "UserController_updateByPut",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateUserDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新用户信息（PUT）",
          "tags": [
            "用户管理"
          ]
        },
        "delete": {
          "operationId": "UserController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除用户",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/disable": {
        "patch": {
          "operationId": "UserController_disableUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "禁用用户（PATCH）",
          "tags": [
            "用户管理"
          ]
        },
        "put": {
          "operationId": "UserController_disableUserByPut",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "禁用用户（PUT）",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/enable": {
        "patch": {
          "operationId": "UserController_enableUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "启用用户（PATCH）",
          "tags": [
            "用户管理"
          ]
        },
        "put": {
          "operationId": "UserController_enableUserByPut",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "启用用户（PUT）",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/block": {
        "post": {
          "operationId": "UserController_blockUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BlockUserDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "封禁账号",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/unblock": {
        "post": {
          "operationId": "UserController_unblockUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "解除账号封禁",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/roles": {
        "post": {
          "operationId": "UserController_assignRoles",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分配角色给用户",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/users/{id}/permissions": {
        "get": {
          "operationId": "UserController_getPermissions",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": ""
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取用户权限列表",
          "tags": [
            "用户管理"
          ]
        }
      },
      "/roles": {
        "post": {
          "operationId": "RoleController_create",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateRoleDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": "角色创建成功"
            },
            "400": {
              "description": "角色代码已存在"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建角色",
          "tags": [
            "角色管理"
          ]
        },
        "get": {
          "operationId": "RoleController_findAll",
          "parameters": [
            {
              "name": "search",
              "required": false,
              "in": "query",
              "description": "搜索关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "isActive",
              "required": false,
              "in": "query",
              "description": "是否激活",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "default": 1,
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "default": 10,
                "example": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "返回角色列表"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取角色列表",
          "tags": [
            "角色管理"
          ]
        }
      },
      "/roles/permissions/all": {
        "get": {
          "operationId": "RoleController_getAllPermissions",
          "parameters": [],
          "responses": {
            "200": {
              "description": "返回权限列表"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取所有可用权限列表",
          "tags": [
            "角色管理"
          ]
        }
      },
      "/roles/{id}": {
        "get": {
          "operationId": "RoleController_findOne",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "角色ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "返回角色详情"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "404": {
              "description": "角色不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取角色详情",
          "tags": [
            "角色管理"
          ]
        },
        "put": {
          "operationId": "RoleController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "角色ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateRoleDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "角色更新成功"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "404": {
              "description": "角色不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新角色",
          "tags": [
            "角色管理"
          ]
        },
        "delete": {
          "operationId": "RoleController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "角色ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "角色删除成功"
            },
            "400": {
              "description": "不能删除系统内置角色或有用户使用的角色"
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "404": {
              "description": "角色不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除角色",
          "tags": [
            "角色管理"
          ]
        }
      },
      "/home": {
        "get": {
          "operationId": "AppController_home",
          "parameters": [
            {
              "name": "dynamic_count",
              "required": false,
              "in": "query",
              "description": "动态内容条数，默认 8，最大 20",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台规则过滤，如 android/web/ios",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "region",
              "required": false,
              "in": "query",
              "description": "地区规则过滤",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "client_version",
              "required": false,
              "in": "query",
              "description": "客户端版本，用于公告 min/max_version 规则",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取首页聚合数据成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "banner": [],
                        "albums": [],
                        "articles": [],
                        "dynamic_posts": [],
                        "announcements": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取首页聚合数据",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin": {
        "get": {
          "operationId": "AdminController_getHello",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": "hello"
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Admin 测试接口",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/resources/get": {
        "get": {
          "operationId": "AdminController_findAppResources",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询应用资源成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询应用资源",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/resources/post": {
        "post": {
          "operationId": "AdminController_postAppResources",
          "parameters": [],
          "responses": {
            "201": {
              "description": "保存资源成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "resource_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "新增或更新应用资源",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/get-gp": {
        "get": {
          "operationId": "AdminController_getGooglePlayInfo",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "description": "应用包名",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "抓取成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "pkg": "com.example.app"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "抓取 Google Play 信息",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/get-qoo": {
        "get": {
          "operationId": "AdminController_getQooInfo",
          "parameters": [
            {
              "name": "url",
              "required": false,
              "in": "query",
              "description": "Qoo 详情页 URL",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pkg",
              "required": false,
              "in": "query",
              "description": "兼容旧参数",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "抓取成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "pkg": "com.example.app"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "抓取 Qoo 信息",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/import-app/preview": {
        "post": {
          "operationId": "AdminController_previewImportApp",
          "parameters": [],
          "responses": {
            "200": {
              "description": "预览成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "source": "google_api",
                        "exists": false,
                        "existing_app": null,
                        "data": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "预览导入游戏数据（支持多渠道）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/import-app/submit": {
        "post": {
          "operationId": "AdminController_submitImportApp",
          "parameters": [],
          "responses": {
            "200": {
              "description": "提交成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "job_id": "uuid",
                        "status": "queued"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "提交导入任务（异步入库）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/import-app/google/batch-submit": {
        "post": {
          "operationId": "AdminController_submitGoogleImportBatch",
          "parameters": [],
          "responses": {
            "200": {
              "description": "提交成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "batch_id": "uuid",
                        "summary": {
                          "total": 10,
                          "accepted": 8,
                          "skipped": 1,
                          "failed": 1,
                          "invalid": 0
                        },
                        "items": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量提交 Google 导入任务（不预览）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/import-app/google/batch-status": {
        "get": {
          "operationId": "AdminController_getGoogleImportBatchStatus",
          "parameters": [
            {
              "name": "batch_id",
              "required": true,
              "in": "query",
              "description": "批次 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "batch_id": "uuid",
                        "jobs": {
                          "accepted": 8,
                          "queued": 0,
                          "running": 1,
                          "success": 6,
                          "failed": 1,
                          "completed": false,
                          "all_completed": false
                        },
                        "items": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询 Google 批量导入状态",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/import-app/task-status": {
        "get": {
          "operationId": "AdminController_getImportAppTaskStatus",
          "parameters": [
            {
              "name": "job_id",
              "required": true,
              "in": "query",
              "description": "任务 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "status": "running"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询导入任务状态",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/post-gp": {
        "get": {
          "operationId": "AdminController_postGameInfo",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "v",
              "required": true,
              "in": "query",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "img",
              "required": true,
              "in": "query",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "写入成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "updated": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "写入单个应用抓取结果",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/content": {
        "get": {
          "operationId": "AdminController_postGameInfoContent",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "mode",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "批量更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "successCount": 0,
                        "failedCount": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量更新内容",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/up/get-up-apk-gp": {
        "get": {
          "operationId": "AdminController_getAppUpdateList",
          "parameters": [
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            },
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_hot",
              "required": true,
              "in": "query",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询待更新应用列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询待更新应用列表",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/up/all-apk-gp": {
        "get": {
          "operationId": "AdminController_AppUpdateAll",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_hot",
              "required": true,
              "in": "query",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "批量更新触发成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "started": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量执行应用更新",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/admin/up/one-apk-gp": {
        "get": {
          "operationId": "AdminController_AppUpdateOne",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "单个更新触发成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "started": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "执行单个应用更新",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/tools/post-gp": {
        "get": {
          "operationId": "AdminPublicController_postGameInfoPublic",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "description": "应用包名",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "v",
              "required": false,
              "in": "query",
              "description": "是否开启版本校验（默认 false）",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "img",
              "required": false,
              "in": "query",
              "description": "是否更新媒体资源（默认 false）",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "signature",
              "required": false,
              "in": "query",
              "description": "固定签名，可用 query 或 x-signature 请求头传入",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "写入成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "updated": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "x-signature": []
            }
          ],
          "summary": "公开受控写入 Google 应用抓取结果（固定签名鉴权）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/list": {
        "get": {
          "operationId": "GameController_getGames",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取游戏列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "获取游戏列表",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/{id}": {
        "put": {
          "operationId": "GameController_updateGame",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "游戏ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新游戏信息成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "game_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新游戏信息",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/status": {
        "patch": {
          "operationId": "GameController_updateGameStatus",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateGameStatusDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Update app online status success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "app_id": "game_id",
                        "pkg": "com.example.app",
                        "status": 1,
                        "resource_matched": 0,
                        "resource_modified": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Update app online status",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/apps/refresh-media": {
        "post": {
          "operationId": "GameController_refreshAppMedia",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RefreshAppMediaDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "刷新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "success": true,
                        "app_id": "app_id",
                        "pkg": "com.example.app",
                        "source_type": "GP",
                        "updated_fields": {
                          "icon": "https://...",
                          "detail_images_count": 5,
                          "header_image": "https://...",
                          "video_image": "https://...",
                          "video_preview": "https://..."
                        },
                        "transfer_summary": {
                          "total": 8,
                          "converted": 8,
                          "failed": 0
                        },
                        "transfer_errors": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "按来源类型刷新应用媒体资源（icon + 五图 + 视频封面）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/site-config": {
        "get": {
          "operationId": "GameController_getSiteConfig",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取站点配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "basic": {},
                        "system": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取站点配置",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/info": {
        "get": {
          "operationId": "GameController_GetGameInformation",
          "parameters": [
            {
              "name": "pkg",
              "required": false,
              "in": "query",
              "description": "包名",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "id",
              "required": false,
              "in": "query",
              "description": "资源ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取游戏信息成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "game_id",
                        "pkg": "com.example.app"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取单个游戏信息",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/search": {
        "get": {
          "operationId": "GameController_searchApps",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "source_type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_hot",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sortOrder",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "date_field",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "date_from",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "fields",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "搜索应用成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "搜索应用",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/gp-apk": {
        "get": {
          "operationId": "GameController_getGP",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "获取 Google APK 数据",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/details": {
        "get": {
          "operationId": "GameController_Info",
          "parameters": [
            {
              "name": "param",
              "required": true,
              "in": "query",
              "description": "包名或ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取游戏详情成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "game_id",
                        "detail_images": []
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取游戏详情",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/getAppDownload": {
        "post": {
          "operationId": "GameController_downloadInfo",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateDownloadInfoDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "获取下载地址成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "url": "https://example.com/file.apk"
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取真实下载地址",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/track/detail": {
        "post": {
          "operationId": "GameController_trackDetail",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TrackGameDetailDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Tracked",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "tracked": true
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "Track game detail page view",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/recommendedApp": {
        "get": {
          "operationId": "GameController_recommendedApplications",
          "parameters": [
            {
              "name": "param",
              "required": true,
              "in": "query",
              "description": "包名或ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取推荐应用成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "获取推荐应用",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/q": {
        "get": {
          "operationId": "GameController_searchFn",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "搜索成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "关键字搜索游戏",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/installed/updates": {
        "post": {
          "operationId": "GameController_getInstalledUpdates",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InstalledUpdatesDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "比对成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [
                          {
                            "app_id": "67f0a66d0b2f421bca0a0001",
                            "pkg": "com.tencent.ig",
                            "name": "PUBG MOBILE",
                            "icon": "https://...",
                            "summary": "排名第一的大逃杀手游",
                            "latest_at": "2025-12-29T01:31:07.000Z",
                            "installed_version_name": "4.1.0",
                            "installed_version_code": 20100,
                            "latest_version_name": "4.2.0",
                            "latest_version_code": 20318,
                            "has_update": true
                          }
                        ],
                        "total": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "根据本机已安装包名批量比对可更新应用",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/reservations/follow": {
        "post": {
          "operationId": "GameController_followReservation",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FollowReservationDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "关注成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": true,
                        "app_id": "app_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "关注预约中的应用（需登录）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/reservations/follow/{appId}": {
        "delete": {
          "operationId": "GameController_unfollowReservation",
          "parameters": [
            {
              "name": "appId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "取消成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": false,
                        "app_id": "app_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "取消关注预约应用（需登录）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/reservations/follow-status": {
        "get": {
          "operationId": "GameController_reservationFollowStatus",
          "parameters": [
            {
              "name": "app_id",
              "required": true,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": false,
                        "app_id": "app_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询当前用户是否已关注预约应用（需登录）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/game/reservations/my": {
        "get": {
          "operationId": "GameController_myReservationList",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "我的已关注预约应用列表（需登录）",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/notifications/summary": {
        "get": {
          "operationId": "NotificationsController_summary",
          "parameters": [],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationSummaryDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "total_unread": 0,
                        "unread_by_category": {
                          "system": 0,
                          "reply": 0,
                          "like": 0
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取未读消息摘要",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications": {
        "get": {
          "operationId": "NotificationsController_list",
          "parameters": [
            {
              "name": "category",
              "required": false,
              "in": "query",
              "description": "system/reply/like，不传则全部",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "消息列表（分页）",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/read": {
        "post": {
          "operationId": "NotificationsController_markRead",
          "parameters": [],
          "responses": {
            "200": {
              "description": "设置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationActionResultDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "success": true
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "单条消息已读",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/read-all": {
        "post": {
          "operationId": "NotificationsController_markReadAll",
          "parameters": [],
          "responses": {
            "200": {
              "description": "设置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationActionResultDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "success": true
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "按分类或全部标记已读",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/sent": {
        "get": {
          "operationId": "NotificationsController_sent",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "我发出的消息记录（分页）",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/admin/users": {
        "get": {
          "operationId": "NotificationsController_adminUsers",
          "parameters": [
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "关键词（用户名/昵称/邮箱）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "example": "1",
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "example": "20",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationAdminUsersDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [
                          {
                            "_id": "67f000000000000000000001",
                            "username": "user001",
                            "name": "张三",
                            "email": "user001@example.com",
                            "avatar": "",
                            "isActive": true,
                            "isBlocked": false
                          }
                        ],
                        "total": 1,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Admin：消息发送目标用户列表",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/admin/sent": {
        "get": {
          "operationId": "NotificationsController_adminSent",
          "parameters": [
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "标题/内容/发送人关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "mode",
              "required": false,
              "in": "query",
              "description": "single/all",
              "schema": {
                "type": "string",
                "enum": [
                  "single",
                  "all"
                ]
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "example": "1",
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "example": "20",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationSentLogsDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [
                          {
                            "_id": "67f000000000000000000301",
                            "sender_name": "管理员",
                            "mode": "all",
                            "title": "版本更新通知",
                            "content": "3.2.0 版本已发布",
                            "recipient_count": 1024,
                            "recipient_ids": [],
                            "created_at": "2026-03-13T10:10:00.000Z"
                          }
                        ],
                        "total": 1,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Admin：已发送系统消息列表",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/notifications/admin/send": {
        "post": {
          "operationId": "NotificationsController_adminSend",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SendSystemNotificationDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "发送成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/NotificationAdminSendDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "success": true,
                        "mode": "single",
                        "recipient_count": 1,
                        "recipient_ids": [
                          "67f000000000000000000001"
                        ]
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权限访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权限访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Admin：发送系统消息（全员/单用户）",
          "tags": [
            "站内消息"
          ]
        }
      },
      "/tracking/admin/overview": {
        "get": {
          "operationId": "TrackingController_overview",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期 YYYY-MM-DD",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期 YYYY-MM-DD",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台 web/android",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "channel_id",
              "required": false,
              "in": "query",
              "description": "渠道 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "request_total": 0,
                        "detail_view_total": 0,
                        "download_click_total": 0,
                        "download_url_issued_total": 0
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "埋点概览统计",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/tracking/admin/top-apps": {
        "get": {
          "operationId": "TrackingController_topApps",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "channel_id",
              "required": false,
              "in": "query",
              "description": "渠道 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": []
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "游戏维度统计 Top 列表",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/tracking/admin/channels": {
        "get": {
          "operationId": "TrackingController_channels",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "channel_id",
              "required": false,
              "in": "query",
              "description": "渠道 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": []
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "渠道下载统计",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/tracking/admin/api-performance": {
        "get": {
          "operationId": "TrackingController_apiPerformance",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "channel_id",
              "required": false,
              "in": "query",
              "description": "渠道 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": []
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "接口性能统计",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/tracking/admin/request-logs": {
        "get": {
          "operationId": "TrackingController_requestLogs",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "minimum": 1,
                "maximum": 200,
                "default": 20,
                "type": "number"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "关键词（路径、消息等）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "用户 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "device_id",
              "required": false,
              "in": "query",
              "description": "设备 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "ip",
              "required": false,
              "in": "query",
              "description": "IP 地址",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "path",
              "required": false,
              "in": "query",
              "description": "请求路径",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "method",
              "required": false,
              "in": "query",
              "description": "HTTP 方法",
              "schema": {
                "type": "string",
                "enum": [
                  "GET",
                  "POST",
                  "PUT",
                  "PATCH",
                  "DELETE"
                ]
              }
            },
            {
              "name": "status_code",
              "required": false,
              "in": "query",
              "description": "状态码",
              "schema": {
                "example": 200,
                "type": "number"
              }
            },
            {
              "name": "login_type",
              "required": false,
              "in": "query",
              "description": "登录类型",
              "schema": {
                "default": "all",
                "type": "string",
                "enum": [
                  "all",
                  "login",
                  "guest"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "访问请求日志（支持搜索和分页）",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/tracking/admin/recent-visitors": {
        "get": {
          "operationId": "TrackingController_recentVisitors",
          "parameters": [
            {
              "name": "date_from",
              "required": false,
              "in": "query",
              "description": "开始日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "date_to",
              "required": false,
              "in": "query",
              "description": "结束日期（YYYY-MM-DD）",
              "schema": {
                "example": "2026-03-29",
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string",
                "enum": [
                  "web",
                  "android"
                ]
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "返回条数",
              "schema": {
                "minimum": 1,
                "maximum": 200,
                "default": 20,
                "type": "number"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "关键词（用户昵称/设备等）",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": []
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "未登录或登录态失效",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 401,
                      "message": "未登录或登录态失效",
                      "data": null
                    }
                  }
                }
              }
            },
            "403": {
              "description": "无权访问该接口",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 403,
                      "message": "无权访问该接口",
                      "data": null
                    }
                  }
                }
              }
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "最近访问者（登录用户/游客设备聚合）",
          "tags": [
            "埋点统计"
          ]
        }
      },
      "/upload": {
        "post": {
          "operationId": "UploadController_uploadFiles",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "$ref": "#/components/schemas/UploadDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "上传成功",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UploadResponseDto"
                  }
                }
              }
            },
            "400": {
              "description": "参数错误"
            },
            "401": {
              "description": "未授权"
            },
            "429": {
              "description": "请求过于频繁"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "上传文件（需要 file:upload 权限）",
          "tags": [
            "文件上传"
          ]
        }
      },
      "/upload/public": {
        "post": {
          "operationId": "UploadController_uploadPublicFiles",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "$ref": "#/components/schemas/UploadDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "上传成功",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UploadResponseDto"
                  }
                }
              }
            },
            "400": {
              "description": "参数错误"
            },
            "401": {
              "description": "未授权"
            },
            "429": {
              "description": "请求过于频繁"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "公共上传（登录可用）",
          "tags": [
            "文件上传"
          ]
        }
      },
      "/upload/public/transfer-url": {
        "post": {
          "operationId": "UploadController_transferPublicUrl",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UploadTransferDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "转存成功",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UploadResponseDto"
                  }
                }
              }
            },
            "400": {
              "description": "参数错误"
            },
            "401": {
              "description": "未授权"
            },
            "429": {
              "description": "请求过于频繁"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "公共上传：外链图片转存（登录可用）",
          "tags": [
            "文件上传"
          ]
        }
      },
      "/banner": {
        "post": {
          "operationId": "AppController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建轮播图成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "banner_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建轮播图",
          "tags": [
            "轮播图管理"
          ]
        },
        "get": {
          "operationId": "AppController_list",
          "parameters": [
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_active",
              "required": false,
              "in": "query",
              "description": "是否启用",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "schema": {
                "example": 20,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取轮播图列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询轮播图",
          "tags": [
            "轮播图管理"
          ]
        }
      },
      "/banner/{id}": {
        "put": {
          "operationId": "AppController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "轮播图ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新轮播图成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "banner_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新轮播图",
          "tags": [
            "轮播图管理"
          ]
        },
        "delete": {
          "operationId": "AppController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "轮播图ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除轮播图成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除轮播图",
          "tags": [
            "轮播图管理"
          ]
        }
      },
      "/banner/active/{id}": {
        "get": {
          "operationId": "AppController_findById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "轮播图ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取轮播图成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "banner_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取轮播图详情（公开）",
          "tags": [
            "轮播图管理"
          ]
        }
      },
      "/banner/active": {
        "get": {
          "operationId": "AppController_listActive",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取启用轮播图成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "获取启用轮播图（公开）",
          "tags": [
            "轮播图管理"
          ]
        }
      },
      "/albums": {
        "post": {
          "operationId": "AppController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建专辑成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "album_id",
                        "title": "新专辑"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建专辑",
          "tags": [
            "专辑管理"
          ]
        },
        "get": {
          "operationId": "AppController_list",
          "parameters": [
            {
              "name": "is_home",
              "required": false,
              "in": "query",
              "description": "是否首页展示",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_active",
              "required": false,
              "in": "query",
              "description": "是否启用",
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "schema": {
                "example": 20,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取专辑列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询专辑",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/apps": {
        "post": {
          "operationId": "AppController_CreateAlbum",
          "parameters": [],
          "responses": {
            "200": {
              "description": "添加应用成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "modifiedCount": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "向专辑添加应用",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/{id}": {
        "put": {
          "operationId": "AppController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "专辑ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新专辑成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "album_id",
                        "title": "专辑标题"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新专辑",
          "tags": [
            "专辑管理"
          ]
        },
        "delete": {
          "operationId": "AppController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "专辑ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除专辑成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除专辑",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/apps/{album_id}": {
        "delete": {
          "operationId": "AppController_removeApps",
          "parameters": [
            {
              "name": "album_id",
              "required": true,
              "in": "path",
              "description": "专辑ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "description": "应用包名",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "移除应用成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "modifiedCount": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "从专辑移除应用",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/actives/{id}": {
        "get": {
          "operationId": "AppController_findById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "专辑ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取专辑详情成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "album_id",
                        "title": "专辑标题"
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取专辑详情（公开）",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/album-details/{id}": {
        "get": {
          "operationId": "AppController_findByIdDes",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "专辑ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取专辑应用成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "album": {},
                        "apps": []
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取专辑下应用列表（公开）",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/albums/home": {
        "get": {
          "operationId": "AppController_listActive",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取首页专辑成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "获取首页启用专辑（公开）",
          "tags": [
            "专辑管理"
          ]
        }
      },
      "/news/admin/list": {
        "get": {
          "operationId": "NewsController_adminList",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_top",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_recommended",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "source",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "author",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询新闻列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台分页查询新闻",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/admin": {
        "post": {
          "operationId": "NewsController_adminCreate",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建新闻成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建新闻",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/admin/{id}": {
        "put": {
          "operationId": "NewsController_adminUpdate",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新新闻成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新新闻",
          "tags": [
            "文章管理"
          ]
        },
        "delete": {
          "operationId": "NewsController_adminDelete",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除新闻成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除新闻",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/admin/{id}/status": {
        "patch": {
          "operationId": "NewsController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新状态成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新新闻状态",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/admin/{id}/top": {
        "patch": {
          "operationId": "NewsController_setTop",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "设置置顶成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id",
                        "is_top": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置新闻置顶",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/admin/{id}/recommend": {
        "patch": {
          "operationId": "NewsController_setRecommend",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "设置推荐成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id",
                        "is_recommended": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置新闻推荐",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/upload-image": {
        "post": {
          "operationId": "NewsController_uploadImage",
          "parameters": [],
          "responses": {
            "200": {
              "description": "上传图片成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [
                          "https://cdn.example.com/news/img1.png"
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "上传新闻图片",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/active/{id}": {
        "get": {
          "operationId": "NewsController_findById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "新闻ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取新闻详情成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "news_id",
                        "title": "新闻标题"
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取新闻详情（公开）",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/news/search": {
        "get": {
          "operationId": "NewsController_searchFn",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "搜索新闻成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "搜索新闻（公开）",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/tags": {
        "post": {
          "operationId": "AppController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建标签成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "tag_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建标签",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/tags/{id}": {
        "put": {
          "operationId": "AppController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "标签ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新标签成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "tag_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新标签",
          "tags": [
            "应用管理"
          ]
        },
        "delete": {
          "operationId": "AppController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "标签ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除标签成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除标签",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/tags/active/{id}": {
        "get": {
          "operationId": "AppController_findById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "标签ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取标签详情成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "tag_id",
                        "name": "RPG"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取标签详情",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/tags/list": {
        "post": {
          "operationId": "AppController_list",
          "parameters": [],
          "responses": {
            "200": {
              "description": "查询标签列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询标签",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/tags/list-games": {
        "post": {
          "operationId": "AppController_AppList",
          "parameters": [],
          "responses": {
            "200": {
              "description": "查询标签下游戏成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询标签下游戏",
          "tags": [
            "应用管理"
          ]
        }
      },
      "/feedbacks": {
        "post": {
          "operationId": "FeedbacksController_create",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateFeedbackDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "标准成功响应示例",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": "反馈创建成功"
            },
            "400": {
              "description": "参数错误"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "summary": "创建反馈",
          "tags": [
            "反馈管理"
          ]
        },
        "get": {
          "operationId": "FeedbacksController_findAll",
          "parameters": [
            {
              "name": "type",
              "required": false,
              "in": "query",
              "description": "反馈类型",
              "schema": {
                "type": "string",
                "enum": [
                  "missing",
                  "update",
                  "broken",
                  "suggestion"
                ]
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "处理状态",
              "schema": {
                "type": "number",
                "enum": [
                  0,
                  1,
                  2,
                  -1
                ]
              }
            },
            {
              "name": "target_id",
              "required": false,
              "in": "query",
              "description": "关联目标资源 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "用户 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "用户关键词（匹配用户ID/昵称/联系方式）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "search",
              "required": false,
              "in": "query",
              "description": "搜索关键词（标题、描述）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取反馈列表（管理端）",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/public/list": {
        "get": {
          "operationId": "FeedbacksController_findPublicList",
          "parameters": [
            {
              "name": "type",
              "required": false,
              "in": "query",
              "description": "反馈类型",
              "schema": {
                "type": "string",
                "enum": [
                  "missing",
                  "update",
                  "broken",
                  "suggestion"
                ]
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "处理状态",
              "schema": {
                "type": "number",
                "enum": [
                  0,
                  1,
                  2,
                  -1
                ]
              }
            },
            {
              "name": "target_id",
              "required": false,
              "in": "query",
              "description": "关联目标资源 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "用户 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "用户关键词（匹配用户ID/昵称/联系方式）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "search",
              "required": false,
              "in": "query",
              "description": "搜索关键词（标题、描述）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "summary": "获取公开反馈列表",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/public/{id}": {
        "get": {
          "operationId": "FeedbacksController_findPublicOne",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "summary": "获取公开反馈详情",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/my/list": {
        "get": {
          "operationId": "FeedbacksController_findMyList",
          "parameters": [
            {
              "name": "type",
              "required": false,
              "in": "query",
              "description": "反馈类型",
              "schema": {
                "type": "string",
                "enum": [
                  "missing",
                  "update",
                  "broken",
                  "suggestion"
                ]
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "处理状态",
              "schema": {
                "type": "number",
                "enum": [
                  0,
                  1,
                  2,
                  -1
                ]
              }
            },
            {
              "name": "target_id",
              "required": false,
              "in": "query",
              "description": "关联目标资源 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "用户 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "用户关键词（匹配用户ID/昵称/联系方式）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "search",
              "required": false,
              "in": "query",
              "description": "搜索关键词（标题、描述）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "$ref": "#/components/schemas/Object"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取我的反馈列表",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/my/{id}/detail": {
        "get": {
          "operationId": "FeedbacksController_findMyDetail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "403": {
              "description": "无权限访问"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取我的反馈详情（含多轮对话）",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}/status": {
        "put": {
          "operationId": "FeedbacksController_updateStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateFeedbackStatusDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "状态更新成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新反馈状态",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}/reply": {
        "post": {
          "operationId": "FeedbacksController_reply",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReplyFeedbackDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "回复成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "管理员回复反馈",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}/vote": {
        "post": {
          "operationId": "FeedbacksController_incrementVote",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "操作成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "summary": "反馈点赞/同求",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}/detail": {
        "get": {
          "operationId": "FeedbacksController_findDetail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取反馈详情（含多轮对话）",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}/messages": {
        "post": {
          "operationId": "FeedbacksController_addMessage",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AddFeedbackMessageDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "追加成功"
            },
            "403": {
              "description": "无权限操作此反馈"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "用户追加反馈消息",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedbacks/{id}": {
        "get": {
          "operationId": "FeedbacksController_findOne",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取反馈详情",
          "tags": [
            "反馈管理"
          ]
        },
        "put": {
          "operationId": "FeedbacksController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateFeedbackDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新反馈",
          "tags": [
            "反馈管理"
          ]
        },
        "delete": {
          "operationId": "FeedbacksController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "反馈 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功"
            },
            "404": {
              "description": "反馈不存在"
            },
            "500": {
              "description": "服务器内部错误",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 500,
                      "message": "服务器内部错误",
                      "data": null
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除反馈",
          "tags": [
            "反馈管理"
          ]
        }
      },
      "/feedback-config": {
        "post": {
          "operationId": "FeedbackConfigController_create",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateFeedbackConfigDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Standard success response example",
              "content": {
                "application/json": {
                  "schema": {
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {}
                    }
                  }
                }
              }
            },
            "201": {
              "description": "Created"
            },
            "409": {
              "description": "Duplicate code"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Create feedback config",
          "tags": [
            "Feedback Config"
          ]
        },
        "get": {
          "operationId": "FeedbackConfigController_findAll",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Success"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "List all feedback configs",
          "tags": [
            "Feedback Config"
          ]
        }
      },
      "/feedback-config/active": {
        "get": {
          "operationId": "FeedbackConfigController_findActive",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Success"
            }
          },
          "summary": "List active feedback configs",
          "tags": [
            "Feedback Config"
          ]
        }
      },
      "/feedback-config/{id}": {
        "get": {
          "operationId": "FeedbackConfigController_findOne",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Config id or code",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not found"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Get feedback config",
          "tags": [
            "Feedback Config"
          ]
        },
        "put": {
          "operationId": "FeedbackConfigController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Config id or code",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateFeedbackConfigDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not found"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Update feedback config",
          "tags": [
            "Feedback Config"
          ]
        },
        "delete": {
          "operationId": "FeedbackConfigController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Config id or code",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not found"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Delete feedback config",
          "tags": [
            "Feedback Config"
          ]
        }
      },
      "/feedback-config/{id}/toggle": {
        "patch": {
          "operationId": "FeedbackConfigController_toggleActive",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Config id or code",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not found"
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Toggle active",
          "tags": [
            "Feedback Config"
          ]
        }
      },
      "/app_card/create": {
        "post": {
          "operationId": "CardConfigController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建资源位配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "card_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建资源位配置",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/app_card/update/{id}": {
        "put": {
          "operationId": "CardConfigController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "配置ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新资源位配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "card_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新资源位配置",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/app_card/delete/{id}": {
        "delete": {
          "operationId": "CardConfigController_delete",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "配置ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除资源位配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除资源位配置",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/app_card/list": {
        "get": {
          "operationId": "CardConfigController_list",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "scope",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "target_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "target_pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "position",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询资源位配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询资源位配置",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/app_card/status/{id}": {
        "patch": {
          "operationId": "CardConfigController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "配置ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新资源位状态成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "card_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新资源位状态",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/app_card/grouped/{gameId}": {
        "get": {
          "operationId": "CardConfigController_getGrouped",
          "parameters": [
            {
              "name": "gameId",
              "required": false,
              "in": "path",
              "description": "游戏ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取分组配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "grouped": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "按分组获取资源位配置（公开）",
          "tags": [
            "资源位管理"
          ]
        }
      },
      "/announcements/available": {
        "get": {
          "operationId": "AnnouncementsController_getAvailable",
          "parameters": [
            {
              "name": "position",
              "required": true,
              "in": "query",
              "description": "展示位置",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "region",
              "required": false,
              "in": "query",
              "description": "地区",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "client_version",
              "required": false,
              "in": "query",
              "description": "客户端版本（用于 min/max_version 规则）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "include_global",
              "required": false,
              "in": "query",
              "description": "是否包含 global 位置公告",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "targetId",
              "required": false,
              "in": "query",
              "description": "目标ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询可用公告成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "summary": "查询可用公告（公开）",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/{id}/view": {
        "patch": {
          "operationId": "AnnouncementsController_trackView",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "公告ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "记录浏览成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "viewed": true
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "记录公告浏览次数（公开）",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/{id}/click": {
        "patch": {
          "operationId": "AnnouncementsController_trackClick",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "公告ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "记录点击成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "clicked": true
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "记录公告点击次数（公开）",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/admin/list": {
        "get": {
          "operationId": "AnnouncementsController_list",
          "parameters": [
            {
              "name": "q",
              "required": false,
              "in": "query",
              "description": "标题/摘要/内容关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": false,
              "in": "query",
              "description": "公告类型",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "position",
              "required": false,
              "in": "query",
              "description": "展示位置",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_active",
              "required": false,
              "in": "query",
              "description": "状态 true/false",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "target_id",
              "required": false,
              "in": "query",
              "description": "目标游戏ID（精确）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "target_keyword",
              "required": false,
              "in": "query",
              "description": "目标游戏关键词（游戏名/包名）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页条数，默认 20，最大 100",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询公告列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台分页查询公告",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/create": {
        "post": {
          "operationId": "AnnouncementsController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建公告成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "announcement_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建公告",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/update/{id}": {
        "put": {
          "operationId": "AnnouncementsController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "公告ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新公告成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "announcement_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新公告",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/admin/status/{id}": {
        "patch": {
          "operationId": "AnnouncementsController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "公告ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新状态成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "announcement_id",
                        "is_active": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新公告状态",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/announcements/delete/{id}": {
        "delete": {
          "operationId": "AnnouncementsController_delete",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "公告ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除公告成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除公告",
          "tags": [
            "公告管理"
          ]
        }
      },
      "/config/create": {
        "post": {
          "operationId": "SettingController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingCreateDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "config_id",
                        "key": "main"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建配置",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/info": {
        "get": {
          "operationId": "SettingController_getInfo",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取配置信息成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingSiteConfigDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "key": "main",
                        "basic": {},
                        "system": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取配置信息",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/update": {
        "post": {
          "operationId": "SettingController_update",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingModifiedDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "modified": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新配置",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/admin/sites": {
        "get": {
          "operationId": "SettingController_getAllSites",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取站点列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/SettingSiteConfigDataDto"
                        }
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取所有站点列表",
          "tags": [
            "系统配置"
          ]
        },
        "post": {
          "operationId": "SettingController_createSite",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建站点成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingKeyDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "key": "new_site"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建新站点",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/admin/sites/{key}": {
        "delete": {
          "operationId": "SettingController_deleteSite",
          "parameters": [
            {
              "name": "key",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除站点成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingDeletedDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除站点",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/admin/site": {
        "get": {
          "operationId": "SettingController_getSiteConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取站点配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingSiteConfigDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "key": "main",
                        "basic": {},
                        "system": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取站点配置",
          "tags": [
            "系统配置"
          ]
        },
        "post": {
          "operationId": "SettingController_updateSiteConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新站点配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingModifiedDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "modified": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新站点配置",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/admin/system": {
        "get": {
          "operationId": "SettingController_getSystemConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取系统配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "upload": {},
                        "storage": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取系统配置",
          "tags": [
            "系统配置"
          ]
        },
        "post": {
          "operationId": "SettingController_updateSystemConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新系统配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingModifiedDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "modified": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新系统配置",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/config/site/public": {
        "get": {
          "operationId": "SettingPublicController_getPublicSiteConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取站点公开配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SettingPublicSiteConfigDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "key": "main",
                        "basic": {},
                        "header": {},
                        "seo": {},
                        "app_seo": {},
                        "footer": {},
                        "friend_links": [],
                        "quick_links": [],
                        "is_active": true,
                        "is_maintenance": false
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "获取站点公开配置（Web 前台）",
          "tags": [
            "系统配置"
          ]
        }
      },
      "/resources/list": {
        "get": {
          "operationId": "ResourcesController_listResources",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询资源列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询资源列表",
          "tags": [
            "下载管理"
          ]
        },
        "post": {
          "operationId": "ResourcesController_createResource",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建资源成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "resource_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建资源",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/resources/list/{id}": {
        "put": {
          "operationId": "ResourcesController_updateResource",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "资源ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新资源成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "resource_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新资源",
          "tags": [
            "下载管理"
          ]
        },
        "delete": {
          "operationId": "ResourcesController_deleteResource",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "资源ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除资源成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除资源",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/resources/channels": {
        "get": {
          "operationId": "ResourcesController_listChannels",
          "parameters": [
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_active",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询渠道列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询渠道",
          "tags": [
            "下载管理"
          ]
        },
        "post": {
          "operationId": "ResourcesController_createChannel",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建渠道成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "channel_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建渠道",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/resources/channels/{id}": {
        "put": {
          "operationId": "ResourcesController_updateChannel",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "渠道ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新渠道成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "channel_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新渠道",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/resources/channels/{id}/status": {
        "patch": {
          "operationId": "ResourcesController_setChannelStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "渠道ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新渠道状态成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "channel_id",
                        "is_active": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新渠道状态",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/resources/updates": {
        "get": {
          "operationId": "ResourcesController_listUpdates",
          "parameters": [
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "version_date",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_hot",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "source_type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询更新任务成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "分页查询更新任务",
          "tags": [
            "下载管理"
          ]
        }
      },
      "/articles/admin/list": {
        "get": {
          "operationId": "ArticleController_adminList",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_top",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_recommended",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pkg",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询文章列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台分页查询文章",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/articles/admin": {
        "post": {
          "operationId": "ArticleController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建文章成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "article_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建文章",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/articles/admin/{id}": {
        "put": {
          "operationId": "ArticleController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "文章ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新文章成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "article_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新文章",
          "tags": [
            "文章管理"
          ]
        },
        "delete": {
          "operationId": "ArticleController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "文章ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除文章成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除文章",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/articles/admin/{id}/status": {
        "patch": {
          "operationId": "ArticleController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "文章ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新状态成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "article_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新文章状态",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/articles/admin/{id}/top": {
        "patch": {
          "operationId": "ArticleController_setTop",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "文章ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "设置置顶成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "article_id",
                        "is_top": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置文章置顶",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/articles/admin/{id}/recommend": {
        "patch": {
          "operationId": "ArticleController_setRecommend",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "文章ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "设置推荐成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "article_id",
                        "is_recommended": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置文章推荐",
          "tags": [
            "文章管理"
          ]
        }
      },
      "/client/webview-acceleration": {
        "get": {
          "operationId": "WebviewAccelerationController_getClientPolicy",
          "parameters": [
            {
              "name": "site_name",
              "required": false,
              "in": "query",
              "description": "Site name",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "strategy_id",
              "required": false,
              "in": "query",
              "description": "Specific strategy id; if provided, takes precedence",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "enabled": false,
                        "policyVersion": "fallback-2026-03-08T12:00:00.000Z",
                        "updatedAt": "2026-03-08T12:00:00.000Z",
                        "expiresAt": "2026-03-08T12:10:00.000Z",
                        "subscriptionUrl": null,
                        "inlineNode": null,
                        "selector": {
                          "mode": "first",
                          "index": 0,
                          "preferType": ""
                        },
                        "rules": [],
                        "userAgentEnabled": false,
                        "userAgentStrategy": "fixed",
                        "userAgent": "",
                        "userAgentPool": [],
                        "injectCss": "",
                        "injectJs": ""
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Get client WebView acceleration policy",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/admin/list": {
        "get": {
          "operationId": "WebviewAccelerationController_list",
          "parameters": [
            {
              "name": "q",
              "required": false,
              "in": "query",
              "description": "Keyword in name/description",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "siteName",
              "required": false,
              "in": "query",
              "description": "Site name",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "isActive",
              "required": false,
              "in": "query",
              "description": "true/false",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "Page number",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "Page size",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "List WebView acceleration policies",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/admin/{id}": {
        "get": {
          "operationId": "WebviewAccelerationController_detail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Policy id",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "policy_id",
                        "name": "default"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Get one WebView acceleration policy",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/create": {
        "post": {
          "operationId": "WebviewAccelerationController_create",
          "parameters": [],
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "policy_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Create WebView acceleration policy",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/update/{id}": {
        "put": {
          "operationId": "WebviewAccelerationController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Policy id",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "policy_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Update WebView acceleration policy",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/admin/status/{id}": {
        "patch": {
          "operationId": "WebviewAccelerationController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Policy id",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Status updated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "policy_id",
                        "isActive": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Update WebView acceleration policy status",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/webview-acceleration/delete/{id}": {
        "delete": {
          "operationId": "WebviewAccelerationController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Policy id",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Deleted",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Delete WebView acceleration policy",
          "tags": [
            "WebView Acceleration"
          ]
        }
      },
      "/content/feed": {
        "get": {
          "operationId": "ContentController_publicFeed",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 50",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "post_type",
              "required": false,
              "in": "query",
              "description": "内容类型：news/post",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "topic_id",
              "required": false,
              "in": "query",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "应用 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": false,
              "in": "query",
              "description": "关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sort",
              "required": false,
              "in": "query",
              "description": "排序方式：latest/hot/latest_reply",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "内容中心公开列表（新闻/帖子混排）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/public/{id}": {
        "get": {
          "operationId": "ContentController_publicDetail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentDetailDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "title": "标题",
                        "extra": {}
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "内容中心公开详情",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/public/{id}/comments": {
        "get": {
          "operationId": "ContentController_publicComments",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "replyPageSize",
              "required": false,
              "in": "query",
              "description": "每条根评论返回的回复数量，默认 20，最大 50",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sort",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "公开评论列表（楼中楼）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/public/{id}/comments/{rootId}/replies": {
        "get": {
          "operationId": "ContentController_publicCommentReplies",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "rootId",
              "required": true,
              "in": "path",
              "description": "根评论 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码，默认 1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量，默认 20，最大 100",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sort",
              "required": false,
              "in": "query",
              "description": "排序：latest/hot",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "root_comment": {},
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "公开评论回复分页列表（用于查看更多回复）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/{id}/comments": {
        "post": {
          "operationId": "ContentController_comment",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentCommentPayloadDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "提交成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentCommentSubmitDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "comment_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "发表评论/回复（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/comments/{id}/like": {
        "post": {
          "operationId": "ContentController_likeComment",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "评论 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentLikePayloadDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "操作成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentLikeDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "liked": true,
                        "like_count": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "评论点赞/取消点赞（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/comments/{id}/like-status": {
        "get": {
          "operationId": "ContentController_commentLikeStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "评论 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentLikeStatusDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "liked": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询当前用户评论点赞状态（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/{id}/like": {
        "post": {
          "operationId": "ContentController_like",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentLikePayloadDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "操作成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentLikeDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "liked": true,
                        "like_count": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "点赞/取消点赞（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/{id}/like-status": {
        "get": {
          "operationId": "ContentController_likeStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentLikeStatusDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "liked": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询当前用户点赞状态（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/public": {
        "get": {
          "operationId": "ContentController_publicTopics",
          "parameters": [
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sort",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "公开话题列表",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/public/{idOrSlug}": {
        "get": {
          "operationId": "ContentController_publicTopicDetail",
          "parameters": [
            {
              "name": "idOrSlug",
              "required": true,
              "in": "path",
              "description": "话题 ID 或 slug",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "topic_id",
                        "name": "话题名",
                        "slug": "huati"
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "公开话题详情（支持 ID 或 slug）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/suggest": {
        "get": {
          "operationId": "ContentController_suggestTopics",
          "parameters": [
            {
              "name": "q",
              "required": false,
              "in": "query",
              "description": "关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "数量，默认 10",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": false,
              "in": "query",
              "description": "绑定游戏 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "话题联想搜索（用于 # 输入）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/quick-create": {
        "post": {
          "operationId": "ContentController_quickCreateTopic",
          "parameters": [],
          "responses": {
            "200": {
              "description": "创建成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "created": true,
                        "topic": {
                          "_id": "topic_id",
                          "name": "话题名"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "快捷创建话题（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{id}/follow-status": {
        "get": {
          "operationId": "ContentController_topicFollowStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": true,
                        "topic_id": "topic_id",
                        "followers_count": 123
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "查询当前用户话题关注状态（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{id}/follow": {
        "post": {
          "operationId": "ContentController_followTopic",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "关注成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": true,
                        "topic_id": "topic_id",
                        "followers_count": 123
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "关注话题（需登录）",
          "tags": [
            "内容中心"
          ]
        },
        "delete": {
          "operationId": "ContentController_unfollowTopic",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "取消成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "followed": false,
                        "topic_id": "topic_id",
                        "followers_count": 122
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "取消关注话题（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/my/topics/follows": {
        "get": {
          "operationId": "ContentController_myTopicFollows",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "我的关注话题列表（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/apps/search": {
        "get": {
          "operationId": "ContentController_searchApps",
          "parameters": [
            {
              "name": "q",
              "required": true,
              "in": "query",
              "description": "关键词（游戏名/包名）",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "limit",
              "required": false,
              "in": "query",
              "description": "返回数量，默认 10，最大 30",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentSearchAppsDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [
                          {
                            "_id": "app_id",
                            "name": "游戏名",
                            "pkg": "com.demo.app",
                            "icon": ""
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "用户发帖游戏快捷搜索（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/posts": {
        "post": {
          "operationId": "ContentController_createUserPost",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建成功（进入待审核）",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/ContentPublishPostDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "review_status": "pending",
                        "status": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "用户发布帖子（需登录，自动绑定作者）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/my/posts": {
        "get": {
          "operationId": "ContentController_myPosts",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "review_status",
              "required": false,
              "in": "query",
              "description": "审核状态：draft/pending/published/rejected",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "上下线状态：0/1",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": false,
              "in": "query",
              "description": "关键词",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取我的帖子列表（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/my/posts/{id}": {
        "get": {
          "operationId": "ContentController_myPostDetail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "帖子 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "title": "标题"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取我的帖子详情（需登录）",
          "tags": [
            "内容中心"
          ]
        },
        "put": {
          "operationId": "ContentController_updateMyPost",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "帖子 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "title": "标题"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "编辑我的帖子（需登录）",
          "tags": [
            "内容中心"
          ]
        },
        "delete": {
          "operationId": "ContentController_deleteMyPost",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "帖子 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除我的帖子（需登录）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/list": {
        "get": {
          "operationId": "ContentController_adminList",
          "parameters": [
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "post_type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "review_status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_top",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "is_recommended",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "topic_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台内容列表",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin": {
        "post": {
          "operationId": "ContentController_adminCreate",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台创建内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}": {
        "put": {
          "operationId": "ContentController_adminUpdate",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台更新内容",
          "tags": [
            "内容中心"
          ]
        },
        "delete": {
          "operationId": "ContentController_adminDelete",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}/review": {
        "patch": {
          "operationId": "ContentController_review",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "审核成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "review_status": "published"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "审核内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}/status": {
        "patch": {
          "operationId": "ContentController_status",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "上下架内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/batch/status": {
        "patch": {
          "operationId": "ContentController_batchStatus",
          "parameters": [],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "matched": 2,
                        "modified": 2,
                        "status": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量上下架内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}/top": {
        "patch": {
          "operationId": "ContentController_top",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "is_top": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置置顶",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}/recommend": {
        "patch": {
          "operationId": "ContentController_recommend",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "is_recommended": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置推荐",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/batch/delete": {
        "post": {
          "operationId": "ContentController_adminBatchDelete",
          "parameters": [],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "matched": 2,
                        "modified": 2,
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量删除内容",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/{id}/comments": {
        "post": {
          "operationId": "ContentController_adminComment",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentCommentPayloadDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "提交成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "comment_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台发表评论/回复",
          "tags": [
            "内容中心"
          ]
        },
        "get": {
          "operationId": "ContentController_adminComments",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台评论列表",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/comments": {
        "get": {
          "operationId": "ContentController_adminAllComments",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页条数（最大 100）",
              "schema": {
                "example": 20,
                "type": "number"
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "评论状态",
              "schema": {
                "example": 1,
                "type": "number",
                "enum": [
                  0,
                  1
                ]
              }
            },
            {
              "name": "topic_id",
              "required": false,
              "in": "query",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "post_id",
              "required": false,
              "in": "query",
              "description": "帖子 ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "评论关键词",
              "schema": {
                "example": "测试",
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "用户关键词（昵称/ID）",
              "schema": {
                "example": "zaidu",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "内容中心评论列表（支持按话题/帖子筛选）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/comments/{commentId}/context": {
        "get": {
          "operationId": "ContentController_adminCommentContext",
          "parameters": [
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "description": "评论 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "comment": {},
                        "parent_comment": null,
                        "post": {},
                        "root_comment": {},
                        "thread_comments": [],
                        "topic_infos": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "评论治理详情上下文（楼中楼链路）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/comments/{commentId}/status": {
        "patch": {
          "operationId": "ContentController_adminCommentStatus",
          "parameters": [
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "description": "评论 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentAdminSetCommentStatusDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "comment_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台更新评论状态",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/comments/status-batch": {
        "patch": {
          "operationId": "ContentController_adminBatchCommentStatus",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentAdminBatchSetCommentStatusDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "failed": [],
                        "failed_count": 0,
                        "success": 0,
                        "total": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "批量更新评论状态",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/topics": {
        "get": {
          "operationId": "ContentController_adminTopicList",
          "parameters": [
            {
              "name": "page",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "q",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "type",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "app_id",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sort",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台话题列表",
          "tags": [
            "内容中心"
          ]
        },
        "post": {
          "operationId": "ContentController_createTopic",
          "parameters": [],
          "responses": {
            "201": {
              "description": "创建成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "topic_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建话题",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/topics/{id}": {
        "put": {
          "operationId": "ContentController_updateTopic",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "topic_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新话题",
          "tags": [
            "内容中心"
          ]
        },
        "delete": {
          "operationId": "ContentController_deleteTopic",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除话题",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/admin/topics/{id}/moderators": {
        "patch": {
          "operationId": "ContentController_setTopicModerators",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "设置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "topic_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "设置话题版主",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{id}/moderation": {
        "patch": {
          "operationId": "ContentController_moderatorUpdateTopic",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "话题 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "topic_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "话题版主更新话题治理项（锁定/推荐/公告/置顶）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{topicId}/moderation/posts/{postId}": {
        "delete": {
          "operationId": "ContentController_moderatorDeletePost",
          "parameters": [
            {
              "name": "topicId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "postId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "话题版主删除帖子",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{topicId}/moderation/posts/{postId}/status": {
        "patch": {
          "operationId": "ContentController_moderatorSetPostStatus",
          "parameters": [
            {
              "name": "topicId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "postId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "post_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "话题版主上下线帖子",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{topicId}/moderation/comments/{commentId}": {
        "delete": {
          "operationId": "ContentController_moderatorDeleteComment",
          "parameters": [
            {
              "name": "topicId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "reason",
              "required": true,
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentCommentModerationReasonDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true,
                        "removed": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "话题版主删除评论",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/content/topics/{topicId}/moderation/comments/{commentId}/status": {
        "patch": {
          "operationId": "ContentController_moderatorSetCommentStatus",
          "parameters": [
            {
              "name": "topicId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContentAdminSetCommentStatusDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "comment_id",
                        "status": 1
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "话题版主上下线评论",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/share/content/{id}": {
        "get": {
          "operationId": "ShareController_shareDetail",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "内容 ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "返回可直接渲染的分享页 HTML",
              "content": {
                "text/html": {
                  "schema": {
                    "type": "string"
                  }
                }
              }
            },
            "404": {
              "description": "内容不存在或已下线，返回 404 HTML 页面"
            }
          },
          "summary": "公开分享页（HTML）",
          "tags": [
            "内容中心"
          ]
        }
      },
      "/client/version/check": {
        "get": {
          "operationId": "ClientVersionController_check",
          "parameters": [
            {
              "name": "region",
              "required": false,
              "in": "query",
              "description": "地区编码",
              "schema": {}
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "用户ID（灰度命中兜底）",
              "schema": {}
            },
            {
              "name": "device_id",
              "required": false,
              "in": "query",
              "description": "设备ID（灰度命中）",
              "schema": {}
            },
            {
              "name": "current_version_code",
              "required": false,
              "in": "query",
              "description": "当前版本码",
              "schema": {}
            },
            {
              "name": "current_version",
              "required": false,
              "in": "query",
              "description": "当前版本号，如 1.0.3",
              "schema": {}
            },
            {
              "name": "pkg",
              "required": false,
              "in": "query",
              "description": "应用包名",
              "schema": {}
            },
            {
              "name": "channel",
              "required": false,
              "in": "query",
              "description": "渠道，如 official/googleplay",
              "schema": {}
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台，默认 android",
              "schema": {}
            }
          ],
          "responses": {
            "200": {
              "description": "版本检查成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "update_available": true,
                        "force_update": false,
                        "latest": {
                          "latest_version": "1.2.0",
                          "latest_version_code": 120,
                          "release_notes": "修复若干问题",
                          "download_url": "https://cdn.example.com/app.apk",
                          "file_size": 42800000,
                          "file_size_text": "40.82 MB"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "客户端版本检查（安卓）",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client/landing/app": {
        "get": {
          "operationId": "ClientVersionController_landingApp",
          "parameters": [
            {
              "name": "pkg",
              "required": false,
              "in": "query",
              "description": "包名（可选）",
              "schema": {}
            },
            {
              "name": "channel",
              "required": false,
              "in": "query",
              "description": "渠道，默认 official",
              "schema": {}
            },
            {
              "name": "platform",
              "required": false,
              "in": "query",
              "description": "平台，默认 android",
              "schema": {}
            },
            {
              "name": "key",
              "required": false,
              "in": "query",
              "description": "站点标识，默认 main",
              "schema": {}
            }
          ],
          "responses": {
            "200": {
              "description": "获取成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "key": "main",
                        "site": {
                          "site_name": "APKScc",
                          "site_slogan": "APKScc - 安卓游戏与应用下载平台",
                          "logo_url": "https://cdn.example.com/logo.png",
                          "favicon_url": "https://cdn.example.com/favicon.ico",
                          "seo": {
                            "description": "安卓游戏与应用下载平台",
                            "keywords": "apk,game,download",
                            "title_suffix": " - APKScc"
                          }
                        },
                        "client": {
                          "latest_version": "2.4.0",
                          "latest_version_code": 240,
                          "download_url": "https://cdn.example.com/app.apk",
                          "file_size": 42800000,
                          "file_size_text": "40.82 MB"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "summary": "下载落地页聚合信息（Web /download/app）",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/list": {
        "get": {
          "operationId": "ClientVersionController_adminList",
          "parameters": [],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台版本规则列表",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/logs": {
        "get": {
          "operationId": "ClientVersionController_adminLogs",
          "parameters": [],
          "responses": {
            "200": {
              "description": "查询成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "后台版本规则审计日志",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/create": {
        "post": {
          "operationId": "ClientVersionController_create",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateClientVersionDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "创建成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "rule_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "创建版本规则",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/update/{id}": {
        "put": {
          "operationId": "ClientVersionController_update",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "规则ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateClientVersionDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "rule_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新版本规则",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/status/{id}": {
        "patch": {
          "operationId": "ClientVersionController_setStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "规则ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "更新成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "rule_id",
                        "is_active": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新规则状态",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/client-version/admin/delete/{id}": {
        "delete": {
          "operationId": "ClientVersionController_remove",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "规则ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "删除成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "deleted": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "删除版本规则",
          "tags": [
            "客户端版本"
          ]
        }
      },
      "/task-scheduler/admin/executors": {
        "get": {
          "operationId": "TaskSchedulerController_listExecutors",
          "parameters": [],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": [
                        {
                          "key": "admin.content.update"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "List available task executors",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks": {
        "get": {
          "operationId": "TaskSchedulerController_listTasks",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "example": 20,
                "type": "number"
              }
            },
            {
              "name": "task_key",
              "required": false,
              "in": "query",
              "description": "任务类型 key",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "任务名称关键词",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "enabled",
              "required": false,
              "in": "query",
              "description": "是否启用",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "page": 1,
                        "pageSize": 20,
                        "total": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "List scheduled tasks",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks/upsert": {
        "post": {
          "operationId": "TaskSchedulerController_upsertTask",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpsertTaskBodyDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Saved",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "task_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Create or update task",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks/{id}/toggle": {
        "post": {
          "operationId": "TaskSchedulerController_toggleTask",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Task ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "enabled",
              "required": true,
              "in": "query",
              "schema": {
                "type": "boolean"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "_id": "task_id",
                        "enabled": true
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Enable or disable task",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks/{id}/run": {
        "post": {
          "operationId": "TaskSchedulerController_runTask",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Task ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RunTaskBodyDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Triggered",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "task_id": "task_id",
                        "job_id": "job_id"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Run task now",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks/{id}/run-manual": {
        "post": {
          "operationId": "TaskSchedulerController_runTaskManual",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Task ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RunTaskBodyDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Executed",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "task_id": "task_id",
                        "trigger_type": "manual"
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Run task manually (execute now without queue)",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/tasks/{id}/stop": {
        "post": {
          "operationId": "TaskSchedulerController_stopTask",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Task ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Stopped",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "task_id": "task_id",
                        "removed_jobs": 0,
                        "active_jobs": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Stop task scheduling and pending jobs",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/task-scheduler/admin/runs": {
        "get": {
          "operationId": "TaskSchedulerController_listRuns",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "页码",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "每页数量",
              "schema": {
                "example": 20,
                "type": "number"
              }
            },
            {
              "name": "task_id",
              "required": false,
              "in": "query",
              "description": "任务ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "task_key",
              "required": false,
              "in": "query",
              "description": "任务类型 key",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "status",
              "required": false,
              "in": "query",
              "description": "执行状态",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "page": 1,
                        "pageSize": 20,
                        "total": 0
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "List task run history",
          "tags": [
            "Task Scheduler"
          ]
        }
      },
      "/logs/admin/list": {
        "get": {
          "operationId": "LogsController_getSystemLogs",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "Page number",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "Page size",
              "schema": {
                "example": 50,
                "type": "number"
              }
            },
            {
              "name": "source",
              "required": false,
              "in": "query",
              "description": "all | combined | error | tracking | import | task_scheduler | upload",
              "schema": {
                "example": "all",
                "type": "string",
                "enum": [
                  "all",
                  "combined",
                  "error",
                  "tracking",
                  "import",
                  "task_scheduler",
                  "upload"
                ]
              }
            },
            {
              "name": "level",
              "required": false,
              "in": "query",
              "description": "error | warn | info | debug | verbose",
              "schema": {
                "type": "string",
                "enum": [
                  "error",
                  "warn",
                  "info",
                  "debug",
                  "verbose"
                ]
              }
            },
            {
              "name": "context",
              "required": false,
              "in": "query",
              "description": "Log context",
              "schema": {
                "example": "Bootstrap",
                "type": "string"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "Keyword search in message and payload",
              "schema": {
                "example": "Tracking",
                "type": "string"
              }
            },
            {
              "name": "log_type",
              "required": false,
              "in": "query",
              "description": "Task log type filter, e.g. task_admin_update_all_gp / task_admin_content_update_gp",
              "schema": {
                "example": "task_admin_update_all_gp",
                "type": "string"
              }
            },
            {
              "name": "request_id",
              "required": false,
              "in": "query",
              "description": "Request id filter",
              "schema": {
                "example": "f4e3e1e5-97b1-4ef4-a47a-1f3f89fca8aa",
                "type": "string"
              }
            },
            {
              "name": "path",
              "required": false,
              "in": "query",
              "description": "Request path filter",
              "schema": {
                "example": "/admin/content",
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "User id exact match",
              "schema": {
                "example": "6972244ef772558bc8e0f5e6",
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "User keyword in user_id or user_name",
              "schema": {
                "example": "super_admin",
                "type": "string"
              }
            },
            {
              "name": "ip",
              "required": false,
              "in": "query",
              "description": "IP exact or fuzzy match",
              "schema": {
                "example": "127.0.0.1",
                "type": "string"
              }
            },
            {
              "name": "ip_region",
              "required": false,
              "in": "query",
              "description": "IP region fuzzy match",
              "schema": {
                "example": "CN",
                "type": "string"
              }
            },
            {
              "name": "start_time",
              "required": false,
              "in": "query",
              "description": "Start timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T00:00:00.000Z",
                "type": "string"
              }
            },
            {
              "name": "end_time",
              "required": false,
              "in": "query",
              "description": "End timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T23:59:59.999Z",
                "type": "string"
              }
            },
            {
              "name": "realtime",
              "required": false,
              "in": "query",
              "description": "true/false",
              "schema": {
                "example": false,
                "type": "boolean"
              }
            },
            {
              "name": "cursor",
              "required": false,
              "in": "query",
              "description": "Use previous next_cursor",
              "schema": {
                "example": "2026-03-22T05:01:00.000Z",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Query success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SystemLogListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 50,
                        "realtime": false,
                        "next_cursor": ""
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "System log list",
          "tags": [
            "Logs"
          ]
        }
      },
      "/logs/admin/operations": {
        "get": {
          "operationId": "LogsController_getAdminOperationLogs",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "Page number",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "Page size (max 200)",
              "schema": {
                "example": 20,
                "type": "number"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "Keyword in username, name, path, or error",
              "schema": {
                "example": "publish",
                "type": "string"
              }
            },
            {
              "name": "operator_id",
              "required": false,
              "in": "query",
              "description": "Operator user id",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "role_code",
              "required": false,
              "in": "query",
              "description": "Role code",
              "schema": {
                "example": "admin",
                "type": "string"
              }
            },
            {
              "name": "method",
              "required": false,
              "in": "query",
              "description": "HTTP method",
              "schema": {
                "type": "string",
                "enum": [
                  "GET",
                  "POST",
                  "PUT",
                  "PATCH",
                  "DELETE"
                ]
              }
            },
            {
              "name": "path",
              "required": false,
              "in": "query",
              "description": "Request path filter",
              "schema": {
                "example": "/admin/content",
                "type": "string"
              }
            },
            {
              "name": "success",
              "required": false,
              "in": "query",
              "description": "Operation success filter",
              "schema": {
                "example": true,
                "type": "boolean"
              }
            },
            {
              "name": "start_time",
              "required": false,
              "in": "query",
              "description": "Start timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T00:00:00.000Z",
                "type": "string"
              }
            },
            {
              "name": "end_time",
              "required": false,
              "in": "query",
              "description": "End timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T23:59:59.999Z",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Query success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/AdminOperationLogListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 20
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "Admin operation log list",
          "tags": [
            "Logs"
          ]
        }
      },
      "/log-system/list": {
        "get": {
          "operationId": "LogSystemController_list",
          "parameters": [
            {
              "name": "page",
              "required": false,
              "in": "query",
              "description": "Page number",
              "schema": {
                "example": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "Page size",
              "schema": {
                "example": 50,
                "type": "number"
              }
            },
            {
              "name": "source",
              "required": false,
              "in": "query",
              "description": "all | combined | error | tracking | import | task_scheduler | upload",
              "schema": {
                "example": "all",
                "type": "string",
                "enum": [
                  "all",
                  "combined",
                  "error",
                  "tracking",
                  "import",
                  "task_scheduler",
                  "upload"
                ]
              }
            },
            {
              "name": "level",
              "required": false,
              "in": "query",
              "description": "error | warn | info | debug | verbose",
              "schema": {
                "type": "string",
                "enum": [
                  "error",
                  "warn",
                  "info",
                  "debug",
                  "verbose"
                ]
              }
            },
            {
              "name": "context",
              "required": false,
              "in": "query",
              "description": "Log context",
              "schema": {
                "example": "Bootstrap",
                "type": "string"
              }
            },
            {
              "name": "keyword",
              "required": false,
              "in": "query",
              "description": "Keyword search in message and payload",
              "schema": {
                "example": "Tracking",
                "type": "string"
              }
            },
            {
              "name": "log_type",
              "required": false,
              "in": "query",
              "description": "Task log type filter, e.g. task_admin_update_all_gp / task_admin_content_update_gp",
              "schema": {
                "example": "task_admin_update_all_gp",
                "type": "string"
              }
            },
            {
              "name": "request_id",
              "required": false,
              "in": "query",
              "description": "Request id filter",
              "schema": {
                "example": "f4e3e1e5-97b1-4ef4-a47a-1f3f89fca8aa",
                "type": "string"
              }
            },
            {
              "name": "path",
              "required": false,
              "in": "query",
              "description": "Request path filter",
              "schema": {
                "example": "/admin/content",
                "type": "string"
              }
            },
            {
              "name": "user_id",
              "required": false,
              "in": "query",
              "description": "User id exact match",
              "schema": {
                "example": "6972244ef772558bc8e0f5e6",
                "type": "string"
              }
            },
            {
              "name": "user_keyword",
              "required": false,
              "in": "query",
              "description": "User keyword in user_id or user_name",
              "schema": {
                "example": "super_admin",
                "type": "string"
              }
            },
            {
              "name": "ip",
              "required": false,
              "in": "query",
              "description": "IP exact or fuzzy match",
              "schema": {
                "example": "127.0.0.1",
                "type": "string"
              }
            },
            {
              "name": "ip_region",
              "required": false,
              "in": "query",
              "description": "IP region fuzzy match",
              "schema": {
                "example": "CN",
                "type": "string"
              }
            },
            {
              "name": "start_time",
              "required": false,
              "in": "query",
              "description": "Start timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T00:00:00.000Z",
                "type": "string"
              }
            },
            {
              "name": "end_time",
              "required": false,
              "in": "query",
              "description": "End timestamp (ISO string)",
              "schema": {
                "example": "2026-03-22T23:59:59.999Z",
                "type": "string"
              }
            },
            {
              "name": "realtime",
              "required": false,
              "in": "query",
              "description": "true/false",
              "schema": {
                "example": false,
                "type": "boolean"
              }
            },
            {
              "name": "cursor",
              "required": false,
              "in": "query",
              "description": "Use previous next_cursor",
              "schema": {
                "example": "2026-03-22T05:01:00.000Z",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Query success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "$ref": "#/components/schemas/SystemLogListDataDto"
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [],
                        "total": 0,
                        "page": 1,
                        "pageSize": 50,
                        "realtime": false,
                        "next_cursor": ""
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "日志系统列表（默认返回定时任务日志，可按 source 切换）",
          "tags": [
            "Logs"
          ]
        }
      },
      "/mcp": {
        "post": {
          "operationId": "McpController_rpc",
          "parameters": [],
          "responses": {
            "201": {
              "description": ""
            }
          },
          "summary": "MCP JSON-RPC endpoint (public, read-only tools)",
          "tags": [
            "MCP"
          ]
        }
      },
      "/ai-assistant/admin/config": {
        "get": {
          "operationId": "AiAssistantController_getConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "获取 AI 配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "enabled": false,
                        "selected_model_id": "",
                        "models": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取 AI 助手配置",
          "tags": [
            "AI助手"
          ]
        },
        "post": {
          "operationId": "AiAssistantController_updateConfig",
          "parameters": [
            {
              "name": "key",
              "required": false,
              "in": "query",
              "schema": {
                "example": "main",
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateAiConfigDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "更新 AI 配置成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "enabled": true,
                        "selected_model_id": "model_id",
                        "models": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "更新 AI 助手配置",
          "tags": [
            "AI助手"
          ]
        }
      },
      "/ai-assistant/admin/tools": {
        "get": {
          "operationId": "AiAssistantController_getTools",
          "parameters": [],
          "responses": {
            "200": {
              "description": "获取工具列表成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": []
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "获取 AI 运营工具列表",
          "tags": [
            "AI助手"
          ]
        }
      },
      "/ai-assistant/admin/chat/stream": {
        "post": {
          "operationId": "AiAssistantController_chatStream",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AiChatStreamDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": ""
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "AI 对话流式输出（SSE）",
          "tags": [
            "AI助手"
          ]
        }
      },
      "/ai-assistant/admin/ops/albums/random-preview": {
        "post": {
          "operationId": "AiAssistantController_previewRandomPick",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AlbumRandomPickPreviewDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "预览成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "album_id": "album_id",
                        "album_title": "专辑标题",
                        "count": 10,
                        "total_candidates": 100,
                        "picked": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "随机选取专辑游戏（预览）",
          "tags": [
            "AI助手"
          ]
        }
      },
      "/ai-assistant/admin/ops/albums/random-apply": {
        "post": {
          "operationId": "AiAssistantController_applyRandomPick",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AlbumRandomPickApplyDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "执行成功",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "code": {
                        "type": "number",
                        "example": 0
                      },
                      "message": {
                        "type": "string",
                        "example": "ok"
                      },
                      "data": {
                        "nullable": true
                      }
                    },
                    "required": [
                      "code",
                      "message",
                      "data"
                    ],
                    "example": {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "album_id": "album_id",
                        "append_mode": true,
                        "added_count": 10,
                        "total_after": 50,
                        "picked": []
                      }
                    }
                  }
                }
              }
            }
          },
          "security": [
            {
              "JWT-auth": []
            }
          ],
          "summary": "随机选取并写入专辑游戏",
          "tags": [
            "AI助手"
          ]
        }
      }
    },
    "info": {
      "title": "Interface API",
      "description": "Interface backend API documentation.",
      "version": "1.0",
      "contact": {}
    },
    "tags": [
      {
        "name": "认证",
        "description": "登录、注册、鉴权相关接口"
      },
      {
        "name": "用户管理",
        "description": "用户资料、角色分配、封禁管理"
      },
      {
        "name": "角色管理",
        "description": "角色与权限管理"
      },
      {
        "name": "应用管理",
        "description": "应用、下载、资源相关接口"
      },
      {
        "name": "专辑管理",
        "description": "专辑与推荐位管理"
      },
      {
        "name": "轮播图管理",
        "description": "首页轮播配置管理"
      },
      {
        "name": "资源位管理",
        "description": "首页卡片配置管理"
      },
      {
        "name": "文章管理",
        "description": "资讯文章管理"
      },
      {
        "name": "系统配置",
        "description": "站点与系统设置"
      },
      {
        "name": "文件上传",
        "description": "上传与存储接口"
      },
      {
        "name": "反馈管理",
        "description": "用户反馈提交与处理"
      },
      {
        "name": "Feedback Config",
        "description": "反馈类型配置管理"
      },
      {
        "name": "内容中心",
        "description": "社区内容与评论管理"
      },
      {
        "name": "埋点统计",
        "description": "访问与下载链路统计"
      },
      {
        "name": "站内消息",
        "description": "通知与消息中心"
      },
      {
        "name": "公告管理",
        "description": "公告配置管理"
      },
      {
        "name": "下载管理",
        "description": "渠道与资源管理"
      },
      {
        "name": "客户端版本",
        "description": "客户端版本与升级策略"
      },
      {
        "name": "Task Scheduler",
        "description": "任务调度管理"
      },
      {
        "name": "WebView Acceleration",
        "description": "WebView 加速配置"
      },
      {
        "name": "Logs",
        "description": "系统日志与后台操作日志"
      },
      {
        "name": "MCP",
        "description": "MCP 协议对外开放接口"
      }
    ],
    "servers": [],
    "components": {
      "securitySchemes": {
        "JWT-auth": {
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "type": "http",
          "name": "JWT",
          "description": "Input JWT token.",
          "in": "header"
        }
      },
      "schemas": {
        "RegisterDto": {
          "type": "object",
          "properties": {
            "username": {
              "type": "string",
              "description": "用户名",
              "minLength": 3,
              "maxLength": 20
            },
            "email": {
              "type": "string",
              "description": "邮箱"
            },
            "password": {
              "type": "string",
              "description": "密码，至少 6 位，需包含大小写和数字/特殊字符",
              "minLength": 6
            },
            "name": {
              "type": "string",
              "description": "昵称"
            }
          },
          "required": [
            "username",
            "email",
            "password"
          ]
        },
        "LoginDto": {
          "type": "object",
          "properties": {
            "username": {
              "type": "string",
              "description": "用户名"
            },
            "password": {
              "type": "string",
              "description": "密码"
            },
            "device_id": {
              "type": "string",
              "description": "设备 ID"
            },
            "device_name": {
              "type": "string",
              "description": "设备名称"
            }
          },
          "required": [
            "username",
            "password"
          ]
        },
        "SendEmailCodeDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "description": "邮箱"
            },
            "type": {
              "type": "string",
              "description": "验证码用途",
              "enum": [
                "register",
                "login",
                "reset"
              ]
            }
          },
          "required": [
            "email",
            "type"
          ]
        },
        "RegisterByEmailDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "description": "邮箱"
            },
            "code": {
              "type": "string",
              "description": "6 位验证码",
              "minLength": 6,
              "maxLength": 6
            },
            "username": {
              "type": "string",
              "description": "用户名",
              "minLength": 3,
              "maxLength": 20
            },
            "password": {
              "type": "string",
              "description": "可选密码（不传则系统生成）",
              "minLength": 6
            },
            "name": {
              "type": "string",
              "description": "昵称"
            }
          },
          "required": [
            "email",
            "code",
            "username"
          ]
        },
        "LoginByEmailDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "description": "邮箱"
            },
            "code": {
              "type": "string",
              "description": "6 位验证码",
              "minLength": 6,
              "maxLength": 6
            },
            "device_id": {
              "type": "string",
              "description": "设备 ID"
            },
            "device_name": {
              "type": "string",
              "description": "设备名称"
            }
          },
          "required": [
            "email",
            "code"
          ]
        },
        "ChangePasswordDto": {
          "type": "object",
          "properties": {
            "oldPassword": {
              "type": "string",
              "description": "旧密码"
            },
            "newPassword": {
              "type": "string",
              "description": "新密码",
              "minLength": 6
            }
          },
          "required": [
            "oldPassword",
            "newPassword"
          ]
        },
        "CreateUserDto": {
          "type": "object",
          "properties": {
            "username": {
              "type": "string",
              "description": "用户名"
            },
            "email": {
              "type": "string",
              "description": "邮箱"
            },
            "password": {
              "type": "string",
              "description": "密码"
            },
            "name": {
              "type": "string",
              "description": "昵称"
            },
            "avatar": {
              "type": "string",
              "description": "头像 URL"
            },
            "gender": {
              "type": "string",
              "description": "性别",
              "enum": [
                "male",
                "female",
                "other",
                ""
              ]
            },
            "birthday": {
              "type": "string",
              "description": "生日（ISO 日期）",
              "example": "1998-01-01"
            },
            "phone": {
              "type": "string",
              "description": "手机号"
            },
            "country": {
              "type": "string",
              "description": "国家"
            },
            "province": {
              "type": "string",
              "description": "省份"
            },
            "city": {
              "type": "string",
              "description": "城市"
            },
            "ipAddress": {
              "type": "string",
              "description": "注册 IP"
            },
            "roleIds": {
              "description": "角色 ID 列表",
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "permissions": {
              "description": "直接权限码列表",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "username",
            "email",
            "password"
          ]
        },
        "UpdateProfileDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "昵称"
            },
            "avatar": {
              "type": "string",
              "description": "头像 URL"
            },
            "gender": {
              "type": "string",
              "description": "性别",
              "enum": [
                "male",
                "female",
                "other",
                ""
              ]
            },
            "birthday": {
              "type": "string",
              "description": "生日（ISO 日期）",
              "example": "1998-01-01"
            },
            "phone": {
              "type": "string",
              "description": "手机号"
            },
            "country": {
              "type": "string",
              "description": "国家"
            },
            "province": {
              "type": "string",
              "description": "省份"
            },
            "city": {
              "type": "string",
              "description": "城市"
            }
          }
        },
        "BanLoginIpDto": {
          "type": "object",
          "properties": {
            "ip": {
              "type": "string",
              "description": "IP 地址"
            },
            "reason": {
              "type": "string",
              "description": "封禁原因"
            }
          },
          "required": [
            "ip"
          ]
        },
        "BanLoginDeviceDto": {
          "type": "object",
          "properties": {
            "deviceId": {
              "type": "string",
              "description": "设备 ID"
            },
            "reason": {
              "type": "string",
              "description": "封禁原因"
            }
          },
          "required": [
            "deviceId"
          ]
        },
        "UpdateUserDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "昵称"
            },
            "avatar": {
              "type": "string",
              "description": "头像 URL"
            },
            "gender": {
              "type": "string",
              "description": "性别",
              "enum": [
                "male",
                "female",
                "other",
                ""
              ]
            },
            "birthday": {
              "type": "string",
              "description": "生日（ISO 日期）",
              "example": "1998-01-01"
            },
            "phone": {
              "type": "string",
              "description": "手机号"
            },
            "country": {
              "type": "string",
              "description": "国家"
            },
            "province": {
              "type": "string",
              "description": "省份"
            },
            "city": {
              "type": "string",
              "description": "城市"
            },
            "isActive": {
              "type": "boolean",
              "description": "是否启用"
            },
            "roleIds": {
              "description": "角色 ID 列表",
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "permissions": {
              "description": "直接权限码列表",
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "password": {
              "type": "string",
              "description": "新密码"
            }
          }
        },
        "BlockUserDto": {
          "type": "object",
          "properties": {
            "reason": {
              "type": "string",
              "description": "封禁原因"
            }
          },
          "required": [
            "reason"
          ]
        },
        "CreateRoleDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "角色名称",
              "example": "内容编辑"
            },
            "code": {
              "type": "string",
              "description": "角色代码（唯一标识）",
              "example": "content_editor"
            },
            "description": {
              "type": "string",
              "description": "角色描述",
              "example": "负责文章和新闻的编辑发布"
            },
            "permissions": {
              "description": "权限列表",
              "example": [
                "article:read",
                "article:create",
                "article:update"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "isDefault": {
              "type": "boolean",
              "description": "是否为默认角色（新用户自动分配）",
              "default": false
            }
          },
          "required": [
            "name",
            "code",
            "permissions"
          ]
        },
        "UpdateRoleDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "角色名称",
              "example": "内容编辑"
            },
            "description": {
              "type": "string",
              "description": "角色描述",
              "example": "负责文章和新闻的编辑发布"
            },
            "permissions": {
              "description": "权限列表",
              "example": [
                "article:read",
                "article:create",
                "article:update"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "isActive": {
              "type": "boolean",
              "description": "是否激活"
            }
          }
        },
        "UpdateGameStatusDto": {
          "type": "object",
          "properties": {}
        },
        "RefreshAppMediaDto": {
          "type": "object",
          "properties": {}
        },
        "CreateDownloadInfoDto": {
          "type": "object",
          "properties": {}
        },
        "TrackGameDetailDto": {
          "type": "object",
          "properties": {}
        },
        "InstalledUpdatesDto": {
          "type": "object",
          "properties": {}
        },
        "FollowReservationDto": {
          "type": "object",
          "properties": {}
        },
        "NotificationUnreadByCategoryDto": {
          "type": "object",
          "properties": {
            "system": {
              "type": "number",
              "example": 0
            },
            "reply": {
              "type": "number",
              "example": 0
            },
            "like": {
              "type": "number",
              "example": 0
            }
          },
          "required": [
            "system",
            "reply",
            "like"
          ]
        },
        "NotificationSummaryDataDto": {
          "type": "object",
          "properties": {
            "total_unread": {
              "type": "number",
              "example": 0
            },
            "unread_by_category": {
              "$ref": "#/components/schemas/NotificationUnreadByCategoryDto"
            }
          },
          "required": [
            "total_unread",
            "unread_by_category"
          ]
        },
        "NotificationItemDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "67f000000000000000000101"
            },
            "category": {
              "type": "string",
              "example": "system"
            },
            "title": {
              "type": "string",
              "example": "版本更新通知"
            },
            "content": {
              "type": "string",
              "example": "3.2.0 版本已发布"
            },
            "is_read": {
              "type": "boolean",
              "example": false
            },
            "created_at": {
              "type": "string",
              "example": "2026-03-13T10:10:00.000Z"
            }
          },
          "required": [
            "_id",
            "category",
            "title",
            "content",
            "is_read",
            "created_at"
          ]
        },
        "NotificationListDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/NotificationItemDto"
              }
            },
            "total": {
              "type": "number",
              "example": 0
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 20
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize"
          ]
        },
        "NotificationActionResultDataDto": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            }
          },
          "required": [
            "success"
          ]
        },
        "NotificationAdminUserItemDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "67f000000000000000000001"
            },
            "username": {
              "type": "string",
              "example": "user001"
            },
            "name": {
              "type": "string",
              "example": "Zhang San"
            },
            "email": {
              "type": "string",
              "example": "user001@example.com"
            },
            "avatar": {
              "type": "string",
              "example": ""
            },
            "isActive": {
              "type": "boolean",
              "example": true
            },
            "isBlocked": {
              "type": "boolean",
              "example": false
            }
          },
          "required": [
            "_id",
            "username",
            "name",
            "email",
            "avatar",
            "isActive",
            "isBlocked"
          ]
        },
        "NotificationAdminUsersDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/NotificationAdminUserItemDto"
              }
            },
            "total": {
              "type": "number",
              "example": 1
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 20
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize"
          ]
        },
        "NotificationSentLogItemDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "67f000000000000000000301"
            },
            "sender_name": {
              "type": "string",
              "example": "管理员"
            },
            "mode": {
              "type": "string",
              "example": "all"
            },
            "title": {
              "type": "string",
              "example": "版本更新通知"
            },
            "content": {
              "type": "string",
              "example": "3.2.0 版本已发布"
            },
            "recipient_count": {
              "type": "number",
              "example": 1024
            },
            "recipient_ids": {
              "example": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "created_at": {
              "type": "string",
              "example": "2026-03-13T10:10:00.000Z"
            }
          },
          "required": [
            "_id",
            "sender_name",
            "mode",
            "title",
            "content",
            "recipient_count",
            "recipient_ids",
            "created_at"
          ]
        },
        "NotificationSentLogsDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/NotificationSentLogItemDto"
              }
            },
            "total": {
              "type": "number",
              "example": 1
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 20
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize"
          ]
        },
        "NotificationAdminSendDataDto": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "mode": {
              "type": "string",
              "example": "single"
            },
            "recipient_count": {
              "type": "number",
              "example": 1
            },
            "recipient_ids": {
              "example": [
                "67f000000000000000000001"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "success",
            "mode",
            "recipient_count",
            "recipient_ids"
          ]
        },
        "SendSystemNotificationDto": {
          "type": "object",
          "properties": {
            "mode": {
              "type": "string",
              "description": "发送模式：single=单用户，all=全员",
              "enum": [
                "single",
                "all"
              ],
              "default": "single"
            },
            "user_id": {
              "type": "string",
              "description": "单用户发送时必填，目标用户 ID",
              "example": "67f000000000000000000001"
            },
            "title": {
              "type": "string",
              "description": "消息标题",
              "maxLength": 120
            },
            "content": {
              "type": "string",
              "description": "消息内容",
              "maxLength": 2000
            },
            "cover": {
              "type": "string",
              "description": "封面图 URL"
            },
            "target_type": {
              "type": "string",
              "description": "目标类型（如 post/app/url）"
            },
            "target_id": {
              "type": "string",
              "description": "目标 ID（如帖子ID、应用ID）"
            },
            "target_url": {
              "type": "string",
              "description": "跳转 URL"
            },
            "dedupe_key": {
              "type": "string",
              "description": "去重键（可选，单用户场景建议传）",
              "maxLength": 120
            }
          },
          "required": [
            "mode",
            "title"
          ]
        },
        "UploadDto": {
          "type": "object",
          "properties": {
            "scene": {
              "type": "string",
              "description": "上传场景",
              "example": "image"
            },
            "channel_id": {
              "type": "string",
              "description": "指定上传渠道ID（可选）",
              "example": "s3_1743000000000_ab12cd"
            },
            "channel_type": {
              "type": "string",
              "description": "指定上传渠道类型（可选）",
              "enum": [
                "s3",
                "image_hosting"
              ],
              "example": "s3"
            },
            "channel_config": {
              "type": "string",
              "description": "临时渠道配置 JSON（用于测试上传，不落库）。传入后可不传 channel_id",
              "example": "{\"r2_account_id\":\"xxx\",\"r2_access_key_id\":\"xxx\",\"r2_secret_access_key\":\"xxx\",\"r2_bucket_name\":\"xxx\",\"r2_public_domain\":\"https://cdn.example.com\",\"r2_custom_path\":\"uploads\"}"
            }
          }
        },
        "UploadResponseDto": {
          "type": "object",
          "properties": {
            "urls": {
              "description": "上传成功的文件 URL 列表",
              "example": [
                "https://cdn.example.com/uploads/avatar.png"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "count": {
              "type": "number",
              "description": "上传成功的文件数量",
              "example": 1
            },
            "storage_type": {
              "type": "string",
              "description": "存储类型",
              "example": "s3"
            }
          },
          "required": [
            "urls",
            "count",
            "storage_type"
          ]
        },
        "UploadTransferDto": {
          "type": "object",
          "properties": {
            "scene": {
              "type": "string",
              "description": "上传场景",
              "example": "image"
            },
            "channel_id": {
              "type": "string",
              "description": "指定上传渠道ID（可选）",
              "example": "s3_1743000000000_ab12cd"
            },
            "channel_type": {
              "type": "string",
              "description": "指定上传渠道类型（可选）",
              "enum": [
                "s3",
                "image_hosting"
              ],
              "example": "s3"
            },
            "channel_config": {
              "type": "string",
              "description": "临时渠道配置 JSON（用于测试上传，不落库）。传入后可不传 channel_id",
              "example": "{\"r2_account_id\":\"xxx\",\"r2_access_key_id\":\"xxx\",\"r2_secret_access_key\":\"xxx\",\"r2_bucket_name\":\"xxx\",\"r2_public_domain\":\"https://cdn.example.com\",\"r2_custom_path\":\"uploads\"}"
            },
            "url": {
              "type": "string",
              "description": "需要转存的图片 URL",
              "example": "https://example.com/image.png"
            }
          },
          "required": [
            "url"
          ]
        },
        "CreateFeedbackDto": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "反馈类型",
              "enum": [
                "missing",
                "update",
                "broken",
                "suggestion"
              ]
            },
            "title": {
              "type": "string",
              "description": "标题",
              "minLength": 1,
              "maxLength": 200
            },
            "description": {
              "type": "string",
              "description": "详细描述",
              "minLength": 1
            },
            "target_id": {
              "type": "string",
              "description": "关联目标资源 ID"
            },
            "user_id": {
              "type": "string",
              "description": "用户 ID（兼容历史调用）"
            },
            "nickname": {
              "type": "string",
              "description": "用户昵称"
            },
            "contact": {
              "type": "string",
              "description": "联系方式"
            },
            "clientType": {
              "type": "string",
              "description": "客户端类型",
              "enum": [
                "Web",
                "iOS",
                "Android",
                "Desktop"
              ]
            },
            "clientVersion": {
              "type": "string",
              "description": "客户端版本"
            },
            "osVersion": {
              "type": "string",
              "description": "操作系统版本"
            },
            "deviceModel": {
              "type": "string",
              "description": "设备型号"
            },
            "ipAddress": {
              "type": "string",
              "description": "IP 地址"
            },
            "userAgent": {
              "type": "string",
              "description": "User Agent"
            },
            "images": {
              "description": "截图 URL 数组",
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "ref_url": {
              "type": "string",
              "description": "参考链接"
            }
          },
          "required": [
            "type",
            "title",
            "description"
          ]
        },
        "Object": {
          "type": "object",
          "properties": {}
        },
        "UpdateFeedbackStatusDto": {
          "type": "object",
          "properties": {
            "status": {
              "type": "number",
              "description": "处理状态：0-待处理 1-处理中 2-已完成 -1-已忽略",
              "enum": [
                0,
                1,
                2,
                -1
              ]
            }
          },
          "required": [
            "status"
          ]
        },
        "ReplyFeedbackDto": {
          "type": "object",
          "properties": {
            "admin_note": {
              "type": "string",
              "description": "管理员回复内容"
            }
          },
          "required": [
            "admin_note"
          ]
        },
        "AddFeedbackMessageDto": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string",
              "description": "消息内容"
            },
            "images": {
              "description": "消息附图 URL 数组",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "content"
          ]
        },
        "UpdateFeedbackDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "标题"
            },
            "description": {
              "type": "string",
              "description": "详细描述"
            },
            "status": {
              "type": "number",
              "description": "处理状态",
              "enum": [
                0,
                1,
                2,
                -1
              ]
            },
            "admin_note": {
              "type": "string",
              "description": "管理员回复备注（历史字段）"
            },
            "vote_count": {
              "type": "number",
              "description": "热度统计"
            }
          }
        },
        "CreateFeedbackConfigDto": {
          "type": "object",
          "properties": {
            "code": {
              "type": "string",
              "description": "反馈类型代码（唯一标识）",
              "example": "missing"
            },
            "name": {
              "type": "string",
              "description": "反馈类型名称",
              "example": "缺失资源"
            },
            "description": {
              "type": "string",
              "description": "反馈类型描述"
            },
            "icon": {
              "type": "string",
              "description": "图标"
            },
            "sort": {
              "type": "number",
              "description": "排序权重",
              "default": 0
            },
            "isActive": {
              "type": "boolean",
              "description": "是否启用",
              "default": true
            },
            "helpUrl": {
              "type": "string",
              "description": "帮助中心 URL"
            },
            "placeholder": {
              "type": "string",
              "description": "占位符文本"
            },
            "requireTargetId": {
              "type": "boolean",
              "description": "是否必填目标资源 ID",
              "default": false
            }
          },
          "required": [
            "code",
            "name"
          ]
        },
        "UpdateFeedbackConfigDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "反馈类型名称"
            },
            "description": {
              "type": "string",
              "description": "反馈类型描述"
            },
            "icon": {
              "type": "string",
              "description": "图标"
            },
            "sort": {
              "type": "number",
              "description": "排序权重"
            },
            "isActive": {
              "type": "boolean",
              "description": "是否启用"
            },
            "helpUrl": {
              "type": "string",
              "description": "帮助中心 URL"
            },
            "placeholder": {
              "type": "string",
              "description": "占位符文本"
            },
            "requireTargetId": {
              "type": "boolean",
              "description": "是否必填目标资源 ID"
            }
          }
        },
        "SettingCreateDataDto": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string",
              "example": "main"
            },
            "_id": {
              "type": "string",
              "example": "67f000000000000000000001"
            }
          },
          "required": [
            "key",
            "_id"
          ]
        },
        "SettingSiteConfigDataDto": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string",
              "example": "main"
            },
            "basic": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "system": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            }
          },
          "required": [
            "key",
            "basic",
            "system"
          ]
        },
        "SettingModifiedDataDto": {
          "type": "object",
          "properties": {
            "modified": {
              "type": "boolean",
              "example": true
            }
          },
          "required": [
            "modified"
          ]
        },
        "SettingKeyDto": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string",
              "example": "main"
            }
          },
          "required": [
            "key"
          ]
        },
        "SettingDeletedDataDto": {
          "type": "object",
          "properties": {
            "deleted": {
              "type": "boolean",
              "example": true
            }
          },
          "required": [
            "deleted"
          ]
        },
        "SettingPublicSiteConfigDataDto": {
          "type": "object",
          "properties": {
            "key": {
              "type": "string",
              "example": "main"
            },
            "basic": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "header": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "seo": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "app_seo": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "footer": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "friend_links": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": true
              },
              "example": []
            },
            "quick_links": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": true
              },
              "example": []
            },
            "is_active": {
              "type": "boolean",
              "example": true
            },
            "is_maintenance": {
              "type": "boolean",
              "example": false
            }
          },
          "required": [
            "key",
            "basic",
            "header",
            "seo",
            "app_seo",
            "footer",
            "friend_links",
            "quick_links",
            "is_active",
            "is_maintenance"
          ]
        },
        "ContentListDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": true
              },
              "example": []
            },
            "total": {
              "type": "number",
              "example": 0
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 20
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize"
          ]
        },
        "ContentDetailDataDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "post_id"
            },
            "title": {
              "type": "string",
              "example": "标题"
            },
            "extra": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            }
          },
          "required": [
            "_id",
            "title",
            "extra"
          ]
        },
        "ContentCommentSubmitDataDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "comment_id"
            }
          },
          "required": [
            "_id"
          ]
        },
        "ContentCommentPayloadDto": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string",
              "description": "评论内容",
              "example": "这篇内容很有帮助"
            },
            "parent_id": {
              "type": "string",
              "description": "父评论 ID（回复时传）"
            }
          },
          "required": [
            "content"
          ]
        },
        "ContentLikeDataDto": {
          "type": "object",
          "properties": {
            "liked": {
              "type": "boolean",
              "example": true
            },
            "like_count": {
              "type": "number",
              "example": 1
            }
          },
          "required": [
            "liked",
            "like_count"
          ]
        },
        "ContentLikePayloadDto": {
          "type": "object",
          "properties": {
            "action": {
              "type": "string",
              "description": "点赞动作，默认 toggle",
              "enum": [
                "like",
                "unlike",
                "toggle"
              ],
              "example": "toggle"
            }
          }
        },
        "ContentLikeStatusDataDto": {
          "type": "object",
          "properties": {
            "liked": {
              "type": "boolean",
              "example": true
            }
          },
          "required": [
            "liked"
          ]
        },
        "ContentSearchAppsDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": true
              },
              "example": [
                {
                  "_id": "app_id",
                  "name": "游戏名",
                  "pkg": "com.demo.app",
                  "icon": ""
                }
              ]
            }
          },
          "required": [
            "list"
          ]
        },
        "ContentPublishPostDataDto": {
          "type": "object",
          "properties": {
            "_id": {
              "type": "string",
              "example": "post_id"
            },
            "review_status": {
              "type": "string",
              "example": "pending"
            },
            "status": {
              "type": "number",
              "example": 0
            }
          },
          "required": [
            "_id",
            "review_status",
            "status"
          ]
        },
        "ContentAdminSetCommentStatusDto": {
          "type": "object",
          "properties": {
            "status": {
              "type": "number",
              "description": "评论状态",
              "enum": [
                0,
                1
              ],
              "example": 1
            },
            "reason": {
              "type": "string",
              "description": "处理原因（可选）",
              "example": "命中社区规则，先隐藏待复核"
            }
          },
          "required": [
            "status"
          ]
        },
        "ContentAdminBatchSetCommentStatusDto": {
          "type": "object",
          "properties": {
            "ids": {
              "type": "array",
              "description": "评论 ID 列表（最大 200 条）",
              "items": {
                "type": "string"
              }
            },
            "status": {
              "type": "number",
              "description": "目标状态",
              "enum": [
                0,
                1
              ],
              "example": 0
            },
            "reason": {
              "type": "string",
              "description": "批量处理原因（可选）",
              "example": "批量清理违规评论"
            }
          },
          "required": [
            "ids",
            "status"
          ]
        },
        "ContentCommentModerationReasonDto": {
          "type": "object",
          "properties": {
            "reason": {
              "type": "string",
              "description": "处理原因（可选）",
              "example": "含广告引流信息"
            }
          }
        },
        "CreateClientVersionDto": {
          "type": "object",
          "properties": {}
        },
        "UpsertTaskBodyDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "任务ID（更新时传）"
            },
            "task_key": {
              "type": "string",
              "description": "任务执行器 key",
              "enum": [
                "system.daily-log",
                "tracking.daily-rollup",
                "tracking.daily-rollup-yesterday",
                "admin.post-gp",
                "admin.content.update",
                "admin.update.all-gp",
                "admin.update.one-gp",
                "admin.get-gp",
                "admin.get-qoo"
              ],
              "example": "admin.content.update"
            },
            "name": {
              "type": "string",
              "description": "任务名称"
            },
            "description": {
              "type": "string",
              "description": "任务说明"
            },
            "cron": {
              "type": "string",
              "description": "cron 表达式，5位",
              "example": "0 10,13,19 * * *"
            },
            "timezone": {
              "type": "string",
              "description": "时区",
              "example": "Asia/Shanghai"
            },
            "payload": {
              "type": "object",
              "description": "执行参数",
              "example": {
                "mode": "text",
                "type": "GP"
              }
            },
            "enabled": {
              "type": "boolean",
              "description": "启用状态",
              "default": true
            },
            "attempts": {
              "type": "number",
              "description": "失败重试次数",
              "default": 1
            },
            "timeout_ms": {
              "type": "number",
              "description": "超时毫秒",
              "default": 0
            }
          }
        },
        "RunTaskBodyDto": {
          "type": "object",
          "properties": {
            "trigger_type": {
              "type": "string",
              "description": "触发类型",
              "enum": [
                "manual",
                "schedule"
              ]
            },
            "payload_override": {
              "type": "object",
              "description": "本次覆盖参数（可选）",
              "example": {
                "pkg": "com.tencent.ig"
              }
            }
          }
        },
        "SystemLogItemDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "example": "combined-123-2026-03-22T10:30:08.000Z"
            },
            "source": {
              "type": "string",
              "enum": [
                "combined",
                "error",
                "tracking",
                "import",
                "task_scheduler",
                "upload"
              ],
              "example": "combined"
            },
            "timestamp": {
              "type": "string",
              "example": "2026-03-22T10:30:08.348Z"
            },
            "level": {
              "type": "string",
              "example": "warn"
            },
            "context": {
              "type": "string",
              "example": "AllExceptionsFilter"
            },
            "message": {
              "type": "string",
              "example": "Unauthorized"
            },
            "request_id": {
              "type": "string",
              "example": "req-mn1iuknw-3td6lvp30r"
            },
            "path": {
              "type": "string",
              "example": "/notifications/summary"
            },
            "method": {
              "type": "string",
              "example": "GET"
            },
            "user_id": {
              "type": "string",
              "example": "6972244ef772558bc8e0f5e6"
            },
            "user_name": {
              "type": "string",
              "example": "admin_user"
            },
            "ip": {
              "type": "string",
              "example": "127.0.0.1"
            },
            "ip_region": {
              "type": "string",
              "example": "CN/Beijing/Beijing"
            },
            "payload": {
              "type": "object",
              "additionalProperties": true,
              "example": {
                "statusCode": 401,
                "errorCode": 401
              }
            }
          },
          "required": [
            "id",
            "source",
            "timestamp",
            "level",
            "context",
            "message",
            "request_id",
            "path",
            "method",
            "user_id",
            "user_name",
            "ip",
            "ip_region",
            "payload"
          ]
        },
        "SystemLogListDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/SystemLogItemDto"
              }
            },
            "total": {
              "type": "number",
              "example": 120
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 50
            },
            "realtime": {
              "type": "boolean",
              "example": false
            },
            "next_cursor": {
              "type": "string",
              "example": "2026-03-22T10:30:08.348Z"
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize",
            "realtime",
            "next_cursor"
          ]
        },
        "AdminOperationLogItemDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "example": "67e8bc3ef772558bc8e0f5e7"
            },
            "_id": {
              "type": "string",
              "example": "67e8bc3ef772558bc8e0f5e7"
            },
            "operator_id": {
              "type": "string",
              "example": "67e8bc3ef772558bc8e0f5e6"
            },
            "operator_username": {
              "type": "string",
              "example": "admin_user"
            },
            "operator_name": {
              "type": "string",
              "example": "Administrator"
            },
            "role_codes": {
              "example": [
                "super_admin"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "permission_codes": {
              "example": [
                "log:read",
                "content:update"
              ],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "method": {
              "type": "string",
              "example": "GET"
            },
            "path": {
              "type": "string",
              "example": "/roles?page=1&limit=20"
            },
            "route": {
              "type": "string",
              "example": "/roles"
            },
            "status_code": {
              "type": "number",
              "example": 403
            },
            "duration_ms": {
              "type": "number",
              "example": 36
            },
            "ip": {
              "type": "string",
              "example": "127.0.0.1"
            },
            "user_agent": {
              "type": "string",
              "example": "Mozilla/5.0"
            },
            "request_id": {
              "type": "string",
              "example": "req-mn1iuknw-3td6lvp30r"
            },
            "query": {
              "type": "object",
              "additionalProperties": true,
              "example": {
                "page": 1,
                "limit": 20
              }
            },
            "params": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "body": {
              "type": "object",
              "additionalProperties": true,
              "example": {}
            },
            "response": {
              "type": "object",
              "additionalProperties": true,
              "example": {
                "code": 403,
                "message": "用户不存在"
              }
            },
            "error_message": {
              "type": "string",
              "example": "用户不存在"
            },
            "success": {
              "type": "boolean",
              "example": false
            },
            "created_at": {
              "type": "string",
              "example": "2026-03-22T10:30:08.348Z"
            },
            "updated_at": {
              "type": "string",
              "example": "2026-03-22T10:30:08.348Z"
            }
          },
          "required": [
            "id",
            "_id",
            "operator_id",
            "operator_username",
            "operator_name",
            "role_codes",
            "permission_codes",
            "method",
            "path",
            "route",
            "status_code",
            "duration_ms",
            "ip",
            "user_agent",
            "request_id",
            "query",
            "params",
            "body",
            "response",
            "error_message",
            "success",
            "created_at",
            "updated_at"
          ]
        },
        "AdminOperationLogListDataDto": {
          "type": "object",
          "properties": {
            "list": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/AdminOperationLogItemDto"
              }
            },
            "total": {
              "type": "number",
              "example": 42
            },
            "page": {
              "type": "number",
              "example": 1
            },
            "pageSize": {
              "type": "number",
              "example": 20
            }
          },
          "required": [
            "list",
            "total",
            "page",
            "pageSize"
          ]
        },
        "AiModelConfigDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "模型ID（可不传，服务端自动生成）"
            },
            "name": {
              "type": "string",
              "description": "模型名称",
              "example": "GPT-4.1"
            },
            "provider": {
              "type": "string",
              "description": "供应商标识",
              "example": "openai"
            },
            "model": {
              "type": "string",
              "description": "模型名",
              "example": "gpt-4.1-mini"
            },
            "base_url": {
              "type": "string",
              "description": "Base URL",
              "example": "https://api.openai.com/v1"
            },
            "api_key": {
              "type": "string",
              "description": "API Key"
            },
            "enabled": {
              "type": "boolean",
              "description": "是否启用",
              "default": true
            },
            "is_default": {
              "type": "boolean",
              "description": "是否默认模型",
              "default": false
            },
            "timeout_ms": {
              "type": "number",
              "description": "请求超时毫秒",
              "example": 30000
            },
            "temperature": {
              "type": "number",
              "description": "温度参数",
              "example": 0.7
            },
            "max_tokens": {
              "type": "number",
              "description": "最大tokens",
              "example": 2000
            },
            "extra": {
              "type": "object",
              "description": "额外参数"
            }
          },
          "required": [
            "name",
            "provider",
            "model"
          ]
        },
        "UpdateAiConfigDto": {
          "type": "object",
          "properties": {
            "enabled": {
              "type": "boolean",
              "description": "是否启用AI助手",
              "default": false
            },
            "selected_model_id": {
              "type": "string",
              "description": "当前选中模型ID"
            },
            "models": {
              "description": "模型列表",
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/AiModelConfigDto"
              }
            }
          }
        },
        "AiChatMessageDto": {
          "type": "object",
          "properties": {
            "role": {
              "type": "string",
              "description": "角色",
              "enum": [
                "system",
                "user",
                "assistant"
              ]
            },
            "content": {
              "type": "string",
              "description": "消息内容"
            }
          },
          "required": [
            "role",
            "content"
          ]
        },
        "AiChatStreamDto": {
          "type": "object",
          "properties": {
            "messages": {
              "description": "会话消息列表，不传则仅使用 prompt",
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/AiChatMessageDto"
              }
            },
            "prompt": {
              "type": "string",
              "description": "单条输入内容（便捷模式）"
            },
            "model_id": {
              "type": "string",
              "description": "模型ID，不传则使用默认/选中模型"
            },
            "temperature": {
              "type": "number",
              "description": "温度参数"
            },
            "max_tokens": {
              "type": "number",
              "description": "最大tokens"
            }
          }
        },
        "AlbumRandomPickPreviewDto": {
          "type": "object",
          "properties": {
            "album_id": {
              "type": "string",
              "description": "专辑ID"
            },
            "count": {
              "type": "number",
              "description": "随机数量",
              "default": 10
            },
            "source_type": {
              "type": "string",
              "description": "来源类型过滤，例如 GP",
              "example": "GP"
            },
            "status": {
              "type": "number",
              "description": "状态过滤（0预约，1正常，2下线）",
              "example": 1
            },
            "exclude_existing": {
              "type": "boolean",
              "description": "是否排除已在专辑中的应用",
              "default": true
            }
          },
          "required": [
            "album_id"
          ]
        },
        "AlbumRandomPickApplyDto": {
          "type": "object",
          "properties": {
            "album_id": {
              "type": "string",
              "description": "专辑ID"
            },
            "count": {
              "type": "number",
              "description": "随机数量",
              "default": 10
            },
            "source_type": {
              "type": "string",
              "description": "来源类型过滤，例如 GP",
              "example": "GP"
            },
            "status": {
              "type": "number",
              "description": "状态过滤（0预约，1正常，2下线）",
              "example": 1
            },
            "exclude_existing": {
              "type": "boolean",
              "description": "是否排除已在专辑中的应用",
              "default": true
            },
            "append_mode": {
              "type": "boolean",
              "description": "true=追加到原列表，false=覆盖专辑列表",
              "default": true
            }
          },
          "required": [
            "album_id"
          ]
        }
      }
    }
  },
  "customOptions": {
    "persistAuthorization": true
  }
};
  url = options.swaggerUrl || url
  let urls = options.swaggerUrls
  let customOptions = options.customOptions
  let spec1 = options.swaggerDoc
  let swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (let attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  let ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.initOAuth) {
    ui.initOAuth(customOptions.initOAuth)
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }
  
  window.ui = ui
}

