// devicesGetter.ts
import {CPPAPISocket} from "./CPPAPISocket.ts";

export interface InputDevice {
  path: string;
  name: string;
}

/**
 * DevicesGetter
 * @param socket 已初始化的 CPPAPISocket 实例
 * @returns Promise<InputDevice[]> JSON 格式设备列表
 */
export async function DevicesGetter(
  socket: CPPAPISocket,
): Promise<InputDevice[]> {
  const ok = await socket.isInitialized();
  if (!ok) throw new Error('Socket 通信验证失败');
  // 执行 shell 命令获取设备
  const cmd = `
for dev in /dev/input/event*; do
  if [ -e "$dev" ]; then
    base=$(basename $dev)
    name=$(cat /sys/class/input/$base/device/name 2>/dev/null)
    echo "$dev|$name"
  fi
done
`;
  const output = await socket.execCommand(cmd);
  const devices = output
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const [path, name] = line.split('|');
      return {
        path,
        name: name || 'UNKNOWN',
      };
    });
  return devices;
}
