import ActivityKit
import WidgetKit
import SwiftUI

@main
struct FlightActivityBundle: WidgetBundle {
  var body: some Widget {
    FlightActivityWidget()
  }
}

struct FlightActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FlightActivityAttributes.self) { context in
      // 잠금화면 / 배너
      LockScreenView(attributes: context.attributes)
        .activitySystemActionForegroundColor(.primary)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.attributes.originIata)
            .font(.caption).fontWeight(.bold)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.attributes.destIata)
            .font(.caption).fontWeight(.bold)
        }
        DynamicIslandExpandedRegion(.bottom) {
          DynamicIslandBottomView(attributes: context.attributes)
        }
      } compactLeading: {
        Image(systemName: "airplane")
      } compactTrailing: {
        Text(timerInterval: context.attributes.departAt...context.attributes.arriveAt,
             countsDown: true)
          .monospacedDigit()
      } minimal: {
        Image(systemName: "airplane")
      }
    }
  }
}
