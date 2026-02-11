/**
 * CPPAPIConfig.ts 提供配置文件解析/反解析类
 *
 * By.IDlike
 *
 * 属性：
 *  - device: string[]         要监听的输入设备路径，可多个，用 | 分隔
 *  - name: string             设备名称，可选，用于日志显示
 *  - click_threshold: string  点击阈值（毫秒）
 *  - short_press_threshold: string 短按阈值（毫秒）
 *  - long_press_threshold: string  长按阈值（毫秒）
 *  - double_click_interval: string 双击间隔（毫秒）
 *  - enable_log: number       日志开关，0=关闭，1=开启
 *  - cpu_affinity: number[]   指定程序运行的 CPU 核心
 *  - keyevent: Record<string, KeyEvent> 按键事件映射，keycode 为键值
 *
 * 方法：
 *
 *  - load(text: string): void
 *      从 KCTRL 文本配置加载，覆盖当前配置
 *
 *  - save(): string
 *      导出为 KCTRL 配置文本
 *
 * KeyEvent 类型：
 *  - onpress: string      按下时脚本路径
 *  - click: string        单击事件脚本路径
 *  - dblclick: string     双击事件脚本路径
 *  - short_press: string  短按事件脚本路径
 *  - long_press: string   长按事件脚本路径
 *
 * 测试用例：
 *
 * const config = new CPPAPIConfig()
 * config.load(kconfigText)       // 从文本加载
 * config.enable_log = 1           // 修改某个字段
 * config.keyevent['735'] = {
 *   onpress: '',
 *   click: 'a.sh',
 *   dblclick: '',
 *   short_press: '',
 *   long_press: ''
 * }
 * const text = config.save()      // 导出文本
 */


type KeyEvent = {
    onpress: string
    click: string
    dblclick: string
    short_press: string
    long_press: string
}

export class CPPAPIConfig {
  device: string[] = ['/dev/input/event0'];
  name: string = 'sample_name';
  click_threshold: string = '500';
  short_press_threshold: string = '1000';
  long_press_threshold: string = '2000';
  double_click_interval: string = '300';
  enable_log: number = 0;
  cpu_affinity: number[] = [0];
  keyevent: Record<string, KeyEvent> = {};

  /*
    save() : 导出文本 kconfig
   */
  save(): string {
    const lines: string[] = [];

    lines.push(`# KCTRL 配置文件`);
    lines.push(`# 格式: key=value`);
    lines.push(``);
    lines.push(`device=${this.device.join('|')}`);
    lines.push(`name=${this.name}`);
    lines.push(`click_threshold=${this.click_threshold}`);
    lines.push(`short_press_threshold=${this.short_press_threshold}`);
    lines.push(`long_press_threshold=${this.long_press_threshold}`);
    lines.push(`double_click_interval=${this.double_click_interval}`);
    lines.push(`enable_log=${this.enable_log}`);
    lines.push(`cpu_affinity=${this.cpu_affinity.join(',')}`);

    Object.entries(this.keyevent).forEach(([keycode, events]) => {
      lines.push(``);
      lines.push(`# KEY${keycode}事件配置`);

      const map = {
        onpress: 'press',
        click: 'click',
        dblclick: 'double_click',
        short_press: 'short_press',
        long_press: 'long_press',
      };

      Object.entries(events).forEach(([type, script]) => {
        if (!script) return;
        const suffix = map[type as keyof typeof map];
        lines.push(`script_${keycode}_${suffix}=${script}`);
      });
    });

    return lines.join('\n');
  }

  /*
      load() : 从文本加载 kconfig
  */
  load(text: string) {
    // 重置为默认值
    const def = new CPPAPIConfig();
    Object.assign(this, def);

    const lines = text.split('\n');

    lines.forEach(rawLine => {
      const line = rawLine.split('#')[0].trim();
      if (!line || !line.includes('=')) return;

      const [key, ...rest] = line.split('=');
      const value = rest.join('=').trim();

      if (key === 'device') {
        this.device = value.split('|').filter(Boolean);
        return;
      }

      if (key === 'cpu_affinity') {
        this.cpu_affinity = value
          .split(',')
          .filter(Boolean)
          .map(v => Number(v));
        return;
      }

      if (key === 'enable_log') {
        this.enable_log = Number(value);
        return;
      }

      const simpleKeys = [
        'name',
        'click_threshold',
        'short_press_threshold',
        'long_press_threshold',
        'double_click_interval',
      ];

      if (simpleKeys.includes(key)) {
        (this as any)[key] = value;
        return;
      }

      if (key.startsWith('script_')) {
        const parts = key.split('_');
        if (parts.length < 3) return;

        const keycode = parts[1];
        const suffix = parts.slice(2).join('_');

        if (!this.keyevent[keycode]) {
          this.keyevent[keycode] = {
            onpress: '',
            click: '',
            dblclick: '',
            short_press: '',
            long_press: '',
          };
        }

        const reverseMap: Record<string, keyof KeyEvent> = {
          press: 'onpress',
          click: 'click',
          double_click: 'dblclick',
          short_press: 'short_press',
          long_press: 'long_press',
        };

        const type = reverseMap[suffix];
        if (type) {
          this.keyevent[keycode][type] = value;
        }
      }
    });
  }
}
