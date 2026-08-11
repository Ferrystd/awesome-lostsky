export const ERROR_MESSAGES = {
  request: {
    failed: '请求失败',
    invalidResponse: '服务响应格式异常，请稍后重试',
    timeoutOrCancelled: '请求超时或已取消',
    networkFailure: '网络请求失败',
  },
  friendly: {
    unknown: '发生未知错误，请稍后再试',
    tooManyRequests: '操作太频繁，请稍后再试',
    serviceUnavailable: '服务暂时不可用，请稍后再试',
    networkConnectionFailed: '网络连接失败，请检查网络后重试',
  },
  file: {
    quota: '该团队文件已达到上限，请联系团队管理员。',
  },
  access: {
    permission: {
      default: '您缺少该团队权限(Permission): {permissions},请联系团队管理员开通。',
      overrides: {
        // 'file.upload': '当前身份不能上传文件。所需 Permission：{permission}',
      } as Record<string, string>,
    },
    ability: {
      default: '该团队能力(Ability)缺失: {label}({keyTitle}),管理员可按需购买。',
      overrides: {
        // file: '当前团队未开通文件上传能力。Ability：{keyTitle}',
      } as Record<string, string>,
    },
    setting: {
      default: '需要“{label}”（{setting}）{required}，现在为{current}，请联系团队管理员设置。',
      overrides: {
        // 'chat.customer_group_mode': '需要先将“{label}”{required}；当前值为{current}。',
      } as Record<string, string>,
    },
  },
} as const
