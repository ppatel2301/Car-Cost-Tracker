const makeSelect = document.getElementById("make");
const modelSelect = document.getElementById("model");
const yearInput = document.getElementById("year");
const addBtn = document.getElementById("addBtn");
const garageList = document.getElementById("garageList");
const clearBtn = document.getElementById("clearBtn");

const STORAGE_KEY = "car_cost_snapshot_garage";

function loadGarage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveGarage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderGarage() {
  const items = loadGarage();
  garageList.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No cars yet. Add one above.";
    garageList.appendChild(li);
    return;
  }

  items.forEach((car, idx) => {
    const li = document.createElement("li");
    li.className = "item";

    const left = document.createElement("div");
    left.innerHTML = `<strong>${car.make} ${car.model}</strong><div class="muted">${car.year || "Year not set"} • Est. monthly cost: coming soon</div>`;

    const right = document.createElement("button");
    right.textContent = "Remove";
    right.style.background = "#ff4d6d";
    right.onclick = () => {
      const updated = loadGarage().filter((_, i) => i !== idx);
      saveGarage(updated);
      renderGarage();
    };

    li.appendChild(left);
    li.appendChild(right);
    garageList.appendChild(li);
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function loadMakes() {
  makeSelect.innerHTML = `<option value="">Select a make</option>`;
  const url = "https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json";

  const data = await fetchJson(url);
  const makes = (data.Results || [])
    .map(m => m.Make_Name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  for (const make of makes) {
    const opt = document.createElement("option");
    opt.value = make;
    opt.textContent = make;
    makeSelect.appendChild(opt);
  }
}

async function loadModels(make) {
  modelSelect.disabled = true;
  modelSelect.innerHTML = `<option value="">Loading models…</option>`;
  addBtn.disabled = true;

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  const data = await fetchJson(url);

  const models = (data.Results || [])
    .map(x => x.Model_Name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  modelSelect.innerHTML = `<option value="">Select a model</option>`;
  for (const model of models) {
    const opt = document.createElement("option");
    opt.value = model;
    opt.textContent = model;
    modelSelect.appendChild(opt);
  }

  modelSelect.disabled = false;
}

function canAdd() {
  return makeSelect.value && modelSelect.value;
}

makeSelect.addEventListener("change", async () => {
  const make = makeSelect.value;
  modelSelect.innerHTML = `<option value="">Select a make first</option>`;
  modelSelect.disabled = true;
  addBtn.disabled = true;

  if (!make) return;

  try {
    await loadModels(make);
  } catch (e) {
    modelSelect.innerHTML = `<option value="">Failed to load models</option>`;
    console.error(e);
  }
});

modelSelect.addEventListener("change", () => {
  addBtn.disabled = !canAdd();
});

addBtn.addEventListener("click", () => {
  if (!canAdd()) return;

  const car = {
    make: makeSelect.value,
    model: modelSelect.value,
    year: yearInput.value ? String(yearInput.value) : ""
  };

  const items = loadGarage();
  items.unshift(car);
  saveGarage(items);

  yearInput.value = "";
  renderGarage();
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderGarage();
});

(async function init() {
  renderGarage();
  try {
    await loadMakes();
  } catch (e) {
    makeSelect.innerHTML = `<option value="">Failed to load makes</option>`;
    console.error(e);
  }
})();
