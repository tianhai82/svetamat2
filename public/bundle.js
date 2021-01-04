
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
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

    /* src\Tailwindcss.svelte generated by Svelte v3.31.0 */

    class Tailwindcss extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, null, safe_not_equal, {});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src\widgets\NavigationDrawer.svelte generated by Svelte v3.31.0 */

    function create_if_block_2(ctx) {
    	let div;
    	let div_class_value;
    	let div_transition;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "class", div_class_value = `elevation-8 fixed top-0 bottom-0 left-0 z-40 ${/*marginTop*/ ctx[2]}`);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*marginTop*/ 4 && div_class_value !== (div_class_value = `elevation-8 fixed top-0 bottom-0 left-0 z-40 ${/*marginTop*/ ctx[2]}`)) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -300, duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -300, duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    // (8:0) {#if modal}
    function create_if_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[0] && create_if_block_1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*visible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (9:2) {#if visible}
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let div0_transition;
    	let t;
    	let div1;
    	let div1_transition;
    	let div2_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "w-full h-full fixed left-0 bg-black opacity-50 z-30");
    			attr(div1, "class", "elevation-8 z-40");
    			toggle_class(div1, "`${marginTop}`", /*marginTop*/ ctx[2]);
    			attr(div2, "class", div2_class_value = `flex fixed top-0 bottom-0 z-40 left-0 right-0 ${/*marginTop*/ ctx[2]}`);
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t);
    			append(div2, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(div0, "click", /*click_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (dirty & /*marginTop*/ 4) {
    				toggle_class(div1, "`${marginTop}`", /*marginTop*/ ctx[2]);
    			}

    			if (!current || dirty & /*marginTop*/ 4 && div2_class_value !== (div2_class_value = `flex fixed top-0 bottom-0 z-40 left-0 right-0 ${/*marginTop*/ ctx[2]}`)) {
    				attr(div2, "class", div2_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 300 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -300, duration: 300 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 300 }, false);
    			div0_transition.run(0);
    			transition_out(default_slot, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -300, duration: 300 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (detaching && div0_transition) div0_transition.end();
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*modal*/ ctx[1]) return 0;
    		if (/*visible*/ ctx[0]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { modal = false } = $$props;
    	let { visible = false } = $$props;
    	let { marginTop = "" } = $$props;
    	const click_handler = () => $$invalidate(0, visible = !visible);

    	$$self.$$set = $$props => {
    		if ("modal" in $$props) $$invalidate(1, modal = $$props.modal);
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("marginTop" in $$props) $$invalidate(2, marginTop = $$props.marginTop);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	return [visible, modal, marginTop, $$scope, slots, click_handler];
    }

    class NavigationDrawer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { modal: 1, visible: 0, marginTop: 2 });
    	}
    }

    /* src\svg\Github.svelte generated by Svelte v3.31.0 */

    function create_fragment$1(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    class Github extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src\components\Installation.svelte generated by Svelte v3.31.0 */

    function create_fragment$2(ctx) {
    	let h20;
    	let t1;
    	let p0;
    	let t3;
    	let h21;
    	let t5;
    	let p1;
    	let t7;
    	let p2;

    	return {
    		c() {
    			h20 = element("h2");
    			h20.textContent = "Introduction";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Svetamat is a set of Material UI styled widgets for Svelte 3. It is created\n  and should be used together with Tailwindcss.";
    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Installation";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "To create a new project, use the svetamat-template:";
    			t7 = space();
    			p2 = element("p");
    			p2.innerHTML = `npx degit tianhai82/svetamat-template svelte-app <br/>cd svelte-app<br/>yarn`;
    			attr(h20, "class", "text-xl font-semibold mt-6");
    			attr(p0, "class", "my-2");
    			attr(h21, "class", "text-xl font-semibold mt-6");
    			attr(p1, "class", "my-2");
    			attr(p2, "class", "bg-gray-200 rounded p-5 font-light text-lg");
    		},
    		m(target, anchor) {
    			insert(target, h20, anchor);
    			insert(target, t1, anchor);
    			insert(target, p0, anchor);
    			insert(target, t3, anchor);
    			insert(target, h21, anchor);
    			insert(target, t5, anchor);
    			insert(target, p1, anchor);
    			insert(target, t7, anchor);
    			insert(target, p2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(h20);
    			if (detaching) detach(t1);
    			if (detaching) detach(p0);
    			if (detaching) detach(t3);
    			if (detaching) detach(h21);
    			if (detaching) detach(t5);
    			if (detaching) detach(p1);
    			if (detaching) detach(t7);
    			if (detaching) detach(p2);
    		}
    	};
    }

    class Installation extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src\widgets\Button.svelte generated by Svelte v3.31.0 */

    function create_fragment$3(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	return {
    		c() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr(button, "class", button_class_value = `${/*cls*/ ctx[1]} ${/*disabledCls*/ ctx[2]}`);
    			button.disabled = /*disabled*/ ctx[0];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[18]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 65536) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*cls, disabledCls*/ 6 && button_class_value !== (button_class_value = `${/*cls*/ ctx[1]} ${/*disabledCls*/ ctx[2]}`)) {
    				attr(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 1) {
    				button.disabled = /*disabled*/ ctx[0];
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    let baseCls = "focus:outline-none uppercase tracking-wide";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { text = false } = $$props;
    	let { fab = false } = $$props;
    	let { outlined = false } = $$props;
    	let { rounded = false } = $$props;
    	let { tile = false } = $$props;
    	let { block = false } = $$props;
    	let { xs = false } = $$props;
    	let { sm = false } = $$props;
    	let { lg = false } = $$props;
    	let { xl = false } = $$props;
    	let { disabled = false } = $$props;
    	let { textColor = "text-black" } = $$props;
    	let { outlineColor = "border-black" } = $$props;
    	let { bgColor = "bg-transparent" } = $$props;
    	let cls = "";
    	let disabledCls;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(3, text = $$props.text);
    		if ("fab" in $$props) $$invalidate(4, fab = $$props.fab);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$props.outlined);
    		if ("rounded" in $$props) $$invalidate(6, rounded = $$props.rounded);
    		if ("tile" in $$props) $$invalidate(7, tile = $$props.tile);
    		if ("block" in $$props) $$invalidate(8, block = $$props.block);
    		if ("xs" in $$props) $$invalidate(9, xs = $$props.xs);
    		if ("sm" in $$props) $$invalidate(10, sm = $$props.sm);
    		if ("lg" in $$props) $$invalidate(11, lg = $$props.lg);
    		if ("xl" in $$props) $$invalidate(12, xl = $$props.xl);
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("textColor" in $$props) $$invalidate(13, textColor = $$props.textColor);
    		if ("outlineColor" in $$props) $$invalidate(14, outlineColor = $$props.outlineColor);
    		if ("bgColor" in $$props) $$invalidate(15, bgColor = $$props.bgColor);
    		if ("$$scope" in $$props) $$invalidate(16, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*outlined, textColor, outlineColor, bgColor, text, rounded, fab, tile, block, xs, sm, lg, xl*/ 65528) {
    			 {
    				let tempCls = "";

    				if (outlined) {
    					tempCls = baseCls + ` border border-solid ${textColor} ${outlineColor} ${bgColor}`;
    				} else if (text) {
    					tempCls = baseCls + ` ${textColor} ${bgColor}`;
    				} else {
    					tempCls = baseCls + ` elevation-2 ${textColor} ${bgColor}`;
    				}

    				if (rounded) {
    					tempCls += " rounded-full";
    				}

    				if (fab) {
    					tempCls += " rounded-full flex items-center justify-center";
    				}

    				if (!tile) {
    					tempCls += " rounded";
    				}

    				if (block) {
    					tempCls += " block w-full";
    				}

    				if (xs) {
    					tempCls += " h-5 text-xs px-2";
    				} else if (sm) {
    					tempCls += " h-6 text-sm px-3";
    				} else if (lg) {
    					tempCls += " h-10 text-lg px-5";
    				} else if (xl) {
    					tempCls += " h-12 text-xl px-6";
    				} else {
    					tempCls += " h-8 text-base px-4";
    				}

    				$$invalidate(1, cls = tempCls.trim());
    			}
    		}

    		if ($$self.$$.dirty & /*disabled, outlined, text*/ 41) {
    			 if (disabled) {
    				$$invalidate(2, disabledCls = "opacity-25 cursor-not-allowed");
    			} else {
    				let hover;

    				if (outlined) {
    					hover = "hover:elevation-1";
    				} else if (text) {
    					hover = "hover:elevation-1";
    				} else {
    					hover = "hover:elevation-4";
    				}

    				$$invalidate(2, disabledCls = `${hover} active:elevation-0 ripple`);
    			}
    		}
    	};

    	return [
    		disabled,
    		cls,
    		disabledCls,
    		text,
    		fab,
    		outlined,
    		rounded,
    		tile,
    		block,
    		xs,
    		sm,
    		lg,
    		xl,
    		textColor,
    		outlineColor,
    		bgColor,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Button extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$3, safe_not_equal, {
    			text: 3,
    			fab: 4,
    			outlined: 5,
    			rounded: 6,
    			tile: 7,
    			block: 8,
    			xs: 9,
    			sm: 10,
    			lg: 11,
    			xl: 12,
    			disabled: 0,
    			textColor: 13,
    			outlineColor: 14,
    			bgColor: 15
    		});
    	}
    }

    /* src\widgets\Checkbox.svelte generated by Svelte v3.31.0 */

    function create_else_block_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("check_box_outline_blank");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (35:30) 
    function create_if_block_2$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("indeterminate_check_box");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (33:6) {#if checked}
    function create_if_block_1$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("check_box");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (44:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (42:2) {#if label}
    function create_if_block$1(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data(t, /*label*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let label_1;
    	let input;
    	let t0;
    	let div;
    	let span;
    	let t1;
    	let current_block_type_index;
    	let if_block1;
    	let label_1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*checked*/ ctx[0]) return create_if_block_1$1;
    		if (/*indeterminate*/ ctx[1]) return create_if_block_2$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*label*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			label_1 = element("label");
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			span = element("span");
    			if_block0.c();
    			t1 = space();
    			if_block1.c();
    			attr(input, "type", "checkbox");
    			input.disabled = /*disabled*/ ctx[4];
    			input.hidden = true;
    			attr(span, "class", "material-icons");
    			attr(div, "class", "select-none rounded-full hover:bg-gray-300 w-8 h-8 flex items-center justify-center");
    			attr(label_1, "class", label_1_class_value = "flex items-center " + /*color*/ ctx[3]);
    			attr(label_1, "disabled", /*disabled*/ ctx[4]);
    			toggle_class(label_1, "cursor-not-allowed", /*disabled*/ ctx[4]);
    			toggle_class(label_1, "cursor-pointer", !/*disabled*/ ctx[4]);
    		},
    		m(target, anchor) {
    			insert(target, label_1, anchor);
    			append(label_1, input);
    			input.checked = /*checked*/ ctx[0];
    			append(label_1, t0);
    			append(label_1, div);
    			append(div, span);
    			if_block0.m(span, null);
    			append(label_1, t1);
    			if_blocks[current_block_type_index].m(label_1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input, "change", /*input_change_handler*/ ctx[9]),
    					listen(input, "change", /*handleChange*/ ctx[5]),
    					listen(input, "input", /*handleInput*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*disabled*/ 16) {
    				input.disabled = /*disabled*/ ctx[4];
    			}

    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(label_1, null);
    			}

    			if (!current || dirty & /*color*/ 8 && label_1_class_value !== (label_1_class_value = "flex items-center " + /*color*/ ctx[3])) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 16) {
    				attr(label_1, "disabled", /*disabled*/ ctx[4]);
    			}

    			if (dirty & /*color, disabled*/ 24) {
    				toggle_class(label_1, "cursor-not-allowed", /*disabled*/ ctx[4]);
    			}

    			if (dirty & /*color, disabled*/ 24) {
    				toggle_class(label_1, "cursor-pointer", !/*disabled*/ ctx[4]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(label_1);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { checked = false } = $$props;
    	let { indeterminate = false } = $$props;
    	let { color = "text-black" } = $$props;
    	let { disabled = false } = $$props;

    	function handleChange(e) {
    		$$invalidate(1, indeterminate = false);
    		dispatch("change", e.target.checked);
    	}

    	function handleInput(e) {
    		$$invalidate(1, indeterminate = false);
    		dispatch("input", e.target.checked);
    	}

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("indeterminate" in $$props) $$invalidate(1, indeterminate = $$props.indeterminate);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	return [
    		checked,
    		indeterminate,
    		label,
    		color,
    		disabled,
    		handleChange,
    		handleInput,
    		$$scope,
    		slots,
    		input_change_handler
    	];
    }

    class Checkbox extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$2, create_fragment$4, safe_not_equal, {
    			label: 2,
    			checked: 0,
    			indeterminate: 1,
    			color: 3,
    			disabled: 4
    		});
    	}
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

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src\widgets\InputStd.svelte generated by Svelte v3.31.0 */

    function create_if_block$2(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[3]);
    			attr(div, "class", div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[18]) + " svelte-1cjqtag"));
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 8) set_data(t, /*helperText*/ ctx[3]);

    			if (dirty[0] & /*helperTextCls*/ 262144 && div_class_value !== (div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[18]) + " svelte-1cjqtag"))) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let div3;
    	let div2;
    	let label_1;
    	let t0;
    	let label_1_style_value;
    	let label_1_class_value;
    	let t1;
    	let div1;
    	let input;
    	let t2;
    	let div0;
    	let i0;
    	let t3;
    	let i0_class_value;
    	let t4;
    	let i1;
    	let t5;
    	let i1_class_value;
    	let div2_class_value;
    	let t6;
    	let div3_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[7] && create_if_block$2(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t3 = text("clear");
    			t4 = space();
    			i1 = element("i");
    			t5 = text(/*icon*/ ctx[4]);
    			t6 = space();
    			if (if_block) if_block.c();
    			attr(label_1, "style", label_1_style_value = `${/*labelTopPadding*/ ctx[17]} max-width:${/*boxWidth*/ ctx[14]}px;`);
    			attr(label_1, "class", label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[15]} truncate`) + " svelte-1cjqtag"));
    			attr(input, "type", /*type*/ ctx[12]);
    			input.readOnly = /*readonly*/ ctx[8];
    			input.value = /*value*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[6];
    			attr(input, "min", /*min*/ ctx[9]);
    			attr(input, "max", /*max*/ ctx[10]);
    			attr(input, "style", /*inputPadBottom*/ ctx[16]);
    			attr(input, "class", "pt-6 appearance-none bg-transparent border-none w-full\r\n        text-gray-800 px-2 focus:outline-none");

    			attr(i0, "class", i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "");

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			attr(i1, "class", i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[13]) + " svelte-1cjqtag"));
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			attr(div0, "class", "float-right flex items-center mr-2 mt-3");
    			attr(div1, "class", "flex justify-between");

    			attr(div2, "class", div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[11]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ""
				: " hover:border-gray-900 hover:bg-gray-100"}`) + " svelte-1cjqtag"));

    			toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			attr(div3, "class", "flex flex-col");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[36].call(div3));
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, label_1);
    			append(label_1, t0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, input);
    			append(div1, t2);
    			append(div1, div0);
    			append(div0, i0);
    			append(i0, t3);
    			append(div0, t4);
    			append(div0, i1);
    			append(i1, t5);
    			append(div3, t6);
    			if (if_block) if_block.m(div3, null);
    			div3_resize_listener = add_resize_listener(div3, /*div3_elementresize_handler*/ ctx[36].bind(div3));

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*handleInput*/ ctx[20]),
    					listen(input, "focus", /*focus_handler_1*/ ctx[34]),
    					listen(input, "blur", /*blur_handler_1*/ ctx[35]),
    					listen(input, "focus", /*focus_handler*/ ctx[29]),
    					listen(input, "blur", /*blur_handler*/ ctx[30]),
    					listen(input, "keydown", /*keydown_handler*/ ctx[31]),
    					listen(input, "keyup", /*keyup_handler*/ ctx[32]),
    					listen(input, "click", /*click_handler*/ ctx[33]),
    					listen(i0, "click", /*clear*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*label*/ 2) set_data(t0, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTopPadding, boxWidth*/ 147456 && label_1_style_value !== (label_1_style_value = `${/*labelTopPadding*/ ctx[17]} max-width:${/*boxWidth*/ ctx[14]}px;`)) {
    				attr(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 32768 && label_1_class_value !== (label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[15]} truncate`) + " svelte-1cjqtag"))) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 4096) {
    				attr(input, "type", /*type*/ ctx[12]);
    			}

    			if (dirty[0] & /*readonly*/ 256) {
    				input.readOnly = /*readonly*/ ctx[8];
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				input.value = /*value*/ ctx[0];
    			}

    			if (dirty[0] & /*disabled*/ 64) {
    				input.disabled = /*disabled*/ ctx[6];
    			}

    			if (dirty[0] & /*min*/ 512) {
    				attr(input, "min", /*min*/ ctx[9]);
    			}

    			if (dirty[0] & /*max*/ 1024) {
    				attr(input, "max", /*max*/ ctx[10]);
    			}

    			if (dirty[0] & /*inputPadBottom*/ 65536) {
    				attr(input, "style", /*inputPadBottom*/ ctx[16]);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 96 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "")) {
    				attr(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 96) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*icon*/ 16) set_data(t5, /*icon*/ ctx[4]);

    			if (dirty[0] & /*iconCls*/ 8192 && i1_class_value !== (i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[13]) + " svelte-1cjqtag"))) {
    				attr(i1, "class", i1_class_value);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 8256) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled*/ 2116 && div2_class_value !== (div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[11]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ""
				: " hover:border-gray-900 hover:bg-gray-100"}`) + " svelte-1cjqtag"))) {
    				attr(div2, "class", div2_class_value);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 2116) {
    				toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 2116) {
    				toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			}

    			if (!/*hideDetails*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (if_block) if_block.d();
    			div3_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $y;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { password = false } = $$props;
    	let { date = false } = $$props;
    	let { min = null } = $$props;
    	let { max = null } = $$props;
    	let hasFocus = false;
    	let iconCls = "";
    	let boxWidth;
    	const y = tweened(1, { duration: 50 });
    	component_subscribe($$self, y, value => $$invalidate(28, $y = value));
    	let type = "text";

    	function handleInput(event) {
    		switch (type) {
    			case "text":
    				$$invalidate(0, value = event.target.value);
    				break;
    			case "number":
    				$$invalidate(0, value = +event.target.value);
    			default:
    				$$invalidate(0, value = event.target.value);
    		}

    		dispatch("input", value);
    	}

    	let labelCls = "absolute left-0 px-2 text-sm text-gray-600 pointer-events-none";
    	let inputPadBottom = "";

    	function setLabelColor(prefix) {
    		$$invalidate(15, labelCls = `${prefix} ${labelColor}`);
    	}

    	let valueEmpty = false;

    	function clear() {
    		$$invalidate(0, value = "");
    		dispatch("clear");
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const focus_handler_1 = () => $$invalidate(11, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(11, hasFocus = false);

    	function div3_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(14, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(22, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(2, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(23, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(3, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(24, helperTextColor = $$props.helperTextColor);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(5, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(7, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(8, readonly = $$props.readonly);
    		if ("password" in $$props) $$invalidate(25, password = $$props.password);
    		if ("date" in $$props) $$invalidate(26, date = $$props.date);
    		if ("min" in $$props) $$invalidate(9, min = $$props.min);
    		if ("max" in $$props) $$invalidate(10, max = $$props.max);
    	};

    	let labelTopPadding;
    	let helperTextCls;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*icon*/ 16) {
    			 $$invalidate(13, iconCls = icon
    			? "material-icons md-18 pointer-events-none"
    			: "hidden");
    		}

    		if ($$self.$$.dirty[0] & /*password, number, date*/ 104857600) {
    			 if (password) {
    				$$invalidate(12, type = "password");
    			} else if (number) {
    				$$invalidate(12, type = "number");
    			} else if (date) {
    				$$invalidate(12, type = "date");
    			} else {
    				$$invalidate(12, type = "text");
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 268435456) {
    			 $$invalidate(17, labelTopPadding = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 16777216) {
    			 $$invalidate(18, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1) {
    			 $$invalidate(27, valueEmpty = value == null || value.toString().length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, type, valueEmpty*/ 134223872) {
    			 if (hasFocus) {
    				y.set(0.25);
    				setLabelColor("absolute left-0 px-2 text-sm pointer-events-none");
    				$$invalidate(16, inputPadBottom = "padding-bottom:7px");
    			} else {
    				$$invalidate(16, inputPadBottom = "padding-bottom:8px");
    				$$invalidate(15, labelCls = "absolute left-0 px-2 text-sm pointer-events-none text-gray-600");

    				if (type !== "date" && valueEmpty) {
    					y.set(1);
    					$$invalidate(15, labelCls = "absolute left-0 px-2 pointer-events-none text-gray-600");
    				} else {
    					y.set(0.25);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		borderColor,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		min,
    		max,
    		hasFocus,
    		type,
    		iconCls,
    		boxWidth,
    		labelCls,
    		inputPadBottom,
    		labelTopPadding,
    		helperTextCls,
    		y,
    		handleInput,
    		clear,
    		number,
    		labelColor,
    		helperTextColor,
    		password,
    		date,
    		valueEmpty,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		keyup_handler,
    		click_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div3_elementresize_handler
    	];
    }

    class InputStd extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 22,
    				borderColor: 2,
    				labelColor: 23,
    				helperText: 3,
    				helperTextColor: 24,
    				icon: 4,
    				clearable: 5,
    				disabled: 6,
    				hideDetails: 7,
    				readonly: 8,
    				password: 25,
    				date: 26,
    				min: 9,
    				max: 10
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\widgets\InputOutlined.svelte generated by Svelte v3.31.0 */

    function create_if_block$3(ctx) {
    	let div;
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[2]);
    			attr(div, "class", /*helperTextCls*/ ctx[19]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 4) set_data(t, /*helperText*/ ctx[2]);

    			if (dirty[0] & /*helperTextCls*/ 524288) {
    				attr(div, "class", /*helperTextCls*/ ctx[19]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1;
    	let label_1;
    	let t2;
    	let label_1_style_value;
    	let label_1_class_value;
    	let label_1_resize_listener;
    	let t3;
    	let div1;
    	let input;
    	let t4;
    	let div0;
    	let i0;
    	let t5;
    	let i0_class_value;
    	let t6;
    	let i1;
    	let t7;
    	let fieldset_class_value;
    	let t8;
    	let div2_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[6] && create_if_block$3(ctx);

    	return {
    		c() {
    			div2 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("​");
    			t1 = space();
    			label_1 = element("label");
    			t2 = text(/*label*/ ctx[1]);
    			t3 = space();
    			div1 = element("div");
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t5 = text("clear");
    			t6 = space();
    			i1 = element("i");
    			t7 = text(/*icon*/ ctx[3]);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr(legend, "style", /*legendStyle*/ ctx[17]);
    			attr(label_1, "style", label_1_style_value = `${/*labelTranslateStyle*/ ctx[18]} max-width:${/*boxWidth*/ ctx[14] - 16}px;`);
    			attr(label_1, "class", label_1_class_value = `${/*labelCls*/ ctx[16]}absolute left-0 mx-2 pointer-events-none truncate`);
    			add_render_callback(() => /*label_1_elementresize_handler*/ ctx[35].call(label_1));
    			attr(input, "type", /*type*/ ctx[11]);
    			input.readOnly = /*readonly*/ ctx[7];
    			input.value = /*value*/ ctx[0];
    			input.disabled = /*disabled*/ ctx[5];
    			attr(input, "min", /*min*/ ctx[8]);
    			attr(input, "max", /*max*/ ctx[9]);
    			set_style(input, "padding-bottom", "3px");
    			attr(input, "class", "h-8 appearance-none bg-transparent border-none w-full\r\n        text-gray-800 px-2 focus:outline-none");

    			attr(i0, "class", i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "");

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			attr(i1, "class", /*iconCls*/ ctx[13]);
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			attr(div0, "class", "float-right flex items-center mr-2 mb-1");
    			attr(div1, "class", "flex justify-between");
    			fieldset.disabled = /*disabled*/ ctx[5];
    			set_style(fieldset, "height", "59px");
    			attr(fieldset, "class", fieldset_class_value = `${/*fieldsetCls*/ ctx[15]}relative rounded`);
    			toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			attr(div2, "class", "flex flex-col");
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[38].call(div2));
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, fieldset);
    			append(fieldset, legend);
    			append(legend, t0);
    			append(fieldset, t1);
    			append(fieldset, label_1);
    			append(label_1, t2);
    			label_1_resize_listener = add_resize_listener(label_1, /*label_1_elementresize_handler*/ ctx[35].bind(label_1));
    			append(fieldset, t3);
    			append(fieldset, div1);
    			append(div1, input);
    			append(div1, t4);
    			append(div1, div0);
    			append(div0, i0);
    			append(i0, t5);
    			append(div0, t6);
    			append(div0, i1);
    			append(i1, t7);
    			append(div2, t8);
    			if (if_block) if_block.m(div2, null);
    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[38].bind(div2));

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*handleInput*/ ctx[21]),
    					listen(input, "focus", /*focus_handler_1*/ ctx[36]),
    					listen(input, "blur", /*blur_handler_1*/ ctx[37]),
    					listen(input, "focus", /*focus_handler*/ ctx[30]),
    					listen(input, "blur", /*blur_handler*/ ctx[31]),
    					listen(input, "keydown", /*keydown_handler*/ ctx[32]),
    					listen(input, "keyup", /*keyup_handler*/ ctx[33]),
    					listen(input, "click", /*click_handler*/ ctx[34]),
    					listen(i0, "click", /*clear*/ ctx[22])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*legendStyle*/ 131072) {
    				attr(legend, "style", /*legendStyle*/ ctx[17]);
    			}

    			if (dirty[0] & /*label*/ 2) set_data(t2, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTranslateStyle, boxWidth*/ 278528 && label_1_style_value !== (label_1_style_value = `${/*labelTranslateStyle*/ ctx[18]} max-width:${/*boxWidth*/ ctx[14] - 16}px;`)) {
    				attr(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 65536 && label_1_class_value !== (label_1_class_value = `${/*labelCls*/ ctx[16]}absolute left-0 mx-2 pointer-events-none truncate`)) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 2048) {
    				attr(input, "type", /*type*/ ctx[11]);
    			}

    			if (dirty[0] & /*readonly*/ 128) {
    				input.readOnly = /*readonly*/ ctx[7];
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				input.value = /*value*/ ctx[0];
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				input.disabled = /*disabled*/ ctx[5];
    			}

    			if (dirty[0] & /*min*/ 256) {
    				attr(input, "min", /*min*/ ctx[8]);
    			}

    			if (dirty[0] & /*max*/ 512) {
    				attr(input, "max", /*max*/ ctx[9]);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 48 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "")) {
    				attr(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 48) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*icon*/ 8) set_data(t7, /*icon*/ ctx[3]);

    			if (dirty[0] & /*iconCls*/ 8192) {
    				attr(i1, "class", /*iconCls*/ ctx[13]);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 8224) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				fieldset.disabled = /*disabled*/ ctx[5];
    			}

    			if (dirty[0] & /*fieldsetCls*/ 32768 && fieldset_class_value !== (fieldset_class_value = `${/*fieldsetCls*/ ctx[15]}relative rounded`)) {
    				attr(fieldset, "class", fieldset_class_value);
    			}

    			if (dirty[0] & /*fieldsetCls, disabled*/ 32800) {
    				toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (!/*hideDetails*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			label_1_resize_listener();
    			if (if_block) if_block.d();
    			div2_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $y;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { password = false } = $$props;
    	let { date = false } = $$props;
    	let { min = null } = $$props;
    	let { max = null } = $$props;
    	let hasFocus = false;
    	let iconCls = "";
    	let boxWidth;
    	const y = tweened(0.75, { duration: 50 });
    	component_subscribe($$self, y, value => $$invalidate(29, $y = value));
    	let type = "text";

    	function handleInput(event) {
    		switch (type) {
    			case "text":
    				$$invalidate(0, value = event.target.value);
    				break;
    			case "number":
    				$$invalidate(0, value = +event.target.value);
    			default:
    				$$invalidate(0, value = event.target.value);
    		}

    		dispatch("input", value);
    	}

    	let fieldsetCls = "border border-gray-500";
    	let labelCls = "text-gray-600 ";
    	let legendStyle = "";
    	let labelWidth;

    	function setFocusState() {
    		$$invalidate(16, labelCls = `text-sm ${labelColor} `);
    		y.set(-1.35);
    		$$invalidate(15, fieldsetCls = `border-2 ${borderColor} `);
    	}

    	function setFieldsetCls(cls) {
    		$$invalidate(15, fieldsetCls = cls + " ");
    	}

    	function setLabelCls(cls) {
    		$$invalidate(16, labelCls = cls + " ");
    	}

    	function setLegendStyle(style) {
    		$$invalidate(17, legendStyle = style);
    	}

    	function clear() {
    		$$invalidate(0, value = "");
    		dispatch("clear");
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function label_1_elementresize_handler() {
    		labelWidth = this.clientWidth;
    		$$invalidate(12, labelWidth);
    	}

    	const focus_handler_1 = () => $$invalidate(10, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(10, hasFocus = false);

    	function div2_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(14, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(23, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(24, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(25, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(2, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(26, helperTextColor = $$props.helperTextColor);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(4, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(6, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(7, readonly = $$props.readonly);
    		if ("password" in $$props) $$invalidate(27, password = $$props.password);
    		if ("date" in $$props) $$invalidate(28, date = $$props.date);
    		if ("min" in $$props) $$invalidate(8, min = $$props.min);
    		if ("max" in $$props) $$invalidate(9, max = $$props.max);
    	};

    	let labelTranslateStyle;
    	let helperTextCls;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*password, number, date*/ 411041792) {
    			 if (password) {
    				$$invalidate(11, type = "password");
    			} else if (number) {
    				$$invalidate(11, type = "number");
    			} else if (date) {
    				$$invalidate(11, type = "date");
    			} else {
    				$$invalidate(11, type = "text");
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 536870912) {
    			 $$invalidate(18, labelTranslateStyle = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 67108864) {
    			 $$invalidate(19, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*icon*/ 8) {
    			 $$invalidate(13, iconCls = icon
    			? "material-icons md-18 pointer-events-none"
    			: "hidden");
    		}

    		if ($$self.$$.dirty[0] & /*labelWidth, hasFocus, type, value*/ 7169) {
    			 if (labelWidth) {
    				if (!hasFocus && type !== "date" && (value == null || value.toString().length === 0)) {
    					setLegendStyle("");
    				} else {
    					setLegendStyle(`width:${labelWidth + 4}px;margin-left:6px;`);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, disabled, type, value*/ 3105) {
    			 if (hasFocus) {
    				setFocusState();
    			} else {
    				if (!disabled) {
    					setFieldsetCls("border border-gray-500 hover:border-gray-900");
    				} else {
    					setFieldsetCls("border");
    				}

    				if (type !== "date" && (value == null || value.toString().length === 0)) {
    					setLabelCls("text-gray-600");
    					y.set(-0.15);
    				} else {
    					setLabelCls("text-sm text-gray-600");
    					y.set(-1.35);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		min,
    		max,
    		hasFocus,
    		type,
    		labelWidth,
    		iconCls,
    		boxWidth,
    		fieldsetCls,
    		labelCls,
    		legendStyle,
    		labelTranslateStyle,
    		helperTextCls,
    		y,
    		handleInput,
    		clear,
    		number,
    		borderColor,
    		labelColor,
    		helperTextColor,
    		password,
    		date,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		keyup_handler,
    		click_handler,
    		label_1_elementresize_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div2_elementresize_handler
    	];
    }

    class InputOutlined extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 23,
    				borderColor: 24,
    				labelColor: 25,
    				helperText: 2,
    				helperTextColor: 26,
    				icon: 3,
    				clearable: 4,
    				disabled: 5,
    				hideDetails: 6,
    				readonly: 7,
    				password: 27,
    				date: 28,
    				min: 8,
    				max: 9
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\widgets\Input.svelte generated by Svelte v3.31.0 */

    function create_else_block$1(ctx) {
    	let inputoutlined;
    	let updating_value;
    	let current;

    	function inputoutlined_value_binding(value) {
    		/*inputoutlined_value_binding*/ ctx[25].call(null, value);
    	}

    	let inputoutlined_props = {
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		password: /*password*/ ctx[13],
    		date: /*date*/ ctx[14],
    		min: /*min*/ ctx[15],
    		max: /*max*/ ctx[16],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		inputoutlined_props.value = /*value*/ ctx[0];
    	}

    	inputoutlined = new InputOutlined({ props: inputoutlined_props });
    	binding_callbacks.push(() => bind(inputoutlined, "value", inputoutlined_value_binding));
    	inputoutlined.$on("focus", /*focus_handler_1*/ ctx[26]);
    	inputoutlined.$on("blur", /*blur_handler_1*/ ctx[27]);
    	inputoutlined.$on("keydown", /*keydown_handler_1*/ ctx[28]);
    	inputoutlined.$on("keyup", /*keyup_handler_1*/ ctx[29]);
    	inputoutlined.$on("clear", /*clear_handler_1*/ ctx[30]);
    	inputoutlined.$on("click", /*click_handler_1*/ ctx[31]);
    	inputoutlined.$on("input", /*input_handler_1*/ ctx[32]);

    	return {
    		c() {
    			create_component(inputoutlined.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(inputoutlined, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const inputoutlined_changes = {};
    			if (dirty[0] & /*label*/ 2) inputoutlined_changes.label = /*label*/ ctx[1];
    			if (dirty[0] & /*borderColor*/ 8) inputoutlined_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty[0] & /*labelColor*/ 16) inputoutlined_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty[0] & /*helperText*/ 32) inputoutlined_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty[0] & /*icon*/ 256) inputoutlined_changes.icon = /*icon*/ ctx[8];
    			if (dirty[0] & /*number*/ 4) inputoutlined_changes.number = /*number*/ ctx[2];
    			if (dirty[0] & /*clearable*/ 512) inputoutlined_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) inputoutlined_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*hideDetails*/ 2048) inputoutlined_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty[0] & /*readonly*/ 4096) inputoutlined_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty[0] & /*password*/ 8192) inputoutlined_changes.password = /*password*/ ctx[13];
    			if (dirty[0] & /*date*/ 16384) inputoutlined_changes.date = /*date*/ ctx[14];
    			if (dirty[0] & /*min*/ 32768) inputoutlined_changes.min = /*min*/ ctx[15];
    			if (dirty[0] & /*max*/ 65536) inputoutlined_changes.max = /*max*/ ctx[16];
    			if (dirty[0] & /*helperTextColor*/ 64) inputoutlined_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty[0] & /*value*/ 1) {
    				updating_value = true;
    				inputoutlined_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputoutlined.$set(inputoutlined_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(inputoutlined.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(inputoutlined.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(inputoutlined, detaching);
    		}
    	};
    }

    // (24:0) {#if !outlined}
    function create_if_block$4(ctx) {
    	let inputstd;
    	let updating_value;
    	let current;

    	function inputstd_value_binding(value) {
    		/*inputstd_value_binding*/ ctx[17].call(null, value);
    	}

    	let inputstd_props = {
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		password: /*password*/ ctx[13],
    		date: /*date*/ ctx[14],
    		min: /*min*/ ctx[15],
    		max: /*max*/ ctx[16],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		inputstd_props.value = /*value*/ ctx[0];
    	}

    	inputstd = new InputStd({ props: inputstd_props });
    	binding_callbacks.push(() => bind(inputstd, "value", inputstd_value_binding));
    	inputstd.$on("focus", /*focus_handler*/ ctx[18]);
    	inputstd.$on("blur", /*blur_handler*/ ctx[19]);
    	inputstd.$on("keydown", /*keydown_handler*/ ctx[20]);
    	inputstd.$on("keyup", /*keyup_handler*/ ctx[21]);
    	inputstd.$on("clear", /*clear_handler*/ ctx[22]);
    	inputstd.$on("click", /*click_handler*/ ctx[23]);
    	inputstd.$on("input", /*input_handler*/ ctx[24]);

    	return {
    		c() {
    			create_component(inputstd.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(inputstd, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const inputstd_changes = {};
    			if (dirty[0] & /*label*/ 2) inputstd_changes.label = /*label*/ ctx[1];
    			if (dirty[0] & /*borderColor*/ 8) inputstd_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty[0] & /*labelColor*/ 16) inputstd_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty[0] & /*helperText*/ 32) inputstd_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty[0] & /*icon*/ 256) inputstd_changes.icon = /*icon*/ ctx[8];
    			if (dirty[0] & /*number*/ 4) inputstd_changes.number = /*number*/ ctx[2];
    			if (dirty[0] & /*clearable*/ 512) inputstd_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) inputstd_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*hideDetails*/ 2048) inputstd_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty[0] & /*readonly*/ 4096) inputstd_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty[0] & /*password*/ 8192) inputstd_changes.password = /*password*/ ctx[13];
    			if (dirty[0] & /*date*/ 16384) inputstd_changes.date = /*date*/ ctx[14];
    			if (dirty[0] & /*min*/ 32768) inputstd_changes.min = /*min*/ ctx[15];
    			if (dirty[0] & /*max*/ 65536) inputstd_changes.max = /*max*/ ctx[16];
    			if (dirty[0] & /*helperTextColor*/ 64) inputstd_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty[0] & /*value*/ 1) {
    				updating_value = true;
    				inputstd_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputstd.$set(inputstd_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(inputstd.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(inputstd.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(inputstd, detaching);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*outlined*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { password = false } = $$props;
    	let { date = false } = $$props;
    	let { min = null } = $$props;
    	let { max = null } = $$props;

    	function inputstd_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function clear_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function inputoutlined_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_1(event) {
    		bubble($$self, event);
    	}

    	function clear_handler_1(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(2, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(3, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(4, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(5, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(6, helperTextColor = $$props.helperTextColor);
    		if ("outlined" in $$props) $$invalidate(7, outlined = $$props.outlined);
    		if ("icon" in $$props) $$invalidate(8, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(9, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(11, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(12, readonly = $$props.readonly);
    		if ("password" in $$props) $$invalidate(13, password = $$props.password);
    		if ("date" in $$props) $$invalidate(14, date = $$props.date);
    		if ("min" in $$props) $$invalidate(15, min = $$props.min);
    		if ("max" in $$props) $$invalidate(16, max = $$props.max);
    	};

    	return [
    		value,
    		label,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		password,
    		date,
    		min,
    		max,
    		inputstd_value_binding,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		keyup_handler,
    		clear_handler,
    		click_handler,
    		input_handler,
    		inputoutlined_value_binding,
    		focus_handler_1,
    		blur_handler_1,
    		keydown_handler_1,
    		keyup_handler_1,
    		clear_handler_1,
    		click_handler_1,
    		input_handler_1
    	];
    }

    class Input extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$5,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 2,
    				borderColor: 3,
    				labelColor: 4,
    				helperText: 5,
    				helperTextColor: 6,
    				outlined: 7,
    				icon: 8,
    				clearable: 9,
    				disabled: 10,
    				hideDetails: 11,
    				readonly: 12,
    				password: 13,
    				date: 14,
    				min: 15,
    				max: 16
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\components\ButtonGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot_12(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (163:6) <Button         {text}         {fab}         {outlined}         {rounded}         {tile}         {block}         {xs}         {sm}         {lg}         {xl}         {disabled}         {textColor}         {outlineColor}         {bgColor}         on:click={() => alert("Hello World!")}>
    function create_default_slot_11(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Demo Button");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (185:10) <Checkbox bind:checked={text}>
    function create_default_slot_10(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("text");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (188:10) <Checkbox bind:checked={fab}>
    function create_default_slot_9(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("fab");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (191:10) <Checkbox bind:checked={outlined}>
    function create_default_slot_8(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("outlined");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (194:10) <Checkbox bind:checked={rounded}>
    function create_default_slot_7(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("rounded");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (197:10) <Checkbox bind:checked={tile}>
    function create_default_slot_6(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("tile");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (200:10) <Checkbox bind:checked={block}>
    function create_default_slot_5(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("block");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (203:10) <Checkbox bind:checked={xs}>
    function create_default_slot_4(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("xs");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (206:10) <Checkbox bind:checked={sm}>
    function create_default_slot_3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("sm");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (209:10) <Checkbox bind:checked={lg}>
    function create_default_slot_2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("lg");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (212:10) <Checkbox bind:checked={xl}>
    function create_default_slot_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("xl");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (215:10) <Checkbox bind:checked={disabled}>
    function create_default_slot(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("disabled");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let h2;
    	let t1;
    	let div75;
    	let t123;
    	let div96;
    	let h31;
    	let div76;
    	let t125;
    	let checkbox0;
    	let updating_checked;
    	let t126;
    	let div95;
    	let div77;
    	let button;
    	let t127;
    	let div94;
    	let div89;
    	let div78;
    	let checkbox1;
    	let updating_checked_1;
    	let t128;
    	let div79;
    	let checkbox2;
    	let updating_checked_2;
    	let t129;
    	let div80;
    	let checkbox3;
    	let updating_checked_3;
    	let t130;
    	let div81;
    	let checkbox4;
    	let updating_checked_4;
    	let t131;
    	let div82;
    	let checkbox5;
    	let updating_checked_5;
    	let t132;
    	let div83;
    	let checkbox6;
    	let updating_checked_6;
    	let t133;
    	let div84;
    	let checkbox7;
    	let updating_checked_7;
    	let t134;
    	let div85;
    	let checkbox8;
    	let updating_checked_8;
    	let t135;
    	let div86;
    	let checkbox9;
    	let updating_checked_9;
    	let t136;
    	let div87;
    	let checkbox10;
    	let updating_checked_10;
    	let t137;
    	let div88;
    	let checkbox11;
    	let updating_checked_11;
    	let t138;
    	let div93;
    	let div90;
    	let input0;
    	let updating_value;
    	let t139;
    	let div91;
    	let input1;
    	let updating_value_1;
    	let t140;
    	let div92;
    	let input2;
    	let updating_value_2;
    	let t141;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[15].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot_12] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[14] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[14];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	button = new Button({
    			props: {
    				text: /*text*/ ctx[0],
    				fab: /*fab*/ ctx[1],
    				outlined: /*outlined*/ ctx[2],
    				rounded: /*rounded*/ ctx[3],
    				tile: /*tile*/ ctx[4],
    				block: /*block*/ ctx[5],
    				xs: /*xs*/ ctx[6],
    				sm: /*sm*/ ctx[7],
    				lg: /*lg*/ ctx[8],
    				xl: /*xl*/ ctx[9],
    				disabled: /*disabled*/ ctx[10],
    				textColor: /*textColor*/ ctx[11],
    				outlineColor: /*outlineColor*/ ctx[12],
    				bgColor: /*bgColor*/ ctx[13],
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", /*click_handler*/ ctx[16]);

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[17].call(null, value);
    	}

    	let checkbox1_props = {
    		$$slots: { default: [create_default_slot_10] },
    		$$scope: { ctx }
    	};

    	if (/*text*/ ctx[0] !== void 0) {
    		checkbox1_props.checked = /*text*/ ctx[0];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox2_props = {
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	};

    	if (/*fab*/ ctx[1] !== void 0) {
    		checkbox2_props.checked = /*fab*/ ctx[1];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[19].call(null, value);
    	}

    	let checkbox3_props = {
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	};

    	if (/*outlined*/ ctx[2] !== void 0) {
    		checkbox3_props.checked = /*outlined*/ ctx[2];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox4_props = {
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	};

    	if (/*rounded*/ ctx[3] !== void 0) {
    		checkbox4_props.checked = /*rounded*/ ctx[3];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox5_props = {
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	};

    	if (/*tile*/ ctx[4] !== void 0) {
    		checkbox5_props.checked = /*tile*/ ctx[4];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function checkbox6_checked_binding(value) {
    		/*checkbox6_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox6_props = {
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	};

    	if (/*block*/ ctx[5] !== void 0) {
    		checkbox6_props.checked = /*block*/ ctx[5];
    	}

    	checkbox6 = new Checkbox({ props: checkbox6_props });
    	binding_callbacks.push(() => bind(checkbox6, "checked", checkbox6_checked_binding));

    	function checkbox7_checked_binding(value) {
    		/*checkbox7_checked_binding*/ ctx[23].call(null, value);
    	}

    	let checkbox7_props = {
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	};

    	if (/*xs*/ ctx[6] !== void 0) {
    		checkbox7_props.checked = /*xs*/ ctx[6];
    	}

    	checkbox7 = new Checkbox({ props: checkbox7_props });
    	binding_callbacks.push(() => bind(checkbox7, "checked", checkbox7_checked_binding));

    	function checkbox8_checked_binding(value) {
    		/*checkbox8_checked_binding*/ ctx[24].call(null, value);
    	}

    	let checkbox8_props = {
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	};

    	if (/*sm*/ ctx[7] !== void 0) {
    		checkbox8_props.checked = /*sm*/ ctx[7];
    	}

    	checkbox8 = new Checkbox({ props: checkbox8_props });
    	binding_callbacks.push(() => bind(checkbox8, "checked", checkbox8_checked_binding));

    	function checkbox9_checked_binding(value) {
    		/*checkbox9_checked_binding*/ ctx[25].call(null, value);
    	}

    	let checkbox9_props = {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	if (/*lg*/ ctx[8] !== void 0) {
    		checkbox9_props.checked = /*lg*/ ctx[8];
    	}

    	checkbox9 = new Checkbox({ props: checkbox9_props });
    	binding_callbacks.push(() => bind(checkbox9, "checked", checkbox9_checked_binding));

    	function checkbox10_checked_binding(value) {
    		/*checkbox10_checked_binding*/ ctx[26].call(null, value);
    	}

    	let checkbox10_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*xl*/ ctx[9] !== void 0) {
    		checkbox10_props.checked = /*xl*/ ctx[9];
    	}

    	checkbox10 = new Checkbox({ props: checkbox10_props });
    	binding_callbacks.push(() => bind(checkbox10, "checked", checkbox10_checked_binding));

    	function checkbox11_checked_binding(value) {
    		/*checkbox11_checked_binding*/ ctx[27].call(null, value);
    	}

    	let checkbox11_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*disabled*/ ctx[10] !== void 0) {
    		checkbox11_props.checked = /*disabled*/ ctx[10];
    	}

    	checkbox11 = new Checkbox({ props: checkbox11_props });
    	binding_callbacks.push(() => bind(checkbox11, "checked", checkbox11_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[28].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "textColor"
    	};

    	if (/*textColor*/ ctx[11] !== void 0) {
    		input0_props.value = /*textColor*/ ctx[11];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[29].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "outlineColor"
    	};

    	if (/*outlineColor*/ ctx[12] !== void 0) {
    		input1_props.value = /*outlineColor*/ ctx[12];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[30].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "bgColor"
    	};

    	if (/*bgColor*/ ctx[13] !== void 0) {
    		input2_props.value = /*bgColor*/ ctx[13];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Button";
    			t1 = space();
    			div75 = element("div");

    			div75.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">text</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Removes the elevation.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">fab</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Floating Action Button.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Removes the elevation and applies a thin border</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">rounded</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Applies a large border radius on the button.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">tile</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Removes the component&#39;s border-radius.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">block</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Expands the button to 100% of available space.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">xs</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Extra small button</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">sm</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Small button</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">lg</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Large button</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">xl</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Extra large button</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Removes the ability to click or target the component.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">textColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Applies Tailwindcss text color to the button. Accepts only valid Tailwindcss
      text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-black</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">outlineColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Applies Tailwindcss border color to the button. Accepts only valid
      Tailwindcss border color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-black</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3">bgColor</div> 
    <div class="table-cell py-3 px-3">Applies Tailwindcss background color to the button. Accepts only valid
      Tailwindcss background color class</div> 
    <div class="table-cell py-3 px-3">string</div> 
    <div class="table-cell py-3 px-3">bg-transparent</div></div>`;

    			t123 = space();
    			div96 = element("div");
    			h31 = element("h3");
    			div76 = element("div");
    			div76.textContent = "Demo";
    			t125 = space();
    			create_component(checkbox0.$$.fragment);
    			t126 = space();
    			div95 = element("div");
    			div77 = element("div");
    			create_component(button.$$.fragment);
    			t127 = space();
    			div94 = element("div");
    			div89 = element("div");
    			div78 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t128 = space();
    			div79 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t129 = space();
    			div80 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t130 = space();
    			div81 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t131 = space();
    			div82 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t132 = space();
    			div83 = element("div");
    			create_component(checkbox6.$$.fragment);
    			t133 = space();
    			div84 = element("div");
    			create_component(checkbox7.$$.fragment);
    			t134 = space();
    			div85 = element("div");
    			create_component(checkbox8.$$.fragment);
    			t135 = space();
    			div86 = element("div");
    			create_component(checkbox9.$$.fragment);
    			t136 = space();
    			div87 = element("div");
    			create_component(checkbox10.$$.fragment);
    			t137 = space();
    			div88 = element("div");
    			create_component(checkbox11.$$.fragment);
    			t138 = space();
    			div93 = element("div");
    			div90 = element("div");
    			create_component(input0.$$.fragment);
    			t139 = space();
    			div91 = element("div");
    			create_component(input1.$$.fragment);
    			t140 = space();
    			div92 = element("div");
    			create_component(input2.$$.fragment);
    			t141 = space();
    			pre = element("pre");

    			pre.textContent = `${`<Button
  {text}
  {fab}
  {outlined}
  {rounded}
  {tile}
  {block}
  {xs}
  {sm}
  {lg}
  {xl}
  {disabled}
  {textColor}
  {outlineColor}
  {bgColor}
  on:click={() => alert("Hello World!")}>
  Demo Button
</Button>`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div75, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div76, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div77, "class", "flex items-center mb-4");
    			attr(div78, "class", "px-4");
    			attr(div79, "class", "px-4");
    			attr(div80, "class", "px-4");
    			attr(div81, "class", "px-4");
    			attr(div82, "class", "px-4");
    			attr(div83, "class", "px-4");
    			attr(div84, "class", "px-4");
    			attr(div85, "class", "px-4");
    			attr(div86, "class", "px-4");
    			attr(div87, "class", "px-4");
    			attr(div88, "class", "px-4");
    			attr(div89, "class", "flex flex-row flex-wrap mb-3");
    			attr(div90, "class", "px-4");
    			attr(div91, "class", "px-4");
    			attr(div92, "class", "px-4");
    			attr(div93, "class", "w-full flex flex-row flex-wrap");
    			attr(div94, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div95, "class", "flex flex-col");
    			attr(div96, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[14]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div75, anchor);
    			insert(target, t123, anchor);
    			insert(target, div96, anchor);
    			append(div96, h31);
    			append(h31, div76);
    			append(h31, t125);
    			mount_component(checkbox0, h31, null);
    			append(div96, t126);
    			append(div96, div95);
    			append(div95, div77);
    			mount_component(button, div77, null);
    			append(div95, t127);
    			append(div95, div94);
    			append(div94, div89);
    			append(div89, div78);
    			mount_component(checkbox1, div78, null);
    			append(div89, t128);
    			append(div89, div79);
    			mount_component(checkbox2, div79, null);
    			append(div89, t129);
    			append(div89, div80);
    			mount_component(checkbox3, div80, null);
    			append(div89, t130);
    			append(div89, div81);
    			mount_component(checkbox4, div81, null);
    			append(div89, t131);
    			append(div89, div82);
    			mount_component(checkbox5, div82, null);
    			append(div89, t132);
    			append(div89, div83);
    			mount_component(checkbox6, div83, null);
    			append(div89, t133);
    			append(div89, div84);
    			mount_component(checkbox7, div84, null);
    			append(div89, t134);
    			append(div89, div85);
    			mount_component(checkbox8, div85, null);
    			append(div89, t135);
    			append(div89, div86);
    			mount_component(checkbox9, div86, null);
    			append(div89, t136);
    			append(div89, div87);
    			mount_component(checkbox10, div87, null);
    			append(div89, t137);
    			append(div89, div88);
    			mount_component(checkbox11, div88, null);
    			append(div94, t138);
    			append(div94, div93);
    			append(div93, div90);
    			mount_component(input0, div90, null);
    			append(div93, t139);
    			append(div93, div91);
    			mount_component(input1, div91, null);
    			append(div93, t140);
    			append(div93, div92);
    			mount_component(input2, div92, null);
    			insert(target, t141, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const checkbox0_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty[0] & /*showCode*/ 16384) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[14];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const button_changes = {};
    			if (dirty[0] & /*text*/ 1) button_changes.text = /*text*/ ctx[0];
    			if (dirty[0] & /*fab*/ 2) button_changes.fab = /*fab*/ ctx[1];
    			if (dirty[0] & /*outlined*/ 4) button_changes.outlined = /*outlined*/ ctx[2];
    			if (dirty[0] & /*rounded*/ 8) button_changes.rounded = /*rounded*/ ctx[3];
    			if (dirty[0] & /*tile*/ 16) button_changes.tile = /*tile*/ ctx[4];
    			if (dirty[0] & /*block*/ 32) button_changes.block = /*block*/ ctx[5];
    			if (dirty[0] & /*xs*/ 64) button_changes.xs = /*xs*/ ctx[6];
    			if (dirty[0] & /*sm*/ 128) button_changes.sm = /*sm*/ ctx[7];
    			if (dirty[0] & /*lg*/ 256) button_changes.lg = /*lg*/ ctx[8];
    			if (dirty[0] & /*xl*/ 512) button_changes.xl = /*xl*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) button_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*textColor*/ 2048) button_changes.textColor = /*textColor*/ ctx[11];
    			if (dirty[0] & /*outlineColor*/ 4096) button_changes.outlineColor = /*outlineColor*/ ctx[12];
    			if (dirty[0] & /*bgColor*/ 8192) button_changes.bgColor = /*bgColor*/ ctx[13];

    			if (dirty[1] & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			const checkbox1_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_1 && dirty[0] & /*text*/ 1) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*text*/ ctx[0];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_2 && dirty[0] & /*fab*/ 2) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*fab*/ ctx[1];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox3_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_3 && dirty[0] & /*outlined*/ 4) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*outlined*/ ctx[2];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox4_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_4 && dirty[0] & /*rounded*/ 8) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*rounded*/ ctx[3];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox5_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_5 && dirty[0] & /*tile*/ 16) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*tile*/ ctx[4];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const checkbox6_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox6_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_6 && dirty[0] & /*block*/ 32) {
    				updating_checked_6 = true;
    				checkbox6_changes.checked = /*block*/ ctx[5];
    				add_flush_callback(() => updating_checked_6 = false);
    			}

    			checkbox6.$set(checkbox6_changes);
    			const checkbox7_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox7_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_7 && dirty[0] & /*xs*/ 64) {
    				updating_checked_7 = true;
    				checkbox7_changes.checked = /*xs*/ ctx[6];
    				add_flush_callback(() => updating_checked_7 = false);
    			}

    			checkbox7.$set(checkbox7_changes);
    			const checkbox8_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox8_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_8 && dirty[0] & /*sm*/ 128) {
    				updating_checked_8 = true;
    				checkbox8_changes.checked = /*sm*/ ctx[7];
    				add_flush_callback(() => updating_checked_8 = false);
    			}

    			checkbox8.$set(checkbox8_changes);
    			const checkbox9_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox9_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_9 && dirty[0] & /*lg*/ 256) {
    				updating_checked_9 = true;
    				checkbox9_changes.checked = /*lg*/ ctx[8];
    				add_flush_callback(() => updating_checked_9 = false);
    			}

    			checkbox9.$set(checkbox9_changes);
    			const checkbox10_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox10_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_10 && dirty[0] & /*xl*/ 512) {
    				updating_checked_10 = true;
    				checkbox10_changes.checked = /*xl*/ ctx[9];
    				add_flush_callback(() => updating_checked_10 = false);
    			}

    			checkbox10.$set(checkbox10_changes);
    			const checkbox11_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox11_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_11 && dirty[0] & /*disabled*/ 1024) {
    				updating_checked_11 = true;
    				checkbox11_changes.checked = /*disabled*/ ctx[10];
    				add_flush_callback(() => updating_checked_11 = false);
    			}

    			checkbox11.$set(checkbox11_changes);
    			const input0_changes = {};

    			if (!updating_value && dirty[0] & /*textColor*/ 2048) {
    				updating_value = true;
    				input0_changes.value = /*textColor*/ ctx[11];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*outlineColor*/ 4096) {
    				updating_value_1 = true;
    				input1_changes.value = /*outlineColor*/ ctx[12];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*bgColor*/ 8192) {
    				updating_value_2 = true;
    				input2_changes.value = /*bgColor*/ ctx[13];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);

    			if (dirty[0] & /*showCode*/ 16384) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[14]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(checkbox6.$$.fragment, local);
    			transition_in(checkbox7.$$.fragment, local);
    			transition_in(checkbox8.$$.fragment, local);
    			transition_in(checkbox9.$$.fragment, local);
    			transition_in(checkbox10.$$.fragment, local);
    			transition_in(checkbox11.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(checkbox6.$$.fragment, local);
    			transition_out(checkbox7.$$.fragment, local);
    			transition_out(checkbox8.$$.fragment, local);
    			transition_out(checkbox9.$$.fragment, local);
    			transition_out(checkbox10.$$.fragment, local);
    			transition_out(checkbox11.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div75);
    			if (detaching) detach(t123);
    			if (detaching) detach(div96);
    			destroy_component(checkbox0);
    			destroy_component(button);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(checkbox6);
    			destroy_component(checkbox7);
    			destroy_component(checkbox8);
    			destroy_component(checkbox9);
    			destroy_component(checkbox10);
    			destroy_component(checkbox11);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			if (detaching) detach(t141);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let text = false;
    	let fab = false;
    	let outlined = false;
    	let rounded = false;
    	let tile = false;
    	let block = false;
    	let xs = false;
    	let sm = false;
    	let lg = false;
    	let xl = false;
    	let disabled = false;
    	let textColor = "text-white";
    	let outlineColor = "border-black";
    	let bgColor = "bg-red-700";
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(14, showCode);
    	}

    	const click_handler = () => alert("Hello World!");

    	function checkbox1_checked_binding(value) {
    		text = value;
    		$$invalidate(0, text);
    	}

    	function checkbox2_checked_binding(value) {
    		fab = value;
    		$$invalidate(1, fab);
    	}

    	function checkbox3_checked_binding(value) {
    		outlined = value;
    		$$invalidate(2, outlined);
    	}

    	function checkbox4_checked_binding(value) {
    		rounded = value;
    		$$invalidate(3, rounded);
    	}

    	function checkbox5_checked_binding(value) {
    		tile = value;
    		$$invalidate(4, tile);
    	}

    	function checkbox6_checked_binding(value) {
    		block = value;
    		$$invalidate(5, block);
    	}

    	function checkbox7_checked_binding(value) {
    		xs = value;
    		$$invalidate(6, xs);
    	}

    	function checkbox8_checked_binding(value) {
    		sm = value;
    		$$invalidate(7, sm);
    	}

    	function checkbox9_checked_binding(value) {
    		lg = value;
    		$$invalidate(8, lg);
    	}

    	function checkbox10_checked_binding(value) {
    		xl = value;
    		$$invalidate(9, xl);
    	}

    	function checkbox11_checked_binding(value) {
    		disabled = value;
    		$$invalidate(10, disabled);
    	}

    	function input0_value_binding(value) {
    		textColor = value;
    		$$invalidate(11, textColor);
    	}

    	function input1_value_binding(value) {
    		outlineColor = value;
    		$$invalidate(12, outlineColor);
    	}

    	function input2_value_binding(value) {
    		bgColor = value;
    		$$invalidate(13, bgColor);
    	}

    	return [
    		text,
    		fab,
    		outlined,
    		rounded,
    		tile,
    		block,
    		xs,
    		sm,
    		lg,
    		xl,
    		disabled,
    		textColor,
    		outlineColor,
    		bgColor,
    		showCode,
    		checkbox0_checked_binding,
    		click_handler,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		checkbox6_checked_binding,
    		checkbox7_checked_binding,
    		checkbox8_checked_binding,
    		checkbox9_checked_binding,
    		checkbox10_checked_binding,
    		checkbox11_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding
    	];
    }

    class ButtonGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$8, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\widgets\Dialog.svelte generated by Svelte v3.31.0 */

    function create_if_block$5(ctx) {
    	let div2;
    	let div0;
    	let div0_transition;
    	let t;
    	let div1;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "absolute h-full w-full bg-black opacity-50");
    			attr(div1, "class", "z-40");
    			attr(div2, "class", "fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center z-40");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t);
    			append(div2, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(div0, "click", /*click_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 100 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, { duration: 200 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 100 }, false);
    			div0_transition.run(0);
    			transition_out(default_slot, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, { duration: 200 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (detaching && div0_transition) div0_transition.end();
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[0] && create_if_block$5(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (/*visible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { visible = false } = $$props;
    	let { permanent = false } = $$props;

    	const click_handler = () => {
    		if (!permanent) $$invalidate(0, visible = false);
    	};

    	$$self.$$set = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("permanent" in $$props) $$invalidate(1, permanent = $$props.permanent);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [visible, permanent, $$scope, slots, click_handler];
    }

    class Dialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$9, safe_not_equal, { visible: 0, permanent: 1 });
    	}
    }

    /* src\components\DialogGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot_4$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (53:8) <Button           outlineColor="border-green-700"           textColor="text-green-700"           outlined           on:click={() => (visible = false)}>
    function create_default_slot_3$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Close");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (49:2) <Dialog bind:visible bind:permanent>
    function create_default_slot_2$1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				outlineColor: "border-green-700",
    				textColor: "text-green-700",
    				outlined: true,
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", /*click_handler*/ ctx[4]);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "My Dialog";
    			t1 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			attr(div0, "class", "font-semibold text-lg p-3");
    			attr(div1, "class", "p-3");
    			attr(div2, "class", "bg-white p-4 rounded");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			destroy_component(button);
    		}
    	};
    }

    // (67:8) <Checkbox bind:checked={visible}>
    function create_default_slot_1$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("visible");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (70:8) <Checkbox bind:checked={permanent}>
    function create_default_slot$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("permanent");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	let h2;
    	let t1;
    	let div15;
    	let t27;
    	let div21;
    	let h31;
    	let div16;
    	let t29;
    	let checkbox0;
    	let updating_checked;
    	let t30;
    	let dialog;
    	let updating_visible;
    	let updating_permanent;
    	let t31;
    	let div20;
    	let div19;
    	let div17;
    	let checkbox1;
    	let updating_checked_1;
    	let t32;
    	let div18;
    	let checkbox2;
    	let updating_checked_2;
    	let t33;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[3].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot_4$1] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[2] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[2];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function dialog_visible_binding(value) {
    		/*dialog_visible_binding*/ ctx[5].call(null, value);
    	}

    	function dialog_permanent_binding(value) {
    		/*dialog_permanent_binding*/ ctx[6].call(null, value);
    	}

    	let dialog_props = {
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	};

    	if (/*visible*/ ctx[0] !== void 0) {
    		dialog_props.visible = /*visible*/ ctx[0];
    	}

    	if (/*permanent*/ ctx[1] !== void 0) {
    		dialog_props.permanent = /*permanent*/ ctx[1];
    	}

    	dialog = new Dialog({ props: dialog_props });
    	binding_callbacks.push(() => bind(dialog, "visible", dialog_visible_binding));
    	binding_callbacks.push(() => bind(dialog, "permanent", dialog_permanent_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[7].call(null, value);
    	}

    	let checkbox1_props = {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	};

    	if (/*visible*/ ctx[0] !== void 0) {
    		checkbox1_props.checked = /*visible*/ ctx[0];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[8].call(null, value);
    	}

    	let checkbox2_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	if (/*permanent*/ ctx[1] !== void 0) {
    		checkbox2_props.checked = /*permanent*/ ctx[1];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Dialog";
    			t1 = space();
    			div15 = element("div");

    			div15.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">visible</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Shows or hides the dialog.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">permanent</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">When &#39;permanent&#39; is true, dialog is not dismissable by clicking away.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div>`;

    			t27 = space();
    			div21 = element("div");
    			h31 = element("h3");
    			div16 = element("div");
    			div16.textContent = "Demo";
    			t29 = space();
    			create_component(checkbox0.$$.fragment);
    			t30 = space();
    			create_component(dialog.$$.fragment);
    			t31 = space();
    			div20 = element("div");
    			div19 = element("div");
    			div17 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t32 = space();
    			div18 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t33 = space();
    			pre = element("pre");

    			pre.textContent = `${`<div class="bg-gray-200 rounded p-4 w-full">
    <h3 class="text-lg font-bold ml-2 flex justify-between">
        Demo
        <Checkbox bind:checked={showCode}>Show Code</Checkbox>
    </h3>

    <Dialog bind:visible bind:permanent>
        <div class="bg-white p-4 rounded">
        <div class="font-semibold text-lg p-3">My Dialog</div>
        <div class="p-3">
            <Button
            outlineColor="border-green-700"
            textColor="text-green-700"
            outlined
            on:click={() => (visible = false)}>
            Close
            </Button>
        </div>
        </div>
    </Dialog>

    <div class="border border-gray-500 rounded px-3 py-4 w-full">
        <div class="flex flex-row flex-wrap">
        <div class="px-4">
            <Checkbox bind:checked={visible}>visible</Checkbox>
        </div>
        <div class="px-4">
            <Checkbox bind:checked={permanent}>permanent</Checkbox>
        </div>
        </div>
    </div>
</div>`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div15, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div16, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div17, "class", "px-4");
    			attr(div18, "class", "px-4");
    			attr(div19, "class", "flex flex-row flex-wrap");
    			attr(div20, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div21, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div15, anchor);
    			insert(target, t27, anchor);
    			insert(target, div21, anchor);
    			append(div21, h31);
    			append(h31, div16);
    			append(h31, t29);
    			mount_component(checkbox0, h31, null);
    			append(div21, t30);
    			mount_component(dialog, div21, null);
    			append(div21, t31);
    			append(div21, div20);
    			append(div20, div19);
    			append(div19, div17);
    			mount_component(checkbox1, div17, null);
    			append(div19, t32);
    			append(div19, div18);
    			mount_component(checkbox2, div18, null);
    			insert(target, t33, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox0_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 4) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[2];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const dialog_changes = {};

    			if (dirty & /*$$scope, visible*/ 513) {
    				dialog_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible && dirty & /*visible*/ 1) {
    				updating_visible = true;
    				dialog_changes.visible = /*visible*/ ctx[0];
    				add_flush_callback(() => updating_visible = false);
    			}

    			if (!updating_permanent && dirty & /*permanent*/ 2) {
    				updating_permanent = true;
    				dialog_changes.permanent = /*permanent*/ ctx[1];
    				add_flush_callback(() => updating_permanent = false);
    			}

    			dialog.$set(dialog_changes);
    			const checkbox1_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_1 && dirty & /*visible*/ 1) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*visible*/ ctx[0];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_2 && dirty & /*permanent*/ 2) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*permanent*/ ctx[1];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);

    			if (dirty & /*showCode*/ 4) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[2]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(dialog.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(dialog.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div15);
    			if (detaching) detach(t27);
    			if (detaching) detach(div21);
    			destroy_component(checkbox0);
    			destroy_component(dialog);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			if (detaching) detach(t33);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let visible = false;
    	let permanent = false;
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(2, showCode);
    	}

    	const click_handler = () => $$invalidate(0, visible = false);

    	function dialog_visible_binding(value) {
    		visible = value;
    		$$invalidate(0, visible);
    	}

    	function dialog_permanent_binding(value) {
    		permanent = value;
    		$$invalidate(1, permanent);
    	}

    	function checkbox1_checked_binding(value) {
    		visible = value;
    		$$invalidate(0, visible);
    	}

    	function checkbox2_checked_binding(value) {
    		permanent = value;
    		$$invalidate(1, permanent);
    	}

    	return [
    		visible,
    		permanent,
    		showCode,
    		checkbox0_checked_binding,
    		click_handler,
    		dialog_visible_binding,
    		dialog_permanent_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding
    	];
    }

    class DialogGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$a, safe_not_equal, {});
    	}
    }

    /* src\components\NavigationDrawerGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot_3$2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (56:2) <NavigationDrawer bind:visible {modal} {marginTop}>
    function create_default_slot_2$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "My drawer";
    			attr(div, "class", "h-full w-64 bg-yellow-800 text-white");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (63:8) <Checkbox bind:checked={visible}>
    function create_default_slot_1$2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("visible");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (66:8) <Checkbox bind:checked={modal}>
    function create_default_slot$2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("modal");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	let h2;
    	let t1;
    	let div20;
    	let t35;
    	let div28;
    	let h31;
    	let div21;
    	let t37;
    	let checkbox0;
    	let updating_checked;
    	let t38;
    	let navigationdrawer;
    	let updating_visible;
    	let t39;
    	let div27;
    	let div24;
    	let div22;
    	let checkbox1;
    	let updating_checked_1;
    	let t40;
    	let div23;
    	let checkbox2;
    	let updating_checked_2;
    	let t41;
    	let div26;
    	let div25;
    	let input;
    	let updating_value;
    	let t42;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[4].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot_3$2] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[3] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[3];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function navigationdrawer_visible_binding(value) {
    		/*navigationdrawer_visible_binding*/ ctx[5].call(null, value);
    	}

    	let navigationdrawer_props = {
    		modal: /*modal*/ ctx[1],
    		marginTop: /*marginTop*/ ctx[2],
    		$$slots: { default: [create_default_slot_2$2] },
    		$$scope: { ctx }
    	};

    	if (/*visible*/ ctx[0] !== void 0) {
    		navigationdrawer_props.visible = /*visible*/ ctx[0];
    	}

    	navigationdrawer = new NavigationDrawer({ props: navigationdrawer_props });
    	binding_callbacks.push(() => bind(navigationdrawer, "visible", navigationdrawer_visible_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[6].call(null, value);
    	}

    	let checkbox1_props = {
    		$$slots: { default: [create_default_slot_1$2] },
    		$$scope: { ctx }
    	};

    	if (/*visible*/ ctx[0] !== void 0) {
    		checkbox1_props.checked = /*visible*/ ctx[0];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[7].call(null, value);
    	}

    	let checkbox2_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	if (/*modal*/ ctx[1] !== void 0) {
    		checkbox2_props.checked = /*modal*/ ctx[1];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[8].call(null, value);
    	}

    	let input_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "marginTop"
    	};

    	if (/*marginTop*/ ctx[2] !== void 0) {
    		input_props.value = /*marginTop*/ ctx[2];
    	}

    	input = new Input({ props: input_props });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Navigation Drawer";
    			t1 = space();
    			div20 = element("div");

    			div20.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">visible</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Shows or hides the navigation drawer.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">modal</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">When &#39;modal&#39; is true, navigation drawer can be dismissed by clicking away.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">marginTop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Applies Tailwindcss margin top class to the Navigation Drawer. Accepts
      only valid Tailwindcss margin top class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div>`;

    			t35 = space();
    			div28 = element("div");
    			h31 = element("h3");
    			div21 = element("div");
    			div21.textContent = "Demo";
    			t37 = space();
    			create_component(checkbox0.$$.fragment);
    			t38 = space();
    			create_component(navigationdrawer.$$.fragment);
    			t39 = space();
    			div27 = element("div");
    			div24 = element("div");
    			div22 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t40 = space();
    			div23 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t41 = space();
    			div26 = element("div");
    			div25 = element("div");
    			create_component(input.$$.fragment);
    			t42 = space();
    			pre = element("pre");

    			pre.textContent = `${`<NavigationDrawer bind:visible {modal} {marginTop}>
  <div class="h-full w-64 bg-yellow-800 text-white">My drawer</div>
</NavigationDrawer>`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div20, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div21, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div22, "class", "px-4");
    			attr(div23, "class", "px-4");
    			attr(div24, "class", "flex flex-row flex-wrap");
    			attr(div25, "class", "px-4");
    			attr(div26, "class", "w-full flex flex-row flex-wrap");
    			attr(div27, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div28, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div20, anchor);
    			insert(target, t35, anchor);
    			insert(target, div28, anchor);
    			append(div28, h31);
    			append(h31, div21);
    			append(h31, t37);
    			mount_component(checkbox0, h31, null);
    			append(div28, t38);
    			mount_component(navigationdrawer, div28, null);
    			append(div28, t39);
    			append(div28, div27);
    			append(div27, div24);
    			append(div24, div22);
    			mount_component(checkbox1, div22, null);
    			append(div24, t40);
    			append(div24, div23);
    			mount_component(checkbox2, div23, null);
    			append(div27, t41);
    			append(div27, div26);
    			append(div26, div25);
    			mount_component(input, div25, null);
    			insert(target, t42, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox0_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 8) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[3];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const navigationdrawer_changes = {};
    			if (dirty & /*modal*/ 2) navigationdrawer_changes.modal = /*modal*/ ctx[1];
    			if (dirty & /*marginTop*/ 4) navigationdrawer_changes.marginTop = /*marginTop*/ ctx[2];

    			if (dirty & /*$$scope*/ 512) {
    				navigationdrawer_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_visible && dirty & /*visible*/ 1) {
    				updating_visible = true;
    				navigationdrawer_changes.visible = /*visible*/ ctx[0];
    				add_flush_callback(() => updating_visible = false);
    			}

    			navigationdrawer.$set(navigationdrawer_changes);
    			const checkbox1_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_1 && dirty & /*visible*/ 1) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*visible*/ ctx[0];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				checkbox2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_2 && dirty & /*modal*/ 2) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*modal*/ ctx[1];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const input_changes = {};

    			if (!updating_value && dirty & /*marginTop*/ 4) {
    				updating_value = true;
    				input_changes.value = /*marginTop*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);

    			if (dirty & /*showCode*/ 8) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(navigationdrawer.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(navigationdrawer.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div20);
    			if (detaching) detach(t35);
    			if (detaching) detach(div28);
    			destroy_component(checkbox0);
    			destroy_component(navigationdrawer);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(input);
    			if (detaching) detach(t42);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let visible = false;
    	let modal = false;
    	let marginTop = "mt-0";
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(3, showCode);
    	}

    	function navigationdrawer_visible_binding(value) {
    		visible = value;
    		$$invalidate(0, visible);
    	}

    	function checkbox1_checked_binding(value) {
    		visible = value;
    		$$invalidate(0, visible);
    	}

    	function checkbox2_checked_binding(value) {
    		modal = value;
    		$$invalidate(1, modal);
    	}

    	function input_value_binding(value) {
    		marginTop = value;
    		$$invalidate(2, marginTop);
    	}

    	return [
    		visible,
    		modal,
    		marginTop,
    		showCode,
    		checkbox0_checked_binding,
    		navigationdrawer_visible_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		input_value_binding
    	];
    }

    class NavigationDrawerGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$b, safe_not_equal, {});
    	}
    }

    /* src\widgets\Progress.svelte generated by Svelte v3.31.0 */

    function create_fragment$c(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let div0_class_value;
    	let div1_class_value;
    	let div2_class_value;

    	return {
    		c() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			attr(div0, "class", div0_class_value = "h-full w-1/2 absolute mdc-slider__track " + /*fillColor*/ ctx[1] + " move" + " svelte-1bti8cy");
    			attr(div1, "class", div1_class_value = "absolute w-full mdc-slider__track-container " + /*trackColor*/ ctx[0] + " " + /*height*/ ctx[2] + " svelte-1bti8cy");
    			attr(div2, "class", div2_class_value = "relative w-full " + /*height*/ ctx[2] + " block outline-none flex items-center" + " svelte-1bti8cy");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div1);
    			append(div1, div0);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*fillColor*/ 2 && div0_class_value !== (div0_class_value = "h-full w-1/2 absolute mdc-slider__track " + /*fillColor*/ ctx[1] + " move" + " svelte-1bti8cy")) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (dirty & /*trackColor, height*/ 5 && div1_class_value !== (div1_class_value = "absolute w-full mdc-slider__track-container " + /*trackColor*/ ctx[0] + " " + /*height*/ ctx[2] + " svelte-1bti8cy")) {
    				attr(div1, "class", div1_class_value);
    			}

    			if (dirty & /*height*/ 4 && div2_class_value !== (div2_class_value = "relative w-full " + /*height*/ ctx[2] + " block outline-none flex items-center" + " svelte-1bti8cy")) {
    				attr(div2, "class", div2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { trackColor = "bg-red-200" } = $$props;
    	let { fillColor = "bg-blue-500" } = $$props;
    	let { height = "h-1" } = $$props;

    	$$self.$$set = $$props => {
    		if ("trackColor" in $$props) $$invalidate(0, trackColor = $$props.trackColor);
    		if ("fillColor" in $$props) $$invalidate(1, fillColor = $$props.fillColor);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    	};

    	return [trackColor, fillColor, height];
    }

    class Progress extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$c, safe_not_equal, { trackColor: 0, fillColor: 1, height: 2 });
    	}
    }

    /* src\components\ProgressGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot_1$3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	let h2;
    	let t1;
    	let div20;
    	let t35;
    	let div27;
    	let h31;
    	let div21;
    	let t37;
    	let checkbox;
    	let updating_checked;
    	let t38;
    	let progress;
    	let t39;
    	let div26;
    	let div25;
    	let div22;
    	let input0;
    	let updating_value;
    	let t40;
    	let div23;
    	let input1;
    	let updating_value_1;
    	let t41;
    	let div24;
    	let input2;
    	let updating_value_2;
    	let t42;
    	let pre;
    	let current;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[4].call(null, value);
    	}

    	let checkbox_props = {
    		$$slots: { default: [create_default_slot_1$3] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[3] !== void 0) {
    		checkbox_props.checked = /*showCode*/ ctx[3];
    	}

    	checkbox = new Checkbox({ props: checkbox_props });
    	binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));

    	progress = new Progress({
    			props: {
    				trackColor: /*trackColor*/ ctx[0],
    				fillColor: /*fillColor*/ ctx[1],
    				height: /*height*/ ctx[2]
    			}
    		});

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[5].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "trackColor"
    	};

    	if (/*trackColor*/ ctx[0] !== void 0) {
    		input0_props.value = /*trackColor*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[6].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "fillColor"
    	};

    	if (/*fillColor*/ ctx[1] !== void 0) {
    		input1_props.value = /*fillColor*/ ctx[1];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[7].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "height"
    	};

    	if (/*height*/ ctx[2] !== void 0) {
    		input2_props.value = /*height*/ ctx[2];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Progress";
    			t1 = space();
    			div20 = element("div");

    			div20.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">trackColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The background color of the progress bar. Accepts valid Tailwindcss
      background color class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">bg-red-200</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">fillColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the moving part of the progress bar. Accepts valid
      Tailwindcss background color class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">bg-blue-500</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">height</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The height of the progress bar. Accepts valid Tailwindcss height class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">h-1</div></div>`;

    			t35 = space();
    			div27 = element("div");
    			h31 = element("h3");
    			div21 = element("div");
    			div21.textContent = "Demo";
    			t37 = space();
    			create_component(checkbox.$$.fragment);
    			t38 = space();
    			create_component(progress.$$.fragment);
    			t39 = space();
    			div26 = element("div");
    			div25 = element("div");
    			div22 = element("div");
    			create_component(input0.$$.fragment);
    			t40 = space();
    			div23 = element("div");
    			create_component(input1.$$.fragment);
    			t41 = space();
    			div24 = element("div");
    			create_component(input2.$$.fragment);
    			t42 = space();
    			pre = element("pre");

    			pre.textContent = `${`<Progress {trackColor} {fillColor} {height}>
</Progress>`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div20, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div21, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div22, "class", "px-4");
    			attr(div23, "class", "px-4");
    			attr(div24, "class", "px-4");
    			attr(div25, "class", "w-full flex flex-row flex-wrap");
    			attr(div26, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div27, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div20, anchor);
    			insert(target, t35, anchor);
    			insert(target, div27, anchor);
    			append(div27, h31);
    			append(h31, div21);
    			append(h31, t37);
    			mount_component(checkbox, h31, null);
    			append(div27, t38);
    			mount_component(progress, div27, null);
    			append(div27, t39);
    			append(div27, div26);
    			append(div26, div25);
    			append(div25, div22);
    			mount_component(input0, div22, null);
    			append(div25, t40);
    			append(div25, div23);
    			mount_component(input1, div23, null);
    			append(div25, t41);
    			append(div25, div24);
    			mount_component(input2, div24, null);
    			insert(target, t42, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				checkbox_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 8) {
    				updating_checked = true;
    				checkbox_changes.checked = /*showCode*/ ctx[3];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const progress_changes = {};
    			if (dirty & /*trackColor*/ 1) progress_changes.trackColor = /*trackColor*/ ctx[0];
    			if (dirty & /*fillColor*/ 2) progress_changes.fillColor = /*fillColor*/ ctx[1];
    			if (dirty & /*height*/ 4) progress_changes.height = /*height*/ ctx[2];

    			if (dirty & /*$$scope*/ 256) {
    				progress_changes.$$scope = { dirty, ctx };
    			}

    			progress.$set(progress_changes);
    			const input0_changes = {};

    			if (!updating_value && dirty & /*trackColor*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*trackColor*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*fillColor*/ 2) {
    				updating_value_1 = true;
    				input1_changes.value = /*fillColor*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*height*/ 4) {
    				updating_value_2 = true;
    				input2_changes.value = /*height*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);

    			if (dirty & /*showCode*/ 8) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(progress.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(progress.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div20);
    			if (detaching) detach(t35);
    			if (detaching) detach(div27);
    			destroy_component(checkbox);
    			destroy_component(progress);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			if (detaching) detach(t42);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let trackColor = "bg-red-200";
    	let fillColor = "bg-blue-500";
    	let height = "h-1";
    	let showCode = false;

    	function checkbox_checked_binding(value) {
    		showCode = value;
    		$$invalidate(3, showCode);
    	}

    	function input0_value_binding(value) {
    		trackColor = value;
    		$$invalidate(0, trackColor);
    	}

    	function input1_value_binding(value) {
    		fillColor = value;
    		$$invalidate(1, fillColor);
    	}

    	function input2_value_binding(value) {
    		height = value;
    		$$invalidate(2, height);
    	}

    	return [
    		trackColor,
    		fillColor,
    		height,
    		showCode,
    		checkbox_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding
    	];
    }

    class ProgressGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$d, safe_not_equal, {});
    	}
    }

    /* src\widgets\Spinner.svelte generated by Svelte v3.31.0 */

    function create_fragment$e(ctx) {
    	let svg;
    	let circle;
    	let svg_class_value;

    	return {
    		c() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr(circle, "class", "path svelte-qohbzc");
    			attr(circle, "cx", "25");
    			attr(circle, "cy", "25");
    			attr(circle, "r", "20");
    			attr(circle, "fill", "none");
    			attr(circle, "stroke-width", "5");
    			attr(svg, "class", svg_class_value = "spinner stroke-current " + /*color*/ ctx[0] + " " + /*width*/ ctx[1] + " " + /*height*/ ctx[2] + " svelte-qohbzc");
    			attr(svg, "viewBox", "0 0 50 50");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, circle);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*color, width, height*/ 7 && svg_class_value !== (svg_class_value = "spinner stroke-current " + /*color*/ ctx[0] + " " + /*width*/ ctx[1] + " " + /*height*/ ctx[2] + " svelte-qohbzc")) {
    				attr(svg, "class", svg_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { color = "text-purple-500" } = $$props;
    	let { width = "w-8" } = $$props;
    	let { height = "h-8" } = $$props;

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    	};

    	return [color, width, height];
    }

    class Spinner extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$c, create_fragment$e, safe_not_equal, { color: 0, width: 1, height: 2 });
    	}
    }

    /* src\components\SpinnerGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$3(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	let h2;
    	let t1;
    	let div20;
    	let t35;
    	let div27;
    	let h31;
    	let div21;
    	let t37;
    	let checkbox;
    	let updating_checked;
    	let t38;
    	let spinner;
    	let t39;
    	let div26;
    	let div25;
    	let div22;
    	let input0;
    	let updating_value;
    	let t40;
    	let div23;
    	let input1;
    	let updating_value_1;
    	let t41;
    	let div24;
    	let input2;
    	let updating_value_2;
    	let t42;
    	let pre;
    	let current;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[4].call(null, value);
    	}

    	let checkbox_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[3] !== void 0) {
    		checkbox_props.checked = /*showCode*/ ctx[3];
    	}

    	checkbox = new Checkbox({ props: checkbox_props });
    	binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));

    	spinner = new Spinner({
    			props: {
    				color: /*color*/ ctx[0],
    				width: /*width*/ ctx[1],
    				height: /*height*/ ctx[2]
    			}
    		});

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[5].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "color"
    	};

    	if (/*color*/ ctx[0] !== void 0) {
    		input0_props.value = /*color*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[6].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "width"
    	};

    	if (/*width*/ ctx[1] !== void 0) {
    		input1_props.value = /*width*/ ctx[1];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[7].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "height"
    	};

    	if (/*height*/ ctx[2] !== void 0) {
    		input2_props.value = /*height*/ ctx[2];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Spinner";
    			t1 = space();
    			div20 = element("div");

    			div20.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">color</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the spinner. Accepts valid Tailwindcss text color class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-purple-500</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">width</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The width of the spinner. Accepts valid Tailwindcss width class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">w-8</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">height</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The height of the spinner. Accepts valid Tailwindcss height class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">h-8</div></div>`;

    			t35 = space();
    			div27 = element("div");
    			h31 = element("h3");
    			div21 = element("div");
    			div21.textContent = "Demo";
    			t37 = space();
    			create_component(checkbox.$$.fragment);
    			t38 = space();
    			create_component(spinner.$$.fragment);
    			t39 = space();
    			div26 = element("div");
    			div25 = element("div");
    			div22 = element("div");
    			create_component(input0.$$.fragment);
    			t40 = space();
    			div23 = element("div");
    			create_component(input1.$$.fragment);
    			t41 = space();
    			div24 = element("div");
    			create_component(input2.$$.fragment);
    			t42 = space();
    			pre = element("pre");
    			pre.textContent = `${`<Spinner {color} {width} {height} />`}`;
    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div20, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div21, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div22, "class", "px-4");
    			attr(div23, "class", "px-4");
    			attr(div24, "class", "px-4");
    			attr(div25, "class", "w-full flex flex-row flex-wrap");
    			attr(div26, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div27, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div20, anchor);
    			insert(target, t35, anchor);
    			insert(target, div27, anchor);
    			append(div27, h31);
    			append(h31, div21);
    			append(h31, t37);
    			mount_component(checkbox, h31, null);
    			append(div27, t38);
    			mount_component(spinner, div27, null);
    			append(div27, t39);
    			append(div27, div26);
    			append(div26, div25);
    			append(div25, div22);
    			mount_component(input0, div22, null);
    			append(div25, t40);
    			append(div25, div23);
    			mount_component(input1, div23, null);
    			append(div25, t41);
    			append(div25, div24);
    			mount_component(input2, div24, null);
    			insert(target, t42, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				checkbox_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 8) {
    				updating_checked = true;
    				checkbox_changes.checked = /*showCode*/ ctx[3];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const spinner_changes = {};
    			if (dirty & /*color*/ 1) spinner_changes.color = /*color*/ ctx[0];
    			if (dirty & /*width*/ 2) spinner_changes.width = /*width*/ ctx[1];
    			if (dirty & /*height*/ 4) spinner_changes.height = /*height*/ ctx[2];
    			spinner.$set(spinner_changes);
    			const input0_changes = {};

    			if (!updating_value && dirty & /*color*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*color*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*width*/ 2) {
    				updating_value_1 = true;
    				input1_changes.value = /*width*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*height*/ 4) {
    				updating_value_2 = true;
    				input2_changes.value = /*height*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);

    			if (dirty & /*showCode*/ 8) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(spinner.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(spinner.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div20);
    			if (detaching) detach(t35);
    			if (detaching) detach(div27);
    			destroy_component(checkbox);
    			destroy_component(spinner);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			if (detaching) detach(t42);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let color = "text-purple-500";
    	let width = "w-8";
    	let height = "h-8";
    	let showCode = false;

    	function checkbox_checked_binding(value) {
    		showCode = value;
    		$$invalidate(3, showCode);
    	}

    	function input0_value_binding(value) {
    		color = value;
    		$$invalidate(0, color);
    	}

    	function input1_value_binding(value) {
    		width = value;
    		$$invalidate(1, width);
    	}

    	function input2_value_binding(value) {
    		height = value;
    		$$invalidate(2, height);
    	}

    	return [
    		color,
    		width,
    		height,
    		showCode,
    		checkbox_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding
    	];
    }

    class SpinnerGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$d, create_fragment$f, safe_not_equal, {});
    	}
    }

    /* src\components\InputGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$4(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$g(ctx) {
    	let h2;
    	let t1;
    	let div90;
    	let t149;
    	let div113;
    	let h31;
    	let div91;
    	let t151;
    	let checkbox0;
    	let updating_checked;
    	let t152;
    	let div92;
    	let input0;
    	let updating_value;
    	let t153;
    	let div112;
    	let div101;
    	let div93;
    	let checkbox1;
    	let updating_checked_1;
    	let t154;
    	let div94;
    	let checkbox2;
    	let updating_checked_2;
    	let t155;
    	let div95;
    	let checkbox3;
    	let updating_checked_3;
    	let t156;
    	let div96;
    	let checkbox4;
    	let updating_checked_4;
    	let t157;
    	let div97;
    	let checkbox5;
    	let updating_checked_5;
    	let t158;
    	let div98;
    	let checkbox6;
    	let updating_checked_6;
    	let t159;
    	let div99;
    	let checkbox7;
    	let updating_checked_7;
    	let t160;
    	let div100;
    	let checkbox8;
    	let updating_checked_8;
    	let t161;
    	let div111;
    	let div102;
    	let input1;
    	let updating_value_1;
    	let t162;
    	let div103;
    	let input2;
    	let updating_value_2;
    	let t163;
    	let div104;
    	let input3;
    	let updating_value_3;
    	let t164;
    	let div105;
    	let input4;
    	let updating_value_4;
    	let t165;
    	let div106;
    	let input5;
    	let updating_value_5;
    	let t166;
    	let div107;
    	let input6;
    	let updating_value_6;
    	let t167;
    	let div108;
    	let input7;
    	let updating_value_7;
    	let t168;
    	let div109;
    	let input8;
    	let updating_value_8;
    	let t169;
    	let div110;
    	let input9;
    	let updating_value_9;
    	let t170;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[17] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[17];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[19].call(null, value);
    	}

    	let input0_props = {
    		label: /*label*/ ctx[0],
    		password: /*password*/ ctx[13],
    		date: /*date*/ ctx[14],
    		number: /*number*/ ctx[2],
    		min: /*min*/ ctx[15],
    		max: /*max*/ ctx[16],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		helperTextColor: /*helperTextColor*/ ctx[6],
    		outlined: /*outlined*/ ctx[7],
    		icon: /*icon*/ ctx[8],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12]
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		input0_props.value = /*value*/ ctx[1];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox1_props = { label: "number" };

    	if (/*number*/ ctx[2] !== void 0) {
    		checkbox1_props.checked = /*number*/ ctx[2];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox2_props = { label: "outlined" };

    	if (/*outlined*/ ctx[7] !== void 0) {
    		checkbox2_props.checked = /*outlined*/ ctx[7];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox3_props = { label: "clearable" };

    	if (/*clearable*/ ctx[9] !== void 0) {
    		checkbox3_props.checked = /*clearable*/ ctx[9];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[23].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled*/ ctx[10] !== void 0) {
    		checkbox4_props.checked = /*disabled*/ ctx[10];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[24].call(null, value);
    	}

    	let checkbox5_props = { label: "hideDetails" };

    	if (/*hideDetails*/ ctx[11] !== void 0) {
    		checkbox5_props.checked = /*hideDetails*/ ctx[11];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function checkbox6_checked_binding(value) {
    		/*checkbox6_checked_binding*/ ctx[25].call(null, value);
    	}

    	let checkbox6_props = { label: "readonly" };

    	if (/*readonly*/ ctx[12] !== void 0) {
    		checkbox6_props.checked = /*readonly*/ ctx[12];
    	}

    	checkbox6 = new Checkbox({ props: checkbox6_props });
    	binding_callbacks.push(() => bind(checkbox6, "checked", checkbox6_checked_binding));

    	function checkbox7_checked_binding(value) {
    		/*checkbox7_checked_binding*/ ctx[26].call(null, value);
    	}

    	let checkbox7_props = { label: "password" };

    	if (/*password*/ ctx[13] !== void 0) {
    		checkbox7_props.checked = /*password*/ ctx[13];
    	}

    	checkbox7 = new Checkbox({ props: checkbox7_props });
    	binding_callbacks.push(() => bind(checkbox7, "checked", checkbox7_checked_binding));

    	function checkbox8_checked_binding(value) {
    		/*checkbox8_checked_binding*/ ctx[27].call(null, value);
    	}

    	let checkbox8_props = { label: "date" };

    	if (/*date*/ ctx[14] !== void 0) {
    		checkbox8_props.checked = /*date*/ ctx[14];
    	}

    	checkbox8 = new Checkbox({ props: checkbox8_props });
    	binding_callbacks.push(() => bind(checkbox8, "checked", checkbox8_checked_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[28].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input1_props.value = /*label*/ ctx[0];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[29].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "value"
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		input2_props.value = /*value*/ ctx[1];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[30].call(null, value);
    	}

    	let input3_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "icon"
    	};

    	if (/*icon*/ ctx[8] !== void 0) {
    		input3_props.value = /*icon*/ ctx[8];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[31].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "borderColor"
    	};

    	if (/*borderColor*/ ctx[3] !== void 0) {
    		input4_props.value = /*borderColor*/ ctx[3];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[32].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelColor"
    	};

    	if (/*labelColor*/ ctx[4] !== void 0) {
    		input5_props.value = /*labelColor*/ ctx[4];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[33].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperText"
    	};

    	if (/*helperText*/ ctx[5] !== void 0) {
    		input6_props.value = /*helperText*/ ctx[5];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	function input7_value_binding(value) {
    		/*input7_value_binding*/ ctx[34].call(null, value);
    	}

    	let input7_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperTextColor"
    	};

    	if (/*helperTextColor*/ ctx[6] !== void 0) {
    		input7_props.value = /*helperTextColor*/ ctx[6];
    	}

    	input7 = new Input({ props: input7_props });
    	binding_callbacks.push(() => bind(input7, "value", input7_value_binding));

    	function input8_value_binding(value) {
    		/*input8_value_binding*/ ctx[35].call(null, value);
    	}

    	let input8_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "min"
    	};

    	if (/*min*/ ctx[15] !== void 0) {
    		input8_props.value = /*min*/ ctx[15];
    	}

    	input8 = new Input({ props: input8_props });
    	binding_callbacks.push(() => bind(input8, "value", input8_value_binding));

    	function input9_value_binding(value) {
    		/*input9_value_binding*/ ctx[36].call(null, value);
    	}

    	let input9_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "max"
    	};

    	if (/*max*/ ctx[16] !== void 0) {
    		input9_props.value = /*max*/ ctx[16];
    	}

    	input9 = new Input({ props: input9_props });
    	binding_callbacks.push(() => bind(input9, "value", input9_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Input";
    			t1 = space();
    			div90 = element("div");

    			div90.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The value of the input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specifies whether it&#39;s a number type input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">min</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specifies the minimum value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">null</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">max</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specifies the maximum value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">null</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">borderColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The border color of the input box. Accepts valid Tailwindcss border color
      class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label text. Accepts valid Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The helper text underneath the input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperTextColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the helper text underneath the input box. Accepts Tailwindcss
      text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Transformed this into a outlined input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">icon</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The icon to display on the right of the input box. <br/> Accepts a material
      icon from this list <a class="text-blue-600" href="https://material.io/resources/icons/?style=baseline">https://material.io/resources/icons/?style=baseline</a></div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">clearable</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Includes a clear button when &#39;clearable&#39; is true</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Disables input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">hideDetails</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Hides helper text.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">readonly</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Makes input box readonly</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">password</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Mask input</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">date</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Change input type to &#39;date&#39;</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div>`;

    			t149 = space();
    			div113 = element("div");
    			h31 = element("h3");
    			div91 = element("div");
    			div91.textContent = "Demo";
    			t151 = space();
    			create_component(checkbox0.$$.fragment);
    			t152 = space();
    			div92 = element("div");
    			create_component(input0.$$.fragment);
    			t153 = space();
    			div112 = element("div");
    			div101 = element("div");
    			div93 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t154 = space();
    			div94 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t155 = space();
    			div95 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t156 = space();
    			div96 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t157 = space();
    			div97 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t158 = space();
    			div98 = element("div");
    			create_component(checkbox6.$$.fragment);
    			t159 = space();
    			div99 = element("div");
    			create_component(checkbox7.$$.fragment);
    			t160 = space();
    			div100 = element("div");
    			create_component(checkbox8.$$.fragment);
    			t161 = space();
    			div111 = element("div");
    			div102 = element("div");
    			create_component(input1.$$.fragment);
    			t162 = space();
    			div103 = element("div");
    			create_component(input2.$$.fragment);
    			t163 = space();
    			div104 = element("div");
    			create_component(input3.$$.fragment);
    			t164 = space();
    			div105 = element("div");
    			create_component(input4.$$.fragment);
    			t165 = space();
    			div106 = element("div");
    			create_component(input5.$$.fragment);
    			t166 = space();
    			div107 = element("div");
    			create_component(input6.$$.fragment);
    			t167 = space();
    			div108 = element("div");
    			create_component(input7.$$.fragment);
    			t168 = space();
    			div109 = element("div");
    			create_component(input8.$$.fragment);
    			t169 = space();
    			div110 = element("div");
    			create_component(input9.$$.fragment);
    			t170 = space();
    			pre = element("pre");

    			pre.textContent = `${`<Input
    {label}
    bind:value
    {number}
    {borderColor}
    {labelColor}
    {helperText}
    {helperTextColor}
    {outlined}
    {icon}
    {clearable}
    {disabled}
    {hideDetails}
    {readonly} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div90, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div91, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div92, "class", "my-2");
    			attr(div93, "class", "px-4");
    			attr(div94, "class", "px-4");
    			attr(div95, "class", "px-4");
    			attr(div96, "class", "px-4");
    			attr(div97, "class", "px-4");
    			attr(div98, "class", "px-4");
    			attr(div99, "class", "px-4");
    			attr(div100, "class", "px-4");
    			attr(div101, "class", "w-full flex flex-row flex-wrap");
    			attr(div102, "class", "px-4 pb-2");
    			attr(div103, "class", "px-4 pb-2");
    			attr(div104, "class", "px-4 pb-2");
    			attr(div105, "class", "px-4 pb-2");
    			attr(div106, "class", "px-4 pb-2");
    			attr(div107, "class", "px-4 pb-2");
    			attr(div108, "class", "px-4 pb-2");
    			attr(div109, "class", "px-4 pb-2");
    			attr(div110, "class", "px-4 pb-2");
    			attr(div111, "class", "w-full flex flex-row flex-wrap");
    			attr(div112, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div113, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[17]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div90, anchor);
    			insert(target, t149, anchor);
    			insert(target, div113, anchor);
    			append(div113, h31);
    			append(h31, div91);
    			append(h31, t151);
    			mount_component(checkbox0, h31, null);
    			append(div113, t152);
    			append(div113, div92);
    			mount_component(input0, div92, null);
    			append(div113, t153);
    			append(div113, div112);
    			append(div112, div101);
    			append(div101, div93);
    			mount_component(checkbox1, div93, null);
    			append(div101, t154);
    			append(div101, div94);
    			mount_component(checkbox2, div94, null);
    			append(div101, t155);
    			append(div101, div95);
    			mount_component(checkbox3, div95, null);
    			append(div101, t156);
    			append(div101, div96);
    			mount_component(checkbox4, div96, null);
    			append(div101, t157);
    			append(div101, div97);
    			mount_component(checkbox5, div97, null);
    			append(div101, t158);
    			append(div101, div98);
    			mount_component(checkbox6, div98, null);
    			append(div101, t159);
    			append(div101, div99);
    			mount_component(checkbox7, div99, null);
    			append(div101, t160);
    			append(div101, div100);
    			mount_component(checkbox8, div100, null);
    			append(div112, t161);
    			append(div112, div111);
    			append(div111, div102);
    			mount_component(input1, div102, null);
    			append(div111, t162);
    			append(div111, div103);
    			mount_component(input2, div103, null);
    			append(div111, t163);
    			append(div111, div104);
    			mount_component(input3, div104, null);
    			append(div111, t164);
    			append(div111, div105);
    			mount_component(input4, div105, null);
    			append(div111, t165);
    			append(div111, div106);
    			mount_component(input5, div106, null);
    			append(div111, t166);
    			append(div111, div107);
    			mount_component(input6, div107, null);
    			append(div111, t167);
    			append(div111, div108);
    			mount_component(input7, div108, null);
    			append(div111, t168);
    			append(div111, div109);
    			mount_component(input8, div109, null);
    			append(div111, t169);
    			append(div111, div110);
    			mount_component(input9, div110, null);
    			insert(target, t170, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const checkbox0_changes = {};

    			if (dirty[1] & /*$$scope*/ 64) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty[0] & /*showCode*/ 131072) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[17];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const input0_changes = {};
    			if (dirty[0] & /*label*/ 1) input0_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*password*/ 8192) input0_changes.password = /*password*/ ctx[13];
    			if (dirty[0] & /*date*/ 16384) input0_changes.date = /*date*/ ctx[14];
    			if (dirty[0] & /*number*/ 4) input0_changes.number = /*number*/ ctx[2];
    			if (dirty[0] & /*min*/ 32768) input0_changes.min = /*min*/ ctx[15];
    			if (dirty[0] & /*max*/ 65536) input0_changes.max = /*max*/ ctx[16];
    			if (dirty[0] & /*borderColor*/ 8) input0_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty[0] & /*labelColor*/ 16) input0_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty[0] & /*helperText*/ 32) input0_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty[0] & /*helperTextColor*/ 64) input0_changes.helperTextColor = /*helperTextColor*/ ctx[6];
    			if (dirty[0] & /*outlined*/ 128) input0_changes.outlined = /*outlined*/ ctx[7];
    			if (dirty[0] & /*icon*/ 256) input0_changes.icon = /*icon*/ ctx[8];
    			if (dirty[0] & /*clearable*/ 512) input0_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) input0_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*hideDetails*/ 2048) input0_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty[0] & /*readonly*/ 4096) input0_changes.readonly = /*readonly*/ ctx[12];

    			if (!updating_value && dirty[0] & /*value*/ 2) {
    				updating_value = true;
    				input0_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty[0] & /*number*/ 4) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*number*/ ctx[2];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty[0] & /*outlined*/ 128) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*outlined*/ ctx[7];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty[0] & /*clearable*/ 512) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*clearable*/ ctx[9];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty[0] & /*disabled*/ 1024) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled*/ ctx[10];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (!updating_checked_5 && dirty[0] & /*hideDetails*/ 2048) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*hideDetails*/ ctx[11];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const checkbox6_changes = {};

    			if (!updating_checked_6 && dirty[0] & /*readonly*/ 4096) {
    				updating_checked_6 = true;
    				checkbox6_changes.checked = /*readonly*/ ctx[12];
    				add_flush_callback(() => updating_checked_6 = false);
    			}

    			checkbox6.$set(checkbox6_changes);
    			const checkbox7_changes = {};

    			if (!updating_checked_7 && dirty[0] & /*password*/ 8192) {
    				updating_checked_7 = true;
    				checkbox7_changes.checked = /*password*/ ctx[13];
    				add_flush_callback(() => updating_checked_7 = false);
    			}

    			checkbox7.$set(checkbox7_changes);
    			const checkbox8_changes = {};

    			if (!updating_checked_8 && dirty[0] & /*date*/ 16384) {
    				updating_checked_8 = true;
    				checkbox8_changes.checked = /*date*/ ctx[14];
    				add_flush_callback(() => updating_checked_8 = false);
    			}

    			checkbox8.$set(checkbox8_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*label*/ 1) {
    				updating_value_1 = true;
    				input1_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*value*/ 2) {
    				updating_value_2 = true;
    				input2_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*icon*/ 256) {
    				updating_value_3 = true;
    				input3_changes.value = /*icon*/ ctx[8];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_4 && dirty[0] & /*borderColor*/ 8) {
    				updating_value_4 = true;
    				input4_changes.value = /*borderColor*/ ctx[3];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_5 && dirty[0] & /*labelColor*/ 16) {
    				updating_value_5 = true;
    				input5_changes.value = /*labelColor*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_6 && dirty[0] & /*helperText*/ 32) {
    				updating_value_6 = true;
    				input6_changes.value = /*helperText*/ ctx[5];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input6.$set(input6_changes);
    			const input7_changes = {};

    			if (!updating_value_7 && dirty[0] & /*helperTextColor*/ 64) {
    				updating_value_7 = true;
    				input7_changes.value = /*helperTextColor*/ ctx[6];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input7.$set(input7_changes);
    			const input8_changes = {};

    			if (!updating_value_8 && dirty[0] & /*min*/ 32768) {
    				updating_value_8 = true;
    				input8_changes.value = /*min*/ ctx[15];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			input8.$set(input8_changes);
    			const input9_changes = {};

    			if (!updating_value_9 && dirty[0] & /*max*/ 65536) {
    				updating_value_9 = true;
    				input9_changes.value = /*max*/ ctx[16];
    				add_flush_callback(() => updating_value_9 = false);
    			}

    			input9.$set(input9_changes);

    			if (dirty[0] & /*showCode*/ 131072) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[17]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(checkbox6.$$.fragment, local);
    			transition_in(checkbox7.$$.fragment, local);
    			transition_in(checkbox8.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			transition_in(input8.$$.fragment, local);
    			transition_in(input9.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(checkbox6.$$.fragment, local);
    			transition_out(checkbox7.$$.fragment, local);
    			transition_out(checkbox8.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			transition_out(input8.$$.fragment, local);
    			transition_out(input9.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div90);
    			if (detaching) detach(t149);
    			if (detaching) detach(div113);
    			destroy_component(checkbox0);
    			destroy_component(input0);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(checkbox6);
    			destroy_component(checkbox7);
    			destroy_component(checkbox8);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    			destroy_component(input8);
    			destroy_component(input9);
    			if (detaching) detach(t170);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let label = "Enter Your Name";
    	let value = "Peter Piper";
    	let number = false;
    	let borderColor = "border-gray-700";
    	let labelColor = "text-gray-700";
    	let helperText = "";
    	let helperTextColor = "text-red-600";
    	let outlined = false;
    	let icon = "spellcheck";
    	let clearable = false;
    	let disabled = false;
    	let hideDetails = false;
    	let readonly = false;
    	let password = false;
    	let date = false;
    	let min = null;
    	let max = null;
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(17, showCode);
    	}

    	function input0_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox1_checked_binding(value) {
    		number = value;
    		$$invalidate(2, number);
    	}

    	function checkbox2_checked_binding(value) {
    		outlined = value;
    		$$invalidate(7, outlined);
    	}

    	function checkbox3_checked_binding(value) {
    		clearable = value;
    		$$invalidate(9, clearable);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled = value;
    		$$invalidate(10, disabled);
    	}

    	function checkbox5_checked_binding(value) {
    		hideDetails = value;
    		$$invalidate(11, hideDetails);
    	}

    	function checkbox6_checked_binding(value) {
    		readonly = value;
    		$$invalidate(12, readonly);
    	}

    	function checkbox7_checked_binding(value) {
    		password = value;
    		$$invalidate(13, password);
    	}

    	function checkbox8_checked_binding(value) {
    		date = value;
    		$$invalidate(14, date);
    	}

    	function input1_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input2_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function input3_value_binding(value) {
    		icon = value;
    		$$invalidate(8, icon);
    	}

    	function input4_value_binding(value) {
    		borderColor = value;
    		$$invalidate(3, borderColor);
    	}

    	function input5_value_binding(value) {
    		labelColor = value;
    		$$invalidate(4, labelColor);
    	}

    	function input6_value_binding(value) {
    		helperText = value;
    		$$invalidate(5, helperText);
    	}

    	function input7_value_binding(value) {
    		helperTextColor = value;
    		$$invalidate(6, helperTextColor);
    	}

    	function input8_value_binding(value) {
    		min = value;
    		$$invalidate(15, min);
    	}

    	function input9_value_binding(value) {
    		max = value;
    		$$invalidate(16, max);
    	}

    	return [
    		label,
    		value,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		password,
    		date,
    		min,
    		max,
    		showCode,
    		checkbox0_checked_binding,
    		input0_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		checkbox6_checked_binding,
    		checkbox7_checked_binding,
    		checkbox8_checked_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding,
    		input7_value_binding,
    		input8_value_binding,
    		input9_value_binding
    	];
    }

    class InputGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$g, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\components\CheckboxGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot_1$4(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (110:4) <Checkbox       bind:checked={checked2}       bind:indeterminate={indeterminate2}       color={color2}       disabled={disabled2}>
    function create_default_slot$5(ctx) {
    	let i;
    	let t1;
    	let span;

    	return {
    		c() {
    			i = element("i");
    			i.textContent = "facebook";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Checkbox with slot";
    			attr(i, "class", "material-icons text-blue-700");
    			attr(span, "class", "text-orange-500");
    		},
    		m(target, anchor) {
    			insert(target, i, anchor);
    			insert(target, t1, anchor);
    			insert(target, span, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(i);
    			if (detaching) detach(t1);
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment$h(ctx) {
    	let h2;
    	let t1;
    	let div30;
    	let t51;
    	let div49;
    	let h31;
    	let div31;
    	let t53;
    	let checkbox0;
    	let updating_checked;
    	let t54;
    	let div32;
    	let checkbox1;
    	let updating_checked_1;
    	let updating_indeterminate;
    	let t55;
    	let div40;
    	let div36;
    	let div33;
    	let checkbox2;
    	let updating_checked_2;
    	let t56;
    	let div34;
    	let checkbox3;
    	let updating_checked_3;
    	let t57;
    	let div35;
    	let checkbox4;
    	let updating_checked_4;
    	let t58;
    	let div39;
    	let div37;
    	let input0;
    	let updating_value;
    	let t59;
    	let div38;
    	let input1;
    	let updating_value_1;
    	let t60;
    	let div41;
    	let checkbox5;
    	let updating_checked_5;
    	let updating_indeterminate_1;
    	let t61;
    	let div48;
    	let div45;
    	let div42;
    	let checkbox6;
    	let updating_checked_6;
    	let t62;
    	let div43;
    	let checkbox7;
    	let updating_checked_7;
    	let t63;
    	let div44;
    	let checkbox8;
    	let updating_checked_8;
    	let t64;
    	let div47;
    	let div46;
    	let input2;
    	let updating_value_2;
    	let t65;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[10].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot_1$4] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[9] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[9];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[11].call(null, value);
    	}

    	function checkbox1_indeterminate_binding(value) {
    		/*checkbox1_indeterminate_binding*/ ctx[12].call(null, value);
    	}

    	let checkbox1_props = {
    		label: /*label1*/ ctx[0],
    		color: /*color1*/ ctx[3],
    		disabled: /*disabled1*/ ctx[4]
    	};

    	if (/*checked1*/ ctx[1] !== void 0) {
    		checkbox1_props.checked = /*checked1*/ ctx[1];
    	}

    	if (/*indeterminate1*/ ctx[2] !== void 0) {
    		checkbox1_props.indeterminate = /*indeterminate1*/ ctx[2];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));
    	binding_callbacks.push(() => bind(checkbox1, "indeterminate", checkbox1_indeterminate_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[13].call(null, value);
    	}

    	let checkbox2_props = { label: "checked" };

    	if (/*checked1*/ ctx[1] !== void 0) {
    		checkbox2_props.checked = /*checked1*/ ctx[1];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[14].call(null, value);
    	}

    	let checkbox3_props = { label: "indeterminate" };

    	if (/*indeterminate1*/ ctx[2] !== void 0) {
    		checkbox3_props.checked = /*indeterminate1*/ ctx[2];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[15].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled1*/ ctx[4] !== void 0) {
    		checkbox4_props.checked = /*disabled1*/ ctx[4];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[16].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label1*/ ctx[0] !== void 0) {
    		input0_props.value = /*label1*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[17].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "color"
    	};

    	if (/*color1*/ ctx[3] !== void 0) {
    		input1_props.value = /*color1*/ ctx[3];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[18].call(null, value);
    	}

    	function checkbox5_indeterminate_binding(value) {
    		/*checkbox5_indeterminate_binding*/ ctx[19].call(null, value);
    	}

    	let checkbox5_props = {
    		color: /*color2*/ ctx[7],
    		disabled: /*disabled2*/ ctx[8],
    		$$slots: { default: [create_default_slot$5] },
    		$$scope: { ctx }
    	};

    	if (/*checked2*/ ctx[5] !== void 0) {
    		checkbox5_props.checked = /*checked2*/ ctx[5];
    	}

    	if (/*indeterminate2*/ ctx[6] !== void 0) {
    		checkbox5_props.indeterminate = /*indeterminate2*/ ctx[6];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));
    	binding_callbacks.push(() => bind(checkbox5, "indeterminate", checkbox5_indeterminate_binding));

    	function checkbox6_checked_binding(value) {
    		/*checkbox6_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox6_props = { label: "checked" };

    	if (/*checked2*/ ctx[5] !== void 0) {
    		checkbox6_props.checked = /*checked2*/ ctx[5];
    	}

    	checkbox6 = new Checkbox({ props: checkbox6_props });
    	binding_callbacks.push(() => bind(checkbox6, "checked", checkbox6_checked_binding));

    	function checkbox7_checked_binding(value) {
    		/*checkbox7_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox7_props = { label: "indeterminate" };

    	if (/*indeterminate2*/ ctx[6] !== void 0) {
    		checkbox7_props.checked = /*indeterminate2*/ ctx[6];
    	}

    	checkbox7 = new Checkbox({ props: checkbox7_props });
    	binding_callbacks.push(() => bind(checkbox7, "checked", checkbox7_checked_binding));

    	function checkbox8_checked_binding(value) {
    		/*checkbox8_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox8_props = { label: "disabled" };

    	if (/*disabled2*/ ctx[8] !== void 0) {
    		checkbox8_props.checked = /*disabled2*/ ctx[8];
    	}

    	checkbox8 = new Checkbox({ props: checkbox8_props });
    	binding_callbacks.push(() => bind(checkbox8, "checked", checkbox8_checked_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[23].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "color"
    	};

    	if (/*color2*/ ctx[7] !== void 0) {
    		input2_props.value = /*color2*/ ctx[7];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Checkbox";
    			t1 = space();
    			div30 = element("div");

    			div30.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the checkbox.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">checked</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The checked status of the checkbox.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">indeterminate</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Whether the checked status is indeterminate.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">color</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the checkbox and its label. Accepts Tailwindcss text color</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-black</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Whether the checkbox is disabled.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div>`;

    			t51 = space();
    			div49 = element("div");
    			h31 = element("h3");
    			div31 = element("div");
    			div31.textContent = "Demo";
    			t53 = space();
    			create_component(checkbox0.$$.fragment);
    			t54 = space();
    			div32 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t55 = space();
    			div40 = element("div");
    			div36 = element("div");
    			div33 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t56 = space();
    			div34 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t57 = space();
    			div35 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t58 = space();
    			div39 = element("div");
    			div37 = element("div");
    			create_component(input0.$$.fragment);
    			t59 = space();
    			div38 = element("div");
    			create_component(input1.$$.fragment);
    			t60 = space();
    			div41 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t61 = space();
    			div48 = element("div");
    			div45 = element("div");
    			div42 = element("div");
    			create_component(checkbox6.$$.fragment);
    			t62 = space();
    			div43 = element("div");
    			create_component(checkbox7.$$.fragment);
    			t63 = space();
    			div44 = element("div");
    			create_component(checkbox8.$$.fragment);
    			t64 = space();
    			div47 = element("div");
    			div46 = element("div");
    			create_component(input2.$$.fragment);
    			t65 = space();
    			pre = element("pre");

    			pre.textContent = `${`<Checkbox
  label={label1}
  bind:checked={checked1}
  bind:indeterminate={indeterminate1}
  color={color1}
  disabled={disabled1} />
    
<Checkbox
  bind:checked={checked2}
  bind:indeterminate={indeterminate2}
  color={color2}
  disabled={disabled2}>
  <i class="material-icons text-blue-700">facebook</i>
  <span class="text-orange-500">Checkbox with slot</span>
</Checkbox>`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div30, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div31, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div32, "class", "mt-2 mb-1");
    			attr(div33, "class", "px-4");
    			attr(div34, "class", "px-4");
    			attr(div35, "class", "px-4");
    			attr(div36, "class", "w-full flex flex-row flex-wrap");
    			attr(div37, "class", "px-4 pb-2");
    			attr(div38, "class", "px-4 pb-2");
    			attr(div39, "class", "w-full flex flex-row flex-wrap");
    			attr(div40, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div41, "class", "mb-1 mt-6");
    			attr(div42, "class", "px-4");
    			attr(div43, "class", "px-4");
    			attr(div44, "class", "px-4");
    			attr(div45, "class", "w-full flex flex-row flex-wrap");
    			attr(div46, "class", "px-4 pb-2");
    			attr(div47, "class", "w-full flex flex-row flex-wrap");
    			attr(div48, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div49, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[9]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div30, anchor);
    			insert(target, t51, anchor);
    			insert(target, div49, anchor);
    			append(div49, h31);
    			append(h31, div31);
    			append(h31, t53);
    			mount_component(checkbox0, h31, null);
    			append(div49, t54);
    			append(div49, div32);
    			mount_component(checkbox1, div32, null);
    			append(div49, t55);
    			append(div49, div40);
    			append(div40, div36);
    			append(div36, div33);
    			mount_component(checkbox2, div33, null);
    			append(div36, t56);
    			append(div36, div34);
    			mount_component(checkbox3, div34, null);
    			append(div36, t57);
    			append(div36, div35);
    			mount_component(checkbox4, div35, null);
    			append(div40, t58);
    			append(div40, div39);
    			append(div39, div37);
    			mount_component(input0, div37, null);
    			append(div39, t59);
    			append(div39, div38);
    			mount_component(input1, div38, null);
    			append(div49, t60);
    			append(div49, div41);
    			mount_component(checkbox5, div41, null);
    			append(div49, t61);
    			append(div49, div48);
    			append(div48, div45);
    			append(div45, div42);
    			mount_component(checkbox6, div42, null);
    			append(div45, t62);
    			append(div45, div43);
    			mount_component(checkbox7, div43, null);
    			append(div45, t63);
    			append(div45, div44);
    			mount_component(checkbox8, div44, null);
    			append(div48, t64);
    			append(div48, div47);
    			append(div47, div46);
    			mount_component(input2, div46, null);
    			insert(target, t65, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox0_changes = {};

    			if (dirty & /*$$scope*/ 16777216) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 512) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[9];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};
    			if (dirty & /*label1*/ 1) checkbox1_changes.label = /*label1*/ ctx[0];
    			if (dirty & /*color1*/ 8) checkbox1_changes.color = /*color1*/ ctx[3];
    			if (dirty & /*disabled1*/ 16) checkbox1_changes.disabled = /*disabled1*/ ctx[4];

    			if (!updating_checked_1 && dirty & /*checked1*/ 2) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*checked1*/ ctx[1];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			if (!updating_indeterminate && dirty & /*indeterminate1*/ 4) {
    				updating_indeterminate = true;
    				checkbox1_changes.indeterminate = /*indeterminate1*/ ctx[2];
    				add_flush_callback(() => updating_indeterminate = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty & /*checked1*/ 2) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*checked1*/ ctx[1];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty & /*indeterminate1*/ 4) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*indeterminate1*/ ctx[2];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty & /*disabled1*/ 16) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled1*/ ctx[4];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const input0_changes = {};

    			if (!updating_value && dirty & /*label1*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*label1*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*color1*/ 8) {
    				updating_value_1 = true;
    				input1_changes.value = /*color1*/ ctx[3];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const checkbox5_changes = {};
    			if (dirty & /*color2*/ 128) checkbox5_changes.color = /*color2*/ ctx[7];
    			if (dirty & /*disabled2*/ 256) checkbox5_changes.disabled = /*disabled2*/ ctx[8];

    			if (dirty & /*$$scope*/ 16777216) {
    				checkbox5_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked_5 && dirty & /*checked2*/ 32) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*checked2*/ ctx[5];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			if (!updating_indeterminate_1 && dirty & /*indeterminate2*/ 64) {
    				updating_indeterminate_1 = true;
    				checkbox5_changes.indeterminate = /*indeterminate2*/ ctx[6];
    				add_flush_callback(() => updating_indeterminate_1 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const checkbox6_changes = {};

    			if (!updating_checked_6 && dirty & /*checked2*/ 32) {
    				updating_checked_6 = true;
    				checkbox6_changes.checked = /*checked2*/ ctx[5];
    				add_flush_callback(() => updating_checked_6 = false);
    			}

    			checkbox6.$set(checkbox6_changes);
    			const checkbox7_changes = {};

    			if (!updating_checked_7 && dirty & /*indeterminate2*/ 64) {
    				updating_checked_7 = true;
    				checkbox7_changes.checked = /*indeterminate2*/ ctx[6];
    				add_flush_callback(() => updating_checked_7 = false);
    			}

    			checkbox7.$set(checkbox7_changes);
    			const checkbox8_changes = {};

    			if (!updating_checked_8 && dirty & /*disabled2*/ 256) {
    				updating_checked_8 = true;
    				checkbox8_changes.checked = /*disabled2*/ ctx[8];
    				add_flush_callback(() => updating_checked_8 = false);
    			}

    			checkbox8.$set(checkbox8_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*color2*/ 128) {
    				updating_value_2 = true;
    				input2_changes.value = /*color2*/ ctx[7];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);

    			if (dirty & /*showCode*/ 512) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[9]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(checkbox6.$$.fragment, local);
    			transition_in(checkbox7.$$.fragment, local);
    			transition_in(checkbox8.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(checkbox6.$$.fragment, local);
    			transition_out(checkbox7.$$.fragment, local);
    			transition_out(checkbox8.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div30);
    			if (detaching) detach(t51);
    			if (detaching) detach(div49);
    			destroy_component(checkbox0);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(checkbox5);
    			destroy_component(checkbox6);
    			destroy_component(checkbox7);
    			destroy_component(checkbox8);
    			destroy_component(input2);
    			if (detaching) detach(t65);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let label1 = "Checkbox with label";
    	let checked1 = false;
    	let indeterminate1 = false;
    	let color1 = "text-green-500";
    	let disabled1 = false;
    	let checked2 = false;
    	let indeterminate2 = false;
    	let color2 = "text-red-700";
    	let disabled2 = false;
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(9, showCode);
    	}

    	function checkbox1_checked_binding(value) {
    		checked1 = value;
    		$$invalidate(1, checked1);
    	}

    	function checkbox1_indeterminate_binding(value) {
    		indeterminate1 = value;
    		$$invalidate(2, indeterminate1);
    	}

    	function checkbox2_checked_binding(value) {
    		checked1 = value;
    		$$invalidate(1, checked1);
    	}

    	function checkbox3_checked_binding(value) {
    		indeterminate1 = value;
    		$$invalidate(2, indeterminate1);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled1 = value;
    		$$invalidate(4, disabled1);
    	}

    	function input0_value_binding(value) {
    		label1 = value;
    		$$invalidate(0, label1);
    	}

    	function input1_value_binding(value) {
    		color1 = value;
    		$$invalidate(3, color1);
    	}

    	function checkbox5_checked_binding(value) {
    		checked2 = value;
    		$$invalidate(5, checked2);
    	}

    	function checkbox5_indeterminate_binding(value) {
    		indeterminate2 = value;
    		$$invalidate(6, indeterminate2);
    	}

    	function checkbox6_checked_binding(value) {
    		checked2 = value;
    		$$invalidate(5, checked2);
    	}

    	function checkbox7_checked_binding(value) {
    		indeterminate2 = value;
    		$$invalidate(6, indeterminate2);
    	}

    	function checkbox8_checked_binding(value) {
    		disabled2 = value;
    		$$invalidate(8, disabled2);
    	}

    	function input2_value_binding(value) {
    		color2 = value;
    		$$invalidate(7, color2);
    	}

    	return [
    		label1,
    		checked1,
    		indeterminate1,
    		color1,
    		disabled1,
    		checked2,
    		indeterminate2,
    		color2,
    		disabled2,
    		showCode,
    		checkbox0_checked_binding,
    		checkbox1_checked_binding,
    		checkbox1_indeterminate_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		checkbox5_checked_binding,
    		checkbox5_indeterminate_binding,
    		checkbox6_checked_binding,
    		checkbox7_checked_binding,
    		checkbox8_checked_binding,
    		input2_value_binding
    	];
    }

    class CheckboxGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$f, create_fragment$h, safe_not_equal, {});
    	}
    }

    /* src\widgets\FileInput.svelte generated by Svelte v3.31.0 */

    function create_fragment$i(ctx) {
    	let input0;
    	let updating_value;
    	let t;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[17].call(null, value);
    	}

    	let input0_props = {
    		outlined: /*outlined*/ ctx[8],
    		icon: /*icon*/ ctx[9],
    		clearable: /*clearable*/ ctx[2],
    		disabled: /*disabled*/ ctx[3],
    		hideDetails: /*hideDetails*/ ctx[10],
    		readonly: true,
    		label: /*label*/ ctx[0],
    		labelColor: /*labelColor*/ ctx[5],
    		borderColor: /*borderColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[6],
    		helperTextColor: /*helperTextColor*/ ctx[7]
    	};

    	if (/*text*/ ctx[12] !== void 0) {
    		input0_props.value = /*text*/ ctx[12];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));
    	input0.$on("focus", /*focus_handler*/ ctx[18]);
    	input0.$on("blur", /*blur_handler*/ ctx[19]);
    	input0.$on("keydown", /*keydown_handler*/ ctx[20]);
    	input0.$on("clear", /*clear_handler*/ ctx[21]);
    	input0.$on("click", /*selectFile*/ ctx[14]);

    	return {
    		c() {
    			create_component(input0.$$.fragment);
    			t = space();
    			input1 = element("input");
    			attr(input1, "type", "file");
    			attr(input1, "accept", /*accept*/ ctx[1]);
    			input1.multiple = /*multiple*/ ctx[11];
    			attr(input1, "class", "hidden");
    		},
    		m(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert(target, t, anchor);
    			insert(target, input1, anchor);
    			/*input1_binding*/ ctx[22](input1);
    			current = true;

    			if (!mounted) {
    				dispose = listen(input1, "change", /*fileSelected*/ ctx[15]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const input0_changes = {};
    			if (dirty & /*outlined*/ 256) input0_changes.outlined = /*outlined*/ ctx[8];
    			if (dirty & /*icon*/ 512) input0_changes.icon = /*icon*/ ctx[9];
    			if (dirty & /*clearable*/ 4) input0_changes.clearable = /*clearable*/ ctx[2];
    			if (dirty & /*disabled*/ 8) input0_changes.disabled = /*disabled*/ ctx[3];
    			if (dirty & /*hideDetails*/ 1024) input0_changes.hideDetails = /*hideDetails*/ ctx[10];
    			if (dirty & /*label*/ 1) input0_changes.label = /*label*/ ctx[0];
    			if (dirty & /*labelColor*/ 32) input0_changes.labelColor = /*labelColor*/ ctx[5];
    			if (dirty & /*borderColor*/ 16) input0_changes.borderColor = /*borderColor*/ ctx[4];
    			if (dirty & /*helperText*/ 64) input0_changes.helperText = /*helperText*/ ctx[6];
    			if (dirty & /*helperTextColor*/ 128) input0_changes.helperTextColor = /*helperTextColor*/ ctx[7];

    			if (!updating_value && dirty & /*text*/ 4096) {
    				updating_value = true;
    				input0_changes.value = /*text*/ ctx[12];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);

    			if (!current || dirty & /*accept*/ 2) {
    				attr(input1, "accept", /*accept*/ ctx[1]);
    			}

    			if (!current || dirty & /*multiple*/ 2048) {
    				input1.multiple = /*multiple*/ ctx[11];
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(input0.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach(t);
    			if (detaching) detach(input1);
    			/*input1_binding*/ ctx[22](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { accept = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { icon = "" } = $$props;
    	let { hideDetails = false } = $$props;
    	let { multiple = false } = $$props;
    	let { value = null } = $$props;
    	let text = "";
    	let fileInput;

    	function selectFile() {
    		$$invalidate(13, fileInput.value = "", fileInput);
    		fileInput.click();
    	}

    	function fileSelected(e) {
    		$$invalidate(16, value = e.target.files);
    		dispatch(e.type, e.target.files);
    		$$invalidate(12, text = "");
    		const texts = [];

    		for (let i = 0; i < e.target.files.length; i++) {
    			texts.push(e.target.files[i].name);
    		}

    		$$invalidate(12, text = texts.join(", "));
    	}

    	function input0_value_binding(value$1) {
    		text = value$1;
    		($$invalidate(12, text), $$invalidate(16, value));
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function clear_handler(event) {
    		bubble($$self, event);
    	}

    	function input1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			fileInput = $$value;
    			$$invalidate(13, fileInput);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("accept" in $$props) $$invalidate(1, accept = $$props.accept);
    		if ("clearable" in $$props) $$invalidate(2, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("borderColor" in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(5, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(6, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(7, helperTextColor = $$props.helperTextColor);
    		if ("outlined" in $$props) $$invalidate(8, outlined = $$props.outlined);
    		if ("icon" in $$props) $$invalidate(9, icon = $$props.icon);
    		if ("hideDetails" in $$props) $$invalidate(10, hideDetails = $$props.hideDetails);
    		if ("multiple" in $$props) $$invalidate(11, multiple = $$props.multiple);
    		if ("value" in $$props) $$invalidate(16, value = $$props.value);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 65536) {
    			 if (!value) {
    				$$invalidate(12, text = "");
    			}
    		}
    	};

    	return [
    		label,
    		accept,
    		clearable,
    		disabled,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		hideDetails,
    		multiple,
    		text,
    		fileInput,
    		selectFile,
    		fileSelected,
    		value,
    		input0_value_binding,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		clear_handler,
    		input1_binding
    	];
    }

    class FileInput extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$g, create_fragment$i, safe_not_equal, {
    			label: 0,
    			accept: 1,
    			clearable: 2,
    			disabled: 3,
    			borderColor: 4,
    			labelColor: 5,
    			helperText: 6,
    			helperTextColor: 7,
    			outlined: 8,
    			icon: 9,
    			hideDetails: 10,
    			multiple: 11,
    			value: 16
    		});
    	}
    }

    /* src\components\FileInputGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$6(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$j(ctx) {
    	let h2;
    	let t1;
    	let div70;
    	let t117;
    	let div89;
    	let h31;
    	let div71;
    	let t119;
    	let checkbox0;
    	let updating_checked;
    	let t120;
    	let div72;
    	let fileinput;
    	let updating_value;
    	let t121;
    	let div88;
    	let div78;
    	let div73;
    	let checkbox1;
    	let updating_checked_1;
    	let t122;
    	let div74;
    	let checkbox2;
    	let updating_checked_2;
    	let t123;
    	let div75;
    	let checkbox3;
    	let updating_checked_3;
    	let t124;
    	let div76;
    	let checkbox4;
    	let updating_checked_4;
    	let t125;
    	let div77;
    	let checkbox5;
    	let updating_checked_5;
    	let t126;
    	let div87;
    	let div79;
    	let input0;
    	let updating_value_1;
    	let t127;
    	let div80;
    	let input1;
    	let updating_value_2;
    	let t128;
    	let div81;
    	let input2;
    	let updating_value_3;
    	let t129;
    	let div82;
    	let input3;
    	let updating_value_4;
    	let t130;
    	let div83;
    	let input4;
    	let updating_value_5;
    	let t131;
    	let div84;
    	let input5;
    	let updating_value_6;
    	let t132;
    	let div85;
    	let input6;
    	let updating_value_7;
    	let t133;
    	let div86;
    	let input7;
    	let updating_value_8;
    	let t134;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[14].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$6] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[13] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[13];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function fileinput_value_binding(value) {
    		/*fileinput_value_binding*/ ctx[15].call(null, value);
    	}

    	let fileinput_props = {
    		label: /*label*/ ctx[0],
    		accept: /*accept*/ ctx[1],
    		multiple: /*multiple*/ ctx[11],
    		borderColor: /*borderColor*/ ctx[4],
    		labelColor: /*labelColor*/ ctx[5],
    		helperText: /*helperText*/ ctx[6],
    		helperTextColor: /*helperTextColor*/ ctx[7],
    		outlined: /*outlined*/ ctx[8],
    		icon: /*icon*/ ctx[9],
    		clearable: /*clearable*/ ctx[2],
    		disabled: /*disabled*/ ctx[3],
    		hideDetails: /*hideDetails*/ ctx[10]
    	};

    	if (/*value*/ ctx[12] !== void 0) {
    		fileinput_props.value = /*value*/ ctx[12];
    	}

    	fileinput = new FileInput({ props: fileinput_props });
    	binding_callbacks.push(() => bind(fileinput, "value", fileinput_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[16].call(null, value);
    	}

    	let checkbox1_props = { label: "multiple" };

    	if (/*multiple*/ ctx[11] !== void 0) {
    		checkbox1_props.checked = /*multiple*/ ctx[11];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[17].call(null, value);
    	}

    	let checkbox2_props = { label: "outlined" };

    	if (/*outlined*/ ctx[8] !== void 0) {
    		checkbox2_props.checked = /*outlined*/ ctx[8];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox3_props = { label: "clearable" };

    	if (/*clearable*/ ctx[2] !== void 0) {
    		checkbox3_props.checked = /*clearable*/ ctx[2];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[19].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled*/ ctx[3] !== void 0) {
    		checkbox4_props.checked = /*disabled*/ ctx[3];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox5_props = { label: "hideDetails" };

    	if (/*hideDetails*/ ctx[10] !== void 0) {
    		checkbox5_props.checked = /*hideDetails*/ ctx[10];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[21].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input0_props.value = /*label*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[22].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "accept"
    	};

    	if (/*accept*/ ctx[1] !== void 0) {
    		input1_props.value = /*accept*/ ctx[1];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[23].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "value"
    	};

    	if (/*value*/ ctx[12] !== void 0) {
    		input2_props.value = /*value*/ ctx[12];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[24].call(null, value);
    	}

    	let input3_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "icon"
    	};

    	if (/*icon*/ ctx[9] !== void 0) {
    		input3_props.value = /*icon*/ ctx[9];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[25].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "borderColor"
    	};

    	if (/*borderColor*/ ctx[4] !== void 0) {
    		input4_props.value = /*borderColor*/ ctx[4];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[26].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelColor"
    	};

    	if (/*labelColor*/ ctx[5] !== void 0) {
    		input5_props.value = /*labelColor*/ ctx[5];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[27].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperText"
    	};

    	if (/*helperText*/ ctx[6] !== void 0) {
    		input6_props.value = /*helperText*/ ctx[6];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	function input7_value_binding(value) {
    		/*input7_value_binding*/ ctx[28].call(null, value);
    	}

    	let input7_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperTextColor"
    	};

    	if (/*helperTextColor*/ ctx[7] !== void 0) {
    		input7_props.value = /*helperTextColor*/ ctx[7];
    	}

    	input7 = new Input({ props: input7_props });
    	binding_callbacks.push(() => bind(input7, "value", input7_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "File Input";
    			t1 = space();
    			div70 = element("div");

    			div70.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">accept</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specify what file types the user can pick from the file input dialog box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">multiple</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Whether multiple files can be selected</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The FileList selected by the user</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 

  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">borderColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The border color of the input box. Accepts valid Tailwindcss border color
      class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label text. Accepts valid Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The helper text underneath the input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperTextColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the helper text underneath the input box. Accepts Tailwindcss
      text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Transformed this into a outlined input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">icon</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The icon to display on the right of the input box. <br/> Accepts a material
      icon from this list <a class="text-blue-600" href="https://material.io/resources/icons/?style=baseline">https://material.io/resources/icons/?style=baseline</a></div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">clearable</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Includes a clear button when &#39;clearable&#39; is true</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Disables input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">hideDetails</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Hides helper text.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div>`;

    			t117 = space();
    			div89 = element("div");
    			h31 = element("h3");
    			div71 = element("div");
    			div71.textContent = "Demo";
    			t119 = space();
    			create_component(checkbox0.$$.fragment);
    			t120 = space();
    			div72 = element("div");
    			create_component(fileinput.$$.fragment);
    			t121 = space();
    			div88 = element("div");
    			div78 = element("div");
    			div73 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t122 = space();
    			div74 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t123 = space();
    			div75 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t124 = space();
    			div76 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t125 = space();
    			div77 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t126 = space();
    			div87 = element("div");
    			div79 = element("div");
    			create_component(input0.$$.fragment);
    			t127 = space();
    			div80 = element("div");
    			create_component(input1.$$.fragment);
    			t128 = space();
    			div81 = element("div");
    			create_component(input2.$$.fragment);
    			t129 = space();
    			div82 = element("div");
    			create_component(input3.$$.fragment);
    			t130 = space();
    			div83 = element("div");
    			create_component(input4.$$.fragment);
    			t131 = space();
    			div84 = element("div");
    			create_component(input5.$$.fragment);
    			t132 = space();
    			div85 = element("div");
    			create_component(input6.$$.fragment);
    			t133 = space();
    			div86 = element("div");
    			create_component(input7.$$.fragment);
    			t134 = space();
    			pre = element("pre");

    			pre.textContent = `${`<FileInput
  {label}
  {accept}
  {multiple}
  bind:value
  {borderColor}
  {labelColor}
  {helperText}
  {helperTextColor}
  {outlined}
  {icon}
  {clearable}
  {disabled}
  {hideDetails} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div70, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div71, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div72, "class", "my-2");
    			attr(div73, "class", "px-4");
    			attr(div74, "class", "px-4");
    			attr(div75, "class", "px-4");
    			attr(div76, "class", "px-4");
    			attr(div77, "class", "px-4");
    			attr(div78, "class", "w-full flex flex-row flex-wrap");
    			attr(div79, "class", "px-4 pb-2");
    			attr(div80, "class", "px-4 pb-2");
    			attr(div81, "class", "px-4 pb-2");
    			attr(div82, "class", "px-4 pb-2");
    			attr(div83, "class", "px-4 pb-2");
    			attr(div84, "class", "px-4 pb-2");
    			attr(div85, "class", "px-4 pb-2");
    			attr(div86, "class", "px-4 pb-2");
    			attr(div87, "class", "w-full flex flex-row flex-wrap");
    			attr(div88, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div89, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[13]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div70, anchor);
    			insert(target, t117, anchor);
    			insert(target, div89, anchor);
    			append(div89, h31);
    			append(h31, div71);
    			append(h31, t119);
    			mount_component(checkbox0, h31, null);
    			append(div89, t120);
    			append(div89, div72);
    			mount_component(fileinput, div72, null);
    			append(div89, t121);
    			append(div89, div88);
    			append(div88, div78);
    			append(div78, div73);
    			mount_component(checkbox1, div73, null);
    			append(div78, t122);
    			append(div78, div74);
    			mount_component(checkbox2, div74, null);
    			append(div78, t123);
    			append(div78, div75);
    			mount_component(checkbox3, div75, null);
    			append(div78, t124);
    			append(div78, div76);
    			mount_component(checkbox4, div76, null);
    			append(div78, t125);
    			append(div78, div77);
    			mount_component(checkbox5, div77, null);
    			append(div88, t126);
    			append(div88, div87);
    			append(div87, div79);
    			mount_component(input0, div79, null);
    			append(div87, t127);
    			append(div87, div80);
    			mount_component(input1, div80, null);
    			append(div87, t128);
    			append(div87, div81);
    			mount_component(input2, div81, null);
    			append(div87, t129);
    			append(div87, div82);
    			mount_component(input3, div82, null);
    			append(div87, t130);
    			append(div87, div83);
    			mount_component(input4, div83, null);
    			append(div87, t131);
    			append(div87, div84);
    			mount_component(input5, div84, null);
    			append(div87, t132);
    			append(div87, div85);
    			mount_component(input6, div85, null);
    			append(div87, t133);
    			append(div87, div86);
    			mount_component(input7, div86, null);
    			insert(target, t134, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox0_changes = {};

    			if (dirty & /*$$scope*/ 536870912) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 8192) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[13];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const fileinput_changes = {};
    			if (dirty & /*label*/ 1) fileinput_changes.label = /*label*/ ctx[0];
    			if (dirty & /*accept*/ 2) fileinput_changes.accept = /*accept*/ ctx[1];
    			if (dirty & /*multiple*/ 2048) fileinput_changes.multiple = /*multiple*/ ctx[11];
    			if (dirty & /*borderColor*/ 16) fileinput_changes.borderColor = /*borderColor*/ ctx[4];
    			if (dirty & /*labelColor*/ 32) fileinput_changes.labelColor = /*labelColor*/ ctx[5];
    			if (dirty & /*helperText*/ 64) fileinput_changes.helperText = /*helperText*/ ctx[6];
    			if (dirty & /*helperTextColor*/ 128) fileinput_changes.helperTextColor = /*helperTextColor*/ ctx[7];
    			if (dirty & /*outlined*/ 256) fileinput_changes.outlined = /*outlined*/ ctx[8];
    			if (dirty & /*icon*/ 512) fileinput_changes.icon = /*icon*/ ctx[9];
    			if (dirty & /*clearable*/ 4) fileinput_changes.clearable = /*clearable*/ ctx[2];
    			if (dirty & /*disabled*/ 8) fileinput_changes.disabled = /*disabled*/ ctx[3];
    			if (dirty & /*hideDetails*/ 1024) fileinput_changes.hideDetails = /*hideDetails*/ ctx[10];

    			if (!updating_value && dirty & /*value*/ 4096) {
    				updating_value = true;
    				fileinput_changes.value = /*value*/ ctx[12];
    				add_flush_callback(() => updating_value = false);
    			}

    			fileinput.$set(fileinput_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty & /*multiple*/ 2048) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*multiple*/ ctx[11];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty & /*outlined*/ 256) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*outlined*/ ctx[8];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty & /*clearable*/ 4) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*clearable*/ ctx[2];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty & /*disabled*/ 8) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled*/ ctx[3];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (!updating_checked_5 && dirty & /*hideDetails*/ 1024) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*hideDetails*/ ctx[10];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty & /*label*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_2 && dirty & /*accept*/ 2) {
    				updating_value_2 = true;
    				input1_changes.value = /*accept*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_3 && dirty & /*value*/ 4096) {
    				updating_value_3 = true;
    				input2_changes.value = /*value*/ ctx[12];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_4 && dirty & /*icon*/ 512) {
    				updating_value_4 = true;
    				input3_changes.value = /*icon*/ ctx[9];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_5 && dirty & /*borderColor*/ 16) {
    				updating_value_5 = true;
    				input4_changes.value = /*borderColor*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_6 && dirty & /*labelColor*/ 32) {
    				updating_value_6 = true;
    				input5_changes.value = /*labelColor*/ ctx[5];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_7 && dirty & /*helperText*/ 64) {
    				updating_value_7 = true;
    				input6_changes.value = /*helperText*/ ctx[6];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input6.$set(input6_changes);
    			const input7_changes = {};

    			if (!updating_value_8 && dirty & /*helperTextColor*/ 128) {
    				updating_value_8 = true;
    				input7_changes.value = /*helperTextColor*/ ctx[7];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			input7.$set(input7_changes);

    			if (dirty & /*showCode*/ 8192) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[13]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(fileinput.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(fileinput.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div70);
    			if (detaching) detach(t117);
    			if (detaching) detach(div89);
    			destroy_component(checkbox0);
    			destroy_component(fileinput);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    			if (detaching) detach(t134);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let label = "Select a file";
    	let accept = ".docx,.txt,.js,.json,.readme";
    	let clearable = false;
    	let disabled = false;
    	let borderColor = "border-gray-700";
    	let labelColor = "text-gray-700";
    	let helperText = "Click the input box to select a file";
    	let helperTextColor = "text-red-600";
    	let outlined = false;
    	let icon = "description";
    	let hideDetails = false;
    	let multiple = false;
    	let value = null;
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(13, showCode);
    	}

    	function fileinput_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(12, value);
    	}

    	function checkbox1_checked_binding(value) {
    		multiple = value;
    		$$invalidate(11, multiple);
    	}

    	function checkbox2_checked_binding(value) {
    		outlined = value;
    		$$invalidate(8, outlined);
    	}

    	function checkbox3_checked_binding(value) {
    		clearable = value;
    		$$invalidate(2, clearable);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled = value;
    		$$invalidate(3, disabled);
    	}

    	function checkbox5_checked_binding(value) {
    		hideDetails = value;
    		$$invalidate(10, hideDetails);
    	}

    	function input0_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input1_value_binding(value) {
    		accept = value;
    		$$invalidate(1, accept);
    	}

    	function input2_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(12, value);
    	}

    	function input3_value_binding(value) {
    		icon = value;
    		$$invalidate(9, icon);
    	}

    	function input4_value_binding(value) {
    		borderColor = value;
    		$$invalidate(4, borderColor);
    	}

    	function input5_value_binding(value) {
    		labelColor = value;
    		$$invalidate(5, labelColor);
    	}

    	function input6_value_binding(value) {
    		helperText = value;
    		$$invalidate(6, helperText);
    	}

    	function input7_value_binding(value) {
    		helperTextColor = value;
    		$$invalidate(7, helperTextColor);
    	}

    	return [
    		label,
    		accept,
    		clearable,
    		disabled,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		hideDetails,
    		multiple,
    		value,
    		showCode,
    		checkbox0_checked_binding,
    		fileinput_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding,
    		input7_value_binding
    	];
    }

    class FileInputGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$h, create_fragment$j, safe_not_equal, {});
    	}
    }

    /* src\widgets\TextAreaStd.svelte generated by Svelte v3.31.0 */

    function create_if_block$6(ctx) {
    	let div;
    	let t;
    	let div_class_value;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[3]);
    			attr(div, "class", div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[17]) + " svelte-1cjqtag"));
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 8) set_data(t, /*helperText*/ ctx[3]);

    			if (dirty[0] & /*helperTextCls*/ 131072 && div_class_value !== (div_class_value = "" + (null_to_empty(/*helperTextCls*/ ctx[17]) + " svelte-1cjqtag"))) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$k(ctx) {
    	let div3;
    	let div2;
    	let label_1;
    	let t0;
    	let label_1_style_value;
    	let label_1_class_value;
    	let t1;
    	let div1;
    	let textarea;
    	let textarea_class_value;
    	let t2;
    	let div0;
    	let i0;
    	let t3;
    	let i0_class_value;
    	let t4;
    	let i1;
    	let t5;
    	let i1_class_value;
    	let div2_class_value;
    	let t6;
    	let div3_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[7] && create_if_block$6(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t3 = text("clear");
    			t4 = space();
    			i1 = element("i");
    			t5 = text(/*icon*/ ctx[4]);
    			t6 = space();
    			if (if_block) if_block.c();
    			attr(label_1, "style", label_1_style_value = `${/*labelTopPadding*/ ctx[16]} max-width:${/*boxWidth*/ ctx[12]}px;`);
    			attr(label_1, "class", label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[14]} truncate`) + " svelte-1cjqtag"));
    			attr(textarea, "type", /*type*/ ctx[13]);
    			textarea.readOnly = /*readonly*/ ctx[8];
    			textarea.value = /*value*/ ctx[0];
    			textarea.disabled = /*disabled*/ ctx[6];
    			attr(textarea, "style", /*inputPadBottom*/ ctx[15]);

    			attr(textarea, "class", textarea_class_value = "" + (null_to_empty(`mt-6 appearance-none bg-transparent border-none w-full
         text-gray-800 px-2 focus:outline-none ${/*height*/ ctx[9]}`) + " svelte-1cjqtag"));

    			attr(i0, "class", i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "");

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			attr(i1, "class", i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[11]) + " svelte-1cjqtag"));
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			attr(div0, "class", "float-right flex items-center mr-2");
    			attr(div1, "class", "flex justify-between");

    			attr(div2, "class", div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[10]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ""
				: " hover:border-gray-900 hover:bg-gray-100"}`) + " svelte-1cjqtag"));

    			toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			attr(div3, "class", "flex flex-col");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[32].call(div3));
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, label_1);
    			append(label_1, t0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, textarea);
    			append(div1, t2);
    			append(div1, div0);
    			append(div0, i0);
    			append(i0, t3);
    			append(div0, t4);
    			append(div0, i1);
    			append(i1, t5);
    			append(div3, t6);
    			if (if_block) if_block.m(div3, null);
    			div3_resize_listener = add_resize_listener(div3, /*div3_elementresize_handler*/ ctx[32].bind(div3));

    			if (!mounted) {
    				dispose = [
    					listen(textarea, "input", /*handleInput*/ ctx[19]),
    					listen(textarea, "focus", /*focus_handler_1*/ ctx[30]),
    					listen(textarea, "blur", /*blur_handler_1*/ ctx[31]),
    					listen(textarea, "focus", /*focus_handler*/ ctx[26]),
    					listen(textarea, "blur", /*blur_handler*/ ctx[27]),
    					listen(textarea, "keydown", /*keydown_handler*/ ctx[28]),
    					listen(textarea, "click", /*click_handler*/ ctx[29]),
    					listen(i0, "click", /*clear*/ ctx[20])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*label*/ 2) set_data(t0, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTopPadding, boxWidth*/ 69632 && label_1_style_value !== (label_1_style_value = `${/*labelTopPadding*/ ctx[16]} max-width:${/*boxWidth*/ ctx[12]}px;`)) {
    				attr(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 16384 && label_1_class_value !== (label_1_class_value = "" + (null_to_empty(`${/*labelCls*/ ctx[14]} truncate`) + " svelte-1cjqtag"))) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 8192) {
    				attr(textarea, "type", /*type*/ ctx[13]);
    			}

    			if (dirty[0] & /*readonly*/ 256) {
    				textarea.readOnly = /*readonly*/ ctx[8];
    			}

    			if (dirty[0] & /*value*/ 1) {
    				textarea.value = /*value*/ ctx[0];
    			}

    			if (dirty[0] & /*disabled*/ 64) {
    				textarea.disabled = /*disabled*/ ctx[6];
    			}

    			if (dirty[0] & /*inputPadBottom*/ 32768) {
    				attr(textarea, "style", /*inputPadBottom*/ ctx[15]);
    			}

    			if (dirty[0] & /*height*/ 512 && textarea_class_value !== (textarea_class_value = "" + (null_to_empty(`mt-6 appearance-none bg-transparent border-none w-full
         text-gray-800 px-2 focus:outline-none ${/*height*/ ctx[9]}`) + " svelte-1cjqtag"))) {
    				attr(textarea, "class", textarea_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 96 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[5] && !/*disabled*/ ctx[6]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "")) {
    				attr(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 96) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[5] || /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*icon*/ 16) set_data(t5, /*icon*/ ctx[4]);

    			if (dirty[0] & /*iconCls*/ 2048 && i1_class_value !== (i1_class_value = "" + (null_to_empty(/*iconCls*/ ctx[11]) + " svelte-1cjqtag"))) {
    				attr(i1, "class", i1_class_value);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 2112) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled*/ 1092 && div2_class_value !== (div2_class_value = "" + (null_to_empty(/*hasFocus*/ ctx[10]
    			? `relative rounded-t border-b-2 bg-gray-300 ${/*borderColor*/ ctx[2]}`
    			: `relative rounded-t border-b border-gray-500${/*disabled*/ ctx[6]
				? ""
				: " hover:border-gray-900 hover:bg-gray-100"}`) + " svelte-1cjqtag"))) {
    				attr(div2, "class", div2_class_value);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 1092) {
    				toggle_class(div2, "opacity-50", /*disabled*/ ctx[6]);
    			}

    			if (dirty[0] & /*hasFocus, borderColor, disabled, disabled*/ 1092) {
    				toggle_class(div2, "disabled", /*disabled*/ ctx[6]);
    			}

    			if (!/*hideDetails*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (if_block) if_block.d();
    			div3_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $y;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { height } = $$props;
    	let hasFocus = false;
    	let iconCls = "";
    	let boxWidth;

    	onMount(() => {
    		$$invalidate(11, iconCls = icon
    		? "material-icons md-18 pointer-events-none"
    		: "hidden");
    	});

    	const y = tweened(1, { duration: 50 });
    	component_subscribe($$self, y, value => $$invalidate(25, $y = value));
    	let type = "text";

    	function handleInput(event) {
    		switch (type) {
    			case "text":
    				$$invalidate(0, value = event.target.value);
    				break;
    			case "number":
    				$$invalidate(0, value = +event.target.value);
    		}

    		dispatch("input", value);
    	}

    	let labelCls = "absolute left-0 px-2 text-sm text-gray-600 pointer-events-none";
    	let inputPadBottom = "";

    	function setLabelColor(prefix) {
    		$$invalidate(14, labelCls = `${prefix} ${labelColor}`);
    	}

    	let valueEmpty = false;

    	function clear() {
    		$$invalidate(0, value = "");
    		dispatch("clear");
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const focus_handler_1 = () => $$invalidate(10, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(10, hasFocus = false);

    	function div3_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(12, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(21, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(2, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(22, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(3, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(23, helperTextColor = $$props.helperTextColor);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(5, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(7, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(8, readonly = $$props.readonly);
    		if ("height" in $$props) $$invalidate(9, height = $$props.height);
    	};

    	let labelTopPadding;
    	let helperTextCls;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*number*/ 2097152) {
    			 if (number) $$invalidate(13, type = "number");
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 33554432) {
    			 $$invalidate(16, labelTopPadding = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 8388608) {
    			 $$invalidate(17, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1) {
    			 $$invalidate(24, valueEmpty = value == null || value.toString().length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, valueEmpty*/ 16778240) {
    			 if (hasFocus) {
    				y.set(0.25);
    				setLabelColor("absolute left-0 px-2 text-sm pointer-events-none");
    				$$invalidate(15, inputPadBottom = "padding-bottom:7px");
    			} else {
    				$$invalidate(15, inputPadBottom = "padding-bottom:8px");
    				$$invalidate(14, labelCls = "absolute left-0 px-2 text-sm pointer-events-none text-gray-600");

    				if (valueEmpty) {
    					y.set(1);
    					$$invalidate(14, labelCls = "absolute left-0 px-2 pointer-events-none text-gray-600");
    				} else {
    					y.set(0.25);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		borderColor,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		height,
    		hasFocus,
    		iconCls,
    		boxWidth,
    		type,
    		labelCls,
    		inputPadBottom,
    		labelTopPadding,
    		helperTextCls,
    		y,
    		handleInput,
    		clear,
    		number,
    		labelColor,
    		helperTextColor,
    		valueEmpty,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		click_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div3_elementresize_handler
    	];
    }

    class TextAreaStd extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$i,
    			create_fragment$k,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 21,
    				borderColor: 2,
    				labelColor: 22,
    				helperText: 3,
    				helperTextColor: 23,
    				icon: 4,
    				clearable: 5,
    				disabled: 6,
    				hideDetails: 7,
    				readonly: 8,
    				height: 9
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\widgets\TextAreaOutlined.svelte generated by Svelte v3.31.0 */

    function create_if_block$7(ctx) {
    	let div;
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*helperText*/ ctx[2]);
    			attr(div, "class", /*helperTextCls*/ ctx[18]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*helperText*/ 4) set_data(t, /*helperText*/ ctx[2]);

    			if (dirty[0] & /*helperTextCls*/ 262144) {
    				attr(div, "class", /*helperTextCls*/ ctx[18]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$l(ctx) {
    	let div2;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1;
    	let label_1;
    	let t2;
    	let label_1_style_value;
    	let label_1_class_value;
    	let label_1_resize_listener;
    	let t3;
    	let div1;
    	let textarea;
    	let textarea_class_value;
    	let t4;
    	let div0;
    	let i0;
    	let t5;
    	let i0_class_value;
    	let t6;
    	let i1;
    	let t7;
    	let fieldset_class_value;
    	let t8;
    	let div2_resize_listener;
    	let mounted;
    	let dispose;
    	let if_block = !/*hideDetails*/ ctx[6] && create_if_block$7(ctx);

    	return {
    		c() {
    			div2 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("​");
    			t1 = space();
    			label_1 = element("label");
    			t2 = text(/*label*/ ctx[1]);
    			t3 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t4 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t5 = text("clear");
    			t6 = space();
    			i1 = element("i");
    			t7 = text(/*icon*/ ctx[3]);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr(legend, "style", /*legendStyle*/ ctx[16]);
    			attr(label_1, "style", label_1_style_value = `${/*labelTranslateStyle*/ ctx[17]} max-width:${/*boxWidth*/ ctx[12] - 16}px;`);
    			attr(label_1, "class", label_1_class_value = `${/*labelCls*/ ctx[15]}absolute left-0 mx-2 pointer-events-none truncate`);
    			add_render_callback(() => /*label_1_elementresize_handler*/ ctx[31].call(label_1));
    			attr(textarea, "type", /*type*/ ctx[13]);
    			textarea.readOnly = /*readonly*/ ctx[7];
    			textarea.value = /*value*/ ctx[0];
    			textarea.disabled = /*disabled*/ ctx[5];
    			set_style(textarea, "padding-bottom", "3px");

    			attr(textarea, "class", textarea_class_value = `appearance-none bg-transparent border-none w-full
         text-gray-800 px-2 focus:outline-none ${/*height*/ ctx[8]}`);

    			attr(i0, "class", i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "");

    			toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			attr(i1, "class", /*iconCls*/ ctx[11]);
    			toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			attr(div0, "class", "float-right flex items-center mr-2");
    			attr(div1, "class", "flex justify-between");
    			fieldset.disabled = /*disabled*/ ctx[5];
    			attr(fieldset, "class", fieldset_class_value = `${/*fieldsetCls*/ ctx[14]}relative rounded`);
    			toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			attr(div2, "class", "flex flex-col");
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[34].call(div2));
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, fieldset);
    			append(fieldset, legend);
    			append(legend, t0);
    			append(fieldset, t1);
    			append(fieldset, label_1);
    			append(label_1, t2);
    			label_1_resize_listener = add_resize_listener(label_1, /*label_1_elementresize_handler*/ ctx[31].bind(label_1));
    			append(fieldset, t3);
    			append(fieldset, div1);
    			append(div1, textarea);
    			append(div1, t4);
    			append(div1, div0);
    			append(div0, i0);
    			append(i0, t5);
    			append(div0, t6);
    			append(div0, i1);
    			append(i1, t7);
    			append(div2, t8);
    			if (if_block) if_block.m(div2, null);
    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[34].bind(div2));

    			if (!mounted) {
    				dispose = [
    					listen(textarea, "input", /*handleInput*/ ctx[20]),
    					listen(textarea, "focus", /*focus_handler_1*/ ctx[32]),
    					listen(textarea, "blur", /*blur_handler_1*/ ctx[33]),
    					listen(textarea, "focus", /*focus_handler*/ ctx[27]),
    					listen(textarea, "blur", /*blur_handler*/ ctx[28]),
    					listen(textarea, "keydown", /*keydown_handler*/ ctx[29]),
    					listen(textarea, "click", /*click_handler*/ ctx[30]),
    					listen(i0, "click", /*clear*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*legendStyle*/ 65536) {
    				attr(legend, "style", /*legendStyle*/ ctx[16]);
    			}

    			if (dirty[0] & /*label*/ 2) set_data(t2, /*label*/ ctx[1]);

    			if (dirty[0] & /*labelTranslateStyle, boxWidth*/ 135168 && label_1_style_value !== (label_1_style_value = `${/*labelTranslateStyle*/ ctx[17]} max-width:${/*boxWidth*/ ctx[12] - 16}px;`)) {
    				attr(label_1, "style", label_1_style_value);
    			}

    			if (dirty[0] & /*labelCls*/ 32768 && label_1_class_value !== (label_1_class_value = `${/*labelCls*/ ctx[15]}absolute left-0 mx-2 pointer-events-none truncate`)) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (dirty[0] & /*type*/ 8192) {
    				attr(textarea, "type", /*type*/ ctx[13]);
    			}

    			if (dirty[0] & /*readonly*/ 128) {
    				textarea.readOnly = /*readonly*/ ctx[7];
    			}

    			if (dirty[0] & /*value*/ 1) {
    				textarea.value = /*value*/ ctx[0];
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				textarea.disabled = /*disabled*/ ctx[5];
    			}

    			if (dirty[0] & /*height*/ 256 && textarea_class_value !== (textarea_class_value = `appearance-none bg-transparent border-none w-full
         text-gray-800 px-2 focus:outline-none ${/*height*/ ctx[8]}`)) {
    				attr(textarea, "class", textarea_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled*/ 48 && i0_class_value !== (i0_class_value = /*clearable*/ ctx[4] && !/*disabled*/ ctx[5]
    			? "material-icons md-18 mr-2 cursor-pointer"
    			: "")) {
    				attr(i0, "class", i0_class_value);
    			}

    			if (dirty[0] & /*clearable, disabled, clearable, disabled*/ 48) {
    				toggle_class(i0, "hidden", !/*clearable*/ ctx[4] || /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*icon*/ 8) set_data(t7, /*icon*/ ctx[3]);

    			if (dirty[0] & /*iconCls*/ 2048) {
    				attr(i1, "class", /*iconCls*/ ctx[11]);
    			}

    			if (dirty[0] & /*iconCls, disabled*/ 2080) {
    				toggle_class(i1, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (dirty[0] & /*disabled*/ 32) {
    				fieldset.disabled = /*disabled*/ ctx[5];
    			}

    			if (dirty[0] & /*fieldsetCls*/ 16384 && fieldset_class_value !== (fieldset_class_value = `${/*fieldsetCls*/ ctx[14]}relative rounded`)) {
    				attr(fieldset, "class", fieldset_class_value);
    			}

    			if (dirty[0] & /*fieldsetCls, disabled*/ 16416) {
    				toggle_class(fieldset, "opacity-50", /*disabled*/ ctx[5]);
    			}

    			if (!/*hideDetails*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			label_1_resize_listener();
    			if (if_block) if_block.d();
    			div2_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $y;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { height } = $$props;
    	let hasFocus = false;
    	let iconCls = "";
    	let boxWidth;
    	const y = tweened(0.75, { duration: 50 });
    	component_subscribe($$self, y, value => $$invalidate(26, $y = value));
    	let type = "text";

    	function handleInput(event) {
    		switch (type) {
    			case "text":
    				$$invalidate(0, value = event.target.value);
    				break;
    			case "number":
    				$$invalidate(0, value = +event.target.value);
    		}

    		dispatch("input", value);
    	}

    	let fieldsetCls = "border border-gray-500";
    	let labelCls = "text-gray-600 ";
    	let legendStyle = "";
    	let labelWidth;

    	onMount(() => {
    		$$invalidate(11, iconCls = icon
    		? "material-icons md-18 pointer-events-none"
    		: "hidden");
    	});

    	function setFocusState() {
    		$$invalidate(15, labelCls = `text-sm ${labelColor} `);
    		y.set(-1.35);
    		$$invalidate(14, fieldsetCls = `border-2 ${borderColor} `);
    	}

    	function setFieldsetCls(cls) {
    		$$invalidate(14, fieldsetCls = cls + " ");
    	}

    	function setLabelCls(cls) {
    		$$invalidate(15, labelCls = cls + " ");
    	}

    	function setLegendStyle(style) {
    		$$invalidate(16, legendStyle = style);
    	}

    	function clear() {
    		$$invalidate(0, value = "");
    		dispatch("clear");
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function label_1_elementresize_handler() {
    		labelWidth = this.clientWidth;
    		$$invalidate(10, labelWidth);
    	}

    	const focus_handler_1 = () => $$invalidate(9, hasFocus = true);
    	const blur_handler_1 = () => $$invalidate(9, hasFocus = false);

    	function div2_elementresize_handler() {
    		boxWidth = this.clientWidth;
    		$$invalidate(12, boxWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(22, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(23, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(24, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(2, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(25, helperTextColor = $$props.helperTextColor);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(4, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(6, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(7, readonly = $$props.readonly);
    		if ("height" in $$props) $$invalidate(8, height = $$props.height);
    	};

    	let labelTranslateStyle;
    	let helperTextCls;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*number*/ 4194304) {
    			 if (number) $$invalidate(13, type = "number");
    		}

    		if ($$self.$$.dirty[0] & /*$y*/ 67108864) {
    			 $$invalidate(17, labelTranslateStyle = `transform:translateY(${$y}rem);`);
    		}

    		if ($$self.$$.dirty[0] & /*helperTextColor*/ 33554432) {
    			 $$invalidate(18, helperTextCls = `text-sm px-2 font-light h-5 ${helperTextColor}`);
    		}

    		if ($$self.$$.dirty[0] & /*labelWidth, hasFocus, value*/ 1537) {
    			 if (labelWidth) {
    				if (!hasFocus && (value == null || value.toString().length === 0)) {
    					setLegendStyle("");
    				} else {
    					setLegendStyle(`width:${labelWidth + 4}px;margin-left:6px;`);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*hasFocus, disabled, value*/ 545) {
    			 if (hasFocus) {
    				setFocusState();
    			} else {
    				if (!disabled) {
    					setFieldsetCls("border border-gray-500 hover:border-gray-900");
    				} else {
    					setFieldsetCls("border");
    				}

    				if (value == null || value.toString().length === 0) {
    					setLabelCls("text-gray-600");
    					y.set(-0.15);
    				} else {
    					setLabelCls("text-sm text-gray-600");
    					y.set(-1.35);
    				}
    			}
    		}
    	};

    	return [
    		value,
    		label,
    		helperText,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		height,
    		hasFocus,
    		labelWidth,
    		iconCls,
    		boxWidth,
    		type,
    		fieldsetCls,
    		labelCls,
    		legendStyle,
    		labelTranslateStyle,
    		helperTextCls,
    		y,
    		handleInput,
    		clear,
    		number,
    		borderColor,
    		labelColor,
    		helperTextColor,
    		$y,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		click_handler,
    		label_1_elementresize_handler,
    		focus_handler_1,
    		blur_handler_1,
    		div2_elementresize_handler
    	];
    }

    class TextAreaOutlined extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$j,
    			create_fragment$l,
    			safe_not_equal,
    			{
    				label: 1,
    				value: 0,
    				number: 22,
    				borderColor: 23,
    				labelColor: 24,
    				helperText: 2,
    				helperTextColor: 25,
    				icon: 3,
    				clearable: 4,
    				disabled: 5,
    				hideDetails: 6,
    				readonly: 7,
    				height: 8
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\widgets\TextArea.svelte generated by Svelte v3.31.0 */

    function create_else_block$2(ctx) {
    	let textareaoutlined;
    	let updating_value;
    	let current;

    	function textareaoutlined_value_binding(value) {
    		/*textareaoutlined_value_binding*/ ctx[21].call(null, value);
    	}

    	let textareaoutlined_props = {
    		height: /*height*/ ctx[13],
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		textareaoutlined_props.value = /*value*/ ctx[0];
    	}

    	textareaoutlined = new TextAreaOutlined({ props: textareaoutlined_props });
    	binding_callbacks.push(() => bind(textareaoutlined, "value", textareaoutlined_value_binding));
    	textareaoutlined.$on("focus", /*focus_handler_1*/ ctx[22]);
    	textareaoutlined.$on("blur", /*blur_handler_1*/ ctx[23]);
    	textareaoutlined.$on("keydown", /*keydown_handler_1*/ ctx[24]);
    	textareaoutlined.$on("clear", /*clear_handler_1*/ ctx[25]);
    	textareaoutlined.$on("click", /*click_handler_1*/ ctx[26]);
    	textareaoutlined.$on("input", /*input_handler_1*/ ctx[27]);

    	return {
    		c() {
    			create_component(textareaoutlined.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(textareaoutlined, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const textareaoutlined_changes = {};
    			if (dirty & /*height*/ 8192) textareaoutlined_changes.height = /*height*/ ctx[13];
    			if (dirty & /*label*/ 2) textareaoutlined_changes.label = /*label*/ ctx[1];
    			if (dirty & /*borderColor*/ 8) textareaoutlined_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty & /*labelColor*/ 16) textareaoutlined_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty & /*helperText*/ 32) textareaoutlined_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty & /*icon*/ 256) textareaoutlined_changes.icon = /*icon*/ ctx[8];
    			if (dirty & /*number*/ 4) textareaoutlined_changes.number = /*number*/ ctx[2];
    			if (dirty & /*clearable*/ 512) textareaoutlined_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty & /*disabled*/ 1024) textareaoutlined_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty & /*hideDetails*/ 2048) textareaoutlined_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty & /*readonly*/ 4096) textareaoutlined_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty & /*helperTextColor*/ 64) textareaoutlined_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				textareaoutlined_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			textareaoutlined.$set(textareaoutlined_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(textareaoutlined.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(textareaoutlined.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(textareaoutlined, detaching);
    		}
    	};
    }

    // (21:0) {#if !outlined}
    function create_if_block$8(ctx) {
    	let textareastd;
    	let updating_value;
    	let current;

    	function textareastd_value_binding(value) {
    		/*textareastd_value_binding*/ ctx[14].call(null, value);
    	}

    	let textareastd_props = {
    		height: /*height*/ ctx[13],
    		label: /*label*/ ctx[1],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		icon: /*icon*/ ctx[8],
    		number: /*number*/ ctx[2],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		helperTextColor: /*helperTextColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		textareastd_props.value = /*value*/ ctx[0];
    	}

    	textareastd = new TextAreaStd({ props: textareastd_props });
    	binding_callbacks.push(() => bind(textareastd, "value", textareastd_value_binding));
    	textareastd.$on("focus", /*focus_handler*/ ctx[15]);
    	textareastd.$on("blur", /*blur_handler*/ ctx[16]);
    	textareastd.$on("keydown", /*keydown_handler*/ ctx[17]);
    	textareastd.$on("clear", /*clear_handler*/ ctx[18]);
    	textareastd.$on("click", /*click_handler*/ ctx[19]);
    	textareastd.$on("input", /*input_handler*/ ctx[20]);

    	return {
    		c() {
    			create_component(textareastd.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(textareastd, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const textareastd_changes = {};
    			if (dirty & /*height*/ 8192) textareastd_changes.height = /*height*/ ctx[13];
    			if (dirty & /*label*/ 2) textareastd_changes.label = /*label*/ ctx[1];
    			if (dirty & /*borderColor*/ 8) textareastd_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty & /*labelColor*/ 16) textareastd_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty & /*helperText*/ 32) textareastd_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty & /*icon*/ 256) textareastd_changes.icon = /*icon*/ ctx[8];
    			if (dirty & /*number*/ 4) textareastd_changes.number = /*number*/ ctx[2];
    			if (dirty & /*clearable*/ 512) textareastd_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty & /*disabled*/ 1024) textareastd_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty & /*hideDetails*/ 2048) textareastd_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty & /*readonly*/ 4096) textareastd_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty & /*helperTextColor*/ 64) textareastd_changes.helperTextColor = /*helperTextColor*/ ctx[6];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				textareastd_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			textareastd.$set(textareastd_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(textareastd.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(textareastd.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(textareastd, detaching);
    		}
    	};
    }

    function create_fragment$m(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$8, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*outlined*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { label = "" } = $$props;
    	let { value = "" } = $$props;
    	let { number = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { icon = "" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { readonly = false } = $$props;
    	let { height = "h-20" } = $$props;

    	function textareastd_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function clear_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function textareaoutlined_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble($$self, event);
    	}

    	function clear_handler_1(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("number" in $$props) $$invalidate(2, number = $$props.number);
    		if ("borderColor" in $$props) $$invalidate(3, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(4, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(5, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(6, helperTextColor = $$props.helperTextColor);
    		if ("outlined" in $$props) $$invalidate(7, outlined = $$props.outlined);
    		if ("icon" in $$props) $$invalidate(8, icon = $$props.icon);
    		if ("clearable" in $$props) $$invalidate(9, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(11, hideDetails = $$props.hideDetails);
    		if ("readonly" in $$props) $$invalidate(12, readonly = $$props.readonly);
    		if ("height" in $$props) $$invalidate(13, height = $$props.height);
    	};

    	return [
    		value,
    		label,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		height,
    		textareastd_value_binding,
    		focus_handler,
    		blur_handler,
    		keydown_handler,
    		clear_handler,
    		click_handler,
    		input_handler,
    		textareaoutlined_value_binding,
    		focus_handler_1,
    		blur_handler_1,
    		keydown_handler_1,
    		clear_handler_1,
    		click_handler_1,
    		input_handler_1
    	];
    }

    class TextArea extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$k, create_fragment$m, safe_not_equal, {
    			label: 1,
    			value: 0,
    			number: 2,
    			borderColor: 3,
    			labelColor: 4,
    			helperText: 5,
    			helperTextColor: 6,
    			outlined: 7,
    			icon: 8,
    			clearable: 9,
    			disabled: 10,
    			hideDetails: 11,
    			readonly: 12,
    			height: 13
    		});
    	}
    }

    /* src\components\TextAreaGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$7(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$n(ctx) {
    	let h2;
    	let t1;
    	let div75;
    	let t125;
    	let div95;
    	let h31;
    	let div76;
    	let t127;
    	let checkbox0;
    	let updating_checked;
    	let t128;
    	let div77;
    	let textarea;
    	let updating_value;
    	let t129;
    	let div94;
    	let div84;
    	let div78;
    	let checkbox1;
    	let updating_checked_1;
    	let t130;
    	let div79;
    	let checkbox2;
    	let updating_checked_2;
    	let t131;
    	let div80;
    	let checkbox3;
    	let updating_checked_3;
    	let t132;
    	let div81;
    	let checkbox4;
    	let updating_checked_4;
    	let t133;
    	let div82;
    	let checkbox5;
    	let updating_checked_5;
    	let t134;
    	let div83;
    	let checkbox6;
    	let updating_checked_6;
    	let t135;
    	let div93;
    	let div85;
    	let input0;
    	let updating_value_1;
    	let t136;
    	let div86;
    	let input1;
    	let updating_value_2;
    	let t137;
    	let div87;
    	let input2;
    	let updating_value_3;
    	let t138;
    	let div88;
    	let input3;
    	let updating_value_4;
    	let t139;
    	let div89;
    	let input4;
    	let updating_value_5;
    	let t140;
    	let div90;
    	let input5;
    	let updating_value_6;
    	let t141;
    	let div91;
    	let input6;
    	let updating_value_7;
    	let t142;
    	let div92;
    	let input7;
    	let updating_value_8;
    	let t143;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[15].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[14] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[14];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function textarea_value_binding(value) {
    		/*textarea_value_binding*/ ctx[16].call(null, value);
    	}

    	let textarea_props = {
    		label: /*label*/ ctx[0],
    		number: /*number*/ ctx[2],
    		borderColor: /*borderColor*/ ctx[3],
    		labelColor: /*labelColor*/ ctx[4],
    		helperText: /*helperText*/ ctx[5],
    		helperTextColor: /*helperTextColor*/ ctx[6],
    		outlined: /*outlined*/ ctx[7],
    		icon: /*icon*/ ctx[8],
    		clearable: /*clearable*/ ctx[9],
    		disabled: /*disabled*/ ctx[10],
    		hideDetails: /*hideDetails*/ ctx[11],
    		readonly: /*readonly*/ ctx[12],
    		height: /*height*/ ctx[13]
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		textarea_props.value = /*value*/ ctx[1];
    	}

    	textarea = new TextArea({ props: textarea_props });
    	binding_callbacks.push(() => bind(textarea, "value", textarea_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[17].call(null, value);
    	}

    	let checkbox1_props = { label: "number" };

    	if (/*number*/ ctx[2] !== void 0) {
    		checkbox1_props.checked = /*number*/ ctx[2];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox2_props = { label: "outlined" };

    	if (/*outlined*/ ctx[7] !== void 0) {
    		checkbox2_props.checked = /*outlined*/ ctx[7];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[19].call(null, value);
    	}

    	let checkbox3_props = { label: "clearable" };

    	if (/*clearable*/ ctx[9] !== void 0) {
    		checkbox3_props.checked = /*clearable*/ ctx[9];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled*/ ctx[10] !== void 0) {
    		checkbox4_props.checked = /*disabled*/ ctx[10];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox5_props = { label: "hideDetails" };

    	if (/*hideDetails*/ ctx[11] !== void 0) {
    		checkbox5_props.checked = /*hideDetails*/ ctx[11];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function checkbox6_checked_binding(value) {
    		/*checkbox6_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox6_props = { label: "readonly" };

    	if (/*readonly*/ ctx[12] !== void 0) {
    		checkbox6_props.checked = /*readonly*/ ctx[12];
    	}

    	checkbox6 = new Checkbox({ props: checkbox6_props });
    	binding_callbacks.push(() => bind(checkbox6, "checked", checkbox6_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[23].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input0_props.value = /*label*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[24].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "value"
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		input1_props.value = /*value*/ ctx[1];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[25].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "icon"
    	};

    	if (/*icon*/ ctx[8] !== void 0) {
    		input2_props.value = /*icon*/ ctx[8];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[26].call(null, value);
    	}

    	let input3_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "borderColor"
    	};

    	if (/*borderColor*/ ctx[3] !== void 0) {
    		input3_props.value = /*borderColor*/ ctx[3];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[27].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelColor"
    	};

    	if (/*labelColor*/ ctx[4] !== void 0) {
    		input4_props.value = /*labelColor*/ ctx[4];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[28].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperText"
    	};

    	if (/*helperText*/ ctx[5] !== void 0) {
    		input5_props.value = /*helperText*/ ctx[5];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[29].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperTextColor"
    	};

    	if (/*helperTextColor*/ ctx[6] !== void 0) {
    		input6_props.value = /*helperTextColor*/ ctx[6];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	function input7_value_binding(value) {
    		/*input7_value_binding*/ ctx[30].call(null, value);
    	}

    	let input7_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "height"
    	};

    	if (/*height*/ ctx[13] !== void 0) {
    		input7_props.value = /*height*/ ctx[13];
    	}

    	input7 = new Input({ props: input7_props });
    	binding_callbacks.push(() => bind(input7, "value", input7_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Text Area";
    			t1 = space();
    			div75 = element("div");

    			div75.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The value of the text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specifies whether it&#39;s a number type text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">borderColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The border color of the text area. Accepts valid Tailwindcss border color
      class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label text. Accepts valid Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-gray-700</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The helper text underneath the text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">helperTextColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the helper text underneath the text area. Accepts Tailwindcss
      text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Transformed this into a outlined text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">icon</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The icon to display on the right of the text area. <br/> Accepts a material
      icon from this list <a class="text-blue-600" href="https://material.io/resources/icons/?style=baseline">https://material.io/resources/icons/?style=baseline</a></div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">clearable</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Includes a clear button when &#39;clearable&#39; is true</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Disables text area.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">hideDetails</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Hides helper text.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">readonly</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Makes text area readonly</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">height</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Height of the text area. Accepts Tailwindcss height class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">h-20</div></div>`;

    			t125 = space();
    			div95 = element("div");
    			h31 = element("h3");
    			div76 = element("div");
    			div76.textContent = "Demo";
    			t127 = space();
    			create_component(checkbox0.$$.fragment);
    			t128 = space();
    			div77 = element("div");
    			create_component(textarea.$$.fragment);
    			t129 = space();
    			div94 = element("div");
    			div84 = element("div");
    			div78 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t130 = space();
    			div79 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t131 = space();
    			div80 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t132 = space();
    			div81 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t133 = space();
    			div82 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t134 = space();
    			div83 = element("div");
    			create_component(checkbox6.$$.fragment);
    			t135 = space();
    			div93 = element("div");
    			div85 = element("div");
    			create_component(input0.$$.fragment);
    			t136 = space();
    			div86 = element("div");
    			create_component(input1.$$.fragment);
    			t137 = space();
    			div87 = element("div");
    			create_component(input2.$$.fragment);
    			t138 = space();
    			div88 = element("div");
    			create_component(input3.$$.fragment);
    			t139 = space();
    			div89 = element("div");
    			create_component(input4.$$.fragment);
    			t140 = space();
    			div90 = element("div");
    			create_component(input5.$$.fragment);
    			t141 = space();
    			div91 = element("div");
    			create_component(input6.$$.fragment);
    			t142 = space();
    			div92 = element("div");
    			create_component(input7.$$.fragment);
    			t143 = space();
    			pre = element("pre");

    			pre.textContent = `${`<TextArea
  {label}
  bind:value
  {number}
  {borderColor}
  {labelColor}
  {helperText}
  {helperTextColor}
  {outlined}
  {icon}
  {clearable}
  {disabled}
  {hideDetails}
  {readonly}
  {height} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div75, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div76, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div77, "class", "my-2");
    			attr(div78, "class", "px-4");
    			attr(div79, "class", "px-4");
    			attr(div80, "class", "px-4");
    			attr(div81, "class", "px-4");
    			attr(div82, "class", "px-4");
    			attr(div83, "class", "px-4");
    			attr(div84, "class", "w-full flex flex-row flex-wrap");
    			attr(div85, "class", "px-4 pb-2");
    			attr(div86, "class", "px-4 pb-2");
    			attr(div87, "class", "px-4 pb-2");
    			attr(div88, "class", "px-4 pb-2");
    			attr(div89, "class", "px-4 pb-2");
    			attr(div90, "class", "px-4 pb-2");
    			attr(div91, "class", "px-4 pb-2");
    			attr(div92, "class", "px-4 pb-2");
    			attr(div93, "class", "w-full flex flex-row flex-wrap");
    			attr(div94, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div95, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[14]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div75, anchor);
    			insert(target, t125, anchor);
    			insert(target, div95, anchor);
    			append(div95, h31);
    			append(h31, div76);
    			append(h31, t127);
    			mount_component(checkbox0, h31, null);
    			append(div95, t128);
    			append(div95, div77);
    			mount_component(textarea, div77, null);
    			append(div95, t129);
    			append(div95, div94);
    			append(div94, div84);
    			append(div84, div78);
    			mount_component(checkbox1, div78, null);
    			append(div84, t130);
    			append(div84, div79);
    			mount_component(checkbox2, div79, null);
    			append(div84, t131);
    			append(div84, div80);
    			mount_component(checkbox3, div80, null);
    			append(div84, t132);
    			append(div84, div81);
    			mount_component(checkbox4, div81, null);
    			append(div84, t133);
    			append(div84, div82);
    			mount_component(checkbox5, div82, null);
    			append(div84, t134);
    			append(div84, div83);
    			mount_component(checkbox6, div83, null);
    			append(div94, t135);
    			append(div94, div93);
    			append(div93, div85);
    			mount_component(input0, div85, null);
    			append(div93, t136);
    			append(div93, div86);
    			mount_component(input1, div86, null);
    			append(div93, t137);
    			append(div93, div87);
    			mount_component(input2, div87, null);
    			append(div93, t138);
    			append(div93, div88);
    			mount_component(input3, div88, null);
    			append(div93, t139);
    			append(div93, div89);
    			mount_component(input4, div89, null);
    			append(div93, t140);
    			append(div93, div90);
    			mount_component(input5, div90, null);
    			append(div93, t141);
    			append(div93, div91);
    			mount_component(input6, div91, null);
    			append(div93, t142);
    			append(div93, div92);
    			mount_component(input7, div92, null);
    			insert(target, t143, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const checkbox0_changes = {};

    			if (dirty[1] & /*$$scope*/ 1) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty[0] & /*showCode*/ 16384) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[14];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const textarea_changes = {};
    			if (dirty[0] & /*label*/ 1) textarea_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*number*/ 4) textarea_changes.number = /*number*/ ctx[2];
    			if (dirty[0] & /*borderColor*/ 8) textarea_changes.borderColor = /*borderColor*/ ctx[3];
    			if (dirty[0] & /*labelColor*/ 16) textarea_changes.labelColor = /*labelColor*/ ctx[4];
    			if (dirty[0] & /*helperText*/ 32) textarea_changes.helperText = /*helperText*/ ctx[5];
    			if (dirty[0] & /*helperTextColor*/ 64) textarea_changes.helperTextColor = /*helperTextColor*/ ctx[6];
    			if (dirty[0] & /*outlined*/ 128) textarea_changes.outlined = /*outlined*/ ctx[7];
    			if (dirty[0] & /*icon*/ 256) textarea_changes.icon = /*icon*/ ctx[8];
    			if (dirty[0] & /*clearable*/ 512) textarea_changes.clearable = /*clearable*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) textarea_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*hideDetails*/ 2048) textarea_changes.hideDetails = /*hideDetails*/ ctx[11];
    			if (dirty[0] & /*readonly*/ 4096) textarea_changes.readonly = /*readonly*/ ctx[12];
    			if (dirty[0] & /*height*/ 8192) textarea_changes.height = /*height*/ ctx[13];

    			if (!updating_value && dirty[0] & /*value*/ 2) {
    				updating_value = true;
    				textarea_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			textarea.$set(textarea_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty[0] & /*number*/ 4) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*number*/ ctx[2];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty[0] & /*outlined*/ 128) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*outlined*/ ctx[7];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty[0] & /*clearable*/ 512) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*clearable*/ ctx[9];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty[0] & /*disabled*/ 1024) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled*/ ctx[10];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (!updating_checked_5 && dirty[0] & /*hideDetails*/ 2048) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*hideDetails*/ ctx[11];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const checkbox6_changes = {};

    			if (!updating_checked_6 && dirty[0] & /*readonly*/ 4096) {
    				updating_checked_6 = true;
    				checkbox6_changes.checked = /*readonly*/ ctx[12];
    				add_flush_callback(() => updating_checked_6 = false);
    			}

    			checkbox6.$set(checkbox6_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty[0] & /*label*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_2 && dirty[0] & /*value*/ 2) {
    				updating_value_2 = true;
    				input1_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_3 && dirty[0] & /*icon*/ 256) {
    				updating_value_3 = true;
    				input2_changes.value = /*icon*/ ctx[8];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_4 && dirty[0] & /*borderColor*/ 8) {
    				updating_value_4 = true;
    				input3_changes.value = /*borderColor*/ ctx[3];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_5 && dirty[0] & /*labelColor*/ 16) {
    				updating_value_5 = true;
    				input4_changes.value = /*labelColor*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_6 && dirty[0] & /*helperText*/ 32) {
    				updating_value_6 = true;
    				input5_changes.value = /*helperText*/ ctx[5];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_7 && dirty[0] & /*helperTextColor*/ 64) {
    				updating_value_7 = true;
    				input6_changes.value = /*helperTextColor*/ ctx[6];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input6.$set(input6_changes);
    			const input7_changes = {};

    			if (!updating_value_8 && dirty[0] & /*height*/ 8192) {
    				updating_value_8 = true;
    				input7_changes.value = /*height*/ ctx[13];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			input7.$set(input7_changes);

    			if (dirty[0] & /*showCode*/ 16384) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[14]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(textarea.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(checkbox6.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(checkbox6.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div75);
    			if (detaching) detach(t125);
    			if (detaching) detach(div95);
    			destroy_component(checkbox0);
    			destroy_component(textarea);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(checkbox6);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    			if (detaching) detach(t143);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let label = "Enter Your Name";
    	let value = "Peter Piper";
    	let number = false;
    	let borderColor = "border-gray-700";
    	let labelColor = "text-gray-700";
    	let helperText = "";
    	let helperTextColor = "text-red-600";
    	let outlined = false;
    	let icon = "spellcheck";
    	let clearable = false;
    	let disabled = false;
    	let hideDetails = false;
    	let readonly = false;
    	let height = "h-20";
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(14, showCode);
    	}

    	function textarea_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox1_checked_binding(value) {
    		number = value;
    		$$invalidate(2, number);
    	}

    	function checkbox2_checked_binding(value) {
    		outlined = value;
    		$$invalidate(7, outlined);
    	}

    	function checkbox3_checked_binding(value) {
    		clearable = value;
    		$$invalidate(9, clearable);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled = value;
    		$$invalidate(10, disabled);
    	}

    	function checkbox5_checked_binding(value) {
    		hideDetails = value;
    		$$invalidate(11, hideDetails);
    	}

    	function checkbox6_checked_binding(value) {
    		readonly = value;
    		$$invalidate(12, readonly);
    	}

    	function input0_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input1_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function input2_value_binding(value) {
    		icon = value;
    		$$invalidate(8, icon);
    	}

    	function input3_value_binding(value) {
    		borderColor = value;
    		$$invalidate(3, borderColor);
    	}

    	function input4_value_binding(value) {
    		labelColor = value;
    		$$invalidate(4, labelColor);
    	}

    	function input5_value_binding(value) {
    		helperText = value;
    		$$invalidate(5, helperText);
    	}

    	function input6_value_binding(value) {
    		helperTextColor = value;
    		$$invalidate(6, helperTextColor);
    	}

    	function input7_value_binding(value) {
    		height = value;
    		$$invalidate(13, height);
    	}

    	return [
    		label,
    		value,
    		number,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		icon,
    		clearable,
    		disabled,
    		hideDetails,
    		readonly,
    		height,
    		showCode,
    		checkbox0_checked_binding,
    		textarea_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		checkbox6_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding,
    		input7_value_binding
    	];
    }

    class TextAreaGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$l, create_fragment$n, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\widgets\Slider.svelte generated by Svelte v3.31.0 */

    function create_fragment$o(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let div0_class_value;
    	let div1_class_value;
    	let t0;
    	let div3;
    	let svg;
    	let circle;
    	let svg_class_value;
    	let t1;
    	let div2;
    	let div2_class_value;
    	let div4_resize_listener;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			t1 = space();
    			div2 = element("div");
    			attr(div0, "class", div0_class_value = "h-full w-full absolute mdc-slider__track " + /*trackFilledColor*/ ctx[2] + " svelte-o0j0nu");
    			set_style(div0, "transform", "scaleX(" + /*normalisedValue*/ ctx[3] + ")");
    			attr(div1, "class", div1_class_value = "absolute w-full mdc-slider__track-container " + /*trackEmptyColor*/ ctx[1] + " svelte-o0j0nu");
    			attr(circle, "cx", "10.5");
    			attr(circle, "cy", "10.5");
    			attr(circle, "r", "7.875");
    			attr(svg, "class", svg_class_value = "absolute left-0 top-0 fill-current " + /*thumbColor*/ ctx[0] + " mdc-slider__thumb" + " svelte-o0j0nu");
    			set_style(svg, "transform", "scale(" + /*thumbSize*/ ctx[6] + ")");
    			attr(svg, "width", "21");
    			attr(svg, "height", "21");
    			set_style(div2, "transform", "scale(1.125)");
    			attr(div2, "class", div2_class_value = "mdc-slider__focus-ring " + /*trackFilledColor*/ ctx[2] + " hover:opacity-25\r\n      opacity-0" + " svelte-o0j0nu");
    			attr(div3, "class", "mdc-slider__thumb-container svelte-o0j0nu");
    			set_style(div3, "transform", "translateX(" + /*width*/ ctx[4] * /*normalisedValue*/ ctx[3] + "px) translateX(-50%)");
    			attr(div4, "class", "relative w-full h-8 cursor-pointer block outline-none mdc-slider svelte-o0j0nu");
    			attr(div4, "tabindex", "0");
    			attr(div4, "role", "slider");
    			add_render_callback(() => /*div4_elementresize_handler*/ ctx[16].call(div4));
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div1);
    			append(div1, div0);
    			append(div4, t0);
    			append(div4, div3);
    			append(div3, svg);
    			append(svg, circle);
    			append(div3, t1);
    			append(div3, div2);
    			div4_resize_listener = add_resize_listener(div4, /*div4_elementresize_handler*/ ctx[16].bind(div4));
    			/*div4_binding*/ ctx[17](div4);

    			if (!mounted) {
    				dispose = [
    					listen(div4, "touchstart", stop_propagation(prevent_default(/*touchStart*/ ctx[7]))),
    					listen(div4, "touchmove", stop_propagation(prevent_default(/*touchMove*/ ctx[8]))),
    					listen(div4, "touchend", stop_propagation(prevent_default(/*dragEnd*/ ctx[10]))),
    					listen(div4, "pointerdown", stop_propagation(prevent_default(/*dragStart*/ ctx[9]))),
    					listen(div4, "pointerup", stop_propagation(prevent_default(/*dragEnd*/ ctx[10])))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*trackFilledColor*/ 4 && div0_class_value !== (div0_class_value = "h-full w-full absolute mdc-slider__track " + /*trackFilledColor*/ ctx[2] + " svelte-o0j0nu")) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (dirty & /*normalisedValue*/ 8) {
    				set_style(div0, "transform", "scaleX(" + /*normalisedValue*/ ctx[3] + ")");
    			}

    			if (dirty & /*trackEmptyColor*/ 2 && div1_class_value !== (div1_class_value = "absolute w-full mdc-slider__track-container " + /*trackEmptyColor*/ ctx[1] + " svelte-o0j0nu")) {
    				attr(div1, "class", div1_class_value);
    			}

    			if (dirty & /*thumbColor*/ 1 && svg_class_value !== (svg_class_value = "absolute left-0 top-0 fill-current " + /*thumbColor*/ ctx[0] + " mdc-slider__thumb" + " svelte-o0j0nu")) {
    				attr(svg, "class", svg_class_value);
    			}

    			if (dirty & /*thumbSize*/ 64) {
    				set_style(svg, "transform", "scale(" + /*thumbSize*/ ctx[6] + ")");
    			}

    			if (dirty & /*trackFilledColor*/ 4 && div2_class_value !== (div2_class_value = "mdc-slider__focus-ring " + /*trackFilledColor*/ ctx[2] + " hover:opacity-25\r\n      opacity-0" + " svelte-o0j0nu")) {
    				attr(div2, "class", div2_class_value);
    			}

    			if (dirty & /*width, normalisedValue*/ 24) {
    				set_style(div3, "transform", "translateX(" + /*width*/ ctx[4] * /*normalisedValue*/ ctx[3] + "px) translateX(-50%)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			div4_resize_listener();
    			/*div4_binding*/ ctx[17](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function roundToStep(v, step) {
    	if (step == null) {
    		return v;
    	}

    	return Math.round(v / step) * step;
    }

    function scaleValue(v, oldMin, oldMax, newMin, newMax) {
    	if (v < oldMin) {
    		return newMin;
    	}

    	if (v > oldMax) {
    		return newMax;
    	}

    	const oldRange = oldMax - oldMin;
    	const newRange = newMax - newMin;

    	if (oldRange <= 0 || newRange <= 0) {
    		throw new Error("max should be greater than min");
    	}

    	return +((v - oldMin) * newRange / oldRange + newMin).toPrecision(12);
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 1 } = $$props;
    	let { step = undefined } = $$props;
    	let { thumbColor = "text-blue-500" } = $$props;
    	let { trackEmptyColor = "bg-blue-200" } = $$props;
    	let { trackFilledColor = "bg-blue-500" } = $$props;
    	let normalisedValue;
    	let normalisedStep = undefined;
    	let width;
    	let container;
    	let oldVal;
    	let dragStartX;
    	let mousedown = false;

    	function touchStart(e) {
    		if (window.PointerEvent) {
    			return;
    		}

    		const rect = container.getBoundingClientRect();
    		const x = e.touches[0].clientX - rect.left;
    		const v = x / width;

    		if (v < 0) {
    			$$invalidate(3, normalisedValue = 0);
    		} else if (v > 1) {
    			$$invalidate(3, normalisedValue = 1);
    		} else {
    			$$invalidate(3, normalisedValue = roundToStep(v, normalisedStep));
    		}

    		dragStartX = e.touches[0].screenX;
    		oldVal = normalisedValue;
    		$$invalidate(11, value = scaleValue(normalisedValue, 0, 1, min, max));
    		$$invalidate(15, mousedown = true);
    	}

    	function touchMove(e) {
    		if (window.PointerEvent) {
    			return;
    		}

    		if (!mousedown) {
    			return;
    		}

    		const change = e.touches[0].screenX - dragStartX;
    		const v = change / width + oldVal;

    		if (v < 0) {
    			$$invalidate(3, normalisedValue = 0);
    		} else if (v > 1) {
    			$$invalidate(3, normalisedValue = 1);
    		} else {
    			$$invalidate(3, normalisedValue = roundToStep(v, normalisedStep));
    		}

    		$$invalidate(11, value = scaleValue(normalisedValue, 0, 1, min, max));
    	}

    	function dragStart(e) {
    		const rect = container.getBoundingClientRect();
    		const x = e.clientX - rect.left; //x position within the element.
    		const v = x / width;

    		if (v < 0) {
    			$$invalidate(3, normalisedValue = 0);
    		} else if (v > 1) {
    			$$invalidate(3, normalisedValue = 1);
    		} else {
    			$$invalidate(3, normalisedValue = roundToStep(v, normalisedStep));
    		}

    		dragStartX = e.screenX;
    		oldVal = normalisedValue;
    		$$invalidate(15, mousedown = true);
    		$$invalidate(11, value = scaleValue(normalisedValue, 0, 1, min, max));
    		document.body.addEventListener("pointermove", dragging);
    	}

    	function dragging(e) {
    		if (e.pressure === 0) {
    			document.body.removeEventListener("pointermove", dragging);
    			$$invalidate(15, mousedown = false);
    			return;
    		}

    		if (!mousedown) {
    			return;
    		}

    		const change = e.screenX - dragStartX;
    		const v = change / width + oldVal;

    		if (v < 0) {
    			$$invalidate(3, normalisedValue = 0);
    		} else if (v > 1) {
    			$$invalidate(3, normalisedValue = 1);
    		} else {
    			$$invalidate(3, normalisedValue = roundToStep(v, normalisedStep));
    		}

    		$$invalidate(11, value = scaleValue(normalisedValue, 0, 1, min, max));
    	}

    	function dragEnd(e) {
    		document.body.removeEventListener("pointermove", dragging);
    		$$invalidate(15, mousedown = false);
    	}

    	let thumbSize = 0.75;

    	function div4_elementresize_handler() {
    		width = this.clientWidth;
    		$$invalidate(4, width);
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(5, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(11, value = $$props.value);
    		if ("min" in $$props) $$invalidate(12, min = $$props.min);
    		if ("max" in $$props) $$invalidate(13, max = $$props.max);
    		if ("step" in $$props) $$invalidate(14, step = $$props.step);
    		if ("thumbColor" in $$props) $$invalidate(0, thumbColor = $$props.thumbColor);
    		if ("trackEmptyColor" in $$props) $$invalidate(1, trackEmptyColor = $$props.trackEmptyColor);
    		if ("trackFilledColor" in $$props) $$invalidate(2, trackFilledColor = $$props.trackFilledColor);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, min, max*/ 14336) {
    			 $$invalidate(3, normalisedValue = scaleValue(value, min, max, 0, 1));
    		}

    		if ($$self.$$.dirty & /*step, max, min*/ 28672) {
    			 if (step != null) {
    				normalisedStep = step / (max - min);
    			} else {
    				normalisedStep = undefined;
    			}
    		}

    		if ($$self.$$.dirty & /*mousedown*/ 32768) {
    			 $$invalidate(6, thumbSize = mousedown ? 1.4 : 0.75);
    		}
    	};

    	return [
    		thumbColor,
    		trackEmptyColor,
    		trackFilledColor,
    		normalisedValue,
    		width,
    		container,
    		thumbSize,
    		touchStart,
    		touchMove,
    		dragStart,
    		dragEnd,
    		value,
    		min,
    		max,
    		step,
    		mousedown,
    		div4_elementresize_handler,
    		div4_binding
    	];
    }

    class Slider extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$m, create_fragment$o, safe_not_equal, {
    			value: 11,
    			min: 12,
    			max: 13,
    			step: 14,
    			thumbColor: 0,
    			trackEmptyColor: 1,
    			trackFilledColor: 2
    		});
    	}
    }

    /* src\components\SliderGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$8(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$p(ctx) {
    	let h2;
    	let t1;
    	let div40;
    	let t67;
    	let div52;
    	let h31;
    	let div41;
    	let t69;
    	let checkbox;
    	let updating_checked;
    	let t70;
    	let div42;
    	let slider;
    	let updating_value;
    	let t71;
    	let div51;
    	let div50;
    	let div43;
    	let input0;
    	let updating_value_1;
    	let t72;
    	let div44;
    	let input1;
    	let updating_value_2;
    	let t73;
    	let div45;
    	let input2;
    	let updating_value_3;
    	let t74;
    	let div46;
    	let input3;
    	let updating_value_4;
    	let t75;
    	let div47;
    	let input4;
    	let updating_value_5;
    	let t76;
    	let div48;
    	let input5;
    	let updating_value_6;
    	let t77;
    	let div49;
    	let input6;
    	let updating_value_7;
    	let t78;
    	let pre;
    	let current;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[8].call(null, value);
    	}

    	let checkbox_props = {
    		$$slots: { default: [create_default_slot$8] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[7] !== void 0) {
    		checkbox_props.checked = /*showCode*/ ctx[7];
    	}

    	checkbox = new Checkbox({ props: checkbox_props });
    	binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));

    	function slider_value_binding(value) {
    		/*slider_value_binding*/ ctx[9].call(null, value);
    	}

    	let slider_props = {
    		min: /*min*/ ctx[1],
    		max: /*max*/ ctx[2],
    		step: /*step*/ ctx[3],
    		thumbColor: /*thumbColor*/ ctx[4],
    		trackEmptyColor: /*trackEmptyColor*/ ctx[5],
    		trackFilledColor: /*trackFilledColor*/ ctx[6]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		slider_props.value = /*value*/ ctx[0];
    	}

    	slider = new Slider({ props: slider_props });
    	binding_callbacks.push(() => bind(slider, "value", slider_value_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[10].call(null, value);
    	}

    	let input0_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "value"
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		input0_props.value = /*value*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[11].call(null, value);
    	}

    	let input1_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "max"
    	};

    	if (/*max*/ ctx[2] !== void 0) {
    		input1_props.value = /*max*/ ctx[2];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[12].call(null, value);
    	}

    	let input2_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "min"
    	};

    	if (/*min*/ ctx[1] !== void 0) {
    		input2_props.value = /*min*/ ctx[1];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[13].call(null, value);
    	}

    	let input3_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "step"
    	};

    	if (/*step*/ ctx[3] !== void 0) {
    		input3_props.value = /*step*/ ctx[3];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[14].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "thumbColor"
    	};

    	if (/*thumbColor*/ ctx[4] !== void 0) {
    		input4_props.value = /*thumbColor*/ ctx[4];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[15].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "trackEmptyColor"
    	};

    	if (/*trackEmptyColor*/ ctx[5] !== void 0) {
    		input5_props.value = /*trackEmptyColor*/ ctx[5];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[16].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "trackFilledColor"
    	};

    	if (/*trackFilledColor*/ ctx[6] !== void 0) {
    		input6_props.value = /*trackFilledColor*/ ctx[6];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Slider";
    			t1 = space();
    			div40 = element("div");

    			div40.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
  <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The value of the slider</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">max</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The max value of the slider</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">1</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">min</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The min value of the slider</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">0</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">step</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The size of each movement of the slider</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">thumbColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the slider thumb. Accepts a valid Tailwindcss text color
      class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-blue-500</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">trackEmptyColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the empty slider track. Accepts a valid Tailwindcss
      background color class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">bg-blue-200</div></div> 
  <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">trackFilledColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the filled slider track. Accepts a valid Tailwindcss
      background color class.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">bg-blue-500</div></div>`;

    			t67 = space();
    			div52 = element("div");
    			h31 = element("h3");
    			div41 = element("div");
    			div41.textContent = "Demo";
    			t69 = space();
    			create_component(checkbox.$$.fragment);
    			t70 = space();
    			div42 = element("div");
    			create_component(slider.$$.fragment);
    			t71 = space();
    			div51 = element("div");
    			div50 = element("div");
    			div43 = element("div");
    			create_component(input0.$$.fragment);
    			t72 = space();
    			div44 = element("div");
    			create_component(input1.$$.fragment);
    			t73 = space();
    			div45 = element("div");
    			create_component(input2.$$.fragment);
    			t74 = space();
    			div46 = element("div");
    			create_component(input3.$$.fragment);
    			t75 = space();
    			div47 = element("div");
    			create_component(input4.$$.fragment);
    			t76 = space();
    			div48 = element("div");
    			create_component(input5.$$.fragment);
    			t77 = space();
    			div49 = element("div");
    			create_component(input6.$$.fragment);
    			t78 = space();
    			pre = element("pre");

    			pre.textContent = `${`<Slider
  bind:value
  {min}
  {max}
  {step}
  {thumbColor}
  {trackEmptyColor}
  {trackFilledColor} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div40, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div41, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div42, "class", "my-2");
    			attr(div43, "class", "px-4 pb-2");
    			attr(div44, "class", "px-4 pb-2");
    			attr(div45, "class", "px-4 pb-2");
    			attr(div46, "class", "px-4 pb-2");
    			attr(div47, "class", "px-4 pb-2");
    			attr(div48, "class", "px-4 pb-2");
    			attr(div49, "class", "px-4 pb-2");
    			attr(div50, "class", "w-full flex flex-row flex-wrap");
    			attr(div51, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div52, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[7]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div40, anchor);
    			insert(target, t67, anchor);
    			insert(target, div52, anchor);
    			append(div52, h31);
    			append(h31, div41);
    			append(h31, t69);
    			mount_component(checkbox, h31, null);
    			append(div52, t70);
    			append(div52, div42);
    			mount_component(slider, div42, null);
    			append(div52, t71);
    			append(div52, div51);
    			append(div51, div50);
    			append(div50, div43);
    			mount_component(input0, div43, null);
    			append(div50, t72);
    			append(div50, div44);
    			mount_component(input1, div44, null);
    			append(div50, t73);
    			append(div50, div45);
    			mount_component(input2, div45, null);
    			append(div50, t74);
    			append(div50, div46);
    			mount_component(input3, div46, null);
    			append(div50, t75);
    			append(div50, div47);
    			mount_component(input4, div47, null);
    			append(div50, t76);
    			append(div50, div48);
    			mount_component(input5, div48, null);
    			append(div50, t77);
    			append(div50, div49);
    			mount_component(input6, div49, null);
    			insert(target, t78, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox_changes = {};

    			if (dirty & /*$$scope*/ 131072) {
    				checkbox_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 128) {
    				updating_checked = true;
    				checkbox_changes.checked = /*showCode*/ ctx[7];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const slider_changes = {};
    			if (dirty & /*min*/ 2) slider_changes.min = /*min*/ ctx[1];
    			if (dirty & /*max*/ 4) slider_changes.max = /*max*/ ctx[2];
    			if (dirty & /*step*/ 8) slider_changes.step = /*step*/ ctx[3];
    			if (dirty & /*thumbColor*/ 16) slider_changes.thumbColor = /*thumbColor*/ ctx[4];
    			if (dirty & /*trackEmptyColor*/ 32) slider_changes.trackEmptyColor = /*trackEmptyColor*/ ctx[5];
    			if (dirty & /*trackFilledColor*/ 64) slider_changes.trackFilledColor = /*trackFilledColor*/ ctx[6];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				slider_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			slider.$set(slider_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty & /*value*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_2 && dirty & /*max*/ 4) {
    				updating_value_2 = true;
    				input1_changes.value = /*max*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_3 && dirty & /*min*/ 2) {
    				updating_value_3 = true;
    				input2_changes.value = /*min*/ ctx[1];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_4 && dirty & /*step*/ 8) {
    				updating_value_4 = true;
    				input3_changes.value = /*step*/ ctx[3];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_5 && dirty & /*thumbColor*/ 16) {
    				updating_value_5 = true;
    				input4_changes.value = /*thumbColor*/ ctx[4];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_6 && dirty & /*trackEmptyColor*/ 32) {
    				updating_value_6 = true;
    				input5_changes.value = /*trackEmptyColor*/ ctx[5];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_7 && dirty & /*trackFilledColor*/ 64) {
    				updating_value_7 = true;
    				input6_changes.value = /*trackFilledColor*/ ctx[6];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input6.$set(input6_changes);

    			if (dirty & /*showCode*/ 128) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[7]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(slider.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(slider.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div40);
    			if (detaching) detach(t67);
    			if (detaching) detach(div52);
    			destroy_component(checkbox);
    			destroy_component(slider);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			if (detaching) detach(t78);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let value = 0.5;
    	let min = 0;
    	let max = 1;
    	let step = 0.02;
    	let thumbColor = "text-red-500";
    	let trackEmptyColor = "bg-blue-200";
    	let trackFilledColor = "bg-blue-600";
    	let showCode = false;

    	function checkbox_checked_binding(value) {
    		showCode = value;
    		$$invalidate(7, showCode);
    	}

    	function slider_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function input0_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function input1_value_binding(value) {
    		max = value;
    		$$invalidate(2, max);
    	}

    	function input2_value_binding(value) {
    		min = value;
    		$$invalidate(1, min);
    	}

    	function input3_value_binding(value) {
    		step = value;
    		$$invalidate(3, step);
    	}

    	function input4_value_binding(value) {
    		thumbColor = value;
    		$$invalidate(4, thumbColor);
    	}

    	function input5_value_binding(value) {
    		trackEmptyColor = value;
    		$$invalidate(5, trackEmptyColor);
    	}

    	function input6_value_binding(value) {
    		trackFilledColor = value;
    		$$invalidate(6, trackFilledColor);
    	}

    	return [
    		value,
    		min,
    		max,
    		step,
    		thumbColor,
    		trackEmptyColor,
    		trackFilledColor,
    		showCode,
    		checkbox_checked_binding,
    		slider_value_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding
    	];
    }

    class SliderGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$n, create_fragment$p, safe_not_equal, {});
    	}
    }

    /* src\widgets\Autocomplete.svelte generated by Svelte v3.31.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    // (202:4) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*noResultsText*/ ctx[2]);
    			attr(div, "class", "m-3");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);

    			if (!mounted) {
    				dispose = listen(div, "mousedown", stop_propagation(prevent_default(/*mousedown_handler*/ ctx[31])));
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*noResultsText*/ 4) set_data(t, /*noResultsText*/ ctx[2]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (191:4) {#if filteredListItems.length > 0}
    function create_if_block$9(ctx) {
    	let ul;
    	let each_value = /*filteredListItems*/ ctx[13];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ul, "class", "my-2");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*highlightIndex, isItemSelected, filteredListItems, setVal, labelFieldName*/ 1648640) {
    				each_value = /*filteredListItems*/ ctx[13];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (193:8) {#each filteredListItems as item, i}
    function create_each_block(ctx) {
    	let li;

    	let t0_value = (/*labelFieldName*/ ctx[11]
    	? /*item*/ ctx[37][/*labelFieldName*/ ctx[11]]
    	: /*item*/ ctx[37]) + "";

    	let t0;
    	let t1;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();

    			attr(li, "class", li_class_value = "" + (null_to_empty(`p-3 cursor-pointer hover:bg-gray-200 ${/*highlightIndex*/ ctx[16] === /*i*/ ctx[39]
			? "bg-gray-300"
			: ""}`) + " svelte-192al2g"));

    			toggle_class(li, "active", /*isItemSelected*/ ctx[19](/*item*/ ctx[37]));
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);

    			if (!mounted) {
    				dispose = listen(li, "click", stop_propagation(prevent_default(function () {
    					if (is_function(/*setVal*/ ctx[20](/*item*/ ctx[37]))) /*setVal*/ ctx[20](/*item*/ ctx[37]).apply(this, arguments);
    				})));

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*labelFieldName, filteredListItems*/ 10240 && t0_value !== (t0_value = (/*labelFieldName*/ ctx[11]
    			? /*item*/ ctx[37][/*labelFieldName*/ ctx[11]]
    			: /*item*/ ctx[37]) + "")) set_data(t0, t0_value);

    			if (dirty[0] & /*highlightIndex*/ 65536 && li_class_value !== (li_class_value = "" + (null_to_empty(`p-3 cursor-pointer hover:bg-gray-200 ${/*highlightIndex*/ ctx[16] === /*i*/ ctx[39]
			? "bg-gray-300"
			: ""}`) + " svelte-192al2g"))) {
    				attr(li, "class", li_class_value);
    			}

    			if (dirty[0] & /*highlightIndex, isItemSelected, filteredListItems*/ 598016) {
    				toggle_class(li, "active", /*isItemSelected*/ ctx[19](/*item*/ ctx[37]));
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$q(ctx) {
    	let div1;
    	let input;
    	let updating_value;
    	let t;
    	let div0;
    	let div0_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[32].call(null, value);
    	}

    	let input_props = {
    		outlined: /*outlined*/ ctx[10],
    		icon: /*icon*/ ctx[15],
    		clearable: /*clearable*/ ctx[3],
    		disabled: /*disabled*/ ctx[4],
    		hideDetails: /*hideDetails*/ ctx[5],
    		label: /*label*/ ctx[0],
    		labelColor: /*labelColor*/ ctx[7],
    		borderColor: /*borderColor*/ ctx[6],
    		helperText: /*helperText*/ ctx[8],
    		helperTextColor: /*helperTextColor*/ ctx[9]
    	};

    	if (/*text*/ ctx[17] !== void 0) {
    		input_props.value = /*text*/ ctx[17];
    	}

    	input = new Input({ props: input_props });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));
    	input.$on("input", /*onInput*/ ctx[18]);
    	input.$on("keydown", /*handleKeydown*/ ctx[21]);
    	input.$on("blur", /*onBlur*/ ctx[23]);
    	input.$on("focus", /*onFocus*/ ctx[22]);
    	input.$on("clear", /*onClear*/ ctx[24]);

    	function select_block_type(ctx, dirty) {
    		if (/*filteredListItems*/ ctx[13].length > 0) return create_if_block$9;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div1 = element("div");
    			create_component(input.$$.fragment);
    			t = space();
    			div0 = element("div");
    			if_block.c();
    			set_style(div0, "max-height", "320px");

    			attr(div0, "class", div0_class_value = "" + (null_to_empty(`absolute bg-white rounded-sm w-full elevation-4 z-30 overflow-y-auto ${/*hideDetails*/ ctx[5] ? "mt-0" : "-mt-5"} ${/*listVisible*/ ctx[12] && /*text*/ ctx[17].toString().length >= /*minCharactersToSearch*/ ctx[1]
			? ""
			: "hidden"}`) + " svelte-192al2g"));

    			attr(div1, "class", "relative");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			mount_component(input, div1, null);
    			append(div1, t);
    			append(div1, div0);
    			if_block.m(div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div0, "mouseenter", /*mouseenter_handler*/ ctx[33]),
    					listen(div0, "mouseleave", /*mouseleave_handler*/ ctx[34])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			const input_changes = {};
    			if (dirty[0] & /*outlined*/ 1024) input_changes.outlined = /*outlined*/ ctx[10];
    			if (dirty[0] & /*icon*/ 32768) input_changes.icon = /*icon*/ ctx[15];
    			if (dirty[0] & /*clearable*/ 8) input_changes.clearable = /*clearable*/ ctx[3];
    			if (dirty[0] & /*disabled*/ 16) input_changes.disabled = /*disabled*/ ctx[4];
    			if (dirty[0] & /*hideDetails*/ 32) input_changes.hideDetails = /*hideDetails*/ ctx[5];
    			if (dirty[0] & /*label*/ 1) input_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*labelColor*/ 128) input_changes.labelColor = /*labelColor*/ ctx[7];
    			if (dirty[0] & /*borderColor*/ 64) input_changes.borderColor = /*borderColor*/ ctx[6];
    			if (dirty[0] & /*helperText*/ 256) input_changes.helperText = /*helperText*/ ctx[8];
    			if (dirty[0] & /*helperTextColor*/ 512) input_changes.helperTextColor = /*helperTextColor*/ ctx[9];

    			if (!updating_value && dirty[0] & /*text*/ 131072) {
    				updating_value = true;
    				input_changes.value = /*text*/ ctx[17];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (!current || dirty[0] & /*hideDetails, listVisible, text, minCharactersToSearch*/ 135202 && div0_class_value !== (div0_class_value = "" + (null_to_empty(`absolute bg-white rounded-sm w-full elevation-4 z-30 overflow-y-auto ${/*hideDetails*/ ctx[5] ? "mt-0" : "-mt-5"} ${/*listVisible*/ ctx[12] && /*text*/ ctx[17].toString().length >= /*minCharactersToSearch*/ ctx[1]
			? ""
			: "hidden"}`) + " svelte-192al2g"))) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(input);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function up(listSize, currentIndex) {
    	if (currentIndex === 0 || currentIndex === -1) {
    		return listSize - 1;
    	}

    	return currentIndex - 1;
    }

    function down(listSize, currentIndex) {
    	if (currentIndex === listSize - 1) {
    		return 0;
    	}

    	return currentIndex + 1;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { items = [] } = $$props;
    	let { value = "" } = $$props;
    	let { minCharactersToSearch = 0 } = $$props;
    	let { noResultsText = "No results found" } = $$props;
    	let { maxLen = undefined } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { labelFieldName = undefined } = $$props;
    	let { keywordsFieldName = labelFieldName } = $$props;
    	let { caseSensitive = false } = $$props;

    	let { keywordsFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return keywordsFieldName
    		? item[keywordsFieldName].toString()
    		: item.toString();
    	} } = $$props;

    	let filteredListItems = [];
    	let listVisible = false;
    	let itemClicked = false;
    	let icon;
    	let highlightIndex = -1;
    	let text = "";

    	function onInput(e) {
    		const t = e.detail;

    		if (t.length >= minCharactersToSearch) {
    			let tempFiltered;

    			if (caseSensitive) {
    				tempFiltered = items.filter(it => keywordsFunction(it).includes(t));
    			} else {
    				tempFiltered = items.filter(it => keywordsFunction(it).toLowerCase().includes(t.toLowerCase()));
    			}

    			$$invalidate(13, filteredListItems = maxLen ? tempFiltered.slice(0, maxLen) : tempFiltered);
    		}
    	}

    	function setText(v) {
    		$$invalidate(17, text = v);
    	}

    	function isItemSelected(item) {
    		if (value === item) return true;
    		return false;
    	}

    	function setVal(item) {
    		$$invalidate(14, itemClicked = false);
    		$$invalidate(12, listVisible = false);
    		$$invalidate(16, highlightIndex = -1);

    		if (value !== item) {
    			$$invalidate(25, value = item);
    			dispatch("change", item);
    		} else {
    			onBlur();
    		}
    	}

    	function handleKeydown(e) {
    		$$invalidate(12, listVisible = e.key !== "Escape");

    		if (e.key === "ArrowDown") {
    			$$invalidate(16, highlightIndex = down(filteredListItems.length, highlightIndex));
    		} else if (e.key === "ArrowUp") {
    			$$invalidate(16, highlightIndex = up(filteredListItems.length, highlightIndex));
    		} else if (e.key === "Escape") {
    			$$invalidate(16, highlightIndex = -1);
    		} else if (e.key === "Enter") {
    			if (highlightIndex >= 0 && highlightIndex < filteredListItems.length) {
    				setVal(filteredListItems[highlightIndex]);
    			}
    		}
    	}

    	function onFocus(e) {
    		$$invalidate(13, filteredListItems = maxLen ? items.slice(0, maxLen) : items);
    		$$invalidate(12, listVisible = true);

    		if (text) {
    			e.target.selectionStart = 0;
    			e.target.selectionEnd = text.toString().length;
    		}
    	}

    	function onBlur() {
    		if (itemClicked) return;
    		$$invalidate(12, listVisible = false);

    		if (value == null) {
    			$$invalidate(17, text = "");
    		} else if (typeof value === "string") {
    			$$invalidate(17, text = value || "");
    		} else if (typeof value === "number") {
    			$$invalidate(17, text = value == null ? "" : value);
    		} else if (typeof value === "boolean") {
    			$$invalidate(17, text = value == null ? "" : value);
    		} else {
    			$$invalidate(17, text = value[labelFieldName] || "");
    		}

    		$$invalidate(16, highlightIndex = -1);
    	}

    	function onClear() {
    		$$invalidate(25, value = null);
    		$$invalidate(17, text = "");
    		dispatch("change", null);
    	}

    	function mousedown_handler(event) {
    		bubble($$self, event);
    	}

    	function input_value_binding(value) {
    		text = value;
    		$$invalidate(17, text);
    	}

    	const mouseenter_handler = () => $$invalidate(14, itemClicked = true);
    	const mouseleave_handler = () => $$invalidate(14, itemClicked = false);

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("items" in $$props) $$invalidate(26, items = $$props.items);
    		if ("value" in $$props) $$invalidate(25, value = $$props.value);
    		if ("minCharactersToSearch" in $$props) $$invalidate(1, minCharactersToSearch = $$props.minCharactersToSearch);
    		if ("noResultsText" in $$props) $$invalidate(2, noResultsText = $$props.noResultsText);
    		if ("maxLen" in $$props) $$invalidate(27, maxLen = $$props.maxLen);
    		if ("clearable" in $$props) $$invalidate(3, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(5, hideDetails = $$props.hideDetails);
    		if ("borderColor" in $$props) $$invalidate(6, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(7, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(8, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(9, helperTextColor = $$props.helperTextColor);
    		if ("outlined" in $$props) $$invalidate(10, outlined = $$props.outlined);
    		if ("labelFieldName" in $$props) $$invalidate(11, labelFieldName = $$props.labelFieldName);
    		if ("keywordsFieldName" in $$props) $$invalidate(28, keywordsFieldName = $$props.keywordsFieldName);
    		if ("caseSensitive" in $$props) $$invalidate(29, caseSensitive = $$props.caseSensitive);
    		if ("keywordsFunction" in $$props) $$invalidate(30, keywordsFunction = $$props.keywordsFunction);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*listVisible*/ 4096) {
    			 $$invalidate(15, icon = listVisible ? "arrow_drop_up" : "arrow_drop_down");
    		}

    		if ($$self.$$.dirty[0] & /*value, items, keywordsFunction*/ 1174405120) {
    			 if (value) {
    				if (!items.some(it => keywordsFunction(it) === keywordsFunction(value))) {
    					$$invalidate(25, value = null);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value, labelFieldName*/ 33556480) {
    			 if (value == null) {
    				setText("");
    			} else if (typeof value === "string") {
    				setText(value || "");
    			} else if (typeof value === "number") {
    				setText(value == null ? "" : value);
    			} else if (typeof value === "boolean") {
    				setText(value == null ? "" : value);
    			} else {
    				setText(value[labelFieldName] == null
    				? ""
    				: value[labelFieldName]);
    			}
    		}
    	};

    	return [
    		label,
    		minCharactersToSearch,
    		noResultsText,
    		clearable,
    		disabled,
    		hideDetails,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		labelFieldName,
    		listVisible,
    		filteredListItems,
    		itemClicked,
    		icon,
    		highlightIndex,
    		text,
    		onInput,
    		isItemSelected,
    		setVal,
    		handleKeydown,
    		onFocus,
    		onBlur,
    		onClear,
    		value,
    		items,
    		maxLen,
    		keywordsFieldName,
    		caseSensitive,
    		keywordsFunction,
    		mousedown_handler,
    		input_value_binding,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Autocomplete extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$o,
    			create_fragment$q,
    			safe_not_equal,
    			{
    				label: 0,
    				items: 26,
    				value: 25,
    				minCharactersToSearch: 1,
    				noResultsText: 2,
    				maxLen: 27,
    				clearable: 3,
    				disabled: 4,
    				hideDetails: 5,
    				borderColor: 6,
    				labelColor: 7,
    				helperText: 8,
    				helperTextColor: 9,
    				outlined: 10,
    				labelFieldName: 11,
    				keywordsFieldName: 28,
    				caseSensitive: 29,
    				keywordsFunction: 30
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\components\AutocompleteGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$9(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$r(ctx) {
    	let h2;
    	let t1;
    	let div95;
    	let h30;
    	let t3;
    	let div4;
    	let t11;
    	let div9;
    	let t19;
    	let div14;
    	let t27;
    	let div19;
    	let t35;
    	let div24;
    	let t43;
    	let div29;
    	let t51;
    	let div34;
    	let t59;
    	let div39;
    	let t67;
    	let div44;
    	let t75;
    	let div49;
    	let t83;
    	let div54;
    	let t91;
    	let div59;
    	let t99;
    	let div64;
    	let t107;
    	let div69;
    	let t115;
    	let div74;
    	let t123;
    	let div79;
    	let t131;
    	let div84;
    	let t139;
    	let div89;
    	let t147;
    	let div94;
    	let div90;
    	let t149;
    	let div91;
    	let t151;
    	let div92;
    	let t153;
    	let div93;
    	let pre0;
    	let t155;
    	let div117;
    	let h31;
    	let div96;
    	let t157;
    	let checkbox0;
    	let updating_checked;
    	let t158;
    	let div97;
    	let autocomplete0;
    	let updating_value;
    	let t159;
    	let div116;
    	let div103;
    	let div98;
    	let checkbox1;
    	let updating_checked_1;
    	let t160;
    	let div99;
    	let checkbox2;
    	let updating_checked_2;
    	let t161;
    	let div100;
    	let checkbox3;
    	let updating_checked_3;
    	let t162;
    	let div101;
    	let checkbox4;
    	let updating_checked_4;
    	let t163;
    	let div102;
    	let checkbox5;
    	let updating_checked_5;
    	let t164;
    	let div115;
    	let div104;
    	let input0;
    	let updating_value_1;
    	let t165;
    	let div105;
    	let input1;
    	let t166;
    	let div106;
    	let input2;
    	let updating_value_2;
    	let t167;
    	let div107;
    	let input3;
    	let updating_value_3;
    	let t168;
    	let div108;
    	let input4;
    	let updating_value_4;
    	let t169;
    	let div109;
    	let autocomplete1;
    	let updating_value_5;
    	let t170;
    	let div110;
    	let autocomplete2;
    	let updating_value_6;
    	let t171;
    	let div111;
    	let input5;
    	let updating_value_7;
    	let t172;
    	let div112;
    	let input6;
    	let updating_value_8;
    	let t173;
    	let div113;
    	let input7;
    	let updating_value_9;
    	let t174;
    	let div114;
    	let input8;
    	let updating_value_10;
    	let t175;
    	let pre1;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$9] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[16] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[16];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function autocomplete0_value_binding(value) {
    		/*autocomplete0_value_binding*/ ctx[19].call(null, value);
    	}

    	let autocomplete0_props = {
    		label: /*label*/ ctx[0],
    		items: /*items*/ ctx[17],
    		caseSensitive: /*caseSensitive*/ ctx[4],
    		minCharactersToSearch: /*minCharactersToSearch*/ ctx[2],
    		noResultsText: /*noResultsText*/ ctx[3],
    		maxLen: /*maxLen*/ ctx[5],
    		borderColor: /*borderColor*/ ctx[9],
    		labelColor: /*labelColor*/ ctx[10],
    		helperText: /*helperText*/ ctx[11],
    		helperTextColor: /*helperTextColor*/ ctx[12],
    		outlined: /*outlined*/ ctx[13],
    		clearable: /*clearable*/ ctx[6],
    		disabled: /*disabled*/ ctx[7],
    		hideDetails: /*hideDetails*/ ctx[8],
    		labelFieldName: /*labelFieldName*/ ctx[14],
    		keywordsFieldName: /*keywordsFieldName*/ ctx[15],
    		keywordsFunction
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		autocomplete0_props.value = /*value*/ ctx[1];
    	}

    	autocomplete0 = new Autocomplete({ props: autocomplete0_props });
    	binding_callbacks.push(() => bind(autocomplete0, "value", autocomplete0_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox1_props = { label: "caseSensitive" };

    	if (/*caseSensitive*/ ctx[4] !== void 0) {
    		checkbox1_props.checked = /*caseSensitive*/ ctx[4];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox2_props = { label: "outlined" };

    	if (/*outlined*/ ctx[13] !== void 0) {
    		checkbox2_props.checked = /*outlined*/ ctx[13];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox3_props = { label: "clearable" };

    	if (/*clearable*/ ctx[6] !== void 0) {
    		checkbox3_props.checked = /*clearable*/ ctx[6];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[23].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled*/ ctx[7] !== void 0) {
    		checkbox4_props.checked = /*disabled*/ ctx[7];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[24].call(null, value);
    	}

    	let checkbox5_props = { label: "hideDetails" };

    	if (/*hideDetails*/ ctx[8] !== void 0) {
    		checkbox5_props.checked = /*hideDetails*/ ctx[8];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[25].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input0_props.value = /*label*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	input1 = new Input({
    			props: {
    				readonly: true,
    				hideDetails: true,
    				outlined: true,
    				label: "value[keywordsFieldName]",
    				value: /*value*/ ctx[1][/*keywordsFieldName*/ ctx[15]]
    			}
    		});

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[26].call(null, value);
    	}

    	let input2_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "minCharactersToSearch"
    	};

    	if (/*minCharactersToSearch*/ ctx[2] !== void 0) {
    		input2_props.value = /*minCharactersToSearch*/ ctx[2];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[27].call(null, value);
    	}

    	let input3_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "maxLen"
    	};

    	if (/*maxLen*/ ctx[5] !== void 0) {
    		input3_props.value = /*maxLen*/ ctx[5];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[28].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "noResultsText"
    	};

    	if (/*noResultsText*/ ctx[3] !== void 0) {
    		input4_props.value = /*noResultsText*/ ctx[3];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function autocomplete1_value_binding(value) {
    		/*autocomplete1_value_binding*/ ctx[29].call(null, value);
    	}

    	let autocomplete1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelFieldName",
    		items: ["countryCode", "countryName"]
    	};

    	if (/*labelFieldName*/ ctx[14] !== void 0) {
    		autocomplete1_props.value = /*labelFieldName*/ ctx[14];
    	}

    	autocomplete1 = new Autocomplete({ props: autocomplete1_props });
    	binding_callbacks.push(() => bind(autocomplete1, "value", autocomplete1_value_binding));

    	function autocomplete2_value_binding(value) {
    		/*autocomplete2_value_binding*/ ctx[30].call(null, value);
    	}

    	let autocomplete2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "keywordsFieldName",
    		items: ["countryCode", "countryName"]
    	};

    	if (/*keywordsFieldName*/ ctx[15] !== void 0) {
    		autocomplete2_props.value = /*keywordsFieldName*/ ctx[15];
    	}

    	autocomplete2 = new Autocomplete({ props: autocomplete2_props });
    	binding_callbacks.push(() => bind(autocomplete2, "value", autocomplete2_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[31].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "borderColor"
    	};

    	if (/*borderColor*/ ctx[9] !== void 0) {
    		input5_props.value = /*borderColor*/ ctx[9];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[32].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelColor"
    	};

    	if (/*labelColor*/ ctx[10] !== void 0) {
    		input6_props.value = /*labelColor*/ ctx[10];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	function input7_value_binding(value) {
    		/*input7_value_binding*/ ctx[33].call(null, value);
    	}

    	let input7_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperText"
    	};

    	if (/*helperText*/ ctx[11] !== void 0) {
    		input7_props.value = /*helperText*/ ctx[11];
    	}

    	input7 = new Input({ props: input7_props });
    	binding_callbacks.push(() => bind(input7, "value", input7_value_binding));

    	function input8_value_binding(value) {
    		/*input8_value_binding*/ ctx[34].call(null, value);
    	}

    	let input8_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperTextColor"
    	};

    	if (/*helperTextColor*/ ctx[12] !== void 0) {
    		input8_props.value = /*helperTextColor*/ ctx[12];
    	}

    	input8 = new Input({ props: input8_props });
    	binding_callbacks.push(() => bind(input8, "value", input8_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Auto Complete";
    			t1 = space();
    			div95 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Properties";
    			t3 = space();
    			div4 = element("div");

    			div4.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div>`;

    			t11 = space();
    			div9 = element("div");

    			div9.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the auto complete input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t19 = space();
    			div14 = element("div");

    			div14.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">items</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The list of items to choose from. Accepts an array of strings or objects.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">array</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">[]</div>`;

    			t27 = space();
    			div19 = element("div");

    			div19.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The selected object/string.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">object/string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t35 = space();
    			div24 = element("div");

    			div24.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">minCharactersToSearch</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The minimum number of characters entered to show the search result</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">0</div>`;

    			t43 = space();
    			div29 = element("div");

    			div29.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">noResultsText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The text to show when no results are found</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;No results found&#39;</div>`;

    			t51 = space();
    			div34 = element("div");

    			div34.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">maxLen</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The maximum number of search results shown</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div>`;

    			t59 = space();
    			div39 = element("div");

    			div39.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">clearable</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Includes a clear button when &#39;clearable&#39; is true</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t67 = space();
    			div44 = element("div");

    			div44.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Disables autocomplete box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t75 = space();
    			div49 = element("div");

    			div49.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">hideDetails</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Hides helper text.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t83 = space();
    			div54 = element("div");

    			div54.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">borderColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The border color of the auto complete box. Accepts valid Tailwindcss
      border color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-gray-700</div>`;

    			t91 = space();
    			div59 = element("div");

    			div59.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label text. Accepts valid Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-gray-700</div>`;

    			t99 = space();
    			div64 = element("div");

    			div64.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">helperText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The helper text underneath the auto complete box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t107 = space();
    			div69 = element("div");

    			div69.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">helperTextColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the helper text underneath the auto complete box. Accepts
      Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t115 = space();
    			div74 = element("div");

    			div74.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Transformed this into a outlined auto complete box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t123 = space();
    			div79 = element("div");

    			div79.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">labelFieldName</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">When an array of objects is passed to &#39;items&#39;, this prop specifies the
      field to display.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div>`;

    			t131 = space();
    			div84 = element("div");

    			div84.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">caseSensitive</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Whether the search will be case sensitive.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t139 = space();
    			div89 = element("div");

    			div89.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">keywordsFieldName</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The field to search when user types. When no value is specified, the field
      specified in labelFieldName will be used.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">*labelFieldName</div>`;

    			t147 = space();
    			div94 = element("div");
    			div90 = element("div");
    			div90.textContent = "keywordsFunction";
    			t149 = space();
    			div91 = element("div");
    			div91.textContent = "The function to generate a keyword for each of the item in the array of\n      'items' for the purpose of searching.";
    			t151 = space();
    			div92 = element("div");
    			div92.textContent = "function";
    			t153 = space();
    			div93 = element("div");
    			pre0 = element("pre");

    			pre0.textContent = `${`function (item) {
  if (item === undefined || item === null) {
    return "";
  }
  return keywordsFieldName
    ? item[keywordsFieldName].toString()
    : item.toString();
}`}`;

    			t155 = space();
    			div117 = element("div");
    			h31 = element("h3");
    			div96 = element("div");
    			div96.textContent = "Demo";
    			t157 = space();
    			create_component(checkbox0.$$.fragment);
    			t158 = space();
    			div97 = element("div");
    			create_component(autocomplete0.$$.fragment);
    			t159 = space();
    			div116 = element("div");
    			div103 = element("div");
    			div98 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t160 = space();
    			div99 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t161 = space();
    			div100 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t162 = space();
    			div101 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t163 = space();
    			div102 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t164 = space();
    			div115 = element("div");
    			div104 = element("div");
    			create_component(input0.$$.fragment);
    			t165 = space();
    			div105 = element("div");
    			create_component(input1.$$.fragment);
    			t166 = space();
    			div106 = element("div");
    			create_component(input2.$$.fragment);
    			t167 = space();
    			div107 = element("div");
    			create_component(input3.$$.fragment);
    			t168 = space();
    			div108 = element("div");
    			create_component(input4.$$.fragment);
    			t169 = space();
    			div109 = element("div");
    			create_component(autocomplete1.$$.fragment);
    			t170 = space();
    			div110 = element("div");
    			create_component(autocomplete2.$$.fragment);
    			t171 = space();
    			div111 = element("div");
    			create_component(input5.$$.fragment);
    			t172 = space();
    			div112 = element("div");
    			create_component(input6.$$.fragment);
    			t173 = space();
    			div113 = element("div");
    			create_component(input7.$$.fragment);
    			t174 = space();
    			div114 = element("div");
    			create_component(input8.$$.fragment);
    			t175 = space();
    			pre1 = element("pre");

    			pre1.textContent = `${`
let items = [
  {
    countryCode: 'MYS',
    countryName: 'Malaysia',
  },
  {
    countryCode: 'JPN',
    countryName: 'Japan',
  },
  {
    countryCode: 'KOR',
    countryName: 'Korea',
  },
  {
    countryCode: "SGP",
    countryName: "Singapore",
  },
  {
    countryCode: "HKG",
    countryName: "Hong Kong",
  },
  {
    countryCode: "CHN",
    countryName: "China",
  },
];
function keywordsFunction(item) {
  if (item === undefined || item === null) {
    return "";
  }
  return (item.countryCode + "|" + item.countryName);
}

<Autocomplete
  {label}
  {items}
  {caseSensitive}
  bind:value
  {minCharactersToSearch}
  {noResultsText}
  {maxLen}
  {borderColor}
  {labelColor}
  {helperText}
  {helperTextColor}
  {outlined}
  {clearable}
  {disabled}
  {hideDetails}
  {labelFieldName}
  {keywordsFieldName}
  {keywordsFunction} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(h30, "class", "text-lg font-bold ml-3 mt-5 mb-3");
    			attr(div4, "class", "table-row font-bold");
    			attr(div9, "class", "table-row");
    			attr(div14, "class", "table-row");
    			attr(div19, "class", "table-row");
    			attr(div24, "class", "table-row");
    			attr(div29, "class", "table-row");
    			attr(div34, "class", "table-row");
    			attr(div39, "class", "table-row");
    			attr(div44, "class", "table-row");
    			attr(div49, "class", "table-row");
    			attr(div54, "class", "table-row");
    			attr(div59, "class", "table-row");
    			attr(div64, "class", "table-row");
    			attr(div69, "class", "table-row");
    			attr(div74, "class", "table-row");
    			attr(div79, "class", "table-row");
    			attr(div84, "class", "table-row");
    			attr(div89, "class", "table-row");
    			attr(div90, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div91, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div92, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div93, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div94, "class", "table-row");
    			attr(div95, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div96, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div97, "class", "my-2");
    			attr(div98, "class", "px-4");
    			attr(div99, "class", "px-4");
    			attr(div100, "class", "px-4");
    			attr(div101, "class", "px-4");
    			attr(div102, "class", "px-4");
    			attr(div103, "class", "w-full flex flex-row flex-wrap");
    			attr(div104, "class", "px-4 pb-2");
    			attr(div105, "class", "px-4 pb-2");
    			attr(div106, "class", "px-4 pb-2");
    			attr(div107, "class", "px-4 pb-2");
    			attr(div108, "class", "px-4 pb-2");
    			attr(div109, "class", "px-4 pb-2");
    			attr(div110, "class", "px-4 pb-2");
    			attr(div111, "class", "px-4 pb-2");
    			attr(div112, "class", "px-4 pb-2");
    			attr(div113, "class", "px-4 pb-2");
    			attr(div114, "class", "px-4 pb-2");
    			attr(div115, "class", "w-full flex flex-row flex-wrap");
    			attr(div116, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div117, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre1, "class", "my-2 bg-gray-200 rounded p-5 font-light text-sm");
    			toggle_class(pre1, "hidden", !/*showCode*/ ctx[16]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div95, anchor);
    			append(div95, h30);
    			append(div95, t3);
    			append(div95, div4);
    			append(div95, t11);
    			append(div95, div9);
    			append(div95, t19);
    			append(div95, div14);
    			append(div95, t27);
    			append(div95, div19);
    			append(div95, t35);
    			append(div95, div24);
    			append(div95, t43);
    			append(div95, div29);
    			append(div95, t51);
    			append(div95, div34);
    			append(div95, t59);
    			append(div95, div39);
    			append(div95, t67);
    			append(div95, div44);
    			append(div95, t75);
    			append(div95, div49);
    			append(div95, t83);
    			append(div95, div54);
    			append(div95, t91);
    			append(div95, div59);
    			append(div95, t99);
    			append(div95, div64);
    			append(div95, t107);
    			append(div95, div69);
    			append(div95, t115);
    			append(div95, div74);
    			append(div95, t123);
    			append(div95, div79);
    			append(div95, t131);
    			append(div95, div84);
    			append(div95, t139);
    			append(div95, div89);
    			append(div95, t147);
    			append(div95, div94);
    			append(div94, div90);
    			append(div94, t149);
    			append(div94, div91);
    			append(div94, t151);
    			append(div94, div92);
    			append(div94, t153);
    			append(div94, div93);
    			append(div93, pre0);
    			insert(target, t155, anchor);
    			insert(target, div117, anchor);
    			append(div117, h31);
    			append(h31, div96);
    			append(h31, t157);
    			mount_component(checkbox0, h31, null);
    			append(div117, t158);
    			append(div117, div97);
    			mount_component(autocomplete0, div97, null);
    			append(div117, t159);
    			append(div117, div116);
    			append(div116, div103);
    			append(div103, div98);
    			mount_component(checkbox1, div98, null);
    			append(div103, t160);
    			append(div103, div99);
    			mount_component(checkbox2, div99, null);
    			append(div103, t161);
    			append(div103, div100);
    			mount_component(checkbox3, div100, null);
    			append(div103, t162);
    			append(div103, div101);
    			mount_component(checkbox4, div101, null);
    			append(div103, t163);
    			append(div103, div102);
    			mount_component(checkbox5, div102, null);
    			append(div116, t164);
    			append(div116, div115);
    			append(div115, div104);
    			mount_component(input0, div104, null);
    			append(div115, t165);
    			append(div115, div105);
    			mount_component(input1, div105, null);
    			append(div115, t166);
    			append(div115, div106);
    			mount_component(input2, div106, null);
    			append(div115, t167);
    			append(div115, div107);
    			mount_component(input3, div107, null);
    			append(div115, t168);
    			append(div115, div108);
    			mount_component(input4, div108, null);
    			append(div115, t169);
    			append(div115, div109);
    			mount_component(autocomplete1, div109, null);
    			append(div115, t170);
    			append(div115, div110);
    			mount_component(autocomplete2, div110, null);
    			append(div115, t171);
    			append(div115, div111);
    			mount_component(input5, div111, null);
    			append(div115, t172);
    			append(div115, div112);
    			mount_component(input6, div112, null);
    			append(div115, t173);
    			append(div115, div113);
    			mount_component(input7, div113, null);
    			append(div115, t174);
    			append(div115, div114);
    			mount_component(input8, div114, null);
    			insert(target, t175, anchor);
    			insert(target, pre1, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const checkbox0_changes = {};

    			if (dirty[1] & /*$$scope*/ 16) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty[0] & /*showCode*/ 65536) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[16];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const autocomplete0_changes = {};
    			if (dirty[0] & /*label*/ 1) autocomplete0_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*caseSensitive*/ 16) autocomplete0_changes.caseSensitive = /*caseSensitive*/ ctx[4];
    			if (dirty[0] & /*minCharactersToSearch*/ 4) autocomplete0_changes.minCharactersToSearch = /*minCharactersToSearch*/ ctx[2];
    			if (dirty[0] & /*noResultsText*/ 8) autocomplete0_changes.noResultsText = /*noResultsText*/ ctx[3];
    			if (dirty[0] & /*maxLen*/ 32) autocomplete0_changes.maxLen = /*maxLen*/ ctx[5];
    			if (dirty[0] & /*borderColor*/ 512) autocomplete0_changes.borderColor = /*borderColor*/ ctx[9];
    			if (dirty[0] & /*labelColor*/ 1024) autocomplete0_changes.labelColor = /*labelColor*/ ctx[10];
    			if (dirty[0] & /*helperText*/ 2048) autocomplete0_changes.helperText = /*helperText*/ ctx[11];
    			if (dirty[0] & /*helperTextColor*/ 4096) autocomplete0_changes.helperTextColor = /*helperTextColor*/ ctx[12];
    			if (dirty[0] & /*outlined*/ 8192) autocomplete0_changes.outlined = /*outlined*/ ctx[13];
    			if (dirty[0] & /*clearable*/ 64) autocomplete0_changes.clearable = /*clearable*/ ctx[6];
    			if (dirty[0] & /*disabled*/ 128) autocomplete0_changes.disabled = /*disabled*/ ctx[7];
    			if (dirty[0] & /*hideDetails*/ 256) autocomplete0_changes.hideDetails = /*hideDetails*/ ctx[8];
    			if (dirty[0] & /*labelFieldName*/ 16384) autocomplete0_changes.labelFieldName = /*labelFieldName*/ ctx[14];
    			if (dirty[0] & /*keywordsFieldName*/ 32768) autocomplete0_changes.keywordsFieldName = /*keywordsFieldName*/ ctx[15];

    			if (!updating_value && dirty[0] & /*value*/ 2) {
    				updating_value = true;
    				autocomplete0_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			autocomplete0.$set(autocomplete0_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty[0] & /*caseSensitive*/ 16) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*caseSensitive*/ ctx[4];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty[0] & /*outlined*/ 8192) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*outlined*/ ctx[13];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty[0] & /*clearable*/ 64) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*clearable*/ ctx[6];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty[0] & /*disabled*/ 128) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled*/ ctx[7];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (!updating_checked_5 && dirty[0] & /*hideDetails*/ 256) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*hideDetails*/ ctx[8];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty[0] & /*label*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty[0] & /*value, keywordsFieldName*/ 32770) input1_changes.value = /*value*/ ctx[1][/*keywordsFieldName*/ ctx[15]];
    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*minCharactersToSearch*/ 4) {
    				updating_value_2 = true;
    				input2_changes.value = /*minCharactersToSearch*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*maxLen*/ 32) {
    				updating_value_3 = true;
    				input3_changes.value = /*maxLen*/ ctx[5];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_4 && dirty[0] & /*noResultsText*/ 8) {
    				updating_value_4 = true;
    				input4_changes.value = /*noResultsText*/ ctx[3];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    			const autocomplete1_changes = {};

    			if (!updating_value_5 && dirty[0] & /*labelFieldName*/ 16384) {
    				updating_value_5 = true;
    				autocomplete1_changes.value = /*labelFieldName*/ ctx[14];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			autocomplete1.$set(autocomplete1_changes);
    			const autocomplete2_changes = {};

    			if (!updating_value_6 && dirty[0] & /*keywordsFieldName*/ 32768) {
    				updating_value_6 = true;
    				autocomplete2_changes.value = /*keywordsFieldName*/ ctx[15];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			autocomplete2.$set(autocomplete2_changes);
    			const input5_changes = {};

    			if (!updating_value_7 && dirty[0] & /*borderColor*/ 512) {
    				updating_value_7 = true;
    				input5_changes.value = /*borderColor*/ ctx[9];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_8 && dirty[0] & /*labelColor*/ 1024) {
    				updating_value_8 = true;
    				input6_changes.value = /*labelColor*/ ctx[10];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			input6.$set(input6_changes);
    			const input7_changes = {};

    			if (!updating_value_9 && dirty[0] & /*helperText*/ 2048) {
    				updating_value_9 = true;
    				input7_changes.value = /*helperText*/ ctx[11];
    				add_flush_callback(() => updating_value_9 = false);
    			}

    			input7.$set(input7_changes);
    			const input8_changes = {};

    			if (!updating_value_10 && dirty[0] & /*helperTextColor*/ 4096) {
    				updating_value_10 = true;
    				input8_changes.value = /*helperTextColor*/ ctx[12];
    				add_flush_callback(() => updating_value_10 = false);
    			}

    			input8.$set(input8_changes);

    			if (dirty[0] & /*showCode*/ 65536) {
    				toggle_class(pre1, "hidden", !/*showCode*/ ctx[16]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(autocomplete0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(autocomplete1.$$.fragment, local);
    			transition_in(autocomplete2.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			transition_in(input8.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(autocomplete0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(autocomplete1.$$.fragment, local);
    			transition_out(autocomplete2.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			transition_out(input8.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div95);
    			if (detaching) detach(t155);
    			if (detaching) detach(div117);
    			destroy_component(checkbox0);
    			destroy_component(autocomplete0);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(autocomplete1);
    			destroy_component(autocomplete2);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    			destroy_component(input8);
    			if (detaching) detach(t175);
    			if (detaching) detach(pre1);
    		}
    	};
    }

    function keywordsFunction(item) {
    	if (item === undefined || item === null) {
    		return "";
    	}

    	return `${item.countryCode}|${item.countryName}`;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let label = "Country Name";

    	let items = [
    		{
    			countryCode: "MYS",
    			countryName: "Malaysia"
    		},
    		{ countryCode: "JPN", countryName: "Japan" },
    		{ countryCode: "KOR", countryName: "Korea" },
    		{
    			countryCode: "SGP",
    			countryName: "Singapore"
    		},
    		{
    			countryCode: "HKG",
    			countryName: "Hong Kong"
    		},
    		{ countryCode: "CHN", countryName: "China" }
    	];

    	let value = "";
    	let minCharactersToSearch = 0;
    	let noResultsText = "No results found";
    	let caseSensitive = false;
    	let maxLen = undefined;
    	let clearable = false;
    	let disabled = false;
    	let hideDetails = false;
    	let borderColor = "border-gray-700";
    	let labelColor = "text-gray-700";
    	let helperText = "Select a country";
    	let helperTextColor = "text-red-600";
    	let outlined = false;
    	let labelFieldName = "countryName";
    	let keywordsFieldName = "countryCode";
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(16, showCode);
    	}

    	function autocomplete0_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox1_checked_binding(value) {
    		caseSensitive = value;
    		$$invalidate(4, caseSensitive);
    	}

    	function checkbox2_checked_binding(value) {
    		outlined = value;
    		$$invalidate(13, outlined);
    	}

    	function checkbox3_checked_binding(value) {
    		clearable = value;
    		$$invalidate(6, clearable);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled = value;
    		$$invalidate(7, disabled);
    	}

    	function checkbox5_checked_binding(value) {
    		hideDetails = value;
    		$$invalidate(8, hideDetails);
    	}

    	function input0_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input2_value_binding(value) {
    		minCharactersToSearch = value;
    		$$invalidate(2, minCharactersToSearch);
    	}

    	function input3_value_binding(value) {
    		maxLen = value;
    		$$invalidate(5, maxLen);
    	}

    	function input4_value_binding(value) {
    		noResultsText = value;
    		$$invalidate(3, noResultsText);
    	}

    	function autocomplete1_value_binding(value) {
    		labelFieldName = value;
    		$$invalidate(14, labelFieldName);
    	}

    	function autocomplete2_value_binding(value) {
    		keywordsFieldName = value;
    		$$invalidate(15, keywordsFieldName);
    	}

    	function input5_value_binding(value) {
    		borderColor = value;
    		$$invalidate(9, borderColor);
    	}

    	function input6_value_binding(value) {
    		labelColor = value;
    		$$invalidate(10, labelColor);
    	}

    	function input7_value_binding(value) {
    		helperText = value;
    		$$invalidate(11, helperText);
    	}

    	function input8_value_binding(value) {
    		helperTextColor = value;
    		$$invalidate(12, helperTextColor);
    	}

    	return [
    		label,
    		value,
    		minCharactersToSearch,
    		noResultsText,
    		caseSensitive,
    		maxLen,
    		clearable,
    		disabled,
    		hideDetails,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		labelFieldName,
    		keywordsFieldName,
    		showCode,
    		items,
    		checkbox0_checked_binding,
    		autocomplete0_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		input0_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		autocomplete1_value_binding,
    		autocomplete2_value_binding,
    		input5_value_binding,
    		input6_value_binding,
    		input7_value_binding,
    		input8_value_binding
    	];
    }

    class AutocompleteGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$p, create_fragment$r, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\widgets\Cascader.svelte generated by Svelte v3.31.0 */

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[48] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[44] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[45] = list[i];
    	return child_ctx;
    }

    // (259:4) {:else}
    function create_else_block$4(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*noResultsText*/ ctx[1]);
    			attr(div, "class", "m-3");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);

    			if (!mounted) {
    				dispose = listen(div, "mousedown", stop_propagation(prevent_default(/*mousedown_handler*/ ctx[32])));
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*noResultsText*/ 2) set_data(t, /*noResultsText*/ ctx[1]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (247:37) 
    function create_if_block_2$2(ctx) {
    	let ul;
    	let each_value_2 = /*flattenList*/ ctx[17];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(ul, "max-height", "320px");
    			attr(ul, "class", "flex flex-col border-r my-2 overflow-y-auto");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*flattenListClicked, flattenList*/ 16908288) {
    				each_value_2 = /*flattenList*/ ctx[17];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (226:4) {#if items.length > 0 && flattenList.length === 0 && !searching}
    function create_if_block$a(ctx) {
    	let div;
    	let each_value = /*layers*/ ctx[13];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "flex");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*layers, isItemSelected, itemClicked, labelFieldName*/ 4465664) {
    				each_value = /*layers*/ ctx[13];
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
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (251:8) {#each flattenList as list}
    function create_each_block_2(ctx) {
    	let li;
    	let t0_value = /*list*/ ctx[48].join(" / ") + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[35](/*list*/ ctx[48]);
    	}

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(li, "class", "flex items-center justify-between hover:bg-gray-200 p-3");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);

    			if (!mounted) {
    				dispose = listen(li, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*flattenList*/ 131072 && t0_value !== (t0_value = /*list*/ ctx[48].join(" / ") + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (238:16) {#if item.children && item.children.length > 0}
    function create_if_block_1$2(ctx) {
    	let span;

    	return {
    		c() {
    			span = element("span");
    			span.textContent = "keyboard_arrow_right";
    			attr(span, "class", "material-icons ml-3 w-3");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (232:12) {#each items as item}
    function create_each_block_1(ctx) {
    	let li;
    	let t0_value = /*item*/ ctx[45][/*labelFieldName*/ ctx[10]] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block = /*item*/ ctx[45].children && /*item*/ ctx[45].children.length > 0 && create_if_block_1$2();

    	function click_handler() {
    		return /*click_handler*/ ctx[34](/*item*/ ctx[45], /*i*/ ctx[44]);
    	}

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr(li, "class", "flex items-center justify-between hover:bg-gray-200 p-3 svelte-192al2g");
    			toggle_class(li, "active", /*isItemSelected*/ ctx[18](/*item*/ ctx[45], /*i*/ ctx[44]));
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);
    			if (if_block) if_block.m(li, null);

    			if (!mounted) {
    				dispose = listen(li, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*layers, labelFieldName*/ 9216 && t0_value !== (t0_value = /*item*/ ctx[45][/*labelFieldName*/ ctx[10]] + "")) set_data(t0, t0_value);

    			if (/*item*/ ctx[45].children && /*item*/ ctx[45].children.length > 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$2();
    					if_block.c();
    					if_block.m(li, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*isItemSelected, layers*/ 270336) {
    				toggle_class(li, "active", /*isItemSelected*/ ctx[18](/*item*/ ctx[45], /*i*/ ctx[44]));
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (228:8) {#each layers as items, i}
    function create_each_block$1(ctx) {
    	let ul;
    	let t;
    	let each_value_1 = /*items*/ ctx[11];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			set_style(ul, "max-height", "320px");
    			set_style(ul, "min-width", "210px");
    			attr(ul, "class", "flex flex-col border-r my-2 overflow-y-auto");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append(ul, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*isItemSelected, layers, itemClicked, labelFieldName*/ 4465664) {
    				each_value_1 = /*items*/ ctx[11];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$s(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let updating_value;
    	let t;
    	let div1;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[33].call(null, value);
    	}

    	let input_props = {
    		outlined: /*outlined*/ ctx[9],
    		icon: /*icon*/ ctx[14],
    		clearable: /*clearable*/ ctx[2],
    		disabled: /*disabled*/ ctx[3],
    		hideDetails: /*hideDetails*/ ctx[4],
    		label: /*label*/ ctx[0],
    		labelColor: /*labelColor*/ ctx[6],
    		borderColor: /*borderColor*/ ctx[5],
    		helperText: /*helperText*/ ctx[7],
    		helperTextColor: /*helperTextColor*/ ctx[8]
    	};

    	if (/*text*/ ctx[15] !== void 0) {
    		input_props.value = /*text*/ ctx[15];
    	}

    	input = new Input({ props: input_props });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));
    	input.$on("input", /*onInput*/ ctx[23]);
    	input.$on("keydown", /*handleKeydown*/ ctx[26]);
    	input.$on("blur", /*onBlur*/ ctx[25]);
    	input.$on("focus", /*onFocus*/ ctx[20]);
    	input.$on("clear", /*onClear*/ ctx[21]);

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[11].length > 0 && /*flattenList*/ ctx[17].length === 0 && !/*searching*/ ctx[16]) return create_if_block$a;
    		if (/*flattenList*/ ctx[17].length > 0) return create_if_block_2$2;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(input.$$.fragment);
    			t = space();
    			div1 = element("div");
    			if_block.c();
    			attr(div0, "class", "relative z-20");
    			attr(div1, "tabindex", "0");
    			attr(div1, "class", div1_class_value = "" + (null_to_empty(`focus:outline-none absolute z-30 bg-white rounded-sm elevation-4 ${/*hideDetails*/ ctx[4] ? "mt-0" : "-mt-5"} ${/*listVisible*/ ctx[12] ? "" : "hidden"}`) + " svelte-192al2g"));
    			attr(div2, "class", "relative");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			mount_component(input, div0, null);
    			append(div2, t);
    			append(div2, div1);
    			if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div1, "blur", /*onBlur*/ ctx[25]),
    					listen(div1, "mouseenter", /*mouseenter_handler*/ ctx[36]),
    					listen(div1, "mouseleave", /*mouseleave_handler*/ ctx[37])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			const input_changes = {};
    			if (dirty[0] & /*outlined*/ 512) input_changes.outlined = /*outlined*/ ctx[9];
    			if (dirty[0] & /*icon*/ 16384) input_changes.icon = /*icon*/ ctx[14];
    			if (dirty[0] & /*clearable*/ 4) input_changes.clearable = /*clearable*/ ctx[2];
    			if (dirty[0] & /*disabled*/ 8) input_changes.disabled = /*disabled*/ ctx[3];
    			if (dirty[0] & /*hideDetails*/ 16) input_changes.hideDetails = /*hideDetails*/ ctx[4];
    			if (dirty[0] & /*label*/ 1) input_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*labelColor*/ 64) input_changes.labelColor = /*labelColor*/ ctx[6];
    			if (dirty[0] & /*borderColor*/ 32) input_changes.borderColor = /*borderColor*/ ctx[5];
    			if (dirty[0] & /*helperText*/ 128) input_changes.helperText = /*helperText*/ ctx[7];
    			if (dirty[0] & /*helperTextColor*/ 256) input_changes.helperTextColor = /*helperTextColor*/ ctx[8];

    			if (!updating_value && dirty[0] & /*text*/ 32768) {
    				updating_value = true;
    				input_changes.value = /*text*/ ctx[15];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}

    			if (!current || dirty[0] & /*hideDetails, listVisible*/ 4112 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`focus:outline-none absolute z-30 bg-white rounded-sm elevation-4 ${/*hideDetails*/ ctx[4] ? "mt-0" : "-mt-5"} ${/*listVisible*/ ctx[12] ? "" : "hidden"}`) + " svelte-192al2g"))) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			destroy_component(input);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$q($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { items = [] } = $$props;
    	let { value = [] } = $$props;
    	let { minCharactersToSearch = 0 } = $$props;
    	let { noResultsText = "No results found" } = $$props;
    	let { clearable = false } = $$props;
    	let { disabled = false } = $$props;
    	let { hideDetails = false } = $$props;
    	let { borderColor = "border-gray-700" } = $$props;
    	let { labelColor = "text-gray-700" } = $$props;
    	let { helperText = "" } = $$props;
    	let { helperTextColor = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { labelFieldName = undefined } = $$props;
    	let { keywordsFieldName = labelFieldName } = $$props;
    	let { caseSensitive = false } = $$props;

    	let { keywordsFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return keywordsFieldName
    		? item[keywordsFieldName].toString()
    		: item.toString();
    	} } = $$props;

    	let listVisible = false;
    	let icon;
    	let text = "";

    	function onFocus(e) {
    		$$invalidate(12, listVisible = true);
    		$$invalidate(16, searching = false);
    		$$invalidate(17, flattenList = []);

    		if (text) {
    			e.target.selectionStart = 0;
    			e.target.selectionEnd = text.toString().length;
    		}
    	}

    	function onClear() {
    		$$invalidate(12, listVisible = false);
    		$$invalidate(16, searching = false);
    		$$invalidate(17, flattenList = []);
    		$$invalidate(27, value = []);
    		$$invalidate(13, layers = [[...items]]);
    		$$invalidate(15, text = "");
    	}

    	function setText() {
    		$$invalidate(15, text = value.join(" / "));
    	}

    	function itemClicked(item, i) {
    		$$invalidate(16, searching = false);
    		$$invalidate(17, flattenList = []);
    		$$invalidate(27, value = value.slice(0, i));
    		$$invalidate(27, value = [...value, item[keywordsFieldName]]);
    		setText();

    		if (item.children && item.children.length > 0) {
    			$$invalidate(13, layers = layers.slice(0, i + 1));
    			$$invalidate(13, layers = [...layers, [...item.children]]);
    		} else {
    			$$invalidate(12, listVisible = false);
    		}
    	}

    	let layers = [[...items]];
    	let searching = false;

    	function onInput(e) {
    		$$invalidate(16, searching = true);
    		const t = e.detail;

    		if (t.length >= minCharactersToSearch) {
    			const baseKeyword = caseSensitive ? t : t.toLowerCase();
    			$$invalidate(17, flattenList = getListWithKeyword([], items, baseKeyword));
    		} else {
    			$$invalidate(17, flattenList = []);
    		}
    	}

    	function getListWithKeyword(keywords, tree, t) {
    		let masterList = [];

    		for (let i = 0; i < tree.length; i++) {
    			let k = keywordsFunction(tree[i]);
    			k = caseSensitive ? k : k.toLowerCase();
    			const display = tree[i][keywordsFieldName];

    			if (k.includes(t)) {
    				const flatten = getFlatList([[...keywords, display]], [...keywords, display], tree[i].children);
    				masterList = [...masterList, ...flatten];
    			} else if (tree[i].children && tree[i].children.length > 0) {
    				const list = getListWithKeyword([...keywords, display], tree[i].children, t);
    				masterList = [...masterList, ...list];
    			}
    		}

    		return masterList;
    	}

    	function getFlatList(masterList, keywords, children) {
    		if (!children || children.length === 0) {
    			return masterList;
    		}

    		for (let i = 0; i < children.length; i++) {
    			const childKeyword = keywordsFunction(children[i]);

    			if (childKeyword) {
    				const childKeywords = [...keywords, children[i][keywordsFieldName]];
    				masterList = [...masterList, childKeywords];
    				masterList = getFlatList(masterList, childKeywords, children[i].children);
    			}
    		}

    		return masterList;
    	}

    	let flattenList = [];

    	function flattenListClicked(list) {
    		$$invalidate(16, searching = false);
    		$$invalidate(12, listVisible = false);
    		$$invalidate(27, value = [...list]);
    		setText();
    		$$invalidate(17, flattenList = []);
    		$$invalidate(13, layers = [[...items]]);
    		let tempList = items;

    		for (let i = 0; i < list.length; i++) {
    			const item = tempList.find(it => it[keywordsFieldName] === list[i]);

    			if (item && item.children && item.children.length > 0) {
    				$$invalidate(13, layers = [...layers, [...item.children]]);
    				tempList = item.children;
    			} else {
    				break;
    			}
    		}
    	}

    	let isItemSelected;

    	function onBlur() {
    		if (mouseover) return;
    		$$invalidate(12, listVisible = false);
    		setText();
    	}

    	let mouseover;

    	function handleKeydown(e) {
    		$$invalidate(12, listVisible = e.key !== "Escape");
    	}

    	function mousedown_handler(event) {
    		bubble($$self, event);
    	}

    	function input_value_binding(value) {
    		text = value;
    		$$invalidate(15, text);
    	}

    	const click_handler = (item, i) => itemClicked(item, i);
    	const click_handler_1 = list => flattenListClicked(list);
    	const mouseenter_handler = () => $$invalidate(19, mouseover = true);
    	const mouseleave_handler = () => $$invalidate(19, mouseover = false);

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("value" in $$props) $$invalidate(27, value = $$props.value);
    		if ("minCharactersToSearch" in $$props) $$invalidate(28, minCharactersToSearch = $$props.minCharactersToSearch);
    		if ("noResultsText" in $$props) $$invalidate(1, noResultsText = $$props.noResultsText);
    		if ("clearable" in $$props) $$invalidate(2, clearable = $$props.clearable);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("hideDetails" in $$props) $$invalidate(4, hideDetails = $$props.hideDetails);
    		if ("borderColor" in $$props) $$invalidate(5, borderColor = $$props.borderColor);
    		if ("labelColor" in $$props) $$invalidate(6, labelColor = $$props.labelColor);
    		if ("helperText" in $$props) $$invalidate(7, helperText = $$props.helperText);
    		if ("helperTextColor" in $$props) $$invalidate(8, helperTextColor = $$props.helperTextColor);
    		if ("outlined" in $$props) $$invalidate(9, outlined = $$props.outlined);
    		if ("labelFieldName" in $$props) $$invalidate(10, labelFieldName = $$props.labelFieldName);
    		if ("keywordsFieldName" in $$props) $$invalidate(29, keywordsFieldName = $$props.keywordsFieldName);
    		if ("caseSensitive" in $$props) $$invalidate(30, caseSensitive = $$props.caseSensitive);
    		if ("keywordsFunction" in $$props) $$invalidate(31, keywordsFunction = $$props.keywordsFunction);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*listVisible*/ 4096) {
    			 $$invalidate(14, icon = listVisible ? "arrow_drop_up" : "arrow_drop_down");
    		}

    		if ($$self.$$.dirty[0] & /*value, items, keywordsFieldName, layers*/ 671098880) {
    			 if (value) {
    				setText();
    				$$invalidate(13, layers = [[...items]]);
    				let tempList = items;

    				for (let i = 0; i < value.length; i++) {
    					const item = tempList.find(it => it[keywordsFieldName] === value[i]);

    					if (item && item.children && item.children.length > 0) {
    						$$invalidate(13, layers = [...layers, [...item.children]]);
    						tempList = item.children;
    					} else {
    						break;
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value, keywordsFieldName*/ 671088640) {
    			 $$invalidate(18, isItemSelected = (item, i) => {
    				if (value[i] === item[keywordsFieldName]) {
    					return true;
    				}

    				return false;
    			});
    		}
    	};

    	return [
    		label,
    		noResultsText,
    		clearable,
    		disabled,
    		hideDetails,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		labelFieldName,
    		items,
    		listVisible,
    		layers,
    		icon,
    		text,
    		searching,
    		flattenList,
    		isItemSelected,
    		mouseover,
    		onFocus,
    		onClear,
    		itemClicked,
    		onInput,
    		flattenListClicked,
    		onBlur,
    		handleKeydown,
    		value,
    		minCharactersToSearch,
    		keywordsFieldName,
    		caseSensitive,
    		keywordsFunction,
    		mousedown_handler,
    		input_value_binding,
    		click_handler,
    		click_handler_1,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Cascader extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$q,
    			create_fragment$s,
    			safe_not_equal,
    			{
    				label: 0,
    				items: 11,
    				value: 27,
    				minCharactersToSearch: 28,
    				noResultsText: 1,
    				clearable: 2,
    				disabled: 3,
    				hideDetails: 4,
    				borderColor: 5,
    				labelColor: 6,
    				helperText: 7,
    				helperTextColor: 8,
    				outlined: 9,
    				labelFieldName: 10,
    				keywordsFieldName: 29,
    				caseSensitive: 30,
    				keywordsFunction: 31
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src\components\CascaderGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$a(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$t(ctx) {
    	let h2;
    	let t1;
    	let div90;
    	let h30;
    	let t3;
    	let div4;
    	let t11;
    	let div9;
    	let t19;
    	let div14;
    	let t27;
    	let div19;
    	let t35;
    	let div24;
    	let t43;
    	let div29;
    	let t51;
    	let div34;
    	let t59;
    	let div39;
    	let t67;
    	let div44;
    	let t75;
    	let div49;
    	let t83;
    	let div54;
    	let t91;
    	let div59;
    	let t99;
    	let div64;
    	let t107;
    	let div69;
    	let t115;
    	let div74;
    	let t123;
    	let div79;
    	let t131;
    	let div84;
    	let t139;
    	let div89;
    	let div85;
    	let t141;
    	let div86;
    	let t143;
    	let div87;
    	let t145;
    	let div88;
    	let pre0;
    	let t147;
    	let div111;
    	let h31;
    	let div91;
    	let t149;
    	let checkbox0;
    	let updating_checked;
    	let t150;
    	let div92;
    	let cascader;
    	let updating_value;
    	let t151;
    	let div110;
    	let div98;
    	let div93;
    	let checkbox1;
    	let updating_checked_1;
    	let t152;
    	let div94;
    	let checkbox2;
    	let updating_checked_2;
    	let t153;
    	let div95;
    	let checkbox3;
    	let updating_checked_3;
    	let t154;
    	let div96;
    	let checkbox4;
    	let updating_checked_4;
    	let t155;
    	let div97;
    	let checkbox5;
    	let updating_checked_5;
    	let t156;
    	let div109;
    	let div99;
    	let input0;
    	let updating_value_1;
    	let t157;
    	let div100;
    	let input1;
    	let t158;
    	let div101;
    	let input2;
    	let updating_value_2;
    	let t159;
    	let div102;
    	let input3;
    	let updating_value_3;
    	let t160;
    	let div103;
    	let autocomplete0;
    	let updating_value_4;
    	let t161;
    	let div104;
    	let autocomplete1;
    	let updating_value_5;
    	let t162;
    	let div105;
    	let input4;
    	let updating_value_6;
    	let t163;
    	let div106;
    	let input5;
    	let updating_value_7;
    	let t164;
    	let div107;
    	let input6;
    	let updating_value_8;
    	let t165;
    	let div108;
    	let input7;
    	let updating_value_9;
    	let t166;
    	let pre1;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$a] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[15] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[15];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function cascader_value_binding(value) {
    		/*cascader_value_binding*/ ctx[19].call(null, value);
    	}

    	let cascader_props = {
    		label: /*label*/ ctx[0],
    		items: /*items*/ ctx[16],
    		minCharactersToSearch: /*minCharactersToSearch*/ ctx[2],
    		caseSensitive: /*caseSensitive*/ ctx[14],
    		noResultsText: /*noResultsText*/ ctx[3],
    		borderColor: /*borderColor*/ ctx[7],
    		labelColor: /*labelColor*/ ctx[8],
    		helperText: /*helperText*/ ctx[9],
    		helperTextColor: /*helperTextColor*/ ctx[10],
    		outlined: /*outlined*/ ctx[11],
    		clearable: /*clearable*/ ctx[4],
    		disabled: /*disabled*/ ctx[5],
    		hideDetails: /*hideDetails*/ ctx[6],
    		labelFieldName: /*labelFieldName*/ ctx[12],
    		keywordsFieldName: /*keywordsFieldName*/ ctx[13],
    		keywordsFunction: /*keywordsFunction*/ ctx[17]
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		cascader_props.value = /*value*/ ctx[1];
    	}

    	cascader = new Cascader({ props: cascader_props });
    	binding_callbacks.push(() => bind(cascader, "value", cascader_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[20].call(null, value);
    	}

    	let checkbox1_props = { label: "caseSensitive" };

    	if (/*caseSensitive*/ ctx[14] !== void 0) {
    		checkbox1_props.checked = /*caseSensitive*/ ctx[14];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[21].call(null, value);
    	}

    	let checkbox2_props = { label: "outlined" };

    	if (/*outlined*/ ctx[11] !== void 0) {
    		checkbox2_props.checked = /*outlined*/ ctx[11];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function checkbox3_checked_binding(value) {
    		/*checkbox3_checked_binding*/ ctx[22].call(null, value);
    	}

    	let checkbox3_props = { label: "clearable" };

    	if (/*clearable*/ ctx[4] !== void 0) {
    		checkbox3_props.checked = /*clearable*/ ctx[4];
    	}

    	checkbox3 = new Checkbox({ props: checkbox3_props });
    	binding_callbacks.push(() => bind(checkbox3, "checked", checkbox3_checked_binding));

    	function checkbox4_checked_binding(value) {
    		/*checkbox4_checked_binding*/ ctx[23].call(null, value);
    	}

    	let checkbox4_props = { label: "disabled" };

    	if (/*disabled*/ ctx[5] !== void 0) {
    		checkbox4_props.checked = /*disabled*/ ctx[5];
    	}

    	checkbox4 = new Checkbox({ props: checkbox4_props });
    	binding_callbacks.push(() => bind(checkbox4, "checked", checkbox4_checked_binding));

    	function checkbox5_checked_binding(value) {
    		/*checkbox5_checked_binding*/ ctx[24].call(null, value);
    	}

    	let checkbox5_props = { label: "hideDetails" };

    	if (/*hideDetails*/ ctx[6] !== void 0) {
    		checkbox5_props.checked = /*hideDetails*/ ctx[6];
    	}

    	checkbox5 = new Checkbox({ props: checkbox5_props });
    	binding_callbacks.push(() => bind(checkbox5, "checked", checkbox5_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[25].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input0_props.value = /*label*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	input1 = new Input({
    			props: {
    				readonly: true,
    				hideDetails: true,
    				outlined: true,
    				label: "value",
    				value: JSON.stringify(/*value*/ ctx[1])
    			}
    		});

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[26].call(null, value);
    	}

    	let input2_props = {
    		number: true,
    		hideDetails: true,
    		outlined: true,
    		label: "minCharactersToSearch"
    	};

    	if (/*minCharactersToSearch*/ ctx[2] !== void 0) {
    		input2_props.value = /*minCharactersToSearch*/ ctx[2];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[27].call(null, value);
    	}

    	let input3_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "noResultsText"
    	};

    	if (/*noResultsText*/ ctx[3] !== void 0) {
    		input3_props.value = /*noResultsText*/ ctx[3];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function autocomplete0_value_binding(value) {
    		/*autocomplete0_value_binding*/ ctx[28].call(null, value);
    	}

    	let autocomplete0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelFieldName",
    		items: ["name"]
    	};

    	if (/*labelFieldName*/ ctx[12] !== void 0) {
    		autocomplete0_props.value = /*labelFieldName*/ ctx[12];
    	}

    	autocomplete0 = new Autocomplete({ props: autocomplete0_props });
    	binding_callbacks.push(() => bind(autocomplete0, "value", autocomplete0_value_binding));

    	function autocomplete1_value_binding(value) {
    		/*autocomplete1_value_binding*/ ctx[29].call(null, value);
    	}

    	let autocomplete1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "keywordsFieldName",
    		items: ["name"]
    	};

    	if (/*keywordsFieldName*/ ctx[13] !== void 0) {
    		autocomplete1_props.value = /*keywordsFieldName*/ ctx[13];
    	}

    	autocomplete1 = new Autocomplete({ props: autocomplete1_props });
    	binding_callbacks.push(() => bind(autocomplete1, "value", autocomplete1_value_binding));

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[30].call(null, value);
    	}

    	let input4_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "borderColor"
    	};

    	if (/*borderColor*/ ctx[7] !== void 0) {
    		input4_props.value = /*borderColor*/ ctx[7];
    	}

    	input4 = new Input({ props: input4_props });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value) {
    		/*input5_value_binding*/ ctx[31].call(null, value);
    	}

    	let input5_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "labelColor"
    	};

    	if (/*labelColor*/ ctx[8] !== void 0) {
    		input5_props.value = /*labelColor*/ ctx[8];
    	}

    	input5 = new Input({ props: input5_props });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value) {
    		/*input6_value_binding*/ ctx[32].call(null, value);
    	}

    	let input6_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperText"
    	};

    	if (/*helperText*/ ctx[9] !== void 0) {
    		input6_props.value = /*helperText*/ ctx[9];
    	}

    	input6 = new Input({ props: input6_props });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	function input7_value_binding(value) {
    		/*input7_value_binding*/ ctx[33].call(null, value);
    	}

    	let input7_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "helperTextColor"
    	};

    	if (/*helperTextColor*/ ctx[10] !== void 0) {
    		input7_props.value = /*helperTextColor*/ ctx[10];
    	}

    	input7 = new Input({ props: input7_props });
    	binding_callbacks.push(() => bind(input7, "value", input7_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Cascader";
    			t1 = space();
    			div90 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Properties";
    			t3 = space();
    			div4 = element("div");

    			div4.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div>`;

    			t11 = space();
    			div9 = element("div");

    			div9.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the cascader input box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t19 = space();
    			div14 = element("div");

    			div14.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">items</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The list of items to choose from. Each item can contain a &#39;children&#39;
      property. The &#39;children&#39; property is an array of items. An item which does
      not contain the &#39;children&#39; property is a leaf node.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">array</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">[]</div>`;

    			t27 = space();
    			div19 = element("div");

    			div19.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">An array of the selected values for each layer of the tree.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">array of strings</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t35 = space();
    			div24 = element("div");

    			div24.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">minCharactersToSearch</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The minimum number of characters entered to show the search result</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">number</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">0</div>`;

    			t43 = space();
    			div29 = element("div");

    			div29.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">noResultsText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The text to show when no results are found</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;No results found&#39;</div>`;

    			t51 = space();
    			div34 = element("div");

    			div34.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">clearable</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Includes a clear button when &#39;clearable&#39; is true</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t59 = space();
    			div39 = element("div");

    			div39.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Disables cascader.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t67 = space();
    			div44 = element("div");

    			div44.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">hideDetails</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Hides helper text.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t75 = space();
    			div49 = element("div");

    			div49.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">borderColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The border color of the cascader box. Accepts valid Tailwindcss border
      color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">border-gray-700</div>`;

    			t83 = space();
    			div54 = element("div");

    			div54.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label text. Accepts valid Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">text-gray-700</div>`;

    			t91 = space();
    			div59 = element("div");

    			div59.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">helperText</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The helper text underneath the cascader box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t99 = space();
    			div64 = element("div");

    			div64.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">helperTextColor</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the helper text underneath the cascader box. Accepts
      Tailwindcss text color class</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div>`;

    			t107 = space();
    			div69 = element("div");

    			div69.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">outlined</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Transformed this into a outlined cascader box.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t115 = space();
    			div74 = element("div");

    			div74.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">labelFieldName</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Specifies the field to display.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div>`;

    			t123 = space();
    			div79 = element("div");

    			div79.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">caseSensitive</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">Whether the search will be case sensitive.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>`;

    			t131 = space();
    			div84 = element("div");

    			div84.innerHTML = `<div class="table-cell py-3 px-3 border-b border-gray-400">keywordsFieldName</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">The field to search when user types. When no value is specified, the field
      specified in labelFieldName will be used.</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
    <div class="table-cell py-3 px-3 border-b border-gray-400">*labelFieldName</div>`;

    			t139 = space();
    			div89 = element("div");
    			div85 = element("div");
    			div85.textContent = "keywordsFunction";
    			t141 = space();
    			div86 = element("div");
    			div86.textContent = "The function to generate a keyword for each of the item in the array of\n      'items' for the purpose of searching.";
    			t143 = space();
    			div87 = element("div");
    			div87.textContent = "function";
    			t145 = space();
    			div88 = element("div");
    			pre0 = element("pre");

    			pre0.textContent = `${`function (item) {
  if (item === undefined || item === null) {
    return "";
  }
  return keywordsFieldName
    ? item[keywordsFieldName].toString()
    : item.toString();
}`}`;

    			t147 = space();
    			div111 = element("div");
    			h31 = element("h3");
    			div91 = element("div");
    			div91.textContent = "Demo";
    			t149 = space();
    			create_component(checkbox0.$$.fragment);
    			t150 = space();
    			div92 = element("div");
    			create_component(cascader.$$.fragment);
    			t151 = space();
    			div110 = element("div");
    			div98 = element("div");
    			div93 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t152 = space();
    			div94 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t153 = space();
    			div95 = element("div");
    			create_component(checkbox3.$$.fragment);
    			t154 = space();
    			div96 = element("div");
    			create_component(checkbox4.$$.fragment);
    			t155 = space();
    			div97 = element("div");
    			create_component(checkbox5.$$.fragment);
    			t156 = space();
    			div109 = element("div");
    			div99 = element("div");
    			create_component(input0.$$.fragment);
    			t157 = space();
    			div100 = element("div");
    			create_component(input1.$$.fragment);
    			t158 = space();
    			div101 = element("div");
    			create_component(input2.$$.fragment);
    			t159 = space();
    			div102 = element("div");
    			create_component(input3.$$.fragment);
    			t160 = space();
    			div103 = element("div");
    			create_component(autocomplete0.$$.fragment);
    			t161 = space();
    			div104 = element("div");
    			create_component(autocomplete1.$$.fragment);
    			t162 = space();
    			div105 = element("div");
    			create_component(input4.$$.fragment);
    			t163 = space();
    			div106 = element("div");
    			create_component(input5.$$.fragment);
    			t164 = space();
    			div107 = element("div");
    			create_component(input6.$$.fragment);
    			t165 = space();
    			div108 = element("div");
    			create_component(input7.$$.fragment);
    			t166 = space();
    			pre1 = element("pre");

    			pre1.textContent = `${`
let items = [
    {
        name: "Malaysia",
        children: [
        { name: "Kuala Lumpur" },
        { name: "Johor" },
        { name: "Selangor" },
        { name: "Negeri Sembilan" },
        { name: "Melaka" },
        ],
    },
    {
        name: "Japan",
        children: [
        { name: "Chiba" },
        { name: "Fukuoka" },
        { name: "Hamamatsu" },
        { name: "Hiroshima" },
        { name: "Kawasaki" },
        ],
    },
    {
        name: "Korea",
        children: [
        { name: "Damyang" },
        { name: "Deokjeokdo" },
        { name: "Busan" },
        { name: "Jinhae" },
        { name: "Seoul" },
        ],
    },
    {
        name: "Singapore",
    },
    {
        name: "Hong Kong",
    },
    {
        name: "China",
        children: [
        {
            name: "Beijing",
            children: [
            { name: "Dongcheng" },
            { name: "Xicheng" },
            { name: "Chaoyang" },
            { name: "Fengtai" },
            { name: "Shijingshan" },
            ],
        },
        {
            name: "Shanghai",
            children: [
            { name: "Huapu" },
            { name: "Xuhui" },
            { name: "Changning" },
            { name: "Jing'an" },
            { name: "Putuo" },
            ],
        },
        { name: "Guangzhou" },
        { name: "Suzhou" },
        { name: "Chengdu" },
        ],
    },
];
let keywordsFunction = function (item) {
    if (item === undefined || item === null) {
        return "";
    }
    return keywordsFieldName
        ? item[keywordsFieldName].toString()
        : item.toString();
};

<Cascader
    {label}
    {items}
    bind:value
    {minCharactersToSearch}
    {caseSensitive}
    {noResultsText}
    {borderColor}
    {labelColor}
    {helperText}
    {helperTextColor}
    {outlined}
    {clearable}
    {disabled}
    {hideDetails}
    {labelFieldName}
    {keywordsFieldName}
    {keywordsFunction} />`}`;

    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(h30, "class", "text-lg font-bold ml-3 mt-5 mb-3");
    			attr(div4, "class", "table-row font-bold");
    			attr(div9, "class", "table-row");
    			attr(div14, "class", "table-row");
    			attr(div19, "class", "table-row");
    			attr(div24, "class", "table-row");
    			attr(div29, "class", "table-row");
    			attr(div34, "class", "table-row");
    			attr(div39, "class", "table-row");
    			attr(div44, "class", "table-row");
    			attr(div49, "class", "table-row");
    			attr(div54, "class", "table-row");
    			attr(div59, "class", "table-row");
    			attr(div64, "class", "table-row");
    			attr(div69, "class", "table-row");
    			attr(div74, "class", "table-row");
    			attr(div79, "class", "table-row");
    			attr(div84, "class", "table-row");
    			attr(div85, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div86, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div87, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div88, "class", "table-cell py-3 px-3 border-b border-gray-400");
    			attr(div89, "class", "table-row");
    			attr(div90, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div91, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div92, "class", "my-2");
    			attr(div93, "class", "px-4");
    			attr(div94, "class", "px-4");
    			attr(div95, "class", "px-4");
    			attr(div96, "class", "px-4");
    			attr(div97, "class", "px-4");
    			attr(div98, "class", "w-full flex flex-row flex-wrap");
    			attr(div99, "class", "px-4 pb-2");
    			attr(div100, "class", "px-4 pb-2");
    			attr(div101, "class", "px-4 pb-2");
    			attr(div102, "class", "px-4 pb-2");
    			attr(div103, "class", "px-4 pb-2");
    			attr(div104, "class", "px-4 pb-2");
    			attr(div105, "class", "px-4 pb-2");
    			attr(div106, "class", "px-4 pb-2");
    			attr(div107, "class", "px-4 pb-2");
    			attr(div108, "class", "px-4 pb-2");
    			attr(div109, "class", "w-full flex flex-row flex-wrap");
    			attr(div110, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div111, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre1, "class", "my-2 bg-gray-200 rounded p-5 font-light text-sm");
    			toggle_class(pre1, "hidden", !/*showCode*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div90, anchor);
    			append(div90, h30);
    			append(div90, t3);
    			append(div90, div4);
    			append(div90, t11);
    			append(div90, div9);
    			append(div90, t19);
    			append(div90, div14);
    			append(div90, t27);
    			append(div90, div19);
    			append(div90, t35);
    			append(div90, div24);
    			append(div90, t43);
    			append(div90, div29);
    			append(div90, t51);
    			append(div90, div34);
    			append(div90, t59);
    			append(div90, div39);
    			append(div90, t67);
    			append(div90, div44);
    			append(div90, t75);
    			append(div90, div49);
    			append(div90, t83);
    			append(div90, div54);
    			append(div90, t91);
    			append(div90, div59);
    			append(div90, t99);
    			append(div90, div64);
    			append(div90, t107);
    			append(div90, div69);
    			append(div90, t115);
    			append(div90, div74);
    			append(div90, t123);
    			append(div90, div79);
    			append(div90, t131);
    			append(div90, div84);
    			append(div90, t139);
    			append(div90, div89);
    			append(div89, div85);
    			append(div89, t141);
    			append(div89, div86);
    			append(div89, t143);
    			append(div89, div87);
    			append(div89, t145);
    			append(div89, div88);
    			append(div88, pre0);
    			insert(target, t147, anchor);
    			insert(target, div111, anchor);
    			append(div111, h31);
    			append(h31, div91);
    			append(h31, t149);
    			mount_component(checkbox0, h31, null);
    			append(div111, t150);
    			append(div111, div92);
    			mount_component(cascader, div92, null);
    			append(div111, t151);
    			append(div111, div110);
    			append(div110, div98);
    			append(div98, div93);
    			mount_component(checkbox1, div93, null);
    			append(div98, t152);
    			append(div98, div94);
    			mount_component(checkbox2, div94, null);
    			append(div98, t153);
    			append(div98, div95);
    			mount_component(checkbox3, div95, null);
    			append(div98, t154);
    			append(div98, div96);
    			mount_component(checkbox4, div96, null);
    			append(div98, t155);
    			append(div98, div97);
    			mount_component(checkbox5, div97, null);
    			append(div110, t156);
    			append(div110, div109);
    			append(div109, div99);
    			mount_component(input0, div99, null);
    			append(div109, t157);
    			append(div109, div100);
    			mount_component(input1, div100, null);
    			append(div109, t158);
    			append(div109, div101);
    			mount_component(input2, div101, null);
    			append(div109, t159);
    			append(div109, div102);
    			mount_component(input3, div102, null);
    			append(div109, t160);
    			append(div109, div103);
    			mount_component(autocomplete0, div103, null);
    			append(div109, t161);
    			append(div109, div104);
    			mount_component(autocomplete1, div104, null);
    			append(div109, t162);
    			append(div109, div105);
    			mount_component(input4, div105, null);
    			append(div109, t163);
    			append(div109, div106);
    			mount_component(input5, div106, null);
    			append(div109, t164);
    			append(div109, div107);
    			mount_component(input6, div107, null);
    			append(div109, t165);
    			append(div109, div108);
    			mount_component(input7, div108, null);
    			insert(target, t166, anchor);
    			insert(target, pre1, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const checkbox0_changes = {};

    			if (dirty[1] & /*$$scope*/ 8) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty[0] & /*showCode*/ 32768) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[15];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const cascader_changes = {};
    			if (dirty[0] & /*label*/ 1) cascader_changes.label = /*label*/ ctx[0];
    			if (dirty[0] & /*minCharactersToSearch*/ 4) cascader_changes.minCharactersToSearch = /*minCharactersToSearch*/ ctx[2];
    			if (dirty[0] & /*caseSensitive*/ 16384) cascader_changes.caseSensitive = /*caseSensitive*/ ctx[14];
    			if (dirty[0] & /*noResultsText*/ 8) cascader_changes.noResultsText = /*noResultsText*/ ctx[3];
    			if (dirty[0] & /*borderColor*/ 128) cascader_changes.borderColor = /*borderColor*/ ctx[7];
    			if (dirty[0] & /*labelColor*/ 256) cascader_changes.labelColor = /*labelColor*/ ctx[8];
    			if (dirty[0] & /*helperText*/ 512) cascader_changes.helperText = /*helperText*/ ctx[9];
    			if (dirty[0] & /*helperTextColor*/ 1024) cascader_changes.helperTextColor = /*helperTextColor*/ ctx[10];
    			if (dirty[0] & /*outlined*/ 2048) cascader_changes.outlined = /*outlined*/ ctx[11];
    			if (dirty[0] & /*clearable*/ 16) cascader_changes.clearable = /*clearable*/ ctx[4];
    			if (dirty[0] & /*disabled*/ 32) cascader_changes.disabled = /*disabled*/ ctx[5];
    			if (dirty[0] & /*hideDetails*/ 64) cascader_changes.hideDetails = /*hideDetails*/ ctx[6];
    			if (dirty[0] & /*labelFieldName*/ 4096) cascader_changes.labelFieldName = /*labelFieldName*/ ctx[12];
    			if (dirty[0] & /*keywordsFieldName*/ 8192) cascader_changes.keywordsFieldName = /*keywordsFieldName*/ ctx[13];

    			if (!updating_value && dirty[0] & /*value*/ 2) {
    				updating_value = true;
    				cascader_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			cascader.$set(cascader_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty[0] & /*caseSensitive*/ 16384) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*caseSensitive*/ ctx[14];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty[0] & /*outlined*/ 2048) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*outlined*/ ctx[11];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_checked_3 && dirty[0] & /*clearable*/ 16) {
    				updating_checked_3 = true;
    				checkbox3_changes.checked = /*clearable*/ ctx[4];
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			const checkbox4_changes = {};

    			if (!updating_checked_4 && dirty[0] & /*disabled*/ 32) {
    				updating_checked_4 = true;
    				checkbox4_changes.checked = /*disabled*/ ctx[5];
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			checkbox4.$set(checkbox4_changes);
    			const checkbox5_changes = {};

    			if (!updating_checked_5 && dirty[0] & /*hideDetails*/ 64) {
    				updating_checked_5 = true;
    				checkbox5_changes.checked = /*hideDetails*/ ctx[6];
    				add_flush_callback(() => updating_checked_5 = false);
    			}

    			checkbox5.$set(checkbox5_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty[0] & /*label*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty[0] & /*value*/ 2) input1_changes.value = JSON.stringify(/*value*/ ctx[1]);
    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*minCharactersToSearch*/ 4) {
    				updating_value_2 = true;
    				input2_changes.value = /*minCharactersToSearch*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*noResultsText*/ 8) {
    				updating_value_3 = true;
    				input3_changes.value = /*noResultsText*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const autocomplete0_changes = {};

    			if (!updating_value_4 && dirty[0] & /*labelFieldName*/ 4096) {
    				updating_value_4 = true;
    				autocomplete0_changes.value = /*labelFieldName*/ ctx[12];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			autocomplete0.$set(autocomplete0_changes);
    			const autocomplete1_changes = {};

    			if (!updating_value_5 && dirty[0] & /*keywordsFieldName*/ 8192) {
    				updating_value_5 = true;
    				autocomplete1_changes.value = /*keywordsFieldName*/ ctx[13];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			autocomplete1.$set(autocomplete1_changes);
    			const input4_changes = {};

    			if (!updating_value_6 && dirty[0] & /*borderColor*/ 128) {
    				updating_value_6 = true;
    				input4_changes.value = /*borderColor*/ ctx[7];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_7 && dirty[0] & /*labelColor*/ 256) {
    				updating_value_7 = true;
    				input5_changes.value = /*labelColor*/ ctx[8];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_8 && dirty[0] & /*helperText*/ 512) {
    				updating_value_8 = true;
    				input6_changes.value = /*helperText*/ ctx[9];
    				add_flush_callback(() => updating_value_8 = false);
    			}

    			input6.$set(input6_changes);
    			const input7_changes = {};

    			if (!updating_value_9 && dirty[0] & /*helperTextColor*/ 1024) {
    				updating_value_9 = true;
    				input7_changes.value = /*helperTextColor*/ ctx[10];
    				add_flush_callback(() => updating_value_9 = false);
    			}

    			input7.$set(input7_changes);

    			if (dirty[0] & /*showCode*/ 32768) {
    				toggle_class(pre1, "hidden", !/*showCode*/ ctx[15]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(cascader.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			transition_in(checkbox4.$$.fragment, local);
    			transition_in(checkbox5.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(autocomplete0.$$.fragment, local);
    			transition_in(autocomplete1.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(cascader.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			transition_out(checkbox4.$$.fragment, local);
    			transition_out(checkbox5.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(autocomplete0.$$.fragment, local);
    			transition_out(autocomplete1.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div90);
    			if (detaching) detach(t147);
    			if (detaching) detach(div111);
    			destroy_component(checkbox0);
    			destroy_component(cascader);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_component(checkbox4);
    			destroy_component(checkbox5);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(autocomplete0);
    			destroy_component(autocomplete1);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    			if (detaching) detach(t166);
    			if (detaching) detach(pre1);
    		}
    	};
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let label = "City";

    	let items = [
    		{
    			name: "Malaysia",
    			children: [
    				{ name: "Kuala Lumpur" },
    				{ name: "Johor" },
    				{ name: "Selangor" },
    				{ name: "Negeri Sembilan" },
    				{ name: "Melaka" }
    			]
    		},
    		{
    			name: "Japan",
    			children: [
    				{ name: "Chiba" },
    				{ name: "Fukuoka" },
    				{ name: "Hamamatsu" },
    				{ name: "Hiroshima" },
    				{ name: "Kawasaki" }
    			]
    		},
    		{
    			name: "Korea",
    			children: [
    				{ name: "Damyang" },
    				{ name: "Deokjeokdo" },
    				{ name: "Busan" },
    				{ name: "Jinhae" },
    				{ name: "Seoul" }
    			]
    		},
    		{ name: "Singapore" },
    		{ name: "Hong Kong" },
    		{
    			name: "China",
    			children: [
    				{
    					name: "Beijing",
    					children: [
    						{ name: "Dongcheng" },
    						{ name: "Xicheng" },
    						{ name: "Chaoyang" },
    						{ name: "Fengtai" },
    						{ name: "Shijingshan" }
    					]
    				},
    				{
    					name: "Shanghai",
    					children: [
    						{ name: "Huapu" },
    						{ name: "Xuhui" },
    						{ name: "Changning" },
    						{ name: "Jing'an" },
    						{ name: "Putuo" }
    					]
    				},
    				{ name: "Guangzhou" },
    				{ name: "Suzhou" },
    				{ name: "Chengdu" }
    			]
    		}
    	];

    	let value = [];
    	let minCharactersToSearch = 0;
    	let noResultsText = "No results found";
    	let clearable = false;
    	let disabled = false;
    	let hideDetails = false;
    	let borderColor = "border-gray-700";
    	let labelColor = "text-gray-700";
    	let helperText = "search by typing";
    	let helperTextColor = "text-blue-700";
    	let outlined = false;
    	let labelFieldName = "name";
    	let keywordsFieldName = labelFieldName;
    	let caseSensitive = false;

    	let keywordsFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return keywordsFieldName
    		? item[keywordsFieldName].toString()
    		: item.toString();
    	};

    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(15, showCode);
    	}

    	function cascader_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox1_checked_binding(value) {
    		caseSensitive = value;
    		$$invalidate(14, caseSensitive);
    	}

    	function checkbox2_checked_binding(value) {
    		outlined = value;
    		$$invalidate(11, outlined);
    	}

    	function checkbox3_checked_binding(value) {
    		clearable = value;
    		$$invalidate(4, clearable);
    	}

    	function checkbox4_checked_binding(value) {
    		disabled = value;
    		$$invalidate(5, disabled);
    	}

    	function checkbox5_checked_binding(value) {
    		hideDetails = value;
    		$$invalidate(6, hideDetails);
    	}

    	function input0_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input2_value_binding(value) {
    		minCharactersToSearch = value;
    		$$invalidate(2, minCharactersToSearch);
    	}

    	function input3_value_binding(value) {
    		noResultsText = value;
    		$$invalidate(3, noResultsText);
    	}

    	function autocomplete0_value_binding(value) {
    		labelFieldName = value;
    		$$invalidate(12, labelFieldName);
    	}

    	function autocomplete1_value_binding(value) {
    		keywordsFieldName = value;
    		$$invalidate(13, keywordsFieldName);
    	}

    	function input4_value_binding(value) {
    		borderColor = value;
    		$$invalidate(7, borderColor);
    	}

    	function input5_value_binding(value) {
    		labelColor = value;
    		$$invalidate(8, labelColor);
    	}

    	function input6_value_binding(value) {
    		helperText = value;
    		$$invalidate(9, helperText);
    	}

    	function input7_value_binding(value) {
    		helperTextColor = value;
    		$$invalidate(10, helperTextColor);
    	}

    	return [
    		label,
    		value,
    		minCharactersToSearch,
    		noResultsText,
    		clearable,
    		disabled,
    		hideDetails,
    		borderColor,
    		labelColor,
    		helperText,
    		helperTextColor,
    		outlined,
    		labelFieldName,
    		keywordsFieldName,
    		caseSensitive,
    		showCode,
    		items,
    		keywordsFunction,
    		checkbox0_checked_binding,
    		cascader_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		checkbox3_checked_binding,
    		checkbox4_checked_binding,
    		checkbox5_checked_binding,
    		input0_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		autocomplete0_value_binding,
    		autocomplete1_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding,
    		input7_value_binding
    	];
    }

    class CascaderGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$r, create_fragment$t, safe_not_equal, {}, [-1, -1]);
    	}
    }

    /* src\widgets\Toggle.svelte generated by Svelte v3.31.0 */

    function create_else_block$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (44:4) {#if label}
    function create_if_block$b(ctx) {
    	let span;
    	let t;
    	let span_class_value;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*label*/ ctx[1]);
    			attr(span, "class", span_class_value = "" + (null_to_empty(/*textColor*/ ctx[2]) + " svelte-6kopti"));
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*label*/ 2) set_data(t, /*label*/ ctx[1]);

    			if (dirty & /*textColor*/ 4 && span_class_value !== (span_class_value = "" + (null_to_empty(/*textColor*/ ctx[2]) + " svelte-6kopti"))) {
    				attr(span, "class", span_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment$u(ctx) {
    	let label_1;
    	let div2;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let div1_class_value;
    	let t2;
    	let div3;
    	let current_block_type_index;
    	let if_block;
    	let label_1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$b, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*label*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			label_1 = element("label");
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div3 = element("div");
    			if_block.c();
    			attr(input, "type", "checkbox");
    			attr(input, "class", "hidden svelte-6kopti");
    			input.disabled = /*disabled*/ ctx[5];
    			attr(div0, "class", "toggle__line w-10 h-4 bg-gray-400 rounded-full shadow-inner");

    			attr(div1, "class", div1_class_value = "toggle__dot absolute w-6 h-6 " + (/*value*/ ctx[0]
    			? /*trueColor*/ ctx[3]
    			: /*falseColor*/ ctx[4]) + " rounded-full shadow inset-y-0 left-0" + " svelte-6kopti");

    			attr(div2, "class", "relative");
    			attr(div3, "class", "ml-3");

    			attr(label_1, "class", label_1_class_value = "flex items-center " + (/*disabled*/ ctx[5]
    			? "cursor-not-allowed"
    			: "cursor-pointer"));

    			attr(label_1, "disabled", /*disabled*/ ctx[5]);
    		},
    		m(target, anchor) {
    			insert(target, label_1, anchor);
    			append(label_1, div2);
    			append(div2, input);
    			input.checked = /*value*/ ctx[0];
    			append(div2, t0);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(label_1, t2);
    			append(label_1, div3);
    			if_blocks[current_block_type_index].m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(input, "change", /*input_change_handler*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*disabled*/ 32) {
    				input.disabled = /*disabled*/ ctx[5];
    			}

    			if (dirty & /*value*/ 1) {
    				input.checked = /*value*/ ctx[0];
    			}

    			if (!current || dirty & /*value, trueColor, falseColor*/ 25 && div1_class_value !== (div1_class_value = "toggle__dot absolute w-6 h-6 " + (/*value*/ ctx[0]
    			? /*trueColor*/ ctx[3]
    			: /*falseColor*/ ctx[4]) + " rounded-full shadow inset-y-0 left-0" + " svelte-6kopti")) {
    				attr(div1, "class", div1_class_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div3, null);
    			}

    			if (!current || dirty & /*disabled*/ 32 && label_1_class_value !== (label_1_class_value = "flex items-center " + (/*disabled*/ ctx[5]
    			? "cursor-not-allowed"
    			: "cursor-pointer"))) {
    				attr(label_1, "class", label_1_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 32) {
    				attr(label_1, "disabled", /*disabled*/ ctx[5]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(label_1);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	let { label = "" } = $$props;
    	let { value = false } = $$props;
    	let { textColor = "text-black" } = $$props;
    	let { trueColor = "bg-black" } = $$props;
    	let { falseColor = "bg-white" } = $$props;
    	let { disabled = false } = $$props;

    	function input_change_handler() {
    		value = this.checked;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("textColor" in $$props) $$invalidate(2, textColor = $$props.textColor);
    		if ("trueColor" in $$props) $$invalidate(3, trueColor = $$props.trueColor);
    		if ("falseColor" in $$props) $$invalidate(4, falseColor = $$props.falseColor);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	return [
    		value,
    		label,
    		textColor,
    		trueColor,
    		falseColor,
    		disabled,
    		$$scope,
    		slots,
    		input_change_handler
    	];
    }

    class Toggle extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$s, create_fragment$u, safe_not_equal, {
    			label: 1,
    			value: 0,
    			textColor: 2,
    			trueColor: 3,
    			falseColor: 4,
    			disabled: 5
    		});
    	}
    }

    /* src\components\ToggleGuide.svelte generated by Svelte v3.31.0 */

    function create_default_slot$b(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Show Code");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$v(ctx) {
    	let h2;
    	let t1;
    	let div35;
    	let t59;
    	let div47;
    	let h31;
    	let div36;
    	let t61;
    	let checkbox0;
    	let updating_checked;
    	let t62;
    	let div37;
    	let toggle;
    	let updating_value;
    	let t63;
    	let div46;
    	let div40;
    	let div38;
    	let checkbox1;
    	let updating_checked_1;
    	let t64;
    	let div39;
    	let checkbox2;
    	let updating_checked_2;
    	let t65;
    	let div45;
    	let div41;
    	let input0;
    	let updating_value_1;
    	let t66;
    	let div42;
    	let input1;
    	let updating_value_2;
    	let t67;
    	let div43;
    	let input2;
    	let updating_value_3;
    	let t68;
    	let div44;
    	let input3;
    	let updating_value_4;
    	let t69;
    	let pre;
    	let current;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[7].call(null, value);
    	}

    	let checkbox0_props = {
    		$$slots: { default: [create_default_slot$b] },
    		$$scope: { ctx }
    	};

    	if (/*showCode*/ ctx[6] !== void 0) {
    		checkbox0_props.checked = /*showCode*/ ctx[6];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props });
    	binding_callbacks.push(() => bind(checkbox0, "checked", checkbox0_checked_binding));

    	function toggle_value_binding(value) {
    		/*toggle_value_binding*/ ctx[8].call(null, value);
    	}

    	let toggle_props = {
    		label: /*label*/ ctx[0],
    		textColor: /*textColor*/ ctx[2],
    		trueColor: /*trueColor*/ ctx[3],
    		falseColor: /*falseColor*/ ctx[4],
    		disabled: /*disabled*/ ctx[5]
    	};

    	if (/*value*/ ctx[1] !== void 0) {
    		toggle_props.value = /*value*/ ctx[1];
    	}

    	toggle = new Toggle({ props: toggle_props });
    	binding_callbacks.push(() => bind(toggle, "value", toggle_value_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[9].call(null, value);
    	}

    	let checkbox1_props = { label: "value" };

    	if (/*value*/ ctx[1] !== void 0) {
    		checkbox1_props.checked = /*value*/ ctx[1];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props });
    	binding_callbacks.push(() => bind(checkbox1, "checked", checkbox1_checked_binding));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[10].call(null, value);
    	}

    	let checkbox2_props = { label: "disabled" };

    	if (/*disabled*/ ctx[5] !== void 0) {
    		checkbox2_props.checked = /*disabled*/ ctx[5];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props });
    	binding_callbacks.push(() => bind(checkbox2, "checked", checkbox2_checked_binding));

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[11].call(null, value);
    	}

    	let input0_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "label"
    	};

    	if (/*label*/ ctx[0] !== void 0) {
    		input0_props.value = /*label*/ ctx[0];
    	}

    	input0 = new Input({ props: input0_props });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[12].call(null, value);
    	}

    	let input1_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "textColor"
    	};

    	if (/*textColor*/ ctx[2] !== void 0) {
    		input1_props.value = /*textColor*/ ctx[2];
    	}

    	input1 = new Input({ props: input1_props });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[13].call(null, value);
    	}

    	let input2_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "trueColor"
    	};

    	if (/*trueColor*/ ctx[3] !== void 0) {
    		input2_props.value = /*trueColor*/ ctx[3];
    	}

    	input2 = new Input({ props: input2_props });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[14].call(null, value);
    	}

    	let input3_props = {
    		hideDetails: true,
    		outlined: true,
    		label: "falseColor"
    	};

    	if (/*falseColor*/ ctx[4] !== void 0) {
    		input3_props.value = /*falseColor*/ ctx[4];
    	}

    	input3 = new Input({ props: input3_props });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Toggle";
    			t1 = space();
    			div35 = element("div");

    			div35.innerHTML = `<h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3> 
    <div class="table-row font-bold"><div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div></div> 
    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">label</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">The label text of the toggle.</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">&#39;&#39;</div></div> 
    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">value</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">The value of the checkbox.</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div> 

    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">textColor</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the label. Accepts Tailwindcss text color</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">text-black</div></div> 
    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">trueColor</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the toggle when value is true. Accepts Tailwindcss background color</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">bg-red-600</div></div> 
    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">falseColor</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">The color of the toggle when value is false. Accepts Tailwindcss background color</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">string</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">bg-red-100</div></div> 
    <div class="table-row"><div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">Whether the checkbox is disabled.</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div> 
      <div class="table-cell py-3 px-3 border-b border-gray-400">false</div></div>`;

    			t59 = space();
    			div47 = element("div");
    			h31 = element("h3");
    			div36 = element("div");
    			div36.textContent = "Demo";
    			t61 = space();
    			create_component(checkbox0.$$.fragment);
    			t62 = space();
    			div37 = element("div");
    			create_component(toggle.$$.fragment);
    			t63 = space();
    			div46 = element("div");
    			div40 = element("div");
    			div38 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t64 = space();
    			div39 = element("div");
    			create_component(checkbox2.$$.fragment);
    			t65 = space();
    			div45 = element("div");
    			div41 = element("div");
    			create_component(input0.$$.fragment);
    			t66 = space();
    			div42 = element("div");
    			create_component(input1.$$.fragment);
    			t67 = space();
    			div43 = element("div");
    			create_component(input2.$$.fragment);
    			t68 = space();
    			div44 = element("div");
    			create_component(input3.$$.fragment);
    			t69 = space();
    			pre = element("pre");
    			pre.textContent = `${``}`;
    			attr(h2, "class", "text-xl ml-4 font-semibold my-6");
    			attr(div35, "class", "bg-gray-200 rounded my-4 px-4 table w-full");
    			attr(div36, "class", "text-lg font-bold");
    			attr(h31, "class", "mx-2 mb-2 flex justify-between");
    			attr(div37, "class", "mt-2 mb-1");
    			attr(div38, "class", "px-4");
    			attr(div39, "class", "px-4");
    			attr(div40, "class", "w-full flex flex-row flex-wrap");
    			attr(div41, "class", "px-4 pb-2");
    			attr(div42, "class", "px-4 pb-2");
    			attr(div43, "class", "px-4 pb-2");
    			attr(div44, "class", "px-4 pb-2");
    			attr(div45, "class", "w-full flex flex-row flex-wrap");
    			attr(div46, "class", "border border-gray-500 rounded px-3 py-4 w-full");
    			attr(div47, "class", "bg-gray-200 rounded p-4 w-full");
    			attr(pre, "class", "my-2 bg-gray-200 rounded p-5 font-light");
    			toggle_class(pre, "hidden", !/*showCode*/ ctx[6]);
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t1, anchor);
    			insert(target, div35, anchor);
    			insert(target, t59, anchor);
    			insert(target, div47, anchor);
    			append(div47, h31);
    			append(h31, div36);
    			append(h31, t61);
    			mount_component(checkbox0, h31, null);
    			append(div47, t62);
    			append(div47, div37);
    			mount_component(toggle, div37, null);
    			append(div47, t63);
    			append(div47, div46);
    			append(div46, div40);
    			append(div40, div38);
    			mount_component(checkbox1, div38, null);
    			append(div40, t64);
    			append(div40, div39);
    			mount_component(checkbox2, div39, null);
    			append(div46, t65);
    			append(div46, div45);
    			append(div45, div41);
    			mount_component(input0, div41, null);
    			append(div45, t66);
    			append(div45, div42);
    			mount_component(input1, div42, null);
    			append(div45, t67);
    			append(div45, div43);
    			mount_component(input2, div43, null);
    			append(div45, t68);
    			append(div45, div44);
    			mount_component(input3, div44, null);
    			insert(target, t69, anchor);
    			insert(target, pre, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const checkbox0_changes = {};

    			if (dirty & /*$$scope*/ 32768) {
    				checkbox0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*showCode*/ 64) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showCode*/ ctx[6];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const toggle_changes = {};
    			if (dirty & /*label*/ 1) toggle_changes.label = /*label*/ ctx[0];
    			if (dirty & /*textColor*/ 4) toggle_changes.textColor = /*textColor*/ ctx[2];
    			if (dirty & /*trueColor*/ 8) toggle_changes.trueColor = /*trueColor*/ ctx[3];
    			if (dirty & /*falseColor*/ 16) toggle_changes.falseColor = /*falseColor*/ ctx[4];
    			if (dirty & /*disabled*/ 32) toggle_changes.disabled = /*disabled*/ ctx[5];

    			if (!updating_value && dirty & /*value*/ 2) {
    				updating_value = true;
    				toggle_changes.value = /*value*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			toggle.$set(toggle_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty & /*value*/ 2) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*value*/ ctx[1];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_checked_2 && dirty & /*disabled*/ 32) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*disabled*/ ctx[5];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const input0_changes = {};

    			if (!updating_value_1 && dirty & /*label*/ 1) {
    				updating_value_1 = true;
    				input0_changes.value = /*label*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_2 && dirty & /*textColor*/ 4) {
    				updating_value_2 = true;
    				input1_changes.value = /*textColor*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_3 && dirty & /*trueColor*/ 8) {
    				updating_value_3 = true;
    				input2_changes.value = /*trueColor*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_4 && dirty & /*falseColor*/ 16) {
    				updating_value_4 = true;
    				input3_changes.value = /*falseColor*/ ctx[4];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);

    			if (dirty & /*showCode*/ 64) {
    				toggle_class(pre, "hidden", !/*showCode*/ ctx[6]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(toggle.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(toggle.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h2);
    			if (detaching) detach(t1);
    			if (detaching) detach(div35);
    			if (detaching) detach(t59);
    			if (detaching) detach(div47);
    			destroy_component(checkbox0);
    			destroy_component(toggle);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			if (detaching) detach(t69);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let label = "Toggle with label";
    	let value = false;
    	let textColor = "text-green-500";
    	let trueColor = "bg-red-600";
    	let falseColor = "bg-blue-600";
    	let disabled = false;
    	let showCode = false;

    	function checkbox0_checked_binding(value) {
    		showCode = value;
    		$$invalidate(6, showCode);
    	}

    	function toggle_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox1_checked_binding(value$1) {
    		value = value$1;
    		$$invalidate(1, value);
    	}

    	function checkbox2_checked_binding(value) {
    		disabled = value;
    		$$invalidate(5, disabled);
    	}

    	function input0_value_binding(value) {
    		label = value;
    		$$invalidate(0, label);
    	}

    	function input1_value_binding(value) {
    		textColor = value;
    		$$invalidate(2, textColor);
    	}

    	function input2_value_binding(value) {
    		trueColor = value;
    		$$invalidate(3, trueColor);
    	}

    	function input3_value_binding(value) {
    		falseColor = value;
    		$$invalidate(4, falseColor);
    	}

    	return [
    		label,
    		value,
    		textColor,
    		trueColor,
    		falseColor,
    		disabled,
    		showCode,
    		checkbox0_checked_binding,
    		toggle_value_binding,
    		checkbox1_checked_binding,
    		checkbox2_checked_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding
    	];
    }

    class ToggleGuide extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$t, create_fragment$v, safe_not_equal, {});
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (59:8) {#each items as item}
    function create_each_block$2(ctx) {
    	let li;
    	let t0_value = /*item*/ ctx[3].text + "";
    	let t0;
    	let t1;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*item*/ ctx[3]);
    	}

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();

    			attr(li, "class", li_class_value = `px-4 py-3 my-1 ${/*selectedComponent*/ ctx[0].text === /*item*/ ctx[3].text
			? "rounded bg-gray-600 text-white font-medium tracking-wide"
			: "cursor-pointer"}`);
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);

    			if (!mounted) {
    				dispose = listen(li, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedComponent*/ 1 && li_class_value !== (li_class_value = `px-4 py-3 my-1 ${/*selectedComponent*/ ctx[0].text === /*item*/ ctx[3].text
			? "rounded bg-gray-600 text-white font-medium tracking-wide"
			: "cursor-pointer"}`)) {
    				attr(li, "class", li_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$w(ctx) {
    	let tailwindcss;
    	let t0;
    	let div5;
    	let div1;
    	let div0;
    	let t2;
    	let a;
    	let github;
    	let t3;
    	let div4;
    	let div2;
    	let ul;
    	let t4;
    	let div3;
    	let switch_instance;
    	let current;
    	tailwindcss = new Tailwindcss({});
    	github = new Github({});
    	let each_value = /*items*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	var switch_value = /*selectedComponent*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			create_component(tailwindcss.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<span class="ml-6 text-xl font-semibold text-blue-900">SVETAMAT</span>`;
    			t2 = space();
    			a = element("a");
    			create_component(github.$$.fragment);
    			t3 = space();
    			div4 = element("div");
    			div2 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(div0, "class", "flex items-center");
    			attr(a, "class", "flex items-center mr-6");
    			attr(a, "href", "https://github.com/tianhai82/svetamat");
    			attr(div1, "class", "bg-gray-100 flex-shrink-0 h-16 mt-0 z-40 flex items-center\r\n      justify-between elevation-4 static");
    			attr(ul, "class", "mx-3 py-3");
    			attr(div2, "class", "h-full w-56 bg-gray-700 text-gray-100 overflow-y-auto flex-shrink-0");
    			attr(div3, "class", "h-full flex-grow px-4 pt-2 overflow-y-auto");
    			attr(div4, "class", "flex-grow flex flex-row h-0");
    			attr(div5, "class", "h-full flex flex-col");
    		},
    		m(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div5, anchor);
    			append(div5, div1);
    			append(div1, div0);
    			append(div1, t2);
    			append(div1, a);
    			mount_component(github, a, null);
    			append(div5, t3);
    			append(div5, div4);
    			append(div4, div2);
    			append(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append(div4, t4);
    			append(div4, div3);

    			if (switch_instance) {
    				mount_component(switch_instance, div3, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*selectedComponent, items*/ 3) {
    				each_value = /*items*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (switch_value !== (switch_value = /*selectedComponent*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div3, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(github.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(github.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div5);
    			destroy_component(github);
    			destroy_each(each_blocks, detaching);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};
    }

    function instance$u($$self, $$props, $$invalidate) {
    	const items = [
    		{
    			text: "Installation",
    			component: Installation
    		},
    		{ text: "Button", component: ButtonGuide },
    		{ text: "Dialog", component: DialogGuide },
    		{
    			text: "Navigation Drawer",
    			component: NavigationDrawerGuide
    		},
    		{
    			text: "Progress",
    			component: ProgressGuide
    		},
    		{ text: "Spinner", component: SpinnerGuide },
    		{ text: "Input", component: InputGuide },
    		{
    			text: "Text Area",
    			component: TextAreaGuide
    		},
    		{
    			text: "File Input",
    			component: FileInputGuide
    		},
    		{
    			text: "Checkbox",
    			component: CheckboxGuide
    		},
    		{ text: "Toggle", component: ToggleGuide },
    		{ text: "Slider", component: SliderGuide },
    		{
    			text: "Auto Complete",
    			component: AutocompleteGuide
    		},
    		{
    			text: "Cascader",
    			component: CascaderGuide
    		}
    	];

    	let selectedComponent = {
    		text: "Installation",
    		component: Installation
    	};

    	const click_handler = item => $$invalidate(0, selectedComponent = item);
    	return [selectedComponent, items, click_handler];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$u, create_fragment$w, safe_not_equal, {});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
