import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <h2>View Document</h2>

            <h3>{{ id }}</h3>

        </div>

    `,

    props: ['id'],

    data: function() {
        return {
            document: null
        }
    },

    created: function() {
        // this.$http.get('_conga/bass/managers').then((response) => {
        //     this.managers = response.body.managers;
        // }, (response) => {
        //
        // });
    }
});
