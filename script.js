"use strict";

// elct.cpp의 지역별 계통 중요도 가중치입니다. 민감도 분석에서는 수도권 값만 1.05배 증가시킵니다.
const REGION_CONFIG = {
  honam: { label: "호남", smpId: "smpHonam", weight: 1.2 },
  jeju: { label: "제주", smpId: "smpJeju", weight: 1.1 },
  capital: { label: "수도권", smpId: "smpCapital", weight: 1.5 },
  gangwon: { label: "강원", smpId: "smpGangwon", weight: 1.0 },
};

const GCS_BASE_RATE = 50;
const IAS_MAPE_THRESHOLD = 0.1;
const IAS_BONUS_RATE = 20;
const IAS_PENALTY_RATE = 30;

const DEFAULTS = {
  smpHonam: "128.5", smpJeju: "142.8", smpCapital: "135.4", smpGangwon: "124.7",
  resourceId: "DG-SEOUL-001", region: "capital", forecastGeneration: "1000",
  actualGeneration: "960", transmissionFlow: "780", transmissionLimit: "1000",
  substationCapacity: "0.32", frequencyDeviation: "0.08",
};

const form = document.querySelector("#simulationForm");
const resultPanel = document.querySelector(".result-panel");
const sensitivityPanel = document.querySelector("#sensitivityPanel");
let latestInput = null;
let latestResult = null;

function numberValue(id) {
  return Number(document.querySelector(`#${id}`).value);
}

function collectInput() {
  return {
    resourceId: document.querySelector("#resourceId").value.trim(),
    region: document.querySelector("#region").value,
    smp: {
      honam: numberValue("smpHonam"),
      jeju: numberValue("smpJeju"),
      capital: numberValue("smpCapital"),
      gangwon: numberValue("smpGangwon"),
    },
    forecastGeneration: numberValue("forecastGeneration"),
    actualGeneration: numberValue("actualGeneration"),
    transmissionFlow: numberValue("transmissionFlow"),
    transmissionLimit: numberValue("transmissionLimit"),
    substationCapacity: numberValue("substationCapacity"),
    frequencyDeviation: numberValue("frequencyDeviation"),
  };
}

function validateInput(input) {
  const numericValues = [
    ...Object.values(input.smp), input.forecastGeneration, input.actualGeneration,
    input.transmissionFlow, input.transmissionLimit, input.substationCapacity, input.frequencyDeviation,
  ];
  if (!input.resourceId) return "자원 ID를 입력해 주세요.";
  if (numericValues.some((value) => !Number.isFinite(value))) return "모든 숫자 입력값을 확인해 주세요.";
  if (Object.values(input.smp).some((value) => value < 0)) return "SMP 단가는 0 이상이어야 합니다.";
  if (input.forecastGeneration < 0 || input.actualGeneration < 0) return "발전량은 0 이상이어야 합니다.";
  if (input.transmissionFlow < 0 || input.transmissionLimit < 0) return "송전 흐름량과 한계량은 0 이상이어야 합니다.";
  if (input.substationCapacity < 0 || input.substationCapacity > 1) return "변전소 잔여 용량 비율은 0과 1 사이여야 합니다.";
  return "";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 계통 보상 계산 엔진
 * elct.cpp의 계산 순서를 JavaScript로 옮긴 계통 보상 계산 엔진입니다.
 * - 혼잡 지수: 송전 흐름량 / 송전 한계량에 1.5를 곱하고 최대 1로 제한
 * - 인프라 회피 지수: 변전소 잔여 용량 비율에 로그 함수를 적용
 * - 유연성 기여 지수: 주파수 변동폭 절댓값에 5를 곱하고 최대 1로 제한
 * - GCS: 50원/kWh 기본 단가와 세 지수의 평균, 지역 가중치를 반영
 * - IAS: MAPE 10% 이하이면 보너스, 초과하면 패널티 적용
 */
function calculateCompensation(input, capitalMultiplier = 1) {
  const config = REGION_CONFIG[input.region];
  const regionWeight = config.weight * (input.region === "capital" ? capitalMultiplier : 1);
  const baseSmp = input.smp[input.region];
  const congestionIndex = input.transmissionLimit === 0
    ? 0
    : Math.min(1, input.transmissionFlow / input.transmissionLimit * 1.5);
  const avoidanceIndex = input.substationCapacity <= 0.01
    ? 1
    : Math.min(1, Math.log(1 / input.substationCapacity) / Math.log(1 / 0.01));
  const flexibilityIndex = Math.min(1, Math.abs(input.frequencyDeviation) * 5);
  const combinedIndex = (congestionIndex + avoidanceIndex + flexibilityIndex) / 3;
  const gcsPrice = GCS_BASE_RATE * (1 + combinedIndex) * regionWeight;
  const mapeRatio = input.actualGeneration === 0
    ? 1
    : Math.abs(input.forecastGeneration - input.actualGeneration) / input.actualGeneration;
  const iasPrice = mapeRatio <= IAS_MAPE_THRESHOLD
    ? IAS_BONUS_RATE * (1 - mapeRatio / IAS_MAPE_THRESHOLD)
    : -IAS_PENALTY_RATE * ((mapeRatio - IAS_MAPE_THRESHOLD) / (1 - IAS_MAPE_THRESHOLD));
  const finalPrice = Math.max(0, baseSmp + gcsPrice + iasPrice);
  const totalCompensation = finalPrice * input.actualGeneration;

  return {
    baseSmp, congestionIndex, avoidanceIndex, flexibilityIndex,
    gcsPrice, mape: mapeRatio * 100, iasPrice, finalPrice, totalCompensation,
  };
}

function formatNumber(value, digits = 2) {
  return value.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatWon(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function getGrade(result) {
  if (result.finalPrice >= result.baseSmp * 1.25 && result.mape <= 10) {
    return ["A", "계통 영웅", "높은 계통 기여도와 안정적인 예측 정확도를 달성했습니다."];
  }
  if (result.finalPrice >= result.baseSmp * 1.18 && result.mape <= 20) {
    return ["B", "안정 기여자", "계통 안정화에 의미 있는 기여를 제공하고 있습니다."];
  }
  if (result.mape <= 30) {
    return ["C", "일반 발전자", "안정적으로 운영 중이며 추가 개선 여지가 있습니다."];
  }
  return ["D", "예측 개선 필요", "예측 오차를 줄이면 정확도 인센티브를 높일 수 있습니다."];
}

function updateChart(result) {
  const items = [
    ["SMP", result.baseSmp],
    ["GCS", result.gcsPrice],
    ["IAS", result.iasPrice],
    ["최종", result.finalPrice],
  ];
  const max = Math.max(...items.map(([, value]) => value));
  document.querySelector("#barChart").innerHTML = items.map(([label, value]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${value / max * 100}%"></div></div>
      <strong>${formatNumber(value)}</strong>
    </div>
  `).join("");
}

function renderResult(input, result) {
  const metrics = {
    baseSmp: formatNumber(result.baseSmp),
    congestionIndex: formatNumber(result.congestionIndex, 3),
    avoidanceIndex: formatNumber(result.avoidanceIndex, 3),
    flexibilityIndex: formatNumber(result.flexibilityIndex, 3),
    gcsPrice: formatNumber(result.gcsPrice),
    mape: formatNumber(result.mape),
    iasPrice: formatNumber(result.iasPrice),
    finalPrice: formatNumber(result.finalPrice),
  };
  Object.entries(metrics).forEach(([id, value]) => { document.querySelector(`#${id}`).textContent = value; });
  document.querySelector("#totalCompensation").textContent = formatWon(result.totalCompensation);
  document.querySelector("#resourceChip").textContent = input.resourceId;
  const [letter, title, message] = getGrade(result);
  document.querySelector("#gradeLetter").textContent = letter;
  document.querySelector("#gradeTitle").textContent = title;
  document.querySelector("#gradeMessage").textContent = message;
  updateChart(result);
  resultPanel.classList.remove("flash");
  void resultPanel.offsetWidth;
  resultPanel.classList.add("flash");
}

function runSimulation() {
  const input = collectInput();
  const error = validateInput(input);
  document.querySelector("#formError").textContent = error;
  if (error) return null;
  latestInput = input;
  latestResult = calculateCompensation(input);
  renderResult(input, latestResult);
  return latestResult;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSimulation();
});

document.querySelector("#sensitivityButton").addEventListener("click", () => {
  const baseResult = runSimulation();
  if (!baseResult) return;
  const optimizedResult = calculateCompensation(latestInput, 1.05);
  document.querySelector("#beforeGcs").textContent = `${formatNumber(baseResult.gcsPrice)} 원/kWh`;
  document.querySelector("#afterGcs").textContent = `${formatNumber(optimizedResult.gcsPrice)} 원/kWh`;
  document.querySelector("#beforeTotal").textContent = `${formatWon(baseResult.totalCompensation)} 원`;
  document.querySelector("#afterTotal").textContent = `${formatWon(optimizedResult.totalCompensation)} 원`;
  document.querySelector("#gcsDifference").textContent = `변화량 ${formatNumber(optimizedResult.gcsPrice - baseResult.gcsPrice)} 원/kWh`;
  document.querySelector("#totalDifference").textContent = `변화량 ${formatWon(optimizedResult.totalCompensation - baseResult.totalCompensation)} 원`;
  sensitivityPanel.classList.remove("hidden");
  sensitivityPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#resetButton").addEventListener("click", () => {
  Object.entries(DEFAULTS).forEach(([id, value]) => { document.querySelector(`#${id}`).value = value; });
  sensitivityPanel.classList.add("hidden");
  runSimulation();
});

// 첫 방문에서도 예시 결과가 보이도록 기본값으로 한 번 계산합니다.
runSimulation();
