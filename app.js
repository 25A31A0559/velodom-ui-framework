
import { h } from "./vdom.js";
import { createSignal, createRoot } from "./velodom.js";

const [count, setCount, subscribeCount] = createSignal(0);
const [actions, setActions, subscribeActions] = createSignal([]);

const features = [
  {
    icon: "◇",
    title: "Virtual DOM",
    description: "Represent interfaces as lightweight JavaScript objects before updating real browser elements."
  },
  {
    icon: "⚡",
    title: "DOM Diffing",
    description: "Compare previous and next virtual trees to apply targeted changes instead of rebuilding everything."
  },
  {
    icon: "◉",
    title: "Reactive State",
    description: "Update the interface when state changes, using a small subscription-based reactive primitive."
  },
  {
    icon: "⌘",
    title: "Native Web APIs",
    description: "Use standard DOM methods, event listeners, ES modules, and browser scheduling without dependencies."
  },
  {
    icon: "▦",
    title: "Keyed Children",
    description: "Use stable keys to match list entries when their order changes."
  },
  {
    icon: "↗",
    title: "Lightweight Core",
    description: "Keep the runtime small, readable, and easy to inspect while learning how rendering works."
  }
];

function recordAction(label, nextValue) {
  setActions(previous => [
    {
      label,
      value: nextValue,
      time: new Date().toLocaleTimeString()
    },
    ...previous
  ].slice(0, 5));
}

function FeatureCard({ icon, title, description }) {
  return h("article", { className: "card" },
    h("div", { className: "card-icon", "aria-hidden": "true" }, icon),
    h("h3", null, title),
    h("p", null, description)
  );
}

function CounterDemo() {
  return h("div", { className: "demo-layout" },
    h("section", { className: "demo-panel" },
      h("h3", null, "Reactive counter"),
      h("p", { className: "section-heading" },
        "Change the state and watch the interface update."
      ),
      h("div", {
        className: "counter-value",
        "aria-live": "polite"
      }, count()),
      h("div", { className: "counter-controls" },
        h("button", {
          className: "btn",
          onClick: () => {
            const next = count() - 1;
            setCount(next);
            recordAction("Decrement", next);
          }
        }, "− Decrease"),
        h("button", {
          className: "btn btn-primary",
          onClick: () => {
            const next = count() + 1;
            setCount(next);
            recordAction("Increment", next);
          }
        }, "+ Increase"),
        h("button", {
          className: "btn",
          onClick: () => {
            setCount(0);
            recordAction("Reset", 0);
          }
        }, "Reset")
      ),
      h("div", { className: "status" },
        h("span", { className: "status-dot" }),
        "VeloDOM runtime active"
      )
    ),
    h("section", { className: "demo-panel" },
      h("h3", null, "Update history"),
      h("p", { style: { color: "var(--muted)", fontSize: "14px" } },
        "Your five most recent counter actions appear here."
      ),
      h("div", { className: "log" },
        ...(
          actions().length
            ? actions().map((action, index) =>
                h("div", {
                  className: "log-item",
                  key: `${action.time}-${index}`
                },
                  h("span", null, action.label),
                  h("strong", null, `${action.value} · ${action.time}`)
                )
              )
            : [
                h("div", { className: "log-item" },
                  h("span", null, "No actions yet"),
                  h("strong", null, "Ready")
                )
              ]
        )
      )
    )
  );
}

function App() {
  return h("div", null,
    h("div", { className: "container" },
      h("header", { className: "navbar" },
        h("a", {
          className: "brand",
          href: "#home",
          "aria-label": "VeloDOM home"
        },
          h("span", { className: "brand-mark" }, "V"),
          "VeloDOM"
        ),
        h("span", { className: "nav-tag" },
          "CUSTOM UI FRAMEWORK · 0 DEPENDENCIES"
        )
      ),
      h("main", null,
        h("section", { className: "hero", id: "home" },
          h("span", { className: "eyebrow" },
            "Built with standard Web APIs"
          ),
          h("h1", null,
            "Meet your next ",
            h("span", { className: "gradient-text" }, "UI engine."),
          ),
          h("p", null,
            "A from-scratch JavaScript UI framework exploring virtual DOM rendering, efficient updates, and reactive state without third-party libraries."
          ),
          h("div", { className: "actions" },
            h("a", {
              className: "btn btn-primary",
              href: "#demo"
            }, "Try the live demo ↗"),
            h("a", {
              className: "btn",
              href: "#architecture"
            }, "Explore architecture")
          )
        ),
        h("section", { className: "section", id: "features" },
          h("div", { className: "section-heading" },
            h("h2", null, "The engine's building blocks"),
            h("p", null,
              "A small framework designed to make the rendering pipeline understandable."
            )
          ),
          h("div", { className: "grid" },
            ...features.map(feature =>
              h(FeatureCard, {
                key: feature.title,
                ...feature
              })
            )
          )
        ),
        h("section", { className: "section", id: "demo" },
          h("div", { className: "section-heading" },
            h("h2", null, "Interactive playground"),
            h("p", null,
              "Click the buttons to change state and inspect the rendered result."
            )
          ),
          h(CounterDemo, null)
        ),
        h("section", { className: "section", id: "architecture" },
          h("div", { className: "section-heading" },
            h("h2", null, "How rendering works"),
            h("p", null,
              "The framework converts a view into a virtual tree, then synchronizes changes with the browser DOM."
            )
          ),
          h("div", { className: "architecture" },
            h("div", { className: "architecture-step" },
              h("strong", null, "01 · Create"),
              h("span", null, "Build a virtual node tree with h().")
            ),
            h("div", { className: "architecture-step" },
              h("strong", null, "02 · Compare"),
              h("span", null, "Match old and new nodes, properties, and children.")
            ),
            h("div", { className: "architecture-step" },
              h("strong", null, "03 · Commit"),
              h("span", null, "Apply DOM changes through browser APIs.")
            )
          )
        ),
        h("section", { className: "section" },
          h("div", { className: "section-heading" },
            h("h2", null, "A tiny rendering example"),
            h("p", null,
              "The h() function describes the interface as data before rendering it."
            )
          ),
          h("pre", { className: "code-preview" },
            'h("button", { onClick: increment }, "Count: ", count())'
          )
        )
      ),
      h("footer", { className: "footer" },
        "VeloDOM · An educational UI framework built with JavaScript and standard Web APIs."
      )
    )
  );
}

const root = createRoot(document.querySelector("#app"), App);

subscribeCount(root.update);
subscribeActions(root.update);

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.destroy());
}
