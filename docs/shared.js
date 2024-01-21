export const dataManager = {
  fetchData: null
};

export const formatData = data =>
  typeof data === "number" ? data.toFixed(2) : data;


export const getCurrentMemorySize = () => {
  const buttons = document.getElementsByClassName("memorySizeBtn");
  for (const btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return 128;
};

export const getCurrentArchitecture = () => {
  const buttons = document.getElementsByClassName("architectureBtn");
  for (const btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "x86_64";
};

export const getCurrentPackageType = () => {
  const buttons = document.getElementsByClassName("packageTypeBtn");
  for (const btn of buttons) {
    if (btn.classList.contains("bg-success")) {
      return btn.id;
    }
  }
  return "zip";
};

export const setupFilterEvent = (className, dataManager, updateFilterFn) => {
  const btnMemorySize = document.querySelectorAll(className);
  btnMemorySize.forEach(el =>
    el.addEventListener("click", e => updateFilterFn(e, className, dataManager))
  );
};

export const load = async dataManager => {
  const request = await fetch(
    "https://raw.githubusercontent.com/maxday/lambda-perf/main/data/last.json?0.057112075338791035"
  );
  const json = await request.json();
  dataManager.fetchData = json;
};
