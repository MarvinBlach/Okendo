const okendoUserId = '2b5b8231-70cb-49e6-a5dc-922e8fd6820f';
const productId = '9417272066312';
const reviewsPerPage = 5;
const orderBy = 'date desc';
const locale = 'de';

let currentPage = 1;
let totalPages = 1;
let reviews = [];

console.log('Script started');

// Construct the review link
const reviewLink = `https://okendo.reviews/?subscriberId=${okendoUserId}&productId=shopify-${productId}&locale=${locale}&variant=formal`;

// Set the review link to the button
document.querySelector('[rev-button-link]').setAttribute('href', reviewLink);
console.log('Review link set:', reviewLink);

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
    console.log('Aggregate data:', data);
    const reviewAggregate = data.reviewAggregate;
    const recommendationPercentage = ((reviewAggregate.recommendationCount / reviewAggregate.reviewCount) * 100).toFixed(0);
    document.querySelector('[rev-percentage]').innerText = `${recommendationPercentage}% of reviewers`;
    console.log('Recommendation percentage set:', recommendationPercentage);
  })
  .catch(error => console.error('Error fetching review aggregate:', error));

// Fetch all reviews without limit
const reviewsUrl = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${productId}/reviews?orderBy=${encodeURIComponent(orderBy)}`;

// Fetch review media
const mediaUrl = `https://api.okendo.io/v1/stores/${okendoUserId}/products/shopify-${productId}/review_media?orderBy=${encodeURIComponent(orderBy)}`;

console.log('Fetching reviews and media');

// Use Promise.all to fetch both reviews and media simultaneously
Promise.all([
  fetch(reviewsUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
  fetch(mediaUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
])
  .then(([reviewsResponse, mediaResponse]) => Promise.all([reviewsResponse.json(), mediaResponse.json()]))
  .then(([reviewsData, mediaData]) => {
    console.log('Reviews data:', JSON.stringify(reviewsData, null, 2));
    console.log('Media data:', JSON.stringify(mediaData, null, 2));
    
    reviews = reviewsData.reviews;
    
    // Create a map of review IDs to their associated media
    const mediaMap = new Map();
    if (Array.isArray(mediaData.media)) {
      mediaData.media.forEach(mediaItem => {
        console.log('Processing media item:', mediaItem);
        if (mediaItem && mediaItem.reviewId && mediaItem.imageUrls) {
          if (!mediaMap.has(mediaItem.reviewId)) {
            mediaMap.set(mediaItem.reviewId, []);
          }
          // Use the fullSizeUrl, or fall back to largeUrl or thumbnailUrl if fullSizeUrl is not available
          const imageUrl = mediaItem.imageUrls.fullSizeUrl || mediaItem.imageUrls.largeUrl || mediaItem.imageUrls.thumbnailUrl;
          if (imageUrl) {
            mediaMap.get(mediaItem.reviewId).push(imageUrl);
          } else {
            console.warn('No valid image URL found for media item:', mediaItem);
          }
        } else {
          console.warn('Invalid media item:', mediaItem);
        }
      });
    } else {
      console.error('mediaData.media is not an array:', mediaData.media);
    }

    console.log('Media map:', Array.from(mediaMap.entries()));

    // Attach media to corresponding reviews
    reviews.forEach(review => {
      const reviewImages = mediaMap.get(review.reviewId) || [];
      console.log(`Review ${review.reviewId} mapped images:`, reviewImages);
      review.images = reviewImages;
      console.log(`Review ${review.reviewId} assigned images:`, review.images);
    });

    totalPages = Math.ceil(reviews.length / reviewsPerPage);
    console.log('Total pages:', totalPages);
    
    buildAllReviews();
    renderReviews();
    updatePagination();
  })
  .catch(error => console.error('Error fetching reviews and media:', error));

function buildAllReviews() {
  console.log('Building all reviews');
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
  console.log('All reviews built');
}

function renderReviews() {
  console.log('Rendering reviews');
  const reviewItems = document.querySelectorAll('.review-item');

  reviewItems.forEach((item, index) => {
    item.style.display = (index >= (currentPage - 1) * reviewsPerPage && index < currentPage * reviewsPerPage) ? 'flex' : 'none';
  });
  console.log('Reviews rendered');
}

function updatePagination() {
  console.log('Updating pagination');
  const currentPageElement = document.querySelector('[rev-current-page]');
  const totalPagesElement = document.querySelector('[rev-total-pages]');
  const prevButton = document.querySelector('[rev-back]');
  const nextButton = document.querySelector('[rev-next-page]');

  if (!currentPageElement || !totalPagesElement || !prevButton || !nextButton) {
    console.warn('Pagination elements not found');
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
  console.log('Pagination updated');
}

function prevPage() {
  console.log('Moving to previous page');
  if (currentPage > 1) {
    currentPage--;
    renderReviews();
    updatePagination();
  }
}

function nextPage() {
  console.log('Moving to next page');
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
  console.log('Rendering images:', imageUrls);
  if (!imageUrls || imageUrls.length === 0) return '';
  return imageUrls.map(url => `<img src="${url}" loading="lazy" rev-image="" alt="" class="review_img" onclick="openModal('${url}')">`).join('');
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

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'imageModal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '1000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.overflow = 'auto';
  modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
  modal.innerHTML = `
    <span class="close" onclick="closeModal()" style="position:absolute;top:15px;right:35px;color:#f1f1f1;font-size:40px;font-weight:bold;cursor:pointer;">&times;</span>
    <img id="modalImage" style="margin:auto;display:block;width:80%;max-width:700px;max-height:80%;object-fit:contain;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
  `;
  document.body.appendChild(modal);
}

function openModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modal.style.display = 'block';
  modalImg.src = imageUrl;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
}

// Create the modal when the script loads
createModal();

// Add event listener to close the modal when clicking outside the image
document.getElementById('imageModal').addEventListener('click', function(event) {
  if (event.target === this) {
    closeModal();
  }
});

// Add keyboard event listener to close the modal with the Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Initial render
updatePagination();

console.log('Script finished');

// Delayed logging
setTimeout(() => {
  console.log('Delayed logging:');
  console.log('Reviews:', reviews);
  console.log('Total pages:', totalPages);
  const reviewItems = document.querySelectorAll('.review-item');
  console.log('Number of rendered review items:', reviewItems.length);
}, 1000);