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
        // 폭 제약이 없으면 Text(timerInterval:)가 과도한 폭을 요구해 알약이 화면을
        // 가득 채운다. "HH:MM:SS"(최장 8자, monospaced) 기준 고정 폭으로 묶는다.
        Text(timerInterval: context.attributes.departAt...context.attributes.arriveAt,
             countsDown: true)
          .monospacedDigit()
          .frame(width: 80)
      } minimal: {
        Image(systemName: "airplane")
      }
    }
  }
}
