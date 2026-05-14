import SwiftUI

// Dynamic Island expanded bottom 영역. 경로선 + 남은 시간.
struct DynamicIslandBottomView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    VStack(spacing: 8) {
      RouteLineView(departAt: attributes.departAt, arriveAt: attributes.arriveAt)
      Text(timerInterval: attributes.departAt...attributes.arriveAt, countsDown: true)
        .font(.title3).monospacedDigit()
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
  }
}
