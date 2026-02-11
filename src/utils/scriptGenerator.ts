// src/utils/scriptGenerator.ts
/**
 * 将脚本步骤数组转换为 .sh 文件内容字符串
 */
import { ScriptStep } from '../store/useScriptStore';


export const generateShellScript = (steps: ScriptStep[]): string => {
    const lines: string[] = [];

    // 1. 添加 Shebang (标准做法，告诉安卓系统这是个 Shell 脚本)
    lines.push('#!/bin/sh');
    lines.push(''); // 空行

    // 2. 遍历所有步骤
    steps.forEach((step, index) => {
        // 2.1 添加注释 (这行是为了让你以后打开文件能看懂这段代码是干嘛的)
        lines.push(`# Step ${index + 1}: ${step.name}`);

        // 2.2 添加核心命令
        // trim() 去掉首尾多余空格，防止意外报错
        if (step.command && step.command.trim()) {
            lines.push(step.command.trim());
        }

        // 2.3 加个空行，让脚本不那么拥挤
        lines.push('');
    });

    // 3. 用换行符拼接所有行
    return lines.join('\n');
};