// src/utils/scriptGenerator.ts
import { ScriptStep } from '../store/useScriptStore';

type Opts = { withStepComments?: boolean };

const stripShebangs = (text: string) =>
    text
        .replace(/^#!\s*\/system\/bin\/sh\s*$/gm, '')
        .replace(/^#!\s*\/bin\/sh\s*$/gm, '')
        .replace(/^#!\s*\/bin\/bash\s*$/gm, '');

const isIfStartToken = (t: string) => t === 'if' || t === 'elif';
const isLogicToken = (t: string) => t === 'if' || t === 'elif' || t === '&&' || t === '||';
const isThenToken = (t: string) => t === 'then' || t === ';then' || t === '; then';

const normalizeIfToken = (raw: string) => {
    const t = raw.trim();

    if (t === 'if') return 'if ';
    if (t === 'elif') return 'elif ';
    if (t === '&&') return ' && ';
    if (t === '||') return ' || ';
    if (t === 'then' || t === ';then' || t === '; then') return '; then';

    // 普通命令（条件命令本体），保持一条“干净的”文本
    return raw.trim();
};

export const generateShellScript = (steps: ScriptStep[], opts?: Opts): string => {
    const withStepComments = opts?.withStepComments ?? true;

    let out = '';

    // 缓冲 if/elif ... then 这一整行
    let bufferingIf = false;
    let ifLine = '';
    let ifComments: string[] = [];

    const flushIf = () => {
        if (!ifLine.trim()) return;
        if (withStepComments && ifComments.length) out += ifComments.join('\n') + '\n';
        out += ifLine.trimEnd() + '\n';
        bufferingIf = false;
        ifLine = '';
        ifComments = [];
    };

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        let raw = step.command ?? '';
        raw = stripShebangs(raw);

        // 保留多行块命令，但先去掉两端空白，避免空步骤
        const rawTrimmed = raw.trim();
        if (!rawTrimmed) continue;

        const comment = withStepComments ? `# Step ${i + 1}: ${step.name ?? ''}`.trimEnd() : '';

        // 识别 token（用于 if 拼接）
        const token = rawTrimmed; // 这里用 trim 后的版本做识别
        const tokenKey = token.trim();

        // 进入 if 缓冲：遇到 if/elif 并且还没出现 then
        if (!bufferingIf && isIfStartToken(tokenKey)) {
            bufferingIf = true;
        }

        if (bufferingIf) {
            if (comment) ifComments.push(comment);

            // 统一规范化 token（确保 if 后有空格、&&/|| 两侧有空格、then 变成 ; then）
            const piece = normalizeIfToken(rawTrimmed);

            // 拼接规则：直接连起来即可，因为 normalizeIfToken 已经处理了空格
            ifLine += piece;

            // 看到 then 就吐出整行
            if (isThenToken(tokenKey)) {
                flushIf();
            }
            continue;
        }

        // 普通行：注释在上，命令在下（保持多行块原样）
        if (comment) out += comment + '\n';
        out += rawTrimmed + '\n';
    }

    // 万一 if 没闭合 then（用户没加 then 积木），也吐出来方便你发现问题
    flushIf();

    let script = `#!/system/bin/sh\n\n${out}`.replace(/\n{3,}/g, '\n\n');
    script = script.trimEnd() + '\n';

    // ── 将步骤元数据作为注释附加到末尾，用于社区导入 ──
    const stepsData = steps.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name,
        command: s.command,
        description: s.description,
        params: s.params,
    }));
    const json = JSON.stringify(stepsData);
    script += '\n# KCRL_STEPS_BEGIN\n';
    script += `# ${json}\n`;
    script += '# KCRL_STEPS_END\n';

    return script;
};