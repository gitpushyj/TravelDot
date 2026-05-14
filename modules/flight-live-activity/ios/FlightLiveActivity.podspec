Pod::Spec.new do |s|
  s.name           = 'FlightLiveActivity'
  s.version        = '0.1.0'
  s.summary        = 'JS to ActivityKit bridge for flight live activity'
  s.description    = 'Starts and ends a flight Live Activity from JS. Shares FlightActivityAttributes with the widget extension target.'
  s.author         = ''
  s.homepage       = 'https://example.com'
  s.license        = 'MIT'
  # 앱 deployment target(15.1)에 맞춘다. ActivityKit 사용부는 모두 #available(iOS 16.2)로
  # 런타임 가드한다. podspec ios를 16.2로 두면 Expo autolinking이 supports_platform? 검사에서
  # 모듈을 통째로 스킵하므로 반드시 앱과 같은 floor를 쓴다.
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  # 자체 swift + 위젯 타깃과 공유하는 FlightActivityAttributes.swift를 함께 컴파일한다.
  # 공유 파일은 위젯 타깃 폴더가 원본이고, 여기 ios/ 안에는 symlink로 들어온다.
  # (CocoaPods는 pod root 밖의 source_files를 무시하므로 symlink로 root 안에 둔다.)
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
