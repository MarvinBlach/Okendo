document.addEventListener("DOMContentLoaded", function() {
    console.log('DOM fully loaded and parsed');

    fetch('https://api.okendo.io/v1/stores/2b5b8231-70cb-49e6-a5dc-922e8fd6820f/reviews')
      .then(response => {
        console.log('Received response from fetch');
        return response.json();
      })
      .then(data => {
        console.log('Parsed response to JSON:', data);
        
        const wrapper = document.querySelector('.swiper-wrapper.is-testimonial');
        if (!wrapper) {
            console.error('Swiper wrapper not found');
            return;
        }
        
        let innerHTML = '';
  
        data.reviews.forEach((review, index) => {
          console.log(`Processing review ${index + 1}:`, review);
          
          const daysAgo = Math.floor((new Date() - new Date(review.dateCreated)) / (1000 * 60 * 60 * 24));
          const timeAgo = daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
          const starsFilled = review.rating; // assuming 'rating' is out of 5
          const starsEmpty = 5 - starsFilled;
          const filledStarImg = '<img src="https://uploads-ssl.webflow.com/661e93cf28f6a94dfed346bc/664c7f8c658819583d4909b7_bandwerk-full-star.svg" alt="Filled Star" class="star-icon">';
          const emptyStarImg = '<img src="https://uploads-ssl.webflow.com/661e93cf28f6a94dfed346bc/664c7f8c28ac28fd3182ef85_bandwerk-empty-star.svg" alt="Empty Star" class="star-icon">';
  
          innerHTML += `
          <div role="listitem" class="swiper-slide is-testimonial w-dyn-item" style="width: 762.333px; margin-right: 20px;">
            <div class="reviews_content-inner">
              <div class="reviews_content-inner-component">
                <div class="reviews_content-inner-stars">
                  ${filledStarImg.repeat(starsFilled)}
                  ${emptyStarImg.repeat(starsEmpty)}
                </div>
                <div rev-days-ago="" class="text-size-regular text-color-hazel60 text-weight-semibold">${timeAgo}</div>
              </div>
              <div class="spacer-29"></div>
              <div class="reviews_content-name">
                <div rev-name="" class="text-size-medium text-weight-semibold">${review.reviewer.displayName}</div>
              </div>
              <div class="spacer-29"></div>
              <h5 rev-heading="" class="heading-style-h5 text-color-black">${review.title}</h5>
              <div class="spacer-9"></div>
              <p rev-text="" class="text-size-medium">${review.body}</p>
            </div>
          </div>`;
        });
  
        wrapper.innerHTML = innerHTML;
        console.log('Added innerHTML to wrapper:', innerHTML);
        
        try {
            const swiper = new Swiper('.is-testimonial', {
              slidesPerView: 3,
              spaceBetween: 20,
              effect: 'slide',
              speed: 800,
              navigation: {
                nextEl: '#review-next',
                prevEl: '#review-prev',
              },
            });
            console.log('Swiper initialized:', swiper);
        } catch (error) {
            console.error('Error initializing Swiper:', error);
        }
      })
      .catch(error => console.error('There was a problem with the fetch operation:', error));
});
