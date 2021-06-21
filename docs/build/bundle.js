
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

    /* src/components/Chart.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/components/Chart.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (47:2) {#each names as name, i}
    function create_each_block$1(ctx) {
    	let g;
    	let path;
    	let path_d_value;
    	let text_1;
    	let t_value = /*name*/ ctx[15] + "";
    	let t;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			path = svg_element("path");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(path, "d", path_d_value = `M 50 50 L 50 0 A 50 50 0 0 1 ${/*x*/ ctx[2]} ${/*y*/ ctx[3]}`);
    			attr_dev(path, "class", "svelte-d6zw9w");
    			add_location(path, file$3, 48, 6, 1415);
    			set_style(text_1, "transform", "rotate(" + /*textAngle*/ ctx[4] + "rad)");
    			attr_dev(text_1, "x", "97");
    			attr_dev(text_1, "y", "53");
    			attr_dev(text_1, "class", "svelte-d6zw9w");
    			add_location(text_1, file$3, 49, 6, 1475);
    			set_style(g, "transform", "rotate(" + /*sectorAngle*/ ctx[1] * /*i*/ ctx[17] + "rad)");
    			attr_dev(g, "class", "svelte-d6zw9w");
    			add_location(g, file$3, 47, 4, 1357);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, path);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, y*/ 12 && path_d_value !== (path_d_value = `M 50 50 L 50 0 A 50 50 0 0 1 ${/*x*/ ctx[2]} ${/*y*/ ctx[3]}`)) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*names*/ 1 && t_value !== (t_value = /*name*/ ctx[15] + "")) set_data_dev(t, t_value);

    			if (dirty & /*textAngle*/ 16) {
    				set_style(text_1, "transform", "rotate(" + /*textAngle*/ ctx[4] + "rad)");
    			}

    			if (dirty & /*sectorAngle*/ 2) {
    				set_style(g, "transform", "rotate(" + /*sectorAngle*/ ctx[1] * /*i*/ ctx[17] + "rad)");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(47:2) {#each names as name, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let svg;
    	let image;
    	let mounted;
    	let dispose;
    	let each_value = /*names*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			image = svg_element("image");
    			set_style(image, "transform", "rotate(" + /*rotation*/ ctx[6] + "rad)");
    			attr_dev(image, "href", "/bottle.png");
    			attr_dev(image, "x", "42.5");
    			attr_dev(image, "y", "5");
    			attr_dev(image, "class", "svelte-d6zw9w");
    			add_location(image, file$3, 52, 2, 1572);
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			attr_dev(svg, "class", "svelte-d6zw9w");
    			add_location(svg, file$3, 45, 0, 1280);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, image);
    			/*image_binding*/ ctx[9](image);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*spin*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sectorAngle, textAngle, names, x, y*/ 31) {
    				each_value = /*names*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, image);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*rotation*/ 64) {
    				set_style(image, "transform", "rotate(" + /*rotation*/ ctx[6] + "rad)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    			/*image_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart", slots, []);
    	let { names } = $$props;
    	let { index = 0 } = $$props;
    	const CIRCLE = Math.PI * 2;
    	let sectorAngle;
    	let x;
    	let y;
    	let textAngle;
    	let bottle;
    	let timeout;
    	let rotation = 0.1;
    	let spinning = false;

    	function spin() {
    		clearTimeout(timeout);
    		let newIndex;
    		let newRotation;

    		do {
    			newRotation = rotation + CIRCLE * 3 + Math.random() * CIRCLE;
    			newIndex = getIndexFromAngle(newRotation);
    		} while (index === newIndex);

    		$$invalidate(6, rotation = newRotation);
    		timeout = setTimeout(() => spinning = false, 2050);
    		spinning = true;
    		update();
    	}

    	function getIndexFromAngle(angle) {
    		return Math.floor(angle % CIRCLE / CIRCLE * names.length);
    	}

    	function update() {
    		if (spinning) {
    			const transform = getComputedStyle(bottle).getPropertyValue("transform");
    			const [a, b] = transform.substring(7, transform.length - 1).split(", ").map(parseFloat);
    			const angle = Math.atan2(b, a);
    			const normalized = angle < 0 ? angle + CIRCLE : angle;
    			$$invalidate(8, index = getIndexFromAngle(normalized));
    			requestAnimationFrame(update);
    		}
    	}

    	const writable_props = ["names", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	function image_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			bottle = $$value;
    			$$invalidate(5, bottle);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("index" in $$props) $$invalidate(8, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		names,
    		index,
    		CIRCLE,
    		sectorAngle,
    		x,
    		y,
    		textAngle,
    		bottle,
    		timeout,
    		rotation,
    		spinning,
    		spin,
    		getIndexFromAngle,
    		update
    	});

    	$$self.$inject_state = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("index" in $$props) $$invalidate(8, index = $$props.index);
    		if ("sectorAngle" in $$props) $$invalidate(1, sectorAngle = $$props.sectorAngle);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("textAngle" in $$props) $$invalidate(4, textAngle = $$props.textAngle);
    		if ("bottle" in $$props) $$invalidate(5, bottle = $$props.bottle);
    		if ("timeout" in $$props) timeout = $$props.timeout;
    		if ("rotation" in $$props) $$invalidate(6, rotation = $$props.rotation);
    		if ("spinning" in $$props) spinning = $$props.spinning;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*names, sectorAngle*/ 3) {
    			{
    				$$invalidate(1, sectorAngle = CIRCLE / names.length);
    				$$invalidate(2, x = 50 * Math.sin(sectorAngle) + 50);
    				$$invalidate(3, y = -50 * Math.cos(sectorAngle) + 50);
    				$$invalidate(4, textAngle = sectorAngle / 2 - CIRCLE / 4);
    			}
    		}
    	};

    	return [
    		names,
    		sectorAngle,
    		x,
    		y,
    		textAngle,
    		bottle,
    		rotation,
    		spin,
    		index,
    		image_binding
    	];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { names: 0, index: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*names*/ ctx[0] === undefined && !("names" in props)) {
    			console.warn("<Chart> was created without expected prop 'names'");
    		}
    	}

    	get names() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set names(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Chart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Chart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Input.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/components/Input.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			attr_dev(input, "class", "svelte-12rn3mo");
    			add_location(input, file$2, 12, 2, 328);
    			attr_dev(div, "class", "svelte-12rn3mo");
    			add_location(div, file$2, 11, 0, 320);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*onAdd*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let { placeholder = "Add a new name..." } = $$props;
    	const dispatch = createEventDispatcher();

    	function onAdd({ currentTarget }) {
    		if (currentTarget.value) {
    			dispatch("add", currentTarget.value);
    			currentTarget.value = "";
    		}
    	}

    	const writable_props = ["placeholder"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({
    		placeholder,
    		createEventDispatcher,
    		dispatch,
    		onAdd
    	});

    	$$self.$inject_state = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, onAdd];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { placeholder: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/List.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/components/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (11:2) {#each names as name, i}
    function create_each_block(ctx) {
    	let li;
    	let span;
    	let t0_value = /*name*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			button.textContent = "X";
    			t3 = space();
    			add_location(span, file$1, 12, 6, 290);
    			attr_dev(button, "class", "svelte-1j3jrup");
    			add_location(button, file$1, 13, 6, 316);
    			attr_dev(li, "class", "svelte-1j3jrup");
    			toggle_class(li, "active", /*i*/ ctx[7] === /*index*/ ctx[1]);
    			add_location(li, file$1, 11, 4, 250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span);
    			append_dev(span, t0);
    			append_dev(li, t1);
    			append_dev(li, button);
    			append_dev(li, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*names*/ 1 && t0_value !== (t0_value = /*name*/ ctx[5] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*index*/ 2) {
    				toggle_class(li, "active", /*i*/ ctx[7] === /*index*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(11:2) {#each names as name, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ol;
    	let each_value = /*names*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ol, "class", "svelte-1j3jrup");
    			add_location(ol, file$1, 9, 0, 214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*index, onClick, names*/ 7) {
    				each_value = /*names*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
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
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { names } = $$props;
    	let { index } = $$props;
    	const dispatch = createEventDispatcher();

    	function onClick(index) {
    		dispatch("remove", index);
    	}

    	const writable_props = ["names", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => onClick(i);

    	$$self.$$set = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		names,
    		index,
    		createEventDispatcher,
    		dispatch,
    		onClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [names, index, onClick, click_handler];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { names: 0, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*names*/ ctx[0] === undefined && !("names" in props)) {
    			console.warn("<List> was created without expected prop 'names'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console.warn("<List> was created without expected prop 'index'");
    		}
    	}

    	get names() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set names(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (22:2) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Add at least 3 names to proceed";
    			attr_dev(h1, "class", "svelte-1ksq555");
    			add_location(h1, file, 22, 3, 549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if names.length > 2}
    function create_if_block(ctx) {
    	let chart;
    	let updating_index;
    	let t0;
    	let h1;
    	let t1;
    	let current;

    	function chart_index_binding(value) {
    		/*chart_index_binding*/ ctx[5](value);
    	}

    	let chart_props = { names: /*names*/ ctx[0] };

    	if (/*index*/ ctx[1] !== void 0) {
    		chart_props.index = /*index*/ ctx[1];
    	}

    	chart = new Chart({ props: chart_props, $$inline: true });
    	binding_callbacks.push(() => bind(chart, "index", chart_index_binding));

    	const block = {
    		c: function create() {
    			create_component(chart.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(/*name*/ ctx[2]);
    			attr_dev(h1, "class", "svelte-1ksq555");
    			add_location(h1, file, 20, 3, 520);
    		},
    		m: function mount(target, anchor) {
    			mount_component(chart, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const chart_changes = {};
    			if (dirty & /*names*/ 1) chart_changes.names = /*names*/ ctx[0];

    			if (!updating_index && dirty & /*index*/ 2) {
    				updating_index = true;
    				chart_changes.index = /*index*/ ctx[1];
    				add_flush_callback(() => updating_index = false);
    			}

    			chart.$set(chart_changes);
    			if (!current || dirty & /*name*/ 4) set_data_dev(t1, /*name*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(chart, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:2) {#if names.length > 2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let section;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let aside;
    	let input;
    	let t1;
    	let list;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*names*/ ctx[0].length > 2) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	input = new Input({ $$inline: true });
    	input.$on("add", /*addName*/ ctx[3]);

    	list = new List({
    			props: {
    				index: /*index*/ ctx[1],
    				names: /*names*/ ctx[0]
    			},
    			$$inline: true
    		});

    	list.$on("remove", /*removeName*/ ctx[4]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			if_block.c();
    			t0 = space();
    			aside = element("aside");
    			create_component(input.$$.fragment);
    			t1 = space();
    			create_component(list.$$.fragment);
    			attr_dev(section, "class", "svelte-1ksq555");
    			add_location(section, file, 17, 1, 442);
    			attr_dev(aside, "class", "svelte-1ksq555");
    			add_location(aside, file, 25, 1, 611);
    			attr_dev(main, "class", "svelte-1ksq555");
    			add_location(main, file, 16, 0, 434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			if_blocks[current_block_type_index].m(section, null);
    			append_dev(main, t0);
    			append_dev(main, aside);
    			mount_component(input, aside, null);
    			append_dev(aside, t1);
    			mount_component(list, aside, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block.m(section, null);
    			}

    			const list_changes = {};
    			if (dirty & /*index*/ 2) list_changes.index = /*index*/ ctx[1];
    			if (dirty & /*names*/ 1) list_changes.names = /*names*/ ctx[0];
    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(input.$$.fragment, local);
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(input.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			destroy_component(input);
    			destroy_component(list);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let names = ["Alice", "Bob", "Charlie"];
    	let name;
    	let index = -1;

    	function addName({ detail }) {
    		$$invalidate(0, names = [...names, detail]);
    	}

    	function removeName({ detail }) {
    		names.splice(detail, 1);
    		$$invalidate(0, names);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function chart_index_binding(value) {
    		index = value;
    		$$invalidate(1, index);
    	}

    	$$self.$capture_state = () => ({
    		Chart,
    		Input,
    		List,
    		names,
    		name,
    		index,
    		addName,
    		removeName
    	});

    	$$self.$inject_state = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*names, index*/ 3) {
    			$$invalidate(2, name = names[index] || "Click on the bottle!");
    		}
    	};

    	return [names, index, name, addName, removeName, chart_index_binding];
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

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
