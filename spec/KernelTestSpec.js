// core libs
const path = require('path');
const request = require('request');

// framework libs
const Kernel = require('@conga/framework/lib/kernel/TestKernel');

process.on('unhandledRejection', (reason, p) => {
    console.log('unhandled rejection', reason);
});

// the test spec
describe("Kernel", () => {

    let kernel;

    beforeAll((done) => {

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            '@conga/framework-bass': path.join(__dirname, '..')
        });

        kernel.boot(() => {
            done();
        });

    });

    afterAll(done => {
        kernel.shutdown(() => done());
    });

    describe('implementation;', () => {

        let docId;

        it('should reference bass as a service-id from the container', done => {
            request({
                uri: 'http://localhost:5555/sid',
                method: 'GET'
            }, (error, response, body) => {
                expect(response.statusCode).toEqual(200);
                const json = JSON.parse(body);
                expect(json).toEqual(jasmine.objectContaining({hasBass:true}));
                done();
            });
        });

        it('should insert a document', done => {
            request({
                uri: 'http://localhost:5555/insert-document',
                method: 'GET'
            }, (error, response, body) => {
                expect(response.statusCode).toEqual(200);
                const json = JSON.parse(body);
                expect(json.id).toBeTruthy();
                expect(json.name).toEqual('Inserted');
                docId = json.id;
                done();
            });
        });

        it('should update a document', done => {
            request({
                uri: 'http://localhost:5555/update-document/' + encodeURIComponent(docId),
                method: 'GET'
            }, (error, response, body) => {
                expect(response.statusCode).toEqual(200);
                const json = JSON.parse(body);
                expect(json).toEqual(jasmine.objectContaining({
                    id: docId,
                    name: 'Updated'
                }));
                done();
            });
        });

    });

});