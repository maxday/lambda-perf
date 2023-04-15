const load = async () => {
	const request = await fetch('https://raw.githubusercontent.com/maxday/lambda-perf/main/data/last.json?0.8548008058841368')
	const json = await request.json();
	return json
}
const animate = async () => {
	try {
		const data = await load();
		document.getElementById('lastUpdate').innerHTML = data.metadata.generatedAt;
		const promiseArray = [];
		let i = 0;
		data.runtimeData.sort((a, b) => a.averageColdStartDuration - b.averageColdStartDuration);
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
	
	const averageColdStartDuration = newElement.getElementsByClassName('averageColdStartDuration')[0];
    averageColdStartDuration.innerHTML = `${runtime.averageColdStartDuration}ms`

	const averageMemoryUsed = newElement.getElementsByClassName('averageMemoryUsed')[0];
    averageMemoryUsed.innerHTML = `${runtime.averageMemoryUsed}MB`

	const averageDuration = newElement.getElementsByClassName('averageDuration')[0];
    averageDuration.innerHTML = `${runtime.averageDuration}ms`

	const runtimeName = newElement.getElementsByClassName('runtimeName')[0];
	runtimeName.innerHTML = `${runtime.displayName}`;;

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