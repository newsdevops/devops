// sheet.data.js
'use strict';


/**
 * sheet.data.js
 * ----------------
 * - Define ENTRADAS: lista de fármacos (sedantes/antídotos) con dosis por kg, concentración, límites, etc. * Fuente de datos “estática” de la app.
 * - Define filtros (estado de filtrado por fármaco) y constantes de color/orden (COLORS_*, ORDEN_*).
 * No contiene lógica de UI ni cálculo: solo datos y configuración.
 */


var ENTRADAS = [
    // SEDANTES
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IV', dosisPorKg:'1 mcg/kg',   conc:'50 mcg/ml', tiempo:'3-5 min', limites:{max:{valor:75, unidad:'mcg'}}, obs:'Se puede repetir cada 5 min la mitad de la dosis previa.'},
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IV', dosisPorKg:'1.5 mcg/kg', conc:'50 mcg/ml', tiempo:'—',       limites:{max:{valor:75, unidad:'mcg'}}, obs:'Evitar >0,5 ml por narina en la misma administración.'},
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IN', dosisPorKg:'2 mcg/kg',   conc:'50 mcg/ml', tiempo:'—',       limites:{max:{valor:75, unidad:'mcg'}}, obs:'Evitar >0,5 ml por narina en la misma administración.'},

    {categoria:'sedantes', farmaco:'MIDAZOLAM', via:'IV', dosisPorKg:'0.1 mg/kg', conc:'5 mg/ml',  tiempo:'2-3 min', limites:{max:{valor:6, unidad:'mg'}},   obs:'Se puede diluir en 5 ml de SSF para facilitar la administración.'},
    {categoria:'sedantes', farmaco:'MIDAZOLAM', via:'IN', dosisPorKg:'0.3 mg/kg', conc:'5 mg/ml',  tiempo:'—',       limites:{max:{valor:6, unidad:'mg'}},   obs:''},

    {categoria:'sedantes', farmaco:'KETAMINA',   via:'IV', dosisPorKg:'1 mg/kg',   conc:'50 mg/ml', tiempo:'2-3 min', limites:{max:{valor:50, unidad:'mg'}},  obs:'No recomendado < 3 meses. Ritmo máx 0,5 mg/kg/min. Repetir 0,5 mg/kg cada 15 min si precisa.'},
    {categoria:'sedantes', farmaco:'KETAMINA',   via:'IM', dosisPorKg:'2 mg/kg',   conc:'50 mg/ml', tiempo:'—',       limites:{max:{valor:50, unidad:'mg'}},  obs:''},

    {categoria:'sedantes', farmaco:'PROPOFOL',   via:'IV', dosisPorKg:'0.5 mg/kg', conc:'10 mg/ml', tiempo:'2-3 min', limites:null,                           obs:'Admon directa o diluida. Valorar perfusión: 1-4 mg/kg/h tras bolo.'},
    {categoria:'sedantes', farmaco:'PROPOFOL',   via:'IV', dosisPorKg:'1 mg/kg',   conc:'10 mg/ml', tiempo:'2-3 min', limites:null,                           obs:'Repetir 0,5 mg/kg cada 15 min si precisa.'},

    {categoria:'sedantes', farmaco:'ETOMIDATO',  via:'IV', dosisPorKg:'0.15 mg/kg', conc:'2 mg/ml', tiempo:'30-60 s', limites:{max:{valor:20, unidad:'mg'}},  obs:'Administrar IV directa. No tiene efecto analgésico.'},
    {categoria:'sedantes', farmaco:'ETOMIDATO',  via:'IV', dosisPorKg:'0.2 mg/kg',  conc:'2 mg/ml', tiempo:'30-60 s', limites:{max:{valor:20, unidad:'mg'}},  obs:''}, 
	{categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IV', dosisPorKg:'0.5 mcg/kg',
	conc:'100 mcg/ml', tiempo:'10 min', limites:{max:{valor:100, unidad:'mcg'}}, dosisMaxTxt:'1 mcg/kg/h (máx perfusión)',
	obs:'SIEMPRE administrar en bomba de infusión.'},

	{categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IV', dosisPorKg:'1 mcg/kg',
	conc:'100 mcg/ml', tiempo:'10 min', limites:{max:{valor:100, unidad:'mcg'}}, dosisMaxTxt:'1 mcg/kg/h (máx perfusión)',
	obs:'Tras infusión inicial continuar PC: 0,2-0,7 mcg/kg/h.'},

    {categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IN', dosisPorKg:'1-2.5 mcg/kg', conc:'100 mcg/ml', tiempo:'—', limites:{max:{valor:100, unidad:'mcg'}}, calcKg:1.5, obs:'EA: bradicardia, hipotensión, FA, HTA, síntomas digestivos.'},

    // ANTÍDOTOS

	{categoria:'antidotos', farmaco:'NALOXONA', via:'IV', dosisPorKg:'0.01 mg/kg', conc:'0.4 mg/ml', tiempo:'1 min', limites:{max:{valor:0.4, unidad:'mg'}}, enforceLimites:false, // ← NO clampa: sigue calculando aunque supere 0,4 mg 
	obs:'Repetir cada 2-3 min. Diluir hasta 1 ml de SSF. Máx acumulada 10 mg.'},
    {categoria:'antidotos', farmaco:'NALOXONA',   via:'IV', dosisPorKg:'0.1 mg/kg',  conc:'0.4 mg/ml', tiempo:'1 min',    limites:{max:{valor:2, unidad:'mg'}},   obs:''},
    {categoria:'antidotos', farmaco:'FLUMAZENILO',via:'IV', dosisPorKg:'0.01 mg/kg', conc:'0.1 mg/ml', tiempo:'30-60 s',  limites:{max:{valor:0.2, unidad:'mg'}}, obs:'Administrar cada minuto. Diluir hasta 1 ml de SSF. Máx acumulada 1 mg.'},
    {categoria:'antidotos', farmaco:'ATROPINA',   via:'IV', dosisPorKg:'0.02 mg/kg', conc:'1 mg/ml',   tiempo:'30-60 s',  limites:{min:{valor:0.1, unidad:'mg'}, max:{valor:0.2, unidad:'mg'}}, obs:'Administrar cada minuto. Diluir hasta 1 ml de SSF.'},
  ];

var filtros = {
	  sedantes: null,   // null = TODOS
	  antidotos: null
	};

var COLORS_SED = ['#14b8a6','#0ea5e9','#22c55e','#38bdf8','#3b82f6','#06b6d4'];

var COLORS_ANT = ['#f97316','#ef4444','#fb923c','#dc2626','#ea580c','#fca5a5'];

var ORDEN_SED = ['FENTANILO','MIDAZOLAM','KETAMINA','PROPOFOL','ETOMIDATO','DEXMEDETOMIDINA'];

var ORDEN_ANT = ['NALOXONA','FLUMAZENILO','ATROPINA'];
