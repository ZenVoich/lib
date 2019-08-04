import {createScheduler} from './scheduler-factory.js'

export let {
	enqueue: enqueueMicrotask,
	request: requestMicrotask,
	afterNext: afterNextMicrotask,
	waitForNext: waitForNextMicrotask
} = createScheduler((fn) => Promise.resolve().then(fn))