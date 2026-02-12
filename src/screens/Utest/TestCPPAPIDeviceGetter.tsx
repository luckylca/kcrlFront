import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { DevicesGetter } from '../../api/devicesGetter';
import {CPPAPISocket} from "../../api/CPPAPISocket.ts";


export function TestCPPAPIDeviceGetter() {
  const [devices, setDevices] = useState<{ path: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const fetchDevices = async () => {
      setLoading(true);
      setError(null);
      setDevices([]);

      try {
        // 创建 CPPAPISocket 实例
        const socket = new CPPAPISocket();
        //需要初始化
          socket.init();
        // 调用 DevicesGetter 获取设备 JSON
        const list = await DevicesGetter(socket);
        setDevices(list);
      } catch (err: any) {
        setError(err?.message || '未知错误');
      } finally {
        setLoading(false);
      }
    };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>/dev/input 设备列表</Text>
        <Button title="刷新" onPress={fetchDevices} disabled={loading} />
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginVertical: 10 }}
        />
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <ScrollView style={styles.list}>
        {devices.map((d, idx) => (
          <View key={idx} style={styles.deviceCard}>
            <Text style={styles.devicePath}>{d.path}</Text>
            <Text style={styles.deviceName}>{d.name}</Text>
          </View>
        ))}
        {devices.length === 0 && !loading && !error && (
          <Text style={styles.empty}>暂无设备</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  error: { color: 'red', marginVertical: 8 },
  list: { flex: 1 },
  deviceCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  devicePath: { fontFamily: 'monospace', fontSize: 14 },
  deviceName: { color: '#555', marginTop: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
});
