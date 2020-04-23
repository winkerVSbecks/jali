
document.getElementById('tile-type')!.onchange = (e) => {
  if ((e.target as HTMLSelectElement).value === 'customTiles') {
    document.getElementById('select-tiles')!.style.display = 'inline-block';
  } else {
    document.getElementById('select-tiles')!.style.display = 'none';
  }
};

document.getElementById('create')!.onclick = () => {
  const countTextbox = document.getElementById('count')! as HTMLInputElement;
  const resolutionTextbox = document.getElementById('resolution')! as HTMLInputElement;
  const strokeTextbox = document.getElementById('stroke')! as HTMLInputElement;
  const tileTypeSelect = document.getElementById('tile-type')! as HTMLSelectElement;
  const frameCheckbox = document.getElementById('frame')! as HTMLInputElement;
  const error = document.getElementById('error')! as HTMLDivElement;
  const errorMsg = document.getElementById('error-msg')! as HTMLSpanElement;

  if (countTextbox.validity.valid &&
    resolutionTextbox.validity.valid &&
    strokeTextbox.validity.valid) {

    const count = parseInt(countTextbox.value, 10);
    const resolution = parseInt(resolutionTextbox.value, 10);
    const stroke = parseInt(strokeTextbox.value, 10);
    const tileType = tileTypeSelect.value;
    const frame = frameCheckbox.checked;

    parent.postMessage({
      pluginMessage: {
        type: 'create-jali',
        count,
        resolution,
        stroke,
        tileType,
        frame,
      }
    }, '*');

    error.style.display = 'none';
    errorMsg.textContent = '';
  } else {
    error.style.display = 'flex';
    errorMsg.textContent = 'error: please enter a valid value';
  }
};

document.getElementById('select-tiles')!.onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'select-tiles' } }, '*');
};

onmessage = (event) => {
  const message = event.data.pluginMessage;

  if (message.type === 'error') {
    const error = document.getElementById('error')! as HTMLDivElement;
    const errorMsg = document.getElementById('error-msg')! as HTMLSpanElement;
    error.style.display = 'flex';
    errorMsg.textContent = message.value;
  }

  if (message.type === 'tiles-selected') {
    document.getElementById('selected-tiles-msg')!.textContent = message.value;
  }
};

