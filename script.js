// settings: nasa api key, the api address, the first date nasa has a picture for and how long to wait for nasa
const apiKey = 'VrYSK2YPoW1xXLNFJyPNiK2jMM02PlBusjmC8hpP';
const apiUrl = 'https://api.nasa.gov/planetary/apod';
const firstDate = '1995-06-16';
const waitTime = 15000;

// keeps track of the newest request so old slow answers do not replace newer ones
let latestRequest = 0;
let currentController = null;

// grab the parts of the page needed to change
const dateInput = document.querySelector('#date-input');
const randomButton = document.querySelector('#random-button');
const statusText = document.querySelector('#status');
const result = document.querySelector('#result');
const titleText = document.querySelector('#title');
const dateText = document.querySelector('#date');
const mediaBox = document.querySelector('#media');
const descriptionText = document.querySelector('#description');
const creditText = document.querySelector('#credit');

// turns a date into yyyy-mm-dd, the format the api wants
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// asks the nasa api for the picture of the chosen date
// stops the old request, gives up after 15 seconds and ignores answers that are out of date
async function getPicture(date) {
  latestRequest++;
  const thisRequest = latestRequest;

  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  const timer = setTimeout(() => currentController.abort(), waitTime);

  statusText.textContent = 'Loading...';
  result.hidden = true;

  try {
    const response = await fetch(`${apiUrl}?api_key=${apiKey}&date=${date}`, {
      signal: currentController.signal
    });

    // nasa sent back an error, so jump to the catch below
    if (!response.ok) {
      throw new Error(`NASA sent back an error (${response.status}).`);
    }

    const data = await response.json();

    // a newer request was made while we waited, so ignore this answer
    if (thisRequest !== latestRequest) {
      return;
    }

    // nasa sent back a different date than the one picked, so do not show it
    if (data.date !== date) {
      throw new Error('NASA sent back a different date than the one you picked.');
    }

    showPicture(data);
    statusText.textContent = '';
  } catch (error) {
    // ignore errors from old requests
    if (thisRequest !== latestRequest) {
      return;
    }

    // show a clear message to the user
    if (error.name === 'AbortError') {
      statusText.textContent = 'NASA took too long to answer. Try the date again or pick another date.';
    } else {
      statusText.textContent = `Something went wrong. ${error.message} Try another date.`;
    }
  } finally {
    clearTimeout(timer);
  }
}

// puts the api data on the page, handles pictures, videos and anything else
function showPicture(data) {
  titleText.textContent = data.title;
  dateText.textContent = data.date;
  descriptionText.textContent = data.explanation;
  creditText.textContent = data.copyright ? `Image credit: ${data.copyright}` : '';
  mediaBox.innerHTML = '';

  // nasa sometimes sends its logo instead of the real picture, so show a note and a link to the real page
  if (data.url && data.url.includes('nasa-logo')) {
    const note = document.createElement('p');
    note.textContent = 'NASA did not send a picture for this date. ';
    const pageLink = document.createElement('a');
    pageLink.href = `https://apod.nasa.gov/apod/ap${data.date.slice(2).replaceAll('-', '')}.html`;
    pageLink.textContent = 'See this day on the NASA APOD website.';
    note.appendChild(pageLink);
    mediaBox.appendChild(note);
  } else if (data.media_type === 'image') {
    const image = document.createElement('img');
    image.src = data.url;
    image.alt = data.title;
    mediaBox.appendChild(image);
  } else if (data.media_type === 'video') {
    const video = document.createElement('iframe');
    video.src = data.url;
    video.title = data.title;
    video.allowFullscreen = true;
    mediaBox.appendChild(video);
  } else {
    const link = document.createElement('a');
    link.href = data.url;
    link.textContent = 'View this item on NASA';
    mediaBox.appendChild(link);
  }

  result.hidden = false;
}

// picks a random date between the first picture and yesterday
function getRandomDate() {
  const start = new Date(`${firstDate}T12:00:00`).getTime();
  const end = Date.now() - 24 * 60 * 60 * 1000;
  const randomTime = start + Math.random() * (end - start);
  return formatDate(new Date(randomTime));
}

// sets the date box limits and starts it on today
dateInput.min = firstDate;
dateInput.max = formatDate(new Date());
dateInput.value = formatDate(new Date());

// user interaction: picking a date or clicking the random button gets a new picture
dateInput.addEventListener('change', () => {
  if (dateInput.value) {
    getPicture(dateInput.value);
  }
});

randomButton.addEventListener('click', () => {
  const randomDate = getRandomDate();
  dateInput.value = randomDate;
  getPicture(randomDate);
});

// loads today's picture when the page first opens
getPicture(dateInput.value);