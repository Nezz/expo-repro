import AVFoundation
import ExpoModulesCore

public class AudioSessionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioSession")

    Function("getCategory") { () -> String in
      let session = AVAudioSession.sharedInstance()
      return "\(session.category.rawValue.replacingOccurrences(of: "AVAudioSessionCategory", with: "")) / \(session.mode.rawValue.replacingOccurrences(of: "AVAudioSessionMode", with: ""))"
    }
  }
}
