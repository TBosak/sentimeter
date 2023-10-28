const Chart = require("chart.js/auto");
const ChartDataLabels = require("chartjs-plugin-datalabels");
const Rx = require("rxjs");
//WHY DOESN'T THIS WORK?!
Chart.register(ChartDataLabels);
const options = {
  tooltips: {
      enabled: false
  },
  plugins: {
      datalabels: {
          formatter: (value, ctx) => {
              let sum = 0;
              let dataArr = ctx.chart.data.datasets[0].data;
              dataArr.map(data => {
                  sum += data;
              });
              let percentage = (value*100 / sum).toFixed(2)+"%";
              return percentage;
          },
          color: '#fff',
      }
  }
};
let positive = 0;
let negative = 0;
let myChart;
const ResultsSubject = new Rx.BehaviorSubject([0, 0]);
const interval$ = Rx.interval(30000);
load();
interval$.subscribe(()=>load());
const ctx = document.getElementById("myChart").getContext("2d");
ResultsSubject.subscribe((scores) => {
  if(myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Positive", "Negative"],
      datasets: [
        {
          label: "Consumption",
          data: [scores[0], scores[1]],
          fill: true,
          backgroundColor: ["#B1D8FF","#FFB1C1"],
          tension: 0.1,
        },
      ],
    },
    options: options,
  });
});

document.getElementById("clear").onclick = clear;

function clear(){
  chrome.storage.local.set({ positive: 0 });
  chrome.storage.local.set({ negative: 0 });
  load();
  window.close();
}

function load() {
  chrome.storage.local.get("positive", function (result) {
    positive = result.positive;

    chrome.storage.local.get("negative", function (result) {
      negative = result.negative;
      console.log("setting results", [positive, negative]);
      ResultsSubject.next([positive, negative]);
    });
  });
}
