import _ from 'lodash';
import { format } from 'util';

/**
 * @param fun A **pure** function to memoize. It will only be called once for each new argument list. Note that it *might* not work with `Promise`s, use `memoizeAsync` instead.
 * @returns `f` is the memoized input `fun`, `flush` clears cache.
 */
export function memoize<Args extends any[], Ret>(fun: (...args: Args) => Ret): {
	f(...args: Args): Ret;
	flush(): void;
} {
	const CALCULATING = {} as unknown as Ret;
	const m = new Map<Args, Ret>();
	return {
		f: (...args: Args) => {
			let p: [Args, Ret];
			if (p = [...m.entries()].find(([a]) => _.isEqual(args, a))) {
				while ((p = [...m.entries()].find(([a]) => _.isEqual(args, a)))[1] === CALCULATING) {
					console.log(`${fun.name} is being calculated...`);
				}
				console.log(`Memoized ${fun.name}`);
				return p[1];
			} else {
				m.set(args, CALCULATING);
				console.log(`Calculating ${fun.name}...`);
				let v = fun(...args);
				m.set(args, v);
				return v;
			}
		},
		flush: () => m.clear()
	}
}

/**
 * @param fun A **pure** function to memoize. It will only be called once for each new argument list.
 * @returns `f` is the memoized input `fun`, `flush` clears cache.
 */
export function memoizeAsync<Args extends any[], Ret>(fun: (...args: Args) => Promise<Ret>): {
	f(...args: Args): Promise<Ret>;
	flush(): void;
} {
	const CALCULATING = {} as unknown as Ret;
	const m = new Map<Args, Ret>();
	return {
		f: async (...args: Args) => {
			let p: [Args, Ret];
			if (p = [...m.entries()].find(([a]) => _.isEqual(args, a))) {
				while ((p = [...m.entries()].find(([a]) => _.isEqual(args, a)))[1] === CALCULATING) {
					console.log(`${fun.name} is being calculated...`);
					await (new Promise(res => setTimeout(res, 1000)));
				}
				console.log(`Memoized ${fun.name}`);
				return p[1];
			} else {
				m.set(args, CALCULATING);
				console.log(`Calculating ${fun.name}...`);
				let v = await fun(...args);
				m.set(args, v);
				return v;
			}
		},
		flush: () => m.clear()
	}
}