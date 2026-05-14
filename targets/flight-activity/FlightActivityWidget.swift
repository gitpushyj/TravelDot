import ActivityKit
import Foundation
import WidgetKit
import SwiftUI

// 도착 시각을 24시간제 HH:mm으로. 자동 갱신 카운트다운(Text(timerInterval:))은
// H:MM:SS 형식이라 compact 영역에서 잘려서, compact trailing은 도착 시각을 보여준다.
private let hhmmFormatter: DateFormatter = {
  let f = DateFormatter()
  f.dateFormat = "HH:mm"
  return f
}()

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
        Text(hhmmFormatter.string(from: context.attributes.arriveAt))
          .monospacedDigit()
      } minimal: {
        Image(systemName: "airplane")
      }
    }
  }
}
