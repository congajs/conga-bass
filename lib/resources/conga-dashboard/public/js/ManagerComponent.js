import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are your database managers which represent a configured adapter, connection, and mapped models.
                </div>
            </article>

            <div v-for="manager in managers">
                <h5>{{ manager.name }} <span style="color: #b5b5b5">[ {{ manager.adapter.name }} ]</span></h5>

                <table class="table">
                    <thead>
                        <th>Name</th>
                        <th>Path</th>
                        <th><a href="#" class="button is-primary is-small is-pulled-right">&nbsp;<i class="fa fa-plus"></i> Add Document</a></th>
                    </thead>
                    <tbody>
                        <tr v-for="document in manager.documents">
                            <td>{{ document.name }}</td>
                            <td>{{ document.relativePath }}</td>
                            <td align="right">
                                <router-link
                                    class="button is-small is-pulled-right"
                                    :to="{ name: 'bass.document.view', params: {id: document.name} }"
                                >
                                    View
                                </router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <hr>
            </div>

        </div>

    `,

    data: function() {
        return {
            managers: []
        }
    },

    created: function() {
        this.$http.get('_conga/bass/managers').then((response) => {
            this.managers = response.body.managers;
        }, (response) => {

        });
    }
});
