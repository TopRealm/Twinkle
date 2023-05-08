# Twinkle

Twinkle是一个JavaScript应用程序，引入自维基百科，其为求闻百科用户提供了一个快速执行常见维护任务的方法，例如提名删除页面和清理破坏性内容。

AzaToth是该工具的原作者和维护者，也是`morebits.js`的维护者。除Twinkle之外，其还构成了多个求闻百科脚本和编辑工具的基础。

## 本代码库布局

- `morebits.js`：Twinkle和许多其他脚本所使用的中心库。包含与 MediaWiki API 交互的代码，显示表单和对话框，生成状态日志，并做其他各种有用的事情。这里的绝大部分代码都不是针对Twinkle的，请看文档（[1](https://github.com/wikimedia-gadgets/twinkle/wiki/morebits))
- `twinkle.js`：一般的 Twinkle 专用代码，主要与偏好和在用户界面中公开 Twinkle 有关。重要的是，它包含了 Twinkle 的默认偏好集。
- `modules`：包含各个 Twinkle 模块。

[select2][]采用[MIT许可证][select2license]。

[select2]: https://github.com/select2/select2
[select2license]: https://github.com/select2/select2/blob/develop/LICENSE.md
