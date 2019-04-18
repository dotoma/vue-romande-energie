var enumerateMomentsBetweenDates = function(startDate, endDate, by_int, by_unit) {
    var now = startDate.clone(), dates = [];

    while (now.isSameOrBefore(endDate)) {
        dates.push(now.format('YYYY-MM-DD HH:mm'));
        now.add(by_int, by_unit);
    }
    return dates;
};

new Vue({
  el:"#vue-app",
  data: {
    site:'103959',
    modulateurs:[],
    working: false,
    taux_couverture: 0,
    taux_autoproduction:0,
    duree_periode_en_jour: 1,
    periode_tracee: {date_debut: '', date_fin: ''}
  },
  methods:{
    chargeSite: function(){
      var app = this
      app.working = true;
      console.log("Chargement de la conf du site " + this.site)
      app.BDD_recupere_modulateurs_site(this.site, function(){
        app.periode_tracee.date_fin = moment().startOf('day')
        app.periode_tracee.date_debut = app.periode_tracee.date_fin.clone().subtract(app.duree_periode_en_jour, 'days')

        app.charge_graphique({site: this.site,
                              periode: app.periode_tracee}, function(){
                                app.working = false
                              })
      })
    },
    charge_graphique: function(parametres, cb){
      var app = this
      app.BDD_conso_site(parametres, function(data){
        app.trace_conso_site(data)
        let conso = data.conso.reduce((s, iter) => s+iter)
        let prod = data.prod.reduce((s, iter) => s+iter)
        app.taux_couverture = Math.floor(100 * prod / conso)
        let prod_consommee = data.conso.map(function(conso_at_index, index) {
                    return Math.min(data.prod[index], conso_at_index);
                  }).reduce((s, iter) => s+iter)
        app.taux_autoproduction = Math.floor(100 * prod_consommee / conso)
        cb()
      })

    },
    trace_periode_suivante: function(){
      var app = this
      app.working = true
      app.periode_tracee.date_debut = app.periode_tracee.date_fin
      app.periode_tracee.date_fin = app.periode_tracee.date_debut.clone().add(app.duree_periode_en_jour, 'days')
      app.charge_graphique({site: app.site,
                            periode: app.periode_tracee}, function(){
                              app.working = false
                            })
    },
    trace_periode_precedente: function(){
      var app = this
      app.working = true
      app.periode_tracee.date_fin = app.periode_tracee.date_debut
      app.periode_tracee.date_debut = app.periode_tracee.date_fin.clone().subtract(app.duree_periode_en_jour, 'days')
      app.charge_graphique({site: app.site,
                            periode: app.periode_tracee}, function(){
                              app.working = false
                            })
    },
    trace_conso_site: function(data){
      var ctx = document.getElementById('myChart').getContext('2d');
      if (window.myChart && window.myChart.destroy) window.myChart.destroy() // Bug du double affichage lorsque retraçage pour autre période
      window.myChart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: data.dates,
              datasets: [{
                  label: 'Conso (en kW)',
                  data: data.conso,
                }, {
                    label: 'Prod (en kW)',
                    data: data.prod,
                    backgroundColor: 'rgba(255,255,204, 1)',
                    borderColor: 'rgba(255,255,102, 1)'
                  }]
          },
          options: {
              maintainAspectRatio: false,
              scales: {
                  yAxes: [{
                      ticks: {
                          beginAtZero: true
                      }
                  }],
                  xAxes:[{
                    type: 'time',
                    time: {
                      displayFormats: {
                        minute: "h:mm"
                      }
                    }
                  }]
              },
              title: {
                display: true,
                text: 'Jour : ' + moment(data.dates[0]).format('YYYY-MM-DD')
              }
          }
      });
    },
    BDD_conso_site: function(data, cb){
      // Structure de data :  {site,
      //                       periode: {date_debut, date_fin}}
      setTimeout(function(){
        let dates = enumerateMomentsBetweenDates(data.periode.date_debut, data.periode.date_fin, by_int = 30, by_unit = 'minutes')
        let conso = [], prod = []
        for (let i = 1; i <= dates.length; i++){
          conso.push(Math.round(100 *(Math.random() * 10))/100)
          prod.push(Math.round(100 * (Math.random() * 3)) / 100)
        }
        cb({
          dates: dates,
          conso:conso,
          prod:prod})
      }, Math.floor(Math.random() * 2000) + 1)

    },
    BDD_recupere_modulateurs_site: function(site, cb){
      var app = this
      setTimeout(function(){
        app.modulateurs = [
          {id: app.genere_id(), voies:[{id:app.genere_id(), equipements: ['PV'], effacement_en_cours: false}]},
          {id: app.genere_id(), voies:[{id:app.genere_id(), equipements: ['ECS'], effacement_en_cours: false},
                              {id:app.genere_id(), equipements: ['Radiateur'], effacement_en_cours: false}]}]
        cb()
      }, Math.floor(Math.random() * 2000) + 1)
    },
    genere_id: function(){
      return Math.floor(Math.random() * 1000000) + 1
    },
    BDD_toggle_effacement_voie: function(id_modulateur, id_voie){
      var app = this
      setTimeout(function(){
        let m = app.modulateurs.find(m => { return m.id == id_modulateur })
        let v = m.voies.find(v => v.id == id_voie)
        v.effacement_en_cours = !v.effacement_en_cours
      }, Math.floor(Math.random() * 2000) + 1)
    },
  },
  computed:{
  }
});
