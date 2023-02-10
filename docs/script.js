
const load = async () => {
    const request = await fetch('https://raw.githubusercontent.com/maxday/lambda-perf/main/data/last.json')
    const json = await request.json();
    return json
}

// Have an object that help all the langs to have something comparable and updatable
const worstBench = {
    coldStartDuration: null,
    memoryUsed: null,
    duration: null
}

const updateWorst = runtime => {
    let [coldStartDuration, memoryUsed, duration] = [
        runtime.averageColdStartDuration,
        runtime.averageMemoryUsed,
        runtime.averageDuration
    ];
    worstBench.coldStartDuration = coldStartDuration;
    worstBench.memoryUsed = memoryUsed;
    worstBench.duration = duration;
}

const animate = async () => {
    try {
        const data = await load();
        document.getElementById('lastUpdate').innerHTML = data.metadata.generatedAt;
        const promiseArray = [];
        let i = 0;
        data.runtimeData.sort((a, b) => a.averageColdStartDuration - b.averageColdStartDuration);
        updateWorst(data.runtimeData[data.runtimeData.length - 1]);
        for (runtime of data.runtimeData) {
            promiseArray.push(drawLang(i, runtime));
            ++i;
        }
        await Promise.all(promiseArray);
    } catch (e) {
        console.error(e);
    }

}

const replayAnimation = async () => {
    document.getElementById("runtimes").innerHTML = '';
    await animate();
}

const loaded = async () => {
    document.getElementById('replayAnimationBtn').addEventListener('click', replayAnimation);
    await animate()
};

const drawLang = async (idx, data) => {
    const newElement = document.getElementById("sampleRuntimeElement").cloneNode(true);
    newElement.id = `runtime_${idx}`;
    document.getElementById("runtimes").appendChild(newElement);
    const coldStartElement = newElement.getElementsByClassName('coldstarts')[0];

    // Calculate line width in %
    let [relativeColdStartDur, relativeMemory, relativeDuration] = [
        Math.round(data.averageColdStartDuration / worstBench.coldStartDuration * 100),
        Math.round(data.averageMemoryUsed / worstBench.memoryUsed * 100),
        Math.round(data.averageDuration / worstBench.duration * 100)
    ];

    const averageColdStartDuration = newElement.getElementsByClassName('averageColdStartDuration')[0];
    averageColdStartDuration.innerHTML = `${data.averageColdStartDuration}ms`
    const coldStartLine = newElement.getElementsByClassName('comparison-line')[0];
    if (coldStartLine) { // just a null check to tidy console
        coldStartLine.style.width = `${relativeColdStartDur}%`;
    }

    const averageMemoryUsed = newElement.getElementsByClassName('averageMemoryUsed')[0];
    averageMemoryUsed.innerHTML = `${data.averageMemoryUsed}MB`
    const memoryLine = newElement.getElementsByClassName('comparison-line')[1];
    if (memoryLine) { // just a null check to tidy console
        memoryLine.style.width = `${relativeMemory}%`;
    }

    const averageDuration = newElement.getElementsByClassName('averageDuration')[0];
    averageDuration.innerHTML = `${data.averageDuration}ms`
    const durLine = newElement.getElementsByClassName('comparison-line')[2];
    if (durLine) { // just a null check to tidy console
        durLine.style.width = `${relativeDuration}%`;
    }

    const runtimeName = newElement.getElementsByClassName('runtimeName')[0];
    runtimeName.innerHTML = `${data.runtime.replace('lambda-perf-','').replaceAll('_', ' ')}`

    for(let i = 0; i < data.initDurations.length; ++i) {
        await sleep(data.initDurations[i]);
        addSquare(coldStartElement);
    }
}

const addSquare = (parent) => {
    const span = document.createElement("span");
    span.classList.add("square");
    parent.appendChild(span);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

document.addEventListener('DOMContentLoaded', loaded, false);
