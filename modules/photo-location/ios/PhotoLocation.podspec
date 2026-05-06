Pod::Spec.new do |s|
  s.name           = 'PhotoLocation'
  s.version        = '0.1.0'
  s.summary        = 'Fast PHAsset.location batch reader'
  s.description    = 'Reads PHAsset.location directly without expo-media-library getAssetInfoAsync, which opens each image file to extract EXIF.'
  s.author         = ''
  s.homepage       = 'https://example.com'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1', :tvos => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
