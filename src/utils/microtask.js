import {createScheduler} from './scheduler-factory.js'

export let {
	debounce: debounceMicrotask,
	request: requestMicrotask,
	afterNext: afterNextMicrotask,
	waitForNext: waitForNextMicrotask
} = createScheduler((fn) => Promise.resolve().then(fn))