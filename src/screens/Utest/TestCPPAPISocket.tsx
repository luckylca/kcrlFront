//
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { CPPAPISocket } from '../../api/CPPAPISocket';

export function TestCPPAPI_Socket_App() {
  const [log, setLog] = useState<string[]>([]);
  const [working, setWorking] = useState<boolean | null>(null);

  const kctrlRef = React.useRef<CPPAPISocket>(new CPPAPISocket());
  const kctrl = kctrlRef.current;

  const appendLog = (msg: string) => {
    setLog(prev => [msg, ...prev]);
  };
  const initConnect = async () => {
    appendLog('尝试连接...');
    const res = await kctrl.init(); // 替换为你想测试的命令
    appendLog(res ? '成功' : '失败');
    appendLog(
      (await kctrl.isInitialized()) ? '测试shell成功' : '测试shell失败',
    );
  };
  const testExecCommand = async () => {
    appendLog('执行命令 "ls"...');
    const res = await kctrl.execCommand('ls'); // 替换为你想测试的命令
    appendLog(res);
  };

  const testIsWorking = async () => {
    const res = await kctrl.isWorking();
    setWorking(res);
    appendLog(res ? '工作状态：在线' : '工作状态：离线');
  };

  const testShutdown = async () => {
    appendLog('发送关闭指令...');
    const res = await kctrl.shutdown();
    appendLog(String(res));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CPPAPI Socket 全面测试</Text>

      <View style={styles.buttonRow}>
        <Button title="[必点]获取密码" onPress={initConnect} />
        <Button title="执行命令(ls)" onPress={testExecCommand} />
        <Button title="关闭" onPress={testShutdown} />
      </View>

      <View style={styles.buttonRow}>
        <Button title="检查工作状态(无需密码)" onPress={testIsWorking} />

      </View>

      <Text style={styles.status}>
        Service Status:{' '}
        {working === null ? 'Unknown' : working ? 'Working' : 'Not Working'}
      </Text>

      <ScrollView style={styles.logBox}>
        {log.map((item, idx) => (
          <Text key={idx} style={styles.logText}>
            {item}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logBox: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 10,
    flex: 1,
    borderRadius: 8,
  },
  logText: { fontSize: 14, marginBottom: 4 },
  status: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
});
