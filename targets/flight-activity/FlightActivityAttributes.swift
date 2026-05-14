import ActivityKit
import Foundation

// 위젯 타깃과 로컬 Expo 모듈이 같은 타입을 공유해야 Activity<FlightActivityAttributes>가
// 양쪽에서 동일하게 동작한다. 이 파일은 위젯 타깃 폴더에 두고, 로컬 모듈 podspec이
// 상대 경로로 같은 파일을 컴파일 소스에 포함한다.
// 로컬 모듈 pod은 deployment target 15.1로 컴파일되므로, ActivityAttributes(iOS 16.1+)
// 준수 타입에는 @available를 명시한다.
@available(iOS 16.1, *)
struct FlightActivityAttributes: ActivityAttributes {
  // 타이머가 시간 구동이라 런타임 갱신 상태가 없다. 빈 ContentState.
  public struct ContentState: Codable, Hashable {}

  let originName: String
  let originIata: String
  let destName: String
  let destIata: String
  let departAt: Date
  let arriveAt: Date
}
