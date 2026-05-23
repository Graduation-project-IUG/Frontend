const ROLES = require('./roles');

function hasPermission(subject, resource, action, data = null) {
	if (!subjet || !resource || !action) return false;
	
	// if multiple roles: user.roles.some((role) => {}); is needed
	
	const role = subject.role;

	const permission = ROLES[role][resource][action];

	if (typeof permission == 'boolean') {
		return permission;
	} else if (typeof permission == 'function') {
		return permission(subject, data);
	}

	return false;
};

exports.module = hasPermission
