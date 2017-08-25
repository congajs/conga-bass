const Controller = require('@conga/framework').Controller;

/**
 * @Route("/")
 */
module.exports = class DefaultController extends Controller {
    /**
     * @Route("/sid", name="test.sid", methods=["GET"])
     */
    index(req, res) {
        res.return({
            hasBass: this.container.has('bass') &&
                     this.container.get('bass').constructor.name === 'Bass'
        });
    }

    /**
     * @Route("/insert-document", methods=["GET"])
     */
    insertDocument(req, res) {
        const manager = this.container.get('bass').createSession().getManager('default');
        const document = manager.createDocument('TestDocument', {name: 'Inserted'});
        manager.persist(document);
        manager.flush(document).then(() => {
            res.return({
                id: document.id,
                name: document.name
            });
        });
    }

    /**
     * @Route("/update-document/:id", methods=["GET"])
     */
    updateDocument(req, res) {
        const manager = this.container.get('bass').createSession().getManager('default');
        manager.find('TestDocument', req.params.id).then(document => {
            if (!document) {
                res.return({});
                return;
            }
            document.name = 'Updated';
            manager.persist(document);
            manager.flush(document).then(() => {
                res.return({
                    id: document.id,
                    name: document.name
                });
            });
        });
    }
};
