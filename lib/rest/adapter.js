/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var RestAdapter = function(container, model, options){
	this.container = container;
	this.model = model;
	this.documentManager = options.documentManager;
	this.restModifyCriteriaMethods = [];
};

RestAdapter.prototype = {
	
	/**
	 * The model that this controller is tied to
	 * 
	 * @var {String}
	 */
	model: null,
	
	/**
	 * The document manager name to use for the current model
	 *
	 * @var {String
	 */
	documentManager: null,
	
	/**
	 * (GET /)
	 * 
	 * @param req
	 * @param response
	 */
	findAll: function(req, res){

		var container = this.container;

		var limit = req.query[this.container.getParameter('rest.parameters').LIMIT];

		if (typeof limit !== 'undefined'){
			limit = parseInt(limit);
		}

		var skip = req.query[this.container.getParameter('rest.parameters').SKIP];

		if (typeof skip !== 'undefined'){
			skip = parseInt(skip);
		}

		var sort = req.query[this.container.getParameter('rest.parameters').SORT];

		// sort = -id,createdAt,-name
		if (typeof sort !== 'undefined'){
			var splits = sort.split(',');
			sort = {};
			for (var i=0, j=splits.length; i<j; i++){
				if (splits[i][0] === '-'){
					sort[splits[i].replace(/-/, '')] = -1;
				} else {
					sort[splits[i]] = 1;
				}
			}
		}

		var wrappedPagination = this.wrappedPagination;
		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var model = this.model;


		var query = manager.createQuery();

		// add sorting and pagination
		if (typeof skip !== 'undefined') query.skip(skip);
		if (typeof limit !== 'undefined') query.limit(limit);
		if (typeof sort !== 'undefined') query.sort(sort);;

		var find = function(){

			try {
				manager.findByQuery(model, query)
				.then(function(documents){

					res.return(restManager.serialize(documents.data));

					// var wrappedPagination = false;

					// if (wrappedPagination){

					// 	manager.findCountByQuery(model, query).then(function(count){
					// 		var result = {};

					// 		result[container.getParameter('rest.response.properties').RESULTS] =
					// 				restManager.serialize(documents);

					// 		result[container.getParameter('rest.response.properties').TOTAL_RESULTS] =
					// 				count;

					// 		res.return(result);
					// 	}, function(err){
					// 		console.log(err);
					// 	});




					// } else {
					// 	console.log('here');
					// 	res.return(restManager.serialize(documents));
					// }
				},
				function(err){
					console.log(err.stack);
				});
			} catch (e){
				console.log(e.stack);
			}


		};

		if (this.restModifyCriteriaMethods.length === 0){
			find();

		} else {

			this.modifyCriteria(req, criteria, function(){
				find();
			});
		}
	},
	
	/**
	 * (GET /:id)
	 * 
	 * @param req
	 * @param response
	 */
	find: function(req, res){

		var restManager = this.container.get('rest.manager');

		this.container.get('bass').createSession().getManager(this.documentManager)

			.find(this.model, req.params.id).then(function(document){

				if (document == null){
					res.return({ success : false, message : 'Document doesn\'t exist'}, 400);
					return;
				}

				res.return(restManager.serialize(document));
			
			// handle error
			}, function(err){
				res.return({ success : false, message : err }, 500);
			});
	},
	
	/**
	 * (POST /)
	 * 
	 * @param req
	 * @param response
	 */
	create: function(req, res){

		var data = req.body;

		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var document = manager.createDocument(this.model, data);

		var errors = this.container.get('validator').validate(document);

		if (errors.length > 0){

			res.return({ success: false, errors : errors }, 400);

		} else {

			manager.persist(document);

			manager.flush()
			.then(function(){
				res.return(restManager.serialize(cleanResponse(document)));
			});			
		}
	},
	
	/**
	 * (PUT /:id)
	 * 
	 * @param req
	 * @param response
	 */
	update: function(req, res){

		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var validator = this.container.get('validator');

		manager.find(this.model, req.params.id).then(function(document){

			if (document == null){
				res.return({ success : false, message : 'Document doesn\'t exist'}, 400);
				return;
			}

			document = restManager.deserialize(document, req.body);

			// validate the final document
			var errors = validator.validate(document);

			// check if there were any validation errors
			if (errors.length > 0){

				// return an error
				res.return({ success: false, errors : errors }, 400);

			} else {

				// save the document
				manager.persist(document);

				manager.flush().then(function(){
					res.return(restManager.serialize(cleanResponse(document)));
				});			
			}

		}, function(err){
			req.return({ success : false, message : err }, 500)
		});
	},
	
	/**
	 * (DELETE /:id)
	 * 
	 * @param req
	 * @param response
	 */
	remove: function(req, res){
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		
		manager.find(this.model, req.params.id).then(function(document){

			if (document === null){

				res.return({ success : false });

			} else {
				manager.remove(document);
				manager.flush().then(function(){
					res.return({ success : true });
				});				
			}

		}, function(err){
			console.log(err);
		});
	}
};

/**
 * Remove internal bass properties from a document
 * 
 * @param  {Object} doc
 * @return {Object}
 */
function cleanResponse(doc){
	return doc;
}

module.exports = RestAdapter;