const reviewStore = {};

export function getReviewsByPoiId(poiId) {
  if (!poiId) return [];
  return reviewStore[poiId] ?? [];
}

export function addReview(poiId, review) {
  if (!poiId) return;

  if (!reviewStore[poiId]) {
    reviewStore[poiId] = [];
  }

  reviewStore[poiId] = [review, ...reviewStore[poiId]];
}

export function getAverageRatingByPoiId(poiId) {
  const reviews = getReviewsByPoiId(poiId);

  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
  return sum / reviews.length;
}

export function getReviewCountByPoiId(poiId) {
  return getReviewsByPoiId(poiId).length;
}