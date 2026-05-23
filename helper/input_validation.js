const prisma = require("../config/connection");

exports.isAuthorized = async (req, res, object) => {
	const rankings = {
		'User': 1, 
		'Admin': 2
	};

	if(!object) {
		res.status(404).json({message: "Not found"});	
		return false;
	}


	const user_id = object.userId;

	const user = await prisma.user.findUnique({
		where: {id: user_id},
		select: {
			role: {
				select: {
					id: true
					name: true
				}
			}
		}
	});


	if (req.session.user_id != user_id) {
		res.status(401).json({message: "Unauthorized"});	
		return false;
	}

	return true;
};
