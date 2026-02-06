// suero.data.js
'use strict';

const DATA = {
  defaults: {
    // Valor inicial encontrado en el Excel
    pesoKg: 50,
  },

  formulas: {
    m2: "(4*peso + 7) / (peso + 90)",
    basales: "IF(peso<=10, peso*100, IF(peso<=20, (peso-10)*50 + 1000, (peso-20)*20 + 1500))",
    mas3:  "3*(peso*1000/100) + basales",
    mas5:  "5*(peso*1000/100) + basales",
    mas6:  "6*(peso*1000/100) + basales",
    mas10: "10*(peso*1000/100) + basales",
    basalesYMedia: "basales*1.5",
    mlh: "ccDia / 24"
  },

  composicion: {
    salinos: [
      { sol: "Salino 0,9%", glucosa: "-", na: 154, cl: 154, bic: "-", osmol: 308 },
      { sol: "Salino 0,45%", glucosa: "-", na: 77, cl: 77, bic: "-", osmol: "" },
      { sol: "Salino 3%", glucosa: "-", na: 513, cl: 513, bic: "-", osmol: 1026 },
      { sol: "Salino 20%", glucosa: "-", na: 3400, cl: 3400, bic: "-", osmol: "" }
    ],
    glucosalinos: [
      { sol: "GlucoSalino 1:1", glucosa: 50, na: 154, cl: 154, bic: "-", osmol: "" },
      { sol: "GlucoSalino 1/2", glucosa: 25, na: 77, cl: 77, bic: "-", osmol: 290 },
      { sol: "GlucoSalino 1/3", glucosa: 33, na: 51, cl: 51, bic: "-", osmol: 285 },
      { sol: "GlucoSalino 1/5", glucosa: 40, na: 30, cl: 30, bic: "-", osmol: 280 }
    ],
    otros: [
      { sol: "Glucosado 5%", glucosa: 50, na: "-", cl: "-", bic: "-", osmol: 275 },
      { sol: "Glucosado 10%", glucosa: 100, na: "-", cl: "-", bic: "-", osmol: "" },
      { sol: "Glucosmon R50", glucosa: "10gr/20ml", na: "-", cl: "-", bic: "-", osmol: "" },
      { sol: "Bicarbonato 1/6 M", glucosa: "-", na: 167, cl: "-", bic: 167, osmol: 334 },
      { sol: "Bicarbonato 1 M", glucosa: "-", na: 1000, cl: "-", bic: 1000, osmol: 2000 },
      { sol: "GlucoBicar. 1/2", glucosa: 25, na: 83, cl: "-", bic: 83, osmol: 303 },
      { sol: "GlucoBicar. 1/3", glucosa: 33, na: 56, cl: "-", bic: 56, osmol: 291 },
      { sol: "GlucoBicar. 1/5", glucosa: 40, na: 33, cl: "-", bic: 33, osmol: 286 },
      { sol: "Ringer Lactato", glucosa: "-", na: 130, cl: 109, bic: 28, osmol: 273 },
      { sol: "Albumina 20%", glucosa: "-", na: 120, cl: 120, bic: "-", osmol: "" },
      { sol: "Plasma fresco c.", glucosa: "-", na: 130, cl: 130, bic: "-", osmol: "" }
    ]
  },

  textos: {
    rehidratacionRapida: {
      items: [
        "Tipo de suero: Suero isotónico con glucosa al 2,5%.",
        "Preparación: SSF 0,9% 500 ml + GR50% 25 ml.",
        "Ritmo: 10–20 ml/kg (se puede volver a repetir si es preciso).",
        "Duración: 1–4 h según gravedad de la deshidratación y tolerancia oral."
      ]
    },
    deshidrataciones: [
      {
        titulo: "Hiponatrémica (Na < 130 mEq/L)",
        bullets: [
          "Suero isotónico con glucosa al 5% (suero glucosalino 1:1).",
          "Reposición del déficit en 24 horas: 1/2 en 8 h y la otra 1/2 en las 16 h siguientes."
        ]
      },
      {
        titulo: "Isonatrémica (Na 130–150 mEq/L)",
        bullets: [
          "Suero isotónico con glucosa al 5% (suero glucosalino 1:1).",
          "Reposición del déficit en 24–36 horas."
        ]
      },
      {
        titulo: "Hipernatrémica (Na > 150 mEq/L)",
        bullets: [
          "Suero salino 0,45% (450 cc) + Glucosmon R50 (50 cc).",
          "Reposición del déficit en 48–72 horas."
        ]
      }
    ]
  }
};



var SUERO_VIEWS = ['calculo','composicion','rehidratacion','deshidrataciones'];

var SUERO_CALC_MODES = [
  { id:'basales', label:'Basales' },
  { id:'basales-media', label:'Basales y media' },
  { id:'mas-3', label:'+3%' },
  { id:'mas-5', label:'+5%' },
  { id:'mas-6', label:'+6%' },
  { id:'mas-10', label:'+10%' },
];