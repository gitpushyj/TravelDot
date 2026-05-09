// 방문 기록 저장소의 진입점. 새 trip 모델 (traveldot_v1.db) 기반.
// 호출 측은 항상 이 barrel을 통해 import한다.
// 일부 함수(createTrip/deleteTrip/updateTripDates/bridgeNearbyVisitDays/mergeTrips/upsertNote/deleteNote 등)는
// 기존 visit_days 시대의 시그니처를 유지하기 위해 trip/* 모듈에서 호환 wrapper를 노출한다.

export {
  type VisitPhotoInput,
  type TripPhoto,
  type VisitPhotoForReview,
  addPhotos,
  loadPhotosForTrip,
  loadAllPhotosForReview,
  loadPhotoUrisByIds,
  markPhotosUserReviewed,
  softDeletePhotosByIds,
  updatePhotoDevices,
} from "./trip/tripPhotos";

export {
  type VisitNote,
  listNotes,
  loadLatestNoteForTrip,
  upsertNote,
  deleteNote,
} from "./trip/tripNotes";

export {
  countPhotosForCountry,
  countPhotosForDay,
  countPhotosForTrip,
  loadForeignPhotoCount,
} from "./trip/tripPhotoCounts";

export {
  type YearSummary,
  loadAvailableYears,
  loadLatestVisitDate,
  loadTotalVisitDays,
  loadVisitCounts,
  loadVisitCountsByYear,
  loadYearSummaries,
} from "./trip/tripCounts";

export {
  type RecentTrip,
  type TripWithPhotos,
  loadAllTrips,
  loadRecentTripsByCountry,
  loadTripsForCountry,
} from "./trip/tripList";

export {
  createTrip,
  updateTripDates,
  deleteTrip,
} from "./trip/tripWriters";

export {
  bridgeNearbyVisitDays,
  mergeTrips,
} from "./trip/tripMerge";

export {
  purgeAllVisits,
  removeAutoVisitsForCountry,
  softDeleteEmptyTripsForCountry,
  wipeAllVisits,
} from "./trip/tripMaintenance";
