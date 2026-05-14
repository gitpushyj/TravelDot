import SwiftUI
import WidgetKit

// 출발지(●)에서 도착지(○)를 잇는 일자선. 지나온 구간은 실선, 남은 구간은 점선,
// 경계에 비행기. ProgressView(timerInterval:)는 푸시 없이 iOS가 자동 갱신한다.
struct RouteLineView: View {
  let departAt: Date
  let arriveAt: Date

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        // 전체 경로: 점선
        Rectangle()
          .fill(.secondary.opacity(0.4))
          .frame(height: 3)
          .frame(maxHeight: .infinity, alignment: .center)

        // 지나온 경로 + 비행기
        ProgressView(timerInterval: departAt...arriveAt, countsDown: false) {
          EmptyView()
        } currentValueLabel: {
          EmptyView()
        }
        .progressViewStyle(FlightProgressStyle(width: geo.size.width))
      }
      .overlay(alignment: .leading) {
        Circle().fill(.primary).frame(width: 7, height: 7)
      }
      .overlay(alignment: .trailing) {
        Circle().strokeBorder(.primary, lineWidth: 1.5).frame(width: 7, height: 7)
      }
    }
    .frame(height: 16)
  }
}

// 스파이크 지점: timerInterval ProgressView에서 커스텀 스타일이 fractionCompleted를
// 노출하는지가 iOS 버전에 따라 불확실하다. 노출되면 비행기가 fill 선두를 따라 이동한다.
struct FlightProgressStyle: ProgressViewStyle {
  let width: CGFloat

  func makeBody(configuration: Configuration) -> some View {
    let fraction = configuration.fractionCompleted ?? 0
    let x = max(0, min(width, width * fraction))
    return ZStack(alignment: .leading) {
      Capsule()
        .fill(.tint)
        .frame(width: x, height: 3)
        .frame(maxHeight: .infinity, alignment: .center)
      Image(systemName: "airplane")
        .font(.system(size: 13))
        .foregroundStyle(.tint)
        .offset(x: x - 7)
    }
  }
}
