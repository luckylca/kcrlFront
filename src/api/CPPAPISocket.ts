/**
 * CPPAPISocket.ts 提供与cpp通信接口，提供了一个shell
 *
 * By.IDlike
 *
 * 注意：即使它以类的形式编写也不能同时初始化多个！因为至多允许单个实例运行。
 *      全局共用密码和初始化状态。
 *
 *  Promise<boolean> init() 初始化
 *  Promise<boolean> isInitialized() 检测是否可通信
 *  Promise<string> execCommand(command:string) 执行命令（返回结果）
 *  Promise<boolean> isWorking() 检测是否在运行
 *  Promise<boolean> shutdown() 关闭
 *
 */

import TcpSocket from 'react-native-tcp-socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
/** 常量和全局变量 */
const HOST = '127.0.0.1';
const PORT = 50501;
const TIMEOUT_MS = 5000;

var passwordFetched = false;
var cachedPassword = "";

/** 辅助函数：储存数据 */
const writeData =  (key, value, callback) => {
  const strValue = typeof value === 'string' ? value : JSON.stringify(value);

  AsyncStorage.setItem(key, strValue)
    .then(() => {
      console.log(`写入成功: ${key}`);
      callback && callback(true);
    })
    .catch(error => {
      console.error(`写入失败: ${key}`, error);
      callback && callback(false);
    });
};

const getData = (key, callback) => {
  AsyncStorage.getItem(key)
    .then(value => {
      if (value == null) {
        callback && callback(null);
        return;
      }

      try {
        callback && callback(JSON.parse(value));
      } catch {
        callback && callback(value);
      }
    })
    .catch(error => {
      console.error(`读取失败: ${key}`, error);
      callback && callback(null);
    });
};


/**
 * CPPAPISocket
 *
 */

export class CPPAPISocket {
  /**
   * Promise<boolean> init()
   * 功能：初始化连接
   * 注意：这会直接获取密码（从本地缓存和远端），所以只需要调用他就可以无忧初始化了。
   *      如果他返回false了，证明服务压根没运行或者未知原因获取密码失败。
   * */
  async init(): Promise<boolean> {
    console.log('CPPAPISocket created');
    return this._init();
  }

  /**
   * Promise<boolean> isInitialized()
   * 功能：获取是否获取密码成功
   * 注意：获取密码并测试通信成功成功为true。
   * */
  async isInitialized(): Promise<boolean> {
    return (await this._execCommand('echo OK')) === 'OK';
  }

  /**
   * Promise<string> execCommand(command:string)
   * 功能：使用已经连接的终端执行命令
   * 注意：必须获取密码成功才可正确执行。
   * */
  async execCommand(cmd: string): Promise<string> {
    return this._execCommand(cmd);
  }

  /**
   * Promise<boolean> isWorking()
   * 功能：获取服务是否在运行
   * 注意：无需获取密码成功。
   */
  async isWorking(): Promise<boolean> {
    return this._isWorking();
  }

  /**
   * Promise<boolean> shutdown()
   * 功能：关闭服务
   * 注意：必须获取密码成功才可正确执行。
   */
  async shutdown(): Promise<boolean> {
    return await this._shutdown();
  }

  /** 完整初始化 */
  private async _init(): Promise<boolean> {
    const savedPwd = await new Promise<string | null>(resolve => {
      getData('@CPPAPI_SOCKETPWD', resolve);
    });

    if (savedPwd) {
      this.setPassword(savedPwd);
    }

    if ((await this._execCommand('echo OK')) === 'OK') {
      return true;
    } else {
      await this.fetchPassword();
      return (await this._execCommand('echo OK')) === 'OK';
    }
  }
  /** 获取密码(远端) */
  private async fetchPassword(): Promise<string> {
    // if (passwordFetched) return cachedPassword;
    // passwordFetched = true;
    return new Promise(resolve => {
      const client = TcpSocket.createConnection(
        { host: HOST, port: PORT, timeout: TIMEOUT_MS },
        () => {
          client.write('socket_passwd\n');
        },
      );

      const cleanup = () => {
        client.removeAllListeners();
        client.destroy();
      };

      client.once('data', data => {
        const pw = data.toString().trim();
        if (pw.length === 8 && !pw.startsWith('ERROR')) {
          this.setPassword(pw);
          resolve(pw);
        } else {
          resolve('ERROR');
        }
        cleanup();
      });

      client.once('error', e => {
        console.log('Fetch password error:', e);
        resolve('ERROR');
        cleanup();
      });

      client.once('timeout', () => {
        console.log('Fetch password timeout');
        resolve('ERROR');
        cleanup();
      });
    });
  }
  /** 发送socket数据 */
  private async sendRawCommand(command: string): Promise<string> {
    return new Promise(resolve => {
      const client = TcpSocket.createConnection(
        { host: HOST, port: PORT, timeout: TIMEOUT_MS },
        () => client.write(command + '\n'),
      );

      let response = '';

      const cleanup = () => {
        client.removeAllListeners();
        client.destroy();
      };

      client.on('data', data => {
        response += data.toString();
      });

      client.once('end', () => {
        resolve(response.trim() || 'Error: empty response');
        cleanup();
      });

      client.once('error', e => {
        resolve(`Error: ${e}`);
        cleanup();
      });

      client.once('timeout', () => {
        resolve('Error: timeout');
        cleanup();
      });
    });
  }
  /** 执行命令 */
  private async _execCommand(cmd: string): Promise<string> {
    return this.sendRawCommand(`${cachedPassword} exec ${cmd}`);
  }
  /** 设置密码回调 */
  private setPassword = (password: string) => {
    console.log('PASSWORD:', password);
    writeData('@CPPAPI_SOCKETPWD', password, null);
    cachedPassword = password;
    passwordFetched = true;
  };
  /** 检查服务是否工作 */
  private async _isWorking(): Promise<boolean> {
    return new Promise(resolve => {
      // @ts-ignore
      const client = TcpSocket.createConnection(
        { host: HOST, port: PORT, timeout: TIMEOUT_MS },
        () => client.write('testng\n'),
      );

      const cleanup = () => {
        client.removeAllListeners();
        client.destroy();
      };

      client.once('data', data => {
        const response = data.toString().trim();
        resolve(response.startsWith('working'));
        cleanup();
      });

      client.once('error', () => resolve(false));
      client.once('timeout', () => {
        resolve(false);
        cleanup();
      });
    });
  }
  /** 关闭服务 */
  private async _shutdown(): Promise<boolean> {
    writeData('@CPPAPI_SOCKETPWD', '', null);
    const ret = await this.sendRawCommand(`shutdown`);
    return ret.toString().trim() === 'OK: shutdown';
  }
}
