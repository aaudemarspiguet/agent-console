import AudioToolbox
import ExpoModulesCore

/// Plays the deck's key sounds through System Sound Services (K-4, handoff T11).
///
/// The user wants the keys to behave like the iPhone's own keyboard clicks,
/// following the ringer volume rather than the media volume (2026-11-13).
/// Apple's documentation for AudioServicesPlaySystemSound: sounds play "at the
/// current system audio volume, with no programmatic volume control available";
/// "Sounds play immediately"; "You can play only one sound at a time"; files must
/// be linear PCM or IMA4 in .caf, .aif or .wav, no longer than 30 seconds. By
/// default (kAudioServicesPropertyIsUISound = 1) a system sound respects the
/// user's Sound Effects setting.
public class KeyClickModule: Module {
  private var sounds: [String: SystemSoundID] = [:]

  public func definition() -> ModuleDefinition {
    Name("KeyClick")

    /// Registers a sound file under a key. Returns false if iOS refused it.
    Function("load") { (key: String, url: URL) -> Bool in
      if self.sounds[key] != nil {
        return true
      }
      var id: SystemSoundID = 0
      let status = AudioServicesCreateSystemSoundID(url as CFURL, &id)
      guard status == kAudioServicesNoError else {
        return false
      }
      self.sounds[key] = id
      return true
    }

    Function("play") { (key: String) in
      if let id = self.sounds[key] {
        AudioServicesPlaySystemSound(id)
      }
    }

    OnDestroy {
      for id in self.sounds.values {
        AudioServicesDisposeSystemSoundID(id)
      }
      self.sounds.removeAll()
    }
  }
}
