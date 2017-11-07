import Vue from 'vue';

export default Vue.extend({

    template: `


        <div>

            <hero>

                <span slot="hero-title">Bass</span>
                <span slot="hero-subtitle">Manage your databases!</span>

                <div class="container" slot="hero-foot">

                    <tab-container>
                        <tab route="bass" label="Managers"></tab>
                        <tab route="bass.connections" label="Connections"></tab>
                        <tab route="bass.adapters" label="Adapters"></tab>
                        <tab route="bass.graph" label="Model Graph"></tab>
                    </tab-container>

                </div>

            </hero>

            <main-section>

                <div class="content">
                    <router-view></router-view>
                </div>

            </main-section>

        </div>

    `,

    data: function() {
        return {
            $route: this.$route
        }
    },

    created: function() {

    }
});
