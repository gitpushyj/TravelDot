import SwiftUI

struct LockScreenView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    VStack(spacing: 10) {
      HStack {
        Text(attributes.originName)
          .font(.caption).fontWeight(.semibold)
          .lineLimit(1)
        Spacer(minLength: 12)
        Text(attributes.destName)
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
