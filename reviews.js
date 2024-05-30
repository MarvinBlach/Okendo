const okendoUserId = '2b5b8231-70cb-49e6-a5dc-922e8fd6820f';
const productId = '{{ product.id }}';
const reviewsPerPage = 5;
const orderBy = 'date desc';
const locale = 'de';

let currentPage = 1;
let totalPages = 1;
let reviews = [];

// Construct the review link
const reviewLink = `https://okendo.reviews/?subscriberId=${okendoUserId}&productId=shopify-${productId}&locale=${locale}&variant=formal`;

// Set the review link to the button
document.querySelector('[rev-button-link]').setAttribute('href', reviewLink);

// Fetch review aggregate data
const aggregateUrl = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${productId}/review_aggregate`;

fetch(aggregateUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    const reviewAggregate = data.reviewAggregate;
    const recommendationPercentage = ((reviewAggregate.recommendationCount / reviewAggregate.reviewCount) * 100).toFixed(0);
    document.querySelector('[rev-percentage]').innerText = `${recommendationPercentage}% of reviewers`;
  })
  .catch(error => console.error('Error fetching review aggregate:', error));

// Fetch all reviews without limit
const reviewsUrl = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${productId}/reviews?orderBy=${encodeURIComponent(orderBy)}`;

fetch(reviewsUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    reviews = data.reviews;
    totalPages = Math.ceil(reviews.length / reviewsPerPage);
    buildAllReviews();
    renderReviews();
    updatePagination();
  })
  .catch(error => console.error('Error fetching reviews:', error));

// Fetch review media
const mediaUrl = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${productId}/review_media?orderBy=${encodeURIComponent(orderBy)}`;

fetch(mediaUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(mediaResponse => mediaResponse.json())
  .then(mediaData => {
    const mediaMap = new Map();
    mediaData.media.forEach(mediaItem => {
      if (!mediaMap.has(mediaItem.reviewId)) {
        mediaMap.set(mediaItem.reviewId, []);
      }
      mediaMap.get(mediaItem.reviewId).push(mediaItem.url);
    });

    reviews.forEach(review => {
      review.images = mediaMap.get(review.reviewId) || [];
    });

    buildAllReviews();
    renderReviews();
  })
  .catch(error => console.error('Error fetching review media:', error));

function buildAllReviews() {
  const reviewsContainer = document.querySelector('.detail_content-main');
  reviewsContainer.innerHTML = ''; // Clear previous reviews if any

  reviews.forEach(review => {
    const reviewItem = document.createElement('div');
    reviewItem.classList.add('detail_content-item', 'background-color-alternate', 'review-item');
    reviewItem.innerHTML = `
      <div class="detail_content-item-top">
        <div class="star_container">${renderStars(review.rating)}</div>
        <div rev-time-ago="" class="text-size-regular text-color-hazel60 text-weight-semibold">${timeAgo(new Date(review.dateCreated))}</div>
      </div>
      <div class="reviews_content-name">
        <div rev-name="" class="text-size-medium text-weight-semibold">${review.reviewer.displayName}</div>
      </div>
      <p rev-text-content="" class="text-size-medium text-color-hazel90">${review.body}</p>
      <div class="review_img-holder">${renderImages(review.images)}</div>
    `;
    reviewsContainer.appendChild(reviewItem);
  });
}

function renderReviews() {
  const reviewItems = document.querySelectorAll('.review-item');

  reviewItems.forEach((item, index) => {
    item.style.display = (index >= (currentPage - 1) * reviewsPerPage && index < currentPage * reviewsPerPage) ? 'flex' : 'none';
  });
}

function updatePagination() {
  const currentPageElement = document.querySelector('[rev-current-page]');
  const totalPagesElement = document.querySelector('[rev-total-pages]');
  const prevButton = document.querySelector('[rev-back]');
  const nextButton = document.querySelector('[rev-next-page]');

  if (!currentPageElement || !totalPagesElement || !prevButton || !nextButton) {
    return;
  }

  currentPageElement.innerText = currentPage;
  totalPagesElement.innerText = totalPages;

  prevButton.style.visibility = currentPage === 1 ? 'hidden' : 'visible';
  nextButton.style.visibility = currentPage === totalPages ? 'hidden' : 'visible';

  prevButton.removeEventListener('click', prevPage);
  nextButton.removeEventListener('click', nextPage);
  prevButton.addEventListener('click', prevPage);
  nextButton.addEventListener('click', nextPage);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderReviews();
    updatePagination();
  }
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    renderReviews();
    updatePagination();
  }
}

function renderStars(rating) {
  const fullStar = '<img src="https://assets-global.website-files.com/661e93cf28f6a94dfed346bc/664c7f8c658819583d4909b7_bandwerk-full-star.svg" loading="lazy" rev-full="" alt="" class="full_star">';
  const emptyStar = '<img src="https://assets-global.website-files.com/661e93cf28f6a94dfed346bc/664c7f8c28ac28fd3182ef85_bandwerk-empty-star.svg" loading="lazy" rev-empty="" alt="" class="empty_star">';
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? fullStar : emptyStar;
  }
  return stars;
}

function renderImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return '';
  return imageUrls.map(url => `<img src="${url}" loading="lazy" rev-image="" alt="" class="review_img">`).join('');
}

function timeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return `${seconds} seconds ago`;
}

// Initial render
updatePagination();
