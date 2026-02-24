export const CONTROLS_HTML = `<div class="sm-field sm-col">
  <label for="semesterStart" id="labelSemesterStart"></label>
  <input type="date" id="semesterStart" class="save-state sm-input" />
</div>
<div class="sm-field sm-col">
  <label for="semesterEnd" id="labelSemesterEnd"></label>
  <input type="date" id="semesterEnd" class="save-state sm-input" />
</div>
<div class="sm-field sm-col">
  <label id="labelDrivingTimeTo"></label>
  <div class="sm-row">
    <input type="number" id="drivingTimeToHours" class="save-state sm-input sm-time" min="0" />
    <input type="number" id="drivingTimeToMinutes" class="save-state sm-input sm-time" min="0" max="59" />
  </div>
</div>
<div class="sm-field sm-col">
  <label id="labelDrivingTimeFrom"></label>
  <div class="sm-row">
    <input type="number" id="drivingTimeFromHours" class="save-state sm-input sm-time" min="0" />
    <input type="number" id="drivingTimeFromMinutes" class="save-state sm-input sm-time" min="0" max="59" />
  </div>
</div>
<div class="sm-field sm-col">
  <label for="drivingEmoji" id="labelDrivingEmoji"></label>
  <div class="sm-row">
    <input type="text" id="drivingEmoji" class="save-state sm-input sm-emoji" value="🚗" />
    <select id="drivingColorId" class="save-state sm-input sm-color-select">
      <option value="1">Lavender</option>
      <option value="2">Sage</option>
      <option value="3">Grape</option>
      <option value="4">Flamingo</option>
      <option value="5">Banana</option>
      <option value="6">Tangerine</option>
      <option value="7">Peacock</option>
      <option value="8">Graphite</option>
      <option value="9">Blueberry</option>
      <option value="10">Basil</option>
      <option value="11">Tomato</option>
    </select>
  </div>
</div>
<div class="sm-field sm-col">
  <label id="labelRamadanMode" for="ramadanMode">Ramadan Schedule</label>
  <select id="ramadanMode" class="save-state sm-input">
    <option id="ramadanModeOptionOff" value="off">No Ramadan Schedule</option>
    <option id="ramadanModeOptionEngineering" value="engineering">All Colleges (Ramadan 1447)</option>
    <option id="ramadanModeOptionFirstYear" value="firstYear">1st Year</option>
  </select>
</div>`;

export const USERSCRIPT_CSS = `#custom-controls-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

#custom-controls-container .sm-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

#custom-controls-container .sm-col label {
  font-weight: bold;
  margin-bottom: 5px;
}

#custom-controls-container .sm-row {
  display: flex;
  gap: 5px;
  align-items: center;
}

#custom-controls-container .sm-input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#custom-controls-container .sm-time {
  width: 60px;
}

#custom-controls-container .sm-emoji {
  width: 50px;
  text-align: center;
}

#custom-controls-container .sm-color-select {
  min-width: 96px;
  font-size: 11px;
}

.sm-button-wrapper {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.sm-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sm-guide-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  font-family: Arial, sans-serif;
}

.sm-guide-content h2 {
  margin-top: 0;
  color: #333;
}

.sm-guide-content ol {
  line-height: 1.6;
}

.sm-guide-content ol[dir="rtl"] {
  padding-right: 20px;
}

.sm-guide-content ol[dir="ltr"] {
  padding-left: 20px;
}

#guideCloseBtn {
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}`;
