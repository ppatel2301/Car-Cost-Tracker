const makeSelect = document.getElementById("make");
const modelSelect = document.getElementById("model");
const yearInput = document.getElementById("year");
const addBtn = document.getElementById("addBtn");
const garageList = document.getElementById("garageList");
const clearBtn = document.getElementById("clearBtn");

const carSelect = document.getElementById("carSelect");
const insuranceInput = document.getElementById("insurance");
const loanInput = document.getElementById("loan");
const parkingInput = document.getElementById("parking");
const kmsInput = document.getElementById("kms");
const lPer100Input = document.getElementById("lPer100");
const pricePerLInput = document.getElementById("pricePerL");
const maintenanceInput = document.getElementById("maintenance");
const calcBtn = document.getElementById("calcBtn");
const resultBox = document.getElementById("resultBox");

const STORAGE_KEY = "car_cost_snapshot_garage";

const COST_ASSUMPTIONS = {
  insurancePerMonth: 180,
  maintenancePerMonth: 120,
  parkingPerMonth: 80,
  fuelPricePerLiter: 1.70,
  avgKmPerYear: 15000,
  avgKmPerLiter: 12
};

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

function money(n) {
  const x = Number(n) || 0;
  return x.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function toNum(el) {
  const n = Number(el.value);
  return Number.isFinite(n) ? n : 0;
}

function computeMonthlyCost({ insurance, loan, parking, kms, lPer100, pricePerL, maintenance }) {
  const fixed = insurance + loan + parking;

  // litersUsed = (kms / 100) * (L/100km)
  const litersUsed = (kms / 100) * lPer100;
  const fuel = litersUsed * pricePerL;

  const total = fixed + fuel + maintenance;
  return { fixed, fuel, maintenance, total };
}

function populateCarSelect() {
  const items = loadGarage();
  carSelect.innerHTML = `<option value="">Select a car</option>`;

  items.forEach((car, idx) => {
    console.log("Car", car);
    const label = `${car.make} ${car.model} ${car.year ? "(" + car.year + ")" : ""}`;
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = label;
    carSelect.appendChild(opt);
  });

  calcBtn.disabled = items.length === 0 || !carSelect.value;
}

function canCalculate() {
  return carSelect.value !== "";
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
    
    const costText = car.monthlyCost?.total
      ? `Est. monthly cost: ${money(car.monthlyCost.total)}`
      : "Est. monthly cost: not set yet";

    left.innerHTML = `
      <strong>${car.make} ${car.model}</strong>
      <div class="muted">${car.year || "Year not set"} • ${costText}</div>
    `;

    const right = document.createElement("button");
    right.textContent = "Remove";
    right.style.background = "#ff4d6d";
    right.onclick = () => {
      const updated = loadGarage().filter((_, i) => i !== idx);
      saveGarage(updated);
      renderGarage();
      renderChart();
      populateCarSelect();
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
  console.log("Fetching models for make:", make, url);
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
  populateCarSelect();
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderGarage();
  renderChart();
});

carSelect.addEventListener("change", () => {
  calcBtn.disabled = !canCalculate();
});

calcBtn.addEventListener("click", () => {
  if (!canCalculate()) return;

  const idx = Number(carSelect.value);
  const items = loadGarage();
  const car = items[idx];
  if (!car) return;

  const insurance = toNum(insuranceInput);
  const loan = toNum(loanInput);
  const parking = toNum(parkingInput);
  const kms = toNum(kmsInput);
  const lPer100 = toNum(lPer100Input);
  const pricePerL = toNum(pricePerLInput);
  const maintenance = toNum(maintenanceInput);

  const breakdown = computeMonthlyCost({
    insurance, loan, parking, kms, lPer100, pricePerL, maintenance
  });

  car.monthlyCost = {
    ...breakdown,
    updatedAt: new Date().toISOString()
  };

  items[idx] = car;
  saveGarage(items);
  renderGarage();
  renderChart();
  populateCarSelect();

  resultBox.hidden = false;
  resultBox.innerHTML = `
    <strong>Saved for:</strong> ${car.make} ${car.model} ${car.year ? "(" + car.year + ")" : ""}
    <div class="muted">Fixed: ${money(breakdown.fixed)} • Fuel: ${money(breakdown.fuel)} • Maintenance: ${money(breakdown.maintenance)}</div>
    <div style="margin-top:6px;"><strong>Total / month:</strong> ${money(breakdown.total)}</div>
  `;
});

function estimateFuelCostPerMonth() {
  const litersPerYear =
    COST_ASSUMPTIONS.avgKmPerYear / COST_ASSUMPTIONS.avgKmPerLiter;

  const yearlyFuelCost =
    litersPerYear * COST_ASSUMPTIONS.fuelPricePerLiter;

  return Math.round(yearlyFuelCost / 12);
}

function calculateMonthlyTotals() {
  const cars = loadGarage();
  const fuelPerCar = estimateFuelCostPerMonth();

  return {
    insurance: cars.length * COST_ASSUMPTIONS.insurancePerMonth,
    fuel: cars.length * fuelPerCar,
    maintenance: cars.length * COST_ASSUMPTIONS.maintenancePerMonth,
    parking: cars.length * COST_ASSUMPTIONS.parkingPerMonth
  };
}

let costChart;

function renderChart() {
  const ctx = document.getElementById("costChart");
  if (!ctx) return;

  const totals = calculateMonthlyTotals();

  const data = {
    labels: ["Insurance", "Fuel", "Maintenance", "Parking"],
    values: [
      totals.insurance,
      totals.fuel,
      totals.maintenance,
      totals.parking
    ]
  };

  if (costChart) {
    costChart.destroy();
  }

  costChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "Estimated Monthly Cost ($)",
        data: data.values,
        backgroundColor: "#4d7cff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

(async function init() {
  renderGarage();
  renderChart();
  populateCarSelect();
  try {
    await loadMakes();
  } catch (e) {
    makeSelect.innerHTML = `<option value="">Failed to load makes</option>`;
    console.error(e);
  }
})();