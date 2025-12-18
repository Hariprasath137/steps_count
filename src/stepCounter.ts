import {
  parseStepData as dongmiyuParseStepData,
  startStepCounterUpdate as dongmiyuStartStepCounter,
  stopStepCounterUpdate as dongmiyuStopStepCounter,
} from "@dongminyu/react-native-step-counter"
import { getLastSensorCount, saveLastSensorCount } from "./storage"

export const parseStepData = dongmiyuParseStepData
export { getLastSensorCount, saveLastSensorCount }

export const startStepCounterUpdate = (startDate: Date, callback: (raw: any) => void) => {
  return dongmiyuStartStepCounter(startDate, callback)
}

export const stopStepCounterUpdate = () => {
  return dongmiyuStopStepCounter()
}
