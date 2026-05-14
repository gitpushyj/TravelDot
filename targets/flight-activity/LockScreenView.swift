import Foundation
import SwiftUI

// 위젯 익스텐션은 자체 번들이라, 상위 앱 번들에서 현지화된 표시 이름을 읽는다.
// .appex는 항상 <MainApp>.app/PlugIns/<name>.appex 에 위치하므로 두 단계 위가 앱 번들.
private let appDisplayName: String = {
  let appBundleURL = Bundle.main.bundleURL
    .deletingLastPathComponent()
    .deletingLastPathComponent()
  let appBundle = Bundle(url: appBundleURL) ?? .main
  let info = appBundle.localizedInfoDictionary ?? appBundle.infoDictionary
  return (info?["CFBundleDisplayName"] as? String)
    ?? (info?["CFBundleName"] as? String)
    ?? "Pixel Travel"
}()

struct LockScreenView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    VStack(spacing: 10) {
      HStack {
        Text(appDisplayName)
          .font(.caption2)
          .foregroundStyle(.secondary)
        Spacer()
      }
      HStack {
        Text(attributes.originIata)
          .font(.caption).fontWeight(.semibold)
          .lineLimit(1)
        Spacer(minLength: 12)
        Text(attributes.destIata)
          .font(.caption).fontWeight(.semibold)
          .lineLimit(1)
      }
      RouteLineView(departAt: attributes.departAt, arriveAt: attributes.arriveAt)
      Text(timerInterval: attributes.departAt...attributes.arriveAt, countsDown: true)
        .font(.title3).monospacedDigit()
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
    .padding(14)
  }
}
