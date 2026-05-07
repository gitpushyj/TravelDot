package expo.modules.photolocation

import android.content.ContentResolver
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext

// expo-media-library의 getAssetInfoAsync는 한 장당 width/height/duration/orientation까지
// 다 채워주느라 비싸다. 우리는 GPS 좌표만 필요하므로, MediaStore _ID로 만든 content URI에서
// EXIF 헤더만 읽어 latLong을 꺼낸다. Q+에서는 setRequireOriginal로 ACCESS_MEDIA_LOCATION을
// 요구하는 원본 스트림을 받는다. iOS의 PhotoLocationModule과 인터페이스/순서를 맞춘다.
class PhotoLocationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PhotoLocation")

    AsyncFunction("getLocations") Coroutine { ids: List<String> ->
      if (ids.isEmpty()) return@Coroutine emptyList<Map<String, Any?>>()
      val resolver = appContext.reactContext?.contentResolver
        ?: throw Exceptions.ReactContextLost()

      // 동시 file open이 너무 많으면 OS 핸들 한도/스로틀에 걸린다. 8 정도면
      // CPU/디스크 둘 다 충분히 활용하면서 안정적이다.
      val semaphore = Semaphore(8)
      withContext(Dispatchers.IO) {
        coroutineScope {
          ids.map { id ->
            async {
              semaphore.withPermit { readLocation(resolver, id) }
            }
          }.awaitAll()
        }
      }
    }
  }

  private fun readLocation(
    resolver: ContentResolver,
    id: String
  ): Map<String, Any?> {
    val latLng = try {
      val baseUri = Uri.withAppendedPath(
        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
        id
      )
      val originalUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        // ACCESS_MEDIA_LOCATION 권한이 없으면 여기서 UnsupportedOperationException.
        // 이 경우 좌표가 없는 것과 동일하게 처리한다.
        MediaStore.setRequireOriginal(baseUri)
      } else {
        baseUri
      }
      resolver.openInputStream(originalUri)?.use { stream ->
        ExifInterface(stream).latLong
      }
    } catch (_: Throwable) {
      null
    }

    val lat = latLng?.getOrNull(0)
    val lng = latLng?.getOrNull(1)
    val valid = lat != null && lng != null && lat.isFinite() && lng.isFinite()
    return mapOf(
      "id" to id,
      "lat" to if (valid) lat else null,
      "lng" to if (valid) lng else null,
    )
  }
}
