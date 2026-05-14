import ExpoModulesCore
import ActivityKit

public class FlightLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FlightLiveActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    // 멱등: 항상 기존 액티비티를 먼저 종료한 뒤 새로 1개만 생성한다.
    AsyncFunction("start") { (attrs: [String: Any]) in
      guard #available(iOS 16.2, *) else { return }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

      for activity in Activity<FlightActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }

      let departMs = (attrs["departAt"] as? Double) ?? 0
      let arriveMs = (attrs["arriveAt"] as? Double) ?? 0
      let attributes = FlightActivityAttributes(
        originName: (attrs["originName"] as? String) ?? "",
        originIata: (attrs["originIata"] as? String) ?? "",
        destName: (attrs["destName"] as? String) ?? "",
        destIata: (attrs["destIata"] as? String) ?? "",
        departAt: Date(timeIntervalSince1970: departMs / 1000),
        arriveAt: Date(timeIntervalSince1970: arriveMs / 1000)
      )
      let content = ActivityContent(
        state: FlightActivityAttributes.ContentState(),
        staleDate: attributes.arriveAt
      )
      _ = try? Activity.request(attributes: attributes, content: content, pushType: nil)
    }

    AsyncFunction("end") {
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<FlightActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
