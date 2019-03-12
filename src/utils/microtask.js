import {createScheduler} from './scheduler-factory.js'

export let {
	throttle: throttleMicrotask,
	request: requestMicrotask,
	afterNext: afterNextMicrotask,
	waitForNext: waitForNextMicrotask
} = createScheduler((fn) => Promise.resolve().then(fn))