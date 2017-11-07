const Controller = require('@conga/framework').Controller;

/**
 * @Route("/_conga/bass")
 */
module.exports = class CongaController extends Controller {

    /**
     * @Route("/managers", methods=['GET'])
     */
    managers(req, res) {

        const registry = this.container.get('bass').registry;

        const managers = [];
        const managerToMeta = {};

        // getting the metadata registry from the first manager definition
        const metadataRegistry = registry.managerDefinitions[
            Object.keys(registry.managerDefinitions)[0]
        ].metadataRegistry.metas;

        let document;
        for (document in metadataRegistry) {

            const meta = metadataRegistry[document];

            if (typeof managerToMeta[meta.managerName] === 'undefined') {
                managerToMeta[meta.managerName] = [];
            }

            meta.relativePath = meta.filePath.replace(this.container.getParameter('kernel.project_path'), '');

            managerToMeta[meta.managerName].push(meta);
        }

        let i;
        for (i in registry.managerDefinitions) {

            managers.push({
                name: registry.managerDefinitions[i].managerName,
                adapter: registry.managerDefinitions[i].adapter,
                document_paths: registry.managerDefinitions[i].documents,
                documents: managerToMeta[i]
            });
        }

        res.return({
            managers: managers,
        });
    }

}
