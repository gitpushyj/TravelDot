// 방문 기록 저장소의 진입점. 도메인별 실제 구현은 ./visit/ 아래에 분리되어 있다.
// (counts, trips, photos, notes, maintenance) 호출 측은 항상 이 barrel을 통해 import한다.
export {
  PHOTO_LIMIT_PER_DAY,
  type RecentTrip,
  type TripPhoto,
  type TripWithPhotos,
  type VisitNote,
  type VisitPhotoForReview,
  type VisitPhotoInput,
  type YearSummary,
} from "./visit/types";

export {
  countPhotosForCountry,
  countPhotosForDay,
  countPhotosForTrip,
  loadAvailableYears,
  loadForeignPhotoCount,
  loadLatestVisitDate,
  loadTotalVisitDays,
  loadVisitCounts,
  loadVisitCountsByYear,
  loadYearSummaries,
} from "./visit/counts";

export {
  createTrip,
  deleteTrip,
  loadAllTrips,
  loadRecentTripsByCountry,
  loadTripsForCountry,
  updateTripDates,
} from "./visit/trips";

export {
  addPhotos,
  loadAllPhotosForReview,
  loadPhotoUrisByIds,
  loadPhotosForTrip,
  markPhotosUserReviewed,
  softDeletePhotosByIds,
  updatePhotoDevices,
} from "./visit/photos";

export {
  deleteNote,
  listNotes,
  loadLatestNoteForTrip,
  upsertNote,
} from "./visit/notes";

export {
  removeAutoVisitsForCountry,
  wipeAllVisits,
} from "./visit/maintenance";

export {
  bridgeNearbyVisitDays,
  mergeTrips,
} from "./visit/merge";
