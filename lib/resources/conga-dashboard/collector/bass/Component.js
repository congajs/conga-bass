import Vue from 'vue';

import './bass.css';

export default Vue.extend({

    template: `

        <div id="bass-collector" v-if="d !== null">

            <div v-if="d.queries && d.queries.length !== 0">
                <div class="card" v-for="query in d.queries" :key="">
                    <header class="card-header">
                        <p class="card-header-title">
    
                            <span class="tag is-dark">{{ query.adapter }}</span>
    
                            &nbsp;&nbsp;{{ query.document }}.{{ query.name }}()
    
                        </p>
                        <a class="card-header-icon">
                            <span class="icon">
                                <i class="fa fa-angle-down"></i>
                            </span>
                        </a>
                    </header>
    
                    <div class="card-content">
                        <div class="content">
                            <pre><code class="json">{{ query.pretty }}</code></pre>
                        </div>
                    </div>
    
                    <footer class="card-footer">
                          <span class="card-footer-item">
                              {{ query.date | moment('YYYY-MM-DD H:mm:ss')}}
                          </span>
                          <span class="card-footer-item">
                              <span v-if="query.processTime !== undefined">
                                  Query Time <strong>{{ query.processTime / 1000 }} ms</strong>
                          </span>
                          </span>
                    </footer>
                </div>
            </div>
            
            <div v-else>No Queries</div>
                
        </div>

    `,

    props: ['d'],

    created: function() {

    },

    updated: function() {
        window.hljs.initHighlighting.called = false;
        window.hljs.initHighlighting();
    }

});
//                        <pre class="json" data-json="{{ query.data|json_encode|e('html_attr') }}">{{ query.pretty }}</pre>
// {{ query.date|date('g:i:sa') }} @
// <span class="milliseconds">{{ (query.date|date('u') / 1000)|round(3, 'floor') }}ms</span>
