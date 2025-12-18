import { Platform } from "react-native"
import AppleHealthKit, { type HealthValue, type HealthKitPermissions } from "react-native-health"

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
}

export const requestIOSHealthKitPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false

  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.error("[v0] HealthKit permission error:", error)
        resolve(false)
      } else {
        console.log("[v0] HealthKit permissions granted")
        resolve(true)
      }
    })
  })
}

export const queryIOSHealthKit = async (): Promise<number> => {
  if (Platform.OS !== "ios") return 0

  return new Promise((resolve) => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const options = {
      date: startOfDay.toISOString(),
      includeManuallyAdded: false,
    }

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.error("[v0] Error fetching iOS steps:", err)
        resolve(0)
      } else {
        const steps = results?.value || 0
        console.log("[v0] iOS HealthKit steps:", steps)
        resolve(steps)
      }
    })
  })
}
