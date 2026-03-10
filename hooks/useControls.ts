"use client";
/**
 * Captures keyboard input and provides setters for mobile button controls.
 * Returns a stable inputRef so the game loop never re-subscribes.
 */
import { useRef, useEffect, useCallback } from "react";
import type { InputState } from "@/utils/gameTypes";

export function useControls() {
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    pause: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inp.left = true;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = true;
          e.preventDefault();
          break;
        case "ArrowUp":
        case "KeyW":
          inp.up = true;
          e.preventDefault();
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = true;
          e.preventDefault();
          break;
        case "Space":
        case "KeyZ":
        case "ControlLeft":
        case "ControlRight":
          inp.fire = true;
          e.preventDefault();
          break;
        case "KeyP":
        case "Escape":
          inp.pause = true;
          e.preventDefault();
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          inp.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = false;
          break;
        case "ArrowUp":
        case "KeyW":
          inp.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = false;
          break;
        case "Space":
        case "KeyZ":
        case "ControlLeft":
        case "ControlRight":
          inp.fire = false;
          break;
        case "KeyP":
        case "Escape":
          inp.pause = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Mobile button handlers
  const setLeft = useCallback((v: boolean) => { inputRef.current.left = v; }, []);
  const setRight = useCallback((v: boolean) => { inputRef.current.right = v; }, []);
  const setUp = useCallback((v: boolean) => { inputRef.current.up = v; }, []);
  const setDown = useCallback((v: boolean) => { inputRef.current.down = v; }, []);
  const setFire = useCallback((v: boolean) => { inputRef.current.fire = v; }, []);
  const setPause = useCallback((v: boolean) => { inputRef.current.pause = v; }, []);

  return { inputRef, setLeft, setRight, setUp, setDown, setFire, setPause };
}
