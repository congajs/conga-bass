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
	 * @Route('/', methods=['GET'])
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

		var criteria = {};

		var wrappedPagination = this.wrappedPagination;
		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var model = this.model;

		var find = function(){

			manager.findBy(model, criteria, ['id'], skip, limit)
			.then(function(documents){

				if (wrappedPagination){

					var result = {};

					result[container.getParameter('rest.response.properties').RESULTS] =
							restManager.serialize(documents);

					result[container.getParameter('rest.response.properties').TOTAL_RESULTS] =
							0;

					res.return(result);

				} else {
					res.return(restManager.serialize(documents));
				}
			});
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
	 * @Route('/:id', methods=['GET'])
	 * 
	 * @param req
	 * @param response
	 */
	find: function(req, res){

		var restManager = this.container.get('rest.manager');

		this.container.get('bass').createSession().getManager(this.documentManager)
			.find(this.model, req.params.id)
			.then(function(document){
				res.return(restManager.serialize(document));
			});
	},
	
	/**
	 * @Route('/create', methods=['POST'])
	 * 
	 * @param req
	 * @param response
	 */
	create: function(req, res){

		var data = req.body;
		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		var document = manager.createDocument(this.model, data);

		manager.persist(document);

		manager.flush()
		.then(function(){
			res.return(restManager.serialize(document));
		});
	},
	
	/**
	 * @Route('/create/:id', methods=['POST'])
	 * @param req
	 * @param response
	 */
	createWithId: function(req, response){
		response({
			message: 'create: ' + req.params.id
		});
	},
	
	/**
	 * @Route('/update/:id', methods=['PUT'])
	 * 
	 * @param req
	 * @param response
	 */
	update: function(req, res){

		var restManager = this.container.get('rest.manager');
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);

		manager.find(this.model, req.params.id)

		.then(function(document){

			for(var prop in req.body){
				document[prop] = req.body[prop];
			}

			manager.persist(document);
			manager.flush()
			.then(function(){
				res.return(restManager.serialize(document));
			});
		});
	},
	
	/**
	 * @Route('/destroy/:id', methods=['DELETE'])
	 * 
	 * @param req
	 * @param response
	 */
	destroy: function(req, res){
		var manager = this.container.get('bass').createSession().getManager(this.documentManager);
		manager.find(this.model, req.params.id)

		.then(function(document){
			manager.remove(document);
			manager.flush()
			.then(function(){
				res.return({ success : true });
			});
		});
	}
};

module.exports = RestAdapter;