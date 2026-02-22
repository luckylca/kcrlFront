// TestCPPAPIDeviceLesion.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { CPPAPISocket, KeyInputMonitor } from '../../api/CPPAPISocket';
import { DevicesGetter, InputDevice } from '../../api/devicesGetter';

export function TestCPPAPIDeviceLesion() {
  const [socket] = useState(new CPPAPISocket());
  const [devices, setDevices] = useState<InputDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<InputDevice | null>(
    null,
  );
  const [monitor] = useState(new KeyInputMonitor());
  const [stateText, setStateText] = useState<string>('未监听');
  const [loading, setLoading] = useState(false);

  // 初始化 socket 并获取设备
  const initAndFetchDevices = async () => {
    setLoading(true);
    const ok = await socket.init();
    if (!ok) {
      setStateText('Socket 初始化失败');
      setLoading(false);
      return;
    }
    try {
      const devs = await DevicesGetter(socket);
      setDevices(devs);
      setStateText('请选择设备');
    } catch (e) {
      setStateText('获取设备失败: ' + e);
    }
    setLoading(false);
  };

  useEffect(() => {
    initAndFetchDevices();
  }, []);

  // 启动监听
  const startMonitor = async (device: InputDevice) => {
    setSelectedDevice(device);
    setStateText('启动中...');
    const ok = await monitor.start(socket, device.path);
    if (!ok) {
      setStateText('启动监听失败');
      return;
    }
    setStateText('监听中...');
    // 定时获取按键状态
    const interval = setInterval(async () => {
      try {
        const data = await monitor.get();
        if (data) setStateText(JSON.stringify(data));
      } catch {
        setStateText('获取数据失败');
      }
    }, 500); // 每 0.5 秒刷新一次
    // 保存 interval 到状态，停止时清除
    (monitor as any)._interval = interval;
  };

  // 停止监听
  const stopMonitor = async () => {
    if ((monitor as any)._interval) {
      clearInterval((monitor as any)._interval);
      (monitor as any)._interval = null;
    }
    const ok = await monitor.stop();
    setStateText(ok ? '已停止' : '停止失败');
    setSelectedDevice(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CPPAPI KeyInputMonitor 测试</Text>
      {loading && <Text>加载中...</Text>}
      <Text>状态: {stateText}</Text>
      <FlatList
        data={devices}
        keyExtractor={item => item.path}
        renderItem={({ item }) => (
          <View style={styles.deviceRow}>
            <Text>
              {item.name} ({item.path})
            </Text>
            <Button
              title="启动监听"
              disabled={selectedDevice !== null}
              onPress={() => startMonitor(item)}
            />
          </View>
        )}
      />
      {selectedDevice && (
        <Button title="停止监听" onPress={stopMonitor} color="red" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
