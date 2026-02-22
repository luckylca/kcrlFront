import { TestCPPAPI_Socket_App } from './TestCPPAPISocket.tsx';
import { Text, View } from 'react-native';
import { TestCPPAPIDeviceGetter } from './TestCPPAPIDeviceGetter.tsx';
import { TestCPPAPIDeviceLesion } from './TestCPPAPIDeviceLesion.tsx';

var tests = {
  socket:"CPPSOCKET",
    devicelist:"CPPAPIDeviceGetter",
    devicelesion:"CPPAPIDeviceLesion",
  nop:"NO CREATE TEST"
}


var test_type = tests['devicelesion'];
export var testable = true;


export default function Utest(){
  if(test_type == "CPPSOCKET"){
    return <TestCPPAPI_Socket_App />
  } else if (test_type == 'CPPAPIDeviceGetter') {
    return <TestCPPAPIDeviceGetter />;
  } else if (test_type == 'CPPAPIDeviceLesion') {
    return <TestCPPAPIDeviceLesion />;
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