
import { render } from "./vdom.js";

export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function get() {
    return value;
  }

  function set(nextValue) {
    const resolved = typeof nextValue === "function"
      ? nextValue(value)
      : nextValue;

    if (Object.is(value, resolved)) return;

    value = resolved;

    for (const subscriber of [...subscribers]) {
      subscriber(value);
    }
  }

  function subscribe(callback) {
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
    };
  }

  return [get, set, subscribe];
}

export function createRoot(container, view) {
  if (!(container instanceof Element)) {
    throw new TypeError("VeloDOM root requires a valid DOM element.");
  }

  if (typeof view !== "function") {
    throw new TypeError("VeloDOM root requires a view function.");
  }

  let scheduled = false;
  let destroyed = false;

  function update() {
    if (destroyed || scheduled) return;

    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;

      if (!destroyed) {
        render(view(), container);
      }
    });
  }

  function flush() {
    if (destroyed) return;

    scheduled = false;
    render(view(), container);
  }

  function destroy() {
    destroyed = true;
    container.replaceChildren();
    delete container.__vdomTree;
  }

  flush();

  return {
    update,
    flush,
    destroy
  };
}
