import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <h2>Connections</h2>

        </div>

    `,

    data: function() {
        return {
            connectiosn: []
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
