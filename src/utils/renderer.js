import {createScheduler} from './scheduler-factory.js'

export let {
	enqueue: enqueueRender,
	throttle: throttleRender,
	request: requestRender,
	afterNext: afterNextRender,
	waitForNext: waitForNextRender
} = createScheduler(requestAnimationFrame)