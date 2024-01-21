import { dataManager, getCurrentMemorySize, getCurrentArchitecture, getCurrentPackageType, setupFilterEvent, load, formatData } from './shared.js';


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
    for (const runtime of filteredData) {
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


const loaded = async (dataManager) => {
  setupFilterEvent(".memorySizeBtn", dataManager, updateFilter);
  setupFilterEvent(".architectureBtn", dataManager, updateFilter);
  setupFilterEvent(".packageTypeBtn", dataManager, updateFilter);
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


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.addEventListener(
  "DOMContentLoaded",
  (dataManager) => loaded(dataManager),
  false
);


export const replayAnimation = async dataManager => {
  document.getElementById("runtimes").innerHTML = "";
  await animate(dataManager);
};
