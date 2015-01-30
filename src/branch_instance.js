goog.require('Branch');
goog.provide('branch_instance');

branch_instance = new Branch();

if (window['branch'] && window['branch']['_q']) {
	var queue = window['branch']['_q'];
	for (var i = 0; i < queue.length; i++) {
		var task = queue[i];
		branch_instance[task[0]].apply(branch_instance, task[1]);
	}
}
