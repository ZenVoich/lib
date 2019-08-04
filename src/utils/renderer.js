import {createScheduler} from './scheduler-factory.js'

export let {
	enqueue: enqueueRender,
	request: requestRender,
	afterNext: afterNextRender,
	waitForNext: waitForNextRender
} = createScheduler(requestAnimationFrame)