const dataManager = {
  fetchData: null,
};

const load = async (dataManager) => {
  const request = await fetch(
    "https://raw.githubusercontent.com/maxday/lambda-perf/main/data/last.json?0.08064017990838535"
  );
  const json = await request.json();
  dataManager.fetchData = json;
};

const animate = async (dataManager) => {
  try {
    const memorySize = getCurrentMemorySize();
    const architecture = getCurrentArchitecture();
    const packageType = getCurrentPackageType();
    if (!dataManager.fetchData) {
      await load(dataManager);
    }
    const data = dataManager.fetchData;
    document.getElementById("lastUpdate").innerHTML = data.metadata.generatedAt;
    const promiseArray = [];
    let i = 0;
    data.runtimeData.sort((a, b) => a.acd - b.acd);
    const filteredData = data.runtimeData.filter(
      (r) => r.m == memorySize && r.a === architecture && r.p === packageType
    );
    for (runtime of filteredData) {
      promiseArray.push(drawLang(i, runtime));
      ++i;
    }
    await Promise.all(promiseArray);
  } catch (e) {
    console.error(e);
  }
};

const updateFilter = async (e, className, dataManager) => {
  const newValue = e.target.id;
  const btns = document.querySelectorAll(className);
  btns.forEach((el) => el.classList.remove("bg-success"));
  document.getElementById(newValue).classList.add("bg-success");
  await replayAnimation(dataManager);
};

const getCurrentMemorySize = () => {
  const buttons = document.getElementsByClassName("memorySizeBtn");
  for (btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return 128;
};

const getCurrentArchitecture = () => {
  const buttons = document.getElementsByClassName("architectureBtn");
  for (btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "x86_64";
};

const getCurrentPackageType = () => {
  const buttons = document.getElementsByClassName("packageTypeBtn");
  for (btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "zip";
};

const replayAnimation = async (dataManager) => {
  document.getElementById("runtimes").innerHTML = "";
  await animate(dataManager);
};

const setupFilterEvent = (className, dataManager) => {
  const btnMemorySize = document.querySelectorAll(className);
  btnMemorySize.forEach((el) =>
    el.addEventListener("click", (e) => updateFilter(e, className, dataManager))
  );
};
const loaded = async (dataManager) => {
  setupFilterEvent(".memorySizeBtn", dataManager);
  setupFilterEvent(".architectureBtn", dataManager);
  setupFilterEvent(".packageTypeBtn", dataManager);
  document
    .getElementById("replayAnimationBtn")
    .addEventListener("click", (dataManager) => replayAnimation(dataManager));
  await animate(dataManager);
};

const drawLang = async (idx, data) => {
  const newElement = document
    .getElementById("sampleRuntimeElement")
    .cloneNode(true);
  newElement.id = `runtime_${idx}`;
  document.getElementById("runtimes").appendChild(newElement);
  const coldStartElement = newElement.getElementsByClassName("coldstarts")[0];

  const averageColdStartDuration = newElement.getElementsByClassName(
    "averageColdStartDuration"
  )[0];
  averageColdStartDuration.innerHTML = `${formatData(data.acd)}ms`;

  const averageMemoryUsed =
    newElement.getElementsByClassName("averageMemoryUsed")[0];
  averageMemoryUsed.innerHTML = `${data.mu}MB`;

  const averageDuration =
    newElement.getElementsByClassName("averageDuration")[0];
  averageDuration.innerHTML = `${formatData(data.ad)}ms`;

  const runtimeName = newElement.getElementsByClassName("runtimeName")[0];
  runtimeName.innerHTML = `${data.d}`;

  for (let i = 0; i < data.i.length; ++i) {
    await sleep(data.i[i]);
    addSquare(coldStartElement);
  }
};

const addSquare = (parent) => {
  const span = document.createElement("span");
  span.classList.add("square");
  parent.appendChild(span);
};

const formatData = (data) =>
  typeof data === "number" ? data.toFixed(2) : data;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.addEventListener(
  "DOMContentLoaded",
  (dataManager) => loaded(dataManager),
  false
);
