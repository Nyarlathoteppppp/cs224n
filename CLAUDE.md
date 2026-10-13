# CS224N 中文交互教程

## 目标
- 按 Stanford CS224N **Winter 2026** 的讲次顺序，做一个中文交互教程网站。学习者只看这个网站就能学完。
- 循序渐进：不默认读者懂任何还没讲过的东西。每章开头列出前置知识；前面没讲过的，在用到的地方当场补讲。
  - `tests/taught.js` 登记每个术语在哪一章正式讲。某章提前用到后面才讲的术语时，同一句里必须有括号解释，或者“第 X 章会讲”这类指引，否则 `tests/site.check.js` 会给出“先用后讲”警告。写新章时，把新出现的术语也登记进去。
- 数学和直觉结合，以理解为主：先给画面和直觉（这一步在干什么、为什么需要），再给公式，再用具体数字走一遍。目标是看一遍就有直观理解，并对整个流程有印象。

## 内容规则
- 中文讲解；关键术语第一次出现写成"中文（English）"。
- 内容严格依据 `reference/` 里的 CS224N 材料。材料无法确认的不写；课件外的延伸要明确标注"课件外"。
- 网站自洽：不嵌入课件页面截图，不写"见 slide X""参考课件第 X 页"这类让人回去翻的话。可以说明内容出自哪一讲，但学习需要的定义、图、数字都在本站给出。
- 每个数值例子都要能用 `js/core/` 的代码复现，并写进测试。
- 读者起点：只会高中数学。线性代数、概率、微积分从第 0 部分讲起。
- 作业给答案和解释：每部分最后一章是"作业精讲"，完整复述题目。推导和数值答案要用代码或数值梯度检查验证，文字答案要换一个模型审查。
- 没有 W26 课件的内容（可解释性、多模态、DPO 之后）写成延伸章节，页面顶部标明依据的是往年材料。
- 章节划分以 `COURSE_MAP.md` §3 为准：共 62 章 + 1 个附录。先交付第 0–5 部分。

## 可视化
- **先写规格，再实现**：每个可视化先写清楚讲哪个概念、回答什么问题、画什么、有哪些交互参数、用哪组数字。页面先放占位，之后再补实现。
- Manim 视频：主流程用 **manim_skill**，先用 `manim-composer` 写分镜 `scenes.md`，再按 `manimce-best-practices` 写 ManimCE 代码。**3brown1blue** 的 `explanation-design.md`、`pedagogy-checklist.md`、`production-quality.md` 作为补充检查。
  - 本地副本：`/Users/ywbw/unimelboure_course/90054_ai_forplaning/map/rl_visual_course/manim/vendor/{manim_skill,3brown1blue}`
- 网页和视频联动可以参考 SML 复习站的做法，只借用技术，内容不相关：`/Users/ywbw/unimelboure_course/90051_sml/precious final/sml-review/` 下的 `manim/common.py`、`manim/render.py`、`js/ui/video.js`。视频用 StepScene 分步，记录每步时间戳，网页可跳到某一步，旁白用 KaTeX 渲染。

## 页面约定
- 只针对电脑屏幕优化，不用做手机适配检查。
- 默认浅色主题，深色由读者手动切换。
- 重点句用 Markdown 的 `**…**` 标出，页面上显示为红色加粗。界面标签用 `<b>`，不会变红。
- 中文正文用中文引号“…”，不用直引号 "…"，`tests/site.check.js` 会给出警告。
- 研究背景和小故事要简短：
  - 章的 `background` 字段：一到三句话，说清谁、在什么时候、为了解决什么问题提出了这个方法。
  - 小节的 `story` 字段：每章最多一两个，讲课上老师讲过的故事、比喻或历史。
  - 来源只用课件、notes 和讲课字幕。超出这些材料的标"课件外"。候选清单在 `reference/stories.md`。
- 每章由若干小节组成，每个小节回答一个问题：问题 → 直觉 → 定义与公式 → 算一遍 → 一句话记住。章节数据的格式见 `data/chapters/*.js`，渲染逻辑见 `js/ui/app.js`。
- 还没实现的可视化显示规格卡，规格在 `data/visuals.js`，和 COURSE_MAP §4 保持一致。

## 常用命令
- `node tests/core.test.js`：核心算法测试，期望值来自课件原数。
- `node tests/site.check.js`：检查章节结构、链接、小测和所有公式能否渲染。
- `python3 tools/serve.py`：本地预览服务器，端口 8224，不缓存。读者直接双击 `index.html` 就能看。

## 技术约束
- 纯 HTML / CSS / Vanilla JS + SVG/Canvas + KaTeX（放在 vendor 里的本地拷贝）。双击 `index.html` 就能离线使用，所以不用 fetch，也不用 ES module。内容写成 JS 数据文件，用普通 `<script>` 按顺序加载。
- LaTeX 写在 `String.raw` 里；公式逐项高亮用 `\htmlClass` 并打开 `trust`；grid/flex 的子元素要加 `min-width: 0`。
- Manim 环境：项目的 `.venv` 是 Python 3.12，装的 manim 0.22.0。LaTeX 用 BasicTeX，渲染脚本里要先 `export PATH="/Library/TeX/texbin:$PATH"`，否则找不到 latex 和 dvisvgm。视频里的公式用 `MathTex`，中文用 `Text(font="PingFang SC")`。

## 共享经验库
- `/Users/ywbw/unimelboure_course/可视化技巧/` 是几个 AI 共用的经验库，由其他 AI 管理。做可视化之前先读一遍。
- 本项目只能写 `经验/claude-cs224n.md` 这一个文件：写之前先读当前版本，内容要实用、精简。不删除、不改 README 和编号文件，也不调整目录结构。

## 分工
- 讲解文字和网页设计由 Claude 亲自写。用户明确说过 Claude 写的文字更好懂。网站上的每一句话，包括研究背景、小故事、小测解释和作业答案，都由 Claude 写；其他模型产出的只是带出处的素材。
- 杂活交给 Pi MCP 的模型，Claude 复核结果。杂活包括：PDF 文本提取、字幕清洗、格式转换、校验脚本初稿、术语表初稿。

## 材料
- `reference/` 不进 git，因为课件和字幕是斯坦福的版权内容。用 `tools/fetch_reference.sh all` 重新下载，下载清单在 `reference/raw/MANIFEST.tsv`。
- 内容以 Winter 2026 官网为准。录像字幕来自 Spring 2024 和 2023 的 YouTube 自动字幕，只用来辅助理解，讲次顺序和内容与 W26 不完全一致。
- W26 的讲次里没有依存句法（dependency parsing），但 A2 考了，所以要放进教程。
- 第三方中文笔记放在 `reference/community/`，用 `tools/fetch_reference.sh community` 下载，用 `tools/ocr_notes.sh` 做 OCR。两份都没有开源许可，只能参考，不能照抄。
  - `lvsir18/`：W26 全部 19 讲的简短中文笔记，主线取自个人笔记站。只用来核对主题有没有遗漏，以及参考中文译法，不能当事实来源。
  - `looperxx/`：2019 版中文阅读笔记，以讲课视频为主，记录了不少课件外的课堂讲解。`ocr/` 是 OCR 结果，公式不可靠，公式以课件为准。主要用来补字幕缺失的讲次（词向量、RNN 语言模型、梯度消失、机器翻译）的讲解顺序和比喻。
  - 笔记里提到的内容，要在 CS224N 课件、notes 或字幕里找到依据才能写进网站；找不到的就不写，或者标“课件外”。2019 版和 W26 不一致时以 W26 为准。

## 流程
按"课件转交互课程手册"（https://claude.ai/artifact/GWzgcXqsbXfYV5i7NkH6pa）的 8 步：
1. 准备材料
2. 写 `COURSE_MAP.md`，用户确认后才写页面
3. 实现算法，用课件里的数字测试
4. 搭页面框架
5. 做交互
6. 写正文
7. 自动校验 + 多模型只读审查
8. 自己当学生读一遍，卡住的地方写回网站
