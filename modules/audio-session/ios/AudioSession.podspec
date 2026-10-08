Pod::Spec.new do |s|
  s.name           = 'AudioSession'
  s.version        = '1.0.0'
  s.summary        = 'Reads the shared AVAudioSession category for the repro'
  s.author         = ''
  s.homepage       = 'https://github.com/Nezz/expo-repro'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
