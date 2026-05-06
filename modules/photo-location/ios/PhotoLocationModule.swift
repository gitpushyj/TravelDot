import ExpoModulesCore
import Photos
import CoreLocation

// expo-media-library의 getAssetInfoAsync는 사진 1장당 PHContentEditingInputRequestOptions로
// 파일을 열어 EXIF까지 읽기 때문에 5,000장 스캔이 분 단위로 늘어진다.
// 우리에게 필요한 건 PHAsset.location뿐이고, 이건 메모리 인덱스에서 즉시 읽힌다.
// PHAsset.fetchAssets(withLocalIdentifiers:)로 한 번에 가져와 location만 꺼내쓴다.
public class PhotoLocationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PhotoLocation")

    AsyncFunction("getLocations") { (ids: [String]) -> [[String: Any?]] in
      if ids.isEmpty { return [] }

      let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)
      var byId: [String: PHAsset] = [:]
      byId.reserveCapacity(fetchResult.count)
      fetchResult.enumerateObjects { asset, _, _ in
        byId[asset.localIdentifier] = asset
      }

      return ids.map { id -> [String: Any?] in
        guard let asset = byId[id],
              let location = asset.location,
              CLLocationCoordinate2DIsValid(location.coordinate) else {
          return ["id": id, "lat": nil, "lng": nil]
        }
        return [
          "id": id,
          "lat": location.coordinate.latitude,
          "lng": location.coordinate.longitude,
        ]
      }
    }
  }
}
