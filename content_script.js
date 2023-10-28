const vader = require("vader-sentiment");
const Rx = require("rxjs");
const patterns = [
  /(?:^|\s)(?:[A-Z][a-z]*)(?:\s|$)/g,
  /function\s+[\w$]+\s*\([^)]*\)|\w+\s*=\s*function\s*\([^)]*\)|\w+\s*:\s*function\s*\([^)]*\)/g,
  /\b\w{11,}\b/g,
  /{[^}]*}/g,
  /\([^)]*\)/g,
  /-?\d+(\.\d+)?/g,
  /\W+/g,
  /\b\w{1,2}\b/g,
  /\b[A-Z][a-z]*[a-zA-Z]*\b/g,
];

//initial input and intensity
let input = cleanText(document.body.textContent || document.body.innerText);
let scores = vader.SentimentIntensityAnalyzer.polarity_scores(input);
console.log(scores);
loadThenSave(scores);
const interval$ = Rx.interval(30000);

//reset input and intensity every 5 seconds
interval$.subscribe(() => {
  input = cleanText(document.body.textContent || document.body.innerText);
  scores = vader.SentimentIntensityAnalyzer.polarity_scores(input);
  console.log(scores);
  loadThenSave(scores);
});

function cleanText(text) {
  patterns.forEach((pattern) => {
    text = text.replace(pattern, " ");
  });
  return text;
}

function loadThenSave(scores) {
  chrome.storage.local.get("positive", function (result) {
    positive = result.positive;
    console.log('fetching positive', positive)
    chrome.storage.local.set({ positive: (positive ?? 0) + scores.pos });
  });

  chrome.storage.local.get("negative", function (result) {
    negative = result.negative;
    console.log('fetching negative', negative)
    chrome.storage.local.set({ negative: (negative ?? 0) + scores.neg });
  });
}
