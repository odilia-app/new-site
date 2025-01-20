// adapted from https://decovar.dev/blog/2020/01/05/hugo-search/ with CC BY-SA 4.0

const RESULT_EXCERPT_LENGTH = 30;

  const performSearch = (searchQuery) => {
    const searchResults = document.getElementById("search-results");
    // reset the search results when search query changes
    searchResults.innerHTML = "";

    if (!searchQuery || searchQuery.length < 3) {
      searchResults.style.display = "none";
      return;
    }

    searchResults.style.display = "block";

    fetch("/index.json")
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(contents => {
        const regex = new RegExp(searchQuery, "i");
        const results = contents.filter(post => regex.test(post.title) || regex.test(post.content));

        if (results.length > 0) {
          searchResults.innerHTML = `<div><b>Found: ${results.length} results</b></div>`;

          results.forEach((post, index) => {
            const { excerpt, highlighted } = getExcerpt(post.content, searchQuery);

            const resultHTML = `
        <div id="search-summary-${index}">
            <p class="post-title">
                <a href="${post.permalink}">${post.title}</a>
            </p>
            <p>${highlighted || excerpt}</p>
        </div>
    `;
            searchResults.insertAdjacentHTML("beforeend", resultHTML);
          });

        } else {
          searchResults.innerHTML = "<div><b>Nothing found</b></div>";
        }
      })
      .catch(error => console.error("Error fetching search index:", error));
  };

  const getExcerpt = (content, searchQuery) => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();

    let start = Math.max(lowerContent.indexOf(lowerQuery) - RESULT_EXCERPT_LENGTH, 0);
    let end = Math.min(lowerContent.indexOf(lowerQuery) + searchQuery.length + RESULT_EXCERPT_LENGTH, content.length);

    if (start > 0) {
      start = content.lastIndexOf(" ", start) + 1 || start;
    }

    if (end < content.length) {
      end = content.indexOf(" ", end) || end;
    }

    const excerpt = `${start > 0 ? "..." : ""}${content.slice(start, end)}${end < content.length ? "..." : ""}`;
    return { excerpt, highlighted: excerpt.replace(new RegExp(searchQuery, "ig"), match => `<mark>${match}</mark>`) };
  };