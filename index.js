module.exports = {

    AbstractFixture: require('./lib/fixture/AbstractFixture') ,
    
	Bass: {



		Module: require('bass') ,

		Query: require('./node_modules/bass/lib/query') ,

		QueryResult: require('./node_modules/bass/lib/query-result') ,

		Manager: {
			Definition: require('./node_modules/bass/lib/manager-definition') ,
			Factory: require('./node_modules/bass/lib/manager-factory') ,
			Manager: require('./node_modules/bass/lib/manager')
		} ,

		Registry: require('./node_modules/bass/lib/registry') ,

		DocumentCache: require('./node_modules/bass/lib/document-cache') ,

		Mapper: require('./node_modules/bass/lib/mapper') ,

		UnitOfWork: require('./node_modules/bass/lib/unit-of-work')
	}

};
