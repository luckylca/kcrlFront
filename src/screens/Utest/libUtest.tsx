import { TestCPPAPI_Socket_App } from './TestCPPAPISocket.tsx';
import { Text, View } from 'react-native';
import {TestCPPAPIDeviceGetter} from "./TestCPPAPIDeviceGetter.tsx";

var tests = {
  socket:"CPPSOCKET",
    devicelist:"CPPAPIDeviceGetter",
  nop:"NO CREATE TEST"
}


var test_type = tests['devicelist'];
export var testable = false;


export default function Utest(){
  if(test_type == "CPPSOCKET"){
    return <TestCPPAPI_Socket_App />
  } else if(test_type == "CPPAPIDeviceGetter"){
      return <TestCPPAPIDeviceGetter />
  } else {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>无此测试:{test_type}</Text>
      </View>
    );
  }
}