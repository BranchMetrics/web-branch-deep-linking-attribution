/**
 * This file initialzes the main branch instance, and re-runs any tasks that
 * were any tasks that were executed on the dummy branch object before real
 * branch was loaded.
 */

goog.provide('branch_instance');
goog.require('Branch');

branch_instance = new Branch();

if (window['branch'] && window['branch']['_q']) {
	var queue = window['branch']['_q'];
	for (var i = 0; i < queue.length; i++) {
		var task = queue[i];
		branch_instance[task[0]].apply(branch_instance, task[1]);
	}
}
