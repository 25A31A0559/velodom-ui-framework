export const Fragment = Symbol("Fragment");

export function h(type, props, ...children) {
  const inputProps = props || {};
  const flatChildren = children.flat(Infinity).filter(
    child => child !== null && child !== undefined && child !== true && child !== false
  );

  return {
    type,
    props: { ...inputProps },
    children: flatChildren,
    key: inputProps.key ?? null,
    dom: null,
    subtree: null
  };
}

function isVNode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}

function normalize(value) {
  if (isVNode(value)) return value;
  return h("#text", { value: String(value ?? "") });
}

function resolve(vnode) {
  if (vnode.type === Fragment) {
    return h("div", { "data-vdom-fragment": "" }, ...vnode.children);
  }

  if (typeof vnode.type === "function") {
    return normalize(vnode.type({
      ...vnode.props,
      children: vnode.children
    }));
  }

  return vnode;
}

function setStyle(element, next, previous = {}) {
  if (typeof next === "string") {
    element.style.cssText = next;
    return;
  }

  for (const name of Object.keys(previous || {})) {
    if (!(name in (next || {}))) {
      element.style[name] = "";
    }
  }

  for (const [name, value] of Object.entries(next || {})) {
    element.style[name] = value == null ? "" : value;
  }
}

function setProp(element, name, value, previous) {
  if (name === "key" || name === "children" || name === "ref") return;

  if (name === "style") {
    setStyle(element, value, previous);
    return;
  }

  if (/^on[A-Z]/.test(name)) {
    const eventName = name.slice(2).toLowerCase();
    const handlers = element.__vdomHandlers || (element.__vdomHandlers = {});

    if (handlers[eventName]) {
      element.removeEventListener(eventName, handlers[eventName]);
      delete handlers[eventName];
    }

    if (typeof value === "function") {
      handlers[eventName] = value;
      element.addEventListener(eventName, value);
    }

    return;
  }

  if (name === "className") name = "class";

  if (name === "htmlFor") name = "for";

  if (name === "value" || name === "checked" || name === "selected") {
    if (value == null) {
      if (name in element) {
        element[name] = name === "value" ? "" : false;
      }
      element.removeAttribute(name);
    } else {
      element[name] = value;
    }
    return;
  }

  if (name === "dangerouslySetInnerHTML") {
    element.innerHTML = value?.__html ?? "";
    return;
  }

  if (value === false || value === null || value === undefined) {
    element.removeAttribute(name);
    return;
  }

  if (value === true) {
    element.setAttribute(name, "");
    return;
  }

  if (name in element && !name.includes("-") && typeof value !== "object") {
    try {
      element[name] = value;
      return;
    } catch {}
  }

  element.setAttribute(name, String(value));
}

function updateProps(element, nextProps = {}, previousProps = {}) {
  for (const name of Object.keys(previousProps)) {
    if (!(name in nextProps)) {
      setProp(element, name, null, previousProps[name]);
    }
  }

  for (const [name, value] of Object.entries(nextProps)) {
    if (value !== previousProps[name]) {
      setProp(element, name, value, previousProps[name]);
    }
  }
}

function sameType(a, b) {
  return a.type === b.type && a.key === b.key;
}

function mount(vnode, parent, before = null) {
  vnode = resolve(normalize(vnode));

  if (vnode.type === "#text") {
    const node = document.createTextNode(vnode.props.value ?? "");
    vnode.dom = node;
    parent.insertBefore(node, before);
    return vnode;
  }

  const element = document.createElement(vnode.type);
  vnode.dom = element;

  updateProps(element, vnode.props);

  if (!("dangerouslySetInnerHTML" in vnode.props)) {
    for (const child of vnode.children) {
      mount(normalize(child), element);
    }
  }

  parent.insertBefore(element, before);
  return vnode;
}

function patchChildren(parent, oldChildren, newChildren) {
  const oldList = oldChildren || [];
  const nextList = newChildren || [];
  const keyed = new Map();

  oldList.forEach((child, index) => {
    if (child?.key != null) {
      keyed.set(child.key, { child, index });
    }
  });

  const used = new Set();
  const patched = [];

  nextList.forEach((rawChild, index) => {
    const child = normalize(rawChild);
    let matchIndex = -1;
    let oldChild = null;

    if (child.key != null && keyed.has(child.key)) {
      const match = keyed.get(child.key);
      matchIndex = match.index;
      oldChild = match.child;
    } else if (child.key == null && oldList[index]?.key == null && !used.has(index)) {
      matchIndex = index;
      oldChild = oldList[index];
    } else if (child.key == null) {
      matchIndex = oldList.findIndex((candidate, candidateIndex) =>
        !used.has(candidateIndex) &&
        candidate?.key == null &&
        sameType(candidate, child)
      );
      oldChild = oldList[matchIndex];
    }

    if (oldChild) {
      used.add(matchIndex);
      patched.push(patch(oldChild, child, parent));
    } else {
      patched.push(mount(child, parent));
    }
  });

  oldList.forEach((child, index) => {
    if (!used.has(index) && child?.dom?.parentNode === parent) {
      parent.removeChild(child.dom);
    }
  });

  let anchor = null;

  for (let index = patched.length - 1; index >= 0; index--) {
    const node = patched[index].dom;

    if (node && node.parentNode === parent) {
      if (node.nextSibling !== anchor) {
        parent.insertBefore(node, anchor);
      }
      anchor = node;
    }
  }

  return patched;
}

function patch(oldVNode, newVNode, parent) {
  oldVNode = oldVNode ? normalize(oldVNode) : null;
  newVNode = normalize(newVNode);

  const oldResolved = oldVNode ? resolve(oldVNode) : null;
  const newResolved = resolve(newVNode);

  if (!oldResolved) {
    return mount(newResolved, parent);
  }

  if (!sameType(oldResolved, newResolved)) {
    const oldDom = oldResolved.dom;
    const next = mount(newResolved, parent, oldDom);
    oldDom?.parentNode?.removeChild(oldDom);
    return next;
  }

  if (newResolved.type === "#text") {
    newResolved.dom = oldResolved.dom;

    const nextValue = newResolved.props.value ?? "";
    if (oldResolved.props.value !== nextValue) {
      newResolved.dom.nodeValue = nextValue;
    }

    return newResolved;
  }

  newResolved.dom = oldResolved.dom;

  updateProps(
    newResolved.dom,
    newResolved.props,
    oldResolved.props
  );

  if (!("dangerouslySetInnerHTML" in newResolved.props)) {
    newResolved.children = patchChildren(
      newResolved.dom,
      oldResolved.children,
      newResolved.children
    );
  }

  return newResolved;
}

export function render(vnode, container) {
  const previous = container.__vdomTree || null;
  const next = normalize(vnode);

  if (previous) {
    container.__vdomTree = patch(previous, next, container);
  } else {
    container.replaceChildren();
    container.__vdomTree = mount(next, container);
  }

  return container.__vdomTree.dom;
}
