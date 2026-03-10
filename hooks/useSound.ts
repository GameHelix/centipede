"use client";
/**
 * Synthesises game sounds using the Web Audio API.
 * No external audio files needed.
 */
import { useRef, useCallback } from "react";

type SoundName =
  | "shoot"
  | "mushroomHit"
  | "mushroomDestroy"
  | "centipedeBody"
  | "centipedeHead"
  | "fleaDie"
  | "spiderDie"
  | "scorpionDie"
  | "playerDie"
  | "levelComplete";

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  musicOsc: OscillatorNode | null;
  musicInterval: ReturnType<typeof setInterval> | null;
  musicStep: number;
}

// Simple pentatonic melody for background loop
const MELODY = [220, 261, 294, 330, 392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 294, 261];

export function useSound() {
  const nodesRef = useRef<AudioNodes | null>(null);
  const soundEnabledRef = useRef(true);
  const musicEnabledRef = useRef(false);

  const getCtx = useCallback((): AudioNodes | null => {
    if (nodesRef.current) return nodesRef.current;
    if (typeof window === "undefined") return null;
    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
      const musicGain = ctx.createGain();
      musicGain.gain.value = 0.12;
      musicGain.connect(masterGain);
      nodesRef.current = { ctx, masterGain, musicGain, musicOsc: null, musicInterval: null, musicStep: 0 };
      return nodesRef.current;
    } catch {
      return null;
    }
  }, []);

  const playSound = useCallback((name: string) => {
    const soundName = name as SoundName;
    if (!soundEnabledRef.current) return;
    const nodes = getCtx();
    if (!nodes) return;
    const { ctx, masterGain } = nodes;

    const now = ctx.currentTime;

    const beep = (freq: number, duration: number, type: OscillatorType = "square", vol = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    };

    const sweep = (startF: number, endF: number, duration: number, type: OscillatorType = "sawtooth", vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(endF, now + duration);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    };

    switch (soundName) {
      case "shoot":
        beep(900, 0.06, "square", 0.18);
        sweep(900, 300, 0.06, "square", 0.1);
        break;
      case "mushroomHit":
        beep(200, 0.05, "square", 0.15);
        break;
      case "mushroomDestroy":
        sweep(400, 100, 0.12, "square", 0.2);
        break;
      case "centipedeBody":
        sweep(300, 150, 0.1, "square", 0.2);
        break;
      case "centipedeHead":
        sweep(500, 100, 0.18, "sawtooth", 0.3);
        beep(300, 0.12, "square", 0.15);
        break;
      case "fleaDie":
        sweep(600, 200, 0.15, "square", 0.25);
        beep(400, 0.1, "square", 0.15);
        break;
      case "spiderDie":
        sweep(400, 80, 0.2, "sawtooth", 0.3);
        beep(600, 0.08, "square", 0.2);
        break;
      case "scorpionDie":
        sweep(700, 50, 0.3, "sawtooth", 0.35);
        sweep(500, 100, 0.2, "square", 0.25);
        break;
      case "playerDie": {
        const dur = 0.8;
        sweep(400, 50, dur, "sawtooth", 0.4);
        sweep(300, 30, dur * 0.8, "square", 0.3);
        const noise = ctx.createOscillator();
        const ng = ctx.createGain();
        noise.type = "sawtooth";
        noise.frequency.setValueAtTime(120, now);
        noise.frequency.exponentialRampToValueAtTime(40, now + dur);
        ng.gain.setValueAtTime(0.3, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(ng);
        ng.connect(masterGain);
        noise.start(now);
        noise.stop(now + dur);
        break;
      }
      case "levelComplete": {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const t = now + i * 0.1;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.2);
        });
        break;
      }
    }
  }, [getCtx]);

  const startMusic = useCallback(() => {
    const nodes = getCtx();
    if (!nodes || !musicEnabledRef.current) return;
    if (nodes.musicInterval) return; // already playing

    const { ctx, musicGain } = nodes;

    const playNote = () => {
      nodes.musicStep = (nodes.musicStep + 1) % MELODY.length;
      const freq = MELODY[nodes.musicStep];
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(musicGain);
      osc.start(now);
      osc.stop(now + 0.15);
    };

    nodes.musicInterval = setInterval(playNote, 150);
  }, [getCtx]);

  const stopMusic = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    if (nodes.musicInterval) {
      clearInterval(nodes.musicInterval);
      nodes.musicInterval = null;
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    musicEnabledRef.current = enabled;
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [startMusic, stopMusic]);

  // Resume AudioContext on user gesture (required by browsers)
  const resumeCtx = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes?.ctx.state === "suspended") {
      nodes.ctx.resume();
    }
  }, []);

  return { playSound, setSoundEnabled, setMusicEnabled, startMusic, stopMusic, resumeCtx };
}
