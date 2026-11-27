import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATURE_PRESETS,
  getSoundscapeAcousticTelemetry,
} from '../src/utils/cognitiveFocusAudio';

test('Soundscape acoustic telemetry computes accurate BPM and frequency range for every preset', () => {
  const rain = getSoundscapeAcousticTelemetry({
    naturePresetId: 'canopy-rain',
    carrierHz: 210,
    beatHz: 40,
  });
  assert.equal(rain.bpm, 8.4);
  assert.equal(rain.bpmDisplay, '8.4 BPM');
  assert.equal(rain.frequencyRangeDisplay, '190 Hz – 1,830 Hz');
  assert.equal(rain.combinedSpectrumDisplay, '190 Hz – 1,830 Hz');

  const ocean = getSoundscapeAcousticTelemetry({
    naturePresetId: 'ocean-tide',
    carrierHz: 174,
    beatHz: 10,
  });
  assert.equal(ocean.bpm, 5.4);
  assert.equal(ocean.frequencyRangeDisplay, '40 Hz – 510 Hz');

  const pureBinaural = getSoundscapeAcousticTelemetry({
    naturePresetId: 'none',
    carrierHz: 180,
    beatHz: 14,
  });
  assert.equal(pureBinaural.bpm, 0);
  assert.equal(pureBinaural.bpmDisplay, '0 BPM');
  assert.equal(pureBinaural.frequencyRangeDisplay, '180 Hz – 194 Hz');
  assert.equal(pureBinaural.minHz, 180);
  assert.equal(pureBinaural.maxHz, 194);

  for (const preset of NATURE_PRESETS) {
    assert.ok(preset.bpm >= 0);
    assert.ok(preset.maxHz >= preset.minHz);
  }
});
