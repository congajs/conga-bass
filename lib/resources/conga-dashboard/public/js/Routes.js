export default [

    {
        ///name: "bass",
        path: "/bass",
        component: require('./BassComponent').default,

        children: [
            {
                name: "bass",
                path: "",
                component: require('./ManagerComponent').default
            },
            {
                name: "bass.connections",
                path: "connections",
                component: require('./ConnectionComponent').default
            },
            {
                name: "bass.document.view",
                path: "document/:id",
                component: require('./ViewDocumentComponent').default,
                props: true
            }
        ]
    }

];
