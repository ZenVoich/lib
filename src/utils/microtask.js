import {createScheduler} from './scheduler-factory.js'

export let {
	enqueue: enqueueMicrotask,
	throttle: throttleMicrotask,
	request: requestMicrotask,
	afterNext: afterNextMicrotask,
	waitForNext: waitForNextMicrotask
} = createScheduler((fn) => Promise.resolve().then(fn))