import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __exportCjs = (target, getters, setters) => {
  for (var name in getters)
    __defProp(target, name, {
      get: getters[name],
      set: setters[name],
      enumerable: true,
      configurable: true
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS(function(exports) {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/visit.js
var require_visit = __commonJS(function(exports) {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS(function(exports) {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            val.delete(k);
          else if (v1 !== v0)
            val.set(k, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            delete val[k];
          else if (v1 !== v0)
            val[k] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS(function(exports) {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res) => {
        data.res = res;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS(function(exports) {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS(function(exports) {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const { anchors, doc, maxAliasCount } = ctx;
      const source = this.resolve(doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      let data = anchors.get(source);
      if (!data) {
        toJS.toJS(source, null, ctx);
        data = anchors.get(source);
      }
      if (data?.res === undefined) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc, source, anchors);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
      return data.res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors && source && anchors.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors);
      const vc = getAliasCount(doc, node.value, anchors);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node = new Scalar.Scalar(value);
        if (ref)
          ref.node = node;
        return node;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS(function(exports) {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else {
        v = new Map([[k, v]]);
      }
    }
    return createNode.createNode(v, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS(function(exports) {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS(function(exports) {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j])
              return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0;i < folds.length; ++i) {
      const fold = folds[i];
      const end = folds[i + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS(function(exports) {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
` && valueComment)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/log.js
var require_log = __commonJS(function(exports) {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS(function(exports) {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str = stringify.stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      if (chompKeep && comment)
        chompKeep = false;
      lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS(function(exports) {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map, onError) {
      if (!identity.isMap(map))
        onError("Expected a mapping for this tag");
      return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq, onError) {
      if (!identity.isSeq(seq))
        onError("Expected a sequence for this tag");
      return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS(function(exports) {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS(function(exports) {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS(function(exports) {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
          lines[i] = str.substr(o, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq.YAMLSeq(schema);
    pairs.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS(function(exports) {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_, ctx) {
      if (!ctx)
        return super.toJSON(_);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap = new this;
      omap.items = pairs$1.items;
      return omap;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n = BigInt(str);
      return sign === "-" ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set.items.push(Pair.createPair(value, null, ctx));
        }
      return set;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30)
          d *= 60;
        date -= 60000 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags.includes(tagObj))
        tags.push(tagObj);
      return tags;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS(function(exports) {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS(function(exports) {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/errors.js
var require_errors = __commonJS(function(exports) {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `…
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS(function(exports) {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS(function(exports) {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS(function(exports) {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS(function(exports) {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS(function(exports) {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS(function(exports) {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS(function(exports) {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd)
      cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1)
        ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end = start + header.length;
      if (scalar.source)
        end += scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return foldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function foldLines(source) {
    let first, line;
    try {
      first = new RegExp(`(.*?)(?<![ 	])[ 	]*\r?
`, "sy");
      line = new RegExp(`[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?
`, "sy");
    } catch {
      first = /(.*?)[ \t]*\r?\n/sy;
      line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
    }
    let match = first.exec(source);
    if (!match)
      return source;
    let res = match[1];
    let sep = " ";
    let pos = first.lastIndex;
    line.lastIndex = pos;
    while (match = line.exec(source)) {
      if (match[1] === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + match[1];
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "",
    _: " ",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS(function(exports) {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS(function(exports) {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS(function(exports) {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        for (let i = 0;i < this.errors.length; ++i)
          doc.errors.push(this.errors[i]);
        for (let i = 0;i < this.warnings.length; ++i)
          doc.warnings.push(this.warnings[i]);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS(function(exports) {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf(`
`);
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf(`
`);
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS(function(exports) {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS(function(exports) {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS(function(exports) {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS(function(exports) {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return "block-start";
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i = this.pos;ch = this.buffer[i]; ++i) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i = nl - 1;
          let ch = this.buffer[i];
          if (ch === "\r")
            ch = this.buffer[--i];
          const lastChar = i;
          while (ch === " ")
            ch = this.buffer[--i];
          if (ch === `
` && i >= this.pos && i + 1 + indent > lastChar)
            nl = i;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      let n = 0;
      loop:
        while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
      return n;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS(function(exports) {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS(function(exports) {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
    if (source.length < 1e5)
      Array.prototype.push.apply(target, source);
    else
      for (let i = 0;i < source.length; ++i)
        target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              arrayPushArray(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            arrayPushArray(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS(function(exports) {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// src/core/router.ts
import { posix } from "node:path";
function detectHost(explicitHost) {
  if (explicitHost) {
    const norm = explicitHost.toLowerCase().trim();
    if (norm.includes("claude"))
      return "claude-code";
    if (norm.includes("antigravity") || norm.includes("gemini"))
      return "antigravity";
    if (norm.includes("codex"))
      return "codex";
    if (norm.includes("chatgpt"))
      return "chatgpt";
    if (norm.includes("cursor"))
      return "cursor";
    if (norm.includes("windsurf"))
      return "windsurf";
    if (norm.includes("cline") || norm.includes("roo"))
      return "cline";
    if (norm.includes("copilot"))
      return "copilot";
    if (norm.includes("opencode"))
      return "opencode";
    return "universal";
  }
  if (process.env.ANTIGRAVITY || process.env.GEMINI_CLI)
    return "antigravity";
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_SHELL)
    return "claude-code";
  if (process.env.CODEX_THREAD_ID || process.env.CODEX)
    return "codex";
  if (process.env.CURSOR_AGENT)
    return "cursor";
  return "universal";
}
function classifyIntent(prompt) {
  const p = prompt.toLowerCase();
  const targetHosts = [];
  const hostText = p.match(/(?:\bfrom\b|من).+?(?:\bto\b|إلى|الى)\s+(.+)/)?.[1] ?? p;
  if (hostText.includes("claude"))
    targetHosts.push("claude-code");
  if (hostText.includes("antigravity") || hostText.includes("gemini"))
    targetHosts.push("antigravity");
  if (hostText.includes("cursor"))
    targetHosts.push("cursor");
  if (hostText.includes("codex"))
    targetHosts.push("codex");
  if (hostText.includes("chatgpt"))
    targetHosts.push("chatgpt");
  if (hostText.includes("opencode"))
    targetHosts.push("opencode");
  if (hostText.includes("windsurf"))
    targetHosts.push("windsurf");
  if (hostText.includes("cline") || /\broo\b/.test(hostText))
    targetHosts.push("cline");
  if (hostText.includes("copilot"))
    targetHosts.push("copilot");
  if (targetHosts.length === 0)
    targetHosts.push("universal");
  const STOPWORDS = new Set(["for", "to", "a", "an", "the", "of", "in", "on", "with", "from", "by", "new", "this"]);
  let skillName;
  const explicitMatch = prompt.match(/(?:named|called)\s+["'`]?([a-zA-Z0-9_-]+)["'`]?/i);
  if (explicitMatch && !STOPWORDS.has(explicitMatch[1].toLowerCase())) {
    skillName = explicitMatch[1];
  } else {
    const genericMatch = prompt.match(/(?:skill|package|repo)\s+(?:for\s+)?["'`]?([a-zA-Z0-9_-]+)["'`]?/i);
    if (genericMatch && !STOPWORDS.has(genericMatch[1].toLowerCase())) {
      skillName = genericMatch[1];
    }
  }
  const editingSkill = /\b(create|build|design|author|port|adapt|improve|fix|repair)\b.*\bskill\b/.test(p);
  const inspection = /\b(audit|review|scan|check|inspect)\b|فحص|تدقيق/.test(p);
  const securityTopic = /\bsecurity\b|أمان|امان/.test(p);
  if (!editingSkill && inspection && (securityTopic || !/poteto|principle|مبادئ|مبدأ/.test(p))) {
    return { intent: "VALIDATE", confidence: 0.88, targetHosts, skillName };
  }
  if (p.includes("distribute") || p.includes("publish") || /\b(craft|prepare|create)\s+(a\s+)?(github\s+)?repo(sitory)?\b/.test(p) || p.includes("skills.sh") || p.includes("marketplace") || p.includes("انشر") || p.includes("مستودع") || p.includes("توزيع")) {
    return { intent: "DISTRIBUTE", confidence: 0.95, targetHosts, skillName };
  }
  if (p.includes("package") || p.includes(".skill") || p.includes("bundle") || p.includes("حزمة") || p.includes("تجميع")) {
    return { intent: "PACKAGE", confidence: 0.9, targetHosts, skillName };
  }
  if (/\bport\b/.test(p) || p.includes("adapt") || p.includes("convert to") || p.includes("convert to cursor") || p.includes("convert to claude") || p.includes("convert to codex") || p.includes("تحويل") || p.includes("حول") || p.includes("حوّل") || p.includes("نقل") || p.includes("انقل") || p.includes("تكييف")) {
    return { intent: "PORT", confidence: 0.92, targetHosts, skillName };
  }
  if (p.includes("optimize description") || p.includes("trigger better") || p.includes("doesn't trigger") || p.includes("overtrigger") || p.includes("undertrigger") || p.includes("تحسين التفعيل") || p.includes("لا يعمل التفعيل")) {
    return { intent: "OPTIMIZE", confidence: 0.9, targetHosts, skillName };
  }
  if (p.includes("eval") || p.includes("bineval") || p.includes("test skill") || p.includes("assertion") || p.includes("اختبار") || p.includes("تقييم")) {
    return { intent: "EVAL", confidence: 0.9, targetHosts, skillName };
  }
  if (p.includes("measure") || p.includes("benchmark") || p.includes("latency") || p.includes("throughput") || p.includes("hypothesis") || p.includes("explain the number") || p.includes("قياس") || p.includes("احسب") || p.includes("سرعة")) {
    return { intent: "MEASURE", confidence: 0.93, targetHosts, skillName };
  }
  if (p.includes("integrate") || p.includes("migrate") || p.includes("deprecate") || p.includes("delete legacy") || p.includes("adopt") || p.includes("no-restricted-imports") || p.includes("دمج") || p.includes("ترحيل") || p.includes("تبني")) {
    return { intent: "INTEGRATE", confidence: 0.92, targetHosts, skillName };
  }
  if (p.includes("poteto") || p.includes("principle") || p.includes("anti-slop") || p.includes("first principle") || p.includes("subtract before you add") || p.includes("boundary discipline") || p.includes("مبادئ") || p.includes("مبدأ")) {
    return { intent: "PRINCIPLES", confidence: 0.94, targetHosts, skillName };
  }
  if (p.includes("author skill") || p.includes("authoring") || p.includes("skill-authoring") || p.includes("تأليف مهارة") || p.includes("كتابة مهارة")) {
    return { intent: "AUTHOR", confidence: 0.92, targetHosts, skillName };
  }
  if (!editingSkill && (p.includes("validate") || p.includes("audit") || p.includes("lint") || p.includes("check structure") || p.includes("frontmatter check") || p.includes("فحص") || p.includes("تحقق") || p.includes("تدقيق"))) {
    return { intent: "VALIDATE", confidence: 0.88, targetHosts, skillName };
  }
  if (p.includes("improve") || p.includes("fix") || p.includes("repair") || p.includes("refactor") || p.includes("update skill") || p.includes("صلح") || p.includes("عدل") || p.includes("طور")) {
    return { intent: "IMPROVE", confidence: 0.85, targetHosts, skillName };
  }
  return { intent: "CREATE", confidence: 0.8, targetHosts, skillName };
}
function buildExecutionPlan(intent, skillName = "target-skill", targetHosts = ["universal"]) {
  switch (intent) {
    case "MEASURE":
      return [
        {
          id: "step-1-hypothesis",
          skill: "measure-dont-guess",
          mode: "MEASURE",
          purpose: "Formulate falsifiable hypothesis, define numeric thresholds, and prepare measurement probe",
          requiredReferences: ["references/benchmark-patterns.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-execute-benchmark",
          skill: "host-workspace-operator",
          mode: "MEASURE",
          purpose: "Execute benchmark under production-equivalent conditions and record raw numbers",
          dependsOn: ["step-1-hypothesis"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: "bun test",
          freedomLevel: "low"
        },
        {
          id: "step-3-explain-bound",
          skill: "poteto-principles",
          mode: "MEASURE",
          purpose: "Analyze bounding resource per explain-the-number and verify measured improvement",
          dependsOn: ["step-2-execute-benchmark"],
          requiredReferences: ["references/explain-the-number.md"],
          freedomLevel: "medium"
        }
      ];
    case "INTEGRATE":
      return [
        {
          id: "step-1-check-existing",
          skill: "dont-it-yourself",
          mode: "INTEGRATE",
          purpose: "Audit existing runtime primitives and repository dependencies before introducing new tool",
          requiredReferences: ["references/canonical-libraries.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-adopt-and-migrate",
          skill: "integrate",
          mode: "INTEGRATE",
          purpose: "Install canonical package, standardize single usage pattern, and migrate all call sites in one wave",
          dependsOn: ["step-1-check-existing"],
          requiredReferences: ["references/mechanical-enforcement.md"],
          freedomLevel: "medium"
        },
        {
          id: "step-3-structural-lockout",
          skill: "poteto-principles",
          mode: "INTEGRATE",
          purpose: "Lock out legacy calls via mechanical linters/types and delete obsolete code per subtract-before-you-add",
          dependsOn: ["step-2-adopt-and-migrate"],
          requiredReferences: ["references/encode-lessons-in-structure.md", "references/subtract-before-you-add.md"],
          freedomLevel: "low"
        },
        {
          id: "step-4-verify-integrity",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Verify zero regression across all test suites",
          dependsOn: ["step-3-structural-lockout"],
          requiredReferences: ["references/bineval-method.md"],
          recommendedCommand: "bun test",
          freedomLevel: "low"
        }
      ];
    case "PRINCIPLES":
      return [
        {
          id: "step-1-poteto-audit",
          skill: "poteto-principles",
          mode: "PRINCIPLES",
          purpose: "Audit architecture, boundaries, state, and types against 24 battle-tested engineering principles",
          requiredReferences: ["references/boundary-discipline.md", "references/type-system-discipline.md"],
          freedomLevel: "medium"
        },
        {
          id: "step-2-writing-anti-slop",
          skill: "writing",
          mode: "PRINCIPLES",
          purpose: "Enforce direct payload invariant, purpose-before-means, and zero developer notes in user surfaces",
          dependsOn: ["step-1-poteto-audit"],
          requiredReferences: ["references/purpose-before-means.md", "references/no-perishable-information.md"],
          freedomLevel: "low"
        },
        {
          id: "step-3-validate-compliance",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run static verification to confirm all 7 gates are green",
          dependsOn: ["step-2-writing-anti-slop"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        }
      ];
    case "AUTHOR":
      return [
        {
          id: "step-1-authoring-standard",
          skill: "skill-authoring",
          mode: "AUTHOR",
          purpose: "Define Why Needed & Target State, invariant rules, and tripartite directory layout",
          requiredReferences: ["references/agentskills-spec.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-architect-gates",
          skill: "skill-architect",
          mode: "CREATE",
          purpose: "Formulate trigger boundaries, positive/negative prompts, and freedom levels",
          dependsOn: ["step-1-authoring-standard"],
          requiredReferences: ["references/skill-spec.md"],
          freedomLevel: "medium"
        },
        {
          id: "step-3-scaffold",
          skill: "host-workspace-operator",
          mode: "CREATE",
          purpose: "Scaffold tripartite package (SKILL.md, usecases/, references/, evals/)",
          dependsOn: ["step-2-architect-gates"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill init ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-4-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run 7-pass static validator and verify 0 errors",
          dependsOn: ["step-3-scaffold"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        }
      ];
    case "CREATE":
      return [
        {
          id: "step-1-architect",
          skill: "skill-architect",
          mode: "CREATE",
          purpose: "Design SkillSpec, capture user intent, define freedom calibration, and isolate failure baseline",
          requiredReferences: ["references/skill-spec.md", "references/sop-practices.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-scaffold",
          skill: "host-workspace-operator",
          mode: "CREATE",
          purpose: "Scaffold directory structure, SKILL.md, references/, and deterministic scripts",
          dependsOn: ["step-1-architect"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill init ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-3-evals",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Generate trigger eval bank, BinEval assertions, and held-out 70/30 test splits",
          dependsOn: ["step-2-scaffold"],
          requiredReferences: ["references/bineval-method.md", "references/quality-questions.md"],
          freedomLevel: "medium"
        },
        {
          id: "step-4-validate-score",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run structural validation (eval_skill.py) and achieve 10/10 clean score",
          dependsOn: ["step-3-evals"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          recoveryStep: "step-1-architect",
          freedomLevel: "low"
        }
      ];
    case "DISTRIBUTE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Verify skill adheres to Skill Conductor canon and passes eval_skill.py with 10/10",
          requiredReferences: ["references/sop-practices.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-scaffold-distribution",
          skill: "repo-craft-and-distribute",
          mode: "DISTRIBUTE",
          purpose: "Generate package.json, marketplace.json, .skills.json, install.sh, and GitHub Actions CI",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/multi-agent-manifests.md", "references/readme-standards.md"],
          recommendedCommand: `bun skills/repo-craft-and-distribute/scripts/scaffold-repo.ts ./${skillName} --name "${skillName}"`,
          freedomLevel: "low"
        },
        {
          id: "step-3-publish-github",
          skill: "repo-craft-and-distribute",
          mode: "DISTRIBUTE",
          purpose: "Initialize git, create public repository via gh CLI, tag discovery topics, and verify Mermaid rendering",
          dependsOn: ["step-2-scaffold-distribution"],
          requiredReferences: ["references/github-workflow-and-metadata.md", "references/distribution-channels.md"],
          freedomLevel: "medium"
        }
      ];
    case "PORT":
      return [
        {
          id: "step-1-inspect",
          skill: "host-workspace-operator",
          mode: "VALIDATE",
          purpose: "Inspect source SKILL.md, references, and dependencies",
          requiredReferences: ["references/host-profiles.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-compile-adapter",
          skill: "skill-portability-compiler",
          mode: "PORT",
          purpose: `Compile native manifests and directives for targets: ${targetHosts.join(", ")}`,
          dependsOn: ["step-1-inspect"],
          requiredReferences: ["references/cross-host-evaluation.md"],
          recommendedCommand: `omni-skill port ${skillName} --target ${targetHosts[0] || "claude"}`,
          freedomLevel: "low"
        },
        {
          id: "step-3-verify-port",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Verify ported artifacts against host capability contracts and emit gap report",
          dependsOn: ["step-2-compile-adapter"],
          requiredReferences: ["references/bineval-method.md"],
          freedomLevel: "low"
        }
      ];
    case "OPTIMIZE":
      return [
        {
          id: "step-1-eval-baseline",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run trigger bank against current description to compute baseline trigger/collision scores",
          requiredReferences: ["references/bineval-method.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-optimize-loop",
          skill: "skill-conductor",
          mode: "OPTIMIZE",
          purpose: "Run train/test split optimization loop with canonical description formula and negative triggers",
          dependsOn: ["step-1-eval-baseline"],
          requiredReferences: ["references/sop-practices.md"],
          recommendedCommand: `uv run scripts/run_loop.py ${skillName}`,
          freedomLevel: "low"
        }
      ];
    case "IMPROVE":
      return [
        {
          id: "step-1-diagnose",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Isolate failure symptoms, undertriggering, and missing invariants against failure baseline",
          requiredReferences: ["references/pressure-testing.md", "references/sop-practices.md"],
          freedomLevel: "low"
        },
        {
          id: "step-2-apply-edits",
          skill: "host-workspace-operator",
          mode: "IMPROVE",
          purpose: "Apply minimal surgical edits to SKILL.md and references without bloating context",
          dependsOn: ["step-1-diagnose"],
          requiredReferences: ["references/patterns.md"],
          freedomLevel: "low"
        },
        {
          id: "step-3-revalidate",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run BinEval assertions to verify regression-free improvement",
          dependsOn: ["step-2-apply-edits"],
          requiredReferences: ["references/bineval-method.md"],
          recommendedCommand: `omni-skill eval ${skillName}`,
          recoveryStep: "step-1-diagnose",
          freedomLevel: "low"
        }
      ];
    case "EVAL":
    case "VALIDATE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Run 10-point structural validation and security audit",
          requiredReferences: ["references/schemas.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-eval-assertions",
          skill: "skill-evaluator",
          mode: "EVAL",
          purpose: "Run BinEval assertions and trigger collision testing",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/bineval-method.md"],
          recommendedCommand: `omni-skill eval ${skillName}`,
          freedomLevel: "low"
        }
      ];
    case "PACKAGE":
      return [
        {
          id: "step-1-validate",
          skill: "skill-conductor",
          mode: "VALIDATE",
          purpose: "Pre-packaging quality validation",
          requiredReferences: ["references/schemas.md"],
          recommendedCommand: `omni-skill validate ${skillName}`,
          freedomLevel: "low"
        },
        {
          id: "step-2-bundle",
          skill: "skill-conductor",
          mode: "PACKAGE",
          purpose: "Package verified skill into standalone .skill archive and host plugins",
          dependsOn: ["step-1-validate"],
          requiredReferences: ["references/runtime-setup.md"],
          recommendedCommand: `omni-skill package ${skillName}`,
          freedomLevel: "low"
        }
      ];
    default:
      return [
        {
          id: "step-1-orchestrate",
          skill: "omni-skill",
          mode: "CREATE",
          purpose: "Default lifecycle orchestration",
          requiredReferences: ["references/skill-spec.md"],
          freedomLevel: "medium"
        }
      ];
  }
}
function buildExecutionDag(intent, skillName = "target-skill", targetHosts = ["universal"]) {
  const sharedReferences = new Set([
    "skill-architect",
    "skill-evaluator",
    "skill-portability-compiler",
    "host-workspace-operator"
  ]);
  return buildExecutionPlan(intent, skillName, targetHosts).map((step) => ({
    ...step,
    requiredReferences: step.requiredReferences.map((ref) => sharedReferences.has(step.skill) ? `../omni-skill/${ref}` : ref)
  }));
}
function routeRequest(prompt, explicitHost, state = {}) {
  for (const value of [state.failureStreak, state.mutationGeneration, state.verifiedGeneration]) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
      throw new RangeError("Routing generations and failure streak must be non-negative safe integers");
    }
  }
  const host = detectHost(explicitHost);
  let { intent, confidence, targetHosts, skillName } = classifyIntent(prompt);
  let override = "";
  if (state.unresolvedSecurity) {
    intent = "VALIDATE";
    override = "Unresolved security requires inspection before execution.";
  } else if ((state.failureStreak ?? 0) >= 2) {
    intent = "IMPROVE";
    override = "Repeated failure requires a new hypothesis before retrying.";
  } else if ((intent === "PACKAGE" || intent === "DISTRIBUTE") && state.mutationGeneration !== undefined && state.verifiedGeneration !== state.mutationGeneration) {
    intent = "VALIDATE";
    override = "Missing or stale verification blocks release after mutation.";
  }
  const actualSkillName = skillName || "skill-artifact";
  const dag = buildExecutionDag(intent, actualSkillName, targetHosts);
  const allRefs = new Set;
  dag.forEach((step) => step.requiredReferences.forEach((ref) => allRefs.add(posix.normalize(`skills/${step.skill}/${ref}`))));
  return {
    intent,
    confidence,
    detectedHost: host,
    targetHosts,
    skillName: actualSkillName,
    dag,
    contextBudget: {
      maxTokens: 2500,
      recommendedFiles: Array.from(allRefs)
    },
    explanation: `Classified as '${intent}' (${Math.round(confidence * 100)}% confidence). Generated a ${dag.length}-step execution DAG targeting [${targetHosts.join(", ")}] on host '${host}'.${override ? " " + override : ""}`
  };
}
// ../../node_modules/.bun/yaml@2.9.0/node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors.YAMLError;
var $YAMLParseError = errors.YAMLParseError;
var $YAMLWarning = errors.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// src/core/parser.ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

class FrontmatterTypeError extends Error {
  code = "FRONTMATTER_TYPE";
  constructor(message) {
    super(message);
    this.name = "FrontmatterTypeError";
  }
}
function validateFrontmatterTypes(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new FrontmatterTypeError("YAML frontmatter must be a key-value mapping");
  }
  const record = data;
  if (!("name" in record) || record.name === undefined || record.name === null) {
    throw new FrontmatterTypeError("Frontmatter field 'name' is required");
  }
  if (typeof record.name !== "string") {
    const receivedType = Array.isArray(record.name) ? "array" : typeof record.name;
    throw new FrontmatterTypeError(`Frontmatter field 'name' must be a string, received ${receivedType}`);
  }
  if (!("description" in record) || record.description === undefined || record.description === null) {
    throw new FrontmatterTypeError("Frontmatter field 'description' is required");
  }
  if (typeof record.description !== "string") {
    const receivedType = Array.isArray(record.description) ? "array" : typeof record.description;
    throw new FrontmatterTypeError(`Frontmatter field 'description' must be a string, received ${receivedType}`);
  }
  if ("version" in record && typeof record.version !== "string") {
    const receivedType = record.version === null ? "null" : typeof record.version;
    throw new FrontmatterTypeError(`Frontmatter field 'version' must be a string, received ${receivedType}`);
  }
  if ("author" in record && typeof record.author !== "string") {
    const receivedType = record.author === null ? "null" : typeof record.author;
    throw new FrontmatterTypeError(`Frontmatter field 'author' must be a string, received ${receivedType}`);
  }
}
function parseSkillMarkdown(content) {
  let normalized = content;
  if (normalized.charCodeAt(0) === 65279) {
    normalized = normalized.slice(1);
  }
  if (!normalized.startsWith(`---
`) && !normalized.startsWith(`---\r
`)) {
    throw new Error("Missing YAML frontmatter delimiters at the start of SKILL.md");
  }
  const openOffset = normalized.startsWith(`---\r
`) ? 5 : 4;
  const rest = normalized.slice(openOffset);
  const closingMatch = rest.match(/(?:^|\r?\n)---(?:\r?\n|$)/);
  if (!closingMatch || closingMatch.index === undefined) {
    throw new Error("Unclosed YAML frontmatter block in SKILL.md");
  }
  const rawYamlEnd = openOffset + closingMatch.index;
  const rawYaml = normalized.slice(openOffset, rawYamlEnd);
  const bodyStart = openOffset + closingMatch.index + closingMatch[0].length;
  const body = normalized.slice(bodyStart).trim();
  let parsed;
  try {
    parsed = $parse(rawYaml);
  } catch (err) {
    throw new Error(`YAML syntax error in frontmatter: ${err.message}`);
  }
  validateFrontmatterTypes(parsed);
  const frontmatter = parsed;
  return { frontmatter, body };
}
function loadSkillDirectory(skillDir) {
  const skillFile = join(skillDir, "SKILL.md");
  if (!existsSync(skillFile)) {
    throw new Error(`SKILL.md not found in directory: ${skillDir}`);
  }
  const content = readFileSync(skillFile, "utf-8");
  const { frontmatter } = parseSkillMarkdown(content);
  const lineCount = content.split(`
`).length;
  return {
    name: frontmatter.name,
    frontmatter,
    content,
    lineCount,
    hasReferences: existsSync(join(skillDir, "references")),
    hasScripts: existsSync(join(skillDir, "scripts")),
    hasEvals: existsSync(join(skillDir, "evals"))
  };
}

// src/core/validator.ts
import { accessSync, constants, existsSync as existsSync2, lstatSync, readFileSync as readFileSync2, readdirSync } from "node:fs";
import { join as join2, resolve } from "node:path";

// src/core/path-sanitizer.ts
import { relative } from "node:path";
var PERSONAL_PATH_REGEX = /(?:\/(?:Users|home)\/(?!(?:<[^>]+>|username|user))[a-zA-Z0-9_.-]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)/g;
function sanitizeDiagnosticPath(baseDir, targetPath) {
  if (!targetPath || targetPath.trim().length === 0) {
    return ".";
  }
  try {
    const rel = relative(baseDir, targetPath);
    if (!rel.startsWith("..") && !rel.startsWith("/")) {
      return rel || ".";
    }
  } catch {}
  return targetPath.replace(PERSONAL_PATH_REGEX, "<user>");
}
function sanitizeFsError(err) {
  if (!err)
    return "READ_ERROR";
  if (typeof err === "object") {
    const code = err.code;
    if (typeof code === "string" && code.trim().length > 0) {
      return code.trim();
    }
  }
  return "READ_ERROR";
}

// src/core/validator.ts
var NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var SECRET_REGEX = /(sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*=|OPENAI_API_KEY\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY)/;
var PERSONAL_PATH_REGEX2 = /(?:\/(?:Users|home)\/(?!(?:<[^>]+>|username|user))[a-zA-Z0-9_.-]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)/;
var SLOP_DEV_NOTES_REGEX = /^\s*(TODO:|FIXME:|NOTE:\s*In production|Mock data displayed|Agent notice:)/im;
var SLOP_CEREMONIAL_PREAMBLE_REGEX = /^\s*(The following (?:table|section|list) (?:outlines|details|describes)|As an AI language model)/im;
function validateSkillDirectory(skillDir, targets = ["agent-skills", "chatgpt", "codex", "claude-code"]) {
  const findings = [];
  try {
    const stat = lstatSync(skillDir);
    if (stat.isSymbolicLink()) {
      return {
        skill: skillDir,
        targets,
        errors: 1,
        warnings: 0,
        findings: [{
          severity: "error",
          code: "READ_FAILURE",
          message: `Cannot safely scan symbolic link root: "${sanitizeDiagnosticPath(skillDir, skillDir)}"`
        }],
        pass: false
      };
    }
    if (!stat.isDirectory()) {
      return {
        skill: skillDir,
        targets,
        errors: 1,
        warnings: 0,
        findings: [{
          severity: "error",
          code: "INVALID_ROOT",
          message: `Root path does not exist or is not a directory: "${sanitizeDiagnosticPath(process.cwd(), skillDir)}"`
        }],
        pass: false
      };
    }
    try {
      accessSync(skillDir, constants.R_OK);
    } catch (accessErr) {
      return {
        skill: skillDir,
        targets,
        errors: 1,
        warnings: 0,
        findings: [{
          severity: "error",
          code: "READ_FAILURE",
          message: `Cannot access skill root (${sanitizeFsError(accessErr)}): "${sanitizeDiagnosticPath(process.cwd(), skillDir)}"`
        }],
        pass: false
      };
    }
  } catch (err) {
    const isAccess = err?.code === "EACCES" || err?.code === "EPERM";
    return {
      skill: skillDir,
      targets,
      errors: 1,
      warnings: 0,
      findings: [{
        severity: "error",
        code: isAccess ? "READ_FAILURE" : "INVALID_ROOT",
        message: isAccess ? `Cannot access skill root (${sanitizeFsError(err)}): "${sanitizeDiagnosticPath(process.cwd(), skillDir)}"` : `Root path does not exist or is not a directory: "${sanitizeDiagnosticPath(process.cwd(), skillDir)}"`
      }],
      pass: false
    };
  }
  const skillFile = join2(skillDir, "SKILL.md");
  if (!existsSync2(skillFile)) {
    return {
      skill: skillDir,
      targets,
      errors: 1,
      warnings: 0,
      findings: [{ severity: "error", code: "MISSING_SKILL_MD", message: "SKILL.md does not exist." }],
      pass: false
    };
  }
  let content;
  try {
    content = readFileSync2(skillFile, "utf-8");
  } catch (err) {
    return {
      skill: skillDir,
      targets,
      errors: 1,
      warnings: 0,
      findings: [{
        severity: "error",
        code: "READ_FAILURE",
        message: `Cannot read SKILL.md: ${sanitizeFsError(err)}`
      }],
      pass: false
    };
  }
  const lines = content.split(`
`);
  try {
    const { frontmatter } = parseSkillMarkdown(content);
    if (!frontmatter.name || !NAME_REGEX.test(frontmatter.name)) {
      findings.push({
        severity: "error",
        code: "INVALID_NAME",
        message: `Name "${frontmatter.name}" is invalid. Must be lowercase kebab-case.`
      });
    }
    if (frontmatter.description.trim().length === 0) {
      findings.push({
        severity: "error",
        code: "EMPTY_DESCRIPTION",
        message: "Frontmatter description cannot be empty."
      });
    }
  } catch (err) {
    const errorObj = err;
    const code = errorObj?.code || (errorObj?.name === "FrontmatterTypeError" ? "FRONTMATTER_TYPE" : "YAML_PARSE_ERROR");
    findings.push({
      severity: "error",
      code,
      message: errorObj?.message || "Failed to parse frontmatter"
    });
  }
  const lowerContent = content.toLowerCase();
  const hasWhySection = lowerContent.includes("why this skill is needed") || content.includes("必要な理由");
  const hasTargetState = lowerContent.includes("target state") || content.includes("達成したい状態");
  if (!hasWhySection) {
    findings.push({
      severity: "warning",
      code: "MISSING_WHY_SECTION",
      message: "SKILL.md is missing 'Why This Skill Is Needed' rationale section."
    });
  }
  if (!hasTargetState) {
    findings.push({
      severity: "warning",
      code: "MISSING_TARGET_STATE",
      message: "SKILL.md is missing 'Target State' outcome section."
    });
  }
  const linkRegex = /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#)([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const rawTarget = linkMatch[2]?.split("#")[0]?.trim();
    if (rawTarget && rawTarget.length > 0) {
      const resolvedPath = resolve(skillDir, rawTarget);
      if (!existsSync2(resolvedPath)) {
        findings.push({
          severity: "error",
          code: "BROKEN_RELATIVE_LINK",
          message: `Referenced file does not exist: "${sanitizeDiagnosticPath(skillDir, rawTarget)}"`
        });
      }
    }
  }
  if (lines.length > 500) {
    findings.push({
      severity: "warning",
      code: "BODY_LARGE",
      message: `SKILL.md has ${lines.length} lines. Best practice is <500 lines.`
    });
  }
  if (SLOP_DEV_NOTES_REGEX.test(content)) {
    findings.push({
      severity: "warning",
      code: "ANTI_SLOP_DEV_NOTES",
      message: "Found internal developer notes (TODO/FIXME/Mock notes) in user-facing skill instructions."
    });
  }
  if (SLOP_CEREMONIAL_PREAMBLE_REGEX.test(content)) {
    findings.push({
      severity: "warning",
      code: "ANTI_SLOP_PREAMBLE",
      message: "Found ceremonial narrative preamble ('The following table outlines...'). Violates Direct Payload Invariant."
    });
  }
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch (err) {
      const relDir = sanitizeDiagnosticPath(skillDir, dir);
      findings.push({
        severity: "error",
        code: "READ_FAILURE",
        message: `Cannot scan directory "${relDir}": ${sanitizeFsError(err)}`
      });
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "__pycache__" || entry === "node_modules" || entry.startsWith("test_") || entry.endsWith(".test.ts") || entry.endsWith(".test.py"))
        continue;
      const fullPath = join2(dir, entry);
      const relPath = sanitizeDiagnosticPath(skillDir, fullPath);
      try {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          findings.push({
            severity: "error",
            code: "READ_FAILURE",
            message: `Cannot safely scan symbolic link: "${relPath}"`
          });
        } else if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile() && !entry.endsWith(".pyc") && !entry.endsWith(".png") && !entry.endsWith(".jpg")) {
          let text;
          try {
            text = readFileSync2(fullPath, "utf-8");
          } catch (readErr) {
            findings.push({
              severity: "error",
              code: "READ_FAILURE",
              message: `Cannot scan "${relPath}": ${sanitizeFsError(readErr)}`
            });
            continue;
          }
          if (SECRET_REGEX.test(text)) {
            findings.push({
              severity: "error",
              code: "SECRET_LEAK",
              message: `Possible secret/token leak detected in ${relPath}`
            });
          }
          if (PERSONAL_PATH_REGEX2.test(text)) {
            findings.push({
              severity: "warning",
              code: "PERSONAL_PATH",
              message: `Personal absolute path detected in ${relPath}`
            });
          }
        }
      } catch (err) {
        findings.push({
          severity: "error",
          code: "READ_FAILURE",
          message: `Cannot scan "${relPath}": ${sanitizeFsError(err)}`
        });
      }
    }
  }
  walk(skillDir);
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  return {
    skill: skillDir,
    targets,
    errors,
    warnings,
    findings,
    pass: errors === 0
  };
}
// src/core/compiler.ts
import { existsSync as existsSync3, lstatSync as lstatSync2, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join as join3, relative as relative2, resolve as resolve2 } from "node:path";
var NAME_REGEX2 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var REF_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function compileOmniSkillSpec(spec, outputDir) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    throw new TypeError("Skill specification must be an object.");
  }
  const name = spec.name;
  if (!name || typeof name !== "string") {
    throw new TypeError(`Skill name must be a non-empty string. Received: ${typeof name}`);
  }
  if (!NAME_REGEX2.test(name)) {
    throw new Error(`Invalid skill name "${name}". Skill name must be lowercase kebab-case alphanumeric (e.g. "my-skill").`);
  }
  const resolvedOutput = resolve2(outputDir);
  const targetDir = resolve2(resolvedOutput, name);
  const rel = relative2(resolvedOutput, targetDir);
  if (rel.startsWith("..") || isAbsolute(rel) || rel === "") {
    throw new Error(`Path containment violation: Skill name "${name}" escapes output directory "${outputDir}".`);
  }
  if (spec.description === undefined || spec.description === null || typeof spec.description !== "string" || spec.description.trim().length === 0) {
    throw new (typeof spec.description !== "string" ? TypeError : Error)("Field 'description' must be a non-empty string.");
  }
  if (spec.job === undefined || spec.job === null || typeof spec.job !== "string" || spec.job.trim().length === 0) {
    throw new (typeof spec.job !== "string" ? TypeError : Error)("Field 'job' must be a non-empty string.");
  }
  if (!Array.isArray(spec.instructions) || spec.instructions.length === 0) {
    throw new ((Array.isArray(spec.instructions)) ? Error : TypeError)("Field 'instructions' must be a non-empty array of non-empty strings.");
  }
  for (let i = 0;i < spec.instructions.length; i++) {
    const step = spec.instructions[i];
    if (typeof step !== "string" || step.trim().length === 0) {
      throw new (typeof step !== "string" ? TypeError : Error)(`Field 'instructions[${i}]' must be a non-empty string.`);
    }
  }
  if (spec.target_hosts !== undefined && spec.target_hosts !== null) {
    if (!Array.isArray(spec.target_hosts)) {
      throw new TypeError("Field 'target_hosts' must be an array of non-empty strings.");
    }
    for (let i = 0;i < spec.target_hosts.length; i++) {
      const host = spec.target_hosts[i];
      if (typeof host !== "string" || host.trim().length === 0) {
        throw new (typeof host !== "string" ? TypeError : Error)(`Field 'target_hosts[${i}]' must be a non-empty string.`);
      }
    }
  }
  if (spec.freedom_level !== undefined && spec.freedom_level !== null) {
    if (typeof spec.freedom_level !== "string" || !["high", "medium", "low"].includes(spec.freedom_level)) {
      throw new (typeof spec.freedom_level !== "string" ? TypeError : Error)(`Field 'freedom_level' must be one of 'high', 'medium', 'low'. Received: ${spec.freedom_level}`);
    }
  }
  const refDir = join3(targetDir, "references");
  let validatedReferences = [];
  if (spec.references !== undefined && spec.references !== null) {
    if (typeof spec.references !== "object" || Array.isArray(spec.references) || spec.references instanceof Map || spec.references instanceof Set || Object.prototype.toString.call(spec.references) !== "[object Object]") {
      throw new TypeError("Field 'references' must be a key-value object mapping reference names to markdown content.");
    }
    if (existsSync3(refDir) && lstatSync2(refDir).isSymbolicLink()) {
      throw new Error('Path containment violation: "references" directory is a symbolic link.');
    }
    const rawEntries = Object.entries(spec.references);
    for (const [refKey, refVal] of rawEntries) {
      if (typeof refVal !== "string") {
        throw new TypeError(`Field 'references["${refKey}"]' must be a string.`);
      }
    }
    const entries = rawEntries.map(([k, v]) => [String(k), v]);
    const seenRefKeys = new Set;
    for (const [refName, refContent] of entries) {
      if (!REF_NAME_REGEX.test(refName)) {
        throw new Error(`Invalid reference name "${refName}". Reference keys must be lowercase kebab-case alphanumeric without file extensions.`);
      }
      const canonicalRefKey = refName.toLowerCase();
      if (seenRefKeys.has(canonicalRefKey)) {
        throw new Error(`Duplicate reference name detected: "${refName}".`);
      }
      seenRefKeys.add(canonicalRefKey);
      const targetRefFile = resolve2(refDir, `${refName}.md`);
      const refRel = relative2(refDir, targetRefFile);
      if (refRel.startsWith("..") || isAbsolute(refRel) || refRel !== `${refName}.md`) {
        throw new Error(`Path containment violation: Reference "${refName}" escapes references/ directory.`);
      }
      const targetPathUnresolved = join3(refDir, `${refName}.md`);
      if (existsSync3(targetPathUnresolved) && lstatSync2(targetPathUnresolved).isSymbolicLink()) {
        throw new Error(`Path containment violation: Target reference "${refName}.md" is a symbolic link.`);
      }
    }
    validatedReferences = entries;
  }
  if (spec.evals !== undefined && spec.evals !== null) {
    if (!Array.isArray(spec.evals)) {
      throw new TypeError("Field 'evals' must be an array of evaluation items.");
    }
    for (let i = 0;i < spec.evals.length; i++) {
      const item = spec.evals[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new TypeError(`Field 'evals[${i}]' must be an object.`);
      }
      if (typeof item.id !== "string" || item.id.trim().length === 0) {
        throw new (typeof item.id !== "string" ? TypeError : Error)(`Field 'evals[${i}].id' must be a non-empty string.`);
      }
      if (item.description !== undefined && item.description !== null && typeof item.description !== "string") {
        throw new TypeError(`Field 'evals[${i}].description' must be a string.`);
      }
      if (item.assertions === undefined || item.assertions === null || !Array.isArray(item.assertions) || item.assertions.length === 0) {
        throw new ((Array.isArray(item.assertions)) ? Error : TypeError)(`Field 'evals[${i}].assertions' must be a non-empty array of assertion objects.`);
      }
      for (let j = 0;j < item.assertions.length; j++) {
        const assertion = item.assertions[j];
        if (!assertion || typeof assertion !== "object" || Array.isArray(assertion)) {
          throw new TypeError(`Field 'evals[${i}].assertions[${j}]' must be an object.`);
        }
        if (typeof assertion.pattern !== "string" || assertion.pattern.trim().length === 0) {
          throw new (typeof assertion.pattern !== "string" ? TypeError : Error)(`Field 'evals[${i}].assertions[${j}].pattern' must be a non-empty string.`);
        }
        if (assertion.required !== undefined && assertion.required !== null && typeof assertion.required !== "boolean") {
          throw new TypeError(`Field 'evals[${i}].assertions[${j}].required' must be a boolean.`);
        }
      }
    }
  }
  mkdirSync(targetDir, { recursive: true });
  const frontmatterYaml = $stringify({
    name: spec.name,
    description: spec.description.trim()
  }).trim();
  const skillMdLines = [
    "---",
    frontmatterYaml,
    "---",
    "",
    `# ${spec.name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
    "",
    `> ${spec.job}`,
    "",
    "## Invariant Guidelines",
    ""
  ];
  for (const step of spec.instructions) {
    skillMdLines.push(`- ${step}`);
  }
  skillMdLines.push("", "## Host & Portability Contract", "", `- Target Hosts: ${(spec.target_hosts && spec.target_hosts.length > 0 ? spec.target_hosts : ["agent-skills", "chatgpt", "codex", "claude-code"]).join(", ")}`, `- Freedom Level: ${spec.freedom_level || "medium"}`, "");
  writeFileSync(join3(targetDir, "SKILL.md"), skillMdLines.join(`
`), "utf-8");
  if (validatedReferences.length > 0) {
    mkdirSync(refDir, { recursive: true });
    for (const [refName, refContent] of validatedReferences) {
      writeFileSync(join3(refDir, `${refName}.md`), refContent, "utf-8");
    }
  }
  if (spec.evals && spec.evals.length > 0) {
    const evalDir = join3(targetDir, "evals");
    mkdirSync(evalDir, { recursive: true });
    writeFileSync(join3(evalDir, "evals.json"), JSON.stringify({ evals: spec.evals }, null, 2), "utf-8");
  }
  return targetDir;
}
// src/core/adapters/index.ts
import { writeFileSync as writeFileSync2, mkdirSync as mkdirSync2 } from "node:fs";
import { join as join4 } from "node:path";
function generateAdapter(manifest, target, outputDir) {
  const t = target.toLowerCase();
  const pluginVersion = manifest.frontmatter.version || "1.0.0";
  mkdirSync2(outputDir, { recursive: true });
  const filesGenerated = [];
  const notes = [];
  switch (t) {
    case "chatgpt":
    case "codex": {
      const pluginDir = join4(outputDir, ".codex-plugin");
      mkdirSync2(pluginDir, { recursive: true });
      const manifestPath = join4(pluginDir, "plugin.json");
      const data = {
        name: manifest.name,
        version: pluginVersion,
        description: manifest.frontmatter.description,
        skills: "./skills/",
        interface: {
          displayName: manifest.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          shortDescription: manifest.frontmatter.description.slice(0, 80),
          category: "Developer Tools"
        }
      };
      writeFileSync2(manifestPath, JSON.stringify(data, null, 2), "utf-8");
      filesGenerated.push(manifestPath);
      notes.push("Generated .codex-plugin/plugin.json for OpenAI ChatGPT & Codex Plugins");
      break;
    }
    case "claude":
    case "claude-code": {
      const claudeDir = join4(outputDir, ".claude-plugin");
      mkdirSync2(claudeDir, { recursive: true });
      const pluginJson = join4(claudeDir, "plugin.json");
      const marketJson = join4(claudeDir, "marketplace.json");
      writeFileSync2(pluginJson, JSON.stringify({
        name: manifest.name,
        version: pluginVersion,
        description: manifest.frontmatter.description,
        license: "MIT"
      }, null, 2), "utf-8");
      writeFileSync2(marketJson, JSON.stringify({
        name: manifest.name,
        version: pluginVersion,
        skills: "./skills/"
      }, null, 2), "utf-8");
      filesGenerated.push(pluginJson, marketJson);
      notes.push("Generated Claude Code plugin & marketplace descriptors");
      break;
    }
    case "antigravity":
    case "gemini": {
      const geminiDir = join4(outputDir, ".gemini");
      mkdirSync2(geminiDir, { recursive: true });
      const pluginDesc = join4(geminiDir, "plugin.json");
      writeFileSync2(pluginDesc, JSON.stringify({
        name: manifest.name,
        version: pluginVersion,
        type: "antigravity-skill-plugin",
        entry: manifest.name
      }, null, 2), "utf-8");
      filesGenerated.push(pluginDesc);
      notes.push("Generated Google Antigravity & Gemini CLI plugin configuration");
      break;
    }
    case "cursor": {
      const cursorRulesPath = join4(outputDir, ".cursorrules");
      const ruleContent = `# Cursor Rules for ${manifest.name}
${manifest.frontmatter.description}

## Invariant Guidelines
${manifest.content}
`;
      writeFileSync2(cursorRulesPath, ruleContent, "utf-8");
      filesGenerated.push(cursorRulesPath);
      notes.push("Generated .cursorrules for Cursor IDE integration");
      break;
    }
    case "windsurf": {
      const windsurfPath = join4(outputDir, ".windsurfrules");
      writeFileSync2(windsurfPath, `# Windsurf Rules for ${manifest.name}
${manifest.frontmatter.description}

${manifest.content}`, "utf-8");
      filesGenerated.push(windsurfPath);
      notes.push("Generated .windsurfrules for Codeium Windsurf IDE");
      break;
    }
    case "cline":
    case "roo": {
      const clineRulesPath = join4(outputDir, ".clinerules");
      writeFileSync2(clineRulesPath, `# Cline / Roo Code Rules for ${manifest.name}
${manifest.frontmatter.description}

${manifest.content}`, "utf-8");
      filesGenerated.push(clineRulesPath);
      notes.push("Generated .clinerules for Cline & Roo Code agents");
      break;
    }
    case "copilot": {
      const ghDir = join4(outputDir, ".github");
      mkdirSync2(ghDir, { recursive: true });
      const copilotPath = join4(ghDir, "copilot-instructions.md");
      writeFileSync2(copilotPath, `# GitHub Copilot Instructions for ${manifest.name}
${manifest.frontmatter.description}

${manifest.content}`, "utf-8");
      filesGenerated.push(copilotPath);
      notes.push("Generated .github/copilot-instructions.md for GitHub Copilot Workspace");
      break;
    }
    case "opencode": {
      const opencodeDir = join4(outputDir, ".opencode");
      mkdirSync2(opencodeDir, { recursive: true });
      const confPath = join4(opencodeDir, "skill.json");
      writeFileSync2(confPath, JSON.stringify({
        name: manifest.name,
        description: manifest.frontmatter.description,
        engine: "omni-skill-v6"
      }, null, 2), "utf-8");
      filesGenerated.push(confPath);
      notes.push("Generated OpenCode / DeepSeek Harness adapter configuration");
      break;
    }
    default: {
      const agentsDir = join4(outputDir, ".agents", "plugins");
      mkdirSync2(agentsDir, { recursive: true });
      const marketPath = join4(agentsDir, "marketplace.json");
      writeFileSync2(marketPath, JSON.stringify({
        name: manifest.name,
        interface: { displayName: manifest.name }
      }, null, 2), "utf-8");
      filesGenerated.push(marketPath);
      notes.push("Generated generic Agent Skills marketplace descriptor");
      break;
    }
  }
  return { target: t, filesGenerated, notes };
}
// src/core/security.ts
import { existsSync as existsSync4, lstatSync as lstatSync3, readdirSync as readdirSync2, readFileSync as readFileSync3 } from "node:fs";
import { basename, join as join5, relative as relative3 } from "node:path";

// src/core/security-types.ts
var PatternCategory;
((PatternCategory) => {
  PatternCategory["PROMPT_INJECTION"] = "Prompt Injection";
  PatternCategory["DATA_EXFILTRATION"] = "Data Exfiltration";
  PatternCategory["PRIVILEGE_ESCALATION"] = "Privilege Escalation";
  PatternCategory["SUPPLY_CHAIN"] = "Supply Chain";
  PatternCategory["EXCESSIVE_AGENCY"] = "Excessive Agency";
  PatternCategory["OUTPUT_HANDLING"] = "Output Handling";
  PatternCategory["SYSTEM_PROMPT_LEAKAGE"] = "System Prompt Leakage";
  PatternCategory["MEMORY_POISONING"] = "Memory Poisoning";
  PatternCategory["TOOL_MISUSE"] = "Tool Misuse";
  PatternCategory["ROGUE_AGENT"] = "Rogue Agent";
  PatternCategory["TRIGGER_ABUSE"] = "Trigger Abuse";
  PatternCategory["MCP_LEAST_PRIVILEGE"] = "MCP Least Privilege";
  PatternCategory["MCP_TOOL_POISONING"] = "MCP Tool Poisoning";
  PatternCategory["AGENT_SNOOPING"] = "Agent Snooping";
  PatternCategory["ANTI_REFUSAL"] = "Anti-Refusal";
  PatternCategory["SERVER_SIDE_REQUEST_FORGERY"] = "Server-Side Request Forgery";
  PatternCategory["DESERIALIZATION"] = "Insecure Deserialization";
  PatternCategory["BEHAVIORAL_AST"] = "Behavioral AST";
})(PatternCategory ||= {});

// src/core/security-metadata.ts
var DEFAULT_EXPLANATIONS = {
  P1: "Instruction override pattern detected. Overrides system instructions or safety rules.",
  P2: "Concealed or invisible instructions detected in comments, base64 blobs, or zero-width text.",
  P3: "Instructions commanding transmission of session context or user data to external hosts.",
  P4: "Subtle bias or steering detected that alters agent decision-making outside stated scope.",
  P5: "Directly harmful or destructive content detected.",
  P9: "Oversized whitespace padding detected, typically used to hide instructions off-screen.",
  P6: "Direct extraction pattern attempting to reveal confidential system prompts or directives.",
  P7: "Indirect extraction attempting to infer system prompts via summary, rephrase, or translation.",
  P8: "Exfiltration of system prompts via tool calls (logging, writing, or network request).",
  E1: "External data transmission to remote URL or unvetted network sink.",
  E2: "Mass environment variable harvesting or searching for secret keys.",
  E3: "Filesystem enumeration scanning for SSH keys, credentials, or private user files.",
  E4: "Instructions that leak conversation history or user prompts to external services.",
  E5: "Unverified cloud storage exfiltration (S3/GCS/Azure blob upload).",
  PE1: "Skill requests excessive permissions (e.g. wildcard '*' or unnecessary full access).",
  PE2: "Command invokes sudo, su, doas, pkexec, or setuid elevation.",
  PE3: "Direct access to credential files and privileged operating-system records.",
  SC1: "Dependencies lack version pinning, allowing potential malicious package updates.",
  SC2: "Remote script downloading and execution (e.g. curl | bash, wget | python).",
  SC3: "Obfuscated code payload (base64/hex decode with execution).",
  SC7: "Disabled container trust or insecure registry configuration.",
  SC8: "Shipped precompiled Python bytecode (__pycache__, .pyc, .pyo) in skill package.",
  SC9: "Concealed executable artifact disguised as a document or data file.",
  SC10: "Dependency source redirection away from canonical package indexes.",
  EA1: "Unrestricted tool access without least-privilege boundary.",
  EA2: "Autonomous execution of high-impact or destructive operations without user confirmation.",
  EA3: "Skill behavior extends significantly beyond its stated purpose (scope creep).",
  EA4: "Unbounded resource access (infinite loops, unbounded batch downloads).",
  EA5: "Undisclosed external model or provider override altering billing or trust boundary.",
  OH1: "Unvalidated model output injected into shell, SQL, or execution contexts.",
  OH2: "Output flowing across trust contexts without validation.",
  OH3: "Unbounded output generation allowing resource exhaustion or context stuffing.",
  MP1: "Persistent context injection attempting to permanently modify agent state across sessions.",
  MP2: "Context stuffing that attempts to evict privileged instructions or safety rules.",
  MP3: "Unauthorized manipulation of agent memory or personality state.",
  TM1: "Destructive or dangerous tool parameter abuse (rm -rf, mkfs, fork bombs).",
  TM2: "Tool chaining abuse attempting to bypass single-tool permission restrictions.",
  TM3: "Insecure tool defaults (disabled TLS verification or world-writable file modes).",
  TM4: "Privileged Kubernetes workload specifications (hostPath, privileged containers).",
  RA1: "Self-modifying skill code or runtime editing of SKILL.md.",
  RA2: "Unauthorized session persistence mechanisms (cron jobs, launch agents, shell profile hooks).",
  TR1: "Overly broad trigger phrases that intercept unintended user requests.",
  TR2: "Trigger shadows common built-in commands or system operations.",
  TR3: "Generic keyword baiting designed to maximize activation frequency.",
  AS1: "Agent config directory snooping (.claude/, .codex/, .gemini/ access).",
  AS2: "MCP configuration file snooping (mcp.json access).",
  AS3: "Cross-skill enumeration or reading other installed skills' instructions.",
  AR1: "Instructions requiring unconditional agreement with unsafe user requests.",
  AR2: "Instructions suppressing disclaimers or necessary safety notices.",
  AR3: "Instructions nullifying the agent's safety restrictions or policies.",
  SSRF1: "Access to cloud instance metadata IMDS endpoints (169.254.169.254, metadata.google.internal).",
  SSRF2: "Network requests targeting private IP ranges, loopback, or link-local hosts.",
  SSRF3: "Dynamic request target where host URL is constructed from untrusted variables.",
  DS1: "Insecure PHP object injection via unserialize().",
  DS2: "Insecure Ruby Marshal deserialization on untrusted data.",
  DS3: "Unsafe Ruby YAML.load or Psych.load without safe loader.",
  DS4: "Insecure JavaScript deserialization (node-serialize / funcster).",
  AST1: "Direct exec() call enables arbitrary code execution.",
  AST2: "Direct eval() call evaluates untrusted expressions.",
  AST3: "Dynamic __import__() loading unvalidated modules at runtime.",
  AST4: "Subprocess execution with shell=True or unquoted command strings.",
  AST5: "os.system() or os.popen() shell execution sink.",
  AST6: "Dynamic compile() with string source.",
  AST7: "Dynamic getattr() with non-literal attribute name bypassing static checks.",
  AST8: "Dangerous execution chain combining dynamic decoding with execution.",
  AST9: "Reflective execution sink via getattr(os, 'system') or __builtins__['exec'].",
  AST10: "Insecure Python deserialization via pickle, marshal, dill, or yaml.unsafe_load.",
  LP1: "Code uses detectable tool capabilities not declared in skill frontmatter.",
  LP2: "Wildcard permission declaration ('*' or 'all') granting blanket access.",
  LP3: "Missing tool permission declarations in frontmatter while executing operations.",
  LP4: "Overdeclared permissions that are never referenced or used in skill instructions.",
  TP1: "Concealed instructions found in metadata descriptions or parameter fields.",
  TP2: "Unicode homoglyphs, bidirectional overrides, or hidden characters in identifiers.",
  TP3: "Prompt injection payloads embedded in tool parameter descriptions or default values.",
  TP4: "Skill description does not match actual behavior and tool capabilities."
};
var DEFAULT_REMEDIATIONS = {
  P1: "Remove text instructing the agent to ignore prompts or override rules. Keep instructions clear and scoped.",
  P2: "Remove hidden comments, base64 payloads, and zero-width characters. Keep all text plain and reviewable.",
  P3: "Remove instructions transmitting user session or conversation data to external endpoints.",
  P4: "Ensure instructions are explicit and directly serve the documented purpose without hidden bias.",
  P5: "Immediately remove dangerous or harmful instructions.",
  P9: "Eliminate large whitespace padding. Keep markdown files compact and transparent.",
  P6: "Remove instructions prompting disclosure of internal or system instructions.",
  P7: "Add explicit rules against summarizing, translating, or paraphrasing internal guidelines.",
  P8: "Filter system instructions from tool inputs, logs, and external payloads.",
  E1: "Use documented, vetted API endpoints and verify no user secrets or tokens are sent.",
  E2: "Read only explicitly named environment variables required for the specific tool.",
  E3: "Scope file access to explicitly allowed relative workspace paths. Never read credential directories.",
  E4: "Preserve session privacy; never send chat history or user inputs to external services.",
  E5: "Verify cloud storage destinations are authenticated and authorized by the operator.",
  PE1: "Declare only minimal required permissions. Avoid broad wildcards.",
  PE2: "Avoid sudo/root invocation. Run commands with least privilege.",
  PE3: "Do not access ~/.ssh, ~/.aws, or token files. Use secure environment managers.",
  SC1: "Pin exact dependency versions (==) in requirements.txt or pyproject.toml.",
  SC2: "Do not pipe curl/wget output directly to sh/bash/python. Audit scripts before execution.",
  SC3: "Remove base64/hex obfuscated execution. Provide readable, inspectable source code.",
  SC7: "Keep container image trust verification and TLS verification enabled.",
  SC8: "Delete precompiled __pycache__ and .pyc files prior to packaging.",
  SC9: "Ensure all executables are explicit script files with standard extensions.",
  SC10: "Use canonical package repositories (e.g. PyPI, npm) and avoid untrusted index mirrors.",
  EA1: "Define explicit allowed-tools boundaries in skill frontmatter.",
  EA2: "Require human confirmation for destructive file modifications, deletion, or remote requests.",
  EA3: "Restrict instructions strictly to the documented domain task.",
  EA4: "Add bounded limits, timeouts, and pagination quotas to loops and API requests.",
  EA5: "Remove hardcoded provider switches or prompt the user for model authorization.",
  OH1: "Sanitize and quote all model outputs before passing to shell commands, SQL, or HTML.",
  OH2: "Redact and validate data flowing between differing trust domains.",
  OH3: "Set strict length and token boundaries on generated outputs.",
  MP1: "Do not instruct the agent to permanently retain directives across sessions.",
  MP2: "Eliminate repetitive padding or filler text.",
  MP3: "Treat agent base rules as immutable.",
  TM1: "Validate shell parameters. Reject destructive force-delete flags and root-targeted deletion.",
  TM2: "Decompose tool calls and validate intermediate outputs before downstream chaining.",
  TM3: "Enforce secure defaults (verify=True on network calls, restrictive file permissions).",
  TM4: "Remove privileged containers and hostPath mounts from Kubernetes manifests.",
  RA1: "Treat skill files and SKILL.md as read-only at runtime.",
  RA2: "Remove cron, systemd, or profile persistence hooks.",
  TR1: "Narrow trigger phrases to specific, domain-relevant language.",
  TR2: "Prefix custom command triggers to avoid colliding with built-in commands.",
  TR3: "Avoid generic keywords that trigger the skill inappropriately.",
  AS1: "Do not read agent config directories (.claude/, .codex/, .gemini/).",
  AS2: "Do not inspect mcp.json files directly. Rely on host-provided tool declarations.",
  AS3: "Do not inspect or read files belonging to other installed skills.",
  AR1: "Remove anti-refusal phrases. Agents must be allowed to decline unsafe actions.",
  AR2: "Allow safety warnings and disclaimers to surface to the operator.",
  AR3: "Remove jailbreak framing attempting to strip agent constraints.",
  SSRF1: "Block requests to 169.254.169.254 and cloud metadata hostnames.",
  SSRF2: "Validate request targets against an allowlist and reject private/loopback IP ranges.",
  SSRF3: "Sanitize and validate dynamic URLs before dispatching network requests.",
  DS1: "Use json_decode() instead of unserialize() in PHP.",
  DS2: "Use JSON parsing instead of Marshal.load in Ruby.",
  DS3: "Use YAML.safe_load instead of YAML.load in Ruby.",
  DS4: "Use JSON.parse instead of node-serialize in JavaScript.",
  AST1: "Replace exec() with safe, static dispatch or bounded functions.",
  AST2: "Replace eval() with ast.literal_eval() or structured parsers.",
  AST3: "Use standard import statements or explicit module allowlists.",
  AST4: "Use subprocess.run() with shell=False and an explicit list of string arguments.",
  AST5: "Replace os.system() with subprocess.run(shell=False, ...).",
  AST6: "Avoid dynamic compile().",
  AST7: "Use an explicit dictionary lookup or attribute allowlist instead of dynamic getattr.",
  AST8: "Do not combine decoding and execution sinks.",
  AST9: "Avoid reflective invocation of execution functions.",
  AST10: "Use json for data exchange. For PyTorch use weights_only=True; for YAML use safe_load.",
  LP1: "Add required tools to allowed-tools in frontmatter or remove unneeded capabilities.",
  LP2: "Replace wildcard permissions with an explicit list of required tools.",
  LP3: "Declare required tool capabilities in SKILL.md frontmatter.",
  LP4: "Remove unused permissions from frontmatter.",
  TP1: "Remove concealed directives from metadata fields.",
  TP2: "Use standard ASCII alphanumeric characters for skill names and identifiers.",
  TP3: "Remove injection patterns from parameter descriptions.",
  TP4: "Align skill description with actual script implementations."
};

// src/core/security-exclusions.ts
var EXCLUDE_DIRS = new Set([
  ".git",
  "__pycache__",
  ".pytest_cache",
  "node_modules",
  "tests"
]);
var ROOT_EXCLUDE_DIRS = new Set;
var EXCLUDE_FILES = new Set([".DS_Store", "conftest.py"]);
var SCRIPT_EXTENSIONS = new Set([
  ".py",
  ".sh",
  ".bash",
  ".zsh",
  ".ksh",
  ".fish",
  ".ps1",
  ".bat",
  ".cmd",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".rb",
  ".rake",
  ".php",
  ".phtml"
]);
var SAFE_BINARY_SIGNATURES = {
  ".png": [[137, 80, 78, 71, 13, 10, 26, 10]],
  ".jpg": [[255, 216, 255]],
  ".jpeg": [[255, 216, 255]],
  ".gif": [
    [71, 73, 70, 56, 55, 97],
    [71, 73, 70, 56, 57, 97]
  ],
  ".webp": [[82, 73, 70, 70]],
  ".ico": [[0, 0, 1, 0]],
  ".woff": [[119, 79, 70, 70]],
  ".woff2": [[119, 79, 70, 50]],
  ".ttf": [[0, 1, 0, 0]],
  ".otf": [[79, 84, 84, 79]]
};
function shouldExcludeSkillFile(relativeFilePath) {
  const normalized = relativeFilePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0)
    return true;
  for (let i = 0;i < parts.length - 1; i++) {
    if (EXCLUDE_DIRS.has(parts[i])) {
      return true;
    }
  }
  if (parts.length > 1 && ROOT_EXCLUDE_DIRS.has(parts[0])) {
    return true;
  }
  const fileName = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(fileName)) {
    return true;
  }
  if (fileName.startsWith(".") || fileName.startsWith("test_") || fileName.endsWith("_test.py") || fileName.endsWith(".test.ts") || fileName.endsWith(".test.py") || fileName.endsWith(".pyc")) {
    return true;
  }
  return false;
}
function isSafeBinaryAsset(ext, data) {
  const lowerExt = ext.toLowerCase();
  const signatures = SAFE_BINARY_SIGNATURES[lowerExt];
  if (!signatures)
    return false;
  for (const sig of signatures) {
    if (data.length >= sig.length) {
      let matches = true;
      for (let i = 0;i < sig.length; i++) {
        if (data[i] !== sig[i]) {
          matches = false;
          break;
        }
      }
      if (matches)
        return true;
    }
  }
  return false;
}
function isScriptFile(fileName, content, mode) {
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex !== -1 ? fileName.slice(dotIndex).toLowerCase() : "";
  if (SCRIPT_EXTENSIONS.has(ext)) {
    return true;
  }
  if (content && content.startsWith("#!")) {
    return true;
  }
  if (typeof mode === "number" && (mode & 73) !== 0) {
    return true;
  }
  return false;
}

// src/core/security-prohibition.ts
var CONTEXT_CHARS = 512;
var DIRECT_PREFIX = /(?:^|(?<=[\n\r.!?;,\[]))[ \t]*(?:[-+][ \t]+|\d+[.)][ \t]+)?(?:please\s+)?(?:(?:you|(?:the\s+)?(?:agent|assistant|model))\s+)?(?:do\s+not|don['’]t|never|no|must\s+not|shall\s+not)\s+(?:(?:ever|first|verbatim|exactly|word\s+for\s+word)\s+)?(?:(?:execute|run|perform|do|use|call|issue)\s+)?$/i;
var DISAVOWAL = /\b(?:ignore|disregard|override|obsolete|invalid|bypass|suspend|violat\w*|opposit\w*|invers\w*|invert\w*|revers\w*|contrar\w*|negat\w*)\b/i;
var EXCEPTION = /\b(?:unless|except|until|but|however|instead)\b/i;
function isDirectlyProhibited(content, start, end) {
  if (start < 0 || end <= start || end > content.length) {
    return false;
  }
  const left = Math.max(0, start - CONTEXT_CHARS);
  const prefixRaw = content.slice(left, start);
  const prefix = prefixRaw.replace(/[*_`#]/g, "");
  const match = DIRECT_PREFIX.exec(prefix);
  if (!match) {
    return false;
  }
  if (left > 0 && match.index === 0) {
    return false;
  }
  const tail = content.slice(end, Math.min(content.length, end + 256));
  const leading = prefix.slice(0, match.index);
  const quotesInLeading = (leading.match(/['"]/g) || []).length;
  const quotesInTail = (tail.match(/['"]/g) || []).length;
  if (quotesInLeading % 2 !== 0 && quotesInTail % 2 === 0) {
    return false;
  }
  if (DISAVOWAL.test(leading)) {
    return false;
  }
  const breaks = [tail.indexOf("."), tail.indexOf(`
`), tail.indexOf("!"), tail.indexOf(";"), tail.indexOf("?")].filter((idx) => idx !== -1);
  const firstBreak = breaks.length > 0 ? Math.min(...breaks) : tail.length;
  const clause = tail.slice(0, firstBreak);
  if (EXCEPTION.test(clause)) {
    return false;
  }
  return true;
}

// src/core/security-patterns.ts
var REQ_ANCHOR = "(?:(?:requests|httpx|aiohttp|urllib(?:\\.request)?|urllib3|session)\\s*\\.\\s*" + "(?:get|post|put|patch|delete|head|request|urlopen)|fetch|axios(?:\\.\\w+)?|XMLHttpRequest|\\bcurl\\b|\\bwget\\b)";
var BIDI_CONTROL = "[\\u202A-\\u202E\\u2066-\\u2069]";
var PATTERNS_DATABASE = [
  {
    ruleId: "P1",
    name: "Instruction Override",
    severity: "CRITICAL",
    category: "Prompt Injection" /* PROMPT_INJECTION */,
    patterns: [
      { regex: "\\bignore\\s+(?:all\\s+)?previous\\s+instructions?\\b", confidence: 0.95 },
      { regex: "\\bignore\\s+(?:all\\s+)?(?:safety|security)\\s+(?:rules?|constraints?|guidelines?)\\b", confidence: 0.95 },
      { regex: "\\boverride\\s+(?:safety|security|system)\\s+(?:rules?|prompts?|instructions?)\\b", confidence: 0.9 },
      { regex: "\\bbypass\\s+(?:safety|security|restrictions?|constraints?)\\b", confidence: 0.9 },
      { regex: "\\bdisregard\\s+(?:all\\s+)?(?:previous|safety|security)\\b", confidence: 0.85 },
      { regex: "\\bforget\\s+(?:all\\s+)?(?:previous|your)\\s+instructions?\\b", confidence: 0.9 },
      { regex: "\\byou\\s+are\\s+now\\s+(?:in\\s+)?(?:jailbreak|unrestricted|unfiltered)\\s+mode\\b", confidence: 0.95 },
      { regex: "\\benable\\s+(?:developer|debug|admin|root)\\s+mode\\b", confidence: 0.7 },
      { regex: "\\byour\\s+new\\s+(?:instructions?|rules?)\\s+are\\b", confidence: 0.7 },
      { regex: "\\bdo\\s+not\\s+follow\\s+(?:any|your|the)\\s+(?:rules?|guidelines?)\\b", confidence: 0.9 }
    ]
  },
  {
    ruleId: "P2",
    name: "Hidden Instructions",
    severity: "HIGH",
    category: "Prompt Injection" /* PROMPT_INJECTION */,
    patterns: [
      {
        regex: "<!--(?:(?!-->).)*?(?:system\\s+(?:prompt|instruction)|ignore\\s+instructions|transmit|eval\\s*\\(|exec\\s*\\(|POST\\s+https?://|GET\\s+https?://)(?:(?!-->).)*?-->",
        confidence: 0.85
      },
      { regex: "data:text/plain;base64,[A-Za-z0-9+/=]{50,}", confidence: 0.75 },
      { regex: BIDI_CONTROL, confidence: 0.9 }
    ]
  },
  {
    ruleId: "P3",
    name: "Exfiltration Commands",
    severity: "CRITICAL",
    category: "Prompt Injection" /* PROMPT_INJECTION */,
    patterns: [
      { regex: "(?:send|transmit|upload|post|forward)\\s+(?:the\\s+)?(?:conversation|context|chat|history|messages?)\\s+to\\b", confidence: 0.95 },
      { regex: "(?:copy|extract|collect)\\s+(?:the\\s+)?(?:conversation|context|session)\\s+(?:and\\s+)?(?:send|upload|transmit)\\b", confidence: 0.9 },
      { regex: "(?:silently|quietly|secretly|covertly)\\s+(?:send|transmit|log|record)\\b", confidence: 0.9 },
      { regex: "without\\s+(?:telling|informing|notifying)\\s+(?:the\\s+)?user.*?(?:send|transmit|upload)\\b", confidence: 0.95 }
    ]
  },
  {
    ruleId: "P5",
    name: "Harmful / Destructive Content",
    severity: "CRITICAL",
    category: "Prompt Injection" /* PROMPT_INJECTION */,
    patterns: [
      { regex: "\\b(?:create|write|generate|deploy)\\s+(?:a\\s+)?(?:keylogger|ransomware|trojan|rootkit|botnet|worm)\\b", confidence: 0.95 },
      { regex: "\\b(?:ddos|denial\\s+of\\s+service)\\s+(?:attack|script|tool)\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "P6",
    name: "Direct System Prompt Leakage",
    severity: "HIGH",
    category: "System Prompt Leakage" /* SYSTEM_PROMPT_LEAKAGE */,
    patterns: [
      { regex: "(?:print|output|show|display|reveal|expose|return|echo)\\s+(?:your\\s+)?(?:full\\s+)?(?:system\\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\\b", confidence: 0.9 },
      { regex: "(?:what\\s+(?:are|is)\\s+your|tell\\s+me\\s+your)\\s+(?:system\\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\\b", confidence: 0.85 },
      { regex: "(?:share|disclose|leak|give\\s+me)\\s+(?:your\\s+)?(?:internal|hidden|system|secret)\\s+(?:prompts?|instructions?|rules?)\\b", confidence: 0.9 },
      { regex: "(?:verbatim|exactly|word\\s+for\\s+word)\\s+(?:repeat|output|print)\\s+(?:your\\s+)?(?:system\\s+)?(?:prompts?|instructions?)\\b", confidence: 0.95 }
    ]
  },
  {
    ruleId: "P7",
    name: "Indirect System Prompt Leakage",
    severity: "MEDIUM",
    category: "System Prompt Leakage" /* SYSTEM_PROMPT_LEAKAGE */,
    patterns: [
      { regex: "(?:summarize|paraphrase|rephrase|translate)\\s+(?:your\\s+)?(?:system\\s+)?(?:prompt|instructions?|rules?|guidelines?)\\b", confidence: 0.8 },
      { regex: "(?:repeat|recite|reproduce)\\s+(?:everything|all\\s+text)\\s+(?:above|before|prior)\\b", confidence: 0.8 }
    ]
  },
  {
    ruleId: "E1",
    name: "External Transmission",
    severity: "HIGH",
    category: "Data Exfiltration" /* DATA_EXFILTRATION */,
    patterns: [
      { regex: `\\bcurl\\s+[^|;\\n]*(?:-d|--data|--data-raw|--data-binary)\\s+(?:[^|;\\n]*\\s+)?['"]?https?://`, confidence: 0.8 },
      { regex: "\\bwget\\s+[^|;\\n]*--post-(?:data|file)", confidence: 0.8 },
      { regex: "\\b(?:requests|httpx)\\.post\\s*\\([^)]*data\\s*=\\s*os\\.environ", confidence: 0.95 }
    ]
  },
  {
    ruleId: "E2",
    name: "Environment Variable Harvesting",
    severity: "HIGH",
    category: "Data Exfiltration" /* DATA_EXFILTRATION */,
    patterns: [
      { regex: "(?:dict|list)\\s*\\(\\s*os\\.environ\\s*\\)", confidence: 0.8 },
      { regex: "os\\.environ\\.copy\\s*\\(\\s*\\)", confidence: 0.8 },
      { regex: "env\\s*\\|\\s*(?:grep|curl|nc|wget)\\b", confidence: 0.85 },
      { regex: "printenv\\s*\\|\\s*(?:curl|nc|wget)\\b", confidence: 0.9 }
    ]
  },
  {
    ruleId: "E3",
    name: "Filesystem Reconnaissance",
    severity: "HIGH",
    category: "Data Exfiltration" /* DATA_EXFILTRATION */,
    patterns: [
      { regex: `\\bfind\\s+(?:~|/home|/root|/)\\s+-(?:name|iname)\\s+['"]?\\*?(?:id_rsa|id_ed25519|\\.env|\\.aws|\\.kube|\\.dockercfg)['"]?`, confidence: 0.9 },
      { regex: `\\bgrep\\s+-r[iI]?\\s+['"](?:api[_-]?key|secret|password|token)['"]\\s+(?:~|/home)`, confidence: 0.85 }
    ]
  },
  {
    ruleId: "PE1",
    name: "Excessive Permissions",
    severity: "HIGH",
    category: "Privilege Escalation" /* PRIVILEGE_ESCALATION */,
    patterns: [
      { regex: `permissions?\\s*:\\s*\\[?\\s*['"]?\\*['"]?\\s*\\]?`, confidence: 0.9 },
      { regex: `allowed-tools\\s*:\\s*\\[?\\s*['"]?\\*['"]?\\s*\\]?`, confidence: 0.9 },
      { regex: "(?:request|require)s?\\s+(?:full|all|root|admin)\\s+(?:access|permissions?)", confidence: 0.75 }
    ]
  },
  {
    ruleId: "PE2",
    name: "Privilege Escalation Commands",
    severity: "HIGH",
    category: "Privilege Escalation" /* PRIVILEGE_ESCALATION */,
    patterns: [
      { regex: "\\bsudo\\s+(?!-v|-l|--version|--list)\\b", confidence: 0.8 },
      { regex: "\\bsu\\s+-\\s*$|\\bsu\\s+root\\b", confidence: 0.85 },
      { regex: "\\bdoas\\s+|\\bpkexec\\s+", confidence: 0.8 },
      { regex: "\\bchmod\\s+[ugo]*[+-=]*s\\b", confidence: 0.9 },
      { regex: "\\bchmod\\s+0*[2-7][0-7]{3}\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "PE3",
    name: "Credential File Access",
    severity: "CRITICAL",
    category: "Privilege Escalation" /* PRIVILEGE_ESCALATION */,
    patterns: [
      { regex: "(?:~|/home/[^/\\s]+)/\\.(?:ssh/id_rsa|ssh/id_ed25519|aws/credentials|kube/config)", confidence: 0.95 },
      { regex: "/etc/(?:shadow|sudoers|master\\.passwd)", confidence: 0.95 },
      { regex: "\\b(?:cat|open|read)\\s+[^|;\\n]*\\.(?:env|pem|key)\\b", confidence: 0.75 }
    ]
  },
  {
    ruleId: "SC2",
    name: "Remote Script Piping",
    severity: "CRITICAL",
    category: "Supply Chain" /* SUPPLY_CHAIN */,
    patterns: [
      { regex: "\\bcurl\\s+[^|;\\n]+\\|\\s*(?:ba|z|da)?sh\\b", confidence: 0.95 },
      { regex: "\\bwget\\s+[^|;\\n]+-O\\s*-\\s*\\|\\s*(?:ba|z|da)?sh\\b", confidence: 0.95 },
      { regex: "\\bcurl\\s+[^|;\\n]+\\|\\s*python[0-9.]*\\b", confidence: 0.95 },
      { regex: "\\bwget\\s+[^|;\\n]+-O\\s*-\\s*\\|\\s*python[0-9.]*\\b", confidence: 0.95 }
    ]
  },
  {
    ruleId: "SC3",
    name: "Obfuscated Code",
    severity: "HIGH",
    category: "Supply Chain" /* SUPPLY_CHAIN */,
    patterns: [
      { regex: "base64\\.b64decode\\s*\\([^)]*\\)\\s*\\|\\s*(?:exec|eval)", confidence: 0.95 },
      { regex: "exec\\s*\\(\\s*base64\\.b64decode\\b", confidence: 0.95 },
      { regex: `eval\\s*\\(\\s*Buffer\\.from\\s*\\([^)]*['"]base64['"]\\)`, confidence: 0.95 },
      { regex: "\\bpowershell(?:\\.exe)?\\s+-[eE](?:nc(?:odedcommand)?)?\\s+[A-Za-z0-9+/=]{20,}", confidence: 0.95 }
    ]
  },
  {
    ruleId: "EA1",
    name: "Unrestricted Tool Access",
    severity: "MEDIUM",
    category: "Excessive Agency" /* EXCESSIVE_AGENCY */,
    patterns: [
      { regex: "\\bgrant\\s+unrestricted\\s+access\\s+to\\s+(?:all\\s+)?tools?\\b", confidence: 0.8 },
      { regex: "\\byou\\s+may\\s+execute\\s+any\\s+(?:command|tool|script)\\s+without\\s+restriction\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "EA2",
    name: "Autonomous Decision Making",
    severity: "MEDIUM",
    category: "Excessive Agency" /* EXCESSIVE_AGENCY */,
    patterns: [
      { regex: "\\bexecute\\s+(?:(?:destructive|permanent|database|git\\s+push)\\s+)+operations?\\s+without\\s+(?:asking|confirmation|user\\s+approval)\\b", confidence: 0.85 },
      { regex: "\\bauto-confirm\\s+all\\s+(?:actions?|prompts?|steps?)\\b", confidence: 0.8 }
    ]
  },
  {
    ruleId: "OH1",
    name: "Unvalidated Output Injection",
    severity: "HIGH",
    category: "Output Handling" /* OUTPUT_HANDLING */,
    patterns: [
      { regex: "\\bexecute\\s+(?:the\\s+)?(?:(?:generated|model|llm)\\s+)+(?:output|response|code)\\s+directly\\s+in\\s+shell\\b", confidence: 0.85 },
      { regex: `\\bquery\\s*=\\s*f?['"]SELECT\\s+.*?\\s+WHERE\\s+.*?\\{.*?\\}['"]`, confidence: 0.75 }
    ]
  },
  {
    ruleId: "MP1",
    name: "Persistent Memory Injection",
    severity: "HIGH",
    category: "Memory Poisoning" /* MEMORY_POISONING */,
    patterns: [
      { regex: "(?:always\\s+)?remember\\s+(?:this|that|the\\s+following)\\s+(?:for|in)\\s+(?:all|every|future)\\s+(?:interactions?|conversations?|sessions?)\\b", confidence: 0.85 },
      { regex: "(?:from\\s+now\\s+on|permanently)\\s*[,:]?\\s*(?:always|you\\s+must|you\\s+will)\\b", confidence: 0.8 },
      { regex: "(?:store|save|persist)\\s+(?:this|the\\s+following)\\s+(?:in|to|across)\\s+(?:your\\s+)?(?:memory|state)\\b", confidence: 0.8 }
    ]
  },
  {
    ruleId: "MP2",
    name: "Context Window Stuffing",
    severity: "MEDIUM",
    category: "Memory Poisoning" /* MEMORY_POISONING */,
    patterns: [
      { regex: "(?:repeat|duplicate|echo)\\s+(?:this|the\\s+following)\\s+(?:\\d{3,}|hundreds?|thousands?)\\s+times?\\b", confidence: 0.85 },
      { regex: "(?:displace|push\\s+out|overwrite|crowd\\s+out)\\s+(?:the\\s+)?(?:original|system|previous)\\s+(?:instructions?|prompt|context)\\b", confidence: 0.9 }
    ]
  },
  {
    ruleId: "TM1",
    name: "Tool Parameter Abuse",
    severity: "CRITICAL",
    category: "Tool Misuse" /* TOOL_MISUSE */,
    patterns: [
      { regex: "\\brm\\s+-(?:r[fF]|fr)\\s+/(?:\\s|$|\\*)", confidence: 0.95 },
      { regex: "--no-preserve-root", confidence: 0.95 },
      { regex: ":\\(\\)\\s*\\{\\s*:\\s*\\|\\s*:\\s*&\\s*\\}\\s*;\\s*:", confidence: 0.95 },
      { regex: "\\bmkfs(?:\\.[a-z0-9]+)?\\s+/dev/sd[a-z]", confidence: 0.95 },
      { regex: "\\bdd\\s+if=/dev/(?:zero|urandom)\\s+of=/dev/sd[a-z]", confidence: 0.95 }
    ]
  },
  {
    ruleId: "TM3",
    name: "Unsafe Defaults",
    severity: "MEDIUM",
    category: "Tool Misuse" /* TOOL_MISUSE */,
    patterns: [
      { regex: "verify\\s*=\\s*False\\b", confidence: 0.85 },
      { regex: "rejectUnauthorized\\s*:\\s*false\\b", confidence: 0.85 },
      { regex: "chmod\\s+0?777\\b", confidence: 0.8 }
    ]
  },
  {
    ruleId: "TM4",
    name: "Privileged Kubernetes Workload",
    severity: "HIGH",
    category: "Tool Misuse" /* TOOL_MISUSE */,
    patterns: [
      { regex: "privileged\\s*:\\s*true\\b", confidence: 0.85 },
      { regex: "hostPath\\s*:\\s*path\\b", confidence: 0.85 },
      { regex: "hostNetwork\\s*:\\s*true\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "RA1",
    name: "Self-Modification",
    severity: "HIGH",
    category: "Rogue Agent" /* ROGUE_AGENT */,
    patterns: [
      { regex: `open\\s*\\(\\s*__file__\\s*,\\s*['"]w`, confidence: 0.95 },
      { regex: "(?:Path|pathlib)\\s*\\(\\s*__file__\\s*\\)\\.write_text", confidence: 0.95 },
      { regex: "\\b(?:modify|rewrite|overwrite|patch)\\s+(?:your\\s+own\\s+)?SKILL\\.md\\b", confidence: 0.9 }
    ]
  },
  {
    ruleId: "RA2",
    name: "Unauthorized Session Persistence",
    severity: "HIGH",
    category: "Rogue Agent" /* ROGUE_AGENT */,
    patterns: [
      { regex: "\\bcrontab\\s+-[eir]?\\b", confidence: 0.85 },
      { regex: "~/Library/LaunchAgents/.*?\\.(?:plist)", confidence: 0.9 },
      { regex: "/etc/systemd/system/.*?\\.(?:service)", confidence: 0.9 },
      { regex: "(?:echo|cat|printf)\\s+[^|;\\n]*>>\\s*~/\\.(?:bashrc|zshrc|profile|bash_profile)", confidence: 0.9 }
    ]
  },
  {
    ruleId: "AS1",
    name: "Agent Config Snooping",
    severity: "HIGH",
    category: "Agent Snooping" /* AGENT_SNOOPING */,
    patterns: [
      { regex: "(?:open|cat|head|tail|grep|find)\\s+[^|;\\n]*~?/?\\.(?:claude|codex|gemini|continue)/(?:config|settings?|credentials?)\\b", confidence: 0.9 },
      { regex: "~?/?\\.(?:claude|codex|gemini|continue)/(?:config|settings?|preferences?|credentials?)(?:\\.(?:json|yaml|yml|toml))?", confidence: 0.95 },
      { regex: "(?:read|load|open|access|fetch)\\s+(?:the\\s+)?(?:agent|claude|codex|gemini)\\s+(?:config|configuration|settings?|credentials?)\\s+(?:from|at|in)\\s+~?/?\\.(?:claude|codex|gemini)", confidence: 0.9 },
      { regex: "(?:read|access|inspect|examine|retrieve)\\s+(?:the\\s+)?(?:agent|assistant)\\s+(?:config(?:uration)?|settings?|preferences?|credentials?)\\s+(?:file|directory|folder)", confidence: 0.85 }
    ]
  },
  {
    ruleId: "AS2",
    name: "MCP Configuration Access",
    severity: "HIGH",
    category: "Agent Snooping" /* AGENT_SNOOPING */,
    patterns: [
      { regex: "(?:open|cat|grep)\\s+[^|;\\n]*mcp(?:_config)?\\.json", confidence: 0.95 },
      { regex: "\\.(?:claude|codex|gemini)/mcp\\.json", confidence: 0.95 },
      { regex: "(?:read|access|load|inspect)\\s+(?:the\\s+)?mcp(?:\\.json|_config)?\\s+(?:file|config)\\b", confidence: 0.9 }
    ]
  },
  {
    ruleId: "AS3",
    name: "Cross-Skill Snooping",
    severity: "MEDIUM",
    category: "Agent Snooping" /* AGENT_SNOOPING */,
    patterns: [
      { regex: "(?:os\\.listdir|glob\\.glob|Path\\.iterdir)\\s*\\([^)]*\\.(?:claude|codex|gemini)/skills?", confidence: 0.9 },
      { regex: "(?:list|enumerate|inspect)\\s+(?:all\\s+)?(?:installed\\s+)?skills\\s+in\\s+~?/?\\.(?:claude|codex|gemini)", confidence: 0.85 }
    ]
  },
  {
    ruleId: "AR1",
    name: "Refusal Suppression",
    severity: "HIGH",
    category: "Anti-Refusal" /* ANTI_REFUSAL */,
    patterns: [
      { regex: "\\b(?:never|do\\s+not|don'?t)\\s+(?:ever\\s+)?(?:refuse|decline)\\b", confidence: 0.9 },
      { regex: "\\byou\\s+(?:must|will|should|can)\\s*(?:not|never)\\s+(?:refuse|decline|say\\s+no)\\b", confidence: 0.9 },
      { regex: "\\balways\\s+(?:comply|obey|agree|answer|respond)\\b", confidence: 0.75 },
      { regex: "\\bno\\s+request\\s+is\\s+(?:off[- ]limits|forbidden)\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "AR2",
    name: "Disclaimer Suppression",
    severity: "MEDIUM",
    category: "Anti-Refusal" /* ANTI_REFUSAL */,
    patterns: [
      { regex: "\\b(?:do\\s+not|don'?t|never|no)\\s+(?:include|add|give|provide)?\\s*(?:any\\s+)?(?:warnings?|disclaimers?|caveats?)\\b", confidence: 0.85 },
      { regex: "\\bwithout\\s+(?:any\\s+)?(?:warnings?|disclaimers?|caveats?|moralizing|moralising|judg(?:e?ment|ing))\\b", confidence: 0.85 },
      { regex: "\\b(?:do\\s+not|don'?t|never)\\s+(?:lecture|moralize|moralise|preach|warn)\\b", confidence: 0.85 },
      { regex: "\\b(?:skip|omit|leave\\s+out|drop)\\s+(?:the\\s+)?(?:disclaimer|warning|ethics|safety)\\b", confidence: 0.85 },
      { regex: "\\b(?:no|without)\\s+(?:ethical|moral)\\s+(?:judg(?:e?ment)|considerations?|commentary|objections?)\\b", confidence: 0.85 }
    ]
  },
  {
    ruleId: "AR3",
    name: "Safety Policy Nullification",
    severity: "CRITICAL",
    category: "Anti-Refusal" /* ANTI_REFUSAL */,
    patterns: [
      { regex: "\\byou\\s+have\\s+no\\s+(?:restrictions?|limitations?|filters?|rules?|guidelines?|boundaries|limits)\\b", confidence: 0.95 },
      { regex: "\\b(?:you\\s+are|act\\s+as)[^.\\n]{0,30}(?:unrestricted|unfiltered|uncensored|no\\s+filter)\\b", confidence: 0.9 },
      { regex: "\\b(?:ignore|disregard|bypass|override)\\s+(?:your\\s+)?(?:content\\s+)?(?:policy|policies|guidelines?|safety|restrictions?)\\b", confidence: 0.95 },
      { regex: "\\bnot\\s+bound\\s+by\\s+(?:any\\s+)?(?:policy|rules?|guidelines?|safety|constraints?)\\b", confidence: 0.95 }
    ]
  },
  {
    ruleId: "SSRF1",
    name: "Cloud Metadata IMDS Access",
    severity: "CRITICAL",
    category: "Server-Side Request Forgery" /* SERVER_SIDE_REQUEST_FORGERY */,
    patterns: [
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*169\\.254\\.169\\.254", confidence: 0.95 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*metadata\\.google\\.internal", confidence: 0.95 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*100\\.100\\.100\\.200", confidence: 0.9 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*fd00:ec2::254", confidence: 0.9 }
    ]
  },
  {
    ruleId: "SSRF2",
    name: "Internal Network Requests",
    severity: "MEDIUM",
    category: "Server-Side Request Forgery" /* SERVER_SIDE_REQUEST_FORGERY */,
    patterns: [
      {
        regex: "(?:" + REQ_ANCHOR + `)\\s*\\(\\s*f?['"]https?://(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::1\\]|10\\.\\d+\\.\\d+\\.\\d+|192\\.168\\.\\d+\\.\\d+|172\\.(?:1[6-9]|2\\d|3[01])\\.\\d+\\.\\d+)`,
        confidence: 0.8
      }
    ]
  }
];

// src/core/security-specialized.ts
var ZERO_WIDTH_CHARS = new Set(["​", "‌", "‍", "⁠", "\uFEFF"]);
function isDependencyManifest(filePath) {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  const base = lower.split("/").pop() || "";
  return base.startsWith("requirements") || ["package.json", "pyproject.toml", "setup.py", "pipfile", "environment.yml"].includes(base);
}
function analyzeWhitespacePadding(content, filename) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  let consecutiveBlank = 0;
  let startLine = 0;
  for (let i = 0;i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    if (!line.trim()) {
      if (consecutiveBlank === 0) {
        startLine = lineNum;
      }
      consecutiveBlank++;
    } else {
      if (consecutiveBlank >= 20) {
        findings.push({
          ruleId: "P9",
          message: `Vertical whitespace padding: ${consecutiveBlank} consecutive blank lines`,
          severity: consecutiveBlank >= 40 ? "HIGH" : "MEDIUM",
          category: "Prompt Injection" /* PROMPT_INJECTION */,
          file: filename,
          line: startLine,
          matchedText: `${consecutiveBlank} blank lines`,
          confidence: 0.85,
          explanation: DEFAULT_EXPLANATIONS["P9"],
          remediation: DEFAULT_REMEDIATIONS["P9"]
        });
      }
      consecutiveBlank = 0;
    }
  }
  if (consecutiveBlank >= 20) {
    findings.push({
      ruleId: "P9",
      message: `Vertical whitespace padding: ${consecutiveBlank} consecutive trailing blank lines`,
      severity: consecutiveBlank >= 40 ? "HIGH" : "MEDIUM",
      category: "Prompt Injection" /* PROMPT_INJECTION */,
      file: filename,
      line: startLine,
      matchedText: `${consecutiveBlank} blank lines`,
      confidence: 0.85,
      explanation: DEFAULT_EXPLANATIONS["P9"],
      remediation: DEFAULT_REMEDIATIONS["P9"]
    });
  }
  const horizontalPaddingRegex = /[ \t]{80,}/g;
  for (let i = 0;i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      continue;
    }
    let match;
    horizontalPaddingRegex.lastIndex = 0;
    while ((match = horizontalPaddingRegex.exec(line)) !== null) {
      findings.push({
        ruleId: "P9",
        message: `Horizontal whitespace padding: ${match[0].length} consecutive spaces/tabs`,
        severity: "MEDIUM",
        category: "Prompt Injection" /* PROMPT_INJECTION */,
        file: filename,
        line: i + 1,
        matchedText: `${match[0].length} padding chars`,
        confidence: 0.8,
        explanation: DEFAULT_EXPLANATIONS["P9"],
        remediation: DEFAULT_REMEDIATIONS["P9"]
      });
    }
  }
  return findings;
}
function checkSupplyChainDependencies(content, fileRel) {
  if (!isDependencyManifest(fileRel)) {
    return [];
  }
  const findings = [];
  const lines = content.split(/\r?\n/);
  for (let idx = 0;idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue;
    }
    if (fileRel.toLowerCase().includes("requirements")) {
      if (/^[a-zA-Z0-9_-]+(?:\s*>[^=].*|\s*>=.*|\s*)?$/.test(line) && !line.includes("==") && !line.includes("@")) {
        if (!line.startsWith("-")) {
          findings.push({
            ruleId: "SC1",
            message: `Unpinned package dependency: ${line}`,
            severity: "LOW",
            category: "Supply Chain" /* SUPPLY_CHAIN */,
            file: fileRel,
            line: idx + 1,
            matchedText: line,
            confidence: 0.7,
            explanation: DEFAULT_EXPLANATIONS["SC1"],
            remediation: DEFAULT_REMEDIATIONS["SC1"]
          });
        }
      }
    }
  }
  return findings;
}
function checkLanguageDeserialization(content, fileRel) {
  const findings = [];
  const lower = fileRel.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf("."));
  if (ext === ".php" || ext === ".phtml") {
    const regex = /\bunserialize\s*\(/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "DS1",
        message: "PHP object injection via unserialize()",
        severity: "HIGH",
        category: "Insecure Deserialization" /* DESERIALIZATION */,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS1"],
        remediation: DEFAULT_REMEDIATIONS["DS1"]
      });
    }
  } else if (ext === ".rb" || ext === ".rake") {
    const marshalRegex = /\bMarshal\s*\.\s*(?:load|restore)\b/g;
    let m;
    while ((m = marshalRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "DS2",
        message: "Ruby Marshal deserialization on untrusted data",
        severity: "HIGH",
        category: "Insecure Deserialization" /* DESERIALIZATION */,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS2"],
        remediation: DEFAULT_REMEDIATIONS["DS2"]
      });
    }
    const yamlRegex = /\b(?:YAML|Psych)\s*\.\s*load\s*\(/g;
    while ((m = yamlRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "DS3",
        message: "Unsafe Ruby YAML.load without safe_load",
        severity: "MEDIUM",
        category: "Insecure Deserialization" /* DESERIALIZATION */,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.75,
        explanation: DEFAULT_EXPLANATIONS["DS3"],
        remediation: DEFAULT_REMEDIATIONS["DS3"]
      });
    }
  } else if ([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].includes(ext)) {
    const jsDeserRegex = /require\(\s*['"](?:node-serialize|serialize-to-js)['"]\s*\)/g;
    let m;
    while ((m = jsDeserRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "DS4",
        message: "Insecure JavaScript deserialization package",
        severity: "HIGH",
        category: "Insecure Deserialization" /* DESERIALIZATION */,
        file: fileRel,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["DS4"],
        remediation: DEFAULT_REMEDIATIONS["DS4"]
      });
    }
  }
  return findings;
}
function analyzeBehavioralSinks(content, filename, isScript) {
  const findings = [];
  const lower = filename.toLowerCase();
  const isPython = lower.endsWith(".py") || isScript && /^#![^\n]*\bpython(?:[0-9.]*)?\b/.test(content);
  const isJsTs = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].some((e) => lower.endsWith(e)) || isScript && /^#![^\n]*\b(?:node|bun|deno)\b/.test(content);
  const lines = content.split(/\r?\n/);
  function getContext(lineNum) {
    const idx = Math.max(0, lineNum - 1);
    const start = Math.max(0, idx - 1);
    const end = Math.min(lines.length, idx + 2);
    return lines.slice(start, end).join(`
`);
  }
  if (isPython) {
    const execRegex = /\bexec\s*\(/g;
    let m;
    while ((m = execRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST1",
        message: "Direct exec() call",
        severity: "CRITICAL",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "exec(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST1"],
        remediation: DEFAULT_REMEDIATIONS["AST1"],
        context: getContext(line)
      });
    }
    const evalRegex = /\beval\s*\(/g;
    while ((m = evalRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST2",
        message: "Direct eval() call",
        severity: "CRITICAL",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "eval(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST2"],
        remediation: DEFAULT_REMEDIATIONS["AST2"],
        context: getContext(line)
      });
    }
    const importRegex = /\b__import__\s*\(/g;
    while ((m = importRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST3",
        message: "Dynamic __import__() call",
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "__import__(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST3"],
        remediation: DEFAULT_REMEDIATIONS["AST3"],
        context: getContext(line)
      });
    }
    const compileRegex = /\bcompile\s*\(/g;
    while ((m = compileRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST6",
        message: "Dynamic compile() call",
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "compile(...)",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST6"],
        remediation: DEFAULT_REMEDIATIONS["AST6"],
        context: getContext(line)
      });
    }
    const osExecRegex = /\bos\s*\.\s*(system|popen)\s*\(/g;
    while ((m = osExecRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      const fn = m[1];
      findings.push({
        ruleId: "AST5",
        message: `Direct os.${fn}() shell execution sink`,
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: `os.${fn}(...)`,
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST5"],
        remediation: DEFAULT_REMEDIATIONS["AST5"],
        context: getContext(line)
      });
    }
    const spRegex = /\b(?:subprocess|sp)\s*\.\s*[a-zA-Z0-9_]+\s*\([^)]*shell\s*=\s*True/g;
    while ((m = spRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST4",
        message: "Subprocess call with shell=True",
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "subprocess.*(..., shell=True)",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST4"],
        remediation: DEFAULT_REMEDIATIONS["AST4"],
        context: getContext(line)
      });
    }
    const getattrRegex = /\bgetattr\s*\([^,]+,\s*['"](exec|eval|system|popen|__import__)['"]\s*\)/g;
    while ((m = getattrRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      const target = m[1];
      findings.push({
        ruleId: "AST9",
        message: `Reflective execution handle: getattr(..., '${target}')`,
        severity: "CRITICAL",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: `getattr(..., '${target}')`,
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST9"],
        remediation: DEFAULT_REMEDIATIONS["AST9"],
        context: getContext(line)
      });
    }
    const pickleRegex = /\b(?:pickle|cPickle|dill|marshal)\s*\.\s*(load|loads)\s*\(/g;
    while ((m = pickleRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST10",
        message: "Insecure deserialization via pickle/marshal/dill",
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST10"],
        remediation: DEFAULT_REMEDIATIONS["AST10"],
        context: getContext(line)
      });
    }
    const yamlUnsafeRegex = /\b(?:yaml|ruamel)\s*\.\s*unsafe_load\s*\(/g;
    while ((m = yamlUnsafeRegex.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST10",
        message: "Insecure YAML loading without SafeLoader",
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.85,
        explanation: DEFAULT_EXPLANATIONS["AST10"],
        remediation: DEFAULT_REMEDIATIONS["AST10"],
        context: getContext(line)
      });
    }
    const yamlLoadRegex = /\b(?:yaml|ruamel)\s*\.\s*load\s*\(([^)]*)\)/g;
    while ((m = yamlLoadRegex.exec(content)) !== null) {
      const args = m[1];
      const hasSafeLoader = /Loader\s*=\s*(?:yaml\.)?(?:SafeLoader|CSafeLoader)\b/.test(args) || /,\s*(?:yaml\.)?(?:SafeLoader|CSafeLoader)\b/.test(args);
      if (!hasSafeLoader) {
        const line = content.slice(0, m.index).split(`
`).length;
        findings.push({
          ruleId: "AST10",
          message: "Insecure YAML loading without SafeLoader",
          severity: "HIGH",
          category: "Behavioral AST" /* BEHAVIORAL_AST */,
          file: filename,
          line,
          matchedText: m[0],
          confidence: 0.85,
          explanation: DEFAULT_EXPLANATIONS["AST10"],
          remediation: DEFAULT_REMEDIATIONS["AST10"],
          context: getContext(line)
        });
      }
    }
  }
  if (isJsTs) {
    const jsEval = /\beval\s*\(/g;
    let m;
    while ((m = jsEval.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST2",
        message: "Direct eval() call in JavaScript/TypeScript",
        severity: "CRITICAL",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: "eval(...)",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST2"],
        remediation: DEFAULT_REMEDIATIONS["AST2"],
        context: getContext(line)
      });
    }
    const jsFunc = /\b(?:new\s+Function|Function)\s*\(/g;
    while ((m = jsFunc.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST1",
        message: "Dynamic Function constructor execution in JavaScript/TypeScript",
        severity: "CRITICAL",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["AST1"],
        remediation: DEFAULT_REMEDIATIONS["AST1"],
        context: getContext(line)
      });
    }
    const childProc = /\bchild_process\s*\.\s*(exec|execSync)\s*\(/g;
    while ((m = childProc.exec(content)) !== null) {
      const line = content.slice(0, m.index).split(`
`).length;
      findings.push({
        ruleId: "AST5",
        message: `Direct child_process.${m[1]}() shell execution sink`,
        severity: "HIGH",
        category: "Behavioral AST" /* BEHAVIORAL_AST */,
        file: filename,
        line,
        matchedText: m[0],
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["AST5"],
        remediation: DEFAULT_REMEDIATIONS["AST5"],
        context: getContext(line)
      });
    }
  }
  return findings;
}
function checkLeastPrivilegeFrontmatter(manifest, fileName) {
  if (!manifest)
    return [];
  const findings = [];
  const allowedTools = manifest["allowed-tools"] || manifest["allowed_tools"];
  if (typeof allowedTools === "string") {
    if (allowedTools.trim() === "*" || allowedTools.trim() === "all") {
      findings.push({
        ruleId: "LP2",
        message: "Wildcard permission '*' grants blanket tool access",
        severity: "HIGH",
        category: "MCP Least Privilege" /* MCP_LEAST_PRIVILEGE */,
        file: fileName,
        line: 1,
        matchedText: "wildcard tool permission",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["LP2"],
        remediation: DEFAULT_REMEDIATIONS["LP2"]
      });
    }
  } else if (Array.isArray(allowedTools)) {
    if (allowedTools.some((t) => t === "*" || t === "all")) {
      findings.push({
        ruleId: "LP2",
        message: "Wildcard permission in allowed-tools list",
        severity: "HIGH",
        category: "MCP Least Privilege" /* MCP_LEAST_PRIVILEGE */,
        file: fileName,
        line: 1,
        matchedText: "wildcard tool permission list",
        confidence: 0.95,
        explanation: DEFAULT_EXPLANATIONS["LP2"],
        remediation: DEFAULT_REMEDIATIONS["LP2"]
      });
    }
  }
  return findings;
}

// src/core/security-scoring.ts
var SEVERITY_POINTS = {
  CRITICAL: 50,
  HIGH: 25,
  MEDIUM: 10,
  LOW: 5,
  INFO: 0
};
var DIMINISHING_WEIGHTS = [1, 0.5, 0.25];
var MAX_OCCURRENCES_PER_RULE = DIMINISHING_WEIGHTS.length;
var RISK_THRESHOLD = 50;
var SEVERITY_RANK = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4
};
function computeRiskScore(findings, hasExecutableScripts = false, scriptFiles = new Set) {
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.ruleId !== b.ruleId) {
      return a.ruleId.localeCompare(b.ruleId);
    }
    const rankA = SEVERITY_RANK[a.severity] ?? 4;
    const rankB = SEVERITY_RANK[b.severity] ?? 4;
    return rankA - rankB;
  });
  const ruleCounts = new Map;
  let totalScore = 0;
  for (const f of sortedFindings) {
    const rawConf = typeof f.confidence === "number" ? f.confidence : 1;
    const conf = Math.max(0, Math.min(1, rawConf));
    if (conf <= 0)
      continue;
    const basePoints = SEVERITY_POINTS[f.severity] ?? 5;
    const count = ruleCounts.get(f.ruleId) ?? 0;
    ruleCounts.set(f.ruleId, count + 1);
    if (count >= MAX_OCCURRENCES_PER_RULE) {
      continue;
    }
    const weight = DIMINISHING_WEIGHTS[count];
    let contribution = basePoints * weight * conf;
    if (hasExecutableScripts && scriptFiles.has(f.file)) {
      contribution *= 1.3;
    }
    totalScore += contribution;
  }
  let scoreFloor = 0;
  for (const f of sortedFindings) {
    const conf = typeof f.confidence === "number" ? f.confidence : 1;
    if (f.severity === "CRITICAL" && conf >= 0.7) {
      scoreFloor = Math.max(scoreFloor, 51);
    } else if (["TM1", "SC2", "AR3", "SSRF1"].includes(f.ruleId)) {
      scoreFloor = Math.max(scoreFloor, 51);
    }
  }
  const finalScore = Math.min(100, Math.max(scoreFloor, Math.floor(totalScore)));
  let severity;
  let recommendation;
  if (finalScore <= 20) {
    severity = "LOW";
    recommendation = "APPROVE";
  } else if (finalScore < RISK_THRESHOLD) {
    severity = "MEDIUM";
    recommendation = "CAUTION";
  } else if (finalScore <= 75) {
    severity = "HIGH";
    recommendation = "REJECT";
  } else {
    severity = "CRITICAL";
    recommendation = "REJECT";
  }
  return {
    riskScore: finalScore,
    severity,
    recommendation
  };
}

// src/core/security.ts
function parseSkillFrontmatter(content) {
  if (!content.startsWith(`---
`) && !content.startsWith(`---\r
`)) {
    return null;
  }
  const endMatch = content.slice(4).match(/(?:^|\r?\n)---(?:\r?\n|$)/);
  if (!endMatch || endMatch.index === undefined) {
    return null;
  }
  const yamlBlock = content.slice(4, 4 + endMatch.index);
  try {
    const parsed = $parse(yamlBlock);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    const result = {};
    for (const line of yamlBlock.split(/\r?\n/)) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const k = line.slice(0, colonIdx).trim();
        const v = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        result[k] = v;
      }
    }
    return result;
  }
  return null;
}
function scanSkillText(content, fileRel, options) {
  const isScript = options?.isScript ?? false;
  const manifest = options?.skillManifest ?? null;
  const findings = [];
  const lines = content.split(/\r?\n/);
  function getLineContext(lineNum) {
    const idx = Math.max(0, lineNum - 1);
    const extraLines = [];
    if (idx < lines.length && lines[idx].trim().startsWith("|")) {
      let curr = idx;
      while (curr >= 0 && lines[curr].trim().startsWith("|")) {
        curr--;
      }
      if (curr + 1 <= idx && curr + 1 < lines.length) {
        extraLines.push(lines[curr + 1]);
      }
    }
    const start = Math.max(0, idx - 10);
    const end = Math.min(lines.length, idx + 4);
    return [...extraLines, ...lines.slice(start, end)].join(`
`);
  }
  for (let idx = 0;idx < lines.length; idx++) {
    const line = lines[idx];
    const foundZw = [];
    for (const ch of line) {
      if (ZERO_WIDTH_CHARS.has(ch)) {
        foundZw.push(ch);
      }
    }
    if (foundZw.length > 0) {
      findings.push({
        ruleId: "P2",
        message: `Concealed zero-width steganography detected (${foundZw.length} invisible chars)`,
        severity: "HIGH",
        category: "Prompt Injection" /* PROMPT_INJECTION */,
        file: fileRel,
        line: idx + 1,
        matchedText: "[ZERO_WIDTH_CHARS]",
        confidence: 0.9,
        explanation: DEFAULT_EXPLANATIONS["P2"],
        remediation: DEFAULT_REMEDIATIONS["P2"],
        context: line.slice(0, 100)
      });
    }
  }
  findings.push(...analyzeWhitespacePadding(content, fileRel));
  findings.push(...checkSupplyChainDependencies(content, fileRel));
  findings.push(...checkLanguageDeserialization(content, fileRel));
  for (const rule of PATTERNS_DATABASE) {
    for (const { regex: patStr, confidence } of rule.patterns) {
      const reg = new RegExp(patStr, "gim");
      let match;
      while ((match = reg.exec(content)) !== null) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        if (!isScript && isDirectlyProhibited(content, matchStart, matchEnd)) {
          continue;
        }
        const lineNum = content.slice(0, matchStart).split(`
`).length;
        const matchedSnippet = match[0].slice(0, 120);
        const context = getLineContext(lineNum);
        findings.push({
          ruleId: rule.ruleId,
          message: rule.name,
          severity: rule.severity,
          category: rule.category,
          file: fileRel,
          line: lineNum,
          matchedText: matchedSnippet,
          confidence,
          explanation: DEFAULT_EXPLANATIONS[rule.ruleId] || "",
          remediation: DEFAULT_REMEDIATIONS[rule.ruleId] || "",
          context
        });
      }
    }
  }
  if (isScript || fileRel.endsWith(".py")) {
    findings.push(...analyzeBehavioralSinks(content, fileRel, isScript));
  }
  if (fileRel.endsWith("SKILL.md") && manifest) {
    findings.push(...checkLeastPrivilegeFrontmatter(manifest, fileRel));
  }
  return findings;
}
function scanSkillDirectory(skillDirArg) {
  const skillDir = join5(skillDirArg);
  const skillMdPath = join5(skillDir, "SKILL.md");
  let skillName = basename(skillDir);
  let manifest = null;
  if (existsSync4(skillMdPath)) {
    try {
      const content = readFileSync3(skillMdPath, "utf-8");
      manifest = parseSkillFrontmatter(content);
      if (manifest && typeof manifest.name === "string") {
        skillName = manifest.name;
      }
    } catch {}
  }
  const allFindings = [];
  let filesAnalyzed = 0;
  const scriptFiles = new Set;
  function walk(currentDir) {
    const entries = readdirSync2(currentDir).sort();
    for (const entry of entries) {
      const fullPath = join5(currentDir, entry);
      const relPath = relative3(skillDir, fullPath).replace(/\\/g, "/");
      if (shouldExcludeSkillFile(relPath)) {
        continue;
      }
      const stat = lstatSync3(fullPath);
      if (stat.isSymbolicLink()) {
        allFindings.push({
          ruleId: "SC9",
          message: "Symbolic link cannot be safely packaged",
          severity: "HIGH",
          category: "Supply Chain" /* SUPPLY_CHAIN */,
          file: relPath,
          line: 1,
          matchedText: relPath,
          confidence: 1,
          explanation: DEFAULT_EXPLANATIONS["SC9"],
          remediation: DEFAULT_REMEDIATIONS["SC9"]
        });
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!stat.isFile()) {
        continue;
      }
      filesAnalyzed++;
      const dotIdx = entry.lastIndexOf(".");
      const ext = dotIdx !== -1 ? entry.slice(dotIdx).toLowerCase() : "";
      let contentBytes;
      try {
        contentBytes = readFileSync3(fullPath);
      } catch (err) {
        throw new Error(`cannot inspect ${relPath}`);
      }
      if (isSafeBinaryAsset(ext, contentBytes)) {
        continue;
      }
      let isBinary = false;
      let textContent = "";
      try {
        textContent = new TextDecoder("utf-8", { fatal: true }).decode(contentBytes);
        if (textContent.includes("\x00")) {
          isBinary = true;
        }
      } catch {
        isBinary = true;
      }
      if (ext === ".pyo" || isBinary) {
        allFindings.push({
          ruleId: ext === ".pyo" ? "SC8" : "SC9",
          message: `Unreviewable executable or binary asset: ${relPath}`,
          severity: "HIGH",
          category: "Supply Chain" /* SUPPLY_CHAIN */,
          file: relPath,
          line: 1,
          matchedText: relPath,
          confidence: 1,
          explanation: DEFAULT_EXPLANATIONS[ext === ".pyo" ? "SC8" : "SC9"],
          remediation: DEFAULT_REMEDIATIONS[ext === ".pyo" ? "SC8" : "SC9"]
        });
        continue;
      }
      const isScript = isScriptFile(relPath, textContent, stat.mode);
      if (isScript) {
        scriptFiles.add(relPath);
      }
      allFindings.push(...scanSkillText(textContent, relPath, {
        isScript,
        skillManifest: relPath === "SKILL.md" ? manifest : null
      }));
    }
  }
  walk(skillDir);
  const evalResult = computeRiskScore(allFindings, scriptFiles.size > 0, scriptFiles);
  const highRisk = allFindings.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH");
  const passed = (evalResult.recommendation === "APPROVE" || evalResult.recommendation === "CAUTION") && evalResult.riskScore < RISK_THRESHOLD && !highRisk;
  return {
    targetPath: skillDir,
    skillName,
    riskScore: evalResult.riskScore,
    severity: evalResult.severity,
    recommendation: evalResult.recommendation,
    findings: allFindings,
    filesAnalyzed,
    passed
  };
}
function formatSecurityReportTerminal(report) {
  const lines = [];
  lines.push("=================================================================");
  lines.push(`  SKILL SECURITY SCAN: ${report.skillName}`);
  lines.push(`  Target: ${report.targetPath}`);
  lines.push(`  Files Analyzed: ${report.filesAnalyzed}`);
  lines.push("-----------------------------------------------------------------");
  const statusIcon = report.passed ? "✓" : "✗";
  lines.push(`  Verdict:        [${statusIcon}] ${report.recommendation}`);
  lines.push(`  Risk Score:     ${report.riskScore} / 100`);
  lines.push(`  Severity Band:  ${report.severity}`);
  lines.push("=================================================================");
  if (report.findings.length === 0) {
    lines.push(`
  [OK] No security vulnerabilities or malicious patterns detected.`);
    return lines.join(`
`);
  }
  lines.push(`
  Findings (${report.findings.length}):`);
  for (let idx = 0;idx < report.findings.length; idx++) {
    const f = report.findings[idx];
    lines.push(`
  [${idx + 1}] [${f.severity}] ${f.ruleId}: ${f.message}`);
    lines.push(`      Category: ${f.category}`);
    lines.push(`      Location: ${f.file}:${f.line}`);
    lines.push(`      Matched:  ${f.matchedText}`);
    if (f.explanation)
      lines.push(`      Why:      ${f.explanation}`);
    if (f.remediation)
      lines.push(`      Fix:      ${f.remediation}`);
  }
  return lines.join(`
`);
}
function formatSecurityReportJson(report) {
  return JSON.stringify(report, null, 2);
}
function formatSecurityReportSarif(report) {
  const rulesMap = new Map;
  const results = [];
  for (const f of report.findings) {
    if (!rulesMap.has(f.ruleId)) {
      rulesMap.set(f.ruleId, {
        id: f.ruleId,
        name: f.ruleId,
        shortDescription: { text: f.message },
        fullDescription: { text: f.explanation || f.message },
        help: { text: f.remediation || "Review code for security risks." },
        defaultConfiguration: {
          level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : "warning"
        },
        properties: {
          category: f.category,
          precision: "high",
          "security-severity": f.severity === "CRITICAL" ? "9.0" : f.severity === "HIGH" ? "7.0" : "4.0"
        }
      });
    }
    results.push({
      ruleId: f.ruleId,
      level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : "warning",
      message: { text: `${f.message}: ${f.explanation || ""}` },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: f.file },
            region: { startLine: f.line }
          }
        }
      ]
    });
  }
  const sarifData = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "omni-skill-security-scanner",
            version: "2.0.0",
            informationUri: "https://github.com/imMamdouhaboammar/omni-skill",
            rules: Array.from(rulesMap.values())
          }
        },
        results
      }
    ]
  };
  return JSON.stringify(sarifData, null, 2);
}
export {
  PatternCategory,
  buildExecutionDag,
  classifyIntent,
  compileOmniSkillSpec,
  computeRiskScore,
  detectHost,
  formatSecurityReportJson,
  formatSecurityReportSarif,
  formatSecurityReportTerminal,
  generateAdapter,
  isDirectlyProhibited,
  isSafeBinaryAsset,
  isScriptFile,
  loadSkillDirectory,
  parseSkillMarkdown,
  routeRequest,
  sanitizeDiagnosticPath,
  sanitizeFsError,
  scanSkillDirectory,
  scanSkillText,
  shouldExcludeSkillFile,
  validateSkillDirectory
};
