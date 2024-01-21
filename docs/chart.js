import {
  dataManager,
  getCurrentMemorySize,
  getCurrentArchitecture,
  getCurrentPackageType,
  setupFilterEvent,
  load
} from "./shared.js";

let chart = null;

const animate = async dataManager => {
  try {
    const memorySize = getCurrentMemorySize();
    const architecture = getCurrentArchitecture();
    const packageType = getCurrentPackageType();
    const selectedMetric = getCurrentMetric();
    if (!dataManager.fetchData) {
      await load(dataManager);
    }
    const data = dataManager.fetchData;
    document.getElementById("lastUpdate").innerHTML = data.metadata.generatedAt;
    const promiseArray = [];
    let i = 0;
    data.runtimeData.sort((a, b) => a.acd - b.acd);
    const filteredData = data.runtimeData.filter(
      r => r.m == memorySize && r.a === architecture && r.p === packageType
    );

    buildChart(filteredData, selectedMetric);

    await Promise.all(promiseArray);
  } catch (e) {
    console.error(e);
  }
};

const getCurrentMetric = () => {
  const buttons = document.getElementsByClassName("metricButton");
  for (const btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "Cold Start";
};

const loaded = async dataManager => {
  setupFilterEvent(".memorySizeBtn", dataManager, updateFilter);
  setupFilterEvent(".architectureBtn", dataManager, updateFilter);
  setupFilterEvent(".packageTypeBtn", dataManager, updateFilter);
  setupFilterEvent(".metricButton", dataManager, updateFilter);

  await animate(dataManager);
};

const buildChart = (filteredData, selectedMetric) => {
  const categories = filteredData.map(data => data.d);

  let seriesData = [];
  if (selectedMetric == "avgDuration") {
    seriesData = filteredData.map(data => data.ad);
  } else if (selectedMetric == "coldStart") {
    seriesData = filteredData.map(data => data.acd);
  } else {
    seriesData = filteredData.map(data => data.mu);
  }

  var options = {
    series: [
      {
        name: selectedMetric,
        data: seriesData
      }
    ],
    chart: {
      height: "600px",
      type: "bar"
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: categories
    }
  };

  if (!chart) {
    chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
  } else {
    chart.updateOptions(options);
  }
};

document.addEventListener(
  "DOMContentLoaded",
  dataManager => loaded(dataManager),
  false
);

export const updateFilter = async (e, className, dataManager) => {
  const newValue = e.target.id;
  const btns = document.querySelectorAll(className);
  btns.forEach(el => el.classList.remove("bg-success"));
  document.getElementById(newValue).classList.add("bg-success");
  await animate(dataManager);
};
