
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const color = writable(undefined);

    /* src\components\Canvas.svelte generated by Svelte v3.38.3 */
    const file$3 = "src\\components\\Canvas.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (17:7) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*placeholder*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 4) set_data_dev(t, /*placeholder*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(17:7) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (15:7) {#if item.name != "Empty"}
    function create_if_block$2(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*block*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*block*/ 2) set_data_dev(t, /*block*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(15:7) {#if item.name != \\\"Empty\\\"}",
    		ctx
    	});

    	return block_1;
    }

    // (12:5) {#each row as item, j}
    function create_each_block_1$1(ctx) {
    	let span;
    	let span_title_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[8].name != "Empty") return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*item*/ ctx[8], /*each_value_1*/ ctx[9], /*j*/ ctx[10]);
    	}

    	const block_1 = {
    		c: function create() {
    			span = element("span");
    			if_block.c();
    			set_style(span, "color", /*item*/ ctx[8].color);
    			attr_dev(span, "title", span_title_value = /*item*/ ctx[8].name);
    			attr_dev(span, "class", "pointer svelte-v301lh");
    			add_location(span, file$3, 12, 6, 222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if_block.m(span, null);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}

    			if (dirty & /*grid*/ 1) {
    				set_style(span, "color", /*item*/ ctx[8].color);
    			}

    			if (dirty & /*grid*/ 1 && span_title_value !== (span_title_value = /*item*/ ctx[8].name)) {
    				attr_dev(span, "title", span_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(12:5) {#each row as item, j}",
    		ctx
    	});

    	return block_1;
    }

    // (11:4) {#each grid as row, i}
    function create_each_block$2(ctx) {
    	let t;
    	let br;
    	let each_value_1 = /*row*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block_1 = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			br = element("br");
    			add_location(br, file$3, 21, 5, 474);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, $color, block, placeholder*/ 15) {
    				each_value_1 = /*row*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(11:4) {#each grid as row, i}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = /*grid*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block_1 = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "canvas svelte-v301lh");
    			add_location(div, file$3, 9, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid, $color, block, placeholder*/ 15) {
    				each_value = /*grid*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $color;
    	validate_store(color, "color");
    	component_subscribe($$self, color, $$value => $$invalidate(3, $color = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Canvas", slots, []);
    	let { grid } = $$props;
    	let { block } = $$props;
    	let { placeholder } = $$props;
    	const writable_props = ["grid", "block", "placeholder"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (item, each_value_1, j) => $$invalidate(0, each_value_1[j] = $color, grid);

    	$$self.$$set = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    		if ("block" in $$props) $$invalidate(1, block = $$props.block);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({ color, grid, block, placeholder, $color });

    	$$self.$inject_state = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    		if ("block" in $$props) $$invalidate(1, block = $$props.block);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [grid, block, placeholder, $color, click_handler];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { grid: 0, block: 1, placeholder: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*grid*/ ctx[0] === undefined && !("grid" in props)) {
    			console.warn("<Canvas> was created without expected prop 'grid'");
    		}

    		if (/*block*/ ctx[1] === undefined && !("block" in props)) {
    			console.warn("<Canvas> was created without expected prop 'block'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Canvas> was created without expected prop 'placeholder'");
    		}
    	}

    	get grid() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grid(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CopyArea.svelte generated by Svelte v3.38.3 */

    const file$2 = "src\\components\\CopyArea.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (18:3) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*placeholder*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 2) set_data_dev(t, /*placeholder*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(18:3) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (10:2) {#if item.name != "Empty"}
    function create_if_block$1(ctx) {
    	let t;

    	function select_block_type_1(ctx, dirty) {
    		if (/*j*/ ctx[8] == 0) return create_if_block_1;
    		if (/*grid*/ ctx[0][/*i*/ ctx[5]][/*j*/ ctx[8] - 1] != /*grid*/ ctx[0][/*i*/ ctx[5]][/*j*/ ctx[8]]) return create_if_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block_1 = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = text(/*block*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}

    			if (dirty & /*block*/ 4) set_data_dev(t, /*block*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(10:2) {#if item.name != \\\"Empty\\\"}",
    		ctx
    	});

    	return block_1;
    }

    // (14:45) 
    function create_if_block_2(ctx) {
    	let t_value = /*item*/ ctx[6].code + "";
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid*/ 1 && t_value !== (t_value = /*item*/ ctx[6].code + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:45) ",
    		ctx
    	});

    	return block_1;
    }

    // (12:3) {#if j == 0}
    function create_if_block_1(ctx) {
    	let t_value = /*item*/ ctx[6].code + "";
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid*/ 1 && t_value !== (t_value = /*item*/ ctx[6].code + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:3) {#if j == 0}",
    		ctx
    	});

    	return block_1;
    }

    // (9:1) {#each row as item, j}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[6].name != "Empty") return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(9:1) {#each row as item, j}",
    		ctx
    	});

    	return block_1;
    }

    // (8:0) {#each grid as row, i}
    function create_each_block$1(ctx) {
    	let t;
    	let br;
    	let each_value_1 = /*row*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block_1 = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			br = element("br");
    			add_location(br, file$2, 21, 1, 458);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*block, grid, placeholder*/ 7) {
    				each_value_1 = /*row*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(8:0) {#each grid as row, i}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_value = /*grid*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block_1 = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "copy-area svelte-19xtmsz");
    			add_location(div, file$2, 6, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid, block, placeholder*/ 7) {
    				each_value = /*grid*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CopyArea", slots, []);
    	let { grid } = $$props;
    	let { placeholder } = $$props;
    	let { block } = $$props;
    	const writable_props = ["grid", "placeholder", "block"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CopyArea> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("block" in $$props) $$invalidate(2, block = $$props.block);
    	};

    	$$self.$capture_state = () => ({ grid, placeholder, block });

    	$$self.$inject_state = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ("block" in $$props) $$invalidate(2, block = $$props.block);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [grid, placeholder, block];
    }

    class CopyArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { grid: 0, placeholder: 1, block: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CopyArea",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*grid*/ ctx[0] === undefined && !("grid" in props)) {
    			console.warn("<CopyArea> was created without expected prop 'grid'");
    		}

    		if (/*placeholder*/ ctx[1] === undefined && !("placeholder" in props)) {
    			console.warn("<CopyArea> was created without expected prop 'placeholder'");
    		}

    		if (/*block*/ ctx[2] === undefined && !("block" in props)) {
    			console.warn("<CopyArea> was created without expected prop 'block'");
    		}
    	}

    	get grid() {
    		throw new Error("<CopyArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grid(value) {
    		throw new Error("<CopyArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<CopyArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<CopyArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<CopyArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<CopyArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Picker.svelte generated by Svelte v3.38.3 */
    const file$1 = "src\\components\\Picker.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (15:6) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*placeholder*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 4) set_data_dev(t, /*placeholder*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block.name,
    		type: "else",
    		source: "(15:6) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (13:6) {#if item.name != "Empty"}
    function create_if_block(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*block*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*block*/ 2) set_data_dev(t, /*block*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:6) {#if item.name != \\\"Empty\\\"}",
    		ctx
    	});

    	return block_1;
    }

    // (10:4) {#each colors as item}
    function create_each_block(ctx) {
    	let span;
    	let t;
    	let span_title_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[4].name != "Empty") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*item*/ ctx[4]);
    	}

    	const block_1 = {
    		c: function create() {
    			span = element("span");
    			if_block.c();
    			t = space();
    			set_style(span, "color", /*item*/ ctx[4].color);
    			attr_dev(span, "title", span_title_value = /*item*/ ctx[4].name);
    			attr_dev(span, "class", "pointer svelte-1sdiioi");
    			add_location(span, file$1, 10, 5, 199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if_block.m(span, null);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, t);
    				}
    			}

    			if (dirty & /*colors*/ 1) {
    				set_style(span, "color", /*item*/ ctx[4].color);
    			}

    			if (dirty & /*colors*/ 1 && span_title_value !== (span_title_value = /*item*/ ctx[4].name)) {
    				attr_dev(span, "title", span_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:4) {#each colors as item}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = /*colors*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block_1 = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "color-picker svelte-1sdiioi");
    			add_location(div, file$1, 8, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*colors, color, block, placeholder*/ 7) {
    				each_value = /*colors*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Picker", slots, []);
    	let { colors } = $$props;
    	let { block } = $$props;
    	let { placeholder } = $$props;
    	const writable_props = ["colors", "block", "placeholder"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Picker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => color.set(item);

    	$$self.$$set = $$props => {
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("block" in $$props) $$invalidate(1, block = $$props.block);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({ color, colors, block, placeholder });

    	$$self.$inject_state = $$props => {
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("block" in $$props) $$invalidate(1, block = $$props.block);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [colors, block, placeholder, click_handler];
    }

    class Picker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { colors: 0, block: 1, placeholder: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Picker",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*colors*/ ctx[0] === undefined && !("colors" in props)) {
    			console.warn("<Picker> was created without expected prop 'colors'");
    		}

    		if (/*block*/ ctx[1] === undefined && !("block" in props)) {
    			console.warn("<Picker> was created without expected prop 'block'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Picker> was created without expected prop 'placeholder'");
    		}
    	}

    	get colors() {
    		throw new Error("<Picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<Picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Picker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Picker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.3 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let canvas;
    	let updating_grid;
    	let t0;
    	let div1;
    	let picker;
    	let t1;
    	let div2;
    	let copyarea;
    	let updating_grid_1;
    	let current;

    	function canvas_grid_binding(value) {
    		/*canvas_grid_binding*/ ctx[2](value);
    	}

    	let canvas_props = { block, placeholder };

    	if (/*grid*/ ctx[0] !== void 0) {
    		canvas_props.grid = /*grid*/ ctx[0];
    	}

    	canvas = new Canvas({ props: canvas_props, $$inline: true });
    	binding_callbacks.push(() => bind(canvas, "grid", canvas_grid_binding));

    	picker = new Picker({
    			props: {
    				block,
    				placeholder,
    				colors: /*colors*/ ctx[1]
    			},
    			$$inline: true
    		});

    	function copyarea_grid_binding(value) {
    		/*copyarea_grid_binding*/ ctx[3](value);
    	}

    	let copyarea_props = { block, placeholder };

    	if (/*grid*/ ctx[0] !== void 0) {
    		copyarea_props.grid = /*grid*/ ctx[0];
    	}

    	copyarea = new CopyArea({ props: copyarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(copyarea, "grid", copyarea_grid_binding));

    	const block_1 = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			create_component(canvas.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(picker.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(copyarea.$$.fragment);
    			attr_dev(div0, "class", "center svelte-w5ysuk");
    			add_location(div0, file, 117, 1, 3407);
    			attr_dev(div1, "class", "center svelte-w5ysuk");
    			add_location(div1, file, 121, 1, 3508);
    			attr_dev(div2, "class", "center svelte-w5ysuk");
    			add_location(div2, file, 125, 1, 3608);
    			add_location(main, file, 116, 0, 3399);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			mount_component(canvas, div0, null);
    			append_dev(main, t0);
    			append_dev(main, div1);
    			mount_component(picker, div1, null);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			mount_component(copyarea, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_changes = {};

    			if (!updating_grid && dirty & /*grid*/ 1) {
    				updating_grid = true;
    				canvas_changes.grid = /*grid*/ ctx[0];
    				add_flush_callback(() => updating_grid = false);
    			}

    			canvas.$set(canvas_changes);
    			const copyarea_changes = {};

    			if (!updating_grid_1 && dirty & /*grid*/ 1) {
    				updating_grid_1 = true;
    				copyarea_changes.grid = /*grid*/ ctx[0];
    				add_flush_callback(() => updating_grid_1 = false);
    			}

    			copyarea.$set(copyarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			transition_in(picker.$$.fragment, local);
    			transition_in(copyarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			transition_out(picker.$$.fragment, local);
    			transition_out(copyarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(canvas);
    			destroy_component(picker);
    			destroy_component(copyarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    const block = "█";
    const placeholder = "▓";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const colors = [
    		{ "color": "", "code": "", "name": "Empty" },
    		{
    			"color": "#000000",
    			"code": "§0",
    			"name": "Black"
    		},
    		{
    			"color": "#0000AA",
    			"code": "§1",
    			"name": "Dark Blue"
    		},
    		{
    			"color": "#00AA00",
    			"code": "§2",
    			"name": "Dark Green"
    		},
    		{
    			"color": "#00AAAA",
    			"code": "§3",
    			"name": "Dark Aqua"
    		},
    		{
    			"color": "#AA0000",
    			"code": "§4",
    			"name": "Dark Red"
    		},
    		{
    			"color": "#AA00AA",
    			"code": "§5",
    			"name": "Dark Purple"
    		},
    		{
    			"color": "#FFAA00",
    			"code": "§6",
    			"name": "Gold"
    		},
    		{
    			"color": "#AAAAAA",
    			"code": "§7",
    			"name": "Gray"
    		},
    		{
    			"color": "#555555",
    			"code": "§8",
    			"name": "Dark Gray"
    		},
    		{
    			"color": "#5555FF",
    			"code": "§9",
    			"name": "Blue"
    		},
    		{
    			"color": "#55FF55",
    			"code": "§a",
    			"name": "Green"
    		},
    		{
    			"color": "#55FFFF",
    			"code": "§b",
    			"name": "Aqua"
    		},
    		{
    			"color": "#FF5555",
    			"code": "§c",
    			"name": "Red"
    		},
    		{
    			"color": "#FF55FF",
    			"code": "§d",
    			"name": "Light Purple"
    		},
    		{
    			"color": "#FFFF55",
    			"code": "§e",
    			"name": "Yellow"
    		},
    		{
    			"color": "#FFFFFF",
    			"code": "§f",
    			"name": "White"
    		}
    	];

    	let grid = [
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		],
    		[
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0],
    			colors[0]
    		]
    	];

    	color.set(colors[0]);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function canvas_grid_binding(value) {
    		grid = value;
    		$$invalidate(0, grid);
    	}

    	function copyarea_grid_binding(value) {
    		grid = value;
    		$$invalidate(0, grid);
    	}

    	$$self.$capture_state = () => ({
    		Canvas,
    		CopyArea,
    		Picker,
    		color,
    		colors,
    		block,
    		placeholder,
    		grid
    	});

    	$$self.$inject_state = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [grid, colors, canvas_grid_binding, copyarea_grid_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
