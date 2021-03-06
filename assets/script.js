var listenKey = "4f3fcf91ea69455db9ab9bad6c285f61";
var ibmAuth = 'apikey:NugC2Ibafp24cft_C9L7uqMSsR_91BvLsD-g2q1R-tGU';


function ibmAnalayze(queryObj) {
    var baseUrl = 'https://0f967566.us-south.apigw.appdomain.cloud/nluproxy?';
    baseUrl += $.param(queryObj);
    return $.ajax({
        url: baseUrl,
        method: 'GET',
        headers: {
            'authorization': `basic ${btoa(ibmAuth)}`
        }
    });
}

/*
 * Expects an object in the form of
 *{
 *    title: "The Lord of the Rings",
 *    author: "Tolkein"
 *    person: "Zodiac Killer"
 *}
 *at least one property needs to exist for the query to perform properly.
 *
 */
function searchOpenLibrary(searchQuery) {
  var baseUrl = "https://openlibrary.org/search.json";
  var queryUrl = baseUrl + "?";
  if (typeof searchQuery !== "object") {
    return;
  }
  queryUrl += $.param(searchQuery);
  return $.ajax({
    url: queryUrl,
    method: "GET",
  });
}

/*
 * Expects the bookKey taken from the result of a searchOpenLibrary call
 * if response is what is returned from searchOpenLibrary then you would pass
 * response.docs[i].key to this function to get detailed book information about the specific book,
 * where i is the index of the book to search for
 */
function getBookInformation(bookKey) {
  var baseUrl = "https://openlibrary.org";
  var queryUrl = baseUrl + bookKey + ".json";
  return $.ajax({
    url: queryUrl,
    method: "GET",
  });
}

/*
 * searchQuery should be an object with at least a q property and any of the optional parameters
 * specified by the API docs.
 * {
 *   q: 'my favorite murder'
 * }
 * returns the jQuery ajax promise
 */
function listenApiSearch(searchQuery) {
  if (typeof searchQuery !== "object") {
    return;
  }
  var baseUrl = "https://listen-api.listennotes.com/api/v2/search?";
  var queryUrl = (baseUrl += $.param(searchQuery));
  return $.ajax({
    url: queryUrl,
    method: "GET",
    headers: {
      "X-ListenAPI-Key": listenKey,
    },
  });
}

/*
 * Expects the ID of the podcast to get more information for.
 * Returns the jQuery ajax promise.
 */
function listenApiGetPodcast(podcastId) {
  if (podcastId === null || podcastId === undefined) {
    return;
  }
  var baseUrl = "https://listen-api.listennotes.com/api/v2/podcasts/";
  var fullUrl = baseUrl + podcastId;
  return $.ajax({
    url: fullUrl,
    method: "GET",
    headers: {
      "X-ListenAPI-Key": listenKey,
    },
  });
}

function showPodcastEpisodeResults(results) {
  // Empty container element
  $("#site-description").addClass("d-none");
  $("#podcast-list").empty().attr("style", "display: block;");

  results.forEach(function (item) {
    var div = $("<div>").addClass("clearfix border");
    var img = $("<img>")
      .attr("src", item.thumbnail)
      .addClass("float-start me-3");
    var epTitle = $("<p>").text(item.title_original);
    var podTitle = $("<p>").text(item.podcast.title_original);
    var epDesc = $("<p>")
      .text(item.description_original)
      .addClass("episode-description");
    var btn = $('<button>').text('Analyze').addClass('btn btn-dark');
    btn.on('click', function(e) {
        var queryObj = {};
        queryObj.version = '2020-08-01';
        queryObj.features = 'concepts,entities,keywords';
        queryObj.text = item.title_original + ". " + item.description_original;
        var spinner = $(".spinner-border").attr("style", "display: block");
        ibmAnalayze(queryObj).then((response) => {
          spinner.attr("style", "display: none");
            var allResults = [].concat(response.concepts, response.entities, response.keywords);
            var analysisResultsEl = $('<div>');
            var conceptsDiv = $('<div>');
            conceptsDiv.append($('<h3>').text('Analysis results'));
            allResults.sort((a, b) => b.relevance - a.relevance).filter(thing => thing.relevance >= 0.5).forEach(concept => {
                var conceptBtn = $('<button>').text(concept.text).addClass('btn btn-dark concept');
                conceptsDiv.append(conceptBtn);
            });
            analysisResultsEl.append(conceptsDiv);
            $(this).replaceWith(analysisResultsEl);
        }, (_, statusText, errorThrown) => {
            $(this).replaceWith("Sorry, couldn't analyze this.");
        });
    });
    var playBtn = $("<button>")
      .text("Play")
      .attr("data-src", item.audio)
      .addClass("btn btn-dark play-btn");
    div.append(img, epTitle, podTitle, epDesc, playBtn, btn);
    $("#podcast-list").append(div);
  });
}

function showPodcastResults(results) {
  // Empty container element
  $("#site-description").addClass("d-none");
  $("#podcast-list").empty().addClass("d-block");

  results.forEach(function (item) {
    var div = $("<div>").addClass("clearfix border");
    var img = $("<img>")
      .attr("src", item.thumbnail)
      .addClass("float-start me-3");
    var podTitle = $("<p>").text(item.title_original);
    var podDesc = $("<p>").text(item.description_original);
    div.append(img, podTitle, podDesc);
    $("#podcast-list").append(div);
  });
}

$("#book-search-button").on("click", function (event) {
  event.preventDefault();
  var inputTitle = $("#book-search").val().trim();
  var inputAuthor = $("#author-search").val().trim();
  var spinner = $(".spinner-border").attr("style", "display: block");

  var queryObj = {};
  if (inputAuthor !== "") {
    queryObj.author = inputAuthor;
  }

  if (inputTitle !== "") {
    queryObj.title = inputTitle;
  }

  // Example usage of the two APIs.
  searchOpenLibrary(queryObj).then(function (response) {

    $("#site-description").attr("style", "display: none");
    $("#hidden").attr("style", "display: block");
    var bookList = $("#books-list");
    var podcastList = $("#podcast-list");

    if (bookList !== null) {
      bookList.empty();
      podcastList.empty();
    }

    for (var i = 0; i < response.docs.length; i++) {

      // Only shows 10 results
      if (i === 10) {
        spinner.attr("style", "display: none");
        break;
      }

      var responseImg = response.docs[i].cover_i;
      var bookResult = $("<div>").attr("style", "display:flex");
      var textResult = $("<div>").addClass("ps-2 flex-grow-1");
      var searchTitleBtn = $("<button>")
        .text("Search Title")
        .attr("data-title", response.docs[i].title);
      var searchAuthorBtn = $("<button>")
        .text("Search Author")
        .attr("data-author", response.docs[i].author_name);

      searchTitleBtn.addClass(
        "search-title-btn my-4 me-3 btn btn-dark listen-btn"
      );
      searchAuthorBtn.addClass(
        "search-author-btn my-4 me-3 btn btn-dark listen-btn"
      );

      var bookTitle = $("<div>").text(response.docs[i].title);
      var authorText = $("<div>").text(response.docs[i].author_name);
      var coverImage = $("<img>").attr(
        "src",
        "http://covers.openlibrary.org/b/id/" + responseImg + "-M.jpg"
      );
      var bookLink = $("<a>").text(
        "For complete book description, click here."
      );
      bookLink.attr("href", "https://openlibrary.org/" + response.docs[i].key);

      textResult.append(bookTitle, authorText, bookLink);
      var imageHolder = $('<div>').append(coverImage);
      bookResult.append(
        imageHolder,
        textResult,
        searchTitleBtn,
        searchAuthorBtn
      );
      bookList.append(bookResult);
    }

    $(".search-title-btn").on("click", function () {
      var title = $(this).attr("data-title");
      var queryObj = {};
      if (title && title !== "") {
        queryObj.q = title;
        var spinner = $(".spinner-border").attr("style", "display: block");
      }

      listenApiSearch(queryObj).then(function (podResponse) {
        spinner.attr("style", "display: none");
        showPodcastEpisodeResults(podResponse.results);
      });
    });

    $(".search-author-btn").on("click", function () {
      var author = $(this).attr("data-author");
      var queryObj = {};
      if (author && author !== "") {
        queryObj.q = author;
        var spinner = $(".spinner-border").attr("style", "display: block");
      }

      listenApiSearch(queryObj).then(function (podResponse) {
        spinner.attr("style", "display: none");
        showPodcastEpisodeResults(podResponse.results);
      });
    });
  });
});

$('#podcast-search-button').on('click', function (e) {
    e.preventDefault();
    var podcastInput = $('#podcast-search').val().trim();
    var spinner = $(".spinner-border").attr("style", "display: block");

    var queryObj = {};

    if (podcastInput !== '') {
        queryObj.q = podcastInput;
        queryObj.type = 'episode';
    }

    listenApiSearch(queryObj).then(function (response) {
      spinner.attr("style", "display: none");
        $('#hidden').addClass('d-block');
        showPodcastEpisodeResults(response.results);
    });
});

$('[name=search-type]').on('input', function(e) {
    var which = $(this).val();
    if (which === 'book') {
        $('#podcast-search-form').attr('style', 'display: none;');
        $('#book-search-form').attr('style', 'display: block;');
    } else if (which === 'podcast') {
        $('#podcast-search-form').attr('style', 'display: block;');
        $('#book-search-form').attr('style', 'display: none;');
    }
})

$(document).on('click', '.concept', function (e) {
  var spinner = $(".spinner-border").attr("style", "display: block");
  var queryObj = { q: $(this).text() };
  searchOpenLibrary(queryObj).then(function (response) {
    spinner.attr("style", "display: none");

    $("#site-description").attr("style", "display: none");
    $("#hidden").attr("style", "display: block");
    var bookList = $("#books-list");
    var podcastList = $("#podcast-list");

    if (bookList !== null) {
      bookList.empty();
    }

    for (var i = 0; i < response.docs.length; i++) {

      // Only shows 10 results
      if (i === 10) {
        break;
      }

      var responseImg = response.docs[i].cover_i;
      var bookResult = $("<div>").attr("style", "display:flex");
      var textResult = $("<div>").addClass("ps-2 flex-grow-1");
      var searchTitleBtn = $("<button>")
        .text("Search Title")
        .attr("data-title", response.docs[i].title);
      var searchAuthorBtn = $("<button>")
        .text("Search Author")
        .attr("data-author", response.docs[i].author_name);

      searchTitleBtn.addClass(
        "search-title-btn my-4 mr-3 btn btn-dark listen-btn"
      );
      searchAuthorBtn.addClass(
        "search-author-btn my-4 mr-3 btn btn-dark listen-btn"
      );

      var bookTitle = $("<div>").text(response.docs[i].title);
      var authorText = $("<div>").text(response.docs[i].author_name);
      var imageHolder = $('<div>');
      var coverImage = $("<img>").attr(
        "src",
        "http://covers.openlibrary.org/b/id/" + responseImg + "-M.jpg"
      );
      imageHolder.append(coverImage);
      var bookLink = $("<a>").text(
        "For complete book description, click here."
      );
      bookLink.attr("href", "https://openlibrary.org/" + response.docs[i].key);

      textResult.append(bookTitle, authorText, bookLink);
      bookResult.append(
        imageHolder,
        textResult,
        searchTitleBtn,
        searchAuthorBtn
      );
      bookList.append(bookResult);
    }

    $(".search-title-btn").on("click", function () {
      var title = $(this).attr("data-title");
      var queryObj = {};
      if (title && title !== "") {
        queryObj.q = title;
      }

      listenApiSearch(queryObj).then(function (podResponse) {
        showPodcastEpisodeResults(podResponse.results);
      });
    });

    $(".search-author-btn").on("click", function () {
      var author = $(this).attr("data-author");
      var queryObj = {};
      if (author && author !== "") {
        queryObj.q = author;
      }

      listenApiSearch(queryObj).then(function (podResponse) {
        showPodcastEpisodeResults(podResponse.results);
      });
    });
  });
});

$("#podcast-list").on("click", ".play-btn", function () {
  // Gives the audio element the src attribute of the podcast
  $("audio").attr("src", $(this).attr("data-src"));
  // Displays the audio element on the page
  $("audio").attr("style", "display: block");
});
