import { TestCPPAPI_Socket_App } from './TestCPPAPISocket.tsx';
import { Text, View } from 'react-native';

var tests = {
  socket:"CPPSOCKET",
  nop:"NO CREATE TEST"
}


var test_type = tests['socket'];
export var testable = false;


export default function Utest(){
  if(test_type == "CPPSOCKET"){
    return <TestCPPAPI_Socket_App />
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