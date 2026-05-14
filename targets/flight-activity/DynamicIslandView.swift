import SwiftUI

// Dynamic Island expanded bottom 영역. 경로선 + 남은 시간.
struct DynamicIslandBottomView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    // 경로선 양 끝이 위쪽 LHR/IST(.padding 14)와 맞도록 같은 들여쓰기를 준다.
    VStack(spacing: 8) {
      RouteLineView(departAt: attributes.departAt, arriveAt: attributes.arriveAt)
      Text(timerInterval: attributes.departAt...attributes.arriveAt, countsDown: true)
        .font(.title3).monospacedDigit()
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
    .padding(.horizontal, 14)
  }
}
