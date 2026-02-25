// src/utils/scriptParser.ts
// 从 .sh 文件中解析 KCRL_STEPS 注释块，还原为 ScriptStep[]

import { ScriptStep } from '../store/useScriptStore';

/**
 * 从 .sh 文件内容中解析出嵌入的 ScriptStep[] 元数据。
 * 查找 `# KCRL_STEPS_BEGIN` 和 `# KCRL_STEPS_END` 之间的 JSON 注释行。
 *
 * @returns ScriptStep[] 如果找到并解析成功，否则返回 null
 */
export const parseScriptSteps = (shContent: string): ScriptStep[] | null => {
    const beginMarker = '# KCRL_STEPS_BEGIN';
    const endMarker = '# KCRL_STEPS_END';

    const beginIdx = shContent.indexOf(beginMarker);
    const endIdx = shContent.indexOf(endMarker);

    if (beginIdx < 0 || endIdx < 0 || endIdx <= beginIdx) {
        return null;
    }

    // 提取 BEGIN 和 END 之间的所有行
    const block = shContent.substring(beginIdx + beginMarker.length, endIdx);
    const lines = block
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('# '))
        .map(line => line.substring(2)); // 去掉 "# " 前缀

    const jsonStr = lines.join('');

    if (!jsonStr) {
        return null;
    }

    try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
            return null;
        }
        // 验证并补全每个 step
        return parsed.map((item: any, index: number) => ({
            id: item.id || Date.now().toString() + index,
            type: item.type || 'other',
            name: item.name || `Step ${index + 1}`,
            command: item.command || '',
            description: item.description,
            params: item.params,
        })) as ScriptStep[];
    } catch (e) {
        console.error('parseScriptSteps JSON parse error:', e);
        return null;
    }
};
