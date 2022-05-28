import {Platform} from 'react-native'

export default (num)=>{
    num = Number(num)
    num = Math.abs(num)
    if(Platform.OS!="android") {
        num = num.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        return num
    }
    num = num.toFixed(2)
    return `$${num}`
}