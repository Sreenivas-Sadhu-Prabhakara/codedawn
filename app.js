/* ============================================================
   codedawn — a fresh code lesson every morning.
   100% client-side. No network. No dependencies. State in localStorage.

   HONESTY: codedawn does NOT call an AI or generate code on the fly.
   It deterministically SELECTS and presents one lesson from a hand-
   authored, hand-verified corpus, seeded by today's calendar date.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ============================================================
     THE CORPUS — hand-authored, hand-verified lessons.
     Each: { id, title, lang, topic, level, concept, code, lines[],
             why, challenge, answer }
     `lines` are plain-English teaching points, ideally keyed to the code.
     ============================================================ */
  var CORPUS = [
    {
      id: "js-debounce",
      title: "Debounce a noisy event",
      lang: "js", topic: "Async", level: "Intermediate",
      concept: "Debouncing collapses a burst of rapid calls into one call that runs only after things go quiet — ideal for keystrokes or resize events.",
      code:
"function debounce(fn, ms) {\n" +
"  let timer;\n" +
"  return function (...args) {\n" +
"    clearTimeout(timer);\n" +
"    timer = setTimeout(() => fn.apply(this, args), ms);\n" +
"  };\n" +
"}\n" +
"\n" +
"const onSearch = debounce((q) => fetchResults(q), 300);",
      lines: [
        "The outer function returns a NEW function that closes over `timer`.",
        "Every call clears the pending timer, so only the last call in a burst survives.",
        "`fn.apply(this, args)` preserves both the caller's `this` and its arguments.",
        "Nothing runs until 300ms of silence — the search fires once, not on every key."
      ],
      why: "A search box that fires on every keystroke can hammer your server with dozens of requests per word. Debounce turns that into a single request when the user pauses — less load, fewer race conditions, smoother UX.",
      challenge: "How would you add a `leading` option so the FIRST call fires immediately, then the rest are debounced?",
      answer: "Track whether a timer is currently pending. If none is pending and `leading` is true, call `fn` right away; either way, set a timer that clears the pending flag after `ms`. That gives you an immediate first response plus a quiet-period trailing guard."
    },
    {
      id: "js-optional-chaining",
      title: "Optional chaining and nullish coalescing",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "`?.` short-circuits to `undefined` instead of throwing on a missing property, and `??` supplies a fallback only for `null`/`undefined` (not for `0` or `\"\"`).",
      code:
"const user = { profile: { name: 'Ada' } };\n" +
"\n" +
"const city = user?.address?.city ?? 'Unknown';\n" +
"// no crash on missing address -> 'Unknown'\n" +
"\n" +
"const count = 0;\n" +
"const shown = count ?? 10;   // 0  (kept!)\n" +
"const wrong = count || 10;   // 10 (bug: 0 is falsy)",
      lines: [
        "`user?.address` is `undefined` because `address` doesn't exist — and `?.` stops there instead of throwing.",
        "`?? 'Unknown'` fills in only because the left side was nullish.",
        "`count ?? 10` keeps `0`, because `0` is defined — `??` only catches null/undefined.",
        "`count || 10` wrongly replaces `0` with `10`, because `||` treats every falsy value the same."
      ],
      why: "The classic bug is using `||` for defaults and silently discarding legitimate `0`, empty string, or `false`. Reaching for `??` when you mean 'only if missing' prevents a whole family of hard-to-spot errors.",
      challenge: "What does `0 ?? false ?? 'x'` evaluate to, and why?",
      answer: "It evaluates to `0`. `??` returns its left operand whenever that operand is neither `null` nor `undefined`. `0` is defined, so evaluation stops immediately and never looks at `false` or `'x'`."
    },
    {
      id: "py-comprehension",
      title: "List comprehensions over loops",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "A comprehension builds a list in one readable expression, filtering and transforming in a single pass — clearer and usually faster than an append loop.",
      code:
"nums = [1, 2, 3, 4, 5, 6]\n" +
"\n" +
"# transform + filter in one expression\n" +
"squares_of_evens = [n * n for n in nums if n % 2 == 0]\n" +
"# -> [4, 16, 36]\n" +
"\n" +
"# dict comprehension\n" +
"lengths = {w: len(w) for w in ['hi', 'there']}\n" +
"# -> {'hi': 2, 'there': 5}",
      lines: [
        "`for n in nums` walks the source; `if n % 2 == 0` keeps only evens.",
        "`n * n` is the output expression, applied to each kept item.",
        "The whole thing is one allocation — no `result = []` then `.append` boilerplate.",
        "The same shape works for dicts (`{k: v for ...}`) and sets (`{x for ...}`)."
      ],
      why: "Comprehensions read like the math they express and avoid the off-by-one and accidental-mutation bugs that creep into manual loops. Reviewers scan them faster because intent and result sit in one line.",
      challenge: "Rewrite this as a comprehension: build a flat list of all (row, col) pairs for a 3x3 grid.",
      answer: "`pairs = [(r, c) for r in range(3) for c in range(3)]`. Nested `for` clauses read left-to-right, outer loop first — exactly the order you'd write nested loops — producing all 9 coordinate tuples."
    },
    {
      id: "ts-discriminated-union",
      title: "Discriminated unions for safe state",
      lang: "ts", topic: "Types", level: "Intermediate",
      concept: "Give each variant a shared literal 'tag' field; TypeScript then narrows the type inside a switch, so you can only touch the fields that actually exist.",
      code:
"type Result =\n" +
"  | { status: 'loading' }\n" +
"  | { status: 'error'; message: string }\n" +
"  | { status: 'ok'; data: string[] };\n" +
"\n" +
"function render(r: Result): string {\n" +
"  switch (r.status) {\n" +
"    case 'loading': return 'Loading...';\n" +
"    case 'error':   return r.message;      // narrowed\n" +
"    case 'ok':      return r.data.join(); // narrowed\n" +
"  }\n" +
"}",
      lines: [
        "`status` is the discriminant — a literal type unique to each variant.",
        "Inside `case 'error'`, TS knows `message` exists, so `r.message` type-checks.",
        "Inside `case 'ok'`, only `data` is available — touching `r.message` would be a compile error.",
        "Add a fourth variant and TS flags every switch that forgot to handle it (with `never`)."
      ],
      why: "This models 'impossible states are unrepresentable': you can't accidentally read `data` while still loading, because the type doesn't have it there. It replaces a pile of nullable flags with a single, exhaustive shape.",
      challenge: "How do you make TypeScript force you to handle every new variant at compile time?",
      answer: "Add a `default` branch that assigns `r` to a `const _exhaustive: never = r;`. If a new variant is added and not handled, `r` won't be `never` there, so the assignment fails to compile — a built-in exhaustiveness check."
    },
    {
      id: "js-closure-loop",
      title: "The classic loop-closure trap",
      lang: "js", topic: "Gotchas", level: "Intermediate",
      concept: "`var` is function-scoped, so callbacks created in a loop all close over the SAME variable. `let` creates a fresh binding per iteration and fixes it.",
      code:
"// BUG: prints 3, 3, 3\n" +
"for (var i = 0; i < 3; i++) {\n" +
"  setTimeout(() => console.log(i), 0);\n" +
"}\n" +
"\n" +
"// FIX: prints 0, 1, 2\n" +
"for (let i = 0; i < 3; i++) {\n" +
"  setTimeout(() => console.log(i), 0);\n" +
"}",
      lines: [
        "With `var`, there is exactly one `i`; by the time the timeouts run, the loop finished and `i` is 3.",
        "All three arrow functions read that same final `i` — hence 3, 3, 3.",
        "With `let`, each iteration gets its OWN `i`, captured at that moment.",
        "So the closures see 0, 1, 2 — the values as they were when scheduled."
      ],
      why: "This bug shows up constantly with event handlers and timers built inside loops. Understanding per-iteration binding is the difference between three buttons that all do the same thing and three that behave correctly.",
      challenge: "Before `let` existed, how did people fix this with `var`?",
      answer: "Wrap the body in an IIFE that takes `i` as a parameter: `(function(j){ setTimeout(() => console.log(j), 0); })(i);`. Passing `i` as an argument copies its current value into a fresh local `j`, giving each closure its own captured value."
    },
    {
      id: "py-enumerate",
      title: "enumerate instead of range(len(...))",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "`enumerate` yields index and item together, so you never index back into the list — cleaner and immune to off-by-one mistakes.",
      code:
"colors = ['red', 'green', 'blue']\n" +
"\n" +
"# not this:\n" +
"# for i in range(len(colors)):\n" +
"#     print(i, colors[i])\n" +
"\n" +
"for i, color in enumerate(colors):\n" +
"    print(i, color)\n" +
"\n" +
"# start counting at 1:\n" +
"for rank, color in enumerate(colors, start=1):\n" +
"    print(rank, color)",
      lines: [
        "`enumerate(colors)` yields `(0, 'red')`, `(1, 'green')`, `(2, 'blue')`.",
        "Tuple unpacking gives you `i` and `color` directly — no `colors[i]` lookup.",
        "`start=1` shifts the counter, handy for human-facing rankings.",
        "You never compute `len` or index manually, so an off-by-one is impossible."
      ],
      why: "`range(len(x))` then `x[i]` is a code smell in Python: it's noisier and it's how index bugs slip in. `enumerate` states 'I want position and value' directly, which is what you almost always mean.",
      challenge: "How would you enumerate two lists in lockstep with a shared index?",
      answer: "Combine `enumerate` with `zip`: `for i, (a, b) in enumerate(zip(list_a, list_b)):`. `zip` pairs the two lists element-wise, and `enumerate` adds the running index around each pair."
    },
    {
      id: "algo-binary-search",
      title: "Binary search without overflow",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "On a sorted array, halve the search space each step for O(log n) lookups. Compute the midpoint carefully to stay correct on large inputs.",
      code:
"function binarySearch(arr, target) {\n" +
"  let lo = 0, hi = arr.length - 1;\n" +
"  while (lo <= hi) {\n" +
"    const mid = lo + ((hi - lo) >> 1);  // no overflow\n" +
"    if (arr[mid] === target) return mid;\n" +
"    if (arr[mid] < target) lo = mid + 1;\n" +
"    else hi = mid - 1;\n" +
"  }\n" +
"  return -1;\n" +
"}",
      lines: [
        "`lo <= hi` (not `<`) is required so a single remaining element is still checked.",
        "`lo + ((hi - lo) >> 1)` avoids the `(lo + hi)` sum overflowing in languages with fixed ints.",
        "On a miss, move the bound PAST mid (`mid + 1` / `mid - 1`) or you loop forever.",
        "20 steps is enough to search a million sorted items — that's the power of log n."
      ],
      why: "Binary search is deceptively hard to get right: the two most common bugs are an infinite loop (bounds not moving past mid) and a missed final element (`<` instead of `<=`). Getting the invariant right once and reusing it saves hours.",
      challenge: "Modify it to return the insertion index (leftmost position) when the target is absent.",
      answer: "Drop the equality early-return and search for the boundary: keep `lo`/`hi` but on `arr[mid] < target` set `lo = mid + 1`, else `hi = mid`. Loop while `lo < hi`; when it ends, `lo` is the leftmost index where `target` could be inserted to keep the array sorted."
    },
    {
      id: "py-fstring",
      title: "f-strings and the =debug form",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "f-strings interpolate expressions inline and support format specs; the `=` suffix prints both the expression text and its value for quick debugging.",
      code:
"name, score = 'Ada', 0.8125\n" +
"\n" +
"print(f'{name} scored {score:.1%}')\n" +
"# Ada scored 81.2%\n" +
"\n" +
"total = 1234567\n" +
"print(f'{total:,}')      # 1,234,567\n" +
"\n" +
"x = 42\n" +
"print(f'{x = }')          # x = 42",
      lines: [
        "`{score:.1%}` formats a fraction as a percentage with one decimal.",
        "`{total:,}` inserts thousands separators without any manual string work.",
        "`{x = }` (the debug form) prints `x = 42` — the name AND value.",
        "Any Python expression can go inside the braces, not just variables."
      ],
      why: "Format specs replace fragile manual string concatenation and rounding. The `=` debug form (Python 3.8+) is a tiny superpower for print-debugging — you never again mislabel which variable you printed.",
      challenge: "How would you right-align a number in a field 8 characters wide, padded with zeros?",
      answer: "Use `f'{n:08d}'`. The `0` sets the fill character, `8` the total width, and `d` formats an integer — so `f'{42:08d}'` yields `'00000042'`. Swap `0` for a space (or omit it) to pad with spaces instead."
    },
    {
      id: "algo-two-pointer",
      title: "Two-pointer sum on a sorted array",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "When an array is sorted, converging pointers from both ends find a target pair in O(n) time and O(1) space — no hash set needed.",
      code:
"function twoSum(sorted, target) {\n" +
"  let lo = 0, hi = sorted.length - 1;\n" +
"  while (lo < hi) {\n" +
"    const s = sorted[lo] + sorted[hi];\n" +
"    if (s === target) return [lo, hi];\n" +
"    if (s < target) lo++;   // need bigger\n" +
"    else hi--;              // need smaller\n" +
"  }\n" +
"  return null;\n" +
"}",
      lines: [
        "Start wide: smallest at `lo`, largest at `hi`.",
        "If the sum is too small, the only way up is to move `lo` right (bigger number).",
        "If it's too big, move `hi` left (smaller number).",
        "Each step eliminates one element, so the whole scan is linear."
      ],
      why: "The brute-force pair search is O(n²). Exploiting sortedness with two pointers is a foundational technique that reappears in interval merging, container-with-most-water, and dedup problems.",
      challenge: "Why does moving only one pointer never skip a valid pair?",
      answer: "Because the array is sorted, if `sorted[lo] + sorted[hi]` is too small, EVERY sum using `sorted[lo]` with a smaller partner is also too small — so `lo` can never be part of the answer with anything left of `hi`. Discarding it loses no valid pair. The symmetric argument holds for moving `hi`."
    },
    {
      id: "js-map-vs-object",
      title: "Map over object for keyed data",
      lang: "js", topic: "Data structures", level: "Intermediate",
      concept: "A `Map` keeps insertion order, allows any key type, has a real `size`, and won't collide with prototype keys like `__proto__` or `toString`.",
      code:
"const counts = new Map();\n" +
"for (const word of text.split(' ')) {\n" +
"  counts.set(word, (counts.get(word) ?? 0) + 1);\n" +
"}\n" +
"\n" +
"counts.size;              // real count\n" +
"counts.has('toString');   // false, no pollution\n" +
"\n" +
"const byId = new Map();\n" +
"byId.set(userObject, 'meta');  // object as key!",
      lines: [
        "`Map.get` / `Map.set` never trip over inherited property names.",
        "`.size` is a direct property — no `Object.keys(obj).length` dance.",
        "Keys can be objects or any value, not just strings/symbols.",
        "Iteration order is guaranteed to be insertion order."
      ],
      why: "Plain objects used as dictionaries have sharp edges: `obj['toString']` already exists, numeric keys get stringified, and there's no clean size. For dynamic keyed collections, `Map` is the tool that matches intent.",
      challenge: "When is a plain object still the better choice than a Map?",
      answer: "When the keys are a fixed, known set of strings and you want easy JSON serialization, object-literal syntax, or destructuring — e.g. a config record or a function's named options. `JSON.stringify` handles objects natively but ignores `Map` contents, so objects win for plain data you serialize."
    },
    {
      id: "py-default-arg",
      title: "The mutable default argument trap",
      lang: "py", topic: "Gotchas", level: "Intermediate",
      concept: "Default argument values are evaluated ONCE at function definition, not per call — so a mutable default like `[]` is shared across every call.",
      code:
"# BUG: the list persists between calls\n" +
"def append_bug(x, acc=[]):\n" +
"    acc.append(x)\n" +
"    return acc\n" +
"\n" +
"append_bug(1)   # [1]\n" +
"append_bug(2)   # [1, 2]  <- surprise!\n" +
"\n" +
"# FIX: use None as the sentinel\n" +
"def append_ok(x, acc=None):\n" +
"    if acc is None:\n" +
"        acc = []\n" +
"    acc.append(x)\n" +
"    return acc",
      lines: [
        "`acc=[]` creates ONE list when the `def` runs, and every call reuses it.",
        "So calls accumulate — a stateful function you never intended.",
        "The fix: default to `None`, then build a fresh list inside the body.",
        "Now each call starts clean, because the `[]` runs per-call."
      ],
      why: "This is one of Python's most infamous gotchas and a real source of production bugs, especially in caches and accumulators. The `None`-sentinel pattern is the idiomatic, safe default for any mutable argument.",
      challenge: "Does this trap apply to a default of `acc=()` (an empty tuple)?",
      answer: "No. Tuples are immutable, so even though the same tuple object is shared across calls, nothing can mutate it — there's no way to accumulate state. The trap only bites mutable defaults like lists, dicts, and sets."
    },
    {
      id: "js-async-await-parallel",
      title: "Run async work in parallel, not serially",
      lang: "js", topic: "Async", level: "Intermediate",
      concept: "Awaiting promises one at a time makes independent work run in sequence. Start them all first, then await together with `Promise.all`.",
      code:
"// SLOW: 3 requests back to back\n" +
"const a = await getUser();\n" +
"const b = await getPosts();\n" +
"const c = await getStats();\n" +
"\n" +
"// FAST: all three in flight at once\n" +
"const [u, p, s] = await Promise.all([\n" +
"  getUser(), getPosts(), getStats(),\n" +
"]);",
      lines: [
        "In the slow version, `getPosts()` doesn't even START until `getUser()` resolves.",
        "Total time is the SUM of the three durations.",
        "`Promise.all` receives already-started promises and waits for all of them.",
        "Total time drops to the SLOWEST single request — they overlap."
      ],
      why: "Accidentally serial awaits are a top cause of sluggish pages: three 200ms calls become 600ms instead of 200ms. Reserve sequential awaits for when a later call genuinely needs an earlier result.",
      challenge: "What's the risk of `Promise.all` if one request fails, and what's the alternative?",
      answer: "`Promise.all` rejects as soon as ANY promise rejects, discarding the successful results. If you need every outcome regardless of individual failures, use `Promise.allSettled`, which resolves to an array of `{status, value}` / `{status, reason}` objects so you can handle successes and errors independently."
    },
    {
      id: "algo-two-crystal-balls",
      title: "The two-crystal-balls problem",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "With only two identical probes that break, jumping by √n first (then scanning linearly) beats linear search: O(√n) instead of O(n).",
      code:
"function twoCrystalBalls(breaks) {\n" +
"  const step = Math.floor(Math.sqrt(breaks.length));\n" +
"  let i = step;\n" +
"  for (; i < breaks.length; i += step) {\n" +
"    if (breaks[i]) break;   // ball 1 broke\n" +
"  }\n" +
"  i -= step;                 // back to last safe\n" +
"  for (let j = 0; j <= step && i < breaks.length; j++, i++) {\n" +
"    if (breaks[i]) return i;\n" +
"  }\n" +
"  return -1;\n" +
"}",
      lines: [
        "`breaks` is a boolean array: false, false, ..., true, true (the threshold).",
        "Ball 1 hops in √n strides until it breaks, bounding the answer to one window.",
        "Step back to the last safe floor, then ball 2 walks that √n-wide window.",
        "Two √n phases give O(√n) — better than linear, without needing binary search."
      ],
      why: "It's a classic that teaches you to reason about constrained resources (only two probes), not just asymptotic tricks. The √n jump-then-scan pattern also underlies jump search and some cache-tuning strategies.",
      challenge: "Why is √n the optimal jump size here, rather than n/4 or log n?",
      answer: "The total worst-case cost is (jumps) + (window scan) = n/step + step. Minimizing n/step + step over step (calculus or AM-GM) gives step = √n, where both terms equal √n. A bigger jump shrinks the number of hops but grows the linear scan, and vice versa — √n balances them."
    },
    {
      id: "ts-generics-identity",
      title: "Generics preserve the caller's type",
      lang: "ts", topic: "Types", level: "Intermediate",
      concept: "A type parameter lets a function work over any type while remembering the SPECIFIC type the caller passed — no `any`, no lost information.",
      code:
"function first<T>(arr: T[]): T | undefined {\n" +
"  return arr[0];\n" +
"}\n" +
"\n" +
"const n = first([1, 2, 3]);      // n: number | undefined\n" +
"const s = first(['a', 'b']);     // s: string | undefined\n" +
"\n" +
"// constrain T to things that have .length\n" +
"function longest<T extends { length: number }>(a: T, b: T): T {\n" +
"  return a.length >= b.length ? a : b;\n" +
"}",
      lines: [
        "`<T>` is a placeholder bound to whatever type the caller supplies.",
        "`first([1,2,3])` infers `T = number`, so the result is `number | undefined`.",
        "`T extends { length: number }` constrains `T` so `.length` is guaranteed to exist.",
        "The return type is still `T`, so callers get their exact input type back."
      ],
      why: "Generics are how you write reusable code WITHOUT falling back to `any` and losing all safety. `extends` constraints let you demand just the shape you use, keeping the function broad but still type-checked.",
      challenge: "Why would `function first(arr: any[]): any` be strictly worse?",
      answer: "`any` erases type information in both directions: the argument accepts anything unchecked, and the return is `any`, so downstream code loses autocomplete and type errors. The generic version accepts any array but REMEMBERS the element type, so `first([1,2,3])` is known to be `number | undefined`, not an untyped `any`."
    },
    {
      id: "js-spread-immutable",
      title: "Immutable updates with spread",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "Spread copies an object or array into a new one, letting you 'change' data by producing a fresh value instead of mutating the original.",
      code:
"const state = { user: 'Ada', theme: 'dark', count: 1 };\n" +
"\n" +
"const next = { ...state, count: state.count + 1 };\n" +
"// state is untouched; next has count: 2\n" +
"\n" +
"const list = [1, 2, 3];\n" +
"const added = [...list, 4];       // [1,2,3,4]\n" +
"const without = list.filter(n => n !== 2); // [1,3]",
      lines: [
        "`{ ...state, count: ... }` copies all keys, then overrides `count` — later keys win.",
        "The original `state` object is never modified.",
        "`[...list, 4]` builds a new array with an item appended.",
        "`filter` returns a new array, so removal is also non-mutating."
      ],
      why: "Frameworks like React detect changes by reference: mutating an object in place can leave the UI stale. Producing new values makes change detection reliable and makes state easier to reason about and undo.",
      challenge: "Why is spread only a SHALLOW copy, and when does that bite you?",
      answer: "Spread copies top-level keys but nested objects/arrays are copied by reference, so `{...state}` and `state` still share the same inner objects. Mutating `next.settings.x` also changes `state.settings.x`. For nested updates, spread each level you change: `{ ...state, settings: { ...state.settings, x: 1 } }`, or use structured cloning."
    },
    {
      id: "py-zip-star",
      title: "zip and the unzip trick",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "`zip` pairs iterables element-wise; `zip(*rows)` transposes — turning rows into columns and back.",
      code:
"names = ['Ada', 'Alan']\n" +
"ages  = [36, 41]\n" +
"\n" +
"pairs = list(zip(names, ages))\n" +
"# [('Ada', 36), ('Alan', 41)]\n" +
"\n" +
"# transpose / unzip with *\n" +
"rows = [(1, 2), (3, 4), (5, 6)]\n" +
"cols = list(zip(*rows))\n" +
"# [(1, 3, 5), (2, 4, 6)]",
      lines: [
        "`zip(names, ages)` walks both lists together into tuples.",
        "It stops at the SHORTEST input, so mismatched lengths are truncated silently.",
        "`*rows` unpacks the list of rows into separate arguments to `zip`.",
        "Zipping those columns-as-arguments transposes the matrix."
      ],
      why: "Transposing without a nested loop, pairing keys with values before `dict(zip(...))`, and iterating parallel lists are constant needs in data work. The `zip(*...)` transpose is a genuinely elegant one-liner worth knowing.",
      challenge: "How do you zip lists of different lengths WITHOUT silently dropping the extras?",
      answer: "Use `itertools.zip_longest(a, b, fillvalue=None)`. Instead of stopping at the shortest iterable, it pads the shorter ones with `fillvalue` until the longest is exhausted, so no elements are lost."
    },
    {
      id: "algo-kadane",
      title: "Maximum subarray sum (Kadane)",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "Track the best sum ending at each position: either extend the previous run or start fresh. One pass, O(n), no extra space.",
      code:
"function maxSubArray(nums) {\n" +
"  let best = nums[0];\n" +
"  let cur = nums[0];\n" +
"  for (let i = 1; i < nums.length; i++) {\n" +
"    cur = Math.max(nums[i], cur + nums[i]);\n" +
"    best = Math.max(best, cur);\n" +
"  }\n" +
"  return best;\n" +
"}\n" +
"// [-2,1,-3,4,-1,2,1,-5,4] -> 6  ([4,-1,2,1])",
      lines: [
        "`cur` is the best sum of a subarray ENDING exactly at index i.",
        "At each step you decide: extend (`cur + nums[i]`) or restart at `nums[i]`.",
        "You restart whenever the running sum has become a liability (gone negative).",
        "`best` remembers the largest `cur` ever seen across the whole scan."
      ],
      why: "Kadane's is the canonical example of dynamic programming distilled to two variables. The 'extend or restart' decision generalizes to stock-trading, max-product, and streaming problems where you can't afford to store the whole history.",
      challenge: "How would you also return the START and END indices of the winning subarray?",
      answer: "Track a tentative start: when you RESTART (`nums[i] > cur + nums[i]`), set `tentativeStart = i`. Whenever `cur` beats `best`, commit `start = tentativeStart` and `end = i`. At the end, `[start, end]` bounds the maximum subarray."
    },
    {
      id: "js-sort-numeric",
      title: "Array.sort defaults to string order",
      lang: "js", topic: "Gotchas", level: "Beginner",
      concept: "Without a comparator, `sort` converts elements to strings, so numbers sort lexicographically. Always pass `(a, b) => a - b` for numeric order.",
      code:
"[10, 2, 1, 21].sort();\n" +
"// [1, 10, 2, 21]  <- string order!\n" +
"\n" +
"[10, 2, 1, 21].sort((a, b) => a - b);\n" +
"// [1, 2, 10, 21]  correct\n" +
"\n" +
"// sort also MUTATES in place\n" +
"const copy = [...nums].sort((a, b) => a - b);",
      lines: [
        "Default `sort` stringifies: '10' < '2' because '1' < '2' character-by-character.",
        "`(a, b) => a - b` returns negative/zero/positive for ascending numeric order.",
        "`sort` mutates the original array AND returns it — a common surprise.",
        "Spread first (`[...nums]`) when you need to keep the original intact."
      ],
      why: "Sorting `[10, 2, 1]` into `[1, 10, 2]` is a bug that ships quietly because it 'looks sorted' at a glance. And in-place mutation causes spooky action at a distance when the array is shared. Two habits — always pass a comparator, copy before sorting — prevent both.",
      challenge: "Write a comparator that sorts strings case-insensitively.",
      answer: "`arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))`. `localeCompare` returns the correctly-signed comparison respecting locale rules, and lowercasing both sides first makes it case-insensitive so 'apple' and 'Apple' sort adjacently."
    },
    {
      id: "py-context-manager",
      title: "with-statements for guaranteed cleanup",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "A `with` block runs setup and teardown around your code, guaranteeing the resource is released even if an exception is raised.",
      code:
"# file is closed automatically, even on error\n" +
"with open('data.txt') as f:\n" +
"    for line in f:\n" +
"        process(line)\n" +
"# f is closed here, no matter what\n" +
"\n" +
"# multiple resources in one with\n" +
"with open('in.txt') as src, open('out.txt', 'w') as dst:\n" +
"    dst.write(src.read())",
      lines: [
        "`open(...) as f` acquires the file and binds it to `f`.",
        "When the block exits — normally OR via exception — the file is closed.",
        "No manual `try/finally: f.close()` needed; the context manager handles it.",
        "You can open several resources in one `with`, closed in reverse order."
      ],
      why: "Forgetting to close files, locks, or database connections leaks resources and, under load, exhausts file handles. `with` makes correct cleanup the default, not something you have to remember in every error path.",
      challenge: "How do you write your own context manager for a temporary setting?",
      answer: "The simplest way is the `contextlib.contextmanager` decorator on a generator: put setup code, then `yield` (optionally a value), then teardown after the yield. The code before `yield` runs on entry and the code after runs on exit — including when an exception propagates through the `with` block."
    },
    {
      id: "js-json-parse-guard",
      title: "Guard JSON.parse against bad input",
      lang: "js", topic: "Gotchas", level: "Beginner",
      concept: "`JSON.parse` throws on malformed input. Wrap it so a corrupt localStorage value or API response can't crash your whole app.",
      code:
"function safeParse(text, fallback = null) {\n" +
"  try {\n" +
"    return JSON.parse(text);\n" +
"  } catch {\n" +
"    return fallback;\n" +
"  }\n" +
"}\n" +
"\n" +
"const saved = safeParse(localStorage.getItem('prefs'), {});\n" +
"// always an object, never a thrown SyntaxError",
      lines: [
        "`JSON.parse('')` and `JSON.parse('{bad')` both throw `SyntaxError`.",
        "The `try/catch` converts that throw into a controlled `fallback`.",
        "`catch {}` (no binding) is fine when you don't need the error object.",
        "Callers get a guaranteed shape (`{}` here), simplifying downstream code."
      ],
      why: "localStorage can hold values from an older app version or a half-written write; APIs occasionally return HTML error pages instead of JSON. An unguarded parse turns those into a white screen. A tiny wrapper keeps the failure local and recoverable.",
      challenge: "Why is `if (text) JSON.parse(text)` not a sufficient guard?",
      answer: "A non-empty string can still be invalid JSON — e.g. `'undefined'`, `'{oops}'`, or a truncated write like `'{\"a\":1'`. Truthiness only rules out empty/null input, not malformed content, so a `try/catch` is still required to catch the parse error itself."
    },
    {
      id: "algo-fast-slow",
      title: "Cycle detection with fast & slow pointers",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "Advance one pointer by 1 and another by 2. If there's a loop, the fast one laps the slow one and they meet — using O(1) extra space.",
      code:
"function hasCycle(head) {\n" +
"  let slow = head, fast = head;\n" +
"  while (fast && fast.next) {\n" +
"    slow = slow.next;\n" +
"    fast = fast.next.next;\n" +
"    if (slow === fast) return true;\n" +
"  }\n" +
"  return false;\n" +
"}",
      lines: [
        "`slow` moves one node per step; `fast` moves two.",
        "If the list ends, `fast` (or `fast.next`) hits null — no cycle.",
        "If there's a loop, `fast` gains on `slow` by one node each step and must collide.",
        "No visited-set needed, so memory stays constant regardless of list length."
      ],
      why: "Floyd's tortoise-and-hare detects cycles in linked lists, repeated states in sequences, and duplicate numbers — all in constant memory, where a naive visited-set is O(n). It's a beautiful example of trading a clever invariant for space.",
      challenge: "Once you detect a cycle, how do you find the node where the loop STARTS?",
      answer: "After `slow` and `fast` meet, reset one pointer to `head` and advance both one step at a time. They meet again exactly at the cycle's entry node. This works because the distance from the head to the loop start equals the distance from the meeting point to the loop start (mod the loop length)."
    },
    {
      id: "js-truthy-coercion",
      title: "Falsy values and == vs ===",
      lang: "js", topic: "Gotchas", level: "Beginner",
      concept: "JavaScript has exactly eight falsy values; `==` performs type coercion with surprising results, while `===` compares without coercion.",
      code:
"// the falsy set:\n" +
"// false, 0, -0, 0n, '', null, undefined, NaN\n" +
"\n" +
"0 == '';        // true  (coerced)\n" +
"0 == '0';       // true\n" +
"'' == '0';      // false (!)\n" +
"null == undefined;  // true\n" +
"NaN === NaN;    // false — use Number.isNaN\n" +
"\n" +
"if (value === undefined) { /* explicit */ }",
      lines: [
        "Everything not in the falsy set is truthy — including `'0'`, `[]`, and `{}`.",
        "`==` coerces operands to a common type first, producing non-transitive results.",
        "`0 == ''` and `0 == '0'` are true, yet `'' == '0'` is false — coercion isn't transitive.",
        "`NaN` is never equal to anything, even itself; test with `Number.isNaN(x)`."
      ],
      why: "The `==` coercion table is a minefield that has caused real security and logic bugs. Defaulting to `===` (and `Number.isNaN`) removes the guesswork; the only common exception is `x == null` to catch both null and undefined at once.",
      challenge: "Why is `[] == ![]` true, which looks contradictory?",
      answer: "`![]` is `false` (an empty array is truthy, so negating gives false). Then `[] == false` coerces both to numbers: `false` becomes `0`, and `[]` becomes `''` then `0`. So it reduces to `0 == 0`, which is true. It's a textbook demonstration of why coercion-based equality is best avoided."
    },
    {
      id: "py-generator",
      title: "Generators for lazy, memory-light streams",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "A generator function `yield`s values one at a time, computing them on demand — so you can process huge or infinite sequences without holding them in memory.",
      code:
"def read_large(path):\n" +
"    with open(path) as f:\n" +
"        for line in f:\n" +
"            yield line.strip()\n" +
"\n" +
"# only one line is in memory at a time\n" +
"for row in read_large('huge.csv'):\n" +
"    handle(row)\n" +
"\n" +
"# infinite stream, taken lazily\n" +
"def naturals():\n" +
"    n = 0\n" +
"    while True:\n" +
"        yield n\n" +
"        n += 1",
      lines: [
        "`yield` pauses the function and hands one value back to the caller.",
        "Execution resumes right after the `yield` on the next iteration.",
        "The file is read line-by-line — the whole file never loads into RAM.",
        "`naturals()` is infinite yet safe, because values are produced only when asked."
      ],
      why: "Loading a multi-gigabyte file into a list can crash a process; a generator streams it in constant memory. Generators also let you express infinite or pipelined computations naturally, composing with `itertools` for powerful, lazy data flows.",
      challenge: "How do you take just the first 5 values from the infinite `naturals()`?",
      answer: "Use `itertools.islice(naturals(), 5)`, which lazily pulls exactly 5 values and then stops — never exhausting the infinite generator. `list(islice(...))` materializes them if you need a concrete list."
    },
    {
      id: "js-array-reduce-object",
      title: "reduce to build an index",
      lang: "js", topic: "Idioms", level: "Intermediate",
      concept: "`reduce` folds an array into any shape — including a lookup object keyed by id, turning O(n) searches into O(1).",
      code:
"const users = [\n" +
"  { id: 'a', name: 'Ada' },\n" +
"  { id: 'b', name: 'Alan' },\n" +
"];\n" +
"\n" +
"const byId = users.reduce((acc, u) => {\n" +
"  acc[u.id] = u;\n" +
"  return acc;\n" +
"}, {});\n" +
"\n" +
"byId['a'].name;  // 'Ada' — instant lookup\n" +
"// modern shortcut:\n" +
"const m = Object.fromEntries(users.map(u => [u.id, u]));",
      lines: [
        "The `{}` seed is the accumulator that grows into the index.",
        "Each step attaches one user under its id and returns the accumulator.",
        "The result maps id -> user, so lookups are direct property access.",
        "`Object.fromEntries(map(...))` is a cleaner one-liner for the same result."
      ],
      why: "Repeatedly calling `arr.find(u => u.id === x)` inside a loop is a hidden O(n²). Building an index once up front makes every subsequent lookup constant-time — a common, high-impact optimization for joins and de-duplication.",
      challenge: "When would `Object.groupBy` (or a Map) be a better fit than this index?",
      answer: "When multiple items share the same key. This index overwrites, keeping only the last user per id. If ids repeat and you want ALL matches, group into arrays instead — `Object.groupBy(users, u => u.id)` (or a Map of id -> array) collects every item under its key."
    },
    {
      id: "algo-quickselect",
      title: "Quickselect: kth smallest in O(n) average",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "Like quicksort, but recurse into only ONE side of the pivot. That drops the average cost from O(n log n) to O(n) when you just need the kth element.",
      code:
"function quickselect(arr, k) {          // k is 0-based\n" +
"  let lo = 0, hi = arr.length - 1;\n" +
"  while (lo < hi) {\n" +
"    const p = partition(arr, lo, hi);   // pivot index\n" +
"    if (p === k) return arr[p];\n" +
"    if (p < k) lo = p + 1;              // go right\n" +
"    else hi = p - 1;                    // go left\n" +
"  }\n" +
"  return arr[lo];\n" +
"}",
      lines: [
        "`partition` places the pivot at its final sorted index `p` and returns it.",
        "If `p === k`, the pivot IS the kth smallest — done.",
        "Otherwise recurse into only the side that contains index k.",
        "Ignoring the other half is what beats a full sort: work halves on average."
      ],
      why: "Finding a median or a top-k threshold with a full sort is wasteful. Quickselect gives the answer in linear time on average, and it's the engine behind efficient median-of-medians and percentile computations.",
      challenge: "What's quickselect's worst case, and how do you avoid it?",
      answer: "With adversarial input and a bad pivot (e.g. always the last element on already-sorted data), partitions become maximally unbalanced and it degrades to O(n²). Choosing a random pivot — or the median-of-medians pivot — makes the bad case astronomically unlikely (or guarantees O(n) worst case, respectively)."
    },
    {
      id: "js-event-delegation",
      title: "Event delegation for dynamic lists",
      lang: "js", topic: "DOM", level: "Intermediate",
      concept: "Attach ONE listener to a parent and read `event.target`. It handles clicks on children that don't even exist yet, and scales to thousands of rows.",
      code:
"list.addEventListener('click', (e) => {\n" +
"  const btn = e.target.closest('[data-remove]');\n" +
"  if (!btn) return;                 // click wasn't on a remove button\n" +
"  const id = btn.dataset.remove;\n" +
"  removeItem(id);\n" +
"});",
      lines: [
        "One listener on the parent `list`, not one per row.",
        "`e.target` is where the click landed; `.closest(selector)` walks up to the button.",
        "`if (!btn) return` ignores clicks that weren't on a remove control.",
        "Rows added LATER work automatically — no need to rebind handlers."
      ],
      why: "Binding a handler to every item wastes memory and breaks the moment you add rows dynamically (they have no listener). Delegation is the idiomatic, performant pattern for lists, tables, and any container whose children change.",
      challenge: "Which events DON'T bubble, and how do you delegate those?",
      answer: "`focus`, `blur`, `mouseenter`, and `mouseleave` don't bubble. For focus/blur, use their bubbling counterparts `focusin`/`focusout`; for the mouse pair, delegate with `mouseover`/`mouseout` (which bubble) and check `event.target`, or attach the listener with the capture phase (`{ capture: true }`)."
    },
    {
      id: "py-dict-get-setdefault",
      title: "dict.get, setdefault, and defaultdict",
      lang: "py", topic: "Data structures", level: "Beginner",
      concept: "`get` reads with a fallback, `setdefault` inserts-then-returns, and `defaultdict` auto-creates missing values — three ways to avoid KeyError.",
      code:
"counts = {}\n" +
"\n" +
"# get with default (read only)\n" +
"n = counts.get('x', 0)\n" +
"\n" +
"# setdefault: insert if absent, return current\n" +
"counts.setdefault('x', 0)\n" +
"counts['x'] += 1\n" +
"\n" +
"from collections import defaultdict\n" +
"groups = defaultdict(list)\n" +
"groups['a'].append(1)   # key auto-created as []",
      lines: [
        "`get('x', 0)` returns 0 for a missing key WITHOUT inserting it.",
        "`setdefault('x', 0)` inserts 0 only if absent, then returns the stored value.",
        "`defaultdict(list)` calls `list()` to create a missing value on first access.",
        "So `groups['a'].append(1)` just works, even though 'a' didn't exist."
      ],
      why: "Guarding every dictionary access with `if key in d` is verbose and error-prone. These tools express 'read with default', 'ensure present', and 'auto-initialize' directly — the backbone of counting, grouping, and accumulation code.",
      challenge: "What's the subtle difference between `get('x', [])` and `setdefault('x', [])` when building groups?",
      answer: "`get('x', [])` returns a BRAND-NEW empty list that is NOT stored in the dict, so appending to it is lost. `setdefault('x', [])` stores the list in the dict on first call and returns that same stored list, so appends persist. Use `setdefault` (or `defaultdict`) when you intend to mutate the value in place."
    },
    {
      id: "js-array-holes",
      title: "Array(n).fill before map",
      lang: "js", topic: "Gotchas", level: "Intermediate",
      concept: "`new Array(n)` creates 'holes', and `map` skips holes — so you must `fill` first (or use `Array.from`) to actually iterate.",
      code:
"new Array(3).map((_, i) => i);\n" +
"// [empty, empty, empty]  <- map skipped holes!\n" +
"\n" +
"new Array(3).fill(0).map((_, i) => i);\n" +
"// [0, 1, 2]  works\n" +
"\n" +
"Array.from({ length: 3 }, (_, i) => i);\n" +
"// [0, 1, 2]  cleanest",
      lines: [
        "`new Array(3)` makes a length-3 array with NO actual elements (sparse holes).",
        "`map`, `forEach`, and friends skip holes, so the callback never runs.",
        "`.fill(0)` writes a real value into each slot, turning holes into elements.",
        "`Array.from({length: n}, mapFn)` sidesteps the whole issue in one call."
      ],
      why: "This trips up people generating sequences: `Array(5).map(...)` silently produces empties, not the range they expected. Knowing that sparse arrays exist — and that `Array.from` is the clean generator — saves a confusing debugging session.",
      challenge: "Why does `[...new Array(3)].map((_, i) => i)` work when `.map` alone didn't?",
      answer: "Spread (`...`) iterates the array, and iteration reads every index INCLUDING holes, yielding `undefined` for each. That materializes a dense `[undefined, undefined, undefined]` with real elements, so the subsequent `.map` now visits all three and produces `[0, 1, 2]`."
    },
    {
      id: "algo-bfs-shortest",
      title: "BFS finds the shortest unweighted path",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "Breadth-first search explores a graph level by level using a queue, so the first time it reaches a node is via a shortest edge-count path.",
      code:
"function shortestPath(graph, start, goal) {\n" +
"  const queue = [[start, 0]];\n" +
"  const seen = new Set([start]);\n" +
"  while (queue.length) {\n" +
"    const [node, dist] = queue.shift();\n" +
"    if (node === goal) return dist;\n" +
"    for (const next of graph[node]) {\n" +
"      if (!seen.has(next)) {\n" +
"        seen.add(next);\n" +
"        queue.push([next, dist + 1]);\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"  return -1;\n" +
"}",
      lines: [
        "A queue (FIFO) means closer nodes are always dequeued before farther ones.",
        "`seen` is marked at ENQUEUE time, so a node is never queued twice.",
        "The first time `goal` is dequeued, its recorded `dist` is minimal.",
        "Marking on enqueue (not dequeue) is what keeps it correct and O(V+E)."
      ],
      why: "For unweighted graphs — grids, social networks, word ladders — BFS is the right tool: DFS can find A path but not the SHORTEST one. The enqueue-time visited check is the subtle detail that separates correct BFS from a subtly buggy one.",
      challenge: "Why must you mark nodes as seen when ENQUEUING, not when dequeuing?",
      answer: "If you only mark on dequeue, the same neighbor can be enqueued multiple times before it's first processed, causing duplicate work and, in dense graphs, exponential blowup. Marking on enqueue guarantees each node enters the queue exactly once, preserving the O(V+E) bound and correct shortest distances."
    },
    {
      id: "js-string-normalize",
      title: "Compare Unicode strings safely",
      lang: "js", topic: "Gotchas", level: "Advanced",
      concept: "The same visible character can have different byte sequences (composed vs decomposed). Normalize with `.normalize()` before comparing or storing.",
      code:
"const a = 'café';           // é as one code point\n" +
"const b = 'cafe\\u0301';     // e + combining accent\n" +
"\n" +
"a === b;                    // false — different bytes!\n" +
"a.length;                   // 4\n" +
"b.length;                   // 5\n" +
"\n" +
"a.normalize() === b.normalize();  // true",
      lines: [
        "`'é'` can be one precomposed code point OR 'e' plus a combining accent.",
        "They LOOK identical but are different strings, so `===` is false.",
        "Even `.length` differs, because one form has an extra combining mark.",
        "`.normalize()` (NFC by default) rewrites both to a canonical form so they match."
      ],
      why: "User input, filenames from different operating systems, and copy-pasted text arrive in mixed normalization forms. Comparing or de-duplicating them without normalizing causes 'identical' values to be treated as different — a nasty, invisible bug in search and auth.",
      challenge: "Why can `str.length` be a misleading way to count 'characters'?",
      answer: "`.length` counts UTF-16 code units, not user-perceived characters. Emoji and other astral-plane characters use two code units (a surrogate pair), and combining marks add extra units. To count real characters, iterate with `[...str]` (which respects code points) or use `Intl.Segmenter` for full grapheme clusters."
    },
    {
      id: "py-slice",
      title: "Slicing: start:stop:step and reversal",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "Slices copy a sub-sequence with `[start:stop:step]`; negative indices count from the end, and `[::-1]` reverses.",
      code:
"s = [0, 1, 2, 3, 4, 5]\n" +
"\n" +
"s[1:4]      # [1, 2, 3]   stop is exclusive\n" +
"s[:3]       # [0, 1, 2]   start defaults to 0\n" +
"s[3:]       # [3, 4, 5]   stop defaults to end\n" +
"s[-2:]      # [4, 5]      last two\n" +
"s[::2]      # [0, 2, 4]   every other\n" +
"s[::-1]     # [5,4,3,2,1,0]  reversed copy",
      lines: [
        "`stop` is exclusive: `s[1:4]` includes indices 1,2,3 but not 4.",
        "Omitting `start`/`stop` defaults to the beginning/end.",
        "Negative indices count from the right: `-2` is the second-to-last.",
        "A negative step walks backward, so `[::-1]` produces a reversed copy."
      ],
      why: "Slicing is Python's expressive workhorse for taking windows, sampling, trimming, and reversing — all without a loop. It applies uniformly to lists, tuples, strings, and any sequence, so the syntax pays off everywhere.",
      challenge: "What's the difference between `s[::-1]` and `s.reverse()`?",
      answer: "`s[::-1]` returns a NEW reversed copy and leaves `s` unchanged, so you can assign it elsewhere. `s.reverse()` reverses the list IN PLACE and returns `None`. Use the slice when you need a copy or are reversing an immutable sequence like a string/tuple; use `.reverse()` to mutate a list without allocating a copy."
    },
    {
      id: "js-tagged-template",
      title: "Number formatting with Intl",
      lang: "js", topic: "Idioms", level: "Intermediate",
      concept: "`Intl.NumberFormat` renders currency, percentages, and large numbers correctly per locale — no manual comma-insertion or rounding hacks.",
      code:
"const money = new Intl.NumberFormat('en-US', {\n" +
"  style: 'currency', currency: 'USD',\n" +
"});\n" +
"money.format(1234.5);       // '$1,234.50'\n" +
"\n" +
"new Intl.NumberFormat('en-IN').format(1234567);\n" +
"// '12,34,567'  (Indian grouping)\n" +
"\n" +
"new Intl.NumberFormat('en', {\n" +
"  notation: 'compact',\n" +
"}).format(12000);           // '12K'",
      lines: [
        "`style: 'currency'` adds the symbol and correct decimal places automatically.",
        "The locale controls digit grouping — note India's 2-3-2 grouping differs from the US.",
        "`notation: 'compact'` gives human-friendly '12K' / '3.4M' output.",
        "You build the formatter once and reuse `.format()` for performance."
      ],
      why: "Hand-rolled `toFixed` + regex comma insertion is buggy across locales and misses currency conventions entirely. `Intl` is built into the platform, handles dozens of locales correctly, and is far faster than a library for the same job.",
      challenge: "Why should you construct the `Intl.NumberFormat` once, outside a loop?",
      answer: "Creating a formatter is relatively expensive (it loads and configures locale data), while `.format()` is cheap. Building it once and reusing it inside the loop avoids repeatedly paying that setup cost — a meaningful speedup when formatting many values, e.g. every cell of a large table."
    },
    {
      id: "algo-dp-coins",
      title: "Coin change with dynamic programming",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "Build up the fewest coins for every amount from 0 to the target, reusing smaller answers. Bottom-up DP turns exponential recursion into O(amount × coins).",
      code:
"function coinChange(coins, amount) {\n" +
"  const dp = new Array(amount + 1).fill(Infinity);\n" +
"  dp[0] = 0;                       // 0 coins make 0\n" +
"  for (let a = 1; a <= amount; a++) {\n" +
"    for (const c of coins) {\n" +
"      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);\n" +
"    }\n" +
"  }\n" +
"  return dp[amount] === Infinity ? -1 : dp[amount];\n" +
"}",
      lines: [
        "`dp[a]` = fewest coins that sum to exactly `a`.",
        "Base case: `dp[0] = 0`, and everything else starts at Infinity (unreachable).",
        "For each amount, try every coin: using coin `c` costs `dp[a - c] + 1`.",
        "`Infinity` at the end means the amount can't be formed with these coins."
      ],
      why: "The greedy 'always take the biggest coin' fails for coin systems like [1,3,4] making 6 (greedy gives 4+1+1=3 coins; optimal is 3+3=2). DP guarantees the true minimum by considering every combination while only ever solving each subproblem once.",
      challenge: "Why can't you always solve coin change greedily?",
      answer: "Greedy is only correct for 'canonical' coin systems (like standard currency). For coins [1, 3, 4] and amount 6, greedy takes 4 then 1+1 (three coins), but 3+3 uses only two. Because a locally largest choice can force worse choices later, you need DP (or BFS) to explore combinations and find the global optimum."
    },
    {
      id: "ts-utility-types",
      title: "Partial, Pick, and Omit utility types",
      lang: "ts", topic: "Types", level: "Intermediate",
      concept: "Built-in utility types derive new types from existing ones, so you describe relationships instead of duplicating shapes that can drift apart.",
      code:
"interface User {\n" +
"  id: string;\n" +
"  name: string;\n" +
"  email: string;\n" +
"}\n" +
"\n" +
"type Draft = Partial<User>;             // all optional\n" +
"type PublicUser = Omit<User, 'email'>;  // drop email\n" +
"type Credentials = Pick<User, 'id'>;    // keep only id\n" +
"\n" +
"function update(id: string, patch: Partial<User>) {}",
      lines: [
        "`Partial<User>` makes every field optional — ideal for a patch/update payload.",
        "`Omit<User, 'email'>` reuses `User` minus the email, for public-facing data.",
        "`Pick<User, 'id'>` keeps only the listed keys.",
        "Change `User` and all three derived types update automatically."
      ],
      why: "Copy-pasting a slightly different interface for updates, public views, and DTOs guarantees they drift out of sync over time. Deriving them keeps a single source of truth, so adding a field to `User` propagates everywhere it should.",
      challenge: "How do you make just SOME fields optional while keeping the rest required?",
      answer: "Combine utilities: `type T = Omit<User, 'email'> & Partial<Pick<User, 'email'>>`. This keeps `id` and `name` required, then re-adds `email` as optional via `Partial<Pick<...>>`. Many codebases wrap this in a reusable `PartialBy<T, K>` helper type."
    },
    {
      id: "js-early-return",
      title: "Guard clauses over nested ifs",
      lang: "js", topic: "Patterns", level: "Beginner",
      concept: "Return early on invalid or edge cases at the top of a function, so the main logic runs unindented and the happy path is easy to read.",
      code:
"// nested — hard to follow\n" +
"function pay(order) {\n" +
"  if (order) {\n" +
"    if (order.items.length) {\n" +
"      if (order.paid) { return ship(order); }\n" +
"    }\n" +
"  }\n" +
"}\n" +
"\n" +
"// guard clauses — flat and clear\n" +
"function pay(order) {\n" +
"  if (!order) return;\n" +
"  if (!order.items.length) return;\n" +
"  if (!order.paid) return;\n" +
"  return ship(order);\n" +
"}",
      lines: [
        "The nested version buries the real action three levels deep.",
        "Guard clauses handle each failure condition up front and bail out.",
        "The 'happy path' (`ship(order)`) sits at the top indentation level.",
        "Each precondition is stated once, in order, and reads like a checklist."
      ],
      why: "Deeply nested conditionals are hard to scan and easy to get wrong when you add a case. Flattening with early returns lowers cognitive load, makes preconditions explicit, and tends to reduce bugs during later edits.",
      challenge: "When can too many guard clauses become a code smell themselves?",
      answer: "When a function accumulates many unrelated guards, it's often a sign it's doing too much or that validation belongs elsewhere (e.g. at the boundary, in the type system, or in a dedicated validator). At that point, extracting the checks or splitting the function is cleaner than a long wall of guards."
    },
    {
      id: "py-any-all",
      title: "any and all with generators",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "`any` and `all` short-circuit over an iterable, and pairing them with a generator expression reads like plain English while staying lazy.",
      code:
"nums = [2, 4, 6, 7]\n" +
"\n" +
"all(n % 2 == 0 for n in nums)   # False (7 is odd)\n" +
"any(n > 5 for n in nums)        # True  (6 and 7)\n" +
"\n" +
"# short-circuits: stops at the first decisive item\n" +
"all(x > 0 for x in big_stream)  # stops at first <= 0",
      lines: [
        "`all(...)` is True only if EVERY item passes; `any(...)` if AT LEAST ONE does.",
        "The generator `(n % 2 == 0 for n in nums)` yields booleans lazily.",
        "`all` stops at the first False; `any` stops at the first True.",
        "So on a huge stream, they may examine only a few items before answering."
      ],
      why: "`any`/`all` over a generator expresses validation and search intent in one clear line, without building an intermediate list. Their short-circuiting makes them efficient even on large or expensive-to-produce sequences.",
      challenge: "What do `all([])` and `any([])` return, and why?",
      answer: "`all([])` is True and `any([])` is False. `all` asks 'are there no counterexamples?' — vacuously true for an empty set. `any` asks 'is there at least one true element?' — false when there are none. These 'vacuous truth' defaults are the identity values that keep the operations composable."
    },
    {
      id: "js-set-operations",
      title: "Set for membership and dedup",
      lang: "js", topic: "Data structures", level: "Beginner",
      concept: "A `Set` stores unique values with O(1) `has`/`add`, making de-duplication and fast membership checks trivial.",
      code:
"const unique = [...new Set([1, 1, 2, 3, 3])];\n" +
"// [1, 2, 3]\n" +
"\n" +
"const seen = new Set();\n" +
"function firstDup(arr) {\n" +
"  for (const x of arr) {\n" +
"    if (seen.has(x)) return x;   // O(1) check\n" +
"    seen.add(x);\n" +
"  }\n" +
"  return null;\n" +
"}",
      lines: [
        "`new Set(array)` drops duplicates; spread turns it back into an array.",
        "`set.has(x)` is roughly constant time, unlike `array.includes(x)` which is O(n).",
        "Tracking a `seen` set turns duplicate detection into a single linear pass.",
        "Sets iterate in insertion order, so the dedup preserves first-seen order."
      ],
      why: "Using `array.includes` inside a loop is a silent O(n²). Swapping in a `Set` for membership tests is one of the easiest and most common performance wins, and `[...new Set(arr)]` is the canonical one-line dedup.",
      challenge: "Why can't a Set dedup objects by their contents, and what's the fix?",
      answer: "Sets compare by reference (SameValueZero), so two distinct objects with identical fields are considered different. To dedup by content, key on a canonical string — e.g. build a Set of `JSON.stringify(obj)` (with stable key order), or a Map keyed by the field(s) that define identity, keeping the first object per key."
    },
    {
      id: "algo-sliding-window",
      title: "Sliding window for subarray problems",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "Grow a window from the right and shrink it from the left to maintain a constraint, computing over all valid subarrays in a single O(n) pass.",
      code:
"// longest substring without repeating chars\n" +
"function longestUnique(s) {\n" +
"  const last = new Map();\n" +
"  let start = 0, best = 0;\n" +
"  for (let i = 0; i < s.length; i++) {\n" +
"    const c = s[i];\n" +
"    if (last.has(c) && last.get(c) >= start) {\n" +
"      start = last.get(c) + 1;   // jump past the repeat\n" +
"    }\n" +
"    last.set(c, i);\n" +
"    best = Math.max(best, i - start + 1);\n" +
"  }\n" +
"  return best;\n" +
"}",
      lines: [
        "`start` is the left edge; `i` is the right edge growing each step.",
        "`last` records the most recent index of each character.",
        "On a repeat inside the window, jump `start` just past the previous occurrence.",
        "`i - start + 1` is the current window size; track the max."
      ],
      why: "The brute-force check-every-substring approach is O(n²) or worse. The sliding window visits each element a constant number of times, turning many 'longest/shortest subarray with property X' problems into clean linear solutions.",
      challenge: "Why do we need `last.get(c) >= start`, not just `last.has(c)`?",
      answer: "A character might have appeared earlier but BEFORE the current window's `start`, meaning it's no longer inside the window and isn't a real repeat. The `>= start` check ensures we only shrink when the previous occurrence is still within the active window; otherwise a stale index would wrongly move `start` backward."
    },
    {
      id: "js-immediately-invoked",
      title: "Number precision: 0.1 + 0.2",
      lang: "js", topic: "Gotchas", level: "Beginner",
      concept: "IEEE-754 floating point can't represent 0.1 exactly, so decimal arithmetic accumulates tiny errors. Compare with a tolerance and round for display.",
      code:
"0.1 + 0.2;                 // 0.30000000000000004\n" +
"0.1 + 0.2 === 0.3;         // false!\n" +
"\n" +
"// compare within an epsilon\n" +
"Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON;  // true\n" +
"\n" +
"// money: work in integer cents\n" +
"const cents = 10 + 20;     // 30 exactly\n" +
"const dollars = cents / 100;",
      lines: [
        "0.1 and 0.2 have no exact binary representation, so their sum is slightly off.",
        "Direct `=== 0.3` fails because of that rounding residue.",
        "Comparing `Math.abs(diff) < EPSILON` tolerates the tiny error.",
        "For money, store integer cents and divide only when displaying."
      ],
      why: "Floating-point surprises cause real financial and comparison bugs. Two habits — never test floats for exact equality, and represent currency as integers — eliminate an entire class of 'off by a fraction of a cent' errors.",
      challenge: "Why is `(0.1 + 0.2).toFixed(2)` usually fine for display but not for accumulation?",
      answer: "`toFixed(2)` rounds a single value to a clean string for the user, hiding the residue. But if you keep summing floats and only round at the end, the tiny errors can accumulate across many operations and flip a rounding boundary. For correctness in accumulation, do the arithmetic in integers (cents) and format at the very end."
    },
    {
      id: "py-unpacking-star",
      title: "Star unpacking in calls and assignments",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "`*` spreads an iterable into positional args (or captures the 'rest'), and `**` spreads a dict into keyword args — for flexible calls and clean assignments.",
      code:
"def point(x, y, z): return (x, y, z)\n" +
"\n" +
"coords = [1, 2, 3]\n" +
"point(*coords)            # (1, 2, 3)\n" +
"\n" +
"opts = {'x': 1, 'y': 2, 'z': 3}\n" +
"point(**opts)             # (1, 2, 3)\n" +
"\n" +
"first, *middle, last = [1, 2, 3, 4, 5]\n" +
"# first=1, middle=[2,3,4], last=5",
      lines: [
        "`*coords` spreads the list into three positional arguments.",
        "`**opts` spreads the dict into keyword arguments matched by name.",
        "In assignment, `*middle` captures everything between the fixed ends.",
        "Exactly one starred target is allowed per assignment, and it's always a list."
      ],
      why: "Star unpacking removes boilerplate when forwarding arguments, merging dicts (`{**a, **b}`), and pulling apart sequences with a variable-length middle. It's the glue for writing flexible wrappers and decorators.",
      challenge: "What does `def f(*args, **kwargs)` let a wrapper function do?",
      answer: "It lets `f` accept ANY positional and keyword arguments and forward them intact: `def wrapper(*args, **kwargs): return f(*args, **kwargs)`. `*args` collects positionals into a tuple and `**kwargs` collects keywords into a dict, so the wrapper works regardless of the wrapped function's signature — the foundation of most decorators."
    },
    {
      id: "js-regex-named-groups",
      title: "Named capture groups in regex",
      lang: "js", topic: "Idioms", level: "Intermediate",
      concept: "Naming capture groups with `(?<name>...)` makes matches self-documenting and lets you read fields by name instead of fragile numeric indices.",
      code:
"const re = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;\n" +
"const m = '2026-07-15'.match(re);\n" +
"\n" +
"m.groups.year;    // '2026'\n" +
"m.groups.month;   // '07'\n" +
"m.groups.day;     // '15'\n" +
"\n" +
"// also usable in replace:\n" +
"'2026-07-15'.replace(re, '$<day>/$<month>/$<year>');\n" +
"// '15/07/2026'",
      lines: [
        "`(?<year>\\d{4})` captures four digits AND labels the group 'year'.",
        "`m.groups` is an object keyed by those names.",
        "Reading `m.groups.month` is clearer and more robust than `m[2]`.",
        "In `replace`, `$<name>` references a named group in the replacement string."
      ],
      why: "Numeric group indices break the moment you add or reorder a group, and they force readers to count parentheses. Named groups make regex-heavy parsing readable and refactor-safe, turning cryptic `m[3]` into meaningful `m.groups.day`.",
      challenge: "How do you make a group NON-capturing when you only need it for grouping?",
      answer: "Use `(?:...)`. For example, `(?:https?)://` groups the `http`/`https` alternation for the `?` and the `://` suffix without creating a capture. Non-capturing groups keep your capture indices/names focused on the parts you actually extract and are slightly more efficient."
    },
    {
      id: "ts-narrowing-typeguard",
      title: "Custom type guards with 'is'",
      lang: "ts", topic: "Types", level: "Advanced",
      concept: "A function returning `x is T` teaches TypeScript to narrow a type after a runtime check, so the compiler trusts your validation.",
      code:
"interface Cat { meow(): void; }\n" +
"interface Dog { bark(): void; }\n" +
"\n" +
"function isCat(pet: Cat | Dog): pet is Cat {\n" +
"  return 'meow' in pet;\n" +
"}\n" +
"\n" +
"function speak(pet: Cat | Dog) {\n" +
"  if (isCat(pet)) pet.meow();   // narrowed to Cat\n" +
"  else pet.bark();             // narrowed to Dog\n" +
"}",
      lines: [
        "The return type `pet is Cat` is a type predicate, not just `boolean`.",
        "`'meow' in pet` is the actual runtime check that proves catness.",
        "Inside `if (isCat(pet))`, TS narrows `pet` to `Cat`, so `.meow()` is valid.",
        "In the `else`, TS narrows to `Dog`, so `.bark()` type-checks."
      ],
      why: "Runtime data (JSON from an API) arrives untyped; type guards are how you validate it once and get full type safety afterward. They connect real runtime checks to the compiler's understanding, replacing scattered `as` casts that lie about types.",
      challenge: "What's the danger of a type guard whose body doesn't actually verify the type?",
      answer: "TypeScript TRUSTS the predicate — it doesn't check that your logic matches the claim. If `isCat` returned `true` for a dog, the compiler would still narrow to `Cat` and let you call `.meow()`, causing a runtime crash the type system won't catch. A wrong type guard is as dangerous as a wrong `as` cast, so the body must genuinely validate every field it promises."
    },
    {
      id: "js-array-flat-flatmap",
      title: "flatMap for map-then-flatten",
      lang: "js", topic: "Idioms", level: "Intermediate",
      concept: "`flatMap` maps each element to zero-or-more results and flattens one level — perfect for expand/filter in a single pass.",
      code:
"// expand each item into several\n" +
"[1, 2, 3].flatMap(n => [n, n * 10]);\n" +
"// [1, 10, 2, 20, 3, 30]\n" +
"\n" +
"// filter + map at once: return [] to drop\n" +
"[1, -2, 3, -4].flatMap(n => n > 0 ? [n] : []);\n" +
"// [1, 3]\n" +
"\n" +
"// split sentences into words\n" +
"['a b', 'c d'].flatMap(s => s.split(' '));  // ['a','b','c','d']",
      lines: [
        "`flatMap(fn)` is `map(fn)` followed by a one-level `flat()`.",
        "Returning a 2-element array expands one input into two outputs.",
        "Returning `[]` drops an element — a neat combined filter+map.",
        "It flattens only ONE level, so deeply nested results stay nested."
      ],
      why: "The 'map then flatten' and 'filter and transform together' patterns are extremely common (tokenizing, expanding ranges, conditional inclusion). `flatMap` does both in one clear call, avoiding a separate `.filter().map()` two-pass.",
      challenge: "How does `arr.flatMap(fn)` differ from `arr.map(fn).flat(Infinity)`?",
      answer: "`flatMap` flattens exactly ONE level, while `flat(Infinity)` flattens all levels recursively. If your mapping returns nested arrays of arrays and you only want the top level merged, `flatMap` is correct; `flat(Infinity)` would collapse the deeper structure you meant to keep."
    },
    {
      id: "algo-hashmap-twosum",
      title: "One-pass two-sum with a hash map",
      lang: "algo", topic: "Algorithms", level: "Beginner",
      concept: "Remember each number's complement as you go; the first time you see a number whose partner is already stored, you've found the pair — O(n), one pass.",
      code:
"function twoSum(nums, target) {\n" +
"  const seen = new Map();          // value -> index\n" +
"  for (let i = 0; i < nums.length; i++) {\n" +
"    const need = target - nums[i];\n" +
"    if (seen.has(need)) return [seen.get(need), i];\n" +
"    seen.set(nums[i], i);\n" +
"  }\n" +
"  return null;\n" +
"}",
      lines: [
        "For each number, its partner is `target - nums[i]`.",
        "`seen` maps previously-visited values to their indices.",
        "If the needed partner is already in `seen`, return both indices.",
        "Otherwise record the current number and move on — one pass total."
      ],
      why: "This is the archetypal 'trade space for time' technique: the nested-loop version is O(n²), but a hash map that remembers what you've seen makes it O(n). The same complement-lookup idea powers many pair- and difference-finding problems.",
      challenge: "Why store the number AFTER checking, rather than before?",
      answer: "Checking first prevents an element from pairing with ITSELF. If you stored `nums[i]` before checking and `target` were `2 * nums[i]`, `seen.has(need)` would match the element you just added and wrongly return `[i, i]`. Checking against only previously-seen values guarantees two distinct indices."
    },
    {
      id: "js-object-freeze",
      title: "Object.freeze for shallow immutability",
      lang: "js", topic: "Gotchas", level: "Intermediate",
      concept: "`Object.freeze` prevents adding, removing, or changing an object's own properties — but only one level deep. Nested objects stay mutable.",
      code:
"const config = Object.freeze({\n" +
"  api: 'https://x',\n" +
"  limits: { max: 10 },\n" +
"});\n" +
"\n" +
"config.api = 'evil';       // ignored (throws in strict mode)\n" +
"config.limits.max = 999;   // MUTATES — freeze is shallow!\n" +
"\n" +
"Object.isFrozen(config);   // true (top level only)",
      lines: [
        "Freezing blocks reassigning or adding top-level properties.",
        "In non-strict code the write silently fails; in strict mode it throws.",
        "But `config.limits` is still a normal mutable object — freeze didn't reach it.",
        "So `config.limits.max = 999` succeeds, which surprises many developers."
      ],
      why: "Teams reach for `Object.freeze` expecting deep immutability and get a false sense of safety. Knowing it's shallow — and writing a recursive deepFreeze or using an immutable library when you need more — prevents subtle shared-state bugs in 'constant' config objects.",
      challenge: "Sketch a recursive deepFreeze.",
      answer: "Iterate the object's own property values; for each value that is a non-null object (or function) and not already frozen, recurse `deepFreeze(value)`; finally `Object.freeze(obj)` itself and return it. Guarding on `Object.isFrozen` first prevents infinite recursion on cyclic references."
    },
    {
      id: "py-walrus",
      title: "The walrus operator :=",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "`:=` assigns AND returns a value inside an expression, so you can capture a result exactly where you test it — no duplicate call or extra line.",
      code:
"# compute once, test, and reuse\n" +
"import re\n" +
"if (m := re.search(r'\\d+', text)):\n" +
"    print(m.group())\n" +
"\n" +
"# read chunks until empty\n" +
"while (chunk := f.read(1024)):\n" +
"    process(chunk)\n" +
"\n" +
"# filter + reuse a costly call\n" +
"vals = [y for x in data if (y := expensive(x)) > 0]",
      lines: [
        "`m := re.search(...)` assigns the match to `m` and yields it for the `if`.",
        "Without walrus you'd call `re.search` twice or add a separate line.",
        "The `while (chunk := f.read(...))` idiom reads until an empty string.",
        "In a comprehension, walrus lets you compute `expensive(x)` once and reuse `y`."
      ],
      why: "The walrus (Python 3.8+) removes a classic redundancy: assigning a value on one line only to test it on the next, or calling an expensive function twice. Used judiciously in `if`, `while`, and comprehensions, it makes code tighter without hurting clarity.",
      challenge: "Why does the walrus operator need parentheses in many contexts?",
      answer: "To disambiguate it from a plain assignment and to control precedence. Bare `n := 10` as a statement is a syntax error (Python wants `n = 10`), and inside larger expressions the parentheses clarify what's being assigned — e.g. `if (m := search()):` groups the assignment as the condition. Wrapping it in parentheses is the safe, readable default."
    },
    {
      id: "js-nullish-assign",
      title: "Logical assignment operators",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "`??=`, `||=`, and `&&=` combine a logical test with assignment, so you set a value only when the current one is missing (or present).",
      code:
"const opts = { timeout: 0 };\n" +
"\n" +
"opts.retries ??= 3;    // set only if null/undefined -> 3\n" +
"opts.timeout ??= 5000; // 0 is defined, so UNCHANGED -> 0\n" +
"\n" +
"let name = '';\n" +
"name ||= 'Anonymous';  // '' is falsy -> 'Anonymous'\n" +
"\n" +
"cache.data &&= transform(cache.data); // only if truthy",
      lines: [
        "`??=` assigns only when the left side is null or undefined.",
        "So `opts.timeout ??= 5000` keeps the intentional `0`.",
        "`||=` assigns when the left is any falsy value (including 0 and '').",
        "`&&=` assigns only when the left is truthy — handy for conditional transforms."
      ],
      why: "These operators express 'default if missing' and 'update if present' in one token, and crucially `??=` respects legitimate zero/empty values that `||=` would clobber. They also short-circuit, so the right-hand side runs only when needed.",
      challenge: "Why might `obj.count ||= 1` be a bug where `obj.count ??= 1` is correct?",
      answer: "If `obj.count` is a legitimate `0`, `||=` treats it as falsy and overwrites it with `1`, corrupting the value. `??=` only assigns when the property is `null`/`undefined`, so a real `0` is preserved. Whenever `0`, `''`, or `false` are valid values, prefer `??=`."
    },
    {
      id: "algo-prefix-sum",
      title: "Prefix sums for O(1) range queries",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "Precompute cumulative sums once; then any range total is a single subtraction, turning repeated O(n) sums into O(1) lookups.",
      code:
"function buildPrefix(nums) {\n" +
"  const p = [0];\n" +
"  for (const n of nums) p.push(p[p.length - 1] + n);\n" +
"  return p;                       // p[i] = sum of first i\n" +
"}\n" +
"\n" +
"const p = buildPrefix([2, 4, 6, 8]);\n" +
"// sum of indices [1..3) = p[3] - p[1]\n" +
"p[3] - p[1];                      // 4 + 6 = 10",
      lines: [
        "`p[i]` holds the sum of the first `i` elements, with `p[0] = 0`.",
        "Building the prefix array is a single O(n) pass.",
        "The sum of range [lo, hi) is just `p[hi] - p[lo]`.",
        "After the one-time build, every range query is a constant-time subtraction."
      ],
      why: "When you answer many range-sum queries over static data, recomputing each sum is O(n) per query. Prefix sums pay O(n) once and make each query O(1) — a huge win, and the basis for 2D prefix sums, difference arrays, and subarray-sum-equals-k problems.",
      challenge: "How does a prefix sum help count subarrays summing to exactly k?",
      answer: "A subarray [i, j] sums to k when `prefix[j] - prefix[i] === k`, i.e. `prefix[i] === prefix[j] - k`. Iterate once, keeping a hash map of how many times each prefix value has occurred; at each `j`, add the count of `prefix[j] - k` seen so far. That solves it in a single O(n) pass instead of O(n²)."
    },
    {
      id: "js-currying",
      title: "Currying and partial application",
      lang: "js", topic: "Patterns", level: "Advanced",
      concept: "Currying turns a multi-arg function into a chain of single-arg functions, letting you fix some arguments now and supply the rest later.",
      code:
"const add = (a) => (b) => a + b;\n" +
"const add10 = add(10);      // fixes a = 10\n" +
"add10(5);                   // 15\n" +
"\n" +
"// partial application with bind\n" +
"function log(level, msg) { return `[${level}] ${msg}`; }\n" +
"const warn = log.bind(null, 'WARN');\n" +
"warn('low disk');           // '[WARN] low disk'",
      lines: [
        "`add(10)` returns a function that remembers `a = 10` via closure.",
        "Calling `add10(5)` supplies `b` and completes the computation.",
        "`bind(null, 'WARN')` pre-fills the first argument, returning a new function.",
        "Both let you specialize a general function into a focused one."
      ],
      why: "Partial application creates small, reusable, pre-configured functions — perfect for event handlers, mappers, and pipelines where a fixed parameter should be baked in. It reduces repetition and makes higher-order composition natural.",
      challenge: "How would you write a generic `curry(fn)` that works for any arity?",
      answer: "Collect arguments across calls: return a function that, if it has received at least `fn.length` args, invokes `fn(...args)`; otherwise returns a new function that concatenates future args and recurses. This lets `curry(fn)(a)(b)(c)` or `curry(fn)(a, b)(c)` both work by comparing accumulated argument count to `fn.length`."
    },
    {
      id: "py-try-else-finally",
      title: "try / except / else / finally",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "`else` runs only when no exception occurred, and `finally` always runs — separating the risky call, the success path, and cleanup cleanly.",
      code:
"try:\n" +
"    conn = connect()\n" +
"except ConnectionError as e:\n" +
"    log(e)\n" +
"    raise\n" +
"else:\n" +
"    # runs ONLY if connect() succeeded\n" +
"    use(conn)\n" +
"finally:\n" +
"    # runs no matter what\n" +
"    cleanup()",
      lines: [
        "The `try` holds only the line that might raise — keep it small.",
        "`except` handles a specific error type; re-raising preserves the traceback.",
        "`else` runs the success-only logic, kept OUT of the try so its errors aren't masked.",
        "`finally` always executes — for releasing locks, files, or connections."
      ],
      why: "Putting success-path code inside `try` can accidentally catch and hide unrelated errors. The `else` clause keeps the `try` narrow and intentional, and `finally` guarantees cleanup on every path — including when you re-raise.",
      challenge: "Why is catching a specific exception type better than a bare `except:`?",
      answer: "A bare `except:` swallows EVERYTHING, including `KeyboardInterrupt` and `SystemExit`, and hides programming errors (like typos raising `NameError`) that you'd want to surface. Catching the specific type you can handle lets genuinely unexpected exceptions propagate, keeping bugs visible and the program interruptible."
    },
    {
      id: "js-abortcontroller",
      title: "Cancel work with AbortController",
      lang: "js", topic: "Async", level: "Advanced",
      concept: "An `AbortController` produces a `signal` you pass into cancellable operations; calling `abort()` fires an event that lets in-flight work stop cleanly.",
      code:
"const controller = new AbortController();\n" +
"\n" +
"element.addEventListener('scroll', onScroll, {\n" +
"  signal: controller.signal,\n" +
"});\n" +
"\n" +
"// later: remove the listener in one call\n" +
"controller.abort();\n" +
"\n" +
"// the signal also cancels timers, fetches, streams, etc.\n" +
"controller.signal.addEventListener('abort', () => cleanup());",
      lines: [
        "`controller.signal` is a token you hand to cancellable APIs.",
        "Passing `{ signal }` to `addEventListener` ties the listener's lifetime to the controller.",
        "`controller.abort()` removes that listener — no need to keep the exact callback reference.",
        "Anything watching the signal's `abort` event can run its own teardown."
      ],
      why: "One controller can cancel many listeners, timers, and network requests at once, which is far cleaner than tracking each callback reference for `removeEventListener`. It's the modern, unified way to manage teardown in components and async flows.",
      challenge: "How do you use the same signal to cancel a long async loop cooperatively?",
      answer: "Check the signal inside the loop and bail when aborted: `if (signal.aborted) return;` at the top of each iteration, or `signal.throwIfAborted()` to throw an `AbortError`. Since JavaScript can't preempt running code, cancellation of your own async work is cooperative — you must poll the signal at safe checkpoints."
    },
    {
      id: "algo-heap-topk",
      title: "A heap keeps the top-k efficiently",
      lang: "algo", topic: "Data structures", level: "Advanced",
      concept: "A min-heap of size k holds the largest k items seen so far: push each item, and if the heap grows past k, pop the smallest. O(n log k) with O(k) space.",
      code:
"// pseudo: heap is a min-heap keyed by value\n" +
"function topK(stream, k) {\n" +
"  const heap = new MinHeap();\n" +
"  for (const x of stream) {\n" +
"    heap.push(x);\n" +
"    if (heap.size() > k) heap.pop(); // drop smallest\n" +
"  }\n" +
"  return heap.toArray();             // the k largest\n" +
"}",
      lines: [
        "The heap's root is always its SMALLEST element.",
        "Push every item, then if size exceeds k, pop that smallest.",
        "So the heap always retains the k largest values seen so far.",
        "Each push/pop is O(log k), giving O(n log k) overall — better than sorting all n."
      ],
      why: "For 'top 10 of a billion' problems, fully sorting is O(n log n) and needs all n in memory. A bounded heap streams the data in O(n log k) time and only O(k) space — the standard approach for leaderboards, nearest-neighbors, and log analytics.",
      challenge: "Why use a MIN-heap to track the LARGEST k elements?",
      answer: "The min-heap's root is the smallest of the current top-k, which is exactly the element most likely to be evicted. When a new value arrives, comparing it against that minimum (and popping the min if the heap is over size) cheaply discards the weakest candidate. A max-heap would put the wrong element (the biggest) at the easily-accessible root."
    },
    {
      id: "py-collections-counter",
      title: "Counter for tallying and top-n",
      lang: "py", topic: "Data structures", level: "Beginner",
      concept: "`Counter` is a dict subclass that counts hashable items, supports arithmetic, and gives you `most_common` for free.",
      code:
"from collections import Counter\n" +
"\n" +
"c = Counter('mississippi')\n" +
"c['s']              # 4\n" +
"c.most_common(2)    # [('i', 4), ('s', 4)]\n" +
"\n" +
"# combine counts\n" +
"Counter('aab') + Counter('bcc')\n" +
"# Counter({'b': 2, 'a': 2, 'c': 2})\n" +
"\n" +
"c['zzz']            # 0, no KeyError",
      lines: [
        "`Counter(iterable)` tallies every element in one call.",
        "`most_common(n)` returns the n highest counts, sorted descending.",
        "Counters support `+`, `-`, `&`, `|` to combine tallies like multisets.",
        "Missing keys return 0 instead of raising, so lookups are safe."
      ],
      why: "Counting word frequencies, finding the most common error, or diffing multisets are everyday tasks. `Counter` replaces manual dict-increment loops and hand-written sorting with one expressive, well-tested tool.",
      challenge: "How do you find elements that appear in one Counter but not another, respecting multiplicity?",
      answer: "Subtract them: `Counter(a) - Counter(b)`. Counter subtraction keeps only positive counts, so it yields the surplus of `a` over `b` per element (multiplicity-aware) and drops anything that `b` has at least as many of. This is handy for 'what's left after removing' style diffs."
    },
    {
      id: "js-array-some-every",
      title: "some and every short-circuit",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "`some` returns true at the first match; `every` returns false at the first failure. Both stop early, expressing search and validation clearly.",
      code:
"const nums = [2, 4, 6, 7];\n" +
"\n" +
"nums.every(n => n % 2 === 0);  // false (7 is odd)\n" +
"nums.some(n => n > 5);         // true  (6, 7)\n" +
"\n" +
"// clearer than a manual loop with a flag\n" +
"const allValid = fields.every(f => f.value.trim() !== '');",
      lines: [
        "`every` is true only if the callback holds for ALL elements.",
        "`some` is true if the callback holds for AT LEAST ONE element.",
        "`every` stops at the first false; `some` stops at the first true.",
        "They replace a manual `let ok = true` loop with a single intention-revealing call."
      ],
      why: "A hand-rolled loop with a boolean flag is easy to get subtly wrong (forgetting to break, wrong initial value). `some`/`every` state the question directly — 'is any?' / 'are all?' — and short-circuit for efficiency.",
      challenge: "What do `[].every(fn)` and `[].some(fn)` return on an empty array?",
      answer: "`[].every(fn)` is `true` (vacuously — there's no element that fails) and `[].some(fn)` is `false` (there's no element that passes). These match the mathematical conventions for 'for all' over an empty set (true) and 'there exists' (false), and matter when your array might be empty."
    },
    {
      id: "algo-dijkstra-idea",
      title: "Dijkstra: greedily expand the nearest node",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "For non-negative edge weights, always finalize the closest unfinished node next; a priority queue makes this efficient for shortest paths.",
      code:
"function dijkstra(graph, start) {          // graph: node -> [[nbr, w]]\n" +
"  const dist = new Map([[start, 0]]);\n" +
"  const pq = [[0, start]];                 // [distance, node]\n" +
"  while (pq.length) {\n" +
"    pq.sort((a, b) => a[0] - b[0]);        // (use a real heap in practice)\n" +
"    const [d, node] = pq.shift();\n" +
"    if (d > (dist.get(node) ?? Infinity)) continue;\n" +
"    for (const [nbr, w] of graph[node]) {\n" +
"      const nd = d + w;\n" +
"      if (nd < (dist.get(nbr) ?? Infinity)) {\n" +
"        dist.set(nbr, nd);\n" +
"        pq.push([nd, nbr]);\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"  return dist;\n" +
"}",
      lines: [
        "`dist` holds the best known distance to each node so far.",
        "Always process the closest unfinalized node (the priority-queue minimum).",
        "Skip a queue entry if it's stale (a shorter distance was already found).",
        "'Relax' each edge: if going through `node` is shorter, update and re-queue the neighbor."
      ],
      why: "Dijkstra is the backbone of routing, network latency, and game pathfinding when weights are non-negative. The core idea — greedily lock in the nearest node because no later path can beat it — is a clean example of a provably-correct greedy algorithm.",
      challenge: "Why does Dijkstra break with NEGATIVE edge weights, and what do you use instead?",
      answer: "Dijkstra assumes that once a node is finalized as closest, no cheaper path exists — but a negative edge could later reduce a 'finalized' distance, violating that assumption. For graphs with negative weights (no negative cycles), use Bellman-Ford, which relaxes all edges repeatedly and also detects negative cycles."
    },
    {
      id: "py-pathlib",
      title: "pathlib over os.path string juggling",
      lang: "py", topic: "Idioms", level: "Beginner",
      concept: "`pathlib.Path` treats filesystem paths as objects with a `/` join operator and handy methods, replacing brittle string concatenation.",
      code:
"from pathlib import Path\n" +
"\n" +
"root = Path('data')\n" +
"csv = root / 'reports' / 'q1.csv'   # OS-correct join\n" +
"\n" +
"csv.exists()          # True/False\n" +
"csv.suffix            # '.csv'\n" +
"csv.stem              # 'q1'\n" +
"csv.parent            # Path('data/reports')\n" +
"csv.read_text()       # contents as a string",
      lines: [
        "`root / 'reports'` joins path parts using the correct separator for the OS.",
        "`.suffix` and `.stem` parse the extension and base name for you.",
        "`.parent` walks up a directory without string surgery.",
        "Convenience methods (`.exists()`, `.read_text()`) live right on the path object."
      ],
      why: "String-based paths (`os.path.join`, manual `+ '/' +`) are verbose and error-prone across operating systems. `pathlib` makes path code readable, portable, and less bug-prone, and it's the modern standard in Python 3.",
      challenge: "How would you find all `.py` files under a directory tree with pathlib?",
      answer: "Use recursive globbing: `list(Path('src').rglob('*.py'))`. `rglob` matches the pattern in the directory and all subdirectories, returning `Path` objects. For a single non-recursive level, use `Path('src').glob('*.py')` instead."
    },
    {
      id: "js-tokenizer",
      title: "A tiny hand-rolled tokenizer",
      lang: "js", topic: "Patterns", level: "Advanced",
      concept: "Scanning input into typed tokens with a single sticky regex is the first stage of any parser, highlighter, or DSL — no library required.",
      code:
"function tokenize(src) {\n" +
"  const spec = [\n" +
"    ['num', /\\d+(?:\\.\\d+)?/y],\n" +
"    ['op',  /[+\\-*/]/y],\n" +
"    ['ws',  /\\s+/y],\n" +
"  ];\n" +
"  const out = [];\n" +
"  let i = 0;\n" +
"  while (i < src.length) {\n" +
"    let matched = false;\n" +
"    for (const [type, re] of spec) {\n" +
"      re.lastIndex = i;\n" +
"      const m = re.exec(src);\n" +
"      if (m) {\n" +
"        if (type !== 'ws') out.push({ type, value: m[0] });\n" +
"        i = re.lastIndex;\n" +
"        matched = true;\n" +
"        break;\n" +
"      }\n" +
"    }\n" +
"    if (!matched) throw new Error('Unexpected: ' + src[i]);\n" +
"  }\n" +
"  return out;\n" +
"}",
      lines: [
        "Each rule is a token type plus a STICKY (`/y`) regex that matches at `lastIndex`.",
        "Setting `re.lastIndex = i` anchors the match to the current scan position.",
        "The first rule that matches wins; whitespace is recognized but not emitted.",
        "An unmatched character is a lexing error — fail loudly rather than skip silently."
      ],
      why: "Tokenizing is the foundation of syntax highlighters (like the one rendering this very lesson), calculators, config parsers, and mini-languages. The sticky-regex approach is compact, dependency-free, and easy to extend with new token types.",
      challenge: "Why use the sticky flag `/y` instead of the global flag `/g` here?",
      answer: "The sticky flag requires the match to start EXACTLY at `lastIndex`; if there's no match there, it fails immediately. The global flag would SEARCH forward for the next match anywhere in the string, which could skip over invalid characters and silently mis-tokenize. Stickiness enforces contiguous, position-anchored scanning — exactly what a lexer needs."
    },
    {
      id: "ts-satisfies",
      title: "The satisfies operator",
      lang: "ts", topic: "Types", level: "Advanced",
      concept: "`satisfies` checks a value against a type WITHOUT widening it, so you get validation plus precise inference — the best of annotation and literal.",
      code:
"type Color = [number, number, number];\n" +
"\n" +
"const palette = {\n" +
"  bg: [14, 18, 48],\n" +
"  fg: [238, 240, 250],\n" +
"} satisfies Record<string, Color>;\n" +
"\n" +
"palette.bg[0];        // number, and key 'bg' is known\n" +
"// palette.xy;        // compile error: no such key",
      lines: [
        "`satisfies Record<string, Color>` verifies every value is a valid Color tuple.",
        "Unlike a type annotation, it does NOT widen `palette` to `Record<string, Color>`.",
        "So the exact keys (`bg`, `fg`) remain known and typos are caught.",
        "You keep precise literal inference AND get the shape validated."
      ],
      why: "Annotating with `: Record<string, Color>` validates but erases the specific keys, so `palette.typo` wouldn't error. Assigning without a type validates nothing. `satisfies` gives you both guarantees — a common need for config objects, theme maps, and route tables.",
      challenge: "How does `const x = v satisfies T` differ from `const x: T = v`?",
      answer: "`const x: T = v` gives `x` the type `T` (widening away literal detail), whereas `v satisfies T` checks that `v` is assignable to `T` but leaves `x` with its narrowest inferred type. So with `satisfies` you keep exact literal types and known keys while still catching shape mistakes; the annotation form loses that precision."
    },
    {
      id: "js-structured-clone",
      title: "Deep copy with structuredClone",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "`structuredClone` makes a true deep copy — nested objects, arrays, Maps, Dates, even cycles — without the pitfalls of the JSON round-trip.",
      code:
"const state = {\n" +
"  when: new Date(),\n" +
"  tags: new Set(['a', 'b']),\n" +
"  nested: { count: 1 },\n" +
"};\n" +
"\n" +
"const copy = structuredClone(state);\n" +
"copy.nested.count = 99;    // does NOT affect original\n" +
"copy.when instanceof Date; // true — preserved\n" +
"\n" +
"// JSON.parse(JSON.stringify(state)) would break Date & Set",
      lines: [
        "`structuredClone` recursively copies every level, so nested mutations are isolated.",
        "It preserves types the JSON trick destroys: `Date`, `Map`, `Set`, typed arrays.",
        "It even handles cyclic references without infinite-looping.",
        "The old `JSON.parse(JSON.stringify(x))` turns Dates into strings and drops Sets."
      ],
      why: "The `JSON.parse(JSON.stringify(...))` deep-copy hack silently corrupts Dates, Maps, Sets, `undefined`, and functions, and throws on cycles. `structuredClone` is the built-in, correct way to deep-copy plain data — no library, no surprises.",
      challenge: "What can't structuredClone copy, and how does that differ from the JSON trick?",
      answer: "It can't clone functions, DOM nodes, or class instances' prototypes/methods — it throws a DataCloneError on functions rather than silently dropping them. The JSON trick also can't carry functions but does so silently (they just vanish). structuredClone's loud failure is usually preferable, since a silently missing function is a subtle bug."
    },
    {
      id: "py-dataclass",
      title: "dataclasses for boilerplate-free records",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "The `@dataclass` decorator auto-generates `__init__`, `__repr__`, and `__eq__` from typed fields, so a data-holding class is a few readable lines.",
      code:
"from dataclasses import dataclass, field\n" +
"\n" +
"@dataclass\n" +
"class Point:\n" +
"    x: int\n" +
"    y: int = 0\n" +
"    tags: list = field(default_factory=list)\n" +
"\n" +
"p = Point(1, 2)\n" +
"p            # Point(x=1, y=2, tags=[])\n" +
"Point(1, 2) == Point(1, 2)   # True",
      lines: [
        "Typed class attributes become constructor parameters automatically.",
        "`y: int = 0` gives a default; positional and default args work as expected.",
        "`field(default_factory=list)` safely defaults mutable fields (avoids the shared-list trap).",
        "You get a readable `__repr__` and value-based `__eq__` for free."
      ],
      why: "Writing `__init__`, `__repr__`, and `__eq__` by hand for every small record is tedious and bug-prone. Dataclasses (Python 3.7+) express intent — 'this is a bundle of typed fields' — and correctly handle mutable defaults via `default_factory`.",
      challenge: "Why must you use `field(default_factory=list)` instead of `tags: list = []`?",
      answer: "`tags: list = []` would share ONE list across all instances — the same mutable-default trap as function arguments — so appends leak between objects. `field(default_factory=list)` calls `list()` fresh for each new instance, giving every object its own independent list. Dataclasses even raise an error if you try to use a mutable literal as a default, nudging you toward the factory."
    },
    {
      id: "algo-union-find",
      title: "Union-Find with path compression",
      lang: "algo", topic: "Data structures", level: "Advanced",
      concept: "Disjoint-set union tracks connected groups: `find` returns a group's representative and `union` merges two groups, both nearly O(1) amortized.",
      code:
"function makeDSU(n) {\n" +
"  const parent = Array.from({ length: n }, (_, i) => i);\n" +
"  function find(x) {\n" +
"    while (parent[x] !== x) {\n" +
"      parent[x] = parent[parent[x]]; // path compression\n" +
"      x = parent[x];\n" +
"    }\n" +
"    return x;\n" +
"  }\n" +
"  function union(a, b) { parent[find(a)] = find(b); }\n" +
"  return { find, union };\n" +
"}",
      lines: [
        "Each element starts as its own parent — n singleton groups.",
        "`find` walks up to the root that represents the whole group.",
        "Path compression re-points nodes closer to the root as it climbs, flattening the tree.",
        "`union` links one group's root under the other's, merging them in near-constant time."
      ],
      why: "Union-Find is the go-to structure for connectivity questions: cycle detection in graphs, Kruskal's minimum spanning tree, and grouping/clustering. With path compression (and union by rank), operations run in near-constant amortized time even on huge inputs.",
      challenge: "What does 'union by rank' add, and why does it matter alongside path compression?",
      answer: "Union by rank always attaches the shorter tree under the taller one, preventing tall degenerate chains from forming in the first place. Combined with path compression, the two give an amortized complexity of O(α(n)) — the inverse Ackermann function — which is effectively constant. Either optimization alone is good; together they're optimal."
    },
    {
      id: "js-tagged-union-reducer",
      title: "A reducer with an action union",
      lang: "js", topic: "Patterns", level: "Intermediate",
      concept: "A reducer is a pure `(state, action) => newState` function; a switch over the action's `type` keeps all state transitions in one auditable place.",
      code:
"function reducer(state, action) {\n" +
"  switch (action.type) {\n" +
"    case 'increment':\n" +
"      return { ...state, count: state.count + 1 };\n" +
"    case 'add':\n" +
"      return { ...state, count: state.count + action.by };\n" +
"    case 'reset':\n" +
"      return { ...state, count: 0 };\n" +
"    default:\n" +
"      return state;   // unknown action: no change\n" +
"  }\n" +
"}",
      lines: [
        "The reducer never mutates `state`; it returns a NEW object via spread.",
        "Each `case` describes exactly one transition, keyed by `action.type`.",
        "Actions carry data (`action.by`) needed for the transition.",
        "The `default` returns state unchanged, so unknown actions are safe no-ops."
      ],
      why: "Centralizing state changes in a pure reducer makes them predictable, testable, and time-travel-debuggable — the model behind Redux and React's `useReducer`. Purity (no mutation, no side effects) is what enables reliable undo, replay, and testing.",
      challenge: "Why must a reducer be pure and free of side effects?",
      answer: "Purity guarantees that the same state + action always produce the same next state, which is what makes reducers testable, replayable, and safe to call multiple times (as React may in development). Side effects like network calls or logging inside a reducer break replay/undo and cause duplicated effects; those belong in middleware, effects, or event handlers instead."
    },
    {
      id: "py-decorator",
      title: "Write a decorator that wraps behavior",
      lang: "py", topic: "Patterns", level: "Advanced",
      concept: "A decorator is a function that takes a function and returns a wrapped one, adding behavior (timing, caching, retries) without touching the original.",
      code:
"import functools, time\n" +
"\n" +
"def timed(fn):\n" +
"    @functools.wraps(fn)\n" +
"    def wrapper(*args, **kwargs):\n" +
"        start = time.perf_counter()\n" +
"        result = fn(*args, **kwargs)\n" +
"        print(f'{fn.__name__} took {time.perf_counter()-start:.4f}s')\n" +
"        return result\n" +
"    return wrapper\n" +
"\n" +
"@timed\n" +
"def work(n): return sum(range(n))",
      lines: [
        "`timed` receives the original `fn` and returns a replacement `wrapper`.",
        "`*args, **kwargs` forward every argument, so any signature works.",
        "`@functools.wraps(fn)` copies the name/docstring so the wrapper isn't anonymous.",
        "`@timed` above `work` is just sugar for `work = timed(work)`."
      ],
      why: "Decorators factor out cross-cutting concerns — logging, timing, caching, access control — into reusable wrappers, keeping the core function focused. `functools.wraps` is the detail that preserves introspection so tooling and tracebacks still name the real function.",
      challenge: "Why is `@functools.wraps(fn)` important inside a decorator?",
      answer: "Without it, the wrapper replaces the original's metadata: `work.__name__` becomes `'wrapper'`, its docstring disappears, and its signature is obscured. `functools.wraps` copies `__name__`, `__doc__`, and other attributes from `fn` onto the wrapper, so debuggers, help(), and error messages still refer to the real function — essential for maintainable code."
    },
    {
      id: "js-array-at",
      title: "Array.at for negative indexing",
      lang: "js", topic: "Idioms", level: "Beginner",
      concept: "`.at(-1)` reads from the end of an array or string, replacing the clumsy `arr[arr.length - 1]` idiom with something readable.",
      code:
"const arr = [10, 20, 30];\n" +
"\n" +
"arr.at(-1);              // 30  (last)\n" +
"arr.at(-2);              // 20\n" +
"arr[arr.length - 1];     // 30, the old way\n" +
"\n" +
"'hello'.at(-1);          // 'o' — works on strings too",
      lines: [
        "`.at(0)` behaves like normal indexing for non-negative indices.",
        "Negative indices count from the end: `.at(-1)` is the last element.",
        "It reads far cleaner than `arr[arr.length - 1]` for the last item.",
        "`.at` also works on strings and typed arrays."
      ],
      why: "Reaching for the last element is extremely common, and `arr[arr.length - 1]` is verbose and easy to fat-finger. `.at(-1)` states the intent directly and reduces off-by-one slips — a small but frequent quality-of-life win.",
      challenge: "Why can't you use negative bracket indexing like `arr[-1]` in JavaScript?",
      answer: "In JavaScript, `arr[-1]` is treated as a property access with the string key `'-1'`, not an offset from the end — arrays are objects and bracket keys are strings. So `arr[-1]` looks up a (usually nonexistent) property and returns `undefined`. `.at(-1)` was added precisely to provide real end-relative indexing that arrays lacked."
    },
    {
      id: "py-lru-cache",
      title: "functools.lru_cache for instant memoization",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "Decorate a pure function with `@lru_cache` and repeated calls with the same arguments return instantly from a bounded cache.",
      code:
"from functools import lru_cache\n" +
"\n" +
"@lru_cache(maxsize=None)\n" +
"def fib(n):\n" +
"    if n < 2:\n" +
"        return n\n" +
"    return fib(n - 1) + fib(n - 2)\n" +
"\n" +
"fib(100)             # instant, despite naive recursion\n" +
"fib.cache_info()     # hits, misses, size",
      lines: [
        "`@lru_cache` stores results keyed by the call arguments.",
        "The exponential naive recursion becomes linear — each `n` computed once.",
        "`maxsize=None` means unbounded; a number keeps only the N most-recent.",
        "`cache_info()` reports hits and misses, handy for tuning."
      ],
      why: "For expensive pure functions — recursion, parsing, API-shaped lookups — `lru_cache` adds memoization in a single line with a battle-tested LRU eviction policy. It turns naive recursive solutions into fast ones and makes caching a decorator, not a rewrite.",
      challenge: "What requirement does lru_cache place on a function's arguments?",
      answer: "The arguments must be hashable, because the cache keys on them. That means you can't directly cache a function called with a list or dict argument (unhashable); you'd pass a tuple/frozenset instead. Also, the function should be pure — caching a function whose result depends on time, randomness, or external state returns stale values."
    },
    {
      id: "algo-quicksort-partition",
      title: "Quicksort and the partition step",
      lang: "algo", topic: "Algorithms", level: "Intermediate",
      concept: "Quicksort picks a pivot, partitions elements into smaller/larger halves around it, then recursively sorts each half — O(n log n) on average, in place.",
      code:
"function quicksort(a, lo = 0, hi = a.length - 1) {\n" +
"  if (lo >= hi) return a;\n" +
"  const pivot = a[hi];\n" +
"  let i = lo;\n" +
"  for (let j = lo; j < hi; j++) {\n" +
"    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }\n" +
"  }\n" +
"  [a[i], a[hi]] = [a[hi], a[i]];   // pivot to its slot\n" +
"  quicksort(a, lo, i - 1);\n" +
"  quicksort(a, i + 1, hi);\n" +
"  return a;\n" +
"}",
      lines: [
        "The pivot (here the last element) is the value everything is compared against.",
        "`i` marks the boundary: everything left of it is smaller than the pivot.",
        "Each smaller element is swapped into the left region, then `i` advances.",
        "Finally the pivot swaps into position `i` — its true sorted index — and each side recurses."
      ],
      why: "Quicksort is the sort behind many standard libraries because it's fast in practice and sorts in place. Understanding the partition invariant ('left of i is smaller') is also the key to quickselect, Dutch-flag partitioning, and interview-grade array manipulation.",
      challenge: "Why is a random or median pivot important for quicksort?",
      answer: "With a fixed pivot (like always the last element), already-sorted or reverse-sorted input produces maximally unbalanced partitions, degrading quicksort to O(n²). Choosing a random pivot (or median-of-three) makes such adversarial cases astronomically unlikely, keeping the expected running time at O(n log n)."
    },
    {
      id: "py-with-suppress",
      title: "contextlib.suppress for expected errors",
      lang: "py", topic: "Idioms", level: "Intermediate",
      concept: "`suppress` silences a specific exception you genuinely expect and want to ignore, replacing a noisy empty-`except` `try` block.",
      code:
"from contextlib import suppress\n" +
"import os\n" +
"\n" +
"# ignore 'file not found' when removing\n" +
"with suppress(FileNotFoundError):\n" +
"    os.remove('cache.tmp')\n" +
"\n" +
"# vs the verbose form:\n" +
"# try:\n" +
"#     os.remove('cache.tmp')\n" +
"# except FileNotFoundError:\n" +
"#     pass",
      lines: [
        "`suppress(FileNotFoundError)` ignores ONLY that exception type inside the block.",
        "If the file is missing, the `remove` fails silently — which is what we want here.",
        "Any OTHER exception still propagates normally, so real bugs aren't hidden.",
        "It replaces a four-line `try/except/pass` with one readable `with`."
      ],
      why: "The `try: ... except X: pass` idiom is common but visually noisy and tempts people to widen the caught type carelessly. `suppress` states 'I expect and accept exactly this error' in one line, keeping the intent — and the narrow scope — obvious.",
      challenge: "Why is `suppress(Exception)` usually a bad idea?",
      answer: "Suppressing the broad `Exception` swallows nearly every error — including bugs like `TypeError`, `KeyError`, and `ValueError` — so real failures pass silently and become nearly impossible to debug. Suppress only the specific, expected exception(s) you know how to safely ignore, and let everything else surface."
    },
    {
      id: "ts-never-exhaustive",
      title: "Exhaustiveness checking with never",
      lang: "ts", topic: "Types", level: "Advanced",
      concept: "Assigning the switch variable to a `never` in the default branch forces a compile error whenever a new union member isn't handled.",
      code:
"type Shape =\n" +
"  | { kind: 'circle'; r: number }\n" +
"  | { kind: 'square'; s: number };\n" +
"\n" +
"function area(shape: Shape): number {\n" +
"  switch (shape.kind) {\n" +
"    case 'circle': return Math.PI * shape.r ** 2;\n" +
"    case 'square': return shape.s ** 2;\n" +
"    default:\n" +
"      const _exhaustive: never = shape;  // compile-time guard\n" +
"      return _exhaustive;\n" +
"  }\n" +
"}",
      lines: [
        "After handling every known `kind`, `shape` in `default` narrows to `never`.",
        "Assigning it to `_exhaustive: never` type-checks ONLY while all cases are covered.",
        "Add a `{ kind: 'triangle' }` variant and `shape` is no longer `never` — compile error.",
        "That error points you straight at the switch that forgot the new case."
      ],
      why: "Adding a case to a discriminated union should force you to update every place that handles it. The `never` trick turns 'I forgot to handle the new variant' from a silent runtime bug into a compile-time error — a huge safety net as code evolves.",
      challenge: "Why does the variable narrow to `never` in the default branch?",
      answer: "TypeScript narrows the union as each `case` removes a member. Once `circle` and `square` are both handled, no possible value remains in `default`, so the type is `never` — the empty type. If a new variant is added but not cased, that variant survives into `default`, the type is no longer `never`, and the assignment to a `never` variable fails to compile."
    },
    {
      id: "js-throttle",
      title: "Throttle to cap event frequency",
      lang: "js", topic: "Async", level: "Intermediate",
      concept: "Throttling runs a function at most once per interval, guaranteeing steady updates during a continuous stream of events like scroll or mousemove.",
      code:
"function throttle(fn, ms) {\n" +
"  let last = 0;\n" +
"  return function (...args) {\n" +
"    const now = Date.now();\n" +
"    if (now - last >= ms) {\n" +
"      last = now;\n" +
"      fn.apply(this, args);\n" +
"    }\n" +
"  };\n" +
"}\n" +
"\n" +
"window.addEventListener('scroll', throttle(update, 100));",
      lines: [
        "`last` records the timestamp of the most recent allowed call.",
        "A new call runs only if at least `ms` has elapsed since `last`.",
        "During a fast scroll, `update` fires steadily — about once every 100ms.",
        "Unlike debounce, throttle DOES run during the burst, not only after it ends."
      ],
      why: "Debounce waits for silence; throttle guarantees regular progress. For scroll-position indicators, drag updates, or analytics sampling, you want steady updates while events pour in — throttle gives that without overwhelming the main thread.",
      challenge: "In one sentence, when do you pick throttle over debounce?",
      answer: "Pick throttle when you need periodic updates DURING a continuous stream (scroll position, drag, resizing), and debounce when you only care about the FINAL state after activity stops (search-as-you-type, autosave). Throttle guarantees a steady cadence; debounce guarantees a single trailing call once things go quiet."
    },
    {
      id: "algo-topological-sort",
      title: "Topological sort orders dependencies",
      lang: "algo", topic: "Algorithms", level: "Advanced",
      concept: "For a directed acyclic graph, repeatedly emit nodes with no remaining prerequisites (in-degree 0). The result is a valid dependency order.",
      code:
"function topoSort(graph) {           // graph: node -> [dependents]\n" +
"  const indeg = {};\n" +
"  for (const n in graph) indeg[n] = indeg[n] || 0;\n" +
"  for (const n in graph)\n" +
"    for (const m of graph[n]) indeg[m] = (indeg[m] || 0) + 1;\n" +
"  const queue = Object.keys(indeg).filter(n => indeg[n] === 0);\n" +
"  const order = [];\n" +
"  while (queue.length) {\n" +
"    const n = queue.shift();\n" +
"    order.push(n);\n" +
"    for (const m of graph[n] || [])\n" +
"      if (--indeg[m] === 0) queue.push(m);\n" +
"  }\n" +
"  return order.length === Object.keys(indeg).length ? order : null; // null = cycle\n" +
"}",
      lines: [
        "`indeg[n]` counts how many prerequisites each node still has.",
        "Start with all zero-prerequisite nodes — they can go first.",
        "Emitting a node decrements its dependents' in-degrees; new zeros join the queue.",
        "If some nodes never reach in-degree 0, there's a cycle — return null."
      ],
      why: "Build systems, task schedulers, package managers, and course-prerequisite planners all need a valid order that respects dependencies. Kahn's algorithm produces one in O(V+E) and simultaneously detects impossible (cyclic) dependency graphs.",
      challenge: "How does this algorithm reveal a dependency cycle?",
      answer: "In a cycle, every node involved always has at least one unsatisfied prerequisite, so none of them ever reaches in-degree 0 to be emitted. When the queue empties, the produced `order` contains fewer nodes than the graph, and that shortfall signals a cycle — which is why the code returns `null` when lengths don't match."
    }
  ];

  /* ============================================================
     SYNTAX HIGHLIGHTER — tiny hand-rolled tokeniser (no library).
     Produces spans with token classes; escapes text safely.
     ============================================================ */
  var KEYWORDS = {
    js: ["const","let","var","function","return","if","else","for","while","switch","case","break","continue","default","new","class","extends","this","typeof","instanceof","in","of","yield","async","await","throw","try","catch","finally","void","delete"],
    ts: ["const","let","var","function","return","if","else","for","while","switch","case","break","continue","default","new","class","extends","this","typeof","instanceof","in","of","interface","type","satisfies","as","readonly","keyof","never","import","export","enum","implements","public","private"],
    py: ["def","return","if","elif","else","for","while","in","not","and","or","is","import","from","as","with","try","except","else","finally","raise","yield","lambda","class","pass","None","True","False","global","nonlocal","del","assert","await","async"],
    algo: ["function","const","let","var","return","if","else","for","while","of","in","new","break","continue","yield"]
  };

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Returns an array of {type, value} tokens for a single line of code.
  function lexLine(line, lang) {
    var kw = KEYWORDS[lang] || KEYWORDS.js;
    var isPy = lang === "py";
    var tokens = [];
    var i = 0, n = line.length;

    function push(type, value) { tokens.push({ type: type, value: value }); }

    while (i < n) {
      var ch = line[i];

      // comments
      if (!isPy && ch === "/" && line[i + 1] === "/") { push("com", line.slice(i)); break; }
      if (isPy && ch === "#") { push("com", line.slice(i)); break; }

      // strings: ' " and JS template `
      if (ch === '"' || ch === "'" || ch === "`") {
        var quote = ch, j = i + 1, val = ch;
        while (j < n) {
          val += line[j];
          if (line[j] === "\\") { if (j + 1 < n) { val += line[j + 1]; j += 2; continue; } }
          if (line[j] === quote) { j++; break; }
          j++;
        }
        push("str", val);
        i = j;
        continue;
      }

      // numbers
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(line[i + 1] || ""))) {
        var m = /^(0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?)/.exec(line.slice(i));
        if (m) { push("num", m[0]); i += m[0].length; continue; }
      }

      // identifiers / keywords
      if (/[A-Za-z_$]/.test(ch)) {
        var id = "";
        while (i < n && /[A-Za-z0-9_$]/.test(line[i])) { id += line[i]; i++; }
        // function call? next non-space char is (
        var rest = line.slice(i);
        var isCall = /^\s*\(/.test(rest);
        if (kw.indexOf(id) !== -1) push("kw", id);
        else if (id === "true" || id === "false" || id === "null" || id === "undefined") push("num", id);
        else if (isCall) push("fn", id);
        else push("id", id);
        continue;
      }

      // operators / punctuation grouping (single char at a time is fine)
      if (/[+\-*/%=<>!&|^~?:.,;(){}\[\]]/.test(ch)) {
        push("op", ch);
        i++;
        continue;
      }

      // whitespace / anything else
      push("txt", ch);
      i++;
    }
    return tokens;
  }

  function highlightInto(preEl, code, lang) {
    preEl.innerHTML = "";
    var lines = code.split("\n");
    lines.forEach(function (line, idx) {
      var lineEl = el("span", "code__line");
      var toks = lexLine(line, lang);
      toks.forEach(function (t) {
        if (t.type === "txt") {
          lineEl.appendChild(document.createTextNode(t.value));
        } else {
          var span = el("span", "tok tok--" + t.type);
          span.textContent = t.value;
          lineEl.appendChild(span);
        }
      });
      if (line.length === 0) lineEl.appendChild(document.createTextNode(""));
      preEl.appendChild(lineEl);
      if (idx < lines.length - 1) preEl.appendChild(document.createTextNode("\n"));
    });
  }

  /* ============================================================
     DATE-SEEDED DETERMINISTIC PICK
     Same calendar day -> same lesson. Verified in tests.
     ============================================================ */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dateSeed(d) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function lessonForDate(d) {
    var seed = dateSeed(d);
    var idx = Math.floor(mulberry32(seed)() * CORPUS.length);
    return { index: idx, seed: seed };
  }

  function formatDate(d) {
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  /* ============================================================
     STATE — localStorage: streak + seen set
     ============================================================ */
  var LS_SEEN = "codedawn:seen";       // { lessonId: true }
  var LS_STREAK = "codedawn:streak";   // { count, lastDate: "YYYY-MM-DD" }
  var storageOk = true;

  function lsGet(key, fallback) {
    if (!storageOk) return fallback;
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    if (!storageOk) return;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { storageOk = false; }
  }

  function isoDay(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // Days between two ISO day strings (b - a), integer.
  function daysBetween(aIso, bIso) {
    var a = new Date(aIso + "T00:00:00");
    var b = new Date(bIso + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  var seen = lsGet(LS_SEEN, {}) || {};

  function markLearned(lessonId, todayIso) {
    var already = !!seen[lessonId];
    seen[lessonId] = true;
    lsSet(LS_SEEN, seen);

    // streak only advances on marking; measured in consecutive calendar days
    var streak = lsGet(LS_STREAK, { count: 0, lastDate: null }) || { count: 0, lastDate: null };
    if (streak.lastDate === todayIso) {
      // already counted today; leave count as is
    } else if (streak.lastDate && daysBetween(streak.lastDate, todayIso) === 1) {
      streak.count += 1;
      streak.lastDate = todayIso;
    } else {
      streak.count = 1;
      streak.lastDate = todayIso;
    }
    lsSet(LS_STREAK, streak);
    return { already: already, streak: streak };
  }

  function currentStreak(todayIso) {
    var streak = lsGet(LS_STREAK, { count: 0, lastDate: null }) || { count: 0, lastDate: null };
    if (!streak.lastDate) return 0;
    var gap = daysBetween(streak.lastDate, todayIso);
    if (gap === 0 || gap === 1) return streak.count; // today or yesterday keeps it live
    return 0; // lapsed
  }

  function seenCount() { return Object.keys(seen).filter(function (k) { return seen[k]; }).length; }

  /* ============================================================
     RENDER
     ============================================================ */
  var LANG_LABEL = { js: "JavaScript", ts: "TypeScript", py: "Python", algo: "Algorithm" };

  var state = {
    today: new Date(),
    index: 0,
    filterLang: "all"
  };

  function corpusIndicesForFilter() {
    if (state.filterLang === "all") return CORPUS.map(function (_, i) { return i; });
    return CORPUS.reduce(function (acc, l, i) {
      if (l.lang === state.filterLang) acc.push(i);
      return acc;
    }, []);
  }

  function renderLesson() {
    var lesson = CORPUS[state.index];
    var todayIso = isoDay(state.today);
    var todayPick = lessonForDate(state.today);
    var isToday = state.index === todayPick.index;

    // hero meta
    $("#dateLabel").textContent = formatDate(state.today);
    $("#todayBadge").hidden = !isToday;

    // lesson header
    $("#lessonTitle").textContent = lesson.title;

    var tagWrap = $("#lessonTags");
    tagWrap.innerHTML = "";
    var langTag = el("span", "ltag ltag--lang", LANG_LABEL[lesson.lang] || lesson.lang);
    tagWrap.appendChild(langTag);
    tagWrap.appendChild(el("span", "ltag", lesson.topic));
    tagWrap.appendChild(el("span", "ltag ltag--level", lesson.level));
    if (seen[lesson.id]) tagWrap.appendChild(el("span", "ltag ltag--done", "learned"));

    $("#lessonConcept").textContent = lesson.concept;

    // code
    var pre = $("#lessonCode");
    highlightInto(pre, lesson.code, lesson.lang);
    $("#codeLang").textContent = LANG_LABEL[lesson.lang] || lesson.lang;

    // walkthrough
    var wt = $("#lessonWalkthrough");
    wt.innerHTML = "";
    lesson.lines.forEach(function (pt) {
      wt.appendChild(el("li", "walk__pt", pt));
    });

    // why
    $("#lessonWhy").textContent = lesson.why;

    // challenge
    $("#lessonChallenge").textContent = lesson.challenge;
    $("#lessonAnswer").textContent = lesson.answer;
    $("#answerDetails").open = false;

    // mark button state
    var btn = $("#markBtn");
    if (seen[lesson.id]) {
      btn.textContent = "Learned ✓";
      btn.classList.add("btn--done");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.textContent = "Mark as learned";
      btn.classList.remove("btn--done");
      btn.setAttribute("aria-pressed", "false");
    }

    // position indicator
    $("#posIndicator").textContent = "Lesson " + (state.index + 1) + " of " + CORPUS.length;

    updateStats();
  }

  function updateStats() {
    var todayIso = isoDay(state.today);
    $("#statStreak").textContent = String(currentStreak(todayIso));
    $("#statSeen").textContent = seenCount() + " / " + CORPUS.length;
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function goToday() {
    state.index = lessonForDate(state.today).index;
    renderLesson();
  }

  function step(dir) {
    // step within the current filter set, wrapping around
    var pool = corpusIndicesForFilter();
    if (!pool.length) return;
    var at = pool.indexOf(state.index);
    if (at === -1) {
      // current lesson not in filter -> jump to nearest in pool
      state.index = pool[0];
    } else {
      var next = (at + dir + pool.length) % pool.length;
      state.index = pool[next];
    }
    renderLesson();
  }

  function surprise() {
    var pool = corpusIndicesForFilter();
    if (!pool.length) return;
    // random pick that avoids repeating the current lesson when possible
    var choice = state.index;
    if (pool.length === 1) { choice = pool[0]; }
    else {
      var guard = 0;
      do { choice = pool[Math.floor(Math.random() * pool.length)]; guard++; }
      while (choice === state.index && guard < 20);
    }
    state.index = choice;
    renderLesson();
  }

  function setFilter(lang) {
    state.filterLang = lang;
    $$(".filter").forEach(function (b) {
      var active = b.dataset.lang === lang;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    // if the current lesson isn't in the new filter, jump into it
    var pool = corpusIndicesForFilter();
    if (pool.indexOf(state.index) === -1 && pool.length) {
      state.index = pool[0];
    }
    renderLesson();
  }

  /* ============================================================
     HORIZON MOTIF — a single thin sun-line that shifts by seed.
     ============================================================ */
  function renderHorizon() {
    var g = $(".horizon__line");
    if (!g) return;
    // position the sun along the horizon deterministically by today's seed
    var seed = dateSeed(state.today);
    var t = mulberry32(seed)();
    var sun = $("#horizonSun");
    if (sun) {
      var cx = 120 + t * 1000; // within the 1200 viewBox, off the extreme edges
      sun.setAttribute("cx", cx.toFixed(1));
    }
  }

  /* ============================================================
     WIRE UP
     ============================================================ */
  function init() {
    // storage feature test
    try { localStorage.setItem("codedawn:test", "1"); localStorage.removeItem("codedawn:test"); }
    catch (e) { storageOk = false; }
    seen = lsGet(LS_SEEN, {}) || {};

    // default to today's lesson
    state.index = lessonForDate(state.today).index;

    $("#prevBtn").addEventListener("click", function () { step(-1); });
    $("#nextBtn").addEventListener("click", function () { step(1); });
    $("#surpriseBtn").addEventListener("click", surprise);
    $("#todayBtn").addEventListener("click", goToday);

    $("#markBtn").addEventListener("click", function () {
      var lesson = CORPUS[state.index];
      var todayIso = isoDay(state.today);
      if (seen[lesson.id]) {
        // allow un-marking (does not touch streak history)
        delete seen[lesson.id];
        lsSet(LS_SEEN, seen);
      } else {
        markLearned(lesson.id, todayIso);
      }
      renderLesson();
    });

    $$(".filter").forEach(function (b) {
      b.addEventListener("click", function () { setFilter(b.dataset.lang); });
    });

    // keyboard: left/right arrows navigate
    document.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") { step(-1); }
      else if (e.key === "ArrowRight") { step(1); }
    });

    renderHorizon();
    renderLesson();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
